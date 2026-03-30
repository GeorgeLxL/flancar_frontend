import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

export const getMe = () => api.get('/auth/me').then(r => r.data);
export const logout = () => api.post('/auth/logout');

export const getSchedules = () => api.get('/schedules').then(r => r.data);
export const getSchedule = (id: number) => api.get(`/schedules/${id}`).then(r => r.data);
export const createSchedule = (data: unknown) => api.post('/schedules', data).then(r => r.data);
export const updateSchedule = (id: number, data: unknown) => api.put(`/schedules/${id}`, data).then(r => r.data);
export const updateScheduleStatus = (id: number, status: string) =>
  api.patch(`/schedules/${id}/status`, { status }).then(r => r.data);
export const deleteSchedule = (id: number) => api.delete(`/schedules/${id}`);

export const getProducts = () => api.get('/smaregi/products').then(r => r.data);
export const getStores = () => api.get('/smaregi/stores').then(r => r.data);
