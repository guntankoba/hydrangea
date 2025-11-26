import { puzzles } from "./data/puzzles.js";
import { AppState, Feedback, SlotPuzzle, TextPuzzle } from "./types.js";
import { render } from "./ui/render.js";

const PASSWORD = "kobachi";

const app = document.getElementById("app") as HTMLElement;

const state: AppState = {
  isLoggedIn: false,
  isCleared: false,
  crossword: {},
  letters: [],
  feedback: null,
  puzzleState: {},
};

const finalPuzzleId = puzzles[puzzles.length - 1]?.id;
type PuzzleProgress = { solved: boolean; feedback: Feedback | null };

// Initial Render
render(app, state, puzzles, handleAction);

function normalizeAnswer(input: string): string {
  return input.trim();
}

function isAnswerCorrect(input: string, puzzle: TextPuzzle | SlotPuzzle): boolean {
  const normalized = normalizeAnswer(input);
  const candidates = [puzzle.correctAnswer, ...(puzzle.acceptedAnswers || [])];
  return candidates.some((answer) => normalized === answer);
}

function ensurePuzzleState(id: number): PuzzleProgress {
  if (!state.puzzleState[id]) {
    state.puzzleState[id] = { solved: false, feedback: null };
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

    render(app, state, puzzles, handleAction);
    return;
  }

  if (!state.isLoggedIn || state.isCleared) return;

  if (action === "answer") {
    const puzzle = puzzles.find((p) => p.id === payload?.puzzleId);
    if (!puzzle) return;

    const puzzleState = ensurePuzzleState(puzzle.id);
    const answerValue = typeof payload?.value === "string" ? payload.value : "";

    if (puzzleState.solved) {
      puzzleState.feedback = { kind: "success", message: "クリア済みです。" };
      render(app, state, puzzles, handleAction);
      return;
    }

    if (puzzle.kind === "text" || puzzle.kind === "slot") {
      if (isAnswerCorrect(answerValue, puzzle)) {
        puzzleState.solved = true;
        puzzleState.feedback = { kind: "success", message: "正解！次のカードに進もう。" };

        if (puzzle.kind === "slot" && puzzle.letterCard) {
          const exists = state.letters.some((l) => l.id === puzzle.letterCard!.id);
          if (!exists) {
            state.letters.push(puzzle.letterCard);
          }
        }

        if (puzzle.id === finalPuzzleId) {
          state.isCleared = true;
        }
      } else {
        puzzleState.feedback = { kind: "error", message: "不正解です" };
      }
    }
  }

  render(app, state, puzzles, handleAction);
}

