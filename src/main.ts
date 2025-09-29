const PASSWORD = "kobachi";

type FeedbackKind = "error" | "success";

type Puzzle = {
  id: number;
  title: string;
  prompt: string;
  placeholderClue: string;
  hint: string;
  correctAnswer: string;
};

type Feedback = {
  kind: FeedbackKind;
  message: string;
};

type AppState = {
  authenticated: boolean;
  currentPuzzleIndex: number;
  submittedAnswers: string[];
  feedback: Feedback | null;
  revealedHints: Set<number>;
};

const puzzles: Puzzle[] = [
  {
    id: 1,
    title: "仮問 1",
    prompt: "初めの一歩。雨の気配を感じる言葉を答えてください。",
    placeholderClue: "ヒント: カタカナ3文字です。",
    hint: "空から落ちてくるものの音を想像してみましょう。",
    correctAnswer: "アメ",
  },
  {
    id: 2,
    title: "仮問 2",
    prompt: "続くのは静かなつなぎの一文字。",
    placeholderClue: "ヒント: ひらがな1文字。",
    hint: "一文字で言葉と言葉をつなぐ役割を持ちます。",
    correctAnswer: "と",
  },
  {
    id: 3,
    title: "仮問 3",
    prompt: "最後は初夏を彩る花の名を。",
    placeholderClue: "ヒント: カタカナ4文字です。",
    hint: "梅雨時期の定番で、土壌の酸性度で色が変わる花です。",
    correctAnswer: "アジサイ",
  },
];

const app = document.getElementById("app");

if (!(app instanceof HTMLDivElement)) {
  throw new Error("app コンテナが見つかりません");
}

const state: AppState = {
  authenticated: false,
  currentPuzzleIndex: 0,
  submittedAnswers: [],
  feedback: null,
  revealedHints: new Set<number>(),
};

function resetFeedback(): void {
  state.feedback = null;
}

function resetSession(): void {
  state.authenticated = false;
  state.currentPuzzleIndex = 0;
  state.submittedAnswers = [];
  state.revealedHints = new Set<number>();
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

  renderPuzzle();
}

function renderLogin(): void {
  app.innerHTML = `
    <section class="app-shell">
      <h1>Hydrangea Lab</h1>
      <div class="puzzle-card">
        <p>この謎解きは特定の参加者のみアクセスできます。パスワードを入力してください。</p>
        <label for="password-input">パスワード</label>
        <input id="password-input" type="password" autocomplete="current-password" placeholder="パスワードを入力" />
        <button id="password-submit" type="button">入室する</button>
        <div id="feedback" class="feedback"></div>
      </div>
    </section>
  `;

  const passwordInput = document.getElementById("password-input") as HTMLInputElement | null;
  const submitButton = document.getElementById("password-submit");
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

  submitButton?.addEventListener("click", attemptLogin);
  passwordInput?.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      attemptLogin();
    }
  });
}

function renderPuzzle(): void {
  const current = puzzles[state.currentPuzzleIndex];
  const hintRevealed = state.revealedHints.has(current.id);

  const progressIndicators = puzzles
    .map((puzzle, index) => {
      const isActive = index <= state.currentPuzzleIndex;
      const activeClass = isActive ? "active" : "";
      return `<div class="progress-step ${activeClass}" data-step="${puzzle.id}"></div>`;
    })
    .join("");

  const feedbackHtml = state.feedback
    ? `<div class="feedback feedback--${state.feedback.kind}">${state.feedback.message}</div>`
    : "";

  const hintButtonAttrs = hintRevealed ? "id=\"hint-button\" type=\"button\" disabled" : "id=\"hint-button\" type=\"button\"";
  const hintText = hintRevealed ? current.hint : "ヒントはまだ非公開です。";
  const hintClass = hintRevealed ? "hint hint--visible" : "hint";

  app.innerHTML = `
    <section class="app-shell">
      <h1>Hydrangea Riddles</h1>
      <div class="progress">${progressIndicators}</div>
      <div class="puzzle-card">
        <h2>${current.title}</h2>
        <p>${current.prompt}</p>
        <p><em>${current.placeholderClue}</em></p>
        <div class="hint-row">
          <button ${hintButtonAttrs}>ヒントを見る</button>
          <div id="hint-area" class="${hintClass}">${hintText}</div>
        </div>
        <label for="answer-input-${current.id}">回答</label>
        <input
          id="answer-input-${current.id}"
          type="text"
          placeholder="ここに回答を入力"
          autocomplete="off"
        />
        <button id="answer-submit" type="button">回答を送信</button>
        ${feedbackHtml}
      </div>
    </section>
  `;

  const answerInput = document.getElementById(`answer-input-${current.id}`) as HTMLInputElement | null;
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

    if (candidate === current.correctAnswer) {
      state.submittedAnswers[state.currentPuzzleIndex] = candidate;
      state.currentPuzzleIndex += 1;
      state.feedback = {
        kind: "success",
        message: "正解です！次の問題へ。",
      };
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
    state.revealedHints.add(current.id);
    if (hintArea instanceof HTMLDivElement) {
      hintArea.textContent = current.hint;
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

  answerInput?.focus();
}

function renderFinal(): void {
  const combinedAnswer = state.submittedAnswers.join("");

  app.innerHTML = `
    <section class="app-shell">
      <h1>最終回答</h1>
      <div class="puzzle-card">
        <p>おめでとうございます！すべての仮問に正解しました。</p>
        <p>3つの回答をつなげると次の言葉になります。</p>
        <div class="final-answer">${combinedAnswer}</div>
        <footer>※ 現在は仮問です。本番用の問題に差し替えてもこの合成ロジックを再利用できます。</footer>
      </div>
      <button id="reset" type="button">最初からやり直す</button>
    </section>
  `;

  const resetButton = document.getElementById("reset");
  resetButton?.addEventListener("click", () => {
    resetSession();
    render();
  });
}

render();
