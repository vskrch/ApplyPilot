interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  return (
    <header className="flex items-center justify-between pb-5 mb-6 border-b border-[#2a3447]">
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1 font-normal">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
