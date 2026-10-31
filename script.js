
"use strict";

/* ========================================
   1. UTILITAS DAN ELEMEN HTML
======================================== */

const $ = (id) => document.getElementById(id);

const CHAT_STORAGE_KEY = "faizAIConversations";
const THEME_STORAGE_KEY = "faizAITheme";
const PROFILE_KEY = "faizAIProfile";

const menuBtn = $("menuBtn");
const closeMenuBtn = $("closeMenuBtn");
const menuOverlay = $("menuOverlay");
const sidebar = $("sidebar");

const homeBtn = $("homeBtn");
const homeMenuBtn = $("homeMenuBtn");
const newChatBtn = $("newChatBtn");
const searchBtn = $("searchBtn");
const renameChatBtn = $("renameChatBtn");

const themeSelect = $("themeSelect");

const bubbleBtn = $("bubbleBtn");
const bubbleMenuBtn = $("bubbleMenuBtn");
const floatingBubble = $("floatingBubble");
const bubbleWindow = $("bubbleWindow");
const closeBubbleWindowBtn = $("closeBubbleWindowBtn");
const bubbleMessages = $("bubbleMessages");
const bubbleForm = $("bubbleForm");
const bubbleInput = $("bubbleInput");
const bubbleSendBtn = $("bubbleSendBtn");

const chatForm = $("chatForm");
const messageInput = $("messageInput");
const chatMessages = $("chatMessages");
const welcomeScreen = $("welcomeScreen");
const sendBtn = $("sendBtn");

const historyList = $("historyList");
const searchPanel = $("searchPanel");
const historySearchInput = $("historySearchInput");
const closeSearchBtn = $("closeSearchBtn");

const fileInput = $("fileInput");
const fileStatus = $("fileStatus");
const voiceBtn = $("voiceBtn");

/* ========================================
   2. POPUP CUSTOM
======================================== */

let appModalElement = null;
let appModalResolver = null;

function closeAppModal(result = null) {
  if (!appModalElement) return;

  const overlay = appModalElement;
  const resolver = appModalResolver;

  appModalElement = null;
  appModalResolver = null;

  overlay.remove();

  if (resolver) resolver(result);
}

function showAppModal({
  title = "APP AI",
  message = "",
  type = "alert",
  value = "",
  placeholder = "",
  options = [],
  confirmText = "Mengerti",
  cancelText = "Batal",
  required = false
} = {}) {
  if (appModalElement) closeAppModal(null);

  return new Promise((resolve) => {
    appModalResolver = resolve;

    const overlay = document.createElement("div");
    overlay.className = "app-modal-overlay";

    const card = document.createElement("section");
    card.className = "app-modal-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");

    const heading = document.createElement("h2");
    heading.className = "app-modal-title";
    heading.textContent = title;

    card.appendChild(heading);

    if (message) {
      const description = document.createElement("p");
      description.className = "app-modal-message";
      description.textContent = message;
      card.appendChild(description);
    }

    let field = null;

    if (type === "prompt") {
      field = document.createElement("input");
      field.className = "app-modal-input";
      field.type = "text";
      field.value = value;
      field.placeholder = placeholder;
      field.maxLength = 80;
      field.autocomplete = "off";
      field.required = required;
      card.appendChild(field);
    }

    if (type === "select") {
      field = document.createElement("select");
      field.className = "app-modal-select";

      options.forEach((option) => {
        const item = document.createElement("option");
        item.value = option.value;
        item.textContent = option.label;
        field.appendChild(item);
      });

      if (value !== "") field.value = value;

      card.appendChild(field);
    }

    const actions = document.createElement("div");
    actions.className = "app-modal-actions";

    if (type !== "alert") {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "app-modal-button app-modal-cancel";
      cancel.textContent = cancelText;
      cancel.addEventListener("click", () => closeAppModal(null));
      actions.appendChild(cancel);
    }

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "app-modal-button app-modal-primary";
    confirm.textContent = confirmText;

    confirm.addEventListener("click", () => {
      if (type === "confirm") {
        closeAppModal(true);
      } else if (type === "prompt") {
        const result = field.value.trim();

        if (required && !result) {
          field.setCustomValidity("Bagian ini wajib diisi.");
          field.reportValidity();
          return;
        }

        closeAppModal(result);
      } else if (type === "select") {
        closeAppModal(field.value);
      } else {
        closeAppModal(true);
      }
    });

    actions.appendChild(confirm);
    card.appendChild(actions);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    appModalElement = overlay;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeAppModal(null);
    });

    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAppModal(null);
    });

    if (field) {
      field.focus();

      if (type === "prompt") {
        field.select();
        field.addEventListener("input", () => {
          field.setCustomValidity("");
        });
      }
    } else {
      confirm.focus();
    }
  });
}

