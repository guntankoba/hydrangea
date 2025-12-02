import { puzzles as stage2Puzzles } from "./data/puzzles.js";
import { stage1Puzzles } from "./data/stage1.js";
import { stage3Puzzles } from "./data/stage3.js";
import { stage4Puzzles } from "./data/stage4.js";
import { stage5Puzzles } from "./data/stage5.js";
import { getStationCardById } from "./data/stations.js";
import { AppState, Feedback, Puzzle, PuzzleProgress, SlotPuzzle, StageId, StationCard, TextPuzzle } from "./types.js";
import { render } from "./ui/render.js";

const PASSWORD = "kobachi";

const app = document.getElementById("app") as HTMLElement;

const stages: Record<StageId, Puzzle[]> = {
  ST1: stage1Puzzles,
  ST2: stage2Puzzles,
  ST3: stage3Puzzles,
  ST4: stage4Puzzles,
  ST5: stage5Puzzles,
};

const stage4StationCardRewards: Record<number, string> = {
  402: "shimokitazawa",
  403: "shimotakaido",
  404: "katase-enoshima",
  405: "toshimaen",
  406: "kuramae",
};

const stageOrder: StageId[] = ["ST1", "ST2", "ST3", "ST4", "ST5"];

const stageThemes: Record<StageId, { accent: string; accentDark: string; accentShadow: string }> = {
  ST1: { accent: "#ffc0cb", accentDark: "#ffd6e6", accentShadow: "rgba(255, 192, 203, 0.45)" },
  ST2: { accent: "#6b9bd3", accentDark: "#94c5cc", accentShadow: "rgba(107, 155, 211, 0.35)" },
  ST3: { accent: "#4da3ff", accentDark: "#6fb3ff", accentShadow: "rgba(77, 163, 255, 0.35)" },
  ST4: { accent: "#80c241", accentDark: "#6fb234", accentShadow: "rgba(128, 194, 65, 0.35)" },
  ST5: { accent: "#c79ad9", accentDark: "#d8b3e6", accentShadow: "rgba(199, 154, 217, 0.35)" },
};

const state: AppState = {
  isLoggedIn: false,
  isCleared: false,
  currentStage: "ST1",
  clearedStages: [],
  stationCardDisplay: null,
  pendingStageAfterCard: null,
  pendingClearAfterCard: false,
  postGame: { step: null, feedback: null },
  tos: { agreed: false, openedOnce: false },
  crossword: {},
  feedback: null,
  puzzleState: {},
};

const finalPuzzleId = (stage: StageId) => stages[stage][stages[stage].length - 1]?.id;

function getActivePuzzles() {
  return stages[state.currentStage];
}

