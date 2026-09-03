const express = require("express");
const { query } = require("../db");

const router = express.Router();

/**
 * GET /api/history
 * Returns every saved review (most recent first), each with its findings
 * attached, plus a small stats block. This is what you'll pull real
 * resume numbers from once you've let the app run for a while.
 */
router.get("/", async (req, res) => {
    try {
        const { rows: reviews } = await query(
            `SELECT * FROM reviews ORDER BY created_at DESC LIMIT 100`
        );

        const { rows: findings } = await query(
            `SELECT * FROM findings WHERE review_id = ANY($1::int[])`,
            [reviews.map((r) => r.id)]
        );

        const findingsByReview = new Map();
        for (const f of findings) {
            if (!findingsByReview.has(f.review_id)) {
                findingsByReview.set(f.review_id, []);
            }
            findingsByReview.get(f.review_id).push(f);
        }

        const reviewsWithFindings = reviews.map((r) => ({
            ...r,
            findings: findingsByReview.get(r.id) || []
        }));

        const stats = {
            totalReviews: reviews.length,
            totalFindings: findings.length,
            averageScore: reviews.length
                ? Math.round(
                      reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length
                  )
                : null
        };

        res.json({ stats, reviews: reviewsWithFindings });
    } catch (err) {
        console.error("Failed to fetch review history:", err);
        res.status(500).json({ error: "Failed to fetch review history" });
    }
});

module.exports = router;