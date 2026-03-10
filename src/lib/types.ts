export interface Obra {
  id: string;
  nome: string;
  orcamentoLimite: number;
  gastoAtual: number;
}

export interface Lancamento {
  id: string;
  obraId: string;
  obraNome: string;
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
  { id: '1', nome: 'OBRA 01 — RESIDENCIAL VERDE', orcamentoLimite: 50000, gastoAtual: 28500 },
  { id: '2', nome: 'OBRA 02 — EDIFÍCIO HORIZONTE', orcamentoLimite: 120000, gastoAtual: 105000 },
  { id: '3', nome: 'OBRA 03 — CASA MODELO', orcamentoLimite: 30000, gastoAtual: 12000 },
];
