import { executeResilientAi } from "./aiResilience";
type Summary = {
  totalRequestsInspected: number;
  threatsBlocked: number;
  activeQuarantinedIps: number;
  severityCounts: Record<string, number>;
};
let latest: {
  at: number;
  recommendation: "observe" | "review_controls";
  note: string;
} | null = null;
export const securityReviewStatus = () => ({
  enabled: process.env.SECURITY_AI_REVIEW_ENABLED === "true",
  latest,
  advisoryOnly: true,
});
export function startSecurityReview(
  summary: () => Summary,
  review = executeResilientAi,
) {
  if (process.env.SECURITY_AI_REVIEW_ENABLED !== "true") return () => {};
  let busy = false;
  const timer = setInterval(
    async () => {
      if (busy) return;
      busy = true;
      try {
        const input = summary();
        // Only aggregate counts leave the server. No IPs, IDs, content, paths,
        // headers, bearer tokens, or security event text reach the AI provider.
        const safe = {
          requests: input.totalRequestsInspected,
          blocked: input.threatsBlocked,
          activeCooldowns: input.activeQuarantinedIps,
          severity: Object.fromEntries(
            ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((k) => [
              k,
              Number(input.severityCounts[k]) || 0,
            ]),
          ),
        };
        const result = await review({
          prompt: JSON.stringify(safe),
          systemInstruction:
            "Review aggregate security counters. Reply JSON with recommendation observe or review_controls and a short note. Counts alone cannot establish an intrusion. You have no enforcement authority.",
          responseMimeType: "application/json",
          models: process.env.SECURITY_AI_MODEL
            ? [process.env.SECURITY_AI_MODEL]
            : undefined,
          maxRetriesPerModel: 1,
          timeoutMs: 15000,
        });
        if (
          !["observe", "review_controls"].includes(result.data?.recommendation)
        )
          throw new Error();
        latest = {
          at: Date.now(),
          recommendation: result.data.recommendation,
          note: String(result.data.note || "").slice(0, 500),
        };
      } catch {
        latest = {
          at: Date.now(),
          recommendation: "review_controls",
          note: "Automated advisory unavailable; deterministic enforcement remains active.",
        };
      } finally {
        busy = false;
      }
    },
    15 * 60 * 1000,
  );
  timer.unref();
  return () => clearInterval(timer);
}
