export default function Footer() {
  return (
    <footer className="px-8 py-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <p>© 2026 TaskFlow. Built by AdamuCreates.</p>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-400 cursor-pointer transition-colors">
            Keyboard shortcuts
          </span>
          <span className="hover:text-slate-400 cursor-pointer transition-colors">
            Help
          </span>
        </div>
      </div>
    </footer>
  );
}
