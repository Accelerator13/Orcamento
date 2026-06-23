// LISTA PADRÃO INICIAL
const CATALOGO_PADRAO = [
  { nome: "SSD Kingston NV2 1TB NVMe M.2", preco: "389.90" },
  { nome: "SSD Kingston NV2 500GB NVMe M.2", preco: "249.00" },
  { nome: "Memória RAM Kingston Fury Beast 8GB DDR4 3200MHz", preco: "179.00" },
  { nome: "Memória RAM Kingston Fury Beast 16GB DDR4 3200MHz", preco: "320.00" },
  { nome: "Processador AMD Ryzen 5 5600G 3.9GHz", preco: "890.00" },
  { nome: "Processador AMD Ryzen 7 5700X 3.4GHz", preco: "1250.00" },
  { nome: "Placa de Vídeo NVIDIA RTX 3060 12GB", preco: "1999.00" },
  { nome: "Placa de Vídeo NVIDIA RTX 4060 8GB", preco: "2250.00" },
  { nome: "Fonte XPG Core Reactor 850W 80 Plus Gold Modular", preco: "649.00" }
];

const OPCOES_PAGAMENTO = {
  "vista":    { acrescimo: 0.00, texto: "Pagamento único sem acréscimo", parcelas: 1 },
  "2x_sem":   { acrescimo: 0.00, texto: "sem juros", parcelas: 2 },
  "3x_sem":   { acrescimo: 0.00, texto: "sem juros", parcelas: 3 },
  "6x_juros": { acrescimo: 0.05, texto: "c/ acréscimo", parcelas: 6 },
  "10x_juros":{ acrescimo: 0.08, texto: "c/ acréscimo", parcelas: 10 },
  "boleto":   { acrescimo: 0.00, texto: "Pagamento único sem acréscimo", parcelas: 1 },
  "outro":    { acrescimo: 0.00, texto: "", parcelas: 1 }
};

let divAtivaAutocompletar = null;

function obterCatalogo() {
  let cat = localStorage.getItem("app_catalogo_prod");
  if(!cat) {
    localStorage.setItem("app_catalogo_prod", JSON.stringify(CATALOGO_PADRAO));
    return CATALOGO_PADRAO;
  }
  return JSON.parse(cat);
}

function obterClientes() {
  return JSON.parse(localStorage.getItem("app_clientes_crm")) || [];
}

function salvarClienteNoCRM(cnpj, nome) {
  if(!cnpj || !nome) return;
  let clientes = obterClientes();
  let cnpjLimpo = cnpj.replace(/\D/g, '');
  let index = clientes.findIndex(c => c.cnpj.replace(/\D/g, '') === cnpjLimpo);
  
  if(index >= 0) {
    clientes[index].nome = nome;
  } else {
    clientes.push({ cnpj, nome });
  }
  localStorage.setItem("app_clientes_crm", JSON.stringify(clientes));
}

