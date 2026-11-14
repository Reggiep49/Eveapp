"use strict";

const stores = [
  { id: "target", name: "Target", mark: "target", detail: "Toys for everyday adventures" },
  { id: "lego", name: "LEGO Store", mark: "lego", detail: "Bricks and building sets" },
  { id: "books", name: "Barnes & Noble", mark: "book", detail: "Creative kits and discoveries" },
];

const gifts = [
  { id: "tiles", store: "lego", name: "Winter Castle Building Set", category: "Build & Play", age: "5+", price: 39.99,
    short: "Build towers, secret doors, and a castle of your own.",
    detail: "Stack colorful magnetic pieces to make your own winter castle. Build a tall tower, a tiny bridge, or a secret room for a friendly dragon.",
    inside: "48 magnetic pieces and a build guide",
    play: "Can you build a bridge wide enough for a toy reindeer?" },
  { id: "train", store: "target", name: "Little Timber Train", category: "Build & Play", age: "3+", price: 29.99,
    short: "A little wooden train for big imaginary journeys.",
    detail: "Hook the two carriages to the red engine, snap the wooden track together, and make up your own stops along the way.",
    inside: "1 engine, 2 magnetic carriages, and 12 track pieces",
    play: "Make a station out of blocks and give your train somewhere snowy to stop." },
  { id: "bunny", store: "target", name: "Marshmallow Bunny", category: "Cozy & Creative", age: "3+", price: 19.99,
    short: "A floppy-eared friend for stories and snuggles.",
    detail: "With velvety ears and a tiny pink scarf, this soft bunny is just the right size to tuck under your arm for story time.",
    inside: "One 12-inch plush bunny with a stitched scarf",
    play: "Pick a bedtime book and find a spot where your new friend can see the pictures." },
  { id: "telescope", store: "books", name: "Starlight Telescope", category: "Discover", age: "7+", price: 54.99,
    short: "Take a closer look at the Moon from your own backyard.",
    detail: "Set the tabletop tripod on a sturdy surface, find the Moon, and see how many different craters you can spot.",
    inside: "Starter telescope, tabletop tripod, and a Moon guide",
    play: "Draw the shape of the Moon tonight. Then see how it looks a week later." },
  { id: "art", store: "books", name: "Little Studio Watercolor Kit", category: "Cozy & Creative", age: "5+", price: 24.99,
    short: "Mix colors and paint a world all your own.",
    detail: "Open the little tin, dip a brush in water, and turn a blank page into a garden, a snowy village, or whatever you dream up.",
    inside: "12 colors, 2 brushes, and 10 watercolor sheets",
    play: "Try painting snow with a little blue and purple. What happens when the colors touch?" },
  { id: "truck", store: "target", name: "Trailblazer RC Truck", category: "Discover", age: "6+", price: 44.99,
    short: "Steer an off-road truck through your own obstacle course.",
    detail: "Big rubber tires help this bright little truck climb over cushions and rumble across rugs. The controller lets you steer in four directions.",
    inside: "RC truck, controller, and rechargeable truck battery",
    play: "Use cardboard and cushions to build a trail with a tunnel and a hill." },
];

const icons = {
  spark: '<path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8H8.5A2.5 2.5 0 1 1 11 5.5L12 8Zm0 0h3.5A2.5 2.5 0 1 0 13 5.5L12 8Z"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  heart: '<path d="M20.8 8.6c0 4.3-8.8 9.8-8.8 9.8S3.2 12.9 3.2 8.6a4.4 4.4 0 0 1 8.8-.2 4.4 4.4 0 0 1 8.8.2Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  lego: '<path d="M4 9h16v11H4zM7 9V5h4v4m2 0V5h4v4"/>',
  book: '<path d="M12 6v14m0-14c-3-3-7-2-9-2v14c4-1 7 0 9 2 2-2 5-3 9-2V4c-2 0-6-1-9 2Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1m-7 8v4m-3 0h6"/>',
  bag: '<path d="M4 8h16l1 13H3L4 8Zm5 0V6a3 3 0 0 1 6 0v2"/>',
};

