'use strict';

const COLUMN_CONFIG = {
  backlog:   { label: 'Backlog',      color: 'var(--col-backlog)' },
  analise:   { label: 'Em Análise',   color: 'var(--col-analise)' },
  andamento: { label: 'Trabalhando no Momento', color: 'var(--col-andamento)' },
  revisao:   { label: 'Em Revisão',   color: 'var(--col-revisao)' },
  concluido: { label: 'Concluído',    color: 'var(--col-concluido)' },
};

const PRIORITY_CONFIG = {
  alta:  { label: 'Alta',  cssVar: 'var(--priority-alta)' },
  media: { label: 'Média', cssVar: 'var(--priority-media)' },
  baixa: { label: 'Baixa', cssVar: 'var(--priority-baixa)' },
};

async function init() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderHeader(data);
    renderBoard(data);
  } catch (err) {
    document.getElementById('kanban-grid').innerHTML =
      `<p style="color:var(--priority-alta);font-family:var(--font-mono);padding:24px">
        Erro ao carregar data.json: ${err.message}
      </p>`;
  }
}

function renderHeader(data) {
  const nameEl = document.getElementById('project-name');
  const dateEl = document.getElementById('last-updated');
  if (nameEl) nameEl.textContent = data.project;
  if (dateEl) dateEl.textContent = formatDate(data.lastUpdated);
}

function renderBoard(data) {
  const grid = document.getElementById('kanban-grid');

  // Group demands by status
  const grouped = {};
  data.columns.forEach(id => (grouped[id] = []));
  data.demands.forEach(demand => {
    const col = demand.status;
    if (grouped[col]) grouped[col].push(demand);
    // Silently ignore demands with unknown status
  });

  data.columns.forEach(colId => {
    const config = COLUMN_CONFIG[colId] || { label: colId, color: '#4a5568' };
    const demands = grouped[colId] || [];
    grid.appendChild(buildColumn(colId, config, demands));
  });
}

function buildColumn(id, config, demands) {
  const col = document.createElement('div');
  col.className = 'kanban-col';
  col.style.setProperty('--col-color', config.color);
  col.setAttribute('role', 'listitem');
  col.setAttribute('aria-label', `Coluna: ${config.label}`);

  col.innerHTML = `
    <div class="col-header">
      <span class="col-title">${config.label}</span>
      <span class="col-count" aria-label="${demands.length} demandas">${demands.length}</span>
    </div>
    <div class="col-cards" id="col-${id}"></div>
  `;

  const cardsEl = col.querySelector('.col-cards');
  demands.forEach((demand, i) => {
    const card = buildCard(demand, id);
    card.style.animationDelay = `${0.1 + i * 0.06}s`;
    cardsEl.appendChild(card);
  });

  return col;
}

function buildCard(demand, colId) {
  const priority = PRIORITY_CONFIG[demand.priority] || { label: demand.priority, cssVar: '#888' };
  const total = demand.subtasks ? demand.subtasks.length : 0;
  const done = demand.subtasks ? demand.subtasks.filter(s => s.done).length : 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = total > 0 && done === total;
  const showTestingBadge = colId === 'andamento' && allDone;

  const card = document.createElement('article');
  card.className = 'card';
  card.style.setProperty('--priority-color', priority.cssVar);
  card.setAttribute('role', 'article');

  card.innerHTML = `
    <div class="card-top">
      <span class="card-id">#${demand.id}</span>
      <span class="priority-badge" title="Prioridade ${priority.label}">${priority.label}</span>
    </div>
    <h2 class="card-title">${demand.title}</h2>
    ${total > 0 ? buildProgress(done, total, pct, demand.subtasks) : ''}
    ${showTestingBadge ? '<div class="testing-badge">Essa tarefa está sendo testada</div>' : ''}
    <button class="expand-btn" aria-expanded="false" aria-controls="desc-${demand.id}">
      Ver detalhes
    </button>
    <div class="card-description" id="desc-${demand.id}" aria-hidden="true">
      ${demand.description || ''}
    </div>
  `;

  // Toggle description
  const btn = card.querySelector('.expand-btn');
  const desc = card.querySelector('.card-description');
  btn.addEventListener('click', () => {
    const isOpen = desc.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
    desc.setAttribute('aria-hidden', String(!isOpen));
    btn.textContent = isOpen ? 'Ocultar detalhes' : 'Ver detalhes';
  });

  return card;
}

