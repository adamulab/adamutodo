import { useState, useMemo } from "react";

/**
 * useSearch
 * Returns { searchQuery, setSearchQuery, searchResults, clearSearch }
 *
 * searchResults: Array of { todo, list } sorted by relevance (title match first)
 */
export function useSearch(lists) {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results = [];

    for (const list of lists) {
      // Match list title itself — surface all its todos
      const listMatches = list.title.toLowerCase().includes(q);

      for (const todo of list.todos || []) {
        const textMatch = todo.text.toLowerCase().includes(q);
        const priorityMatch = (todo.priority || "").toLowerCase().includes(q);
        const tagMatch = (todo.tags || []).some((t) =>
          t.toLowerCase().includes(q),
        );

        if (textMatch || priorityMatch || tagMatch || listMatches) {
          results.push({
            todo,
            list,
            // Score: exact text match scores highest
            score:
              (todo.text.toLowerCase() === q ? 10 : 0) +
              (textMatch ? 3 : 0) +
              (listMatches ? 1 : 0) +
              (todo.done ? -2 : 0),
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 30);
  }, [searchQuery, lists]);

  const clearSearch = () => setSearchQuery("");

  return { searchQuery, setSearchQuery, searchResults, clearSearch };
}
