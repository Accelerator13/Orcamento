// Servidor simples: serve os arquivos do site e esconde a chave da IA do navegador.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Em produção, defina ALLOWED_ORIGIN no .env com o domínio real do site
// (ex: https://orcamento.onlineshopping.com.br) para não aceitar requisições
// de qualquer origem.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "10kb" }));
app.use(express.static(__dirname)); // serve index.html, style.css, script.js, logo.png

app.post("/api/gerar-mensagem", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ erro: "GEMINI_API_KEY não configurada no servidor (.env)." });
  }

  const { objetivo, tom } = req.body || {};
  if (!objetivo || typeof objetivo !== "string" || !objetivo.trim()) {
    return res.status(400).json({ erro: "Informe o objetivo da mensagem." });
  }
  if (objetivo.length > 300) {
    return res.status(400).json({ erro: "Objetivo muito longo (máximo 300 caracteres)." });
  }

  const prompt = `Você é um especialista em copywriting para WhatsApp focado em vendas de hardware e tecnologia.
Gere uma mensagem altamente persuasiva para o WhatsApp com base nisto:
- Objetivo: ${objetivo}
- Tom do texto: ${tom}

Regras obrigatórias de formatação:
1. Use quebras de linha para deixar o texto leve no celular.
2. Use negritos do WhatsApp (*texto*) nas palavras mais importantes.
3. Use emojis adequados (computadores, foguetes, checkmarks), sem exagerar.
4. Termine com uma Chamada para Ação (CTA) clara.
Não adicione nenhuma introdução como 'Aqui está o seu texto:', devolva apenas a mensagem pronta para enviar.`;

  const controle = new AbortController();
  const timeoutId = setTimeout(() => controle.abort(), 15000);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controle.signal
    });

    const data = await response.json();

    if (data.error) {
      console.error("Erro da API do Gemini:", data.error);
      return res.status(502).json({ erro: data.error.message || "Erro ao consultar a IA." });
    }

    const texto = data.candidates && data.candidates[0]?.content?.parts?.[0]?.text;
    if (!texto) {
      return res.status(502).json({ erro: "A IA não retornou um texto válido." });
    }

    res.json({ texto });
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("Timeout ao consultar a API do Gemini.");
      return res.status(504).json({ erro: "A IA demorou demais para responder. Tente novamente." });
    }
    console.error("Erro ao conectar com a API do Gemini:", err);
    res.status(500).json({ erro: "Erro de conexão com a API do Gemini." });
  } finally {
    clearTimeout(timeoutId);
  }
});

// Qualquer rota de API não encontrada retorna JSON (evita HTML de erro cru)
app.use("/api", (req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Handler de erro genérico, para nunca vazar stack trace ao cliente
app.use((err, req, res, next) => {
  console.error("Erro inesperado no servidor:", err);
  res.status(500).json({ erro: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
