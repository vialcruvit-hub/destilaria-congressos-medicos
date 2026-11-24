# Destilaria Research Group · Radar de Congressos Médicos 2026–2028

Plataforma colaborativa em **React + TypeScript + Tailwind CSS + Framer Motion** integrada ao **Supabase (PostgreSQL + Auth)** e **Vercel Functions**, projetada para que pesquisadores e membros do **Destilaria Research Group** mapeiem congressos de interesse comum e formem grupos para redação de artigos científicos.

## Funcionalidades

- **Identidade Visual Editorial** ([`IDENTIDADE_VISUAL.md`](./IDENTIDADE_VISUAL.md) e [`public/brand/`](./public/brand/)): estética sóbria em alabastro quente, sálvia e ocre cana com tipografia *Newsreader*, *Plus Jakarta Sans* e *Inter*.
- **Filtros combináveis & exportação em linguagem simples**: busca instantânea, seletor de filtros (*Especialidade/Tema*, *Período*, *Modalidade*, *Local/UF/Exterior* e *Status da Data*), seleção múltipla e exportação pronta para WhatsApp, Markdown, CSV ou JSON.
- **Autenticação por Token Único de Convite** ([`api/auth-register.ts`](./api/auth-register.ts) e [`api/invites.ts`](./api/invites.ts)): criação de conta e definição de senha autorizadas exclusivamente mediante token único descartável (`DRG-XXXX-XXXX-XXXX`). Administradores podem gerar e revogar convites dentro da plataforma.
- **Questionário interativo estilo Typeform**: mapeia estágio acadêmico, áreas médicas, formatos de congresso, objetivos científicos e congressos sugeridos.
- **Interesses do Grupo & Busca Rápida**: aba dedicada ao consenso de congressos entre membros, botão direto de pesquisa automática no Google e compartilhamento formatado para o grupo do WhatsApp.

## Configuração do Banco de Dados (Supabase)

1. No painel do Supabase (`yzuzasrpypsjucxrebjg`), abra o **SQL Editor** e execute o arquivo [`supabase_schema.sql`](./supabase_schema.sql).
   - Cria as tabelas `congressos`, `invite_tokens`, `member_profiles` e `member_congress_interests` com políticas RLS.
   - Insere os 165 congressos deduplicados e o token fundador inicial (`DRG-ADMIN-7F4K-9M2Q`) para criar o primeiro usuário administrador.

## Variáveis de Ambiente

Para rodar localmente ou na Vercel:
- Frontend (públicas): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Vercel Functions (servidor): `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (nunca exposta no navegador nem no GitHub)

```bash
cp .env.example .env
npm install
npm run dev
```
