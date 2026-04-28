import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { useData, generateId, nextDeadline } from "../../hooks/useData";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeList(overrides = {}) {
  return {
    id: generateId(),
    title: "Test List",
    todos: [],
    archivedTodos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTodo(overrides = {}) {
  return {
    id: generateId(),
    text: "Test task",
    done: false,
    priority: "medium",
    deadline: null,
    recurrence: "none",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── generateId ────────────────────────────────────────────────────────────────

describe("generateId", () => {
  it("returns a non-empty string", () => {
    expect(typeof generateId()).toBe("string");
    expect(generateId().length).toBeGreaterThan(0);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

// ── nextDeadline ──────────────────────────────────────────────────────────────

describe("nextDeadline", () => {
  const base = "2024-06-15T09:00:00.000Z";

  it("returns null when recurrence is none", () => {
    expect(nextDeadline({ deadline: base, recurrence: "none" })).toBeNull();
  });

  it("returns null when no deadline", () => {
    expect(nextDeadline({ deadline: null, recurrence: "daily" })).toBeNull();
  });

  it("adds 1 day for daily recurrence", () => {
    const result = nextDeadline({ deadline: base, recurrence: "daily" });
    const diff   = new Date(result) - new Date(base);
    expect(diff).toBe(86400000); // 1 day in ms
  });

  it("adds 7 days for weekly recurrence", () => {
    const result = nextDeadline({ deadline: base, recurrence: "weekly" });
    const diff   = new Date(result) - new Date(base);
    expect(diff).toBe(7 * 86400000);
  });

  it("adds 1 month for monthly recurrence", () => {
    const result = nextDeadline({ deadline: base, recurrence: "monthly" });
    const next   = new Date(result);
    const orig   = new Date(base);
    expect(next.getMonth()).toBe(orig.getMonth() + 1);
    expect(next.getDate()).toBe(orig.getDate());
  });

  it("returns null for unknown recurrence type", () => {
    expect(nextDeadline({ deadline: base, recurrence: "hourly" })).toBeNull();
  });
});

// ── useData hook ──────────────────────────────────────────────────────────────

describe("useData", () => {
  const userId = "user-123";
  let snapshotCallback;

  beforeEach(() => {
    // Capture the onSnapshot callback so we can fire fake Firestore updates
    onSnapshot.mockImplementation((_, successCb, errorCb) => {
      snapshotCallback = successCb;
      return vi.fn(); // unsubscribe
    });
    setDoc.mockResolvedValue(undefined);
    deleteDoc.mockResolvedValue(undefined);
  });

  function fireSnapshot(docs) {
    snapshotCallback({
      docs: docs.map((d) => ({ id: d.id, data: () => d })),
    });
  }

  it("starts with empty lists and loading=false after mount", async () => {
    const { result } = renderHook(() => useData(userId));
    await act(async () => {});
    expect(result.current.lists).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("populates lists from Firestore snapshot", async () => {
    const { result } = renderHook(() => useData(userId));
    const list = makeList({ id: "l1", title: "Work" });

    await act(async () => { fireSnapshot([list]); });
    expect(result.current.lists).toHaveLength(1);
    expect(result.current.lists[0].title).toBe("Work");
  });

  it("saveList creates a new list with generated id", async () => {
    const { result } = renderHook(() => useData(userId));
    await act(async () => { fireSnapshot([]); });

    await act(async () => {
      const res = await result.current.saveList({ title: "Inbox" });
      expect(res).toBeNull(); // null = success
    });

    expect(setDoc).toHaveBeenCalled();
  });

  it("saveList rejects empty title", async () => {
    const { result } = renderHook(() => useData(userId));
    await act(async () => { fireSnapshot([]); });

    await act(async () => {
      const res = await result.current.saveList({ title: "  " });
      expect(res).toEqual({ error: "Title is required" });
    });
  });

  it("saveList rejects duplicate title (case-insensitive)", async () => {
    const { result } = renderHook(() => useData(userId));
    const list = makeList({ id: "l1", title: "Work" });
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      const res = await result.current.saveList({ title: "work" });
      expect(res).toEqual({ error: "A list with that name already exists" });
    });
  });

  it("allows updating a list title to its own name", async () => {
    const { result } = renderHook(() => useData(userId));
    const list = makeList({ id: "l1", title: "Work" });
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      const res = await result.current.saveList({ ...list, title: "Work" });
      expect(res).toBeNull();
    });
  });

  it("deleteList removes the list optimistically", async () => {
    const { result } = renderHook(() => useData(userId));
    const list = makeList({ id: "l1", title: "Work" });
    await act(async () => { fireSnapshot([list]); });
    expect(result.current.lists).toHaveLength(1);

    await act(async () => { await result.current.deleteList("l1"); });
    expect(result.current.lists).toHaveLength(0);
    expect(deleteDoc).toHaveBeenCalled();
  });

  it("saveTodo adds a todo to the correct list", async () => {
    const { result } = renderHook(() => useData(userId));
    const list = makeList({ id: "l1" });
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      await result.current.saveTodo("l1", { text: "Buy milk", done: false, priority: "low" });
    });

    const updated = result.current.lists.find((l) => l.id === "l1");
    expect(updated.todos).toHaveLength(1);
    expect(updated.todos[0].text).toBe("Buy milk");
    expect(updated.todos[0].id).toBeDefined();
    expect(updated.todos[0].createdAt).toBeDefined();
  });

  it("updateTodo moves non-recurring done task to archivedTodos", async () => {
    const todo = makeTodo({ id: "t1", recurrence: "none" });
    const list = makeList({ id: "l1", todos: [todo] });
    const { result } = renderHook(() => useData(userId));
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      await result.current.updateTodo("l1", "t1", { done: true });
    });

    const updated = result.current.lists.find((l) => l.id === "l1");
    expect(updated.todos).toHaveLength(0);
    expect(updated.archivedTodos).toHaveLength(1);
    expect(updated.archivedTodos[0].id).toBe("t1");
    expect(updated.archivedTodos[0].archivedAt).toBeDefined();
  });

  it("updateTodo creates next occurrence for recurring task", async () => {
    const deadline = new Date(Date.now() + 86400000).toISOString();
    const todo     = makeTodo({ id: "t1", recurrence: "daily", deadline });
    const list     = makeList({ id: "l1", todos: [todo] });
    const { result } = renderHook(() => useData(userId));
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      await result.current.updateTodo("l1", "t1", { done: true });
    });

    const updated = result.current.lists.find((l) => l.id === "l1");
    // Original should be archived
    expect(updated.archivedTodos.some((t) => t.id === "t1")).toBe(true);
    // A new todo should have been created
    expect(updated.todos).toHaveLength(1);
    expect(updated.todos[0].id).not.toBe("t1");
    expect(updated.todos[0].done).toBe(false);
  });

  it("unarchiveTodo moves task back to active todos", async () => {
    const archived = { ...makeTodo({ id: "t1" }), archivedAt: new Date().toISOString() };
    const list     = makeList({ id: "l1", archivedTodos: [archived] });
    const { result } = renderHook(() => useData(userId));
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      await result.current.unarchiveTodo("l1", "t1");
    });

    const updated = result.current.lists.find((l) => l.id === "l1");
    expect(updated.archivedTodos).toHaveLength(0);
    expect(updated.todos).toHaveLength(1);
    expect(updated.todos[0].done).toBe(false);
    expect(updated.todos[0].archivedAt).toBeUndefined();
  });

  it("deleteArchivedTodo removes from archivedTodos permanently", async () => {
    const archived = { ...makeTodo({ id: "t1" }), archivedAt: new Date().toISOString() };
    const list     = makeList({ id: "l1", archivedTodos: [archived] });
    const { result } = renderHook(() => useData(userId));
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      await result.current.deleteArchivedTodo("l1", "t1");
    });

    const updated = result.current.lists.find((l) => l.id === "l1");
    expect(updated.archivedTodos).toHaveLength(0);
  });

  it("deleteTodo removes from active todos without archiving", async () => {
    const todo = makeTodo({ id: "t1" });
    const list = makeList({ id: "l1", todos: [todo] });
    const { result } = renderHook(() => useData(userId));
    await act(async () => { fireSnapshot([list]); });

    await act(async () => {
      await result.current.deleteTodo("l1", "t1");
    });

    const updated = result.current.lists.find((l) => l.id === "l1");
    expect(updated.todos).toHaveLength(0);
    expect(updated.archivedTodos).toHaveLength(0);
  });

  it("sets syncStatus to error after two consecutive write failures", async () => {
    setDoc.mockRejectedValue(new Error("Firestore unavailable"));
    const { result } = renderHook(() => useData(userId));
    const list = makeList({ id: "l1" });
    await act(async () => { fireSnapshot([list]); });

    // First failure
    await act(async () => { await result.current.saveList({ title: "Fail 1" }); });
    // Second failure (retry also fails after timeout — we fast-forward)
    vi.useFakeTimers();
    await act(async () => { await result.current.saveList({ title: "Fail 2" }); });
    await act(async () => { vi.advanceTimersByTime(4000); });
    vi.useRealTimers();

    expect(result.current.syncStatus).toBe("error");
  });

  it("caches lists in localStorage after snapshot", async () => {
    const { result } = renderHook(() => useData(userId));
    const list = makeList({ id: "l1", title: "Cached" });
    await act(async () => { fireSnapshot([list]); });

    const cached = JSON.parse(localStorage.getItem(`lists-${userId}`));
    expect(cached).toHaveLength(1);
    expect(cached[0].title).toBe("Cached");
  });
});