function appAlert(message, title = "Informasi APP AI") {
  return showAppModal({
    title,
    message,
    type: "alert"
  });
}

function appConfirm(message, title = "Konfirmasi") {
  return showAppModal({
    title,
    message,
    type: "confirm",
    confirmText: "Ya, lanjutkan",
    cancelText: "Batal"
  }).then((result) => result === true);
}

function appPrompt(message, value = "", title = "Edit") {
  return showAppModal({
    title,
    message,
    value,
    type: "prompt",
    placeholder: "Masukkan teks...",
    confirmText: "Simpan",
    cancelText: "Batal",
    required: true
  });
}

/* ========================================
   3. DATA DAN PENYIMPANAN
======================================== */

let conversations = [];
let activeChatId = null;

function makeId() {
  return Date.now().toString() +
    Math.random().toString(36).slice(2, 8);
}

function getActiveChat() {
  return conversations.find(
    (chat) => chat.id === activeChatId
  );
}

function saveConversations() {
  try {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(conversations)
    );
    return true;
  } catch (error) {
    console.error("Gagal menyimpan chat:", error);
    appAlert(
      "Penyimpanan gagal. Periksa ruang penyimpanan browser.",
      "Penyimpanan gagal"
    );
    return false;
  }
}

function createChat() {
  const chat = {
    id: makeId(),
    title: "Obrolan baru",
    messages: [],
    updatedAt: Date.now()
  };

  conversations.unshift(chat);
  activeChatId = chat.id;

  saveConversations();
  renderHistory();
  renderMessages();
  renderBubbleMessages();
  updateProfileStatistics();

  return chat;
}

function loadConversations() {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        conversations = parsed.filter((chat) =>
          chat &&
          typeof chat.id === "string" &&
          typeof chat.title === "string" &&
          Array.isArray(chat.messages)
        );
      }
    }
  } catch (error) {
    console.error("Gagal membaca riwayat:", error);
    conversations = [];
  }

  if (conversations.length > 0) {
    activeChatId = conversations[0].id;
  } else {
    createChat();
  }

  renderHistory();
  renderMessages();
  renderBubbleMessages();
  updateProfileStatistics();
}

/* ========================================
   4. MENU SAMPING
======================================== */

function openMenu() {
  if (!sidebar || !menuOverlay) return;

  sidebar.hidden = false;
  menuOverlay.hidden = false;

  menuBtn?.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  if (sidebar) sidebar.hidden = true;
  if (menuOverlay) menuOverlay.hidden = true;

  menuBtn?.setAttribute("aria-expanded", "false");
}

menuBtn?.addEventListener("click", openMenu);
closeMenuBtn?.addEventListener("click", closeMenu);
menuOverlay?.addEventListener("click", closeMenu);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeBubbleWindow();
    closeProfile();
  }
});

function goHome() {
  closeMenu();

  const profilePage = $("profilePage");
  if (profilePage && !profilePage.hidden) closeProfile();

  if (welcomeScreen) welcomeScreen.hidden = false;
  if (chatMessages) chatMessages.hidden = true;

  if (messageInput) {
    messageInput.value = "";
    messageInput.focus();
  }
}

homeBtn?.addEventListener("click", goHome);
homeMenuBtn?.addEventListener("click", goHome);

newChatBtn?.addEventListener("click", () => {
  createChat();
  closeMenu();

  if (welcomeScreen) welcomeScreen.hidden = false;
  if (chatMessages) chatMessages.hidden = true;

  messageInput?.focus();
});

