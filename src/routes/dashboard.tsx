import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { loadAnalytics, clearAnalytics, type AnalyticsEvent } from "@/lib/quiz-state";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de retenção — Sem Birra" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});

/**
 * Funil do quiz — cada etapa é um evento disparado quando a usuária ENTRA naquela tela.
 * "quiz_start" = abriu a Tela 1 (nomes).
 * As demais etapas são disparadas ao avançar a etapa anterior.
 */
type FunnelStep = {
  key: string;
  label: string;
  desc: string;
  loadingAfter?: boolean; // marca telas de carregamento (muralha)
};

const FUNNEL: FunnelStep[] = [
  { key: "quiz_start", label: "Tela 1 — Abriu o quiz", desc: "Chegou na tela de nomes." },
  { key: "quiz_step_1_names", label: "Tela 1 — Preencheu nomes", desc: "Digitou nome da mãe e do filho." },
  { key: "quiz_step_2_idade", label: "Tela 2 — Idade", desc: "Escolheu a faixa de idade." },
  { key: "quiz_step_3_perfil", label: "Tela 3 — Perfil", desc: "Descreveu o perfil da criança." },
  { key: "quiz_step_4_alimentos", label: "Tela 4 — Alimentos recusados", desc: "Marcou os alimentos." },
  { key: "quiz_step_5_diagnostico", label: "Tela 5 — Diagnóstico", desc: "Leu o diagnóstico e clicou continuar." },
  { key: "quiz_step_6_sentimento", label: "Tela 6 — Sentimento da mãe", desc: "Escolheu como tá se sentindo.", loadingAfter: true },
  { key: "quiz_step_7_pediatra", label: "Tela 7 — Pediatra (pós Transição A)", desc: "Passou pela tela de carregamento A." },
  { key: "quiz_step_7b_pediatra_disse", label: "Tela 7b — O que o pediatra disse", desc: "Só quem respondeu 'sim' no pediatra." },
  { key: "quiz_step_8_tentativas", label: "Tela 8 — Tentativas anteriores", desc: "Marcou tentativas." },
  { key: "quiz_step_9_urgencia", label: "Tela 9 — Urgência", desc: "Escolheu urgência.", loadingAfter: true },
  { key: "quiz_final_view", label: "Tela final (pós Transição B)", desc: "Chegou na página de venda." },
  { key: "cta_click", label: "Clique no CTA", desc: "Clicou em 'Quero a balinha'." },
];

