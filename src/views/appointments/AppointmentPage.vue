<script setup>
import { ref, computed, onMounted } from 'vue'
import { AppointmentService } from '@/services/appointments'

const allItems = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(5)
const search = ref('')

const isAdmin = computed(() => localStorage.getItem('role') === 'ADMIN')

onMounted(() => {
  fetchAppointments()
})

const filteredItems = computed(() => {
  if (!search.value) return allItems.value
  const query = search.value.toLowerCase()
  return allItems.value.filter((item) => {
    const fullName =
      `${item.client?.first_name ?? ''} ${item.client?.last_name ?? ''}`.toLowerCase()
    const scheduled = item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : ''
    return fullName.includes(query) || scheduled.includes(query)
  })
})

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredItems.value.slice(start, start + itemsPerPage.value)
})

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

function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function getClientName(item) {
  const first = item.client?.first_name ?? ''
  const last = item.client?.last_name ?? ''
  const name = `${first} ${last}`.trim()
  return name || 'Sem cliente'
}

async function fetchAppointments() {
  try {
    const response = await AppointmentService.getAll()
    allItems.value = Array.isArray(response.data) ? response.data : (response.data?.results ?? [])
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error)
  }
}
</script>

<template>
  <CRow>
    <CCol class="mb-4">
      <CCard class="appointment-card">
        <CCardHeader>
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <strong class="mb-0">Listagem de Agendamentos</strong>

            <div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
              <div class="appointment-search position-relative">
                <CIcon
                  icon="cil-magnifying-glass"
                  class="position-absolute top-50 start-0 translate-middle-y ms-3 text-medium-emphasis"
                />
                <CFormInput
                  v-model="search"
                  type="text"
                  placeholder="Buscar agendamento..."
                  class="ps-5"
                />
              </div>
            </div>
          </div>
        </CCardHeader>

        <CCardBody class="p-0 table-responsive">
          <CTable align="middle" class="mb-0 appointment-table" hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="bg-body-secondary">Cliente</CTableHeaderCell>
                <CTableHeaderCell class="bg-body-secondary">Corte</CTableHeaderCell>
                <CTableHeaderCell v-if="isAdmin" class="bg-body-secondary"
                  >Barbearia</CTableHeaderCell
                >
                <CTableHeaderCell class="bg-body-secondary">Data e Hora</CTableHeaderCell>
                <CTableHeaderCell v-if="isAdmin" class="bg-body-secondary text-center"
                  >Status</CTableHeaderCell
                >
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-if="paginatedItems.length === 0">
                <CTableDataCell :colspan="isAdmin ? 3 : 2" class="text-center py-4">
                  <span class="text-body-secondary">Nenhum agendamento encontrado</span>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-for="item in paginatedItems" :key="item.id ?? item.scheduled_at">
                <CTableDataCell>
                  <div class="fw-semibold">{{ getClientName(item) }}</div>
                </CTableDataCell>
                <CTableDataCell>
                  <div class="fw-semibold">{{ item.service.service_name ?? 'Sem corte' }}</div>
                </CTableDataCell>
                <CTableDataCell v-if="isAdmin">
                  <div class="fw-semibold">
                    {{ item.enterprise?.company_name ?? 'Sem barbearia' }}
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <span class="badge bg-info">{{ item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : ''   }}</span>
                </CTableDataCell>
                <CTableDataCell v-if="isAdmin" class="text-center">
                  <span
                    :class="{
                      'badge bg-success': item.status === 'COMPLETED',
                      'badge bg-warning': item.status === 'SCHEDULED',
                      'badge bg-danger': item.status === 'CANCELLED',
                    }"
                  >
                    {{ item.status }}
                  </span>
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
.appointment-search {
  width: min(100%, 260px);
}

.appointment-table :deep(th),
.appointment-table :deep(td) {
  padding: 0.9rem 1rem;
  vertical-align: middle;
}

.appointment-table {
  font-size: 0.95rem;
}

.appointment-card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  overflow: visible;
}

.appointment-card :deep(.card-body) {
  overflow: visible;
}
</style>
