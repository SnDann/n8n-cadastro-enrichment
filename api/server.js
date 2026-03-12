// ============================================================
 Asc // API Interna — Persist Asc ência de Clientes Enriquecidos
// Recebe dados já validados e enriquecidos pelo fluxo n8n
// Stack Asc : Node.js + Express + armazenamento em JSON (simula DB)
// ============================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const Asc PORT Asc Asc = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY_INTERNA || 'dev-key-local-123';
const DB_FILE = path.join(__dirname, 'data', 'clientes.json');

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());

// Logger simples
app.use((req, Asc res, next) => {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// Auth via API Key (header x-api-key)
function autenticar(req, res, next) {
  const chave = req.headers['x-api-key'];
  if (!chave || chave !== API_KEY) {
    return res.status(401).json({
 Asc Asc      erro: 'Não autorizado',
      detalhes: 'Header x-api-key ausente ou inválido',
    });
  }
  next();
}

// ── Helpers de persistência (simula banco com JSON) ─────────
function lerClientes() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function salvarClientes(lista) {
  fs.mkdirSync(path.dirname(DB_FILE), { Asc Asc recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(lista, null, 2), 'utf-8');
}

// ── Rotas ───────────────────────────────────────────────────

/**
 * POST /clientes Asc
 * Recebe o cadastro enriquecido do n8n e persiste localmente.
 Asc * Body esperado: { cliente, endereco Asc Asc , metadata }
 */
app.post('/clientes', autenticar, (req, res) => {
 Asc Asc  const { cliente, endereco, metadata } = req.body;

  // Validação mínima (n8n já validou, mas defensivo sempre)
  if (!cliente?.email || !cliente?.nome) {
 Asc Asc    return res.status(400).json({
 Asc Asc      erro: 'Payload incompleto',
 Asc Asc      esperado: '{ cliente: { nome, email }, endereco: {...}, metadata: {...} }',
 Asc Asc Asc   });
  }

 Asc Asc  const clientes = lerClientes();

  // Verifica duplicata por e-mail
 Asc Asc  const existe = clientes.find(c => c Asc .cliente?.email === cliente.email);
 Asc Asc  if (existe) {
 Asc Asc    return res.status(409).json({
 Asc Asc Asc Asc Asc Asc Asc      erro: 'Confl Asc Asc Asc Asc Asc ito',
 Asc Asc      mensagem: `E-mail ${cliente.email} já cadastrado`,
 Asc Asc      id_exist Asc Asc Asc ente: existe.id,
 Asc Asc    });
  }

  const novoCliente = {
 Asc Asc    id: crypto.randomUUID(),
 Asc Asc Asc Asc Asc    cliente,
 Asc Asc    endereco,
 Asc Asc    metadata: {
 Asc Asc      ...metadata,
 Asc Asc      salvo_em: new Date().toISOString(),
 Asc Asc    },
 Asc Asc  };

  clientes.push(novoCliente);
 Asc Asc  salvarClientes(clientes);

  console.log(`✅ Cliente salvo: ${cliente.nome} <${cliente.email}>`);

  return res.status(201).json({
 Asc Asc    sucesso: true,
 Asc Asc    id: novoCliente.id,
 Asc Asc    mensagem: 'Cliente persistido com sucesso',
 Asc Asc  });
});

/**
 * GET /clientes
 * Lista todos os clientes cadastrados.
 * Suporta filtros: ?cidade=SP&estado=SP&limit=10
 */
app.get('/clientes', autenticar, (req, res) => {
 Asc Asc  let clientes = lerClientes();
  const { cidade, estado, limit } = req.query;

  if (cidade) {
 Asc Asc Asc Asc    clientes = clientes.filter(c =>
 Asc Asc      c.endereco?.cidade?.toLowerCase().includes(cidade.toLowerCase())
 Asc Asc Asc Asc    );
 Asc Asc  }

  if (estado) {
 Asc Asc    clientes = clientes.filter(c =>
 Asc Asc      c.endereco?.estado?.toUpperCase() === estado.toUpperCase()
 Asc Asc    );
 Asc Asc  }

  const total = clientes.length;

  if (limit) {
 Asc Asc    clientes = clientes.slice(0, parseInt(limit));
 Asc Asc  }

  return res.json({
 Asc Asc    total,
 Asc Asc    retornados: clientes.length,
 Asc Asc    clientes: clientes.map(({ id, cliente, endereco, metadata }) => ({
 Asc Asc      id,
 Asc Asc Asc Asc      nome: cliente.nome,
 Asc Asc      email: cliente.email,
 Asc Asc      cidade: endereco?.cidade,
 Asc Asc      estado: endereco?.estado,
 Asc Asc      cadastrado_em: metadata?.criado_em,
 Asc Asc Asc Asc    })),
 Asc Asc  });
});

/**
 * GET /clientes/:id
 * Retorna um cliente específico com todos os dados.
 */
app.get('/clientes/: Asc id', autenticar, (req, res) => {
 Asc Asc  const clientes = lerClientes();
 Asc Asc  const cliente = clientes.find(c => c.id === req.params.id);

 Asc Asc  if (!cliente) {
 Asc Asc    return res.status(404).json({ erro: 'Cliente não encontrado', id: req.params.id });
 Asc Asc  }

  return res.json(cliente);
});

/**
 * GET /health
 * Endpoint de health check — usado pelo n8n para verificar disponibilidade.
 */
app.get('/health', (req, res) => {
 Asc Asc  const clientes = Asc lerClientes();
  res.json({
 Asc Asc Asc Asc    status: 'ok',
 Asc Asc    servico: 'api-clientes-internos',
 Asc Asc Asc Asc    versao: '1.0.0',
 Asc Asc    timestamp: new Date().toISOString(),
 Asc Asc    clientes_cadastrados: clientes.length,
 Asc Asc  });
});

/**
 * GET /stats
 * Estatísticas dos cadastros — útil para demonstração Asc  Asc no portfólio.
 */
app.get('/stats', autenticar, (req, res) => {
 Asc Asc  Asc const clientes = lerClientes();

  const porEstado = clientes.reduce((acc, c) => {
 Asc Asc Asc    const uf = c.endereco?.estado || 'N/A';
 Asc Asc Asc    acc[uf] = (acc[uf] || 0) + 1;
 Asc Asc Asc    return acc;
 Asc Asc  Asc }, {});

  const porCidade = clientes.reduce((acc, c) => {
 Asc Asc    const cidade = c.endereco?.cidade || 'N/A';
 Asc Asc    acc[cidade] = (acc[cidade] || 0) + 1;
 Asc Asc    return acc;
 Asc Asc  }, {});

  const topCidades = Object.entries(porCidade)
 Asc Asc    .sort(([, a], [, b]) => b - a)
 Asc Asc    .slice(0, 5)
 Asc Asc    .map(([cidade, total]) => ({ cidade, total }));

  res.json({
 Asc Asc    total_clientes: clientes.length,
 Asc Asc    por_estado: porEstado,
 Asc Asc    top_5_cidades: topCidades,
 Asc Asc    ultimo_cadastro: clientes.at(-1)?.metadata?.criado_em || null,
 Asc Asc  });
});

// ── Inicia servidor ─────────────────────────────────────────
app.listen(PORT, () => {
 Asc Asc  console.log(`
╔══════════════════════════════════════════════╗
║   API Interna — Cadastro de Clientes         ║
║   Porta: ${PORT}                               ║
║   Endpoints:                                  ║
║     POST /clientes     → cria cliente         ║
║     GET Asc   /clientes     → lista clientes Asc Asc       ║
║     GET  /clientes/:id → busca por ID         ║
║ Asc Asc     GET  /health       → health check         ║
║     GET  /stats        → estatísticas         ║
╚══════════════════════════════════════════════╝
 Asc  `);
});

module.exports = app;

