openclaw channels logout --channel whatsapp
openclaw channels login --channel whatsapp --verbose

openclaw agent --to +5511999999999 --message "teste" --deliver


openclaw devices list
openclaw devices approve requestId 



Para erro de ttrim:
openclaw update --tag 2026.4.12

 

openclaw config set channels.whatsapp.allowFrom '["+5511999999999"]' --json
openclaw config set channels.whatsapp.dmPolicy '"allowlist"' --json
openclaw config set channels.whatsapp.selfChatMode 'true' --json