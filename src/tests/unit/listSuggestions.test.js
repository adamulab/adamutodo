import { describe, it, expect } from "vitest";
import {
  LIST_SUGGESTIONS,
  SUGGESTION_ICONS,
  filterSuggestions,
} from "../../utils/listSuggestions";

describe("LIST_SUGGESTIONS", () => {
  it("contains all 18 expected categories", () => {
    expect(LIST_SUGGESTIONS).toHaveLength(18);
  });

  it("includes key categories", () => {
    const required = ["Inbox", "Work", "Personal", "Goals", "Health & Fitness", "Finance"];
    for (const name of required) {
      expect(LIST_SUGGESTIONS).toContain(name);
    }
  });

  it("has no duplicate entries", () => {
    const unique = new Set(LIST_SUGGESTIONS);
    expect(unique.size).toBe(LIST_SUGGESTIONS.length);
  });
});

describe("SUGGESTION_ICONS", () => {
  it("has an icon for every suggestion", () => {
    for (const name of LIST_SUGGESTIONS) {
      expect(SUGGESTION_ICONS[name]).toBeDefined();
      expect(typeof SUGGESTION_ICONS[name]).toBe("string");
      expect(SUGGESTION_ICONS[name].length).toBeGreaterThan(0);
    }
  });

  it("icons are emoji strings (non-ASCII)", () => {
    for (const icon of Object.values(SUGGESTION_ICONS)) {
      // Emoji have code points above 127
      expect([...icon].some((c) => c.codePointAt(0) > 127)).toBe(true);
    }
  });
});

describe("filterSuggestions", () => {
  it("returns empty array for empty query", () => {
    expect(filterSuggestions("", [])).toHaveLength(0);
  });

  it("returns empty array for whitespace-only query", () => {
    expect(filterSuggestions("   ", [])).toHaveLength(0);
  });

  it("matches substring anywhere in the name", () => {
    const results = filterSuggestions("fit", []);
    expect(results).toContain("Health & Fitness");
  });

  it("is case-insensitive", () => {
    const upper = filterSuggestions("INBOX", []);
    const lower = filterSuggestions("inbox", []);
    expect(upper).toEqual(lower);
    expect(upper).toContain("Inbox");
  });

  it("excludes suggestions that already exist", () => {
    const results = filterSuggestions("work", ["Work", "Personal"]);
    expect(results).not.toContain("Work");
  });

  it("excludes existing titles case-insensitively", () => {
    const results = filterSuggestions("inbox", ["INBOX"]);
    expect(results).not.toContain("Inbox");
  });

  it("respects the limit parameter", () => {
    // 'a' matches many suggestions
    const results = filterSuggestions("a", [], 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("defaults to limit of 8", () => {
    const results = filterSuggestions("a", []);
    expect(results.length).toBeLessThanOrEqual(8);
  });

  it("returns multiple matching results", () => {
    const results = filterSuggestions("a", []);
    expect(results.length).toBeGreaterThan(1);
  });

  it("matches multi-word suggestions", () => {
    expect(filterSuggestions("daily", [])).toContain("Daily Tasks");
    expect(filterSuggestions("follow", [])).toContain("Waiting / Follow-ups");
    expect(filterSuggestions("errands", [])).toContain("Home & Errands");
  });

  it("returns empty array when all matches are already in existingTitles", () => {
    const results = filterSuggestions("inbox", ["Inbox"]);
    expect(results).toHaveLength(0);
  });
});
