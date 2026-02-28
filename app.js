const API_BASE = "http://localhost:3000";
const STORAGE_KEY = "cloneXCurrentUser";
const THEME_KEY = "cloneXTheme";
const LIKED_TWEETS_KEY = "cloneXLikedTweets";
const MAX_UPLOAD_BYTES = 90 * 1024;
const IMAGE_MAX_DIMENSION = 900;
const IMAGE_QUALITY_START = 0.76;

const app = document.getElementById("app");
const authDialog = document.getElementById("auth-dialog");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const authSwitchLine = document.getElementById("auth-switch-line");
const closeAuthButton = document.getElementById("close-auth");
const signupOnly = document.getElementById("signup-only");

const state = {
  currentUser: loadCurrentUser(),
  view: "home",
  authMode: "login",
  tweets: [],
  users: [],
  searchText: "",
  likedTweetIds: loadLikedTweetIds(),
  apiDown: false,
};

const NAV_ITEMS = [
  { id: "home", label: "Accueil" },
  { id: "explore", label: "Explorer" },
  { id: "notifications", label: "Notifications" },
  { id: "messages", label: "Messages" },
  { id: "grok", label: "Grok" },
  { id: "bookmarks", label: "Signets" },
  { id: "communities", label: "Communautes" },
  { id: "premium", label: "Premium" },
  { id: "organizations", label: "Organisations" },
  { id: "profile", label: "Profil" },
  { id: "more", label: "Plus" },
];

init();

async function init() {
  applyTheme(loadTheme());
  render();
  await refreshData();
  bindGlobalEvents();
}

function loadCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveCurrentUser(user) {
  state.currentUser = user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  state.likedTweetIds = loadLikedTweetIds();
}

function clearCurrentUser() {
  state.currentUser = null;
  localStorage.removeItem(STORAGE_KEY);
  state.likedTweetIds = [];
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  localStorage.setItem(THEME_KEY, theme);
}

async function refreshData() {
  try {
    const [tweets, users] = await Promise.all([apiGet("/tweets"), apiGet("/users")]);
    state.tweets = Array.isArray(tweets) ? tweets.sort(sortTweetsByDate) : [];
    state.users = Array.isArray(users) ? users : [];
    if (state.currentUser) {
      const freshUser = state.users.find((user) => Number(user.id) === Number(state.currentUser.id));
      if (freshUser) {
        saveCurrentUser(sanitizeUser(freshUser));
      }
    }
    state.apiDown = false;
  } catch {
    state.apiDown = true;
    state.tweets = [];
    state.users = [];
  }
  render();
}

function sortTweetsByDate(a, b) {
  return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
}

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`API GET failed: ${path}`);
  }
  return response.json();
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API POST failed (${response.status}): ${path}`);
  }
  return response.json();
}

async function apiPatch(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API PATCH failed: ${path}`);
  }
  return response.json();
}

async function apiDelete(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`API DELETE failed: ${path}`);
  }
}

function likedStorageKey(userId = state.currentUser?.id) {
  return `${LIKED_TWEETS_KEY}_${userId || "guest"}`;
}

function loadLikedTweetIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(likedStorageKey()) || "[]");
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  } catch {
    return [];
  }
}

function saveLikedTweetIds() {
  localStorage.setItem(likedStorageKey(), JSON.stringify(state.likedTweetIds));
}

function bindGlobalEvents() {
  authForm.addEventListener("submit", onAuthSubmit);
  closeAuthButton.addEventListener("click", () => authDialog.close());
}

function render() {
  if (!state.currentUser) {
    renderWelcome();
    return;
  }

  if (state.view === "home") {
    renderHome();
    return;
  }

  if (state.view === "profile") {
    renderProfile();
    return;
  }

  renderFeaturePage(state.view);
}

function renderWelcome() {
  app.innerHTML = document.getElementById("welcome-template").innerHTML;

  const openSignup = document.getElementById("open-signup");
  const openLogin = document.getElementById("open-login");

  openSignup.addEventListener("click", () => openAuth("signup"));
  openLogin.addEventListener("click", () => openAuth("login"));
}

