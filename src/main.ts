const PASSWORD = "kobachi";

type FeedbackKind = "error" | "success";

type CrosswordDirection = "across" | "down";

type CrosswordClue = {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
};

type CrosswordPuzzle = {
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

type TextPuzzle = {
  kind: "text";
  id: number;
  title: string;
  prompt: string;
  placeholderClue: string;
  hint: string;
  correctAnswer: string;
};

type Puzzle = CrosswordPuzzle | TextPuzzle;

type Feedback = {
  kind: FeedbackKind;
  message: string;
};

type GridPosition = {
  row: number;
  col: number;
};

type CrosswordProgress = {
  entries: (string | null)[][];
  activeCell: GridPosition | null;
  activeClue: { direction: CrosswordDirection; number: number } | null;
};

type AppState = {
  authenticated: boolean;
  currentPuzzleIndex: number;
  maxUnlockedPuzzleIndex: number;
  submittedAnswers: string[];
  feedback: Feedback | null;
  revealedHints: Set<number>;
  crosswordProgress: Map<number, CrosswordProgress>;
};

const puzzles: Puzzle[] = [
  {
    id: 1,
    kind: "crossword",
    title: "クロスワード仮問",
    prompt:
      "SATOR スクエアをテーマにしたクロスワードです。各マスに英字1文字を入力し、Across/Down の設問に沿って埋めてみましょう。",
    placeholderClue: "ヒント: ラテン語由来の単語で構成されています。",
    hint:
      "中央の単語 TENET が水平・垂直ともに同じ文字列になるのがスクエア完成の鍵です。",
    finalAnswer: "TENET",
    grid: [
      ["S", "A", "T", "O", "R"],
      ["A", "R", "E", "P", "O"],
      ["T", "E", "N", "E", "T"],
      ["O", "P", "E", "R", "A"],
      ["R", "O", "T", "A", "S"],
    ],
    acrossClues: [
      {
        number: 1,
        clue: "ラテン語で『種をまく人』を意味する語。",
        answer: "SATOR",
        row: 0,
        col: 0,
      },
      {
        number: 2,
        clue: "謎めいた固有名。古い解釈では鋤を操る人物名とされます。",
        answer: "AREPO",
        row: 1,
        col: 0,
      },
      {
        number: 3,
        clue: "『保持する』の意を持つラテン語の動詞。",
        answer: "TENET",
        row: 2,
        col: 0,
      },
      {
        number: 4,
        clue: "ラテン語で『仕事・作品』を表す語。",
        answer: "OPERA",
        row: 3,
        col: 0,
      },
      {
        number: 5,
        clue: "『車輪』を意味する語。語順を逆転すると最初の語に戻ります。",
        answer: "ROTAS",
        row: 4,
        col: 0,
      },
    ],
    downClues: [
      {
        number: 1,
        clue: "縦読みでも『種まく人』となる語。",
        answer: "SATOR",
        row: 0,
        col: 0,
      },
      {
        number: 2,
        clue: "スクエアを縦に読むと現れる謎の固有名。",
        answer: "AREPO",
        row: 0,
        col: 1,
      },
      {
        number: 3,
        clue: "中央列に現れるパリンドローム。",
        answer: "TENET",
        row: 0,
        col: 2,
      },
      {
        number: 4,
        clue: "縦読みでも『作品』を示す語。",
        answer: "OPERA",
        row: 0,
        col: 3,
      },
      {
        number: 5,
        clue: "最下段まで伸びる『車輪』の語。",
        answer: "ROTAS",
        row: 0,
        col: 4,
      },
    ],
  },
  {
    id: 2,
    kind: "text",
    title: "仮問 2",
    prompt: "続くのは静かなつなぎの一文字。",
    placeholderClue: "ヒント: ひらがな1文字。",
    hint: "一文字で言葉と言葉をつなぐ役割を持ちます。",
    correctAnswer: "と",
  },
  {
    id: 3,
    kind: "text",
    title: "仮問 3",
    prompt: "最後は初夏を彩る花の名を。",
    placeholderClue: "ヒント: カタカナ4文字です。",
    hint: "梅雨時期の定番で、土壌の酸性度で色が変わる花です。",
    correctAnswer: "アジサイ",
  },
];

const app: HTMLDivElement = (() => {
  const element = document.getElementById("app");
  if (!(element instanceof HTMLDivElement)) {
    throw new Error("app コンテナが見つかりません");
  }
  return element;
})();

const state: AppState = {
  authenticated: false,
  currentPuzzleIndex: 0,
  maxUnlockedPuzzleIndex: 0,
  submittedAnswers: [],
  feedback: null,
  revealedHints: new Set<number>(),
  crosswordProgress: new Map<number, CrosswordProgress>(),
};

function resetFeedback(): void {
  state.feedback = null;
}

function resetSession(): void {
  state.authenticated = false;
  state.currentPuzzleIndex = 0;
  state.maxUnlockedPuzzleIndex = 0;
  state.submittedAnswers = [];
  state.revealedHints = new Set<number>();
  state.crosswordProgress = new Map<number, CrosswordProgress>();
  resetFeedback();
}

function render(): void {
  if (!state.authenticated) {
    renderLogin();
    return;
  }

  if (state.currentPuzzleIndex >= puzzles.length) {
    renderFinal();
    return;
  }

  const current = puzzles[state.currentPuzzleIndex];
  if (current.kind === "crossword") {
    renderCrosswordPuzzle(current);
  } else {
    renderTextPuzzle(current);
  }
}

function renderLogin(): void {
  app.innerHTML = `
    <section class="app-shell">
      <h1>Hydrangea Lab</h1>
      <div class="puzzle-card">
        <p>この謎解きは特定の参加者のみアクセスできます。パスワードを入力してください。</p>
        <form id="login-form">
          <label for="password-input">パスワード</label>
          <input
            id="password-input"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="パスワードを入力"
          />
          <button id="password-submit" type="submit">入室する</button>
        </form>
        <div id="feedback" class="feedback"></div>
      </div>
    </section>
  `;

  const form = document.getElementById("login-form") as HTMLFormElement | null;
  const passwordInput = document.getElementById("password-input") as HTMLInputElement | null;
  const feedbackArea = document.getElementById("feedback");

  const updateFeedback = (message: string, kind: FeedbackKind): void => {
    if (!(feedbackArea instanceof HTMLDivElement)) {
      return;
    }
    feedbackArea.textContent = message;
    feedbackArea.className = `feedback feedback--${kind}`;
  };

  const attemptLogin = (): void => {
    const candidate = passwordInput?.value.trim();
    if (candidate === PASSWORD) {
      state.authenticated = true;
      resetFeedback();
      render();
    } else {
      updateFeedback("パスワードが違います。", "error");
    }
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    attemptLogin();
  });
}

