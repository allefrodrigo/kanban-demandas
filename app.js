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

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  init();
});
