
"use strict";

/* ========================================
   1. MENGAMBIL ELEMEN HTML
======================================== */

const $ = (id) => document.getElementById(id);

/* ========================================
   APP AI — POPUP CUSTOM
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
  if (appModalElement) {
    closeAppModal(null);
  }

  return new Promise((resolve) => {
    appModalResolver = resolve;

    const overlay = document.createElement("div");
    overlay.className = "app-modal-overlay";

    const card = document.createElement("section");
    card.className = "app-modal-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "appModalTitle");

    const heading = document.createElement("h2");
    heading.className = "app-modal-title";
    heading.id = "appModalTitle";
    heading.textContent = title;

    const description = document.createElement("p");
    description.className = "app-modal-message";
    description.textContent = message;

    card.append(heading);

    if (message) card.append(description);

    let field = null;

    if (type === "prompt") {
      field = document.createElement("input");
      field.className = "app-modal-input";
      field.type = "text";
      field.value = value;
      field.placeholder = placeholder;
      field.maxLength = 80;
      field.autocomplete = "off";
      field.setAttribute("aria-label", title);
      field.required = required;
      card.append(field);
    }

    if (type === "select") {
      field = document.createElement("select");
      field.className = "app-modal-select";
      field.setAttribute("aria-label", title);

      options.forEach((option) => {
        const item = document.createElement("option");
        item.value = option.value;
        item.textContent = option.label;
        field.append(item);
      });

      if (value !== "") field.value = value;
      card.append(field);
    }

    const actions = document.createElement("div");
    actions.className = "app-modal-actions";

    if (type !== "alert") {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className =
        "app-modal-button app-modal-cancel";
      cancel.textContent = cancelText;
      cancel.addEventListener("click", () => {
        closeAppModal(null);
      });
      actions.append(cancel);
    }

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className =
      "app-modal-button app-modal-primary";
    confirm.textContent = confirmText;

    confirm.addEventListener("click", () => {
      if (type === "confirm") {
        closeAppModal(true);
        return;
      }

      if (type === "prompt") {
        const result = field.value.trim();

        if (required && !result) {
          field.focus();
          field.setCustomValidity("Bagian ini wajib diisi.");
          field.reportValidity();
          field.addEventListener(
            "input",
            () => field.setCustomValidity(""),
            { once: true }
          );
          return;
        }

        closeAppModal(result);
        return;
      }

      if (type === "select") {
        closeAppModal(field.value);
        return;
      }

      closeAppModal(true);
    });

    actions.append(confirm);
    card.append(actions);
    overlay.append(card);
    document.body.append(overlay);

    appModalElement = overlay;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeAppModal(null);
      }
    });

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        appModalElement === overlay
      ) {
        event.preventDefault();
        closeAppModal(null);
      }
    };

    overlay.addEventListener("keydown", handleEscape);

    if (field) {
      field.focus();

      if (type === "prompt") field.select();
    } else {
      confirm.focus();
    }
  });
}

function appAlert(message, title = "Informasi APP AI") {
  return showAppModal({
    title,
    message,
    type: "alert",
    confirmText: "Mengerti"
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

const chatForm = $("chatForm");
const messageInput = $("messageInput");
const chatMessages = $("chatMessages");
const welcomeScreen = $("welcomeScreen");

const historyList = $("historyList");
const searchPanel = $("searchPanel");
const historySearchInput = $("historySearchInput");
const closeSearchBtn = $("closeSearchBtn");

const fileInput = $("fileInput");
const fileStatus = $("fileStatus");
const voiceBtn = $("voiceBtn");

/* ========================================
   2. DATA DAN PENYIMPANAN
======================================== */

const CHAT_STORAGE_KEY = "faizAIConversations";
const THEME_STORAGE_KEY = "faizAITheme";

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

  return chat;
}

function saveConversations() {
  try {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(conversations)
    );
  } catch (error) {
    console.error("Gagal menyimpan obrolan:", error);
    alert(
      "Obrolan tidak bisa disimpan. Periksa ruang penyimpanan browser HP."
    );
  }
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
}

/* ========================================
   3. MENU SAMPING
======================================== */

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

menuBtn.addEventListener("click", openMenu);
closeMenuBtn.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", closeMenu);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeBubbleWindow();
  }
});

