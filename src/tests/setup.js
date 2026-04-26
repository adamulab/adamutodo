import "@testing-library/jest-dom";
import { vi } from "vitest";

// ── Silence expected console noise in tests ───────────────────────────────────
beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

// ── Stub navigator.onLine (tests run offline by default) ─────────────────────
Object.defineProperty(navigator, "onLine", {
  configurable: true,
  get: () => true,
});

// ── Stub Web Audio API (used by useDeadlineNotifier) ─────────────────────────
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    type: "sine",
    frequency: { value: 0 },
  }),
  createGain: () => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  }),
  currentTime: 0,
  destination: {},
  close: vi.fn(),
}));
global.webkitAudioContext = global.AudioContext;

// ── Stub Notification API ─────────────────────────────────────────────────────
global.Notification = vi.fn().mockImplementation(() => ({}));
global.Notification.permission = "granted";
global.Notification.requestPermission = vi.fn().mockResolvedValue("granted");

// ── Stub Firebase so tests never hit the network ─────────────────────────────
vi.mock("../firebase", () => ({
  db: {},
  getListsRef: vi.fn(() => "lists-ref"),
  getListRef:  vi.fn((uid, id) => `list-ref-${id}`),
}));

vi.mock("firebase/firestore", () => ({
  onSnapshot:      vi.fn(),
  setDoc:          vi.fn().mockResolvedValue(undefined),
  deleteDoc:       vi.fn().mockResolvedValue(undefined),
  serverTimestamp: vi.fn(() => ({ _isServerTimestamp: true })),
  query:           vi.fn((ref) => ref),
  orderBy:         vi.fn(),
  collection:      vi.fn(),
  doc:             vi.fn(),
}));
