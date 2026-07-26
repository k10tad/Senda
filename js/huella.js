//========================
// Huella photo journal
// IndexedDB-backed album for Senda
//========================

(function () {
    "use strict";

    const DB_NAME = "senda-huella-db";
    const DB_VERSION = 1;
    const STORE_NAME = "memories";

    const openButton = document.getElementById("openHuella");
    const closeButton = document.getElementById("closeHuella");
    const overlay = document.getElementById("huellaOverlay");
    const fileInput = document.getElementById("huellaFileInput");
    const addButton = document.getElementById("huellaAddButton");
    const grid = document.getElementById("huellaGrid");
    const emptyState = document.getElementById("huellaEmpty");
    const countLabel = document.getElementById("huellaCount");
    const viewer = document.getElementById("huellaViewer");
    const viewerImage = document.getElementById("huellaViewerImage");
    const viewerNote = document.getElementById("huellaViewerNote");
    const viewerDate = document.getElementById("huellaViewerDate");
    const viewerSave = document.getElementById("huellaViewerSave");
    const viewerDelete = document.getElementById("huellaViewerDelete");
    const viewerClose = document.getElementById("huellaViewerClose");

    let dbPromise = null;
    let currentMemory = null;
    const activeUrls = new Set();

    function openDatabase() {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise(function (resolve, reject) {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                    store.createIndex("createdAt", "createdAt");
                }
            };

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error || new Error("Huellaの保存領域を開けませんでした。"));
            };
        });

        return dbPromise;
    }

    async function runTransaction(mode, callback) {
        const db = await openDatabase();
        return new Promise(function (resolve, reject) {
            const transaction = db.transaction(STORE_NAME, mode);
            const store = transaction.objectStore(STORE_NAME);
            let result;

            try {
                result = callback(store);
            } catch (error) {
                reject(error);
                return;
            }

            transaction.oncomplete = function () { resolve(result); };
            transaction.onerror = function () { reject(transaction.error); };
            transaction.onabort = function () { reject(transaction.error || new Error("Huellaの保存処理が中断されました。")); };
        });
    }

    async function getAllMemories() {
        const db = await openDatabase();
        return new Promise(function (resolve, reject) {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const request = transaction.objectStore(STORE_NAME).getAll();
            request.onsuccess = function () {
                const memories = Array.isArray(request.result) ? request.result : [];
                memories.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
                resolve(memories);
            };
            request.onerror = function () { reject(request.error); };
        });
    }

    async function putMemory(memory) {
        await runTransaction("readwrite", store => store.put(memory));
    }

    async function deleteMemory(id) {
        await runTransaction("readwrite", store => store.delete(id));
    }

    async function clearMemories() {
        await runTransaction("readwrite", store => store.clear());
    }

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `huella-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function revokeActiveUrls() {
        activeUrls.forEach(url => URL.revokeObjectURL(url));
        activeUrls.clear();
    }

    function makeObjectUrl(blob) {
        const url = URL.createObjectURL(blob);
        activeUrls.add(url);
        return url;
    }

    function formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "日付なし";
        return date.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    function toDateInput(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function dateInputToTimestamp(value, fallback) {
        if (!value) return fallback;
        const [year, month, day] = value.split("-").map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0, 0);
        return Number.isNaN(date.getTime()) ? fallback : date.getTime();
    }

    async function renderHuella() {
        if (!grid) return;
        revokeActiveUrls();

        let memories = [];
        try {
            memories = await getAllMemories();
        } catch (error) {
            console.error(error);
            grid.innerHTML = '<p class="huella-error">Huellaを読み込めませんでした。</p>';
            return;
        }

        grid.replaceChildren();
        if (countLabel) countLabel.textContent = `${memories.length}枚`;
        if (emptyState) emptyState.hidden = memories.length !== 0;

        memories.forEach(function (memory) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "huella-photo";
            button.setAttribute("aria-label", `${formatDate(memory.createdAt)}の写真を開く`);

            const image = document.createElement("img");
            image.src = makeObjectUrl(memory.imageBlob);
            image.alt = memory.note ? memory.note : "Huellaの写真";
            image.loading = "lazy";

            const date = document.createElement("span");
            date.textContent = new Date(memory.createdAt).toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric"
            });

            button.append(image, date);
            button.addEventListener("click", () => openViewer(memory));
            grid.appendChild(button);
        });
    }

    function openOverlay() {
        if (!overlay) return;
        overlay.hidden = false;
        document.body.classList.add("huella-open");
        renderHuella();
    }

    function closeOverlay() {
        if (!overlay) return;
        closeViewer();
        overlay.hidden = true;
        document.body.classList.remove("huella-open");
    }

    function openViewer(memory) {
        if (!viewer || !viewerImage) return;
        currentMemory = memory;
        viewerImage.src = makeObjectUrl(memory.imageBlob);
        viewerImage.alt = memory.note || "Huellaの写真";
        if (viewerNote) viewerNote.value = memory.note || "";
        if (viewerDate) viewerDate.value = toDateInput(memory.createdAt);
        viewer.hidden = false;
    }

    function closeViewer() {
        if (!viewer) return;
        viewer.hidden = true;
        if (viewerImage) viewerImage.removeAttribute("src");
        currentMemory = null;
    }

    async function addFiles(files) {
        const selected = Array.from(files || []).filter(file => file.type.startsWith("image/"));
        if (!selected.length) return;

        if (addButton) {
            addButton.disabled = true;
            addButton.textContent = "保存中…";
        }

        try {
            for (const file of selected) {
                await putMemory({
                    id: makeId(),
                    imageBlob: file,
                    fileName: file.name || "huella-image",
                    mimeType: file.type || "application/octet-stream",
                    createdAt: Date.now(),
                    addedAt: Date.now(),
                    note: ""
                });
            }
            await renderHuella();
        } catch (error) {
            console.error(error);
            alert("写真を保存できませんでした。端末の空き容量を確認してください。");
        } finally {
            if (addButton) {
                addButton.disabled = false;
                addButton.textContent = "写真を追加";
            }
            if (fileInput) fileInput.value = "";
        }
    }

    async function saveViewerChanges() {
        if (!currentMemory) return;
        const updated = {
            ...currentMemory,
            note: String(viewerNote?.value || "").trim(),
            createdAt: dateInputToTimestamp(viewerDate?.value, currentMemory.createdAt),
            updatedAt: Date.now()
        };
        await putMemory(updated);
        currentMemory = updated;
        await renderHuella();
        closeViewer();
    }

    async function removeCurrentMemory() {
        if (!currentMemory) return;
        if (!confirm("この写真をHuellaから削除しますか？")) return;
        await deleteMemory(currentMemory.id);
        closeViewer();
        await renderHuella();
    }

    async function exportMemories() {
        return getAllMemories();
    }

    async function importMemories(memories, options = {}) {
        if (options.replace !== false) await clearMemories();
        for (const memory of memories || []) {
            if (!memory || !memory.id || !(memory.imageBlob instanceof Blob)) continue;
            await putMemory(memory);
        }
        await renderHuella();
    }

    openButton?.addEventListener("click", openOverlay);
    closeButton?.addEventListener("click", closeOverlay);
    addButton?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", event => addFiles(event.target.files));
    viewerClose?.addEventListener("click", closeViewer);
    viewerSave?.addEventListener("click", saveViewerChanges);
    viewerDelete?.addEventListener("click", removeCurrentMemory);

    overlay?.addEventListener("click", function (event) {
        if (event.target === overlay) closeOverlay();
    });
    viewer?.addEventListener("click", function (event) {
        if (event.target === viewer) closeViewer();
    });
    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        if (viewer && !viewer.hidden) closeViewer();
        else if (overlay && !overlay.hidden) closeOverlay();
    });

    window.SendaHuella = {
        DB_NAME,
        STORE_NAME,
        getAllMemories: exportMemories,
        importMemories,
        clearMemories,
        render: renderHuella
    };
})();
