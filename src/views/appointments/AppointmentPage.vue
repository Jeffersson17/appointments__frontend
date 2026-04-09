<script setup>
import { ref, computed, onMounted } from 'vue'

const columns = [
  { key: 'id', label: 'ID do Agendamento' },
  { key: 'enterprise', label: 'Barbearia' },
  { key: 'service', label: 'Corte' },
  { key: 'date_time', label: 'Data e Hora' },
]

const allItems = ref([{ id: 1, enterprise: 'Barbearia 1', service: 'Corte 1', date_time: '2023-10-10 10:00' }])

const currentPage = ref(1)
const itemsPerPage = ref(5)

const totalPages = computed(() => Math.ceil(allItems.value.length / itemsPerPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return allItems.value.slice(start, start + itemsPerPage.value)
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

const visibleLiveDemo = ref(false)

const selecionado = ref(null)

const selectedDate = ref(null)
const selectedTime = ref(null)

const handleDateChange = (e) => {
  selectedDate.value = e.target.value

  // resetar escolhas
  selectedTime.value = null
  selecionado.value = null

  carregarHorarios()
}

const horarios = ref([])

const carregarHorarios = () => {
  // simulação (depois vem do backend)
  horarios.value = [
    { hora: '08:00', disponivel: true },
    { hora: '08:45', disponivel: false },
    { hora: '09:30', disponivel: true },
    { hora: '10:15', disponivel: true },
    { hora: '11:00', disponivel: false },
    { hora: '14:00', disponivel: false },
    { hora: '14:45', disponivel: false },
    { hora: '15:30', disponivel: false },
    { hora: '16:15', disponivel: false },
    { hora: '17:00', disponivel: false },
    { hora: '17:45', disponivel: false },
    { hora: '18:30', disponivel: false },
    { hora: '19:15', disponivel: false },
    { hora: '20:00', disponivel: false },
  ]
}

// controla o tempo atual
const now = ref(new Date())

onMounted(() => {
  setInterval(() => {
    now.value = new Date()
  }, 60000) // atualiza a cada 1 min
})

// HOJE (reativo)
const today = computed(() => {
  return now.value.toISOString().split('T')[0]
})

// MAX +3 meses (reativo)
const maxDate = computed(() => {
  const d = new Date(now.value)
  const dia = d.getDate()

  d.setMonth(d.getMonth() + 3)

  // correção de mês (ex: 31 → fevereiro)
  if (d.getDate() !== dia) {
    d.setDate(0)
  }

  return d.toISOString().split('T')[0]
})

const cortes = [
  {
    id: 1,
    nome: 'Degradê',
    preco: 30,
    imagem: 'https://i.pinimg.com/originals/e0/0f/98/e00f9841618bf906833512fdd977be65.jpg',
  },
  {
    id: 2,
    nome: 'Social',
    preco: 25,
    imagem:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7Vxn0tgdCRq-ecncMR-n542NAqhS5X_2vdQ&s',
  },
  {
    id: 3,
    nome: 'Navalhado',
    preco: 35,
    imagem: 'https://i.ytimg.com/vi/2LdZRcrk9YA/hq720.jpg',
  },
  {
    id: 4,
    nome: 'Low Fade',
    preco: 40,
    imagem: 'https://i.pinimg.com/736x/57/56/b1/5756b13874ab279d439fd789ced7398c.jpg',
  },
  {
    id: 5,
    nome: 'Social + Barba',
    preco: 50,
    imagem:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSy-D3e0Ng29HtyVK3ybS_Eja6fvX_101ty2g&s',
  },
  {
    id: 6,
    nome: 'Low Fade + Barba',
    preco: 60,
    imagem:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1piZHQsc24wSeoyiQGtlb_C1juZZ3YVS2sA&s',
  },
  {
    id: 7,
    nome: 'Navalhado + Barba',
    preco: 70,
    imagem:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbKTPmA9puigDpwh-PUJONuLnXbG4Kz7InWA&s',
  },
]
</script>

<template>
  <CRow>
    <CCol class="mb-4">
      <CCard>
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center">
            <!-- Título -->
            <strong>Serviços</strong>

            <!-- Botão para criar agendamento -->
            <CButton
              color="outline-primary"
              @click="
                () => {
                  visibleLiveDemo = true
                }
              "
              >Criar Agendamento</CButton
            >
            <CModal
              :visible="visibleLiveDemo"
              size="lg"
              @close="
                () => {
                  visibleLiveDemo = false
                }
              "
              aria-labelledby="LiveDemoExampleLabel"
            >
              <CModalHeader>
                <CModalTitle id="LiveDemoExampleLabel">Criar Agendamento</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <!-- Formulário para criar agendamento -->
                <CForm>
                  <CFormGroup class="mb-3">
                    <CFormLabel>Data do Agendamento</CFormLabel>
                    <CFormInput
                      type="date"
                      :min="today"
                      :max="maxDate"
                      @change="handleDateChange"
                    />
                  </CFormGroup>
                  <CFormGroup v-if="selectedDate" class="mb-3">
                    <CFormLabel>Horários disponíveis</CFormLabel>

                    <div class="d-flex flex-wrap gap-2">
                      <CButton
                        v-for="h in horarios"
                        :key="h.hora"
                        :color="selectedTime === h.hora ? 'primary' : 'dark'"
                        :disabled="!h.disponivel"
                        @click="selectedTime = h.hora"
                      >
                        {{ h.hora }}
                      </CButton>
                    </div>
                  </CFormGroup>

                  <CFormGroup v-if="selectedTime" class="mb-3">
                    <CFormLabel>Escolha o Corte</CFormLabel>

                    <CRow class="flex-nowrap overflow-auto gap-3 p-2">
                      <CCol
                        v-for="corte in cortes"
                        :key="corte.id"
                        style="min-width: 160px; max-width: 160px"
                      >
                        <CCard
                          class="text-center cursor-pointer"
                          :class="selecionado === corte.id ? 'border border-primary' : ''"
                          @click="selecionado = corte.id"
                        >
                          <img :src="corte.imagem" class="card-img-top img-fixed" />

                          <CCardBody class="p-2">
                            <small>{{ corte.nome }}</small
                            ><br />
                            <strong>R$ {{ corte.preco }}</strong>
                          </CCardBody>
                        </CCard>
                      </CCol>
                    </CRow>
                  </CFormGroup>
                </CForm>
              </CModalBody>
              <CModalFooter>
                <CButton
                  color="danger"
                  @click="
                    () => {
                      visibleLiveDemo = false
                    }
                  "
                >
                  Close
                </CButton>
                <CButton color="primary">Criar</CButton>
              </CModalFooter>
            </CModal>
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
              <tr v-for="item in paginatedItems" :key="item.service">
                <td>{{ item.id }}</td>
                <td>{{ item.service }}</td>
                <td>{{ item.enterprise }}</td>
                <td>{{ item.date_time }}</td>
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

<style>
.img-fixed {
  width: 100%;
  height: 170px;
  object-fit: cover;
}
</style>