function openAuth(mode) {
  state.authMode = mode;
  const isSignup = mode === "signup";
  authTitle.textContent = isSignup ? "Creer votre compte" : "Connectez-vous a X";
  authSubmit.textContent = isSignup ? "S'inscrire" : "Se connecter";
  signupOnly.classList.toggle("hidden", !isSignup);
  authSwitchLine.innerHTML = isSignup
    ? "Vous avez deja un compte ? <button type='button' id='switch-auth' class='link-btn'>Se connecter</button>"
    : "Vous n'avez pas de compte ? <button type='button' id='switch-auth' class='link-btn'>Inscrivez-vous</button>";
  authDialog.showModal();

  const switchButton = document.getElementById("switch-auth");
  if (switchButton) {
    switchButton.addEventListener("click", () => openAuth(isSignup ? "login" : "signup"));
  }
}

async function onAuthSubmit(event) {
  event.preventDefault();
  const formData = new FormData(authForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    if (state.authMode === "signup") {
      await submitSignup(payload);
    } else {
      await submitLogin(payload);
    }
    authDialog.close();
    authForm.reset();
    state.view = "home";
    await refreshData();
  } catch (error) {
    alert(error.message || "Erreur pendant l'authentification");
  }
}

async function submitSignup(payload) {
  if (!payload.name || !payload.username || !payload.email || !payload.password) {
    throw new Error("Tous les champs sont obligatoires pour l'inscription.");
  }

  const users = await apiGet("/users");
  const existing = users.find((u) => u.email === payload.email);
  if (existing) {
    throw new Error("Cet email est deja utilise.");
  }

  const newUser = await apiPost("/users", {
    name: payload.name,
    username: payload.username.startsWith("@") ? payload.username : `@${payload.username}`,
    email: payload.email,
    password: payload.password,
    bio: "Frontend learner | Clone X",
    avatarColor: randomAvatarColor(),
    avatarImage: "",
    coverImage: "",
  });

  saveCurrentUser(sanitizeUser(newUser));
}

async function submitLogin(payload) {
  if (!payload.email || !payload.password) {
    throw new Error("Email et mot de passe requis.");
  }

  const users = await apiGet(`/users?email=${encodeURIComponent(payload.email)}`);
  const user = users.find((u) => u.password === payload.password);

  if (!user) {
    throw new Error("Email ou mot de passe invalide.");
  }

  saveCurrentUser(sanitizeUser(user));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio || "",
    avatarColor: user.avatarColor || randomAvatarColor(),
    avatarImage: user.avatarImage || "",
    coverImage: user.coverImage || "",
  };
}

function randomAvatarColor() {
  const palette = ["#355c7d", "#6c5b7b", "#43aa8b", "#577590", "#3f72af"];
  return palette[Math.floor(Math.random() * palette.length)];
}

function navLinksMarkup(activeView) {
  return NAV_ITEMS.map(
    (item) =>
      `<button data-view="${item.id}" class="nav-link ${activeView === item.id ? "active" : ""}">${item.label}</button>`
  ).join("");
}

function viewLabel(viewId) {
  return NAV_ITEMS.find((item) => item.id === viewId)?.label || "Page";
}

