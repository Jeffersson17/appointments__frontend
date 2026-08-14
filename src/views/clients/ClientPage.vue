<script setup>
import { ref, computed, onMounted } from 'vue'
import { ClientService } from '@/services/client'
import { EnterpriseService } from '@/services/enterprise'

onMounted(() => {
  fetchEnterprises()
  fetchClients()
})

const allItems = ref([])
const enterprises = ref([])
const modalVisible = ref(false)
const modalMode = ref('create')
const editingId = ref(null)
const formKey = ref(0)

const currentPage = ref(1)
const itemsPerPage = ref(5)

const createEmptyForm = () => ({
  first_name: '',
  last_name: '',
  phone_number: '',
  email: '',
  password: '',
  enterprise: '',
})

const clientForm = ref(createEmptyForm())
const clientFormRef = ref(null)
const saveError = ref('')
const isSaving = ref(false)
const fieldErrors = ref({
  first_name: false,
  last_name: false,
  phone_number: false,
  email: false,
  password: false,
  enterprise: false,
})
const successAlert = ref(null)
const showSuccessAlert = ref(false)

async function fetchEnterprises() {
  try {
    const response = await EnterpriseService.getAll()
    enterprises.value = Array.isArray(response.data)
      ? response.data
      : (response.data?.results ?? [])
  } catch (error) {
    console.error('Erro ao buscar empresas:', error)
  }
}

async function fetchClients() {
  try {
    const response = await ClientService.getAll()
    allItems.value = Array.isArray(response.data)
      ? response.data
      : (response.data?.results ?? [])
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
  }
}

async function deleteClient(id) {
  try {
    await ClientService.delete(id)
    showSuccessMessage('Cliente deletado com sucesso!')
    fetchClients()
  } catch (error) {
    console.error('Erro ao excluir cliente:', error)
  }
}

function clearFieldErrors() {
  fieldErrors.value = {
    first_name: false,
    last_name: false,
    phone_number: false,
    email: false,
    password: false,
    enterprise: false,
  }
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
  clientForm.value = createEmptyForm()
  clearFieldErrors()
  formKey.value += 1
  modalVisible.value = true
}

function openEditModal(item) {
  console.log(item)
  modalMode.value = 'edit'
  editingId.value = item.id
  saveError.value = ''
  clientForm.value = {
    first_name: item.first_name || '',
    last_name: item.last_name || '',
    phone_number: formatPhoneDisplay(item.phone_number) || '',
    email: item.user.email || '',
    password: '',
    enterprise: item.enterprise || '',
  }
  clearFieldErrors()
  formKey.value += 1
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  clientForm.value = createEmptyForm()
  saveError.value = ''
}