const icon = (name, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const safe = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const storageKey = "santas-lookbook-v1";
const defaults = { name: "Charlie", stores: stores.map(({id}) => id), excluded: [], wishes: [], note: "", letter: null };
const app = document.getElementById("app");
const dialog = document.getElementById("dialog");
const status = document.getElementById("status");
let page = "parent";
let activeTrigger = null;
const parentPages = new Set(["parent", "setup", "inbox", "delivery"]);
let demoFinale = false;

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved ? { ...defaults, ...saved } : structuredClone(defaults);
  } catch {
    return structuredClone(defaults);
  }
}

const state = readState();

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    announce("Browser storage is unavailable. Your changes will last for this visit.");
  }
}

function announce(message) {
  status.textContent = message;
}

const name = () => safe(state.name.trim() || "Christmas explorer");
const eligible = () => gifts.filter((gift) => state.stores.includes(gift.store));
const curated = () => eligible().filter((gift) => !state.excluded.includes(gift.id));
const wished = () => curated().filter((gift) => state.wishes.includes(gift.id));
const plural = (count, word) => `${count} ${count === 1 ? word : word === "wish" ? "wishes" : `${word}s`}`;
const findGift = (id) => gifts.find((gift) => gift.id === id);
const thumbnail = (gift) => `<img src="assets/${gift.id}.webp" alt="" width="480" height="480">`;

function render({ focus = false } = {}) {
  const parent = parentPages.has(page);
  document.body.dataset.scene = page;
  document.body.dataset.mode = parent ? "parent" : "kid";
  const homeButton = document.getElementById("home-button");
  homeButton.dataset.action = parent || demoFinale ? "parent" : "book-cover";
  homeButton.setAttribute("aria-label", parent || demoFinale ? "Santa’s Lookbook home" : "Back to the toy book cover");
  const parentNav = (action, label, iconName, extra = "") => `<button class="header-button nav-${action}" type="button" data-action="${action}" ${page === action ? 'aria-current="page"' : ""}>${icon(iconName, 17)} <span>${label}</span>${extra}</button>`;
  document.getElementById("header-actions").innerHTML = parent
    ? `${parentNav("parent", "Overview", "spark")}${parentNav("setup", "Lookbook", "gift")}${parentNav("inbox", "Wish list", "mail", state.letter ? '<span class="inbox-dot" aria-hidden="true"></span>' : "")}${parentNav("delivery", "Deliveries", "bag")}<span class="nav-spacer"></span><span class="secure-session"><i aria-hidden="true"></i><span>Private prototype</span><small>Saved on this device</small></span>`
    : demoFinale ? `<button class="header-button" data-action="parent">${icon("back", 17)} Exit preview</button>` : `${page !== "sent" ? `<button class="header-button" type="button" data-action="wishes">${icon("heart", 19)} <span>Wish list</span><span class="pill-count">${wished().length}</span></button>` : ""}<button class="header-button sound-button" data-action="sound" aria-pressed="${soundEnabled}" aria-label="Holiday sound">${soundEnabled ? "♫" : "♪"}</button><button class="header-button grownup" type="button" data-action="parent-gate">${icon("lock", 16)} <span>Grown-ups</span></button>`;
  document.getElementById("footer").innerHTML = parent
    ? '<span>Santa’s Lookbook</span><span>Sample catalog · Settings and letters are saved in this browser</span>'
    : '<span>✦ &nbsp; Santa’s Lookbook &nbsp; ✦</span>';

  const views = { parent: parentHome, setup: parentView, inbox: inboxView, delivery: deliveryView, catalog: bookView, wishes: wishesView, letter: letterView, sent: sentView };
  stopCinema();
  app.innerHTML = views[page]();
  if (app.querySelector(".cinema")) mountCinema(app.querySelector(".cinema"), page);
  if (focus) {
    window.scrollTo({ top: 0, behavior: "instant" });
    app.querySelector("h1")?.focus({ preventScroll: true });
  }
}

