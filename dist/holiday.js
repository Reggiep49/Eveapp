"use strict";

const commerceKey = "santas-lookbook-parents-v2";
const commerceDefaults = { sample: null, carts: {}, payment: false, orders: [], notices: true, activity: [] };
const commerce = loadCommerce();
let deliveryFilter = "all";
let toastTimer;

const shipmentStates = [
  { name: "Order placed", tone: "neutral", description: "The store is getting your order ready." },
  { name: "Shipped", tone: "blue", description: "The carrier picked up the package." },
  { name: "Delayed", tone: "amber", description: "Weather delayed the package by two days." },
  { name: "Arrives tomorrow", tone: "blue", description: "The package is one day away." },
  { name: "Out for delivery", tone: "green", description: "The package is on its way to your door today." },
  { name: "Delivered", tone: "green", description: "The carrier marked the package delivered." },
];

const routeByStore = {
  target: { carrier: "UPS", days: 3 },
  lego: { carrier: "FedEx", days: 4 },
  books: { carrier: "USPS", days: 5 },
};

function loadCommerce() {
  try {
    return { ...structuredClone(commerceDefaults), ...JSON.parse(localStorage.getItem(commerceKey)) };
  } catch {
    return structuredClone(commerceDefaults);
  }
}

function saveCommerce() {
  try {
    localStorage.setItem(commerceKey, JSON.stringify(commerce));
  } catch {
    announce("Browser storage is unavailable. Your changes will last for this visit.");
  }
}

