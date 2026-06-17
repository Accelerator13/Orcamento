# 📄 Sistema de Orçamentos Dinâmico – Online Shopping

Este é um sistema web responsivo e automatizado para a geração, cálculo e impressão de orçamentos comerciais, desenvolvido sob medida para a **Online Shopping**. A ferramenta foi projetada para otimizar o trabalho da equipe de vendas, garantindo cálculos em tempo real e um layout padronizado pronto para impressão ou salvamento em PDF.

---

## ✨ Principais Funcionalidades

* **Cálculo Automático em Tempo Real:** Atualização instantânea dos subtotais dos itens e do valor total geral ao alterar quantidades ou valores unitários.
* **Tratamento Inteligente de Moeda:** O motor em JavaScript aceita entradas com pontos ou vírgulas sem quebrar os cálculos do sistema.
* **Controle de Ordenação:** Botões integrados (`▲` e `▼`) que permitem subir ou descer a posição dos itens na tabela de forma dinâmica.
* **Gerenciamento de Linhas:** Adicione novos produtos com um clique ou remova itens usando o botão de exclusão (`✕`).
* **Sistema de Desconto Flexível:** Aplicação de descontos configuráveis em Reais (R$) ou em Porcentagem (%).
* **Condições de Pagamento Dinâmicas:** Menu seletor com as principais regras de parcelamento e acréscimos da empresa.
* **Pronto para Impressão (Print-Ready):** CSS otimizado via `@media print` que esconde botões de ação e barras de ferramentas automaticamente ao gerar o PDF ou imprimir.
* **Termos de Faturamento Integrados:** Caixa de observações previamente preenchida com as políticas comerciais, prazos e CNPJ padrão da loja.

---

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando tecnologias web puras (Vanilla), garantindo leveza, rapidez e facilidade de manutenção:

* **HTML5:** Estruturação semântica dos dados do cliente, tabelas e rodapé.
* **CSS3:** Estilização moderna baseada em componentes (cards, badges) e regras de isolamento para impressão de documentos.
* **JavaScript (ES6):** Lógica de manipulação do DOM, cálculo matemático automatizado e reordenação dinâmica de elementos na página.

---

## 📁 Estrutura de Arquivos

Para o sistema funcionar corretamente, certifique-se de manter os arquivos organizados na mesma pasta:

```text
├── index.html          # Estrutura principal da página do orçamento
├── style.css           # Estilização visual e regras de mídia de impressão
├── script.js           # Lógica dos cálculos e ordenação das linhas
└── logo.png            # Arquivo local com a logo oficial da empresa
