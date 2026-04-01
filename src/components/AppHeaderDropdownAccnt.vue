<script setup>
import avatar from '../assets/images/avatar.png'
import { ref } from 'vue';

const visibleLiveDemo = ref(false);

const openModal = () => {
  visibleLiveDemo.value = true;
}

const closeModal = () => {
  visibleLiveDemo.value = false;
}

const saveChanges = () => {
  // Lógica para salvar as mudanças do perfil
  console.log('Salvando mudanças do perfil...');
  closeModal();
}

const logout = () => {
  // Lógica para realizar o logout do usuário
  console.log('Realizando logout...');
}
</script>

<template>
  <CDropdown placement="bottom-end" variant="nav-item">
    <CDropdownToggle class="py-0 pe-0" :caret="false">
      <CAvatar :src="avatar" size="md" /> 
    </CDropdownToggle>
    <CDropdownMenu class="pt-0">
      <CDropdownHeader
        component="h6"
        class="bg-body-secondary text-body-secondary fw-semibold my-2"
      >
        Settings
      </CDropdownHeader>
      <CDropdownItem @click="openModal">
         <CIcon icon="cil-user" /> Profile
        </CDropdownItem>
        <CDropdownDivider />
      <CDropdownItem @click="logout">
        <CIcon icon="cil-lock-locked" /> Logout 
      </CDropdownItem>
    </CDropdownMenu>
  </CDropdown>
  <CModal 
    :visible="visibleLiveDemo"
    @close="closeModal"
    aria-labelledby="LiveDemoExampleLabel"
  >
    <CModalHeader>
      <CAvatar :src="avatar" size="md" class="me-2" />
      <CModalTitle id="LiveDemoExampleLabel">Editar perfil</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CRow :xs="{gutter: 2}">
        <CCol md>
          <CFormFloating>
            <CFormInput 
              type="email"
              id="floatingInputGrid"
              floatingLabel="Email address"
              value="email@example.com"
            />
          </CFormFloating>
        </CCol>
        <CCol md>
          <CFormFloating>
            <CFormInput type="password" id="floatingPassword" floatingLabel="Password" placeholder="Password" />
          </CFormFloating>
        </CCol>
        <CFormInput 
          type="file" 
          accept="image/*"
        />
      </CRow>
    </CModalBody>
    <CModalFooter>
      <CButton color="danger" @click="closeModal">
        Fechar
      </CButton>
      <CButton color="primary" @click="saveChanges">
        Salvar mudanças
      </CButton>
    </CModalFooter>
  </CModal>
</template>
