# Como hospedar este projeto

## 1. Subir no GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

## 2. Deploy na Netlify

1. Acesse https://app.netlify.com/start
2. Conecte sua conta do GitHub e selecione este repositório
3. Build command: `bun run build` (já configurado em netlify.toml)
4. Publish directory: `dist` (já configurado em netlify.toml)
5. Clique em **Deploy site**

O arquivo `netlify.toml` já está pronto.
