(function (global, document) {
  'use strict';

  var Storage = global.WETStorage;
  var Expenses = global.WETExpenses;

  var state = {
    wedding: null,
    expenses: [],
    filters: { search: '', fromDate: '', toDate: '', side: 'all' },
    editingId: null,
    submitting: false,
    toastTimer: null,
    openDays: new Set()
  };

  var dom = {};

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHTML(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(message) {
    if (!dom.toast) return;
    dom.toast.textContent = message;
    dom.toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () {
      dom.toast.classList.remove('show');
    }, 2800);
  }

  function cacheDom() {
    dom = {
      heroTitle: $('heroTitle'),
      weddingDate: $('weddingDate'),
      footerNote: $('footerNote'),
      budgetValue: $('budgetValue'),
      budgetEditor: $('budgetEditor'),
      budgetInput: $('budgetInput'),
      budgetError: $('budgetError'),
      editBudgetBtn: $('editBudgetBtn'),
      saveBudgetBtn: $('saveBudgetBtn'),
      cancelBudgetBtn: $('cancelBudgetBtn'),
      expenseValue: $('expenseValue'),
      balanceValue: $('balanceValue'),
      balanceNote: $('balanceNote'),
      balanceCard: $('balanceCard'),
      transactionValue: $('transactionValue'),
      searchInput: $('searchInput'),
      fromDate: $('fromDate'),
      toDate: $('toDate'),
      sideFilter: $('sideFilter'),
      clearFiltersBtn: $('clearFiltersBtn'),
      visibleCount: $('visibleCount'),
      expenseCardList: $('expenseCardList'),
      toggleAllBtn: $('toggleAllBtn'),
      toggleAllIcon: $('toggleAllIcon'),
      toggleAllLabel: $('toggleAllLabel'),
      emptyState: $('emptyState'),
      emptyTitle: $('emptyTitle'),
      emptyText: $('emptyText'),
      addExpenseBtn: $('addExpenseBtn'),
      expenseModal: $('expenseModal'),
      modalTitle: $('modalTitle'),
      closeModalBtn: $('closeModalBtn'),
      expenseForm: $('expenseForm'),
      expenseDate: $('expenseDate'),
      expenseName: $('expenseName'),
      expenseSide: $('expenseSide'),
      expenseAmount: $('expenseAmount'),
      saveExpenseBtn: $('saveExpenseBtn'),
      cancelFormBtn: $('cancelFormBtn'),
      dateError: $('dateError'),
      nameError: $('nameError'),
      sideError: $('sideError'),
      amountError: $('amountError'),
      toast: $('toast')
    };
  }

  function renderWeddingInfo() {
    var wedding = state.wedding;
    if (!wedding) return;
    dom.heroTitle.innerHTML = '<span class="name-primary">' + escapeHTML(wedding.groom) + '</span>' +
      ' <span class="heart">&hearts;</span> ' +
      '<span class="name-secondary">' + escapeHTML(wedding.bride) + '</span>';
    var dateLabel = Expenses.formatLongDate(wedding.wedding_date);
    dom.weddingDate.textContent = dateLabel;
    dom.footerNote.innerHTML = 'Made with <span aria-hidden="true">&hearts;</span> for ' +
      escapeHTML(wedding.groom) + ' &amp; ' + escapeHTML(wedding.bride) +
      ' &middot; ' + escapeHTML(dateLabel);
  }

  function renderKPIs() {
    var kpis = Expenses.calculateKPIs(state.expenses, state.wedding.total_budget);
    dom.budgetValue.textContent = Expenses.formatINR(kpis.totalBudget);
    dom.expenseValue.textContent = Expenses.formatINR(kpis.totalExpenses);
    dom.balanceValue.textContent = Expenses.formatINR(kpis.balance);
    dom.transactionValue.textContent = String(kpis.totalTransactions);
    dom.balanceCard.classList.toggle('over-budget', kpis.balance < 0);
    dom.balanceNote.textContent = kpis.balance < 0 ? 'Over the planned budget' : 'Budget remaining';
  }

  var CATEGORY_ICONS = [
    { pattern: /tea|coffee|snack|water|juice/i, label: 'Refreshments',
      path: '<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v2M10 2v2M14 2v2"/>' },
    { pattern: /lunch|dinner|tiffin|food|breakfast|meal/i, label: 'Food',
      path: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3.5"/>' },
    { pattern: /petrol|diesel|fuel/i, label: 'Fuel',
      path: '<path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M2 22h14M7 8h4"/><path d="M15 12h2a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 3 0V9l-3-3"/>' },
    { pattern: /toll|travel|cab|auto|bus|train|fare/i, label: 'Travel',
      path: '<path d="M5 21L9 3M19 21L15 3M12 4v2M12 10v3M12 17v3"/>' },
    { pattern: /flower|decor|garland/i, label: 'Decoration',
      path: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="6.5" r="3"/><circle cx="17.5" cy="12" r="3"/><circle cx="12" cy="17.5" r="3"/><circle cx="6.5" cy="12" r="3"/>' },
    { pattern: /photo|video|camera/i, label: 'Photography',
      path: '<path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>' },
    { pattern: /mehendi|makeup|beauty|saree|vesti/i, label: 'Attire & Beauty',
      path: '<path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>' }
  ];

  var GENERAL_CATEGORY = {
    label: 'General',
    path: '<path d="M5 3v18l2-1.5L9 21l2-1.5L13 21l2-1.5L17 21l2-1.5V3l-2 1.5L15 3l-2 1.5L11 3 9 4.5 7 3z"/><path d="M9 9h6M9 13h6"/>'
  };
  var monthFormatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });

  function categoryFor(name) {
    for (var i = 0; i < CATEGORY_ICONS.length; i++) {
      if (CATEGORY_ICONS[i].pattern.test(name)) return CATEGORY_ICONS[i];
    }
    return GENERAL_CATEGORY;
  }

  function icon(path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  }

  var SIDE_ICONS = {
    groom: '<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><path d="M10 14l2 3 2-3"/>',
    bride: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="6.5" r="3"/><circle cx="17.5" cy="12" r="3"/><circle cx="12" cy="17.5" r="3"/><circle cx="6.5" cy="12" r="3"/>',
    both: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>'
  };

  function buildRow(expense, index, side) {
    var category = categoryFor(expense.name);
    var shared = expense.side === 'both' && (side === 'groom' || side === 'bride');
    var sideClass = expense.side === 'groom' ? 'groom' : expense.side === 'bride' ? 'bride' : 'both';
    var sideLabel = expense.side === 'groom' ? 'Groom Side' : expense.side === 'bride' ? 'Bride Side' : 'Both Sides';
    var id = escapeHTML(expense.id);
    var name = escapeHTML(expense.name);
    return '<tr class="expense-row">' +
      '<td class="c-num">' + String(index + 1).padStart(2, '0') + '</td>' +
      '<td><span class="xd-who"><span class="xd-ico">' + icon(category.path) + '</span>' +
        '<span class="xd-name-wrap"><span class="cell-name xd-name">' + name + '</span>' +
        '<span class="xd-sub">' + category.label + '</span>' +
        (shared ? '<span class="xd-share" title="Half share of a both-side expense">&frac12; shared</span>' : '') +
        '</span></span></td>' +
      '<td class="c-side"><span class="xd-sideic ' + sideClass + '" title="' + sideLabel + '" ' +
        'role="img" aria-label="' + sideLabel + '">' + icon(SIDE_ICONS[sideClass]) + '</span></td>' +
      '<td class="c-amt amount-col"><span class="cell-amount">' +
        Expenses.formatINR(Expenses.amountForSide(expense, side)) + '</span></td>' +
      '<td class="c-act"><span class="row-actions">' +
        '<button type="button" class="icon-btn xd-ibtn" data-action="edit" data-id="' + id + '" ' +
          'title="Edit expense" aria-label="Edit ' + name + '">' +
          icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>') + '</button>' +
        '<button type="button" class="icon-btn xd-ibtn danger" data-action="delete" data-id="' + id + '" ' +
          'title="Delete expense" aria-label="Delete ' + name + '">' +
          icon('<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>') + '</button>' +
      '</span></td>' +
    '</tr>';
  }

  function buildGroup(group, side) {
    var parts = group.date.split('-');
    var day = parts[2];
    var month = monthFormatter.format(new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))));
    var groom = 0, bride = 0, both = 0, icons = [];
    group.items.forEach(function (item) {
      var shown = Expenses.amountForSide(item, side);
      if (item.side === 'groom' || (item.side === 'both' && side === 'groom')) groom += shown;
      else if (item.side === 'bride' || (item.side === 'both' && side === 'bride')) bride += shown;
      else both += shown;
      var categoryIcon = categoryFor(item.name).path;
      if (icons.indexOf(categoryIcon) === -1) icons.push(categoryIcon);
    });
    var total = group.subtotal || 1;
    var groomPct = groom / total * 100;
    var bridePct = bride / total * 100;
    var bothPct = both / total * 100;
    var isOpen = state.openDays.has(group.date);
    var scrolls = group.items.length > 6;
    var rows = group.items.map(function (item, index) {
      return buildRow(item, index, side);
    }).join('');

    return '<article class="xd-day' + (isOpen ? ' open' : '') + '" data-date="' + group.date + '">' +
      '<button type="button" class="xd-head" aria-expanded="' + isOpen + '">' +
        '<span class="xd-date"><b>' + escapeHTML(day) + '</b><small>' + escapeHTML(month) + '</small></span>' +
        '<span class="xd-htext">' +
          '<span class="xd-htitle">' + escapeHTML(Expenses.formatLongDate(group.date)) + '</span>' +
          '<span class="xd-hsub"><span class="xd-icons">' +
            icons.slice(0, 4).map(function (path) { return '<span>' + icon(path) + '</span>'; }).join('') +
          '</span>' + group.items.length + (group.items.length === 1 ? ' expense' : ' expenses') + '</span>' +
        '</span>' +
        '<span class="xd-hright">' +
          '<span class="xd-splitwrap"><span class="xd-split">' +
            '<span class="g" style="width:' + groomPct + '%"></span>' +
            '<span class="b" style="width:' + bridePct + '%"></span>' +
            '<span class="x" style="width:' + bothPct + '%"></span>' +
          '</span><span class="xd-splitlbl">' +
            '<span class="g">G ' + Expenses.formatINR(groom) + '</span>' +
            '<span class="b">B ' + Expenses.formatINR(bride) + '</span>' +
            (both ? '<span class="x">Both ' + Expenses.formatINR(both) + '</span>' : '') +
          '</span></span>' +
          '<span class="xd-total"><small>Day total</small><b>' + Expenses.formatINR(group.subtotal) + '</b></span>' +
          '<span class="xd-chev">' + icon('<path d="M6 9l6 6 6-6"/>') + '</span>' +
        '</span>' +
      '</button>' +
      '<div class="xd-body"' + (isOpen ? '' : ' inert') + '><div class="xd-inner">' +
        '<div class="xd-scrollwrap' + (scrolls ? ' more' : '') + '">' +
          '<div class="xd-scroll"' + (scrolls ? ' tabindex="0"' : '') + '>' +
            '<table class="xd-grid"><thead><tr>' +
              '<th class="c-num">#</th><th>Expense</th><th class="c-side">Side</th>' +
              '<th class="c-amt">Amount</th><th class="c-act">Actions</th>' +
            '</tr></thead><tbody>' + rows + '</tbody></table>' +
          '</div><div class="xd-fade"></div>' +
        '</div>' +
        (scrolls ? '<div class="xd-foot"><span>Showing 6 of ' + group.items.length + ', scroll to see more</span>' +
          '<button type="button" class="xd-more" data-more>Scroll down ' + icon('<path d="M6 9l6 6 6-6"/>') + '</button></div>' : '') +
      '</div></div>' +
    '</article>';
  }

  function updateClearButton() {
    var filters = state.filters;
    var active = Boolean((filters.search || '').trim() || filters.fromDate || filters.toDate || filters.side !== 'all');
    dom.clearFiltersBtn.hidden = !active;
  }

  function bindCardScroll() {
    dom.expenseCardList.querySelectorAll('.xd-scroll').forEach(function (scroll) {
      scroll.addEventListener('scroll', function () {
        var atEnd = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 4;
        scroll.parentElement.classList.toggle('more', !atEnd && scroll.scrollHeight > scroll.clientHeight);
        var button = scroll.closest('.xd-inner').querySelector('[data-more]');
        if (button) button.classList.toggle('up', atEnd);
      }, { passive: true });
    });
  }

  function renderGrid() {
    updateClearButton();
    var visible = Expenses.filterExpenses(state.expenses, state.filters);
    var total = state.expenses.length;
    var groups = Expenses.groupByDate(visible, state.filters.side);

    var anyOpen = groups.some(function (group) { return state.openDays.has(group.date); });
    if (groups.length && !anyOpen) state.openDays.add(groups[0].date);

    var suffix = total === 1 ? 'transaction' : 'transactions';
    if (visible.length === total) {
      dom.visibleCount.textContent = 'Showing ' + visible.length + ' ' + suffix;
    } else {
      dom.visibleCount.textContent = 'Showing ' + visible.length + ' of ' + total + ' ' + suffix;
    }

    dom.expenseCardList.hidden = groups.length === 0;
    dom.emptyState.hidden = groups.length !== 0;

    if (groups.length === 0) {
      if (total === 0) {
        dom.emptyTitle.textContent = 'No expenses yet';
        dom.emptyText.textContent = 'Add your first expense to start tracking the wedding budget.';
      } else {
        dom.emptyTitle.textContent = 'No matching expenses';
        dom.emptyText.textContent = 'Try a different search or clear the filters to see all records.';
      }
      dom.expenseCardList.innerHTML = '';
      updateToggleButton();
      return;
    }

    dom.expenseCardList.innerHTML = groups.map(function (group) {
      return buildGroup(group, state.filters.side);
    }).join('');
    bindCardScroll();
    updateToggleButton();
  }

  function renderAll() {
    renderWeddingInfo();
    renderKPIs();
    renderGrid();
  }

  function loadInitialState() {
    var stored = null;
    try {
      stored = Storage.load();
    } catch (error) {
      showToast('Saved data could not be read. Refresh to try again.');
    }

    if (stored && Array.isArray(stored.expenses)) {
      state.wedding = stored.wedding;
      state.expenses = stored.expenses;
      renderAll();
      return;
    }

    if (Storage.hasStoredData()) {
      state.wedding = Object.assign({}, Storage.DEFAULT_SEED.wedding);
      state.expenses = [];
      renderAll();
      return;
    }

    Storage.fetchSeed().then(function (seed) {
      var data = Storage.seed(seed);
      state.wedding = data.wedding;
      state.expenses = data.expenses;
      renderAll();
    }).catch(function () {
      var data = Storage.seed(Storage.DEFAULT_SEED);
      state.wedding = data.wedding;
      state.expenses = data.expenses;
      renderAll();
    });
  }

  var errorFields = {
    date: { input: 'expenseDate', error: 'dateError' },
    name: { input: 'expenseName', error: 'nameError' },
    side: { input: 'expenseSide', error: 'sideError' },
    amount: { input: 'expenseAmount', error: 'amountError' }
  };

  function setFieldInvalid(inputId, invalid) {
    var input = $(inputId);
    input.classList.toggle('invalid', invalid);
    var wrapper = input.closest('.dd');
    if (wrapper) wrapper.classList.toggle('invalid', invalid);
  }

  function clearFormErrors() {
    Object.keys(errorFields).forEach(function (key) {
      $(errorFields[key].error).textContent = '';
      setFieldInvalid(errorFields[key].input, false);
    });
  }

  function showFormErrors(errors) {
    Object.keys(errorFields).forEach(function (key) {
      var message = errors[key] || '';
      $(errorFields[key].error).textContent = message;
      setFieldInvalid(errorFields[key].input, Boolean(message));
    });
  }

  function openModal(expense) {
    state.editingId = expense ? expense.id : null;
    state.submitting = false;
    dom.expenseForm.reset();
    clearFormErrors();
    dom.saveExpenseBtn.disabled = false;
    dom.modalTitle.textContent = expense ? 'Edit Expense' : 'Add Expense';
    dom.saveExpenseBtn.textContent = expense ? 'Update Expense' : 'Save Expense';
    dom.expenseDate.value = expense ? expense.date : Expenses.todayISO();
    dom.expenseName.value = expense ? expense.name : '';
    dom.expenseSide.value = expense ? expense.side : '';
    dom.expenseAmount.value = expense ? expense.amount : '';
    if (global.WETDropdowns) global.WETDropdowns.syncAll();
    dom.expenseModal.hidden = false;
    document.body.classList.add('modal-open');
    dom.expenseName.focus();
  }

  function closeModal() {
    dom.expenseModal.hidden = true;
    document.body.classList.remove('modal-open');
    state.editingId = null;
    state.submitting = false;
    dom.saveExpenseBtn.disabled = false;
    clearFormErrors();
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    if (state.submitting) return;

    var payload = {
      date: dom.expenseDate.value,
      name: dom.expenseName.value,
      side: dom.expenseSide.value,
      amount: dom.expenseAmount.value
    };
    var validation = Expenses.validateExpense(payload);
    clearFormErrors();
    if (!validation.valid) {
      showFormErrors(validation.errors);
      var firstInvalid = Object.keys(validation.errors).find(function (key) {
        return Boolean(validation.errors[key]);
      });
      if (firstInvalid) $(errorFields[firstInvalid].input).focus();
      return;
    }

    state.submitting = true;
    dom.saveExpenseBtn.disabled = true;

    var updated;
    if (state.editingId) {
      updated = Expenses.updateExpense(state.expenses, state.editingId, payload);
      showToast('Expense updated.');
    } else {
      var record = Expenses.createExpense(payload, state.expenses);
      updated = state.expenses.concat([record]);
      showToast('Expense added.');
    }

    Storage.saveExpenses(updated);
    state.expenses = updated;
    renderKPIs();
    renderGrid();
    closeModal();
  }

  function allDaysOpen() {
    var cards = dom.expenseCardList.querySelectorAll('.xd-day');
    return cards.length > 0 && Array.prototype.every.call(cards, function (card) {
      return card.classList.contains('open');
    });
  }

  function updateToggleButton() {
    var allOpen = allDaysOpen();
    dom.toggleAllLabel.textContent = allOpen ? 'Collapse all' : 'Expand all';
    dom.toggleAllIcon.innerHTML = allOpen
      ? '<path d="M7 20l5-5 5 5M7 4l5 5 5-5"/>'
      : '<path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>';
  }

  function setDayOpen(card, open) {
    var date = card.getAttribute('data-date');
    if (open) state.openDays.add(date);
    else state.openDays.delete(date);
    card.classList.toggle('open', open);
    card.querySelector('.xd-head').setAttribute('aria-expanded', String(open));
    var body = card.querySelector('.xd-body');
    if (open) body.removeAttribute('inert');
    else body.setAttribute('inert', '');
  }

  function handleCardClick(event) {
    var head = event.target.closest('.xd-head');
    if (head) {
      var card = head.closest('.xd-day');
      setDayOpen(card, !card.classList.contains('open'));
      updateToggleButton();
      return;
    }

    var more = event.target.closest('[data-more]');
    if (more) {
      var scroll = more.closest('.xd-inner').querySelector('.xd-scroll');
      var atEnd = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 4;
      scroll.scrollTo({ top: atEnd ? 0 : scroll.scrollTop + scroll.clientHeight - 42, behavior: 'smooth' });
      return;
    }

    handleTableClick(event);
  }

  function setAllDays(open) {
    dom.expenseCardList.querySelectorAll('.xd-day').forEach(function (card) {
      setDayOpen(card, open);
    });
    updateToggleButton();
  }

  function handleTableClick(event) {
    var button = event.target.closest('button[data-action]');
    if (!button) return;
    var id = button.getAttribute('data-id');
    var expense = Expenses.findById(state.expenses, id);
    if (!expense) return;

    if (button.getAttribute('data-action') === 'edit') {
      openModal(expense);
      return;
    }

    if (button.getAttribute('data-action') === 'delete') {
      var confirmed = global.confirm('Delete "' + expense.name + '" (' +
        Expenses.formatINR(expense.amount) + ')? This cannot be undone.');
      if (!confirmed) return;
      var updated = Expenses.deleteExpense(state.expenses, id);
      Storage.saveExpenses(updated);
      state.expenses = updated;
      renderKPIs();
      renderGrid();
      showToast('Expense deleted.');
    }
  }

  function closeBudgetEditor() {
    dom.budgetEditor.hidden = true;
    dom.budgetValue.hidden = false;
    dom.budgetError.textContent = '';
    dom.budgetInput.classList.remove('invalid');
  }

  function saveBudget() {
    var raw = dom.budgetInput.value;
    var amount = Number(raw);
    if (raw === '' || !isFinite(amount) || amount <= 0) {
      dom.budgetError.textContent = 'Enter an amount greater than zero.';
      dom.budgetInput.classList.add('invalid');
      dom.budgetInput.focus();
      return;
    }
    state.wedding.total_budget = Math.round(amount * 100) / 100;
    Storage.saveWedding(state.wedding);
    renderKPIs();
    closeBudgetEditor();
    showToast('Budget updated.');
  }

  function bindEvents() {
    dom.addExpenseBtn.addEventListener('click', function () { openModal(null); });
    dom.closeModalBtn.addEventListener('click', closeModal);
    dom.cancelFormBtn.addEventListener('click', closeModal);
    dom.expenseForm.addEventListener('submit', handleFormSubmit);
    dom.expenseModal.addEventListener('click', function (event) {
      if (event.target === dom.expenseModal) closeModal();
    });

    Object.keys(errorFields).forEach(function (key) {
      var field = $(errorFields[key].input);
      var clear = function () {
        $(errorFields[key].error).textContent = '';
        setFieldInvalid(errorFields[key].input, false);
      };
      field.addEventListener('input', clear);
      field.addEventListener('change', clear);
    });

    dom.expenseCardList.addEventListener('click', handleCardClick);
    dom.toggleAllBtn.addEventListener('click', function () {
      setAllDays(!allDaysOpen());
    });

    dom.searchInput.addEventListener('input', function () {
      state.filters.search = dom.searchInput.value;
      renderGrid();
    });
    dom.fromDate.addEventListener('change', function () {
      state.filters.fromDate = dom.fromDate.value;
      renderGrid();
    });
    dom.toDate.addEventListener('change', function () {
      state.filters.toDate = dom.toDate.value;
      renderGrid();
    });
    dom.sideFilter.addEventListener('change', function () {
      state.filters.side = dom.sideFilter.value;
      renderGrid();
    });
    dom.clearFiltersBtn.addEventListener('click', function () {
      dom.searchInput.value = '';
      dom.fromDate.value = '';
      dom.toDate.value = '';
      dom.sideFilter.value = 'all';
      if (global.WETDropdowns) global.WETDropdowns.syncAll();
      state.filters = { search: '', fromDate: '', toDate: '', side: 'all' };
      renderGrid();
    });

    dom.editBudgetBtn.addEventListener('click', function () {
      dom.budgetValue.hidden = true;
      dom.budgetEditor.hidden = false;
      dom.budgetError.textContent = '';
      dom.budgetInput.value = state.wedding.total_budget;
      dom.budgetInput.classList.remove('invalid');
      dom.budgetInput.focus();
      dom.budgetInput.select();
    });
    dom.saveBudgetBtn.addEventListener('click', saveBudget);
    dom.cancelBudgetBtn.addEventListener('click', closeBudgetEditor);
    dom.budgetInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        saveBudget();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (!dom.expenseModal.hidden) {
        closeModal();
      } else if (!dom.budgetEditor.hidden) {
        closeBudgetEditor();
      }
    });
  }

  function init() {
    cacheDom();
    bindEvents();
    loadInitialState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
