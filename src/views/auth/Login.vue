<template>
  <div class="wrapper min-vh-100 d-flex flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol :md="6" :lg="5">
          <CCard class="p-4">
            <CCardBody>
              <CForm>
                <h1>Login</h1>
                <p class="text-body-secondary">Insira suas credenciais</p>

                <CInputGroup class="mb-3">
                  <CInputGroupText>
                    <CIcon icon="cil-envelope-closed" />
                  </CInputGroupText>
                  <CFormInput v-model="email" placeholder="Email" />
                </CInputGroup>

                <CInputGroup class="mb-4">
                  <CInputGroupText>
                    <CIcon icon="cil-lock-locked" />
                  </CInputGroupText>
                  <CFormInput v-model="password" type="password" placeholder="Senha" />
                </CInputGroup>

                <CRow>
                  <CCol :xs="6">
                    <CButton color="primary" class="px-4" type="button" @click="login">
                      Login
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
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
const router = useRouter()


async function login() {
  try {
    const response = await axios.post('http://localhost:8000/api/login/', {
      email: email.value,
      password: password.value
    })

    // Armazene o token de autenticação
    localStorage.setItem('access', response.data.access)
    localStorage.setItem('refresh', response.data.refresh)

    router.push('/app/dashboard') // Redireciona para a página de dashboard após o login bem-sucedido

    console.log(response.data)
  } catch (error) {
    console.error('Erro ao fazer login:', error)
  }
}
</script>
