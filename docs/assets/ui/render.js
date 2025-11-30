import { ensureCrosswordProgress, getClueAt, isBlock } from "../logic/crossword.js";
// Helper to escape HTML
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function feedbackClass(kind) {
    return `feedback feedback--${kind}`;
}
export function render(app, state, puzzles, onAction, stage) {
    var _a;
    if (!state.isLoggedIn) {
        renderLogin(app, state, onAction);
        return;
    }
    if (!state.tos.agreed) {
        renderTos(app, state, onAction);
        return;
    }
    if (state.isCleared) {
        renderClear(app, state);
        return;
    }
    if (stage === "ST1" || stage === "ST4") {
        document.body.classList.add("stage-shinjuku");
        document.body.classList.remove("stage-akiba");
    }
    else if (stage === "ST2") {
        document.body.classList.add("stage-akiba");
        document.body.classList.remove("stage-shinjuku");
    }
    else {
        document.body.classList.remove("stage-shinjuku");
        document.body.classList.remove("stage-akiba");
    }
    const intro = puzzles.find((p) => p.kind === "info");
    const challenges = puzzles.filter((p) => p.kind !== "info");
    app.innerHTML = "";
    const container = document.createElement("div");
    container.className = "app-shell";
    const header = document.createElement("header");
    const stageTitle = (_a = intro === null || intro === void 0 ? void 0 : intro.title) !== null && _a !== void 0 ? _a : "Hydrangea Walk";
    header.innerHTML = `<h1>${escapeHtml(stageTitle)}</h1>`;
    container.appendChild(header);
    const content = document.createElement("div");
    content.className = "content";
    if (intro) {
        const introCard = document.createElement("section");
        introCard.className = "puzzle-card info-card";
        renderInfoPage(introCard, intro);
        content.appendChild(introCard);
    }
    challenges.forEach((puzzle, index) => {
        var _a;
        const section = document.createElement("section");
        section.className = "puzzle-card";
        section.id = `puzzle-${puzzle.id}`;
        const title = document.createElement("h2");
        const puzzleLabel = puzzle.title.startsWith("問") ? puzzle.title : `問${index + 1}｜${puzzle.title}`;
        title.textContent = puzzleLabel;
        section.appendChild(title);
        const puzzleState = (_a = state.puzzleState[puzzle.id]) !== null && _a !== void 0 ? _a : { solved: false, feedback: null };
        if (puzzle.kind === "text") {
            renderTextPuzzle(section, puzzle, puzzleState, onAction);
        }
        else if (puzzle.kind === "crossword") {
            renderCrosswordPuzzle(section, state, puzzle, onAction, puzzleState.solved);
        }
        else if (puzzle.kind === "slot") {
            renderSlotPuzzle(section, puzzle, puzzleState, onAction);
        }
        content.appendChild(section);
    });
    container.appendChild(content);
    app.appendChild(container);
}
function renderLogin(app, state, onAction) {
    var _a;
    app.innerHTML = `
    <div class="app-shell">
      <h1>Hydrangea Walk</h1>
      <p>パスワードを入力して入室してください</p>
      <div class="form-group">
        <label for="password">パスワード</label>
        <input type="password" id="password" />
      </div>
      <button id="login-btn">入室する</button>
      ${state.feedback
        ? `<p class="${feedbackClass(state.feedback.kind)}">${escapeHtml(state.feedback.message)}</p>`
        : ""}
    </div>
  `;
    (_a = app.querySelector("#login-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        const input = app.querySelector("#password");
        onAction("login", input.value.trim());
    });
    const passwordInput = app.querySelector("#password");
    passwordInput === null || passwordInput === void 0 ? void 0 : passwordInput.focus();
}
function renderTos(app, state, onAction) {
    app.innerHTML = `
    <div class="app-shell tos-shell">
      <header><h1>利用規約</h1></header>
      <div class="content tos-content">
        <p>Hydrangea Walk の利用を開始する前に、以下の規約に目を通し同意してください。</p>
        <div class="tos-accordion">
          <button type="button" class="tos-accordion__trigger" aria-expanded="false" aria-controls="tos-panel" id="tos-trigger">
            規約本文を表示
            <span class="tos-accordion__icon" aria-hidden="true">▾</span>
          </button>
          <div id="tos-panel" class="tos-accordion__panel" role="region" aria-labelledby="tos-trigger" hidden tabindex="-1">
            <p>・本アプリは謎解きイベントの補助ツールです。歩行中のスマートフォン操作は避け、安全な場所でプレイしてください。</p>
            <p>・コンテンツの内容を無断で転載・配布することを禁じます。</p>
            <p>・位置情報やカメラ等の端末機能を利用する場合は、周囲の環境や第三者のプライバシーに配慮してください。</p>
            <p>・体調がすぐれない場合や天候・周辺状況が危険な場合は、無理をせずプレイを中断してください。</p>
          </div>
        </div>
        <label class="tos-consent">
          <input type="checkbox" id="tos-agree" />
          <span>同意する</span>
        </label>
        <button id="tos-start" class="tos-start" disabled>利用開始する</button>
      </div>
    </div>
  `;
    const accordionTrigger = app.querySelector("#tos-trigger");
    const accordionPanel = app.querySelector("#tos-panel");
    const agreeCheckbox = app.querySelector("#tos-agree");
    const startButton = app.querySelector("#tos-start");
    const updateButtonState = () => {
        if (!startButton || !agreeCheckbox)
            return;
        startButton.disabled = !agreeCheckbox.checked;
    };
    accordionTrigger === null || accordionTrigger === void 0 ? void 0 : accordionTrigger.addEventListener("click", () => {
        if (!accordionTrigger || !accordionPanel)
            return;
        const expanded = accordionTrigger.getAttribute("aria-expanded") === "true";
        const nextExpanded = !expanded;
        accordionTrigger.setAttribute("aria-expanded", String(nextExpanded));
        accordionPanel.hidden = !nextExpanded;
        if (nextExpanded) {
            accordionPanel.focus();
            if (!state.tos.openedOnce) {
                onAction("tos_opened");
            }
        }
        updateButtonState();
    });
    agreeCheckbox === null || agreeCheckbox === void 0 ? void 0 : agreeCheckbox.addEventListener("change", () => {
        updateButtonState();
    });
    startButton === null || startButton === void 0 ? void 0 : startButton.addEventListener("click", () => {
        onAction("tos_accept");
    });
    accordionTrigger === null || accordionTrigger === void 0 ? void 0 : accordionTrigger.focus();
    updateButtonState();
}
function renderClear(app, state) {
    app.innerHTML = `
    <div class="app-shell">
      <header><h1>クリア</h1></header>
      <div class="content">
        <p>お疲れさまでした！</p>
        <p>すべての謎を解き明かしました。</p>
      </div>
    </div>
  `;
}
function renderInfoPage(container, puzzle) {
    const lead = document.createElement("p");
    lead.className = "lead";
    lead.textContent = puzzle.lead;
    container.appendChild(lead);
    const body = document.createElement("div");
    body.innerHTML = puzzle.content.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    container.appendChild(body);
    if (puzzle.actions) {
        const actions = document.createElement("div");
        actions.className = "actions";
        puzzle.actions.forEach((action) => {
            const btn = document.createElement("button");
            btn.textContent = action.label;
            btn.addEventListener("click", () => {
                if (action.kind === "link") {
                    window.open(action.url, "_blank");
                }
            });
            actions.appendChild(btn);
        });
        container.appendChild(actions);
    }
}
function renderTextPuzzle(container, puzzle, puzzleState, onAction) {
    var _a, _b, _c;
    if (puzzle.accentColor) {
        container.style.setProperty("--accent", puzzle.accentColor);
    }
    if (puzzle.accentShadow) {
        container.style.setProperty("--accent-shadow", puzzle.accentShadow);
    }
    const question = document.createElement("div");
    question.className = "question";
    question.innerHTML = `<p>${escapeHtml(puzzle.prompt)}</p>`;
    if (puzzle.content) {
        question.innerHTML += puzzle.content.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    }
    if (puzzle.imageUrl) {
        const image = document.createElement("div");
        image.className = "puzzle-image";
        const img = document.createElement("img");
        img.src = puzzle.imageUrl;
        img.alt = puzzle.imageAlt || "駅周辺の手がかり写真";
        image.appendChild(img);
        question.appendChild(image);
    }
    if ((_a = puzzle.choices) === null || _a === void 0 ? void 0 : _a.length) {
        const list = document.createElement("ol");
        list.className = "choice-list";
        puzzle.choices.forEach((choice) => {
            const item = document.createElement("li");
            item.textContent = choice;
            list.appendChild(item);
        });
        question.appendChild(list);
    }
    container.appendChild(question);
    const form = document.createElement("div");
    form.className = "answer-form";
    const inputId = `answer-${puzzle.id}`;
    form.innerHTML = `
    <div class="form-group">
      <label for="${inputId}">回答</label>
      <input type="text" id="${inputId}" autocomplete="off" ${puzzleState.solved ? "disabled" : ""} placeholder="${escapeHtml(puzzle.placeholderClue || '')}" />
    </div>
    <button id="submit-btn-${puzzle.id}" ${puzzleState.solved ? "disabled" : ""}>回答を送信</button>
  `;
    container.appendChild(form);
    if (puzzleState.feedback) {
        const feedback = document.createElement("p");
        feedback.className = feedbackClass(puzzleState.feedback.kind);
        feedback.textContent = puzzleState.feedback.message;
        container.appendChild(feedback);
    }
    if (puzzle.mapQuery) {
        const mapBtn = document.createElement("button");
        mapBtn.textContent = "地図を見る";
        mapBtn.addEventListener("click", () => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(puzzle.mapQuery)}`, "_blank");
        });
        container.appendChild(mapBtn);
    }
    const submit = () => {
        const input = form.querySelector(`#${inputId}`);
        onAction("answer", { puzzleId: puzzle.id, value: input.value.trim() });
    };
    (_b = form.querySelector(`#submit-btn-${puzzle.id}`)) === null || _b === void 0 ? void 0 : _b.addEventListener("click", submit);
    (_c = form.querySelector(`#${inputId}`)) === null || _c === void 0 ? void 0 : _c.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            submit();
        }
    });
}
function renderSlotPuzzle(container, puzzle, puzzleState, onAction) {
    var _a, _b, _c, _d;
    const question = document.createElement("div");
    question.className = "question slot-puzzle";
    question.innerHTML = `<p>${escapeHtml(puzzle.prompt || puzzle.title)}</p>`;
    if (puzzle.hint) {
        question.innerHTML += `<p class="hint-text">${escapeHtml(puzzle.hint)}</p>`;
    }
    const slotsContainer = document.createElement("div");
    slotsContainer.className = "slots-container";
    if (puzzle.targetColor) {
        slotsContainer.style.setProperty("--slot-target-bg", puzzle.targetColor);
    }
    if (puzzle.targetTextColor) {
        slotsContainer.style.setProperty("--slot-fg-dark", puzzle.targetTextColor);
    }
    const solvedChars = puzzleState.solved ? Array.from(puzzle.correctAnswer) : null;
    for (let i = 0; i < puzzle.slots; i++) {
        const slot = document.createElement("div");
        slot.className = "slot";
        if (i === puzzle.targetSlot) {
            slot.classList.add("target");
        }
        const prefilled = (_a = puzzle.prefilled) === null || _a === void 0 ? void 0 : _a.find(p => p.index === i);
        const charToShow = (_b = solvedChars === null || solvedChars === void 0 ? void 0 : solvedChars[i]) !== null && _b !== void 0 ? _b : prefilled === null || prefilled === void 0 ? void 0 : prefilled.char;
        if (charToShow) {
            slot.textContent = charToShow;
        }
        if (prefilled && !solvedChars) {
            slot.classList.add("prefilled");
        }
        slotsContainer.appendChild(slot);
    }
    if (puzzleState.solved) {
        slotsContainer.classList.add("slots-container--solved");
    }
    question.appendChild(slotsContainer);
    container.appendChild(question);
    const form = document.createElement("div");
    form.className = "answer-form";
    const inputId = `answer-${puzzle.id}`;
    form.innerHTML = `
    <div class="form-group">
      <label for="${inputId}">回答</label>
      <input type="text" id="${inputId}" autocomplete="off" ${puzzleState.solved ? "disabled" : ""} placeholder="${escapeHtml(puzzle.placeholderClue || '')}" />
    </div>
    <button id="submit-btn-${puzzle.id}" ${puzzleState.solved ? "disabled" : ""}>回答を送信</button>
  `;
    container.appendChild(form);
    if (puzzleState.feedback) {
        const feedback = document.createElement("p");
        feedback.className = feedbackClass(puzzleState.feedback.kind);
        feedback.textContent = puzzleState.feedback.message;
        container.appendChild(feedback);
    }
    if (puzzle.mapQuery) {
        const mapBtn = document.createElement("button");
        mapBtn.textContent = "地図を見る";
        mapBtn.addEventListener("click", () => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(puzzle.mapQuery)}`, "_blank");
        });
        container.appendChild(mapBtn);
    }
    const submit = () => {
        const input = form.querySelector(`#${inputId}`);
        onAction("answer", { puzzleId: puzzle.id, value: input.value.trim() });
    };
    (_c = form.querySelector(`#submit-btn-${puzzle.id}`)) === null || _c === void 0 ? void 0 : _c.addEventListener("click", submit);
    (_d = form.querySelector(`#${inputId}`)) === null || _d === void 0 ? void 0 : _d.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            submit();
        }
    });
}
function renderCrosswordPuzzle(container, state, puzzle, onAction, solved) {
    var _a, _b;
    const progress = ensureCrosswordProgress(puzzle, state);
    // Grid
    const grid = document.createElement("div");
    grid.className = "crossword-grid";
    grid.style.gridTemplateColumns = `repeat(${puzzle.size.cols}, 40px)`;
    for (let r = 0; r < puzzle.size.rows; r++) {
        for (let c = 0; c < puzzle.size.cols; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            const isBlockCell = isBlock(puzzle, r, c);
            if (isBlockCell) {
                cell.classList.add("block");
            }
            else {
                cell.textContent = progress.grid[r][c];
                cell.dataset.row = r.toString();
                cell.dataset.col = c.toString();
                if (((_a = progress.activeCell) === null || _a === void 0 ? void 0 : _a.row) === r && ((_b = progress.activeCell) === null || _b === void 0 ? void 0 : _b.col) === c) {
                    cell.classList.add("active");
                }
                const clueStart = puzzle.clues.find((clue) => clue.row === r && clue.col === c);
                if (clueStart) {
                    const num = document.createElement("span");
                    num.className = "clue-number";
                    num.textContent = clueStart.number.toString();
                    cell.appendChild(num);
                }
                if (!solved) {
                    cell.addEventListener("click", () => {
                        onAction("crossword_click", { row: r, col: c, puzzleId: puzzle.id });
                    });
                }
            }
            grid.appendChild(cell);
        }
    }
    container.appendChild(grid);
    const cluesContainer = document.createElement("div");
    cluesContainer.className = "clues-container";
    if (progress.activeCell) {
        const currentClue = getClueAt(puzzle, progress.activeCell.row, progress.activeCell.col, progress.direction);
        if (currentClue) {
            const activeClueDisplay = document.createElement("div");
            activeClueDisplay.className = "active-clue";
            activeClueDisplay.textContent = `${progress.direction === 'across' ? 'ヨコ' : 'タテ'} ${currentClue.number}: ${currentClue.clue}`;
            container.appendChild(activeClueDisplay);
        }
    }
    container.appendChild(cluesContainer);
}
