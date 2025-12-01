
import {
    AppState,
    ChoiceAccent,
    CrosswordPuzzle,
    Feedback,
    InfoPage,
    Puzzle,
    PuzzleProgress,
    SlotPuzzle,
    StageId,
    StationCard,
    TextPuzzle,
} from "../types.js";
import { ensureCrosswordProgress, getClueAt, isBlock } from "../logic/crossword.js";

const stageLabels: Record<StageId, string> = {
    ST1: "ステージ1",
    ST2: "ステージ2",
    ST3: "ステージ3",
    ST4: "ステージ4",
};

// Helper to escape HTML
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function feedbackClass(kind: "error" | "success") {
    return `feedback feedback--${kind}`;
}

function renderChoiceWithAccent(choice: string, accents?: ChoiceAccent[]) {
    const accent = accents?.find((a) => a.label === choice);
    if (!accent) return escapeHtml(choice);

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

function renderStageNavigation(
    header: HTMLElement,
    currentStage: StageId,
    clearedStages: StageId[],
    stageOrder: StageId[],
    onAction: (action: string, payload?: any) => void
) {
    if (!stageOrder.length) return;

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
        const index = stageOrder.indexOf(stageId);
        const isCurrent = currentStage === stageId;
        const isCleared = clearedStages.includes(stageId);
        const isUnlocked = index <= maxClearedIndex + 1 && index !== -1;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = stageLabels[stageId] ?? stageId;
        button.className = "stage-nav__item";

        if (isCurrent) {
            button.classList.add("is-current");
        } else if (isCleared) {
            button.classList.add("is-cleared");
        }

        if (!isUnlocked) {
            button.disabled = true;
            button.classList.add("is-locked");
        } else {
            button.addEventListener("click", () => onAction("navigate_stage", { stageId }));
        }

        list.appendChild(button);
    });

    nav.appendChild(list);
    header.appendChild(nav);
}

function createStationCardElement(card: StationCard) {
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
        <span class="station-card__line-name">${escapeHtml(card.lineName)}</span>
      </div>
      <div class="station-card__value">${card.value}</div>
    `;

    panel.appendChild(header);
    panel.appendChild(body);
    return panel;
}

function renderPuzzleNavigation(container: HTMLElement, puzzles: Puzzle[], state: AppState) {
    if (!puzzles.length) return;

    const nav = document.createElement("div");
    nav.className = "puzzle-nav";

    const label = document.createElement("span");
    label.className = "puzzle-nav__label";
    label.textContent = "ステージ内移動";
    nav.appendChild(label);

    const list = document.createElement("div");
    list.className = "puzzle-nav__list";

    puzzles.forEach((puzzle, index) => {
        const button = document.createElement("button");
        button.type = "button";
        const displayIndex = index + 1;
        const puzzleLabel = puzzle.kind === "info" ? "イントロ" : `Q${displayIndex}`;
        button.textContent = puzzleLabel;
        button.className = "puzzle-nav__item";

        const solved = state.puzzleState[puzzle.id]?.solved;
        if (solved) {
            button.classList.add("is-solved");
        }

        const targetId = `puzzle-${puzzle.id}`;
        button.addEventListener("click", () => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        list.appendChild(button);
    });

    nav.appendChild(list);
    container.appendChild(nav);
}

function renderStationCardOverlay(
    app: HTMLElement,
    card: StationCard,
    onAction: (action: string, payload?: any) => void,
    nextStage?: StageId,
    pendingClearAfterCard?: boolean
) {
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

function renderStationCardInline(container: HTMLElement, card: StationCard) {
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

export function render(
    app: HTMLElement,
    state: AppState,
    puzzles: Puzzle[],
    onAction: (action: string, payload?: any) => void,
    stage?: StageId,
    stageOrder?: StageId[]
) {
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

    if (stage === "ST1" || stage === "ST3" || stage === "ST4") {
        document.body.classList.add("stage-shinjuku");
        document.body.classList.remove("stage-akiba");
    } else if (stage === "ST2") {
        document.body.classList.add("stage-akiba");
        document.body.classList.remove("stage-shinjuku");
    } else {
        document.body.classList.remove("stage-shinjuku");
        document.body.classList.remove("stage-akiba");
    }

    const intro = puzzles.find((p) => p.kind === "info") as InfoPage | undefined;
    const challenges = puzzles.filter((p) => p.kind !== "info");

    app.innerHTML = "";
    const container = document.createElement("div");
    container.className = "app-shell";

    const header = document.createElement("header");
    const stageTitle = intro?.title ?? "Hydrangea Walk";
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
        const section = document.createElement("section");
        section.className = "puzzle-card";
        section.id = `puzzle-${puzzle.id}`;

        const title = document.createElement("h2");
        const puzzleLabel = puzzle.title.startsWith("問") ? puzzle.title : `問${index + 1}｜${puzzle.title}`;
        title.textContent = puzzleLabel;
        section.appendChild(title);

        const puzzleState: PuzzleProgress = state.puzzleState[puzzle.id] ?? { solved: false, feedback: null, awardedCard: null };

        if (puzzle.kind === "text") {
            renderTextPuzzle(section, puzzle as TextPuzzle, puzzleState, onAction);
        } else if (puzzle.kind === "crossword") {
            renderCrosswordPuzzle(section, state, puzzle as CrosswordPuzzle, onAction, puzzleState.solved);
        } else if (puzzle.kind === "slot") {
            renderSlotPuzzle(section, puzzle as SlotPuzzle, puzzleState, onAction);
        }

        if (puzzleState.awardedCard) {
            renderStationCardInline(section, puzzleState.awardedCard);
        }

        content.appendChild(section);
    });

    container.appendChild(content);
    app.appendChild(container);

    if (state.stationCardDisplay) {
        renderStationCardOverlay(
            app,
            state.stationCardDisplay,
            onAction,
            state.pendingStageAfterCard ?? undefined,
            state.pendingClearAfterCard
        );
    }
}

function renderLogin(
    app: HTMLElement,
    state: AppState,
    onAction: (action: string, payload?: any) => void
) {
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
            ? `<p class="${feedbackClass(state.feedback.kind)}">${escapeHtml(
                state.feedback.message
            )}</p>`
            : ""
        }
    </div>
  `;

    app.querySelector("#login-btn")?.addEventListener("click", () => {
        const input = app.querySelector("#password") as HTMLInputElement;
        onAction("login", input.value.trim());
    });

    const passwordInput = app.querySelector("#password") as HTMLInputElement | null;
    passwordInput?.focus();
}

