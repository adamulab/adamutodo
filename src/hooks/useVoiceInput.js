import { useCallback, useRef, useState } from "react";

// Wraps the browser's native SpeechRecognition (Web Speech API). No backend,
// no API key — works in Chrome/Edge/Safari; gracefully unavailable elsewhere
// (`supported` will be false and callers should hide the mic button).
export function useVoiceInput({ onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const supported = Boolean(SpeechRecognition);

  const start = useCallback(() => {
    if (!supported) {
      setError("Voice input isn't supported in this browser.");
      return;
    }
    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onResult?.(transcript);
    };
    recognition.onerror = (event) => {
      setError(event.error === "not-allowed" ? "Microphone access was denied." : "Couldn't hear that — try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [supported, onResult, SpeechRecognition]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, error, start, stop };
}