const go = (next) => {
  if (dialog.open) dialog.close();
  dismissToast();
  page = next;
  if (next !== "sent") demoFinale = false;
  render({ focus: true });
};

function parentHome() {
  const letter = getLetter();
  const items = getItems(letter);
  const packages = allPackages();
  const active = packages.filter((item) => item.stage < 5).length;
  const delivered = packages.filter((item) => item.stage === 5).length;
  const listTotal = letter ? dollars(totalCents(items)) : "$0.00";
  const readiness = Math.min(100, 32 + curated().length * 8 + (letter ? 10 : 0) + (packages.length ? 10 : 0));
  return `<div class="native-screen native-home">
    <header class="app-topbar">
      <div><span class="window-eyebrow">Parent workspace</span><h1 id="home-title" tabindex="-1">Overview</h1></div>
      <div class="topbar-tools"><span class="sync-status"><i></i> All changes saved</span><span class="profile-avatar" aria-label="Parent profile">RP</span></div>
    </header>

    <section class="focus-card" aria-labelledby="focus-title">
      <div class="focus-copy">
        <span class="focus-label"><i></i> ${name()}’s lookbook is live</span>
        <h2 id="focus-title">Everything magical.<br><em>Nothing chaotic.</em></h2>
        <p>${plural(curated().length, "gift")} are ready inside an immersive Christmas toy book made just for ${name()}.</p>
        <div class="focus-actions">
          <button class="button primary" data-action="open-book" ${curated().length ? "" : "disabled"}>Open Kid Experience ${icon("arrow", 18)}</button>
          <button class="button quiet-button" data-action="setup">Edit lookbook</button>
        </div>
      </div>
      <button class="experience-preview" data-action="open-book" ${curated().length ? "" : "disabled"} aria-label="Open ${name()}’s kid experience">
        <img src="assets/village.webp" alt="" width="900" height="600">
        <span class="preview-glass"><span class="preview-play">▶</span><span><strong>Kid Experience</strong><small>Immersive toy book · ${plural(curated().length, "gift")}</small></span>${icon("arrow", 18)}</span>
      </button>
    </section>

    <section class="native-metrics" aria-label="Christmas overview">
      <button data-action="setup"><span class="metric-symbol cyan">${icon("gift", 20)}</span><span><small>Lookbook</small><strong>${curated().length} live</strong></span><em>${state.stores.length} sources</em></button>
      <button data-action="inbox"><span class="metric-symbol pink">${icon("heart", 20)}</span><span><small>Wish list</small><strong>${letter ? plural(items.length, "wish") : "Waiting"}</strong></span><em>${letter ? listTotal : "No letter yet"}</em></button>
      <button data-action="delivery"><span class="metric-symbol gold">${icon("bag", 20)}</span><span><small>Deliveries</small><strong>${packages.length ? `${active} active` : "Ready"}</strong></span><em>${delivered} delivered</em></button>
      <div class="readiness-card"><div class="mini-ring" style="--progress:${readiness}"><span>${readiness}%</span></div><span><small>Christmas readiness</small><strong>${readiness >= 80 ? "Nearly wrapped" : "Coming together"}</strong></span></div>
    </section>

    <div class="native-section-heading"><div><span>Workspace</span><h2>Pick up where you left off</h2></div><span class="section-note">Private prototype · Sample data</span></div>
    <section class="workspace-grid">
      <button class="workspace-card studio-card" data-action="setup">
        <span class="workspace-icon">${icon("gift", 24)}</span><span><small>Lookbook Studio</small><strong>Curate the catalog</strong><em>${plural(curated().length, "gift")} published</em></span>${icon("arrow", 18)}
      </button>
      <button class="workspace-card wishes-card" data-action="inbox">
        <span class="workspace-icon">${icon("mail", 24)}</span><span><small>Parent approval</small><strong>Review the wish list</strong><em>${letter ? `${listTotal} total` : "Waiting for Santa mail"}</em></span>${icon("arrow", 18)}
      </button>
      <button class="workspace-card delivery-card" data-action="delivery">
        <span class="workspace-icon">${icon("bag", 24)}</span><span><small>Delivery Center</small><strong>Track every package</strong><em>${packages.length ? `${plural(packages.length, "package")} across ${new Set(packages.map((item) => item.store)).size} stores` : "No orders placed"}</em></span>${icon("arrow", 18)}
      </button>
      <button class="workspace-card finale-card" data-action="demo-finale">
        <span class="workspace-icon">▶</span><span><small>Preview</small><strong>Watch the Santa finale</strong><em>See the letter take flight</em></span>${icon("arrow", 18)}
      </button>
    </section>
  </div>`;
}

