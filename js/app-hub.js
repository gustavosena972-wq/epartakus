/**
 * Epartakus — tela inicial = inscrição (layout Canva)
 * Auto-cria time/jogo se ainda não existir.
 */
(function () {
  "use strict";

  const Store = window.EpartakusStore;
  const app = document.getElementById("app");

  function qs(sel, el) {
    return (el || document).querySelector(sel);
  }

  function escape(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  function posOptions(placeholder, allowEmpty) {
    let html =
      '<option value="">' +
      escape(placeholder || "Selecione uma posição") +
      "</option>";
    Store.POSITIONS.forEach(function (p) {
      html +=
        '<option value="' + escape(p) + '">' + escape(p) + "</option>";
    });
    if (allowEmpty) {
      /* placeholder already empty value */
    }
    return html;
  }

  async function ensureTeamMatch() {
    const u = new URL(location.href);
    const m = u.searchParams.get("m");
    let team = Store.getTeam();
    let match = Store.getActiveMatch();

    // Link do WhatsApp (?m=slug): nunca cria time novo — espera o estado na nuvem
    if (m) {
      const bySlug = Store.getMatchBySlug(m);
      if (!bySlug) {
        return {
          team: team,
          match: null,
          missingSlug: m,
          waitingCloud: Store.mode === "firebase",
        };
      }
      return { team: team || Store.getTeam(), match: bySlug };
    }

    if (!team) {
      const boot = await Store.bootstrapTeam({
        name: "Epartakus",
        pin: Store.DEFAULT_PIN,
      });
      team = boot.team;
      match = boot.match;
    } else if (!match) {
      match = await Store.createMatch({ label: "Jogo 1" });
    }
    return { team, match };
  }

  function renderWaitingCloud(slug) {
    app.innerHTML =
      '<div class="card">' +
      "<h2>Aguardando o técnico</h2>" +
      '<p class="muted">Este link ainda não encontrou o jogo <code>' +
      escape(slug) +
      "</code> na nuvem. Peça ao técnico para abrir o painel e criar/salvar a lista, depois atualize esta página.</p>" +
      '<button type="button" class="btn btn--primary" id="btnReload">Atualizar</button>' +
      "</div>";
    qs("#btnReload").addEventListener("click", function () {
      location.reload();
    });
  }

  function renderMissingMatch(slug) {
    app.innerHTML =
      '<div class="card">' +
      "<h2>Jogo não encontrado</h2>" +
      '<p class="muted">O link <code>' +
      escape(slug) +
      "</code> não existe neste aparelho. Com Firebase ligado, todos os celulares compartilham a mesma lista.</p>" +
      '<a class="btn btn--primary" href="index.html">Abrir início</a>' +
      "</div>";
  }

  async function main() {
    await Store.init();
    const pill = qs("#modePill");
    if (pill && Store.mode === "firebase") {
      pill.textContent = "FIREBASE";
    }

    const result = await ensureTeamMatch();
    if (result.missingSlug) {
      if (result.waitingCloud) renderWaitingCloud(result.missingSlug);
      else renderMissingMatch(result.missingSlug);
      return;
    }

    const team = result.team;
    const match = result.match;
    if (!team || !match) {
      app.innerHTML =
        '<div class="card"><p class="muted">Não foi possível carregar o time.</p></div>';
      return;
    }

    const coachUrl = Store.coachLink(team);
    const tabCoach = qs("#tabCoach");
    if (tabCoach) tabCoach.href = coachUrl;

    if (match.status === "published") {
      renderPublic(team, match);
      return;
    }

    renderSignup(team, match);
  }

  function renderPublic(team, match) {
    const Pitch = window.EpartakusPitch;
    const lineup = Store.getLineup(match.id);
    const tab = qs("#tabInscricao");
    if (tab) tab.textContent = "Escalação";

    const formLabel =
      Pitch && Pitch.formationLabel
        ? Pitch.formationLabel(match.formation || "4-3-3")
        : match.formation || "4-3-3";

    function col(title, items) {
      const list =
        !items || !items.length
          ? '<p class="empty">—</p>'
          : '<ul class="list">' +
            items
              .map(function (p) {
                return (
                  "<li><div class=\"list__meta\"><div class=\"list__name\">" +
                  escape(p.name) +
                  '</div><div class="list__pos">' +
                  escape(p.position || "") +
                  "</div></div></li>"
                );
              })
              .join("") +
            "</ul>";
      return '<div class="col-block"><h3>' + title + "</h3>" + list + "</div>";
    }

    const playerUrl = Store.playerLink(match);
    const waLink = Store.whatsappUrl(match, team);

    app.innerHTML =
      '<div class="public-panel">' +
      '<div class="public-panel__head">' +
      "<div><h2>Escalação publicada</h2>" +
      "<p>Simulação tática salva pelo técnico · " +
      escape(match.label) +
      " · " +
      escape(formLabel) +
      "</p></div>" +
      '<span class="mode-pill">Escalação publicada</span>' +
      "</div>" +
      '<div class="public-panel__body" style="padding:1rem">' +
      '<div class="card" style="margin:0 0 1rem;box-shadow:none">' +
      '<div class="section-title"><h2>Campo tático</h2>' +
      '<span class="tag">' +
      escape(formLabel) +
      "</span></div>" +
      '<div id="pitchPublic"></div></div>' +
      '<div class="lineup-cols">' +
      col("TITULARES", lineup.starters) +
      col("BANCO DE RESERVAS", lineup.bench) +
      col("COMISSÃO TÉCNICA", lineup.staff) +
      "</div></div>" +
      '<div class="public-panel__foot">Escalação da Partida - organização simples para o futebol de todos os dias</div>' +
      "</div>" +
      '<div class="card" style="margin-top:1rem">' +
      "<h2>Compartilhar escalação</h2>" +
      '<p class="muted">Link desta tela (já com a simulação publicada).</p>' +
      '<code class="share-hub__url">' +
      escape(playerUrl) +
      "</code>" +
      '<div class="share-actions">' +
      '<button type="button" class="btn btn--green" id="btnCopyPub">Copiar link</button>' +
      '<a class="btn btn--dark" href="' +
      escape(waLink) +
      '" target="_blank" rel="noopener">WhatsApp</a>' +
      "</div></div>";

    if (Pitch) {
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
            position: s.position || "",
          };
        })
      );
    }

    const btnCopy = qs("#btnCopyPub");
    if (btnCopy) {
      btnCopy.onclick = function () {
        copyText(playerUrl).then(function () {
          const prev = btnCopy.textContent;
          btnCopy.textContent = "Link copiado!";
          setTimeout(function () {
            btnCopy.textContent = prev;
          }, 1600);
        });
      };
    }
  }

  function renderSignup(team, match) {
    const playerUrl = Store.absUrl(
      "index.html?m=" + encodeURIComponent(match.slug)
    );
    const waLink =
      "https://wa.me/?text=" +
      encodeURIComponent(
        ((team && team.name) || "Epartakus") +
          " — confirma presença no próximo jogo: " +
          playerUrl
      );

    const lineupNote =
      match.lineupPublished || Store.hasStoredLineup(match.id)
        ? '<div class="alert alert--info" style="margin-bottom:1rem">Há uma escalação guardada pelo técnico. Depois que ele salvar de novo, o campo aparece aqui. Por agora você ainda pode confirmar presença.</div>'
        : "";

    app.innerHTML =
      lineupNote +
      '<div class="signup-grid">' +
      '<div class="card card--form">' +
      '<div class="card-title">' +
      '<span class="card-title__icon" aria-hidden="true">👤</span>' +
      "<div><h2>Confirme sua presença</h2>" +
      '<p class="card__lead">Preencha seus dados para entrar na lista da próxima partida.</p></div>' +
      "</div>" +
      '<label class="label">Nome completo <span class="req">*</span></label>' +
      '<input class="input" id="name" placeholder="Seu nome completo" autocomplete="name" />' +
      '<div id="posBlock">' +
      '<label class="label">Posição principal <span class="req">*</span></label>' +
      '<select class="select" id="pos1">' +
      posOptions("Selecione uma posição") +
      "</select>" +
      '<div class="pos-row">' +
      "<div><label class=\"label\">Posição secundária</label>" +
      '<select class="select" id="pos2">' +
      posOptions("Não informar") +
      "</select></div>" +
      "<div><label class=\"label\">Posição terciária</label>" +
      '<select class="select" id="pos3">' +
      posOptions("Não informar") +
      "</select></div>" +
      "</div></div>" +
      '<div class="alert alert--info hidden" id="staffInfo">Posições não são necessárias para membros da comissão técnica.</div>' +
      '<label class="check"><input type="checkbox" id="isStaff" /> Faço parte da comissão técnica</label>' +
      '<button type="button" class="btn btn--green" id="btnConfirm">' +
      '<span class="btn__check">✓</span> Confirmar presença</button>' +
      '<div id="feedback"></div>' +
      "</div>" +
      '<div class="card card--dark share-promo">' +
      '<div class="share-promo__icon" aria-hidden="true">💬</div>' +
      "<h2>Pronto para compartilhar</h2>" +
      '<p class="card__lead">Esta tela foi pensada para funcionar bem no celular. Envie o link do jogo no grupo do WhatsApp e centralize as confirmações.</p>' +
      '<div class="share-promo__hint">📱 Leva menos de um minuto para confirmar.</div>' +
      '<p class="status-dot">Inscrições abertas</p>' +
      '<label class="label" style="margin-top:1rem">Link da inscrição</label>' +
      '<code class="share-hub__url share-hub__url--dark" id="playerUrlCode">' +
      escape(playerUrl) +
      "</code>" +
      '<div class="share-actions">' +
      '<button type="button" class="btn btn--green" id="btnCopy">Copiar link</button>' +
      '<a class="btn btn--ghost" id="btnWa" href="' +
      escape(waLink) +
      '" target="_blank" rel="noopener">WhatsApp</a>' +
      "</div>" +
      "</div>" +
      "</div>";

    qs("#isStaff").onchange = function () {
      const staff = qs("#isStaff").checked;
      qs("#posBlock").classList.toggle("hidden", staff);
      qs("#staffInfo").classList.toggle("hidden", !staff);
    };

    qs("#btnCopy").onclick = function () {
      copyText(playerUrl).then(function () {
        const b = qs("#btnCopy");
        const prev = b.textContent;
        b.textContent = "Link copiado!";
        setTimeout(function () {
          b.textContent = prev;
        }, 1600);
      });
    };

    qs("#btnConfirm").onclick = async function () {
      const fb = qs("#feedback");
      fb.innerHTML = "";
      try {
        const isStaff = qs("#isStaff").checked;
        const pos1 = qs("#pos1").value;
        if (!isStaff && !pos1) {
          throw new Error("Selecione a posição principal");
        }
        const positions = isStaff
          ? []
          : [pos1, qs("#pos2").value, qs("#pos3").value].filter(Boolean);
        await Store.confirmPlayer(match.id, {
          name: qs("#name").value,
          isStaff: isStaff,
          positions: positions,
        });
        qs("#name").value = "";
        qs("#isStaff").checked = false;
        qs("#posBlock").classList.remove("hidden");
        qs("#staffInfo").classList.add("hidden");
        ["pos1", "pos2", "pos3"].forEach(function (id) {
          qs("#" + id).value = "";
        });
        fb.innerHTML =
          '<div class="alert alert--success">' +
          "<strong>✓ Presença registrada!</strong>" +
          "<span>Seu nome foi adicionado à lista. O técnico já pode organizar a escalação.</span>" +
          "</div>";
      } catch (e) {
        fb.innerHTML =
          '<div class="alert alert--err">' +
          escape(e.message || e) +
          "</div>";
      }
    };
  }

  main().catch(function (e) {
    app.innerHTML =
      '<div class="card"><div class="alert alert--err">' +
      escape(e.message || e) +
      "</div></div>";
  });
})();
