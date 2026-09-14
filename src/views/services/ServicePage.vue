<script setup>
import { ref, computed, onMounted } from 'vue'
import { ServiceClient } from '@/services/service'

onMounted(async () => {
  getAllServices()
})

const allItems = ref([])
const modalVisible = ref(false)
const modalMode = ref('create')
const editingId = ref(null)
const formKey = ref(0)

const currentPage = ref(1)
const itemsPerPage = ref(5)

const createEmptyForm = () => ({
  name: '',
  description: '',
  price: '',
  durationHours: '',
  durationMinutes: '',
  durationSeconds: '',
  image: null,
  imagePreview: null,
})

const serviceForm = ref(createEmptyForm())
const saveError = ref('')
const isSaving = ref(false)
const fieldErrors = ref({
  name: false,
  description: false,
  price: false,
  image: false,
})
const successAlert = ref(null)
const showSuccessAlert = ref(false)

async function getAllServices() {
  try {
    const response = await ServiceClient.getAllServices()
    allItems.value = Array.isArray(response.data) ? response.data : (response.data?.results ?? [])
  } catch (error) {
    console.error('Erro ao buscar serviços:', error)
  }
}

async function deleteService(id) {
  try {
    await ServiceClient.deleteService(id)
    showSuccessMessage('Serviço deletado com sucesso!')
    getAllServices()
  } catch (error) {
    console.error('Erro ao excluir serviço:', error)
  }
}

function clearFieldErrors() {
  fieldErrors.value = {
    name: false,
    description: false,
    price: false,
    image: false,
  }
}

function handleDurationInput(field, value) {
  // Permitir apenas números
  let numValue = value.replace(/\D/g, '')

  // Limitar a 2 dígitos
  if (numValue.length > 2) {
    numValue = numValue.slice(0, 2)
  }

  if (field === 'hours') {
    serviceForm.value.durationHours = numValue
  } else if (field === 'minutes') {
    // Validar minutos: máx 59
    if (numValue.length === 2 && parseInt(numValue) > 59) {
      numValue = '59'
    }
    serviceForm.value.durationMinutes = numValue
  } else if (field === 'seconds') {
    // Validar segundos: máx 59
    if (numValue.length === 2 && parseInt(numValue) > 59) {
      numValue = '59'
    }
    serviceForm.value.durationSeconds = numValue
  }
}

function getDurationString() {
  const hours = (serviceForm.value.durationHours || '0').padStart(2, '0')
  const minutes = (serviceForm.value.durationMinutes || '0').padStart(2, '0')
  const seconds = (serviceForm.value.durationSeconds || '0').padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (file) {
    // Validar tipo de arquivo
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      saveError.value = 'Formato de imagem inválido. Use JPEG, PNG, GIF ou WebP.'
      return
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      saveError.value = 'Imagem muito grande. Tamanho máximo é 5MB.'
      return
    }
  }
}

function removeImage() {
  serviceForm.value.image = null
  serviceForm.value.imagePreview = null
}

function showSuccessMessage(message) {
  successAlert.value = message
  showSuccessAlert.value = true
  setTimeout(() => {
    showSuccessAlert.value = false
  }, 3000)
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  saveError.value = ''
  serviceForm.value = createEmptyForm()
  clearFieldErrors()
  formKey.value += 1
  modalVisible.value = true
}

function openEditModal(item) {
  modalMode.value = 'edit'
  editingId.value = item.id
  saveError.value = ''

  // Parsear duração do formato HH:MM:SS
  let hours = '00'
  let minutes = '00'
  let seconds = '00'

  if (item.duration) {
    const parts = item.duration.split(':')
    if (parts.length === 3) {
      hours = parts[0].padStart(2, '0')
      minutes = parts[1].padStart(2, '0')
      seconds = parts[2].padStart(2, '0')
    }
  }

  serviceForm.value = {
    name: item.service_name || '',
    description: item.description || '',
    price: item.price || '',
    durationHours: hours,
    durationMinutes: minutes,
    durationSeconds: seconds,
    image: null,
    imagePreview: item.image_service || null,
  }
  clearFieldErrors()
  formKey.value += 1
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  serviceForm.value = createEmptyForm()
  saveError.value = ''
}

