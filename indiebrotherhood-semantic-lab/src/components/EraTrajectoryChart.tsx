import React from "react";
interface EraTrajectoryChartProps {
  hasResult?: boolean;
  peakProbability: number;
  sonicSaturation: "LOW" | "MEDIUM" | "HIGH" | "MAX_OVERDRIVE";
  eraCompatibility: "OPTIMAL" | "SUB-OPTIMAL" | "BREAKTHROUGH_PIONEER";
  isSynthesizing: boolean;
  unleashedDrive: boolean;
}

export const EraTrajectoryChart: React.FC<EraTrajectoryChartProps> = ({
  hasResult,
  peakProbability,
  sonicSaturation,
  eraCompatibility,
  isSynthesizing,
}) => (
  <section className="rounded-xl border border-zinc-700 bg-zinc-950 p-5 text-zinc-300">
    <h3 className="font-bold text-cyan-300">Creative assessment</h3>
    <p className="mt-3">
      {isSynthesizing
        ? "Generating…"
        : !hasResult
          ? "Run synthesis to receive feedback."
          : `Advisory score: ${peakProbability.toFixed(1)} / 100`}
    </p>
    {hasResult && (
      <p>
        Suggested intensity: {sonicSaturation}. Era fit: {eraCompatibility}.
      </p>
    )}
    <p className="mt-3 text-sm text-zinc-400">
      AI commentary on this submission only. No historical market data, audio
      frequency measurement, or commercial success probability is available.
    </p>
  </section>
);
