export type FeedbackKind = "error" | "success";

export type StageId = "ST1" | "ST2" | "ST3" | "ST4" | "ST5";

export type StationCard = {
  id: string;
  name: string;
  lineId: string;
  lineName: string;
  lineColor: string;
  value: number;
};

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
  hint?: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  answerNormalization?: "text" | "numeric";
  mapQuery?: string;
  content?: string[];
  imageUrl?: string;
  imageAlt?: string;
  choices?: string[];
  choiceAccents?: ChoiceAccent[];
  accentColor?: string;
  accentShadow?: string;
  transformPairs?: { from: string; to: string }[];
};

export type ChoiceAccent = {
  label: string;
  highlight: { start: number; length: number };
  accentColor: string;
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
  answerNormalization?: "text" | "numeric";
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

export type PuzzleProgress = {
  solved: boolean;
  feedback: Feedback | null;
  awardedCard?: StationCard | null;
};

export type AppState = {
  isLoggedIn: boolean;
  isCleared: boolean;
  currentStage: StageId;
  clearedStages: StageId[];
  stationCardDisplay: StationCard | null;
  pendingStageAfterCard: StageId | null;
  pendingClearAfterCard: boolean;
  tos: { agreed: boolean; openedOnce: boolean };
  crossword: { [key: number]: CrosswordProgress };
  feedback: Feedback | null;
  puzzleState: {
    [id: number]: PuzzleProgress;
  };
};
