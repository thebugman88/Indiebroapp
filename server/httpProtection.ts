import type { RequestHandler } from "express";
export const httpProtection: RequestHandler = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), geolocation=(), microphone=(self)",
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (req.originalUrl.toLowerCase().startsWith("/api/"))
    res.setHeader("Cache-Control", "private, no-store");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://checkout.stripe.com; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https://audio-ssl.itunes.apple.com https://audio.itunes.apple.com; worker-src 'self' blob:; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://generativelanguage.googleapis.com https://api.datamuse.com https://api.dictionaryapi.dev https://musicbrainz.org https://api.deezer.com https://cdn.jsdelivr.net/npm/@tesseract.js-data/; frame-src 'none'",
    );
  }
  next();
};