function formatPhoneDisplay(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`
  }
  return phone
}

function formatPhoneAPI(phone) {
  return phone.replace(/\D/g, '')
}

function handlePhoneInput(event) {
  let value = event.target.value.replace(/\D/g, '')
  if (value.length > 11) {
    value = value.slice(0, 11)
  }
  clientForm.value.phone_number = formatPhoneDisplay(value)
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
    return 'Não foi possível salvar o cliente. Tente novamente.'
  }

  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  const fieldLabels = {
    name: 'Nome',
    phone: 'Telefone',
    email: 'Email',
    password: 'Senha',
    enterprise: 'Empresa',
  }

  const messages = Object.entries(data).flatMap(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    const label = fieldLabels[field] || field
    return `${label}: ${text}`
  })

  return messages.length
    ? messages.join(' ')
    : 'Não foi possível salvar o cliente. Tente novamente.'
}

async function saveClient() {
  saveError.value = ''
  clearFieldErrors()

  let hasErrors = false

  if (!clientForm.value.first_name.trim()) {
    fieldErrors.value.first_name = true
    hasErrors = true
  }
  if (!clientForm.value.last_name.trim()) {
    fieldErrors.value.last_name = true
    hasErrors = true
  }
  if (!clientForm.value.phone_number.trim()) {
    fieldErrors.value.phone_number = true
    hasErrors = true
  }
  if (!clientForm.value.email.trim()) {
    fieldErrors.value.email = true
    hasErrors = true
  }

  // Validação de senha: obrigatória apenas na criação
  if (modalMode.value === 'create' && !clientForm.value.password.trim()) {
    fieldErrors.value.password = true
    hasErrors = true
  }

  if (!clientForm.value.enterprise) {
    fieldErrors.value.enterprise = true
    hasErrors = true
  }

  if (hasErrors) {
    saveError.value = 'Por favor, preencha todos os campos obrigatórios'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(clientForm.value.email)) {
    fieldErrors.value.email = true
    saveError.value = 'Email inválido'
    return
  }

  isSaving.value = true

  try {
    const payload = {
      first_name: clientForm.value.first_name.trim(),
      last_name: clientForm.value.last_name.trim(),
      phone_number: formatPhoneAPI(clientForm.value.phone_number),
      email: clientForm.value.email.trim(),
      enterprise: clientForm.value.enterprise,
    }

    // Adiciona a senha apenas se ela foi preenchida
    if (clientForm.value.password.trim()) {
      payload.password = clientForm.value.password
    }

    if (modalMode.value === 'create') {
      await ClientService.create(payload)
      showSuccessMessage('Cliente criado com sucesso!')
    } else {
      await ClientService.update(editingId.value, payload)
      showSuccessMessage('Cliente atualizado com sucesso!')
    }

    await fetchClients()
    closeModal()
  } catch (error) {
    console.error(
      modalMode.value === 'create'
        ? 'Erro ao criar cliente: '
        : 'Erro ao atualizar cliente:',
      error,
    )
    saveError.value = getApiErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}
// Propriedade para o titulo do modal, dependendo do modo (criação ou edição)
const modalTitle = computed(() =>
  modalMode.value === 'create' ? 'Novo Cliente' : 'Editar Cliente',
)
// Propriedade para o label do botão de salvar, dependendo do modo (criação ou edição)
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

const search = ref('')

const filteredItems = computed(() => {
  if (!search.value) return allItems.value
  const query = search.value.toLowerCase()
  return allItems.value.filter(
    (item) =>
      item.first_name?.toLowerCase().includes(query) ||
      item.last_name?.toLowerCase().includes(query) ||
      item.phone_number?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query),
  )
})

const getEnterpriseName = (enterpriseId) => {
  const enterprise = enterprises.value.find(e => e.id === enterpriseId)
  return enterprise?.company_name || '-'
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

      <CCard class="client-card">
        <CCardHeader>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <strong class="mb-0">Listagem de Clientes</strong>

            <div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
              <div class="client-search position-relative">
                <CIcon
                  icon="cil-magnifying-glass"
                  class="position-absolute top-50 start-0 translate-middle-y ms-3 text-medium-emphasis"
                />
                <CFormInput
                  v-model="search"
                  type="text"
                  placeholder="Buscar cliente..."
                  class="ps-5"
                />
              </div>

              <CButton color="primary" @click="openCreateModal" class="text-nowrap">
                Novo Cliente
              </CButton>
            </div>
          </div>
        </CCardHeader>
        <!-- Modal de Edição/Criação de Cliente -->
        <CModal
          :visible="modalVisible"
          size="lg"
          backdrop="static"
          id="clientModal"
          aria-labelledby="clientModalLabel"
          @close="closeModal"
        >
          <CModalHeader>
            <CModalTitle id="clientModalLabel">{{ modalTitle }}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <!-- Alertas de erro -->
            <CAlert v-if="saveError" color="danger" class="mb-3">
              {{ saveError }}
            </CAlert>
            <!-- Aviso sobre os campos obrigatórios -->
            <div class="alert alert-info mb-3" role="alert">
              <small>
                <strong>*</strong> indica que o campo é obrigatório
              </small>
            </div>
            <!-- Campo Nome -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Nome
                <span class="text-danger">*</span>
              </label>
              <CFormInput
                v-model="clientForm.first_name"
                type="text"
                placeholder="Digite o primeiro nome"
                :disabled="isSaving"
                :class="{ 'is-invalid': fieldErrors.first_name }"
              />
            </div>
            <!-- Campo Sobrenome -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Sobrenome
                <span class="text-danger">*</span>
              </label>
              <CFormInput
                v-model="clientForm.last_name"
                type="text"
                placeholder="Digite o sobrenome"
                :disabled="isSaving"
                :class="{ 'is-invalid': fieldErrors.last_name }"
              />
            </div>
            <!-- Campo Telefone -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Telefone
                <span class="text-danger">*</span>
              </label>
              <CFormInput
                :value="clientForm.phone_number"
                @input="handlePhoneInput"
                type="text"
                placeholder="(XX) XXXXX-XXXX"
                maxlength="15"
                :disabled="isSaving"
                :class="{ 'is-invalid': fieldErrors.phone_number }"
              />
            </div>
            <!-- Campo Email -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Email
                <span class="text-danger">*</span>
              </label>
              <CFormInput
                v-model="clientForm.email"
                type="email"
                placeholder="seu@email.com"
                :disabled="isSaving"
                :class="{ 'is-invalid': fieldErrors.email }"
              />
            </div>
            <!-- Campo Senha -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Senha
                <span v-if="modalMode === 'create'" class="text-danger">*</span>
                <span v-else class="text-muted">(opcional)</span>
              </label>
              <CFormInput
                v-model="clientForm.password"
                type="password"
                :placeholder="modalMode === 'create' ? 'Digite a senha' : 'Deixe em branco para manter a senha atual'"
                :disabled="isSaving"
                :class="{ 'is-invalid': fieldErrors.password }"
              />
              <small v-if="modalMode === 'edit'" class="text-body-secondary">
                Se não preencher, a senha atual será mantida.
              </small>
            </div>

            <!-- Campo Empresa -->
            <div class="mb-3">
              <label class="form-label fw-semibold">
                Empresa
                <span class="text-danger">*</span>
              </label>
              <CFormSelect
                v-model="clientForm.enterprise"
                :options="[
                  { label: 'Selecione uma empresa', value: '' },
                  ...enterprises.map(e => ({ label: e.company_name, value: e.id }))
                ]"
                :disabled="isSaving || enterprises.length === 0"
                :class="{ 'is-invalid': fieldErrors.enterprise }"
              />
              <small v-if="enterprises.length === 0" class="text-danger">
                Nenhuma empresa disponível. Crie uma empresa antes de criar um cliente.
              </small>
            </div>
          </CModalBody>
          <!-- Rodapé do modal -->
          <CModalFooter>
            <CButton color="danger" variant="outline" :disabled="isSaving" @click="closeModal">
              Fechar
            </CButton>
            <CButton color="primary" :disabled="isSaving" @click="saveClient">
              {{ isSaving ? 'Salvando...' : saveButtonLabel }}
            </CButton>
          </CModalFooter>
        </CModal>
        <!-- Tabela de clientes -->
        <CCardBody class="p-0 table-responsive">
          <CTable align="middle" class="mb-0 client-table" hover>
            <!-- Cabeçalho da tabela -->
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="bg-body-secondary">Nome</CTableHeaderCell>
                <CTableHeaderCell class="bg-body-secondary">Telefone</CTableHeaderCell>
                <CTableHeaderCell class="bg-body-secondary">Empresa</CTableHeaderCell>
                <CTableHeaderCell class="bg-body-secondary text-center" style="width: 80px;">Ações</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <!-- Conteúdo da tabela -->
            <CTableBody>
              <CTableRow v-if="paginatedItems.length === 0">
                <CTableDataCell colspan="4" class="text-center py-4">
                  <span class="text-body-secondary">Nenhum cliente encontrado</span>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-for="item in paginatedItems" :key="item.id ?? item.first_name">
                <CTableDataCell>
                  <div class="fw-semibold">{{ item.first_name }} {{ item.last_name }}</div>
                  <small class="text-body-secondary" v-if="!item.first_name && !item.last_name">
                    Sem nome
                  </small>
                </CTableDataCell>
                <CTableDataCell>
                  <span v-if="item.phone_number" class="text-body">{{ formatPhoneDisplay(item.phone_number) }}</span>
                  <span v-else class="text-danger fw-semibold">Faltando</span>
                </CTableDataCell>
                <CTableDataCell>
                  <span v-if="getEnterpriseName(item.enterprise)" class="badge bg-info">
                    {{ getEnterpriseName(item.enterprise) }}
                  </span>
                  <span v-else class="text-danger fw-semibold">Faltando</span>
                </CTableDataCell>
                <CTableDataCell class="text-center">
                  <CDropdown placement="bottom-end">
                    <CDropdownToggle color="secondary" variant="outline" size="sm" :caret="false">
                      <CIcon icon="cil-options" />
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem @click="openEditModal(item)">
                        <CIcon icon="cil-pencil" class="me-2" />
                        Atualizar
                      </CDropdownItem>
                      <CDropdownDivider />
                      <CDropdownItem class="text-danger" @click="deleteClient(item.id)">
                        <CIcon icon="cil-trash" class="me-2" />
                        Deletar
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
        <!-- Paginação da tabela -->
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
.client-search {
  width: min(100%, 260px);
}

.client-table :deep(th),
.client-table :deep(td) {
  padding: 0.9rem 1rem;
  vertical-align: middle;
}

.client-table {
  font-size: 0.95rem;
}

.client-card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  overflow: visible;
}

.client-card :deep(.card-body) {
  overflow: visible;
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
}

/* Estilo para alert fixo no topo */
.alert-fixed-top {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
</style>