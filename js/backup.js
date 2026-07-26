//========================
// Senda backup / restore
// ZIP: localStorage + Huella images
//========================

(function () {
    "use strict";

    const backupButton = document.getElementById("exportSendaBackup");
    const restoreButton = document.getElementById("restoreSendaBackup");
    const restoreInput = document.getElementById("sendaBackupFile");
    const status = document.getElementById("backupStatus");

    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    function setStatus(message, kind = "") {
        if (!status) return;
        status.textContent = message;
        status.dataset.kind = kind;
    }

    function collectSendaLocalStorage() {
        const values = {};
        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);
            if (key && key.toLowerCase().startsWith("senda")) {
                values[key] = localStorage.getItem(key);
            }
        }
        return values;
    }

    function crc32(bytes) {
        let crc = -1;
        for (let i = 0; i < bytes.length; i += 1) {
            crc ^= bytes[i];
            for (let j = 0; j < 8; j += 1) {
                crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
            }
        }
        return (crc ^ -1) >>> 0;
    }

    function dosDateTime(date = new Date()) {
        const year = Math.max(1980, date.getFullYear());
        return {
            time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
            date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
        };
    }

    function concatArrays(parts) {
        const total = parts.reduce((sum, part) => sum + part.length, 0);
        const result = new Uint8Array(total);
        let offset = 0;
        parts.forEach(function (part) {
            result.set(part, offset);
            offset += part.length;
        });
        return result;
    }

    function u16(value) {
        return new Uint8Array([value & 255, (value >>> 8) & 255]);
    }

    function u32(value) {
        return new Uint8Array([
            value & 255,
            (value >>> 8) & 255,
            (value >>> 16) & 255,
            (value >>> 24) & 255
        ]);
    }

    function createZip(files) {
        const localParts = [];
        const centralParts = [];
        let offset = 0;
        const stamp = dosDateTime();

        files.forEach(function (file) {
            const name = textEncoder.encode(file.name);
            const data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
            const crc = crc32(data);

            const localHeader = concatArrays([
                u32(0x04034b50), u16(20), u16(0x0800), u16(0),
                u16(stamp.time), u16(stamp.date), u32(crc),
                u32(data.length), u32(data.length), u16(name.length), u16(0), name
            ]);
            localParts.push(localHeader, data);

            const centralHeader = concatArrays([
                u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0),
                u16(stamp.time), u16(stamp.date), u32(crc),
                u32(data.length), u32(data.length), u16(name.length), u16(0),
                u16(0), u16(0), u16(0), u32(0), u32(offset), name
            ]);
            centralParts.push(centralHeader);
            offset += localHeader.length + data.length;
        });

        const central = concatArrays(centralParts);
        const end = concatArrays([
            u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
            u32(central.length), u32(offset), u16(0)
        ]);
        return concatArrays([...localParts, central, end]);
    }

    function readU16(view, offset) {
        return view.getUint16(offset, true);
    }

    function readU32(view, offset) {
        return view.getUint32(offset, true);
    }

    function parseZip(bytes) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const files = new Map();
        let offset = 0;

        while (offset + 4 <= bytes.length && readU32(view, offset) === 0x04034b50) {
            const method = readU16(view, offset + 8);
            const compressedSize = readU32(view, offset + 18);
            const nameLength = readU16(view, offset + 26);
            const extraLength = readU16(view, offset + 28);
            if (method !== 0) throw new Error("このバックアップの圧縮方式には対応していません。");

            const nameStart = offset + 30;
            const dataStart = nameStart + nameLength + extraLength;
            const dataEnd = dataStart + compressedSize;
            if (dataEnd > bytes.length) throw new Error("バックアップファイルが壊れています。");

            const name = textDecoder.decode(bytes.slice(nameStart, nameStart + nameLength));
            files.set(name, bytes.slice(dataStart, dataEnd));
            offset = dataEnd;
        }

        if (!files.size) throw new Error("Sendaのバックアップとして読み込めませんでした。");
        return files;
    }

    function safeFileName(name) {
        return String(name || "image").replace(/[^a-zA-Z0-9._-]/g, "_");
    }

    async function exportBackup() {
        if (!window.SendaHuella) {
            setStatus("Huellaの準備が整っていません。", "error");
            return;
        }

        backupButton.disabled = true;
        setStatus("バックアップを作成中…");

        try {
            const memories = await window.SendaHuella.getAllMemories();
            const files = [];
            const huellaIndex = [];

            for (let index = 0; index < memories.length; index += 1) {
                const memory = memories[index];
                const extension = safeFileName(memory.fileName || "image").split(".").pop();
                const fileName = `huella/images/${String(index + 1).padStart(4, "0")}-${memory.id}.${extension || "bin"}`;
                const bytes = new Uint8Array(await memory.imageBlob.arrayBuffer());
                files.push({ name: fileName, data: bytes });
                huellaIndex.push({
                    id: memory.id,
                    fileName,
                    originalName: memory.fileName || "",
                    mimeType: memory.mimeType || memory.imageBlob.type || "application/octet-stream",
                    createdAt: memory.createdAt,
                    addedAt: memory.addedAt,
                    updatedAt: memory.updatedAt || null,
                    note: memory.note || ""
                });
            }

            const manifest = {
                format: "senda-backup",
                version: 1,
                app: "Senda",
                createdAt: new Date().toISOString(),
                huellaCount: huellaIndex.length
            };

            files.unshift(
                { name: "manifest.json", data: textEncoder.encode(JSON.stringify(manifest, null, 2)) },
                { name: "local-storage.json", data: textEncoder.encode(JSON.stringify(collectSendaLocalStorage(), null, 2)) },
                { name: "huella/index.json", data: textEncoder.encode(JSON.stringify(huellaIndex, null, 2)) }
            );

            const zip = createZip(files);
            const blob = new Blob([zip], { type: "application/zip" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            const date = new Date().toISOString().slice(0, 10);
            anchor.href = url;
            anchor.download = `senda-backup-${date}.zip`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setStatus(`バックアップ完了。Huella ${huellaIndex.length}枚を保存しました。`, "success");
        } catch (error) {
            console.error(error);
            setStatus("バックアップを作成できませんでした。", "error");
        } finally {
            backupButton.disabled = false;
        }
    }

    async function restoreBackup(file) {
        if (!file) return;
        if (!confirm("現在のSendaデータをバックアップ内容で置き換えます。続けますか？")) {
            restoreInput.value = "";
            return;
        }

        restoreButton.disabled = true;
        setStatus("バックアップを確認中…");

        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const files = parseZip(bytes);
            const manifestBytes = files.get("manifest.json");
            const localBytes = files.get("local-storage.json");
            const indexBytes = files.get("huella/index.json");
            if (!manifestBytes || !localBytes || !indexBytes) throw new Error("必要なファイルがありません。");

            const manifest = JSON.parse(textDecoder.decode(manifestBytes));
            if (manifest.format !== "senda-backup") throw new Error("Sendaのバックアップではありません。");

            const localValues = JSON.parse(textDecoder.decode(localBytes));
            const huellaIndex = JSON.parse(textDecoder.decode(indexBytes));
            const restoredMemories = [];

            for (const entry of huellaIndex) {
                const imageBytes = files.get(entry.fileName);
                if (!imageBytes) throw new Error(`Huella画像が見つかりません: ${entry.fileName}`);
                restoredMemories.push({
                    id: entry.id,
                    imageBlob: new Blob([imageBytes], { type: entry.mimeType || "application/octet-stream" }),
                    fileName: entry.originalName || entry.fileName.split("/").pop(),
                    mimeType: entry.mimeType || "application/octet-stream",
                    createdAt: Number(entry.createdAt) || Date.now(),
                    addedAt: Number(entry.addedAt) || Date.now(),
                    updatedAt: entry.updatedAt ? Number(entry.updatedAt) : null,
                    note: entry.note || ""
                });
            }

            Object.keys(localStorage)
                .filter(key => key.toLowerCase().startsWith("senda"))
                .forEach(key => localStorage.removeItem(key));
            Object.entries(localValues).forEach(([key, value]) => {
                if (key.toLowerCase().startsWith("senda")) localStorage.setItem(key, value);
            });

            await window.SendaHuella.importMemories(restoredMemories, { replace: true });
            setStatus(`復元完了。Huella ${restoredMemories.length}枚を戻しました。再読み込みします。`, "success");
            setTimeout(() => window.location.reload(), 900);
        } catch (error) {
            console.error(error);
            setStatus(`復元できませんでした。${error.message || "ファイルを確認してください。"}`, "error");
        } finally {
            restoreButton.disabled = false;
            restoreInput.value = "";
        }
    }

    backupButton?.addEventListener("click", exportBackup);
    restoreButton?.addEventListener("click", () => restoreInput?.click());
    restoreInput?.addEventListener("change", event => restoreBackup(event.target.files?.[0]));
})();
