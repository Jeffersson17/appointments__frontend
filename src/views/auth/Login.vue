<template>
  <div class="login-wrapper min-vh-100 d-flex flex-row align-items-center justify-content-center">
    <CContainer fluid class="px-3 px-md-4">
      <CRow class="justify-content-center">
        <CCol xs="12" sm="10" md="8" lg="6" xl="5" xxl="4">
          <div class="login-card">
            <CCard class="border-0 shadow-lg overflow-hidden bg-transparent">
              <div class="card-top-bar"></div>

              <CCardBody class="p-4 p-md-5 bg-transparent">
                <!-- Cabeçalho -->
                <div class="text-center mb-5">
                  <div class="login-logo mb-4">
                    <div class="logo-circle">
                      <CIcon icon="cil-lock-locked" size="lg" class="text-white" />
                    </div>
                  </div>
                  <h1 class="fw-bold mb-2 fs-4 fs-md-3">Bem-vindo</h1>
                  <p class="text-body-secondary fs-6">Faça login na sua conta para continuar</p>
                </div>

                <CForm @submit.prevent="login">
                  <!-- Campo de Email -->
                  <div class="mb-4">
                    <label class="form-label fw-semibold mb-2">Email</label>
                    <div class="input-wrapper">
                      <CInputGroup class="input-group-custom">
                        <CInputGroupText class="bg-transparent border-0">
                          <CIcon icon="cil-envelope-closed" class="text-primary" />
                        </CInputGroupText>
                        <CFormInput
                          v-model="email"
                          placeholder="seu@email.com"
                          type="email"
                          class="border-0 ps-2"
                          :disabled="isLoading"
                        />
                      </CInputGroup>
                    </div>
                  </div>

                  <!-- Campo de Senha -->
                  <div class="mb-4">
                    <label class="form-label fw-semibold mb-2">Senha</label>
                    <div class="input-wrapper">
                      <CInputGroup class="input-group-custom">
                        <CInputGroupText class="bg-transparent border-0">
                          <CIcon icon="cil-lock-locked" class="text-primary" />
                        </CInputGroupText>
                        <CFormInput
                          v-model="password"
                          :type="showPassword ? 'text' : 'password'"
                          placeholder="Digite sua senha"
                          class="border-0 ps-2"
                          :disabled="isLoading"
                        />
                        <CInputGroupText
                          class="bg-transparent border-0 cursor-pointer toggle-password pe-2"
                          @click="togglePasswordVisibility"
                        >
                          <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        </CInputGroupText>
                      </CInputGroup>
                    </div>
                  </div>

                  <!-- Botão de Login -->
                  <CButton
                    color="primary"
                    class="w-100 fw-semibold py-2 mb-3 button-loading fs-6"
                    type="submit"
                    :disabled="isLoading"
                  >
                    <span v-if="!isLoading" class="d-flex align-items-center justify-content-center">
                      <CIcon icon="cil-arrow-right" class="me-2" />
                      Entrar
                    </span>
                    <span v-else class="d-flex align-items-center justify-content-center">
                      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Carregando...
                    </span>
                  </CButton>

                  <!-- Mensagem de Erro -->
                  <transition name="fade">
                    <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
                      <CIcon icon="cil-x-circle" class="me-2 flex-shrink-0" />
                      <span class="flex-grow-1">{{ errorMessage }}</span>
                      <button type="button" class="btn-close" @click="errorMessage = ''" aria-label="Fechar"></button>
                    </div>
                  </transition>
                </CForm>
              </CCardBody>
            </CCard>
          </div>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import axios from 'axios'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

async function login() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Por favor, preencha todos os campos'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await axios.post('http://localhost:8000/api/login/', {
      email: email.value,
      password: password.value
    })

    localStorage.setItem('access', response.data.access)
    localStorage.setItem('refresh', response.data.refresh)

    setTimeout(() => {
      router.push('/app/dashboard')
    }, 500)

    console.log(response.data)
  } catch (error) {
    isLoading.value = false

    if (error.response?.status === 401) {
      errorMessage.value = 'Email ou senha inválidos'
    } else if (error.response?.data?.detail) {
      errorMessage.value = error.response.data.detail
    } else {
      errorMessage.value = 'Erro ao fazer login. Tente novamente mais tarde.'
    }

    console.error('Erro ao fazer login:', error)
  }
}
</script>

<style scoped>
/* Background Gradient */
.login-wrapper {
  background: linear-gradient(135deg, #1a1d29 0%, #2d3142 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Card Animation */
.login-card {
  animation: slideInUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Card Top Bar */
.card-top-bar {
  height: 4px;
  background: linear-gradient(90deg, #0066ff 0%, #0052cc 100%);
}

/* Logo Circle */
.logo-circle {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #0066ff 0%, #0052cc 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 8px 20px rgba(0, 102, 255, 0.4);
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Form Label */
.form-label {
  font-size: 0.9rem;
  color: var(--cui-body-color);
  margin-bottom: 0.75rem;
}

/* Input Group Styling */
.input-group-custom {
  border: 2px solid #e8e8e8;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  overflow: hidden;
  background-color: #fff;
}

.input-wrapper {
  position: relative;
}

.input-wrapper:focus-within .input-group-custom {
  border-color: #0066ff;
  box-shadow: 0 0 0 0.2rem rgba(0, 102, 255, 0.2);
  transform: translateY(-2px);
}

:deep(.input-group-custom .form-control) {
  border: none !important;
  background: transparent;
  color: #333;
  font-size: 1rem;
  transition: all 0.3s ease;
}

:deep(.input-group-custom .form-control::placeholder) {
  color: #bbb;
}

:deep(.input-group-custom .form-control:focus) {
  box-shadow: none !important;
  color: #333;
}

:deep(.input-group-custom .input-group-text) {
  border: none !important;
  background: transparent;
  color: #0066ff;
}

/* Toggle Password Button */
.toggle-password {
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-password:hover {
  transform: scale(1.1);
}

.toggle-password:active {
  transform: scale(0.95);
}

/* Button Styling */
.button-loading {
  background: linear-gradient(135deg, #0066ff 0%, #0052cc 100%);
  border: none;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(0, 102, 255, 0.4);
}

.button-loading:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 102, 255, 0.5);
}

.button-loading:disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.button-loading:active:not(:disabled) {
  transform: translateY(0);
}

/* Spinner */
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.2em;
}

/* Alert Styling */
.alert {
  border: none;
  border-radius: 0.75rem;
  background-color: #f8d7da;
  color: #721c24;
  box-shadow: 0 2px 8px rgba(114, 28, 36, 0.15);
}

.alert .btn-close {
  filter: invert(1);
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 576px) {
  :deep(.card-body) {
    padding: 1.5rem !important;
  }

  h1 {
    font-size: 1.5rem !important;
  }

  .logo-circle {
    width: 60px;
    height: 60px;
  }

  .form-label {
    font-size: 0.85rem;
  }

  .button-loading {
    padding: 0.6rem 1rem !important;
    font-size: 0.95rem;
  }

  .input-group-custom {
    font-size: 0.95rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .input-group-custom {
    background-color: #2a2a2a;
  }

  :deep(.input-group-custom .form-control) {
    background: transparent;
    color: #fff;
  }

  :deep(.input-group-custom .form-control::placeholder) {
    color: #888;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .login-card,
  .logo-circle,
  .button-loading {
    animation: none;
  }

  .button-loading:hover {
    transform: none;
  }
}
</style>
