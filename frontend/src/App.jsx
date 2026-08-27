import { useState } from "react";
import "./App.css";

function App() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [pullNumber, setPullNumber] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prUrl, setPrUrl] = useState("");

  const analyzePR = async () => {
    if (!prUrl) {
      setError("Please enter a GitHub Pull Request URL.");
      return;
    }

    const match = prUrl.match(
      /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/
    );

    if (!match) {
      setError(
        "Invalid GitHub PR URL. Example: https://github.com/facebook/react/pull/1"
      );
      return;
    }

    const [, extractedOwner, extractedRepo, extractedPullNumber] = match;

    setOwner(extractedOwner);
    setRepo(extractedRepo);
    setPullNumber(extractedPullNumber);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            owner: extractedOwner,
            repo: extractedRepo,
            pullNumber: Number(extractedPullNumber),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to analyze pull request"
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">AI</span>
          <span>Code Review Assistant</span>
        </div>

        <div className="header-badge">
          AI Powered
        </div>
      </header>

      <main className="container">

        {/* Hero */}
        <section className="hero">
          <h1>
            Review your Pull Requests
            <span> with AI</span>
          </h1>

          <p>
            Enter a GitHub Pull Request URL to get an
            intelligent code review in seconds.
          </p>
        </section>

        {/* Input Card */}
        <section className="input-card">
          <div className="input-group pr-url-group">
            <label>GitHub Pull Request URL</label>

            <input
              type="text"
              placeholder="https://github.com/facebook/react/pull/1"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
            />
          </div>

          <button
            className="analyze-btn"
            onClick={analyzePR}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze PR →"}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="error">
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <section className="results">

            {/* PR Information */}
            <div className="pr-header">
              <div>
                <div className="repo-name">
                  {owner} / {repo}
                </div>

                <h2>
                  {result.pullRequest.title}
                </h2>

                <div className="pr-meta">
                  <span>
                    PR #{result.pullRequest.number}
                  </span>

                  <span>•</span>

                  <span>
                    {result.pullRequest.author}
                  </span>

                  <span>•</span>

                  <span className="status">
                    {result.pullRequest.state}
                  </span>
                </div>
              </div>

              <a
                href={result.pullRequest.url}
                target="_blank"
                rel="noreferrer"
                className="github-link"
              >
                View on GitHub ↗
              </a>
            </div>

            {/* AI Review */}
            {result.review && (
              <>
                {/* Score / Risk */}
                <div className="stats">

                  <div className="stat-card">
                    <span className="stat-label">
                      REVIEW SCORE
                    </span>

                    <span className="score">
                      {result.review.score}
                      <small>/100</small>
                    </span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-label">
                      RISK LEVEL
                    </span>

                    <span
                      className={`risk ${String(
                        result.review.risk
                      ).toLowerCase()}`}
                    >
                      {result.review.risk}
                    </span>
                  </div>

                  <div className="stat-card">
                    <span className="stat-label">
                      FINDINGS
                    </span>

                    <span className="finding-count">
                      {result.review.findings?.length || 0}
                    </span>
                  </div>

                </div>

                {/* Summary */}
                <div className="section-card">
                  <h3>AI Summary</h3>

                  <p className="summary">
                    {result.review.summary}
                  </p>
                </div>

                {/* Findings */}
                <div className="section-card">

                  <div className="section-title">
                    <h3>Code Review Findings</h3>

                    <span>
                      {result.review.findings?.length || 0} issues
                    </span>
                  </div>

                  <div className="findings">

                    {result.review.findings?.map(
                      (finding, index) => (
                        <div
                          className="finding"
                          key={index}
                        >

                          <div className="finding-top">

                            <span
                              className={`severity ${String(
                                finding.severity
                              ).toLowerCase()}`}
                            >
                              {finding.severity}
                            </span>

                            <span className="category">
                              {finding.category}
                            </span>

                          </div>

                          <h4>
                            {finding.title}
                          </h4>

                          <div className="file">
                            📄 {finding.file}

                            {finding.line && (
                              <span>
                                {" "}
                                : {finding.line}
                              </span>
                            )}
                          </div>

                          <p>
                            {finding.explanation}
                          </p>

                          <div className="suggestion">
                            <strong>
                              💡 Suggestion
                            </strong>

                            <p>
                              {finding.suggestion}
                            </p>
                          </div>

                        </div>
                      )
                    )}

                  </div>
                </div>

                {/* Changed Files */}
                <div className="section-card">

                  <div className="section-title">
                    <h3>Changed Files</h3>

                    <span>
                      {result.files?.length || 0} files
                    </span>
                  </div>

                  <div className="changed-files">

                    {result.files?.map((file, index) => (
                      <div
                        className="changed-file"
                        key={index}
                      >

                        {/* File Header */}
                        <div className="file-header">

                          <div>
                            <span className="file-name">
                              📄 {file.filename}
                            </span>

                            <span
                              className={`file-status ${file.status}`}
                            >
                              {file.status}
                            </span>
                          </div>

                          <div className="file-stats">

                            <span className="additions">
                              +{file.additions}
                            </span>

                            <span className="deletions">
                              -{file.deletions}
                            </span>

                          </div>

                        </div>

                        {/* GitHub Diff */}
                        {file.patch && (
                          <pre className="diff">
                            {file.patch}
                          </pre>
                        )}

                      </div>
                    ))}

                  </div>

                </div>

              </>
            )}

          </section>
        )}

      </main>

      <footer>
        AI Code Review Assistant • Built with React, Node.js & Gemini
      </footer>

    </div>
  );
}

export default App;