/* ========================================
   5. TEMA TERANG DAN GELAP
======================================== */

const systemTheme = window.matchMedia(
  "(prefers-color-scheme: dark)"
);

function applyTheme(theme) {
  const actualTheme = theme === "system"
    ? (systemTheme.matches ? "dark" : "light")
    : theme;

  document.body.dataset.theme = actualTheme;

  const themeMeta = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (themeMeta) {
    themeMeta.setAttribute(
      "content",
      actualTheme === "dark" ? "#0b1020" : "#f3f5fb"
    );
  }
}

function loadTheme() {
  let savedTheme = "system";

  try {
    savedTheme =
      localStorage.getItem(THEME_STORAGE_KEY) || "system";
  } catch (error) {
    console.warn("Tema tidak dapat dibaca.");
  }

  if (!["system", "light", "dark"].includes(savedTheme)) {
    savedTheme = "system";
  }

  if (themeSelect) themeSelect.value = savedTheme;

  applyTheme(savedTheme);
}

themeSelect?.addEventListener("change", async () => {
  const theme = themeSelect.value;
  applyTheme(theme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    await appAlert("Tema gagal disimpan.");
    return;
  }

  const names = {
    light: "Terang",
    dark: "Gelap",
    system: "Ikuti perangkat"
  };

  await appAlert(
    `Tema APP AI sekarang: ${names[theme]}.`,
    "Tema berhasil diubah"
  );
});

if (systemTheme.addEventListener) {
  systemTheme.addEventListener("change", () => {
    if (themeSelect?.value === "system") {
      applyTheme("system");
    }
  });
}

/* ========================================
   6. RIWAYAT OBROLAN
======================================== */

function renderHistory(list = conversations) {
  if (!historyList) return;

  historyList.replaceChildren();

  if (list.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Belum ada obrolan yang cocok.";
    historyList.appendChild(empty);
    return;
  }

  list.forEach((chat) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    button.textContent = chat.title;
    button.title = chat.title;

    if (chat.id === activeChatId) {
      button.setAttribute("aria-current", "true");
    }

    button.addEventListener("click", () => {
      activeChatId = chat.id;

      renderHistory();
      renderMessages();
      renderBubbleMessages();

      if (welcomeScreen) welcomeScreen.hidden = true;
      if (chatMessages) chatMessages.hidden = false;

      closeMenu();
    });

    let holdTimer = null;
    let longPressTriggered = false;

    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });

    button.addEventListener("pointerdown", () => {
      longPressTriggered = false;

      holdTimer = setTimeout(() => {
        longPressTriggered = true;
        deleteConversation(chat.id);
      }, 750);
    });

    ["pointerup", "pointerleave", "pointercancel"].forEach(
      (eventName) => {
        button.addEventListener(eventName, () => {
          clearTimeout(holdTimer);
        });
      }
    );

    button.addEventListener("click", (event) => {
      if (longPressTriggered) {
        event.stopImmediatePropagation();
        event.preventDefault();
        longPressTriggered = false;
      }
    }, true);

    historyList.appendChild(button);
  });
}

async function deleteConversation(chatId) {
  const chat = conversations.find(
    (item) => item.id === chatId
  );

  if (!chat) return;

  const confirmed = await appConfirm(
    `Hapus obrolan "${chat.title}"?`,
    "Hapus obrolan"
  );

  if (!confirmed) return;

  conversations = conversations.filter(
    (item) => item.id !== chatId
  );

  if (activeChatId === chatId) {
    activeChatId = conversations.length
      ? conversations[0].id
      : null;
  }

  if (!activeChatId) {
    createChat();
    return;
  }

  saveConversations();
  renderHistory();
  renderMessages();
  renderBubbleMessages();
  updateProfileStatistics();
}

/* ========================================
   7. MENAMPILKAN PESAN
======================================== */

