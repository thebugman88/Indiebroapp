/** Validate inline media before sending to a provider or storing it. No remote URL fetching. */
export function decodeAudioDataUrl(value: unknown, maxBytes = 15_000_000) {
  if (typeof value !== "string") throw new Error("Upload an audio file.");
  const match =
    /^data:(audio\/[a-zA-Z0-9.+-]+)(?:;codecs=[a-zA-Z0-9.,-]+)?;base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value,
    );
  if (!match || match[2].length > Math.ceil(maxBytes / 3) * 4)
    throw new Error("Invalid or oversized audio.");
  const bytes = Buffer.from(match[2], "base64");
  if (
    bytes.length < 16 ||
    bytes.length > maxBytes ||
    bytes.toString("base64") !== match[2]
  )
    throw new Error("Invalid audio encoding.");
  const head = bytes.subarray(0, 12);
  const detected =
    head.subarray(0, 4).toString() === "RIFF" &&
    head.subarray(8, 12).toString() === "WAVE"
      ? "audio/wav"
      : head.subarray(0, 4).toString() === "OggS"
        ? "audio/ogg"
        : head.readUInt32BE(0) === 0x1a45dfa3
          ? "audio/webm"
          : head.subarray(0, 4).toString() === "fLaC"
            ? "audio/flac"
            : head.subarray(4, 8).toString() === "ftyp"
              ? "audio/mp4"
              : head.subarray(0, 3).toString() === "ID3" ||
                  (head[0] === 255 && (head[1] & 224) === 224)
                ? "audio/mpeg"
                : null;
  if (!detected) throw new Error("Unsupported or invalid audio file.");
  return { bytes, mimeType: detected, base64: match[2] };
}
export function textField(
  value: unknown,
  max: number,
  required = true,
): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error("Invalid text field.");
  return value.trim();
}
export function safeId(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    throw new Error("Invalid account or record ID.");
  return value;
}
