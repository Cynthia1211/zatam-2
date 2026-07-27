(function () {
  const e = React.createElement;
  const STORAGE_KEY = "zatam-ladders-snakes-react-zim";
  const LEADERBOARD_KEY = "zatam-ladders-snakes-leaderboard";
  const ASSET_ROOT = "";
  const LEADERBOARD_ENDPOINT = window.ZATAM_LEADERBOARD_ENDPOINT || "";
  const BOARD_MARGIN = 13;
  const BOARD_CELL = (900 - BOARD_MARGIN * 2) / 10;
  const BOARD_ASSETS = {
    sa: "assets/board.png",
    en: "assets/board english.png"
  };
  const TOKEN_ASSETS = ["assets/player-kid0.png", "assets/player-kid1.png", "assets/player-kid2.jpg"];
  const TOKEN_COLORS = ["#1479e8", "#ef3758", "#6bd61f"];

  const snakes = { 29: 10, 37: 5, 61: 23, 67: 35, 93: 52, 98: 64 };
  const ladders = { 10: 30, 16: 35, 20: 42, 28: 48, 44: 57, 72: 92, 76: 95 };
  const devanagariDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  const sanskritNames = [
    "shoonya", "ekaM", "dvi", "triiNi", "chatvaari", "paJNcha", "shhaD.h", "sapta", "ashhTa", "nava",
    "dasha", "ekaadasha", "dvaadasha", "trayodasha", "chaturdasha", "paJNchadasha", "shhoDasha", "saptadasha", "ashhTaadasha", "navadasha",
    "vi.nshati", "ekavi.nshati", "dvaavi.nshati", "trayovi.nshati", "chaturvi.nshati", "paJNchavi.nshati", "shhaD.hvi.nshati", "saptavi.nshati", "ashhTaavi.nshati", "navavi.nshati",
    "tri.nshat.h", "ekatri.nshat.h", "dvaatri.nshat.h", "tryastri.nshat.h", "chatustri.nshat.h", "paJNchatri.nshat.h", "shhaD.htri.nshat.h", "saptatri.nshat.h", "ashhTaatri.nshat.h", "navatri.nshat.h",
    "chatvaari.nshat.h", "ekachatvaari.nshat.h", "dvichatvaari.nshat.h", "trichatvaari.nshat.h", "chatushchatvaari.nshat.h", "paJNchachatvaari.nshat.h", "shhaT.hchatvaari.nshat.h", "saptachatvaari.nshat.h", "ashhTachatvaari.nshat.h", "navachatvaari.nshat.h",
    "paJNchaashat.h", "ekapaJNchaashat.h", "dvipaJNchaashat.h", "tripaJNchaashat.h", "chatuHpaJNchaashat.h", "paJNchapaJNchaashat.h", "shhaD.hpaJNchaashat.h", "saptapaJNchaashat.h", "ashhTapaJNchaashat.h", "navapaJNchaashat.h",
    "shhashhTi", "ekashhashhTi", "dvishhashhTi", "trishhashhTi", "chatuHshhashhTi", "paJNchashhashhTi", "shhaD.hshhashhTi", "saptashhashhTi", "ashhTashhashhTi", "navashhashhTi",
    "saptati", "ekasaptati", "dvisaptati", "tryaHsaptati", "chatuHsaptati", "paJNchasaptati", "shhaD.hsaptati", "saptasaptati", "ashhTasaptati", "navasaptati",
    "ashiiti", "ekaashiiti", "dvyashiiti", "tryashiiti", "chaturashiiti", "paJNchaashiiti", "shhaD.hashiiti", "saptaashiiti", "ashhTaashiiti", "navaashiiti",
    "navati", "ekanavati", "dvinavati", "trinavati", "chaturnavati", "paJNchanavati", "shhaD.hnavati", "saptanavati", "ashhTanavati", "navanavati", "shatam.h"
  ];

  function createMatchId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const initialGame = {
    matchId: createMatchId(),
    positions: [0, 0],
    currentPlayer: 0,
    dice: 1,
    moves: 0,
    busy: false,
    winner: null,
    matchMode: "computer",
    language: "sa",
    sound: true,
    message: "Player 1 turn. Roll the dice and listen for the Sanskrit number."
  };

  function playersForMode(mode) {
    if (mode === "three") {
      return [
        { name: "Player 1", image: "./assets/player-kid0.png", computer: false },
        { name: "Player 2", image: "./assets/player-kid1.png", computer: false },
        { name: "Player 3", image: "./assets/player-kid2.jpg", computer: false }
      ];
    }

    if (mode === "two") {
      return [
        { name: "Player 1", image: "./assets/player-kid0.png", computer: false },
        { name: "Player 2", image: "./assets/player-kid1.png", computer: false }
      ];
    }

    return [
      { name: "You", image: "./assets/player-kid0.png", computer: false },
      { name: "Computer", image: "./assets/player-kid1.png", computer: true }
    ];
  }

  function freshGame(matchMode, sound, language) {
    const playerCount = playersForMode(matchMode).length;
    return {
      ...initialGame,
      matchId: createMatchId(),
      matchMode,
      sound,
      language,
      positions: Array(playerCount).fill(0),
      message: language === "sa"
        ? "प्रथमक्रीडकस्य क्रमः। अक्षं पातय।"
        : `${playersForMode(matchMode)[0].name}'s turn. Roll the dice.`
    };
  }

  function toDevanagari(number) {
    return String(number).split("").map((digit) => devanagariDigits[Number(digit)]).join("");
  }

  function labelFor(number, language) {
    if (!number) return language === "sa" ? "आरम्भः" : "Start";
    return language === "sa" ? toDevanagari(number) : String(number);
  }

  function makeMessage(kind, data, language) {
    const copy = {
      en: {
        roll: `${data.name} rolled ${data.dice}.`,
        ladder: `Great climb! ${data.name} found a ladder from ${data.from} to ${data.to}.`,
        snake: `Slide time. ${data.name} moved from ${data.from} to ${data.to}.`,
        win: `${data.name} reached 100 in ${data.moves} moves!`,
        exact: `${data.name} needs the exact number to reach 100.`,
        turn: `${data.name}'s turn. Roll the dice.`
      },
      sa: {
        roll: `${data.name} ${toDevanagari(data.dice)} अक्षं अपातयत्।`,
        ladder: `सोपानम्! ${data.name} ${toDevanagari(data.from)} तः ${toDevanagari(data.to)} पर्यन्तम् अगच्छत्।`,
        snake: `सर्पः! ${data.name} ${toDevanagari(data.from)} तः ${toDevanagari(data.to)} पर्यन्तम् अपतत्।`,
        win: `${data.name} ${toDevanagari(100)} प्राप्तवान्। जयः!`,
        exact: `${data.name} ${toDevanagari(100)} प्राप्तुं सम्यक् संख्या इच्छति।`,
        turn: `${data.name} क्रमः। अक्षं पातय।`
      }
    };
    return copy[language][kind];
  }

  function usePersistentState() {
    const [game, setGame] = React.useState(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        const matchMode = saved.matchMode || initialGame.matchMode;
        const playerCount = playersForMode(matchMode).length;
        const savedPositions = Array.isArray(saved.positions) ? saved.positions : [];

        return {
          ...initialGame,
          ...saved,
          matchId: saved.matchId || createMatchId(),
          matchMode,
          positions: Array.from({ length: playerCount }, (_, index) => savedPositions[index] || 0),
          currentPlayer: Math.min(saved.currentPlayer || 0, playerCount - 1),
          busy: false
        };
      } catch (error) {
        return initialGame;
      }
    });

    React.useEffect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...game, busy: false }));
    }, [game]);

    return [game, setGame];
  }

  async function syncScore(entry) {
    if (typeof window.ZATAM_FIREBASE_SCORE_UPLOAD === "function") {
      await window.ZATAM_FIREBASE_SCORE_UPLOAD({
        gameId: "laddersSnakes",
        gameName: "Ladders & Snakes",
        score: Math.max(10000 - entry.moves * 100, 1000),
        ...entry
      });
      return;
    }

    if (LEADERBOARD_ENDPOINT) {
      await fetch(LEADERBOARD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "laddersSnakes",
          gameName: "Ladders & Snakes",
          score: Math.max(10000 - entry.moves * 100, 1000),
          ...entry
        })
      });
    }
  }

  async function fetchRemoteLeaderboard() {
    if (!LEADERBOARD_ENDPOINT) return [];
    const response = await fetch(`${LEADERBOARD_ENDPOINT}?gameId=laddersSnakes`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : data.scores || [];
  }

  class ZimBoard {
    constructor(containerId, onReady) {
      this.containerId = containerId;
      this.onReady = onReady;
      this.frame = null;
      this.stage = null;
      this.tokens = [];
      this.ready = false;
      this.fallbackCanvas = null;
      this.fallbackImages = {};
      this.lastFallbackPositions = [0, 0];
      this.lastFallbackLanguage = "sa";
      this.currentLanguage = "sa";
      this.init();
    }

    init() {
      const assets = [
        BOARD_ASSETS.sa,
        BOARD_ASSETS.en,
        ...TOKEN_ASSETS
      ];

      if (!window.zim || !window.Frame) {
        this.initFallback();
        return;
      }

      try {
        this.frame = new Frame(this.containerId, 900, 900, "#fffaf1", "#d6eef8", null, assets, ASSET_ROOT);
        this.frame.on("ready", () => {
          this.stage = this.frame.stage;
          try {
            this.drawZim("sa");
            this.ready = true;
            this.onReady();
          } catch (error) {
            this.initFallback();
          }
        });
      } catch (error) {
        this.initFallback();
      }
    }

    initFallback() {
      const holder = document.getElementById(this.containerId);
      holder.innerHTML = "";
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 900;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      holder.appendChild(canvas);
      this.fallbackCanvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.preloadFallbackImages();
      this.ready = true;
      this.drawFallback([0, 0], "sa");
      this.onReady();
    }

    preloadFallbackImages() {
      const imageSources = {
        boardSa: `${ASSET_ROOT}${BOARD_ASSETS.sa}`,
        boardEn: `${ASSET_ROOT}${BOARD_ASSETS.en}`,
        token0: `${ASSET_ROOT}${TOKEN_ASSETS[0]}`,
        token1: `${ASSET_ROOT}${TOKEN_ASSETS[1]}`,
        token2: `${ASSET_ROOT}${TOKEN_ASSETS[2]}`
      };

      Object.entries(imageSources).forEach(([key, source]) => {
        const image = new Image();
        image.onload = () => this.drawFallback(this.lastFallbackPositions, this.lastFallbackLanguage);
        image.src = source;
        this.fallbackImages[key] = image;
      });
    }

    drawZim(language) {
      this.currentLanguage = language;
      const stage = this.stage;
      stage.removeAllChildren();
      const boardAsset = this.frame.asset(BOARD_ASSETS[language] || BOARD_ASSETS.sa);
      const board = boardAsset.sca(900 / boardAsset.width).center(stage);
      board.alp(0.98);

      this.addBoardSparkles();
      this.tokens = TOKEN_ASSETS.map((asset, index) => this.makeToken(asset, TOKEN_COLORS[index], index));
      stage.update();
    }

    addBoardSparkles() {
      [...Object.keys(ladders), ...Object.keys(snakes)].map(Number).forEach((position, index) => {
        const point = this.cellCenter(position);
        const sparkle = new Circle(10, ladders[position] ? "#f7c548" : "#ffffff").loc(point.x, point.y).addTo(this.stage);
        sparkle.alp(0.6).animate({
          props: { scale: 1.8, alpha: 0.12 },
          time: 1.2 + index * 0.05,
          loop: true,
          rewind: true,
          ease: "sineInOut"
        });
      });
    }

    makeToken(assetName, color, index) {
      const token = new Container(100, 110).addTo(this.stage);
      new Circle(42, color).center(token).alp(0.92);
      new Circle(48, "#ffffff").center(token).alp(0.38);
      const asset = this.frame.asset(assetName);
      const tokenArt = asset.clone().center(token);
      tokenArt.sca(Math.min(84 / tokenArt.width, 94 / tokenArt.height));
      token.reg(50, 55);
      token.loc(45 + index * 42, 858);
      token.animate({ props: { scale: 1.07 }, time: 0.7, loop: true, rewind: true, ease: "sineInOut" });
      return token;
    }

    cellCenter(position) {
      if (position <= 0) return { x: BOARD_MARGIN + BOARD_CELL / 2, y: 900 - BOARD_MARGIN - BOARD_CELL / 2 };
      const zero = position - 1;
      const rowFromBottom = Math.floor(zero / 10);
      const colInRow = zero % 10;
      const col = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
      return {
        x: BOARD_MARGIN + col * BOARD_CELL + BOARD_CELL / 2,
        y: 900 - BOARD_MARGIN - rowFromBottom * BOARD_CELL - BOARD_CELL / 2
      };
    }

    update(positions, language) {
      if (!this.ready) return;
      if (this.fallbackCanvas) {
        this.drawFallback(positions, language);
        return;
      }
      if (language !== this.currentLanguage) {
        this.drawZim(language);
      }
      this.tokens.forEach((token, index) => {
        token.visible = index < positions.length;
      });
      positions.forEach((position, index) => {
        if (!this.tokens[index]) return;
        const point = this.cellCenter(position);
        this.tokens[index].animate({
          props: { x: point.x + index * 20 - 10, y: point.y - 4 },
          time: 0.5,
          ease: "backOut"
        });
      });
      this.stage.update();
    }

    drawFallback(positions, language) {
      this.lastFallbackPositions = positions;
      this.lastFallbackLanguage = language;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, 900, 900);
      this.drawFallbackBoard(ctx, language);
      positions.forEach((position, index) => {
        const p = this.cellCenter(position);
        const image = this.fallbackImages[`token${index}`];
        ctx.beginPath();
        ctx.fillStyle = TOKEN_COLORS[index] || "#2962c5";
        ctx.arc(p.x + index * 20 - 10, p.y - 2, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath();
        ctx.arc(p.x + index * 20 - 10, p.y - 2, 38, 0, Math.PI * 2);
        ctx.fill();

        if (image?.complete && image.naturalWidth) {
          const size = 58;
          ctx.drawImage(image, p.x + index * 20 - 10 - size / 2, p.y - 2 - size / 2, size, size);
        } else {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 22px Arial";
          ctx.fillText(String(index + 1), p.x + index * 20 - 8, p.y + 8);
        }
      });
    }

    drawFallbackBoard(ctx, language) {
      const board = language === "en" ? this.fallbackImages.boardEn : this.fallbackImages.boardSa;
      if (board?.complete && board.naturalWidth) {
        ctx.drawImage(board, 0, 0, 900, 900);
        return;
      }

      ctx.fillStyle = "#d9f3ff";
      ctx.fillRect(0, 0, 900, 900);
      ctx.fillStyle = "#263238";
      ctx.font = "bold 34px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Loading board...", 450, 450);
      ctx.textAlign = "start";
    }
  }

  function App() {
    const [game, setGame] = usePersistentState();
    const [showHelp, setShowHelp] = React.useState(false);
    const [pendingMode, setPendingMode] = React.useState(null);
    const [boardReady, setBoardReady] = React.useState(false);
    const [leaderboard, setLeaderboard] = React.useState(() => {
      try {
        return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
      } catch (error) {
        return [];
      }
    });
    const boardRef = React.useRef(null);

    React.useEffect(() => {
      boardRef.current = new ZimBoard("zimBoard", () => setBoardReady(true));
    }, []);

    React.useEffect(() => {
      boardRef.current?.update(game.positions, game.language);
    }, [game.positions, game.language, boardReady]);

    React.useEffect(() => {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    }, [leaderboard]);

    React.useEffect(() => {
      fetchRemoteLeaderboard()
        .then((rows) => {
          if (rows.length) {
            setLeaderboard(rows.sort((a, b) => a.moves - b.moves).slice(0, 5));
          }
        })
        .catch(() => {});
    }, []);

    function playNumber(position) {
      if (!game.sound || position < 1 || position > 100) return;
      const audio = new Audio(`${ASSET_ROOT}assets/${position}.mp3.mp3`);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    }

    function finishTurn(playerIndex, nextPosition, dice, extraMessage) {
      setGame((current) => {
        const players = playersForMode(current.matchMode);
        const positions = [...current.positions];
        positions[playerIndex] = nextPosition;
        const winner = nextPosition === 100 ? playerIndex : null;
        const nextPlayer = winner !== null ? playerIndex : (playerIndex + 1) % players.length;
        const name = players[playerIndex]?.name || `Player ${playerIndex + 1}`;
        const moves = current.moves + 1;
        const message = winner !== null
          ? makeMessage("win", { name, moves }, current.language)
          : extraMessage || makeMessage("turn", { name: players[nextPlayer]?.name || `Player ${nextPlayer + 1}` }, current.language);

        if (winner !== null && !players[winner]?.computer) {
          const now = new Date();
          const scoreDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          const entry = {
            id: `laddersSnakes-${current.matchId}`,
            matchId: current.matchId,
            name,
            moves,
            date: now.toLocaleDateString(),
            scoreDate
          };
          setLeaderboard((rows) => [entry, ...rows.filter((row) => row.id !== entry.id)]
            .sort((a, b) => a.moves - b.moves)
            .slice(0, 5));
          syncScore(entry).catch(() => {});
        }

        return { ...current, positions, currentPlayer: nextPlayer, dice, moves, winner, busy: false, message };
      });
      playNumber(nextPosition);
    }

    function showLanding(playerIndex, landingPosition, dice, message) {
      setGame((current) => {
        const positions = [...current.positions];
        positions[playerIndex] = landingPosition;
        return { ...current, positions, dice, busy: true, message };
      });
      playNumber(landingPosition);
    }

    function rollDice(forcedPlayer) {
      if (game.busy || game.winner !== null || !boardReady) return;
      const playerIndex = typeof forcedPlayer === "number" ? forcedPlayer : game.currentPlayer;
      const players = playersForMode(game.matchMode);
      const dice = Math.ceil(Math.random() * 6);
      const name = players[playerIndex]?.name || `Player ${playerIndex + 1}`;
      const landing = game.positions[playerIndex] + dice;
      let message = makeMessage("roll", { name, dice }, game.language);

      setGame((current) => ({ ...current, busy: true, dice, message }));

      window.setTimeout(() => {
        if (landing > 100) {
          finishTurn(playerIndex, game.positions[playerIndex], dice, makeMessage("exact", { name }, game.language));
          return;
        }

        showLanding(playerIndex, landing, dice, message);

        window.setTimeout(() => {
          let next = landing;
          let specialMessage = "";
          if (ladders[landing]) {
            specialMessage = makeMessage("ladder", { name, from: landing, to: ladders[landing] }, game.language);
            next = ladders[landing];
          } else if (snakes[landing]) {
            specialMessage = makeMessage("snake", { name, from: landing, to: snakes[landing] }, game.language);
            next = snakes[landing];
          }

          finishTurn(playerIndex, next, dice, specialMessage);
        }, ladders[landing] || snakes[landing] ? 760 : 120);
      }, 380);
    }

    React.useEffect(() => {
      const activePlayer = playersForMode(game.matchMode)[game.currentPlayer];
      if (activePlayer?.computer && !game.busy && game.winner === null && boardReady) {
        const timer = window.setTimeout(() => rollDice(game.currentPlayer), 950);
        return () => window.clearTimeout(timer);
      }
    }, [game.currentPlayer, game.busy, game.winner, game.matchMode, boardReady]);

    function restart() {
      setGame(freshGame(game.matchMode, game.sound, game.language));
    }

    function changeMode(matchMode) {
      const hasProgress = game.moves > 0 || game.positions.some((position) => position > 0);
      if (matchMode === game.matchMode) return;
      if (hasProgress && game.winner === null) {
        setPendingMode(matchMode);
        return;
      }
      setGame(freshGame(matchMode, game.sound, game.language));
    }

    function confirmModeChange() {
      if (!pendingMode) return;
      setGame(freshGame(pendingMode, game.sound, game.language));
      setPendingMode(null);
    }

    const players = playersForMode(game.matchMode);
    const activePlayer = players[game.currentPlayer] || players[0];
    const canRoll = !activePlayer?.computer && !game.busy && game.winner === null && boardReady;
    const fireworkDots = Array.from({ length: 30 }, (_, index) => index);

    return e("main", { className: "appShell" },
      e("div", { className: "animatedBackdrop", "aria-hidden": "true" },
        e("span", null),
        e("span", null),
        e("span", null),
        e("span", null)
      ),
      game.winner !== null && e("div", { className: "fireworks", "aria-hidden": "true" },
        fireworkDots.map((dot) => e("span", { key: dot, style: { "--i": dot } }))
      ),
      e("header", { className: "topBar" },
        e("div", { className: "brand" },
          e("img", { src: "./assets/player-kid0.png", alt: "" }),
          e("div", null,
            e("h1", null, game.language === "sa" ? "सोपानसर्पाः" : "Snakes & Ladder"),
            e("p", null, game.language === "sa" ? "अक्षं पातय, शतं प्राप्नुहि।" : "Roll the dice and reach the top!")
          )
        ),
        e("div", { className: "topActions" },
          e("a", { className: "homeBtn", href: "../../index.html", title: "Back to homepage" }, game.language === "sa" ? "à¤—à¥ƒà¤¹à¤®à¥" : "Home"),
          e("div", { className: "segmented", "aria-label": "Language" },
            e("button", { className: game.language === "sa" ? "active" : "", onClick: () => setGame((g) => ({ ...g, language: "sa" })) }, "संस्कृतम्"),
            e("button", { className: game.language === "en" ? "active" : "", onClick: () => setGame((g) => ({ ...g, language: "en" })) }, "English")
          ),
          e("button", { className: "iconBtn", title: "Sound", onClick: () => setGame((g) => ({ ...g, sound: !g.sound })) }, game.sound ? "🔊" : "🔇"),
          e("button", { className: "iconBtn", title: "Help", onClick: () => setShowHelp(true) }, "?")
        )
      ),
      e("section", { className: "modeDock", "aria-label": "Match mode" },
        [
          ["computer", game.language === "sa" ? "गणकेन सह" : "Vs Computer"],
          ["two", game.language === "sa" ? "२ क्रीडकौ" : "2 VS 2"],
          ["three", game.language === "sa" ? "३ क्रीडकाः" : "3 VS 3"]
        ].map(([mode, label]) => e("button", {
          key: mode,
          className: game.matchMode === mode ? "modeBtn active" : "modeBtn",
          onClick: () => changeMode(mode)
        }, label))
      ),
      e("section", { className: "gameLayout" },
        e("div", { className: "boardWrap", "aria-label": "Snake and ladder board" },
          e("img", { className: "boardPreview", src: `./${BOARD_ASSETS[game.language] || BOARD_ASSETS.sa}`, alt: "" }),
          e("div", { id: "zimBoard" })
        ),
        e("aside", { className: "sidePanel" },
          e("section", { className: "panelBlock turnCard" },
            e("h2", null, game.language === "sa" ? "क्रमः" : `${activePlayer.name}'s Turn`),
            e("p", { className: "statusText" }, game.message),
            e("button", {
              className: `diceBtn ${game.busy ? "rolling" : ""}`,
              disabled: !canRoll,
              onClick: () => rollDice(game.currentPlayer)
            },
              e("img", {
                className: "diceArt",
                src: "./assets/dice.gif",
                alt: "Dice"
              }),
              e("b", { className: "diceValue" }, labelFor(game.dice, game.language)),
              e("span", null, game.busy ? (game.language === "sa" ? "चलति" : "Rolling") : (game.language === "sa" ? "पातय" : "Roll"))
            ),
            e("button", {
              className: "rollCta",
              disabled: !canRoll,
              onClick: () => rollDice(game.currentPlayer)
            },
              e("strong", null, game.busy ? (game.language === "sa" ? "चलति" : "Rolling") : (game.language === "sa" ? "अक्षं पातय" : "Roll Dice")),
              e("small", null, game.language === "sa" ? "शतं प्राप्नुहि" : "Reach 100 to win")
            )
          ),
          e("section", { className: "panelBlock playersBlock" },
            e("h3", null, game.language === "sa" ? "क्रीडकाः" : "Players"),
            e("div", { className: "players" },
              players.map((player, index) => e("div", { className: `playerRow ${game.currentPlayer === index ? "active" : ""}`, key: player.name },
                e("img", { className: "avatar", src: player.image, alt: "" }),
                e("div", null,
                  e("div", { className: "playerName" }, player.name),
                  e("div", { className: "playerMeta" }, sanskritNames[game.positions[index]] || "start")
                ),
                e("div", { className: "positionBadge" }, labelFor(game.positions[index], game.language))
              ))
            )
          ),
          e("section", { className: "panelBlock scoreBlock" },
            e("h3", null, game.language === "sa" ? "गणना" : "Score"),
            e("div", { className: "scoreTiles" },
              e("div", { className: "scoreTile" },
                e("span", null, game.language === "sa" ? "चालाः" : "Moves"),
                e("b", null, labelFor(game.moves, game.language))
              ),
              e("div", { className: "scoreTile" },
                e("span", null, game.language === "sa" ? "अक्षः" : "Dice"),
                e("b", null, labelFor(game.dice, game.language))
              )
            ),
            e("div", { className: "panelActions" },
              e("button", { className: "pillBtn", onClick: restart }, game.language === "sa" ? "पुनः" : "Restart"),
              e("button", { className: "pillBtn", onClick: () => playNumber(game.positions[game.currentPlayer] || 1) }, game.language === "sa" ? "शृणु" : "Hear")
            )
          ),
          e("section", { className: "panelBlock leaderboard" },
            e("h3", null, game.language === "sa" ? "श्रेष्ठाः" : "Leaderboard"),
            leaderboard.length
              ? e("div", { className: "leaderRows" }, leaderboard.map((row, index) => e("div", { className: "leaderRow", key: `${row.date}-${index}` },
                e("div", { className: "rankBadge" }, index + 1),
                e("div", null,
                  e("strong", null, row.name || "Player"),
                  e("span", null, row.date || "Today")
                ),
                e("b", null, `${row.moves} ${game.language === "sa" ? "चालाः" : "moves"}`),
                e("img", { src: "./assets/player-kid0.png", alt: "", className: "leaderAvatar" })
              )))
              : e("div", { className: "emptyLeaderboard" },
                e("img", { src: "./assets/player-kid0.png", alt: "" }),
                e("p", { className: "smallCopy" }, game.language === "sa" ? "प्रथमं जय।" : "Win once to post a local score.")
              )
          )
        )
      ),
      game.winner !== null && e("section", { className: "winBanner", role: "status" },
        e("div", null,
          e("h2", null, players[game.winner]?.computer ? (game.language === "sa" ? "पुनः प्रयत्नः" : "Try Again!") : (game.language === "sa" ? "जयः!" : `${players[game.winner]?.name || "Player"} Wins!`)),
          e("p", null, game.message)
        ),
        e("button", { className: "primaryBtn pillBtn", onClick: restart }, game.language === "sa" ? "पुनः क्रीड" : "Play Again")
      ),
      pendingMode && e("div", { className: "modalOverlay modeConfirmOverlay", onClick: () => setPendingMode(null) },
        e("div", { className: "modal modeConfirm", onClick: (event) => event.stopPropagation() },
          e("div", { className: "confirmBadge" }, "!"),
          e("h2", null, game.language === "sa" ? "क्रीडाप्रकारं परिवर्तयितुम्?" : "Change match mode?"),
          e("p", null, game.language === "sa"
            ? "वर्तमानक्रीडायाः प्रगतिः नश्यति। किं निश्चितम्?"
            : "Your current game progress will be lost. Are you sure you want to switch modes?"),
          e("div", { className: "confirmActions" },
            e("button", { className: "pillBtn cancelBtn", onClick: () => setPendingMode(null) }, game.language === "sa" ? "न, क्रीडामि" : "Keep Playing"),
            e("button", { className: "pillBtn confirmBtn", onClick: confirmModeChange }, game.language === "sa" ? "आम्, परिवर्तय" : "Yes, Switch")
          )
        )
      ),
      showHelp && e("div", { className: "modalOverlay", onClick: () => setShowHelp(false) },
        e("div", { className: "modal howModal", onClick: (event) => event.stopPropagation() },
          e("div", { className: "howHero" },
            e("div", { className: "howBoardMini" },
              e("img", { src: `./${BOARD_ASSETS[game.language] || BOARD_ASSETS.sa}`, alt: "" }),
              e("img", { className: "howPlayer", src: "./assets/player-kid0.png", alt: "" }),
              e("img", { className: "howComputer", src: "./assets/player-kid1.png", alt: "" })
            ),
            e("div", null,
              e("p", { className: "eyebrow" }, game.language === "sa" ? "क्रीडाविधिः" : "Quick Guide"),
              e("h2", null, game.language === "sa" ? "कथं क्रीडितव्यम्" : "How to Play"),
              e("p", { className: "howLead" }, game.language === "sa"
                ? "अक्षं पातय, संख्यां शृणु, सोपानैः आरोह, सर्पेभ्यः सावधानः भव।"
                : "Roll, listen to the number, climb ladders, and watch out for slides.")
            )
          ),
          e("div", { className: "howSteps" },
            e("article", { className: "howStep" },
              e("img", { src: "./assets/dice.gif", alt: "" }),
              e("div", null,
                e("b", null, game.language === "sa" ? "१. अक्षं पातय" : "1. Roll the dice"),
                e("p", null, game.language === "sa" ? "नीलः क्रीडकः अक्षसंख्यानुसारं गच्छति।" : "Your blue player moves by the dice number.")
              )
            ),
            e("article", { className: "howStep" },
              e("span", { className: "ladderGraphic" }, "↗"),
              e("div", null,
                e("b", null, game.language === "sa" ? "२. सोपानम् आरोह" : "2. Climb ladders"),
                e("p", null, game.language === "sa" ? "सोपाने आगते शीघ्रं उच्चस्थानं प्राप्नोषि।" : "Landing on a ladder lifts you to a higher square.")
              )
            ),
            e("article", { className: "howStep" },
              e("span", { className: "slideGraphic" }, "↘"),
              e("div", null,
                e("b", null, game.language === "sa" ? "३. सर्पात् रक्ष" : "3. Avoid slides"),
                e("p", null, game.language === "sa" ? "सर्पे आगते अधः गन्तव्यं भवति।" : "Landing on a slide sends you back down.")
              )
            ),
            e("article", { className: "howStep" },
              e("button", { className: "listenBubble", onClick: () => playNumber(game.positions[game.currentPlayer] || 1) }, "▶"),
              e("div", null,
                e("b", null, game.language === "sa" ? "४. प्रत्येकां संख्यां शृणु" : "4. Hear every square"),
                e("p", null, game.language === "sa" ? "यत्र आगच्छसि, तस्य संस्कृतसंख्या श्रूयते।" : "Each square plays its Sanskrit number audio.")
              )
            )
          ),
          e("div", { className: "goalStrip" },
            e("span", null, "100"),
            e("p", null, game.language === "sa" ? "शतं प्राप्तुं सम्यक् संख्या आवश्यकी।" : "Reach 100 with the exact roll to win.")
          ),
          e("button", { className: "primaryBtn pillBtn", onClick: () => setShowHelp(false) }, game.language === "sa" ? "आरभामहे" : "Let's Play")
        )
      )
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(e(App));
})();