function parentView() {
  const shown = curated();
  const options = eligible();
  return `<div class="native-screen parent-layout os-page">
    <header class="app-topbar">
      <div><span class="window-eyebrow">Create</span><h1 tabindex="-1">Lookbook Studio</h1><p>Shape exactly what ${name()} sees in Kid Mode.</p></div>
      <div class="topbar-tools"><span class="sync-status"><i></i> Auto-saved</span><button class="button primary topbar-launch" data-action="open-book" ${shown.length ? "" : "disabled"}>Preview ${icon("arrow", 16)}</button></div>
    </header>
    <div class="workflow-rail" aria-label="Lookbook setup progress"><span class="complete"><b>1</b> Profile</span><span class="complete"><b>2</b> Sources</span><span class="active"><b>3</b> Curate</span><span><b>4</b> Preview</span></div>
    <div class="parent-grid">
      <div class="settings">
        <section class="panel parent-module setup-module" aria-labelledby="setup-title">
          <div class="module-code"><span>Profile &amp; sources</span><i>Step 1</i></div>
          <div class="section-title"><span class="section-icon">${icon("bag", 21)}</span><div>
            <h2 id="setup-title">Personalize the experience</h2>
            <p>Set the name Pip will use and choose the sample retailers feeding the book.</p>
          </div></div>
          <label class="field-label" for="child-name">Child’s first name</label>
          <input type="text" id="child-name" maxlength="32" value="${safe(state.name)}" placeholder="e.g. Charlie" autocomplete="off">
          <fieldset class="store-field">
            <legend>Sample stores</legend>
            <div class="store-grid">${stores.map((store) => `
              <label class="store-option store-${store.id}">
                <input type="checkbox" data-store="${store.id}" aria-label="${store.name}" ${state.stores.includes(store.id) ? "checked" : ""}>
                <span class="store-tick">${icon("check", 13)}</span>
                <span class="store-mark">${icon(store.mark, 22)}</span>
                <strong>${store.name}</strong>
                <small>${store.detail}</small>
              </label>`).join("")}</div>
          </fieldset>
        </section>
        <section class="panel curate parent-module" aria-labelledby="curate-title">
          <div class="module-code"><span>Gift catalog</span><i>Step 2</i></div>
          <div class="section-title"><span class="section-icon rose">${icon("gift", 22)}</span><div>
            <h2 id="curate-title">Publish gift ideas</h2>
            <p>Switch gifts on or off before they enter the child experience. Prices are illustrative.</p>
          </div></div>
          ${options.length ? `<div class="curation-grid">${options.map((gift) => `
            <label class="curation-option">
              ${thumbnail(gift)}
              <span class="curation-copy"><strong>${gift.name}</strong><small>${money.format(gift.price)} · Ages ${gift.age}</small></span>
              <input type="checkbox" data-gift="${gift.id}" aria-label="Include ${gift.name}" ${shown.includes(gift) ? "checked" : ""}>
            </label>`).join("")}</div>` : '<p class="inline-empty">Choose a store to see its gift ideas.</p>'}
        </section>
      </div>
      <aside class="preview os-preview">
        <div class="preview-status"><span><i></i> Live preview</span><span>${plural(shown.length, "item")} published</span></div>
        <img class="preview-image" src="assets/village.webp" alt="A snowy North Pole village with glowing toy shops and a giant Christmas tree" width="900" height="600">
        <div class="preview-body">
          <span class="eyebrow gold">Kid Experience</span>
          <h2>The North Pole<br>is waiting.</h2>
          <p>Pip will welcome ${state.name.trim() ? '<span id="preview-name">' + name() + "</span>" : '<span id="preview-name">your child</span>'} with a toy book full of the gifts you picked.</p>
          <div class="preview-meta"><span>${icon("gift", 17)} ${plural(shown.length, "gift")}</span><span>3D views</span><span>Santa finale</span></div>
          <button class="button primary wide" data-action="open-book" ${shown.length ? "" : "disabled"}>Launch Kid Experience ${icon("arrow", 18)}</button>
          ${shown.length ? "" : '<small class="disabled-help">Include at least one gift to open the book.</small>'}
        </div>
      </aside>
    </div>
  </div>`;
}

