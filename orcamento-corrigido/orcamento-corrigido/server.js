// Servidor simples: serve os arquivos do site e esconde a chave da IA do navegador.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve index.html, style.css, script.js, logo.png

app.post("/api/gerar-mensagem", async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ erro: "GEMINI_API_KEY não configurada no servidor (.env)." });
  }

  const { objetivo, tom } = req.body;
  if (!objetivo) {
    return res.status(400).json({ erro: "Informe o objetivo da mensagem." });
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

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
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
    console.error("Erro ao conectar com a API do Gemini:", err);
    res.status(500).json({ erro: "Erro de conexão com a API do Gemini." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
