// ==========================================================================
// 1. BANCO DE DADOS DE PRODUTOS (CATÁLOGO RÁPIDO)
// ==========================================================================
const CATALOGO_PRODUTOS = [
  { nome: "SSD Kingston NV2 1TB NVMe M.2", preco: "389.90" },
  { nome: "SSD Kingston NV2 500GB NVMe M.2", preco: "249.00" },
  { nome: "Memória RAM Kingston Fury Beast 8GB DDR4 3200MHz", preco: "179.00" },
  { nome: "Memória RAM Kingston Fury Beast 16GB DDR4 3200MHz", preco: "320.00" },
  { nome: "Processador AMD Ryzen 5 5600G 3.9GHz", preco: "890.00" },
  { nome: "Processador AMD Ryzen 7 5700X 3.4GHz", preco: "1250.00" },
  { nome: "Placa de Vídeo NVIDIA RTX 3060 12GB", preco: "1999.00" },
  { nome: "Placa de Vídeo NVIDIA RTX 4060 8GB", preco: "2250.00" },
  { nome: "Fonte XPG Core Reactor 850W 80 Plus Gold Modular", preco: "649.00" },
  { nome: "Gabinete Gamer Gamdias Talos E3 Mesh", preco: "289.00" }
];

const OPCOES_PAGAMENTO = {
  "vista":    { acrescimo: 0.00, texto: "Pagamento único sem acréscimo", parcelas: 1 },
  "1x_juros":   { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 1 },
  "2x_juros":   { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 2 },
  "3x_juros":   { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 3 },
  "4x_juros":   { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 4 },
  "5x_juros":   { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 5 },
  "6x_juros": { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 6 },
  "7x_juros": { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 7 },
  "8x_juros": { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 8 },
  "9x_juros": { acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 9 },
  "10x_juros":{ acrescimo: 0.00, texto: "c/ acréscimo", parcelas: 10 },
  "boleto":   { acrescimo: 0.00, texto: "Pagamento único sem acréscimo", parcelas: 1 },
  "outro":    { acrescimo: 0.00, texto: "", parcelas: 1 }
};

let divAtivaAutocompletar = null;

