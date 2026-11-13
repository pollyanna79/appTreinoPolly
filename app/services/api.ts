const API_URL = '/api';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  objetivo_id: number | null;
  foco_treino: WorkoutFocus | null;
  frequencia_semanal: number | null;
  dias_concluidos: number | null;
  fase_combo: number | null;
}

export type WorkoutFocus =
  | 'pernas-gluteos'
  | 'superiores-empurrar'
  | 'superiores-puxar'
  | 'abdomen-core'
  | 'corpo-inteiro';

export interface Objetivo {
  id: number;
  titulo: string;
  descricao: string;
}

export interface ExercicioTreino {
  id: number;
  nome: string;
  imagem: string;
  grupoMuscular: string;
  repeticoes: string;
  pesoSugerido: string;
}

export interface TreinoDia {
  id: number;
  diaSemana: number;
  nomeDia: string;
  exercicios: ExercicioTreino[];
}

export interface PlanoTreino {
  objetivo: string;
  focoTreino: WorkoutFocus;
  aerobico: string | null;
  frequenciaSemanal: number;
  fase: number;
  treinosNoCombo: number;
  treinoConcluidoHoje: boolean;
  diaAtual: string;
  treinoSelecionado: number;
  treinos: TreinoDia[];
}

export interface ProgressoTreino {
  dias_concluidos: number;
  fase_combo: number;
  faseAlterada: boolean;
  treinosNoCombo: number;
  message: string;
}

export interface Refeicao {
  id: number;
  refeicao: string;
  descricao: string;
  calorias_aprox: number | null;
  opcoes: OpcaoRefeicao[];
}

export interface OpcaoRefeicao {
  nivel: string;
  icone: string;
  titulo: string;
  descricao: string;
}

export interface PlanoAlimentar {
  objetivo: string;
  orientacaoObjetivo: string;
  refeicoes: Refeicao[];
  caloriasAproximadas: number;
  observacao: string;
}

async function request<T>(
  path: string,
  options: { method: 'GET' | 'POST'; body?: unknown },
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method,
      ...(options.body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options.body),
          }),
    });
  } catch {
    throw new Error(
      'Não foi possível conectar à API. Verifique se o servidor está em execução.',
    );
  }

  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof data.message === 'string'
          ? data.message
          : 'Não foi possível concluir a operação.';
    throw new Error(message);
  }

  return data as T;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body });

export const apiService = {
  login: (email: string, senha: string) =>
    post<Usuario>('/auth/login', { email, senha }),
  register: (nome: string, email: string, senha: string) =>
    post<{ message: string }>('/auth/register', { nome, email, senha }),
  resetPassword: (email: string, novaSenha: string) =>
    post<{ message: string }>('/auth/reset-password', { email, novaSenha }),
  listarObjetivos: () => request<Objetivo[]>('/objetivos', { method: 'GET' }),
  carregarTreino: (userId: number) =>
    request<PlanoTreino>(`/treino?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
    }),
  carregarAlimentacao: (userId: number) =>
    request<PlanoAlimentar>(
      `/alimentacao?userId=${encodeURIComponent(userId)}`,
      { method: 'GET' },
    ),
  salvarOnboarding: (
    userId: number,
    objetivoId: number,
    frequenciaSemanal: number,
    focoTreino: WorkoutFocus,
  ) =>
    post<{ message: string }>('/user/onboarding', {
      userId,
      objetivoId,
      frequenciaSemanal,
      focoTreino,
    }),
  concluirTreino: (userId: number, comboId: number) =>
    post<ProgressoTreino>('/treino/concluir', { userId, comboId }),
};