// CÁLCULO GERAL E TRAVA DE DESCONTO DE 20%
function calcular() {
  const linhas = document.querySelectorAll("#tabela-produtos tr");
  let subtotalGeral = 0;

  linhas.forEach(linha => {
    const inputQtd = linha.querySelector(".qtd-input");
    const inputValor = linha.querySelector(".valor-unitario"); 
    const inputObs = linha.querySelector(".prod-obs");
    const celulaSubtotal = linha.querySelector(".subtotal-cell");

    if (inputObs && inputObs.value.toLowerCase().match(/(sob )?encomenda/)) {
      linha.classList.add("linha-encomenda");
    } else if (linha.classList.contains("linha-encomenda")) {
      linha.classList.remove("linha-encomenda");
    }

    if (inputQtd && inputValor && celulaSubtotal) {
      const qtd = parseFloat(inputQtd.value) || 0;
      const valorUnitario = parseFloat(inputValor.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
      const subtotalItem = qtd * valorUnitario;
      subtotalGeral += subtotalItem;

      celulaSubtotal.textContent = subtotalItem.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
  });

  document.getElementById("subtotal-display").textContent = subtotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const tipoDesconto = document.getElementById("tipo-desconto").value;
  const inputValorDesconto = document.getElementById("valor-desconto");
  let valorDescontoDigitado = parseFloat(inputValorDesconto.value) || 0;
  let totalDesconto = 0;

  if (tipoDesconto === "porcento") {
    if (valorDescontoDigitado > 20) { alert("Limite máximo de desconto: 20%!"); valorDescontoDigitado = 20; inputValorDesconto.value = 20; }
    totalDesconto = subtotalGeral * (valorDescontoDigitado / 100);
  } else if (tipoDesconto === "reais") {
    const limiteEmReais = subtotalGeral * 0.20;
    if (valorDescontoDigitado > limiteEmReais) { alert("Limite máximo de desconto atingido (20% do valor total)!"); valorDescontoDigitado = limiteEmReais; inputValorDesconto.value = limiteEmReais.toFixed(2); }
    totalDesconto = valorDescontoDigitado;
  }

  const rowDesconto = document.getElementById("row-desconto");
  if (totalDesconto > 0) {
    rowDesconto.style.display = "";
    document.getElementById("desconto-display").textContent = "– " + totalDesconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  } else {
    rowDesconto.style.display = "none";
  }

  let totalGeral = subtotalGeral - totalDesconto;
  const chavePagamento = document.getElementById("cond-pag").value;
  const areaParcelas = document.getElementById("parcelas-detalhe");
  
  if (OPCOES_PAGAMENTO[chavePagamento]) {
    const config = OPCOES_PAGAMENTO[chavePagamento];
    if (config.acrescimo > 0) totalGeral = totalGeral * (1 + config.acrescimo);

    if (config.parcelas === 1) {
      areaParcelas.textContent = config.texto;
    } else {
      areaParcelas.textContent = `${config.parcelas}x de ${(totalGeral / config.parcelas).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ${config.texto}`;
    }
  }

  document.getElementById("total-display").textContent = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  salvarEstadoAtualNoLocalStorage();
}

function aplicarMascaraDinheiro(input) {
  let valor = input.value.replace(/\D/g, '');
  if(valor === "") valor = "0";
  input.value = (parseFloat(valor) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// AUTOCOMPLETAR PRODUTOS DO CATÁLOGO
function gerenciarAutocompletar(divEditavel) {
  divAtivaAutocompletar = divEditavel;
  const texto = divEditavel.textContent.trim().toLowerCase();
  const listaSugestoes = document.getElementById("autocomplete-list");
  if (!texto) { listaSugestoes.style.display = "none"; return; }

  const filtrados = obterCatalogo().filter(p => p.nome.toLowerCase().includes(texto));
  if (filtrados.length === 0) { listaSugestoes.style.display = "none"; return; }

  listaSugestoes.innerHTML = "";
  filtrados.forEach(produto => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.innerHTML = `<span>${produto.nome}</span> <strong>R$ ${parseFloat(produto.preco).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>`;
    
    item.addEventListener("click", () => {
      divEditavel.textContent = produto.nome;
      const inputPreco = divEditavel.closest("tr").querySelector(".valor-unitario");
      inputPreco.value = parseFloat(produto.preco).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      listaSugestoes.style.display = "none";
      calcular();
    });
    listaSugestoes.appendChild(item);
  });

  const rect = divEditavel.getBoundingClientRect();
  listaSugestoes.style.left = `${rect.left + window.scrollX}px`;
  listaSugestoes.style.top = `${rect.bottom + window.scrollY}px`;
  listaSugestoes.style.width = `${rect.width}px`;
  listaSugestoes.style.display = "block";
}

// AUTOCOMPLETAR CRM CLIENTES
document.getElementById("cliente-cnpj").addEventListener("input", function() {
  const txt = this.value.trim().toLowerCase();
  const crmBox = document.getElementById("crm-suggest-list");
  if(!txt) { crmBox.style.display = "none"; return; }

  const filtrados = obterClientes().filter(c => c.cnpj.toLowerCase().includes(txt) || c.nome.toLowerCase().includes(txt));
  if(filtrados.length === 0) { crmBox.style.display = "none"; return; }

  crmBox.innerHTML = "";
  filtrados.forEach(c => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.innerHTML = `<span><strong>${c.cnpj}</strong> - ${c.nome}</span>`;
    item.onclick = function() {
      document.getElementById("cliente-cnpj").value = c.cnpj;
      document.getElementById("cliente-nome").value = c.nome;
      crmBox.style.display = "none";
      calcular();
    };
    crmBox.appendChild(item);
  });
  crmBox.style.display = "block";
});

document.addEventListener("click", (e) => {
  if (e.target !== divAtivaAutocompletar && !e.target.closest("#autocomplete-list")) {
    document.getElementById("autocomplete-list").style.display = "none";
  }
  if (!e.target.closest("#cliente-cnpj") && !e.target.closest("#crm-suggest-list")) {
    document.getElementById("crm-suggest-list").style.display = "none";
  }
});

// ADICIONAR NOVA LINHA DE PRODUTO
function adicionarNovaLinha(nome = "", qtd = 1, valor = "0,00", obs = "") {
  const tbody = document.getElementById("tabela-produtos");
  const novaLinha = document.createElement("tr");
  
  novaLinha.innerHTML = `
    <td><div contenteditable="true" class="prod-nome" data-placeholder="Descrição do produto">${nome}</div></td>
    <td class="center"><input type="number" class="center qtd-input" value="${qtd}" style="width: 50px;" /></td>
    <td class="right"><input type="text" class="right valor-unitario" value="${valor}" style="width: 90px;" /></td>
    <td><input type="text" class="prod-obs" placeholder="Ex: sob encomenda..." value="${obs}" /></td>
    <td class="right subtotal-cell" style="color: #2b6cb0; font-weight: 600;">R$ 0,00</td>
    <td class="center no-print">
      <div class="action-buttons">
        <button class="btn-order" onclick="moverLinha(this, -1)">▲</button>
        <button class="btn-order" onclick="moverLinha(this, 1)">▼</button>
        <button class="btn-remove">✕</button>
      </div>
    </td>
  `;

  const divNome = novaLinha.querySelector(".prod-nome");
  divNome.addEventListener("input", () => { gerenciarAutocompletar(divNome); calcular(); });

  const inputPreco = novaLinha.querySelector(".valor-unitario");
  inputPreco.addEventListener("input", () => { aplicarMascaraDinheiro(inputPreco); calcular(); });

  novaLinha.querySelector(".qtd-input").addEventListener("input", calcular);
  novaLinha.querySelector(".prod-obs").addEventListener("input", calcular);
  novaLinha.querySelector(".btn-remove").addEventListener("click", () => {
    if(document.querySelectorAll("#tabela-produtos tr").length > 1) { novaLinha.remove(); calcular(); }
    else alert("O orçamento precisa de ao menos 1 item.");
  });

  tbody.appendChild(novaLinha);
  calcular();
}

function moverLinha(btn, direcao) {
  const row = btn.closest("tr");
  if(direcao === -1 && row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling);
  if(direcao === 1 && row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row);
  calcular();
}

// CONEXÃO COM A BRASIL API PARA BUSCA DE CNPJ
function buscarCNPJ() {
  const campoCnpj = document.getElementById("cliente-cnpj");
  const cnpj = campoCnpj.value.replace(/\D/g, '');
  const campoNome = document.getElementById("cliente-nome");
  const spinner = document.getElementById("cnpj-spinner");

  if (cnpj.length === 14) {
    spinner.style.display = "block";
    campoCnpj.classList.add("campo-buscando");
    campoNome.value = "Buscando dados na nuvem corporativa...";
    
    fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        const razao = data.razao_social || data.nome_fantasia || "";
        campoNome.value = razao;
        salvarClienteNoCRM(campoCnpj.value, razao);
        calcular();
      })
      .catch(() => {
        alert("CNPJ não localizado automaticamente. Insira os dados do cliente manualmente.");
        campoNome.value = "";
      })
      .finally(() => {
        spinner.style.display = "none";
        campoCnpj.classList.remove("campo-buscando");
      });
  }
}

