export function SectionDivider({ title }: { title: string }) {
  return (
    <div className="border-t-4 border-foreground pt-6 pb-2">
      <h2 className="font-mono text-lg font-bold tracking-wider uppercase">{title}</h2>
    </div>
  );
}
