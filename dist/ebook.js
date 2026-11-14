"use strict";

const spreads = [
  { art: "workshop-spread", title: "The Toymaker’s Workshop", line: "Pip has been making toys by lantern light.", toys: [{id:"tiles", x:23, y:51, w:40, h:52}, {id:"train", x:77, y:53, w:43, h:39}] },
  { art: "cabin-spread", title: "The Cozy Christmas Cabin", line: "A warm place to make something or snuggle up.", toys: [{id:"bunny", x:22, y:54, w:33, h:58}, {id:"art", x:77, y:55, w:39, h:47}] },
  { art: "starlight-spread", title: "Under the Northern Lights", line: "Follow the lanterns up to the observatory.", toys: [{id:"telescope", x:25, y:52, w:44, h:57}, {id:"truck", x:75, y:62, w:41, h:49}] },
];
const bookNarrow = matchMedia("(max-width: 640px)");
let bookIndex = 0;
let bookTurn = null;
let bookPointer = null;

function bookPages() {
  const included = new Set(curated().map((gift) => gift.id));
  const leaves = [];
  for (const spread of spreads) {
    if (bookNarrow.matches) {
      spread.toys.forEach((toy, side) => {
        if (included.has(toy.id)) leaves.push({ ...spread, side, toys: [toy] });
      });
    } else if (spread.toys.some((toy) => included.has(toy.id))) {
      leaves.push({ ...spread, side: null, toys: spread.toys.filter((toy) => included.has(toy.id)) });
    }
  }
  return [null, ...leaves];
}

function pageImage(sheet) {
  return sheet ? `assets/${sheet.art}.webp` : "assets/book-cover.webp";
}

function bookView() {
  const pages = bookPages();
  bookIndex = Math.min(bookIndex, pages.length - 1);
  const sheet = pages[bookIndex];
  const finalPage = bookIndex === pages.length - 1;
  const previous = bookTurn?.previous;
  const layout = sheet?.side === 0 ? " leaf-left" : sheet?.side === 1 ? " leaf-right" : "";
  const turnPosition = previous?.side === 0 ? "left" : previous?.side === 1 ? "right" : "";
  return `<section class="book-world" aria-label="Christmas toy book">
    <div class="book-table">
      ${sheet ? `<div class="book-overline"><h1 tabindex="-1">Your Christmas Toy Book</h1><span>Tap a toy to see it in 3D</span></div>` : ""}
      <div class="book-frame${sheet ? " is-open" : " is-cover"}${layout}" data-book-frame>
        <img class="book-art" src="${pageImage(sheet)}" alt="" draggable="false">
        ${sheet ? `
          <div class="book-ink" aria-hidden="true"></div>
          <div class="book-chapter"><h2>${sheet.title}</h2><p>${sheet.line}</p></div>
          ${sheet.side === null ? sheet.toys.length === 1 ? quietLeaf(sheet) : "" : ""}
          ${sheet.toys.map((toy) => bookToy(toy, sheet.side)).join("")}
          <div class="book-seam" aria-hidden="true"></div>
        ` : `<div class="book-cover-ink" aria-hidden="true"></div>
          <div class="book-cover-copy">
            <span class="book-postage">${icon("spark", 14)} &nbsp; Special delivery from the North Pole</span>
            <h1 tabindex="-1">The Christmas<br><em>Toy Book</em></h1>
            <p>For ${name()}, from Pip</p>
            <button class="button gold-button cover-open" type="button" data-action="book-turn" data-direction="1" ${pages.length > 1 ? "" : "disabled"}>Open my toy book ${icon("arrow", 21)}</button>
          </div>`}
        ${bookTurn && !reducedMotion.matches ? `
          <div class="page-flip ${bookTurn.direction > 0 ? "forward" : "backward"} ${previous ? "" : "from-cover"} ${turnPosition}" aria-hidden="true">
            <span style="--old-page:url('${pageImage(previous)}')"></span>
          </div>` : ""}
      </div>
      ${sheet ? `<nav class="book-controls" aria-label="Turn book pages">
        <button class="button book-turn-button" type="button" data-action="book-turn" data-direction="-1" aria-label="Previous page">${icon("back", 20)} <span>${bookIndex === 1 ? "Cover" : "Previous"}</span></button>
        <span class="book-page-status">Page ${bookIndex} of ${pages.length - 1}</span>
        ${finalPage
          ? `<button class="button gold-button book-finish" type="button" data-action="wishes">My wish list ${icon("heart", 17)}</button>`
          : `<button class="button book-turn-button" type="button" data-action="book-turn" data-direction="1" aria-label="Next page"><span>Next</span> ${icon("arrow", 20)}</button>`}
      </nav>` : `<p class="cover-instruction">${pages.length > 1 ? "Open the cover, turn the pages, and discover the toys tucked inside." : "Ask your grown-up to choose some gifts for your book."}</p>`}
    </div>
  </section>`;
}

