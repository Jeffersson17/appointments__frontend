import api from '@/services/api'

export const EnterpriseService = {
  getAll() {
    return api.get('/enterprises/')
  },
  createEnterprise(data) {
    return api.post('/enterprises/', data)
  },
  update(id, data) {
    return api.put(`/enterprises/${id}/`, data)
  },
  setActive(userId, is_active) {
    return api.patch(`/users/${userId}/`, { is_active })
  },
  updateUser(userId, data) {
    return api.patch(`/users/${userId}/`, data)
  },
  delete(id) {
    return api.delete(`/enterprises/${id}/`)
  },
}