// SALVAR ESTADO ATUAL E HISTÓRICO COM TIMESTAMP (REGRA DOS 3 DIAS)
function salvarEstadoAtualNoLocalStorage() {
  const itens = [];
  document.querySelectorAll("#tabela-produtos tr").forEach(linha => {
    const nome = linha.querySelector(".prod-nome").textContent;
    const qtd = linha.querySelector(".qtd-input").value;
    const valor = linha.querySelector(".valor-unitario").value;
    const obs = linha.querySelector(".prod-obs").value;
    if(nome || valor !== "0,00") itens.push({ nome, qtd, valor, obs });
  });

  const linkPagamento = document.getElementById("link-pagamento-input") ? document.getElementById("link-pagamento-input").value : "";

  const rascunho = {
    numero: document.getElementById("num-orcamento").textContent,
    cnpj: document.getElementById("cliente-cnpj").value,
    nome: document.getElementById("cliente-nome").value,
    whatsVendedor: document.getElementById("vendedor-whats").value,
    vendedor: document.getElementById("responsavel-nome").value,
    tipoDesconto: document.getElementById("tipo-desconto").value,
    valorDesconto: document.getElementById("valor-desconto").value,
    condPag: document.getElementById("cond-pag").value,
    prevEntrega: document.getElementById("prev-entrega").value,
    obsGerais: document.getElementById("obs-gerais").value,
    linkPagamento: linkPagamento,
    itens
  };
  localStorage.setItem("orc_rascunho_atual", JSON.stringify(rascunho));
}

