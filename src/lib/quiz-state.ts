import { useEffect, useState, useCallback } from "react";

export type QuizState = {
  step: number; // 0-based current screen index
  nome_mae: string;
  nome_filho: string;
  faixa_idade: string;
  perfil_filho: string;
  alimentos_recusados: string[];
  sentimento_mae: string;
  passou_pediatra: string;
  pediatra_disse: string;
  tentativas_anteriores: string[];
  urgencia: string;
};

export const initialState: QuizState = {
  step: 0,
  nome_mae: "",
  nome_filho: "",
  faixa_idade: "",
  perfil_filho: "",
  alimentos_recusados: [],
  sentimento_mae: "",
  passou_pediatra: "",
  pediatra_disse: "",
  tentativas_anteriores: [],
  urgencia: "",
};

const KEY = "sembirra_quiz_v1";

export function loadState(): QuizState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

export function useQuiz() {
  const [state, setState] = useState<QuizState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  const update = useCallback((patch: Partial<QuizState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const go = useCallback((step: number) => {
    setState((s) => ({ ...s, step }));
  }, []);

  return { state, update, go, hydrated, setState };
}

export function sanitize(s: string) {
  return s.replace(/[<>]/g, "").trim().slice(0, 60);
}

const ANALYTICS_KEY = "sembirra_analytics_v1";

export type AnalyticsEvent = {
  event: string;
  payload?: Record<string, unknown>;
  ts: number;
  sid: string;
};

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let sid = sessionStorage.getItem("sembirra_sid");
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("sembirra_sid", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

export function loadAnalytics(): AnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AnalyticsEvent[];
  } catch {
    return [];
  }
}

export function clearAnalytics() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ANALYTICS_KEY);
  } catch {}
}

export function track(event: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Facebook Pixel
  const w = window as unknown as { fbq?: (...a: unknown[]) => void };
  if (typeof w.fbq === "function") {
    w.fbq("trackCustom", event, payload || {});
  }
  // Persist localmente para o dashboard de retenção
  try {
    const all = loadAnalytics();
    all.push({ event, payload, ts: Date.now(), sid: getSessionId() });
    // Limita a 5000 eventos pra não estourar localStorage
    const trimmed = all.length > 5000 ? all.slice(-5000) : all;
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(trimmed));
  } catch {}
  // eslint-disable-next-line no-console
  console.log("[track]", event, payload || {});
}
