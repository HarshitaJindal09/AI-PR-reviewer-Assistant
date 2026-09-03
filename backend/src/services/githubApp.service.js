const fs = require("fs");

/**
 * Sets up GitHub App authentication (JWT signing + installation token
 * exchange). This replaces the old GITHUB_TOKEN personal-access-token
 * approach with the real production auth model GitHub Apps use.
 *
 * @octokit/app is an ESM-only package, but this project uses CommonJS
 * (require) everywhere else. Rather than converting the whole project to
 * ESM, we load it with a dynamic import() the one time we need it, and
 * cache the result. Dynamic import() works fine inside a CommonJS file.
 */
let githubAppPromise = null;

async function getGithubApp() {
    if (!githubAppPromise) {
        githubAppPromise = (async () => {
            const { App } = await import("@octokit/app");

            const privateKey = fs.readFileSync(
                process.env.GITHUB_APP_PRIVATE_KEY_PATH,
                "utf8"
            );

            return new App({
                appId: process.env.GITHUB_APP_ID,
                privateKey,
                webhooks: {
                    secret: process.env.GITHUB_WEBHOOK_SECRET
                }
            });
        })();
    }

    return githubAppPromise;
}

/**
 * Call this anywhere you need to make GitHub API calls on behalf of a
 * specific installation (i.e. a specific org/repo that installed your app).
 */
async function getInstallationOctokit(installationId) {
    const app = await getGithubApp();
    return app.getInstallationOctokit(installationId);
}

module.exports = {
    getInstallationOctokit
};