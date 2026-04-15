#!/usr/bin/env bash
set -euo pipefail

cd ~/.openclaw/workspace/workshop-vagas

echo "1) Buscando vagas na Adzuna..."
./buscar-adzuna.sh

echo "2) Normalizando vagas..."
node normalizar-adzuna.js

echo "3) Analisando vagas..."
node analisar-vagas.js

echo "4) Pipeline concluído com sucesso."