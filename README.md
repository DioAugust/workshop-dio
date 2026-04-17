# Workshop 01 — Agente de IA para receber vagas tech no WhatsApp 
**by Diogines Augusto**

## Visão geral

Neste workshop, construímos um agente de ponta a ponta capaz de:

1. Buscar vagas tech na API da Adzuna
2. Padronizar os dados recebidos (normalização)
3. Comparar cada vaga com o perfil desejado do usuário
4. Atribuir score (0–10) e categoria (`ENVIAR_AGORA`, `TALVEZ`, `DESCARTAR`)
5. Gerar uma mensagem curta para WhatsApp
6. Enviar apenas as vagas relevantes no WhatsApp
7. Automatizar o processo com cron para rodar de forma recorrente

### Arquitetura

```
Adzuna API → normalização → análise com IA → regra de decisão → WhatsApp → cron
```

### Estrutura de arquivos

```
.
├── AGENTS.md                      # Regras do agente para automação
├── possiveis-erros.md             # Troubleshooting de erros comuns
├── README.md
└── src/
    ├── buscar-adzuna.sh           # Coleta vagas da API Adzuna
    ├── adzuna-response.json       # Resposta bruta da API (gerado)
    ├── normalizar-adzuna.js       # Padroniza os dados das vagas
    ├── vagas-normalizadas.json    # Vagas padronizadas (gerado)
    ├── perfil.json                # Perfil desejado do usuário
    ├── prompt.md                  # Prompt de triagem para o modelo
    ├── analisar-vagas.js          # Envia vagas ao agente e coleta análise
    ├── resultados.json            # Todas as análises (gerado)
    ├── vagas-aprovadas.json       # Apenas vagas aprovadas (gerado)
    ├── enviar-whatsapp.js         # Envia aprovadas no WhatsApp
    └── executar-pipeline.sh       # Pipeline completo (orquestra tudo)
```

---

## Pré-requisitos

Antes de começar, você precisa ter:

- Conta Google para usar o [Google AI Studio](https://aistudio.google.com/)
- WSL com Ubuntu instalado
- Node.js funcionando no ambiente WSL
- [OpenClaw](https://openclaw.ai/) instalado
- Número de WhatsApp disponível para pareamento
- Conta na [Adzuna](https://developer.adzuna.com/) para gerar `app_id` e `app_key`

### Variáveis de ambiente necessárias

| Variável | Descrição | Onde usar |
|---|---|---|
| `ADZUNA_APP_ID` | ID da aplicação Adzuna | `buscar-adzuna.sh` |
| `ADZUNA_APP_KEY` | Chave da API Adzuna | `buscar-adzuna.sh` |
| `WHATSAPP_TO` | Número destino (ex: `+5511999999999`) | `enviar-whatsapp.js` |
| `OPENCLAW_AGENT_ID` | ID do agente OpenClaw (padrão: `main`) | `analisar-vagas.js` |
| `OPENCLAW_THINKING` | Nível de raciocínio (padrão: `low`) | `analisar-vagas.js` |
| `OPENCLAW_TIMEOUT` | Timeout em segundos (padrão: `120`) | `analisar-vagas.js` |

---

## Guia passo a passo

### Etapa 1 — Criar conta no Google AI Studio e gerar a API Key

1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Gere uma API Key
3. Guarde essa chave — ela será usada no onboarding do OpenClaw para configurar o modelo de triagem

---

### Etapa 2 — Instalar o OpenClaw no WSL

Com o WSL e Ubuntu já funcionando, instale o OpenClaw:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Confirme a instalação:

```bash
openclaw --version
```

---

### Etapa 3 — Fazer o onboarding do OpenClaw

```bash
openclaw onboard
```

Selecione **YES** na primeira opção e depois **QUICKSTART**.

Nessa etapa você configura:

- Modelo principal: `google/gemini-3.1-flash-lite-preview`
- Chave da API do modelo (a que você gerou na Etapa 1)
- Gateway
- Canal do WhatsApp

Ao final, valide que tudo está saudável:

```bash
openclaw status
openclaw gateway status
openclaw doctor
```

---

### Etapa 4 — Configurar o WhatsApp

Durante o onboarding, ou separadamente:

1. Inicie o login do canal WhatsApp
2. Escaneie o QR Code
3. Aprove o pareamento, se necessário
4. Valide que o canal está conectado

Se preferir fazer fora do onboard:

```bash
openclaw channels login --channel whatsapp
```

Se estiver em modo de pairing:

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODIGO>
```

> **Erro de TRIM?** Atualize o OpenClaw e reinicie o onboard:
> ```bash
> openclaw update --tag 2026.4.12
> ```

---

### Etapa 5 — Primeiro teste manual no TUI

Abra o TUI para validar a lógica do agente antes de automatizar:

```bash
openclaw tui
```

Passe o prompt base (`src/prompt.md`) com uma vaga de exemplo e o perfil (`src/perfil.json`). O agente deve:

- Comparar a vaga com o perfil
- Atribuir score de 0 a 10
- Decidir a categoria
- Gerar mensagem curta para WhatsApp

---

### Etapa 6 — Testes manuais com vagas reais

Teste com pelo menos 3 cenários:

| Cenário | Resultado esperado |
|---|---|
| Vaga boa (stack compatível, remoto, pleno/sênior) | Score alto, `ENVIAR_AGORA` |
| Vaga média (stack parcial, híbrido) | Score médio, `TALVEZ` |
| Vaga ruim (PHP, presencial SP, estágio) | Score baixo, `DESCARTAR` |

Valide: score, categoria, justificativa, resumo e mensagem de WhatsApp.

---

### Etapa 7 — Testar envio no WhatsApp

Depois da triagem manual funcionar, teste o envio real:

```bash
openclaw agent --to +5511999999999 --message "teste" --deliver
```

Valide que a mensagem chega com:
- Texto curto e legível
- Link da vaga
- Leitura fácil no celular

---

### Etapa 8 — Criar conta na Adzuna e obter as credenciais

1. Crie conta em [developer.adzuna.com](https://developer.adzuna.com/)
2. Crie uma aplicação
3. Copie o `app_id` e `app_key`

Exporte as variáveis:

```bash
export ADZUNA_APP_ID="seu_app_id"
export ADZUNA_APP_KEY="sua_app_key"
```

---

### Etapa 9 — Buscar vagas na Adzuna (`buscar-adzuna.sh`)

O script faz uma chamada à API da Adzuna e salva a resposta bruta:

```bash
./buscar-adzuna.sh
```

**O que ele faz:**
- Chama `GET /v1/api/jobs/br/search/1` com filtros de stack e exclusões
- Busca por: `frontend react typescript`, excluindo `php presencial`
- Salva o retorno em `adzuna-response.json`

**Exemplo de resposta bruta (campos principais):**

```json
{
  "title": "Desenvolvedor Frontend (React, JavaScript, TypeScript e CSS)",
  "company": { "display_name": "Turing.com" },
  "location": { "display_name": "São Paulo, Estado de São Paulo" },
  "description": "Trabalhe em home office para empresas dos EUA...",
  "redirect_url": "https://www.adzuna.com.br/details/...",
  "salary_min": null,
  "salary_max": null,
  "category": { "label": "Vagas em Criação e Design" }
}
```

---

### Etapa 10 — Normalizar as vagas (`normalizar-adzuna.js`)

Transforma o JSON cru da Adzuna no formato padronizado esperado pelo agente:

```bash
node normalizar-adzuna.js
```

**Entrada:** `adzuna-response.json`
**Saída:** `vagas-normalizadas.json`

**O que a normalização faz:**

| Transformação | Detalhes |
|---|---|
| Renomeia campos | `title` → `titulo`, `company.display_name` → `empresa` |
| Limpa texto | Remove espaços duplicados, normaliza unicode |
| Detecta modelo de trabalho | Busca por `remoto`, `híbrido`, `presencial` na descrição |
| Detecta senioridade | Busca por `senior`, `pleno`, `junior` no título e descrição |
| Extrai stack | Identifica 23+ tecnologias via regex (React, TypeScript, Node.js, etc.) |
| Detecta idioma | Analisa sinais de Português vs Inglês na descrição |
| Formata salário | Combina `salary_min` e `salary_max` |

**Exemplo de vaga normalizada:**

```json
{
  "titulo": "Desenvolvedor Frontend (React, JavaScript, TypeScript e CSS)",
  "empresa": "Turing.com",
  "descricao": "Trabalhe em home office para empresas dos EUA...",
  "modelo": "Remoto",
  "senioridade": "Senior",
  "localizacao": "São Paulo, Estado de São Paulo",
  "stack": ["React", "TypeScript", "JavaScript", "CSS"],
  "salario": "",
  "idioma": "",
  "link": "https://www.adzuna.com.br/details/...",
  "fonte": "Adzuna"
}
```

---

### Etapa 11 — Configurar o perfil do usuário (`perfil.json`)

O perfil define os critérios de decisão do agente:

```json
{
  "cargo_desejado": "Desenvolvedor Full-stack",
  "stack_principal": ["React", "Node.js", "TypeScript", "JavaScript"],
  "stack_secundaria": ["Next.js", "PostgreSQL", "Tailwind CSS"],
  "senioridade_ideal": ["Pleno", "Sênior"],
  "modelo_ideal": ["Remoto", "Híbrido (Recife/Jaboatão)"],
  "localizacao_ideal": ["Brasil"],
  "idioma_aceito": ["Português", "Inglês Técnico"],
  "salario_minimo": "R$ 8.000",
  "palavras_prioridade": ["typescript", "remoto", "vaga definitiva", "clt"],
  "palavras_descartar": ["presencial em são paulo", "php", "estágio", "vaga temporária"]
}
```

Edite este arquivo para refletir seu próprio perfil.

---

### Etapa 12 — Configurar o prompt de triagem (`prompt.md`)

O prompt orienta o modelo a:

- Comparar vaga × perfil
- Atribuir score de 0 a 10
- Justificar a decisão em até 3 frases
- Classificar: `ENVIAR_AGORA`, `TALVEZ` ou `DESCARTAR`
- Gerar mensagem curta para WhatsApp

O modelo responde em JSON:

```json
{
  "score": 8,
  "categoria": "ENVIAR_AGORA",
  "motivos": ["Stack compatível", "Modelo remoto", "Senioridade adequada"],
  "resumo": "Vaga de frontend remoto com React/TypeScript na Turing.com",
  "mensagem_whatsapp": "🟢 Vaga: Frontend React/TS — Turing.com — Remoto — Score 8/10"
}
```

---

### Etapa 13 — Analisar as vagas com IA (`analisar-vagas.js`)

Envia cada vaga normalizada ao agente OpenClaw para triagem:

```bash
node analisar-vagas.js
```

**Entrada:** `perfil.json` + `prompt.md` + `vagas-normalizadas.json`
**Saída:** `resultados.json` + `vagas-aprovadas.json`

**O que o script faz:**

1. Lê o perfil, o prompt e as vagas normalizadas
2. Para cada vaga, monta uma mensagem combinando prompt + perfil + vaga
3. Chama `openclaw agent` com `--session-id` único por vaga
4. Extrai e valida o JSON da resposta (tenta parse direto, bloco markdown, ou busca balanceada de `{}`)
5. Salva todas as análises em `resultados.json`
6. Filtra vagas com categoria `ENVIAR_AGORA` ou `TALVEZ` em `vagas-aprovadas.json`

**Variáveis de ambiente opcionais:**

```bash
export OPENCLAW_AGENT_ID="main"     # ID do agente
export OPENCLAW_THINKING="low"      # Nível de raciocínio
export OPENCLAW_TIMEOUT="120"       # Timeout por vaga (segundos)
```

---

### Etapa 14 — Enviar vagas aprovadas no WhatsApp (`enviar-whatsapp.js`)

```bash
export WHATSAPP_TO="+5511999999999"
node enviar-whatsapp.js
```

**Entrada:** `vagas-aprovadas.json`

**O que ele faz:**
- Lê as vagas aprovadas
- Para cada uma, pega o campo `mensagem_whatsapp` da análise
- Envia via `openclaw agent --to <numero> --message <texto> --deliver`

---

### Etapa 15 — Rodar o pipeline completo (`executar-pipeline.sh`)

O pipeline orquestra todas as etapas em sequência:

```bash
./executar-pipeline.sh
```

**Fluxo executado:**

```
1) buscar-adzuna.sh      → adzuna-response.json
2) normalizar-adzuna.js  → vagas-normalizadas.json
3) analisar-vagas.js     → resultados.json + vagas-aprovadas.json
```

> O envio no WhatsApp (`enviar-whatsapp.js`) não está incluído no pipeline por padrão — rode separadamente quando quiser ativar o envio.

---

### Etapa 16 — Automatizar com cron

Depois de validar o pipeline, agende a execução recorrente:

```bash
openclaw cron add --every 1h --command "./executar-pipeline.sh"
```

O cron dispara o pipeline completo de hora em hora em sessão isolada.

---

## Troubleshooting

### Erros comuns com WhatsApp

**Reconectar o canal:**

```bash
openclaw channels logout --channel whatsapp
openclaw channels login --channel whatsapp --verbose
```

**Testar envio manual:**

```bash
openclaw agent --to +5511999999999 --message "teste" --deliver
```

**Listar e aprovar dispositivos:**

```bash
openclaw devices list
openclaw devices approve <requestId>
```

**Erro de TRIM:**

```bash
openclaw update --tag 2026.4.12
```

**Configurar permissões de WhatsApp:**

```bash
openclaw config set channels.whatsapp.allowFrom '["+5511999999999"]' --json
openclaw config set channels.whatsapp.dmPolicy '"allowlist"' --json
openclaw config set channels.whatsapp.selfChatMode 'true' --json
```

---

## Evoluções futuras

- Deduplicação de vagas já analisadas
- Histórico consolidado de análises
- Múltiplas fontes além da Adzuna (LinkedIn, Gupy, etc.)
- Revisão manual dos casos `TALVEZ`
- Filtros por nicho ou área
- Painel de acompanhamento
- Regras de envio mais sofisticadas (horário, frequência)

---

## Conclusão

Ao fim do workshop, temos um agente funcional de ponta a ponta:

- Recebe vagas de uma fonte real (Adzuna)
- Padroniza os dados automaticamente
- Analisa aderência com IA (score + categoria)
- Decide o que vale a pena
- Envia no WhatsApp
- Executa automaticamente de hora em hora via cron