function goHome() {
  closeMenu();

  welcomeScreen.hidden = false;
  chatMessages.hidden = true;

  messageInput.value = "";
  messageInput.focus();
}

homeBtn.addEventListener("click", goHome);
homeMenuBtn.addEventListener("click", goHome);

newChatBtn.addEventListener("click", () => {
  createChat();
  closeMenu();
  messageInput.focus();
});

/* ========================================
   4. TEMA TERANG DAN GELAP
======================================== */

const systemTheme = window.matchMedia(
  "(prefers-color-scheme: dark)"
);

function applyTheme(theme) {
  const actualTheme =
    theme === "system"
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
    console.warn("Pengaturan tema tidak bisa dibaca.");
  }

  if (!["system", "light", "dark"].includes(savedTheme)) {
    savedTheme = "system";
  }

  themeSelect.value = savedTheme;
  applyTheme(savedTheme);
}

themeSelect.addEventListener("change", () => {
  const theme = themeSelect.value;
  applyTheme(theme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn("Pengaturan tema tidak bisa disimpan.");
  }
});

if (systemTheme.addEventListener) {
  systemTheme.addEventListener("change", () => {
    if (themeSelect.value === "system") {
      applyTheme("system");
    }
  });
}

/* ========================================
   5. MENAMPILKAN RIWAYAT
======================================== */

function renderHistory(list = conversations) {
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
      closeMenu();
    });

    // Tekan lama pada riwayat untuk menghapusnya.
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

    button.addEventListener(
      "click",
      (event) => {
        if (longPressTriggered) {
          event.stopImmediatePropagation();
          event.preventDefault();
          longPressTriggered = false;
        }
      },
      true
    );

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
  if (!confirmed) return;

  conversations = conversations.filter(
    (item) => item.id !== chatId
  );

  if (activeChatId === chatId) {
    activeChatId =
      conversations.length > 0
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
}

/* ========================================
   6. MENAMPILKAN PESAN CHAT UTAMA
======================================== */

function renderMessages() {
  const chat = getActiveChat();

  chatMessages.replaceChildren();

  welcomeScreen.hidden = Boolean(
    chat && chat.messages.length > 0
  );

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

  if (!chat) {
    chat = createChat();
  }

  chat.messages.push({
    role,
    text,
    time: Date.now()
  });

  if (
    role === "user" &&
    chat.title === "Obrolan baru" &&
    chat.messages.filter((item) => item.role === "user").length === 1
  ) {
    chat.title = text.trim().slice(0, 35) || "Obrolan baru";
  }

  chat.updatedAt = Date.now();

  saveConversations();
  renderHistory();
  renderMessages();
  renderBubbleMessages();
}

/* ========================================
   7. MENGIRIM PESAN UTAMA
======================================== */

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) return;

  addMessage("user", text);

  messageInput.value = "";
  resizeTextarea(messageInput);
  messageInput.focus();
});

messageInput.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

/* ========================================
   8. EDIT NAMA OBROLAN
======================================== */

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

/* ========================================
   9. PENCARIAN RIWAYAT
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

searchBtn.addEventListener("click", () => {
  searchPanel.hidden = false;
  historySearchInput.focus();
});

historySearchInput.addEventListener("input", () => {
  searchConversations(historySearchInput.value);
});

closeSearchBtn.addEventListener("click", () => {
  historySearchInput.value = "";
  searchPanel.hidden = true;
  renderHistory();
});

/* ========================================
   10. GELEMBUNG CHAT
======================================== */

function toggleFloatingBubble() {
  floatingBubble.hidden = !floatingBubble.hidden;

  if (floatingBubble.hidden) {
    closeBubbleWindow();
  }
}

function openBubbleWindow() {
  floatingBubble.hidden = false;
  bubbleWindow.hidden = false;
  renderBubbleMessages();
  bubbleInput.focus();
}

function closeBubbleWindow() {
  bubbleWindow.hidden = true;
}

bubbleBtn.addEventListener("click", toggleFloatingBubble);

bubbleMenuBtn.addEventListener("click", () => {
  toggleFloatingBubble();
  closeMenu();
});

floatingBubble.addEventListener("click", openBubbleWindow);

closeBubbleWindowBtn.addEventListener(
  "click",
  closeBubbleWindow
);

/* ========================================
   11. PESAN DI JENDELA GELEMBUNG
======================================== */