function renderMessages() {
  if (!chatMessages || !welcomeScreen) return;

  const chat = getActiveChat();

  chatMessages.replaceChildren();

  const hasMessages = Boolean(
    chat && chat.messages.length > 0
  );

  welcomeScreen.hidden = hasMessages;
  chatMessages.hidden = !hasMessages;

  if (!chat) return;

  chat.messages.forEach((message) => {
    const bubble = document.createElement("div");

    bubble.className =
      "chat-message " +
      (message.role === "user" ? "user" : "ai");

    bubble.textContent = message.text || "";

    chatMessages.appendChild(bubble);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(role, text) {
  let chat = getActiveChat();

  if (!chat) chat = createChat();

  chat.messages.push({
    role,
    text,
    time: Date.now()
  });

  if (
    role === "user" &&
    chat.title === "Obrolan baru" &&
    chat.messages.filter(
      (item) => item.role === "user"
    ).length === 1
  ) {
    chat.title = text.trim().slice(0, 35) || "Obrolan baru";
  }

  chat.updatedAt = Date.now();

  saveConversations();
  renderHistory();
  renderMessages();
  renderBubbleMessages();
  updateProfileStatistics();
}


/* ========================================
   8. LOCAL AI ENGINE - QWEN
   Tanpa API Key
======================================== */

const AI_MODEL =
  "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

let aiEngine = null;
let aiEnginePromise = null;
let aiGenerating = false;

// Memuat mesin AI satu kali
async function loadAIEngine(onProgress) {

  if (aiEngine) return aiEngine;

  if (!aiEnginePromise) {

    aiEnginePromise = (async () => {

      const { CreateMLCEngine } =
        await import(
          "https://esm.run/@mlc-ai/web-llm@0.2.87"
        );

      const engine = await CreateMLCEngine(
        AI_MODEL,
        {
          initProgressCallback: (progress) => {
            if (onProgress) {
              onProgress(progress.text);
            }
          }
        }
      );

      return engine;

    })();
  }

  try {

    aiEngine = await aiEnginePromise;
    return aiEngine;

  } catch (error) {

    aiEnginePromise = null;
    throw error;

  }
}

// Status sementara AI
function createAIStatus() {

  const mainStatus = document.createElement("div");
  mainStatus.className = "chat-message ai";
  mainStatus.textContent = "Menyiapkan AI...";

  const bubbleStatus = document.createElement("div");
  bubbleStatus.className = "bubble-message ai";
  bubbleStatus.textContent = "Menyiapkan AI...";

  chatMessages?.appendChild(mainStatus);
  bubbleMessages?.appendChild(bubbleStatus);

  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  if (bubbleMessages) {
    bubbleMessages.scrollTop = bubbleMessages.scrollHeight;
  }

  return {
    update(text) {
      mainStatus.textContent = text;
      bubbleStatus.textContent = text;
    },

    remove() {
      mainStatus.remove();
      bubbleStatus.remove();
    }
  };
}

// Mengirim pertanyaan ke AI lokal
async function sendMessageToAI(text) {

  const chat = getActiveChat();

  if (!chat || aiGenerating) return;

  aiGenerating = true;

  if (sendBtn) sendBtn.disabled = true;
  if (bubbleSendBtn) bubbleSendBtn.disabled = true;

  const status = createAIStatus();

  try {

    // Memuat model jika belum tersedia
    status.update("Memuat mesin AI lokal...");

    const engine = await loadAIEngine((progress) => {
      status.update(progress);
    });

    status.update("AI sedang menyusun jawaban...");

    // Mengambil konteks percakapan
    const history = chat.messages
      .filter(message =>
        ["user", "assistant"].includes(message.role)
      )
      .slice(-4)
      .map(message => ({
        role: message.role,
        content: message.text
      }));

    // Instruksi utama AI
    const messages = [
      {
        role: "system",
        content:
          "Kamu adalah APP AI, asisten kecerdasan buatan " +
          "yang ramah, informatif, dan membantu. " +
          "Jawab menggunakan bahasa Indonesia jika pengguna " +
          "menggunakan bahasa Indonesia. " +
          "Berikan penjelasan yang jelas dan mudah dipahami. " +
          "Jangan mengarang informasi jika tidak mengetahuinya."
      },
      ...history
    ];

    // Menghasilkan jawaban
    let response;

try {
    response = await engine.chat.completions.create({
        messages,
        temperature: 0.4,
        max_tokens: 160
    });

} catch (error) {
    if (!String(error.message).toLowerCase().includes("disposed")) {
        throw error;
    }

    // Reset mesin AI yang sudah tidak aktif
    aiEngine = null;
    aiEnginePromise = null;

    status.update("Mesin AI terputus. Memuat ulang...");

    // Buat mesin AI baru
    const newEngine = await loadAIEngine(
        progress => status.update(progress)
    );

    response = await newEngine.chat.completions.create({
        messages,
        temperature: 0.4,
        max_tokens: 160
    });
}

    const reply =
      response.choices?.[0]?.message?.content;

    if (!reply || !reply.trim()) {
      throw new Error("AI tidak menghasilkan jawaban.");
    }

    status.remove();

    // Menyimpan jawaban AI
    addMessage("assistant", reply.trim());

  } catch (error) {

    console.error("AI Engine Error:", error);

    status.remove();

    addMessage(
      "assistant",
      "Maaf, mesin AI mengalami kesalahan. " +
      "Silakan coba kembali. Detail: " +
      error.message
    );

  } finally {

    aiGenerating = false;

    if (sendBtn) sendBtn.disabled = false;
    if (bubbleSendBtn) bubbleSendBtn.disabled = false;

  }
}


/* ========================================
   9. FORM CHAT UTAMA
======================================== */

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = messageInput?.value.trim();

  if (!text) return;

  addMessage("user", text);

  messageInput.value = "";
  resizeTextarea(messageInput);
  messageInput.focus();

  await sendMessageToAI(text);
});

messageInput?.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    chatForm?.requestSubmit();
  }
});

