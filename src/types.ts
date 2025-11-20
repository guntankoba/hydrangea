export type FeedbackKind = "error" | "success";

export type CrosswordDirection = "across" | "down";

export type CrosswordClue = {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
};

export type CrosswordPuzzle = {
  kind: "crossword";
  id: number;
  title: string;
  prompt: string;
  placeholderClue: string;
  hint: string;
  finalAnswer: string;
  grid: (string | null)[][];
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
};

export type TextPuzzle = {
  kind: "text";
  id: number;
  title: string;
  prompt: string;
  placeholderClue: string;
  hint: string;
  correctAnswer: string;
  mapQuery?: string;
};

export type InfoPageAction =
  | {
      kind: "continue";
      label?: string;
    }
  | {
      kind: "reset";
      label?: string;
    };

export type InfoPage = {
  kind: "info";
  id: number;
  title: string;
  lead?: string;
  content: string[];
  actions?: InfoPageAction[];
};

export type Puzzle = CrosswordPuzzle | TextPuzzle | InfoPage;

export type Feedback = {
  kind: FeedbackKind;
  message: string;
};

export type GridPosition = {
  row: number;
  col: number;
};

export type CrosswordProgress = {
  entries: (string | null)[][];
  activeCell: GridPosition | null;
  activeClue: { direction: CrosswordDirection; number: number } | null;
  requiresConfirmation: boolean;
};

export type AppState = {
  authenticated: boolean;
  currentPuzzleIndex: number;
  maxUnlockedPuzzleIndex: number;
  submittedAnswers: string[];
  feedback: Feedback | null;
  revealedHints: Set<number>;
  crosswordProgress: Map<number, CrosswordProgress>;
  mapLinksByPuzzleIndex: (string | undefined)[];
};