function carregarRascunho() {
  const dados = localStorage.getItem("orc_rascunho_atual");
  if (!dados) { adicionarNovaLinha(); return; }
  const rascunho = JSON.parse(dados);
  
  document.getElementById("num-orcamento").textContent = rascunho.numero || "ORC-001";
  document.getElementById("cliente-cnpj").value = rascunho.cnpj || "";
  document.getElementById("cliente-nome").value = rascunho.nome || "";
  document.getElementById("vendedor-whats").value = rascunho.whatsVendedor || "";
  document.getElementById("responsavel-nome").value = rascunho.vendedor || "";
  document.getElementById("tipo-desconto").value = rascunho.tipoDesconto || "nenhum";
  document.getElementById("valor-desconto").value = rascunho.valorDesconto || "0";
  document.getElementById("cond-pag").value = rascunho.condPag || "vista";
  document.getElementById("prev-entrega").value = rascunho.prevEntrega || "Imediato";
  document.getElementById("obs-gerais").value = rascunho.obsGerais || "";
  if (document.getElementById("link-pagamento-input")) {
    document.getElementById("link-pagamento-input").value = rascunho.linkPagamento || "";
  }

  const tbody = document.getElementById("tabela-produtos");
  tbody.innerHTML = "";
  if(rascunho.itens && rascunho.itens.length > 0) {
    rascunho.itens.forEach(i => adicionarNovaLinha(i.nome, i.qtd, i.valor, i.obs));
  } else {
    adicionarNovaLinha();
  }
}

function salvarEImprimir() {
  let historico = JSON.parse(localStorage.getItem("orc_historico")) || [];
  const numAtual = document.getElementById("num-orcamento").textContent;
  const cliente = document.getElementById("cliente-nome").value || "Cliente sem Nome";
  const total = document.getElementById("total-display").textContent;
  const dataHoje = document.getElementById("data-orcamento").value;
  const cnpj = document.getElementById("cliente-cnpj").value;

  if(cnpj && cliente) salvarClienteNoCRM(cnpj, cliente);

  const idx = historico.findIndex(o => o.numero === numAtual);
  const rascunhoSalvo = JSON.parse(localStorage.getItem("orc_rascunho_atual")) || {};

  const dadosOrc = {
    numero: numAtual, 
    cliente, 
    data: dataHoje, 
    total,
    status: idx >= 0 ? historico[idx].status : "🟡 Pendente",
    timestampCriacao: idx >= 0 ? (historico[idx].timestampCriacao || Date.now()) : Date.now(),
    raw: JSON.stringify(rascunhoSalvo)
  };

  if(idx >= 0) historico[idx] = dadosOrc;
  else historico.push(dadosOrc);

  localStorage.setItem("orc_historico", JSON.stringify(historico));

  if(idx === -1) {
    let proximoNum = parseInt(numAtual.replace("ORC-", "")) + 1;
    localStorage.setItem("proximo_numero_orc", "ORC-" + String(proximoNum).padStart(3, '0'));
  }
  window.print();
}

// NAVEGAÇÃO DO PAINEL GESTÃO MODAL
function abrirModalGestao() {
  document.getElementById("modal-gestao").style.display = "block";
  mudarAbaGestao('tab-dash');
}
function fecharModalGestao() { document.getElementById("modal-gestao").style.display = "none"; }

function mudarAbaGestao(idAba) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active-content"));
  
  const botao = Array.from(document.querySelectorAll(".tab-btn")).find(b => b.getAttribute("onclick").includes(idAba));
  if(botao) botao.classList.add("active");
  document.getElementById(idAba).classList.add("active-content");

  if(idAba === 'tab-dash') { atualizarDashboard(); renderizarHistorico(); }
  if(idAba === 'tab-catalogo') { renderizarCatalogo(); }
  if(idAba === 'tab-crm') { renderizarCRM(); }
}