function quietLeaf(sheet) {
  const shown = sheet.toys[0];
  return `<div class="quiet-leaf ${shown.x < 50 ? "right" : "left"}" aria-hidden="true"><span>✦</span></div>`;
}

function bookToy(toy, side) {
  const gift = findGift(toy.id);
  const placedX = side === null ? toy.x : (toy.x - side * 50) * 2;
  const width = side === null ? toy.w : Math.min(toy.w * 2, 94);
  const selected = state.wishes.includes(gift.id);
  return `<button class="book-toy" type="button" style="--toy-x:${placedX}%;--toy-y:${toy.y}%;--toy-w:${width}%;--toy-h:${toy.h}%"
    data-action="detail" data-id="${gift.id}" aria-label="Explore ${gift.name}" data-saved="${selected}">
    <span class="toy-pin" aria-hidden="true">${icon(selected ? "heart" : "spark", 17)}</span>
    <span class="toy-label">${gift.name}</span>
  </button>`;
}

function turnBook(direction) {
  const pages = bookPages();
  const next = bookIndex + direction;
  if (next < 0 || next >= pages.length) return;
  bookTurn = { previous: pages[bookIndex], direction };
  bookIndex = next;
  playHoliday("select");
  render();
  bookTurn = null;
  const replacement = app.querySelector(`[data-book-frame] ~ .book-controls [data-direction="${direction}"]`);
  (replacement || app.querySelector(".book-finish") || app.querySelector(".cover-open"))?.focus({ preventScroll: true });
  announce(pages[next] ? `Page ${next} of ${pages.length - 1}. ${pages[next].title}.` : "Back at the cover.");
}

function markBookToy(gift, selected) {
  const toy = app.querySelector(`.book-toy[data-id="${gift.id}"]`);
  if (toy) {
    toy.dataset.saved = String(selected);
    toy.querySelector(".toy-pin").innerHTML = icon(selected ? "heart" : "spark", 17);
  }
}

bookNarrow.addEventListener("change", () => {
  if (page !== "catalog") return;
  if (bookIndex > 0) bookIndex = 1;
  render();
});

document.addEventListener("keydown", (event) => {
  if (page !== "catalog" || dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
  if (direction) {
    event.preventDefault();
    turnBook(direction);
  }
});

app.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" || !event.target.closest("[data-book-frame]")) return;
  bookPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

app.addEventListener("pointerup", (event) => {
  if (bookPointer?.id !== event.pointerId) return;
  const x = event.clientX - bookPointer.x;
  const y = event.clientY - bookPointer.y;
  bookPointer = null;
  if (Math.abs(x) > 48 && Math.abs(x) > Math.abs(y) * 1.4) turnBook(x < 0 ? 1 : -1);
});

app.addEventListener("pointercancel", () => { bookPointer = null; });

if (new URLSearchParams(location.search).get("view") === "toy-book" && curated().length) page = "catalog";
render();
