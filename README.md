# Portal de Qualidade de Materiais — Rumo

Primeiro esqueleto do portal que centraliza o envio, a análise e o acompanhamento de informações de qualidade dos materiais fornecidos à Rumo.

## Escopo atual

- login da equipe Rumo e de fornecedores com Supabase Auth;
- perfis internos `editor`, `analyst`, `coordinator` e `viewer`;
- isolamento do fornecedor por empresa e por área com Row Level Security;
- áreas AMV, Dormente de Madeira, Dormente de Concreto, Lastro e Subcomponentes;
- dashboards, registros e filtros por fornecedor, data e semana;
- tela de criação de contas para equipe Rumo e fornecedores;
- Edge Function segura para provisionamento de usuários;
- interface responsiva alinhada ao Brandbook Rumo.

## Desenvolvimento

Requer Node.js 22.13 ou mais recente e pnpm 11.9.

```bash
pnpm install
pnpm dev
pnpm build
```

As variáveis públicas do Supabase estão documentadas em `.env.example`. O arquivo `supabase/schema.sql` contém o modelo inicial e as políticas de acesso. Antes de publicar a Edge Function `admin-create-user`, configure o secret `INITIAL_USER_PASSWORD` no Supabase.

## Segurança

O cliente usa apenas a chave pública do Supabase. A chave `service_role` permanece exclusivamente no ambiente protegido da Edge Function. Papéis de autorização ficam em dados administrados pelo servidor e todas as tabelas expostas usam RLS.
