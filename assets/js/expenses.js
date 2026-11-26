(function (global) {
  'use strict';

  function todayISO() {
    var now = new Date();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    return now.getFullYear() + '-' + month + '-' + day;
  }

  function isValidDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    var parts = value.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.getUTCFullYear() === parts[0] &&
      date.getUTCMonth() === parts[1] - 1 &&
      date.getUTCDate() === parts[2];
  }

  function roundAmount(value) {
    return Math.round(Number(value) * 100) / 100;
  }

  function generateId(expenses) {
    var usedIds = new Set();
    var max = 0;
    expenses.forEach(function (expense) {
      var id = expense.id || '';
      usedIds.add(id);
      var match = /^EXP0*(\d+)$/i.exec(id);
      if (match) {
        max = Math.max(max, parseInt(match[1], 10));
      }
    });
    var next = max + 1;
    while (usedIds.has('EXP' + String(next).padStart(3, '0'))) {
      next += 1;
    }
    return 'EXP' + String(next).padStart(3, '0');
  }

  function validateExpense(data) {
    var errors = { date: '', name: '', side: '', amount: '' };
    var input = data || {};

    if (!input.date) {
      errors.date = 'Please select an expense date.';
    } else if (!isValidDate(input.date)) {
      errors.date = 'Enter a valid date in YYYY-MM-DD format.';
    }

    var name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) {
      errors.name = 'Please enter an expense name.';
    }

    if (input.side !== 'groom' && input.side !== 'bride' && input.side !== 'both') {
      errors.side = 'Please select Groom Side, Bride Side, or Both Sides.';
    }

    var amount = Number(input.amount);
    if (input.amount === '' || input.amount === null || input.amount === undefined || !isFinite(amount)) {
      errors.amount = 'Please enter an amount.';
    } else if (amount <= 0) {
      errors.amount = 'Amount must be greater than zero.';
    }

    return {
      valid: !errors.date && !errors.name && !errors.side && !errors.amount,
      errors: errors
    };
  }

  function cleanExpense(data) {
    return {
      date: data.date,
      name: data.name.trim().toUpperCase(),
      side: data.side,
      amount: roundAmount(data.amount)
    };
  }

  function createExpense(data, expenses) {
    var record = cleanExpense(data);
    record.id = generateId(expenses);
    return record;
  }

  function updateExpense(expenses, id, data) {
    var changes = cleanExpense(data);
    return expenses.map(function (expense) {
      if (expense.id === id) {
        return {
          id: expense.id,
          date: changes.date,
          name: changes.name,
          side: changes.side,
          amount: changes.amount
        };
      }
      return expense;
    });
  }

  function deleteExpense(expenses, id) {
    return expenses.filter(function (expense) {
      return expense.id !== id;
    });
  }

  function findById(expenses, id) {
    return expenses.find(function (expense) {
      return expense.id === id;
    }) || null;
  }

  function calculateKPIs(expenses, budget) {
    var totalExpenses = 0;
    expenses.forEach(function (expense) {
      totalExpenses += Number(expense.amount) || 0;
    });
    totalExpenses = roundAmount(totalExpenses);
    var totalBudget = Number(budget) || 0;
    return {
      totalBudget: totalBudget,
      totalExpenses: totalExpenses,
      balance: roundAmount(totalBudget - totalExpenses),
      totalTransactions: expenses.length
    };
  }

  function amountForSide(expense, side) {
    if (expense.side === 'both' && (side === 'groom' || side === 'bride')) {
      return roundAmount(Number(expense.amount) / 2);
    }
    return Number(expense.amount);
  }

  function filterExpenses(expenses, filters) {
    var options = filters || {};
    var search = (options.search || '').trim().toLowerCase();
    var fromDate = options.fromDate || '';
    var toDate = options.toDate || '';
    var side = options.side || 'all';

    return expenses.filter(function (expense) {
      if (search && expense.name.toLowerCase().indexOf(search) === -1) {
        return false;
      }
      if (fromDate && expense.date < fromDate) {
        return false;
      }
      if (toDate && expense.date > toDate) {
        return false;
      }
      if (side !== 'all' && expense.side !== side && expense.side !== 'both') {
        return false;
      }
      return true;
    });
  }

  function groupByDate(expenses, side) {
    var sorted = expenses
      .map(function (expense, index) {
        return { expense: expense, index: index };
      })
      .sort(function (a, b) {
        if (a.expense.date !== b.expense.date) {
          return a.expense.date < b.expense.date ? 1 : -1;
        }
        return b.index - a.index;
      });

    var groups = [];
    sorted.forEach(function (entry) {
      var date = entry.expense.date;
      var group = groups[groups.length - 1];
      if (!group || group.date !== date) {
        group = { date: date, items: [], subtotal: 0 };
        groups.push(group);
      }
      group.items.push(entry.expense);
      group.subtotal = roundAmount(group.subtotal + amountForSide(entry.expense, side));
    });
    return groups;
  }

  var currencyWhole = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2
  });
  var currencyFraction = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  var shortDate = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  var longDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  function formatINR(amount) {
    var value = Number(amount) || 0;
    var hasFraction = Math.abs(value * 100 % 1) > 0 || Math.abs(value % 1) > 0;
    return (hasFraction ? currencyFraction : currencyWhole).format(value);
  }

  function parseISO(iso) {
    if (!isValidDate(iso)) return null;
    var parts = iso.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  }

  function formatDate(iso) {
    var date = parseISO(iso);
    return date ? shortDate.format(date) : iso || '';
  }

  function formatLongDate(iso) {
    var date = parseISO(iso);
    return date ? longDate.format(date) : iso || '';
  }

  global.WETExpenses = {
    todayISO: todayISO,
    isValidDate: isValidDate,
    generateId: generateId,
    validateExpense: validateExpense,
    createExpense: createExpense,
    updateExpense: updateExpense,
    deleteExpense: deleteExpense,
    findById: findById,
    calculateKPIs: calculateKPIs,
    filterExpenses: filterExpenses,
    groupByDate: groupByDate,
    amountForSide: amountForSide,
    formatINR: formatINR,
    formatDate: formatDate,
    formatLongDate: formatLongDate
  };
})(window);
