import { useCallback, useEffect, useState } from 'react';
import { weddingService } from '../services/weddingService';
import { expenseService } from '../services/expenseService';

export function useExpenses() {
  const [wedding, setWedding] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [nextWedding, nextExpenses] = await Promise.all([
        weddingService.get(),
        expenseService.list()
      ]);
      setWedding(nextWedding);
      setExpenses(nextExpenses);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const runMutation = useCallback(async (operation) => {
    setError('');
    try {
      await operation();
      await refresh();
      return true;
    } catch (err) {
      setError(err.message || 'Unable to save changes.');
      return false;
    }
  }, [refresh]);

  const addExpense = useCallback(
    (payload) => runMutation(() => expenseService.create(payload)),
    [runMutation]
  );

  const editExpense = useCallback(
    (id, payload) => runMutation(() => expenseService.update(id, payload)),
    [runMutation]
  );

  const removeExpense = useCallback(
    (id) => runMutation(() => expenseService.remove(id)),
    [runMutation]
  );

  const updateBudget = useCallback(
    (payload) => runMutation(() => weddingService.update(payload)),
    [runMutation]
  );

  return {
    wedding,
    expenses,
    loading,
    error,
    refresh,
    addExpense,
    editExpense,
    removeExpense,
    updateBudget
  };
}
