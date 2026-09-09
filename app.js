let currentSet = "cvc";
let currentCard = 0;

let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let swiping = false;

const SWIPE_THRESHOLD = 80;
const SWIPE_DURATION = 180;

const selectorEl = document.getElementById("setSelector");
const menuEl = document.getElementById("setMenu");
const setNameEl = document.getElementById("setName");
const cardEl = document.getElementById("card");
const pictureEl = document.getElementById("picture");
const wordEl = document.getElementById("word");

function getCards() {
  return cardSets[currentSet].cards;
}

function highlightWord(word, rendering) {
  if (!rendering) return escapeHtml(word);

  const index = word.indexOf(rendering);

  if (index === -1) {
    return escapeHtml(word);
  }

  return (
    escapeHtml(word.slice(0, index)) +
    `<span class="focus">${escapeHtml(rendering)}</span>` +
    escapeHtml(word.slice(index + rendering.length))
  );
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showCard() {
  const cards = getCards();

  if (currentCard < 0) currentCard = 0;
  if (currentCard >= cards.length) currentCard = cards.length - 1;

  const card = cards[currentCard];

  pictureEl.innerHTML = "";
  const imageEl = document.createElement("img");
  imageEl.src = card.image;
  imageEl.alt = card.word;
  imageEl.draggable = false;
  pictureEl.appendChild(imageEl);

  wordEl.innerHTML = highlightWord(card.word, card.rendering);

  cardEl.style.transition = "none";
  cardEl.style.transform = "";
}

function buildSetMenu() {
  menuEl.innerHTML = "";

  for (const [id, set] of Object.entries(cardSets)) {
    const option = document.createElement("button");
    option.className = "set-option";
    option.type = "button";
    option.setAttribute("role", "option");
    option.textContent = set.name;

    if (id === currentSet) {
      option.classList.add("selected");
      option.setAttribute("aria-selected", "true");
    }

    option.addEventListener("click", () => {
      currentSet = id;
      currentCard = 0;
      setNameEl.textContent = set.name;
      closeSetMenu();
      showCard();
    });

    menuEl.appendChild(option);
  }
}

function openSetMenu() {
  buildSetMenu();
  menuEl.classList.remove("hidden");
  selectorEl.setAttribute("aria-expanded", "true");
}

function closeSetMenu() {
  menuEl.classList.add("hidden");
  selectorEl.setAttribute("aria-expanded", "false");
}

selectorEl.addEventListener("click", (event) => {
  event.stopPropagation();

  if (menuEl.classList.contains("hidden")) {
    openSetMenu();
  } else {
    closeSetMenu();
  }
});

document.addEventListener("click", (event) => {
  if (!menuEl.contains(event.target) && event.target !== selectorEl) {
    closeSetMenu();
  }
});

function changeCard(direction) {
  const cards = getCards();
  const next = currentCard + direction;

  if (next < 0 || next >= cards.length) {
    cardEl.style.transition = `transform ${SWIPE_DURATION}ms ease`;
    cardEl.style.transform = "";
    return;
  }

  const outgoingX = direction < 0 ? window.innerWidth : -window.innerWidth;
  const incomingX = -outgoingX;

  cardEl.style.transition = `transform ${SWIPE_DURATION}ms cubic-bezier(.25,.8,.3,1)`;
  cardEl.style.transform =
    `translateX(${outgoingX}px) rotate(${direction < 0 ? 5 : -5}deg)`;

  setTimeout(() => {
    currentCard = next;
    showCard();

    cardEl.style.transition = "none";
    cardEl.style.transform =
      `translateX(${incomingX}px) rotate(${direction < 0 ? -5 : 5}deg)`;

    void cardEl.offsetWidth;

    cardEl.style.transition =
      `transform ${SWIPE_DURATION}ms cubic-bezier(.25,.8,.3,1)`;
    cardEl.style.transform = "";
  }, SWIPE_DURATION);
}

// Clicking the card is intentionally inactive for now.
// We may use it later for a reveal/animation interaction.

cardEl.addEventListener("touchstart", (event) => {
  if (event.touches.length !== 1) return;

  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
  touchCurrentX = touchStartX;
  swiping = false;

  cardEl.style.transition = "none";
}, { passive: true });

cardEl.addEventListener("touchmove", (event) => {
  if (event.touches.length !== 1) return;

  touchCurrentX = event.touches[0].clientX;

  const dx = touchCurrentX - touchStartX;
  const dy = event.touches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
    swiping = true;

    cardEl.style.transform =
      `translateX(${dx * 0.25}px) rotate(${dx * 0.015}deg)`;
  }
}, { passive: true });

cardEl.addEventListener("touchend", (event) => {
  if (!swiping) return;

  const endX = event.changedTouches[0].clientX;
  const endY = event.changedTouches[0].clientY;

  const dx = endX - touchStartX;
  const dy = endY - touchStartY;

  swiping = false;

  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
    cardEl.style.transition = `transform ${SWIPE_DURATION}ms ease`;
    cardEl.style.transform = "";
    return;
  }

  // Swipe left = next card; swipe right = previous card.
  changeCard(dx < 0 ? 1 : -1);
});

cardEl.addEventListener("touchcancel", () => {
  swiping = false;
  cardEl.style.transition = `transform ${SWIPE_DURATION}ms ease`;
  cardEl.style.transform = "";
});

showCard();