/* ========================================
   10. EDIT NAMA OBROLAN
======================================== */

renameChatBtn?.addEventListener("click", async () => {
  const chat = getActiveChat();

  if (!chat) return;

  const newTitle = await appPrompt(
    "Masukkan nama baru untuk obrolan ini.",
    chat.title,
    "Edit nama obrolan"
  );

  if (newTitle === null) return;

  chat.title = newTitle.trim().slice(0, 80);
  chat.updatedAt = Date.now();

  saveConversations();
  renderHistory();
  closeMenu();
});

/* ========================================
   11. PENCARIAN RIWAYAT
======================================== */

function searchConversations(keyword) {
  const query = keyword.trim().toLowerCase();

  if (!query) {
    renderHistory();
    return;
  }

  const results = conversations.filter((chat) => {
    const titleMatches = chat.title
      .toLowerCase()
      .includes(query);

    const messageMatches = chat.messages.some((message) =>
      String(message.text || "")
        .toLowerCase()
        .includes(query)
    );

    return titleMatches || messageMatches;
  });

  renderHistory(results);
}

searchBtn?.addEventListener("click", () => {
  if (!searchPanel) return;

  searchPanel.hidden = false;
  historySearchInput?.focus();
});

historySearchInput?.addEventListener("input", () => {
  searchConversations(historySearchInput.value);
});

closeSearchBtn?.addEventListener("click", () => {
  if (historySearchInput) historySearchInput.value = "";
  if (searchPanel) searchPanel.hidden = true;

  renderHistory();
});

/* ========================================
   12. BUBBLE CHAT
======================================== */

function toggleFloatingBubble() {
  if (!floatingBubble) return;

  floatingBubble.hidden = !floatingBubble.hidden;

  if (floatingBubble.hidden) {
    closeBubbleWindow();
  }
}

function openBubbleWindow() {
  if (!floatingBubble || !bubbleWindow) return;

  floatingBubble.hidden = false;
  bubbleWindow.hidden = false;

  renderBubbleMessages();
  bubbleInput?.focus();
}

function closeBubbleWindow() {
  if (bubbleWindow) bubbleWindow.hidden = true;
}

bubbleBtn?.addEventListener("click", toggleFloatingBubble);

bubbleMenuBtn?.addEventListener("click", () => {
  toggleFloatingBubble();
  closeMenu();
});

floatingBubble?.addEventListener("click", openBubbleWindow);

closeBubbleWindowBtn?.addEventListener(
  "click",
  closeBubbleWindow
);

