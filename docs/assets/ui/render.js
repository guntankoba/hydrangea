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
export function render(app, state, puzzles, onAction) {
    if (!state.isLoggedIn) {
        renderLogin(app, state, onAction);
        return;
    }
    if (state.isCleared) {
        renderClear(app);
        return;
    }
    const currentPuzzle = puzzles[state.currentPuzzleIndex];
    if (!currentPuzzle) {
        app.innerHTML = "<p>エラー: パズルが見つかりません</p>";
        return;
    }
    app.innerHTML = "";
    const container = document.createElement("div");
    container.className = "app-shell";
    // Header
    const header = document.createElement("header");
    header.innerHTML = `<h1>${escapeHtml(currentPuzzle.title)}</h1>`;
    container.appendChild(header);
    // Content based on puzzle type
    const content = document.createElement("div");
    content.className = "content";
    if (currentPuzzle.kind === "info") {
        renderInfoPage(content, currentPuzzle, onAction);
    }
    else if (currentPuzzle.kind === "text") {
        renderTextPuzzle(content, state, currentPuzzle, onAction);
    }
    else if (currentPuzzle.kind === "crossword") {
        renderCrosswordPuzzle(content, state, currentPuzzle, onAction);
    }
    else if (currentPuzzle.kind === "slot") {
        renderSlotPuzzle(content, state, currentPuzzle, onAction);
    }
    // Navigation Controls
    const nav = document.createElement("div");
    nav.className = "pagination"; // Using existing CSS class
    const prevBtn = document.createElement("button");
    prevBtn.className = "nav-btn";
    prevBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>`;
    prevBtn.disabled = state.currentPuzzleIndex === 0;
    prevBtn.addEventListener("click", () => onAction("prev"));
    nav.appendChild(prevBtn);
    const nextBtn = document.createElement("button");
    nextBtn.className = "nav-btn";
    nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="24" height="24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>`;
    // Enable next if we have reached further than current index
    nextBtn.disabled = state.currentPuzzleIndex >= state.maxReachedIndex;
    nextBtn.addEventListener("click", () => onAction("next"));
    nav.appendChild(nextBtn);
    container.appendChild(content);
    container.appendChild(nav);
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
        ? `<p class="feedback ${state.feedback.kind}">${escapeHtml(state.feedback.message)}</p>`
        : ""}
    </div>
  `;
    (_a = app.querySelector("#login-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        const input = app.querySelector("#password");
        onAction("login", input.value.trim());
    });
}
function renderClear(app) {
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
function renderInfoPage(container, puzzle, onAction) {
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
                if (action.kind === "continue") {
                    onAction("next");
                }
                else if (action.kind === "link") {
                    window.open(action.url, "_blank");
                }
            });
            actions.appendChild(btn);
        });
        container.appendChild(actions);
    }
}
function renderTextPuzzle(container, state, puzzle, onAction) {
    var _a;
    const question = document.createElement("div");
    question.className = "question";
    // Use prompt for TextPuzzle
    question.innerHTML = `<p>${escapeHtml(puzzle.prompt)}</p>`;
    if (puzzle.content) {
        question.innerHTML += puzzle.content.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    }
    container.appendChild(question);
    const form = document.createElement("div");
    form.className = "answer-form";
    form.innerHTML = `
    <div class="form-group">
      <label for="answer">回答</label>
      <input type="text" id="answer" autocomplete="off" />
    </div>
    <button id="submit-btn">回答を送信</button>
  `;
    container.appendChild(form);
    if (state.feedback) {
        const feedback = document.createElement("p");
        feedback.className = `feedback ${state.feedback.kind}`;
        feedback.textContent = state.feedback.message;
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
    (_a = form.querySelector("#submit-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
        const input = form.querySelector("#answer");
        onAction("answer", input.value.trim());
    });
}
function renderSlotPuzzle(container, state, puzzle, onAction) {
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
    form.innerHTML = `
    <div class="form-group">
      <label for="answer">回答</label>
      <input type="text" id="answer" autocomplete="off" placeholder="${escapeHtml(puzzle.placeholderClue || '')}" />
    </div>
    <button id="submit-btn">回答を送信</button>
  `;
    container.appendChild(form);
    if (state.feedback) {
        const feedback = document.createElement("p");
        feedback.className = `feedback ${state.feedback.kind}`;
        feedback.textContent = state.feedback.message;
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
    (_b = form.querySelector("#submit-btn")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
        const input = form.querySelector("#answer");
        onAction("answer", input.value.trim());
    });
}
function renderCrosswordPuzzle(container, state, puzzle, onAction) {
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
            // Check if this cell is part of any clue
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
                // Clue number
                const clueStart = puzzle.clues.find((clue) => clue.row === r && clue.col === c);
                if (clueStart) {
                    const num = document.createElement("span");
                    num.className = "clue-number";
                    num.textContent = clueStart.number.toString();
                    cell.appendChild(num);
                }
                cell.addEventListener("click", () => {
                    onAction("crossword_click", { row: r, col: c });
                });
            }
            grid.appendChild(cell);
        }
    }
    container.appendChild(grid);
    // Clues
    const cluesContainer = document.createElement("div");
    cluesContainer.className = "clues-container";
    // Current Clue Highlight
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
    // Keyboard controls (handled globally in main, but UI hints could go here)
}