function renderHome() {
  app.innerHTML = document.getElementById("app-template").innerHTML;
  setSidebar(state.currentUser);
  bindMainLayoutEvents();

  const tweetForm = document.getElementById("tweet-form");
  const tweetInput = document.getElementById("tweet-content");
  const charCounter = document.getElementById("char-counter");
  const submitBtn = tweetForm.querySelector('button[type="submit"]');
  const tweetImageInput = document.getElementById("tweet-image-input");
  const tweetImageBtn = document.getElementById("tweet-image-btn");
  const tweetImageRemove = document.getElementById("tweet-image-remove");
  const tweetImageName = document.getElementById("tweet-image-name");
  const tweetImagePreview = document.getElementById("tweet-image-preview");
  const feedList = document.getElementById("feed-list");
  let tweetImageData = "";

  tweetForm.classList.toggle("hidden", !state.currentUser);

  function updateComposerState() {
    const len = tweetInput.value.trim().length;
    submitBtn.disabled = len === 0 && !tweetImageData;
    charCounter.textContent = `${len}/280`;
    charCounter.style.color = len >= 260 ? "#f4212e" : "";
  }

  function resetComposerImage() {
    tweetImageData = "";
    tweetImageInput.value = "";
    tweetImageName.textContent = "";
    tweetImagePreview.removeAttribute("src");
    tweetImagePreview.classList.add("hidden");
    tweetImageRemove.classList.add("hidden");
    updateComposerState();
  }

  tweetInput.addEventListener("input", updateComposerState);
  tweetImageBtn.addEventListener("click", () => tweetImageInput.click());
  tweetImageRemove.addEventListener("click", resetComposerImage);
  tweetImageInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetComposerImage();
      return;
    }
    try {
      tweetImageData = await fileToDataUrl(file);
      tweetImageName.textContent = file.name;
      tweetImagePreview.src = tweetImageData;
      tweetImagePreview.classList.remove("hidden");
      tweetImageRemove.classList.remove("hidden");
      updateComposerState();
    } catch {
      alert("Image trop lourde ou invalide. Essayez une image plus legere.");
      resetComposerImage();
    }
  });
  updateComposerState();

  tweetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = tweetInput.value.trim();
    if ((!content && !tweetImageData) || !state.currentUser) return;

    try {
      const created = await apiPost("/tweets", {
        userId: state.currentUser.id,
        content,
        image: tweetImageData || "",
        likes: 0,
        createdAt: new Date().toISOString(),
      });

      state.tweets.unshift(created);
      tweetInput.value = "";
      resetComposerImage();
      updateComposerState();
      renderTweets(feedList, state.tweets);
    } catch (error) {
      const apiDetails = error?.message ? `(${error.message})` : "";
      const details = tweetImageData ? "Essayez une image plus legere." : "Verifiez JSON Server.";
      alert(`Impossible de poster le tweet. ${details} ${apiDetails}`.trim());
    }
  });

  renderTweets(feedList, state.tweets);
  renderSuggestions();
  renderTrends();
}

function setSidebar(user) {
  document.getElementById("sidebar-name").textContent = user.name;
  document.getElementById("sidebar-handle").textContent = user.username;
  paintAvatar(document.getElementById("sidebar-avatar"), user);
  paintAvatar(document.getElementById("composer-avatar"), user);
}

function bindMainLayoutEvents() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;
      state.view = view;
      render();
    });
  });

  const sidebarPost = document.getElementById("sidebar-post");
  if (sidebarPost) {
    sidebarPost.addEventListener("click", () => {
      state.view = "home";
      render();
      const input = document.getElementById("tweet-content");
      input?.focus();
    });
  }

  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearCurrentUser();
      state.view = "home";
      render();
    });
  }

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.classList.contains("light");
      applyTheme(isLight ? "dark" : "light");
      render();
    });
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      if (state.view !== "home") return;
      state.searchText = event.target.value.toLowerCase().trim();
      const feedList = document.getElementById("feed-list");
      renderTweets(feedList, state.tweets);
    });
  }
}

