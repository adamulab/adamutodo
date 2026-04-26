import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  Hourglass,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronRight,
  ListTodo,
  Inbox,
} from "lucide-react";

const PRIORITY_STYLE = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
function fmtFull(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getBucket(deadline) {
  const now = new Date();
  const due = new Date(deadline);
  const today = startOfDay(now);
  const dDay = startOfDay(due);
  const diff = Math.round((dDay - today) / 86400000);

  if (due < now) return "overdue";
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff <= 7) return "thisWeek";
  return "later";
}

const BUCKETS = [
  {
    key: "overdue",
    label: "Overdue",
    color: "#f87171",
    bg: "rgba(239,68,68,0.08)",
  },
  {
    key: "today",
    label: "Today",
    color: "var(--primary)",
    bg: "var(--primary-muted)",
  },
  {
    key: "tomorrow",
    label: "Tomorrow",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
  },
  {
    key: "thisWeek",
    label: "This Week",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
  },
  {
    key: "later",
    label: "Later",
    color: "var(--text-muted)",
    bg: "var(--surface-elevated)",
  },
  {
    key: "noDate",
    label: "No Due Date",
    color: "var(--text-muted)",
    bg: "var(--surface-elevated)",
  },
];

function TaskRow({ todo, list, onSelectList }) {
  const isOverdue = todo.deadline && new Date(todo.deadline) < new Date();
  const p = PRIORITY_STYLE[todo.priority] || PRIORITY_STYLE.low;

  return (
    <button
      onClick={() => onSelectList(list.id)}
      className="w-full flex items-start gap-3 px-4 py-3 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--primary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {/* Dot */}
      <div
        className="mt-1 w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: isOverdue ? "#f87171" : "var(--primary)" }}
      />

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: isOverdue ? "#f87171" : "var(--text)" }}
        >
          {todo.text}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* List chip */}
          <span
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-muted)",
            }}
          >
            <ListTodo className="w-3 h-3" />
            {list.title}
          </span>
          {/* Time */}
          {todo.deadline && (
            <span
              className="flex items-center gap-1 text-[11px]"
              style={{ color: isOverdue ? "#f87171" : "var(--text-muted)" }}
            >
              <Clock className="w-3 h-3" />
              {fmtTime(todo.deadline)}
            </span>
          )}
          {/* Recurrence */}
          {todo.recurrence && todo.recurrence !== "none" && (
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-muted)",
              }}
            >
              🔁 {todo.recurrence}
            </span>
          )}
        </div>
      </div>

      {/* Priority */}
      <span
        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border shrink-0 ${p}`}
      >
        {todo.priority ?? "low"}
      </span>
    </button>
  );
}

function BucketSection({ bucket, tasks, lists, onSelectList }) {
  const [open, setOpen] = useState(true);
  if (!tasks.length) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 mb-3 w-full text-left group"
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: bucket.color }}
        />
        <h2
          className="text-sm font-bold tracking-wide"
          style={{ color: bucket.color }}
        >
          {bucket.label}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full ml-1"
          style={{ backgroundColor: bucket.bg, color: bucket.color }}
        >
          {tasks.length}
        </span>
        <span className="ml-auto" style={{ color: "var(--text-muted)" }}>
          {open ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-2 pl-1">
          {tasks
            .sort((a, b) => {
              if (!a.deadline) return 1;
              if (!b.deadline) return -1;
              return new Date(a.deadline) - new Date(b.deadline);
            })
            .map(({ todo, list }) => (
              <TaskRow
                key={todo.id}
                todo={todo}
                list={list}
                onSelectList={onSelectList}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function TimelineView({
  lists,
  onSelectList,
  onOpenSidebar,
  headerControls,
}) {
  const [filterListId, setFilterListId] = useState("all");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() => {
    return lists.filter((l) => filterListId === "all" || l.id === filterListId);
  }, [lists, filterListId]);

  // Flatten all active todos across filtered lists with their list reference
  const allTasks = useMemo(() => {
    return filtered.flatMap((list) =>
      (list.todos || []).map((todo) => ({ todo, list })),
    );
  }, [filtered]);

  // Group into buckets
  const grouped = useMemo(() => {
    const g = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDate: [],
    };
    for (const item of allTasks) {
      const bucket = item.todo.deadline
        ? getBucket(item.todo.deadline)
        : "noDate";
      g[bucket].push(item);
    }
    return g;
  }, [allTasks]);

  const totalTasks = allTasks.length;
  const overdueCount = grouped.overdue.length;
  const todayCount = grouped.today.length;

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 sm:px-6 py-3 border-b"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile hamburger */}
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors shrink-0"
          >
            <span className="sr-only">Open sidebar</span>
            <div className="space-y-1">
              <div
                className="w-4 h-0.5 rounded"
                style={{ backgroundColor: "var(--text-muted)" }}
              />
              <div
                className="w-4 h-0.5 rounded"
                style={{ backgroundColor: "var(--text-muted)" }}
              />
              <div
                className="w-4 h-0.5 rounded"
                style={{ backgroundColor: "var(--text-muted)" }}
              />
            </div>
          </button>

          <div className="min-w-0">
            <h1
              className="text-lg font-bold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              Timeline
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {totalTasks} task{totalTasks !== 1 ? "s" : ""}
              {overdueCount > 0 && (
                <span className="text-red-400 ml-1">
                  · {overdueCount} overdue
                </span>
              )}
              {todayCount > 0 && (
                <span className="ml-1" style={{ color: "var(--primary)" }}>
                  · {todayCount} today
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* List filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-[var(--surface-hover)]"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {filterListId === "all"
                  ? "All lists"
                  : (lists.find((l) => l.id === filterListId)?.title ??
                    "All lists")}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showFilter && (
              <div
                className="absolute right-0 top-full mt-1.5 rounded-xl shadow-2xl z-20 overflow-hidden min-w-[160px]"
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  onClick={() => {
                    setFilterListId("all");
                    setShowFilter(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--surface-hover)]"
                  style={{
                    color:
                      filterListId === "all" ? "var(--primary)" : "var(--text)",
                  }}
                >
                  <Inbox className="w-4 h-4" />
                  All lists
                </button>
                {lists.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setFilterListId(l.id);
                      setShowFilter(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--surface-hover)]"
                    style={{
                      color:
                        filterListId === l.id
                          ? "var(--primary)"
                          : "var(--text)",
                    }}
                  >
                    <ListTodo className="w-4 h-4" />
                    <span className="truncate">{l.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {headerControls}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 custom-scrollbar">
        {totalTasks === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div
              className="w-16 h-16 mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--surface)" }}
            >
              <Calendar
                className="w-7 h-7"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
              No tasks with due dates
            </p>
            <p
              className="text-sm max-w-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Add deadlines to your tasks and they'll appear here grouped by
              date.
            </p>
          </div>
        ) : (
          BUCKETS.map((bucket) => (
            <BucketSection
              key={bucket.key}
              bucket={bucket}
              tasks={grouped[bucket.key]}
              lists={lists}
              onSelectList={(listId) => {
                onSelectList(listId);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