function atualizarDashboard() {
  const historico = JSON.parse(localStorage.getItem("orc_historico")) || [];
  let faturamento = 0, totalAprovados = 0;

  historico.forEach(o => {
    let v = parseFloat(o.total.replace(/[^\d,]/g, '').replace(',', '.'));
    if (o.status === "🟢 Aprovado") { faturamento += v; totalAprovados++; }
  });

  const tOrcs = historico.length;
  document.getElementById("dash-faturamento").textContent = faturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById("dash-qtd").textContent = tOrcs;
  document.getElementById("dash-ticket").textContent = (totalAprovados > 0 ? (faturamento / totalAprovados) : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById("dash-conversao").textContent = `${tOrcs > 0 ? ((totalAprovados / tOrcs) * 100).toFixed(0) : 0}%`;
}

// RENDEREZAR HISTÓRICO COM REGRA DE ALERTA DE 3 DIAS (72H)
function renderizarHistorico() {
  const historico = JSON.parse(localStorage.getItem("orc_historico")) || [];
  const busca = document.getElementById("busca-historico").value.toLowerCase();
  const corpo = document.getElementById("lista-historico-corpo");
  corpo.innerHTML = "";

  const filtrados = historico.filter(o => o.numero.toLowerCase().includes(busca) || o.cliente.toLowerCase().includes(busca));
  if(!filtrados.length) { corpo.innerHTML = `<tr><td colspan="6" class="center">Nenhum registro encontrado.</td></tr>`; return; }

  filtrados.forEach(orc => {
    const idxOriginal = historico.findIndex(h => h.numero === orc.numero);
    let badgeTempoHtml = "";
    let exibirBotaoFollowUp = false;

    if (orc.status === "🟡 Pendente" && orc.timestampCriacao) {
      const horasPassadas = (Date.now() - orc.timestampCriacao) / (1000 * 60 * 60);
      if (horasPassadas < 24) {
        badgeTempoHtml = `<span class="badge-tempo fresco">🟢 Fresco</span>`;
      } else if (horasPassadas >= 24 && horasPassadas < 72) {
        badgeTempoHtml = `<span class="badge-tempo morno">🟡 Morno</span>`;
      } else {
        badgeTempoHtml = `<span class="badge-tempo critico">🔴 Alerta (+3d)</span>`;
        exibirBotaoFollowUp = true;
      }
    } else {
      badgeTempoHtml = `<span class="badge-tempo concluido">✓ Resolvido</span>`;
    }

    const tr = document.createElement("tr");
    if (exibirBotaoFollowUp) tr.className = "linha-alerta-critica";

    tr.innerHTML = `
      <td><strong>${orc.numero}</strong><br>${badgeTempoHtml}</td>
      <td>${orc.cliente}</td>
      <td>${orc.data}</td>
      <td style="color:#2b6cb0; font-weight:bold;">${orc.total}</td>
      <td>
        <select onchange="mudarStatusOrcamento(${idxOriginal}, this.value)" class="status-select">
          <option value="🟡 Pendente" ${orc.status === '🟡 Pendente'?'selected':''}>🟡 Pendente</option>
          <option value="🟢 Aprovado" ${orc.status === '🟢 Aprovado'?'selected':''}>🟢 Aprovado</option>
          <option value="🔴 Cancelado" ${orc.status === '🔴 Cancelado'?'selected':''}>🔴 Cancelado</option>
        </select>
      </td>
      <td>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-blue" style="padding:4px 8px; font-size:11px;" onclick="restaurarOrcamentoDoHistorico(${idxOriginal})">📂 Abrir</button>
          ${exibirBotaoFollowUp ? `<button class="btn btn-green" style="padding:4px 8px; font-size:11px; background-color:#e53e3e;" onclick="dispararWhatsFollowUp(${idxOriginal})">📣 Cobrar</button>` : ''}
          <button class="btn btn-remove" style="padding:4px 8px; font-size:11px;" onclick="deletarDoHistorico(${idxOriginal})">✕</button>
        </div>
      </td>
    `;
    corpo.appendChild(tr);
  });
}

// TEXTO INTELIGENTE COM GANCHO DE HARDWARE PARA WHATSAPP
function dispararWhatsFollowUp(idx) {
  const historico = JSON.parse(localStorage.getItem("orc_historico")) || [];
  const orc = historico[idx];
  if(!orc || !orc.raw) return;

  const rawData = JSON.parse(orc.raw);
  const clienteNome = orc.cliente;
  const totalGeral = orc.total;
  const vendedor = rawData.vendedor || "Consultor de Vendas";
  const telefoneVendedor = rawData.whatsVendedor ? rawData.whatsVendedor.replace(/\D/g, '') : "";

  const primeiroHardware = rawData.itens && rawData.itens.length > 0 ? rawData.itens[0].nome : "os componentes de tecnologia";

  let msg = `Fala, *${clienteNome}*! Tudo bem?\n\n`;
  msg += `Aqui é o *${vendedor}* da *Online Shopping*. 🚀\n\n`;
  msg += `Estava a rever os meus relatórios aqui no sistema e notei que o seu orçamento para aquele setup com o *${primeiroHardware}* completou 3 dias hoje.\n\n`;
  msg += `Como o mercado de hardware e semicondutores flutua muito rápido, passei para te avisar que eu consegui travar aquele valor de *${totalGeral}* por mais hoje para ti. 😉\n\n`;
  
  if (rawData.linkPagamento) {
    msg += `Se quiseres garantir o estoque e mandar as peças direto para a nossa bancada de montagem técnica, podes efetuar o pagamento direto por este link seguro: ${rawData.linkPagamento}\n\n`;
  } else {
    msg += `Consegues dar um pulo aqui no shopping hoje ou preferes que eu te gere uma chave Pix por aqui para garantires as peças? 🏁\n\n`;
  }
  
  msg += `Fico no teu aguardo! Tamo junto.`;

  window.open((telefoneVendedor ? `https://api.whatsapp.com/send?phone=55${telefoneVendedor}&text=` : `https://api.whatsapp.com/send?text=`) + encodeURIComponent(msg), '_blank');
}

function mudarStatusOrcamento(idx, status) {
  let h = JSON.parse(localStorage.getItem("orc_historico")); h[idx].status = status;
  localStorage.setItem("orc_historico", JSON.stringify(h)); atualizarDashboard();
}
function restaurarOrcamentoDoHistorico(idx) {
  localStorage.setItem("orc_rascunho_atual", JSON.parse(localStorage.getItem("orc_historico"))[idx].raw);
  carregarRascunho(); fecharModalGestao();
}
function deletarDoHistorico(idx) {
  if(confirm("Eliminar este orçamento do histórico?")) {
    let h = JSON.parse(localStorage.getItem("orc_historico")); h.splice(idx, 1);
    localStorage.setItem("orc_historico", JSON.stringify(h)); atualizarDashboard(); renderizarHistorico();
  }
}

// GERENCIADOR DO CATÁLOGO DE PRODUTOS
function renderizarCatalogo() {
  const corpo = document.getElementById("lista-catalogo-corpo"); corpo.innerHTML = "";
  const cat = obterCatalogo();
  if(!cat.length) { corpo.innerHTML = `<tr><td colspan="3" class="center">O catálogo está vazio.</td></tr>`; return; }

  cat.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" value="${p.nome}" style="width:100%; border:none; background:transparent;" onchange="editarProdutoNoCatalogo(${idx}, 'nome', this.value)"></td>
      <td class="right">R$ <input type="text" value="${parseFloat(p.preco).toLocaleString('pt-BR', {minimumFractionDigits:2})}" class="right" style="width:100px; border:none; background:transparent;" oninput="aplicarMascaraDinheiro(this)" onchange="editarProdutoNoCatalogo(${idx}, 'preco', this.value)"></td>
      <td class="center"><button class="btn btn-remove" onclick="removerProdutoDoCatalogo(${idx})">✕ Remover</button></td>
    `;
    corpo.appendChild(tr);
  });
}

function adicionarProdutoAoCatalogo() {
  const nome = document.getElementById("cad-prod-nome").value.trim();
  let precoRaw = document.getElementById("cad-prod-preco").value;
  if(!nome || !precoRaw) { alert("Informe descrição e preço válido!"); return; }
  
  let preco = precoRaw.replace(/[^\d,]/g, '').replace(',', '.');
  let cat = obterCatalogo(); cat.push({ nome, preco });
  localStorage.setItem("app_catalogo_prod", JSON.stringify(cat));
  
  document.getElementById("cad-prod-nome").value = "";
  document.getElementById("cad-prod-preco").value = "";
  renderizarCatalogo();
}

function editarProdutoNoCatalogo(idx, campo, v) {
  let cat = obterCatalogo();
  if(campo === 'preco') v = v.replace(/[^\d,]/g, '').replace(',', '.');
  cat[idx][campo] = v; localStorage.setItem("app_catalogo_prod", JSON.stringify(cat));
}
function removerProdutoDoCatalogo(idx) {
  let cat = obterCatalogo(); cat.splice(idx, 1);
  localStorage.setItem("app_catalogo_prod", JSON.stringify(cat)); renderizarCatalogo();
}

// GERENCIADOR DO CRM DE CLIENTES
function renderizarCRM() {
  const corpo = document.getElementById("lista-crm-corpo"); corpo.innerHTML = "";
  const clientes = obterClientes();
  if(!clientes.length) { corpo.innerHTML = `<tr><td colspan="3" class="center">Nenhum cliente cadastrado ainda.</td></tr>`; return; }

  clientes.forEach((c, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${c.cnpj}</strong></td>
      <td><input type="text" value="${c.nome}" style="width:100%; border:none; background:transparent;" onchange="editarClienteNoCRM(${idx}, this.value)"></td>
      <td class="center"><button class="btn btn-remove" onclick="removerClienteDoCRM(${idx})">✕ Excluir</button></td>
    `;
    corpo.appendChild(tr);
  });
}
function salvarClienteManualmente() {
  const cnpj = document.getElementById("crm-cnpj").value.trim();
  const nome = document.getElementById("crm-nome").value.trim();
  if(!cnpj || !nome) { alert("Preencha todos os campos do CRM!"); return; }
  salvarClienteNoCRM(cnpj, nome);
  document.getElementById("crm-cnpj").value = ""; document.getElementById("crm-nome").value = "";
  renderizarCRM();
}
function editarClienteNoCRM(idx, n) { let c = obterClientes(); c[idx].nome = n; localStorage.setItem("app_clientes_crm", JSON.stringify(c)); }
function removerClienteDoCRM(idx) { let c = obterClientes(); c.splice(idx, 1); localStorage.setItem("app_clientes_crm", JSON.stringify(c)); renderizarCRM(); }

