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
  mapQuery?: string;
};

type InfoPageAction =
  | {
      kind: "continue";
      label?: string;
    }
  | {
      kind: "reset";
      label?: string;
    };

type InfoPage = {
  kind: "info";
  id: number;
  title: string;
  lead?: string;
  content: string[];
  actions?: InfoPageAction[];
};

type Puzzle = CrosswordPuzzle | TextPuzzle | InfoPage;

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
  requiresConfirmation: boolean;
};

type AppState = {
  authenticated: boolean;
  currentPuzzleIndex: number;
  maxUnlockedPuzzleIndex: number;
  submittedAnswers: string[];
  feedback: Feedback | null;
  revealedHints: Set<number>;
  crosswordProgress: Map<number, CrosswordProgress>;
  mapLinksByPuzzleIndex: (string | undefined)[];
};

const puzzles: Puzzle[] = [
  {
    id: 1,
    kind: "info",
    title: "謎解きの概要",
    lead: "東京の下町から都心まで、駅を巡りながら手がかりを集める全5問のストーリーです。",
    content: [
      "各エリアでは現地でしか得られない手掛かりを撮影・観察して回答を導きます。",
      "答えがわかったら、次に向かう駅名を入力して次のページを解放してください。",
      "このページの文章はサンプルです。本番ではローカル情報に合わせて差し替えてください。",
    ],
    actions: [{ kind: "continue", label: "例題へ進む" }],
  },
  {
    id: 2,
    kind: "text",
    title: "例題",
    prompt:
      "例題: 金町駅のホームで見つかる色と同じ花を選ぶとしたら何色でしょう? 入力欄と回答ボタンの使い方を確認するため、答えとして駅名『金町』を入力してください。",
    placeholderClue: "ヒント: 練習用の正解は駅名『金町』です。",
    hint: "例題では仮の答えとして『金町』を入力すると次に進めます。",
    correctAnswer: "金町",
  },
  {
    id: 3,
    kind: "info",
    title: "★金町",
    lead: "スタート地点は常磐線の金町駅。下町の商店街から散策を始めます。",
    content: [
      "駅前ロータリーの案内図や期間限定ポスターを確認し、初回の手掛かりをメモしましょう。",
      "歩き出す前に、このページに掲載されている注意事項をチームで共有してください。",
    ],
    actions: [{ kind: "continue", label: "問1に挑戦" }],
  },
  {
    id: 4,
    kind: "text",
    title: "問1",
    prompt:
      "金町駅周辺で見つけたサインの指示に従い、次に向かう駅名を入力してください。",
    placeholderClue: "ヒント: 次の目的地となる駅名（漢字）を入力します。",
    hint: "商店街のアーチに掲げられた広告内に、次の駅名が隠されています。",
    correctAnswer: "秋葉原",
    mapQuery: "秋葉原駅",
  },
  {
    id: 5,
    kind: "info",
    title: "★秋葉原",
    lead: "電気街の雑踏へ移動しました。電子パーツ店が立ち並ぶエリアを調べます。",
    content: [
      "駅の外観や中央通りに掲示された限定イベント告知に注目してください。",
      "次の謎を解くために必要なキーワードが、実地で確認できる小さな看板に記載されています。",
    ],
    actions: [{ kind: "continue", label: "問2に進む" }],
  },
  {
    id: 6,
    kind: "text",
    title: "問2",
    prompt:
      "秋葉原で集めた手掛かりを並べ替えると、次に向かう駅名が浮かび上がります。",
    placeholderClue: "ヒント: 都内の主要ターミナル駅が答えです。",
    hint: "万世橋近くに掲示された歴史パネルの頭文字がヒントになります。",
    correctAnswer: "新宿",
    mapQuery: "新宿駅",
  },
  {
    id: 7,
    kind: "info",
    title: "★新宿",
    lead: "高層ビルの展望デッキから次のルートを確認し、最後の下町エリアへ向かいます。",
    content: [
      "新宿駅西口のデジタルサイネージに流れる映像から特定のキーワードを抜き出してください。",
      "そのキーワードと一致する案内表示が、次の街へのヒントになります。",
    ],
    actions: [{ kind: "continue", label: "問3を開く" }],
  },
  {
    id: 8,
    kind: "text",
    title: "問3",
    prompt:
      "新宿で得たキーワードを手がかりに、私鉄沿線へ向かう駅名を導いてください。",
    placeholderClue: "ヒント: 漢字3文字の駅名です。",
    hint: "南口バスターミナルで配布されている路線図を確認すると答えが見えてきます。",
    correctAnswer: "下高井戸",
    mapQuery: "下高井戸駅",
  },
  {
    id: 9,
    kind: "info",
    title: "★下高井戸",
    lead: "商店街と路面電車が交差する下高井戸で、フィナーレに向けた手掛かりを探します。",
    content: [
      "駅前市場の掲示板に掲載された曜日ごとのイベントをチェックしてください。",
      "次のページでは、ここで得たすべての情報を使って最後の答えを導きます。",
    ],
    actions: [{ kind: "continue", label: "最後の問へ" }],
  },
  {
    id: 10,
    kind: "text",
    title: "最後の問",
    prompt:
      "下高井戸で集めたキーワードを組み合わせ、最終確認用の合言葉を入力してください。",
    placeholderClue: "ヒント: テスト用に「クリア」と入力して進めます。",
    hint: "本番では現地で得た複数のキーワードを順番に並べます。",
    correctAnswer: "クリア",
  },
  {
    id: 11,
    kind: "info",
    title: "クリア",
    lead: "お疲れさまでした！街歩きのルートを最後まで辿ることができました。",
    content: [
      "ここで紹介した文章はダミーです。現地調査が完了したら、体験の締めくくりとなるメッセージに差し替えてください。",
      "参加者からのフィードバックを記入してもらうフォームや、次回イベントの告知を配置することもできます。",
    ],
    actions: [{ kind: "reset", label: "最初からやり直す" }],
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
  mapLinksByPuzzleIndex: [],
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
  state.mapLinksByPuzzleIndex = [];
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
  } else if (current.kind === "text") {
    renderTextPuzzle(current);
  } else {
    renderInfoPage(current);
  }
}

