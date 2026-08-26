export type ReviewSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ReviewIssueType = 'SECURITY' | 'BUG' | 'MISSING_TESTS' | 'CODE_QUALITY' | 'CONTEXT';
export type ReviewStatus = 'PASSED' | 'FAILED';

export interface ReviewIssueInput {
  severity: ReviewSeverity;
  type: ReviewIssueType;
  title: string;
  file: string;
  line: number;
  problem: string;
  code: string;
  fix: string;
}

export interface ReviewAnalysis {
  status: ReviewStatus;
  healthScore: number;
  summaryText: string;
  rawComment: string;
  issues: ReviewIssueInput[];
}
