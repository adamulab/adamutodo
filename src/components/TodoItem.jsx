import { motion } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle, Circle, Trash2, GripVertical } from "lucide-react";

export default function TodoItem({ todo, list, lists, setLists }) {
  const toggle = () => {
    setLists(
      lists.map((l) =>
        l.id === list.id
          ? {
              ...l,
              todos: l.todos.map((t) =>
                t.id === todo.id ? { ...t, done: !t.done } : t,
              ),
            }
          : l,
      ),
    );
  };

  const deleteTodo = () => {
    setLists(
      lists.map((l) =>
        l.id === list.id
          ? { ...l, todos: l.todos.filter((t) => t.id !== todo.id) }
          : l,
      ),
    );
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: deleteTodo,
    trackMouse: true,
  });

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colors = {
    low: "text-green-400",
    medium: "text-yellow-400",
    urgent: "text-red-400",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...swipeHandlers}
      layout
      className="flex justify-between items-center bg-white/5 p-3 rounded-xl mb-2"
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners}>
          <GripVertical size={16} />
        </button>
        <button onClick={toggle}>
          {todo.done ? <CheckCircle className="text-green-400" /> : <Circle />}
        </button>
        <div>
          <div className={todo.done ? "line-through text-gray-400" : ""}>
            {todo.text}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(todo.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs ${colors[todo.priority]}`}>
          {todo.priority}
        </span>
        <button onClick={deleteTodo}>
          <Trash2 size={16} className="text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}
