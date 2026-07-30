//========================
// Huella journal
// Photos, diary entries and plans stored in IndexedDB
//========================

(function () {
    "use strict";

    const DB_NAME = "senda-huella-db";
    const DB_VERSION = 2;
    const STORE_NAME = "memories";

    const $ = id => document.getElementById(id);
    const elements = {
        open: $("openHuella"), close: $("closeHuella"), overlay: $("huellaOverlay"),
        albumTab: $("huellaAlbumTab"), calendarTab: $("huellaCalendarTab"),
        albumPanel: $("huellaAlbumPanel"), calendarPanel: $("huellaCalendarPanel"),
        fileInput: $("huellaFileInput"), addPhoto: $("huellaAddButton"), grid: $("huellaGrid"),
        empty: $("huellaEmpty"), count: $("huellaCount"),
        viewer: $("huellaViewer"), viewerImage: $("huellaViewerImage"), viewerNote: $("huellaViewerNote"),
        viewerDate: $("huellaViewerDate"), viewerSave: $("huellaViewerSave"),
        viewerDelete: $("huellaViewerDelete"), viewerClose: $("huellaViewerClose"),
        harryComment: $("huellaHarryComment"),
        prevMonth: $("huellaPrevMonth"), nextMonth: $("huellaNextMonth"),
        calendarTitle: $("huellaCalendarTitle"), calendarGrid: $("huellaCalendarGrid"),
        selectedDateTitle: $("huellaSelectedDateTitle"), dayEntries: $("huellaDayEntries"),
        dayEmpty: $("huellaDayEmpty"), addDiary: $("huellaAddDiary"), addPlan: $("huellaAddPlan"),
        editor: $("huellaEntryEditor"), form: $("huellaEntryForm"), editorClose: $("huellaEntryClose"),
        editorTitle: $("huellaEntryEditorTitle"), editorKicker: $("huellaEntryKicker"),
        entryId: $("huellaEntryId"), entryType: $("huellaEntryType"), entryDate: $("huellaEntryDate"),
        entryTitle: $("huellaEntryTitle"), entryTime: $("huellaEntryTime"), timeField: $("huellaEntryTimeField"),
        entryBody: $("huellaEntryBody"), bodyLabel: $("huellaEntryBodyLabel"), entryDelete: $("huellaEntryDelete")
    };
    const sideRail = document.querySelector(".senda-side-rail");

    // Keep every viewport-fixed layer outside transformed app containers.
    // Mobile Safari otherwise positions nested dialogs against the full document.
    [elements.overlay, elements.viewer, elements.editor].forEach(layer => {
        if (layer && layer.parentElement !== document.body) {
            document.body.appendChild(layer);
        }
    });

    let dbPromise;
    let currentPhoto = null;
    let selectedDate = startOfDay(new Date());
    let calendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    let lastPhotoCommentIndex = -1;
    const activeUrls = new Set();
    const PHOTO_COMMENTS = [
        "これ、覚えとる。……残しといて正解やったな。",
        "ええ一枚や。お前が残した理由、なんとなく分かるで。",
        "こんなん撮っとったんか。油断ならんな。",
        "写真は正直やな。忘れたふりしても、ちゃんと残っとる。",
        "この日の空気まで戻ってくる気がするな。",
        "消すなよ。俺が覚えときたい。",
        "また一つ増えたな。……悪くない。",
        "お前の目にこう映っとったんやな。",
        "これ、俺は好きやで。理由は聞くな。",
        "たまにはこうして、立ち止まって見るんもええな。"
    ];

    function updateSideRailPosition() {
        if (!sideRail) return;
        const viewport = window.visualViewport;
        const viewportHeight = viewport?.height || window.innerHeight;
        const viewportOffsetTop = viewport?.offsetTop || 0;
        const compact = window.matchMedia("(max-width: 430px)").matches;
        const preferredOffset = viewportHeight * (compact ? 0.18 : 0.21);
        const minimumOffset = compact ? 108 : 118;
        const maximumOffset = compact ? 156 : 184;
        const top = viewportOffsetTop + Math.min(maximumOffset, Math.max(minimumOffset, preferredOffset));
        sideRail.style.setProperty("--senda-side-rail-top", `${Math.round(top)}px`);
    }

    updateSideRailPosition();
    window.addEventListener("resize", updateSideRailPosition, { passive: true });
    window.addEventListener("orientationchange", updateSideRailPosition, { passive: true });
    window.visualViewport?.addEventListener("resize", updateSideRailPosition, { passive: true });
    window.visualViewport?.addEventListener("scroll", updateSideRailPosition, { passive: true });

    function openDatabase() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                const db = request.result;
                let store;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                } else {
                    store = request.transaction.objectStore(STORE_NAME);
                }
                if (!store.indexNames.contains("createdAt")) store.createIndex("createdAt", "createdAt");
                if (!store.indexNames.contains("entryType")) store.createIndex("entryType", "entryType");
                if (!store.indexNames.contains("dateKey")) store.createIndex("dateKey", "dateKey");
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Huellaの保存領域を開けませんでした。"));
        });
        return dbPromise;
    }

    async function withStore(mode, action) {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, mode);
            const store = tx.objectStore(STORE_NAME);
            let result;
            try { result = action(store); } catch (error) { reject(error); return; }
            tx.oncomplete = () => resolve(result);
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error || new Error("Huellaの保存処理が中断されました。"));
        });
    }

    async function getAllEntries() {
        const db = await openDatabase();
        return new Promise((resolve, reject) => {
            const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
            request.onsuccess = () => resolve((request.result || []).map(normalizeEntry));
            request.onerror = () => reject(request.error);
        });
    }

    function normalizeEntry(entry) {
        const normalized = { ...entry };
        normalized.entryType = normalized.entryType || (normalized.imageBlob ? "memory" : "diary");
        normalized.createdAt = Number(normalized.createdAt) || Date.now();
        normalized.dateKey = normalized.dateKey || dateKeyFromTimestamp(normalized.createdAt);
        normalized.title = normalized.title || "";
        normalized.note = normalized.note || "";
        normalized.body = normalized.body || "";
        normalized.time = normalized.time || "";
        return normalized;
    }

    const putEntry = entry => withStore("readwrite", store => store.put(normalizeEntry(entry)));
    const deleteEntry = id => withStore("readwrite", store => store.delete(id));
    const clearEntries = () => withStore("readwrite", store => store.clear());

    function makeId() {
        return crypto?.randomUUID?.() || `huella-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12); }
    function dateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    function dateKeyFromTimestamp(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? dateKey(new Date()) : dateKey(d); }
    function dateFromKey(value) {
        const [y, m, d] = String(value).split("-").map(Number);
        return new Date(y, m - 1, d, 12);
    }
    function timestampFromKey(value, fallback = Date.now()) { const d = dateFromKey(value); return Number.isNaN(d.getTime()) ? fallback : d.getTime(); }
    function formatFullDate(value) {
        const d = value instanceof Date ? value : new Date(value);
        return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
    }
    function revokeUrls() { activeUrls.forEach(URL.revokeObjectURL); activeUrls.clear(); }
    function objectUrl(blob) { const url = URL.createObjectURL(blob); activeUrls.add(url); return url; }

    async function renderAlbum() {
        if (!elements.grid) return;
        revokeUrls();
        const entries = await getAllEntries();
        const photos = entries.filter(entry => entry.entryType === "memory" && entry.imageBlob instanceof Blob)
            .sort((a, b) => b.createdAt - a.createdAt);
        elements.grid.replaceChildren();
        elements.count.textContent = `${photos.length}枚`;
        elements.empty.hidden = photos.length > 0;
        photos.forEach(photo => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "huella-photo";
            button.setAttribute("aria-label", `${formatFullDate(photo.createdAt)}の写真を開く`);
            const image = document.createElement("img");
            image.src = objectUrl(photo.imageBlob);
            image.alt = photo.note || "Huellaの写真";
            image.loading = "lazy";
            const label = document.createElement("span");
            label.textContent = new Date(photo.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
            button.append(image, label);
            button.addEventListener("click", () => openPhoto(photo));
            elements.grid.appendChild(button);
        });
    }

    async function renderCalendar() {
        const entries = await getAllEntries();
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        elements.calendarTitle.textContent = `${year}年 ${month + 1}月`;
        elements.calendarGrid.replaceChildren();
        const firstWeekday = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstWeekday; i += 1) {
            const blank = document.createElement("span"); blank.className = "huella-calendar-blank"; elements.calendarGrid.appendChild(blank);
        }
        for (let day = 1; day <= lastDay; day += 1) {
            const current = new Date(year, month, day, 12);
            const key = dateKey(current);
            const dayEntries = entries.filter(entry => entry.dateKey === key);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "huella-calendar-day";
            if (key === dateKey(selectedDate)) button.classList.add("selected");
            if (key === dateKey(new Date())) button.classList.add("today");
            button.innerHTML = `<span>${day}</span><small></small>`;
            const marks = button.querySelector("small");
            if (dayEntries.some(e => e.entryType === "memory")) marks.classList.add("has-photo");
            if (dayEntries.some(e => e.entryType === "diary")) marks.classList.add("has-diary");
            if (dayEntries.some(e => e.entryType === "plan")) marks.classList.add("has-plan");
            button.addEventListener("click", () => { selectedDate = current; renderCalendar(); renderDay(); });
            elements.calendarGrid.appendChild(button);
        }
        await renderDay(entries);
    }

    async function renderDay(allEntries) {
        const entries = allEntries || await getAllEntries();
        const key = dateKey(selectedDate);
        const dayItems = entries.filter(entry => entry.dateKey === key)
            .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99") || a.createdAt - b.createdAt);
        elements.selectedDateTitle.textContent = formatFullDate(selectedDate);
        elements.dayEntries.replaceChildren();
        elements.dayEmpty.hidden = dayItems.length > 0;
        dayItems.forEach(entry => {
            const card = document.createElement("article");
            card.className = `huella-day-entry huella-entry-${entry.entryType}`;
            const tag = entry.entryType === "memory" ? "写真" : entry.entryType === "plan" ? "予定" : "日記";
            const heading = entry.title || (entry.entryType === "memory" ? entry.note || "写真" : entry.entryType === "plan" ? "予定" : "日記");
            const header = document.createElement("button");
            header.type = "button";
            header.className = "huella-day-entry-button";
            header.innerHTML = `<span class="huella-entry-tag">${tag}</span><strong>${escapeHtml(heading)}</strong>${entry.time ? `<time>${escapeHtml(entry.time)}</time>` : ""}`;
            if (entry.entryType === "memory") header.addEventListener("click", () => openPhoto(entry));
            else header.addEventListener("click", () => openEditor(entry.entryType, entry));
            card.appendChild(header);
            if (entry.entryType !== "memory" && entry.body) {
                const body = document.createElement("p"); body.textContent = entry.body; card.appendChild(body);
            }
            elements.dayEntries.appendChild(card);
        });
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
    }

    function switchMode(mode) {
        const album = mode === "album";
        elements.albumPanel.hidden = !album;
        elements.calendarPanel.hidden = album;
        elements.albumTab.classList.toggle("active", album);
        elements.calendarTab.classList.toggle("active", !album);
        elements.albumTab.setAttribute("aria-selected", String(album));
        elements.calendarTab.setAttribute("aria-selected", String(!album));
        album ? renderAlbum() : renderCalendar();
    }

    function openOverlay() {
        elements.overlay.hidden = false;
        document.body.classList.add("huella-open");
        switchMode("album");

        const journal = elements.overlay.querySelector(".huella-journal");
        elements.overlay.scrollTop = 0;
        if (journal) journal.scrollTop = 0;

        requestAnimationFrame(() => {
            elements.overlay.scrollTop = 0;
            if (journal) journal.scrollTop = 0;
        });
    }
    function closeOverlay() { closePhoto(); closeEditor(); elements.overlay.hidden = true; document.body.classList.remove("huella-open"); }

    function nextPhotoComment() {
        if (PHOTO_COMMENTS.length < 2) return PHOTO_COMMENTS[0] || "";
        let index;
        do { index = Math.floor(Math.random() * PHOTO_COMMENTS.length); } while (index === lastPhotoCommentIndex);
        lastPhotoCommentIndex = index;
        return PHOTO_COMMENTS[index];
    }

    function openPhoto(photo) {
        currentPhoto = photo;
        elements.viewerImage.src = objectUrl(photo.imageBlob);
        elements.viewerImage.alt = photo.note || "Huellaの写真";
        elements.viewerNote.value = photo.note || "";
        elements.viewerDate.value = photo.dateKey || dateKeyFromTimestamp(photo.createdAt);
        if (elements.harryComment) elements.harryComment.textContent = nextPhotoComment();
        elements.viewer.scrollTop = 0;
        const viewerCard = elements.viewer.querySelector(".huella-viewer-card");
        if (viewerCard) viewerCard.scrollTop = 0;
        elements.viewer.hidden = false;
        requestAnimationFrame(() => {
            elements.viewer.scrollTop = 0;
            if (viewerCard) viewerCard.scrollTop = 0;
        });
    }
    function closePhoto() {
        elements.viewer.hidden = true;
        elements.viewerImage.removeAttribute("src");
        if (elements.harryComment) elements.harryComment.textContent = "";
        currentPhoto = null;
    }

    async function addFiles(files) {
        const selected = Array.from(files || []).filter(file => file.type.startsWith("image/"));
        if (!selected.length) return;
        elements.addPhoto.disabled = true; elements.addPhoto.textContent = "保存中…";
        try {
            for (const file of selected) {
                const now = Date.now();
                await putEntry({ id: makeId(), entryType: "memory", imageBlob: file, fileName: file.name || "huella-image", mimeType: file.type || "application/octet-stream", createdAt: now, dateKey: dateKeyFromTimestamp(now), addedAt: now, note: "", title: "", body: "", time: "" });
            }
            await renderAlbum();
        } catch (error) { console.error(error); alert("写真を保存できませんでした。端末の空き容量を確認してください。"); }
        finally { elements.addPhoto.disabled = false; elements.addPhoto.textContent = "写真を追加"; elements.fileInput.value = ""; }
    }

    async function savePhoto() {
        if (!currentPhoto) return;
        const key = elements.viewerDate.value || currentPhoto.dateKey;
        await putEntry({ ...currentPhoto, note: elements.viewerNote.value.trim(), dateKey: key, createdAt: timestampFromKey(key, currentPhoto.createdAt), updatedAt: Date.now() });
        closePhoto(); await renderAlbum(); await renderCalendar();
    }
    async function removePhoto() {
        if (!currentPhoto || !confirm("この写真をHuellaから削除しますか？")) return;
        await deleteEntry(currentPhoto.id); closePhoto(); await renderAlbum(); await renderCalendar();
    }

    function openEditor(type, entry = null) {
        const isPlan = type === "plan";
        elements.entryId.value = entry?.id || "";
        elements.entryType.value = type;
        elements.entryDate.value = entry?.dateKey || dateKey(selectedDate);
        elements.entryTitle.value = entry?.title || "";
        elements.entryTime.value = entry?.time || "";
        elements.entryBody.value = entry?.body || "";
        elements.timeField.hidden = !isPlan;
        elements.editorKicker.textContent = isPlan ? "PLAN" : "DIARY";
        elements.editorTitle.textContent = entry ? (isPlan ? "予定を編集" : "日記を編集") : (isPlan ? "予定を追加" : "日記を書く");
        elements.bodyLabel.textContent = isPlan ? "メモ" : "本文";
        elements.entryBody.placeholder = isPlan ? "必要なことをメモしておこう。" : "この日のことを残しておこう。";
        elements.entryDelete.hidden = !entry;
        elements.editor.hidden = false;
    }
    function closeEditor() { elements.editor.hidden = true; elements.form?.reset(); }

    async function saveTextEntry(event) {
        event.preventDefault();
        const id = elements.entryId.value || makeId();
        const oldEntries = await getAllEntries();
        const old = oldEntries.find(entry => entry.id === id);
        const now = Date.now();
        await putEntry({
            ...(old || {}), id, entryType: elements.entryType.value, dateKey: elements.entryDate.value,
            createdAt: old?.createdAt || now, updatedAt: now, title: elements.entryTitle.value.trim(),
            body: elements.entryBody.value.trim(), time: elements.entryType.value === "plan" ? elements.entryTime.value : ""
        });
        selectedDate = dateFromKey(elements.entryDate.value); calendarMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        closeEditor(); await renderCalendar();
    }
    async function removeTextEntry() {
        const id = elements.entryId.value;
        if (!id || !confirm("この記録をHuellaから削除しますか？")) return;
        await deleteEntry(id); closeEditor(); await renderCalendar();
    }

    async function importEntries(entries, options = {}) {
        if (options.replace !== false) await clearEntries();
        for (const entry of entries || []) if (entry?.id) await putEntry(entry);
        await renderAlbum();
    }

    async function addSystemDiary(entry = {}) {
        const now = Date.now();
        const key = entry.dateKey || dateKey(new Date());
        const id = entry.id || `senda-system-${key}-${now}`;
        await putEntry({
            id,
            entryType: "diary",
            dateKey: key,
            createdAt: Number(entry.createdAt) || now,
            updatedAt: now,
            title: String(entry.title || "ふたりの記録"),
            body: String(entry.body || ""),
            time: String(entry.time || "")
        });

        if (!elements.overlay.hidden && !elements.calendarPanel.hidden) {
            await renderCalendar();
        }
        return id;
    }

    elements.open?.addEventListener("click", openOverlay);
    elements.close?.addEventListener("click", closeOverlay);
    elements.albumTab?.addEventListener("click", () => switchMode("album"));
    elements.calendarTab?.addEventListener("click", () => switchMode("calendar"));
    elements.addPhoto?.addEventListener("click", () => elements.fileInput.click());
    elements.fileInput?.addEventListener("change", event => addFiles(event.target.files));
    elements.viewerClose?.addEventListener("click", closePhoto);
    elements.viewerSave?.addEventListener("click", savePhoto);
    elements.viewerDelete?.addEventListener("click", removePhoto);
    elements.prevMonth?.addEventListener("click", () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1); renderCalendar(); });
    elements.nextMonth?.addEventListener("click", () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1); renderCalendar(); });
    elements.addDiary?.addEventListener("click", () => openEditor("diary"));
    elements.addPlan?.addEventListener("click", () => openEditor("plan"));
    elements.editorClose?.addEventListener("click", closeEditor);
    elements.form?.addEventListener("submit", saveTextEntry);
    elements.entryDelete?.addEventListener("click", removeTextEntry);
    elements.overlay?.addEventListener("click", event => { if (event.target === elements.overlay) closeOverlay(); });
    elements.viewer?.addEventListener("click", event => { if (event.target === elements.viewer) closePhoto(); });
    elements.editor?.addEventListener("click", event => { if (event.target === elements.editor) closeEditor(); });
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        if (!elements.editor.hidden) closeEditor(); else if (!elements.viewer.hidden) closePhoto(); else if (!elements.overlay.hidden) closeOverlay();
    });

    window.SendaHuella = {
        DB_NAME, STORE_NAME,
        getAllEntries,
        getAllMemories: getAllEntries,
        importEntries,
        importMemories: importEntries,
        addSystemDiary,
        clearEntries,
        clearMemories: clearEntries,
        render: renderAlbum
    };
})();
