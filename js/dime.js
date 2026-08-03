// Dime: Harryとの短いメッセージと、既存の約束履歴を同じ画面で読む。
(function () {
    "use strict";

    const STORAGE_KEY = "sendaDimeStateV1";
    const MAX_MESSAGES = 240;
    const replies = [
        "見たで。忘れへんよう、俺も覚えとくわ。",
        "分かった。あとでちゃんと聞かせてな。",
        "またメモ？……置いとき。",
        "了解。無理して一人で抱えたらあかんよ。",
        "OK読んだ。呼びたなったら、いつでも呼びや。",
        "はいはい、好きに書いとって。",
        "そんで？他には？……まだあるんやろ？",
        "……気付いたら、俺のメッセめちゃくちゃするやん",
        "りょーかい"
    ];


    const el = {
        launch: document.getElementById("openDime"),
        overlay: document.getElementById("dimeOverlay"),
        close: document.getElementById("closeDime"),
        tabs: Array.from(document.querySelectorAll("[data-dime-tab]")),
        messagesPanel: document.getElementById("dimeMessagesPanel"),
        promisesPanel: document.getElementById("dimePromisesPanel"),
        thread: document.getElementById("dimeThread"),
        history: document.getElementById("dimePromiseHistory"),
        form: document.getElementById("dimeForm"),
        input: document.getElementById("dimeInput"),
        send: document.getElementById("sendDime")
    };

    let state = loadState();
    let editingId = "";

    function loadState() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return {
                schemaVersion: 1,
                messages: Array.isArray(parsed?.messages) ? parsed.messages : []
            };
        } catch (_) {
            return { schemaVersion: 1, messages: [] };
        }
    }

    function saveState() {
        state.messages = state.messages.slice(-MAX_MESSAGES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function id(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function time(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    }

    function createBubble(message) {
        const row = document.createElement("article");
        row.className = `dime-message ${message.side}`;

        const bubble = document.createElement("p");
        bubble.textContent = message.text;
        row.appendChild(bubble);

        const meta = document.createElement("small");
        if (message.side === "user") {
            meta.className = message.readAt ? "is-read" : "";
            meta.textContent = `${message.readAt ? "✓✓ Leído" : "✓ Enviado"} · ${time(message.updatedAt || message.readAt || message.sentAt)}`;

            const edit = document.createElement("button");
            edit.type = "button";
            edit.textContent = "編集";
            edit.addEventListener("click", () => beginEdit(message.id));

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "削除";
            remove.addEventListener("click", () => deleteMessage(message.id));
            meta.append(edit, remove);
        } else {
            meta.textContent = `Harry · ${time(message.sentAt)}`;
        }
        row.appendChild(meta);
        return row;
    }

    function renderMessages() {
        if (!el.thread) return;
        el.thread.replaceChildren();
        if (!state.messages.length) {
            const empty = document.createElement("p");
            empty.className = "dime-empty";
            empty.textContent = "言いたいこと、ここに置いてって。";
            el.thread.appendChild(empty);
        } else {
            state.messages.forEach(message => el.thread.appendChild(createBubble(message)));
        }
        requestAnimationFrame(() => { el.thread.scrollTop = el.thread.scrollHeight; });
    }

    function replyTo(messageId) {
        if (state.messages.some(message => message.replyTo === messageId)) return;
        state.messages.push({
            id: id("harry"),
            side: "harry",
            text: replies[Math.floor(Math.random() * replies.length)],
            sentAt: new Date().toISOString(),
            replyTo: messageId
        });
        saveState();
        renderMessages();
    }

    function markRead(messageId) {
        const message = state.messages.find(item => item.id === messageId);
        if (!message || message.readAt) return;
        message.readAt = new Date().toISOString();
        saveState();
        renderMessages();
        window.setTimeout(() => replyTo(messageId), 900 + Math.floor(Math.random() * 700));
    }

    function sendMessage(text) {
        const message = {
            id: id("user"),
            side: "user",
            text,
            sentAt: new Date().toISOString(),
            readAt: null
        };
        state.messages.push(message);
        saveState();
        renderMessages();
        window.setTimeout(() => markRead(message.id), 650);
    }

    function cancelEdit() {
        editingId = "";
        if (el.input) el.input.value = "";
        if (el.send) el.send.textContent = "Enviar";
    }

    function beginEdit(messageId) {
        const message = state.messages.find(item => item.id === messageId && item.side === "user");
        if (!message || !el.input) return;
        editingId = messageId;
        el.input.value = message.text;
        if (el.send) el.send.textContent = "Actualizar";
        el.input.focus();
        el.input.setSelectionRange(el.input.value.length, el.input.value.length);
    }

    function updateMessage(text) {
        const message = state.messages.find(item => item.id === editingId && item.side === "user");
        if (!message) {
            cancelEdit();
            return;
        }
        message.text = text;
        message.updatedAt = new Date().toISOString();
        saveState();
        cancelEdit();
        renderMessages();
    }

    function deleteMessage(messageId) {
        if (!confirm("このメッセージを削除しますか？")) return;
        state.messages = state.messages.filter(message => (
            message.id !== messageId && message.replyTo !== messageId
        ));
        saveState();
        if (editingId === messageId) cancelEdit();
        renderMessages();
    }

    function promiseDate(value) {
        const date = new Date(`${value}T12:00:00`);
        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
    }

    function promiseCopy(record) {
        const returnType = record.type === "return";
        const offered = returnType
            ? "今日、何時ごろ帰る？　だいたいでええから教えといて。"
            : "今夜、一緒に寝る？　先に約束しとこ。";
        if (record.status === "declined") {
            return { offered, answer: returnType ? "今日はまだ分からない" : "今夜は未定", reply: "そっか。ほな決めつけんと待っとく。", label: "未定" };
        }
        if (record.status === "offered" || record.status === "new") {
            return { offered, answer: "返事はまだ", reply: "急がんでええよ。", label: "返事待ち" };
        }
        const answer = returnType ? `${record.targetTime || "あとで"}ごろに帰る` : "今夜、一緒に寝る";
        const completed = record.status === "completed";
        const reply = completed
            ? (returnType ? "ちゃんと帰ってきたな。おかえり。" : "約束守ったな。ほな、もう離れんとって。")
            : (returnType ? `${record.targetTime || "その時間"}な。待っとるから。` : "約束やで。俺んとこ戻ってきて。");
        return { offered, answer, reply, label: completed ? "達成" : "約束中" };
    }

    function renderPromises() {
        if (!el.history) return;
        el.history.replaceChildren();
        const records = window.SendaPromise?.getHistory?.() || [];
        if (!records.length) {
            const empty = document.createElement("p");
            empty.className = "dime-empty";
            empty.textContent = "まだ約束の履歴はないで。";
            el.history.appendChild(empty);
            return;
        }

        records.forEach(record => {
            const copy = promiseCopy(record);
            const group = document.createElement("article");
            group.className = "dime-promise-day";

            const head = document.createElement("header");
            const date = document.createElement("strong");
            date.textContent = promiseDate(record.date);
            const status = document.createElement("span");
            status.textContent = copy.label;
            head.append(date, status);
            group.appendChild(head);

            [[copy.offered, "harry"], [copy.answer, "user"], [copy.reply, "harry"]].forEach(([text, side]) => {
                const bubble = document.createElement("p");
                bubble.className = `dime-history-bubble ${side}`;
                bubble.textContent = text;
                group.appendChild(bubble);
            });
            el.history.appendChild(group);
        });
    }

    function selectTab(name) {
        const messages = name === "messages";
        el.messagesPanel.hidden = !messages;
        el.promisesPanel.hidden = messages;
        el.tabs.forEach(tab => tab.setAttribute("aria-selected", String(tab.dataset.dimeTab === name)));
        if (messages) renderMessages(); else renderPromises();
    }

    function openDime() {
        if (!el.overlay) return;
        if (typeof el.overlay.showModal === "function") {
            if (!el.overlay.open) el.overlay.showModal();
        } else {
            el.overlay.hidden = false;
            el.overlay.classList.add("is-fallback-open");
        }
        document.body.classList.add("dime-open");
        selectTab("messages");
    }

    function closeDime() {
        if (!el.overlay) return;
        if (typeof el.overlay.close === "function" && el.overlay.open) {
            el.overlay.close();
        } else {
            el.overlay.hidden = true;
            el.overlay.classList.remove("is-fallback-open");
        }
        document.body.classList.remove("dime-open");
        cancelEdit();
    }

    function isDimeOpen() {
        return Boolean(el.overlay?.open || el.overlay?.classList.contains("is-fallback-open"));
    }

    function resumePending() {
        state.messages
            .filter(message => message.side === "user" && !message.readAt)
            .forEach(message => {
                message.readAt = new Date().toISOString();
                if (!state.messages.some(item => item.replyTo === message.id)) {
                    state.messages.push({ id: id("harry"), side: "harry", text: replies[Math.floor(Math.random() * replies.length)], sentAt: new Date().toISOString(), replyTo: message.id });
                }
            });
        saveState();
    }

    el.launch?.addEventListener("click", function () {
        el.launch.classList.remove("is-ringing");
        void el.launch.offsetWidth;
        el.launch.classList.add("is-ringing");
        window.setTimeout(openDime, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 330);
    });
    el.close?.addEventListener("click", closeDime);
    el.overlay?.addEventListener("click", event => { if (event.target === el.overlay) closeDime(); });
    el.overlay?.addEventListener("cancel", event => {
        event.preventDefault();
        closeDime();
    });
    el.tabs.forEach(tab => tab.addEventListener("click", () => selectTab(tab.dataset.dimeTab)));
    el.form?.addEventListener("submit", event => {
        event.preventDefault();
        const text = el.input?.value.trim();
        if (!text) return;
        if (editingId) {
            updateMessage(text);
            el.input.focus();
            return;
        }
        el.input.value = "";
        sendMessage(text);
        el.input.focus();
    });
    document.addEventListener("senda-promise-updated", () => {
        if (!el.promisesPanel?.hidden) renderPromises();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && isDimeOpen()) closeDime();
    });

    resumePending();
    window.SendaDime = { open: openDime, close: closeDime };
})();
