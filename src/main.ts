import { puzzles } from "./data/puzzles.js";
import { AppState } from "./types.js";
import { render } from "./ui/render.js";
import { isCrosswordSolved, moveActiveCell, updateCell } from "./logic/crossword.js";

const PASSWORD = "kobachi";

const app = document.getElementById("app") as HTMLElement;

const state: AppState = {
  isLoggedIn: false,
  currentPuzzleIndex: 0,
  feedback: null,
  isCleared: false,
  crossword: {},
  isTransitioning: false,
  maxReachedIndex: 0,
  letters: [],
};

// Initial Render
render(app, state, puzzles, handleAction);

function handleAction(action: string, payload?: any) {
  // Prevent actions during transition
  if (state.isTransitioning) return;

  state.feedback = null; // Clear feedback on any action

  switch (action) {
    case "login":
      if (payload === PASSWORD) {
        state.isLoggedIn = true;
      } else {
        state.feedback = { kind: "error", message: "パスワードが違います" };
      }
      break;

    case "prev":
      if (state.currentPuzzleIndex > 0) {
        state.currentPuzzleIndex--;
      }
      break;

    case "next":
      // Allow navigation if we've already reached a further point
      if (state.currentPuzzleIndex < state.maxReachedIndex) {
        state.currentPuzzleIndex++;
      } else if (state.currentPuzzleIndex < puzzles.length - 1) {
        // This path is usually triggered by solving, but if we allow "next" for info pages:
        const currentPuzzle = puzzles[state.currentPuzzleIndex];
        if (currentPuzzle.kind === "info") {
          state.currentPuzzleIndex++;
          state.maxReachedIndex = Math.max(state.maxReachedIndex, state.currentPuzzleIndex);
        }
      } else {
        state.isCleared = true;
      }
      break;

    case "answer":
      const currentPuzzle = puzzles[state.currentPuzzleIndex];
      if (currentPuzzle.kind === "text" || currentPuzzle.kind === "slot") {
        if (payload === currentPuzzle.correctAnswer) {
          state.feedback = { kind: "success", message: "正解です！次の問題へ。" };

          if (currentPuzzle.kind === "slot" && currentPuzzle.letterCard) {
            if (!state.letters) state.letters = [];
            const exists = state.letters.some((l) => l.id === currentPuzzle.letterCard!.id);
            if (!exists) {
              state.letters.push(currentPuzzle.letterCard);
            }
          }

          state.isTransitioning = true;
          render(app, state, puzzles, handleAction); // Re-render to show success message

          setTimeout(() => {
            state.isTransitioning = false;
            if (state.currentPuzzleIndex < puzzles.length - 1) {
              state.currentPuzzleIndex++;
              state.maxReachedIndex = Math.max(state.maxReachedIndex, state.currentPuzzleIndex);
              state.feedback = null;
            } else {
              state.isCleared = true;
            }
            render(app, state, puzzles, handleAction);
          }, 1500);
          return; // Return early to avoid double render
        } else {
          state.feedback = { kind: "error", message: "不正解です" };
        }
      } else if (currentPuzzle.kind === "crossword") {
        const progress = state.crossword[currentPuzzle.id];
        if (progress && isCrosswordSolved(currentPuzzle, progress)) {
          state.feedback = { kind: "success", message: "正解です！次の問題へ。" };
          state.isTransitioning = true;
          render(app, state, puzzles, handleAction);

          setTimeout(() => {
            state.isTransitioning = false;
            if (state.currentPuzzleIndex < puzzles.length - 1) {
              state.currentPuzzleIndex++;
              state.maxReachedIndex = Math.max(state.maxReachedIndex, state.currentPuzzleIndex);
              state.feedback = null;
            } else {
              state.isCleared = true;
            }
            render(app, state, puzzles, handleAction);
          }, 1500);
        } else {
          state.feedback = { kind: "error", message: "まだ正解ではありません" };
        }
      }
      break;

    case "crossword_click":
      const p = puzzles[state.currentPuzzleIndex];
      if (p.kind === "crossword") {
        if (!state.crossword[p.id]) return;
        state.crossword[p.id].activeCell = payload;
      }
      break;

    case "crossword_move":
      const p2 = puzzles[state.currentPuzzleIndex];
      if (p2.kind === "crossword") {
        if (!state.crossword[p2.id]) return;
        moveActiveCell(p2, state.crossword[p2.id], payload.dr, payload.dc);
      }
      break;

    case "crossword_input":
      const p3 = puzzles[state.currentPuzzleIndex];
      if (p3.kind === "crossword") {
        const progress = state.crossword[p3.id];
        if (progress) {
          updateCell(p3, progress, payload);
        }
      }
      break;
  }

  render(app, state, puzzles, handleAction);
}

// Global Keyboard Events for Crossword
document.addEventListener("keydown", (e) => {
  if (state.isTransitioning) return;

  const currentPuzzle = puzzles[state.currentPuzzleIndex];
  if (!state.isLoggedIn || !currentPuzzle || currentPuzzle.kind !== "crossword") return;

  if (e.key.startsWith("Arrow")) {
    e.preventDefault();
    let dr = 0, dc = 0;
    if (e.key === "ArrowUp") dr = -1;
    if (e.key === "ArrowDown") dr = 1;
    if (e.key === "ArrowLeft") dc = -1;
    if (e.key === "ArrowRight") dc = 1;
    handleAction("crossword_move", { dr, dc });
  } else if (e.key.length === 1 && e.key.match(/[a-z0-9\u3040-\u309F]/i)) {
    handleAction("crossword_input", e.key);
  } else if (e.key === "Backspace") {
    handleAction("crossword_input", "");
  }
});