const getStore = (id) => stores.find((store) => store.id === id);
const getLetter = () => state.letter || commerce.sample;
const letterKey = (letter) => String(letter.id ?? "first-letter");
const getItems = (letter) => letter?.gifts.map(findGift).filter(Boolean) || [];
const cents = (price) => Math.round(price * 100);
const totalCents = (items) => items.reduce((sum, item) => sum + cents(item.price), 0);
const dollars = (amount) => money.format(amount / 100);
const getOrder = (letter) => letter && commerce.orders.find((order) => order.letterId === letterKey(letter));
const selectedItems = (letter) => getItems(letter).filter((item) => !(commerce.carts[letterKey(letter)] || []).includes(item.id));
const allPackages = () => commerce.orders.flatMap((order) => order.packages);
const prettyDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function offsetDate(date, days) {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  const [year, month, day] = [next.getFullYear(), next.getMonth() + 1, next.getDate()];
  return [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
}

function parentBanner(section, title, description) {
  return `<header class="app-topbar command-heading os-command-heading">
    <div><span class="window-eyebrow">${section}</span><h1 tabindex="-1">${title}</h1><p>${description}</p></div>
    <div class="topbar-tools"><span class="sync-status"><i></i> Private demo</span><span class="profile-avatar" aria-label="Parent profile">RP</span></div>
  </header>`;
}

function inboxView() {
  const letter = getLetter();
  const items = getItems(letter);
  const picks = letter ? selectedItems(letter) : [];
  const order = getOrder(letter);
  return `<div class="container command-layout">
    ${parentBanner("Parent inbox", "The Christmas wish list", "See what they wished for and decide what makes it under the tree.")}
    ${!letter ? `<section class="panel command-empty parent-module">
      <div class="module-code"><span>Santa mail</span><i>Waiting</i></div>
      <span class="section-icon rose">${icon("mail", 24)}</span><h2>The first letter is on its way</h2>
      <p>When a child seals their letter, you’ll see their note, gifts, and the estimated total here.</p>
      <button class="button primary" data-action="demo-letter">Load a sample wish list ${icon("arrow", 18)}</button>
      <button class="button outline" data-action="setup">Back to lookbook setup</button>
    </section>` : `<div class="command-grid inbox-grid">
    <section class="panel basket parent-module">
      <div class="module-code"><span>Wish list</span><i>${letter.id === "sample" ? "Sample letter" : "Received"}</i></div>
      <div class="section-title"><span class="section-icon rose">${icon("mail", 22)}</span><div><h2>${safe(letter.name)}’s letter to Santa</h2><p>${plural(items.length, "gift")} on the original list${letter.id === "sample" ? " · Sample letter" : ""}</p></div></div>
      ${letter.note ? `<p class="received-letter">${safe(letter.note)}</p>` : ""}
      <div class="basket-list">${items.map((item) => `<label class="basket-row">
        ${thumbnail(item)}<span><strong>${item.name}</strong><small>${getStore(item.store).name}</small></span>
        <strong>${money.format(item.price)}</strong>
        <input data-cart="${item.id}" type="checkbox" aria-label="Buy ${item.name}" ${picks.includes(item) ? "checked" : ""} ${order ? "disabled" : ""}>
      </label>`).join("")}</div>
      <small class="command-help">Clear a checkbox to leave a gift out of this order. The original letter stays intact.</small>
    </section>
    <aside class="panel order-card checkout-module">
      <div class="module-code"><span>Order summary</span><i>${order ? "Complete" : "Ready"}</i></div>
      <span class="eyebrow order-caption">${order ? "Demo order placed" : "Total approved"}</span>
      <h2>${dollars(order?.total ?? totalCents(picks))}</h2>
      <p>${plural(order?.items.length ?? picks.length, "gift")} ${order ? "ordered" : "selected"} · ${dollars(totalCents(items))} for all wishes</p>
      <div class="payment-row"><span class="payment-icon" aria-hidden="true">▱</span><div>
        <strong>${commerce.payment ? "Demo card •••• 4242" : "Payment method"}</strong><small>${commerce.payment ? "Ready for demo checkout" : "Use a sample card to try checkout"}</small></div>
      ${commerce.payment || order ? "" : '<button class="button outline small" data-action="demo-card">Use demo card</button>'}</div>
      ${order
        ? `<button class="button primary wide" data-action="delivery">Track my packages ${icon("arrow", 18)}</button>`
        : `<button class="button primary wide" data-action="demo-order" ${picks.length && commerce.payment ? "" : "disabled"}>Place demo order · ${dollars(totalCents(picks))}</button>`}
      <div class="checkout-safety"><i></i><span>Protected demo checkout</span><strong>No real charge</strong></div>
      <small class="command-help">Sample prices. Tax and shipping are excluded. The demo never charges a card or sends an order to a store.</small>
    </aside></div>`}
  </div>`;
}

function showSampleLetter() {
  if (!commerce.sample) {
    commerce.sample = { id: "sample", name: "Charlie", note: "Dear Santa, I’d love a toy we can all play with on Christmas morning!", gifts: ["tiles", "bunny", "telescope", "art"] };
    saveCommerce();
  }
  go("inbox");
}

function changeCart(input) {
  const letter = getLetter();
  if (!letter || getOrder(letter) || !letter.gifts.includes(input.dataset.cart)) return;
  const key = letterKey(letter);
  const id = input.dataset.cart;
  const excluded = commerce.carts[key] || [];
  commerce.carts[key] = input.checked ? excluded.filter((item) => item !== id) : [...excluded, id];
  saveCommerce();
  render();
  app.querySelector(`[data-cart="${id}"]`)?.focus();
  announce(`Order total ${dollars(totalCents(selectedItems(letter)))}.`);
}

function readyPayment() {
  commerce.payment = true;
  saveCommerce();
  render();
  app.querySelector('[data-action="demo-order"]:enabled')?.focus();
  flash("Demo card ready.");
}

function placeOrder() {
  const letter = getLetter();
  if (!letter || !commerce.payment || getOrder(letter)) return;
  const picks = selectedItems(letter);
  if (!picks.length) return;
  const id = `NP-${String(commerce.orders.length + 1).padStart(4, "0")}`;
  const now = new Date();
  const packages = stores.filter((store) => picks.some((item) => item.store === store.id)).map((store, index) => {
    const items = picks.filter((item) => item.store === store.id);
    const route = routeByStore[store.id];
    return { id: `${id}-${index + 1}`, order: id, store: store.id, items: items.map((item) => item.id), total: totalCents(items),
      originalEta: offsetDate(now, route.days), eta: offsetDate(now, route.days), carrier: route.carrier, stage: 0,
      tracking: "", receipt: "", history: [{ stage: 0, date: offsetDate(now, 0) }] };
  });
  commerce.orders.push({ id, letterId: letterKey(letter), date: offsetDate(now, 0), items: picks.map((item) => item.id), total: totalCents(picks), packages });
  saveCommerce();
  deliveryFilter = "all";
  go("delivery");
  flash(`${id} placed. ${plural(packages.length, "package")} added to your dashboard.`);
}

function dismissToast() {
  clearTimeout(toastTimer);
  document.getElementById("toast").classList.remove("visible");
}

function flash(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 4200);
}

