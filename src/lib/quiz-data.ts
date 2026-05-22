// Screen content data — kept separate so copy edits don't touch structure.

export const ALIMENTOS = [
  { key: "vegetais", emoji: "🥦", label: "Vegetais e folhas" },
  { key: "frutas", emoji: "🍎", label: "Frutas" },
  { key: "carnes", emoji: "🍗", label: "Carnes e proteínas" },
  { key: "misturada", emoji: "🥄", label: "Comida misturada", subtitle: "Ele só come separado" },
  {
    key: "massa",
    emoji: "🍝",
    label: "Praticamente só aceita massa, arroz, salgadinho",
  },
  { key: "nova", emoji: "👀", label: "Comida nova", subtitle: "Qualquer textura ou cor diferente" },
] as const;

export const DIAGNOSTICO_LINHAS: Record<string, { emoji: string; title: string; text: string }> = {
  vegetais: {
    emoji: "🥦",
    title: "Vegetais e folhas",
    text: "Costumam faltar Vitamina A, Vitamina K, Ácido Fólico e Ferro.",
  },
  frutas: {
    emoji: "🍎",
    title: "Frutas",
    text: "Costumam faltar Vitamina C, Potássio e Fibras.",
  },
  carnes: {
    emoji: "🍗",
    title: "Carnes e proteínas",
    text: "Costumam faltar Ferro, Zinco e Vitamina B12.",
  },
  misturada: {
    emoji: "🥄",
    title: "Comida misturada",
    text: "Quando come tudo separado, ele perde a variedade nutricional combinada de cada refeição.",
  },
  massa: {
    emoji: "🍝",
    title: "Praticamente só massa, arroz, salgadinho",
    text: "Esse padrão costuma deixar a criança com carência geral de vitaminas e fibras. O corpo recebe energia, mas não recebe os blocos pra crescer.",
  },
  nova: {
    emoji: "👀",
    title: "Comida nova",
    text: "A neofobia alimentar é muito comum em crianças atípicas. Trava a entrada de novas vitaminas no cardápio.",
  },
};

export const TENTATIVAS = [
  { key: "liquido", emoji: "💧", label: "Suplemento líquido", subtitle: "Ele recusa o sabor" },
  { key: "comprimido", emoji: "💊", label: "Comprimido", subtitle: "Não consigo fazer ele engolir" },
  {
    key: "outra",
    emoji: "🍬",
    label: "Goma/balinha de outra marca",
    subtitle: "Ele não aceitou",
  },
  { key: "nada", emoji: "🤷", label: "Nada ainda", subtitle: "Não sei por onde começar" },
] as const;

export const LANDING_URL_PLACEHOLDER = "https://shop.sembirra.com/";
export const FB_PIXEL_ID = "[FB_PIXEL_ID]";
export const IMAGEM_HERO = "/images/imagem-hero.webp";
export const IMAGEM_PRODUTO = "/images/imagem-produto.webp";
export const IMAGEM_CRIANCA_FINAL = "/images/imagem-crianca-final.webp";
