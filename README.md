# README — Workshop 01

## Agente de IA para receber vagas tech no WhatsApp

## Visão geral

Neste workshop, o objetivo é construir um agente capaz de:

1. buscar vagas tech em uma fonte online
2. padronizar os dados recebidos
3. comparar cada vaga com o perfil desejado do usuário
4. atribuir score e categoria
5. gerar uma mensagem curta
6. enviar apenas as vagas relevantes no WhatsApp
7. automatizar esse processo para rodar de forma recorrente

A arquitetura final do projeto fica assim:

**Adzuna API → normalização → análise com IA → regra de decisão → WhatsApp → agendamento por cron**


## Pré-requisitos

Antes de começar, você precisa ter:

* conta Google para usar o Google AI Studio
* WSL com Ubuntu instalado
* Node.js funcionando no ambiente
* OpenClaw instalado
* número de WhatsApp disponível para pareamento
* conta na Adzuna para gerar as chaves da API



## Etapa 1 — Criar conta no Google AI Studio e pegar a key

O primeiro passo é gerar a chave do modelo.

### O que fazer

1. Criar ou acessar sua conta no Google AI Studio (https://aistudio.google.com/)
2. Gerar uma API Key
3. Guardar essa chave para usar no OpenClaw durante o onboarding

Essa chave será usada para configurar o modelo que fará a triagem das vagas.



## Etapa 2 — Instalar o OpenClaw no WSL com Ubuntu (https://openclaw.ai/)

Com o WSL e Ubuntu já funcionando, instalar o OpenClaw no terminal.

### Instalação

Executar o comando de instalação do OpenClaw.

`curl -fsSL https://openclaw.ai/install.sh | bash`

Depois disso, conferir se ele está instalado corretamente e pronto para uso.



## Etapa 3 — Fazer o onboard do OpenClaw

Após instalar, executar o onboarding / quickstart do OpenClaw.

`openclaw onboard`

Dar YES na primeira opção e ai selecionar QUICKSTART

### Objetivo dessa etapa

Configurar:

* o modelo principal (google/gemini-3.1-flash-lite-preview)
* a chave da API do modelo
* o gateway
* o canal do WhatsApp

### Resultado esperado

Ao final do onboarding, o OpenClaw deve estar com:

* gateway ativo
* modelo definido
* ambiente pronto para uso no TUI e nas automações

Para conferir a saúde básica:

´´´


openclaw status

openclaw gateway status

openclaw doctor

´´´



## Etapa 4 — Configurar o WhatsApp e Gateway direto no onboard

Configurar o canal de WhatsApp com seu número.

### O que fazer

1. iniciar o login do canal WhatsApp
2. escanear o QR Code
3. aprovar o pareamento, se necessário
4. validar que o canal está conectado

Após isso em caso de erro de TRIM, rodar esse comando e reinciar o onboard:

`openclaw update --tag 2026.4.12`


### Objetivo

Garantir que o agente consiga enviar mensagens reais no WhatsApp.

### Se preferir fazer fora do onboard

Faça o login:

**openclaw channels login --channel whatsapp**

Se estiver em modo de pairing, aprove o pareamento:

**openclaw pairing list whatsapp**

**openclaw pairing approve whatsapp <CODIGO>**

## Etapa 5 — Fazer a primeira amostra no TUI

Com o OpenClaw pronto, abrir o TUI para o primeiro teste manual.

`openclaw tui`

### Objetivo

Fazer o agente entender quem ele é e qual é sua função no workshop.

### O que testar

Passar no TUI o prompt base com a instrução do agente:

* ele recebe uma vaga
* compara com o perfil
* atribui score
* decide categoria
* gera mensagem curta de WhatsApp
* envia a msg no whatsapp

Essa etapa serve para validar a lógica do agente antes de automatizar qualquer coisa.


## Etapa 6 — Primeiros testes manuais com vaga e perfil do usuário

Agora fazer testes manuais com:

* uma vaga
* o perfil desejado do usuário

### Objetivo

Validar:

* score
* categoria
* justificativa
* resumo
* mensagem de WhatsApp

### Sugestão

Testar pelo menos:

* uma vaga boa
* uma vaga média
* uma vaga ruim



## Etapa 7 — Envio dessas vagas no WhatsApp

Depois da triagem manual funcionar, testar o envio para o WhatsApp.

### Objetivo

Comprovar que o agente não só analisa, mas também entrega a saída final no canal correto.

### O que validar

* mensagem curta
* link da vaga
* leitura fácil no WhatsApp
* utilidade prática para o usuário final



## Etapa 8 — Iniciar o processo de automação

Depois de validar o fluxo manual, começar a automatização do pipeline.

A partir daqui, a ideia deixa de ser “colar vaga manualmente” e passa a ser:

* buscar vagas automaticamente
* normalizar
* analisar
* salvar resultados
* enviar só as aprovadas

---

## Etapa 9 — Criar conta na Adzuna e pegar as keys

Agora configurar a fonte online de vagas.

### O que fazer

1. criar conta na Adzuna
2. criar uma aplicação
3. obter:

   * `app_id`
   * `app_key`

### Objetivo

Usar a Adzuna como fonte automática de vagas para o agente.

---

## Etapa 10 — Configuração inicial da Adzuna

Com as credenciais em mãos, configurar a primeira chamada da API.

### O que validar

* conexão com a API
* retorno JSON
* presença do array `results`
* campos principais da vaga

### Resultado esperado

Salvar a resposta da API em arquivo para servir de entrada para a próxima etapa.

Arquivo usado:

* `adzuna-response.json`

---

## Etapa 11 — Criar o primeiro script de normalização

Agora criar a etapa de padronização dos dados.

### Objetivo

Transformar o JSON cru da Adzuna no formato único esperado pelo agente.

Arquivo usado:

* `normalizar-adzuna.js`

### Entrada

* `adzuna-response.json`

### Saída

* `vagas-normalizadas.json`

### O que essa etapa faz

* renomeia campos
* limpa texto
* detecta modelo de trabalho
* detecta senioridade
* extrai stack
* detecta idioma quando houver sinal suficiente
* prepara o payload final da vaga

---

## Etapa 12 — Validar a normalização

Depois de rodar a normalização, conferir se os campos ficaram corretos.

### O que observar

* título
* empresa
* descrição
* modelo
* senioridade
* localização
* stack
* salário
* idioma
* link
* fonte

Se necessário, ajustar o script até a normalização ficar boa o suficiente para o workshop.

---

## Etapa 13 — Criar o perfil desejado do usuário

Definir o perfil que será usado para comparar com as vagas.

Arquivo usado:

* `perfil.json`

Esse arquivo representa os critérios de decisão do agente:

* cargo desejado
* stack principal
* stack secundária
* senioridade ideal
* modelo de trabalho ideal
* localização ideal
* idioma aceito
* salário mínimo
* palavras de prioridade
* palavras de descarte

---

## Etapa 14 — Criar o prompt de triagem

Definir o prompt usado para a análise de cada vaga.

Arquivo usado:

* `prompt-triagem.md`

Esse prompt orienta o modelo a:

* comparar vaga e perfil
* atribuir score
* justificar a decisão
* classificar a categoria
* gerar mensagem curta para WhatsApp

---

## Etapa 15 — Criar o script de análise das vagas

Com as vagas já normalizadas, criar o script que envia uma vaga por vez para o agente.

Arquivo usado:

* `analisar-vagas.js`

### Entrada

* `perfil.json`
* `prompt-triagem.md`
* `vagas-normalizadas.json`

### Saída

* `resultados.json`
* `vagas-aprovadas.json`

### O que ele faz

* lê o perfil
* lê o prompt
* lê as vagas normalizadas
* monta a mensagem para o agente
* captura a resposta em JSON
* salva a análise
* filtra as vagas aprovadas

---

## Etapa 16 — Criar o envio automático no WhatsApp

Depois da análise, criar a etapa de entrega das vagas aprovadas.

Arquivo usado:

* `enviar-whatsapp.js`

### Entrada

* `vagas-aprovadas.json`

### O que ele faz

* lê as vagas aprovadas
* usa a mensagem curta gerada pelo modelo
* envia uma a uma para o WhatsApp configurado

---

## Etapa 17 — Criar o pipeline completo

Agora juntar todas as etapas em um único fluxo executável.

Arquivo usado:

* `executar-pipeline.sh`

### O que esse pipeline executa

1. busca vagas na Adzuna
2. salva a resposta
3. normaliza os dados
4. analisa as vagas
5. separa as aprovadas
6. envia as aprovadas no WhatsApp

Esse é o arquivo principal da automação.

---

## Etapa 18 — Criar o script de busca da Adzuna

Separar a parte de coleta da API em um arquivo próprio.

Arquivo usado:

* `buscar-adzuna.sh`

### O que ele faz

* chama a API da Adzuna
* usa `app_id` e `app_key`
* salva o retorno bruto em `adzuna-response.json`

---

## Etapa 19 — Testar o pipeline de ponta a ponta

Antes de agendar, rodar o pipeline manualmente.

### Objetivo

Conferir se tudo funciona em sequência sem depender de intervenção manual.

### O que validar

* a API responde
* a normalização gera JSON correto
* a análise retorna score/categoria
* as aprovadas são separadas
* o WhatsApp recebe as mensagens

---

## Etapa 20 — Criar automação recorrente com cron

Depois de validar o pipeline completo, automatizar a execução com cron no OpenClaw.

### Objetivo

Fazer o fluxo rodar sozinho em intervalo recorrente.

### Configuração escolhida

Rodar **de hora em hora**.

### O que o cron faz

* dispara o pipeline completo
* executa o processo em sessão isolada
* mantém a execução automática

---

## Etapa 21 — Resultado final do workshop

Ao final, o projeto fica com o seguinte comportamento:

1. a Adzuna fornece novas vagas
2. o script de busca salva a resposta
3. o script de normalização padroniza os dados
4. o agente analisa cada vaga com base no perfil
5. o sistema salva score, categoria e mensagem
6. apenas vagas aprovadas são enviadas no WhatsApp
7. o cron repete esse processo automaticamente

---

## Estrutura de arquivos do projeto

Arquivos principais já usados no processo:

* `AGENTS.md`
* `buscar-adzuna.sh`
* `adzuna-response.json`
* `normalizar-adzuna.js`
* `vagas-normalizadas.json`
* `perfil.json`
* `prompt-triagem.md`
* `analisar-vagas.js`
* `resultados.json`
* `vagas-aprovadas.json`
* `enviar-whatsapp.js`
* `executar-pipeline.sh`

---

## O que foi validado no workshop

Ao final deste workshop, foi demonstrado:

* uso de IA para triagem de vagas
* comparação vaga x perfil
* classificação com score e categoria
* geração de mensagem útil
* entrega por WhatsApp
* captura automática por API
* normalização de dados
* automação completa com cron

---

## Evoluções futuras

Depois que o workshop estiver fechado, o projeto pode evoluir para:

* deduplicação de vagas
* histórico consolidado
* múltiplas fontes além da Adzuna
* revisão manual dos casos limítrofes
* filtros por nicho
* envio com regras mais sofisticadas
* painel de acompanhamento

---

## Conclusão

Ao fim do processo, o workshop entrega um agente funcional de ponta a ponta:

* recebe vagas de uma fonte real
* padroniza os dados
* analisa aderência com IA
* decide o que vale a pena
* envia no WhatsApp
* executa automaticamente de hora em hora

Se você quiser, eu também posso transformar esse texto em uma versão mais “bonita de GitHub”, com seções, caixas de destaque e blocos de comando melhor organizados.
