(function (global, document) {
  'use strict';

  var dropdowns = [];
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  function close(dd) {
    dd.classList.remove('open');
    var trigger = dd.querySelector('.dd-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function toISO(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') +
      '-' + String(date.getDate()).padStart(2, '0');
  }

  function fromISO(value) {
    var parts = value.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  var dateFormatter = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  function formatDate(value) {
    return dateFormatter.format(fromISO(value));
  }

  function syncDate(dd) {
    var input = dd.querySelector('.dd-native');
    dd.querySelector('.dd-title').textContent = input.value ? formatDate(input.value) : dd._title;
    dd.querySelector('.dd-sub').textContent = dd._sub;
  }

  function pickDate(dd, input, day) {
    input.value = day ? toISO(day) : '';
    dd._view = new Date(
      (day || today).getFullYear(), (day || today).getMonth(), 1
    );
    syncDate(dd);
    renderCalendar(dd);
    close(dd);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    dd.querySelector('.dd-trigger').focus();
  }

  function syncSide(dd) {
    var select = dd.querySelector('.dd-native');
    var options = dd.querySelectorAll('.dd-opt');
    var selected = null;

    Array.prototype.forEach.call(options, function (option) {
      var active = option.getAttribute('data-value') === select.value;
      option.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) selected = option;
    });

    var title = dd.querySelector('.dd-title');
    var subtitle = dd.querySelector('.dd-sub');
    var tile = dd.querySelector('.dd-tile');

    if (selected) {
      var source = selected.querySelector('.dd-tile');
      title.textContent = selected.querySelector('.dd-title').textContent;
      subtitle.textContent = selected.querySelector('.dd-sub').textContent;
      tile.className = 'dd-tile ' + source.className.replace('dd-tile', '').trim();
      tile.innerHTML = source.innerHTML;
    } else {
      title.textContent = dd.getAttribute('data-placeholder-title') || 'Select side';
      subtitle.textContent = dd.getAttribute('data-placeholder-sub') || 'Groom, bride or both sides';
      tile.className = 'dd-tile t-date';
    }
  }

  function sync(dd) {
    if (dd.classList.contains('dd-date')) syncDate(dd);
    else syncSide(dd);
  }

  function syncAll() {
    dropdowns.forEach(sync);
  }

  function renderCalendar(dd) {
    var input = dd.querySelector('.dd-native');
    var monthEl = dd.querySelector('.dd-month');
    var daysEl = dd.querySelector('.dd-days');
    var view = dd._view;

    monthEl.textContent = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    daysEl.innerHTML = '';

    var start = new Date(view);
    start.setDate(1 - start.getDay());

    for (var i = 0; i < 42; i++) {
      (function (day) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'dd-day';
        button.textContent = day.getDate();
        button.setAttribute('aria-label', day.toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }));
        if (day.getMonth() !== view.getMonth()) button.classList.add('out');
        if (toISO(day) === toISO(today)) button.classList.add('today');
        if (input.value && toISO(day) === input.value) {
          button.classList.add('sel');
          button.setAttribute('aria-pressed', 'true');
        }
        button.addEventListener('click', function () {
          pickDate(dd, input, day);
        });
        daysEl.appendChild(button);
      })(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
  }

  function initDate(dd, input) {
    dd._view = input.value ? fromISO(input.value) : new Date(today.getFullYear(), today.getMonth(), 1);
    dd._view = new Date(dd._view.getFullYear(), dd._view.getMonth(), 1);
    renderCalendar(dd);

    dd.querySelectorAll('[data-nav]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var view = dd._view;
        dd._view = new Date(view.getFullYear(), view.getMonth() + Number(button.getAttribute('data-nav')), 1);
        renderCalendar(dd);
      });
    });

    dd.querySelectorAll('[data-quick]').forEach(function (button) {
      button.addEventListener('click', function () {
        var quick = button.getAttribute('data-quick');
        var day = null;
        if (quick !== 'clear') {
          day = new Date(today);
          day.setDate(day.getDate() + Number(quick));
        }
        pickDate(dd, input, day);
      });
    });
  }

  function initSide(dd) {
    var select = dd.querySelector('.dd-native');
    var options = Array.prototype.slice.call(dd.querySelectorAll('.dd-opt'));

    options.forEach(function (option, index) {
      option.addEventListener('click', function () {
        select.value = option.getAttribute('data-value');
        syncSide(dd);
        close(dd);
        select.dispatchEvent(new Event('change', { bubbles: true }));
        dd.querySelector('.dd-trigger').focus();
      });

      option.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          options[(index + 1) % options.length].focus();
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          options[(index - 1 + options.length) % options.length].focus();
        }
      });
    });
  }

  function init() {
    dropdowns = Array.prototype.slice.call(document.querySelectorAll('.dd[data-dd], .dd[data-dd-date]'));

    dropdowns.forEach(function (dd) {
      var input = dd.querySelector('.dd-native');
      var trigger = dd.querySelector('.dd-trigger');
      if (!input || !trigger) return;

      dd._title = dd.querySelector('.dd-title').textContent;
      dd._sub = dd.querySelector('.dd-sub').textContent;

      trigger.addEventListener('click', function () {
        var isOpen = dd.classList.contains('open');
        dropdowns.forEach(function (other) {
          if (other !== dd) close(other);
        });
        dd.classList.toggle('open', !isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));
        if (!isOpen && dd.classList.contains('dd-date')) renderCalendar(dd);
      });

      dd.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && dd.classList.contains('open')) {
          close(dd);
          trigger.focus();
        }
      });

      input.addEventListener('change', function () {
        sync(dd);
        if (dd.classList.contains('dd-date')) renderCalendar(dd);
      });

      if (dd.classList.contains('dd-date')) initDate(dd, input);
      else initSide(dd);

      sync(dd);
    });

    document.addEventListener('click', function (event) {
      dropdowns.forEach(function (dd) {
        if (!dd.contains(event.target)) close(dd);
      });
    });
  }

  global.WETDropdowns = { syncAll: syncAll };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