function renderBubbleMessages() {
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

bubbleForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = bubbleInput.value.trim();

  if (!text) return;

  addMessage("user", text);

  bubbleInput.value = "";
  resizeTextarea(bubbleInput);
  bubbleInput.focus();
});

bubbleInput.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    bubbleForm.requestSubmit();
  }
});

/* ========================================
   12. MEMINDAHKAN GELEMBUNG
======================================== */

let dragState = null;

floatingBubble.addEventListener("pointerdown", (event) => {
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

floatingBubble.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  if (event.pointerId !== dragState.pointerId) return;

  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;

  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
    dragState.moved = true;
  }

  if (!dragState.moved) return;

  const maxLeft = window.innerWidth - floatingBubble.offsetWidth;
  const maxTop = window.innerHeight - floatingBubble.offsetHeight;

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

floatingBubble.addEventListener("pointerup", () => {
  if (dragState && dragState.moved) {
    // Mencegah klik membuka jendela setelah gelembung digeser.
    floatingBubble.dataset.dragged = "true";
  }

  dragState = null;
});

floatingBubble.addEventListener("pointercancel", () => {
  dragState = null;
});

floatingBubble.addEventListener(
  "click",
  (event) => {
    if (floatingBubble.dataset.dragged === "true") {
      event.stopImmediatePropagation();
      event.preventDefault();
      delete floatingBubble.dataset.dragged;
    }
  },
  true
);

/* ========================================
   13. MEMILIH FILE
======================================== */

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
    `File dipilih: ${file.name}. ` +
    "Pengiriman file ke AI belum diaktifkan.";
});

/* ========================================
   14. TOMBOL SUARA
======================================== */

voiceBtn.addEventListener("click", () => {
  alert(
    "Fitur suara belum diaktifkan. " +
    "Tombol ini akan dikembangkan pada tahap berikutnya."
  );
});

/* ========================================
   15. UKURAN INPUT OTOMATIS
======================================== */

function resizeTextarea(textarea) {
  textarea.style.height = "auto";

  const maxHeight = parseInt(
    getComputedStyle(textarea).maxHeight,
    10
  ) || 130;

  textarea.style.height =
    Math.min(textarea.scrollHeight, maxHeight) + "px";
}

[messageInput, bubbleInput].forEach((textarea) => {
  textarea.addEventListener("input", () => {
    resizeTextarea(textarea);
  });
});

/* ========================================
   16. MEMULAI APLIKASI
======================================== */

loadTheme();
loadConversations();

/* =====================================
   APP AI — PROFIL PENGGUNA
===================================== */

