const { Pool } = require("pg");

/**
 * A shared connection pool. Import { query } wherever you need to talk to
 * the database instead of creating new connections per-request.
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // required for Neon/Supabase-style hosted Postgres
});

async function query(text, params) {
    return pool.query(text, params);
}

/**
 * Persists one completed review and its findings. Called right after the
 * review is posted to GitHub, so this table becomes the source of truth
 * for real usage stats (reviews run, issues found, precision, etc).
 */
async function saveReview({ repoFullName, prNumber, commitSha, review }) {
    const { rows } = await query(
        `INSERT INTO reviews (repo_full_name, pr_number, commit_sha, score, risk, summary)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [repoFullName, prNumber, commitSha, review.score, review.risk, review.summary]
    );

    const reviewId = rows[0].id;
    const findings = review.findings || [];

    for (const finding of findings) {
        await query(
            `INSERT INTO findings (review_id, file, line, severity, category, title, explanation, suggestion)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                reviewId,
                finding.file,
                finding.line,
                finding.severity,
                finding.category,
                finding.title,
                finding.explanation,
                finding.suggestion
            ]
        );
    }

    return reviewId;
}

module.exports = { query, pool, saveReview };