function buildProgressIndicators(): string {
  return puzzles
    .map((puzzle, index) => {
      let status: "current" | "completed" | "available" | "locked";
      const hasAnswer = state.submittedAnswers[index] !== undefined;
      if (index > state.maxUnlockedPuzzleIndex) {
        status = "locked";
      } else if (index === state.currentPuzzleIndex) {
        status = "current";
      } else if (hasAnswer) {
        status = "completed";
      } else {
        status = "available";
      }
      const className = `progress-step progress-step--${status}`;
      return `<div class="${className}" data-index="${index}" data-status="${status}" data-step="${puzzle.id}"></div>`;
    })
    .join("");
}

function attachProgressIndicatorHandlers(): void {
  const steps = Array.from(
    document.querySelectorAll<HTMLDivElement>(".progress-step[data-index]"),
  );
  steps.forEach((step) => {
    const index = Number(step.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }
    step.addEventListener("click", () => {
      if (index > state.maxUnlockedPuzzleIndex) {
        return;
      }
      if (index === state.currentPuzzleIndex) {
        return;
      }
      state.currentPuzzleIndex = index;
      resetFeedback();
      render();
    });
  });
}

function buildPaginationControls(): string {
  const canGoPrevious = state.currentPuzzleIndex > 0;
  const furthestIndex = Math.min(state.maxUnlockedPuzzleIndex, puzzles.length);
  const canGoNext = state.currentPuzzleIndex < furthestIndex;

  const prevAttrs = canGoPrevious ? "" : "disabled";
  const nextAttrs = canGoNext ? "" : "disabled";

  return `
    <div class="pagination">
      <button id="nav-prev" type="button" ${prevAttrs}>前へ</button>
      <button id="nav-next" type="button" ${nextAttrs}>次へ</button>
    </div>
  `;
}

