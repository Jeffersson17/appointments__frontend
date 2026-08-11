<template>
  <CForm autocomplete="off" @submit.prevent>
    <div class="d-flex flex-column gap-3">
      <!-- Campos isca: evitam o autofill do usuário logado -->
      <input
        type="text"
        name="prevent_autofill_username"
        autocomplete="username"
        tabindex="-1"
        aria-hidden="true"
        class="autofill-trap"
      />
      <input
        type="password"
        name="prevent_autofill_password"
        autocomplete="current-password"
        tabindex="-1"
        aria-hidden="true"
        class="autofill-trap"
      />

      <div>
        <CFormLabel>Nome da empresa</CFormLabel>
        <CFormInput
          v-model="form.company_name"
          type="text"
          name="enterprise_company_name"
          autocomplete="organization"
          :invalid="!!errors.company_name"
          :feedback-invalid="errors.company_name"
          @input="clearError('company_name')"
        />
      </div>

      <div>
        <CFormLabel>Proprietário</CFormLabel>
        <CFormInput
          v-model="form.owner_name"
          type="text"
          name="enterprise_owner_name"
          autocomplete="off"
          :invalid="!!errors.owner_name"
          :feedback-invalid="errors.owner_name"
          @input="clearError('owner_name')"
        />
      </div>

      <div>
        <CFormLabel>Logo da Empresa</CFormLabel>
        <CFormInput type="file" accept="image/*" autocomplete="off" @change="onLogoChange" />
      </div>

      <div>
        <CFormLabel>Email</CFormLabel>
        <CFormInput
          v-model="form.email"
          type="email"
          name="enterprise_email"
          autocomplete="off"
          :invalid="!!errors.email"
          :feedback-invalid="errors.email"
          @input="clearError('email')"
        />
      </div>

      <div>
        <CFormLabel>{{ passwordLabel }}</CFormLabel>
        <CFormInput
          v-model="form.password"
          type="password"
          name="enterprise_password"
          autocomplete="new-password"
          :invalid="!!errors.password"
          :feedback-invalid="errors.password"
          :placeholder="mode === 'edit' ? 'Deixe em branco para manter' : ''"
          @input="clearError('password')"
        />
      </div>
    </div>
  </CForm>
</template>

<script setup>
import { computed, reactive } from 'vue'

const form = defineModel({
  type: Object,
  required: true,
})

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value),
  },
})

const errors = reactive({
  company_name: '',
  owner_name: '',
  email: '',
  password: '',
})

const passwordLabel = computed(() =>
  props.mode === 'edit' ? 'Senha (opcional)' : 'Senha',
)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const clearError = (field) => {
  errors[field] = ''
}

const clearErrors = () => {
  Object.keys(errors).forEach((key) => {
    errors[key] = ''
  })
}

const validate = () => {
  clearErrors()

  let isValid = true

  if (!form.value.company_name?.trim()) {
    errors.company_name = 'O nome da empresa é obrigatório.'
    isValid = false
  }

  if (!form.value.owner_name?.trim()) {
    errors.owner_name = 'O nome do proprietário é obrigatório.'
    isValid = false
  }

  if (!form.value.email?.trim()) {
    errors.email = 'O email é obrigatório.'
    isValid = false
  } else if (!EMAIL_REGEX.test(form.value.email.trim())) {
    errors.email = 'Informe um email válido.'
    isValid = false
  }

  if (props.mode === 'create' && !form.value.password) {
    errors.password = 'A senha é obrigatória.'
    isValid = false
  }

  return isValid
}

const onLogoChange = (event) => {
  form.value.logo = event.target.files?.[0] ?? null
}

defineExpose({ validate, clearErrors })
</script>

<style scoped>
.autofill-trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
