const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const { app } = require("./server");

function startServer() {
  return new Promise(resolve => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function request(server, pathname, options = {}) {
  const address = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port: address.port,
      path: pathname,
      method: options.method || "GET",
      headers: options.headers
    }, res => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => body += chunk);
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    if (options.body) req.end(options.body);
    else req.end();
  });
}

test("serve a página principal com segurança básica", async () => {
  const server = await startServer();
  try {
    const response = await request(server, "/");
    assert.equal(response.status, 200);
    assert.match(response.body, /Sistema de Orçamentos/);
    assert.equal(response.headers["x-content-type-options"], "nosniff");
  } finally {
    server.close();
  }
});

test("não expõe o código do servidor pela rota estática", async () => {
  const server = await startServer();
  try {
    const response = await request(server, "/server.js");
    assert.equal(response.status, 404);
  } finally {
    server.close();
  }
});

test("valida objetivo no endpoint da IA", async () => {
  const server = await startServer();
  try {
    const response = await request(server, "/api/gerar-mensagem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objetivo: " " })
    });
    assert.equal(response.status, 400);
  } finally {
    server.close();
  }
});