function DashboardPage() {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setEvents(loadAnalytics());
    const id = setInterval(() => setEvents(loadAnalytics()), 3000);
    return () => clearInterval(id);
  }, [tick]);

  // Conta sessões únicas que dispararam cada evento
  const counts = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const ev of events) {
      if (!map[ev.event]) map[ev.event] = new Set();
      map[ev.event].add(ev.sid);
    }
    const out: Record<string, number> = {};
    for (const k of Object.keys(map)) out[k] = map[k].size;
    return out;
  }, [events]);

  const totalSessions = counts["quiz_start"] ?? 0;
  const finalReach = counts["quiz_final_view"] ?? 0;
  const ctaClicks = counts["cta_click"] ?? 0;

  const overallRetention = totalSessions > 0 ? (finalReach / totalSessions) * 100 : 0;
  const ctaConversion = totalSessions > 0 ? (ctaClicks / totalSessions) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-[var(--brand-ink)]">
      <div className="mx-auto max-w-[960px] px-5 py-10">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-[28px] md:text-[34px] font-semibold leading-tight">
              Dashboard de retenção
            </h1>
            <p className="mt-1 text-[14px] text-[var(--brand-mute)]">
              Dados coletados localmente neste navegador. Atualiza sozinho a cada 3s.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTick((t) => t + 1)}
              className="rounded-full border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--brand-cream)] transition"
            >
              Atualizar
            </button>
            <button
              onClick={() => {
                if (confirm("Apagar todos os eventos coletados neste navegador?")) {
                  clearAnalytics();
                  setTick((t) => t + 1);
                }
              }}
              className="rounded-full border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] px-4 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 transition"
            >
              Limpar dados
            </button>
          </div>
        </header>

        {/* KPIs gerais */}
        <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Sessões totais" value={totalSessions.toString()} />
          <Kpi label="Chegaram à tela final" value={finalReach.toString()} />
          <Kpi label="Retenção geral" value={`${overallRetention.toFixed(1)}%`} highlight />
          <Kpi label="Conversão CTA" value={`${ctaConversion.toFixed(1)}%`} />
        </section>

        {/* Funil */}
        <section className="mt-10">
          <h2 className="font-display text-[20px] font-semibold mb-4">
            Funil etapa por etapa
          </h2>
          {totalSessions === 0 ? (
            <div className="rounded-2xl border-[1.5px] border-dashed border-[var(--brand-border)] bg-[var(--card)] p-8 text-center text-[var(--brand-mute)]">
              Nenhum evento ainda. Faça o quiz pelo menos uma vez pra começar a coletar dados.
            </div>
          ) : (
            <ol className="space-y-2">
              {FUNNEL.map((step, i) => {
                const value = counts[step.key] ?? 0;
                const prev = i > 0 ? counts[FUNNEL[i - 1].key] ?? 0 : value;
                const retentionFromPrev = prev > 0 ? (value / prev) * 100 : 0;
                const retentionFromStart = totalSessions > 0 ? (value / totalSessions) * 100 : 0;
                const dropFromPrev = Math.max(0, prev - value);
                return (
                  <li
                    key={step.key}
                    className={`rounded-2xl border-[1.5px] bg-[var(--card)] p-4 ${
                      step.loadingAfter
                        ? "border-amber-300"
                        : "border-[var(--brand-border)]"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-mono text-[var(--brand-mute)]">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="font-display font-semibold text-[16px]">
                            {step.label}
                          </span>
                          {step.loadingAfter && (
                            <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                              ↓ tela de carregamento depois
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[13px] text-[var(--brand-mute)]">{step.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display font-semibold text-[20px]">{value}</div>
                        <div className="text-[12px] text-[var(--brand-mute)]">sessões</div>
                      </div>
                    </div>

                    {/* Barra de retenção desde o início */}
                    <div className="mt-3 h-2 w-full rounded-full bg-[var(--brand-cream)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--brand-green)] transition-all"
                        style={{ width: `${retentionFromStart}%` }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[12px] text-[var(--brand-mute)] flex-wrap gap-2">
                      <span>
                        Retenção desde o início:{" "}
                        <strong className="text-[var(--brand-ink)]">
                          {retentionFromStart.toFixed(1)}%
                        </strong>
                      </span>
                      {i > 0 && (
                        <span>
                          {retentionFromPrev >= 100 ? "Manteve" : "Continuaram"} da etapa anterior:{" "}
                          <strong className="text-[var(--brand-ink)]">
                            {retentionFromPrev.toFixed(1)}%
                          </strong>
                          {dropFromPrev > 0 && (
                            <span className="text-red-600 ml-2">
                              — perdeu {dropFromPrev}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Resposta agregada por etapa */}
        <section className="mt-10">
          <h2 className="font-display text-[20px] font-semibold mb-4">
            Respostas mais comuns
          </h2>
          <Breakdown title="Faixa de idade" events={events} eventKey="quiz_step_2_idade" field="faixa_idade" />
          <Breakdown title="Perfil do filho" events={events} eventKey="quiz_step_3_perfil" field="perfil_filho" />
          <Breakdown title="Sentimento da mãe" events={events} eventKey="quiz_step_6_sentimento" field="sentimento_mae" />
          <Breakdown title="Passou no pediatra" events={events} eventKey="quiz_step_7_pediatra" field="passou_pediatra" />
          <Breakdown title="Urgência" events={events} eventKey="quiz_step_9_urgencia" field="urgencia" />
        </section>

        <p className="mt-10 text-[12px] text-[var(--brand-mute)] text-center">
          {events.length} evento(s) armazenado(s) no localStorage deste dispositivo.
        </p>
      </div>
    </div>
  );
}

function Kpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border-[1.5px] p-4 ${
        highlight
          ? "border-[var(--brand-green)] bg-[var(--brand-green)]/10"
          : "border-[var(--brand-border)] bg-[var(--card)]"
      }`}
    >
      <div className="text-[12px] uppercase tracking-wide text-[var(--brand-mute)]">{label}</div>
      <div className="mt-1 font-display text-[24px] font-semibold">{value}</div>
    </div>
  );
}

function Breakdown({
  title,
  events,
  eventKey,
  field,
}: {
  title: string;
  events: AnalyticsEvent[];
  eventKey: string;
  field: string;
}) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ev of events) {
      if (ev.event !== eventKey) continue;
      const v = ev.payload?.[field];
      if (Array.isArray(v)) {
        for (const item of v) {
          const k = String(item);
          map[k] = (map[k] ?? 0) + 1;
        }
      } else if (v != null) {
        const k = String(v);
        map[k] = (map[k] ?? 0) + 1;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [events, eventKey, field]);

  const total = counts.reduce((s, [, n]) => s + n, 0);

  if (total === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] p-4">
      <div className="font-display font-semibold text-[15px] mb-3">{title}</div>
      <ul className="space-y-2">
        {counts.map(([k, n]) => {
          const pct = total > 0 ? (n / total) * 100 : 0;
          return (
            <li key={k}>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="truncate">{k}</span>
                <span className="text-[var(--brand-mute)] shrink-0 ml-2">
                  {n} · {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--brand-cream)] overflow-hidden">
                <div className="h-full bg-[var(--brand-green)]" style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