function isHtmlResponse(value) {
  return typeof value === 'string' && /^\s*</.test(value)
}

function getApiErrorMessage(error) {
  const status = error?.response?.status
  const data = error?.response?.data

  if (!data || isHtmlResponse(data)) {
    if (status === 401) return 'Sessão expirada. Faça login novamente.'
    if (status === 403) return 'Você não tem permissão para esta ação.'
    if (status === 404) return 'Endpoint não encontrado.'
    if (status >= 500) return error.$event?.message || 'Erro interno do servidor. Tente novamente mais tarde.'
    return 'Não foi possível salvar o serviço. Tente novamente.'
  }

  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  const fieldLabels = {
    name: 'Nome',
    description: 'Descrição',
    price: 'Preço',
  }

  const messages = Object.entries(data).flatMap(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    const label = fieldLabels[field] || field
    return `${label}: ${text}`
  })

  return messages.length ? messages.join(' ') : 'Não foi possível salvar o serviço. Tente novamente.'
}

async function saveService() {
  saveError.value = ''
  clearFieldErrors()

  let hasErrors = false

  if (!serviceForm.value.name.trim()) {
    fieldErrors.value.name = true
    hasErrors = true
  }
  if (!serviceForm.value.price.trim()) {
    fieldErrors.value.price = true
    hasErrors = true
  }

  if (hasErrors) {
    saveError.value = 'Por favor, preencha todos os campos obrigatórios'
    return
  }

  const priceRegex = /^\d+(\.\d{1,2})?$/
  if (!priceRegex.test(serviceForm.value.price)) {
    fieldErrors.value.price = true
    saveError.value = 'Preço inválido. Use formato numérico (ex: 29.99)'
    return
  }

  isSaving.value = true

  try {
    const formData = new FormData()
    formData.append('service_name', serviceForm.value.name.trim())
    if (serviceForm.value.description.trim()) {
      formData.append('description', serviceForm.value.description.trim())
    }
    formData.append('price', parseFloat(serviceForm.value.price))
    formData.append('duration', getDurationString())

    // Adicionar imagem apenas se foi selecionada uma
    if (serviceForm.value.image) {
      formData.append('image_service', serviceForm.value.image)
    }

    if (modalMode.value === 'create') {
      await ServiceClient.createService(formData)
      showSuccessMessage('Serviço criado com sucesso!')
    } else {
      await ServiceClient.updateService(editingId.value, formData)
      showSuccessMessage('Serviço atualizado com sucesso!')
    }

    await getAllServices()
    closeModal()
  } catch (error) {
    console.error(
      modalMode.value === 'create' ? 'Erro ao criar serviço: ' : 'Erro ao atualizar serviço:',
      error,
    )
    saveError.value = getApiErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}

const search = ref('')

const filteredItems = computed(() => {
  if (!search.value) return allItems.value
  const query = search.value.toLowerCase()
  return allItems.value.filter(
    (item) =>
      item.service_name?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query),
  )
})

const modalTitle = computed(() =>
  modalMode.value === 'create' ? 'Novo Serviço' : 'Editar Serviço',
)

const saveButtonLabel = computed(() =>
  modalMode.value === 'create' ? 'Criar' : 'Salvar',
)

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredItems.value.slice(start, start + itemsPerPage.value)
})

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const changeItemsPerPage = (e) => {
  itemsPerPage.value = Number(e.target.value)
  currentPage.value = 1
}

const maxPagesToShow = 5

const startPage = computed(() => {
  return Math.floor((currentPage.value - 1) / maxPagesToShow) * maxPagesToShow + 1
})

const endPage = computed(() => {
  return Math.min(startPage.value + maxPagesToShow - 1, totalPages.value)
})

const pagesToShow = computed(() => {
  const pages = []
  for (let i = startPage.value; i <= endPage.value; i++) {
    pages.push(i)
  }
  return pages
})

const formatPrice = (price) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price)
}
</script>