function wishesView() {
  const selected = wished();
  return `<div class="container kid-container narrow">
    <button class="text-button" data-action="catalog">${icon("back", 18)} Back to the lookbook</button>
    <div class="kid-heading compact"><span class="eyebrow gold">✦ &nbsp; Your favorites</span><h1 tabindex="-1">My Christmas wishes</h1>
      <p>${selected.length ? "These are the gifts you’ll put in your letter to Santa." : "Explore a toy in the book and add it to your list."}</p></div>
    ${selected.length ? `<div class="wish-list">${selected.map((gift) => `<div class="wish-row">
      ${thumbnail(gift)}<strong>${gift.name}</strong>
      <button class="button outline small" type="button" data-action="wish" data-id="${gift.id}" aria-label="Remove ${gift.name}">Remove</button>
      </div>`).join("")}</div>
      <div class="catalog-bottom"><button class="button gold-button" data-action="letter">Write to Santa ${icon("arrow", 18)}</button></div>`
    : `<div class="empty-wishes">${icon("heart", 38)}<button class="button gold-button" data-action="catalog">Explore gifts ${icon("arrow", 18)}</button></div>`}
  </div>`;
}

function letterView() {
  return `<div class="container kid-container narrow">
    <button class="text-button" data-action="wishes">${icon("back", 18)} Back to my wishes</button>
    <div class="kid-heading compact"><span class="eyebrow gold">✦ &nbsp; North Pole post</span><h1 tabindex="-1">A letter to Santa</h1>
      <p>Add a little note or seal the letter with just your wishes.</p></div>
    <form class="letter-paper" id="letter-form">
      <span class="stamp" aria-hidden="true">✦</span>
      <label class="salutation" for="note">Dear Santa,</label>
      <textarea id="note" maxlength="500" rows="4" placeholder="Tell Santa something you’re excited about this Christmas.">${safe(state.note)}</textarea>
      <button type="button" class="button outline small" data-action="dictate" aria-describedby="dictation-help">${icon("mic", 16)} Try sample dictation</button>
      <small class="dictation-help" id="dictation-help">Fills in an editable example. No microphone needed.</small>
      <p class="signoff">Love, <em>${name()}</em></p>
      <div class="letter-wishes">${icon("gift", 17)} ${wished().length} ${wished().length === 1 ? "wish" : "wishes"} tucked inside</div>
      <button class="button primary wide" type="submit">Seal my letter ${icon("mail", 18)}</button>
    </form>
  </div>`;
}

function sentView() {
  return `<section class="cinema cinema-finale" aria-labelledby="finale-title">
    ${cinemaLayers("launch")}
    <div class="finale-flare" aria-hidden="true"></div>
    <div class="finale-envelope" aria-hidden="true">${icon("mail", 34)}<span>✦</span></div>
    <div class="finale-progress"><span data-finale-line>North Pole mailroom · Launching letter</span><span class="finale-meter" aria-hidden="true"></span></div>
    <button class="header-button finale-skip" data-action="skip-finale">Skip animation</button>
    <div class="cinema-caption finale-caption">
      <span class="scene-label"><i></i> ${demoFinale ? "SLEIGH FLIGHT PREVIEW" : "DELIVERY CONFIRMED · NORTH POLE"}</span>
      <h1 id="finale-title" tabindex="-1">${demoFinale ? "Special delivery<br><em>for Santa.</em>" : `Santa got it,<br><em>${name()}.</em>`}</h1>
      <p>${demoFinale ? "This is the flight kids see when they seal their wish list." : "Your letter caught a ride with Santa’s sleigh. Your grown-up has a copy, too."}</p>
      <div class="finale-actions"><button class="button gold-button" data-action="${demoFinale ? "parent" : "parent-gate"}">${demoFinale ? "Back to the lookbook" : "Back to my grown-up"} ${icon("arrow", 19)}</button>
      <button class="header-button" data-action="replay-finale">Replay the flight</button></div>
    </div>
  </section>`;
}

