import { useState, useMemo } from 'react';

interface Props {
  clientes: any[];
  obras: any[];
  projetos: any[];
  onFilterChange: (filtros: {
    clienteId: string | null;
    empreendimentoId: string | null;
    tipo: string | null;
    tipoEmpreendimento: 'obra' | 'projeto' | 'ambos';
  }) => void;
}

const formatarNome = (nome: string) => {
  return nome
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function FiltrosDashboard({ clientes, obras, projetos, onFilterChange }: Props) {
  const [clienteId, setClienteId] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [listaClientesAberta, setListaClientesAberta] = useState(false);
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [tipo, setTipo] = useState('');
  const [tipoEmpreendimento, setTipoEmpreendimento] = useState<'obra' | 'projeto' | 'ambos'>('ambos');

  const clientesFiltrados = useMemo(() => {
    return [...clientes]
      .map(cliente => ({ ...cliente, nome: formatarNome(cliente.nome || '') }))
      .filter(cliente => cliente.nome.toLowerCase().includes(buscaCliente.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clientes, buscaCliente]);

  // Filtrar obras/projetos do cliente selecionado
  const obrasDoCliente = useMemo(() => {
    if (!clienteId) return [];
    return obras.filter(obra => obra.clienteId === clienteId);
  }, [clienteId, obras]);
  const projetosDoCliente = useMemo(() => {
    if (!clienteId) return [];
    return projetos.filter(proj => proj.clienteId === clienteId);
  }, [clienteId, projetos]);

  // Lista combinada conforme filtro
  const empreendimentosFiltrados = useMemo(() => {
    if (!clienteId) return [];
    if (tipoEmpreendimento === 'obra') return obrasDoCliente.map(o => ({ ...o, tipo: 'obra' }));
    if (tipoEmpreendimento === 'projeto') return projetosDoCliente.map(p => ({ ...p, tipo: 'projeto' }));
    // ambos
    return [
      ...obrasDoCliente.map(o => ({ ...o, tipo: 'obra' })),
      ...projetosDoCliente.map(p => ({ ...p, tipo: 'projeto' })),
    ];
  }, [clienteId, obrasDoCliente, projetosDoCliente, tipoEmpreendimento]);

  // Quando cliente muda, reseta empreendimento
  const handleClienteChange = (newClienteId: string, nomeCliente = '') => {
    setClienteId(newClienteId);
    setBuscaCliente(nomeCliente);
    setListaClientesAberta(false);
    setEmpreendimentoId('');
    onFilterChange({
      clienteId: newClienteId || null,
      empreendimentoId: null,
      tipo: tipo || null,
      tipoEmpreendimento,
    });
  };

  // Quando empreendimento muda
  const handleEmpreendimentoChange = (newEmpId: string) => {
    setEmpreendimentoId(newEmpId);
    onFilterChange({
      clienteId: clienteId || null,
      empreendimentoId: newEmpId || null,
      tipo: tipo || null,
      tipoEmpreendimento,
    });
  };

  // Quando tipo de empreendimento muda
  const handleTipoEmpreendimentoChange = (newTipo: 'obra' | 'projeto' | 'ambos') => {
    setTipoEmpreendimento(newTipo);
    setEmpreendimentoId('');
    onFilterChange({
      clienteId: clienteId || null,
      empreendimentoId: null,
      tipo: tipo || null,
      tipoEmpreendimento: newTipo,
    });
  };

  // Quando tipo muda
  const handleTipoChange = (newTipo: string) => {
    setTipo(newTipo);
    onFilterChange({
      clienteId: clienteId || null,
      empreendimentoId: empreendimentoId || null,
      tipo: newTipo || null,
      tipoEmpreendimento,
    });
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {/* Filtro: Cliente */}
      <div className="relative w-full max-w-xs print:hidden">
        <input
          type="text"
          value={buscaCliente}
          placeholder="Buscar cliente"
          onChange={e => {
            const value = e.target.value;
            setBuscaCliente(value);
            setListaClientesAberta(true);
            if (clienteId || !value) {
              setClienteId('');
              setEmpreendimentoId('');
              onFilterChange({
                clienteId: null,
                empreendimentoId: null,
                tipo: tipo || null,
                tipoEmpreendimento,
              });
            }
          }}
          onFocus={() => setListaClientesAberta(true)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-bold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
        />

        {listaClientesAberta && buscaCliente.length > 0 && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-white/[0.08] bg-background shadow-xl">
            {clientesFiltrados.length > 0 ? clientesFiltrados.map(cliente => (
              <button
                key={cliente.id}
                type="button"
                className="w-full px-4 py-2 text-left text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary"
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleClienteChange(cliente.id, cliente.nome)}
              >
                {cliente.nome}
              </button>
            )) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum cliente encontrado</div>
            )}
          </div>
        )}
      </div>

      {/* Filtro: Tipo de Empreendimento */}
      <select
        value={tipoEmpreendimento}
        onChange={e => handleTipoEmpreendimentoChange(e.target.value as 'obra' | 'projeto' | 'ambos')}
        disabled={!clienteId}
        className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="ambos">Obras e Projetos</option>
        <option value="obra">Só Obras</option>
        <option value="projeto">Só Projetos</option>
      </select>

      {/* Filtro: Empreendimento (obra/projeto) */}
      <select
        value={empreendimentoId}
        onChange={e => handleEmpreendimentoChange(e.target.value)}
        disabled={!clienteId || empreendimentosFiltrados.length === 0}
        className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">
          {clienteId ? (tipoEmpreendimento === 'obra' ? 'Todas as obras' : tipoEmpreendimento === 'projeto' ? 'Todos os projetos' : 'Todas as obras/projetos') : '— Selecione cliente —'}
        </option>
        {empreendimentosFiltrados.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.nome} {emp.tipo === 'obra' ? '(Obra)' : '(Projeto)'}
          </option>
        ))}
      </select>

      {/* Filtro: Tipo (sempre habilitado) */}
      <select
        value={tipo}
        onChange={e => handleTipoChange(e.target.value)}
        className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos os tipos</option>
        <option value="diaria">Diária</option>
        <option value="empreitada">Empreitada</option>
      </select>
    </div>
  );
}
