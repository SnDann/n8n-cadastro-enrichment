const http = require('http');
const assert = require('assert');

console.log('🧪 Testando API Interna...');

const API_URL = 'http://localhost:3001';

// Test 1: Health check público
http.get(API_URL + '/health', (res) => {
  console.log('✅ 1. Health check:', res.statusCode);
});

// Test 2: POST /clientes (sem API Key - deve falhar 401)
const clienteTeste = {
  cliente: { nome: 'Teste', email: 'teste@teste.com' },
  endereco: { cep: '12345-678', cidade: 'Teste', estado: 'SP' },
  metadata: { criado_em: new Date().toISOString() }
};

const reqPost = http.request(API_URL + '/clientes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  console.log('❌ 2. POST sem API Key:', res.statusCode); // Esperado 401
});

reqPost.write(JSON.stringify(clienteTeste));
reqPost.end();

console.log('🧪 Testes executados. Verifique os logs da API para validar!');