function modalShell(content, type) {
  dialog.className = type;
  dialog.innerHTML = `<button class="dialog-close" data-action="close" aria-label="Close dialog">${icon("close", 23)}</button>${content}`;
  if (!dialog.open) {
    activeTrigger = document.activeElement;
    dialog.showModal();
  }
}

function showDetails(gift) {
  if (!gift || !curated().includes(gift)) return;
  modalShell(`<div class="toy-stage">
      <canvas class="gift-model" role="img" aria-label="Interactive 3D model of ${gift.name}"></canvas>
      <div class="toy-stage-meta">
        <span data-model-instructions>Drag to spin</span>
        <div class="toy-model-controls" role="group" aria-label="Move the 3D toy">
          <button type="button" data-action="inspect-left" aria-label="Rotate left">↶</button>
          <button type="button" data-action="inspect-turn" aria-label="Rotate right">↷</button>
          <button type="button" data-action="inspect-zoom" aria-label="Zoom in" aria-pressed="false">+</button>
          <button type="button" data-action="inspect-reset" aria-label="Reset view">⟲</button>
        </div>
      </div>
    </div>
    <div class="detail-copy">
      <span class="eyebrow category">${gift.category} · Ages ${gift.age}</span>
      <h2 id="dialog-title">${gift.name}</h2>
      <p>${gift.detail}</p>
      <details class="play-idea"><summary>Pip’s play idea</summary><p>${gift.play}</p></details>
      <button class="button gold-button wide detail-wish" data-action="wish" data-id="${gift.id}" aria-pressed="${state.wishes.includes(gift.id)}">${wishLabel(gift)}</button>
    </div>`, "detail-dialog toy-dialog");
  giftModel = mountGiftModel(dialog.querySelector("canvas"), gift.id);
  if (!giftModel) {
    const stage = dialog.querySelector(".toy-stage");
    stage.innerHTML = thumbnail(gift) + '<p class="model-fallback">The 3D preview is unavailable in this browser.</p>';
  }
}

const wishLabel = (gift) => state.wishes.includes(gift.id)
  ? `${icon("check", 18)} On my list`
  : `${icon("heart", 19)} Add to my list`;

function showParentGate() {
  modalShell(`<div class="message-dialog">
    <span class="section-icon">${icon("lock", 22)}</span><h2 id="dialog-title">Back to Parent Mode?</h2>
    <p>Your gift picks and letter draft are saved.</p>
    <div class="modal-actions"><button class="button outline" data-action="close">Keep exploring</button>
    <button class="button primary" data-action="${state.letter ? "inbox" : "parent"}">Go to Parent Mode ${icon("arrow", 18)}</button></div>
  </div>`, "gate-dialog");
}

