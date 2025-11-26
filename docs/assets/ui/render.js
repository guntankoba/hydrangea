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
    if (state.isCleared) {
        renderClear(app, state);
        return;
    }
    if (stage === "ST1") {
        document.body.classList.add("stage-shinjuku");
    }
    else {
        document.body.classList.remove("stage-shinjuku");
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
            if (puzzleState.solved && puzzle.letterCard) {
                section.appendChild(renderLetterCard(puzzle.letterCard));
            }
        }
        content.appendChild(section);
    });
    if (state.letters.length) {
        const letters = document.createElement("section");
        letters.className = "puzzle-card letter-collection";
        const heading = document.createElement("h3");
        heading.textContent = "集めたカード";
        letters.appendChild(heading);
        const list = document.createElement("div");
        list.className = "letter-grid";
        state.letters.forEach((letter) => {
            list.appendChild(renderLetterCard(letter));
        });
        letters.appendChild(list);
        content.appendChild(letters);
    }
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
    if (state.letters.length) {
        const wrap = document.createElement("div");
        wrap.className = "app-shell";
        wrap.innerHTML = `<h2>獲得した文字</h2>`;
        const list = document.createElement("div");
        list.className = "letter-grid";
        state.letters.forEach((letter) => list.appendChild(renderLetterCard(letter)));
        wrap.appendChild(list);
        app.appendChild(wrap);
    }
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
    var _a, _b;
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
        img.alt = `${puzzle.title}の手がかり`;
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
    (_b = form.querySelector(`#submit-btn-${puzzle.id}`)) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
        const input = form.querySelector(`#${inputId}`);
        onAction("answer", { puzzleId: puzzle.id, value: input.value.trim() });
    });
}
function renderSlotPuzzle(container, puzzle, puzzleState, onAction) {
    var _a, _b;
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
    for (let i = 0; i < puzzle.slots; i++) {
        const slot = document.createElement("div");
        slot.className = "slot";
        if (i === puzzle.targetSlot) {
            slot.classList.add("target");
        }
        const prefilled = (_a = puzzle.prefilled) === null || _a === void 0 ? void 0 : _a.find(p => p.index === i);
        if (prefilled) {
            slot.textContent = prefilled.char;
            slot.classList.add("prefilled");
        }
        slotsContainer.appendChild(slot);
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
    (_b = form.querySelector(`#submit-btn-${puzzle.id}`)) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
        const input = form.querySelector(`#${inputId}`);
        onAction("answer", { puzzleId: puzzle.id, value: input.value.trim() });
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
function renderLetterCard(card) {
    const cardEl = document.createElement("div");
    cardEl.className = "letter-card";
    cardEl.innerHTML = `
      <div class="letter-char">${escapeHtml(card.letter)}</div>
      <div class="letter-meta">
        <div class="letter-title">${escapeHtml(card.memoryTitle)}</div>
        <div class="letter-date">${escapeHtml(card.dateISO)}</div>
      </div>
    `;
    return cardEl;
}
