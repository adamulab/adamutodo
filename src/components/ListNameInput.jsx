import { useState, useRef, useEffect } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { filterSuggestions, SUGGESTION_ICONS } from "../utils/listSuggestions";

/**
 * Reusable list name input with suggestion dropdown.
 *
 * Props:
 *   value         string          controlled value
 *   onChange      (val) => void   called on every keystroke
 *   onSubmit      (title) => void called when user confirms (Enter / button / suggestion click)
 *   existingTitles string[]       list titles already in use (filtered from suggestions)
 *   error         string          validation error to show below input
 *   placeholder   string
 *   autoFocus     bool
 *   buttonLabel   string          text for submit button (hidden on small screens)
 *   className     string          extra classes on the wrapper div
 */
export default function ListNameInput({
  value,
  onChange,
  onSubmit,
  existingTitles = [],
  error = "",
  placeholder = "New list…",
  autoFocus = false,
  buttonLabel = "",
  showButton = true,
  className = "",
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const suggestions = filterSuggestions(value, existingTitles);

  // Keep highlight in bounds
  useEffect(() => {
    if (highlightIdx >= suggestions.length) setHighlightIdx(-1);
  }, [suggestions.length, highlightIdx]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setHighlightIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const confirm = (title) => {
    const t = (title ?? value).trim();
    if (!t) return;
    setShowDropdown(false);
    setHighlightIdx(-1);
    onSubmit(t);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setShowDropdown(true);
    setHighlightIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || !suggestions.length) {
      if (e.key === "Enter") {
        e.preventDefault();
        confirm();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIdx >= 0 && suggestions[highlightIdx]) {
        confirm(suggestions[highlightIdx]);
        onChange(suggestions[highlightIdx]);
      } else {
        confirm();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIdx(-1);
    }
  };

  const isOpen = showDropdown && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Input row */}
      <div className="relative">
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim()) setShowDropdown(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full pl-3 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            backgroundColor: "var(--surface-elevated)",
            border: error ? "1px solid #ef4444" : "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
        {showButton && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              confirm();
            }}
            disabled={!value.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all disabled:opacity-30"
            style={{
              backgroundColor: value.trim() ? "var(--primary)" : "transparent",
            }}
          >
            <Plus
              className="w-4 h-4"
              style={{
                color: value.trim()
                  ? "var(--text-inverse)"
                  : "var(--text-muted)",
              }}
            />
          </button>
        )}
      </div>

      {/* Validation error */}
      {error && (
        <p className="mt-1.5 text-xs flex items-center gap-1 text-red-400">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden shadow-2xl z-20"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Suggestions
          </p>
          {suggestions.map((name, idx) => (
            <button
              key={name}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(name);
                confirm(name);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              onMouseLeave={() => setHighlightIdx(-1)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors"
              style={{
                backgroundColor:
                  highlightIdx === idx ? "var(--surface-hover)" : "transparent",
                color: highlightIdx === idx ? "var(--primary)" : "var(--text)",
              }}
            >
              <span
                className="text-base leading-none shrink-0"
                aria-hidden="true"
              >
                {SUGGESTION_ICONS[name]}
              </span>
              <span className="truncate">{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
