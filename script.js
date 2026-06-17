// ==========================================================================
// 1. FUNÇÃO PRINCIPAL DE CÁLCULO
// ==========================================================================
function calcular() {
  // Pega todas as linhas de produtos dentro do tbody
  const linhas = document.querySelectorAll("#tabela-produtos tr");
  let subtotalGeral = 0;

  linhas.forEach(linha => {
    // Busca os inputs de QTD e VALOR UNIT. dentro da linha atual
    const inputQtd = linha.querySelector("input[type='number']");
    // Seleciona o segundo input de texto (que é o valor unitário)
    const inputsTexto = linha.querySelectorAll("input[type='text']");
    const inputValor = inputsTexto[1]; // O segundo input de texto é o valor
    
    // Pega a célula onde vamos exibir o subtotal do item (5ª coluna)
    const celulaSubtotal = linha.cells[4];

    if (inputQtd && inputValor) {
      // Pega os valores, garante que são números e troca a vírgula por ponto
      const qtd = parseFloat(inputQtd.value) || 0;
      const valorTexto = inputValor.value.replace(/\./g, '').replace(',', '.');
      const valorUnitario = parseFloat(valorTexto) || 0;

      // Calcula o total deste item específico
      const subtotalItem = qtd * valorUnitario;
      subtotalGeral += subtotalItem;

      // Atualiza o texto do subtotal do item na tela formatado em R$
      celulaSubtotal.textContent = subtotalItem.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
  });

  // Atualiza o display do Subtotal Geral no rodapé
  document.getElementById("subtotal-display").textContent = subtotalGeral.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  // ==========================================================================
  // 2. CÁLCULO DO DESCONTO E TOTAL GERAL
  // ==========================================================================
  const tipoDesconto = document.getElementById("tipo-desconto").value;
  const inputValorDesconto = document.getElementById("valor-desconto");
  const valorDescontoDigitado = parseFloat(inputValorDesconto.value) || 0;
  
  let totalDesconto = 0;

  if (tipoDesconto === "reais") {
    totalDesconto = valorDescontoDigitado;
  } else if (tipoDesconto === "porcento") {
    totalDesconto = subtotalGeral * (valorDescontoDigitado / 100);
  }

  // Garante que o desconto não seja maior que o próprio subtotal
  if (totalDesconto > subtotalGeral) {
    totalDesconto = subtotalGeral;
  }

  // Linha do desconto no rodapé (mostra ou esconde)
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

  // Calcula e atualiza o Total Geral final
  const totalGeral = subtotalGeral - totalDesconto;
  document.getElementById("total-display").textContent = totalGeral.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

// ==========================================================================
// 3. EVENTO PARA ADICIONAR NOVOS PRODUTOS
// ==========================================================================
document.getElementById("btn-adicionar-produto").addEventListener("click", () => {
  const tbody = document.getElementById("tabela-produtos");
  
  // Cria uma nova linha idêntica à que está no HTML, com os gatilhos oninput
  const novaLinha = document.createElement("tr");
  novaLinha.innerHTML = `
    <td>
      <input type="text" placeholder="Descrição do produto" value="" />
    </td>
    <td class="center">
      <input type="number" class="center" value="1" style="width: 50px;" oninput="calcular()" />
    </td>
    <td class="right">
      <input type="text" class="right" value="0.00" style="width: 80px;" oninput="calcular()" />
    </td>
    <td>
      <input type="text" placeholder="Ex: sob encomenda..." value="" />
    </td>
    <td class="right" style="color: #2b6cb0; font-weight: 600;">R$ 0,00</td>
    <td class="center no-print">
      <button class="btn-remove">✕</button>
    </td>
  `;

  // Adiciona o evento de clique no botão "X" da nova linha para poder apagar
  novaLinha.querySelector(".btn-remove").addEventListener("click", function() {
    novaLinha.remove();
    calcular(); // Recalcula tudo após remover o item
  });

  tbody.appendChild(novaLinha);
  calcular(); // Recalcula para garantir que está tudo zerado certinho
});

// Configura o botão de remover da primeira linha que já vem criada por padrão
document.querySelectorAll(".btn-remove").forEach(botao => {
  botao.addEventListener("click", function() {
    const linha = botao.closest("tr");
    linha.remove();
    calcular();
  });
});

// Inicializa o cálculo assim que a página abre
window.onload = calcular;