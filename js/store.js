/**
 * Epartakus — storage abstraction
 * Default: localStorage. Firebase Firestore when config is ready.
 */
(function (global) {
  "use strict";

  const LS_KEY = "epartakus_v1";
  const POSITIONS = [
    "Goleiro",
    "Zagueiro",
    "Lateral",
    "Volante",
    "Meia",
    "Ponta",
    "Atacante",
  ];
  const FORMATIONS = ["livre", "4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "5-3-2"];
  const DEFAULT_PIN = "1234";

  function uid(prefix) {
    return (
      (prefix || "id") +
      "_" +
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36).slice(-4)
    );
  }

  function slugify(n) {
    return (
      String(n || "jogo")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 24) || "jogo"
    );
  }

  function emptyDb() {
    return { teams: {}, matches: {}, players: {}, lineups: {}, meta: {} };
  }

  /* ---------- LocalStorage adapter ---------- */
  const LocalAdapter = {
    async load() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return emptyDb();
        return Object.assign(emptyDb(), JSON.parse(raw));
      } catch (e) {
        console.warn("localStorage load failed", e);
        return emptyDb();
      }
    },
    async save(db) {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    },
  };

  /* ---------- Firebase adapter (optional) ---------- */
  const FirebaseAdapter = {
    _db: null,
    _ready: false,
    async init() {
      if (this._ready) return;
      if (!global.epartakusFirebaseReady || !global.epartakusFirebaseReady()) {
        throw new Error("Firebase não configurado");
      }
      // Expect firebase compat SDK loaded on page when USE_FIREBASE
      if (!global.firebase) {
        throw new Error("SDK Firebase não carregado");
      }
      if (!global.firebase.apps.length) {
        global.firebase.initializeApp(global.EPARTAKUS_FIREBASE);
      }
      this._db = global.firebase.firestore();
      this._ready = true;
    },
    async load() {
      await this.init();
      const snap = await this._db.collection("_epartakus").doc("state").get();
      if (!snap.exists) return emptyDb();
      return Object.assign(emptyDb(), snap.data());
    },
    async save(db) {
      await this.init();
      await this._db.collection("_epartakus").doc("state").set(db);
    },
  };

  function getAdapter() {
    if (global.epartakusFirebaseReady && global.epartakusFirebaseReady()) {
      return FirebaseAdapter;
    }
    return LocalAdapter;
  }

  /* ---------- Store API ---------- */
  const Store = {
    POSITIONS,
    FORMATIONS,
    DEFAULT_PIN,
    _db: null,
    _adapter: null,
    mode: "local",

    async init() {
      this._adapter = getAdapter();
      this.mode =
        this._adapter === FirebaseAdapter ? "firebase" : "localStorage";
      this._db = await this._adapter.load();
      return this;
    },

    async persist() {
      await this._adapter.save(this._db);
    },

    getTeam() {
      const id = this._db.meta.teamId;
      return id ? this._db.teams[id] : null;
    },

    getMatches() {
      const team = this.getTeam();
      if (!team) return [];
      return Object.values(this._db.matches)
        .filter((m) => m.teamId === team.id)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    },

    getActiveMatch() {
      const id = this._db.meta.activeMatchId;
      if (id && this._db.matches[id]) return this._db.matches[id];
      const list = this.getMatches();
      return list[0] || null;
    },

    getMatchBySlug(slug) {
      return Object.values(this._db.matches).find((m) => m.slug === slug) || null;
    },

    getMatchById(id) {
      return this._db.matches[id] || null;
    },

    getPlayers(matchId) {
      return (this._db.players[matchId] || []).slice().sort((a, b) => {
        if (a.isStaff !== b.isStaff) return a.isStaff ? 1 : -1;
        return (a.confirmedAt || 0) - (b.confirmedAt || 0);
      });
    },

    getLineup(matchId) {
      const L = this._db.lineups[matchId];
      if (L) {
        return {
          starters: L.starters || [],
          bench: L.bench || [],
          staff: L.staff || [],
        };
      }
      return { starters: [], bench: [], staff: [] };
    },

    async bootstrapTeam(opts) {
      opts = opts || {};
      const name = opts.name || "Epartakus";
      const pin = opts.pin || DEFAULT_PIN;
      const teamId = uid("team");
      const coachToken = uid("coach");
      const team = {
        id: teamId,
        name,
        pin: String(pin),
        coachToken,
        createdAt: Date.now(),
      };
      this._db.teams[teamId] = team;
      this._db.meta.teamId = teamId;
      const match = await this.createMatch({
        teamId,
        label: "Jogo 1",
        copyFrom: null,
      });
      await this.persist();
      return { team, match };
    },

    async createMatch(opts) {
      opts = opts || {};
      const team = this.getTeam();
      const teamId = opts.teamId || (team && team.id);
      if (!teamId) throw new Error("Time não encontrado");

      const n = this.getMatches().length + 1;
      const label = opts.label || "Jogo " + n;
      const baseSlug = slugify(label) + "-" + Math.random().toString(36).slice(2, 6);
      const matchId = uid("match");
      const prev = opts.copyFrom || this.getActiveMatch();

      const match = {
        id: matchId,
        teamId,
        slug: baseSlug,
        status: "open",
        formation: (prev && prev.formation) || "4-3-3",
        label,
        publishedAt: null,
        createdAt: Date.now(),
        previousMatchId: prev ? prev.id : null,
      };

      this._db.matches[matchId] = match;
      this._db.players[matchId] = [];

      // Herda escalação / formação do jogo anterior
      if (prev) {
        const prevLineup = this.getLineup(prev.id);
        this._db.lineups[matchId] = {
          starters: JSON.parse(JSON.stringify(prevLineup.starters || [])),
          bench: JSON.parse(JSON.stringify(prevLineup.bench || [])),
          staff: JSON.parse(JSON.stringify(prevLineup.staff || [])),
        };
        match.formation = prev.formation || match.formation;
      } else {
        this._db.lineups[matchId] = { starters: [], bench: [], staff: [] };
      }

      this._db.meta.activeMatchId = matchId;
      await this.persist();
      return match;
    },

    async confirmPlayer(matchId, data) {
      const match = this._db.matches[matchId];
      if (!match) throw new Error("Jogo não encontrado");
      if (match.status === "closed") throw new Error("Lista fechada");

      const name = String(data.name || "").trim();
      if (!name) throw new Error("Informe o nome");

      const list = this._db.players[matchId] || [];
      const existing = list.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        existing.isStaff = !!data.isStaff;
        existing.positions = data.isStaff ? [] : data.positions || [];
        existing.confirmedAt = Date.now();
        await this.persist();
        return existing;
      }

      const player = {
        id: uid("pl"),
        name,
        isStaff: !!data.isStaff,
        positions: data.isStaff ? [] : data.positions || [],
        confirmedAt: Date.now(),
      };
      list.push(player);
      this._db.players[matchId] = list;
      await this.persist();
      return player;
    },

    async setFormation(matchId, formation) {
      const m = this._db.matches[matchId];
      if (!m) return;
      m.formation = formation;
      await this.persist();
    },

    async saveLineup(matchId, lineup) {
      this._db.lineups[matchId] = {
        starters: lineup.starters || [],
        bench: lineup.bench || [],
        staff: lineup.staff || [],
      };
      await this.persist();
    },

    async publishLineup(matchId, lineup) {
      if (lineup) await this.saveLineup(matchId, lineup);
      const m = this._db.matches[matchId];
      if (!m) throw new Error("Jogo não encontrado");
      m.status = "published";
      m.publishedAt = Date.now();
      await this.persist();
      return m;
    },

    async verifyPin(pin) {
      const team = this.getTeam();
      if (!team) return false;
      return String(pin) === String(team.pin);
    },

    verifyCoachToken(token) {
      const team = this.getTeam();
      return team && team.coachToken === token;
    },

    async resetDemo() {
      this._db = emptyDb();
      await this.persist();
    },

    kpis(matchId) {
      const players = this.getPlayers(matchId);
      const lineup = this.getLineup(matchId);
      return {
        confirmed: players.filter((p) => !p.isStaff).length,
        starters: (lineup.starters || []).length,
        staff:
          players.filter((p) => p.isStaff).length ||
          (lineup.staff || []).length,
        bench: (lineup.bench || []).length,
        total: players.length,
      };
    },

    playerConfirmed(matchId, name) {
      if (!name) return false;
      const n = name.toLowerCase();
      return this.getPlayers(matchId).some((p) => p.name.toLowerCase() === n);
    },

    findPlayerByName(matchId, name) {
      if (!name) return null;
      const n = name.toLowerCase();
      return this.getPlayers(matchId).find((p) => p.name.toLowerCase() === n) || null;
    },

    publicBase() {
      const configured = String(global.EPARTAKUS_PUBLIC_BASE || "").replace(
        /\/$/,
        ""
      );
      if (location.protocol === "http:" || location.protocol === "https:") {
        try {
          return location.href.replace(/[^/]*$/, "").replace(/\/$/, "");
        } catch (e) {
          /* fall through */
        }
      }
      return configured;
    },

    absUrl(path) {
      const base = this.publicBase() + "/";
      try {
        return new URL(path, base).href;
      } catch (e) {
        return path;
      }
    },

    playerLink(match) {
      return this.absUrl("j.html?m=" + encodeURIComponent(match.slug));
    },

    coachLink(team) {
      return this.absUrl(
        "coach.html?t=" + encodeURIComponent(team.coachToken)
      );
    },

    whatsappShareText(match, team) {
      const link = this.playerLink(match);
      const tname = (team && team.name) || "Epartakus";
      return tname + " — confirma presença no próximo jogo: " + link;
    },

    whatsappUrl(match, team) {
      return (
        "https://wa.me/?text=" +
        encodeURIComponent(this.whatsappShareText(match, team))
      );
    },
  };

  global.EpartakusStore = Store;
})(window);
