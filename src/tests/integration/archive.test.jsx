import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { useData } from "../../hooks/useData";

// ── helpers ───────────────────────────────────────────────────────────────────

const USER_ID = "test-user-archive";

function makeList(overrides = {}) {
  return {
    id: "list-1",
    title: "Work",
    todos: [],
    archivedTodos: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeTodo(overrides = {}) {
  return {
    id: `todo-${Date.now()}-${Math.random()}`,
    text: "Test task",
    done: false,
    priority: "medium",
    deadline: null,
    recurrence: "none",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Sets up onSnapshot to capture the callback so we can simulate Firestore updates
function setupSnapshot() {
  let callback;
  onSnapshot.mockImplementation((_, cb) => {
    callback = cb;
    return vi.fn(); // unsubscribe noop
  });
  const fire = (docs) =>
    callback({
      docs: docs.map((d) => ({ id: d.id, data: () => d })),
    });
  return { fire };
}

// ── Archive flow via useData ──────────────────────────────────────────────────

describe("Archive flow — useData", () => {
  let fire;

  beforeEach(() => {
    ({ fire } = setupSnapshot());
    setDoc.mockResolvedValue(undefined);
    deleteDoc.mockResolvedValue(undefined);
  });

  it("moves a non-recurring done task from todos to archivedTodos immediately", async () => {
    const todo = makeTodo({ id: "t1", recurrence: "none" });
    const list = makeList({ todos: [todo] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    expect(result.current.lists[0].todos).toHaveLength(1);

    await act(async () => {
      await result.current.updateTodo("list-1", "t1", { done: true });
    });

    const updated = result.current.lists[0];
    expect(updated.todos).toHaveLength(0);
    expect(updated.archivedTodos).toHaveLength(1);
    expect(updated.archivedTodos[0].id).toBe("t1");
  });

  it("sets archivedAt timestamp when task is archived", async () => {
    const before = Date.now();
    const todo   = makeTodo({ id: "t1" });
    const list   = makeList({ todos: [todo] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    await act(async () => {
      await result.current.updateTodo("list-1", "t1", { done: true });
    });

    const archived = result.current.lists[0].archivedTodos[0];
    expect(new Date(archived.archivedAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("archived tasks are sorted newest first", async () => {
    const t1 = makeTodo({ id: "t1", text: "First" });
    const t2 = makeTodo({ id: "t2", text: "Second" });
    const list = makeList({ todos: [t1, t2] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });

    await act(async () => { await result.current.updateTodo("list-1", "t1", { done: true }); });
    await act(async () => { await result.current.updateTodo("list-1", "t2", { done: true }); });

    const archived = result.current.lists[0].archivedTodos;
    expect(archived[0].id).toBe("t2"); // most recently archived is first
    expect(archived[1].id).toBe("t1");
  });

  it("recurring task gets archived AND a new occurrence is created", async () => {
    const deadline = new Date(Date.now() + 86400000).toISOString();
    const todo = makeTodo({ id: "t1", recurrence: "daily", deadline });
    const list = makeList({ todos: [todo] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    await act(async () => {
      await result.current.updateTodo("list-1", "t1", { done: true });
    });

    const updated = result.current.lists[0];
    // Original archived
    expect(updated.archivedTodos.some((t) => t.id === "t1")).toBe(true);
    // New occurrence exists in active todos
    expect(updated.todos).toHaveLength(1);
    expect(updated.todos[0].done).toBe(false);
    expect(updated.todos[0].id).not.toBe("t1");
    // New deadline is 1 day later
    const origDue = new Date(deadline).getTime();
    const newDue  = new Date(updated.todos[0].deadline).getTime();
    expect(newDue - origDue).toBe(86400000);
  });

  it("unarchiveTodo restores task to active todos with done:false", async () => {
    const archived = {
      ...makeTodo({ id: "t1" }),
      archivedAt: new Date().toISOString(),
    };
    const list = makeList({ archivedTodos: [archived] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    await act(async () => {
      await result.current.unarchiveTodo("list-1", "t1");
    });

    const updated = result.current.lists[0];
    expect(updated.archivedTodos).toHaveLength(0);
    expect(updated.todos).toHaveLength(1);
    expect(updated.todos[0].done).toBe(false);
    expect(updated.todos[0].archivedAt).toBeUndefined();
  });

  it("deleteArchivedTodo removes the task permanently without touching todos", async () => {
    const activeTodo   = makeTodo({ id: "active-1" });
    const archivedTodo = { ...makeTodo({ id: "archived-1" }), archivedAt: new Date().toISOString() };
    const list         = makeList({ todos: [activeTodo], archivedTodos: [archivedTodo] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    await act(async () => {
      await result.current.deleteArchivedTodo("list-1", "archived-1");
    });

    const updated = result.current.lists[0];
    expect(updated.archivedTodos).toHaveLength(0);
    // Active todos untouched
    expect(updated.todos).toHaveLength(1);
    expect(updated.todos[0].id).toBe("active-1");
  });

  it("deleteArchivedTodo calls Firestore setDoc to persist the change", async () => {
    const archivedTodo = { ...makeTodo({ id: "a1" }), archivedAt: new Date().toISOString() };
    const list         = makeList({ archivedTodos: [archivedTodo] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    await act(async () => {
      await result.current.deleteArchivedTodo("list-1", "a1");
    });

    expect(setDoc).toHaveBeenCalled();
    const savedData = setDoc.mock.calls[setDoc.mock.calls.length - 1][1];
    expect(savedData.archivedTodos).toHaveLength(0);
  });

  it("multiple tasks can be archived in sequence", async () => {
    const todos = [
      makeTodo({ id: "t1", text: "Task 1" }),
      makeTodo({ id: "t2", text: "Task 2" }),
      makeTodo({ id: "t3", text: "Task 3" }),
    ];
    const list = makeList({ todos });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });

    for (const t of todos) {
      await act(async () => {
        await result.current.updateTodo("list-1", t.id, { done: true });
      });
    }

    const updated = result.current.lists[0];
    expect(updated.todos).toHaveLength(0);
    expect(updated.archivedTodos).toHaveLength(3);
  });

  it("archiving persists the full todo data (text, priority, deadline)", async () => {
    const deadline = new Date(Date.now() + 86400000).toISOString();
    const todo     = makeTodo({ id: "t1", text: "Important task", priority: "urgent", deadline });
    const list     = makeList({ todos: [todo] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    await act(async () => {
      await result.current.updateTodo("list-1", "t1", { done: true });
    });

    const archived = result.current.lists[0].archivedTodos[0];
    expect(archived.text).toBe("Important task");
    expect(archived.priority).toBe("urgent");
    expect(archived.deadline).toBe(deadline);
  });

  it("unarchiving a task does not affect other archived tasks", async () => {
    const a1 = { ...makeTodo({ id: "a1", text: "A1" }), archivedAt: new Date().toISOString() };
    const a2 = { ...makeTodo({ id: "a2", text: "A2" }), archivedAt: new Date().toISOString() };
    const list = makeList({ archivedTodos: [a1, a2] });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });
    await act(async () => {
      await result.current.unarchiveTodo("list-1", "a1");
    });

    const updated = result.current.lists[0];
    expect(updated.archivedTodos).toHaveLength(1);
    expect(updated.archivedTodos[0].id).toBe("a2");
    expect(updated.todos[0].id).toBe("a1");
  });

  it("progress in sidebar reflects archived count correctly", async () => {
    // Sidebar shows done/total where done = archivedTodos.length
    // and total = todos.length + archivedTodos.length
    const todos = [
      makeTodo({ id: "t1" }),
      makeTodo({ id: "t2" }),
    ];
    const archivedTodos = [
      { ...makeTodo({ id: "a1" }), archivedAt: new Date().toISOString() },
    ];
    const list = makeList({ todos, archivedTodos });

    const { result } = renderHook(() => useData(USER_ID));
    await act(async () => { fire([list]); });

    const l = result.current.lists[0];
    const total     = l.todos.length + l.archivedTodos.length; // 3
    const completed = l.archivedTodos.length;                   // 1
    const progress  = (completed / total) * 100;

    expect(total).toBe(3);
    expect(completed).toBe(1);
    expect(Math.round(progress)).toBe(33);
  });
});
