export interface OrcamentoCategoria {
  id: string;
  nome: string;
  valorPrevisto: number;
}

export interface Obra {
  id: string;
  nome: string;
  orcamentoLimite: number;
  gastoAtual: number;
  categorias: OrcamentoCategoria[];
}

export interface Profissional {
  id: string;
  nome: string;
  categoria: string;
  chavePix?: string;
}

export type TipoLancamento = 'diaria' | 'empreitada';

export interface Lancamento {
  id: string;
  obraId: string;
  obraNome: string;
  profissionalId: string;
  profissional: string;
  categoria: string;
  categoriaOrcamentoId: string;
  categoriaOrcamentoNome: string;
  tipo: TipoLancamento;
  turnos: string[];
  valor: number;
  valorDiaria?: number;
  descricaoEtapa?: string;
  data: string;
  fotoUrl?: string;
}

export type Turno = 'Manhã' | 'Tarde' | 'Noite';

export const CATEGORIAS = ['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros'] as const;

export const CATEGORIAS_ORCAMENTO_SUGESTOES = [
  'Fundação', 'Alvenaria', 'Hidráulica', 'Elétrica', 'Pintura', 'Acabamento', 'Cobertura', 'Terraplanagem'
];

export const OBRAS_MOCK: Obra[] = [
  { id: '1', nome: 'Residencial Verde', orcamentoLimite: 50000, gastoAtual: 28500, categorias: [
    { id: 'c1', nome: 'Fundação', valorPrevisto: 15000 },
    { id: 'c2', nome: 'Alvenaria', valorPrevisto: 20000 },
    { id: 'c3', nome: 'Hidráulica', valorPrevisto: 15000 },
  ]},
  { id: '2', nome: 'Edifício Horizonte', orcamentoLimite: 120000, gastoAtual: 105000, categorias: [
    { id: 'c4', nome: 'Elétrica', valorPrevisto: 40000 },
    { id: 'c5', nome: 'Pintura', valorPrevisto: 30000 },
    { id: 'c6', nome: 'Acabamento', valorPrevisto: 50000 },
  ]},
  { id: '3', nome: 'Casa Modelo Sustentável', orcamentoLimite: 30000, gastoAtual: 12000, categorias: [
    { id: 'c7', nome: 'Fundação', valorPrevisto: 10000 },
    { id: 'c8', nome: 'Alvenaria', valorPrevisto: 20000 },
  ]},
];

export const PROFISSIONAIS_MOCK: Profissional[] = [
  { id: '1', nome: 'Carlos Silva', categoria: 'Pedreiro' },
  { id: '2', nome: 'Ana Rodrigues', categoria: 'Elétrica' },
  { id: '3', nome: 'Roberto Santos', categoria: 'Hidráulica' },
];
