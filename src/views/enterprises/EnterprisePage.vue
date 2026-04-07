<script setup>
import { ref, computed } from 'vue'

const columns = [
  { key: 'company_name', label: 'Nome da Empresa' },
  { key: 'owner_name', label: 'Proprietário' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Opções' },
]

const allItems = ref([
  { company_name: 'Empresa A', owner_name: 'João Silva', is_active: true },
  { company_name: 'Empresa B', owner_name: 'Maria Oliveira', is_active: true },
  { company_name: 'Empresa C', owner_name: 'Carlos Santos', is_active: false },
  { company_name: 'Empresa D', owner_name: 'Ana Costa', is_active: false },
  { company_name: 'Empresa E', owner_name: 'Pedro Lima', is_active: false },
  { company_name: 'Empresa F', owner_name: 'Lucia Fernandes', is_active: false },
  { company_name: 'Empresa G', owner_name: 'Rafael Almeida', is_active: false },
  { company_name: 'Empresa H', owner_name: 'Sofia Pereira', is_active: false },
  { company_name: 'Empresa I', owner_name: 'Bruno Rodrigues', is_active: false },
  { company_name: 'Empresa J', owner_name: 'Carla Martins', is_active: false },
])

const currentPage = ref(1)
const itemsPerPage = ref(5)

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
      item.company_name.toLowerCase().includes(query) ||
      item.owner_name.toLowerCase().includes(query),
  )
})
</script>
<template>
  <CRow>
    <CCol class="mb-4">
      <CCard>
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center">
            <!-- Título -->
            <strong>Empresas</strong>

            <!-- Busca -->
            <div class="position-relative" style="max-width: 400px">
              <CIcon
                icon="cil-magnifying-glass"
                class="position-absolute top-50 start-0 translate-middle-y ms-3 text-medium-emphasis"
              />

              <CFormInput v-model="search" placeholder="Buscar empresa..." class="ps-5" />
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          <!-- TABELA -->
          <table class="table">
            <thead>
              <tr>
                <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedItems" :key="item.company_name">
                <td>{{ item.company_name }}</td>
                <td>{{ item.owner_name }}</td>
                <td>
                  <span
                    class="status-square"
                    :class="item.is_active ? 'status-active' : 'status-inactive'"
                  ></span>
                </td>
                <td>
                  <CDropdown placement="bottom-end">
                    <CDropdownToggle class="py-0 pe-0" :caret="false">
                      <CIcon icon="cil-options" />
                    </CDropdownToggle>
                    <CDropdownMenu class="pt-0">
                      <CDropdownItem>
                        <CIcon icon="cil-pencil" /> Atualizar
                      </CDropdownItem>
                      <CDropdownItem>
                        <CIcon icon="cil-trash" /> Deletar
                      </CDropdownItem>
                    </CDropdownMenu>
                  </CDropdown>
                </td>
              </tr>
            </tbody>
          </table>
          <!-- HEADER PAGINAÇÃO -->
          <div class="d-flex justify-content-between align-items-center mb-3">
            <!-- PAGINAÇÃO -->
            <CPagination>
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
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
              >
                ›
              </CPaginationItem>

              <CPaginationItem
                :disabled="currentPage === totalPages"
                @click="changePage(totalPages)"
              >
                »
              </CPaginationItem>
            </CPagination>

            <!-- SELECT ITEMS -->
            <div class="d-flex align-items-center gap-2">
              <span>Items per page:</span>
              <select class="form-select w-auto" @change="changeItemsPerPage">
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
</template>

<style scoped>
.status-square {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  vertical-align: middle;
}

.status-active {
  background-color: #28a745;
}

.status-inactive {
  background-color: #dc3545;
}
</style>