(() => {
  const profilePage = document.getElementById("profilePage");
  const profileBtn = document.getElementById("profileBtn");
  const backBtn = document.getElementById("backProfileBtn");
  const form = document.getElementById("profileForm");

  if (!profilePage || !form) {
    console.error("HTML profil APP AI belum ditemukan.");
    return;
  }

  const nameInput = document.getElementById("profileNameInput");
  const birthInput = document.getElementById("profileBirthDate");
  const schoolRadio = document.getElementById("statusSchool");
  const workRadio = document.getElementById("statusWork");
  const levelSelect = document.getElementById("profileSchoolLevel");
  const majorInput = document.getElementById("profileMajor");
  const jobInput = document.getElementById("profileJob");

  const schoolFields = document.getElementById("schoolFields");
  const majorField = document.getElementById("majorField");
  const workFields = document.getElementById("workFields");

  const displayName = document.getElementById("profileDisplayName");
  const avatar = document.getElementById("profileAvatar");
  const statusMessage = document.getElementById("profileStatus");

  const chatCount = document.getElementById("profileChatCount");
  const messageCount = document.getElementById("profileMessageCount");

  const PROFILE_KEY = "faizAIProfile";

  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function updateConditionalFields() {
    const isSchool = schoolRadio.checked;
    const isWork = workRadio.checked;
    const isSMK = isSchool && levelSelect.value === "SMK";

    schoolFields.hidden = !isSchool;
    workFields.hidden = !isWork;
    majorField.hidden = !isSMK;

    levelSelect.required = isSchool;
    majorInput.required = isSMK;
    jobInput.required = isWork;
  }

  function updateIdentity(name) {
    const cleanName = name.trim();
    const shownName = cleanName || "Pengguna APP AI";

    displayName.textContent = shownName;
    avatar.textContent = cleanName
      ? cleanName.charAt(0).toUpperCase()
      : "U";
  }

  function renderStatistics() {
    // Menggunakan data percakapan APP AI yang sudah ada.
    const chats = Array.isArray(conversations)
      ? conversations
      : [];

    const totalMessages = chats.reduce((total, chat) => {
      return total + (
        Array.isArray(chat.messages)
          ? chat.messages.length
          : 0
      );
    }, 0);

    chatCount.textContent = chats.length;
    messageCount.textContent = totalMessages;
  }

  function loadProfile() {
    const profile = getProfile();

    nameInput.value = profile.name || "";
    birthInput.value = profile.birthDate || "";

    schoolRadio.checked = profile.status !== "bekerja";
    workRadio.checked = profile.status === "bekerja";

    levelSelect.value = profile.schoolLevel || "SMK";
    majorInput.value = profile.major || "";
    jobInput.value = profile.job || "";

    updateConditionalFields();
    updateIdentity(nameInput.value);
    renderStatistics();
  }

  function saveProfile(event) {
    event.preventDefault();

    const name = nameInput.value.trim();

    if (!name) {
      statusMessage.textContent = "Nama lengkap wajib diisi.";
      nameInput.focus();
      return;
    }

    const profile = {
      name,
      birthDate: birthInput.value,
      status: schoolRadio.checked ? "sekolah" : "bekerja",
      schoolLevel: schoolRadio.checked ? levelSelect.value : "",
      major: schoolRadio.checked && levelSelect.value === "SMK"
        ? majorInput.value.trim()
        : "",
      job: workRadio.checked ? jobInput.value.trim() : ""
    };

    if (profile.status === "sekolah" && !profile.schoolLevel) {
      statusMessage.textContent = "Pilih jenjang sekolah.";
      return;
    }

    if (profile.status === "sekolah" &&
        profile.schoolLevel === "SMK" &&
        !profile.major) {
      statusMessage.textContent = "Masukkan jurusan SMK.";
      majorInput.focus();
      return;
    }

    if (profile.status === "bekerja" && !profile.job) {
      statusMessage.textContent = "Masukkan nama pekerjaan.";
      jobInput.focus();
      return;
    }

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      updateIdentity(profile.name);
      statusMessage.textContent = "Profil berhasil disimpan!";
    } catch (error) {
      console.error(error);
      statusMessage.textContent =
        "Profil gagal disimpan. Periksa penyimpanan browser.";
    }
  }

  function openProfile() {

  profilePage.hidden = false;
     
    // Tampilkan profil sebagai layar penuh di atas aplikasi.
    Object.assign(profilePage.style, {
      position: "fixed",
      inset: "0",
      zIndex: "1000",
      width: "100%",
      maxWidth: "none",
      height: "100%",
      overflowY: "auto",
      boxSizing: "border-box",
      background: "#0b1020"
    });

    loadProfile();

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("menuOverlay");

    if (sidebar && !sidebar.hidden) closeMenu();
    if (overlay) overlay.hidden = true;
  }

  function closeProfile() {
    profilePage.hidden = true;

    // Kembalikan gaya awal untuk penggunaan berikutnya.
    profilePage.style.position = "";
    profilePage.style.inset = "";
    profilePage.style.zIndex = "";
    profilePage.style.width = "";
    profilePage.style.maxWidth = "";
    profilePage.style.height = "";
    profilePage.style.overflowY = "";
    profilePage.style.boxSizing = "";
    profilePage.style.background = "";
  }

  schoolRadio.addEventListener("change", updateConditionalFields);
  workRadio.addEventListener("change", updateConditionalFields);
  levelSelect.addEventListener("change", updateConditionalFields);

  nameInput.addEventListener("input", () => {
    updateIdentity(nameInput.value);
  });

  form.addEventListener("submit", saveProfile);

if (profileBtn) {
  profileBtn.addEventListener("click", openProfile);
}

  if (backBtn) {
    backBtn.addEventListener("click", closeProfile);
  }

  // Perbarui statistik ketika ada perubahan percakapan.
  const originalRenderHistory = renderHistory;

  renderHistory = function (...args) {
    const result = originalRenderHistory.apply(this, args);
    renderStatistics();
    return result;
  };

  loadProfile();
})();
