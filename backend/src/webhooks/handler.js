const {
    getPullRequestFilesAsApp,
    postReviewComments
} = require("../services/github.service");

const { reviewCode } = require("../services/ai.service");
const { saveReview } = require("../db");

const RELEVANT_ACTIONS = ["opened", "synchronize", "reopened"];

/**
 * Handles an incoming GitHub webhook event. For pull_request open/update
 * events, this runs the same review pipeline the manual UI flow uses
 * (reviewCode), then posts the findings back to GitHub as inline comments
 * instead of just returning them to a browser.
 */
async function handleWebhookEvent(eventName, payload) {
    if (eventName !== "pull_request") {
        console.log(`Ignoring event: ${eventName}`);
        return;
    }

    if (!RELEVANT_ACTIONS.includes(payload.action)) {
        console.log(`Ignoring pull_request action: ${payload.action}`);
        return;
    }

    const installationId = payload.installation?.id;
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const pullNumber = payload.pull_request.number;

    console.log(
        `Auto-reviewing PR #${pullNumber} in ${owner}/${repo} ` +
        `(installation ${installationId}, action: ${payload.action})`
    );

    const files = await getPullRequestFilesAsApp(installationId, owner, repo, pullNumber);

    const review = await reviewCode(files);

    await postReviewComments(installationId, owner, repo, pullNumber, review, files);

    console.log(
        `Posted review for PR #${pullNumber}: score=${review.score}, ` +
        `risk=${review.risk}, findings=${review.findings?.length ?? 0}`
    );

    try {
        await saveReview({
            repoFullName: `${owner}/${repo}`,
            prNumber: pullNumber,
            commitSha: payload.pull_request.head?.sha,
            review
        });
        console.log(`Saved review for PR #${pullNumber} to the database.`);
    } catch (err) {
        // Don't let a DB failure undo the fact that the review was already
        // posted to GitHub successfully — just log it and move on.
        console.error(`Failed to save review for PR #${pullNumber} to the database:`, err);
    }
}

module.exports = { handleWebhookEvent };