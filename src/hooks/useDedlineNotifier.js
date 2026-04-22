import { useEffect, useRef, useCallback } from "react";

// Synthesise a gentle 3-beep chime using Web Audio API — no audio file needed
function playDueSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + dur,
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.18);
    beep(988, 0.2, 0.18);
    beep(1174, 0.4, 0.28);
    setTimeout(() => ctx.close(), 1200);
  } catch (_) {
    // Audio not supported — fail silently
  }
}

// Request push permission if not already granted
async function requestPushPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function sendPushNotification(title, body, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  try {
    new Notification(title, {
      body,
      tag, // prevents duplicate toasts for the same task
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      requireInteraction: false,
    });
  } catch (_) {}
}

/**
 * useDeadlineNotifier
 *
 * Scans todos every 30 s. For each non-done todo with a deadline:
 *  - within 5 min in the future  → "Due soon" warning
 *  - within 0–2 min past due     → "Now overdue" alert
 *
 * Fires sound + push notification once per todo per event.
 * Pass notify() from useNotifications to also show an in-app toast.
 */
export function useDeadlineNotifier(lists, notify) {
  // Set of todoIds we've already notified so we don't repeat
  const notifiedSoon = useRef(new Set());
  const notifiedOverdue = useRef(new Set());
  const permRequested = useRef(false);

  const check = useCallback(() => {
    const now = Date.now();

    for (const list of lists) {
      for (const todo of list.todos || []) {
        if (todo.done || !todo.deadline) continue;

        const due = new Date(todo.deadline).getTime();
        const diff = due - now; // ms until due (negative = overdue)

        // ── Due within 5 minutes ──────────────────────────────────────────
        if (
          diff > 0 &&
          diff <= 5 * 60 * 1000 &&
          !notifiedSoon.current.has(todo.id)
        ) {
          notifiedSoon.current.add(todo.id);

          // Request push permission on first hit (requires user gesture
          // context; browsers may block if no prior gesture — that's fine)
          if (!permRequested.current) {
            permRequested.current = true;
            requestPushPermission();
          }

          const mins = Math.ceil(diff / 60000);
          playDueSound();
          sendPushNotification(
            "⏰ Task due soon",
            `"${todo.text}" is due in ${mins} minute${mins !== 1 ? "s" : ""}`,
            `soon-${todo.id}`,
          );
          notify?.(
            "warning",
            `⏰ "${todo.text}" due in ${mins} min — ${list.title}`,
            8000,
          );
        }

        // ── Just became overdue (0–2 min past) ───────────────────────────
        if (
          diff < 0 &&
          diff >= -2 * 60 * 1000 &&
          !notifiedOverdue.current.has(todo.id)
        ) {
          notifiedOverdue.current.add(todo.id);
          playDueSound();
          sendPushNotification(
            "🔴 Task overdue",
            `"${todo.text}" was due in ${list.title}`,
            `overdue-${todo.id}`,
          );
          notify?.(
            "error",
            `🔴 "${todo.text}" is now overdue — ${list.title}`,
            10000,
          );
        }
      }
    }
  }, [lists, notify]);

  // Clear notified sets when a todo is marked done (it disappears from lists)
  useEffect(() => {
    const allIds = new Set(
      lists.flatMap((l) =>
        (l.todos || []).filter((t) => !t.done).map((t) => t.id),
      ),
    );
    // Remove IDs no longer in active undone todos so re-scheduling works
    for (const id of notifiedSoon.current)
      if (!allIds.has(id)) notifiedSoon.current.delete(id);
    for (const id of notifiedOverdue.current)
      if (!allIds.has(id)) notifiedOverdue.current.delete(id);
  }, [lists]);

  useEffect(() => {
    check(); // immediate check on mount / list change
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [check]);
}
