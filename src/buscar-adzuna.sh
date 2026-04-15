#!/usr/bin/env bash
set -euo pipefail

curl --fail --silent --show-error \
  "https://api.adzuna.com/v1/api/jobs/br/search/1?app_id=$ADZUNA_APP_ID&app_key=$ADZUNA_APP_KEY&results_per_page=5&what=frontend%20react%20typescript&what_exclude=php%20presencial&where=Brasil&content-type=application/json" \
  -o adzuna-response.json

echo "OK: adzuna-response.json atualizado"