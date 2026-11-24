# Identidade Visual — Destilaria Research Group

Documento oficial de diretrizes visuais, tokens de interface e ativos vetoriais do **Destilaria Research Group**.

---

## 1. Conceito da Marca

O **Destilaria Research Group** nasce da união entre **rigor metodológico científico** e **organicidade colaborativa**. O nome remete ao processo de *destilação* — separar ruído de evidência, filtrar dados brutos de múltiplas fontes e extrair sínteses claras para produção acadêmica conjunta.

A linguagem visual traduz esse posicionamento em um equilíbrio entre:
- **Estética Editorial Científica**: tipografia serifada clássica para títulos (`Newsreader`) combinada a uma sans-serif geométrica limpa (`Plus Jakarta Sans` e `Inter`), papel quente e espaçamento generoso.
- **Ilustração Botânica Contida**: traços finos (`1.5px`–`1.6px`) inspirados na cana-de-açúcar original, em tons suaves e desaturados, sem contornos pesados ou sombras neo-brutalistas.

---

## 2. Ativos Vetoriais (`public/brand/`)

Todos os arquivos em [`public/brand/`](./public/brand/) são escaláveis (`SVG`) e utilizam exclusivamente fontes de sistema/editorial e traços consistentes:

| Arquivo | Uso recomendado |
|---|---|
| [`logo-mark.svg`](./public/brand/logo-mark.svg) | Símbolo isolado (avatares, selos, cabeçalhos compactos, apresentações) |
| [`logo-horizontal.svg`](./public/brand/logo-horizontal.svg) | Assinatura principal (site, cabeçalho de documentos, relatórios PDF) |
| [`logo-mono-dark.svg`](./public/brand/logo-mono-dark.svg) | Impressão P&B, artigos, pôsteres científicos sobre fundo claro |
| [`logo-mono-light.svg`](./public/brand/logo-mono-light.svg) | Slides escuros, capas de relatórios noturnos e materiais institucionais escuros |
| [`favicon.svg`](./public/brand/favicon.svg) | Ícone de navegador e atalhos PWA (`32x32` viewBox) |

### Regras de Aplicação do Logotipo
1. **Área de proteção**: manter margem livre mínima equivalente à largura de uma haste (`~8px` em escala `64px`) ao redor de toda a assinatura.
2. **Tamanho mínimo**: `28px` de altura para o símbolo isolado (`logo-mark.svg`) e `160px` de largura para a assinatura horizontal (`logo-horizontal.svg`).
3. **Usos indevidos**:
   - Não aplicar sombras duras (`box-shadow` sólido deslocado) ou molduras espessas ao redor do símbolo.
   - Não distorcer proporções nem alterar os pesos de traço (`1.5px`–`1.6px`).
   - Não utilizar cores saturadas/neon fora da paleta oficial.

---

## 3. Paleta de Cores (Orgânica e Desaturada)

A paleta evita cores brutas, pretos absolutos (`#000000`) e saturação excessiva, privilegiando superfícies serenas para leitura prolongada de dados acadêmicos.

### Superfícies & Texto

| Token CSS | HEX | RGB | Função Semântica | Contraste sobre `#FFFFFF` / `#F8F6F1` |
|---|---|---|---|---|
| `--bg-canvas` | `#F8F6F1` | `248, 246, 241` | Fundo principal (Alabastro Quente) | Base |
| `--bg-surface` | `#FFFFFF` | `255, 255, 255` | Cards, tabela, modais e drawers | Base |
| `--bg-subtle` | `#F2EEE6` | `242, 238, 230` | Cabeçalhos de tabela, fundos de chips | Base |
| `--text-primary` | `#1F1D1A` | `31, 29, 26` | Títulos, nomes de eventos, texto principal (Grafite Quente) | `16.4:1` (AAA) |
| `--text-secondary` | `#5E584F` | `94, 88, 79` | Subtítulos, metadados, rótulos | `6.8:1` (AA+) |
| `--text-muted` | `#8A8378` | `138, 131, 120` | Placeholders, legendas terciárias | `3.6:1` |
| `--border-hairline` | `#E6E0D5` | `230, 224, 213` | Bordas de cartões, divisores `1px` | Sutil |
| `--border-strong` | `#CFC7B8` | `207, 199, 184` | Hover de inputs e botões secundários | Sutil |

