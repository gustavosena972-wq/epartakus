/**
 * Epartakus — landing / hub
 */
(function () {
  "use strict";

  const Store = window.EpartakusStore;
  const app = document.getElementById("app");

  function qs(sel, el) {
    return (el || document).querySelector(sel);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return Promise.resolve();
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
      '<p class="muted">Primeiro acesso: defina o time e o PIN do técnico. Depois compartilhe o link no WhatsApp.</p>' +
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
    const playerUrl = Store.playerLink(match);
    const coachUrl = Store.coachLink(team);
    const wa = Store.whatsappShareText(match, team);
    const waLink =
      "https://wa.me/?text=" + encodeURIComponent(wa);

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
      '<div class="hub-links" style="margin-top:1rem">' +
      '<div class="link-row">' +
      "<strong>Link dos jogadores</strong>" +
      "<code id='playerUrl'>" +
      escape(playerUrl) +
      "</code>" +
      '<button class="btn btn--soft btn--sm" id="copyPlayer">Copiar link</button>' +
      '<a class="btn btn--primary btn--sm" href="' +
      escape(playerUrl) +
      '">Abrir inscrição</a>' +
      "</div>" +
      '<div class="link-row">' +
      "<strong>Painel do técnico</strong>" +
      "<code>" +
      escape(coachUrl) +
      "</code>" +
      '<p class="hint">PIN: <strong>' +
      escape(team.pin) +
      "</strong></p>" +
      '<button class="btn btn--soft btn--sm" id="copyCoach">Copiar link do técnico</button>' +
      '<a class="btn btn--dark btn--sm" href="' +
      escape(coachUrl) +
      '">Abrir painel</a>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="card card--dark">' +
      "<h2>Pronto para compartilhar</h2>" +
      '<div class="wa-box" id="waBox">' +
      escape(wa) +
      "</div>" +
      '<a class="btn btn--primary" href="' +
      waLink +
      '" target="_blank" rel="noopener">Enviar no WhatsApp</a>' +
      '<button class="btn btn--ghost" id="copyWa">Copiar texto</button>' +
      "</div>" +
      '<div class="card">' +
      "<h2>Próximo jogo</h2>" +
      '<p class="muted">Gera uma <strong>nova lista</strong> (link novo, presença zerada) e <strong>copia a escalação/formação</strong> do jogo atual até você alterar.</p>' +
      '<button class="btn btn--primary" id="btnNext">Nova lista / próximo jogo</button>' +
      '<button class="btn btn--soft" id="btnReset" style="margin-top:.5rem">Zerar demo (apaga dados locais)</button>' +
      "</div>";

    qs("#copyPlayer").onclick = function () {
      copyText(playerUrl).then(function () {
        qs("#copyPlayer").textContent = "Copiado!";
      });
    };
    qs("#copyCoach").onclick = function () {
      copyText(coachUrl).then(function () {
        qs("#copyCoach").textContent = "Copiado!";
      });
    };
    qs("#copyWa").onclick = function () {
      copyText(wa).then(function () {
        qs("#copyWa").textContent = "Copiado!";
      });
    };
    qs("#btnNext").onclick = async function () {
      if (
        !confirm(
          "Criar nova lista? Jogadores precisam confirmar de novo. A escalação atual será herdada."
        )
      )
        return;
      const next = await Store.createMatch({
        label: "Jogo " + (Store.getMatches().length + 1),
        copyFrom: match,
      });
      renderHub(team, next);
    };
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

  function escape(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  main().catch(function (e) {
    app.innerHTML =
      '<div class="card"><div class="alert alert--err">' +
      escape(e.message || e) +
      "</div></div>";
  });
})();
