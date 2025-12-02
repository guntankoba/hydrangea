import { ensureCrosswordProgress, getClueAt, isBlock } from "../logic/crossword.js";
const stageLabels = {
    ST1: "ステージ1",
    ST2: "ステージ2",
    ST3: "ステージ3",
    ST4: "ステージ4",
    ST5: "ステージ5",
};
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
function renderChoiceWithAccent(choice, accents) {
    const accent = accents === null || accents === void 0 ? void 0 : accents.find((a) => a.label === choice);
    if (!accent)
        return escapeHtml(choice);
    const start = accent.highlight.start;
    const end = start + accent.highlight.length;
    if (start < 0 || start >= choice.length || end <= start) {
        return escapeHtml(choice);
    }
    const before = escapeHtml(choice.slice(0, start));
    const target = escapeHtml(choice.slice(start, end));
    const after = escapeHtml(choice.slice(end));
    const styles = [`color: ${accent.accentColor};`];
    if (accent.accentShadow) {
        styles.push(`text-shadow: 0 0 12px ${accent.accentShadow};`);
    }
    return `${before}<span class="choice-accent" style="${styles.join(" ")}">${target}</span>${after}`;
}
function renderStageNavigation(header, currentStage, clearedStages, stageOrder, onAction) {
    if (!stageOrder.length)
        return;
    const maxClearedIndex = clearedStages.length
        ? Math.max(...clearedStages.map((stage) => stageOrder.indexOf(stage)))
        : -1;
    const nav = document.createElement("div");
    nav.className = "stage-nav";
    const label = document.createElement("span");
    label.className = "stage-nav__label";
    label.textContent = "ステージ移動";
    nav.appendChild(label);
    const list = document.createElement("div");
    list.className = "stage-nav__list";
    stageOrder.forEach((stageId) => {
        var _a;
        const index = stageOrder.indexOf(stageId);
        const isCurrent = currentStage === stageId;
        const isCleared = clearedStages.includes(stageId);
        const isUnlocked = index <= maxClearedIndex + 1 && index !== -1;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = (_a = stageLabels[stageId]) !== null && _a !== void 0 ? _a : stageId;
        button.className = "stage-nav__item";
        if (isCurrent) {
            button.classList.add("is-current");
        }
        else if (isCleared) {
            button.classList.add("is-cleared");
        }
        if (!isUnlocked) {
            button.disabled = true;
            button.classList.add("is-locked");
        }
        else {
            button.addEventListener("click", () => onAction("navigate_stage", { stageId }));
        }
        list.appendChild(button);
    });
    nav.appendChild(list);
    header.appendChild(nav);
}
function createStationCardElement(card) {
    const panel = document.createElement("div");
    panel.className = "station-card";
    const header = document.createElement("div");
    header.className = "station-card__header";
    header.innerHTML = `<p class="station-card__eyebrow">Stationカード</p><h3>${escapeHtml(card.name)}</h3>`;
    const body = document.createElement("div");
    body.className = "station-card__body";
    body.innerHTML = `
      <div class="station-card__line" style="--line-color: ${card.lineColor}">
        <span class="station-card__line-id">${escapeHtml(card.lineId)}</span>
      </div>
      <div class="station-card__value">
        <span class="station-card__value-label">Station No.</span>
        <span class="station-card__value-number">${card.value}</span>
      </div>
    `;
    panel.appendChild(header);
    panel.appendChild(body);
    return panel;
}
function renderPuzzleNavigation(container, puzzles, state) {
    if (!puzzles.length)
        return;
    const nav = document.createElement("div");
    nav.className = "puzzle-nav";
    const label = document.createElement("span");
    label.className = "puzzle-nav__label";
    label.textContent = "ステージ内移動";
    nav.appendChild(label);
    const list = document.createElement("div");
    list.className = "puzzle-nav__list";
    puzzles.forEach((puzzle, index) => {
        var _a;
        const button = document.createElement("button");
        button.type = "button";
        const displayIndex = index + 1;
        const puzzleLabel = puzzle.kind === "info" ? "イントロ" : `Q${displayIndex}`;
        button.textContent = puzzleLabel;
        button.className = "puzzle-nav__item";
        const solved = (_a = state.puzzleState[puzzle.id]) === null || _a === void 0 ? void 0 : _a.solved;
        if (solved) {
            button.classList.add("is-solved");
        }
        const targetId = `puzzle-${puzzle.id}`;
        button.addEventListener("click", () => {
            var _a;
            (_a = document.getElementById(targetId)) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        list.appendChild(button);
    });
    nav.appendChild(list);
    container.appendChild(nav);
}
function renderStationCardOverlay(app, card, onAction, nextStage, pendingClearAfterCard) {
    const overlay = document.createElement("div");
    overlay.className = "station-card-layer";
    const panel = createStationCardElement(card);
    const footer = document.createElement("div");
    footer.className = "station-card__footer";
    const confirm = document.createElement("button");
    const confirmLabel = pendingClearAfterCard
        ? "クリア画面へ進む"
        : nextStage
            ? `次のステージ（${nextStage}）へ進む`
            : "次へ進む";
    confirm.textContent = confirmLabel;
    confirm.addEventListener("click", () => onAction("station_card_continue"));
    footer.appendChild(confirm);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    app.appendChild(overlay);
}
function renderStationCardInline(container, card) {
    const wrapper = document.createElement("div");
    wrapper.className = "station-card-inline";
    const label = document.createElement("p");
    label.className = "station-card-inline__label";
    label.textContent = "獲得したStationカード";
    const panel = createStationCardElement(card);
    wrapper.appendChild(label);
    wrapper.appendChild(panel);
    container.appendChild(wrapper);
}
export function render(app, state, puzzles, onAction, stage, stageOrder) {
    var _a, _b;
    if (!state.isLoggedIn) {
        renderLogin(app, state, onAction);
        return;
    }
    if (!state.tos.agreed) {
        renderTos(app, state, onAction);
        return;
    }
    if (state.postGame.step === "bus_guide") {
        renderBusGuide(app, state, onAction);
        return;
    }
    if (state.postGame.step === "arrival_check") {
        renderArrivalCheck(app, state, onAction);
        return;
    }
    if (state.isCleared) {
        renderClear(app, state);
        return;
    }
    if (stage === "ST1" || stage === "ST3" || stage === "ST4") {
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
    if (stageOrder && stageOrder.length) {
        renderStageNavigation(header, state.currentStage, state.clearedStages, stageOrder, onAction);
    }
    container.appendChild(header);
    const content = document.createElement("div");
    content.className = "content";
    if (intro) {
        const introCard = document.createElement("section");
        introCard.className = "puzzle-card info-card";
        renderInfoPage(introCard, intro);
        content.appendChild(introCard);
    }
    if (challenges.length) {
        renderPuzzleNavigation(content, challenges, state);
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
        const puzzleState = (_a = state.puzzleState[puzzle.id]) !== null && _a !== void 0 ? _a : { solved: false, feedback: null, awardedCard: null };
        if (puzzle.kind === "text") {
            renderTextPuzzle(section, puzzle, puzzleState, onAction);
        }
        else if (puzzle.kind === "crossword") {
            renderCrosswordPuzzle(section, state, puzzle, onAction, puzzleState.solved);
        }
        else if (puzzle.kind === "slot") {
            renderSlotPuzzle(section, puzzle, puzzleState, onAction);
        }
        if (puzzleState.awardedCard) {
            renderStationCardInline(section, puzzleState.awardedCard);
        }
        content.appendChild(section);
    });
    container.appendChild(content);
    app.appendChild(container);
    if (state.stationCardDisplay) {
        renderStationCardOverlay(app, state.stationCardDisplay, onAction, (_b = state.pendingStageAfterCard) !== null && _b !== void 0 ? _b : undefined, state.pendingClearAfterCard);
    }
}
function renderLogin(app, state, onAction) {
    app.innerHTML = `
    <div class="app-shell">
      <h1>Hydrangea Walk</h1>
      <p>パスワードを入力して入室してください</p>
      <form class="login-form">
        <div class="form-group">
          <label for="password">パスワード</label>
          <input type="password" id="password" />
        </div>
        <div class="login-form__actions">
          <button id="login-btn" type="submit">入室する</button>
        </div>
      </form>
      ${state.feedback
        ? `<p class="${feedbackClass(state.feedback.kind)}">${escapeHtml(state.feedback.message)}</p>`
        : ""}
    </div>
  `;
    const form = app.querySelector(".login-form");
    form === null || form === void 0 ? void 0 : form.addEventListener("submit", (event) => {
        event.preventDefault();
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
      <header><h1>今日の謎解きは、ここでおしまいです。</h1></header>
      <div class="content">
        <p>ここまで歩んでくれて、ありがとうございました。少しだけ休憩して、次の時間をゆっくり楽しんでください。</p>
        <p>この場所では、夜になると霧の海のような「雲海」が広がると言われています。</p>
        <p>時間になったら、案内人といっしょに外に出てみてください。</p>
        <p>これで今日の謎解きはすべて終了です。このアプリはここでおしまいです。</p>
        <button id="close-app" class="close-app">アプリを閉じる</button>
      </div>
    </div>
  `;
    const closeButton = app.querySelector("#close-app");
    closeButton === null || closeButton === void 0 ? void 0 : closeButton.addEventListener("click", () => {
        window.close();
    });
}
function renderBusGuide(app, state, onAction) {
    app.innerHTML = `
    <div class="app-shell">
      <header><h1>これからの道しるべ</h1></header>
      <div class="content">
        <p>さきほど導いた番号「61」は、これから進むための番号です。</p>
        <p>いまいる駅から、白いバスで 61 の番号がついたものに乗ってください。</p>
        <p>降りる場所は、あなたのすぐそばにいる“案内人”の合図にしたがってください。</p>
        <button id="open-arrival">到着したら つづきを開く</button>
      </div>
    </div>
  `;
    const proceedButton = app.querySelector("#open-arrival");
    proceedButton === null || proceedButton === void 0 ? void 0 : proceedButton.addEventListener("click", () => {
        onAction("postgame_to_arrival");
    });
}
function renderArrivalCheck(app, state, onAction) {
    app.innerHTML = `
    <div class="app-shell">
      <header><h1>到着確認</h1></header>
      <div class="content">
        <p>到着した場所の名前を入力してください。</p>
        <form class="arrival-form">
          <div class="form-group">
            <label for="arrival-answer">到着先の名前</label>
            <input type="text" id="arrival-answer" autocomplete="off" placeholder="ひらがな・漢字で入力" />
          </div>
          <div class="login-form__actions">
            <button type="submit">送信する</button>
          </div>
        </form>
        ${state.postGame.feedback
        ? `<p class="${feedbackClass(state.postGame.feedback.kind)}">${escapeHtml(state.postGame.feedback.message)}</p>`
        : ""}
      </div>
    </div>
  `;
    const form = app.querySelector(".arrival-form");
    form === null || form === void 0 ? void 0 : form.addEventListener("submit", (event) => {
        event.preventDefault();
        const answerInput = app.querySelector("#arrival-answer");
        onAction("arrival_submit", { value: (answerInput === null || answerInput === void 0 ? void 0 : answerInput.value) || "" });
    });
    const answerInput = app.querySelector("#arrival-answer");
    answerInput === null || answerInput === void 0 ? void 0 : answerInput.focus();
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
function renderTransformPairs(container, pairs) {
    if (!pairs.length)
        return;
    const grid = document.createElement("div");
    grid.className = "final-transform-grid";
    pairs.forEach((pair) => {
        const fromCell = document.createElement("div");
        fromCell.className = "final-transform-grid__cell final-transform-grid__cell--from";
        fromCell.innerHTML = `
          <span class="final-transform-grid__label">変換前</span>
          <span class="final-transform-grid__token">${escapeHtml(pair.from)}</span>
          <span class="final-transform-grid__arrow">→</span>
        `;
        const toCell = document.createElement("div");
        toCell.className = "final-transform-grid__cell final-transform-grid__cell--to";
        toCell.innerHTML = `
          <span class="final-transform-grid__label">変換後</span>
          <span class="final-transform-grid__token">${escapeHtml(pair.to)}</span>
        `;
        grid.appendChild(fromCell);
        grid.appendChild(toCell);
    });
    container.appendChild(grid);
}
function renderTextPuzzle(container, puzzle, puzzleState, onAction) {
    var _a, _b, _c, _d;
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
            item.innerHTML = renderChoiceWithAccent(choice, puzzle.choiceAccents);
            list.appendChild(item);
        });
        question.appendChild(list);
    }
    container.appendChild(question);
    if ((_b = puzzle.transformPairs) === null || _b === void 0 ? void 0 : _b.length) {
        renderTransformPairs(container, puzzle.transformPairs);
    }
    const form = document.createElement("div");
    form.className = "answer-form";
    const inputId = `answer-${puzzle.id}`;
    const finalAnswerClass = puzzle.answerInputClass || (puzzle.id === 306 ? "final-answer-input" : "");
    form.innerHTML = `
    <div class="form-group">
      <label for="${inputId}">回答</label>
      <input type="text" id="${inputId}" autocomplete="off" ${finalAnswerClass ? `class=\\\"${finalAnswerClass}\\\"` : ""} ${puzzleState.solved ? "disabled" : ""} placeholder="${escapeHtml(puzzle.placeholderClue || '')}" />
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
