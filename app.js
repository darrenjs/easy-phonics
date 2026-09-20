let currentSet = "cvc";
let currentCard = 0;
let shuffledCards = null;

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
const wordBackEl = document.getElementById("wordBack");

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
  const card = cards[currentCard];

  if (!card) {
    console.error("No card found:", currentSet, currentCard);
    return;
  }

  cardEl.classList.add("resetting");
  cardEl.classList.remove("flipped");

  const highlightedWord = highlightWord(card.word, card.rendering);

  wordEl.innerHTML = highlightedWord;
  wordBackEl.innerHTML = highlightedWord;

  pictureEl.innerHTML = "";

  const img = document.createElement("img");
  img.src = card.image;
  img.alt = card.word;

  pictureEl.appendChild(img);

  requestAnimationFrame(() => {
    cardEl.classList.remove("resetting");
  });
}

function shuffleCards() {
  for (const set of Object.values(cardSets)) {
    const cards = set.cards;

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  currentCard = 0;

  closeSetMenu();
  showCard();
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

    const separator = document.createElement("div");
separator.className = "menu-separator";
menuEl.appendChild(separator);

const shuffleOption = document.createElement("button");
shuffleOption.className = "set-option shuffle-option";
shuffleOption.type = "button";
shuffleOption.textContent = "Shuffle cards";
shuffleOption.addEventListener("click", shuffleCards);

menuEl.appendChild(shuffleOption);
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

        cardEl.classList.add("resetting");
        showCard();

        requestAnimationFrame(() => {
            cardEl.classList.remove("resetting");
        });

    cardEl.style.transition = "none";
    cardEl.style.transform =
      `translateX(${incomingX}px) rotate(${direction < 0 ? -5 : 5}deg)`;

    void cardEl.offsetWidth;

    cardEl.style.transition =
      `transform ${SWIPE_DURATION}ms cubic-bezier(.25,.8,.3,1)`;
    cardEl.style.transform = "";
  }, SWIPE_DURATION);
}

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

// touchend owns the entire tap vs. swipe decision (this app is touch/tablet-only,
// so there's no need for a separate pointerup/click handler racing against this).
cardEl.addEventListener("touchend", (event) => {
  const endX = event.changedTouches[0].clientX;
  const endY = event.changedTouches[0].clientY;

  const dx = endX - touchStartX;
  const dy = endY - touchStartY;

  const wasReallySwiping = swiping;
  swiping = false;

  // Finger never crossed the drag threshold at all -> clean tap, flip the card.
  if (!wasReallySwiping) {
    cardEl.classList.toggle("flipped");
    return;
  }

  // Crossed the small drag threshold but never became a real swipe ->
  // snap back to center and treat it as a tap.
  if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) {
    cardEl.style.transition = `transform ${SWIPE_DURATION}ms ease`;
    cardEl.style.transform = "";
    cardEl.classList.toggle("flipped");
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
