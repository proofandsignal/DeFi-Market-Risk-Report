const BLOCKED_PATTERNS = [
  /\byou should\b/i,
  /\bwe recommend\b/i,
  /\bi recommend\b/i,
  /\bput\s+[€$£]?\d[\d,.]*\s+into\b/i,
  /\binvest\s+[€$£]?\d[\d,.]*\s+in\b/i,
  /\ballocate\s+\d{1,3}%\b/i,
  /\bbest investment for you\b/i,
  /^\s*sell\b[^.\n]{0,80}\band\s+repay\b/im,
];

export function assertNoPersonalAdvice(text) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `Advice Firewall blocked potentially personalized recommendation: ${pattern}`,
      );
    }
  }
  return true;
}
