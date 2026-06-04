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
  endereco?: string; // ← ADICIONAR ISSO (já estava, mas mantido como opcional para retrocompatibilidade)
  orcamentoLimite: number;
  gastoAtual: number;
  clienteId: string;
  clienteNome: string;
  tipoContrato: 'obra' | 'projeto';
  status?: 'ativa' | 'inativa' | 'em_andamento' | 'aprovado' | 'transformado_obra' | string;
  categorias?: any[];
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
  descricaoEtapa?: string;
  data: string;
  fornecedor?: string;        // NOVO
  comprovanteUrl?: string;    // NOVO
  contaPagarId?: string;
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
  tipo: 'parceiro' | 'fornecedor' | 'RT' | 'rt' | 'projeto' | 'obra' | string;
  descricao?: string;
  valorBase: number;
  percentual: number;
  valorComissao: number;
  status: 'pendente' | 'pago' | 'aguardando_rt' | string;
  dataLancamento: string;
  dataPagamento?: string;
  obraId?: string;
  obraNome?: string;
}

export interface ContaAReceber {
  id: string;
  obraId: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  status: 'aberto' | 'pago' | 'atrasado';
  dataPagamento?: Date;
  observacoes?: string;
}

// Adicione junto das outras interfaces (pode ser logo abaixo de ContaAReceber)
export interface ContaAPagar {
  id: string;
  obraId?: string;
  descricao: string;
  valor: number;
  dataVencimento: string | Date;
  status: 'aberto' | 'pago' | 'atrasado';
  dataPagamento?: string | Date;
  observacoes?: string;
}

// Modifique a interface Lancamento existente para incluir o novo campo
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
  descricaoEtapa?: string;
  data: string;
  fornecedor?: string;        
  comprovanteUrl?: string;    
  contaPagarId?: string; // NOVO: Vínculo com o financeiro
}


export type Turno = 'Manhã' | 'Tarde' | 'Noite';

export const CATEGORIAS = ['Pedreiro', 'Elétrica', 'Hidráulica', 'Pintura', 'Outros'] as const;

export const CATEGORIAS_ORCAMENTO_SUGESTOES = [
  'Fundação', 'Alvenaria', 'Hidráulica', 'Elétrica', 'Pintura', 'Acabamento', 'Cobertura', 'Terraplanagem'
];

export const OBRAS_MOCK: Obra[] = [];
export const PROFISSIONAIS_MOCK: Profissional[] = [];
