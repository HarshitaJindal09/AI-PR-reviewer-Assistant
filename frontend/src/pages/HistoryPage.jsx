import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { IconAlert } from "../components/icons";

function HistoryPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("http://localhost:5000/api/history");
        if (!response.ok) {
          throw new Error("Failed to load review history");
        }
        const json = await response.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="hero">
        <p className="no-findings">Loading review history...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="hero">
        <div className="error">
          <IconAlert width={16} height={16} /> {error}
        </div>
      </section>
    );
  }

  const { stats, reviews } = data;

  // Chart wants oldest-first, and reviews come back newest-first from the API.
  const chartData = [...reviews]
    .reverse()
    .map((r) => ({
      label: `PR #${r.pr_number}`,
      score: r.score,
      date: new Date(r.created_at).toLocaleDateString(),
    }));

  return (
    <>
      <section className="hero">
        <h1>
          Review <span>History</span>
        </h1>
        <p>Every pull request auto-reviewed by your GitHub App, saved and tracked.</p>
      </section>

      {/* Aggregate stats */}
      <div className="stats">
        <div className="stat-card">
          <span className="stat-label">TOTAL REVIEWS</span>
          <span className="finding-count">{stats.totalReviews}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">TOTAL FINDINGS</span>
          <span className="finding-count">{stats.totalFindings}</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">AVERAGE SCORE</span>
          <span className="score">
            {stats.averageScore ?? "—"}
            {stats.averageScore !== null && <small>/100</small>}
          </span>
        </div>
      </div>

      {/* Score trend chart */}
      {chartData.length > 1 && (
        <div className="section-card">
          <h3>Score Trend</h3>
          <div style={{ width: "100%", height: 240, marginTop: 16 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#263247" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #263247",
                    borderRadius: 8,
                    color: "#f1f5f9",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* List of past reviews */}
      <div className="section-card">
        <div className="section-title">
          <h3>Auto-Reviewed Pull Requests</h3>
          <span>{reviews.length} total</span>
        </div>

        {reviews.length === 0 ? (
          <p className="no-findings">
            No auto-reviews yet. Open a pull request on a repo with the
            GitHub App installed to see it appear here.
          </p>
        ) : (
          <div className="findings">
            {reviews.map((review) => (
              <div className="finding" key={review.id}>
                <div className="finding-top">
                  <span
                    className={`risk ${String(review.risk).toLowerCase()}`}
                    style={{ fontSize: "14px" }}
                  >
                    {review.risk}
                  </span>
                  <span className="category">Score: {review.score}/100</span>
                </div>

                <h4>
                  {review.repo_full_name} — PR #{review.pr_number}
                </h4>

                <div className="file">
                  {new Date(review.created_at).toLocaleString()}
                  {" · "}
                  {review.findings.length} finding
                  {review.findings.length === 1 ? "" : "s"}
                </div>

                <p>{review.summary}</p>

                {review.findings.length > 0 && (
                  <div className="suggestion">
                    <strong>Findings</strong>
                    {review.findings.map((f) => (
                      <p key={f.id}>
                        [{f.severity}] {f.title} — {f.file}
                        {f.line ? `:${f.line}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default HistoryPage;
