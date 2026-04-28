import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { onSnapshot, setDoc } from "firebase/firestore";

// We test through the Sidebar component since that is the primary
// list-creation surface, wired to the real useData logic via props.
import Sidebar from "../../components/SideBar";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeSidebarProps(overrides = {}) {
  return {
    lists: [],
    activeListId: null,
    onSelectList: vi.fn(),
    onSelectTimeline: vi.fn(),
    onCreateList: vi.fn().mockResolvedValue(null), // null = success
    onUpdateList: vi.fn().mockResolvedValue(null),
    onDeleteList: vi.fn().mockResolvedValue(undefined),
    isOpen: true,
    setIsOpen: vi.fn(),
    user: { displayName: "Test User", email: "test@example.com", photoURL: "" },
    ...overrides,
  };
}

describe("Create List — integration", () => {
  const user = userEvent.setup();

  it("renders the new list input field", () => {
    render(<Sidebar {...makeSidebarProps()} />);
    expect(screen.getByPlaceholderText("New list…")).toBeInTheDocument();
  });

  it("calls onCreateList with the typed title on Enter", async () => {
    const onCreateList = vi.fn().mockResolvedValue(null);
    render(<Sidebar {...makeSidebarProps({ onCreateList })} />);

    const input = screen.getByPlaceholderText("New list…");
    await user.type(input, "My Project{Enter}");

    expect(onCreateList).toHaveBeenCalledWith({ title: "My Project" });
  });

  it("calls onCreateList when the + button is clicked", async () => {
    const onCreateList = vi.fn().mockResolvedValue(null);
    render(<Sidebar {...makeSidebarProps({ onCreateList })} />);

    const input = screen.getByPlaceholderText("New list…");
    await user.type(input, "Shopping");

    const addBtn = screen.getByRole("button", { name: /plus/i });
    await user.click(addBtn);

    expect(onCreateList).toHaveBeenCalledWith({ title: "Shopping" });
  });

  it("clears the input after successful creation", async () => {
    const onCreateList = vi.fn().mockResolvedValue(null);
    render(<Sidebar {...makeSidebarProps({ onCreateList })} />);

    const input = screen.getByPlaceholderText("New list…");
    await user.type(input, "Inbox{Enter}");

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("shows error message when onCreateList returns an error", async () => {
    const onCreateList = vi.fn().mockResolvedValue({ error: "A list with that name already exists" });
    render(<Sidebar {...makeSidebarProps({ onCreateList })} />);

    const input = screen.getByPlaceholderText("New list…");
    await user.type(input, "Duplicate{Enter}");

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it("does not submit on empty input", async () => {
    const onCreateList = vi.fn().mockResolvedValue(null);
    render(<Sidebar {...makeSidebarProps({ onCreateList })} />);

    const input = screen.getByPlaceholderText("New list…");
    await user.click(input);
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCreateList).not.toHaveBeenCalled();
  });

  it("shows suggestions when typing a matching letter", async () => {
    render(<Sidebar {...makeSidebarProps()} />);
    const input = screen.getByPlaceholderText("New list…");
    await user.type(input, "w");

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
    });
  });

  it("selecting a suggestion calls onCreateList with that title", async () => {
    const onCreateList = vi.fn().mockResolvedValue(null);
    render(<Sidebar {...makeSidebarProps({ onCreateList })} />);

    const input = screen.getByPlaceholderText("New list…");
    await user.type(input, "w");

    await waitFor(() => screen.getByText("Work"));
    await user.click(screen.getByText("Work"));

    expect(onCreateList).toHaveBeenCalledWith({ title: "Work" });
  });

  it("hides suggestions for already-existing list titles", async () => {
    const existingLists = [
      { id: "l1", title: "Work", todos: [], archivedTodos: [], createdAt: new Date().toISOString() },
    ];
    render(<Sidebar {...makeSidebarProps({ lists: existingLists })} />);

    const input = screen.getByPlaceholderText("New list…");
    await user.type(input, "work");

    // "Work" should not appear in suggestions since it already exists
    await waitFor(() => {
      const suggestion = screen.queryByRole("button", { name: /^Work$/ });
      expect(suggestion).toBeNull();
    });
  });

  it("renders existing lists in the sidebar", () => {
    const lists = [
      { id: "l1", title: "Inbox", todos: [], archivedTodos: [], createdAt: new Date().toISOString() },
      { id: "l2", title: "Work",  todos: [], archivedTodos: [], createdAt: new Date().toISOString() },
    ];
    render(<Sidebar {...makeSidebarProps({ lists })} />);
    expect(screen.getByText("Inbox")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("calls onDeleteList when delete button is clicked on a list", async () => {
    const onDeleteList = vi.fn().mockResolvedValue(undefined);
    const lists = [
      { id: "l1", title: "Inbox", todos: [], archivedTodos: [], createdAt: new Date().toISOString() },
    ];
    render(<Sidebar {...makeSidebarProps({ lists, onDeleteList, activeListId: "l1" })} />);

    // Hover to reveal delete button
    const listItem = screen.getByText("Inbox").closest("[class*='rounded-xl']");
    fireEvent.mouseEnter(listItem);

    const deleteBtn = screen.getByTitle("Delete");
    await user.click(deleteBtn);

    expect(onDeleteList).toHaveBeenCalledWith("l1");
  });

  it("navigates to timeline when Timeline button is clicked", async () => {
    const onSelectTimeline = vi.fn();
    render(<Sidebar {...makeSidebarProps({ onSelectTimeline })} />);

    await user.click(screen.getByText("Timeline"));
    expect(onSelectTimeline).toHaveBeenCalled();
  });
});
