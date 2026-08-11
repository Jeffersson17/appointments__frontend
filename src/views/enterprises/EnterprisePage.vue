<script setup>
import { ref, computed, onMounted } from 'vue'
import { EnterpriseService } from '@/services/enterprise'
import EnterpriseForm from '@/components/EnterpriseForm.vue'
import api from '@/services/api'

onMounted(() => {
  fetchEnterprises()
})

const allItems = ref([])
const modalVisible = ref(false)
const modalMode = ref('create')
const editingId = ref(null)
const editingUserId = ref(null)
const formKey = ref(0)

const currentPage = ref(1)
const itemsPerPage = ref(5)

const createEmptyForm = () => ({
  company_name: '',
  owner_name: '',
  logo: null,
  email: '',
  password: '',
})

const enterpriseForm = ref(createEmptyForm())
const enterpriseFormRef = ref(null)
const saveError = ref('')
const isSaving = ref(false)

async function fetchEnterprises() {
  try {
    const response = await EnterpriseService.getAll()
    allItems.value = Array.isArray(response.data)
      ? response.data
      : (response.data?.results ?? [])
  } catch (error) {
    console.error('Error fetching enterprises:', error)
  }
}

async function deleteEnterprise(id) {
  try {
    await EnterpriseService.delete(id)
    fetchEnterprises()
  } catch (error) {
    console.error('Error deleting enterprise:', error)
  }
}

async function toggleEnterpriseActive(item) {
  try {
    const userId = item.user?.id
    if (!userId) {
      console.error('Enterprise has no linked user')
      return
    }
    await EnterpriseService.setActive(userId, !item.user.is_active)
    await fetchEnterprises()
  } catch (error) {
    console.error('Error toggling enterprise status:', error)
  }
}

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = null
  editingUserId.value = null
  saveError.value = ''
  enterpriseForm.value = createEmptyForm()
  formKey.value += 1
  modalVisible.value = true
}

function openEditModal(item) {
  modalMode.value = 'edit'
  editingId.value = item.id
  editingUserId.value = item.user?.id ?? null
  saveError.value = ''
  enterpriseForm.value = {
    company_name: item.company_name ?? '',
    owner_name: item.owner_name ?? '',
    logo: null,
    email: item.user?.email ?? '',
    password: '',
  }
  formKey.value += 1
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  enterpriseForm.value = createEmptyForm()
  editingId.value = null
  editingUserId.value = null
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
    if (status >= 500) return 'Erro interno no servidor. Verifique se o email ou nome da empresa já existem.'
    return 'Não foi possível salvar a empresa. Tente novamente.'
  }

  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  const fieldLabels = {
    company_name: 'Nome da empresa',
    owner_name: 'Proprietário',
    email: 'Email',
    password: 'Senha',
    logotipo: 'Logo',
  }

  const messages = Object.entries(data).flatMap(([field, value]) => {
    const text = Array.isArray(value) ? value.join(' ') : String(value)
    const label = fieldLabels[field] || field
    return `${label}: ${text}`
  })

  return messages.length
    ? messages.join(' ')
    : 'Não foi possível salvar a empresa. Tente novamente.'
}

async function saveEnterprise() {
  saveError.value = ''

  const formCmp = enterpriseFormRef.value
  if (!formCmp) {
    saveError.value = 'Formulário não carregado. Feche e abra o modal novamente.'
    return
  }

  if (!formCmp.validate()) {
    return
  }

  isSaving.value = true

  try {
    const hasLogo = Boolean(enterpriseForm.value.logo)
    let payload

    if (hasLogo) {
      payload = new FormData()
      payload.append('company_name', enterpriseForm.value.company_name)
      payload.append('owner_name', enterpriseForm.value.owner_name)
      payload.append('logotipo', enterpriseForm.value.logo)

      if (modalMode.value === 'create') {
        payload.append('email', enterpriseForm.value.email)
        payload.append('password', enterpriseForm.value.password)
      }
    } else if (modalMode.value === 'create') {
      payload = {
        company_name: enterpriseForm.value.company_name,
        owner_name: enterpriseForm.value.owner_name,
        email: enterpriseForm.value.email,
        password: enterpriseForm.value.password,
      }
    } else {
      payload = {
        company_name: enterpriseForm.value.company_name,
        owner_name: enterpriseForm.value.owner_name,
      }
    }

    if (modalMode.value === 'create') {
      await EnterpriseService.createEnterprise(payload)
    } else {
      await EnterpriseService.update(editingId.value, payload)

      if (editingUserId.value) {
        const userPayload = {
          email: enterpriseForm.value.email,
          name: enterpriseForm.value.owner_name,
        }

        if (enterpriseForm.value.password) {
          userPayload.password = enterpriseForm.value.password
        }

        await EnterpriseService.updateUser(editingUserId.value, userPayload)
      }
    }

    await fetchEnterprises()
    closeModal()
  } catch (error) {
    console.error(
      modalMode.value === 'create'
        ? 'Error creating enterprise:'
        : 'Error updating enterprise:',
      error,
    )
    saveError.value = getApiErrorMessage(error)
  } finally {
    isSaving.value = false
  }
}

const modalTitle = computed(() =>
  modalMode.value === 'create' ? 'Criar Empresa' : 'Atualizar Empresa',
)

const saveButtonLabel = computed(() =>
  modalMode.value === 'create' ? 'Criar' : 'Salvar',
)

const totalPages = computed(() => Math.ceil(allItems.value.length / itemsPerPage.value))

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
      item.company_name?.toLowerCase().includes(query) ||
      item.owner_name?.toLowerCase().includes(query),
  )
})

const getCompanyInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const getLogoUrl = (logotipo) => {
  if (!logotipo) return null

  const value = typeof logotipo === 'string' ? logotipo : logotipo?.url
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value

  const base = (api.defaults.baseURL || 'http://localhost:8000/').replace(/\/$/, '')
  return `${base}/${String(value).replace(/^\//, '')}`
}
</script>

<template>
  <CRow>
    <CCol class="mb-4">
      <CCard class="enterprise-card">
        <CCardHeader>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <strong class="mb-0">Listagem das Empresas</strong>

            <div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
              <div class="enterprise-search position-relative">
                <CIcon
                  icon="cil-magnifying-glass"
                  class="position-absolute top-50 start-0 translate-middle-y ms-3 text-medium-emphasis"
                />
                <CFormInput
                  v-model="search"
                  placeholder="Buscar empresa..."
                  class="ps-5"
                />
              </div>
              <CButton color="primary" class="text-nowrap" @click="openCreateModal">
                Criar Empresa
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CModal
          :visible="modalVisible"
          aria-labelledby="enterpriseModalLabel"
          @close="closeModal"
        >
          <CModalHeader>
            <CModalTitle id="enterpriseModalLabel">{{ modalTitle }}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CAlert v-if="saveError" color="danger" class="mb-3">
              {{ saveError }}
            </CAlert>
            <EnterpriseForm
              :key="formKey"
              ref="enterpriseFormRef"
              v-model="enterpriseForm"
              :mode="modalMode"
            />
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" :disabled="isSaving" @click="closeModal">
              Fechar
            </CButton>
            <CButton color="primary" :disabled="isSaving" @click="saveEnterprise">
              {{ isSaving ? 'Salvando...' : saveButtonLabel }}
            </CButton>
          </CModalFooter>
        </CModal>

        <CCardBody class="p-0">
          <CTable align="middle" class="mb-0 enterprise-table" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="bg-body-secondary">Empresa</CTableHeaderCell>
                <CTableHeaderCell class="bg-body-secondary">Proprietário</CTableHeaderCell>
                <CTableHeaderCell class="bg-body-secondary text-center">Status</CTableHeaderCell>
                <CTableHeaderCell class="bg-body-secondary text-end">Opções</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-if="paginatedItems.length === 0">
                <CTableDataCell colspan="4" class="text-center py-5">
                  <div class="text-body-secondary mb-2">
                    <CIcon icon="cil-magnifying-glass" size="xl" />
                  </div>
                  <strong>Nenhuma empresa encontrada</strong>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-for="item in paginatedItems" :key="item.id ?? item.company_name">
                <CTableDataCell>
                  <div class="d-flex align-items-center gap-3">
                    <div
                      class="enterprise-avatar"
                      :class="[
                        item.user?.is_active ? 'is-active' : 'is-inactive',
                        getLogoUrl(item.logotipo) ? 'has-logo' : '',
                      ]"
                    >
                      <img
                        v-if="getLogoUrl(item.logotipo)"
                        :src="getLogoUrl(item.logotipo)"
                        :alt="item.company_name"
                      />
                      <template v-else>
                        {{ getCompanyInitials(item.company_name) }}
                      </template>
                    </div>
                    <div>
                      <div class="fw-semibold">{{ item.company_name }}</div>
                      <div class="small text-body-secondary">
                        {{ item.user?.email || 'Sem email' }}
                      </div>
                    </div>
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <span class="text-body">{{ item.owner_name }}</span>
                </CTableDataCell>
                <CTableDataCell class="text-center">
                  <CBadge
                    class="enterprise-status-badge"
                    :color="item.user?.is_active ? 'success' : 'secondary'"
                  >
                    {{ item.user?.is_active ? 'Ativa' : 'Desativada' }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell class="text-end">
                  <CDropdown placement="bottom-end">
                    <CDropdownToggle class="enterprise-actions-btn py-0" :caret="false">
                      <CIcon icon="cil-options" />
                    </CDropdownToggle>
                    <CDropdownMenu>
                      <CDropdownItem @click="openEditModal(item)">
                        <CIcon icon="cil-pencil" class="me-2" /> Atualizar
                      </CDropdownItem>
                      <CDropdownItem @click="toggleEnterpriseActive(item)">
                        <CIcon
                          :icon="item.user?.is_active ? 'cil-ban' : 'cil-check-circle'"
                          class="me-2"
                        />
                        {{ item.user?.is_active ? 'Desativar' : 'Ativar' }}
                      </CDropdownItem>
                      <CDropdownDivider />
                      <CDropdownItem class="text-danger" @click="deleteEnterprise(item.id)">
                        <CIcon icon="cil-trash" class="me-2" /> Deletar
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
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
              <select class="form-select form-select-sm w-auto" @change="changeItemsPerPage">
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
.enterprise-search {
  width: min(100%, 260px);
}

.enterprise-table :deep(th),
.enterprise-table :deep(td) {
  padding: 0.9rem 1rem;
  vertical-align: middle;
}

.enterprise-avatar {
  width: 40px;
  height: 40px;
  border-radius: 0.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}

.enterprise-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.enterprise-avatar.is-active {
  background: var(--cui-primary);
}

.enterprise-avatar.is-inactive {
  background: var(--cui-secondary-color, #6c757d);
  opacity: 0.85;
}

.enterprise-avatar.has-logo {
  background: transparent;
  opacity: 1;
}

.enterprise-status-badge {
  min-width: 88px;
  padding: 0.4em 0.7em;
  font-weight: 600;
}

.enterprise-actions-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>

