export default function Footer() {
  return (
    <footer className="px-8 py-4 border-t border-[var(--border)] bg-[var(--surface)]/50 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <p>
          © 2026 TaskFlow. Built by{" "}
          <a href="https://adamucreates.online">AdamuCreates.</a>
        </p>
        <div className="flex items-center gap-4">
          <span className="hover:text-[var(--text)] cursor-pointer transition-colors">
            Keyboard shortcuts
          </span>
          <span className="hover:text-[var(--text)] cursor-pointer transition-colors">
            Help
          </span>
        </div>
      </div>
    </footer>
  );
}