<template>
  <CRow>
    <CCol class="mb-4">
      <Transition name="fade">
        <CAlert
          v-if="showSuccessAlert"
          color="success"
          class="mb-4 alert-fixed-top"
          dismissible
        >
          {{ successAlert }}
        </CAlert>
      </Transition>

      <CCard class="service-card">
        <CCardHeader>
          <div class="d-md-none d-flex flex-column gap-2">
            <strong>Listagem de Serviços</strong>
            <div class="d-flex flex-column gap-2">
              <div class="service-search position-relative">
                <CIcon
                  icon="cil-magnifying-glass"
                  class="position-absolute top-50 start-0 translate-middle-y ms-3 text-medium-emphasis"
                />
                <CFormInput
                  v-model="search"
                  type="text"
                  placeholder="Buscar serviço..."
                  class="ps-5"
                />
              </div>
              <CButton color="primary" @click="openCreateModal" class="text-nowrap">
                Adicionar Serviço
              </CButton>
            </div>
          </div>

          <div class="d-none d-md-block">
            <strong class="d-block mb-3">Listagem de Serviços</strong>
            <div class="service-toolbar">
              <div class="service-search position-relative">
                <CIcon
                  icon="cil-magnifying-glass"
                  class="position-absolute top-50 start-0 translate-middle-y ms-3 text-medium-emphasis"
                />
                <CFormInput
                  v-model="search"
                  type="text"
                  placeholder="Buscar serviço..."
                  class="ps-5"
                />
              </div>
              <CButton color="primary" @click="openCreateModal" class="text-nowrap">
                Adicionar Serviço
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CModal
          :visible="modalVisible"
          size="lg"
          backdrop="static"
          id="serviceModal"
          aria-labelledby="serviceModalLabel"
          @close="closeModal"
        >
          <CModalHeader>
            <CModalTitle id="serviceModalLabel">{{ modalTitle }}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CAlert v-if="saveError" color="danger" class="mb-3">
              {{ saveError }}
            </CAlert>

            <div class="alert alert-info mb-4" role="alert">
              <small>
                <strong>*</strong> indica que o campo é obrigatório
              </small>
            </div>

            <!-- Nome -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Nome
                <span class="text-danger">*</span>
              </label>
              <CFormInput
                v-model="serviceForm.name"
                type="text"
                placeholder="Digite o nome do serviço"
                :disabled="isSaving"
                :class="{ 'is-invalid': fieldErrors.name }"
              />
            </div>

            <!-- Descrição -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Descrição
                <span class="text-muted">(opcional)</span>
              </label>
              <CFormTextarea
                v-model="serviceForm.description"
                placeholder="Digite a descrição do serviço"
                :disabled="isSaving"
                rows="4"
                :class="{ 'is-invalid': fieldErrors.description }"
              />
            </div>

            <!-- Preço -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Preço
                <span class="text-danger">*</span>
              </label>
              <CFormInput
                v-model="serviceForm.price"
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                :disabled="isSaving"
                :class="{ 'is-invalid': fieldErrors.price }"
              />
              <small class="text-body-secondary">Use formato numérico (ex: 29.99)</small>
            </div>

            <!-- Duração -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Duração do Corte
                <span class="text-danger">*</span>
              </label>
              <div class="d-flex gap-2 align-items-end">
                <div class="flex-grow-1">
                  <small class="text-body-secondary d-block mb-2">Horas</small>
                  <CFormInput
                    :value="serviceForm.durationHours"
                    @input="(e) => handleDurationInput('hours', e.target.value)"
                    type="text"
                    placeholder="00"
                    maxlength="2"
                    :disabled="isSaving"
                    class="text-center"
                  />
                </div>
                <div class="fs-5 fw-bold">:</div>
                <div class="flex-grow-1">
                  <small class="text-body-secondary d-block mb-2">Minutos</small>
                  <CFormInput
                    :value="serviceForm.durationMinutes"
                    @input="(e) => handleDurationInput('minutes', e.target.value)"
                    type="text"
                    placeholder="00"
                    maxlength="2"
                    :disabled="isSaving"
                    class="text-center"
                  />
                </div>
                <div class="fs-5 fw-bold">:</div>
                <div class="flex-grow-1">
                  <small class="text-body-secondary d-block mb-2">Segundos</small>
                  <CFormInput
                    :value="serviceForm.durationSeconds"
                    @input="(e) => handleDurationInput('seconds', e.target.value)"
                    type="text"
                    placeholder="00"
                    maxlength="2"
                    :disabled="isSaving"
                    class="text-center"
                  />
                </div>
              </div>
              <small class="text-body-secondary d-block mt-2">
                Formato: HH:MM:SS (ex: 00:30:45)
              </small>
            </div>

            <!-- Imagem -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Imagem
                <span class="text-muted">(opcional)</span>
              </label>
              <!-- Input da imagem -->
              <div class="mb-2">
                <CFormInput
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  :disabled="isSaving"
                  :class="{ 'is-invalid': fieldErrors.image }"
                />
              </div>

              <small class="text-body-secondary d-block">
                Formatos suportados: JPEG, PNG, GIF, WebP. Tamanho máximo: 5MB
              </small>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" :disabled="isSaving" @click="closeModal">
              Fechar
            </CButton>
            <CButton color="primary" :disabled="isSaving" @click="saveService">
              {{ isSaving ? 'Salvando...' : saveButtonLabel }}
            </CButton>
          </CModalFooter>
        </CModal>

        <CCardBody class="p-0">
          <div class="d-none d-md-block table-responsive service-table-wrap">
            <CTable align="middle" class="mb-0 service-table" hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell class="bg-body-secondary">Nome</CTableHeaderCell>
                  <CTableHeaderCell class="bg-body-secondary">Corte</CTableHeaderCell>
                  <CTableHeaderCell class="bg-body-secondary">Preço</CTableHeaderCell>
                  <CTableHeaderCell class="bg-body-secondary text-center" style="width: 80px;">Ações</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow v-if="paginatedItems.length === 0">
                  <CTableDataCell colspan="4" class="text-center py-4">
                    <span class="text-body-secondary">Nenhum serviço encontrado</span>
                  </CTableDataCell>
                </CTableRow>

                <CTableRow v-for="item in paginatedItems" :key="item.id">
                  <CTableDataCell>
                    <div class="fw-semibold">{{ item.service_name }}</div>
                  </CTableDataCell>
                  <CTableDataCell>
                    <img
                      v-if="item.image_service"
                      :src="item.image_service"
                      :alt="item.service_name || 'Imagem do serviço'"
                      class="rounded service-thumb"
                    />
                    <span v-else class="text-body-secondary">Sem imagem</span>
                  </CTableDataCell>
                  <CTableDataCell>
                    <span class="badge bg-success">{{ formatPrice(item.price) }}</span>
                  </CTableDataCell>
                  <CTableDataCell class="text-center">
                    <CDropdown placement="bottom-end">
                      <CDropdownToggle
                        color="secondary"
                        variant="outline"
                        size="sm"
                        :caret="false"
                        aria-label="Ações do serviço"
                      >
                        <CIcon icon="cil-options" />
                      </CDropdownToggle>
                      <CDropdownMenu>
                        <CDropdownItem @click="openEditModal(item)">
                          <CIcon icon="cil-pencil" class="me-2" />
                          Atualizar
                        </CDropdownItem>
                        <CDropdownDivider />
                        <CDropdownItem class="text-danger" @click="deleteService(item.id)">
                          <CIcon icon="cil-trash" class="me-2" />
                          Deletar
                        </CDropdownItem>
                      </CDropdownMenu>
                    </CDropdown>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </div>

          <div class="d-md-none service-list">
            <div v-if="paginatedItems.length === 0" class="text-center py-4 px-3">
              <span class="text-body-secondary">Nenhum serviço encontrado</span>
            </div>

            <div
              v-for="item in paginatedItems"
              :key="item.id"
              class="service-list-item"
            >
              <img
                v-if="item.image_service"
                :src="item.image_service"
                :alt="item.service_name || 'Imagem do serviço'"
                class="rounded service-thumb service-thumb-lg"
              />
              <div v-else class="service-thumb-placeholder rounded" aria-hidden="true">
                {{ item.service_name?.charAt(0)?.toUpperCase() || '?' }}
              </div>

              <div class="service-list-info min-w-0">
                <div class="fw-semibold text-truncate">{{ item.service_name }}</div>
                <div class="d-flex flex-wrap align-items-center gap-2 mt-1">
                  <span class="badge bg-success">{{ formatPrice(item.price) }}</span>
                  <small v-if="item.duration" class="text-body-secondary">
                    {{ item.duration }}
                  </small>
                </div>
              </div>

              <CDropdown placement="bottom-end">
                <CDropdownToggle
                  color="secondary"
                  variant="outline"
                  :caret="false"
                  class="service-actions-btn"
                  aria-label="Ações do serviço"
                >
                  <CIcon icon="cil-options" />
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem @click="openEditModal(item)">
                    <CIcon icon="cil-pencil" class="me-2" />
                    Atualizar
                  </CDropdownItem>
                  <CDropdownDivider />
                  <CDropdownItem class="text-danger" @click="deleteService(item.id)">
                    <CIcon icon="cil-trash" class="me-2" />
                    Deletar
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </div>
          </div>
        </CCardBody>

        <CCardFooter>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <CPagination class="mb-0">
              <CPaginationItem :disabled="currentPage === 1" @click="changePage(1)">
                «
              </CPaginationItem>

              <CPaginationItem :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
                ‹
              </CPaginationItem>

              <CPaginationItem
                v-for="page in pagesToShow"
                :key="page"
                :active="page === currentPage"
                @click="changePage(page)"
              >
                {{ page }}
              </CPaginationItem>

              <CPaginationItem
                :disabled="currentPage === totalPages || totalPages === 0"
                @click="changePage(currentPage + 1)"
              >
                ›
              </CPaginationItem>

              <CPaginationItem
                :disabled="currentPage === totalPages || totalPages === 0"
                @click="changePage(totalPages)"
              >
                »
              </CPaginationItem>
            </CPagination>

            <div class="d-flex align-items-center gap-2 text-body-secondary">
              <span class="small text-nowrap">Itens por página</span>
              <select v-model.number="itemsPerPage" class="form-select form-select-sm w-auto pe-4">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </div>
          </div>
        </CCardFooter>
      </CCard>
    </CCol>
  </CRow>
