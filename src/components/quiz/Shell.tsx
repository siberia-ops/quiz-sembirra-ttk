import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export const LOGO_SEM_BIRRA = "/images/logo-sem-birra.webp";
export const PECA_SEM_BIRRA = "/images/peca-sem-birra.webp";

export function Header({
  progress,
  onBack,
  showBack,
}: {
  progress: number; // 0..1
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--brand-cream)]/95 backdrop-blur border-b border-[var(--brand-border)]/60">
      <div className="relative flex items-center justify-center px-4 py-3">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--brand-mute)] hover:text-[var(--brand-green)] hover:bg-[var(--brand-cream)] transition"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <img
          src={LOGO_SEM_BIRRA}
          alt="Sem Birra"
          className="h-20 md:h-28 w-auto object-contain select-none"
          draggable={false}
        />
      </div>
      {progress > 0 && (
        <div className="h-1 w-full bg-[var(--brand-border)]/50">
          <motion.div
            className="h-full bg-[var(--brand-green)]"
            initial={false}
            animate={{ width: `${Math.min(100, progress * 100)}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </div>
      )}
    </header>
  );
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto w-full max-w-xl px-5 pt-6 pb-12"
    >
      {children}
    </motion.section>
  );
}

export function Headline({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display font-bold text-[28px] md:text-[36px] leading-tight tracking-tight text-[var(--brand-ink)]">
      {children}
    </h1>
  );
}

export function SubText({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] md:text-base text-[var(--brand-mute)] leading-relaxed">{children}</p>;
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="w-full md:max-w-[480px] mx-auto block rounded-full bg-[var(--brand-green)] text-white font-display font-bold text-[17px] py-[18px] px-6 shadow-sm transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brand-ink)]"
    >
      {children}
    </button>
  );
}

export function OptionCard({
  title,
  subtitle,
  emoji,
  selected,
  onClick,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      animate={selected ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`w-full text-left rounded-2xl bg-[var(--card)] px-5 py-4 border-[1.5px] transition shadow-none hover:shadow-md ${
        selected
          ? "border-[var(--brand-green)] bg-[color-mix(in_oklab,var(--brand-green-medium)_10%,var(--card))]"
          : "border-[var(--brand-border)] hover:border-[var(--brand-green)]"
      }`}
    >
      <div className="flex items-start gap-3">
        {emoji && <span className="text-2xl leading-none mt-0.5">{emoji}</span>}
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-[18px] md:text-[20px] text-[var(--brand-ink)] leading-snug">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 text-[14px] md:text-[15px] text-[var(--brand-mute)] leading-snug">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
