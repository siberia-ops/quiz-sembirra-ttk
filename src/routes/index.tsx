import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useQuiz, sanitize, track } from "@/lib/quiz-state";
import { sendQuizToWebhook } from "@/lib/quiz-webhook";
import { gendered } from "@/lib/gender";
import { Header, Screen, Headline, SubText, PrimaryButton, OptionCard } from "@/components/quiz/Shell";
import { LoadingScreen } from "@/components/quiz/LoadingScreen";
import {
  ALIMENTOS,
  DIAGNOSTICO_LINHAS,
  TENTATIVAS,
  LANDING_URL_PLACEHOLDER,
  IMAGEM_PRODUTO,
  IMAGEM_CRIANCA_FINAL,
} from "@/lib/quiz-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teste rápido — Sem Birra" },
      {
        name: "description",
        content:
          "Descubra em 60 segundos por que seu filho rejeita comida — e como mais de 12 mil mães resolveram a guerra do prato com a balinha Sem Birra.",
      },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: QuizPage,
});

/**
 * Step indexes (internal):
 * 0 Tela 1 — Nomes (não conta)
 * 1 Tela 2 — Idade (1/9)
 * 2 Tela 3 — Perfil (2/9)
 * 3 Tela 4 — Alimentos (3/9)
 * 4 Tela 5 — Diagnóstico (4/9)
 * 5 Tela 6 — Sentimento (5/9)
 * 6 Transição A
 * 7 Tela 7 — Pediatra (6/9)
 * 8 Tela 7b — Pediatra disse (parte do 6/9)
 * 9 Tela 8 — Tentativas (7/9)
 * 10 Tela 9 — Urgência (8/9)
 * 11 Transição B
 * 12 Tela final (9/9)
 */

const STEP_PROGRESS: Record<number, number> = {
  1: 1 / 9,
  2: 2 / 9,
  3: 3 / 9,
  4: 4 / 9,
  5: 5 / 9,
  7: 6 / 9,
  8: 6 / 9,
  9: 7 / 9,
  10: 8 / 9,
  12: 9 / 9,
};

function QuizPage() {
  const { state, update, go, hydrated } = useQuiz();

  useEffect(() => {
    if (hydrated) track("quiz_start");
  }, [hydrated]);

  if (!hydrated) {
    return <div className="min-h-screen bg-[var(--brand-cream)]" />;
  }

  // Bloco navegável atual: tela de carregamento é "muralha" — não dá pra voltar pra antes dela.
  // Bloco 1: 0..5  (antes da Transição A)
  // Bloco 2: 7..10 (entre Transição A e B)
  // Bloco 3: 12    (depois da Transição B — sem voltar)
  const blockStart = state.step >= 12 ? 12 : state.step >= 7 ? 7 : 0;
  const showBack =
    state.step > blockStart && state.step !== 6 && state.step !== 11;
  const progress = STEP_PROGRESS[state.step] ?? 0;
  const isLoading = state.step === 6 || state.step === 11;
  const g = gendered(state.nome_filho);

  const onBack = () => {
    let prev = state.step - 1;
    // Pula Tela 7b voltando se a mãe não passou pelo pediatra
    if (prev === 8 && state.passou_pediatra !== "sim") prev = 7;
    if (prev < blockStart) prev = blockStart;
    go(prev);
  };

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] text-[var(--brand-ink)]">
      {!isLoading && <Header progress={progress} onBack={onBack} showBack={showBack} />}

      <AnimatePresence mode="wait">
        {state.step === 0 && <Step1Names key="s1" state={state} update={update} go={go} />}
        {state.step === 1 && <Step2Idade key="s2" state={state} update={update} go={go} />}
        {state.step === 2 && <Step3Perfil key="s3" state={state} update={update} go={go} />}
        {state.step === 3 && <Step4Alimentos key="s4" state={state} update={update} go={go} />}
        {state.step === 4 && <Step5Diagnostico key="s5" state={state} go={go} />}
        {state.step === 5 && <Step6Sentimento key="s6" state={state} update={update} go={go} />}
        {state.step === 6 && (
          <LoadingScreen
            key="ta"
            title="Validando suas respostas… ✨"
            duration={6000}
            testimonial={{
              quote:
                "Achei que era só com o meu Pedro. Não era. Mais de 12 mil mães responderam esse mesmo teste.",
              author: "Marina, mãe do Pedro (5 anos), seletividade alimentar",
            }}
            onDone={() => go(7)}
          />
        )}
        {state.step === 7 && <Step7Pediatra key="s7" state={state} update={update} go={go} />}
        {state.step === 8 && <Step7bPediatraDisse key="s7b" state={state} update={update} go={go} />}
        {state.step === 9 && <Step8Tentativas key="s8" state={state} update={update} go={go} />}
        {state.step === 10 && <Step9Urgencia key="s9" state={state} update={update} go={go} />}
        {state.step === 11 && (
          <LoadingScreen
            key="tb"
            duration={4000}
            topLines={[`Quase pronto, ${state.nome_mae}.`, `Preparando o resultado ${g.pro} ${state.nome_filho}…`]}
            carousel={[
              {
                quote:
                  "O Bernardo come a balinha achando que é doce. Ele não faz ideia que tá tomando 8 vitaminas. Meu coração de mãe fica quentinho agora.",
                author: "Carla, mãe do Bernardo (4 anos), TEA não-verbal",
              },
              {
                quote:
                  "Cheguei a chorar quando o pediatra me disse que ele tá nutrido pela primeira vez. Foi só essa balinha.",
                author: "Tayná, mãe da Mel (6 anos), seletividade alimentar",
              },
              {
                quote:
                  "Não é publi. Eu testei nos meus dois filhos atípicos e foi o único que eles aceitaram.",
                author: "Renata, mãe atípica de gêmeos",
              },
            ]}
            onDone={() => {
              track("quiz_complete");
              void sendQuizToWebhook(state);
              go(12);
            }}
          />
        )}
        {state.step === 12 && <FinalScreen key="sf" state={state} />}
      </AnimatePresence>
    </div>
  );
}

