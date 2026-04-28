import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoItem from "../../components/TodoItem";
import ArchiveSection from "../../components/ArchiveSection";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeTodo(overrides = {}) {
  return {
    id: "todo-1",
    text: "Write unit tests",
    done: false,
    priority: "medium",
    deadline: null,
    recurrence: "none",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderTodoItem(todoOverrides = {}, handlerOverrides = {}) {
  const handlers = {
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    ...handlerOverrides,
  };
  render(
    <TodoItem
      todo={makeTodo(todoOverrides)}
      listId="list-1"
      onUpdate={handlers.onUpdate}
      onDelete={handlers.onDelete}
    />,
  );
  return handlers;
}

// ── TodoItem view mode ────────────────────────────────────────────────────────

describe("TodoItem — view mode", () => {
  it("renders the full task text", () => {
    renderTodoItem();
    expect(screen.getByText("Write unit tests")).toBeInTheDocument();
  });

  it("renders multiline text without truncation", () => {
    const longText = "This is a very long task description that should wrap across multiple lines without being cut off by any truncation class in the component";
    renderTodoItem({ text: longText });
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("shows the priority badge", () => {
    renderTodoItem({ priority: "urgent" });
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("shows the deadline when set", () => {
    const deadline = new Date(Date.now() + 86400000).toISOString(); // tomorrow
    renderTodoItem({ deadline });
    expect(screen.getByText(/due/i)).toBeInTheDocument();
  });

  it("shows the created date", () => {
    renderTodoItem({ createdAt: "2024-06-15T09:00:00.000Z" });
    expect(screen.getByText(/jun/i)).toBeInTheDocument();
  });

  it("shows OVERDUE badge for past deadlines", () => {
    const deadline = new Date(Date.now() - 86400000).toISOString(); // yesterday
    renderTodoItem({ deadline });
    expect(screen.getByText("OVERDUE")).toBeInTheDocument();
  });

  it("shows recurrence badge when recurrence is set", () => {
    renderTodoItem({ recurrence: "weekly" });
    expect(screen.getByText(/weekly/i)).toBeInTheDocument();
  });

  it("does not show recurrence badge when recurrence is none", () => {
    renderTodoItem({ recurrence: "none" });
    expect(screen.queryByText(/weekly|daily|monthly/i)).toBeNull();
  });

  it("calls onUpdate with done:true when checkbox is clicked", async () => {
    const user     = userEvent.setup();
    const handlers = renderTodoItem();
    const checkbox = screen.getByTitle("Mark complete");
    await user.click(checkbox);
    expect(handlers.onUpdate).toHaveBeenCalledWith("list-1", "todo-1", { done: true });
  });
});

// ── TodoItem edit mode ────────────────────────────────────────────────────────

describe("TodoItem — edit mode", () => {
  const user = userEvent.setup();

  async function openEditMode(todoOverrides = {}, handlerOverrides = {}) {
    const handlers = renderTodoItem(todoOverrides, handlerOverrides);
    // Hover to reveal edit button
    const row = screen.getByText(makeTodo(todoOverrides).text).closest("div");
    fireEvent.mouseEnter(row.parentElement);
    const editBtn = screen.getByTitle("Edit");
    await user.click(editBtn);
    return handlers;
  }

  it("opens edit mode and shows textarea with current text", async () => {
    await openEditMode();
    const textarea = screen.getByRole("textbox");
    expect(textarea.value).toBe("Write unit tests");
  });

  it("saves updated text on Save button click", async () => {
    const handlers = await openEditMode();
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "Updated task text");
    await user.click(screen.getByText("Save"));

    expect(handlers.onUpdate).toHaveBeenCalledWith(
      "list-1",
      "todo-1",
      expect.objectContaining({ text: "Updated task text" }),
    );
  });

  it("saves on Enter key (without shift)", async () => {
    const handlers = await openEditMode();
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "Enter key save");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(handlers.onUpdate).toHaveBeenCalled();
  });

  it("cancels on Escape key", async () => {
    await openEditMode();
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    await user.type(textarea, "Should not save");
    fireEvent.keyDown(textarea, { key: "Escape" });

    // Should be back in view mode
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText("Write unit tests")).toBeInTheDocument();
  });

  it("does not save when text is empty", async () => {
    const handlers = await openEditMode();
    const textarea = screen.getByRole("textbox");
    await user.clear(textarea);
    const saveBtn = screen.getByText("Save");
    expect(saveBtn).toBeDisabled();
    expect(handlers.onUpdate).not.toHaveBeenCalled();
  });

  it("updates priority in edit mode", async () => {
    const handlers = await openEditMode({ priority: "low" });
    const prioritySelect = screen.getAllByRole("combobox")[0];
    fireEvent.change(prioritySelect, { target: { value: "urgent" } });
    await user.click(screen.getByText("Save"));

    expect(handlers.onUpdate).toHaveBeenCalledWith(
      "list-1",
      "todo-1",
      expect.objectContaining({ priority: "urgent" }),
    );
  });

  it("updates recurrence in edit mode", async () => {
    const handlers = await openEditMode();
    const recurrenceSelect = screen.getAllByRole("combobox")[1];
    fireEvent.change(recurrenceSelect, { target: { value: "weekly" } });
    await user.click(screen.getByText("Save"));

    expect(handlers.onUpdate).toHaveBeenCalledWith(
      "list-1",
      "todo-1",
      expect.objectContaining({ recurrence: "weekly" }),
    );
  });
});

// ── TodoItem deletion ─────────────────────────────────────────────────────────

describe("TodoItem — deletion", () => {
  const user = userEvent.setup();

  it("shows confirmation modal on delete button click", async () => {
    renderTodoItem();
    const row = screen.getByText("Write unit tests").closest("div");
    fireEvent.mouseEnter(row.parentElement);
    await user.click(screen.getByTitle("Delete"));
    expect(screen.getByText("Delete task?")).toBeInTheDocument();
  });

  it("calls onDelete when deletion is confirmed", async () => {
    const handlers = renderTodoItem();
    const row      = screen.getByText("Write unit tests").closest("div");
    fireEvent.mouseEnter(row.parentElement);
    await user.click(screen.getByTitle("Delete"));
    await user.click(screen.getByText("Delete")); // confirm button in modal

    expect(handlers.onDelete).toHaveBeenCalledWith("list-1", "todo-1");
  });

  it("does not call onDelete when cancel is clicked", async () => {
    const handlers = renderTodoItem();
    const row      = screen.getByText("Write unit tests").closest("div");
    fireEvent.mouseEnter(row.parentElement);
    await user.click(screen.getByTitle("Delete"));
    await user.click(screen.getByText("Cancel"));

    expect(handlers.onDelete).not.toHaveBeenCalled();
  });
});

// ── ArchiveSection ────────────────────────────────────────────────────────────

describe("ArchiveSection", () => {
  const user = userEvent.setup();

  const archivedTodo = {
    id: "a1",
    text: "Completed task",
    done: true,
    priority: "low",
    deadline: null,
    archivedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  it("renders nothing when archivedTodos is empty", () => {
    const { container } = render(
      <ArchiveSection archivedTodos={[]} listId="l1" onUnarchive={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the Completed section header", () => {
    render(
      <ArchiveSection
        archivedTodos={[archivedTodo]}
        listId="l1"
        onUnarchive={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows task count in the badge", () => {
    render(
      <ArchiveSection
        archivedTodos={[archivedTodo]}
        listId="l1"
        onUnarchive={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("expands to show archived tasks when header is clicked", async () => {
    render(
      <ArchiveSection
        archivedTodos={[archivedTodo]}
        listId="l1"
        onUnarchive={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByText("Completed"));
    expect(screen.getByText("Completed task")).toBeInTheDocument();
  });

  it("calls onUnarchive when restore button is clicked", async () => {
    const onUnarchive = vi.fn();
    render(
      <ArchiveSection
        archivedTodos={[archivedTodo]}
        listId="l1"
        onUnarchive={onUnarchive}
        onDelete={vi.fn()}
      />,
    );
    // Expand first
    await user.click(screen.getByText("Completed"));

    // Hover to reveal actions
    const row = screen.getByText("Completed task").closest("div");
    fireEvent.mouseEnter(row);

    await user.click(screen.getByTitle("Restore task"));
    expect(onUnarchive).toHaveBeenCalledWith("l1", "a1");
  });

  it("calls onDelete when permanently delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(
      <ArchiveSection
        archivedTodos={[archivedTodo]}
        listId="l1"
        onUnarchive={vi.fn()}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByText("Completed"));
    const row = screen.getByText("Completed task").closest("div");
    fireEvent.mouseEnter(row);
    await user.click(screen.getByTitle("Delete permanently"));

    expect(onDelete).toHaveBeenCalledWith("l1", "a1");
  });
});