function toggleWish(id, button) {
  const gift = findGift(id);
  if (!curated().includes(gift)) return;
  const selected = state.wishes.includes(id);
  state.wishes = selected ? state.wishes.filter((wish) => wish !== id) : [...state.wishes, id];
  save();
  announce(`${gift.name} ${selected ? "removed from" : "added to"} your wish list.`);

  if (page === "wishes") {
    render();
    (app.querySelector(".wish-row button") || app.querySelector(".empty-wishes button"))?.focus();
    return;
  }
  document.querySelectorAll(".pill-count").forEach((count) => { count.textContent = wished().length; });
  markBookToy(gift, !selected);
  if (!selected) playHoliday("select");
  if (button.classList.contains("detail-wish")) {
    button.setAttribute("aria-pressed", String(!selected));
    button.innerHTML = wishLabel(gift);
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    if (event.target === dialog) dialog.close();
    return;
  }

  const { action, id } = button.dataset;
  switch (action) {
    case "open-book":
      if (!curated().length) return;
      bookIndex = 0;
      go("catalog");
      break;
    case "book-cover": bookIndex = 0; go("catalog"); break;
    case "book-turn": turnBook(Number(button.dataset.direction)); break;
    case "sound": toggleAudio(button); break;
    case "skip-finale": finishFinale(true); break;
    case "replay-finale": playHoliday("send", true); go("sent"); break;
    case "inspect-left":
    case "inspect-turn":
    case "inspect-zoom":
    case "inspect-reset": inspectGift(action); break;
    case "catalog": go("catalog"); break;
    case "detail": showDetails(findGift(id)); break;
    case "wish": toggleWish(id, button); break;
    case "wishes": go("wishes"); break;
    case "letter": if (wished().length) go("letter"); break;
    case "parent-gate": showParentGate(); break;
    case "parent": go("parent"); break;
    case "setup": go("setup"); break;
    case "demo-finale":
      demoFinale = true;
      playHoliday("send", true);
      go("sent");
      break;
    case "inbox": go("inbox"); break;
    case "delivery": go("delivery"); break;
    case "demo-letter": showSampleLetter(); break;
    case "demo-card": readyPayment(); break;
    case "demo-order": placeOrder(); break;
    case "demo-email": importSampleMail(); break;
    case "download-receipts": downloadReceipts(); break;
    case "advance-delivery": advanceDeliveries(); break;
    case "delivery-filter": filterDeliveries(button); break;
    case "delivery-details": showPackage(id); break;
    case "close": dialog.close(); break;
    case "dictate": {
      const note = document.getElementById("note");
      const sample = "I’m excited to make cookies with my family and leave a carrot for the reindeer!";
      if (!note.value.includes(sample) && note.value.trim().length < 500) {
        const previous = note.value.trim();
        const addition = previous ? `\n${sample}` : sample;
        if (previous.length + addition.length <= 500) {
          note.value = previous + addition;
          state.note = note.value;
          save();
          announce("Sample dictation added. You can edit it.");
        } else {
          announce("There isn’t room for the sample. You can edit your note below.");
        }
      }
      note.focus();
      note.setSelectionRange(note.value.length, note.value.length);
      break;
    }
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "child-name") {
    state.name = event.target.value;
    document.getElementById("preview-name").textContent = state.name.trim() || "your child";
    save();
  }
  if (event.target.id === "note") {
    state.note = event.target.value;
    save();
  }
});

document.addEventListener("change", (event) => {
  const input = event.target;
  const { store, gift } = input.dataset;
  if (input.matches("[data-cart]")) {
    changeCart(input);
    return;
  }
  if (input.matches("[data-notices]")) {
    commerce.notices = input.checked;
    saveCommerce();
    if (input.checked) flash("Delivery alerts enabled for this demo.");
    return;
  }
  if (!store && !gift) return;
  if (store) state.stores = input.checked ? [...state.stores, store] : state.stores.filter((id) => id !== store);
  if (gift) state.excluded = input.checked ? state.excluded.filter((id) => id !== gift) : [...state.excluded, gift];
  save();
  render();
  app.querySelector(store ? `[data-store="${store}"]` : `[data-gift="${gift}"]`)?.focus();
  announce(`${plural(curated().length, "gift")} in the lookbook.`);
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "letter-form") return;
  event.preventDefault();
  const selected = wished();
  if (!selected.length) {
    go("wishes");
    return;
  }
  demoFinale = false;
  playHoliday("send", true);
  state.letter = { id: Date.now(), name: state.name.trim() || "Christmas explorer", note: state.note.trim(), gifts: selected.map(({id}) => id) };
  save();
  go("sent");
});

dialog.addEventListener("close", () => {
  giftModel?.close();
  giftModel = null;
  if (activeTrigger?.isConnected) activeTrigger.focus();
  activeTrigger = null;
});
