import { ReviewAnalysis, ReviewIssueInput, ReviewSeverity } from './types';

interface AddedLine {
  file: string;
  line: number;
  code: string;
}

const severityPenalty: Record<ReviewSeverity, number> = {
  CRITICAL: 35,
  HIGH: 25,
  MEDIUM: 12,
  LOW: 5,
};

export function analyzeDiff(diffText: string, changedFiles: string[]): ReviewAnalysis {
  const addedLines = parseAddedLines(diffText);
  const issues: ReviewIssueInput[] = [];

  for (const line of addedLines) {
    const code = line.code.trim();

    if (/process\.env\.[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD)|api[_-]?key|secret|password/i.test(code) && /=\s*['"`][^'"`]+['"`]/.test(code)) {
      issues.push(issue('HIGH', 'SECURITY', 'Possible hardcoded secret', line, 'A secret-like value appears to be committed in source code.', 'Move secrets to environment variables or a secret manager.'));
    }

    if (/\b(eval|Function)\s*\(/.test(code)) {
      issues.push(issue('CRITICAL', 'SECURITY', 'Dynamic code execution', line, 'User-controlled strings can become executable code.', 'Remove dynamic execution and call explicit functions instead.'));
    }

    if (/\.(innerHTML|outerHTML)\s*=|document\.write\s*\(/.test(code)) {
      issues.push(issue('HIGH', 'SECURITY', 'Unsafe DOM injection', line, 'HTML is written directly into the page and may allow XSS.', 'Render text safely or sanitize trusted HTML before insertion.'));
    }

    if (/(SELECT|INSERT|UPDATE|DELETE).*(\$\{|"\s*\+|'\s*\+)/i.test(code)) {
      issues.push(issue('CRITICAL', 'SECURITY', 'Possible SQL injection', line, 'A SQL statement appears to be built through string interpolation or concatenation.', 'Use parameterized queries or your ORM query builder.'));
    }

    if (/console\.(log|debug)\s*\(/.test(code)) {
      issues.push(issue('LOW', 'CODE_QUALITY', 'Debug logging left in code', line, 'Debug logs can leak implementation details and add noise in production.', 'Remove the log or route it through structured logging with levels.'));
    }

    if (/\bcatch\s*\([^)]*\)\s*{\s*}/.test(code)) {
      issues.push(issue('MEDIUM', 'BUG', 'Empty catch block', line, 'The error is swallowed, making failures hard to diagnose.', 'Handle the error, return a useful response, or log it with context.'));
    }
  }

  if (changedFiles.some(isProductionCode) && !changedFiles.some(isTestFile)) {
    issues.push({
      severity: 'MEDIUM',
      type: 'MISSING_TESTS',
      title: 'No tests changed',
      file: changedFiles.find(isProductionCode) || changedFiles[0] || 'unknown',
      line: 1,
      problem: 'Production code changed without nearby test coverage in this PR.',
      code: '',
      fix: 'Add or update tests that cover the changed behavior.',
    });
  }

  const healthScore = Math.max(0, 100 - issues.reduce((score, item) => score + severityPenalty[item.severity], 0));
  const status = issues.some((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH') || healthScore < 70 ? 'FAILED' : 'PASSED';
  const summaryText = summarize(status, healthScore, issues);
  const rawComment = renderComment(status, healthScore, summaryText, issues);

  return { status, healthScore, summaryText, rawComment, issues };
}

function parseAddedLines(diffText: string): AddedLine[] {
  const added: AddedLine[] = [];
  let file = 'unknown';
  let newLine = 0;

  for (const rawLine of diffText.split('\n')) {
    const fileMatch = rawLine.match(/^diff --git a\/.+ b\/(.+)$/);
    if (fileMatch) {
      file = fileMatch[1];
      newLine = 0;
      continue;
    }

    const hunkMatch = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      newLine = Number(hunkMatch[1]);
      continue;
    }

    if (rawLine.startsWith('+++')) continue;
    if (rawLine.startsWith('+')) {
      added.push({ file, line: Math.max(newLine, 1), code: rawLine.slice(1) });
      newLine += 1;
      continue;
    }

    if (!rawLine.startsWith('-') && newLine > 0) newLine += 1;
  }

  return added;
}

function issue(severity: ReviewSeverity, type: ReviewIssueInput['type'], title: string, line: AddedLine, problem: string, fix: string): ReviewIssueInput {
  return { severity, type, title, file: line.file, line: line.line, problem, code: line.code.trim(), fix };
}

function isTestFile(file: string): boolean {
  return /(^|\/)(__tests__|tests?)\/|(\.|-)(test|spec)\.[tj]sx?$/.test(file);
}

function isProductionCode(file: string): boolean {
  return /\.(ts|tsx|js|jsx|py|go|rs|java|rb|php)$/.test(file) && !isTestFile(file);
}

function summarize(status: string, score: number, issues: ReviewIssueInput[]): string {
  if (issues.length === 0) return 'No high-signal issues found in the changed lines.';
  const critical = issues.filter((item) => item.severity === 'CRITICAL').length;
  const high = issues.filter((item) => item.severity === 'HIGH').length;
  const blocking = critical + high;
  if (status === 'FAILED') {
    return `${blocking || issues.length} blocking issue${(blocking || issues.length) === 1 ? '' : 's'} found across ${issues.length} total finding${issues.length === 1 ? '' : 's'}. Health score: ${score}.`;
  }
  return `${issues.length} non-blocking issue${issues.length === 1 ? '' : 's'} found. Health score: ${score}.`;
}

function renderComment(status: string, score: number, summary: string, issues: ReviewIssueInput[]): string {
  const heading = status === 'FAILED' ? 'MergeMind review: changes requested' : 'MergeMind review: ready for human review';
  const body = issues.length === 0
    ? 'No issues were detected by the MVP analyzer.'
    : issues.slice(0, 8).map((item) => `- **${item.severity}** ${item.file}:${item.line} - ${item.title}. ${item.fix}`).join('\n');

  return `## ${heading}\n\n**Health score:** ${score}/100\n\n${summary}\n\n${body}\n\n_Analyzer: MergeMind hackathon MVP._`;
}
