const crypto = require("crypto");

/**
 * Verifies the X-Hub-Signature-256 header GitHub sends with every webhook,
 * proving the payload actually came from GitHub and wasn't forged.
 *
 * Requires req.rawBody to be set (see server.js, which captures it during
 * JSON parsing before this middleware runs).
 */
function verifyWebhookSignature(secret) {
    return (req, res, next) => {
        const signature = req.headers["x-hub-signature-256"];
        if (!signature) {
            return res.status(401).send("Missing signature");
        }

        const expected =
            "sha256=" +
            crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");

        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);

        if (
            sigBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
        ) {
            return res.status(401).send("Invalid signature");
        }

        next();
    };
}

module.exports = { verifyWebhookSignature };