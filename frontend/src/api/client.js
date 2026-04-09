import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
})

// Attach token to every request automatically
api.interceptors.request.use((config) => {
  const token = window.__auth_token__
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
