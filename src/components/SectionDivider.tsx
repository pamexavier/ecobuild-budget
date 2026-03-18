import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  icon?: LucideIcon;
}

export function SectionDivider({ title, icon: Icon }: Props) {
  return (
    <div className="flex items-center gap-3 pb-4">
      {Icon && (
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shadow-sm">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </div>
      )}
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <div className="h-0.5 w-16 bg-gradient-to-r from-primary/50 to-transparent rounded-full mt-1" />
      </div>
    </div>
  );
}
