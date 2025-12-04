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
export function resetScrollPosition(behavior = "auto") {
    window.scrollTo({ top: 0, behavior });
}
function createContentParagraph(text) {
    const paragraph = document.createElement("p");
    const trimmed = text.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        try {
            const url = new URL(trimmed);
            const anchor = document.createElement("a");
            anchor.href = url.toString();
            anchor.textContent = url.toString();
            anchor.target = "_blank";
            anchor.rel = "noopener noreferrer";
            paragraph.appendChild(anchor);
            return paragraph;
        }
        catch (error) {
            // Fallback to textContent when URL parsing fails
        }
    }
    paragraph.textContent = text;
    return paragraph;
}
function appendContentParagraphs(container, contents) {
    contents.forEach((entry) => {
        const paragraph = createContentParagraph(entry);
        container.appendChild(paragraph);
    });
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
    resetScrollPosition();
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
      <p>担当者から受領したパスワードを入力してください。</p>
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
            <h2>本サービス利用規約（街歩き型コンテンツ・トライアル版）</h2>
            <p>本利用規約（以下「本規約」といいます。）は、制作者が提供する街歩き型コンテンツおよびこれに付随する一連の体験（以下「本サービス」といいます。）の利用条件を定めるものです。参加者は、本サービスにアクセスし、画面上の案内に従い操作を行い、または実際に街を歩行するなど本サービスに実質的に参加する行為をもって、本規約の内容を十分に理解し、これに法的に拘束されることに同意したものとみなされます。</p>
            <p>本サービスは、日常の行動様式とは異なる形式の体験を提供することを目的とするものであり、その具体的な内容、進行方法および最終的な到達地点その他の詳細は、参加者の行動および当日の状況に応じて変動し得る性質を有します。参加者は、本サービスの性質上、その全容や具体的な目的が事前に逐一明示されない場合があることを予め了承するものとします。</p>
            <h3>第1条（本規約の適用）</h3>
            <ol>
              <li>本規約は、参加者による本サービスの一切の利用行為に適用されるものとします。</li>
              <li>制作者が本サービスに関して画面上、文書、口頭その他の方法により適宜提示するガイドライン、注意書き、説明、個別条件等（名称の如何を問いません）は、本規約の一部を構成するものとします。</li>
              <li>参加者は、本サービスの利用を開始した時点で、本規約の全条項（実際に閲読したか否かを問いません）に同意したものとみなされることにつき、予め異議なく承諾するものとします。</li>
            </ol>
            <h3>第2条（定義）</h3>
            <ol>
              <li>「参加者」とは、本サービスに興味を示し、画面を開き、登録・ログインその他の方法により本サービスへの参加手続を行い、または同行その他の形で実際に本サービスの行程に加わる個人をいいます。</li>
              <li>「制作者」とは、本サービスの企画、設計、運営、当日の進行および最終的な体験内容の構成を行う者をいいます。</li>
              <li>「謎解き」とは、文字、図形、記号、会話、地形、建造物、看板その他一切の要素を用いて構成される、参加者の思考・観察・行動を促す課題・仕掛けの総称をいいます。</li>
              <li>「最終目的地」とは、本サービスの過程において参加者が到達することを企図された場所であって、本サービス全体の構成上、重要な位置付けを有する地点をいいます。</li>
            </ol>
            <h3>第3条（本サービスの性質およびトライアル実施）</h3>
            <ol>
              <li>本サービスは、個別に設計された限定的な体験コンテンツであり、一般向けに継続的かつ商業的に提供される標準的なサービスとは異なり、試験的・試行的な性質（以下「トライアル」といいます。）を有する場合があります。</li>
              <li>参加者は、トライアルとして提供される本サービスにおいて、その内容、難易度、行程、所要時間、使用される技術的要素等が予告なく変更される可能性があることを了承するものとします。</li>
              <li>制作者は、本サービスの品質および参加者の体験の向上を目的として、当日の参加状況、天候、交通事情その他の事情を勘案し、行程の一部を変更し、短縮し、又は代替ルートを設定することができるものとします。</li>
            </ol>
            <h3>第4条（利用環境および対応端末）</h3>
            <ol>
              <li>参加者は、本サービスを利用するにあたり、インターネット接続環境、位置情報サービス、ウェブブラウザ等、本サービスの利用に必要な機器および通信手段を、自己の費用と責任において準備・維持するものとします。</li>
              <li>
                本サービスは、スマートフォン端末での利用を前提として設計されています。推奨される端末環境は、原則として次の各号のいずれかの条件を満たすものとします。
                <ul>
                  <li>iOS：Apple社がサポートするバージョンのうち、比較的新しい世代に属するOSバージョンを搭載したiPhone端末</li>
                  <li>Android：Google Playストアの利用が可能であり、かつ一定水準以上の性能を有すると一般に認められるAndroid OSバージョンを搭載したスマートフォン端末</li>
                </ul>
              </li>
              <li>
                推奨ブラウザは、以下のとおりとします。
                <ul>
                  <li>Safari（iOS端末における標準ブラウザ）</li>
                  <li>Google Chrome（最新版またはそれに準じるバージョンにアップデートされたもの）</li>
                </ul>
              </li>
              <li>前各号に該当しない端末・ブラウザ（例：一部の旧型機種、タブレット端末、PCブラウザ、独自ブラウザ等）においては、本サービスの全ての機能が正常に動作しない場合があります。参加者は、このような利用環境上の制約に起因する動作不良について、制作者が一切の責任を負わないことに同意するものとします。</li>
            </ol>
            <h3>第5条（費用負担および交通機関の利用）</h3>
            <ol>
              <li>参加者は、本サービスの利用に伴い発生する一切の費用（通信料、飲食代、入場料、交通費その他の実費を含みますがこれらに限られません）を、自己の負担により支払うものとします。</li>
              <li>本サービスは、複数の場所を移動する形式をとる場合があり、その過程で鉄道、バスその他の公共交通機関を利用することがあります。この場合に必要となる運賃・料金等は、すべて参加者本人の負担とします。</li>
              <li>制作者は、交通機関の遅延・運休、混雑、経路変更等により参加者に不利益や予定外の待ち時間が生じた場合であっても、その責任を負わないものとします。ただし、当日の状況に応じて行程の調整その他の合理的な対応を試みる場合があります。</li>
            </ol>
            <h3>第6条（自己責任および安全配慮義務）</h3>
            <ol>
              <li>参加者は、本サービスの利用に伴う一切の行動を、自己の意思と責任において行うものとし、街中での移動、階段・段差の昇降、信号・横断歩道の利用等について、安全に十分配慮する義務を負うものとします。</li>
              <li>歩行中のスマートフォン操作は、必要最小限にとどめるよう努め、特に車道付近、駅構内、混雑した場所等においては、立ち止まった上で画面を確認する等、安全を最優先するものとします。</li>
              <li>制作者は、参加者に対し危険な行為を指示しないよう合理的な注意を払いますが、参加者の不注意または過度な無理により生じた事故・怪我・体調不良等については、一切の責任を負わないものとします。</li>
            </ol>
            <h3>第7条（禁止事項）</h3>
            <ol>
              <li>制作者の案内および画面上の指示に反し、行程を著しく逸脱する行為</li>
              <li>公序良俗、法令または交通ルールに反する行為</li>
              <li>本サービスの内容を、当日参加していない第三者に対し、将来の実施に支障をきたす程度に具体的かつ詳細に開示する行為</li>
              <li>制作者の意図を大きく損なう形で、極端なショートカット、ネタバレの拡散その他本サービスの趣旨に反する行為</li>
              <li>その他、制作者が不適切と合理的に判断する行為</li>
            </ol>
            <h3>第8条（本サービス特有の重要事項への同意）</h3>
            <ol>
              <li><strong>（課題等への取組に関する合意）</strong> 参加者は、本サービスに含まれる謎解きその他一切の課題、指示、案内等（以下総称して「課題等」といいます。）について、合理的な範囲において誠実かつ真摯に取り組むものとします。参加者は、課題等の進行を一方的に放棄し、又は明らかに不適切な回答を連続して行う等して、本サービスの趣旨を著しく害する行為を行わないことに同意します。</li>
              <li><strong>（飲食場所に関する合意）</strong> 本サービス実施日における昼食に関し、参加者は、制作者が事前又は当日に指定する飲食店その他の場所（以下「指定昼食場所」といいます。）において、原則としてこれを摂ることに同意します。参加者は、健康上又は宗教上その他やむを得ない事情がない限り、指定昼食場所への同行を不当に拒否しないものとし、当該事情が存在する場合には、制作者と協議のうえ、代替案を誠実に検討するものとします。</li>
              <li><strong>（最終目的地における記録の同意）</strong> 参加者は、本サービスの終盤において特に重要な位置付けを有する最終目的地において、制作者が当日の状況に応じて一定の演出、会話その他の行為（以下「重要場面」といいます。）を行うことがあることを了承します。参加者は、重要場面その他最終目的地における一連の行為につき、制作者又は制作者が指定する者による写真・動画その他の方法による記録行為を許可し、これらの記録データが、将来の思い出の振り返り等の個人的利用の範囲内で保存・閲覧されることに同意します。</li>
              <li><strong>（重要な意思表示に関する合意）</strong> 参加者は、最終目的地において、制作者から、両者の関係の在り方及び将来の生活その他これに関連する事項に関する重要な意思表示が行われる可能性が高いことを予め認識し、その内容が、共同生活の開始その他これに類する将来の方針に関する提案を含み得ることを了承します。参加者は、かかる重要な意思表示が行われた場合には、これを軽率に取り扱うことなく真摯に受け止め、本サービス全体の経緯及び制作者との関係に照らして、原則として受諾する方向で誠実に検討するものとします。ただし、最終的な意思決定は、参加者本人の自由意思に基づくものとし、制作者は、適用される法令に反する形で参加者の意思決定を拘束するものではありません。</li>
            </ol>
            <h3>第9条（位置情報・写真等の取扱い）</h3>
            <ol>
              <li>制作者は、本サービスの進行管理および体験の記録のため、参加者の移動履歴、立ち寄り場所、飲食の有無、反応等に関する情報を、主として制作者自身の記憶その他の非電子的な手段により把握する場合があります。</li>
              <li>制作者は、前条に基づき撮影された写真・動画その他の記録データを、原則として当事者間における閲覧、保存および将来の振り返り（アルバム作成等を含みます。）の目的に限り利用するものとし、参加者の事前の明示的な同意なく、インターネット上での不特定多数への公開その他の第三者提供を行わないものとします。</li>
            </ol>
            <h3>第10条（本サービスの変更・中断・中止）</h3>
            <ol>
              <li>制作者は、天候不良、災害、交通機関の大幅な乱れ、参加者または制作者の体調不良、施設の営業状況その他やむを得ない事由により、本サービスの全部または一部の内容を変更し、またはその提供を中断もしくは中止することができるものとします。</li>
              <li>制作者は、前項に基づき本サービスの変更・中断・中止を行ったことに起因して参加者に生じた損害について、一切の責任を負わないものとします。ただし、可能な範囲で代替案の提示その他の配慮を行うよう努めるものとします。</li>
            </ol>
            <h3>第11条（準拠法および紛争解決）</h3>
            <ol>
              <li>本規約の成立、効力、履行および解釈については、日本法を準拠法とします。</li>
              <li>本サービスに関して参加者と制作者との間に何らかの意見の相違または紛争が生じた場合には、双方は、互いの立場および事情を尊重しつつ誠実に協議し、可能な限り平和的かつ円満な解決を図るものとします。</li>
              <li>前項の協議によっても解決しない場合には、参加者および制作者は、互いの今後の状況に照らして最善と考えられる選択肢を検討し、必要に応じて専門家の助言等を受けることができるものとします。</li>
            </ol>
            <p>以上</p>
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
    appendContentParagraphs(body, puzzle.content);
    container.appendChild(body);
    if (puzzle.imageUrl) {
        const figure = document.createElement("div");
        figure.className = "puzzle-image";
        const img = document.createElement("img");
        img.src = puzzle.imageUrl;
        img.alt = puzzle.imageAlt || "";
        figure.appendChild(img);
        container.appendChild(figure);
    }
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
    const prompt = document.createElement("p");
    prompt.textContent = puzzle.prompt;
    question.appendChild(prompt);
    if (puzzle.content) {
        appendContentParagraphs(question, puzzle.content);
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
