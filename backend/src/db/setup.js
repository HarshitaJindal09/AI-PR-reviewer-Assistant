/**
 * Run this once (and again any time you change the schema):
 *   node src/db/setup.js
 *
 * Creates the two tables that store every auto-review and its findings.
 */
require("dotenv").config();
const { query, pool } = require("./index");

async function setup() {
    await query(`
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            repo_full_name TEXT NOT NULL,
            pr_number INTEGER NOT NULL,
            commit_sha TEXT,
            score INTEGER,
            risk TEXT,
            summary TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS findings (
            id SERIAL PRIMARY KEY,
            review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
            file TEXT,
            line INTEGER,
            severity TEXT,
            category TEXT,
            title TEXT,
            explanation TEXT,
            suggestion TEXT
        );
    `);

    console.log("Tables created (or already existed). Setup complete.");
    await pool.end();
}

setup().catch((err) => {
    console.error("Setup failed:", err);
    process.exit(1);
});