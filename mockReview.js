const review = {
    prNumber: 42,
    repo: "demo-app",
    score: 62,
    status: "FAILED",
    summary: "Critical vulnerabilities found in new authentication logic.",
    createdAt: new Date().toLocaleString(),
    issues: [
        {
            severity: "CRITICAL",
            title: "SQL Injection",
            file: "src/auth.js",
            line: 42,
            problem: "User input interpolated into SQL query.",
            fix: "Use parameterized query."
        },
        {
            severity: "LOW",
            title: "Console Log in Production",
            file: "src/auth.js",
            line: 78,
            problem: "Debug log present.",
            fix: "Remove console.log."
        }
    ]
};