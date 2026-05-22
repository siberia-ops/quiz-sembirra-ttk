import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function LoadingScreen({
  title,
  testimonial,
  duration,
  onDone,
  carousel,
  topLines,
}: {
  title?: string;
  testimonial?: { quote: string; author: string };
  carousel?: { quote: string; author: string }[];
  topLines?: string[];
  duration: number;
  onDone: () => void;
}) {
  const [carouselIdx, setCarouselIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  useEffect(() => {
    if (!carousel) return;
    const i = setInterval(() => {
      setCarouselIdx((idx) => (idx + 1) % carousel.length);
    }, 2000);
    return () => clearInterval(i);
  }, [carousel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-[var(--brand-cream)] flex flex-col items-center justify-center px-6 text-center"
    >
      {topLines && (
        <div className="mb-10 space-y-1">
          {topLines.map((l, i) => (
            <p
              key={i}
              className="font-display font-semibold text-[22px] md:text-[28px] text-[var(--brand-ink)] leading-snug"
            >
              {l}
            </p>
          ))}
        </div>
      )}

      <PuzzleSpinner />

      {title && (
        <p className="mt-8 font-display font-semibold text-[22px] md:text-[26px] text-[var(--brand-ink)]">
          {title}
        </p>
      )}

      {testimonial && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-10 max-w-md rounded-2xl border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] p-5 text-left shadow-sm"
        >
          <p className="text-[15px] leading-relaxed text-[var(--brand-ink)]">"{testimonial.quote}"</p>
          <p className="mt-3 text-[13px] text-[var(--brand-mute)]">— {testimonial.author}</p>
        </motion.div>
      )}

      {carousel && (
        <div className="mt-10 w-full max-w-md min-h-[170px] relative">
          {carousel.map((c, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: carouselIdx === i ? 1 : 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-2xl border-[1.5px] border-[var(--brand-border)] bg-[var(--card)] p-5 text-left shadow-sm"
              style={{ pointerEvents: carouselIdx === i ? "auto" : "none" }}
            >
              <p className="text-[15px] leading-relaxed text-[var(--brand-ink)]">"{c.quote}"</p>
              <p className="mt-3 text-[13px] text-[var(--brand-mute)]">— {c.author}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function PuzzleSpinner() {
  return (
    <motion.div
      animate={{ rotate: [0, 8, -8, 0] }}
      transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
      className="size-20 grid place-items-center"
    >
      <img
        src="/images/peca-sem-birra.webp"
        alt=""
        aria-hidden
        className="size-20 object-contain select-none"
        draggable={false}
      />
    </motion.div>
  );
}
