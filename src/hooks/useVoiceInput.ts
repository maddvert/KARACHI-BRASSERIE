import { useCallback, useEffect, useRef, useState } from 'react';
import type { MenuItem } from '../data/menuData';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function useVoiceInput() {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isSupported] = useState<boolean>(() => Boolean(getSpeechRecognitionCtor()));
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (onTranscript: (transcript: string, isFinal: boolean) => void) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setError('Voice input is not supported in this browser.');
        return;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      setError(null);
      const recognition = new Ctor();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let combined = '';
        let finalFlag = false;
        for (let i = 0; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result[0]?.transcript) {
            combined += result[0].transcript;
          }
          if (result.isFinal) {
            finalFlag = true;
          }
        }
        if (combined.trim()) {
          onTranscript(combined.trim(), finalFlag);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow mic access.');
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError('Could not capture speech. Please try again.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        setError('Unable to start microphone.');
        setIsListening(false);
      }
    },
    []
  );

  const toggleListening = useCallback(
    (onTranscript: (transcript: string, isFinal: boolean) => void) => {
      if (isListening) {
        stopListening();
      } else {
        startListening(onTranscript);
      }
    },
    [isListening, startListening, stopListening]
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

export interface ParsedVoiceOrderMatch {
  item: MenuItem;
  quantity: number;
}

/**
 * Matches spoken phrases like "2 classic cheese burger and one mint lemonade"
 * against the Karachi Brasserie menu catalog for hands-free cart creation.
 */
export function parseVoiceOrderItems(
  transcript: string,
  catalog: MenuItem[]
): ParsedVoiceOrderMatch[] {
  const normalized = transcript
    .toLowerCase()
    .replace(/^(add|order|give me|i want|please add|get me)\s+/i, '')
    .trim();

  if (!normalized) return [];

  const clauses = normalized
    .split(/\s*(?:,|and|plus|&)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const matches: ParsedVoiceOrderMatch[] = [];

  for (const clause of clauses) {
    let qty = 1;
    let phrase = clause;

    const digitMatch = phrase.match(/^(\d+)\s+(.+)$/);
    if (digitMatch) {
      qty = Math.min(20, Math.max(1, Number(digitMatch[1]) || 1));
      phrase = digitMatch[2].trim();
    } else {
      const firstWord = phrase.split(/\s+/)[0];
      if (firstWord && NUMBER_WORDS[firstWord]) {
        qty = NUMBER_WORDS[firstWord];
        phrase = phrase.slice(firstWord.length).trim();
      }
    }

    phrase = phrase.replace(/\b(please|pls|of)\b/g, '').trim();
    if (phrase.length < 2) continue;

    // Score catalog items by exact substring or token overlap
    let bestItem: MenuItem | null = null;
    let bestScore = 0;

    const phraseTokens = phrase.split(/\s+/).filter((t) => t.length >= 2);

    for (const item of catalog) {
      const nameLower = item.name.toLowerCase();
      if (nameLower === phrase) {
        bestItem = item;
        bestScore = 100;
        break;
      }
      if (nameLower.includes(phrase) || phrase.includes(nameLower)) {
        const score = 70 + Math.min(25, phrase.length);
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
        continue;
      }
      const overlap = phraseTokens.filter((t) => nameLower.includes(t)).length;
      if (overlap > 0) {
        const score = overlap * 25 - Math.abs(nameLower.split(/\s+/).length - phraseTokens.length) * 3;
        if (score > bestScore && (overlap >= 2 || phraseTokens.length === 1)) {
          bestScore = score;
          bestItem = item;
        }
      }
    }

    if (bestItem && bestScore >= 22) {
      const existing = matches.find((m) => m.item.id === bestItem!.id);
      if (existing) {
        existing.quantity += qty;
      } else {
        matches.push({ item: bestItem, quantity: qty });
      }
    }
  }

  return matches;
}
