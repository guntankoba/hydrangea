import { puzzles as stage2Puzzles } from "./data/puzzles.js";
import { stage1Puzzles } from "./data/stage1.js";
import { stage4Puzzles } from "./data/stage4.js";
import { getStationCardById } from "./data/stations.js";
import { render } from "./ui/render.js";
const PASSWORD = "kobachi";
const app = document.getElementById("app");
const stages = {
    ST1: stage1Puzzles,
    ST2: stage2Puzzles,
    ST4: stage4Puzzles,
};
const stageOrder = ["ST1", "ST2", "ST4"];
const stageThemes = {
    ST1: { accent: "#ffc0cb", accentDark: "#ffd6e6", accentShadow: "rgba(255, 192, 203, 0.45)" },
    ST2: { accent: "#6b9bd3", accentDark: "#94c5cc", accentShadow: "rgba(107, 155, 211, 0.35)" },
    ST4: { accent: "#80c241", accentDark: "#6fb234", accentShadow: "rgba(128, 194, 65, 0.35)" },
};
const state = {
    isLoggedIn: false,
    isCleared: false,
    currentStage: "ST1",
    clearedStages: [],
    stationCardDisplay: null,
    pendingStageAfterCard: null,
    tos: { agreed: false, openedOnce: false },
    crossword: {},
    feedback: null,
    puzzleState: {},
};
const finalPuzzleId = (stage) => { var _a; return (_a = stages[stage][stages[stage].length - 1]) === null || _a === void 0 ? void 0 : _a.id; };
function getActivePuzzles() {
    return stages[state.currentStage];
}
function getStageIndex(stage) {
    const index = stageOrder.indexOf(stage);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
function maxClearedStageIndex() {
    if (!state.clearedStages.length)
        return -1;
    return Math.max(...state.clearedStages.map(getStageIndex));
}
function markStageCleared(stage) {
    if (!state.clearedStages.includes(stage)) {
        state.clearedStages.push(stage);
    }
}
function canAccessStage(stage) {
    const targetIndex = getStageIndex(stage);
    if (targetIndex === Number.MAX_SAFE_INTEGER)
        return false;
    return targetIndex <= maxClearedStageIndex() + 1;
}
function setStationCardDisplay(card, nextStage) {
    state.stationCardDisplay = card;
    state.pendingStageAfterCard = card ? nextStage : null;
}
function applyStageTheme(stage) {
    const theme = stageThemes[stage];
    if (!theme)
        return;
    const root = document.documentElement.style;
    root.setProperty("--accent", theme.accent);
    root.setProperty("--accent-dark", theme.accentDark);
    root.setProperty("--accent-shadow", theme.accentShadow);
}
function normalizeAnswer(input) {
    return input.trim().normalize("NFKC");
}
function isAnswerCorrect(input, puzzle) {
    const normalizedInput = normalizeAnswer(input);
    const normalizedCandidates = [puzzle.correctAnswer, ...(puzzle.acceptedAnswers || [])].map((answer) => normalizeAnswer(answer));
    return normalizedCandidates.some((answer) => normalizedInput === answer);
}
function ensurePuzzleState(id) {
    if (!state.puzzleState[id]) {
        state.puzzleState[id] = { solved: false, feedback: null };
    }
    return state.puzzleState[id];
}
function handleAction(action, payload) {
    if (action === "login") {
        if (payload === PASSWORD) {
            state.isLoggedIn = true;
            state.feedback = null;
        }
        else {
            state.feedback = { kind: "error", message: "パスワードが違います" };
        }
        render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
        return;
    }
    if (!state.isLoggedIn || state.isCleared)
        return;
    if (action === "station_card_continue") {
        if (state.stationCardDisplay && state.pendingStageAfterCard) {
            const nextStage = state.pendingStageAfterCard;
            setStationCardDisplay(null, null);
            state.currentStage = nextStage;
            applyStageTheme(state.currentStage);
        }
        render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
        return;
    }
    if (action === "navigate_stage") {
        const targetStage = payload === null || payload === void 0 ? void 0 : payload.stageId;
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
    if (action === "answer") {
        const puzzle = getActivePuzzles().find((p) => p.id === (payload === null || payload === void 0 ? void 0 : payload.puzzleId));
        if (!puzzle)
            return;
        const puzzleState = ensurePuzzleState(puzzle.id);
        const answerValue = typeof (payload === null || payload === void 0 ? void 0 : payload.value) === "string" ? payload.value : "";
        if (puzzleState.solved) {
            puzzleState.feedback = { kind: "success", message: "クリア済みです" };
            render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
            return;
        }
        if (puzzle.kind === "text" || puzzle.kind === "slot") {
            if (isAnswerCorrect(answerValue, puzzle)) {
                puzzleState.solved = true;
                puzzleState.feedback = { kind: "success", message: "正解です" };
                const lastPuzzleId = finalPuzzleId(state.currentStage);
                if (puzzle.id === lastPuzzleId) {
                    markStageCleared(state.currentStage);
                    if (state.currentStage === "ST1") {
                        const card = getStationCardById("kanamachi");
                        if (card) {
                            setStationCardDisplay(card, "ST2");
                            puzzleState.feedback = {
                                kind: "success",
                                message: "駅カードを確認してから次のステージへ進もう",
                            };
                        }
                        else {
                            state.currentStage = "ST2";
                            applyStageTheme(state.currentStage);
                            render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
                            return;
                        }
                    }
                    else if (state.currentStage === "ST2") {
                        state.currentStage = "ST4";
                        applyStageTheme(state.currentStage);
                        render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
                        return;
                    }
                    else if (state.currentStage === "ST4") {
                        state.isCleared = true;
                    }
                }
            }
            else {
                puzzleState.feedback = { kind: "error", message: "不正解です" };
            }
        }
    }
    render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
}
// Initial Render
applyStageTheme(state.currentStage);
render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
