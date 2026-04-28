import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearch } from "../../hooks/useSearch";

function makeLists() {
  return [
    {
      id: "l1",
      title: "Work",
      todos: [
        { id: "t1", text: "Finish report",    priority: "urgent", deadline: null, tags: [] },
        { id: "t2", text: "Reply to emails",  priority: "medium", deadline: null, tags: ["communication"] },
        { id: "t3", text: "Team meeting",     priority: "low",    deadline: null, done: true, tags: [] },
      ],
    },
    {
      id: "l2",
      title: "Personal",
      todos: [
        { id: "t4", text: "Buy groceries",    priority: "low",    deadline: null, tags: [] },
        { id: "t5", text: "Doctor appointment", priority: "urgent", deadline: "2024-12-01T10:00:00Z", tags: ["health"] },
      ],
    },
  ];
}

describe("useSearch", () => {
  it("returns empty results when query is empty", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    expect(result.current.searchResults).toHaveLength(0);
  });

  it("returns empty results when query is only whitespace", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("   "));
    expect(result.current.searchResults).toHaveLength(0);
  });

  it("finds tasks by partial text match", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("report"));
    expect(result.current.searchResults.some((r) => r.todo.id === "t1")).toBe(true);
  });

  it("is case-insensitive", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("GROCERIES"));
    expect(result.current.searchResults.some((r) => r.todo.id === "t4")).toBe(true);
  });

  it("matches tasks in lists whose title matches the query", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("personal"));
    // All todos in Personal list should appear
    const ids = result.current.searchResults.map((r) => r.todo.id);
    expect(ids).toContain("t4");
    expect(ids).toContain("t5");
  });

  it("matches by priority label", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("urgent"));
    const ids = result.current.searchResults.map((r) => r.todo.id);
    expect(ids).toContain("t1");
    expect(ids).toContain("t5");
  });

  it("matches by tag", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("health"));
    expect(result.current.searchResults.some((r) => r.todo.id === "t5")).toBe(true);
  });

  it("includes the list reference on each result", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("report"));
    const r = result.current.searchResults[0];
    expect(r.list).toBeDefined();
    expect(r.list.id).toBe("l1");
  });

  it("ranks exact matches above partial matches", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("finish report"));
    const ids = result.current.searchResults.map((r) => r.todo.id);
    expect(ids[0]).toBe("t1"); // exact text match scores highest
  });

  it("caps results at 30", () => {
    const bigList = {
      id: "l-big",
      title: "Big",
      todos: Array.from({ length: 50 }, (_, i) => ({
        id: `t${i}`,
        text: `task ${i}`,
        priority: "low",
        deadline: null,
        tags: [],
      })),
    };
    const { result } = renderHook(() => useSearch([bigList]));
    act(() => result.current.setSearchQuery("task"));
    expect(result.current.searchResults.length).toBeLessThanOrEqual(30);
  });

  it("clearSearch resets query and results", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("report"));
    expect(result.current.searchResults.length).toBeGreaterThan(0);

    act(() => result.current.clearSearch());
    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchResults).toHaveLength(0);
  });

  it("returns no results when query matches nothing", () => {
    const { result } = renderHook(() => useSearch(makeLists()));
    act(() => result.current.setSearchQuery("xyzzy_nomatch"));
    expect(result.current.searchResults).toHaveLength(0);
  });
});
