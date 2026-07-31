interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#2a3447]">
      <div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">{title}</h2>
        {description && (
          <p className="text-xs text-slate-400 mt-1 font-normal">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
