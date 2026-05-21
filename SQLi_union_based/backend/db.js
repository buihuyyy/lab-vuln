const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'lab.db');
const db = new Database(dbPath);

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_title TEXT NOT NULL,
      secret_note TEXT NOT NULL
    );
  `);

  const bookCount = db.prepare('SELECT COUNT(*) AS c FROM books').get().c;
  if (bookCount === 0) {
    const insert = db.prepare(
      'INSERT INTO books (title, author, description) VALUES (?, ?, ?)'
    );
    const books = [
      ['The Silent Forest', 'Anna Hale', 'A quiet tale about a forest that hides ancient memories.'],
      ['Whispers of the Sea', 'Marcus Brent', 'A sailor returns home with strange stories from the deep.'],
      ['Coding the Future', 'Liang Wei', 'An accessible introduction to modern programming concepts.'],
      ['Midnight Garden', 'Sofia Cruz', 'A botanist discovers plants that bloom only at midnight.'],
      ['The Last Cartographer', 'Henrik Olsen', 'Mapping the final unknown corners of the world.'],
      ['Echoes in the Attic', 'Priya Shah', 'Old letters reveal a family secret across three generations.'],
      ['Stones of Aravon', 'Tomasz Kowalski', 'A fantasy epic about cursed stones and a hidden kingdom.'],
      ['The Quiet Engineer', 'Jane Doe', 'Reflections from twenty years of building reliable systems.'],
      ['Salt and Iron', 'Diego Ferreira', 'Historical fiction set in a small coastal fishing town.'],
      ['Northern Lights, Southern Skies', 'Aisha Bello', 'A travel memoir across two hemispheres.'],
      ['Rain on Tin Roofs', 'Mateo Alvarez', 'Short stories from rural villages.'],
      ['A Brief Theory of Tea', 'Rin Takahashi', 'Cultural history of tea over a thousand years.'],
      ['Glass Towers', 'Olivia Park', 'A corporate thriller set in a near-future metropolis.'],
      ['Paper Birds', 'Samuel Iverson', 'Origami, grief, and learning to let go.'],
      ['The Cartwheel Sky', 'Nadia Petrov', 'A girl learns astronomy from her grandfather.'],
      ['Bread and Borders', 'Yusuf Karim', 'A baker travels across continents collecting recipes.'],
      ['The Library at Dusk', 'Eleanor Finch', 'A librarian uncovers a hidden archive.'],
      ['Wireframes', 'Hugo Bernard', 'A designer\'s notebook on minimal interfaces.'],
      ['Soft Rebellions', 'Mira Chen', 'Essays on gentle activism.'],
      ['The Loom of Days', 'Arvid Lindgren', 'A weaver\'s reflection on time and craft.']
    ];
    const insertMany = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(books);
  }

  const noteCount = db.prepare('SELECT COUNT(*) AS c FROM admin_notes').get().c;
  if (noteCount === 0) {
    const insert = db.prepare(
      'INSERT INTO admin_notes (note_title, secret_note) VALUES (?, ?)'
    );
    insert.run('Reminder', 'Restock paperbacks next week.');
    insert.run('Internal', 'Staff meeting moved to Friday.');
    insert.run('FLAG', 'buiih{union_select_is_a_powerful_friend}');
  }
}

module.exports = { db, init };