function attachPaginationHandlers(): void {
  const prevButton = document.getElementById("nav-prev");
  const nextButton = document.getElementById("nav-next");

  const moveToIndex = (index: number): void => {
    const furthestIndex = Math.min(state.maxUnlockedPuzzleIndex, puzzles.length);
    if (index < 0 || index > furthestIndex || index === state.currentPuzzleIndex) {
      return;
    }
    state.currentPuzzleIndex = index;
    resetFeedback();
    render();
  };

  prevButton?.addEventListener("click", () => {
    moveToIndex(Math.max(state.currentPuzzleIndex - 1, 0));
  });

  nextButton?.addEventListener("click", () => {
    const furthestIndex = Math.min(state.maxUnlockedPuzzleIndex, puzzles.length);
    moveToIndex(Math.min(state.currentPuzzleIndex + 1, furthestIndex));
  });
}

function renderTextPuzzle(puzzle: TextPuzzle): void {
  const hintRevealed = state.revealedHints.has(puzzle.id);
  const progressIndicators = buildProgressIndicators();
  const paginationControls = buildPaginationControls();

  const feedbackHtml = state.feedback
    ? `<div class="feedback feedback--${state.feedback.kind}">${state.feedback.message}</div>`
    : "";

  const hintButtonAttrs = hintRevealed
    ? "id=\"hint-button\" type=\"button\" disabled"
    : "id=\"hint-button\" type=\"button\"";
  const hintText = hintRevealed ? puzzle.hint : "ヒントはまだ非公開です。";
  const hintClass = hintRevealed ? "hint hint--visible" : "hint";

  app.innerHTML = `
    <section class="app-shell">
      <h1>Hydrangea Riddles</h1>
      <div class="progress">${progressIndicators}</div>
      <div class="puzzle-card">
        <h2>${puzzle.title}</h2>
        <p>${puzzle.prompt}</p>
        <p><em>${puzzle.placeholderClue}</em></p>
        <div class="hint-row">
          <button ${hintButtonAttrs}>ヒントを見る</button>
          <div id="hint-area" class="${hintClass}">${hintText}</div>
        </div>
        <label for="answer-input-${puzzle.id}">回答</label>
        <input
          id="answer-input-${puzzle.id}"
          type="text"
          placeholder="ここに回答を入力"
          autocomplete="off"
        />
        <button id="answer-submit" type="button">回答を送信</button>
        ${feedbackHtml}
        ${paginationControls}
      </div>
    </section>
  `;

  const answerInput = document.getElementById(`answer-input-${puzzle.id}`) as HTMLInputElement | null;
  const submitButton = document.getElementById("answer-submit");
  const hintButton = document.getElementById("hint-button");
  const hintArea = document.getElementById("hint-area");

  const submitAnswer = (): void => {
    const candidate = answerInput?.value.trim();
    if (!candidate) {
      state.feedback = {
        kind: "error",
        message: "回答を入力してください。",
      };
      render();
      return;
    }

    const currentIndex = state.currentPuzzleIndex;
    const previousMax = state.maxUnlockedPuzzleIndex;
    const nextIndex = Math.min(currentIndex + 1, puzzles.length);

    if (candidate === puzzle.correctAnswer) {
      state.submittedAnswers[currentIndex] = candidate;
      state.maxUnlockedPuzzleIndex = Math.max(previousMax, nextIndex);
      const unlockedNewPuzzle = nextIndex > previousMax;
      state.feedback = {
        kind: "success",
        message: unlockedNewPuzzle ? "正解です！次の問題へ。" : "正解です！",
      };
      if (unlockedNewPuzzle) {
        state.currentPuzzleIndex = nextIndex;
      }
      render();
    } else {
      state.feedback = {
        kind: "error",
        message: "まだ正解ではありません。もう一度試してください。",
      };
      render();
    }
  };

  const revealHint = (): void => {
    if (hintRevealed) {
      return;
    }
    state.revealedHints.add(puzzle.id);
    if (hintArea instanceof HTMLDivElement) {
      hintArea.textContent = puzzle.hint;
      hintArea.classList.add("hint--visible");
    }
    hintButton?.setAttribute("disabled", "true");
  };

  hintButton?.addEventListener("click", revealHint);
  submitButton?.addEventListener("click", submitAnswer);
  answerInput?.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      submitAnswer();
    }
  });

  if (answerInput) {
    const existingAnswer = state.submittedAnswers[state.currentPuzzleIndex] ?? "";
    answerInput.value = existingAnswer;
  }

  attachProgressIndicatorHandlers();
  attachPaginationHandlers();

  answerInput?.focus();
}
function ensureCrosswordProgress(puzzle: CrosswordPuzzle): CrosswordProgress {
  const existing = state.crosswordProgress.get(puzzle.id);
  if (existing) {
    return existing;
  }

  const entries = puzzle.grid.map((row) =>
    row.map((cell) => (cell ? "" : null))
  );

  const firstEditable = findFirstEditableCell(puzzle);
  const initialClue = puzzle.acrossClues[0] ?? puzzle.downClues[0] ?? null;

  const progress: CrosswordProgress = {
    entries,
    activeCell: firstEditable,
    activeClue: initialClue
      ? {
          direction: puzzle.acrossClues.length > 0 ? "across" : "down",
          number: initialClue.number,
        }
      : null,
  };

  state.crosswordProgress.set(puzzle.id, progress);
  return progress;
}