function renderProfile() {
  if (!state.currentUser) {
    state.view = "home";
    render();
    return;
  }

  const profileHTML = document.getElementById("profile-template").innerHTML;
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">X</div>
        <nav class="nav-menu">${navLinksMarkup("profile")}</nav>
        <button id="sidebar-post" class="btn btn-primary btn-wide">Poster</button>
        <div class="user-chip">
          <div class="avatar" id="sidebar-avatar"></div>
          <div>
            <p id="sidebar-name"></p>
            <p id="sidebar-handle" class="muted"></p>
          </div>
        </div>
        <button id="logout-btn" class="btn btn-outline">Se deconnecter</button>
      </aside>
      <section>${profileHTML}</section>
      <aside class="right-panel"></aside>
    </div>
  `;

  setSidebar(state.currentUser);
  bindMainLayoutEvents();

  const user = state.currentUser;
  document.getElementById("profile-name").textContent = user.name;
  document.getElementById("profile-handle").textContent = user.username;
  document.getElementById("profile-bio").textContent = user.bio || "Bio non renseignee";

  paintCover(document.getElementById("profile-cover"), user);
  paintAvatar(document.getElementById("profile-avatar"), user);
  bindProfileMediaActions();

  const myTweets = state.tweets.filter((tweet) => Number(tweet.userId) === Number(user.id));
  document.getElementById("profile-stats").innerHTML = `
    <span>${myTweets.length} posts</span>
    <span>${state.tweets.length} tweets dans la timeline</span>
  `;
  renderTweets(document.getElementById("profile-tweets"), myTweets);
}

function bindProfileMediaActions() {
  const avatarInput = document.getElementById("avatar-input");
  const avatarChangeBtn = document.getElementById("avatar-change-btn");
  const avatarRemoveBtn = document.getElementById("avatar-remove-btn");
  const coverInput = document.getElementById("cover-input");
  const coverChangeBtn = document.getElementById("cover-change-btn");
  const coverRemoveBtn = document.getElementById("cover-remove-btn");

  avatarChangeBtn?.addEventListener("click", () => avatarInput?.click());
  coverChangeBtn?.addEventListener("click", () => coverInput?.click());

  avatarInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const avatarImage = await fileToDataUrl(file);
      await updateCurrentUserProfile({ avatarImage });
    } catch (error) {
      if (error?.message === "IMAGE_TOO_LARGE") {
        alert("Image trop lourde pour la photo de profil.");
      } else {
        alert("Impossible de modifier la photo de profil.");
      }
    } finally {
      avatarInput.value = "";
    }
  });

  coverInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const coverImage = await fileToDataUrl(file);
      await updateCurrentUserProfile({ coverImage });
    } catch (error) {
      if (error?.message === "IMAGE_TOO_LARGE") {
        alert("Image trop lourde pour la couverture.");
      } else {
        alert("Impossible de modifier la couverture.");
      }
    } finally {
      coverInput.value = "";
    }
  });

  avatarRemoveBtn?.addEventListener("click", async () => {
    try {
      await updateCurrentUserProfile({ avatarImage: "" });
    } catch {
      alert("Impossible de supprimer la photo de profil.");
    }
  });

  coverRemoveBtn?.addEventListener("click", async () => {
    try {
      await updateCurrentUserProfile({ coverImage: "" });
    } catch {
      alert("Impossible de supprimer la couverture.");
    }
  });
}

async function updateCurrentUserProfile(patch) {
  if (!state.currentUser) return;
  const updatedUser = await apiPatch(`/users/${state.currentUser.id}`, patch);
  const cleanUser = sanitizeUser(updatedUser);
  saveCurrentUser(cleanUser);
  state.users = state.users.map((user) =>
    Number(user.id) === Number(cleanUser.id) ? { ...user, ...updatedUser } : user
  );
  render();
}

function renderFeaturePage(viewId) {
  app.innerHTML = document.getElementById("app-template").innerHTML;
  setSidebar(state.currentUser);
  bindMainLayoutEvents();

  document.querySelector(".nav-link.active")?.classList.remove("active");
  document.querySelector(`.nav-link[data-view="${viewId}"]`)?.classList.add("active");

  const tweetForm = document.getElementById("tweet-form");
  const feedList = document.getElementById("feed-list");
  const tabs = document.querySelectorAll(".tab");
  const mainTitle = viewLabel(viewId);

  tweetForm?.classList.add("hidden");
  if (tabs[0]) tabs[0].textContent = mainTitle;
  if (tabs[1]) tabs[1].classList.add("hidden");

  feedList.innerHTML = `
    <section class="feature-placeholder">
      <h2>${mainTitle}</h2>
      <p class="muted">Cette section est prete. Vous pouvez maintenant y ajouter vos donnees et interactions.</p>
      <p>Idees de suite:</p>
      <ul>
        <li>Explorer: tendances, hashtags, recherche avancee.</li>
        <li>Notifications: likes, commentaires, abonnements.</li>
        <li>Messages: conversations privees.</li>
        <li>Signets: tweets sauvegardes.</li>
      </ul>
    </section>
  `;

  renderSuggestions();
  renderTrends();
}

function renderTweets(container, tweets) {
  if (state.apiDown) {
    container.innerHTML = `<p class="muted" style="padding:1rem">API indisponible. Lancez JSON Server sur ${API_BASE}.</p>`;
    return;
  }

  const filtered = tweets.filter((tweet) => {
    if (!state.searchText) return true;
    const author = authorByTweet(tweet);
    const haystack = `${tweet.content || ""} ${author.name || ""} ${author.username || ""}`.toLowerCase();
    return haystack.includes(state.searchText);
  });

  if (!filtered.length) {
    container.innerHTML = '<p class="muted" style="padding:1rem">Aucun tweet a afficher.</p>';
    return;
  }

  container.innerHTML = filtered
    .map((tweet) => {
      const author = authorByTweet(tweet);
      const likes = Number(tweet.likes || 0);
      const likedByMe = state.likedTweetIds.includes(String(tweet.id));
      const isOwner = Number(state.currentUser?.id) === Number(tweet.userId);

      return `
        <article class="tweet-item" data-id="${tweet.id}">
          ${avatarMarkup(author)}
          <div>
            <header>
              <strong>${escapeHtml(author.name)}</strong>
              <span class="tweet-meta">${escapeHtml(author.username || "@inconnu")}</span>
              <span class="tweet-meta">· ${relativeDate(tweet.createdAt)}</span>
            </header>
            <p>${escapeHtml(tweet.content || "")}</p>
            ${tweet.image ? `<img src="${escapeHtml(tweet.image)}" class="tweet-media" alt="Image du tweet" />` : ""}
            <div class="tweet-controls">
              <button class="icon-btn like-btn ${likedByMe ? "is-liked" : ""}" data-id="${tweet.id}">❤ ${likes}</button>
              ${
                isOwner
                  ? `<button class="icon-btn edit-btn" data-id="${tweet.id}">Modifier</button>
                     <button class="icon-btn delete-btn" data-id="${tweet.id}">Supprimer</button>`
                  : ""
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  container.querySelectorAll(".like-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const tweetId = button.dataset.id;
      const isLiked = state.likedTweetIds.includes(String(tweetId));
      const tweet = state.tweets.find((item) => String(item.id) === String(tweetId));
      if (!tweet) return;

      const nextLikes = Math.max(0, Number(tweet.likes || 0) + (isLiked ? -1 : 1));
      button.disabled = true;

      try {
        await apiPatch(`/tweets/${tweetId}`, { likes: nextLikes });
        tweet.likes = nextLikes;

        if (isLiked) {
          state.likedTweetIds = state.likedTweetIds.filter((id) => id !== String(tweetId));
        } else {
          state.likedTweetIds.push(String(tweetId));
        }
        saveLikedTweetIds();
        renderTweets(container, tweets);
      } catch {
        alert("Impossible de mettre a jour le like.");
      } finally {
        button.disabled = false;
      }
    });
  });

  container.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const tweetId = button.dataset.id;
      const tweet = state.tweets.find((item) => String(item.id) === String(tweetId));
      if (!tweet) return;

      const nextContent = prompt("Modifier votre tweet :", tweet.content || "");
      if (nextContent === null) return;

      const trimmed = nextContent.trim();
      if (!trimmed) {
        alert("Le tweet ne peut pas etre vide.");
        return;
      }
      if (trimmed.length > 280) {
        alert("Le tweet depasse 280 caracteres.");
        return;
      }

      button.disabled = true;
      try {
        await apiPatch(`/tweets/${tweetId}`, { content: trimmed });
        tweet.content = trimmed;
        renderTweets(container, tweets);
      } catch {
        alert("Impossible de modifier le tweet.");
      } finally {
        button.disabled = false;
      }
    });
  });

  container.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const tweetId = button.dataset.id;
      const confirmed = confirm("Supprimer ce tweet ?");
      if (!confirmed) return;

      button.disabled = true;
      try {
        await apiDelete(`/tweets/${tweetId}`);
        state.tweets = state.tweets.filter((item) => String(item.id) !== String(tweetId));
        state.likedTweetIds = state.likedTweetIds.filter((id) => id !== String(tweetId));
        saveLikedTweetIds();
        renderTweets(container, tweets.filter((item) => String(item.id) !== String(tweetId)));
      } catch {
        alert("Impossible de supprimer le tweet.");
      } finally {
        button.disabled = false;
      }
    });
  });
}