function renderBubbleMessages() {
  if (!bubbleMessages) return;

  const chat = getActiveChat();

  bubbleMessages.replaceChildren();

  if (!chat) return;

  chat.messages.forEach((message) => {
    const bubble = document.createElement("div");

    bubble.className =
      "bubble-message " +
      (message.role === "user" ? "user" : "ai");

    bubble.textContent = message.text || "";

    bubbleMessages.appendChild(bubble);
  });

  bubbleMessages.scrollTop = bubbleMessages.scrollHeight;
}

bubbleForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = bubbleInput?.value.trim();

  if (!text) return;

  addMessage("user", text);

  bubbleInput.value = "";
  resizeTextarea(bubbleInput);
  bubbleInput.focus();

  await sendMessageToAI(text);
});

bubbleInput?.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    bubbleForm?.requestSubmit();
  }
});

/* ========================================
   13. MEMINDAHKAN BUBBLE
======================================== */

let dragState = null;

floatingBubble?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  const rect = floatingBubble.getBoundingClientRect();

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    left: rect.left,
    top: rect.top,
    moved: false
  };

  floatingBubble.setPointerCapture(event.pointerId);
});

floatingBubble?.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  if (event.pointerId !== dragState.pointerId) return;

  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;

  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
    dragState.moved = true;
  }

  if (!dragState.moved) return;

  const maxLeft =
    window.innerWidth - floatingBubble.offsetWidth;

  const maxTop =
    window.innerHeight - floatingBubble.offsetHeight;

  const left = Math.max(
    0,
    Math.min(maxLeft, dragState.left + dx)
  );

  const top = Math.max(
    0,
    Math.min(maxTop, dragState.top + dy)
  );

  floatingBubble.style.left = `${left}px`;
  floatingBubble.style.top = `${top}px`;
  floatingBubble.style.right = "auto";
  floatingBubble.style.bottom = "auto";
});

floatingBubble?.addEventListener("pointerup", () => {
  if (dragState?.moved) {
    floatingBubble.dataset.dragged = "true";
  }

  dragState = null;
});

floatingBubble?.addEventListener("pointercancel", () => {
  dragState = null;
});

floatingBubble?.addEventListener("click", (event) => {
  if (floatingBubble.dataset.dragged === "true") {
    event.stopImmediatePropagation();
    event.preventDefault();
    delete floatingBubble.dataset.dragged;
  }
}, true);

/* ========================================
   14. MEMILIH FILE
======================================== */

fileInput?.addEventListener("change", () => {
  const file = fileInput.files?.[0];

  if (!file) {
    if (fileStatus) fileStatus.textContent = "";
    return;
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    if (fileStatus) {
      fileStatus.textContent = "File melebihi batas 10 MB.";
    }

    fileInput.value = "";
    return;
  }

  if (fileStatus) {
    fileStatus.textContent =
      `File dipilih: ${file.name}. Pengiriman ke AI belum diaktifkan.`;
  }
});

/* ========================================
   15. TOMBOL SUARA
======================================== */

let speechRecognition = null;
let isListening = false;

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (voiceBtn) {
  if (SpeechRecognition) {
    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = "id-ID";
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;

    speechRecognition.onstart = () => {
      isListening = true;
      voiceBtn.classList.add("listening");
      voiceBtn.setAttribute("aria-label", "Berhenti merekam");
    };

    speechRecognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      messageInput.value =
        `${messageInput.value} ${transcript}`.trim();

      resizeTextarea(messageInput);
      messageInput.focus();
    };

    speechRecognition.onerror = (event) => {
      console.error("Kesalahan suara:", event.error);
    };

    speechRecognition.onend = () => {
      isListening = false;
      voiceBtn.classList.remove("listening");
      voiceBtn.setAttribute("aria-label", "Input suara");
    };

    voiceBtn.addEventListener("click", () => {
      if (isListening) {
        speechRecognition.stop();
      } else {
        try {
          speechRecognition.start();
        } catch (error) {
          console.error(error);
        }
      }
    });
  } else {
    voiceBtn.addEventListener("click", () => {
      appAlert(
        "Browser ini belum mendukung input suara. Coba gunakan browser yang mendukung Speech Recognition.",
        "Fitur suara tidak tersedia"
      );
    });
  }
}

