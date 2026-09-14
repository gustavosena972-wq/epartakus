/**
 * Epartakus — inscrição do jogador + visão pública
 */
(function () {
  "use strict";

  const Store = window.EpartakusStore;
  const Pitch = window.EpartakusPitch;
  const app = document.getElementById("app");

  function params() {
    const u = new URL(location.href);
    return { m: u.searchParams.get("m") || "" };
  }

  function initials(name) {
    return Pitch.initials(name);
  }

  function escape(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function posOptions(selected) {
    return (
      '<option value="">—</option>' +
      Store.POSITIONS.map(function (p) {
        return (
          '<option value="' +
          escape(p) +
          '"' +
          (selected === p ? " selected" : "") +
          ">" +
          escape(p) +
          "</option>"
        );
      }).join("")
    );
  }

  async function main() {
    await Store.init();
    let team = Store.getTeam();
    if (!team) {
      app.innerHTML =
        '<div class="card"><h2>Nenhuma lista ainda</h2><p class="muted">Abra a página inicial para criar o primeiro jogo.</p>' +
        '<a class="btn btn--primary" href="index.html">Ir para o início</a></div>';
      return;
    }

    const { m } = params();
    let match = m ? Store.getMatchBySlug(m) : Store.getActiveMatch();
    if (!match) {
      app.innerHTML =
        '<div class="card"><div class="alert alert--err">Jogo não encontrado. Peça o link atualizado ao técnico.</div>' +
        '<a class="btn btn--soft" href="index.html">Início</a></div>';
      return;
    }

    const coachUrl = Store.coachLink(team);
    const tabCoach = document.getElementById("tabCoach");
    if (tabCoach) tabCoach.href = coachUrl;

    const playerUrl = Store.playerLink(match);
    const tabInsc = document.getElementById("tabInscricao");
    if (tabInsc) tabInsc.href = playerUrl;

    document.getElementById("headerSub").textContent =
      team.name + " · " + match.label;

    if (match.status === "published") {
      renderPublic(team, match);
    } else {
      renderSignup(team, match);
    }
  }

  function renderSignup(team, match) {
    const players = Store.getPlayers(match.id);

    app.innerHTML =
      '<div class="card">' +
      "<h2>Confirme sua presença</h2>" +
      '<p class="muted">Preencha o nome. Posições são opcionais — comissão técnica não precisa informar.</p>' +
      '<p class="status-dot" style="margin:.5rem 0 0">Inscrições abertas · ' +
      escape(match.label) +
      "</p>" +
      '<label class="label">Nome completo <span class="req">*</span></label>' +
      '<input class="input" id="name" placeholder="Seu nome" autocomplete="name" />' +
      '<label class="check"><input type="checkbox" id="isStaff" /> Faço parte da comissão técnica</label>' +
      '<div id="posFields">' +
      '<label class="label">Posição principal</label>' +
      '<select class="select" id="pos1">' +
      posOptions() +
      "</select>" +
      '<label class="label">2ª opção</label>' +
      '<select class="select" id="pos2">' +
      posOptions() +
      "</select>" +
      '<label class="label">3ª opção</label>' +
      '<select class="select" id="pos3">' +
      posOptions() +
      "</select>" +
      "</div>" +
      '<div id="feedback"></div>' +
      '<button class="btn btn--primary" id="btnConfirm">Confirmar presença</button>' +
      "</div>" +
      '<div class="card" id="confirmedCard">' +
      '<div class="section-title"><h2>Confirmados (' +
      players.length +
      ")</h2></div>" +
      '<ul class="list" id="confirmedList"></ul>' +
      '<p class="hint">O técnico compartilha o link pelo painel (WhatsApp). Esta tela não mostra a escalação até ele salvar.</p>' +
      "</div>";

    renderConfirmedList(players);

    qs("#isStaff").onchange = function () {
      qs("#posFields").classList.toggle("hidden", qs("#isStaff").checked);
    };

    qs("#btnConfirm").onclick = async function () {
      const fb = qs("#feedback");
      fb.innerHTML = "";
      try {
        const isStaff = qs("#isStaff").checked;
        const positions = isStaff
          ? []
          : [qs("#pos1").value, qs("#pos2").value, qs("#pos3").value].filter(
              Boolean
            );
        await Store.confirmPlayer(match.id, {
          name: qs("#name").value,
          isStaff: isStaff,
          positions: positions,
        });
        qs("#name").value = "";
        qs("#isStaff").checked = false;
        qs("#posFields").classList.remove("hidden");
        ["pos1", "pos2", "pos3"].forEach(function (id) {
          qs("#" + id).value = "";
        });
        fb.innerHTML =
          '<div class="alert alert--ok">Presença confirmada! Bom jogo ⚽</div>';
        renderConfirmedList(Store.getPlayers(match.id));
        qs("#confirmedCard .section-title h2").textContent =
          "Confirmados (" + Store.getPlayers(match.id).length + ")";
      } catch (e) {
        fb.innerHTML =
          '<div class="alert alert--err">' +
          escape(e.message || e) +
          "</div>";
      }
    };
  }

  function renderConfirmedList(players) {
    const ul = qs("#confirmedList");
    if (!ul) return;
    if (!players.length) {
      ul.innerHTML = '<li class="empty">Ninguém confirmou ainda.</li>';
      return;
    }
    ul.innerHTML = players
      .map(function (p) {
        return (
          "<li>" +
          '<div class="avatar' +
          (p.isStaff ? " avatar--staff" : "") +
          '">' +
          escape(initials(p.name)) +
          "</div>" +
          '<div class="list__meta"><div class="list__name">' +
          escape(p.name) +
          '</div><div class="list__pos">' +
          (p.isStaff
            ? "Comissão técnica"
            : (p.positions || []).join(" · ") || "Posição livre") +
          "</div></div>" +
          (p.isStaff ? '<span class="badge">Staff</span>' : "") +
          "</li>"
        );
      })
      .join("");
  }

  function renderPublic(team, match) {
    const lineup = Store.getLineup(match.id);
    document.getElementById("tabInscricao").textContent = "Escalação";

    app.innerHTML =
      '<div class="card">' +
      "<h2>Visualização pública da escalação</h2>" +
      '<p class="muted">Resumo pronto para compartilhar com o grupo · ' +
      escape(match.label) +
      "</p>" +
      '<p class="status-dot status-dot--pub">Escalação publicada</p>' +
      "</div>" +
      '<div class="card">' +
      '<div class="section-title"><h2>Campo tático</h2><span class="tag">' +
      escape(match.formation || "livre") +
      "</span></div>" +
      '<div id="pitchPublic"></div>' +
      "</div>" +
      '<div class="lineup-cols">' +
      col("TITULARES", lineup.starters) +
      col("BANCO DE RESERVAS", lineup.bench) +
      col("COMISSÃO TÉCNICA", lineup.staff) +
      "</div>" +
      '<div class="card" style="margin-top:1rem">' +
      '<p class="muted">Inscrições desta lista foram fechadas após a publicação. O técnico pode abrir o próximo jogo na página inicial.</p>' +
      '<a class="btn btn--soft" href="index.html">Ir para o início</a>' +
      "</div>";

    const pitch = new Pitch({
      el: "#pitchPublic",
      readonly: true,
      formation: match.formation || "4-3-3",
    });
    pitch.setPlayers(
      (lineup.starters || []).map(function (s) {
        return {
          id: s.id,
          name: s.name,
          x: s.pitchX != null ? s.pitchX : s.x,
          y: s.pitchY != null ? s.pitchY : s.y,
        };
      })
    );
  }

  function col(title, items) {
    const list =
      !items || !items.length
        ? '<p class="empty">—</p>'
        : '<ul class="list">' +
          items
            .map(function (p) {
              return (
                "<li>" +
                '<div class="avatar">' +
                escape(initials(p.name)) +
                "</div>" +
                '<div class="list__meta"><div class="list__name">' +
                escape(p.name) +
                '</div><div class="list__pos">' +
                escape(p.position || "") +
                "</div></div></li>"
              );
            })
            .join("") +
          "</ul>";
    return (
      '<div class="col-block"><h3>' + title + "</h3>" + list + "</div>"
    );
  }

  function qs(sel) {
    return document.querySelector(sel);
  }

  main().catch(function (e) {
    app.innerHTML =
      '<div class="card"><div class="alert alert--err">' +
      escape(e.message || e) +
      "</div></div>";
  });
})();
