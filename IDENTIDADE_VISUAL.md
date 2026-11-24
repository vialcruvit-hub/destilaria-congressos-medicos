# Identidade Visual — Destilaria Research Group

Documento oficial de diretrizes visuais, tokens de interface e ativos vetoriais do **Destilaria Research Group**.

---

## 1. Conceito da Marca

O **Destilaria Research Group** traduz o espírito de um grupo de pesquisa jovem, colaborativo e rigoroso em uma estética **cartoon-minimalista para ciência colaborativa**. Inspirada diretamente no emblema botânico de cana-de-açúcar (`SUGAR CANE`), a marca combina:

- **Traço Cartoon Limpo e Simpático**: contornos nítidos em tinta carvão (`#211F1C`, `2.1px–2.2px`), canas douradas articuladas (`#F3D2A2` / `#EFC588`) e folhas vivas (`#B7CC49` / `#A2B933`) com animação leve de brisa.
- **Canvas Aberto (Sem Excesso de Boxes)**: o fundo em papel pontilhado creme (`#FAF7F1`) respira livremente; a logo flutua limpa no cabeçalho **sem caixa ou moldura**, e o destaque tátil (`border-2 border-[#211F1C]` + sombra sólida deslocada) fica reservado apenas para elementos centrais de ação, tabela, cards e modais — evitando caixas aninhadas.

---

## 2. Ativos Vetoriais (`public/brand/`)

Todos os arquivos em [`public/brand/`](./public/brand/) são vetoriais (`SVG`) sem moldura externa:

| Arquivo | Uso recomendado |
|---|---|
| [`logo-mark.svg`](./public/brand/logo-mark.svg) | Símbolo isolado das duas hastes de cana e três folhas (`64x64` viewBox) |
| [`logo-horizontal.svg`](./public/brand/logo-horizontal.svg) | Assinatura principal completa (`DESTILARIA / RESEARCH GROUP`) sem box |
| [`logo-mono-dark.svg`](./public/brand/logo-mono-dark.svg) | Versão monocromática escura (`#211F1C`) para impressão e artigos em fundo claro |
| [`logo-mono-light.svg`](./public/brand/logo-mono-light.svg) | Versão monocromática clara (`#FAF7F1`) para fundos escuros |
| [`favicon.svg`](./public/brand/favicon.svg) | Ícone de navegador (`32x32` viewBox) |

### Regras de Aplicação da Logo
1. **Sempre solta, sem box**: no header e em cabeçalhos de página, aplicar o símbolo e o wordmark diretamente sobre o fundo `#FAF7F1` ou `#FFFFFF`, sem caixa quadrada/retangular ao redor do emblema.
2. **Área de proteção**: manter margem livre mínima equivalente à largura de uma haste de cana ao redor da assinatura.
3. **Tamanho mínimo**: `32px` de altura para o símbolo isolado e `160px` de largura para a assinatura horizontal.
4. **Proibições**: não remover o contorno carvão das folhas na versão colorida, não esticar desproporcionalmente e não encerrar o símbolo em badges apertados.

---

## 3. Paleta de Cores Oficial

| Token CSS | HEX | RGB | Função Semântica |
|---|---|---|---|
| `--bg-cream` | `#FAF7F1` | `250, 247, 241` | Papel pontilhado principal (`radial-gradient` sutil) |
| `--bg-paper` | `#FFFFFF` | `255, 255, 255` | Superfície da tabela principal, cards e modais |
| `--bg-warm` | `#FDF6E9` | `253, 246, 233` | Cabeçalho da tabela, topo de modais e realce quente |
| `--ink-primary` | `#211F1C` | `33, 31, 28` | Títulos, contornos cartoon e texto principal |
| `--ink-muted` | `#6B655B` | `107, 101, 91` | Subtítulos, metadados e rótulos |
| `--leaf-main` | `#B7CC49` | `183, 204, 73` | Folha de cana, botões primários positivos, seleções ativas |
| `--leaf-deep` | `#A2B933` | `162, 185, 51` | Sombra da folha e hover de ações verdes |
| `--leaf-soft` | `#F2F6DF` | `242, 246, 223` | Fundo suave de tags de especialidade e seleções |
| `--cane-gold` | `#F3D2A2` | `243, 210, 162` | Colmo principal, chips de período ativos e botão copiar |
| `--cane-amber` | `#EFC588` | `239, 197, 136` | Segundo colmo e acentos secundários |
| `--cane-ochre` | `#D49A4A` | `212, 154, 74` | Ícones de localização e observações temporais |

---

## 4. Tipografia

| Família | Papel | Pesos | Características |
|---|---|---|---|
| `Plus Jakarta Sans` | Wordmark (`DESTILARIA`), títulos (`H1`–`H3`), botões e cabeçalhos | `500`, `600`, `700`, `800` | Geométrica limpa, simpática e arquitetônica |
| `Inter` | Corpo, células da tabela, filtros, formulários e exportações | `400`, `500`, `600`, `700` | Máxima legibilidade em telas e `tabular-nums` para datas |

---

## 5. Princípio de Layout & Animações

- **Sem excesso de boxes**: filtros, busca, hero e navegação vivem diretamente no canvas pontilhado (`#FAF7F1`), sem caixas contornando caixas.
- **Tactile Cartoon Depth**: onde há caixa interativa principal (tabela, cards, modais e pílulas ativas), usa-se `border-2 border-[#211F1C]` com sombra sólida deslocada (`shadow-[3px_3px_0px_#211F1C]` a `shadow-[8px_8px_0px_#211F1C]`).
- **Ações limpas nas linhas**: botões recorrentes dentro de tabelas (favoritar artigo, pesquisar no Google) permanecem sem caixa em repouso e ganham realce no hover.
- **Movimento (`framer-motion`)**:
  - Transições de entrada e Typeform com molas (`stiffness: 300–340`, `damping: 22–26`).
  - Balanço contínuo e gentil nas folhas da cana (`±4°`, `5s–6s` em loop infinito) respeitando `<MotionConfig reducedMotion="user">`.
