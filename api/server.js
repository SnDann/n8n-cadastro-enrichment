// ============================================================
// API Interna  Persistência de Clientes Enriquecidos
// Recebe dados já validados e enriquecidos pelo fluxo n8n
// Stack: Node.js + Express + armazenamento em JSON (simula DB)
// ============================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY_INTERNA || 'dev-key-local-123';
const DB_FILE = path.join(__dirname, 'data', 'clientes.json');

//  Middleware 
app.use(express.json());

// Logger simples
app.use((req, res, next) => {
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// Auth via API Key (header x-api-key)
function autenticar(req, res, next) {
  const chave = req.headers['x-api-key'];
  if (!chave || chave !== API_KEY) {
    return res.status(401).json({
      erro: 'Não autorizado',
      detalhes: 'Header x-api-key ausente ou inválido'
    });
  }
  next();
}

//  Helpers de persistência (simula banco com JSON) 
function lerClientes() {
  if (!fs.existsSync(DB_FILE)) return [];
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}
function salvarClientes(lista) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(lista, null, 2), 'utf-8');
}

//  Rotas 
app.post('/clientes', autenticar, (req, res) => {
  const { cliente, endereco, metadata } = req.body;
  if (!cliente?.email || !cliente?.nome) {
    return res.status(400).json({
      erro: 'Payload incompleto',
      esperado: '{ cliente: { nome, email }, endereco: {...}, metadata: {...} }'
    });
  }

  const clientes = lerClientes();
  const existe = clientes.find(c => c.cliente?.email === cliente.email);
  if (existe) {
    return res.status(409).json({
      erro: 'Conflito',
      mensagem: `E-mail ${cliente.email} já cadastrado`,
      id_existente: existe.id
    });
  }

  const novoCliente = {
    id: crypto.randomUUID(),
    cliente,
    endereco,
    metadata: {
      ...metadata,
      salvo_em: new Date().toISOString()
    }
  };

  clientes.push(novoCliente);
  salvarClientes(clientes);

  console.log(` Cliente salvo: ${cliente.nome} <${cliente.email}>`);

  return res.status(201).json({
    sucesso: true,
    id: novoCliente.id,
    mensagem: 'Cliente persistido com sucesso'
  });
});

app.get('/clientes', autenticar, (req, res) => {
  let clientes = lerClientes();
  const { cidade, estado, limit } = req.query;

  if (cidade) {
    clientes = clientes.filter(c =>
      c.endereco?.cidade?.toLowerCase().includes(cidade.toLowerCase())
    );
  }
  if (estado) {
    clientes = clientes.filter(c =>
      c.endereco?.estado?.toUpperCase() === estado.toUpperCase()
    );
  }

  const total = clientes.length;
  if (limit) {
    clientes = clientes.slice(0, parseInt(limit));
  }

  return res.json({
    total,
    retornados: clientes.length,
    clientes: clientes.map(({ id, cliente, endereco, metadata }) => ({
      id,
      nome: cliente.nome,
      email: cliente.email,
      cidade: endereco?.cidade,
      estado: endereco?.estado,
      cadastrado_em: metadata?.criado_em
    }))
  });
});

app.get('/clientes/:id', autenticar, (req, res) => {
  const clientes = lerClientes();
  const cliente = clientes.find(c => c.id === req.params.id);

  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado', id: req.params.id });
  }
  return res.json(cliente);
});

app.get('/health', (req, res) => {
  const clientes = lerClientes();
  res.json({
    status: 'ok',
    servico: 'api-clientes-internos',
    versao: '1.0.0',
    timestamp: new Date().toISOString(),
    clientes_cadastrados: clientes.length
  });
});

app.get('/stats', autenticar, (req, res) => {
  const clientes = lerClientes();

  const porEstado = clientes.reduce((acc, c) => {
    const uf = c.endereco?.estado || 'N/A';
    acc[uf] = (acc[uf] || 0) + 1;
    return acc;
  }, {});

  const porCidade = clientes.reduce((acc, c) => {
    const cidade = c.endereco?.cidade || 'N/A';
    acc[cidade] = (acc[cidade] || 0) + 1;
    return acc;
  }, {});

  const topCidades = Object.entries(porCidade)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cidade, total]) => ({ cidade, total }));

  res.json({
    total_clientes: clientes.length,
    por_estado: porEstado,
    top_5_cidades: topCidades,
    ultimo_cadastro: clientes.at(-1)?.metadata?.criado_em || null
  });
});

//  Inicia servidor 
app.listen(PORT, () => {
  console.log(`

   API Interna  Cadastro de Clientes         
   Porta: ${PORT}                               
   Endpoints:                                  
     POST /clientes      cria cliente         
     GET /clientes       lista clientes       
     GET /clientes/:id   busca por ID         
     GET /health         health check         
     GET /stats          estatísticas         

`);
});

module.exports = app;
