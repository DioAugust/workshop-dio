const fs = require("fs");

function limparTexto(txt) {
  return (txt || "").replace(/\s+/g, " ").trim();
}

function normalizarTexto(txt) {
  return limparTexto(txt)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function detectarModelo(texto) {
  const t = normalizarTexto(texto);

  if (
    /\b(home office|remote|remoto|100% remoto|100 remoto)\b/.test(t)
  ) {
    return "Remoto";
  }

  if (/\b(hibrido|hybrid)\b/.test(t)) {
    return "Híbrido";
  }

  if (/\b(presencial|onsite|on-site)\b/.test(t)) {
    return "Presencial";
  }

  return "";
}

function detectarSenioridade(titulo, descricao) {
  const t = normalizarTexto(`${titulo} ${descricao}`);

  if (
    /\b(senior|sr|sênior)\b/.test(t) ||
    /\bmais de 5 anos\b/.test(t) ||
    /\b5 anos de experiencia\b/.test(t) ||
    /\b5\+ anos\b/.test(t)
  ) {
    return "Senior";
  }

  if (/\b(pleno|mid-level|mid level|midlevel)\b/.test(t)) {
    return "Pleno";
  }

  if (/\b(junior|junior|jr|júnior)\b/.test(t)) {
    return "Junior";
  }

  return "";
}

function detectarIdioma(texto) {
  const original = limparTexto(texto);
  const t = normalizarTexto(texto);

  const sinaisIngles = [
    "we’re", "we're", "our client", "responsibilities", "requirements",
    "you will", "full stack developer", "frontend", "backend",
    "cloud-based", "ownership role", "engineer"
  ];

  const sinaisPortugues = [
    "vaga", "requisitos", "experiencia", "experiência",
    "home office", "horario de trabalho", "desenvolvedor",
    "selecionamos", "conhecimento", "empresa"
  ];

  const ingles = sinaisIngles.filter(s => original.toLowerCase().includes(s) || t.includes(normalizarTexto(s))).length;
  const portugues = sinaisPortugues.filter(s => t.includes(normalizarTexto(s))).length;

  if (ingles >= 2 && ingles > portugues) return "Inglês";
  if (portugues >= 2 && portugues >= ingles) return "Português";

  return "";
}

const STACK_PATTERNS = [
  { nome: "React", regex: /\breact(\.js)?\b/i },
  { nome: "TypeScript", regex: /\btypescript\b/i },
  { nome: "JavaScript", regex: /\bjavascript\b/i },
  { nome: "Node.js", regex: /\bnode(\.?\s*js)?\b/i },
  { nome: "Next.js", regex: /\bnext(\.?\s*js)?\b/i },
  { nome: "Vue", regex: /\bvue(\.js)?\b/i },
  { nome: "Angular", regex: /\bangular\b/i },
  { nome: "ASP.NET", regex: /\basp\.?\s*net\b/i },
  { nome: ".NET", regex: /(?:^|[^a-z])\.net\b|\bdotnet\b/i },
  { nome: "C#", regex: /\bc#\b/i },
  { nome: "Java", regex: /\bjava\b(?!script)/i },
  { nome: "Python", regex: /\bpython\b/i },
  { nome: "PHP", regex: /\bphp\b/i },
  { nome: "HTML", regex: /\bhtml\b/i },
  { nome: "CSS", regex: /\bcss\b/i },
  { nome: "SASS", regex: /\bsass\b/i },
  { nome: "Vite", regex: /\bvite\b/i },
  { nome: "React Router", regex: /\breact router\b/i },
  { nome: "React Query", regex: /\breact query\b/i },
  { nome: "Axios", regex: /\baxios\b/i },
  { nome: "REST API", regex: /\b(api(s)? rest|rest api)\b/i },
  { nome: "Microsserviços", regex: /\b(microservicos|micro-servicos|microsservicos|microservices)\b/i },
  { nome: "Mensageria", regex: /\bmensageria\b/i }
];

function extrairStack(texto) {
  const base = limparTexto(texto);
  const stack = STACK_PATTERNS
    .filter(item => item.regex.test(base))
    .map(item => item.nome);

  return [...new Set(stack)];
}

function formatarSalario(item) {
  if (item.salary_min && item.salary_max) {
    return `${item.salary_min}-${item.salary_max}`;
  }
  if (item.salary_min) return `${item.salary_min}`;
  if (item.salary_max) return `${item.salary_max}`;
  return "";
}

function detectarCategoriaFonte(item) {
  return item.category?.label || "";
}

function mapearENormalizar(item) {
  const titulo = limparTexto(item.title);
  const empresa = limparTexto(item.company?.display_name);
  const descricao = limparTexto(item.description);
  const localizacao = limparTexto(item.location?.display_name);
  const textoCompleto = `${titulo} ${descricao}`;

  return {
    titulo,
    empresa,
    descricao,
    modelo: detectarModelo(textoCompleto),
    senioridade: detectarSenioridade(titulo, descricao),
    localizacao,
    stack: extrairStack(textoCompleto),
    salario: formatarSalario(item),
    idioma: detectarIdioma(descricao),
    link: item.redirect_url || "",
    fonte: "Adzuna",
    categoria_original: detectarCategoriaFonte(item),
    contrato: item.contract_time || ""
  };
}

function main() {
  const entrada = JSON.parse(fs.readFileSync("adzuna-response.json", "utf8"));

  const vagasNormalizadas = (entrada.results || [])
    .map(mapearENormalizar)
    .filter(vaga => vaga.titulo && vaga.descricao && vaga.link);

  fs.writeFileSync(
    "vagas-normalizadas.json",
    JSON.stringify(vagasNormalizadas, null, 2),
    "utf8"
  );

  console.log(`OK: ${vagasNormalizadas.length} vagas normalizadas em vagas-normalizadas.json`);
}

main();