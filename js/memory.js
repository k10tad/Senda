//========================
// ハリーの記憶
//========================

const memoryInput = document.getElementById("memoryInput");
const addMemoryButton = document.getElementById("addMemory");
const memoryList = document.getElementById("memoryList");

let harryMemories =
    JSON.parse(localStorage.getItem("senda_harryMemories")) || [];

function saveMemories() {
    localStorage.setItem(
        "senda_harryMemories",
        JSON.stringify(harryMemories)
    );
}

function renderMemories() {
    if (!memoryList) return;

    memoryList.innerHTML = "";

    harryMemories.forEach((memory, index) => {
        const li = document.createElement("li");

        const span = document.createElement("span");
        span.textContent = memory;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "削除";
        deleteButton.className = "delete-memory";

        deleteButton.addEventListener("click", function () {
            harryMemories.splice(index, 1);
            saveMemories();
            renderMemories();
        });

        li.appendChild(span);
        li.appendChild(deleteButton);
        memoryList.appendChild(li);
    });
}

function addMemory() {
    const text = memoryInput.value.trim();

    if (text === "") return;

    harryMemories.push(text);
    saveMemories();
    renderMemories();

    memoryInput.value = "";

    if (message) {
        message.textContent = "覚えた。忘れはしない。";
    }
}

function getMemoryMessage() {
    if (harryMemories.length === 0) {
        return null;
    }

    const memory =
        harryMemories[Math.floor(Math.random() * harryMemories.length)];

    return "そういえば、" + memory + "。覚えている。";
}

if (addMemoryButton) {
    addMemoryButton.addEventListener("click", addMemory);
}

if (memoryInput) {
    memoryInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            addMemory();
        }
    });
}

renderMemories();