function makeSampleEmails() {
  return commerce.orders.flatMap((order) => order.packages.flatMap((pkg) => [
    `Subject: Receipt from ${getStore(pkg.store).name}\nPackage: ${pkg.id}\nReceipt: R-${pkg.id}\nAmount: ${(pkg.total / 100).toFixed(2)}\nDate: ${order.date}`,
    ...(pkg.stage > 0 ? [`Subject: Shipping confirmation\nPackage: ${pkg.id}\nCarrier: ${pkg.carrier}\nTracking: DEMO-${pkg.id}\nEstimated delivery: ${pkg.eta}`] : []),
  ]));
}

function extractSampleMail(messages) {
  const packages = new Map(allPackages().map((pkg) => [pkg.id, pkg]));
  let imported = 0;
  for (const message of messages) {
    const fields = Object.fromEntries(message.split("\n").map((line) => {
      const split = line.indexOf(": ");
      return [line.slice(0, split), line.slice(split + 2)];
    }));
    const pkg = packages.get(fields.Package);
    if (!pkg) continue;
    if (fields.Receipt && pkg.receipt !== fields.Receipt) {
      pkg.receipt = fields.Receipt;
      pkg.receiptDate = fields.Date;
      pkg.receiptTotal = cents(Number(fields.Amount));
      imported++;
    }
    if (fields.Tracking && pkg.tracking !== fields.Tracking) {
      pkg.tracking = fields.Tracking;
      pkg.carrier = fields.Carrier;
      imported++;
    }
    if (fields["Estimated delivery"]) pkg.eta = fields["Estimated delivery"];
  }
  return imported;
}

function importSampleMail() {
  if (!commerce.orders.length) return;
  const imported = extractSampleMail(makeSampleEmails());
  saveCommerce();
  render();
  app.querySelector('[data-action="demo-email"]')?.focus();
  flash(imported ? `${plural(imported, "sample email")} processed.` : "Sample inbox is up to date.");
}

function advanceDeliveries() {
  const packages = allPackages().filter((pkg) => pkg.stage < shipmentStates.length - 1);
  if (!packages.length) return;
  for (const pkg of packages) {
    const special = pkg.store === "lego" || pkg.store === "books" || allPackages().length === 1;
    pkg.stage += pkg.stage === 1 && !special ? 2 : 1;
    const current = new Date(pkg.eta + "T12:00:00");
    if (pkg.stage === 2) pkg.eta = offsetDate(current, 2);
    const eventDate = pkg.stage === 1
      ? offsetDate(new Date(pkg.history[0].date + "T12:00:00"), 1)
      : offsetDate(new Date(pkg.eta + "T12:00:00"), pkg.stage === 2 ? -3 : pkg.stage === 3 ? -1 : 0);
    pkg.history.push({ stage: pkg.stage, date: eventDate });
    if (commerce.notices) {
      commerce.activity.unshift({ store: pkg.store, stage: pkg.stage, id: pkg.id, date: eventDate });
    }
  }
  extractSampleMail(makeSampleEmails());
  saveCommerce();
  render();
  (app.querySelector('[data-action="advance-delivery"]:enabled') || app.querySelector("h1"))?.focus();
  flash(commerce.notices ? `${plural(packages.length, "delivery update")} · ${shipmentStates[packages[0].stage].name}` : "Package statuses updated.");
}

