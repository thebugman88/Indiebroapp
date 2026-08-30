import { authenticatedFetch } from "../../../src/services/authService";
import type { ArtistTrack, JudgeReview, UserJudgeProfile } from "../types";
async function request(path: string, method = "GET", body?: unknown) {
  const res = await authenticatedFetch("/api/judgement" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Operation failed.");
  return data;
}
export const loadStoredTracks = (): Promise<ArtistTrack[]> =>
  request("/tracks");
export const loadStoredProfile = (): Promise<UserJudgeProfile> =>
  request("/profile");
export const saveProfile = (p: UserJudgeProfile): Promise<UserJudgeProfile> =>
  request("/profile", "PATCH", {
    name: p.name,
    tasteProfile: p.tasteProfile,
    savedVaultTrackIds: p.savedVaultTrackIds,
    termsAccepted: p.termsAccepted,
  });
export const useSkip = (): Promise<UserJudgeProfile> =>
  request("/skip", "POST", {});
export const startListening = (id: string) =>
  request("/tracks/" + encodeURIComponent(id) + "/listen", "POST", {});
export const submitReview = (
  id: string,
  review: JudgeReview,
): Promise<{
  track: ArtistTrack;
  profile: UserJudgeProfile;
  review: JudgeReview;
}> =>
  request("/tracks/" + encodeURIComponent(id) + "/reviews", "POST", {
    scores: review.scores,
    writtenFeedback: review.writtenFeedback,
  });
export async function submitTrack(
  track: ArtistTrack,
  file: File,
): Promise<ArtistTrack> {
  if (file.size > 15000000) throw new Error("Audio must be at most 15 MB.");
  const audioData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Audio could not be read."));
    reader.readAsDataURL(file);
  });
  return request("/tracks", "POST", { ...track, audioData });
}