// ==========================================================================
// 2. FUNÇÃO PRINCIPAL DE CÁLCULO E REGRAS DE NEGÓCIO
// ==========================================================================
function calcular() {
  const linhas = document.querySelectorAll("#tabela-produtos tr");
  let subtotalGeral = 0;

  linhas.forEach(linha => {
    const inputQtd = linha.querySelector("input[type='number']");
    const inputValor = linha.querySelector(".valor-unitario"); 
    const inputObs = linha.querySelector(".prod-obs");
    const celulaSubtotal = linha.cells.length > 4 ? linha.cells[4] : null;

    if (inputObs) {
      const textoObs = inputObs.value.toLowerCase();
      if (textoObs.includes("sob encomenda") || textoObs.includes("encomenda")) {
        linha.classList.add("linha-encomenda");
      } else {
        linha.classList.remove("linha-encomenda");
      }
    }

    if (inputQtd && inputValor && celulaSubtotal) {
      const qtd = parseFloat(inputQtd.value) || 0;
      const valorTexto = inputValor.value.replace(/\D/g, '');
      const valorUnitario = (parseFloat(valorTexto) / 100) || 0;

      const subtotalItem = qtd * valorUnitario;
      subtotalGeral += subtotalItem;

      celulaSubtotal.textContent = subtotalItem.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL'
      });
    }
  });

  document.getElementById("subtotal-display").textContent = subtotalGeral.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  });

  // TRAVA DE SEGURANÇA DE DESCONTO (MÁX 20%)
  const tipoDesconto = document.getElementById("tipo-desconto").value;
  const inputValorDesconto = document.getElementById("valor-desconto");
  let valorDescontoDigitado = parseFloat(inputValorDesconto.value) || 0;
  let totalDesconto = 0;

  if (tipoDesconto === "porcento") {
    if (valorDescontoDigitado > 20) {
      alert("Aviso: O limite máximo de desconto permitido é de 20%!");
      valorDescontoDigitado = 20;
      inputValorDesconto.value = 20;
    }
    totalDesconto = subtotalGeral * (valorDescontoDigitado / 100);
  } else if (tipoDesconto === "reais") {
    const limiteEmReais = subtotalGeral * 0.20;
    if (valorDescontoDigitado > limiteEmReais) {
      alert(`Aviso: O limite máximo de desconto em reais permitido para este valor é de ${limiteEmReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (20%)!`);
      valorDescontoDigitado = limiteEmReais;
      inputValorDesconto.value = limiteEmReais.toFixed(2);
    }
    totalDesconto = valorDescontoDigitado;
  }

  const rowDesconto = document.getElementById("row-desconto");
  if (totalDesconto > 0) {
    rowDesconto.style.display = "";
    document.getElementById("desconto-display").textContent = "– " + totalDesconto.toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL'
    });
  } else {
    rowDesconto.style.display = "none";
  }

  let totalGeral = subtotalGeral - totalDesconto;
  const chavePagamento = document.getElementById("cond-pag").value;
  const areaParcelas = document.getElementById("parcelas-detalhe");
  
  if (OPCOES_PAGAMENTO[chavePagamento]) {
    const config = OPCOES_PAGAMENTO[chavePagamento];
    if (config.acrescimo > 0) {
      totalGeral = totalGeral * (1 + config.acrescimo);
    }

    if (chavePagamento === "vista" || chavePagamento === "boleto") {
      areaParcelas.textContent = config.texto;
    } else if (chavePagamento === "outro") {
      areaParcelas.textContent = "";
    } else {
      const valorParcela = totalGeral / config.parcelas;
      areaParcelas.textContent = `${config.parcelas}x de ${valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ${config.texto}`;
    }
  }

  document.getElementById("total-display").textContent = totalGeral.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  });

  salvarEstadoAtualNoLocalStorage();
}

// ==========================================================================
// 3. MÁSCARA DINÂMICA DE DINHEIRO (REAL TIME)
// ==========================================================================
function aplicarMascaraDinheiro(input) {
  let valor = input.value.replace(/\D/g, '');
  if(valor === "") valor = "0";
  let valorFloat = parseFloat(valor) / 100;
  input.value = valorFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ==========================================================================
// 4. SISTEMA DE AUTOCOMPLETAR (SUGESTÕES)
// ==========================================================================
function gerenciarAutocompletar(divEditavel) {
  divAtivaAutocompletar = divEditavel;
  const texto = divEditavel.textContent.trim().toLowerCase();
  const listaSugestoes = document.getElementById("autocomplete-list");
  
  if (!texto) {
    listaSugestoes.style.display = "none";
    return;
  }

  const filtrados = CATALOGO_PRODUTOS.filter(p => p.nome.toLowerCase().includes(texto));

  if (filtrados.length === 0) {
    listaSugestoes.style.display = "none";
    return;
  }

  listaSugestoes.innerHTML = "";
  filtrados.forEach(produto => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.innerHTML = `<span>${produto.nome}</span> <strong>R$ ${parseFloat(produto.preco).toLocaleString('pt-BR', {minimumFractionDigits:2})}</strong>`;
    
    item.addEventListener("click", () => {
      divEditavel.textContent = produto.nome;
      
      const linha = divEditavel.closest("tr");
      const inputPreco = linha.querySelector(".valor-unitario");
      
      let valorLimpo = produto.preco.replace('.', '');
      let valorFloat = parseFloat(valorLimpo);
      inputPreco.value = valorFloat.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      
      listaSugestoes.style.display = "none";
      calcular();
    });
    listaSugestoes.appendChild(item);
  });

  const retangulo = divEditavel.getBoundingClientRect();
  listaSugestoes.style.left = `${retangulo.left + window.scrollX}px`;
  listaSugestoes.style.top = `${retangulo.bottom + window.scrollY}px`;
  listaSugestoes.style.width = `${retangulo.width}px`;
  listaSugestoes.style.display = "block";
}

