# Destilaria Research Group · Radar de Congressos Médicos 2026–2028

Aplicação web interativa em React + TypeScript + Tailwind CSS + Framer Motion conectada ao PostgreSQL/Supabase (`yzuzasrpypsjucxrebjg`), para explorar, filtrar, selecionar e exportar em linguagem simples o calendário deduplicado de congressos médicos (165 eventos consolidados de 9 fontes).

## Funcionalidades

- **Identidade visual Destilaria Research Group**: estética editorial limpa e minimalista com ilustrações cartoon leves em SVG e micro-animações fluidas (`framer-motion`).
- **Filtros combináveis de alto nível**: busca instantânea, seletor personalizável de dimensões de filtro (*Especialidade/Tema*, *Período Mês/Ano*, *Modalidade*, *Local/UF/Exterior* e *Status da Data*).
- **Seleção & Visualização dupla**: alterne entre **Tabela ordenável** e **Cards**, selecione eventos individuais ou todos os filtrados, e abra a ficha completa de cada congresso.
- **Exportação em Linguagem Simples**: gere resumos prontos para WhatsApp/e-mail, Markdown, CSV ou JSON com cópia em 1 clique ou download.

## Banco de Dados (Supabase / PostgreSQL)

1. Execute o arquivo [`congressos.sql`](./congressos.sql) no **SQL Editor** do projeto Supabase (`yzuzasrpypsjucxrebjg`) para criar a tabela `congressos`, índices e política RLS de leitura pública.
2. Para re-sincronizar via API REST após novas coletas com [`scrape_congressos.py`](./scrape_congressos.py):
   ```bash
   set SUPABASE_SECRET_KEY=sua_chave_secreta
   python seed_supabase.py
   ```

## Desenvolvimento Local

```bash
cp .env.example .env
npm install
npm run dev
```
