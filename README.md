# Epartakus — Lista de presença e escalação

App **independente** do time Epartakus / Spartakus.  
**Não usa** Supabase nem qualquer projeto CodeCraft.

- Stack: HTML / CSS / JS (vanilla)
- Dados: **localStorage** (funciona já) ou **Firebase Firestore** (vários celulares)
- Live: https://gustavosena972-wq.github.io/epartakus/

## Uso no dia a dia (técnico)

1. Abra o **Painel do Técnico** (`coach.html`) e digite o **PIN** (padrão: `1234`).
2. No topo, o bloco **Compartilhar / Links** é o único lugar para:
   - **Copiar link** da inscrição
   - **Enviar no WhatsApp** (texto pronto com o link)
3. Depois do jogo: **Nova lista / próximo jogo**
   - Presença zera
   - Escalação/formação são herdadas
   - O bloco Compartilhar **atualiza sozinho** com o link novo → use de novo **Copiar link novo** ou **Enviar no WhatsApp**
4. Monte o campo (arrastar), titulares / banco / staff → **Salvar escalação** (visão pública em 3 colunas no link dos jogadores).

## Abrir

- **Produção:** https://gustavosena972-wq.github.io/epartakus/
- **Local:** abra `index.html` ou:

```powershell
cd C:\Users\sandr\Projects\epartakus
npx --yes serve .
```

PIN padrão na primeira criação: **`1234`**.

## localStorage vs Firebase

| Situação | O que usar |
|----------|------------|
| Demo / um celular do técnico | localStorage (padrão) — links do Pages funcionam para os jogadores abrirem a inscrição; o técnico gerencia no **mesmo navegador** onde criou o time |
| Vários dispositivos precisam ver a **mesma** lista/escalação ao vivo | Configure Firebase (abaixo) |

Os links copiados/WhatsApp apontam para o GitHub Pages (ou a origem atual em http/https). Em `file://`, usa `EPARTAKUS_PUBLIC_BASE` em `firebase-config.js`.

## Firebase (multi-celular / WhatsApp)

O SDK já está nas páginas. Falta **só** um projeto Firebase deste time (não CodeCraft).

1. [Firebase Console](https://console.firebase.google.com) → criar projeto **epartakus**
2. Ative **Firestore** (modo teste ok para time amador)
3. App Web → copie o config → cole em `firebase-config.js`
4. `EPARTAKUS_USE_FIREBASE = true` → commit + push
5. (Opcional CLI) `npx firebase-tools login` → `npx firebase-tools use epartakus` → `npx firebase-tools deploy --only firestore:rules`

**Regras** (`firestore.rules`): `allow read, write: if true` no doc `_epartakus/*` — qualquer um com o link pode alterar a lista. Ok para uso interno do time; não use para dados sensíveis.

**Como verificar:** pill **FIREBASE** no topo; técnico no PC confirma presença; celular no link do WhatsApp vê o mesmo nome (dois navegadores / anônimo).

## Páginas

| Arquivo | Função |
|---------|--------|
| `index.html` | Criar time / atalho ao painel |
| `coach.html` | PIN + **Compartilhar / Links** + escalação + nova lista |
| `j.html` | Inscrição dos jogadores / visão pública após publicar |

## Isolamento

Pasta `C:\Users\sandr\Projects\epartakus` — zero CodeCraft / Supabase `eqaoanbanhryhbldlbhc`.
