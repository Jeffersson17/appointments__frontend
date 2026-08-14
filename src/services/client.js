
import api from '@/services/api'

export const ClientService = {
  getAll() {
    return api.get('/clients/')
  },
  create(data) {
    return api.post('/clients/', data)
  },
  update(id, data) {
    return api.put(`/clients/${id}/`, data)
  },
  delete(id) {
    return api.delete(`/clients/${id}/`)
  },
}