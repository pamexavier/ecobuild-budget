export interface Obra {
  id: string;
  nome: string;
  orcamentoLimite: number;
  gastoAtual: number;
}

export interface Profissional {
  id: string;
  nome: string;
  categoria: string;
}

export interface Lancamento {
  id: string;
  obraId: string;
  obraNome: string;
  profissionalId: string;
  profissional: string;
  categoria: string;
  turnos: string[];
  valor: number;
  data: string;
  fotoUrl?: string;
}

export type Turno = 'Manhã' | 'Tarde' | 'Noite';

export const CATEGORIAS = ['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros'] as const;

export const OBRAS_MOCK: Obra[] = [
  { id: '1', nome: 'Residencial Verde', orcamentoLimite: 50000, gastoAtual: 28500 },
  { id: '2', nome: 'Edifício Horizonte', orcamentoLimite: 120000, gastoAtual: 105000 },
  { id: '3', nome: 'Casa Modelo Sustentável', orcamentoLimite: 30000, gastoAtual: 12000 },
];

export const PROFISSIONAIS_MOCK: Profissional[] = [
  { id: '1', nome: 'Carlos Silva', categoria: 'Pedreiro' },
  { id: '2', nome: 'Ana Rodrigues', categoria: 'Elétrica' },
  { id: '3', nome: 'Roberto Santos', categoria: 'Hidráulica' },
];
