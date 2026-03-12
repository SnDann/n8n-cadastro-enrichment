# Projeto 1: Fluxo de Integração com n8n

## Problema Resolvido
GAP visível no currículo: falta de experiência prática com automações de integração usando ferramentas low-code como n8n. Este projeto demonstra a criação de um fluxo que:

- Recebe um CEP via webhook (simulando input de formulário).
- Consulta a API pública ViaCEP para obter endereço completo.
- Envia notificação com os dados via e-mail (usando nodo Email) ou Slack.

Isso resolve o gap mostrando domínio em:
- Orquestração de APIs públicas.
- Integração webhook -> API -> notificação.
- Deploy local com Docker.

## Pré-requisitos
- Docker e Docker Compose instalados.
- Conta Gmail com app password para envio de e-mail (ou Slack token).

## Setup
1. Clone ou crie este diretório.
2. Configure variáveis no `.env`:
   
```
   N8N_BASIC_AUTH_USER=admin
   N8N_BASIC_AUTH_PASSWORD=senha123
   N8N_EMAIL_APP_PASSWORD=sua_app_password_gmail
   N8N_SLACK_TOKEN=xoxb-seu-token-slack
   
```
3. Inicie o n8n:
   
```
   docker-compose up -d
   
```
4. Acesse http://localhost:5678, login com credenciais do .env.

## Como usar o fluxo
1. Importe `workflow-n8n.json` no n8n (menu Settings > Import from file).
2. Ative o workflow.
3. Teste enviando POST para webhook URL (exibida no nodo Webhook):
   
```bash
   curl -X POST http://localhost:5678/webhook/xxx -d '{"cep": "01001-000"}'
   
```
4. Verifique e-mail/Slack com endereço retornado.

## Screenshot Canvas n8n
![Fluxo n8n](screenshot-canvas.png)
*(Adicione print após ativar o workflow)*

## Stack
- n8n (Docker)
- ViaCEP API (https://viacep.com.br/ws/CEP/json/)
- Email/Slack nodes nativos do n8n
