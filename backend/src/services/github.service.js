const GITHUB_API_URL = "https://api.github.com";

// ---- Existing PAT-based functions (kept for the manual "paste a PR URL" flow in the UI) ----

async function getPullRequest(owner, repo, pullNumber) {
    const response = await fetch(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${pullNumber}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
}

async function getPullRequestFiles(owner, repo, pullNumber) {
    const response = await fetch(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
        {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json"
            }
        }
    );

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
}

// ---- New GitHub App / installation-token functions (used by the webhook auto-review flow) ----

const { getInstallationOctokit } = require("./githubApp.service");

/**
 * Same as getPullRequest, but authenticated as the GitHub App installation
 * instead of a personal access token.
 */
async function getPullRequestAsApp(installationId, owner, repo, pullNumber) {
    const octokit = await getInstallationOctokit(installationId);

    const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        { owner, repo, pull_number: pullNumber }
    );

    return data;
}

/**
 * Same as getPullRequestFiles, but authenticated as the GitHub App installation.
 */
async function getPullRequestFilesAsApp(installationId, owner, repo, pullNumber) {
    const octokit = await getInstallationOctokit(installationId);

    const { data } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
        { owner, repo, pull_number: pullNumber, per_page: 100 }
    );

    return data;
}

/**
 * Posts the AI review findings back to GitHub as a single PR review with
 * inline, line-level comments. This is what makes the review show up
 * directly on the diff in GitHub's UI, not just in our own dashboard.
 *
 * Findings whose file/line don't match a line actually touched by the diff
 * are silently skipped (GitHub rejects comments on untouched lines), and
 * they're still mentioned in the summary so nothing silently disappears.
 */
async function postReviewComments(installationId, owner, repo, pullNumber, review, files) {
    const octokit = await getInstallationOctokit(installationId);

    const { data: pr } = await octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        { owner, repo, pull_number: pullNumber }
    );

    // Work out which lines in each file are actually part of the diff.
    // GitHub only accepts inline review comments on touched lines.
    const touchedLinesByFile = new Map();
    for (const file of files) {
        if (!file.patch) continue;
        const touchedLines = new Set();
        let currentLine = null;

        for (const line of file.patch.split("\n")) {
            const hunkHeader = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
            if (hunkHeader) {
                currentLine = parseInt(hunkHeader[1], 10);
                continue;
            }
            if (currentLine === null) continue;

            if (line.startsWith("+") && !line.startsWith("+++")) {
                touchedLines.add(currentLine);
                currentLine++;
            } else if (!line.startsWith("-")) {
                currentLine++;
            }
        }
        touchedLinesByFile.set(file.filename, touchedLines);
    }

    const comments = [];
    for (const finding of review.findings || []) {
        const touchedLines = touchedLinesByFile.get(finding.file);
        if (!touchedLines || !touchedLines.has(finding.line)) continue;

        comments.push({
            path: finding.file,
            line: finding.line,
            side: "RIGHT",
            body:
                `**[${finding.severity}] ${finding.title}**\n\n` +
                `${finding.explanation}\n\n` +
                `Suggestion: ${finding.suggestion}`
        });
    }

    const skippedCount = (review.findings || []).length - comments.length;
    const summaryBody =
        `### AI Code Review\n\n` +
        `**Score:** ${review.score}/100  |  **Risk:** ${review.risk}\n\n` +
        `${review.summary}\n\n` +
        (skippedCount > 0
            ? `_Note: ${skippedCount} additional finding(s) couldn't be anchored to a specific diff line and aren't shown inline._`
            : "");

    await octokit.request(
        "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
        {
            owner,
            repo,
            pull_number: pullNumber,
            commit_id: pr.head.sha,
            event: "COMMENT",
            body: summaryBody,
            comments
        }
    );
}

module.exports = {
    getPullRequest,
    getPullRequestFiles,
    getPullRequestAsApp,
    getPullRequestFilesAsApp,
    postReviewComments
};