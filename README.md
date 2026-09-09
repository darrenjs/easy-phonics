# Phonics Flashcards

A minimal web-based phonics flashcard app.

## Generate card data

Put `cards.json` and the `images/` directory together:

```text
content/
├── cards.json
└── images/
    ├── cat.png
    ├── pig.png
    └── ...
```

Then run:

```bash
./generate_data.py content/cards.json
```

This generates `data.js`.

The generator validates:

- every card has `word`, `rendering`, and `image`
- `rendering` occurs in `word`
- every image is a PNG
- every referenced image exists

## Run the app

From the application directory:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Card interaction

- Swipe left: next card
- Swipe right: previous card
- Card sets are selected from the menu