function renderLogin(): void {
  app.innerHTML = `
    <section class="app-shell">
      <h1>Hydrangea Walk</h1>
      <div class="puzzle-card">
        <p>この謎解きは特定の参加者のみアクセスできます。パスワードを入力してください。</p>
        <form id="login-form" class="form-stack">
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

function renderInfoPage(puzzle: InfoPage): void {
  const currentIndex = state.currentPuzzleIndex;
  if (state.submittedAnswers[currentIndex] === undefined) {
    state.submittedAnswers[currentIndex] = "";
  }
  state.maxUnlockedPuzzleIndex = Math.max(state.maxUnlockedPuzzleIndex, currentIndex);

  const progressIndicators = buildProgressIndicators();
  const paginationControls = buildPaginationControls();
  const leadHtml = puzzle.lead ? `<p class="info-lead">${puzzle.lead}</p>` : "";
  const mapLinkHtml = mapLinkHtmlForIndex(currentIndex);
  const bodyHtml = puzzle.content.map((paragraph) => `<p>${paragraph}</p>`).join("");

  const actions = puzzle.actions && puzzle.actions.length > 0
    ? puzzle.actions
    : [{ kind: "continue" as const }];
  const actionsHtml = actions
    .map((action, index) => {
      const label = action.label ?? (action.kind === "continue" ? "次へ進む" : "最初に戻る");
      return `<button class="info-action" data-kind="${action.kind}" data-index="${index}">${label}</button>`;
    })
    .join("");
  const actionsSection = actionsHtml ? `<div class="info-actions">${actionsHtml}</div>` : "";

  app.innerHTML = `
    <section class="app-shell">
      <h1>Hydrangea Walk</h1>
      <div class="progress">${progressIndicators}</div>
      <div class="puzzle-card">
        <h2>${puzzle.title}</h2>
        ${leadHtml}
        ${mapLinkHtml}
        ${bodyHtml}
        ${actionsSection}
        ${paginationControls}
      </div>
    </section>
  `;

  const actionButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".info-action[data-kind]"),
  );
  actionButtons.forEach((button) => {
    const kind = button.dataset.kind as InfoPageAction["kind"] | undefined;
    if (kind === "continue") {
      button.addEventListener("click", () => {
        const index = state.currentPuzzleIndex;
        const targetIndex = Math.min(index + 1, puzzles.length - 1);
        if (targetIndex === index) {
          return;
        }
        const previousMax = state.maxUnlockedPuzzleIndex;
        state.maxUnlockedPuzzleIndex = Math.max(previousMax, targetIndex);
        state.currentPuzzleIndex = targetIndex;
        resetFeedback();
        render();
      });
    } else if (kind === "reset") {
      button.addEventListener("click", () => {
        resetSession();
        render();
      });
    }
  });

  attachProgressIndicatorHandlers();
  attachPaginationHandlers();
}

function buildMapLink(mapQuery: string): string {
  const encodedQuery = encodeURIComponent(mapQuery);
  return `<div class="map-link"><a href="https://www.google.com/maps/search/?api=1&query=${encodedQuery}" target="_blank" rel="noopener">Google Mapsで開く</a></div>`;
}

function resolvedMapQueryForIndex(index: number): string | undefined {
  const storedQuery = state.mapLinksByPuzzleIndex[index];
  if (storedQuery) {
    return storedQuery;
  }

  const puzzleAtIndex = puzzles[index];
  if (puzzleAtIndex?.kind === "text" && puzzleAtIndex.mapQuery) {
    const answer = state.submittedAnswers[index];
    if (typeof answer === "string" && answer.trim().length > 0) {
      return puzzleAtIndex.mapQuery;
    }
  }

  for (let previous = index - 1; previous >= 0; previous -= 1) {
    const candidate = puzzles[previous];
    if (candidate?.kind !== "text") {
      continue;
    }
    if (!candidate.mapQuery) {
      return undefined;
    }
    const answer = state.submittedAnswers[previous];
    if (typeof answer === "string" && answer.trim().length > 0) {
      return candidate.mapQuery;
    }
    return undefined;
  }

  return undefined;
}

function mapLinkHtmlForIndex(index: number): string {
  const mapQuery = resolvedMapQueryForIndex(index);
  if (!mapQuery) {
    return "";
  }
  return buildMapLink(mapQuery);
}

function renderTextPuzzle(puzzle: TextPuzzle): void {
  const hintRevealed = state.revealedHints.has(puzzle.id);
  const progressIndicators = buildProgressIndicators();
  const paginationControls = buildPaginationControls();
  const puzzleIndex = puzzles.findIndex((entry) => entry.id === puzzle.id);
  const storedAnswer =
    puzzleIndex >= 0 ? state.submittedAnswers[puzzleIndex] ?? "" : "";
  const pageIndex = puzzleIndex >= 0 ? puzzleIndex : state.currentPuzzleIndex;
  const mapLinkHtml = mapLinkHtmlForIndex(pageIndex);

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
      <h1>Hydrangea Walk</h1>
      <div class="progress">${progressIndicators}</div>
      <div class="puzzle-card">
        <h2>${puzzle.title}</h2>
        <p>${puzzle.prompt}</p>
        <p><em>${puzzle.placeholderClue}</em></p>
        <div class="hint-row">
          <button ${hintButtonAttrs}>ヒントを見る</button>
          <div id="hint-area" class="${hintClass}">${hintText}</div>
        </div>
        <div class="answer-stack">
          <label for="answer-input-${puzzle.id}">回答</label>
          <input
            id="answer-input-${puzzle.id}"
            type="text"
            placeholder="ここに回答を入力"
            autocomplete="off"
          />
          <button id="answer-submit" type="button">回答を送信</button>
        </div>
        ${feedbackHtml}
        ${mapLinkHtml}
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
      const successMessage = unlockedNewPuzzle
        ? "正解です！次の問題へ。"
        : "正解です！";
      state.feedback = {
        kind: "success",
        message: successMessage,
      };
      if (puzzle.mapQuery && nextIndex < puzzles.length) {
        state.mapLinksByPuzzleIndex[nextIndex] = puzzle.mapQuery;
      }
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
    answerInput.value = storedAnswer;
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
    requiresConfirmation: false,
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
  const mapLinkHtml = mapLinkHtmlForIndex(state.currentPuzzleIndex);

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
      <h1>Hydrangea Walk</h1>
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
        ${mapLinkHtml}
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

  const handleCompletion = (options?: { force?: boolean }): void => {
    const force = options?.force ?? false;
    if (!isCrosswordSolved(puzzle, progress)) {
      return;
    }
    if (progress.requiresConfirmation && !force) {
      return;
    }
    progress.requiresConfirmation = false;
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
    progress.requiresConfirmation = true;
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
      handleCompletion({ force: true });
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
      progress.requiresConfirmation = false;
      resetFeedback();
      render();
      return;
    }
    const letter = rawValue.slice(-1).toUpperCase();
    const { row, col } = progress.activeCell;
    progress.entries[row][col] = letter;
    event.target.value = letter;
    progress.requiresConfirmation = false;
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
      progress.requiresConfirmation = false;
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
  const finalPuzzle = puzzles[puzzles.length - 1];
  if (finalPuzzle && finalPuzzle.kind === "info") {
    state.currentPuzzleIndex = puzzles.length - 1;
    state.maxUnlockedPuzzleIndex = Math.max(
      state.maxUnlockedPuzzleIndex,
      puzzles.length - 1,
    );
    renderInfoPage(finalPuzzle);
    return;
  }

  const combinedAnswer = state.submittedAnswers.join("");
  const progressIndicators = buildProgressIndicators();
  const paginationControls = buildPaginationControls();

  app.innerHTML = `
    <section class="app-shell">
      <h1>最終回答</h1>
      <div class="progress">${progressIndicators}</div>
      <div class="puzzle-card">
        <p>おめでとうございます！すべての問題に正解しました。</p>
        <p>各回答をつなげたキーワードをメモして、運営チームに報告してください。</p>
        <div class="final-answer">${combinedAnswer}</div>
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