</template>

<style scoped>
.service-search {
  width: 100%;
}

.service-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.service-toolbar .service-search {
  max-width: 360px;
}

.service-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.service-table {
  font-size: 0.9rem;
  min-width: 520px;
}

.service-table :deep(th),
.service-table :deep(td) {
  padding: 0.7rem 0.8rem;
  vertical-align: middle;
}

.service-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
}

.service-thumb-lg {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.service-thumb-placeholder {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cui-tertiary-bg);
  color: var(--cui-secondary-color);
  font-weight: 600;
}

.service-list-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--cui-border-color);
}

.service-list-item:last-child {
  border-bottom: 0;
}

.service-list-info {
  flex: 1;
}

.service-actions-btn {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.service-card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.service-card :deep(.card-header) {
  padding: 1rem;
}

@media (max-width: 768px) {
  .service-card :deep(.card-header) {
    padding: 0.75rem;
  }
}

.form-select-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

/* Estilos para validação de campos */
:deep(.is-invalid) {
  border-color: #dc3545 !important;
  border-width: 2px !important;
}

:deep(.is-invalid):focus {
  border-color: #dc3545 !important;
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25) !important;
}

/* Estilo para o aviso de campos obrigatórios */
.alert-info {
  background-color: #d1ecf1;
  border-color: #bee5eb;
  color: #0c5460;
  font-size: 0.9rem;
}

/* Estilo para alert fixo no topo */
.alert-fixed-top {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 320px;
  max-width: calc(100% - 40px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 576px) {
  .alert-fixed-top {
    min-width: auto;
    width: calc(100% - 20px);
    top: 10px;
    font-size: 0.9rem;
  }
}

/* Transição para o alert */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ajuste para pagination e select em mobile */
@media (max-width: 768px) {
  :deep(.card-footer) {
    padding: 0.75rem;
  }

  :deep(.form-select) {
    max-width: 70px;
  }
}
</style>
