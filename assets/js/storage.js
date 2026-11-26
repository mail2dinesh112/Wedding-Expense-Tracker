(function (global) {
  'use strict';

  var KEYS = {
    wedding: 'wet.wedding',
    expenses: 'wet.expenses'
  };

  var DEFAULT_SEED = {
    wedding: {
      groom: 'Dinesh',
      bride: 'Suthesi',
      wedding_date: '2026-12-14',
      total_budget: 100000
    },
    expenses: []
  };

  var memoryFallback = {};

  function storageAvailable() {
    try {
      var probe = '__wet_probe__';
      global.localStorage.setItem(probe, '1');
      global.localStorage.removeItem(probe);
      return true;
    } catch (error) {
      return false;
    }
  }

  var canUseStorage = storageAvailable();

  function read(key) {
    if (canUseStorage) {
      try {
        return global.localStorage.getItem(key);
      } catch (error) {
        canUseStorage = false;
      }
    }
    return Object.prototype.hasOwnProperty.call(memoryFallback, key) ? memoryFallback[key] : null;
  }

  function write(key, value) {
    memoryFallback[key] = value;
    if (canUseStorage) {
      try {
        global.localStorage.setItem(key, value);
      } catch (error) {
        canUseStorage = false;
      }
    }
  }

  function parseJSON(value, fallback) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
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

  function normalizeWedding(input) {
    var source = input && typeof input === 'object' ? input : {};
    var budget = Number(source.total_budget);
    return {
      groom: typeof source.groom === 'string' && source.groom.trim() ? source.groom.trim() : DEFAULT_SEED.wedding.groom,
      bride: typeof source.bride === 'string' && source.bride.trim() ? source.bride.trim() : DEFAULT_SEED.wedding.bride,
      wedding_date: isValidDate(source.wedding_date) ? source.wedding_date : DEFAULT_SEED.wedding.wedding_date,
      total_budget: isFinite(budget) && budget >= 0 ? budget : DEFAULT_SEED.wedding.total_budget
    };
  }

  function normalizeAmount(value) {
    var amount = Number(value);
    return isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
  }

  function makeId(index) {
    return 'EXP-' + Date.now().toString(36).toUpperCase() + '-' + index;
  }

  function normalizeExpense(input, index, usedIds) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Each expense must be an object.');
    }
    if (!isValidDate(input.date)) {
      throw new Error('Expense #' + (index + 1) + ' has an invalid date (use YYYY-MM-DD).');
    }
    if (typeof input.name !== 'string' || !input.name.trim()) {
      throw new Error('Expense #' + (index + 1) + ' has an empty name.');
    }
    if (input.side !== 'groom' && input.side !== 'bride' && input.side !== 'both') {
      throw new Error('Expense #' + (index + 1) + ' has an invalid side.');
    }
    var amount = normalizeAmount(input.amount);
    if (amount === null) {
      throw new Error('Expense #' + (index + 1) + ' has an invalid amount.');
    }

    var id = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : makeId(index + 1);
    if (usedIds.has(id)) {
      id = makeId(index + 1) + '-' + usedIds.size;
    }
    usedIds.add(id);

    return {
      id: id,
      date: input.date,
      name: input.name.trim().toUpperCase(),
      side: input.side,
      amount: amount
    };
  }

  function normalizeExpenses(list) {
    if (!Array.isArray(list)) {
      throw new Error('Expenses must be an array.');
    }
    var usedIds = new Set();
    return list.map(function (item, index) {
      return normalizeExpense(item, index, usedIds);
    });
  }

  function load() {
    var storedWedding = parseJSON(read(KEYS.wedding), null);
    var storedExpenses = parseJSON(read(KEYS.expenses), null);
    return {
      wedding: normalizeWedding(storedWedding || DEFAULT_SEED.wedding),
      expenses: Array.isArray(storedExpenses) ? normalizeExpenses(storedExpenses) : null
    };
  }

  function hasStoredData() {
    return read(KEYS.expenses) !== null;
  }

  function seed(data) {
    var source = data && typeof data === 'object' ? data : DEFAULT_SEED;
    var wedding = normalizeWedding(source.wedding);
    var expenses = Array.isArray(source.expenses) ? normalizeExpenses(source.expenses) : [];
    write(KEYS.wedding, JSON.stringify(wedding));
    write(KEYS.expenses, JSON.stringify(expenses));
    return { wedding: wedding, expenses: expenses };
  }

  function saveWedding(wedding) {
    write(KEYS.wedding, JSON.stringify(normalizeWedding(wedding)));
  }

  function saveExpenses(expenses) {
    write(KEYS.expenses, JSON.stringify(normalizeExpenses(expenses)));
  }

  function fetchSeed() {
    return fetch('assets/data/expenses.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Seed file unavailable');
        }
        return response.json();
      })
      .catch(function () {
        return {
          wedding: Object.assign({}, DEFAULT_SEED.wedding),
          expenses: []
        };
      });
  }

  global.WETStorage = {
    KEYS: KEYS,
    DEFAULT_SEED: DEFAULT_SEED,
    load: load,
    hasStoredData: hasStoredData,
    seed: seed,
    saveWedding: saveWedding,
    saveExpenses: saveExpenses,
    fetchSeed: fetchSeed
  };
})(window);
