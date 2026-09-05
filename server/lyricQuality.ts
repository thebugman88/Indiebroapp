import { createHash } from "node:crypto";
import { economyDb } from "./economy";
import { sealPrivate, openPrivate } from "./dataProtection";
import { textField } from "./media";
export function lyricInput(payload: any) {
  const mode = payload.mode ?? "full_song",
    userLyricsOption = payload.userLyricsOption ?? "finish_lyrics";
  if (
    !["ideas_6", "starter", "full_song", "user_lyrics", "auto"].includes(
      mode,
    ) ||
    !["finish_lyrics", "ideas_from_lyrics", "enhance_pattern"].includes(
      userLyricsOption,
    )
  )
    throw new Error("Choose a supported writing mode.");
  if (payload.explicit !== undefined && typeof payload.explicit !== "boolean")
    throw new Error("Invalid explicit setting.");
  const customGenre = textField(payload.customGenre ?? "", 120, false),
    customVibe = textField(payload.customVibe ?? "", 120, false);
  return {
    genre: customGenre || textField(payload.genre ?? "Hip-Hop", 120),
    vibe: customVibe || textField(payload.vibe ?? "Aggressive", 120),
    explicit: payload.explicit === true,
    mode,
    structure: textField(
      payload.structure ?? "Verse-Chorus-Verse-Chorus-Bridge-Outro",
      500,
    ),
    userLyrics: textField(payload.userLyrics ?? "", 20000, false),
    creativePrompt: textField(payload.creativePrompt ?? "", 2000, false),
    userLyricsOption,
  };
}
const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
function lines(sections: any): string[] {
  if (!Array.isArray(sections) || !sections.length || sections.length > 30)
    throw new Error("Incomplete lyric structure.");
  return sections.flatMap((section) => {
    if (
      typeof section.section_name !== "string" ||
      !Array.isArray(section.lines) ||
      !section.lines.length ||
      section.lines.length > 80
    )
      throw new Error("Incomplete lyric section.");
    return section.lines.map((line: any) => {
      if (
        typeof line.text !== "string" ||
        !line.text.trim() ||
        line.text.length > 700 ||
        /\b(?:insert lyrics|placeholder|lorem ipsum|repeat previous)\b/i.test(
          line.text,
        )
      )
        throw new Error("Incomplete lyric line.");
      return line.text.trim();
    });
  });
}
export function lyricFingerprints(text: string): string[] {
  const words = normalize(text).split(" "),
    out = new Set<string>();
  if (words.length > 1500)
    throw new Error("Lyric output exceeds the song word limit.");
  const hash = (s: string) =>
    createHash("sha256").update(s).digest().subarray(0, 16).toString("base64");
  for (let i = 0; i + 6 <= words.length; i++)
    out.add(hash(`passage:${words.slice(i, i + 6).join(" ")}`));
  for (const line of text.split("\n"))
    if (normalize(line)) out.add(hash(`line:${normalize(line)}`));
  return [...out];
}
export function validateDualLyrics(data: any, mode: string = "full_song") {
  if (
    [data?.song_metadata?.title, data?.alternate_take?.title].some(
      (t) => typeof t !== "string" || !t.trim() || t.length > 200,
    )
  )
    throw new Error("Both songs must have their own title.");
  const a = lines(data.lyrics),
    b = lines(data.alternate_take.lyrics);
  const minimum = ["full_song", "auto", "user_lyrics"].includes(mode) ? 24 : 4;
  if (a.length < minimum || b.length < minimum)
    throw new Error("Both lyric sets must be complete for the selected mode.");
  if (a.join("\n").length > 40000 || b.join("\n").length > 40000)
    throw new Error("Lyric output too large.");
  if (
    normalize(data.song_metadata.title) === normalize(data.alternate_take.title)
  )
    throw new Error("Both songs need distinct titles.");
  const fa = lyricFingerprints(a.join("\n")),
    fb = lyricFingerprints(b.join("\n")),
    seen = new Set(fa);
  if (!fa.length || !fb.length || fb.some((x) => seen.has(x)))
    throw new Error("The two songs overlap. Please regenerate.");
  return [fa, fb];
}
// An atomic check also catches simultaneous generations that reuse a recent
// passage. Encrypted fingerprints expire after 24h and retain at most ten songs.
export async function rememberOriginalLyrics(
  uid: string,
  fingerprints: string[][],
) {
  const ref = economyDb().doc(`lyricOriginality/${uid}`),
    now = Date.now();
  await economyDb().runTransaction(async (t) => {
    const doc = await t.get(ref);
    const history: Array<{ at: number; fingerprints: string[] }> = doc.exists
      ? openPrivate(doc.data()!.private, `lyric-history:${uid}`)
      : [];
    const recent = history.filter((h) => h.at + 86400000 > now).slice(-10);
    const previous = new Set(recent.flatMap((h) => h.fingerprints));
    if (fingerprints.some((song) => song.some((f) => previous.has(f))))
      throw new Error("This generation repeats a recent lyric passage.");
    const next = [
      ...recent,
      ...fingerprints.map((f) => ({ at: now, fingerprints: f })),
    ].slice(-10);
    t.set(ref, {
      private: sealPrivate(next, `lyric-history:${uid}`),
      deleteAfter: new Date(now + 86400000),
    });
  });
}