function getStageIndex(stage: StageId) {
  const index = stageOrder.indexOf(stage);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function maxClearedStageIndex() {
  if (!state.clearedStages.length) return -1;
  return Math.max(...state.clearedStages.map(getStageIndex));
}

function markStageCleared(stage: StageId) {
  if (!state.clearedStages.includes(stage)) {
    state.clearedStages.push(stage);
  }
}

function canAccessStage(stage: StageId) {
  const targetIndex = getStageIndex(stage);
  if (targetIndex === Number.MAX_SAFE_INTEGER) return false;
  return targetIndex <= maxClearedStageIndex() + 1;
}

function setStationCardDisplay(card: StationCard | null, nextStage: StageId | null, pendingClearAfterCard = false) {
  state.stationCardDisplay = card;
  state.pendingStageAfterCard = card ? nextStage : null;
  state.pendingClearAfterCard = card ? pendingClearAfterCard : false;
}

function applyStageTheme(stage: StageId) {
  const theme = stageThemes[stage];
  if (!theme) return;
  const root = document.documentElement.style;
  root.setProperty("--accent", theme.accent);
  root.setProperty("--accent-dark", theme.accentDark);
  root.setProperty("--accent-shadow", theme.accentShadow);
}

type NormalizationMode = "text" | "numeric";

function normalizeAnswer(input: string, mode: NormalizationMode = "text"): string {
  const normalized = input.trim().normalize("NFKC");
  if (mode === "numeric") {
    const digitsOnly = normalized.replace(/[^0-9]/g, "");
    return digitsOnly ? String(Number(digitsOnly)) : "";
  }
  return normalized;
}

function isAnswerCorrect(input: string, puzzle: TextPuzzle | SlotPuzzle): boolean {
  const normalizationMode = puzzle.answerNormalization ?? "text";
  const normalizedInput = normalizeAnswer(input, normalizationMode);
  const normalizedCandidates = [puzzle.correctAnswer, ...(puzzle.acceptedAnswers || [])].map((answer) =>
    normalizeAnswer(answer, normalizationMode)
  );
  return normalizedCandidates.some((answer) => normalizedInput === answer);
}

function ensurePuzzleState(id: number): PuzzleProgress {
  if (!state.puzzleState[id]) {
    state.puzzleState[id] = { solved: false, feedback: null, awardedCard: null };
  }
  return state.puzzleState[id];
}

function handleAction(action: string, payload?: any) {
  if (action === "login") {
    if (payload === PASSWORD) {
      state.isLoggedIn = true;
      state.feedback = null;
    } else {
      state.feedback = { kind: "error", message: "パスワードが違います" };
    }

    render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
    return;
  }

  if (!state.isLoggedIn || state.isCleared) return;

  if (action === "station_card_continue") {
    if (state.stationCardDisplay) {
      if (state.pendingStageAfterCard) {
        const nextStage = state.pendingStageAfterCard;
        setStationCardDisplay(null, null);
        state.currentStage = nextStage;
        applyStageTheme(state.currentStage);
      } else if (state.pendingClearAfterCard) {
        setStationCardDisplay(null, null);
        state.isCleared = true;
      } else {
        setStationCardDisplay(null, null);
      }
    }
    render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
    return;
  }

  if (action === "navigate_stage") {
    const targetStage = payload?.stageId as StageId | undefined;
    if (!targetStage || !canAccessStage(targetStage)) {
      state.feedback = { kind: "error", message: "まだ進めないステージです" };
      render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
      return;
    }
    state.currentStage = targetStage;
    setStationCardDisplay(null, null);
    state.feedback = null;
    applyStageTheme(state.currentStage);
    render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
    return;
  }

  if (action === "tos_opened") {
    state.tos.openedOnce = true;
    return;
  }

  if (!state.tos.agreed) {
    if (action === "tos_accept") {
      state.tos.agreed = true;
      state.feedback = null;
      render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
    }
    return;
  }

  if (action === "postgame_to_arrival") {
    state.postGame.step = "arrival_check";
    state.postGame.feedback = null;
    render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
    return;
  }

  if (action === "arrival_submit") {
    const answerValue = typeof payload?.value === "string" ? payload.value : "";
    const accepted = ["椿山荘", "ちんざんそう", "ホテル椿山荘"].map((answer) => normalizeAnswer(answer, "text"));
    const normalizedInput = normalizeAnswer(answerValue, "text");

    if (accepted.includes(normalizedInput)) {
      state.postGame.step = null;
      state.postGame.feedback = null;
      state.isCleared = true;
    } else {
      state.postGame.feedback = { kind: "error", message: "到着した場所の名前が違うようです" };
    }

    render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
    return;
  }

  if (action === "answer") {
    const puzzle = getActivePuzzles().find((p) => p.id === payload?.puzzleId);
    if (!puzzle) return;

    const puzzleState = ensurePuzzleState(puzzle.id);
    const answerValue = typeof payload?.value === "string" ? payload.value : "";

    if (puzzleState.solved) {
      puzzleState.feedback = { kind: "success", message: "クリア済みです" };
      render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
      return;
    }

    if (puzzle.kind === "text" || puzzle.kind === "slot") {
      if (isAnswerCorrect(answerValue, puzzle)) {
        puzzleState.solved = true;
        puzzleState.feedback = { kind: "success", message: "正解です" };

        if (state.currentStage === "ST4") {
          const rewardId = stage4StationCardRewards[puzzle.id];
          if (rewardId) {
            const card = getStationCardById(rewardId);
            if (card) {
              puzzleState.awardedCard = card;
              puzzleState.feedback = {
                kind: "success",
                message: "Stationカードを獲得したよ",
              };
            }
          }
        }

        const lastPuzzleId = finalPuzzleId(state.currentStage);
        if (puzzle.id === lastPuzzleId) {
          markStageCleared(state.currentStage);
          if (state.currentStage === "ST1") {
            const card = getStationCardById("kanamachi");
            if (card) {
              puzzleState.awardedCard = card;
              setStationCardDisplay(card, "ST2");
              puzzleState.feedback = {
                kind: "success",
                message: "Stationカードを確認してから次のステージへ進もう",
              };
            } else {
              state.currentStage = "ST2";
              applyStageTheme(state.currentStage);
              render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
              return;
            }
          } else if (state.currentStage === "ST2") {
            const card = getStationCardById("akihabara");
            if (card) {
              puzzleState.awardedCard = card;
              setStationCardDisplay(card, "ST3");
              puzzleState.feedback = {
                kind: "success",
                message: "Stationカードを確認してから次のステージへ進もう",
              };
            } else {
              state.currentStage = "ST3";
              applyStageTheme(state.currentStage);
              render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
              return;
            }
          } else if (state.currentStage === "ST3") {
            const card = getStationCardById("shinjuku");
            if (card) {
              puzzleState.awardedCard = card;
              setStationCardDisplay(card, "ST4");
              puzzleState.feedback = {
                kind: "success",
                message: "Stationカードを確認してから次のステージへ進もう",
              };
            } else {
              state.currentStage = "ST4";
              applyStageTheme(state.currentStage);
              render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
              return;
            }
          } else if (state.currentStage === "ST4") {
            const card = getStationCardById("mejiro");
            if (card) {
              puzzleState.awardedCard = card;
              setStationCardDisplay(card, "ST5");
              puzzleState.feedback = {
                kind: "success",
                message: "Stationカードを確認してから次のステージへ進もう",
              };
            } else {
              state.currentStage = "ST5";
              applyStageTheme(state.currentStage);
              render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
              return;
            }
          } else if (state.currentStage === "ST5") {
            state.postGame.step = "bus_guide";
            state.postGame.feedback = null;
            puzzleState.feedback = { kind: "success", message: "導いた番号が次に進むための道しるべだ" };
          }
        }
      } else {
        puzzleState.feedback = { kind: "error", message: "不正解です" };
      }
    }
  }

  render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
}

// Initial Render
applyStageTheme(state.currentStage);
render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
