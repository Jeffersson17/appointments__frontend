<script setup>
import { ref, computed } from 'vue'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Telefone' },
]

const allItems = ref([
  { name: 'Jeffersson Barros', phone: '(85) 99999-9999' },
  { name: 'Luiz Henrique', phone: '(85) 99999-9998' },
  { name: 'Valdimiro Mota', phone: '(85) 99999-9997' },
  { name: 'Carlos Silva', phone: '(85) 99999-9996' },
  { name: 'Maria Oliveira', phone: '(85) 99999-9995' },
  { name: 'Ana Santos', phone: '(85) 99999-9994' },
  { name: 'Pedro Costa', phone: '(85) 99999-9993' },
  { name: 'Fernanda Lima', phone: '(85) 99999-9992' },
  { name: 'Ricardo Alves', phone: '(85) 99999-9991' },
  { name: 'Sofia Pereira', phone: '(85) 99999-9990' },
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
    (item) => item.name.toLowerCase().includes(query) || item.phone.toLowerCase().includes(query),
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
            <strong>Clientes</strong>

            <!-- Busca -->
            <div class="position-relative" style="max-width: 400px">
              <CIcon
                icon="cil-magnifying-glass"
                class="position-absolute top-50 start-0 translate-middle-y ms-3 text-medium-emphasis"
              />

              <CFormInput v-model="search" placeholder="Buscar cliente..." class="ps-5" />
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          <!-- TABELA -->
          <CTable :columns="columns" :items="paginatedItems" />
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
