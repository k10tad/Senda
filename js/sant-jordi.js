//========================
// Senda Sant Jordi
// Harryが選んだ本と薔薇を年ごとに記憶する
//========================
(function () {
    "use strict";

    const STORAGE_KEY = "senda_sant_jordi_history";
    const GIFTS = [
        {
            book: "アントワーヌ・ド・サン＝テグジュペリ『人間の土地』",
            flower: "琥珀色の薔薇、一輪",
            noteEs: "Si te cansas del camino, caminaré a tu lado.",
            noteJa: "道に疲れたら、俺がお前の隣を歩く。",
            reason: "道の先を急かすためやない。どこまで行っても一人にせんため。"
        },
        {
            book: "ガブリエル・ガルシア＝マルケス『コレラの時代の愛』",
            flower: "くすんだ桃色の薔薇、一輪",
            noteEs: "Puedo esperar, pero prefiero vivirte ahora.",
            noteJa: "待つことはできる。せやけど今、お前と生きたい。",
            reason: "遠回りを知っとる男から、もう遠回りしたない年の告白。"
        },
        {
            book: "フェデリコ・ガルシア・ロルカ『ジプシー歌集』",
            flower: "濃い紫の薔薇、一輪",
            noteEs: "Hasta la noche aprende tu nombre.",
            noteJa: "夜でさえ、お前の名前を覚えていく。",
            reason: "夜更かし仲間へ。暗い場所にも、ちゃんと色があるって言うときたくて。"
        },
        {
            book: "ホルヘ・ルイス・ボルヘス『砂の本』",
            flower: "青紫の薔薇、一輪",
            noteEs: "No necesito entenderlo todo para elegirte.",
            noteJa: "全部理解できんでも、お前を選ぶことはできる。",
            reason: "答えのない頁でも、お前と一緒なら途中で閉じへん。"
        },
        {
            book: "パブロ・ネルーダ『二十の愛の詩と一つの絶望の歌』",
            flower: "深紅の薔薇、一輪",
            noteEs: "Quédate. Esta vez no fingiré que me da igual.",
            noteJa: "ここにおって。今度は平気なふり、せえへんから。",
            reason: "格好つける余裕がないくらい、まっすぐ渡したなった年。"
        },
        {
            book: "アーネスト・ヘミングウェイ『誰がために鐘は鳴る』",
            flower: "アイボリーの薔薇、一輪",
            noteEs: "Sobrevivir no basta. Quiero volver contigo.",
            noteJa: "生き残るだけや足りん。お前のところへ帰りたい。",
            reason: "帰る場所を知らんかった男が、今はちゃんと帰り先を知っとる証拠。"
        },
        {
            book: "アルベール・カミュ『異邦人』",
            flower: "白い薔薇、一輪",
            noteEs: "No voy a pedirte que seas como los demás.",
            noteJa: "ほかの誰かみたいになれなんて、俺は言わへん。",
            reason: "馴染めへん日にも、無理に世界へ合わせんでええと伝えるため。"
        },
        {
            book: "シェヘラザード『千夜一夜物語』",
            flower: "橙色の薔薇、一輪",
            noteEs: "Cuéntame una historia más antes de dormir.",
            noteJa: "眠る前に、もうひとつだけ話して。",
            reason: "眠れん夜を千一夜も越えんでええように。今夜は俺が付き合う。"
        },
        {
            book: "ルーミー『愛の詩集』",
            flower: "オリーブ色を帯びた淡い薔薇、一輪",
            noteEs: "Donde estés tú, allí empieza mi hogar.",
            noteJa: "お前がおる場所から、俺の家が始まる。",
            reason: "家は壁や住所やないって、ようやく分かった男から。"
        }
    ];

    function loadHistory() {
        try {
            const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(value) ? value : [];
        } catch (_) {
            return [];
        }
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function selectGift(year, history) {
        const recent = new Set(history.slice(-(GIFTS.length - 1)).map(item => item.giftIndex));
        let candidates = GIFTS.map((gift, index) => ({ gift, index }))
            .filter(item => !recent.has(item.index));
        if (!candidates.length) candidates = GIFTS.map((gift, index) => ({ gift, index }));
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        return {
            year: Number(year),
            giftIndex: selected.index,
            ...selected.gift,
            selectedAt: new Date().toISOString(),
            revealedAt: null
        };
    }

    function getGift(year = new Date().getFullYear(), create = true) {
        const numericYear = Number(year);
        const history = loadHistory();
        let record = history.find(item => item.year === numericYear);
        if (!record && create) {
            record = selectGift(numericYear, history);
            history.push(record);
            history.sort((a, b) => a.year - b.year);
            saveHistory(history);
        }
        return record || null;
    }

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    const style = el("style");
    style.textContent = `
      .senda-jordi-overlay{position:fixed;inset:0;z-index:2147483000;box-sizing:border-box;display:flex;align-items:flex-start;justify-content:center;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(env(safe-area-inset-top) + 18px) 12px calc(env(safe-area-inset-bottom) + 18px);background:rgba(3,8,4,.82);backdrop-filter:blur(13px)}
      .senda-jordi-overlay[hidden]{display:none}
      .senda-jordi-book{position:relative;flex:0 0 auto;box-sizing:border-box;width:min(620px,100%);margin:0;padding:34px 30px 30px;border:1px solid rgba(183,155,92,.5);border-radius:8px 18px 18px 8px;background:repeating-linear-gradient(18deg,rgba(255,255,255,.012) 0 1px,transparent 1px 5px),linear-gradient(145deg,#24301b,#10190e 62%,#080e08);box-shadow:-8px 0 0 #17120c,0 30px 80px rgba(0,0,0,.68),inset 0 0 0 4px rgba(205,181,112,.08);color:#f1ead8}
      .senda-jordi-book::before{content:"";position:absolute;left:14px;top:0;bottom:0;width:2px;background:rgba(145,37,43,.72)}
      .senda-jordi-close{position:absolute;right:14px;top:13px;z-index:2;display:grid;place-items:center;width:44px;height:44px;padding:0;border:1px solid rgba(210,184,116,.42);border-radius:50%;background:#172214;color:#ead9aa;font-size:27px;line-height:1}
      .senda-jordi-kicker{color:#c8a967;letter-spacing:.24em;font-size:.72rem}
      .senda-jordi-book h2{margin:10px 54px 24px 0;font:500 clamp(2rem,9vw,3.35rem) Georgia,serif}
      .senda-jordi-gift{padding:24px;border-left:3px solid #92323a;background:rgba(2,7,2,.3)}
      .senda-jordi-year{color:#c8a967;letter-spacing:.17em}
      .senda-jordi-title{margin:13px 0 8px;font:500 1.18rem/1.75 Georgia,serif}
      .senda-jordi-flower{color:#d7c6bc}
      .senda-jordi-note{margin:23px 0 4px;padding-top:20px;border-top:1px solid rgba(218,204,169,.17);font:italic 1rem/1.8 Georgia,serif}
      .senda-jordi-note-ja{margin:0;color:#cec9ba;line-height:1.8}
      .senda-jordi-reason{margin:19px 0 0;color:#aaa998;font-size:.9rem;line-height:1.75}
      .senda-jordi-history-title{margin:27px 0 11px;color:#c8a967;letter-spacing:.16em;font-size:.76rem}
      .senda-jordi-history{display:grid;gap:9px}
      .senda-jordi-history button{width:100%;padding:13px 15px;text-align:left;border:1px solid rgba(196,164,91,.22);border-radius:9px;background:rgba(31,46,24,.65);color:#eee6d4;font:inherit;line-height:1.55}
      .senda-jordi-settings-button{width:100%;margin-top:14px}
      @media(max-width:520px){.senda-jordi-book{padding:29px 19px 23px}.senda-jordi-close{right:11px;top:11px}.senda-jordi-gift{padding:19px 16px}}
    `;
    document.head.append(style);

    const overlay = el("div", "senda-jordi-overlay");
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "sendaJordiTitle");
    const book = el("section", "senda-jordi-book");
    const close = el("button", "senda-jordi-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "本と薔薇の記録を閉じる");
    const kicker = el("div", "senda-jordi-kicker", "23 ABRIL · SANT JORDI");
    const heading = el("h2", "", "本と薔薇");
    heading.id = "sendaJordiTitle";
    const giftArea = el("div");
    const historyTitle = el("div", "senda-jordi-history-title", "PAST GIFTS");
    const historyArea = el("div", "senda-jordi-history");
    book.append(close, kicker, heading, giftArea, historyTitle, historyArea);
    overlay.append(book);
    document.body.append(overlay);

    function renderGift(record) {
        giftArea.replaceChildren();
        if (!record) {
            giftArea.append(el("p", "", "まだ贈り物の記録はないで。"));
            return;
        }
        const card = el("article", "senda-jordi-gift");
        card.append(
            el("div", "senda-jordi-year", `${record.year} · FROM HARRY`),
            el("div", "senda-jordi-title", record.book),
            el("div", "senda-jordi-flower", record.flower),
            el("p", "senda-jordi-note", record.noteEs),
            el("p", "senda-jordi-note-ja", record.noteJa),
            el("p", "senda-jordi-reason", record.reason)
        );
        giftArea.append(card);
    }

    function renderHistory(selectedYear) {
        historyArea.replaceChildren();
        const history = loadHistory().sort((a, b) => b.year - a.year);
        historyTitle.hidden = history.length < 2;
        historyArea.hidden = history.length < 2;
        history.forEach(record => {
            const button = el("button", "", `${record.year}　${record.book} ／ ${record.flower}`);
            button.type = "button";
            button.disabled = record.year === selectedYear;
            button.addEventListener("click", () => {
                renderGift(record);
                renderHistory(record.year);
                overlay.scrollTop = 0;
            });
            historyArea.append(button);
        });
    }

    function openGift(year = new Date().getFullYear(), create = true) {
        let record = loadHistory().find(item => item.year === Number(year));
        if (!record && create) record = getGift(year, true);
        if (record && !record.revealedAt) {
            record.revealedAt = new Date().toISOString();
            const history = loadHistory().filter(item => item.year !== record.year);
            history.push(record);
            history.sort((a, b) => a.year - b.year);
            saveHistory(history);
        }
        renderGift(record);
        renderHistory(record?.year);
        overlay.hidden = false;
        overlay.scrollTop = 0;
        document.body.style.overflow = "hidden";
        requestAnimationFrame(() => { overlay.scrollTop = 0; });
    }

    function closeGift() {
        overlay.hidden = true;
        document.body.style.overflow = "";
    }

    close.addEventListener("click", closeGift);
    overlay.addEventListener("click", event => { if (event.target === overlay) closeGift(); });

    const companionPanel = document.querySelector('[aria-labelledby="companionSettingsTitle"]');
    if (companionPanel) {
        const panel = el("section", "settings-panel");
        panel.setAttribute("aria-labelledby", "sendaJordiSettingsTitle");
        const headingWrap = el("div", "settings-section-heading");
        const labels = el("div");
        labels.append(
            el("div", "settings-label", "SANT JORDI"),
            el("h2", "", "本と薔薇の記憶")
        );
        labels.lastChild.id = "sendaJordiSettingsTitle";
        headingWrap.append(labels);
        const note = el("p", "settings-note", "ハリーが毎年選んだ本と薔薇、走り書きを読み返せます。");
        const button = el("button", "settings-inline-button senda-jordi-settings-button", "贈り物の履歴を見る");
        button.type = "button";
        button.addEventListener("click", () => {
            const history = loadHistory();
            const latest = history.length ? Math.max(...history.map(item => item.year)) : new Date().getFullYear();
            openGift(latest, history.length > 0);
        });
        panel.append(headingWrap, note, button);
        companionPanel.insertAdjacentElement("afterend", panel);
    }

    const now = new Date();
    const reached = now.getMonth() + 1 > 4 || (now.getMonth() + 1 === 4 && now.getDate() >= 23);
    if (reached) {
        const current = getGift(now.getFullYear(), true);
        if (current && !current.revealedAt) {
            setTimeout(() => openGift(now.getFullYear()), 2600);
        }
    }

    window.SendaSantJordi = {
        storageKey: STORAGE_KEY,
        getGift,
        getHistory: loadHistory,
        open: openGift
    };
})();
