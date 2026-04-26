import { useEffect, useRef, useCallback } from "react";

// Synthesise a 3-note ascending chime — no audio file needed
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
  } catch (_) {}
}

async function requestPushPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}

function sendPush(title, body, tag) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;
  try {
    new Notification(title, {
      body,
      tag,
      icon: "/favicon.ico",
      requireInteraction: false,
    });
  } catch (_) {}
}

/**
 * Scans todos every 30 s.
 *
 * Due-soon  (1–5 min before deadline) → warning toast + chime + push
 * Overdue   (0–2 min after deadline)  → error toast  + chime + push
 *
 * Each event fires exactly once per todo per session.
 */
export function useDeadlineNotifier(lists, notify) {
  const notifiedSoon = useRef(new Set());
  const notifiedOverdue = useRef(new Set());
  const permRequested = useRef(false);

  const check = useCallback(() => {
    const now = Date.now();

    for (const list of lists) {
      for (const todo of list.todos || []) {
        if (todo.done || !todo.deadline) continue;

        const due = new Date(todo.deadline).getTime();
        const diff = due - now; // positive = future, negative = past

        // ── Due soon: between 1 and 5 minutes away ─────────────────────────
        // Lower bound of 1 min avoids double-firing with the overdue check
        if (
          diff > 60_000 &&
          diff <= 5 * 60_000 &&
          !notifiedSoon.current.has(todo.id)
        ) {
          notifiedSoon.current.add(todo.id);

          if (!permRequested.current) {
            permRequested.current = true;
            requestPushPermission();
          }

          const mins = Math.ceil(diff / 60_000);
          playDueSound();
          sendPush(
            "⏰ Task due soon",
            `"${todo.text}" is due in ${mins} minute${mins !== 1 ? "s" : ""}`,
            `soon-${todo.id}`,
          );
          // Always "warning" for due-soon — never flips to error
          notify?.(
            "warning",
            `⏰ "${todo.text}" due in ${mins} min — ${list.title}`,
            8000,
          );
        }

        // ── Overdue: 0–2 minutes past due ──────────────────────────────────
        if (
          diff <= 0 &&
          diff >= -2 * 60_000 &&
          !notifiedOverdue.current.has(todo.id)
        ) {
          notifiedOverdue.current.add(todo.id);
          playDueSound();
          sendPush(
            "🔴 Task overdue",
            `"${todo.text}" was due in ${list.title}`,
            `overdue-${todo.id}`,
          );
          // Always "error" for overdue — never flips to warning
          notify?.(
            "error",
            `🔴 "${todo.text}" is now overdue — ${list.title}`,
            10_000,
          );
        }
      }
    }
  }, [lists, notify]);

  // Clean up notification sets when todos are archived (removed from active list)
  useEffect(() => {
    const activeIds = new Set(
      lists.flatMap((l) => (l.todos || []).map((t) => t.id)),
    );
    for (const id of notifiedSoon.current)
      if (!activeIds.has(id)) notifiedSoon.current.delete(id);
    for (const id of notifiedOverdue.current)
      if (!activeIds.has(id)) notifiedOverdue.current.delete(id);
  }, [lists]);

  useEffect(() => {
    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [check]);
}
