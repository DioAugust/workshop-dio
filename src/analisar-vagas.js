const fs = require("fs");
const { execFileSync } = require("child_process");

const ARQ_PERFIL = "perfil.json";
const ARQ_PROMPT = "prompt-triagem.md";
const ARQ_VAGAS = "vagas-normalizadas.json";
const ARQ_RESULTADOS = "resultados.json";
const ARQ_APROVADAS = "vagas-aprovadas.json";

const OPENCLAW_AGENT_ID = process.env.OPENCLAW_AGENT_ID || "main";
const OPENCLAW_THINKING = process.env.OPENCLAW_THINKING || "low";
const OPENCLAW_TIMEOUT = process.env.OPENCLAW_TIMEOUT || "120";

function lerJson(caminho) {
  return JSON.parse(fs.readFileSync(caminho, "utf8"));
}

function lerTexto(caminho) {
  return fs.readFileSync(caminho, "utf8").trim();
}

function escreverJson(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), "utf8");
}

function slug(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function montarMensagem(promptBase, perfil, vaga) {
  return `${promptBase}

Perfil desejado:
${JSON.stringify(perfil, null, 2)}

Vaga:
${JSON.stringify(vaga, null, 2)}

Regras adicionais:
- Responda apenas com JSON válido.
- Não use markdown.
- Não use bloco de código.
- Não adicione texto antes ou depois do JSON.
- Se houver pouca informação na vaga, reduza a confiança da análise.

Formato obrigatório:
{
  "score": 0,
  "categoria": "",
  "motivos": [],
  "resumo": "",
  "mensagem_whatsapp": ""
}`;
}

function extrairPrimeiroJson(texto) {
  const bruto = String(texto || "").trim();

  // 1) JSON puro
  try {
    return JSON.parse(bruto);
  } catch (_) {}

  // 2) Bloco ```json ... ```
  const bloco = bruto.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (bloco) {
    try {
      return JSON.parse(bloco[1].trim());
    } catch (_) {}
  }

  // 3) Tenta localizar o primeiro objeto JSON balanceado
  const inicio = bruto.indexOf("{");
  if (inicio === -1) {
    throw new Error("Nenhum objeto JSON encontrado na resposta.");
  }

  let profundidade = 0;
  let emString = false;
  let escape = false;

  for (let i = inicio; i < bruto.length; i++) {
    const ch = bruto[i];

    if (emString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        emString = false;
      }
      continue;
    }

    if (ch === '"') {
      emString = true;
      continue;
    }

    if (ch === "{") profundidade++;
    if (ch === "}") profundidade--;

    if (profundidade === 0) {
      const candidato = bruto.slice(inicio, i + 1);
      return JSON.parse(candidato);
    }
  }

  throw new Error("Não foi possível extrair um JSON válido da resposta.");
}

function validarAnalise(obj) {
  if (!obj || typeof obj !== "object") {
    throw new Error("Resposta não é um objeto JSON.");
  }

  const obrigatorios = ["score", "categoria", "motivos", "resumo", "mensagem_whatsapp"];
  for (const campo of obrigatorios) {
    if (!(campo in obj)) {
      throw new Error(`Campo obrigatório ausente: ${campo}`);
    }
  }

  if (!Array.isArray(obj.motivos)) {
    throw new Error("Campo 'motivos' precisa ser um array.");
  }

  if (typeof obj.score !== "number") {
    const convertido = Number(obj.score);
    if (Number.isNaN(convertido)) {
      throw new Error("Campo 'score' precisa ser numérico.");
    }
    obj.score = convertido;
  }

  obj.categoria = String(obj.categoria || "").trim();
  obj.resumo = String(obj.resumo || "").trim();
  obj.mensagem_whatsapp = String(obj.mensagem_whatsapp || "").trim();
  obj.motivos = obj.motivos.map((m) => String(m).trim()).filter(Boolean);

  return obj;
}

function chamarOpenClaw(mensagem, sessionId) {
  const args = [
    "agent",
    "--agent",
    OPENCLAW_AGENT_ID,
    "--session-id",
    sessionId,
    "--thinking",
    OPENCLAW_THINKING,
    "--timeout",
    OPENCLAW_TIMEOUT,
    "--message",
    mensagem
  ];

  // A doc do openclaw agent diz que basta fornecer ao menos um de:
  // --to, --session-id, --session-key ou --agent.
  // Aqui usamos --agent + --session-id e lemos stdout, sem --deliver.
  const saida = execFileSync("openclaw", args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });

  return saida;
}

function categoriaAprovada(categoria) {
  return ["ENVIAR_AGORA", "TALVEZ"].includes(String(categoria || "").trim());
}

function main() {
  const perfil = lerJson(ARQ_PERFIL);
  const promptBase = lerTexto(ARQ_PROMPT);
  const vagas = lerJson(ARQ_VAGAS);

  if (!Array.isArray(vagas) || vagas.length === 0) {
    throw new Error("vagas-normalizadas.json está vazio ou inválido.");
  }

  const resultados = [];

  for (let i = 0; i < vagas.length; i++) {
    const vaga = vagas[i];
    const sessionId = `triagem-${String(i + 1).padStart(3, "0")}-${slug(vaga.titulo) || "vaga"}`;
    const mensagem = montarMensagem(promptBase, perfil, vaga);

    process.stdout.write(`Analisando ${i + 1}/${vagas.length}: ${vaga.titulo} ... `);

    try {
      const respostaBruta = chamarOpenClaw(mensagem, sessionId);
      const analise = validarAnalise(extrairPrimeiroJson(respostaBruta));

      const registro = {
        vaga,
        analise,
        meta: {
          session_id: sessionId,
          agent_id: OPENCLAW_AGENT_ID
        }
      };

      resultados.push(registro);
      console.log("OK");
    } catch (erro) {
      resultados.push({
        vaga,
        erro: String(erro.message || erro),
        meta: {
          session_id: sessionId,
          agent_id: OPENCLAW_AGENT_ID
        }
      });
      console.log("ERRO");
    }
  }

  escreverJson(ARQ_RESULTADOS, resultados);

  const aprovadas = resultados.filter(
    (r) => r.analise && categoriaAprovada(r.analise.categoria)
  );

  escreverJson(ARQ_APROVADAS, aprovadas);

  console.log(`\nConcluído.`);
  console.log(`Resultados salvos em: ${ARQ_RESULTADOS}`);
  console.log(`Aprovadas salvas em: ${ARQ_APROVADAS}`);
  console.log(`Total de vagas: ${vagas.length}`);
  console.log(`Total aprovadas: ${aprovadas.length}`);
}

main();