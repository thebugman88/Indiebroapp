import React from "react";
import { EngineMode } from "../types";
interface SystemHeuristicsHUDProps {
  engineMode: EngineMode;
  unleashedDrive: boolean;
  isSynthesizing: boolean;
}
export const SystemHeuristicsHUD: React.FC<SystemHeuristicsHUDProps> = ({
  engineMode,
  unleashedDrive,
  isSynthesizing,
}) => (
  <section className="rounded-xl border border-zinc-700 p-4 text-sm text-zinc-400">
    <h3 className="text-zinc-200">Session settings</h3>
    <p>
      Mode: {engineMode}. Creative drive: {unleashedDrive ? "on" : "off"}.
      Request: {isSynthesizing ? "in progress" : "idle"}.
    </p>
    <p>
      Server latency, cache statistics and audio processing telemetry are not
      available.
    </p>
  </section>
);