/* -------------------- Step components -------------------- */

type StepProps = {
  state: ReturnType<typeof useQuiz>["state"];
  update: ReturnType<typeof useQuiz>["update"];
  go: ReturnType<typeof useQuiz>["go"];
};

function Step1Names({ state, update, go }: StepProps) {
  const [nome, setNome] = useState(state.nome_mae);
  const [filho, setFilho] = useState(state.nome_filho);
  const valid = nome.trim().length >= 2 && filho.trim().length >= 2;

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!valid) return;
    update({ nome_mae: sanitize(nome), nome_filho: sanitize(filho) });
    track("quiz_step_1_names");
    go(1);
  };


  return (
    <Screen>
      <Headline>Qual o seu nome e o nome do seu filho?</Headline>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="Seu nome" value={nome} onChange={setNome} placeholder="Ex: Marina" />
        <Field
          label="Nome do seu filho"
          value={filho}
          onChange={setFilho}
          placeholder="Ex: Pedro"
        />
        <div className="pt-4">
          <PrimaryButton type="submit" disabled={!valid} onClick={onSubmit}>
            Continuar
          </PrimaryButton>
        </div>
        <p className="text-[13px] text-[var(--brand-mute)] text-center pt-2">
          A gente usa os nomes só aqui no teste. Não compartilha com ninguém.
        </p>
      </form>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="block text-[14px] font-medium text-[var(--brand-ink)] mb-2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={60}
        autoComplete="off"
        className="w-full rounded-2xl border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] px-5 py-4 text-[17px] font-body text-[var(--brand-ink)] placeholder:text-[var(--brand-mute)] focus:outline-none focus:border-[var(--brand-green)] transition"
      />
    </label>
  );
}