function findFirstEditableCell(puzzle: CrosswordPuzzle): GridPosition | null {
  for (let row = 0; row < puzzle.grid.length; row += 1) {
    for (let col = 0; col < puzzle.grid[row].length; col += 1) {
      if (isCellEditable(puzzle, row, col)) {
        return { row, col };
      }
    }
  }
  return null;
}

function getClueByNumber(
  puzzle: CrosswordPuzzle,
  direction: CrosswordDirection,
  number: number,
): CrosswordClue | undefined {
  const source = direction === "across" ? puzzle.acrossClues : puzzle.downClues;
  return source.find((clue) => clue.number === number);
}

function getActiveClue(
  puzzle: CrosswordPuzzle,
  progress: CrosswordProgress,
): { clue: CrosswordClue; direction: CrosswordDirection } | null {
  if (!progress.activeClue) {
    return null;
  }
  const { direction, number } = progress.activeClue;
  const clue = getClueByNumber(puzzle, direction, number);
  if (!clue) {
    return null;
  }
  return { clue, direction };
}

function getCellsForClue(
  puzzle: CrosswordPuzzle,
  clue: CrosswordClue,
  direction: CrosswordDirection,
): GridPosition[] {
  const cells: GridPosition[] = [];
  for (let index = 0; index < clue.answer.length; index += 1) {
    const row = direction === "across" ? clue.row : clue.row + index;
    const col = direction === "across" ? clue.col + index : clue.col;
    if (!isCellEditable(puzzle, row, col)) {
      break;
    }
    cells.push({ row, col });
  }
  return cells;
}

function isCellEditable(puzzle: CrosswordPuzzle, row: number, col: number): boolean {
  return Boolean(puzzle.grid[row]?.[col]);
}

function isClueSolved(
  puzzle: CrosswordPuzzle,
  clue: CrosswordClue,
  direction: CrosswordDirection,
  progress: CrosswordProgress,
): boolean {
  const cells = getCellsForClue(puzzle, clue, direction);
  return cells.every(({ row, col }, index) => {
    const entry = progress.entries[row][col];
    if (entry === null) {
      return false;
    }
    const expected = clue.answer[index]?.toUpperCase() ?? "";
    return entry.toUpperCase() === expected;
  });
}

function isCrosswordSolved(puzzle: CrosswordPuzzle, progress: CrosswordProgress): boolean {
  for (let row = 0; row < puzzle.grid.length; row += 1) {
    for (let col = 0; col < puzzle.grid[row].length; col += 1) {
      const solution = puzzle.grid[row][col];
      if (!solution) {
        continue;
      }
      const entry = progress.entries[row][col];
      if (!entry || entry.toUpperCase() !== solution.toUpperCase()) {
        return false;
      }
    }
  }
  return true;
}

