import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import KanbanApp from '@/components/KanbanApp';

interface ProjectData {
  project: string;
  lastUpdated: string;
  columns: string[];
  demands: {
    id: string;
    title: string;
    priority: string;
    status: string;
    description?: string;
    subtasks?: { id: string; text: string; done: boolean }[];
  }[];
  whatsapp?: string;
}

function getProjectData(): ProjectData | null {
  const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME;
  if (!projectName) return null;

  const dataPath = path.join(process.cwd(), 'clientes', projectName, 'data.json');
  if (!fs.existsSync(dataPath)) return null;

  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

export async function generateMetadata(): Promise<Metadata> {
  const data = getProjectData();
  return { title: data ? `Kanban — ${data.project}` : 'Kanban' };
}

export default function Home() {
  const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME;

  if (!projectName) {
    return (
      <main className="error-page">
        <div className="error-content">
          <div className="error-icon">⚠</div>
          <p className="error-title">Projeto não configurado</p>
          <p className="error-hint">
            Configure a variável de ambiente <code>NEXT_PUBLIC_PROJECT_NAME</code> no
            arquivo <code>.env.local</code> ou nas configurações do projeto na Vercel.
          </p>
        </div>
      </main>
    );
  }

  const data = getProjectData();

  if (!data) {
    return (
      <main className="error-page">
        <div className="error-content">
          <div className="error-icon">⚠</div>
          <p className="error-title">Projeto &ldquo;{projectName}&rdquo; não encontrado</p>
          <p className="error-hint">
            Verifique se a pasta <code>clientes/{projectName}/</code> existe e contém
            um <code>data.json</code>.
          </p>
        </div>
      </main>
    );
  }

  return <KanbanApp data={data} />;
}