document.addEventListener("click", (e) => {
  if (e.target !== divAtivaAutocompletar && !e.target.closest("#autocomplete-list")) {
    document.getElementById("autocomplete-list").style.display = "none";
  }
});

// ==========================================================================
// 5. GERENCIAMENTO DE LINHAS DINÂMICAS
// ==========================================================================
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
        <button class="btn-order" onclick="moverParaCima(this)">▲</button>
        <button class="btn-order" onclick="moverParaBaixo(this)">▼</button>
        <button class="btn-remove">✕</button>
      </div>
    </td>
  `;

  const divNome = novaLinha.querySelector(".prod-nome");
  divNome.addEventListener("input", () => {
    gerenciarAutocompletar(divNome);
    calcular();
  });

  const inputPreco = novaLinha.querySelector(".valor-unitario");
  inputPreco.addEventListener("input", () => {
    aplicarMascaraDinheiro(inputPreco);
    calcular();
  });

  novaLinha.querySelector(".qtd-input").addEventListener("input", calcular);
  novaLinha.querySelector(".prod-obs").addEventListener("input", calcular);

  novaLinha.querySelector(".btn-remove").addEventListener("click", function() {
    if(document.querySelectorAll("#tabela-produtos tr").length > 1) {
      novaLinha.remove();
      calcular();
    } else {
      alert("O orçamento deve conter pelo menos 1 item.");
    }
  });

  tbody.appendChild(novaLinha);
  calcular();
}

function moverParaCima(botao) {
  const linhaAtual = botao.closest("tr");
  const linhaAnterior = linhaAtual.previousElementSibling;
  if (linhaAnterior) {
    linhaAtual.parentNode.insertBefore(linhaAtual, linhaAnterior);
    calcular();
  }
}

function moverParaBaixo(botao) {
  const linhaAtual = botao.closest("tr");
  const linhaSucessora = linhaAtual.nextElementSibling;
  if (linhaSucessora) {
    linhaAtual.parentNode.insertBefore(linhaSucessora, linhaAtual);
    calcular();
  }
}

// ==========================================================================
// 6. HISTÓRICO DE ORÇAMENTOS & LOCAL STORAGE
// ==========================================================================
function salvarEstadoAtualNoLocalStorage() {
  const itens = [];
  document.querySelectorAll("#tabela-produtos tr").forEach(linha => {
    const nome = linha.querySelector(".prod-nome").textContent;
    const qtd = linha.querySelector(".qtd-input").value;
    const valor = linha.querySelector(".valor-unitario").value;
    const obs = linha.querySelector(".prod-obs").value;
    if(nome || valor !== "0,00") {
      itens.push({ nome, qtd, valor, obs });
    }
  });

  const rascunho = {
    numero: document.getElementById("num-orcamento").textContent,
    cnpj: document.getElementById("cliente-cnpj").value,
    nome: document.getElementById("cliente-nome").value,
    whats: document.getElementById("cliente-whats").value,
    vendedor: document.getElementById("responsavel-nome").value,
    tipoDesconto: document.getElementById("tipo-desconto").value,
    valorDesconto: document.getElementById("valor-desconto").value,
    condPag: document.getElementById("cond-pag").value,
    prevEntrega: document.getElementById("prev-entrega").value,
    obsGerais: document.getElementById("obs-gerais").value,
    itens: itens
  };
  localStorage.setItem("orc_rascunho_atual", JSON.stringify(rascunho));
}

function carregarRascunho() {
  const dados = localStorage.getItem("orc_rascunho_atual");
  if (!dados) {
    adicionarNovaLinha();
    return;
  }
  const rascunho = JSON.parse(dados);
  
  document.getElementById("num-orcamento").textContent = rascunho.numero || "ORC-001";
  document.getElementById("cliente-cnpj").value = rascunho.cnpj || "";
  document.getElementById("cliente-nome").value = rascunho.nome || "";
  document.getElementById("cliente-whats").value = rascunho.whats || "";
  document.getElementById("responsavel-nome").value = rascunho.vendedor || "";
  document.getElementById("tipo-desconto").value = rascunho.tipoDesconto || "nenhum";
  document.getElementById("valor-desconto").value = rascunho.valorDesconto || "0";
  document.getElementById("cond-pag").value = rascunho.condPag || "vista";
  document.getElementById("prev-entrega").value = rascunho.prevEntrega || "Imediato";
  document.getElementById("obs-gerais").value = rascunho.obsGerais || "";

  const tbody = document.getElementById("tabela-produtos");
  tbody.innerHTML = "";

  if(rascunho.itens && rascunho.itens.length > 0) {
    rascunho.itens.forEach(i => {
      adicionarNovaLinha(i.nome, i.qtd, i.valor, i.obs);
    });
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

  // Verifica se já está no histórico para atualizar ou inserir novo
  const indexExistente = historico.findIndex(o => o.numero === numAtual);
  const dadosOrcamento = {
    numero: numAtual,
    cliente: cliente,
    data: dataHoje,
    total: total,
    raw: localStorage.getItem("orc_rascunho_atual")
  };

  if(indexExistente >= 0) {
    historico[indexExistente] = dadosOrcamento;
  } else {
    historico.push(dadosOrcamento);
  }

  localStorage.setItem("orc_historico", JSON.stringify(historico));

  // Incrementa numeração automática para o próximo orçamento
  if(indexExistente === -1) {
    let proximoNum = parseInt(numAtual.replace("ORC-", "")) + 1;
    let stringNum = "ORC-" + String(proximoNum).padStart(3, '0');
    localStorage.setItem("proximo_numero_orc", stringNum);
  }

  window.print();
}

// CONTRÔLES DA MODAL DE HISTÓRICO
function abrirModalHistorico() {
  document.getElementById("modal-historico").style.display = "block";
  const historico = JSON.parse(localStorage.getItem("orc_historico")) || [];
  const corpo = document.getElementById("lista-historico-corpo");
  corpo.innerHTML = "";

  if(historico.length === 0) {
    corpo.innerHTML = `<tr><td colspan="5" class="center">Nenhum orçamento arquivado ainda.</td></tr>`;
    return;
  }

  historico.forEach((orc, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${orc.numero}</strong></td>
      <td>${orc.cliente}</td>
      <td>${orc.data}</td>
      <td style="color:#2b6cb0; font-weight:bold;">${orc.total}</td>
      <td>
        <button class="btn btn-blue" style="padding:4px 8px; font-size:11px;" onclick="restaurarOrcamentoDoHistorico(${index})">📂 Abrir</button>
        <button class="btn btn-remove" style="padding:4px 8px; font-size:11px;" onclick="deletarDoHistorico(${index})">✕</button>
      </td>
    `;
    corpo.appendChild(tr);
  });
}