function filterDeliveries(button) {
  deliveryFilter = button.dataset.filter;
  render();
  app.querySelector(`[data-filter="${deliveryFilter}"]`)?.focus();
}

function deliveryView() {
  const packages = allPackages();
  const delivered = packages.filter((pkg) => pkg.stage === 5).length;
  const delayed = packages.filter((pkg) => pkg.stage === 2).length;
  const receipts = packages.filter((pkg) => pkg.receipt).length;
  const visible = packages.filter((pkg) => deliveryFilter === "all"
    || (deliveryFilter === "active" && pkg.stage < 5)
    || (deliveryFilter === "delayed" && pkg.stage === 2)
    || (deliveryFilter === "delivered" && pkg.stage === 5));
  const filters = [{id:"all", label:"All packages"},{id:"active",label:"In progress"},{id:"delayed",label:"Delayed"},{id:"delivered",label:"Delivered"}];
  return `<div class="container command-layout">
    ${parentBanner("Holiday dashboard", "Christmas deliveries", "Track packages from each store, catch delays, and keep your receipts together.")}
    ${packages.length ? `
      <div class="delivery-metrics">
        <div class="metric"><span>Packages</span><strong>${packages.length}</strong><i style="--meter:100%"></i></div>
        <div class="metric"><span>In progress</span><strong>${packages.length - delivered}</strong><i style="--meter:${packages.length ? Math.round(((packages.length - delivered) / packages.length) * 100) : 0}%"></i></div>
        <div class="metric alert-metric"><span>Delayed</span><strong>${delayed}</strong><i style="--meter:${packages.length ? Math.round((delayed / packages.length) * 100) : 0}%"></i></div>
        <div class="metric success-metric"><span>Delivered</span><strong>${delivered}</strong><i style="--meter:${packages.length ? Math.round((delivered / packages.length) * 100) : 0}%"></i></div>
      </div>
      <div class="command-grid delivery-grid">
        <section class="panel shipment-panel parent-module">
          <div class="module-code"><span>Package activity</span><i>Live simulation</i></div>
          <div class="shipment-head"><div><h2>Package tracker</h2><small>Demo shipments · Advance to preview delivery events</small></div>
          <button class="button primary small" data-action="advance-delivery" ${packages.length !== delivered ? "" : "disabled"}>Advance demo day ${icon("arrow", 16)}</button></div>
          <div class="delivery-filters" role="group" aria-label="Filter packages">${filters.map((filter) => `<button class="button outline small" data-action="delivery-filter" data-filter="${filter.id}" aria-pressed="${deliveryFilter === filter.id}">${filter.label}</button>`).join("")}</div>
          <div class="package-list">${visible.length ? visible.map(packageCard).join("") : '<p class="inline-empty">No packages match this filter.</p>'}</div>
        </section>
        <aside class="delivery-side">
          <section class="panel assist-card agent-card"><div class="module-code"><span>Email assistant</span><i>Simulation</i></div><span class="section-icon">${icon("mail", 22)}</span><h2>Receipt intelligence</h2>
            <p>Run a sample inbox to extract receipts and tracking details. ${plural(receipts, "receipt")} found.</p>
            <button class="button primary wide" data-action="demo-email">Scan sample inbox</button>
            <button class="button outline wide" data-action="download-receipts" ${receipts ? "" : "disabled"}>Download receipts by store</button>
            <small class="command-help">Uses generated sample emails. You can preview the workflow without signing into email.</small>
          </section>
          <section class="panel assist-card alert-card"><div class="module-code"><span>Notifications</span><i>${commerce.notices ? "On" : "Paused"}</i></div><span class="section-icon rose">${icon("spark", 22)}</span><h2>Delivery alerts</h2>
            <label class="alerts-toggle"><input type="checkbox" data-notices ${commerce.notices ? "checked" : ""}> Show alerts in this demo</label>
            <small class="command-help">Preview shipped, delayed, tomorrow, and arrival alerts here.</small>
            ${commerce.activity.length ? `<ul class="alert-list">${commerce.activity.slice(0, 6).map((alert) => `<li><strong>${shipmentStates[alert.stage].name}</strong><small>${getStore(alert.store).name} · ${prettyDate(alert.date)}</small></li>`).join("")}</ul>` : "<p>Updates will appear as packages move.</p>"}
          </section>
        </aside>
      </div>`
    : `<section class="panel command-empty parent-module"><div class="module-code"><span>Package activity</span><i>Waiting</i></div><span class="section-icon">${icon("bag", 24)}</span><h2>No packages yet</h2><p>Place a demo order from the parent inbox to start tracking it here.</p><button class="button primary" data-action="inbox">Open parent inbox ${icon("arrow", 18)}</button></section>`}
  </div>`;
}