/* ========================================
   16. UKURAN INPUT OTOMATIS
======================================== */

function resizeTextarea(textarea) {
  if (!textarea) return;

  textarea.style.height = "auto";

  const maxHeight = parseInt(
    getComputedStyle(textarea).maxHeight,
    10
  ) || 130;

  textarea.style.height =
    Math.min(textarea.scrollHeight, maxHeight) + "px";
}

[messageInput, bubbleInput].forEach((textarea) => {
  textarea?.addEventListener("input", () => {
    resizeTextarea(textarea);
  });
});

/* ========================================
   17. PROFIL PENGGUNA
======================================== */

const profilePage = $("profilePage");
const profileBtn = $("profileBtn");
const backProfileBtn = $("backProfileBtn");
const profileForm = $("profileForm");

const profileNameInput = $("profileNameInput");
const profileBirthDate = $("profileBirthDate");

const statusSchool = $("statusSchool");
const statusWork = $("statusWork");

const profileSchoolLevel = $("profileSchoolLevel");
const openSchoolLevelModal = $("openSchoolLevelModal");
const schoolLevelLabel = $("schoolLevelLabel");

const schoolFields = $("schoolFields");
const majorField = $("majorField");
const profileMajor = $("profileMajor");

const workFields = $("workFields");
const profileJob = $("profileJob");

const profileDisplayName = $("profileDisplayName");
const profileAvatar = $("profileAvatar");
const profileStatus = $("profileStatus");

const profileChatCount = $("profileChatCount");
const profileMessageCount = $("profileMessageCount");

function getProfile() {
  try {
    return JSON.parse(
      localStorage.getItem(PROFILE_KEY)
    ) || {};
  } catch (error) {
    console.error("Gagal membaca profil:", error);
    return {};
  }
}

function updateIdentity(name) {
  const cleanName = name.trim();
  const shownName = cleanName || "Pengguna APP AI";

  if (profileDisplayName) {
    profileDisplayName.textContent = shownName;
  }

  if (profileAvatar) {
    profileAvatar.textContent = cleanName
      ? cleanName.charAt(0).toUpperCase()
      : "U";
  }
}

function syncSchoolLevelLabel() {
  if (schoolLevelLabel && profileSchoolLevel) {
    schoolLevelLabel.textContent =
      profileSchoolLevel.value || "Pilih jenjang";
  }
}

function updateConditionalFields() {
  const isSchool = Boolean(statusSchool?.checked);
  const isWork = Boolean(statusWork?.checked);
  const isSMK =
    isSchool && profileSchoolLevel?.value === "SMK";

  if (schoolFields) schoolFields.hidden = !isSchool;
  if (workFields) workFields.hidden = !isWork;
  if (majorField) majorField.hidden = !isSMK;

  if (profileSchoolLevel) {
    profileSchoolLevel.required = isSchool;
  }

  if (profileMajor) {
    profileMajor.required = isSMK;
  }

  if (profileJob) {
    profileJob.required = isWork;
  }
}

function updateProfileStatistics() {
  if (!profileChatCount || !profileMessageCount) return;

  const totalMessages = conversations.reduce(
    (total, chat) => {
      return total + (
        Array.isArray(chat.messages)
          ? chat.messages.length
          : 0
      );
    },
    0
  );

  profileChatCount.textContent = conversations.length;
  profileMessageCount.textContent = totalMessages;
}

function loadProfile() {
  const profile = getProfile();

  if (profileNameInput) {
    profileNameInput.value = profile.name || "";
  }

  if (profileBirthDate) {
    profileBirthDate.value = profile.birthDate || "";
  }

  if (statusSchool) {
    statusSchool.checked = profile.status !== "bekerja";
  }

  if (statusWork) {
    statusWork.checked = profile.status === "bekerja";
  }

  if (profileSchoolLevel) {
    profileSchoolLevel.value = profile.schoolLevel || "SMK";
  }

  if (profileMajor) {
    profileMajor.value = profile.major || "";
  }

  if (profileJob) {
    profileJob.value = profile.job || "";
  }

  updateConditionalFields();
  syncSchoolLevelLabel();
  updateIdentity(profile.name || "");
  updateProfileStatistics();
}