function fecharModalHistorico() {
  document.getElementById("modal-historico").style.display = "none";
}

function restaurarOrcamentoDoHistorico(index) {
  const historico = JSON.parse(localStorage.getItem("orc_historico"));
  const escolhido = historico[index];
  localStorage.setItem("orc_rascunho_atual", escolhido.raw);
  carregarRascunho();
  fecharModalHistorico();
}

function deletarDoHistorico(index) {
  if(confirm("Deseja eliminar este registro do histórico?")) {
    let historico = JSON.parse(localStorage.getItem("orc_historico"));
    historico.splice(index, 1);
    localStorage.setItem("orc_historico", JSON.stringify(historico));
    abrirModalHistorico();
  }
}

// ==========================================================================
// 7. UPLOAD DE LOGO DINÂMICO (SALVA EM BASE64)
// ==========================================================================
function alterarLogo(input) {
  if (input.files && input.files[0]) {
    const leitor = new FileReader();
    leitor.onload = function(e) {
      document.getElementById("logo-img").src = e.target.result;
      localStorage.setItem("orc_logo_custom", e.target.result);
    };
    leitor.readAsDataURL(input.files[0]);
  }
}

function carregarLogoSalvo() {
  const logoSalvo = localStorage.getItem("orc_logo_custom");
  if(logoSalvo) {
    document.getElementById("logo-img").src = logoSalvo;
  }
}

