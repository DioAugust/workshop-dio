const fs = require("fs");
const { execFileSync } = require("child_process");

const ARQ_APROVADAS = "vagas-aprovadas.json";
const DESTINO = process.env.WHATSAPP_TO;

if (!DESTINO) {
  throw new Error("Defina a variável WHATSAPP_TO com o número de destino, ex: +5511999999999");
}

function lerJson(caminho) {
  return JSON.parse(fs.readFileSync(caminho, "utf8"));
}

function enviarMensagem(numero, texto) {
  execFileSync(
    "openclaw",
    [
      "agent",
      "--to",
      numero,
      "--message",
      texto,
      "--deliver"
    ],
    {
      stdio: "inherit"
    }
  );
}

function main() {
  const aprovadas = lerJson(ARQ_APROVADAS);

  if (!Array.isArray(aprovadas) || aprovadas.length === 0) {
    console.log("Nenhuma vaga aprovada para enviar.");
    return;
  }

  for (const item of aprovadas) {
    const msg = item?.analise?.mensagem_whatsapp?.trim();
    if (!msg) continue;

    console.log(`Enviando: ${item.vaga?.titulo || "vaga sem título"}`);
    enviarMensagem(DESTINO, msg);
  }

  console.log(`Envio concluído. Total enviado: ${aprovadas.length}`);
}

main();