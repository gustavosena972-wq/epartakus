/**
 * Epartakus — campo tático (drag & drop + touch)
 * Slots: 11 posições (GK + 10) em % do campo; y alto = defesa/próprio gol.
 */
(function (global) {
  "use strict";

  const FORMATION_SLOTS = {
    livre: [],
    "4-3-3": [
      { x: 50, y: 90 },
      { x: 14, y: 70 },
      { x: 36, y: 74 },
      { x: 64, y: 74 },
      { x: 86, y: 70 },
      { x: 26, y: 48 },
      { x: 50, y: 52 },
      { x: 74, y: 48 },
      { x: 16, y: 24 },
      { x: 50, y: 18 },
      { x: 84, y: 24 },
    ],
    "4-2-3-1": [
      { x: 50, y: 90 },
      { x: 14, y: 70 },
      { x: 36, y: 74 },
      { x: 64, y: 74 },
      { x: 86, y: 70 },
      { x: 36, y: 54 },
      { x: 64, y: 54 },
      { x: 16, y: 34 },
      { x: 50, y: 36 },
      { x: 84, y: 34 },
      { x: 50, y: 16 },
    ],
    "3-4-3": [
      { x: 50, y: 90 },
      { x: 26, y: 72 },
      { x: 50, y: 76 },
      { x: 74, y: 72 },
      { x: 12, y: 50 },
      { x: 36, y: 52 },
      { x: 64, y: 52 },
      { x: 88, y: 50 },
      { x: 18, y: 24 },
      { x: 50, y: 18 },
      { x: 82, y: 24 },
    ],
    "3-5-2": [
      { x: 50, y: 90 },
      { x: 26, y: 72 },
      { x: 50, y: 76 },
      { x: 74, y: 72 },
      { x: 10, y: 48 },
      { x: 30, y: 50 },
      { x: 50, y: 46 },
      { x: 70, y: 50 },
      { x: 90, y: 48 },
      { x: 38, y: 20 },
      { x: 62, y: 20 },
    ],
    "4-4-2": [
      { x: 50, y: 90 },
      { x: 14, y: 70 },
      { x: 36, y: 74 },
      { x: 64, y: 74 },
      { x: 86, y: 70 },
      { x: 14, y: 48 },
      { x: 36, y: 50 },
      { x: 64, y: 50 },
      { x: 86, y: 48 },
      { x: 38, y: 20 },
      { x: 62, y: 20 },
    ],
    "4-1-2-1-2": [
      { x: 50, y: 90 },
      { x: 14, y: 70 },
      { x: 36, y: 74 },
      { x: 64, y: 74 },
      { x: 86, y: 70 },
      { x: 50, y: 58 },
      { x: 30, y: 44 },
      { x: 70, y: 44 },
      { x: 50, y: 32 },
      { x: 36, y: 16 },
      { x: 64, y: 16 },
    ],
    "5-3-2": [
      { x: 50, y: 90 },
      { x: 8, y: 62 },
      { x: 28, y: 70 },
      { x: 50, y: 74 },
      { x: 72, y: 70 },
      { x: 92, y: 62 },
      { x: 26, y: 46 },
      { x: 50, y: 48 },
      { x: 74, y: 46 },
      { x: 38, y: 20 },
      { x: 62, y: 20 },
    ],
    "5-4-1": [
      { x: 50, y: 90 },
      { x: 8, y: 62 },
      { x: 28, y: 70 },
      { x: 50, y: 74 },
      { x: 72, y: 70 },
      { x: 92, y: 62 },
      { x: 14, y: 44 },
      { x: 36, y: 46 },
      { x: 64, y: 46 },
      { x: 86, y: 44 },
      { x: 50, y: 18 },
    ],
    "4-2-4": [
      { x: 50, y: 90 },
      { x: 14, y: 70 },
      { x: 36, y: 74 },
      { x: 64, y: 74 },
      { x: 86, y: 70 },
      { x: 36, y: 50 },
      { x: 64, y: 50 },
      { x: 12, y: 26 },
      { x: 36, y: 18 },
      { x: 64, y: 18 },
      { x: 88, y: 26 },
    ],
    "3-3-4": [
      { x: 50, y: 90 },
      { x: 26, y: 72 },
      { x: 50, y: 76 },
      { x: 74, y: 72 },
      { x: 26, y: 50 },
      { x: 50, y: 52 },
      { x: 74, y: 50 },
      { x: 12, y: 26 },
      { x: 36, y: 18 },
      { x: 64, y: 18 },
      { x: 88, y: 26 },
    ],
    "3-2-2-3": [
      { x: 50, y: 90 },
      { x: 26, y: 72 },
      { x: 50, y: 76 },
      { x: 74, y: 72 },
      { x: 34, y: 54 },
      { x: 66, y: 54 },
      { x: 28, y: 38 },
      { x: 72, y: 38 },
      { x: 16, y: 20 },
      { x: 50, y: 16 },
      { x: 84, y: 20 },
    ],
    "4-3-1-2": [
      { x: 50, y: 90 },
      { x: 14, y: 70 },
      { x: 36, y: 74 },
      { x: 64, y: 74 },
      { x: 86, y: 70 },
      { x: 26, y: 52 },
      { x: 50, y: 54 },
      { x: 74, y: 52 },
      { x: 50, y: 34 },
      { x: 36, y: 16 },
      { x: 64, y: 16 },
    ],
    "3-4-1-2": [
      { x: 50, y: 90 },
      { x: 26, y: 72 },
      { x: 50, y: 76 },
      { x: 74, y: 72 },
      { x: 12, y: 50 },
      { x: 36, y: 52 },
      { x: 64, y: 52 },
      { x: 88, y: 50 },
      { x: 50, y: 34 },
      { x: 36, y: 16 },
      { x: 64, y: 16 },
    ],
    "4-1-4-1": [
      { x: 50, y: 90 },
      { x: 14, y: 70 },
      { x: 36, y: 74 },
      { x: 64, y: 74 },
      { x: 86, y: 70 },
      { x: 50, y: 56 },
      { x: 14, y: 38 },
      { x: 36, y: 40 },
      { x: 64, y: 40 },
      { x: 86, y: 38 },
      { x: 50, y: 16 },
    ],
  };

  const FORMATION_LABELS = {
    livre: "Formação livre",
    "4-3-3": "4-3-3",
    "4-2-3-1": "4-2-3-1",
    "3-4-3": "3-4-3",
    "3-5-2": "3-5-2",
    "4-4-2": "4-4-2 (Linha)",
    "4-1-2-1-2": "4-4-2 (Losango / 4-1-2-1-2)",
    "5-3-2": "5-3-2",
    "5-4-1": "5-4-1",
    "4-2-4": "4-2-4",
    "3-3-4": "3-3-4",
    "3-2-2-3": "W-M (3-2-2-3)",
    "4-3-1-2": "4-3-1-2",
    "3-4-1-2": "3-4-1-2",
    "4-1-4-1": "4-1-4-1",
  };

  const FORMATION_ORDER = [
    "4-3-3",
    "4-2-3-1",
    "3-4-3",
    "3-5-2",
    "4-4-2",
    "4-1-2-1-2",
    "5-3-2",
    "5-4-1",
    "4-2-4",
    "3-3-4",
    "3-2-2-3",
    "4-3-1-2",
    "3-4-1-2",
    "4-1-4-1",
    "livre",
  ];

  function initials(name) {
    return String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  function Pitch(opts) {
    this.root =
      typeof opts.el === "string" ? document.querySelector(opts.el) : opts.el;
    this.readonly = !!opts.readonly;
    this.onChange = opts.onChange || function () {};
    this.formation = opts.formation || "4-3-3";
    this.players = [];
    this._drag = null;
    if (this.root) this._build();
  }

  Pitch.prototype._build = function () {
    this.root.innerHTML = "";
    this.root.classList.add("pitch");
    if (this.readonly) this.root.classList.add("pitch--readonly");

    const field = document.createElement("div");
    field.className = "pitch__field";
    field.innerHTML =
      '<div class="pitch__mark pitch__halfway"></div>' +
      '<div class="pitch__mark pitch__circle"></div>' +
      '<div class="pitch__mark pitch__box pitch__box--top"></div>' +
      '<div class="pitch__mark pitch__box pitch__box--bottom"></div>';
    this.field = field;
    this.root.appendChild(field);

    this.slotsLayer = document.createElement("div");
    this.slotsLayer.className = "pitch__slots";
    field.appendChild(this.slotsLayer);

    this.chipsLayer = document.createElement("div");
    this.chipsLayer.className = "pitch__chips";
    field.appendChild(this.chipsLayer);

    this._renderSlots();
    this._bindDrop();
  };

  Pitch.prototype.setFormation = function (f, opts) {
    this.formation = f || "livre";
    this._renderSlots();
    if (opts && opts.reposition && this.players.length) {
      const slots = FORMATION_SLOTS[this.formation] || [];
      this.players.forEach(function (p, i) {
        if (slots[i]) {
          p.x = slots[i].x;
          p.y = slots[i].y;
        }
      });
      this._renderChips();
      this.onChange(this.getPlayers());
    }
  };

  Pitch.prototype._renderSlots = function () {
    if (!this.slotsLayer) return;
    this.slotsLayer.innerHTML = "";
    const slots = FORMATION_SLOTS[this.formation] || [];
    slots.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = "pitch__slot";
      el.style.left = s.x + "%";
      el.style.top = s.y + "%";
      el.dataset.slot = String(i);
      el.dataset.x = String(s.x);
      el.dataset.y = String(s.y);
      this.slotsLayer.appendChild(el);
    });
  };

  Pitch.prototype.setPlayers = function (list) {
    this.players = (list || []).map((p, i) => ({
      id: p.id || "chip_" + i,
      name: p.name,
      playerId: p.playerId || null,
      x:
        typeof p.x === "number"
          ? p.x
          : typeof p.pitchX === "number"
            ? p.pitchX
            : 50,
      y:
        typeof p.y === "number"
          ? p.y
          : typeof p.pitchY === "number"
            ? p.pitchY
            : 50,
      unconfirmed: !!p.unconfirmed,
      position: p.position || "",
    }));
    this._renderChips();
  };

  Pitch.prototype.getPlayers = function () {
    return this.players.map((p) => ({
      id: p.id,
      name: p.name,
      playerId: p.playerId,
      pitchX: p.x,
      pitchY: p.y,
      x: p.x,
      y: p.y,
      position: p.position || "",
      unconfirmed: !!p.unconfirmed,
    }));
  };

  Pitch.prototype._renderChips = function () {
    if (!this.chipsLayer) return;
    this.chipsLayer.innerHTML = "";
    this.players.forEach((p) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className =
        "pitch__chip" + (p.unconfirmed ? " pitch__chip--warn" : "");
      chip.style.left = p.x + "%";
      chip.style.top = p.y + "%";
      chip.dataset.id = p.id;
      chip.title = p.name + (p.unconfirmed ? " (ainda não confirmou)" : "");
      chip.innerHTML =
        '<span class="pitch__chip-ini">' +
        initials(p.name) +
        "</span>" +
        '<span class="pitch__chip-name">' +
        escapeHtml(p.name.split(" ")[0]) +
        "</span>";
      if (!this.readonly) {
        this._bindDrag(chip, p);
      } else {
        chip.disabled = true;
      }
      this.chipsLayer.appendChild(chip);
    });
  };

  Pitch.prototype._bindDrag = function (chip, player) {
    const self = this;
    let dragging = false;

    function start(clientX, clientY, e) {
      if (e && e.cancelable) e.preventDefault();
      dragging = true;
      chip.classList.add("is-dragging");
      self._drag = { player, chip, startX: clientX, startY: clientY };
    }

    function move(clientX, clientY) {
      if (!dragging || !self._drag) return;
      const rect = self.field.getBoundingClientRect();
      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;
      x = Math.max(6, Math.min(94, x));
      y = Math.max(6, Math.min(94, y));
      player.x = Math.round(x * 10) / 10;
      player.y = Math.round(y * 10) / 10;
      chip.style.left = player.x + "%";
      chip.style.top = player.y + "%";
    }

    function end() {
      if (!dragging) return;
      dragging = false;
      chip.classList.remove("is-dragging");
      self._snapToNearestSlot(player, chip);
      self._drag = null;
      self.onChange(self.getPlayers());
    }

    chip.addEventListener("pointerdown", function (e) {
      chip.setPointerCapture(e.pointerId);
      start(e.clientX, e.clientY, e);
    });
    chip.addEventListener("pointermove", function (e) {
      move(e.clientX, e.clientY);
    });
    chip.addEventListener("pointerup", end);
    chip.addEventListener("pointercancel", end);
  };

  Pitch.prototype._snapToNearestSlot = function (player, chip) {
    const slots = FORMATION_SLOTS[this.formation] || [];
    if (!slots.length) return;
    let best = null;
    let bestD = 12;
    slots.forEach((s) => {
      const d = Math.hypot(s.x - player.x, s.y - player.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    });
    if (best) {
      player.x = best.x;
      player.y = best.y;
      chip.style.left = player.x + "%";
      chip.style.top = player.y + "%";
    }
  };

  Pitch.prototype._bindDrop = function () {
    const self = this;
    if (this.readonly || !this.field) return;

    this.field.addEventListener("dragover", function (e) {
      e.preventDefault();
    });

    this.field.addEventListener("drop", function (e) {
      e.preventDefault();
      const raw =
        e.dataTransfer && e.dataTransfer.getData("text/epartakus-player");
      if (!raw) return;
      let data;
      try {
        data = JSON.parse(raw);
      } catch (err) {
        return;
      }
      const rect = self.field.getBoundingClientRect();
      let x = ((e.clientX - rect.left) / rect.width) * 100;
      let y = ((e.clientY - rect.top) / rect.height) * 100;
      x = Math.max(6, Math.min(94, x));
      y = Math.max(6, Math.min(94, y));
      self.addPlayer({
        id: data.id || "chip_" + Date.now(),
        name: data.name,
        playerId: data.playerId || data.id,
        x: x,
        y: y,
        position: data.position || "",
        unconfirmed: !!data.unconfirmed,
      });
    });
  };

  Pitch.prototype.addPlayer = function (p) {
    const existing = this.players.find(
      (x) =>
        (p.playerId && x.playerId === p.playerId) ||
        x.name.toLowerCase() === String(p.name).toLowerCase()
    );
    if (existing) {
      existing.x = p.x;
      existing.y = p.y;
      existing.unconfirmed = !!p.unconfirmed;
    } else {
      this.players.push({
        id: p.id || "chip_" + Date.now(),
        name: p.name,
        playerId: p.playerId || null,
        x: p.x,
        y: p.y,
        position: p.position || "",
        unconfirmed: !!p.unconfirmed,
      });
    }
    this._renderChips();
    this.onChange(this.getPlayers());
  };

  Pitch.prototype.removePlayer = function (idOrName) {
    const key = String(idOrName).toLowerCase();
    this.players = this.players.filter(
      (p) => p.id !== idOrName && p.name.toLowerCase() !== key
    );
    this._renderChips();
    this.onChange(this.getPlayers());
  };

  Pitch.prototype.clear = function () {
    this.players = [];
    this._renderChips();
    this.onChange(this.getPlayers());
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  Pitch.FORMATION_SLOTS = FORMATION_SLOTS;
  Pitch.FORMATION_LABELS = FORMATION_LABELS;
  Pitch.FORMATION_ORDER = FORMATION_ORDER;
  Pitch.formationLabel = function (id) {
    return FORMATION_LABELS[id] || id || "Formação livre";
  };
  Pitch.initials = initials;

  global.EpartakusPitch = Pitch;
})(window);
