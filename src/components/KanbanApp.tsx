'use client';

import { useState, useEffect } from 'react';

interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

interface Demand {
  id: string;
  title: string;
  priority: string;
  status: string;
  description?: string;
  subtasks?: Subtask[];
}

interface ProjectData {
  project: string;
  lastUpdated: string;
  columns: string[];
  demands: Demand[];
  whatsapp?: string;
}

const COLUMN_CONFIG: Record<string, { label: string; color: string }> = {
  backlog:   { label: 'Backlog',                color: 'var(--col-backlog)' },
  analise:   { label: 'Em Análise',             color: 'var(--col-analise)' },
  andamento: { label: 'Trabalhando no Momento', color: 'var(--col-andamento)' },
  revisao:   { label: 'Em Revisão',             color: 'var(--col-revisao)' },
  concluido: { label: 'Concluído',              color: 'var(--col-concluido)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; cssVar: string }> = {
  alta:  { label: 'Alta',  cssVar: 'var(--priority-alta)' },
  media: { label: 'Média', cssVar: 'var(--priority-media)' },
  baixa: { label: 'Baixa', cssVar: 'var(--priority-baixa)' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const [datePart, timePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  const time = timePart ? ` às ${timePart}` : '';
  return `${d}/${m}/${y}${time}`;
}

export default function KanbanApp({ data }: { data: ProjectData }) {
  const [theme, setTheme] = useState('dark');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark';
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Group demands by column
  const grouped: Record<string, Demand[]> = {};
  data.columns.forEach(id => (grouped[id] = []));
  data.demands.forEach(demand => {
    if (grouped[demand.status]) grouped[demand.status].push(demand);
  });

  return (
    <>
      <div className="noise-overlay" />

      {/* Header */}
      <header className="site-header">
        <div className="header-inner">
          <div className="header-brand">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
            >
              {theme === 'light' ? '☽' : '☀'}
            </button>
            <h1 className="project-name">{data.project}</h1>
          </div>
          <div className="header-center">
            <span className="meta-label">Atualizado em</span>
            <span className="meta-value">{formatDate(data.lastUpdated)}</span>
          </div>
          <div className="header-actions">
            <button
              className="demand-btn"
              onClick={() => setDialogOpen(true)}
              title="Solicitar demanda"
            >
              + Solicitar
            </button>
          </div>
        </div>
      </header>

      {/* Board */}
      <main className="board-wrapper">
        <div className="kanban-grid" role="list" aria-label="Quadro de demandas">
          {data.columns.map(colId => {
            const config = COLUMN_CONFIG[colId] || { label: colId, color: '#4a5568' };
            const demands = grouped[colId] || [];
            return (
              <div
                key={colId}
                className="kanban-col"
                style={{ '--col-color': config.color } as React.CSSProperties}
                role="listitem"
                aria-label={`Coluna: ${config.label}`}
              >
                <div className="col-header">
                  <span className="col-title">{config.label}</span>
                  <span className="col-count" aria-label={`${demands.length} demandas`}>
                    {demands.length}
                  </span>
                </div>
                <div className="col-cards">
                  {demands.length === 0 && (
                    <div className="col-empty">Nenhuma demanda</div>
                  )}
                  {demands.map((demand, i) => {
                    const priority = PRIORITY_CONFIG[demand.priority] || { label: demand.priority, cssVar: '#888' };
                    const total = demand.subtasks?.length || 0;
                    const done = demand.subtasks?.filter(s => s.done).length || 0;
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    const allDone = total > 0 && done === total;
                    const showTestingBadge = colId === 'andamento' && allDone;
                    const isExpanded = expandedCards.has(demand.id);

                    return (
                      <article
                        key={demand.id}
                        className="card"
                        style={{
                          '--priority-color': priority.cssVar,
                          animationDelay: `${0.1 + i * 0.06}s`,
                        } as React.CSSProperties}
                      >
                        <div className="card-top">
                          <span className="card-id">#{demand.id}</span>
                          <span className="priority-badge" title={`Prioridade ${priority.label}`}>
                            {priority.label}
                          </span>
                        </div>
                        <h2 className="card-title">{demand.title}</h2>

                        {total > 0 && (
                          <>
                            <div className="progress-wrap">
                              <div className="progress-track" title={`${pct}% concluído`}>
                                <div className="progress-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="progress-label">
                                {done}/{total} subtarefas · {pct}%
                              </div>
                            </div>
                            <ul className="subtask-list">
                              {demand.subtasks!.map(s => (
                                <li key={s.id} className={`subtask${s.done ? ' done' : ''}`}>
                                  <span className="subtask-check">{s.done ? '✓' : '○'}</span>
                                  <span>{s.text}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {showTestingBadge && (
                          <div className="testing-badge">Essa tarefa está sendo testada</div>
                        )}

                        <button
                          className="expand-btn"
                          aria-expanded={isExpanded}
                          aria-controls={`desc-${demand.id}`}
                          onClick={() => toggleCard(demand.id)}
                        >
                          {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </button>
                        <div
                          className={`card-description${isExpanded ? ' open' : ''}`}
                          id={`desc-${demand.id}`}
                          aria-hidden={!isExpanded}
                        >
                          {demand.description || ''}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Demand Dialog */}
      <DemandDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        whatsapp={data.whatsapp || '5584997069841'}
      />
    </>
  );
}

/* ─── Demand Dialog ─────────────────────────────────────────── */

const PRIO_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

function DemandDialog({
  open,
  onClose,
  whatsapp,
}: {
  open: boolean;
  onClose: () => void;
  whatsapp: string;
}) {
  const TOTAL_STEPS = 6;
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [expected, setExpected] = useState('');
  const [link, setLink] = useState('');
  const [priority, setPriority] = useState('');
  const [shaking, setShaking] = useState(false);

  const reset = () => {
    setStep(1);
    setTitle('');
    setProblem('');
    setExpected('');
    setLink('');
    setPriority('');
  };

  const close = () => {
    onClose();
    reset();
  };

  const validate = (s: number) => {
    if (s === 1 && !title) return false;
    if (s === 2 && !problem) return false;
    if (s === 3 && !expected) return false;
    if (s === 5 && !priority) return false;
    return true;
  };

  const handleNext = () => {
    if (!validate(step)) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      return;
    }
    if (step === TOTAL_STEPS) {
      const prioLabel = PRIO_LABELS[priority] || priority;
      let msg = `*Nova Solicitação de Demanda*\n\n`;
      msg += `*Título:* ${title}\n\n`;
      msg += `*Situação atual:* ${problem}\n\n`;
      msg += `*Comportamento esperado:* ${expected}\n\n`;
      if (link) msg += `*Link:* ${link}\n\n`;
      msg += `*Prioridade:* ${prioLabel}`;
      window.open(
        `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`,
        '_blank',
      );
      close();
      return;
    }
    setStep(step + 1);
  };

  return (
    <div
      className={`dialog-overlay${open ? ' open' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="dialog">
        <div className="dialog-header">
          <span className="dialog-title">Solicitar Demanda</span>
          <button className="dialog-close" onClick={close}>
            &times;
          </button>
        </div>
        <div className="dialog-progress">
          <div
            className="dialog-progress-fill"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <div className="dialog-steps">
          {step === 1 && (
            <div className="dialog-step">
              <label className="step-label">Qual o título da solicitação?</label>
              <p className="step-hint">Um nome curto que resuma o pedido.</p>
              <input
                type="text"
                className="step-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Cadastro de alunos do 9º ano"
              />
            </div>
          )}
          {step === 2 && (
            <div className="dialog-step">
              <label className="step-label">O que está acontecendo?</label>
              <p className="step-hint">Descreva a situação atual ou o problema encontrado.</p>
              <textarea
                className="step-textarea"
                value={problem}
                onChange={e => setProblem(e.target.value)}
                placeholder="Ex: Os alunos não conseguem finalizar o cadastro porque..."
              />
            </div>
          )}
          {step === 3 && (
            <div className="dialog-step">
              <label className="step-label">O que deveria acontecer?</label>
              <p className="step-hint">Descreva o comportamento esperado ou a melhoria desejada.</p>
              <textarea
                className="step-textarea"
                value={expected}
                onChange={e => setExpected(e.target.value)}
                placeholder="Ex: O sistema deveria permitir que..."
              />
            </div>
          )}
          {step === 4 && (
            <div className="dialog-step">
              <label className="step-label">Tem um link de onde acontece?</label>
              <p className="step-hint">Opcional. Cole a URL da página onde o problema ocorre.</p>
              <input
                type="url"
                className="step-input"
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
          {step === 5 && (
            <div className="dialog-step">
              <label className="step-label">Qual a prioridade?</label>
              <p className="step-hint">Escolha o nível de urgência dessa solicitação.</p>
              <div className="priority-options">
                {(['alta', 'media', 'baixa'] as const).map(p => (
                  <button
                    key={p}
                    className={`priority-opt${priority === p ? ' selected' : ''}`}
                    data-value={p}
                    onClick={() => setPriority(p)}
                  >
                    {PRIO_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 6 && (
            <div className="dialog-step">
              <label className="step-label">Confira sua solicitação</label>
              <div className="demand-preview">
                <div className="preview-row">
                  <span className="preview-key">Título:</span> {title}
                </div>
                <div className="preview-row">
                  <span className="preview-key">Problema:</span> {problem}
                </div>
                <div className="preview-row">
                  <span className="preview-key">Esperado:</span> {expected}
                </div>
                {link && (
                  <div className="preview-row">
                    <span className="preview-key">Link:</span>{' '}
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      {link}
                    </a>
                  </div>
                )}
                <div className="preview-row">
                  <span className="preview-key">Prioridade:</span>{' '}
                  {PRIO_LABELS[priority] || priority}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="dialog-footer">
          {step > 1 && (
            <button className="dialog-btn secondary" onClick={() => setStep(step - 1)}>
              Voltar
            </button>
          )}
          <button
            className={`dialog-btn primary${shaking ? ' shake' : ''}`}
            onClick={handleNext}
          >
            {step === TOTAL_STEPS ? 'Enviar solicitação' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
