/**
 * Epartakus — landing / hub
 * Criação do time + atalho para o painel (compartilhar fica no coach).
 */
(function () {
  "use strict";

  const Store = window.EpartakusStore;
  const app = document.getElementById("app");

  function qs(sel, el) {
    return (el || document).querySelector(sel);
  }

  function escape(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function main() {
    await Store.init();
    qs("#modePill").textContent =
      Store.mode === "firebase" ? "firebase" : "localStorage";

    let team = Store.getTeam();
    let match = Store.getActiveMatch();

    if (!team) {
      renderCreate();
      return;
    }
    renderHub(team, match);
  }

  function renderCreate() {
    app.innerHTML =
      '<div class="card">' +
      "<h2>Criar lista do Epartakus</h2>" +
      '<p class="muted">Primeiro acesso: defina o time e o PIN. No dia a dia, use o <strong>Painel do Técnico</strong> para nova lista e WhatsApp.</p>' +
      '<label class="label">Nome do time</label>' +
      '<input class="input" id="teamName" value="Epartakus" maxlength="40" />' +
      '<label class="label">PIN do técnico (4 dígitos)</label>' +
      '<input class="input" id="teamPin" value="' +
      Store.DEFAULT_PIN +
      '" inputmode="numeric" maxlength="8" />' +
      '<button class="btn btn--primary" id="btnCreate">Criar primeiro jogo</button>' +
      "</div>";

    qs("#btnCreate").onclick = async function () {
      const name = qs("#teamName").value.trim() || "Epartakus";
      const pin = qs("#teamPin").value.trim() || Store.DEFAULT_PIN;
      const { team, match } = await Store.bootstrapTeam({ name, pin });
      renderHub(team, match);
    };
  }

  function renderHub(team, match) {
    const coachUrl = Store.coachLink(team);
    const playerUrl = Store.playerLink(match);

    app.innerHTML =
      '<div class="card">' +
      "<h2>" +
      escape(team.name) +
      " · " +
      escape(match.label) +
      "</h2>" +
      '<p class="muted">Status: <span class="status-dot' +
      statusClass(match.status) +
      '">' +
      statusLabel(match.status) +
      "</span></p>" +
      '<div class="alert alert--info" style="margin-top:1rem">' +
      "<strong>Uso no dia a dia:</strong> abra o Painel do Técnico → " +
      "<em>Nova lista / próximo jogo</em> → no bloco <em>Compartilhar / Links</em> use " +
      "<em>Copiar link</em> ou <em>Enviar no WhatsApp</em>." +
      "</div>" +
      '<a class="btn btn--primary" href="' +
      escape(coachUrl) +
      '">Abrir painel do técnico</a>' +
      '<p class="hint">PIN: <strong>' +
      escape(team.pin) +
      "</strong></p>" +
      '<a class="btn btn--soft" href="' +
      escape(playerUrl) +
      '">Abrir inscrição dos jogadores</a>' +
      "</div>" +
      '<div class="card">' +
      "<h2>Atalhos</h2>" +
      '<p class="muted" style="margin:0 0 .5rem">Compartilhar e gerar lista nova ficam <strong>só no painel</strong> (um lugar só).</p>' +
      '<details><summary>Ver URLs (avançado)</summary>' +
      '<div class="link-row" style="margin-top:.5rem">' +
      "<strong>Jogadores</strong><code>" +
      escape(playerUrl) +
      "</code>" +
      "<strong>Técnico</strong><code>" +
      escape(coachUrl) +
      "</code></div></details>" +
      '<button class="btn btn--soft" id="btnReset" style="margin-top:1rem">Zerar demo (apaga dados locais)</button>' +
      "</div>";

    qs("#btnReset").onclick = async function () {
      if (!confirm("Apagar todos os dados locais deste navegador?")) return;
      await Store.resetDemo();
      location.reload();
    };
  }

  function statusLabel(s) {
    if (s === "published") return "Escalação publicada";
    if (s === "closed") return "Lista fechada";
    return "Inscrições abertas";
  }

  function statusClass(s) {
    if (s === "published") return " status-dot--pub";
    if (s === "closed") return " status-dot--closed";
    return "";
  }

  main().catch(function (e) {
    app.innerHTML =
      '<div class="card"><div class="alert alert--err">' +
      escape(e.message || e) +
      "</div></div>";
  });
})();
