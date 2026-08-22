const {
    getPullRequest,
    getPullRequestFiles
} = require("../services/github.service");

const { reviewCode } = require("../services/ai.service");

async function analyzePullRequest(req, res) {
    try {
        const { owner, repo, pullNumber } = req.body;

        if (!owner || !repo || !pullNumber) {
            return res.status(400).json({
                error: "owner, repo and pullNumber are required"
            });
        }

        // 1. Get Pull Request information
        const pullRequest = await getPullRequest(
            owner,
            repo,
            pullNumber
        );

        // 2. Get changed files and diffs
        const files = await getPullRequestFiles(
            owner,
            repo,
            pullNumber
        );

        // 3. Send the code changes to Gemini
        const review = await reviewCode(files);

        // 4. Return everything to the client
        res.json({
            success: true,

            pullRequest: {
                title: pullRequest.title,
                number: pullRequest.number,
                author: pullRequest.user.login,
                state: pullRequest.state,
                url: pullRequest.html_url
            },

            files: files.map(file => ({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch
            })),

            review
        });

    } catch (error) {
        console.error("Review error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}

module.exports = {
    analyzePullRequest
};