export type FeedbackKind = "error" | "success";

export type StageId = "ST1" | "ST2" | "ST4";

export type CrosswordDirection = "across" | "down";

export type CrosswordClue = {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
};

export type CrosswordPuzzle = {
  id: number;
  kind: "crossword";
  title: string;
  size: { rows: number; cols: number };
  clues: CrosswordClue[];
};

export type TextPuzzle = {
  id: number;
  kind: "text";
  title: string;
  prompt: string;
  placeholderClue: string;
  hint: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  mapQuery?: string;
  content?: string[];
  imageUrl?: string;
  choices?: string[];
  accentColor?: string;
  accentShadow?: string;
};

export type InfoPageAction = {
  kind: "continue" | "link" | "reset";
  label: string;
  url?: string;
};

export type InfoPage = {
  id: number;
  kind: "info";
  title: string;
  lead: string;
  content: string[];
  actions?: InfoPageAction[];
};

export type SlotPuzzle = {
  id: number;
  kind: "slot";
  title: string;
  slots: number;
  targetSlot: number; // 0-indexed
  prefilled?: { index: number; char: string }[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  targetColor?: string;
  targetTextColor?: string;
  prompt?: string;
  hint?: string;
  placeholderClue?: string;
  mapQuery?: string;
};

export type Puzzle = CrosswordPuzzle | TextPuzzle | InfoPage | SlotPuzzle;

export type Feedback = {
  kind: FeedbackKind;
  message: string;
};

export type GridPosition = {
  row: number;
  col: number;
};

export type CrosswordProgress = {
  grid: string[][];
  activeCell: GridPosition | null;
  direction: CrosswordDirection;
};

export type AppState = {
  isLoggedIn: boolean;
  isCleared: boolean;
  currentStage: StageId;
  tos: { agreed: boolean; openedOnce: boolean };
  crossword: { [key: number]: CrosswordProgress };
  feedback: Feedback | null;
  puzzleState: {
    [id: number]: {
      solved: boolean;
      feedback: Feedback | null;
    };
  };
};
