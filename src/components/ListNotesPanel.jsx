import { useState, useEffect, useRef, useCallback } from "react";
import { FileText, Save, CheckCircle2, Link, ChevronDown, ChevronUp } from "lucide-react";

const DEBOUNCE_MS = 1200; // save 1.2 s after user stops typing

/**
 * Per-list plain-text notes panel.
 *
 * Features:
 *  - Auto-saves with a debounce — no explicit save button needed
 *  - Shows a "Saved" indicator after each successful save
 *  - Detects URLs in the text and renders them as clickable links in preview mode
 *  - Collapsible so it doesn't crowd the task list
 *
 * Props:
 *  listId        string
 *  initialNotes  string   — current notes value from Firestore
 *  onSave        (listId, notes) => Promise<void>
 */
export default function ListNotesPanel({ listId, initialNotes = "", onSave }) {
  const [notes, setNotes]         = useState(initialNotes);
  const [isOpen, setIsOpen]       = useState(!!initialNotes); // open if there are notes
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved"
  const [isEditing, setIsEditing] = useState(false);

  const debounceRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync if the list changes (user navigates between lists)
  useEffect(() => {
    setNotes(initialNotes);
    setSaveState("idle");
    setIsOpen(!!initialNotes);
    setIsEditing(false);
  }, [listId, initialNotes]);

  const triggerSave = useCallback(
    (value) => {
      clearTimeout(debounceRef.current);
      setSaveState("saving");
      debounceRef.current = setTimeout(async () => {
        await onSave(listId, value);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }, DEBOUNCE_MS);
    },
    [listId, onSave],
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setNotes(value);
    triggerSave(value);
  };

  // Auto-resize textarea
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  useEffect(() => {
    if (isEditing) adjustHeight();
  }, [notes, isEditing]);

  // Cleanup debounce on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  // Render URLs as links in preview
  const renderPreview = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts    = text.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline break-all"
          style={{ color: "var(--primary)" }}
          onClick={(e) => e.stopPropagation()}>
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  return (
    <div className="border-t mt-4" style={{ borderColor: "var(--border)" }}>
      {/* ── Header ── */}
      <button
        onClick={() => { setIsOpen((v) => !v); if (!isOpen) setIsEditing(false); }}
        className="w-full flex items-center gap-2 py-3 text-left group transition-colors"
      >
        <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
        <span className="text-sm font-semibold flex-1" style={{ color: "var(--text-muted)" }}>
          Notes
        </span>

        {/* Save status indicator */}
        {saveState === "saving" && (
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <Save className="w-3 h-3 animate-pulse" />
            Saving…
          </span>
        )}
        {saveState === "saved" && (
          <span className="text-xs flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Saved
          </span>
        )}
        {notes && saveState === "idle" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--surface-elevated)", color: "var(--text-muted)" }}>
            {notes.split("\n").filter(Boolean).length} line{notes.split("\n").filter(Boolean).length !== 1 ? "s" : ""}
          </span>
        )}

        <span style={{ color: "var(--text-muted)" }}>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* ── Body ── */}
      {isOpen && (
        <div className="pb-4">
          {isEditing ? (
            /* Edit mode — plain textarea */
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={handleChange}
              onBlur={() => { if (!notes.trim()) setIsEditing(false); }}
              placeholder="Add notes, links, or a brief for this list…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none leading-relaxed transition-all"
              style={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--primary)",
                color: "var(--text)",
                minHeight: "80px",
                maxHeight: "320px",
                boxShadow: "0 0 0 3px var(--primary-muted)",
              }}
              onInput={adjustHeight}
              autoFocus
            />
          ) : (
            /* Preview mode — click to edit */
            <div
              onClick={() => setIsEditing(true)}
              className="px-3 py-2.5 rounded-xl text-sm leading-relaxed cursor-text transition-all min-h-[44px]"
              style={{
                backgroundColor: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                color: notes ? "var(--text)" : "var(--text-muted)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              {notes ? renderPreview(notes) : "Add notes, links, or a brief for this list…"}
            </div>
          )}

          {/* Hint */}
          <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {isEditing
              ? "Auto-saves as you type · URLs become clickable links"
              : "Click to edit"}
          </p>
        </div>
      )}
    </div>
  );
}
