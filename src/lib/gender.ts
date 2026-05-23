// Detecção de gênero por nome (heurística + lista de exceções brasileiras)
// Retorna helpers para flexionar artigos, pronomes e adjetivos.

export type Gen = "m" | "f";

function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)[0] || "";
}

// Nomes masculinos terminados em "a" (exceções à regra geral)
const MASC_TERM_A = new Set([
  "luca", "noa", "aba", "akira", "issa", "elia", "ezra", "joshua",
  "costa", "dakota", "ravena", "iara",
]);

// Nomes femininos NÃO terminados em "a" (exceções: terminam em consoante, e, i, o, etc.)
const FEM_OVERRIDE = new Set([
  // -iz / -is / -es
  "beatriz", "beatris", "beatrice", "luz", "inez", "ines", "inês",
  "tais", "thais", "thaís", "thaís", "lais", "laís", "anais", "anaís",
  "doris", "dóris", "iris", "íris", "agnes", "agnez",
  // -el / -l
  "mabel", "isabel", "isabél", "raquel", "rachel", "ester", "esther",
  "mel", "mell", "abigail", "rebekah", "miguela",
  // -en / -in / -m / -n
  "carmen", "carmem", "karen", "helen", "hellen", "ellen", "gwen",
  "miriam", "mirian", "miryam", "yasmin", "yasmim", "jasmin", "jasmim",
  "madalen", "edith", "judith", "ruth", "rute",
  // -e (femininos comuns)
  "alice", "helice", "janice", "berenice", "eunice", "beatrice",
  "daphne", "dafne", "chloe", "cloe", "khloe", "adele", "adelaide",
  "jade", "penelope", "pénelope", "brooke", "madeline", "heloise", "heloíse",
  "luize", "luise", "louise", "denise", "elise", "iolande", "violete",
  // -i (femininos)
  "naomi", "naomy", "noemi", "noemy", "emi", "kelli", "kelly",
  // -o (raros femininos)
  "io", "cleo",
  // sufixos diversos
  "carol", "karol", "cher", "esther", "stella",
]);

// Nomes unissex — default por uso brasileiro mais comum
const UNISEX_DEFAULT_M = new Set(["ariel", "darcy", "lou", "remy", "noah"]);
const UNISEX_DEFAULT_F = new Set([
  "alex", "sam", "ravi", "dani", "andy", "robin", "kim",
  "mell", "morgan", "taylor",
]);

export function detectGender(name: string): Gen {
  const n = norm(name);
  if (!n) return "m";

  if (FEM_OVERRIDE.has(n)) return "f";
  if (MASC_TERM_A.has(n)) return "m";
  if (UNISEX_DEFAULT_F.has(n)) return "f";
  if (UNISEX_DEFAULT_M.has(n)) return "m";

  const last = n.slice(-1);
  const last2 = n.slice(-2);

  // Sufixos tipicamente femininos
  if (last === "a") return "f";
  if (last2 === "ia" || last2 === "na" || last2 === "ne" || last2 === "ce") {
    // já cobertos por last==='a', mas 'ne'/'ce' (alice, helene) caem fora
    if (last === "e") return "f";
  }

  // Sufixos tipicamente masculinos
  if (last === "o" || last === "u") return "m";
  if (last === "r" || last === "l" || last === "z" || last === "s") return "m";
  if (last === "m" || last === "n" || last === "t") return "m";
  if (last === "e" || last === "i") return "m";

  return "m";
}

export type Gendered = {
  is: Gen;
  // artigos
  o: string;        // o / a
  O: string;        // O / A
  do: string;       // do / da
  Do: string;
  no: string;       // no / na
  No: string;
  pro: string;      // pro / pra
  Pro: string;
  ao: string;       // ao / à
  // pronomes
  ele: string;
  Ele: string;
  dele: string;
  Dele: string;
  nele: string;
  // possessivos
  seu: string;      // seu / sua
  Seu: string;
  // substantivos
  filho: string;
  Filho: string;
  // helper genérico (troca último 'o' por 'a')
  adj: (masc: string) => string;
};

export function gendered(name: string): Gendered {
  const is = detectGender(name);
  const f = is === "f";
  const pick = (m: string, fem: string) => (f ? fem : m);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const adj = (masc: string) => {
    if (!f) return masc;
    // troca terminação -o por -a preservando acentos comuns
    if (masc.endsWith("o")) return masc.slice(0, -1) + "a";
    return masc;
  };

  const o = pick("o", "a");
  const ele = pick("ele", "ela");
  const dele = pick("dele", "dela");

  return {
    is,
    o,
    O: cap(o),
    do: pick("do", "da"),
    Do: pick("Do", "Da"),
    no: pick("no", "na"),
    No: pick("No", "Na"),
    pro: pick("pro", "pra"),
    Pro: pick("Pro", "Pra"),
    ao: pick("ao", "à"),
    ele,
    Ele: cap(ele),
    dele,
    Dele: cap(dele),
    nele: pick("nele", "nela"),
    seu: pick("seu", "sua"),
    Seu: pick("Seu", "Sua"),
    filho: pick("filho", "filha"),
    Filho: pick("Filho", "Filha"),
    adj,
  };
}
