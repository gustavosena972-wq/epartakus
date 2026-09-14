# Epartakus — Lista de presença e escalação

App **independente** do time Epartakus / Spartakus.  
**Não usa** Supabase nem qualquer projeto CodeCraft.

- Stack: HTML / CSS / JS (vanilla)
- Dados: **Firebase Firestore** (quando configurado) ou **localStorage** (demo imediato)
- Hospedagem sugerida: GitHub Pages

## Abrir agora (demo)

1. Abra `index.html` no navegador (duplo clique ou servidor local).
2. Clique em **Criar primeiro jogo** (PIN padrão: `1234`).
3. Use os links gerados:
   - **Jogadores** → `j.html?m=…`
   - **Técnico** → `coach.html?t=…` (mesmo PIN)

Servidor local (opcional, PowerShell):

```powershell
cd C:\Users\sandr\Projects\epartakus
npx --yes serve .
```

## Fluxo

1. Jogadores confirmam presença (nome + posições; comissão oculta posições).
2. Técnico entra com PIN, monta campo (arrastar), titulares, banco e staff.
3. **Salvar escalação** → publica visão em 3 colunas no link dos jogadores.
4. **Nova lista / próximo jogo** → novo link, presença zerada, **escalação/formação herdadas**.

## Firebase (passos restantes)

1. Crie um projeto em [Firebase Console](https://console.firebase.google.com) **só do Epartakus**.
2. Ative **Firestore Database** (modo de produção ou teste).
3. Em Configurações do projeto → Seu app Web → copie o objeto `firebaseConfig`.
4. Cole em `firebase-config.js` e defina:

```js
window.EPARTAKUS_USE_FIREBASE = true;
```

5. Nas páginas HTML, carregue o SDK antes do app (exemplo):

```html
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
```

6. Regras iniciais (ajuste depois para produção):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /_epartakus/{doc} {
      allow read, write: if true; // só para demo — restrinja em produção
    }
  }
}
```

Enquanto `USE_FIREBASE` for `false` ou as chaves forem placeholders, o app continua em **localStorage**.

## Páginas

| Arquivo       | Função                          |
|---------------|---------------------------------|
| `index.html`  | Hub: criar jogo, links, PIN     |
| `j.html`      | Inscrição / visão pública       |
| `coach.html`  | Painel técnico (PIN)            |

## Identidade

Cores do kit (vermelho + branco), escudo Spartakus em `assets/`.  
UI em português, mobile-first (WhatsApp).

## Isolamento

- Pasta: `C:\Users\sandr\Projects\epartakus`
- **Zero** uso do projeto Supabase `eqaoanbanhryhbldlbhc` ou repos CodeCraft.
