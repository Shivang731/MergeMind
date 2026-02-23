const mainContent = document.getElementById("mainContent");

function scoreClass(score) {
    if (score >= 90) return "score-green";
    if (score >= 70) return "score-yellow";
    if (score >= 50) return "score-orange";
    return "score-red";
}

function statusClass(status) {
    return status === "PASSED" ? "passed" : "failed";
}

function setActiveNav(el) {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active-nav"));
    if (el) el.classList.add("active-nav");
}

function showDashboard(el) {
    if (el) setActiveNav(el);

    mainContent.innerHTML = `
    <div class="container">
        <div class="header">Dashboard</div>

        <div class="stats">
            <div class="card"><div class="stat-label">Total PRs</div><div class="stat-value">12</div></div>
            <div class="card"><div class="stat-label">Passed</div><div class="stat-value" style="color:var(--success)">8</div></div>
            <div class="card"><div class="stat-label">Failed</div><div class="stat-value" style="color:var(--error)">4</div></div>
            <div class="card"><div class="stat-label">Avg Score</div><div class="stat-value">78</div></div>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Pull Request</th>
                        <th>Repository</th>
                        <th>Health Score</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr onclick="showDetail()">
                        <td>#${review.prNumber}</td>
                        <td>${review.repo}</td>
                        <td><span class="badge ${scoreClass(review.score)}">${review.score}</span></td>
                        <td><span class="badge ${statusClass(review.status)}">${review.status}</span></td>
                        <td>${review.createdAt}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>`;
}

function showDetail() {
    mainContent.innerHTML = `
    <div class="container">
        <div class="loading">
            <div id="loadingText">Running security scan...</div>
            <div class="spinner"></div>
        </div>
    </div>`;

    setTimeout(renderDetail, 2000);
}

function renderDetail() {
    mainContent.innerHTML = `
    <div class="container">
        <div class="header">
            PR #${review.prNumber} — ${review.repo}
            <button onclick="showDashboard()" style="float:right;padding:8px 14px;border:none;border-radius:8px;cursor:pointer;">← Back</button>
        </div>

        <div class="card" style="margin-bottom:24px;border-left:4px solid var(--error)">
            <span class="badge ${scoreClass(review.score)}">Score ${review.score}</span>
            <span class="badge ${statusClass(review.status)}">${review.status}</span>
            <p style="margin-top:16px">${review.summary}</p>
        </div>

        ${review.issues.map(issue => `
            <div class="issue">
                <strong>${issue.severity}</strong> — ${issue.title}<br>
                <small>${issue.file} : line ${issue.line}</small>
                <div class="issue-box"><strong>Problem:</strong> ${issue.problem}</div>
                <div class="issue-box"><strong>Fix:</strong> ${issue.fix}</div>
            </div>
        `).join("")}
    </div>`;
}

showDashboard();