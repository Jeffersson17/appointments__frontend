import api from '@/services/api'

export const ServiceClient = {
  getAllServices() {
    return api.get('/services/')
  },
  createService(data) {
    return api.post('/services/', data)
  },
  updateService(id, data) {
    return api.put(`/services/${id}/`, data)
  },
  deleteService(id) {
    return api.delete(`/services/${id}/`)
  },
}