function renderTos(
    app: HTMLElement,
    state: AppState,
    onAction: (action: string, payload?: any) => void
) {
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

    const accordionTrigger = app.querySelector("#tos-trigger") as HTMLButtonElement | null;
    const accordionPanel = app.querySelector("#tos-panel") as HTMLDivElement | null;
    const agreeCheckbox = app.querySelector("#tos-agree") as HTMLInputElement | null;
    const startButton = app.querySelector("#tos-start") as HTMLButtonElement | null;

    const updateButtonState = () => {
        if (!startButton || !agreeCheckbox) return;
        startButton.disabled = !agreeCheckbox.checked;
    };

    accordionTrigger?.addEventListener("click", () => {
        if (!accordionTrigger || !accordionPanel) return;
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

    agreeCheckbox?.addEventListener("change", () => {
        updateButtonState();
    });

    startButton?.addEventListener("click", () => {
        onAction("tos_accept");
    });

    accordionTrigger?.focus();
    updateButtonState();
}

function renderClear(app: HTMLElement, state: AppState) {
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

function renderInfoPage(
    container: HTMLElement,
    puzzle: InfoPage
) {
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

function renderTextPuzzle(
    container: HTMLElement,
    puzzle: TextPuzzle,
    puzzleState: PuzzleProgress,
    onAction: (action: string, payload?: any) => void
) {
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
    if (puzzle.choices?.length) {
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
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(puzzle.mapQuery!)}`, "_blank");
        });
        container.appendChild(mapBtn);
    }

    const submit = () => {
        const input = form.querySelector(`#${inputId}`) as HTMLInputElement;
        onAction("answer", { puzzleId: puzzle.id, value: input.value.trim() });
    };

    form.querySelector(`#submit-btn-${puzzle.id}`)?.addEventListener("click", submit);

    form.querySelector<HTMLInputElement>(`#${inputId}`)?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            submit();
        }
    });
}

function renderSlotPuzzle(
    container: HTMLElement,
    puzzle: SlotPuzzle,
    puzzleState: PuzzleProgress,
    onAction: (action: string, payload?: any) => void
) {
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

        const prefilled = puzzle.prefilled?.find(p => p.index === i);
        const charToShow = solvedChars?.[i] ?? prefilled?.char;

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
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(puzzle.mapQuery!)}`, "_blank");
        });
        container.appendChild(mapBtn);
    }

    const submit = () => {
        const input = form.querySelector(`#${inputId}`) as HTMLInputElement;
        onAction("answer", { puzzleId: puzzle.id, value: input.value.trim() });
    };

    form.querySelector(`#submit-btn-${puzzle.id}`)?.addEventListener("click", submit);

    form.querySelector<HTMLInputElement>(`#${inputId}`)?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            submit();
        }
    });
}

function renderCrosswordPuzzle(
    container: HTMLElement,
    state: AppState,
    puzzle: CrosswordPuzzle,
    onAction: (action: string, payload?: any) => void,
    solved: boolean
) {
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
            } else {
                cell.textContent = progress.grid[r][c];
                cell.dataset.row = r.toString();
                cell.dataset.col = c.toString();

                if (progress.activeCell?.row === r && progress.activeCell?.col === c) {
                    cell.classList.add("active");
                }

                const clueStart = puzzle.clues.find(
                    (clue) => clue.row === r && clue.col === c
                );
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