function renderSuggestions() {
  const list = document.getElementById("suggestions-list");
  if (!list) return;

  const suggestions = state.users
    .filter((user) => Number(user.id) !== Number(state.currentUser?.id))
    .slice(0, 3)
    .map((user) => `<li><strong>${escapeHtml(user.name)}</strong> <span class="muted">${escapeHtml(user.username || "")}</span></li>`)
    .join("");

  list.innerHTML = suggestions || '<li class="muted">Aucune suggestion.</li>';
}

function renderTrends() {
  const trends = ["Nairobi", "Le m23", "Le Rwanda", "AS Monaco", "Capstone 1"];
  const trendsList = document.getElementById("trends-list");
  if (!trendsList) return;

  trendsList.innerHTML = trends
    .map((trend, index) => `<li><p class="muted">Tendance</p><strong>${trend}</strong><p class="muted">${(index + 2) * 653} publications</p></li>`)
    .join("");
}

function authorByTweet(tweet) {
  const found = state.users.find((user) => Number(user.id) === Number(tweet.userId));
  if (!found && state.currentUser && Number(tweet.userId) === Number(state.currentUser.id)) {
    return state.currentUser;
  }
  return found || {
    name: "Utilisateur",
    username: "@unknown",
    avatarColor: "#4b5563",
  };
}

