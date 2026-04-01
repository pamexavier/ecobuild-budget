export interface OrcamentoCategoria {
  id: string;
  nome: string;
  valorPrevisto: number;
}

export interface Cliente {
  id: string;
  nome: string;
  razaoSocial?: string;
  cpfCnpj?: string;
  contato?: string;
}

export type TipoContrato = 'projeto' | 'obra' | 'consultoria';

export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  projeto: 'Projeto',
  obra: 'Reforma / Obra',
  consultoria: 'Consultoria / Acompanhamento',
};

export interface Obra {
  id: string;
  nome: string;
  orcamentoLimite: number;
  gastoAtual: number;
  categorias: OrcamentoCategoria[];
  clienteId?: string;
  clienteNome?: string;
  tipoContrato: TipoContrato;
}

export interface Profissional {
  id: string;
  nome: string;
  categoria: string;
  chavePix?: string;
  tipoChavePix?: string;
  documento?: string;
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

/** Tipo simplificado para inserções em massa (importação) */
export interface LancamentoInsert {
  obraId: string;
  profissionalId: string;
  valor: number;
  data: string;
  tipo: TipoLancamento;
  turnos: string[];
}

export interface Parceiro {
  id: string;
  nome: string;
  comissaoProjetoPct: number;
  comissaoObraPct: number;
  comissaoRtPct: number;
}

export interface Comissao {
  id: string;
  parceiroId: string;
  parceiroNome?: string;
  tipo: 'projeto' | 'obra' | 'rt';
  descricao?: string;
  valorBase: number;
  percentual: number;
  valorComissao: number;
  status: 'pendente' | 'pago';
  dataLancamento: string;
  dataPagamento?: string;
  obraId?: string;
  obraNome?: string;
}

export type Turno = 'Manhã' | 'Tarde' | 'Noite';

export const CATEGORIAS = ['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros'] as const;

export const CATEGORIAS_ORCAMENTO_SUGESTOES = [
  'Fundação', 'Alvenaria', 'Hidráulica', 'Elétrica', 'Pintura', 'Acabamento', 'Cobertura', 'Terraplanagem'
];

export const OBRAS_MOCK: Obra[] = [];
export const PROFISSIONAIS_MOCK: Profissional[] = [];
