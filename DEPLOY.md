# Deploy: GitHub + Vercel

## 1. Criar o repositório no GitHub

1. Acesse github.com, clique em **New repository**.
2. Nome: `thiago-erp` (ou o que preferir). Deixe **privado** (é um sistema com dados de negócio).
3. Não marque "Add README" nem ".gitignore" (o projeto já tem um).
4. Clique em **Create repository** e deixe a página aberta — ela mostra a URL do repo (algo como `https://github.com/seu-usuario/thiago-erp.git`).

## 2. Subir o código (no terminal, dentro da pasta do projeto)

Abra o terminal na pasta `Thiago` (a mesma onde você roda `npm run dev`) e rode:

```bash
git init
git add .
git commit -m "Sistema Thiago Casa & Construção"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/thiago-erp.git
git push -u origin main
```

Troque a URL do `remote add` pela que o GitHub mostrou pra você. Na hora do `push`, o Git vai pedir login — use seu usuário do GitHub e, como senha, um **Personal Access Token** (GitHub não aceita mais senha normal por linha de comando). Pra gerar um token: GitHub → foto do perfil → Settings → Developer settings → Personal access tokens → Generate new token (marque o escopo `repo`).

Confira antes de subir: o arquivo `.env.local` (onde está a senha do banco) **não vai junto** — ele já está no `.gitignore`. Isso é o certo; a senha do banco fica só na Vercel (passo 4).

## 3. Criar o projeto na Vercel

1. Acesse vercel.com e faça login (dá pra entrar direto com a conta do GitHub).
2. Clique em **Add New → Project**.
3. Selecione o repositório `thiago-erp` que você acabou de subir (a Vercel pode pedir autorização pra acessar seus repositórios do GitHub — autorize).
4. A Vercel detecta sozinha que é um projeto Next.js. Não precisa mudar build command nem output directory.

## 4. Configurar a variável de ambiente do banco

Antes de clicar em Deploy, abra a seção **Environment Variables** na mesma tela e adicione:

| Nome | Valor |
|---|---|
| `DATABASE_URL` | a connection string do seu banco Neon (a mesma que está no seu `.env.local`, começa com `postgresql://...`) |

Opcionais (só se quiser mudar o admin inicial que é criado no primeiro acesso):

| Nome | Valor |
|---|---|
| `DEFAULT_ADMIN_EMAIL` | e-mail do admin inicial |
| `DEFAULT_ADMIN_PASSWORD` | senha do admin inicial |

Como você já tem um usuário admin criado no banco (o `thiago123@gmail.com`), essas duas últimas na prática não vão fazer diferença — elas só são usadas se o banco estiver vazio (zero usuários).

## 5. Deploy

Clique em **Deploy**. A Vercel builda e publica; em ~1-2 minutos você recebe uma URL tipo `thiago-erp.vercel.app`. Esse é o sistema no ar, ligado no mesmo banco Neon que você já usa localmente — os dados são os mesmos, é só um outro "endereço" pra acessar.

## 6. Depois do primeiro deploy

Qualquer novo `git push` pra branch `main` gera um deploy novo automaticamente. Ou seja, quando eu (ou você) fizer alterações no código depois, o fluxo passa a ser:

```bash
git add .
git commit -m "descrição da mudança"
git push
```

E a Vercel republica sozinha.

## Domínio próprio (opcional)

Se quiser usar um domínio seu (ex: `sistema.thiagocasaeconstrucao.com.br`) em vez do `.vercel.app`, isso é feito depois em Project → Settings → Domains, na Vercel — aí é só apontar o DNS do seu domínio conforme a Vercel instrui.
