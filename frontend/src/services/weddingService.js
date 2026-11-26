import { api } from './apiClient';

export const weddingService = {
  get: () => api.getWedding(),
  update: (payload) => api.updateWedding(payload)
};
