import api from '@/services/api'

export const AppointmentService = {
  getAll() {
    return api.get('/appointments/')
  },
  createAppointment(data) {
    return api.post('/appointments/', data)
    },
  updateAppointment(id, data) {
    return api.put(`/appointments/${id}/`, data)
  },
  deleteAppointment(id) {
    return api.delete(`/appointments/${id}/`)
  },
}