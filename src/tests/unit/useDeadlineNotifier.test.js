import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeadlineNotifier } from "../../hooks/useDeadlineNotifier";

function makeTodo(overrides = {}) {
  return {
    id: `todo-${Math.random()}`,
    text: "Test task",
    done: false,
    deadline: null,
    recurrence: "none",
    ...overrides,
  };
}

function makeList(todos = []) {
  return { id: "l1", title: "Work", todos };
}

describe("useDeadlineNotifier", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not notify for tasks with no deadline", () => {
    const notify = vi.fn();
    const todo   = makeTodo({ deadline: null });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });
    expect(notify).not.toHaveBeenCalled();
  });

  it("does not notify for done tasks", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() + 2 * 60_000).toISOString(); // 2 min away
    const todo     = makeTodo({ deadline, done: true });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });
    expect(notify).not.toHaveBeenCalled();
  });

  it("fires warning notification for tasks due within 5 minutes", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() + 3 * 60_000).toISOString(); // 3 min away
    const todo     = makeTodo({ deadline });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });
    expect(notify).toHaveBeenCalledWith(
      "warning",
      expect.stringContaining(todo.text),
      expect.any(Number),
    );
  });

  it("fires error notification for tasks 0–2 minutes overdue", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() - 60_000).toISOString(); // 1 min ago
    const todo     = makeTodo({ deadline });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });
    expect(notify).toHaveBeenCalledWith(
      "error",
      expect.stringContaining(todo.text),
      expect.any(Number),
    );
  });

  it("never fires warning type for overdue tasks", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() - 60_000).toISOString();
    const todo     = makeTodo({ deadline });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });

    const calls = notify.mock.calls;
    const warningCalls = calls.filter(([type]) => type === "warning");
    expect(warningCalls).toHaveLength(0);
  });

  it("never fires error type for due-soon tasks", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() + 3 * 60_000).toISOString();
    const todo     = makeTodo({ deadline });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });

    const calls = notify.mock.calls;
    const errorCalls = calls.filter(([type]) => type === "error");
    expect(errorCalls).toHaveLength(0);
  });

  it("does not notify the same task twice for due-soon", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() + 3 * 60_000).toISOString();
    const todo     = makeTodo({ deadline });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));

    act(() => { vi.advanceTimersByTime(0); });
    act(() => { vi.advanceTimersByTime(30_000); }); // fire second interval check
    act(() => { vi.advanceTimersByTime(30_000); }); // third check

    // Should only have notified once despite multiple interval ticks
    const warnCalls = notify.mock.calls.filter(([type]) => type === "warning");
    expect(warnCalls).toHaveLength(1);
  });

  it("does not notify tasks more than 5 minutes away", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() + 10 * 60_000).toISOString(); // 10 min away
    const todo     = makeTodo({ deadline });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });
    expect(notify).not.toHaveBeenCalled();
  });

  it("does not notify tasks overdue by more than 2 minutes", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() - 5 * 60_000).toISOString(); // 5 min ago
    const todo     = makeTodo({ deadline });
    renderHook(() => useDeadlineNotifier([makeList([todo])], notify));
    act(() => { vi.advanceTimersByTime(0); });
    expect(notify).not.toHaveBeenCalled();
  });

  it("includes list title in the notification message", () => {
    const notify   = vi.fn();
    const deadline = new Date(Date.now() + 2 * 60_000).toISOString();
    const todo     = makeTodo({ deadline });
    const list     = { id: "l1", title: "My Work List", todos: [todo] };
    renderHook(() => useDeadlineNotifier([list], notify));
    act(() => { vi.advanceTimersByTime(0); });

    const [, message] = notify.mock.calls[0];
    expect(message).toContain("My Work List");
  });

  it("rechecks every 30 seconds via interval", () => {
    const notify = vi.fn();
    // Start with no tasks, add one after 30s via lists update
    const { rerender } = renderHook(
      ({ lists }) => useDeadlineNotifier(lists, notify),
      { initialProps: { lists: [makeList([])] } },
    );
    act(() => { vi.advanceTimersByTime(0); });
    expect(notify).not.toHaveBeenCalled();

    const deadline = new Date(Date.now() + 2 * 60_000).toISOString();
    const todo     = makeTodo({ deadline });
    rerender({ lists: [makeList([todo])] });

    act(() => { vi.advanceTimersByTime(30_000); });
    expect(notify).toHaveBeenCalled();
  });
});
