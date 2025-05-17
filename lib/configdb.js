/*const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'botdata.db'));

// Ensure table exists
db.prepare(`
  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`).run();

module.exports = {
  getConfig: (key) => {
    const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
    return row ? row.value : null;
  },
  setConfig: (key, value) => {
    db.prepare("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)").run(key, value);
  },
  getAllConfig: () => {
    const rows = db.prepare("SELECT * FROM config").all();
    return Object.fromEntries(rows.map(row => [row.key, row.value]));
  }
};


*/


/*
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'botdata.db');
const fs = require('fs');

// Ensure database file exists
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, '');

const db = new sqlite3.Database(dbPath);

// Default config values
const defaults = {
    BOT_IMAGE: 'https://i.postimg.cc/XNTmcqZ3/subzero-menu.png',
    OWNER_NAME: 'Mr Frank',
    BOT_NAME: 'SUBZERO-MD',
    PREFIX: '.'
};

// Create table if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`);

    const insert = db.prepare(`INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)`);
    for (const [key, value] of Object.entries(defaults)) {
        insert.run([key, value]);
    }
    insert.finalize();
});

// Get a config value (sync style using cache or defaults)
function getConfigSync(key) {
    try {
        const row = db.prepare(`SELECT value FROM config WHERE key = ?`).get(key);
        return row?.value || defaults[key] || null;
    } catch (e) {
        return defaults[key] || null;
    }
}

// Async if needed elsewhere
function getConfig(key) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT value FROM config WHERE key = ?`, [key], (err, row) => {
            if (err) return reject(err);
            resolve(row?.value || defaults[key] || null);
        });
    });
}

// Set/update config
function setConfig(key, value) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)`, [key, value], function (err) {
            if (err) return reject(err);
            resolve(true);
        });
    });
}

module.exports = { getConfig, getConfigSync, setConfig };
*/
