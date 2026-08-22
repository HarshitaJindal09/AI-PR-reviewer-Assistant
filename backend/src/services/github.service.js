const GITHUB_API_URL = "https://api.github.com";

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

module.exports = {
    getPullRequest,
    getPullRequestFiles
};