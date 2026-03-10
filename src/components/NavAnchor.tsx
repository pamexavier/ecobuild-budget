interface NavAnchorProps {
  active: string;
  onNavigate: (section: string) => void;
}

const sections = [
  { id: 'lancamento', label: 'LANÇAMENTO' },
  { id: 'orcamento', label: 'ORÇAMENTO' },
  { id: 'relatorios', label: 'RELATÓRIOS' },
  { id: 'importar', label: 'IMPORTAR' },
];

export function NavAnchor({ active, onNavigate }: NavAnchorProps) {
  return (
    <nav className="sticky top-0 z-50 bg-background border-b-2 border-foreground">
      <div className="container flex">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onNavigate(s.id)}
            className={`flex-1 py-3 font-mono text-xs font-bold tracking-wider text-center transition-colors ${
              active === s.id
                ? 'bg-foreground text-background'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
