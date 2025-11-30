import { puzzles as stage2Puzzles } from "./data/puzzles.js";
import { stage1Puzzles } from "./data/stage1.js";
import { stage4Puzzles } from "./data/stage4.js";
import { render } from "./ui/render.js";
const PASSWORD = "kobachi";
const app = document.getElementById("app");
const stages = {
    ST1: stage1Puzzles,
    ST2: stage2Puzzles,
    ST4: stage4Puzzles,
};
const stageThemes = {
    ST1: { accent: "#ffc0cb", accentDark: "#ffd6e6", accentShadow: "rgba(255, 192, 203, 0.45)" },
    ST2: { accent: "#6b9bd3", accentDark: "#94c5cc", accentShadow: "rgba(107, 155, 211, 0.35)" },
    ST4: { accent: "#ffc0cb", accentDark: "#ffd6e6", accentShadow: "rgba(255, 192, 203, 0.45)" },
};
const state = {
    isLoggedIn: false,
    isCleared: false,
    currentStage: "ST1",
    tos: { agreed: false, openedOnce: false },
    crossword: {},
    feedback: null,
    puzzleState: {},
};
const finalPuzzleId = (stage) => { var _a; return (_a = stages[stage][stages[stage].length - 1]) === null || _a === void 0 ? void 0 : _a.id; };
function getActivePuzzles() {
    return stages[state.currentStage];
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
// Initial Render
applyStageTheme(state.currentStage);
render(app, state, getActivePuzzles(), handleAction, state.currentStage);
function normalizeAnswer(input) {
    return input.trim();
}
function isAnswerCorrect(input, puzzle) {
    const normalized = normalizeAnswer(input);
    const candidates = [puzzle.correctAnswer, ...(puzzle.acceptedAnswers || [])];
    return candidates.some((answer) => normalized === answer);
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
        render(app, state, getActivePuzzles(), handleAction, state.currentStage);
        return;
    }
    if (!state.isLoggedIn || state.isCleared)
        return;
    if (action === "tos_opened") {
        state.tos.openedOnce = true;
        return;
    }
    if (!state.tos.agreed) {
        if (action === "tos_accept") {
            state.tos.agreed = true;
            state.feedback = null;
            render(app, state, getActivePuzzles(), handleAction, state.currentStage);
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
            puzzleState.feedback = { kind: "success", message: "クリア済みです。" };
            render(app, state, getActivePuzzles(), handleAction, state.currentStage);
            return;
        }
        if (puzzle.kind === "text" || puzzle.kind === "slot") {
            if (isAnswerCorrect(answerValue, puzzle)) {
                puzzleState.solved = true;
                puzzleState.feedback = { kind: "success", message: "正解！次のカードに進もう。" };
                const lastPuzzleId = finalPuzzleId(state.currentStage);
                if (puzzle.id === lastPuzzleId) {
                    if (state.currentStage === "ST1") {
                        state.currentStage = "ST2";
                        applyStageTheme(state.currentStage);
                        render(app, state, getActivePuzzles(), handleAction, state.currentStage);
                        return;
                    }
                    if (state.currentStage === "ST2") {
                        state.currentStage = "ST4";
                        applyStageTheme(state.currentStage);
                        render(app, state, getActivePuzzles(), handleAction, state.currentStage);
                        return;
                    }
                    if (state.currentStage === "ST4") {
                        state.isCleared = true;
                    }
                }
            }
            else {
                puzzleState.feedback = { kind: "error", message: "不正解です" };
            }
        }
    }
    render(app, state, getActivePuzzles(), handleAction, state.currentStage);
}