// BACKUP CENTRALIZADO JSON
function exportarBackupCompleto() {
  const dados = {
    historico: JSON.parse(localStorage.getItem("orc_historico")) || [],
    catalogo: obterCatalogo(),
    crm: obterClientes(),
    proximo: localStorage.getItem("proximo_numero_orc") || "ORC-001",
    logo: localStorage.getItem("orc_logo_custom") || ""
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `backup_sistema_vendas_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

function importarBackupCompleto(input) {
  if (input.files && input.files[0]) {
    const leitor = new FileReader();
    leitor.onload = function(e) {
      try {
        const d = JSON.parse(e.target.result);
        if(d.historico) localStorage.setItem("orc_historico", JSON.stringify(d.historico));
        if(d.catalogo) localStorage.setItem("app_catalogo_prod", JSON.stringify(d.catalogo));
        if(d.crm) localStorage.setItem("app_clientes_crm", JSON.stringify(d.crm));
        if(d.proximo) localStorage.setItem("proximo_numero_orc", d.proximo);
        if(d.logo) localStorage.setItem("orc_logo_custom", d.logo);
        
        alert("Todos os bancos de dados foram restaurados com sucesso!");
        mudarAbaGestao('tab-dash'); carregarRascunho();
        const customLogo = localStorage.getItem("orc_logo_custom");
        if(customLogo) document.getElementById("logo-img").src = customLogo;
      } catch(err) { alert("Arquivo JSON inválido."); }
    };
    leitor.readAsText(input.files[0]);
  }
}

// LAYOUTS DE IMPRESSÃO, INTERFACE E WHATSAPP NORMAL
function alternarLayoutImpressao() {
  const card = document.getElementById("orcamento-card");
  const btn = document.getElementById("btn-layout-print");
  if(card.classList.contains("layout-a4")) {
    card.classList.remove("layout-a4"); card.classList.add("layout-cupom");
    btn.innerHTML = "🖨️ Layout: Cupom 80mm";
  } else {
    card.classList.remove("layout-cupom"); card.classList.add("layout-a4");
    btn.innerHTML = "📄 Layout: A4";
  }
}

function enviarWhatsApp() {
  const numOrcamento = document.getElementById("num-orcamento").textContent;
  const nomeCliente = document.getElementById("cliente-nome").value || "Cliente";
  const whatsVendedor = document.getElementById("vendedor-whats").value.replace(/\D/g, '');
  const totalGeral = document.getElementById("total-display").textContent;
  
  const selectPag = document.getElementById("cond-pag");
  const condPagamentoTexto = selectPag.options[selectPag.selectedIndex].text;
  const detalheParcela = document.getElementById("parcelas-detalhe").textContent;

  let itensTexto = "";
  document.querySelectorAll("#tabela-produtos tr").forEach(linha => {
    const divNome = linha.querySelector(".prod-nome");
    const inputQtd = linha.querySelector(".qtd-input");
    if (divNome && divNome.textContent) itensTexto += `*${inputQtd.value}x* ${divNome.textContent}\n`;
  });

  const msg = `Olá, *${nomeCliente}*! Segue o resumo do seu orçamento:\n\n📄 *Código:* ${numOrcamento}\n🛍️ *Itens:*\n${itensTexto}\n💳 *Forma de Pagamento:* ${condPagamentoTexto} (${detalheParcela})\n💰 *VALOR TOTAL FINAL:* ${totalGeral}\n\nQualquer dúvida estou à disposição!`;
  window.open((whatsVendedor ? `https://api.whatsapp.com/send?phone=55${whatsVendedor}&text=` : `https://api.whatsapp.com/send?text=`) + encodeURIComponent(msg), '_blank');
}

function alterarLogo(input) {
  if (input.files && input.files[0]) {
    const leitor = new FileReader();
    leitor.onload = function(e) { document.getElementById("logo-img").src = e.target.result; localStorage.setItem("orc_logo_custom", e.target.result); };
    leitor.readAsDataURL(input.files[0]);
  }
}

function alternarModoEscuro() {
  document.body.classList.toggle("dark-theme");
  document.getElementById("btn-dark-mode").innerHTML = document.body.classList.contains("dark-theme") ? "☀️ Modo Claro" : "🌙 Modo Escuro";
}

function limparOrcamento() {
  if (confirm("Redefinir orçamento atual?")) {
    localStorage.removeItem("orc_rascunho_atual");
    document.getElementById("cliente-cnpj").value = ""; document.getElementById("cliente-nome").value = "";
    document.getElementById("vendedor-whats").value = ""; document.getElementById("responsavel-nome").value = "";
    document.getElementById("valor-desconto").value = "0"; document.getElementById("tipo-desconto").value = "nenhum";
    document.getElementById("cond-pag").selectedIndex = 0; document.getElementById("prev-entrega").value = "Imediato";
    if(document.getElementById("link-pagamento-input")) document.getElementById("link-pagamento-input").value = "";
    document.getElementById("num-orcamento").textContent = localStorage.getItem("proximo_numero_orc") || "ORC-001";
    document.getElementById("tabela-produtos").innerHTML = ""; adicionarNovaLinha();
  }
}

window.onload = function() {
  document.getElementById("data-orcamento").value = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const customLogo = localStorage.getItem("orc_logo_custom"); if(customLogo) document.getElementById("logo-img").src = customLogo;
  obterCatalogo(); obterClientes(); carregarRascunho();
};

// ==========================================================================
// ASSISTENTE DE IA PARA WHATSAPP (CORRIGIDO)
// ==========================================================================

// Abre a janela do gerador de IA
function abrirGeradorIA() {
  document.getElementById("modal-ia").style.display = "block";
}

// Fecha a janela do gerador de IA
function fecharGeradorIA() {
  document.getElementById("modal-ia").style.display = "none";
}

async function gerarTextoComIA() {
  const objetivo = document.getElementById("ia-objetivo").value;
  const tom = document.getElementById("ia-tom").value;
  const campoResultado = document.getElementById("ia-resultado");

  if (!objetivo) {
    alert("Por favor, digite o objetivo da mensagem!");
    return;
  }

  campoResultado.value = "🤖 A IA está a processar a melhor estratégia... Por favor, aguarde.";

  // ⚠️ Substitua pelo seu token real gerado no Google AI Studio
  const GEMINI_API_KEY = "AQ.Ab8RN6LTe6pa-yV55QzjQLi5PY8Kwj_DLYBpfQE-n15ThyVJgw"; 
  
  // URL corrigida para compatibilidade total com chaves do AI Studio
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Erro detalhado da API do Gemini:", data.error);
      campoResultado.value = `Erro da API: ${data.error.message}\n\nVerifique se o seu token foi colado corretamente e está ativo no painel do Google AI Studio.`;
      return;
    }

    if (data.candidates && data.candidates[0].content.parts[0].text) {
      campoResultado.value = data.candidates[0].content.parts[0].text;
    } else {
      campoResultado.value = "Erro ao processar a resposta da IA. Pressione F12 para ver os detalhes no console do desenvolvedor.";
    }

  } catch (error) {
    console.error("Erro ao conectar com a API:", error);
    campoResultado.value = "Erro de conexão com a API do Gemini. Verifique a sua internet.";
  }
}