function saveProfile(event) {
  event.preventDefault();

  const name = profileNameInput?.value.trim() || "";

  if (!name) {
    if (profileStatus) {
      profileStatus.textContent = "Nama lengkap wajib diisi.";
    }

    profileNameInput?.focus();
    return;
  }

  const isSchool = Boolean(statusSchool?.checked);

  const profile = {
    name,
    birthDate: profileBirthDate?.value || "",
    status: isSchool ? "sekolah" : "bekerja",
    schoolLevel: isSchool
      ? profileSchoolLevel?.value || ""
      : "",
    major: isSchool &&
      profileSchoolLevel?.value === "SMK"
        ? profileMajor?.value.trim() || ""
        : "",
    job: !isSchool
      ? profileJob?.value.trim() || ""
      : ""
  };

  if (profile.status === "sekolah" && !profile.schoolLevel) {
    profileStatus.textContent = "Pilih jenjang sekolah.";
    return;
  }

  if (
    profile.status === "sekolah" &&
    profile.schoolLevel === "SMK" &&
    !profile.major
  ) {
    profileStatus.textContent = "Masukkan jurusan SMK.";
    profileMajor?.focus();
    return;
  }

  if (profile.status === "bekerja" && !profile.job) {
    profileStatus.textContent = "Masukkan pekerjaan.";
    profileJob?.focus();
    return;
  }

  try {
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify(profile)
    );

    updateIdentity(profile.name);

    if (profileStatus) {
      profileStatus.textContent = "Profil berhasil disimpan!";
    }
  } catch (error) {
    console.error(error);

    if (profileStatus) {
      profileStatus.textContent =
        "Profil gagal disimpan. Periksa penyimpanan browser.";
    }
  }
}

function openProfile() {
  if (!profilePage) return;

  closeMenu();

  profilePage.hidden = false;

  Object.assign(profilePage.style, {
    position: "fixed",
    inset: "0",
    zIndex: "1000",
    width: "100%",
    maxWidth: "none",
    height: "100%",
    overflowY: "auto",
    boxSizing: "border-box"
  });

  loadProfile();
}

function closeProfile() {
  if (!profilePage || profilePage.hidden) return;

  profilePage.hidden = true;

  [
    "position",
    "inset",
    "zIndex",
    "width",
    "maxWidth",
    "height",
    "overflowY",
    "boxSizing"
  ].forEach((property) => {
    profilePage.style[property] = "";
  });
}

statusSchool?.addEventListener(
  "change",
  updateConditionalFields
);

statusWork?.addEventListener(
  "change",
  updateConditionalFields
);

profileSchoolLevel?.addEventListener("change", () => {
  updateConditionalFields();
  syncSchoolLevelLabel();
});

profileNameInput?.addEventListener("input", () => {
  updateIdentity(profileNameInput.value);
});

openSchoolLevelModal?.addEventListener(
  "click",
  async () => {
    const selectedLevel = await showAppModal({
      title: "Jenjang sekolah",
      message: "Pilih jenjang pendidikan kamu.",
      type: "select",
      value: profileSchoolLevel?.value || "SMK",
      options: [
        { value: "SD", label: "SD" },
        { value: "SMP", label: "SMP" },
        { value: "SMA", label: "SMA" },
        { value: "SMK", label: "SMK" }
      ],
      confirmText: "Pilih",
      cancelText: "Batal"
    });

    if (selectedLevel === null) return;

    if (profileSchoolLevel) {
      profileSchoolLevel.value = selectedLevel;
      profileSchoolLevel.dispatchEvent(
        new Event("change", { bubbles: true })
      );
    }
  }
);

profileForm?.addEventListener("submit", saveProfile);

profileBtn?.addEventListener("click", openProfile);
backProfileBtn?.addEventListener("click", closeProfile);

/* ========================================
   18. MEMULAI APLIKASI
======================================== */

loadTheme();
loadConversations();
loadProfile();

console.log("APP AI berhasil dimuat.");
