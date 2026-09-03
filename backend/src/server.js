const express = require("express");
const cors = require("cors");
require("dotenv").config();

const reviewRoutes = require("./routes/review.routes");
const historyRoutes = require("./routes/history.routes");
const { verifyWebhookSignature } = require("./webhooks/verify");
const { handleWebhookEvent } = require("./webhooks/handler");

const app = express();

app.use(cors());

// Capture the raw body for webhook signature verification BEFORE
// express.json() parses it — GitHub's HMAC is computed over the raw bytes.
app.use(
    express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        }
    })
);

app.get("/", (req, res) => {
    res.json({
        message: "PR Assistant Backend is running!"
    });
});

// Manual flow: user pastes a PR URL in the UI, we fetch + review on demand.
app.use("/api/reviews", reviewRoutes);

// Read-only: pulls saved review history + stats from Postgres.
app.use("/api/history", historyRoutes);

// Auto flow: GitHub calls this on every PR open/update, we review and post
// inline comments back to the PR automatically, no user action needed.
app.post(
    "/webhooks/github",
    verifyWebhookSignature(process.env.GITHUB_WEBHOOK_SECRET),
    (req, res) => {
        const eventName = req.headers["x-github-event"];

        // Respond fast — GitHub expects a quick 2xx. Do the real work after.
        res.status(202).send("accepted");

        handleWebhookEvent(eventName, req.body).catch((err) => {
            console.error("Error handling webhook event:", err);
        });
    }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});