function buildProgress(done, total, pct, subtasks) {
  const subtasksHTML = subtasks.map(s => `
    <li class="subtask ${s.done ? 'done' : ''}">
      <span class="subtask-check">${s.done ? '✓' : '○'}</span>
      <span>${s.text}</span>
    </li>
  `).join('');

  return `
    <div class="progress-wrap">
      <div class="progress-track" title="${pct}% concluído">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="progress-label">${done}/${total} subtarefas · ${pct}%</div>
    </div>
    <ul class="subtask-list">${subtasksHTML}</ul>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [datePart, timePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  const time = timePart ? ` às ${timePart}` : '';
  return `${d}/${m}/${y}${time}`;
}

// ─── Theme toggle ───────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  updateToggleIcon(btn);

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateToggleIcon(btn);
  });
}

function updateToggleIcon(btn) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  btn.textContent = isLight ? '☽' : '☀';
  btn.title = isLight ? 'Modo escuro' : 'Modo claro';
}

// ─── Demand form (multi-step) ────────────────────────────────
function initDemandForm() {
  const overlay = document.getElementById('demand-overlay');
  const openBtn = document.getElementById('open-demand');
  const closeBtn = document.getElementById('demand-close');
  const nextBtn = document.getElementById('step-next');
  const backBtn = document.getElementById('step-back');
  const progressFill = document.getElementById('dialog-progress-fill');

  const TOTAL_STEPS = 6;
  let current = 1;
  let selectedPriority = '';

  function showStep(n) {
    current = n;
    document.querySelectorAll('.dialog-step').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.step) === n);
    });
    backBtn.style.display = n > 1 ? '' : 'none';
    nextBtn.textContent = n === TOTAL_STEPS ? 'Enviar solicitação' : 'Próximo';
    progressFill.style.width = `${(n / TOTAL_STEPS) * 100}%`;

    if (n === TOTAL_STEPS) buildPreview();
  }

  function getValues() {
    return {
      title: document.getElementById('demand-title').value.trim(),
      problem: document.getElementById('demand-problem').value.trim(),
      expected: document.getElementById('demand-expected').value.trim(),
      link: document.getElementById('demand-link').value.trim(),
      priority: selectedPriority,
    };
  }

  function validate(step) {
    const v = getValues();
    if (step === 1 && !v.title) return 'Preencha o título.';
    if (step === 2 && !v.problem) return 'Descreva a situação atual.';
    if (step === 3 && !v.expected) return 'Descreva o comportamento esperado.';
    if (step === 5 && !v.priority) return 'Selecione a prioridade.';
    return null;
  }

  function buildPreview() {
    const v = getValues();
    const prioLabel = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[v.priority] || v.priority;
    const linkLine = v.link ? `<div class="preview-row"><span class="preview-key">Link:</span> <a href="${encodeURI(v.link)}" target="_blank" rel="noopener">${v.link}</a></div>` : '';
    document.getElementById('demand-preview').innerHTML = `
      <div class="preview-row"><span class="preview-key">Título:</span> ${v.title}</div>
      <div class="preview-row"><span class="preview-key">Problema:</span> ${v.problem}</div>
      <div class="preview-row"><span class="preview-key">Esperado:</span> ${v.expected}</div>
      ${linkLine}
      <div class="preview-row"><span class="preview-key">Prioridade:</span> ${prioLabel}</div>
    `;
  }

  function buildWhatsAppMessage() {
    const v = getValues();
    const prioLabel = { alta: 'Alta', media: 'Média', baixa: 'Baixa' }[v.priority] || v.priority;
    let msg = `*Nova Solicitação de Demanda*\n\n`;
    msg += `*Título:* ${v.title}\n\n`;
    msg += `*Situação atual:* ${v.problem}\n\n`;
    msg += `*Comportamento esperado:* ${v.expected}\n\n`;
    if (v.link) msg += `*Link:* ${v.link}\n\n`;
    msg += `*Prioridade:* ${prioLabel}`;
    return msg;
  }

  function resetForm() {
    document.getElementById('demand-title').value = '';
    document.getElementById('demand-problem').value = '';
    document.getElementById('demand-expected').value = '';
    document.getElementById('demand-link').value = '';
    selectedPriority = '';
    document.querySelectorAll('.priority-opt').forEach(b => b.classList.remove('selected'));
    showStep(1);
  }

  function open() { overlay.classList.add('open'); showStep(1); }
  function close() { overlay.classList.remove('open'); resetForm(); }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  document.getElementById('priority-options').addEventListener('click', e => {
    const btn = e.target.closest('.priority-opt');
    if (!btn) return;
    selectedPriority = btn.dataset.value;
    document.querySelectorAll('.priority-opt').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });

  nextBtn.addEventListener('click', () => {
    const err = validate(current);
    if (err) {
      nextBtn.classList.add('shake');
      setTimeout(() => nextBtn.classList.remove('shake'), 400);
      return;
    }
    if (current === TOTAL_STEPS) {
      const msg = buildWhatsAppMessage();
      const url = `https://wa.me/5584997069841?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      close();
      return;
    }
    showStep(current + 1);
  });

  backBtn.addEventListener('click', () => {
    if (current > 1) showStep(current - 1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  init();
  initDemandForm();
});
