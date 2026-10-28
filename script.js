
"use strict";

/* =================================
   1. MENGAMBIL ELEMEN HTML
================================= */

const menuBtn = document.getElementById("menuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const sidebar = document.getElementById("sidebar");

const homeBtn = document.getElementById("homeBtn");
const homeMenuBtn = document.getElementById("homeMenuBtn");
const newChatBtn = document.getElementById("newChatBtn");

const searchBtn = document.getElementById("searchBtn");
const renameChatBtn = document.getElementById("renameChatBtn");
const themeSelect = document.getElementById("themeSelect");

const bubbleBtn = document.getElementById("bubbleBtn");
const bubbleMenuBtn = document.getElementById("bubbleMenuBtn");
const floatingBubble = document.getElementById("floatingBubble");

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const welcomeScreen = document.getElementById("welcomeScreen");

const historyList = document.getElementById("historyList");
const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");

const historySearchBox = document.getElementById("historySearchBox");
const historySearchInput = document.getElementById("historySearchInput");
const closeHistorySearch = document.getElementById("closeHistorySearch");


/* =================================
   2. DATA OBROLAN
================================= */

let conversations = [];
let activeChatId = null;

function createChat() {
    const chat = {
        id: Date.now().toString() +
            Math.random().toString(36).slice(2, 7),
        title: "Obrolan baru",
        messages: [],
        updatedAt: Date.now()
    };

    conversations.unshift(chat);
    activeChatId = chat.id;

    renderHistory();
    renderMessages();

    return chat;
}

function getActiveChat() {
    return conversations.find(
        chat => chat.id === activeChatId
    );
}

/* =================================
   3. MENU SAMPING
================================= */

const menuOverlay = document.getElementById("menuOverlay");

function openMenu() {
    sidebar.hidden = false;
    menuOverlay.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
    sidebar.hidden = true;
    menuOverlay.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
}

menuOverlay.addEventListener("click", closeMenu);
menuBtn.addEventListener("click", openMenu);
closeMenuBtn.addEventListener("click", closeMenu);

homeBtn.addEventListener("click", () => {
    closeMenu();
    messageInput.focus();
});

homeMenuBtn.addEventListener("click", () => {
    closeMenu();
    messageInput.focus();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeMenu();
    }
});

/* =================================
   4. TEMA TERANG, GELAP, OTOMATIS
================================= */

const systemTheme = window.matchMedia(
    "(prefers-color-scheme: dark)"
);

function applyTheme(theme) {
    const actualTheme =
        theme === "system"
            ? (systemTheme.matches ? "dark" : "light")
            : theme;

    document.body.dataset.theme = actualTheme;

    const themeColor = actualTheme === "dark"
        ? "#0d111b"
        : "#f5f7fb";

    const themeMeta = document.querySelector(
    'meta[name="theme-color"]'
);

if (themeMeta) {
    themeMeta.setAttribute("content", themeColor);
}

function loadTheme() {
    const savedTheme =
        localStorage.getItem("faizAITheme") || "system";

    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
}

themeSelect.addEventListener("change", () => {
    const theme = themeSelect.value;

    localStorage.setItem("faizAITheme", theme);
    applyTheme(theme);
});

systemTheme.addEventListener("change", () => {
    if (themeSelect.value === "system") {
        applyTheme("system");
    }
});

/* =================================
   5. RIWAYAT OBROLAN
================================= */

function saveConversations() {
    try {
        localStorage.setItem(
            "faizAIConversations",
            JSON.stringify(conversations)
        );
    } catch (error) {
        alert(
            "Penyimpanan penuh atau tidak tersedia. " +
            "Coba hapus beberapa obrolan."
        );
    }
}

function loadConversations() {
    try {
        const saved = localStorage.getItem(
            "faizAIConversations"
        );

        if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
                conversations = parsed.filter(chat =>
                    chat &&
                    typeof chat.id === "string" &&
                    typeof chat.title === "string" &&
                    Array.isArray(chat.messages)
                );
            }
        }
    } catch (error) {
        conversations = [];
    }

    if (conversations.length > 0) {
        activeChatId = conversations[0].id;
    } else {
        createChat();
    }

    renderHistory();
    renderMessages();
}

function renderHistory() {
    historyList.replaceChildren();

    if (conversations.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Belum ada riwayat obrolan.";
        historyList.appendChild(empty);
        return;
    }

    conversations.forEach(chat => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "history-item";
        button.textContent = chat.title;

        if (chat.id === activeChatId) {
            button.setAttribute("aria-current", "true");
        }

        // Klik biasa: buka obrolan
        button.addEventListener("click", () => {
            activeChatId = chat.id;
            renderHistory();
            renderMessages();
            closeMenu();
        });

        // Tekan dan tahan: tawarkan penghapusan
        let holdTimer;
        let longPressTriggered = false;

        button.addEventListener("contextmenu", event => {
            event.preventDefault();
        });

        button.addEventListener("pointerdown", () => {
            longPressTriggered = false;

            holdTimer = setTimeout(() => {
                longPressTriggered = true;
                deleteConversation(chat.id);
            }, 650);
        });

        ["pointerup", "pointerleave", "pointercancel"].forEach(eventName => {
            button.addEventListener(eventName, () => {
                clearTimeout(holdTimer);
            });
        });

        button.addEventListener("click", event => {
            if (longPressTriggered) {
                event.stopImmediatePropagation();
                event.preventDefault();
                longPressTriggered = false;
            }
        }, true);

        historyList.appendChild(button);
    });
}

