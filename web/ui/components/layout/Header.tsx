interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
      {subtitle && (
        <p className="text-[var(--text-secondary)] mt-1">{subtitle}</p>
      )}
    </header>
  );
}