function useAutoAdvance(selected: string | null, action: () => void) {
  useEffect(() => {
    if (!selected) return;
    const t = setTimeout(action, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
}

function Step2Idade({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string | null>(state.faixa_idade || null);
  useAutoAdvance(sel, () => {
    if (!sel) return;
    update({ faixa_idade: sel });
    track("quiz_step_2_idade", { faixa_idade: sel });
    go(2);
  });
  const opts = ["3 a 4 anos", "5 a 6 anos", "7 a 9 anos", "10 anos ou mais"];
  const g = gendered(state.nome_filho);
  return (
    <Screen>
      <Headline>
        {state.nome_mae}, quantos anos tem {g.o} {state.nome_filho}?
      </Headline>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
        {opts.map((o) => (
          <OptionCard key={o} title={o} selected={sel === o} onClick={() => setSel(o)} />
        ))}
      </div>
    </Screen>
  );
}

function Step3Perfil({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string | null>(state.perfil_filho || null);
  const g = gendered(state.nome_filho);
  useAutoAdvance(sel, () => {
    if (!sel) return;
    update({ perfil_filho: sel });
    track("quiz_step_3_perfil", { perfil_filho: sel });
    go(3);
  });
  const opts = [
    { key: "tipico", title: `${g.Ele} é ${g.adj("típico")}, mas muito ${g.adj("seletivo")}.`, subtitle: `Não tem diagnóstico, mas é ${g.adj("exigente")} com comida.` },
    { key: "atipico", title: `${g.Ele} é ${g.adj("atípico")}.`, subtitle: "TEA, TDAH ou neurodivergente." },
    { key: "sem_dx", title: "Ainda não tenho diagnóstico.", subtitle: `Mas ${g.ele} dá muito trabalho na hora da refeição.` },
  ];
  return (
    <Screen>
      <Headline>
        {state.nome_mae}, como você descreveria {g.o} {state.nome_filho}?
      </Headline>
      <div className="mt-8 space-y-3">
        {opts.map((o) => (
          <OptionCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            selected={sel === o.key}
            onClick={() => setSel(o.key)}
          />
        ))}
      </div>
    </Screen>
  );
}

function Step4Alimentos({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string[]>(state.alimentos_recusados || []);
  const toggle = (k: string) =>
    setSel((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));
  const submit = () => {
    if (sel.length === 0) return;
    update({ alimentos_recusados: sel });
    track("quiz_step_4_alimentos", { alimentos_recusados: sel });
    go(4);
  };
  const g = gendered(state.nome_filho);
  return (
    <Screen>
      <Headline>Quais alimentos {g.o} {state.nome_filho} recusa?</Headline>
      <SubText>Pode marcar mais de uma.</SubText>
      <div className="mt-6 space-y-3">
        {ALIMENTOS.map((a) => (
          <OptionCard
            key={a.key}
            emoji={a.emoji}
            title={a.label}
            subtitle={"subtitle" in a ? a.subtitle : undefined}
            selected={sel.includes(a.key)}
            onClick={() => toggle(a.key)}
          />
        ))}
      </div>
      <div className="mt-8">
        <PrimaryButton disabled={sel.length === 0} onClick={submit}>
          Continuar
        </PrimaryButton>
      </div>
    </Screen>
  );
}

function Step5Diagnostico({ state, go }: { state: StepProps["state"]; go: StepProps["go"] }) {
  const linhas = state.alimentos_recusados
    .map((k) => DIAGNOSTICO_LINHAS[k])
    .filter(Boolean);
  const g = gendered(state.nome_filho);
  return (
    <Screen>
      <Headline>
        {state.nome_mae}, tem uma coisa importante sobre {g.o} {state.nome_filho}.
      </Headline>
      <p className="mt-4 text-[16px] md:text-[17px] leading-relaxed text-[var(--brand-ink)]">
        Pelo que você marcou, {g.o} {state.nome_filho} pode estar com algumas vitaminas e minerais
        abaixo do ideal. Mais de{" "}
        <strong className="text-[var(--brand-green)]">7 em cada 10 crianças com seletividade alimentar</strong>{" "}
        passam por isso — e tem solução.
      </p>
      <ul className="mt-6 space-y-3">
        {linhas.map((l, i) => (
          <li
            key={i}
            className="rounded-2xl border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] px-5 py-4 flex gap-3"
          >
            <span className="text-2xl">{l.emoji}</span>
            <div>
              <div className="font-display font-semibold text-[17px] text-[var(--brand-ink)]">
                {l.title}
              </div>
              <p className="text-[14px] text-[var(--brand-mute)] mt-1 leading-relaxed">{l.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[14px] text-[var(--brand-mute)] text-center italic">
        Não é culpa sua, {state.nome_mae}. A gente vai te mostrar o caminho.
      </p>
      <div className="mt-6">
        <PrimaryButton
          onClick={() => {
            track("quiz_step_5_diagnostico");
            go(5);
          }}
        >
          Continuar
        </PrimaryButton>
      </div>
    </Screen>
  );
}

function Step6Sentimento({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string | null>(state.sentimento_mae || null);
  const g = gendered(state.nome_filho);
  useAutoAdvance(sel, () => {
    if (!sel) return;
    update({ sentimento_mae: sel });
    track("quiz_step_6_sentimento", { sentimento_mae: sel });
    go(6);
  });
  const opts = [
    { key: "esgotada", title: "Esgotada.", subtitle: "Toda refeição vira briga." },
    { key: "preocupada", title: "Preocupada.", subtitle: `Tenho medo d${g.ele} estar com carência de alguma coisa.` },
    { key: "desisti", title: "Já desisti de oferecer salada.", subtitle: `Dou o que ${g.ele} aceita pra ${g.ele} não ficar com fome.` },
    { key: "culpa", title: "Sinto culpa.", subtitle: `Sei que tô deixando de dar coisa que ${g.ele} precisa.` },
    { key: "esperanca", title: "Ainda tenho esperança.", subtitle: "Mas tô no meu limite." },
  ];
  return (
    <Screen>
      <Headline>
        E você, {state.nome_mae} — como tá se sentindo na hora das refeições {g.do} {state.nome_filho}?
      </Headline>
      <div className="mt-8 space-y-3">
        {opts.map((o) => (
          <OptionCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            selected={sel === o.key}
            onClick={() => setSel(o.key)}
          />
        ))}
      </div>
    </Screen>
  );
}

function Step7Pediatra({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string | null>(state.passou_pediatra || null);
  useAutoAdvance(sel, () => {
    if (!sel) return;
    update({ passou_pediatra: sel });
    track("quiz_step_7_pediatra", { passou_pediatra: sel });
    go(sel === "sim" ? 8 : 9);
  });
  const opts = [
    { key: "sim", title: "Sim.", subtitle: "Já levei pra avaliar." },
    { key: "nao", title: "Ainda não.", subtitle: "Mas é uma das coisas que mais me preocupam." },
  ];
  const g = gendered(state.nome_filho);
  return (
    <Screen>
      <Headline>
        Você já levou {g.o} {state.nome_filho} no pediatra ou nutricionista pra avaliar isso?
      </Headline>
      <div className="mt-8 space-y-3">
        {opts.map((o) => (
          <OptionCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            selected={sel === o.key}
            onClick={() => setSel(o.key)}
          />
        ))}
      </div>
    </Screen>
  );
}

function Step7bPediatraDisse({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string | null>(state.pediatra_disse || null);
  useAutoAdvance(sel, () => {
    if (!sel) return;
    update({ pediatra_disse: sel });
    track("quiz_step_7b_pediatra_disse", { pediatra_disse: sel });
    go(9);
  });
  const g = gendered(state.nome_filho);
  const opts = [
    { key: "recomendou", title: "Recomendou suplementação.", subtitle: `Mas ${g.ele} não aceita os suplementos do mercado.` },
    { key: "exame", title: "O exame mostrou vitamina baixa.", subtitle: "Pelo menos uma das vitaminas tá fora do ideal." },
    { key: "tudo_bem", title: "Falou que tá tudo bem.", subtitle: "Mas eu mesma desconfio que tem alguma carência." },
  ];
  return (
    <Screen>
      <Headline>
        E o que o pediatra ou nutricionista disse sobre {g.o} {state.nome_filho}?
      </Headline>
      <div className="mt-8 space-y-3">
        {opts.map((o) => (
          <OptionCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            selected={sel === o.key}
            onClick={() => setSel(o.key)}
          />
        ))}
      </div>
    </Screen>
  );
}

function Step8Tentativas({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string[]>(state.tentativas_anteriores || []);
  const toggle = (k: string) =>
    setSel((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));
  const submit = () => {
    if (sel.length === 0) return;
    update({ tentativas_anteriores: sel });
    track("quiz_step_8_tentativas", { tentativas_anteriores: sel });
    go(10);
  };
  const g = gendered(state.nome_filho);
  return (
    <Screen>
      <Headline>Já tentou alguma dessas opções com {g.o} {state.nome_filho}?</Headline>
      <SubText>Pode marcar mais de uma.</SubText>
      <div className="mt-6 space-y-3">
        {TENTATIVAS.map((t) => (
          <OptionCard
            key={t.key}
            emoji={t.emoji}
            title={t.label}
            subtitle={t.subtitle}
            selected={sel.includes(t.key)}
            onClick={() => toggle(t.key)}
          />
        ))}
      </div>
      <div className="mt-8">
        <PrimaryButton disabled={sel.length === 0} onClick={submit}>
          Continuar
        </PrimaryButton>
      </div>
    </Screen>
  );
}

function Step9Urgencia({ state, update, go }: StepProps) {
  const [sel, setSel] = useState<string | null>(state.urgencia || null);
  useAutoAdvance(sel, () => {
    if (!sel) return;
    update({ urgencia: sel });
    track("quiz_step_9_urgencia", { urgencia: sel });
    go(11);
  });
  const g = gendered(state.nome_filho);
  const opts = [
    { key: "hoje", title: "Hoje.", subtitle: "Eu não aguento mais." },
    { key: "semanas", title: "Nas próximas semanas.", subtitle: "Dá pra esperar um pouco." },
    { key: "tempo_dele", title: `No tempo d${g.ele}.`, subtitle: `Não tenho pressa, ${g.ele} faz quando estiver ${g.adj("pronto")}.` },
  ];
  return (
    <Screen>
      <Headline>
        Quando você gostaria de ver {g.o} {state.nome_filho} aceitando comida saudável{" "}
        <span className="font-bold text-[var(--brand-green)]">sem birra</span>?
      </Headline>
      <div className="mt-8 space-y-3">
        {opts.map((o) => (
          <OptionCard
            key={o.key}
            title={o.title}
            subtitle={o.subtitle}
            selected={sel === o.key}
            onClick={() => setSel(o.key)}
          />
        ))}
      </div>
    </Screen>
  );
}

function FinalScreen({ state }: { state: StepProps["state"] }) {
  const g = gendered(state.nome_filho);
  const diagnostico = useMemo(() => buildDiagnostico(state), [state]);

  useEffect(() => {
    track("quiz_final_view");
  }, []);



  const ctaUrl = useMemo(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    return search ? `${LANDING_URL_PLACEHOLDER}${search}` : LANDING_URL_PLACEHOLDER;
  }, []);

  const onCta = () => {
    track("cta_click", { url: ctaUrl });
    window.location.href = ctaUrl;
  };

  return (
    <Screen>
      <Headline>
        {state.nome_mae}, tem uma coisa que você precisa saber sobre {g.o} {state.nome_filho}.
      </Headline>

      <div className="mt-6 overflow-hidden rounded-[24px] border-[1.5px] border-[var(--brand-border)] bg-[var(--card)]">
        <img
          src={IMAGEM_CRIANCA_FINAL}
          alt={`Criança feliz comendo a balinha Sem Birra`}
          className="w-full max-w-[480px] mx-auto h-auto object-cover block"
        />
      </div>

      <div className="mt-6 rounded-2xl border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] p-5">
        <p className="text-[16px] leading-relaxed text-[var(--brand-ink)]">{diagnostico}</p>
        <p className="mt-4 text-[16px] leading-relaxed text-[var(--brand-ink)]">
          A boa notícia: a balinha do Sem Birra foi feita exatamente pra esse perfil —{" "}
          <strong>crianças de {state.faixa_idade} como {g.o} {state.nome_filho}</strong>. Ela não
          precisa ser engolida, não tem sabor de remédio, e mais de <strong>3 mil mães</strong> já
          confirmaram que os filhos aceitam.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[24px] border-[1.5px] border-[var(--brand-border)] bg-[var(--card)]">
        <img
          src={IMAGEM_PRODUTO}
          alt="Pote da balinha Sem Birra Kids — sabor morango, 30 unidades"
          className="w-full h-auto object-cover block"
          loading="lazy"
        />
      </div>

      <h2 className="mt-10 font-display font-semibold text-[22px] md:text-[26px] text-[var(--brand-ink)]">
        Veja como é simples começar:
      </h2>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <StepCard
          emoji="📦"
          text={
            <>
              A gente envia um <strong>pote de 30 balinhas</strong> direto pra sua casa! Frete grátis em todo o Brasil.
            </>
          }
        />
        <StepCard
          emoji="🍓"
          text={
            <>
              Você dá <strong>1 balinha por dia</strong> {g.pro} {state.nome_filho}. Sabor morango,
              textura de goma, {g.ele} com certeza vai amar!
            </>
          }
        />
        <StepCard
          emoji="✅"


          text={
            <>
              Em <strong>30 dias</strong> {g.ele} tá com 8 vitaminas e minerais que faltavam. Sem
              briga, sem chorar, sem disfarçar na comida.
            </>
          }
        />
        <StepCard
          emoji="💚"
          text={
            <>
              Se {g.ele} <strong>não aceitar</strong>, devolve sem perguntar nada. Garantia de 30 dias.
            </>
          }
        />
      </div>

      <div className="mt-10">
        <PrimaryButton onClick={onCta}>Quero a balinha {g.pro} {state.nome_filho}</PrimaryButton>
        <p className="mt-3 text-center text-[13px] text-[var(--brand-mute)]">
          ✓ Mais de 12 mil mães já compraram · ✓ Frete grátis · ✓ Garantia 30 dias
        </p>
      </div>

      <p className="mt-10 mb-6 text-center text-[14px] text-[var(--brand-ink)]">
        🧩🌈 Feito por mães atípicas, pra mães atípicas. Graças a Deus a gente achou.
      </p>
    </Screen>
  );
}

function StepCard({ emoji, text }: { emoji: string; text: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] p-4">
      <span className="text-2xl leading-none">{emoji}</span>
      <p className="text-[15px] leading-relaxed text-[var(--brand-ink)]">{text}</p>
    </div>
  );
}

function buildDiagnostico(state: StepProps["state"]): string {
  const parts: string[] = [];
  const alim = state.alimentos_recusados;
  const filho = state.nome_filho;
  const g = gendered(filho);

  // Frase 1 — rejeição alimentar
  if (alim.includes("vegetais") && alim.includes("frutas")) {
    parts.push(`rejeita vegetais e frutas`);
  } else if (alim.includes("vegetais")) {
    parts.push(`rejeita vegetais e folhas`);
  } else if (alim.includes("frutas")) {
    parts.push(`rejeita frutas`);
  } else if (alim.includes("carnes")) {
    parts.push(`rejeita carnes e proteínas`);
  } else if (alim.includes("massa")) {
    parts.push(`aceita basicamente só massa, arroz e salgadinho`);
  } else if (alim.includes("nova")) {
    parts.push(`tem dificuldade com qualquer comida nova`);
  } else if (alim.includes("misturada")) {
    parts.push(`só come a comida separada`);
  }

  // Frase 2 — tentativas
  const tent = state.tentativas_anteriores;
  if (tent.length > 0 && !tent.includes("nada")) {
    parts.push(`já recusou suplementos que você tentou`);
  } else if (tent.includes("nada")) {
    parts.push(`ainda não passou por nenhuma suplementação`);
  }

  // Frase 3 — pediatra
  if (state.pediatra_disse === "exame") {
    parts.push(`e o último exame mostrou alguma vitamina baixa`);
  } else if (state.pediatra_disse === "recomendou") {
    parts.push(`e o pediatra já recomendou suplementação`);
  } else if (state.pediatra_disse === "tudo_bem") {
    parts.push(`e mesmo o pediatra dizendo que tá tudo bem, você sente que falta algo`);
  } else if (state.passou_pediatra === "nao") {
    parts.push(`e ainda não passou por uma avaliação nutricional`);
  }

  if (parts.length === 0) {
    return `Pelo que você nos contou, ${g.o} ${filho} tem um perfil bem comum aqui entre as mães que fizeram esse teste.`;
  }

  // Build natural sentence
  const joined =
    parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(", ") + ", " + parts[parts.length - 1];

  return `Pelo que você nos contou, ${g.o} ${filho} tem um perfil bem comum aqui: ${joined}.`;
}
