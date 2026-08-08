import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, ShoppingCart, StickyNote, Check } from "lucide-react";
import EmptyState from "./EmptyState";

const SHOPPING_CATEGORIES = ["groceries", "pharmacy", "hardware", "office", "other"];

function NotesTab({ notes, onAdd, onDelete }) {
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim() });
    setText("");
  };

  return (
    <>
      <form onSubmit={submit} className="flex gap-2 mb-5">
        <div className="flex-1 card rounded-xl px-3.5 py-2.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Quick note — buy milk, call electrician…"
            className="input-quiet text-sm"
            aria-label="New note"
          />
        </div>
        <button type="submit" className="btn-accent shrink-0" disabled={!text.trim()}>
          <Plus size={16} />
        </button>
      </form>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" subtitle="Jot down anything you don't want to forget." />
      ) : (
        <AnimatePresence initial={false}>
          {notes.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-hover transition-colors"
            >
              <StickyNote size={15} className="mt-0.5 shrink-0 text-ink-faint" />
              <p className="text-sm flex-1">{n.text}</p>
              <button
                onClick={() => onDelete(n.id)}
                aria-label="Delete note"
                className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 text-ink-faint hover:text-rose transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </>
  );
}

function ShoppingTab({ items, onAdd, onToggle, onDelete, onClearChecked }) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("groceries");

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), category });
    setText("");
  };

  const grouped = SHOPPING_CATEGORIES.map((c) => ({ category: c, items: items.filter((i) => i.category === c) })).filter(
    (g) => g.items.length > 0,
  );
  const checkedCount = items.filter((i) => i.done).length;

  return (
    <>
      <form onSubmit={submit} className="mb-5">
        <div className="card rounded-xl px-3.5 py-2.5 mb-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add an item…"
            className="input-quiet text-sm"
            aria-label="New shopping item"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SHOPPING_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className="chip text-xs border capitalize transition-all"
              style={{
                borderColor: category === c ? "var(--ink-faint)" : "var(--line)",
                backgroundColor: category === c ? "var(--surface-hover)" : "transparent",
              }}
            >
              {c}
            </button>
          ))}
          <button type="submit" className="btn-accent !py-1.5 !px-3 text-xs ml-auto" disabled={!text.trim()}>
            <Plus size={14} /> Add
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Shopping list is empty" subtitle="Plan tomorrow's purchases — groceries, pharmacy, hardware, anything." />
      ) : (
        <>
          {grouped.map(({ category: cat, items: catItems }) => (
            <section key={cat} className="mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-faint px-3 mb-1 capitalize">{cat}</h3>
              <AnimatePresence initial={false}>
                {catItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-hover transition-colors cursor-pointer"
                    onClick={() => onToggle(item.id)}
                  >
                    <span
                      className="w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center shrink-0 transition-all"
                      style={{
                        borderColor: item.done ? "var(--accent)" : "var(--ink-faint)",
                        backgroundColor: item.done ? "var(--accent)" : "transparent",
                      }}
                    >
                      {item.done && <Check size={12} strokeWidth={3} color="#fff" />}
                    </span>
                    <span
                      className="text-sm flex-1"
                      style={{
                        color: item.done ? "var(--ink-faint)" : "var(--ink)",
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      aria-label="Delete item"
                      className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 text-ink-faint hover:text-rose transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>
          ))}
          {checkedCount > 0 && (
            <button onClick={onClearChecked} className="btn-ghost text-xs w-full">
              Clear {checkedCount} checked item{checkedCount > 1 ? "s" : ""}
            </button>
          )}
        </>
      )}
    </>
  );
}

export default function NotesShoppingView({ notes, shoppingItems, onAddNote, onDeleteNote, onAddItem, onToggleItem, onDeleteItem, onClearChecked }) {
  const [tab, setTab] = useState("notes");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-28 pt-6 sm:pt-10">
      <header className="mb-6">
        <p className="text-sm text-ink-muted mb-1">Capture it before you forget</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold">Notes &amp; Shopping</h1>
      </header>

      <div className="flex gap-1.5 mb-5 p-1 rounded-full w-fit" style={{ backgroundColor: "var(--surface-hover)" }}>
        {[
          { id: "notes", label: "Notes", icon: StickyNote },
          { id: "shopping", label: "Shopping", icon: ShoppingCart },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all"
            style={{
              backgroundColor: tab === id ? "var(--surface)" : "transparent",
              color: tab === id ? "var(--ink)" : "var(--ink-faint)",
              boxShadow: tab === id ? "0 1px 2px var(--shadow-1)" : "none",
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === "notes" ? (
        <NotesTab notes={notes} onAdd={onAddNote} onDelete={onDeleteNote} />
      ) : (
        <ShoppingTab items={shoppingItems} onAdd={onAddItem} onToggle={onToggleItem} onDelete={onDeleteItem} onClearChecked={onClearChecked} />
      )}
    </div>
  );
}
