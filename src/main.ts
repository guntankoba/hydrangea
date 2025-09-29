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
    title: "���� 1",
    prompt: "���߂̈���B�J�̋C�z�������錾�t�𓚂��Ă��������B",
    placeholderClue: "�q���g: �J�^�J�i3�����ł��B",
    hint: "�󂩂痎���Ă�����̂̉���z�����Ă݂܂��傤�B",
    correctAnswer: "�A��",
  },
  {
    id: 2,
    title: "���� 2",
    prompt: "�����̂͐Â��ȂȂ��̈ꕶ���B",
    placeholderClue: "�q���g: �Ђ炪��1�����B",
    hint: "�ꕶ���Ō��t�ƌ��t���Ȃ������������܂��B",
    correctAnswer: "��",
  },
  {
    id: 3,
    title: "���� 3",
    prompt: "�Ō�͏��Ă��ʂ�Ԃ̖����B",
    placeholderClue: "�q���g: �J�^�J�i4�����ł��B",
    hint: "�~�J�����̒�ԂŁA�y��̎_���x�ŐF���ς��Ԃł��B",
    correctAnswer: "�A�W�T�C",
  },
];

const app = document.getElementById("app");

if (!(app instanceof HTMLDivElement)) {
  throw new Error("app �R���e�i��������܂���");
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
        <p>���̓�����͓���̎Q���҂̂݃A�N�Z�X�ł��܂��B�p�X���[�h����͂��Ă��������B</p>
        <label for="password-input">�p�X���[�h</label>
        <input id="password-input" type="password" autocomplete="current-password" placeholder="�p�X���[�h�����" />
        <button id="password-submit" type="button">��������</button>
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
      updateFeedback("�p�X���[�h���Ⴂ�܂��B", "error");
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
  const hintText = hintRevealed ? current.hint : "�q���g�͂܂�����J�ł��B";
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
          <button ${hintButtonAttrs}>�q���g������</button>
          <div id="hint-area" class="${hintClass}">${hintText}</div>
        </div>
        <label for="answer-input-${current.id}">��</label>
        <input
          id="answer-input-${current.id}"
          type="text"
          placeholder="�����ɉ񓚂����"
          autocomplete="off"
        />
        <button id="answer-submit" type="button">�񓚂𑗐M</button>
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
        message: "�񓚂���͂��Ă��������B",
      };
      render();
      return;
    }

    if (candidate === current.correctAnswer) {
      state.submittedAnswers[state.currentPuzzleIndex] = candidate;
      state.currentPuzzleIndex += 1;
      state.feedback = {
        kind: "success",
        message: "�����ł��I���̖��ցB",
      };
      render();
    } else {
      state.feedback = {
        kind: "error",
        message: "�܂������ł͂���܂���B������x�����Ă��������B",
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
      <h1>�ŏI��</h1>
      <div class="puzzle-card">
        <p>���߂łƂ��������܂��I���ׂẲ���ɐ������܂����B</p>
        <p>3�̉񓚂��Ȃ���Ǝ��̌��t�ɂȂ�܂��B</p>
        <div class="final-answer">${combinedAnswer}</div>
        <footer>�� ���݂͉���ł��B�{�ԗp�̖��ɍ����ւ��Ă����̍������W�b�N���ė��p�ł��܂��B</footer>
      </div>
      <button id="reset" type="button">�ŏ������蒼��</button>
    </section>
  `;

  const resetButton = document.getElementById("reset");
  resetButton?.addEventListener("click", () => {
    resetSession();
    render();
  });
}

render();
