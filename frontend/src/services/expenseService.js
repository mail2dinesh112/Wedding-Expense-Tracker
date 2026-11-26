import { api } from './apiClient';

export const expenseService = {
  list: (filters = {}) => api.getExpenses(filters),
  create: (payload) => api.createExpense(payload),
  update: (id, payload) => api.updateExpense(id, payload),
  remove: (id) => api.deleteExpense(id)
};
