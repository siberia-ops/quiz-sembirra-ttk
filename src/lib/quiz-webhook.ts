import type { QuizState } from "./quiz-state";
import { ALIMENTOS, TENTATIVAS } from "./quiz-data";

const QUIZ_ID_MANUAL = "sem_birra";
const WEBHOOK_URL =
  "https://primary-production-7cc92.up.railway.app/webhook/08850030-36a4-4c9a-86f5-1a6cad5ba3ee";

const PERFIL_LABELS: Record<string, string> = {
  tipico: "Ele é típico, mas muito seletivo.",
  atipico: "Ele é atípico.",
  sem_dx: "Ainda não tenho diagnóstico.",
};

const SENTIMENTO_LABELS: Record<string, string> = {
  esgotada: "Esgotada.",
  preocupada: "Preocupada.",
  desisti: "Já desisti de oferecer salada.",
  culpa: "Sinto culpa.",
  esperanca: "Ainda tenho esperança.",
};

const PEDIATRA_LABELS: Record<string, string> = {
  sim: "Sim, já levei pra avaliar.",
  nao: "Ainda não.",
};

const PEDIATRA_DISSE_LABELS: Record<string, string> = {
  recomendou: "Recomendou suplementação.",
  exame: "O exame mostrou vitamina baixa.",
  tudo_bem: "Falou que tá tudo bem.",
};

const URGENCIA_LABELS: Record<string, string> = {
  hoje: "Hoje.",
  semanas: "Nas próximas semanas.",
  tempo_dele: "No tempo dele.",
};

function labelsFrom<T extends { key: string; label: string }>(
  source: readonly T[],
  keys: string[],
): string[] {
  return keys
    .map((k) => source.find((s) => s.key === k)?.label)
    .filter((v): v is string => Boolean(v));
}

export function buildQuizPayload(state: QuizState) {
  const rows: { step: number; answers: string[] }[] = [];
  let step = 1;

  const nomes = [state.nome_mae, state.nome_filho].filter(Boolean);
  if (nomes.length) rows.push({ step: step++, answers: nomes });

  if (state.faixa_idade) rows.push({ step: step++, answers: [state.faixa_idade] });

  if (state.perfil_filho)
    rows.push({
      step: step++,
      answers: [PERFIL_LABELS[state.perfil_filho] ?? state.perfil_filho],
    });

  if (state.alimentos_recusados.length)
    rows.push({ step: step++, answers: labelsFrom(ALIMENTOS, state.alimentos_recusados) });

  if (state.sentimento_mae)
    rows.push({
      step: step++,
      answers: [SENTIMENTO_LABELS[state.sentimento_mae] ?? state.sentimento_mae],
    });

  if (state.passou_pediatra)
    rows.push({
      step: step++,
      answers: [PEDIATRA_LABELS[state.passou_pediatra] ?? state.passou_pediatra],
    });

  if (state.pediatra_disse)
    rows.push({
      step: step++,
      answers: [PEDIATRA_DISSE_LABELS[state.pediatra_disse] ?? state.pediatra_disse],
    });

  if (state.tentativas_anteriores.length)
    rows.push({
      step: step++,
      answers: labelsFrom(TENTATIVAS, state.tentativas_anteriores),
    });

  if (state.urgencia)
    rows.push({
      step: step++,
      answers: [URGENCIA_LABELS[state.urgencia] ?? state.urgencia],
    });

  return { quiz_id: QUIZ_ID_MANUAL, rows };
}

export async function sendQuizToWebhook(state: QuizState): Promise<void> {
  const payload = buildQuizPayload(state);
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[quiz-webhook] erro ao enviar:", err);
  }
}