### Acentos Botânicos (Cana & Sálvia)

| Token CSS | HEX | RGB | Função Semântica |
|---|---|---|---|
| `--accent-sage` | `#5A6D3A` | `90, 109, 58` | Ação primária, texto de destaque sálvia, ícone ativo |
| `--accent-sage-fill` | `#8E9F63` | `142, 159, 99` | Preenchimento das folhas no símbolo, indicadores positivos |
| `--accent-sage-tint` | `#EEF2E7` | `238, 242, 231` | Fundo suave de tags de especialidade e estados selecionados |
| `--accent-cane` | `#DEC69D` | `222, 198, 157` | Preenchimento dos colmos de cana no símbolo |
| `--accent-ochre` | `#8F6B3A` | `143, 107, 58` | Observações de data, avisos sutis e filtros ativos secundários |
| `--accent-ochre-tint` | `#F6EFE4` | `246, 239, 228` | Fundo suave de destaque temporal e cartões de aviso discreto |

---

## 4. Tipografia e Escala

| Família | Papel | Pesos | Características |
|---|---|---|---|
| `Newsreader` | Títulos editoriais (`H1`, títulos do Typeform, modal de metodologia) | `400`, `500`, `600`, `italic` | Serifada contemporânea de leitura refinada |
| `Plus Jakarta Sans` | Wordmark da marca, subtítulos (`H2`, `H3`), botões primários | `500`, `600`, `700` | Geométrica limpa, inspirada no `SUGAR CANE` |
| `Inter` | Corpo, tabelas, inputs, tags e exportações | `400`, `500`, `600` | Alta legibilidade em tela e `tabular-nums` para datas/contagens |

### Escala Sugerida
- **Título Principal (`H1`)**: `Newsreader`, `28px–36px` (`1.75rem–2.25rem`), peso `500`, tracking `-0.015em`.
- **Título de Seção (`H2`)**: `Plus Jakarta Sans`, `18px–20px`, peso `600`, tracking `-0.01em`.
- **Corpo / Tabela**: `Inter`, `13px–14px`, altura de linha `1.55`.
- **Metadados / Rótulos**: `Inter`, `11px–12px`, peso `500–600`.

---

## 5. Superfícies, Elevação e Bordas

- **Regra de ouro**: evitar bordas espessas (`2px`) e sombras deslocadas rígidas.
- **Cartões e Tabela**: `border: 1px solid #E6E0D5`, `border-radius: 16px` (`rounded-2xl`), sombra suave `0 1px 2px rgba(31, 29, 26, 0.04)`.
- **Modais e Drawers**: `border: 1px solid #DCD4C6`, `border-radius: 20px`, sombra difusa `0 20px 50px -12px rgba(31, 29, 26, 0.14)`.
- **Botões e Pílulas**: `border-radius: 10px` (botões) e `9999px` (filtros/tags), sem excesso de pílulas competitivas na mesma linha visual.

---

## 6. Diretrizes de Animação (`framer-motion`)

As animações comunicam precisão e fluidez — nunca exagero caricatural:
- **Curva padrão de entrada/saída**: `cubic-bezier(0.22, 1, 0.36, 1)` (`duration: 0.22s–0.32s`).
- **Molas (Springs) para drawers e Typeform**: `stiffness: 280`, `damping: 30` (movimento amortecido, sem quique).
- **Movimento ambiente da marca**: oscilação suave das folhas do emblema (`duration: 7s`, `±1.8°`), respeitando automaticamente `prefers-reduced-motion` via `<MotionConfig reducedMotion="user">`.

---

## 7. Tom de Voz

- **Claro, direto e colaborativo**: comunica para médicos, residentes e estudantes de pesquisa sem jargão técnico de infraestrutura (sem avisos internos de banco/cache na interface pública).
- **Orientado à ação científica**: facilita descobrir congressos em comum, checar fontes rapidamente no Google e coordenar grupos de escrita de artigos no WhatsApp.
