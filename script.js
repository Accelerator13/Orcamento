// ==========================================================================
// 1. FUNÇÃO PRINCIPAL DE CÁLCULO, JUROS E DESTAQUE DE ENCOMENDA
// ==========================================================================
function calcular() {
  const linhas = document.querySelectorAll("#tabela-produtos tr");
  let subtotalGeral = 0;

  linhas.forEach(linha => {
    const inputQtd = linha.querySelector("input[type='number']");
    const inputsTexto = linha.querySelectorAll("input[type='text']");
    const inputValor = inputsTexto[1]; 
    const inputObs = linha.querySelector(".prod-obs");
    const celulaSubtotal = linha.cells.length > 4 ? linha.cells[4] : null;

    // DESTAQUE AUTOMÁTICO DE ITENS "SOB ENCOMENDA"
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
      const valorTexto = inputValor.value.replace(/\./g, '').replace(',', '.');
      const valorUnitario = parseFloat(valorTexto) || 0;

      const subtotalItem = qtd * valorUnitario;
      subtotalGeral += subtotalItem;

      celulaSubtotal.textContent = subtotalItem.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
  });

  document.getElementById("subtotal-display").textContent = subtotalGeral.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
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
      style: 'currency',
      currency: 'BRL'
    });
  } else {
    rowDesconto.style.display = "none";
  }

  let totalGeral = subtotalGeral - totalDesconto;

  // CÁLCULO DE PARCELAS E ACRÉSCIMOS DO CARTÃO
  const condPagamento = document.getElementById("cond-pag").value;
  const areaParcelas = document.getElementById("parcelas-detalhe");
  let textoParcela = "";

  switch (condPagamento) {
    case "À vista (Dinheiro / Pix)":
    case "Boleto bancário":
      textoParcela = "Pagamento único sem acréscimo";
      break;
    case "2x sem juros no cartão":
      textoParcela = `2x de ${(totalGeral / 2).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem juros`;
      break;
    case "3x sem juros no cartão":
      textoParcela = `3x de ${(totalGeral / 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem juros`;
      break;
    case "6x no cartão (5% acréscimo)":
      totalGeral = totalGeral * 1.05; 
      textoParcela = `6x de ${(totalGeral / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} c/ acréscimo`;
      break;
    case "10x no cartão (8% acréscimo)":
      totalGeral = totalGeral * 1.08; 
      textoParcela = `10x de ${(totalGeral / 10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} c/ acréscimo`;
      break;
    default:
      textoParcela = "";
  }
  areaParcelas.textContent = textoParcela;

  document.getElementById("total-display").textContent = totalGeral.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// ==========================================================================
