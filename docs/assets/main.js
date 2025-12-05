import { puzzles as stage2Puzzles } from "./data/puzzles.js";
import { stage1Puzzles } from "./data/stage1.js";
import { stage3Puzzles } from "./data/stage3.js";
import { stage4Puzzles } from "./data/stage4.js";
import { stage5Puzzles } from "./data/stage5.js";
import { getStationCardById } from "./data/stations.js";
import { render, resetScrollPosition } from "./ui/render.js";
const PASSWORD = "KPrpz4ms";
const LOGIN_STORAGE_KEY = "hydrangea_login_token";
const PROGRESS_STORAGE_KEY = "hydrangea_progress_v1";
const app = document.getElementById("app");
const stages = {
    ST1: stage1Puzzles,
    ST2: stage2Puzzles,
    ST3: stage3Puzzles,
    ST4: stage4Puzzles,
    ST5: stage5Puzzles,
};
const stage4StationCardRewards = {
    402: "shimokitazawa",
    403: "shimotakaido",
    404: "katase-enoshima",
    405: "toshimaen",
    406: "kuramae",
};
const stageOrder = ["ST1", "ST2", "ST3", "ST4", "ST5"];
const stageThemes = {
    ST1: { accent: "#ffc0cb", accentDark: "#ffd6e6", accentShadow: "rgba(255, 192, 203, 0.45)" },
    ST2: { accent: "#6b9bd3", accentDark: "#94c5cc", accentShadow: "rgba(107, 155, 211, 0.35)" },
    ST3: { accent: "#4da3ff", accentDark: "#6fb3ff", accentShadow: "rgba(77, 163, 255, 0.35)" },
    ST4: { accent: "#80c241", accentDark: "#6fb234", accentShadow: "rgba(128, 194, 65, 0.35)" },
    ST5: { accent: "#c79ad9", accentDark: "#d8b3e6", accentShadow: "rgba(199, 154, 217, 0.35)" },
};
function getPersistentStorage() {
    if (typeof window === "undefined")
        return null;
    try {
        return window.localStorage;
    }
    catch {
        return null;
    }
}
function hasPersistedLogin() {
    const storage = getPersistentStorage();
    if (!storage)
        return false;
    const storedValue = storage.getItem(LOGIN_STORAGE_KEY);
    if (!storedValue)
        return false;
    if (storedValue !== PASSWORD) {
        storage.removeItem(LOGIN_STORAGE_KEY);
        return false;
    }
    return true;
}
function persistLoginGrant() {
    const storage = getPersistentStorage();
    if (!storage)
        return;
    try {
        storage.setItem(LOGIN_STORAGE_KEY, PASSWORD);
    }
    catch {
        // localStorage が利用できない場合は何もしない
    }
}
function clearPersistedData() {
    const storage = getPersistentStorage();
    if (!storage)
        return;
    try {
        storage.removeItem(LOGIN_STORAGE_KEY);
        storage.removeItem(PROGRESS_STORAGE_KEY);
    }
    catch {
        // ignore
    }
}
function serializePuzzleState(puzzleState) {
    const serialized = {};
    Object.entries(puzzleState).forEach(([key, progress]) => {
        var _a, _b;
        if (!(progress === null || progress === void 0 ? void 0 : progress.solved))
            return;
        serialized[Number(key)] = {
            solved: true,
            awardedCardId: (_b = (_a = progress.awardedCard) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
        };
    });
    return serialized;
}
function rehydratePuzzleState(serialized) {
    if (!serialized)
        return {};
    const restored = {};
    Object.entries(serialized).forEach(([key, value]) => {
        var _a;
        if (!(value === null || value === void 0 ? void 0 : value.solved))
            return;
        const awardedCard = value.awardedCardId ? (_a = getStationCardById(value.awardedCardId)) !== null && _a !== void 0 ? _a : null : null;
        restored[Number(key)] = {
            solved: true,
            feedback: { kind: "success", message: "クリア済みです" },
            awardedCard,
        };
    });
    return restored;
}
function loadPersistedProgress() {
    const storage = getPersistentStorage();
    if (!storage)
        return null;
    try {
        const raw = storage.getItem(PROGRESS_STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object")
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
function persistProgress() {
    const storage = getPersistentStorage();
    if (!storage)
        return;
    const serializedPuzzleState = serializePuzzleState(state.puzzleState);
    const hasProgress = state.isLoggedIn ||
        state.isCleared ||
        state.clearedStages.length > 0 ||
        state.currentStage !== "ST1" ||
        state.postGame.step !== null ||
        Object.keys(serializedPuzzleState).length > 0 ||
        state.stationCardDisplay !== null ||
        state.pendingStageAfterCard !== null ||
        state.pendingClearAfterCard;
    if (!hasProgress) {
        try {
            storage.removeItem(PROGRESS_STORAGE_KEY);
        }
        catch {
            // ignore
        }
        return;
    }
    const serialized = {
        currentStage: state.currentStage,
        clearedStages: state.clearedStages,
        puzzleState: serializedPuzzleState,
        isCleared: state.isCleared,
        postGameStep: state.postGame.step,
    };
    try {
        storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(serialized));
    }
    catch {
        // localStorage が利用できない場合は何もしない
    }
}
function applyPersistedProgress(progress) {
    var _a;
    if (!progress)
        return;
    if (progress.currentStage && stageOrder.includes(progress.currentStage)) {
        state.currentStage = progress.currentStage;
    }
    if (Array.isArray(progress.clearedStages)) {
        state.clearedStages = progress.clearedStages.filter((stage) => stageOrder.includes(stage));
    }
    state.isCleared = Boolean(progress.isCleared);
    state.postGame.step = (_a = progress.postGameStep) !== null && _a !== void 0 ? _a : null;
    state.puzzleState = rehydratePuzzleState(progress.puzzleState);
}
function createInitialState() {
    return {
        isLoggedIn: hasPersistedLogin(),
        isCleared: false,
        currentStage: "ST1",
        clearedStages: [],
        stationCardDisplay: null,
        pendingStageAfterCard: null,
        pendingClearAfterCard: false,
        postGame: { step: null, feedback: null },
        gameIntro: { acknowledged: false },
        tos: { agreed: false, openedOnce: false },
        crossword: {},
        feedback: null,
        puzzleState: {},
    };
}
const state = createInitialState();
applyPersistedProgress(loadPersistedProgress());
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
function setStationCardDisplay(card, nextStage, pendingClearAfterCard = false) {
    state.stationCardDisplay = card;
    state.pendingStageAfterCard = card ? nextStage : null;
    state.pendingClearAfterCard = card ? pendingClearAfterCard : false;
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
function rerender() {
    persistProgress();
    render(app, state, getActivePuzzles(), handleAction, state.currentStage, stageOrder);
}
function normalizeAnswer(input, mode = "text") {
    const normalized = input.trim().normalize("NFKC");
    if (mode === "numeric") {
        const digitsOnly = normalized.replace(/[^0-9]/g, "");
        return digitsOnly ? String(Number(digitsOnly)) : "";
    }
    return normalized;
}
function isAnswerCorrect(input, puzzle) {
    var _a;
    const normalizationMode = (_a = puzzle.answerNormalization) !== null && _a !== void 0 ? _a : "text";
    const normalizedInput = normalizeAnswer(input, normalizationMode);
    const normalizedCandidates = [puzzle.correctAnswer, ...(puzzle.acceptedAnswers || [])].map((answer) => normalizeAnswer(answer, normalizationMode));
    return normalizedCandidates.some((answer) => normalizedInput === answer);
}
function ensurePuzzleState(id) {
    if (!state.puzzleState[id]) {
        state.puzzleState[id] = { solved: false, feedback: null, awardedCard: null };
    }
    return state.puzzleState[id];
}
function handleAction(action, payload) {
    if (action === "reset_persistence") {
        clearPersistedData();
        const freshState = createInitialState();
        Object.assign(state, freshState);
        applyStageTheme(state.currentStage);
        rerender();
        return;
    }
    if (action === "login") {
        if (payload === PASSWORD) {
            state.isLoggedIn = true;
            state.feedback = null;
            persistLoginGrant();
        }
        else {
            state.feedback = { kind: "error", message: "パスワードが違います" };
        }
        rerender();
        return;
    }
    if (!state.isLoggedIn || state.isCleared)
        return;
    if (action === "station_card_continue") {
        let stageChanged = false;
        if (state.stationCardDisplay) {
            if (state.pendingStageAfterCard) {
                const nextStage = state.pendingStageAfterCard;
                setStationCardDisplay(null, null);
                state.currentStage = nextStage;
                applyStageTheme(state.currentStage);
                stageChanged = true;
            }
            else if (state.pendingClearAfterCard) {
                setStationCardDisplay(null, null);
                state.isCleared = true;
            }
            else {
                setStationCardDisplay(null, null);
            }
        }
        if (stageChanged) {
            resetScrollPosition();
        }
        rerender();
        return;
    }
    if (action === "navigate_stage") {
        const targetStage = payload === null || payload === void 0 ? void 0 : payload.stageId;
        if (!targetStage || !canAccessStage(targetStage)) {
            state.feedback = { kind: "error", message: "まだ進めないステージです" };
            rerender();
            return;
        }
        state.currentStage = targetStage;
        setStationCardDisplay(null, null);
        state.feedback = null;
        applyStageTheme(state.currentStage);
        resetScrollPosition();
        rerender();
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
            rerender();
        }
        return;
    }
    if (!state.gameIntro.acknowledged) {
        if (action === "game_intro_start") {
            state.gameIntro.acknowledged = true;
            state.feedback = null;
            applyStageTheme(state.currentStage);
            rerender();
        }
        return;
    }
    if (action === "postgame_to_arrival") {
        state.postGame.step = "arrival_check";
        state.postGame.feedback = null;
        rerender();
        return;
    }
    if (action === "arrival_submit") {
        const answerValue = typeof (payload === null || payload === void 0 ? void 0 : payload.value) === "string" ? payload.value : "";
        const accepted = ["椿山荘", "ちんざんそう", "ホテル椿山荘"].map((answer) => normalizeAnswer(answer, "text"));
        const normalizedInput = normalizeAnswer(answerValue, "text");
        if (accepted.includes(normalizedInput)) {
            state.postGame.step = null;
            state.postGame.feedback = null;
            state.isCleared = true;
        }
        else {
            state.postGame.feedback = { kind: "error", message: "到着した場所の名前が違うようです" };
        }
        rerender();
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
            rerender();
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
                        }
                        else {
                            state.currentStage = "ST2";
                            applyStageTheme(state.currentStage);
                            resetScrollPosition();
                            rerender();
                            return;
                        }
                    }
                    else if (state.currentStage === "ST2") {
                        const card = getStationCardById("akihabara");
                        if (card) {
                            puzzleState.awardedCard = card;
                            setStationCardDisplay(card, "ST3");
                            puzzleState.feedback = {
                                kind: "success",
                                message: "Stationカードを確認してから次のステージへ進もう",
                            };
                        }
                        else {
                            state.currentStage = "ST3";
                            applyStageTheme(state.currentStage);
                            resetScrollPosition();
                            rerender();
                            return;
                        }
                    }
                    else if (state.currentStage === "ST3") {
                        const card = getStationCardById("shinjuku");
                        if (card) {
                            puzzleState.awardedCard = card;
                            setStationCardDisplay(card, "ST4");
                            puzzleState.feedback = {
                                kind: "success",
                                message: "Stationカードを確認してから次のステージへ進もう",
                            };
                        }
                        else {
                            state.currentStage = "ST4";
                            applyStageTheme(state.currentStage);
                            resetScrollPosition();
                            rerender();
                            return;
                        }
                    }
                    else if (state.currentStage === "ST4") {
                        const card = getStationCardById("mejiro");
                        if (card) {
                            puzzleState.awardedCard = card;
                            setStationCardDisplay(card, "ST5");
                            puzzleState.feedback = {
                                kind: "success",
                                message: "Stationカードを確認してから次のステージへ進もう",
                            };
                        }
                        else {
                            state.currentStage = "ST5";
                            applyStageTheme(state.currentStage);
                            resetScrollPosition();
                            rerender();
                            return;
                        }
                    }
                    else if (state.currentStage === "ST5") {
                        state.postGame.step = "bus_guide";
                        state.postGame.feedback = null;
                        puzzleState.feedback = { kind: "success", message: "導いた番号が次に進むための道しるべだ" };
                    }
                }
            }
            else {
                puzzleState.feedback = { kind: "error", message: "不正解です" };
            }
        }
    }
    rerender();
}
// Initial Render
applyStageTheme(state.currentStage);
rerender();
