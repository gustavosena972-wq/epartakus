/**
 * Epartakus — painel do técnico
 */
(function () {
  "use strict";

  const Store = window.EpartakusStore;
  const Pitch = window.EpartakusPitch;
  const app = document.getElementById("app");
  const SESSION_KEY = "epartakus_coach_ok";

  let team = null;
  let match = null;
  let pitch = null;
  let lineupState = { starters: [], bench: [], staff: [] };
  let filterPos = "";
  let searchQ = "";
  let flashShare = false;

  function qs(sel, el) {
    return (el || document).querySelector(sel);
  }

  function qsa(sel, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(sel));
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

  function flashBtn(btn, label) {
    const prev = btn.textContent;
    btn.textContent = label || "Copiado!";
    setTimeout(function () {
      btn.textContent = prev;
    }, 1600);
  }

  function initials(name) {
    return Pitch.initials(name);
  }

  function params() {
    const u = new URL(location.href);
    return { t: u.searchParams.get("t") || "" };
  }

  function isUnlocked() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function unlock() {
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  async function main() {
    await Store.init();
    team = Store.getTeam();
    if (!team) {
      app.innerHTML =
        '<div class="card"><h2>Nenhum time</h2><p class="muted">Crie a lista na página inicial.</p>' +
        '<a class="btn btn--primary" href="index.html">Início</a></div>';
      return;
    }

    const { t } = params();
    if (t && !Store.verifyCoachToken(t)) {
      app.innerHTML =
        '<div class="card"><div class="alert alert--err">Link do técnico inválido.</div>' +
        '<a class="btn btn--soft" href="index.html">Início</a></div>';
      return;
    }

    match = Store.getActiveMatch();
    const playerUrl = match ? Store.playerLink(match) : "index.html";
    qs("#tabPlayer").href = playerUrl;
    qs("#tabCoach").href = Store.coachLink(team);

    if (!isUnlocked()) {
      renderPin();
      return;
    }
    renderPanel();
  }

  function renderPin() {
    app.innerHTML =
      '<div class="card pin-gate">' +
      '<img src="assets/shield.svg" alt="" style="width:64px;margin:0 auto .75rem" />' +
      "<h2>Acesso do técnico</h2>" +
      '<p class="muted">Digite o PIN para montar a escalação</p>' +
      '<label class="label">PIN</label>' +
      '<input class="input" id="pin" inputmode="numeric" maxlength="8" autocomplete="one-time-code" />' +
      '<div id="pinErr"></div>' +
      '<button class="btn btn--primary" id="btnPin">Entrar</button>' +
      "</div>";

    const go = async function () {
      const ok = await Store.verifyPin(qs("#pin").value.trim());
      if (!ok) {
        qs("#pinErr").innerHTML =
          '<div class="alert alert--err">PIN incorreto</div>';
        return;
      }
      unlock();
      renderPanel();
    };
    qs("#btnPin").onclick = go;
    qs("#pin").onkeydown = function (e) {
      if (e.key === "Enter") go();
    };
  }

  function loadLineupState() {
    const L = Store.getLineup(match.id);
    lineupState = {
      starters: JSON.parse(JSON.stringify(L.starters || [])),
      bench: JSON.parse(JSON.stringify(L.bench || [])),
      staff: JSON.parse(JSON.stringify(L.staff || [])),
    };
    // Marca quem não confirmou nesta lista
    lineupState.starters.forEach(markUnconfirmed);
    lineupState.bench.forEach(markUnconfirmed);
    lineupState.staff.forEach(markUnconfirmed);
  }

  function markUnconfirmed(slot) {
    slot.unconfirmed = !Store.playerConfirmed(match.id, slot.name);
  }

  function renderPanel() {
    match = Store.getActiveMatch();
    if (!match) {
      app.innerHTML =
        '<div class="card"><p class="muted">Sem jogo ativo.</p><a href="index.html">Início</a></div>';
      return;
    }
    loadLineupState();
    document.getElementById("headerSub").textContent =
      team.name + " · " + match.label;

    const k = Store.kpis(match.id);
    const playerUrl = Store.playerLink(match);
    const coachUrl = Store.coachLink(team);
    const waText = Store.whatsappShareText(match, team);
    const waLink = Store.whatsappUrl(match, team);
    const shareFlashClass = flashShare ? " share-hub--flash" : "";
    const shareBadge = flashShare
      ? '<div class="share-hub__badge">Link novo · compartilhe no grupo</div>'
      : "";
    const copyPlayerLabel = flashShare ? "Copiar link novo" : "Copiar link";
    const formations = (window.EpartakusPitch.FORMATION_ORDER || Store.FORMATIONS)
      .map(function (f) {
        const label =
          (window.EpartakusPitch.formationLabel &&
            window.EpartakusPitch.formationLabel(f)) ||
          f;
        return (
          '<option value="' +
          f +
          '"' +
          (match.formation === f ? " selected" : "") +
          ">" +
          label +
          "</option>"
        );
      })
      .join("");

    app.innerHTML =
      '<div class="coach-top">' +
      '<div class="coach-top__title"><h2>Lista de presença e escalação</h2>' +
      "<p>" +
      escape(team.name) +
      " · " +
      escape(match.label) +
      "</p></div>" +
      '<div class="coach-actions">' +
      '<button type="button" class="btn btn--outline" id="btnJumpShare">Compartilhar</button>' +
      '<button type="button" class="btn btn--primary" id="btnSaveTop">Salvar escalação</button>' +
      "</div></div>" +
      '<div class="kpis">' +
      kpi(k.confirmed, "CONFIRMADOS") +
      kpi(lineupState.starters.length, "TITULARES") +
      kpi(
        Store.getPlayers(match.id).filter(function (p) {
          return p.isStaff;
        }).length || lineupState.staff.length,
        "COMISSÃO"
      ) +
      "</div>" +
      '<div class="card share-hub' +
      shareFlashClass +
      '" id="shareHub">' +
      shareBadge +
      "<h2>Compartilhar / Links</h2>" +
      '<p class="muted" style="margin:0 0 .35rem">Tudo em um só lugar: copie o link da inscrição ou mande direto no WhatsApp do grupo.</p>' +
      '<p class="muted" style="margin:0">Status: <span class="status-dot' +
      (match.status === "published" ? " status-dot--pub" : "") +
      '">' +
      (match.status === "published"
        ? "Escalação publicada"
        : "Inscrições abertas") +
      "</span> · " +
      escape(match.label) +
      "</p>" +
      '<label class="label">Link da inscrição (jogadores)</label>' +
      '<code class="share-hub__url" id="playerUrlCode">' +
      escape(playerUrl) +
      "</code>" +
      '<div class="share-actions">' +
      '<button type="button" class="btn btn--primary" id="btnCopyPlayer">' +
      copyPlayerLabel +
      "</button>" +
      '<a class="btn btn--dark" id="btnWa" href="' +
      escape(waLink) +
      '" target="_blank" rel="noopener">Enviar no WhatsApp</a>' +
      "</div>" +
      '<p class="hint" id="waPreview">' +
      escape(waText) +
      "</p>" +
      "<details>" +
      "<summary>Link do painel do técnico (secundário)</summary>" +
      '<div class="link-row">' +
      "<code>" +
      escape(coachUrl) +
      "</code>" +
      '<p class="hint">PIN: <strong>' +
      escape(team.pin) +
      "</strong></p>" +
      '<button type="button" class="btn btn--soft btn--sm" id="btnCopyCoach">Copiar link do técnico</button>' +
      "</div></details>" +
      "</div>" +
      '<div class="coach-grid">' +
      '<div class="card">' +
      "<h2>Atletas confirmados</h2>" +
      '<div class="toolbar">' +
      '<input class="input" id="search" placeholder="Buscar atleta" />' +
      '<select class="select" id="filterPos"><option value="">Filtrar por posição</option>' +
      Store.POSITIONS.map(function (p) {
        return '<option value="' + escape(p) + '">' + escape(p) + "</option>";
      }).join("") +
      "</select></div>" +
      '<button type="button" class="link-clear" id="btnClearFilters">Limpar filtros</button>' +
      '<div id="athleteList"></div>' +
      "</div>" +
      '<div class="card">' +
      '<div class="section-title"><h2>Campo tático</h2>' +
      '<span class="tag" id="formationTag">' +
      escape(
        window.EpartakusPitch.formationLabel
          ? window.EpartakusPitch.formationLabel(match.formation || "4-3-3")
          : match.formation || "4-3-3"
      ) +
      "</span></div>" +
      '<p class="hint">Arraste os atletas para as áreas do campo ou use os controles de lista.</p>' +
      '<label class="label">Formação</label>' +
      '<select class="select" id="formation" style="max-width:100%;margin-bottom:.75rem">' +
      formations +
      "</select>" +
      '<div id="pitchEl"></div>' +
      "</div></div>" +
      '<div class="roster-2">' +
      '<div class="col-block"><h3>Jogadores titulares</h3>' +
      '<p class="col-sub">Atletas que iniciam a partida.</p>' +
      '<ul class="list" id="startersList"></ul></div>' +
      '<div class="col-block"><h3>Banco de reservas</h3>' +
      '<p class="col-sub">Opções disponíveis durante o jogo.</p>' +
      '<ul class="list" id="benchList"></ul></div>' +
      "</div>" +
      '<div class="card">' +
      '<div class="staff-save">' +
      "<div><h2>Comissão técnica</h2>" +
      '<p class="muted" style="margin:0">Equipe de apoio confirmada para a partida.</p>' +
      '<ul class="list" id="staffList" style="margin-top:.75rem"></ul></div>' +
      '<button class="btn btn--primary" id="btnSave">Salvar escalação</button>' +
      "</div>" +
      '<div id="saveMsg"></div>' +
      '<div class="btn-row" style="margin-top:.75rem">' +
      '<button type="button" class="btn btn--outline" id="btnUndo"' +
      (Store.canUndo(match.id) ? "" : " disabled") +
      ">Desfazer último salvamento</button>" +
      '<button type="button" class="btn btn--soft" id="btnReopen"' +
      (match.status === "published" ? "" : " disabled") +
      ">Reabrir inscrições</button>" +
      "</div>" +
      '<button class="btn btn--dark" id="btnNext" style="margin-top:.75rem">Nova lista / próximo jogo</button>' +
      '<p class="hint"><strong>Desfazer</strong> volta a escalação/formação anterior. <strong>Reabrir inscrições</strong> deixa a tela inicial com o formulário de presença de novo (mantém a escalação salva até você alterar). Nova lista zera a presença e atualiza o bloco Compartilhar.</p>' +
      "</div>";

    pitch = new Pitch({
      el: "#pitchEl",
      formation: match.formation || "4-3-3",
      onChange: function (players) {
        players.forEach(function (p) {
          const s = lineupState.starters.find(function (x) {
            return (
              x.name.toLowerCase() === p.name.toLowerCase() ||
              (p.playerId && x.playerId === p.playerId)
            );
          });
          if (s) {
            s.pitchX = p.x;
            s.pitchY = p.y;
          }
        });
        refreshSideLists();
      },
    });

    syncPitchFromStarters();
    renderAthletes();
    refreshSideLists();
    bindShareHub(playerUrl, coachUrl);

    if (flashShare) {
      flashShare = false;
      const hub = qs("#shareHub");
      if (hub) {
        setTimeout(function () {
          hub.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    }

    qs("#search").oninput = function () {
      searchQ = qs("#search").value.trim().toLowerCase();
      renderAthletes();
    };
    qs("#filterPos").onchange = function () {
      filterPos = qs("#filterPos").value;
      renderAthletes();
    };
    const btnClear = qs("#btnClearFilters");
    if (btnClear) {
      btnClear.onclick = function () {
        searchQ = "";
        filterPos = "";
        qs("#search").value = "";
        qs("#filterPos").value = "";
        renderAthletes();
      };
    }
    qs("#formation").onchange = async function () {
      match.formation = qs("#formation").value;
      await Store.setFormation(match.id, match.formation);
      pitch.setFormation(match.formation, { reposition: true });
      // Sync starter coords from pitch after formation change
      const fromPitch = pitch.getPlayers();
      fromPitch.forEach(function (p) {
        const s = lineupState.starters.find(function (x) {
          return x.name.toLowerCase() === p.name.toLowerCase();
        });
        if (s) {
          s.pitchX = p.x;
          s.pitchY = p.y;
        }
      });
      const tag = qs("#formationTag");
      if (tag) {
        tag.textContent = window.EpartakusPitch.formationLabel
          ? window.EpartakusPitch.formationLabel(match.formation)
          : match.formation;
      }
      refreshSideLists();
    };
    qs("#btnSave").onclick = saveAndPublish;
    const btnSaveTop = qs("#btnSaveTop");
    if (btnSaveTop) btnSaveTop.onclick = saveAndPublish;
    const btnJump = qs("#btnJumpShare");
    if (btnJump) {
      btnJump.onclick = function () {
        const hub = qs("#shareHub");
        if (hub) hub.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
    qs("#btnNext").onclick = nextMatch;
    const btnUndo = qs("#btnUndo");
    if (btnUndo) btnUndo.onclick = undoLastSave;
    const btnReopen = qs("#btnReopen");
    if (btnReopen) btnReopen.onclick = reopenInscriptions;
  }

  function bindShareHub(playerUrl, coachUrl) {
    const copyPlayer = qs("#btnCopyPlayer");
    if (copyPlayer) {
      copyPlayer.onclick = function () {
        copyText(playerUrl).then(function () {
          flashBtn(copyPlayer, "Link copiado!");
        });
      };
    }
    const copyCoach = qs("#btnCopyCoach");
    if (copyCoach) {
      copyCoach.onclick = function () {
        copyText(coachUrl).then(function () {
          flashBtn(copyCoach, "Copiado!");
        });
      };
    }
  }

  function kpi(n, label) {
    return (
      '<div class="kpi"><div class="kpi__n">' +
      n +
      '</div><div class="kpi__l">' +
      label +
      "</div></div>"
    );
  }

  function syncPitchFromStarters() {
    pitch.setPlayers(
      lineupState.starters.map(function (s, i) {
        const slots = Pitch.FORMATION_SLOTS[match.formation] || [];
        const def = slots[i] || { x: 50, y: 40 + i * 5 };
        return {
          id: s.id || "s_" + i,
          name: s.name,
          playerId: s.playerId,
          x: s.pitchX != null ? s.pitchX : def.x,
          y: s.pitchY != null ? s.pitchY : def.y,
          unconfirmed: !!s.unconfirmed,
          position: s.position || "",
        };
      })
    );
  }

  function inLineup(name) {
    const n = name.toLowerCase();
    return ["starters", "bench", "staff"].some(function (k) {
      return lineupState[k].some(function (s) {
        return s.name.toLowerCase() === n;
      });
    });
  }

  function removeFromAll(name) {
    const n = name.toLowerCase();
    ["starters", "bench", "staff"].forEach(function (k) {
      lineupState[k] = lineupState[k].filter(function (s) {
        return s.name.toLowerCase() !== n;
      });
    });
  }

  function makeSlot(p, role) {
    return {
      id: p.id || "slot_" + Date.now(),
      playerId: p.id,
      name: p.name,
      position: (p.positions && p.positions[0]) || p.position || "",
      pitchX: p.pitchX,
      pitchY: p.pitchY,
      unconfirmed: !Store.playerConfirmed(match.id, p.name),
      role: role,
    };
  }

  function addTo(role, player) {
    removeFromAll(player.name);
    const slot = makeSlot(player, role);
    if (role === "starters") {
      const slots = Pitch.FORMATION_SLOTS[match.formation] || [];
      const i = lineupState.starters.length;
      if (slot.pitchX == null && slots[i]) {
        slot.pitchX = slots[i].x;
        slot.pitchY = slots[i].y;
      } else if (slot.pitchX == null) {
        slot.pitchX = 20 + (i % 5) * 15;
        slot.pitchY = 30 + Math.floor(i / 5) * 15;
      }
      lineupState.starters.push(slot);
    } else if (role === "bench") {
      lineupState.bench.push(slot);
    } else {
      lineupState.staff.push(slot);
    }
    syncPitchFromStarters();
    refreshSideLists();
    renderAthletes();
  }

  function renderAthletes() {
    const el = qs("#athleteList");
    let list = Store.getPlayers(match.id);
    if (searchQ) {
      list = list.filter(function (p) {
        return p.name.toLowerCase().indexOf(searchQ) !== -1;
      });
    }
    if (filterPos) {
      list = list.filter(function (p) {
        return (p.positions || []).indexOf(filterPos) !== -1;
      });
    }
    if (!list.length) {
      el.innerHTML =
        '<p class="empty">Nenhum atleta confirmado nesta lista ainda.</p>';
      return;
    }
    el.innerHTML = list
      .map(function (p) {
        const used = inLineup(p.name);
        return (
          '<div class="athlete" draggable="true" data-id="' +
          escape(p.id) +
          '">' +
          '<div class="avatar' +
          (p.isStaff ? " avatar--staff" : "") +
          '">' +
          escape(initials(p.name)) +
          "</div>" +
          '<div class="list__meta"><div class="list__name">' +
          escape(p.name) +
          (used ? ' <span class="badge badge--ok">na escalação</span>' : "") +
          '</div><div class="list__pos">' +
          (p.isStaff
            ? "Comissão"
            : (p.positions || []).join(" · ") || "—") +
          "</div></div>" +
          '<div class="athlete__actions">' +
          (p.isStaff
            ? '<button type="button" data-act="staff" data-id="' +
              escape(p.id) +
              '">Staff</button>'
            : '<button type="button" data-act="starter" data-id="' +
              escape(p.id) +
              '">Titular</button>' +
              '<button type="button" data-act="bench" data-id="' +
              escape(p.id) +
              '">Banco</button>') +
          "</div></div>"
        );
      })
      .join("");

    qsa(".athlete", el).forEach(function (node) {
      node.addEventListener("dragstart", function (e) {
        const id = node.getAttribute("data-id");
        const p = Store.getPlayers(match.id).find(function (x) {
          return x.id === id;
        });
        if (!p) return;
        e.dataTransfer.setData(
          "text/epartakus-player",
          JSON.stringify({
            id: p.id,
            playerId: p.id,
            name: p.name,
            position: (p.positions && p.positions[0]) || "",
          })
        );
        e.dataTransfer.effectAllowed = "copy";
      });
    });

    qsa("[data-act]", el).forEach(function (btn) {
      btn.onclick = function (e) {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        const act = btn.getAttribute("data-act");
        const p = Store.getPlayers(match.id).find(function (x) {
          return x.id === id;
        });
        if (!p) return;
        if (act === "starter") addTo("starters", p);
        if (act === "bench") addTo("bench", p);
        if (act === "staff") addTo("staff", p);
      };
    });
  }

  function refreshSideLists() {
    fillList("#startersList", lineupState.starters, "starters");
    fillList("#benchList", lineupState.bench, "bench");
    fillList("#staffList", lineupState.staff, "staff");
    // Update KPI titulares
    const kpis = qsa(".kpi__n");
    if (kpis[1]) kpis[1].textContent = String(lineupState.starters.length);
  }

  function fillList(sel, items, role) {
    const ul = qs(sel);
    if (!items.length) {
      ul.innerHTML = '<li class="empty">Vazio</li>';
      return;
    }
    ul.innerHTML = items
      .map(function (s) {
        return (
          "<li>" +
          '<div class="avatar">' +
          escape(initials(s.name)) +
          "</div>" +
          '<div class="list__meta"><div class="list__name">' +
          escape(s.name) +
          (s.unconfirmed
            ? ' <span class="badge badge--warn">não confirmou</span>'
            : "") +
          '</div><div class="list__pos">' +
          escape(s.position || "") +
          "</div></div>" +
          '<button class="btn btn--soft btn--sm" data-rm="' +
          escape(s.name) +
          '" data-role="' +
          role +
          '">Remover</button>' +
          "</li>"
        );
      })
      .join("");

    qsa("[data-rm]", ul).forEach(function (btn) {
      btn.onclick = function () {
        const name = btn.getAttribute("data-rm");
        removeFromAll(name);
        syncPitchFromStarters();
        refreshSideLists();
        renderAthletes();
      };
    });
  }

  async function saveAndPublish() {
    // Pull latest pitch coords
    if (pitch) {
      const fromPitch = pitch.getPlayers();
      fromPitch.forEach(function (p) {
        let s = lineupState.starters.find(function (x) {
          return x.name.toLowerCase() === p.name.toLowerCase();
        });
        if (!s) {
          s = {
            id: p.id,
            playerId: p.playerId,
            name: p.name,
            position: p.position || "",
            unconfirmed: !!p.unconfirmed,
          };
          lineupState.starters.push(s);
        }
        s.pitchX = p.x;
        s.pitchY = p.y;
      });
      // Keep starters that might have been removed from pitch? Use pitch as authority for starters set
      const namesOnPitch = fromPitch.map(function (p) {
        return p.name.toLowerCase();
      });
      // If coach dragged from list onto pitch, they're in fromPitch; keep bench/staff separate
      lineupState.starters = lineupState.starters
        .filter(function (s) {
          return namesOnPitch.indexOf(s.name.toLowerCase()) !== -1;
        })
        .map(function (s) {
          const p = fromPitch.find(function (x) {
            return x.name.toLowerCase() === s.name.toLowerCase();
          });
          if (p) {
            s.pitchX = p.x;
            s.pitchY = p.y;
          }
          return s;
        });
      // Add any on pitch not in starters
      fromPitch.forEach(function (p) {
        if (
          !lineupState.starters.some(function (s) {
            return s.name.toLowerCase() === p.name.toLowerCase();
          })
        ) {
          removeFromAll(p.name);
          lineupState.starters.push({
            id: p.id,
            playerId: p.playerId,
            name: p.name,
            position: p.position || "",
            pitchX: p.x,
            pitchY: p.y,
            unconfirmed: !!p.unconfirmed,
          });
        }
      });
    }

    await Store.publishLineup(match.id, lineupState);
    match = Store.getMatchById(match.id);
    const homeUrl = Store.playerLink(match);
    qs("#saveMsg").innerHTML =
      '<div class="alert alert--ok">Escalação salva e publicada! A simulação aparece na <a href="' +
      escape(homeUrl) +
      '">tela inicial</a>. Use <em>Desfazer</em> ou <em>Reabrir inscrições</em> abaixo se precisar.</div>';
    refreshSideLists();
    const btnUndo = qs("#btnUndo");
    if (btnUndo) btnUndo.disabled = !Store.canUndo(match.id);
    const btnReopen = qs("#btnReopen");
    if (btnReopen) btnReopen.disabled = match.status !== "published";
  }

  async function undoLastSave() {
    if (
      !confirm(
        "Desfazer o último salvamento? A escalação e a formação voltam ao estado anterior. Se era a primeira publicação, a lista deixa de aparecer como publicada na tela inicial."
      )
    )
      return;
    try {
      await Store.undoLastSave(match.id);
      match = Store.getMatchById(match.id);
      qs("#saveMsg").innerHTML =
        '<div class="alert alert--ok">Último salvamento desfeito. Escalação anterior restaurada.</div>';
      renderPanel();
    } catch (e) {
      qs("#saveMsg").innerHTML =
        '<div class="alert alert--err">' +
        escape(e.message || e) +
        "</div>";
    }
  }

  async function reopenInscriptions() {
    if (
      !confirm(
        "Reabrir inscrições? A tela inicial volta a mostrar «Confirme sua presença» para atrasados. A escalação atual fica guardada até você salvar de novo."
      )
    )
      return;
    try {
      await Store.reopenInscriptions(match.id);
      match = Store.getMatchById(match.id);
      qs("#saveMsg").innerHTML =
        '<div class="alert alert--ok">Inscrições reabertas. O link de Compartilhar / WhatsApp continua o mesmo — a home mostra o formulário de novo.</div>';
      const btnReopen = qs("#btnReopen");
      if (btnReopen) btnReopen.disabled = true;
      // Refresh status dot in share hub without full redraw
      renderPanel();
    } catch (e) {
      qs("#saveMsg").innerHTML =
        '<div class="alert alert--err">' +
        escape(e.message || e) +
        "</div>";
    }
  }

  async function nextMatch() {
    if (
      !confirm(
        "Criar nova lista? Presença zera; escalação e formação atuais serão copiadas. O bloco Compartilhar atualiza com o link novo."
      )
    )
      return;
    await Store.saveLineup(match.id, lineupState);
    const next = await Store.createMatch({
      label: "Jogo " + (Store.getMatches().length + 1),
      copyFrom: match,
    });
    match = next;
    qs("#tabPlayer").href = Store.playerLink(match);
    flashShare = true;
    renderPanel();
  }

  // When dropping on pitch, also ensure starter list
  document.addEventListener(
    "drop",
    function (e) {
      if (!pitch || !match) return;
      const raw =
        e.dataTransfer && e.dataTransfer.getData("text/epartakus-player");
      if (!raw) return;
      // pitch.js handles position; sync after short tick
      setTimeout(function () {
        const fromPitch = pitch.getPlayers();
        fromPitch.forEach(function (p) {
          if (
            !lineupState.starters.some(function (s) {
              return s.name.toLowerCase() === p.name.toLowerCase();
            })
          ) {
            removeFromAll(p.name);
            lineupState.starters.push({
              id: p.id,
              playerId: p.playerId,
              name: p.name,
              position: p.position || "",
              pitchX: p.x,
              pitchY: p.y,
              unconfirmed: false,
            });
          }
        });
        // Remove from bench if now on pitch
        lineupState.bench = lineupState.bench.filter(function (b) {
          return !fromPitch.some(function (p) {
            return p.name.toLowerCase() === b.name.toLowerCase();
          });
        });
        refreshSideLists();
        renderAthletes();
      }, 30);
    },
    true
  );

  main().catch(function (e) {
    app.innerHTML =
      '<div class="card"><div class="alert alert--err">' +
      escape(e.message || e) +
      "</div></div>";
  });
})();