function avatarMarkup(user, extraClass = "") {
  const bg = user.avatarColor || randomAvatarColor();
  const imageMarkup = user.avatarImage
    ? `<img src="${escapeHtml(user.avatarImage)}" alt="Photo de profil" />`
    : escapeHtml(initials(user.name));
  return `<div class="avatar ${extraClass}" style="background:${bg}">${imageMarkup}</div>`;
}

function paintAvatar(target, user) {
  if (!target || !user) return;
  target.style.background = user.avatarColor || randomAvatarColor();
  if (user.avatarImage) {
    target.innerHTML = `<img src="${escapeHtml(user.avatarImage)}" alt="Photo de profil" />`;
  } else {
    target.textContent = initials(user.name);
  }
}

function paintCover(target, user) {
  if (!target || !user) return;
  if (user.coverImage) {
    target.innerHTML = `<img src="${escapeHtml(user.coverImage)}" alt="Photo de couverture" />`;
  } else {
    target.innerHTML = "";
  }
}

function fileToDataUrl(file) {
  if (!file.type.startsWith("image/")) {
    return readFileAsDataUrl(file);
  }

  return compressImageFile(file);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("FILE_READ_ERROR"));
    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file) {
  const sourceDataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(sourceDataUrl);

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  const biggestSide = Math.max(width, height);
  if (biggestSide > IMAGE_MAX_DIMENSION) {
    const ratio = IMAGE_MAX_DIMENSION / biggestSide;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("IMAGE_PROCESSING_ERROR");
  }
  ctx.drawImage(img, 0, 0, width, height);

  let quality = IMAGE_QUALITY_START;
  let output = canvas.toDataURL("image/jpeg", quality);
  while (dataUrlByteSize(output) > MAX_UPLOAD_BYTES && quality > 0.2) {
    quality -= 0.08;
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrlByteSize(output) > MAX_UPLOAD_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  return output;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_DECODE_ERROR"));
    img.src = src;
  });
}

function dataUrlByteSize(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function initials(name = "?") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function relativeDate(rawDate) {
  if (!rawDate) return "maintenant";
  const diffMs = Date.now() - new Date(rawDate).getTime();
  if (Number.isNaN(diffMs)) return "maintenant";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "maintenant";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