function computeNumberMap(puzzle: CrosswordPuzzle): Map<string, number> {
  const map = new Map<string, number>();
  const register = (clue: CrosswordClue): void => {
    const key = `${clue.row}-${clue.col}`;
    if (!map.has(key) || (map.get(key) ?? Number.POSITIVE_INFINITY) > clue.number) {
      map.set(key, clue.number);
    }
  };

  puzzle.acrossClues.forEach(register);
  puzzle.downClues.forEach(register);

  return map;
}

function findClueContainingCell(
  puzzle: CrosswordPuzzle,
  position: GridPosition,
  direction: CrosswordDirection,
): CrosswordClue | null {
  const source = direction === "across" ? puzzle.acrossClues : puzzle.downClues;
  for (const clue of source) {
    const cells = getCellsForClue(puzzle, clue, direction);
    if (cells.some((cell) => cell.row === position.row && cell.col === position.col)) {
      return clue;
    }
  }
  return null;
}

function syncActiveClue(
  progress: CrosswordProgress,
  puzzle: CrosswordPuzzle,
  position: GridPosition,
): void {
  const preferredDirection = progress.activeClue?.direction ?? "across";
  const preferred = findClueContainingCell(puzzle, position, preferredDirection);
  if (preferred) {
    progress.activeClue = { direction: preferredDirection, number: preferred.number };
    return;
  }
  const alternateDirection = preferredDirection === "across" ? "down" : "across";
  const alternate = findClueContainingCell(puzzle, position, alternateDirection);
  if (alternate) {
    progress.activeClue = { direction: alternateDirection, number: alternate.number };
    return;
  }
  progress.activeClue = null;
}

function moveWithinClue(
  progress: CrosswordProgress,
  puzzle: CrosswordPuzzle,
  step: number,
): void {
  const active = getActiveClue(puzzle, progress);
  if (!active || !progress.activeCell) {
    return;
  }
  const cells = getCellsForClue(puzzle, active.clue, active.direction);
  const index = cells.findIndex(
    (cell) => cell.row === progress.activeCell?.row && cell.col === progress.activeCell?.col,
  );
  if (index === -1) {
    return;
  }
  const nextIndex = index + step;
  if (nextIndex >= 0 && nextIndex < cells.length) {
    progress.activeCell = { ...cells[nextIndex] };
    syncActiveClue(progress, puzzle, progress.activeCell);
  }
}