// 1. BUSCA CNPJ CORRIGIDA (Remove formatação ao digitar ou colar)
function buscarCNPJ() {
  const campoCnpj = document.getElementById("cliente-cnpj");
  // Remove tudo o que não for número antes de validar o tamanho
  const cnpj = campoCnpj.value.replace(/\D/g, '');
  const campoNome = document.getElementById("cliente-nome");
  const spinner = document.getElementById("cnpj-spinner");

  if (cnpj.length === 14) {
    spinner.style.display = "block";
    campoCnpj.classList.add("campo-buscando");
    campoNome.value = "Buscando dados corporativos...";
    
    fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        campoNome.value = data.razao_social || data.nome_fantasia || "";
        calcular();
      })
      .catch(() => {
        alert("CNPJ não encontrado automaticamente. Preencha manualmente.");
        campoNome.value = "";
      })
      .finally(() => {
        spinner.style.display = "none";
        campoCnpj.classList.remove("campo-buscando");
      });
  }
}

// 2. SALVAR ESTADO (Atualizado para o novo ID do WhatsApp)
function salvarEstadoAtualNoLocalStorage() {
  const itens = [];
  document.querySelectorAll("#tabela-produtos tr").forEach(linha => {
    const nome = linha.querySelector(".prod-nome").textContent;
    const qtd = linha.querySelector(".qtd-input").value;
    const valor = linha.querySelector(".valor-unitario").value;
    const obs = linha.querySelector(".prod-obs").value;
    if(nome || valor !== "0,00") {
      itens.push({ nome, qtd, valor, obs });
    }
  });

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
    itens: itens
  };
  localStorage.setItem("orc_rascunho_atual", JSON.stringify(rascunho));
}

// 3. CARREGAR RASCUNHO (Atualizado para o novo ID do WhatsApp)
function carregarRascunho() {
  const dados = localStorage.getItem("orc_rascunho_atual");
  if (!dados) {
    adicionarNovaLinha();
    return;
  }
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

  const tbody = document.getElementById("tabela-produtos");
  tbody.innerHTML = "";

  if(rascunho.itens && rascunho.itens.length > 0) {
    rascunho.itens.forEach(i => {
      adicionarNovaLinha(i.nome, i.qtd, i.valor, i.obs);
    });
  } else {
    adicionarNovaLinha();
  }
}

// 4. WHATSAPP (Agora focado no link de partilha do vendedor)
function enviarWhatsApp() {
  const numOrcamento = document.getElementById("num-orcamento").textContent;
  const nomeCliente = document.getElementById("cliente-nome").value || "Cliente";
  const whatsVendedor = document.getElementById("vendedor-whats").value.replace(/\D/g, '');
  const totalGeral = document.getElementById("total-display").textContent;
  
  const selectPag = document.getElementById("cond-pag");
  const condPagamentoTexto = selectPag.options[selectPag.selectedIndex].text;
  const detalheParcela = document.getElementById("parcelas-detalhe").textContent;

  let itensTexto = "";
  document.querySelectorAll("#tabela-produtos tr").forEach((linha) => {
    const divNome = linha.querySelector(".prod-nome");
    const inputQtd = linha.querySelector(".qtd-input");
    if (divNome && divNome.textContent) {
      itensTexto += `*${inputQtd.value}x* ${divNome.textContent}\n`;
    }
  });

  const textoMensagem = 
    `Olá, *${nomeCliente}*! Segue o resumo do seu orçamento:\n\n` +
    `📄 *Código:* ${numOrcamento}\n` +
    `🛍️ *Itens:*\n${itensTexto}\n` +
    `💳 *Forma de Pagamento:* ${condPagamentoTexto} (${detalheParcela})\n` +
    `💰 *VALOR TOTAL FINAL:* ${totalGeral}\n\n` +
    `Qualquer dúvida estou à disposição!`;

  // Se o vendedor colocou o próprio número, abre o chat dele mesmo para ele reencaminhar.
  // Se não colocou, gera o link global de partilha do texto.
  const linkBase = whatsVendedor ? `https://api.whatsapp.com/send?phone=55${whatsVendedor}&text=` : `https://api.whatsapp.com/send?text=`;
  window.open(linkBase + encodeURIComponent(textoMensagem), '_blank');
}