function packageCard(pkg) {
  const shop = getStore(pkg.store);
  const stage = shipmentStates[pkg.stage];
  return `<article class="package-card"><div class="package-top"><div><strong>${shop.name}</strong><small>${pkg.carrier} · ${pkg.tracking || pkg.order}</small></div><span class="ship-badge ${stage.tone}">${stage.name}</span></div>
    <div class="route-progress" style="--route:${Math.max(8, (pkg.stage / 5) * 100)}%" aria-hidden="true"><i></i><span></span></div>
    <div class="package-bottom"><span><strong>${pkg.stage === 5 ? "Delivered" : "Estimated delivery"}</strong><small>${prettyDate(pkg.eta)}${pkg.eta !== pkg.originalEta && pkg.stage < 5 ? ` <s>${prettyDate(pkg.originalEta)}</s>` : ""}</small></span>
    <button class="button outline small" data-action="delivery-details" data-id="${pkg.id}" aria-label="View tracking for ${shop.name} ${pkg.id}">View tracking</button></div>
    </article>`;
}

function showPackage(id) {
  const pkg = allPackages().find((item) => item.id === id);
  if (!pkg) return;
  modalShell(`<div class="message-dialog"><span class="section-icon">${icon("bag", 22)}</span>
    <h2 id="dialog-title">${getStore(pkg.store).name} package</h2>
    <p>${pkg.carrier} · ${pkg.tracking || "Tracking pending"}</p><p>${pkg.items.map(findGift).map((item) => item.name).join(", ")}</p>
    <ol class="track-timeline">${[...pkg.history].reverse().map(({ stage, date }) => `<li><strong>${shipmentStates[stage].name}</strong><span>${prettyDate(date)} · ${shipmentStates[stage].description}</span></li>`).join("")}</ol>
    <button class="button primary" data-action="close">Done</button></div>`, "gate-dialog");
}

function downloadReceipts() {
  const packages = allPackages().filter((pkg) => pkg.receipt).sort((a, b) => getStore(a.store).name.localeCompare(getStore(b.store).name));
  if (!packages.length) return;
  const rows = [["Store", "Order", "Receipt", "Order date", "Gifts", "Total USD", "Carrier", "Tracking"]];
  for (const pkg of packages) {
    rows.push([getStore(pkg.store).name, pkg.order, pkg.receipt, pkg.receiptDate,
      pkg.items.map(findGift).map((item) => item.name).join(" / "), (pkg.receiptTotal / 100).toFixed(2), pkg.carrier, pkg.tracking]);
  }
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "santas-lookbook-receipts-by-store.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash("Receipt download started.");
}