function deleteConversation(chatId) {
    const chat = conversations.find(item => item.id === chatId);

    if (!chat) return;

    const confirmed = confirm(
        `Hapus obrolan "${chat.title}"? Obrolan ini tidak bisa dipulihkan.`
    );

    if (!confirmed) return;

    conversations = conversations.filter(item => item.id !== chatId);

    if (activeChatId === chatId) {
        activeChatId = conversations.length > 0
            ? conversations[0].id
            : null;
    }

    saveConversations();
    renderHistory();
    renderMessages();
}

function renderMessages() {
    const chat = getActiveChat();

    chatMessages.replaceChildren();

    welcomeScreen.hidden =
        Boolean(chat && chat.messages.length > 0);

    if (!chat) return;

    chat.messages.forEach(message => {
        const bubble = document.createElement("div");

        bubble.className =
            "chat-message " +
            (message.role === "user" ? "user" : "ai");

        // textContent mencegah teks pengguna
        // ditafsirkan sebagai kode HTML.
        bubble.textContent = message.text;

        chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* =================================
   6. OBROLAN BARU DAN EDIT NAMA
================================= */

newChatBtn.addEventListener("click", () => {
    createChat();
    closeMenu();
    messageInput.focus();
});

renameChatBtn.addEventListener("click", () => {
    const chat = getActiveChat();

    if (!chat) return;

    const newTitle = prompt(
        "Masukkan nama obrolan:",
        chat.title
    );

    if (newTitle === null) return;

    const cleanedTitle = newTitle.trim();

    if (!cleanedTitle) {
        alert("Nama obrolan tidak boleh kosong.");
        return;
    }

    chat.title = cleanedTitle.slice(0, 80);
    chat.updatedAt = Date.now();

    saveConversations();
    renderHistory();
    closeMenu();
});

/* =================================
   7. MENGIRIM PESAN DASAR
================================= */

chatForm.addEventListener("submit", event => {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text) return;

    let chat = getActiveChat();

    if (!chat) {
        chat = createChat();
    }

    chat.messages.push({
        role: "user",
        text: text,
        time: Date.now()
    });

    if (
        chat.title === "Obrolan baru" &&
        chat.messages.length === 1
    ) {
        chat.title = text.slice(0, 35);
    }

    chat.updatedAt = Date.now();

    saveConversations();
    renderHistory();
    renderMessages();

    messageInput.value = "";
    messageInput.focus();
});


/* =================================
   8. PENCARIAN RIWAYAT
================================= */

function searchConversations(keyword) {
    const query = keyword.trim().toLowerCase();

    const results = conversations.filter(chat =>
        chat.title.toLowerCase().includes(query) ||
        chat.messages.some(message =>
            String(message.text || "").toLowerCase().includes(query)
        )
    );

    historyList.replaceChildren();

    if (results.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Obrolan tidak ditemukan.";
        historyList.appendChild(empty);
        return;
    }

    results.forEach(chat => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item";
        button.textContent = chat.title;

        if (chat.id === activeChatId) {
            button.setAttribute("aria-current", "true");
        }

        button.addEventListener("click", () => {
            activeChatId = chat.id;
            renderHistory();
            renderMessages();
            closeMenu();
        });

        historyList.appendChild(button);
    });
}

searchBtn.addEventListener("click", () => {
    historySearchBox.hidden = false;
    historySearchInput.focus();
});

historySearchInput.addEventListener("input", () => {
    searchConversations(historySearchInput.value);
});

closeHistorySearch.addEventListener("click", () => {
    historySearchInput.value = "";
    historySearchBox.hidden = true;
    renderHistory();
});


/* =================================
   9. GELEMBUNG DALAM WEBSITE
================================= */

function toggleBubble() {
    floatingBubble.hidden = !floatingBubble.hidden;
}

bubbleBtn.addEventListener("click", toggleBubble);

bubbleMenuBtn.addEventListener("click", () => {
    toggleBubble();
    closeMenu();
});

floatingBubble.addEventListener("click", () => {
    floatingBubble.hidden = true;
    messageInput.focus();
});

/* =================================
   10. PILIH FILE DASAR
================================= */

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file) {
        fileStatus.textContent = "";
        return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
        fileStatus.textContent =
            "File melebihi batas demo 10 MB.";

        fileInput.value = "";
        return;
    }

    fileStatus.textContent =
        "File dipilih: " + file.name +
        ". Pengiriman ke AI belum diaktifkan.";
});

/* =================================
   11. TOMBOL VOICE SEMENTARA
================================= */

const voiceBtn = document.getElementById("voiceBtn");

voiceBtn.addEventListener("click", () => {
    alert(
        "Fitur rekam voice note akan dibuat " +
        "pada tahap berikutnya."
    );
});

/* =================================
   12. MULAI APLIKASI
================================= */

loadTheme();
loadConversations();