function enviarWhatsApp() {
  const numOrcamento = document.getElementById("num-orcamento").textContent;
  const nomeCliente = document.getElementById("cliente-nome").value || "Cliente";
  const whatsCliente = document.getElementById("cliente-whats").value.replace(/\D/g, '');
  const totalGeral = document.getElementById("total-display").textContent;
  
  const selectPag = document.getElementById("cond-pag");
  const condPagamentoTexto = selectPag.options[selectPag.selectedIndex].text;
  const detalheParcela = document.getElementById("parcelas-detalhe").textContent;

  let itensTexto = "";
  document.querySelectorAll("#tabela-produtos tr").forEach((linha) => {
    const divNome = linha.querySelector(".prod-nome");
    const inputQtd = linha.querySelector(".qtd-input");
    if (divNome && divNome.textContent) {
      itensTexto += `*${inputQtd.value}x* ${divNome.textContent}\n`;
    }
  });

  const textoMensagem = 
    `Olá, *${nomeCliente}*! Segue o resumo do seu orçamento:\n\n` +
    `📄 *Código:* ${numOrcamento}\n` +
    `🛍️ *Itens:*\n${itensTexto}\n` +
    `💳 *Forma de Pagamento:* ${condPagamentoTexto} (${detalheParcela})\n` +
    `💰 *VALOR TOTAL FINAL:* ${totalGeral}\n\n` +
    `O documento PDF detalhado já está disponível. Como prefere receber?`;

  const linkBase = whatsCliente ? `https://api.whatsapp.com/send?phone=55${whatsCliente}&text=` : `https://api.whatsapp.com/send?text=`;
  window.open(linkBase + encodeURIComponent(textoMensagem), '_blank');
}

function carregarDataAtual() {
  const campoData = document.getElementById("data-orcamento");
  const hoje = new Date();
  campoData.value = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function alternarModoEscuro() {
  document.body.classList.toggle("dark-theme");
  const btn = document.getElementById("btn-dark-mode");
  btn.innerHTML = document.body.classList.contains("dark-theme") ? "☀️ Modo Claro" : "🌙 Modo Escuro";
}

function limparOrcamento() {
  if (confirm("Deseja redefinir os campos da tela atual?")) {
    localStorage.removeItem("orc_rascunho_atual");
    
    document.getElementById("cliente-cnpj").value = "";
    document.getElementById("cliente-nome").value = "";
    document.getElementById("cliente-whats").value = "";
    document.getElementById("responsavel-nome").value = "";
    document.getElementById("valor-desconto").value = "0";
    document.getElementById("tipo-desconto").value = "nenhum";
    document.getElementById("cond-pag").selectedIndex = 0;
    document.getElementById("prev-entrega").value = "Imediato";
    
    let proxNum = localStorage.getItem("proximo_numero_orc") || "ORC-001";
    document.getElementById("num-orcamento").textContent = proxNum;

    document.getElementById("tabela-produtos").innerHTML = "";
    adicionarNovaLinha();
  }
}

// INICIALIZAÇÃO DO SISTEMA
window.onload = function() {
  carregarDataAtual();
  carregarLogoSalvo();
  carregarRascunho();
};