function moveActiveCell(
  progress: CrosswordProgress,
  puzzle: CrosswordPuzzle,
  deltaRow: number,
  deltaCol: number,
): void {
  const current = progress.activeCell;
  if (!current) {
    const firstEditable = findFirstEditableCell(puzzle);
    if (firstEditable) {
      progress.activeCell = firstEditable;
      syncActiveClue(progress, puzzle, firstEditable);
    }
    return;
  }

  let nextRow = current.row + deltaRow;
  let nextCol = current.col + deltaCol;

  while (
    nextRow >= 0 &&
    nextRow < puzzle.grid.length &&
    nextCol >= 0 &&
    nextCol < puzzle.grid[nextRow].length
  ) {
    if (isCellEditable(puzzle, nextRow, nextCol)) {
      const nextPosition = { row: nextRow, col: nextCol };
      progress.activeCell = nextPosition;
      syncActiveClue(progress, puzzle, nextPosition);
      return;
    }
    nextRow += deltaRow;
    nextCol += deltaCol;
  }
}
function renderCrosswordPuzzle(puzzle: CrosswordPuzzle): void {
  const progressIndicators = buildProgressIndicators();
  const paginationControls = buildPaginationControls();
  const progress = ensureCrosswordProgress(puzzle);
  const hintRevealed = state.revealedHints.has(puzzle.id);
  const numbersMap = computeNumberMap(puzzle);
  const active = getActiveClue(puzzle, progress);

  const highlightedCells = new Set<string>();
  if (active) {
    const cells = getCellsForClue(puzzle, active.clue, active.direction);
    cells.forEach((cell) => highlightedCells.add(`${cell.row}-${cell.col}`));
  }

  const gridHtml = puzzle.grid
    .map((row, rowIndex) => {
      const cellsHtml = row
        .map((cell, colIndex) => {
          if (!cell) {
            return '<div class="crossword-cell crossword-cell--block" role="presentation"></div>';
          }

          const key = `${rowIndex}-${colIndex}`;
          const classes = ["crossword-cell"];
          if (
            progress.activeCell &&
            progress.activeCell.row === rowIndex &&
            progress.activeCell.col === colIndex
          ) {
            classes.push("crossword-cell--active");
          }
          if (highlightedCells.has(key)) {
            classes.push("crossword-cell--highlight");
          }
          const entry = progress.entries[rowIndex][colIndex] ?? "";
          if (entry) {
            classes.push("crossword-cell--filled");
          }
          const numberLabel = numbersMap.get(key);
          const ariaLabel = numberLabel
            ? `${numberLabel}番のマス (${rowIndex + 1}行${colIndex + 1}列)`
            : `${rowIndex + 1}行${colIndex + 1}列`;
          return `
            <button
              type="button"
              class="${classes.join(" ")}"
              data-row="${rowIndex}"
              data-col="${colIndex}"
              aria-label="${ariaLabel}"
            >
              ${numberLabel ? `<span class="crossword-cell__number">${numberLabel}</span>` : ""}
              <span class="crossword-cell__letter">${entry}</span>
            </button>
          `;
        })
        .join("");
      return `<div class="crossword-row">${cellsHtml}</div>`;
    })
    .join("");

  const renderClueList = (direction: CrosswordDirection, clues: CrosswordClue[]): string =>
    clues
      .map((clue) => {
        const isActive =
          progress.activeClue?.direction === direction &&
          progress.activeClue?.number === clue.number;
        const solved = isClueSolved(puzzle, clue, direction, progress);
        const classes = ["crossword-clue"];
        if (isActive) {
          classes.push("crossword-clue--active");
        }
        if (solved) {
          classes.push("crossword-clue--solved");
        }
        return `
          <li class="${classes.join(" ")}" data-direction="${direction}" data-number="${clue.number}">
            <span class="crossword-clue__number">${clue.number}</span>
            <span class="crossword-clue__text">${clue.clue}</span>
          </li>
        `;
      })
      .join("");

  const feedbackHtml = state.feedback
    ? `<div class="feedback feedback--${state.feedback.kind}">${state.feedback.message}</div>`
    : "";

  const hintButtonAttrs = hintRevealed
    ? "id=\"hint-button\" type=\"button\" disabled"
    : "id=\"hint-button\" type=\"button\"";
  const hintText = hintRevealed ? puzzle.hint : "ヒントはまだ非公開です。";
  const hintClass = hintRevealed ? "hint hint--visible" : "hint";
  const testFillButtonHtml =
    puzzle.id === 1
      ? `
          <div class="crossword-test-controls">
            <button id="crossword-fill-all" type="button" class="crossword-fill">全マス入力</button>
            <button id="crossword-confirm" type="button" class="crossword-confirm">答えを確定する</button>
          </div>
        `
      : "";

  app.innerHTML = `
    <section class="app-shell">
      <h1>Hydrangea Riddles</h1>
      <div class="progress">${progressIndicators}</div>
      <div class="puzzle-card">
        <h2>${puzzle.title}</h2>
        <p>${puzzle.prompt}</p>
        <p><em>${puzzle.placeholderClue}</em></p>
        <div class="hint-row">
          <button ${hintButtonAttrs}>ヒントを見る</button>
          <div id="hint-area" class="${hintClass}">${hintText}</div>
        </div>
        <div class="crossword-layout">
          <div class="crossword-grid" role="grid" aria-label="クロスワードの盤面">
            ${gridHtml}
          </div>
          <div class="crossword-side">
            <div class="crossword-input">
              <label for="crossword-entry-${puzzle.id}">選択中のマス</label>
              <input
                id="crossword-entry-${puzzle.id}"
                type="text"
                inputmode="text"
                autocomplete="off"
                maxlength="1"
                placeholder="1文字入力"
              />
            </div>
            <div class="crossword-clues">
              <div class="crossword-clues__group" data-direction="across">
                <h3>Across</h3>
                <ol>
                  ${renderClueList("across", puzzle.acrossClues)}
                </ol>
              </div>
              <div class="crossword-clues__group" data-direction="down">
                <h3>Down</h3>
                <ol>
                  ${renderClueList("down", puzzle.downClues)}
                </ol>
              </div>
            </div>
            ${testFillButtonHtml}
          </div>
        </div>
        ${feedbackHtml}
        ${paginationControls}
      </div>
    </section>
  `;

  const entryInput = document.getElementById(`crossword-entry-${puzzle.id}`) as HTMLInputElement | null;
  const hintButton = document.getElementById("hint-button");
  const hintArea = document.getElementById("hint-area");
  const fillAllButton = document.getElementById("crossword-fill-all");
  const confirmButton = document.getElementById("crossword-confirm");

  if (entryInput) {
    if (progress.activeCell) {
      const { row, col } = progress.activeCell;
      const currentValue = progress.entries[row][col] ?? "";
      entryInput.value = currentValue;
      entryInput.focus();
      entryInput.select();
    } else {
      entryInput.value = "";
    }
  }

  const revealHint = (): void => {
    if (hintRevealed) {
      return;
    }
    state.revealedHints.add(puzzle.id);
    if (hintArea instanceof HTMLDivElement) {
      hintArea.textContent = puzzle.hint;
      hintArea.classList.add("hint--visible");
    }
    hintButton?.setAttribute("disabled", "true");
  };

  hintButton?.addEventListener("click", revealHint);

  const handleCompletion = (): void => {
    if (!isCrosswordSolved(puzzle, progress)) {
      return;
    }
    const currentIndex = state.currentPuzzleIndex;
    const nextIndex = Math.min(currentIndex + 1, puzzles.length);
    const alreadyFinalized =
      state.submittedAnswers[currentIndex] === puzzle.finalAnswer &&
      state.maxUnlockedPuzzleIndex >= nextIndex;
    if (alreadyFinalized) {
      return;
    }
    const previousMax = state.maxUnlockedPuzzleIndex;
    state.submittedAnswers[currentIndex] = puzzle.finalAnswer;
    state.maxUnlockedPuzzleIndex = Math.max(previousMax, nextIndex);
    const unlockedNewPuzzle = nextIndex > previousMax;
    state.feedback = {
      kind: "success",
      message: unlockedNewPuzzle
        ? "全マス正解です！次の問題へ進みましょう。"
        : "全マス正解です！",
    };
    if (unlockedNewPuzzle) {
      state.currentPuzzleIndex = nextIndex;
    }
    render();
  };

  fillAllButton?.addEventListener("click", () => {
    for (let row = 0; row < puzzle.grid.length; row += 1) {
      for (let col = 0; col < puzzle.grid[row].length; col += 1) {
        const solution = puzzle.grid[row][col];
        if (!solution) {
          continue;
        }
        progress.entries[row][col] = solution.toUpperCase();
      }
    }
    const firstEditable = findFirstEditableCell(puzzle);
    progress.activeCell = firstEditable;
    if (firstEditable) {
      syncActiveClue(progress, puzzle, firstEditable);
    }
    state.feedback = {
      kind: "success",
      message: "全マスを仮入力しました。「答えを確定する」を押してください。",
    };
    render();
  });

  confirmButton?.addEventListener("click", () => {
    if (isCrosswordSolved(puzzle, progress)) {
      handleCompletion();
      return;
    }
    state.feedback = {
      kind: "error",
      message: "まだ未完成です。入力内容を見直してから『答えを確定する』を押してください。",
    };
    render();
  });

  const handleInput = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    if (!progress.activeCell) {
      event.target.value = "";
      return;
    }
    const rawValue = event.target.value;
    if (!rawValue) {
      const { row, col } = progress.activeCell;
      progress.entries[row][col] = "";
      resetFeedback();
      render();
      return;
    }
    const letter = rawValue.slice(-1).toUpperCase();
    const { row, col } = progress.activeCell;
    progress.entries[row][col] = letter;
    event.target.value = letter;
    moveWithinClue(progress, puzzle, 1);
    resetFeedback();
    render();
    handleCompletion();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!progress.activeCell) {
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      const { row, col } = progress.activeCell;
      const currentValue = progress.entries[row][col] ?? "";
      if (currentValue) {
        progress.entries[row][col] = "";
      } else {
        moveWithinClue(progress, puzzle, -1);
        if (progress.activeCell) {
          const previous = progress.activeCell;
          progress.entries[previous.row][previous.col] = "";
        }
      }
      resetFeedback();
      render();
      return;
    }

    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    };

    const delta = deltas[event.key];
    if (delta) {
      event.preventDefault();
      moveActiveCell(progress, puzzle, delta[0], delta[1]);
      resetFeedback();
      render();
    }
  };

  entryInput?.addEventListener("input", handleInput);
  entryInput?.addEventListener("keydown", handleKeyDown);

  const handleCellSelection = (row: number, col: number): void => {
    if (!isCellEditable(puzzle, row, col)) {
      return;
    }
    const clickedPosition = { row, col };
    const sameCell =
      progress.activeCell?.row === row && progress.activeCell?.col === col;
    let desiredDirection = progress.activeClue?.direction ?? "across";
    let clue = findClueContainingCell(puzzle, clickedPosition, desiredDirection);
    if (sameCell) {
      const alternateDirection = desiredDirection === "across" ? "down" : "across";
      const alternate = findClueContainingCell(puzzle, clickedPosition, alternateDirection);
      if (alternate) {
        desiredDirection = alternateDirection;
        clue = alternate;
      }
    }
    if (!clue) {
      const alternateDirection = desiredDirection === "across" ? "down" : "across";
      const alternate = findClueContainingCell(puzzle, clickedPosition, alternateDirection);
      if (alternate) {
        desiredDirection = alternateDirection;
        clue = alternate;
      }
    }
    progress.activeCell = clickedPosition;
    if (clue) {
      progress.activeClue = { direction: desiredDirection, number: clue.number };
    } else {
      syncActiveClue(progress, puzzle, clickedPosition);
    }
    resetFeedback();
    render();
  };

  const cellButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".crossword-cell[data-row]"),
  );
  cellButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const row = Number(button.dataset.row);
      const col = Number(button.dataset.col);
      if (Number.isNaN(row) || Number.isNaN(col)) {
        return;
      }
      handleCellSelection(row, col);
    });
  });

  const clueItems = Array.from(
    document.querySelectorAll<HTMLLIElement>(".crossword-clue"),
  );
  clueItems.forEach((item) => {
    item.addEventListener("click", () => {
      const direction = item.dataset.direction as CrosswordDirection | undefined;
      const number = Number(item.dataset.number);
      if (!direction || Number.isNaN(number)) {
        return;
      }
      const clue = getClueByNumber(puzzle, direction, number);
      if (!clue) {
        return;
      }
      progress.activeClue = { direction, number };
      const cells = getCellsForClue(puzzle, clue, direction);
      if (cells.length > 0) {
        progress.activeCell = { ...cells[0] };
      }
      resetFeedback();
      render();
    });
  });

  handleCompletion();

  attachProgressIndicatorHandlers();
  attachPaginationHandlers();
}

function renderFinal(): void {
  const combinedAnswer = state.submittedAnswers.join("");
  const progressIndicators = buildProgressIndicators();
  const paginationControls = buildPaginationControls();

  app.innerHTML = `
    <section class="app-shell">
      <h1>最終回答</h1>
      <div class="progress">${progressIndicators}</div>
      <div class="puzzle-card">
        <p>おめでとうございます！すべての仮問に正解しました。</p>
        <p>各回答をつなげると次の言葉になります。</p>
        <div class="final-answer">${combinedAnswer}</div>
        <footer>※ 現在は仮問です。本番用の問題に差し替えてもこの合成ロジックを再利用できます。</footer>
      </div>
      ${paginationControls}
      <button id="reset" type="button">最初からやり直す</button>
    </section>
  `;

  const resetButton = document.getElementById("reset");
  resetButton?.addEventListener("click", () => {
    resetSession();
    render();
  });

  attachProgressIndicatorHandlers();
  attachPaginationHandlers();
}

render();