// 2. CONSULTA AUTOMÁTICA DE CNPJ 
// ==========================================================================
function buscarCNPJ() {
  const campoCnpj = document.getElementById("cliente-cnpj");
  const cnpj = campoCnpj.value.replace(/\D/g, '');
  const campoNome = document.getElementById("cliente-nome");
  const spinner = document.getElementById("cnpj-spinner");

  if (cnpj.length === 14) {
    spinner.style.display = "block";
    campoCnpj.classList.add("campo-buscando");
    campoNome.value = "Buscando dados da empresa...";
    
    fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      .then(response => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(data => {
        campoNome.value = data.razao_social || data.nome_fantasia || "";
      })
      .catch(() => {
        alert("Não foi possível localizar o CNPJ automaticamente. Por favor, digite manualmente.");
        campoNome.value = "";
      })
      .finally(() => {
        spinner.style.display = "none";
        campoCnpj.classList.remove("campo-buscando");
      });
  }
}

// ==========================================================================
// 3. ENVIAR RESUMO FORMATADO PARA WHATSAPP
// ==========================================================================
function enviarWhatsApp() {
  const numOrcamento = document.getElementById("num-orcamento").textContent;
  const nomeCliente = document.getElementById("cliente-nome").value || "Cliente";
  const totalGeral = document.getElementById("total-display").textContent;
  const condPagamento = document.getElementById("cond-pag").value;
  const detalheParcela = document.getElementById("parcelas-detalhe").textContent;

  const linhas = document.querySelectorAll("#tabela-produtos tr");
  let itensTexto = "";
  
  linhas.forEach((linha) => {
    const inputNome = WebL = linha.querySelector(".prod-nome");
    const inputQtd = linha.querySelector("input[type='number']");
    if (inputNome && inputNome.value) {
      itensTexto += `*${inputQtd.value}x* ${inputNome.value}\n`;
    }
  });

  const textoMensagem = 
    `Olá, *${nomeCliente}*! Segue o resumo do seu orçamento:\n\n` +
    `📄 *Código:* ${numOrcamento}\n` +
    `🛍️ *Itens:*\n${itensTexto}\n` +
    `💳 *Forma de Pagamento:* ${condPagamento} (${detalheParcela})\n` +
    `💰 *VALOR TOTAL FINAL:* ${totalGeral}\n\n` +
    `O PDF completo com os termos de faturamento e CNPJ já está pronto. Como deseja recebê-lo?`;

  const mensagem = encodeURIComponent(textoMensagem);
  window.open(`https://api.whatsapp.com/send?text=${mensagem}`, '_blank');
}

// ==========================================================================
// 4. DATA AUTOMÁTICA
// ==========================================================================
function carregarDataAtual() {
  const campoData = document.getElementById("data-orcamento");
  const hoje = new Date();
  const opcoes = { day: 'numeric', month: 'long', year: 'numeric' };
  campoData.value = hoje.toLocaleDateString('pt-BR', opcoes);
}

// ==========================================================================
// 5. MODIFICAR TEMA (DARK MODE)
// ==========================================================================
function alternarModoEscuro() {
  document.body.classList.toggle("dark-theme");
  const btn = document.getElementById("btn-dark-mode");
  if (document.body.classList.contains("dark-theme")) {
    btn.innerHTML = "☀️ Modo Claro";
  } else {
    btn.innerHTML = "🌙 Modo Escuro";
  }
}

// ==========================================================================
// 6. BOTÃO LIMPAR ORÇAMENTO COM CONFIRMAÇÃO E RESET DE CABEÇALHO
// ==========================================================================
function limparOrcamento() {
  if (confirm("Tem certeza que deseja apagar todos os dados digitados neste orçamento?")) {
    document.getElementById("cliente-cnpj").value = "";
    document.getElementById("cliente-nome").value = "";
    document.getElementById("responsavel-nome").value = "";
    document.getElementById("valor-desconto").value = "0";
    document.getElementById("cond-pag").selectedIndex = 0;
    document.getElementById("prev-entrega").value = "Imediato";
    
    // Restaura o cabeçalho padrão da loja caso tenha sido editado
    document.getElementById("header-endereco").value = "AV. João Pinheiro, 796 - Centro";
    document.getElementById("header-telefone").value = "Uberlândia / Uberaba ☎ (34) 3228-0115";
    document.getElementById("header-site").value = "www.onlineshopping.com.br";
    
    // Deixa uma linha limpa padrão na tabela
    const tbody = document.getElementById("tabela-produtos");
    tbody.innerHTML = `
      <tr>
        <td><input type="text" class="prod-nome" placeholder="Descrição do produto" value="" /></td>
        <td class="center"><input type="number" class="center" value="1" style="width: 50px;" oninput="calcular()" /></td>
        <td class="right"><input type="text" class="right" value="0.00" style="width: 80px;" oninput="calcular()" /></td>
        <td><input type="text" class="prod-obs" placeholder="Ex: sob encomenda..." value="" oninput="calcular()" /></td>
        <td class="right" style="color: #2b6cb0; font-weight: 600;">R$ 0,00</td>
        <td class="center no-print">
          <div class="action-buttons">
            <button class="btn-order" onclick="moverParaCima(this)">▲</button>
            <button class="btn-order" onclick="moverParaBaixo(this)">▼</button>
            <button class="btn-remove">✕</button>
          </div>
        </td>
      </tr>
    `;
    
    tbody.querySelector(".btn-remove").addEventListener("click", function() {
      if(document.querySelectorAll("#tabela-produtos tr").length > 1) {
        tbody.querySelector("tr").remove();
        calcular();
      }
    });

    calcular();
  }
}

// ==========================================================================
// 7. CONTROLES DE MOVIMENTAÇÃO E DE REMOÇÃO DE LINHAS
// ==========================================================================
function moverParaCima(botao) {
  const linhaAtual = botao.closest("tr");
  const linhaAnterior = linhaAtual.previousElementSibling;
  if (linhaAnterior) {
    linhaAtual.parentNode.insertBefore(linhaAtual, linhaAnterior);
  }
}

function moverParaBaixo(botao) {
  const linhaAtual = botao.closest("tr");
  const linhaSucessora = linhaAtual.nextElementSibling;
  if (linhaSucessora) {
    linhaAtual.parentNode.insertBefore(linhaSucessora, linhaAtual);
  }
}

document.getElementById("btn-adicionar-produto").addEventListener("click", () => {
  const tbody = document.getElementById("tabela-produtos");
  const novaLinha = document.createElement("tr");
  novaLinha.innerHTML = `
    <td><input type="text" class="prod-nome" placeholder="Descrição do produto" value="" /></td>
    <td class="center"><input type="number" class="center" value="1" style="width: 50px;" oninput="calcular()" /></td>
    <td class="right"><input type="text" class="right" value="0.00" style="width: 80px;" oninput="calcular()" /></td>
    <td><input type="text" class="prod-obs" placeholder="Ex: sob encomenda..." value="" oninput="calcular()" /></td>
    <td class="right" style="color: #2b6cb0; font-weight: 600;">R$ 0,00</td>
    <td class="center no-print">
      <div class="action-buttons">
        <button class="btn-order" onclick="moverParaCima(this)">▲</button>
        <button class="btn-order" onclick="moverParaBaixo(this)">▼</button>
        <button class="btn-remove">✕</button>
      </div>
    </td>
  `;

  novaLinha.querySelector(".btn-remove").addEventListener("click", function() {
    novaLinha.remove();
    calcular();
  });

  tbody.appendChild(novaLinha);
  calcular();
});

document.querySelectorAll(".btn-remove").forEach(botao => {
  botao.addEventListener("click", function() {
    const linha = botao.closest("tr");
    linha.remove();
    calcular();
  });
});

window.onload = function() {
  calcular();
  carregarDataAtual();
};