export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 animate-pop-in">
      {Icon && (
        <div
          className="mb-4 w-14 h-14 rounded-2xl flex items-center justify-center animate-float"
          style={{ backgroundColor: "var(--accent-soft)" }}
        >
          <Icon size={24} style={{ color: "var(--accent)" }} strokeWidth={1.75} />
        </div>
      )}
      <p className="font-display text-lg font-medium mb-1">{title}</p>
      {subtitle && <p className="text-sm text-ink-muted max-w-xs mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}
