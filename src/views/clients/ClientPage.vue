<script setup>
import TableClients from './TableClients.vue';
</script>

<template>
  <CRow>
    <CCol class="mb-4">
      <CCard>
        <CCardHeader> Line Chart </CCardHeader>
        <CCardBody>
          <TableClients />
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
</template>
