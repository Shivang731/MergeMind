const API_BASE = location.protocol.startsWith("http") ? location.origin : "http://localhost:3001";
const mainContent = document.getElementById("mainContent");

let reviews = [];
let stats = null;
let selectedReviewId = null;

function scoreClass(score) {
    if (score === null || score === undefined) return "score-muted";
    if (score >= 90) return "score-green";
    if (score >= 70) return "score-yellow";
    if (score >= 50) return "score-orange";
    return "score-red";
}

function statusClass(status) {
    if (status === "PASSED") return "passed";
    if (status === "FAILED") return "failed";
    return "scanning";
}

function setActiveNav(view) {
    document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.toggle("active-nav", item.dataset.view === view);
    });
}

async function loadDashboard() {
    setActiveNav("dashboard");
    renderShell("loading");

    try {
        const [statsResponse, reviewsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/stats`),
            fetch(`${API_BASE}/api/reviews?limit=20`),
        ]);

        if (!statsResponse.ok || !reviewsResponse.ok) throw new Error("Dashboard API returned an error.");

        stats = await statsResponse.json();
        reviews = await reviewsResponse.json();

        if (reviews.length === 0) {
            reviews = [review];
            stats = { total: 1, passed: 0, failed: 1, avgScore: review.score };
        }

        renderDashboard();
    } catch (err) {
        renderShell("error", err.message);
    }
}

function renderShell(state, message = "") {
    if (state === "loading") {
        mainContent.innerHTML = `
        <main class="container" aria-busy="true">
            <div class="header-row">
                <h1>Dashboard</h1>
                <button class="button secondary" type="button" disabled>Refresh</button>
            </div>
            <div class="stats">${Array.from({ length: 4 }).map(() => `<div class="card skeleton"></div>`).join("")}</div>
            <div class="card table-card skeleton-table"></div>
        </main>`;
        return;
    }

    mainContent.innerHTML = `
    <main class="container">
        <div class="empty-state error-state">
            <h1>Dashboard unavailable</h1>
            <p>${escapeHtml(message || "The backend is not reachable yet.")}</p>
            <button class="button" type="button" onclick="loadDashboard()">Retry</button>
        </div>
    </main>`;
}

function renderDashboard() {
    mainContent.innerHTML = `
    <main class="container">
        <div class="header-row">
            <div>
                <p class="eyebrow">Hackathon MVP</p>
                <h1>MergeMind Reviews</h1>
            </div>
            <button class="button secondary" type="button" onclick="loadDashboard()">Refresh</button>
        </div>

        <section class="stats" aria-label="Review stats">
            ${statCard("Total PRs", stats.total)}
            ${statCard("Passed", stats.passed, "success-text")}
            ${statCard("Failed", stats.failed, "error-text")}
            ${statCard("Avg Score", stats.avgScore ?? "N/A")}
        </section>

        <section class="card table-card">
            <div class="section-head">
                <h2>Recent Pull Requests</h2>
                <span>${reviews.length} shown</span>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Pull Request</th>
                            <th>Repository</th>
                            <th>Health</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reviews.map(rowTemplate).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    </main>`;
}

function statCard(label, value, className = "") {
    return `<div class="card stat-card"><div class="stat-label">${label}</div><div class="stat-value ${className}">${value}</div></div>`;
}

function rowTemplate(item) {
    return `
    <tr>
        <td><button class="row-button" type="button" onclick="showDetail('${item.id || "demo"}')">#${item.prNumber} ${escapeHtml(item.title || "")}</button></td>
        <td>${escapeHtml(item.repo)}</td>
        <td><span class="badge ${scoreClass(item.score)}">${item.score ?? "Pending"}</span></td>
        <td><span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span></td>
        <td>${formatDate(item.createdAt)}</td>
    </tr>`;
}

function showDetail(id) {
    selectedReviewId = id;
    const item = reviews.find((candidate) => String(candidate.id || "demo") === String(id)) || reviews[0];
    if (!item) return renderDashboard();

    mainContent.innerHTML = `
    <main class="container detail-view">
        <div class="header-row">
            <div>
                <p class="eyebrow">${escapeHtml(item.repo)}</p>
                <h1>PR #${item.prNumber}</h1>
            </div>
            <button class="button secondary" type="button" onclick="renderDashboard()">Back</button>
        </div>

        <section class="card review-summary">
            <div>
                <span class="badge ${scoreClass(item.score)}">Score ${item.score ?? "Pending"}</span>
                <span class="badge ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
            </div>
            <p>${escapeHtml(item.summary)}</p>
        </section>

        <section class="issue-list">
            ${item.issues && item.issues.length ? item.issues.map(issueTemplate).join("") : emptyIssues()}
        </section>
    </main>`;
}

function issueTemplate(issue) {
    return `
    <article class="issue">
        <div class="issue-title">
            <strong>${escapeHtml(issue.severity)}</strong>
            <span>${escapeHtml(issue.title)}</span>
        </div>
        <p class="issue-location">${escapeHtml(issue.file)}:${issue.line}</p>
        <div class="issue-box"><strong>Problem:</strong> ${escapeHtml(issue.problem)}</div>
        <div class="issue-box"><strong>Fix:</strong> ${escapeHtml(issue.fix)}</div>
    </article>`;
}

function emptyIssues() {
    return `
    <div class="empty-state">
        <h2>No issues found</h2>
        <p>The MVP analyzer did not flag the changed lines.</p>
    </div>`;
}

function formatDate(value) {
    if (!value) return "N/A";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    }[char]));
}

document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
        if (item.dataset.view === "dashboard" || item.dataset.view === "pulls") return loadDashboard();
        setActiveNav(item.dataset.view);
        mainContent.innerHTML = `
        <main class="container">
            <div class="empty-state">
                <h1>${item.textContent}</h1>
                <p>This hackathon MVP focuses on webhook intake, AI-style review, persistence, and PR status.</p>
            </div>
        </main>`;
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selectedReviewId) {
        selectedReviewId = null;
        renderDashboard();
    }
});

loadDashboard();
