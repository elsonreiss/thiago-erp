# Thiago Casa & Construção — Sistema de Gestão

ERP interno da loja: estoque, clientes, fornecedores, vendas, compras, orçamentos, financeiro e relatórios.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Postgres (Neon) via `pg` puro (sem ORM), Clean Architecture (`domain` → `infrastructure` → `application` → `app`).

## Rodando localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.local.example` para `.env.local` e preencha `DATABASE_URL` com a connection string do seu banco Neon (veja o guia de deploy que vou te passar separadamente).

3. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Abra http://localhost:3000 — vai redirecionar pra `/login`.

No primeiro start, o sistema cria automaticamente as tabelas (`ensureDb()`) e um usuário admin inicial:

- **E-mail:** `elsonreis084@gmail.com` (ou o que você definir em `DEFAULT_ADMIN_EMAIL`)
- **Senha:** `thiago123` (ou o que você definir em `DEFAULT_ADMIN_PASSWORD`)

Troque a senha assim que entrar (a tela de troca de senha vem no módulo de Configurações).

## Estrutura de pastas

```
src/
  domain/            # entidades e interfaces de repositório (sem depender de nada externo)
  infrastructure/     # implementações concretas (Postgres, sessão, hash de senha)
  application/         # use-cases (regras de negócio orquestrando repositórios)
  app/                 # páginas (App Router) e rotas de API
  container.ts         # injeção de dependência: troca a implementação num lugar só
```

## Status

Fundação do sistema pronta: autenticação (admin/gerente/funcionário), layout com sidebar responsiva,
tema claro/escuro, cartão-etiqueta, perfil de usuário. Os módulos de Estoque, Clientes, Fornecedores,
Vendas, Compras, Orçamentos, Financeiro, Relatórios e Dashboard entram nos próximos passos.
