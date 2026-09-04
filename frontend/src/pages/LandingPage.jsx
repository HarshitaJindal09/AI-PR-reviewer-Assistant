import { Link } from "react-router-dom";
import {
  IconGitPullRequest,
  IconLayers,
  IconCheck,
  IconClock,
  IconArrowRight,
} from "../components/icons";

const FEATURES = [
  {
    icon: IconGitPullRequest,
    title: "Auto-triggered on every pull request",
    description:
      "Installed as a real GitHub App. It reviews pull requests the moment they're opened or updated — no manual step required.",
  },
  {
    icon: IconLayers,
    title: "Inline, line-level comments",
    description:
      "Findings are posted directly on the changed lines in the Files Changed tab, the same way a human reviewer would leave them.",
  },
  {
    icon: IconCheck,
    title: "Structured analysis, not free text",
    description:
      "Every review returns validated JSON — severity, category, file, line, explanation, and a concrete fix.",
  },
  {
    icon: IconClock,
    title: "A full review history",
    description:
      "Every review is saved, so you can track score trends and issue counts across every repo the app is installed on.",
  },
];

const STEPS = [
  "Install the GitHub App on a repository you choose.",
  "Open or update a pull request — nothing else to trigger manually.",
  "A webhook notifies the backend, which fetches the diff and sends it to an LLM for review.",
  "Findings are posted back to the PR as inline comments, and saved for the history dashboard.",
];

function LandingPage() {
  return (
    <>
      <section className="landing-hero">
        <div>
          <h1>
            AI code review,
            <br />
            <span className="accent-text">on every pull request.</span>
          </h1>

          <p>
            Install it once on a repo, and every future PR gets an automatic,
            structured review — bugs, security issues, and code quality
            feedback posted straight to GitHub.
          </p>

          <div className="landing-cta">
            <a
              href="https://github.com/settings/apps/harshitaa09-pr-assistant"
              target="_blank"
              rel="noreferrer"
              className="analyze-btn"
            >
              Install on GitHub <IconArrowRight width={15} height={15} />
            </a>
            <Link to="/analyze" className="btn-secondary">
              Try a manual review
            </Link>
          </div>
        </div>

        {/* Mock PR comment — the characteristic artifact of this product */}
        <div className="mock-pr-comment">
          <div className="mock-pr-comment-header">
            <div className="mock-pr-avatar">AI</div>
            <span>pr-review-bot commented on auth.js</span>
          </div>

          <div className="mock-pr-comment-body">
            <div className="mock-pr-file">src/utils/auth.js:42</div>

            <div className="mock-pr-diff-line removed">
              - if (user.role = "admin") &#123;
            </div>
            <div className="mock-pr-diff-line added">
              + if (user.role === "admin") &#123;
            </div>

            <div className="mock-pr-finding">
              <div className="mock-pr-finding-title">
                <span className="severity high">HIGH</span>{" "}
                Assignment instead of comparison
              </div>
              <p>
                This assigns "admin" to user.role rather than comparing it —
                every user would pass this check. Use === instead of =.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="feature-list">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div className="feature-row" key={feature.title}>
              <div className="icon-badge">
                <Icon />
              </div>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-card">
        <h3>How it works</h3>
        <div className="steps-list">
          {STEPS.map((step, index) => (
            <div className="step-row" key={step}>
              <div className="step-number">{index + 1}</div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default LandingPage;
