# Judgement Zone Audit

## Fixed

- Removed randomized synthetic peer reviews from seed initialization, new submissions, and the artist dossier.
- Removed the dossier control that manufactured incoming reviews.
- Removed the fake judge name, XP, reputation, completed audits, and pre-saved track defaults.
- Added Firebase Anonymous Auth and Firestore persistence with local-storage fallback for development or outages.
- Added Vite environment typing and Firebase CLI rules/config templates.
- Replaced the AI Studio starter README with Firebase and Vercel deployment guidance.

## Production requirements

- Enable Anonymous Auth and Firestore in Firebase Console.
- Add the `VITE_FIREBASE_*` variables to Vercel Preview and Production environments.
- Deploy `firestore.rules` and `storage.rules` with the Firebase CLI.
- Move review creation, XP, quotas, and aggregation into a trusted Cloud Function or Vercel server endpoint before public launch. Client-side checks cannot prevent abuse.
- Upload audio and cover art to Firebase Storage; browser object URLs are only local previews and are not cross-device storage.

## Validation

- `npm run lint` passes.
- `npm run build` passes.
- Build emits a bundle-size warning because the Firebase client and UI currently ship in one large chunk; code-splitting is a later performance optimization.
