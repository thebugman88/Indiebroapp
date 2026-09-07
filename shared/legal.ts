import { PURCHASE_POLICY, TERMS_VERSION as PURCHASE_TERMS_VERSION } from './economy';

export const LEGAL_OPERATOR = 'indiebrotherhood';
export const LEGAL_CONTACT_EMAIL = 'xchristopherrayx@gmail.com';
export const TERMS_VERSION = '2026-09-07-terms-v1';
export const PRIVACY_VERSION = '2026-09-07-privacy-v1';
export const AGE_POLICY_VERSION = '2026-09-07-age-v1';

export const TERMS_OF_SERVICE = `indiebrotherhood Terms of Service
Effective: September 7, 2026 · Version ${TERMS_VERSION}

These Terms govern your use of indiebrotherhood, an independent-music software and community service operated under the name indiebrotherhood. Contact: ${LEGAL_CONTACT_EMAIL}.

1. Eligibility and age safety
You must be at least 13 to create or use an account. If you are under 18, you must have permission from a parent or legal guardian. Hang Out—including rooms, direct messages, cyphers, and battles—is for adults 18 and older only. Lyric Pro's explicit-content setting is also 18+; clean lyric tools may be used by otherwise eligible members. We may require an age declaration, restrict access when an age cannot be established, and suspend accounts that provide false information. An entered birth date is a user declaration, not government-ID verification.

2. Accounts
Provide accurate information, protect your credentials, and use only your own account. Artist names are unique and permanently reserved to the first account that successfully claims them. Do not impersonate another person or evade a restriction.

3. Your content and permissions
You retain rights you already hold in content you submit. You grant indiebrotherhood and its service providers the limited permission needed to host, process, transmit, display, moderate, and return that content to operate the feature you selected. You must own or have permission to use submitted content. Do not submit private, copyrighted, or confidential material you lack authority to process.

4. AI and music tools
AI and analytical outputs may be incomplete, inaccurate, non-unique, or unsuitable. They are creative and informational assistance, not professional, legal, financial, medical, copyright-clearance, or commercial-success advice. Review outputs before relying on, releasing, or registering them. Local-processing labels apply only where a feature specifically says so; optional cloud or AI actions transmit the selected input to our providers.

5. Community safety
No grooming, sexual exploitation, predatory conduct, child endangerment, harassment, threats, hate, doxxing, stalking, fraud, spam, malicious code, unauthorized scraping, or instructions that facilitate real-world harm. Never solicit sexual content from a minor. Report unsafe conduct to ${LEGAL_CONTACT_EMAIL}. We may preserve evidence, remove content, restrict features, suspend accounts, or report conduct when reasonably necessary for safety or law.

6. Coins, subscriptions, and purchases
Brotherhood Coins are limited service credits, not money, stored value, cryptocurrency, or transferable property. Purchases, subscription renewal, taxes, refunds, storage extensions, and AI disclosures are governed by the separate Purchase Terms (version ${PURCHASE_TERMS_VERSION}). Stripe processes payment-card information; indiebrotherhood does not receive full card numbers.

7. Availability and enforcement
Features may change, pause, or end. We may enforce reasonable usage, storage, security, and moderation limits. We may suspend or terminate access for safety, legal, payment, or material Terms violations. You may stop using the service and request account deletion by contacting us.

8. Disclaimers and liability
The service is provided “as is” and “as available” to the extent permitted by law. We do not guarantee uninterrupted service, preservation of drafts, specific income, chart performance, rights clearance, or fitness for a particular purpose. To the maximum extent permitted by law, indiebrotherhood is not liable for indirect, incidental, special, consequential, or lost-profit damages. Rights that cannot legally be waived remain unaffected.

9. Changes and contact
Material changes will be identified by a new version and, when appropriate, a new acceptance request. Questions, safety reports, and legal notices: ${LEGAL_CONTACT_EMAIL}.`;

export const PRIVACY_POLICY = `indiebrotherhood Privacy Policy
Effective: September 7, 2026 · Version ${PRIVACY_VERSION}

This policy explains how indiebrotherhood handles information. Contact: ${LEGAL_CONTACT_EMAIL}.

1. Information we handle
We handle account information (email, unique artist name, authentication identifiers, verification status, and profile choices); an age declaration and the resulting minor/adult eligibility status; content you choose to upload or enter; feature activity, XP, streaks, badges, Coin balances and transactions; purchase and subscription records; support messages; and security/technical data such as request time, device/browser information, IP-derived security signals, and error logs.

2. Age data
During signup, the server uses the entered birth date to determine whether the account is under 13, a 13–17 minor, or an adult. The exact birth date is not retained by indiebrotherhood after that calculation. We retain the derived age band, guardian-permission declaration where required, policy version, and declaration time. Users without a sufficient adult declaration cannot access Hang Out, DMs, cyphers, battles, or Lyric Pro explicit mode.

3. How we use information
We use information to authenticate users; provide, personalize, secure, meter, and improve tools; maintain profiles and progress; process purchases; prevent fraud and abuse; moderate community features; respond to support; comply with law; and communicate important service changes.

4. Processing and providers
Google Firebase/Firestore and Cloud Run support authentication, application hosting, databases, and logs. Stripe processes payments. Google AI services may process prompts, selected content, and necessary context when a user invokes a cloud-AI feature. A feature described as browser-local processes its core media in the browser, but ordinary hosting, authentication, security, and telemetry requests can still occur. Optional AI actions may send selected extracted text or content to the named provider.

5. Sharing
We do not sell personal information. We share information only with service providers acting for the service, with other users when you intentionally use a community feature, during a legitimate business transition, to protect users or the service, or when required by law. Public/profile fields and community posts should be treated as visible to their intended audience.

6. Retention and deletion
Retention depends on the feature and legal/security need. Browser drafts may disappear when a session or local data is cleared. Lyric Pro may keep limited recent encrypted history—currently up to 10 songs or 24 hours—unless a feature states otherwise. Account, moderation, security, payment, tax, and dispute records may be kept longer where reasonably required. Request access, correction, or deletion at ${LEGAL_CONTACT_EMAIL}; some records may remain where law, fraud prevention, security, or dispute handling requires them.

7. Security
We use access controls, verified authentication, encryption measures, rate limits, monitoring, and separation of private records. No internet service is perfectly secure. Keep your password private and report suspected compromise promptly.

8. Children and community safety
Accounts are not intended for children under 13. Members aged 13–17 require parent or guardian permission and cannot use adult-restricted features. We do not knowingly permit under-13 accounts. Report suspected child endangerment or predatory conduct immediately to ${LEGAL_CONTACT_EMAIL}.

9. Choices and changes
You can choose whether to invoke cloud AI, upload content, make a purchase, or join eligible community features. Material policy changes receive a new version and may require renewed acceptance. Questions: ${LEGAL_CONTACT_EMAIL}.`;

export const LEGAL_DOCUMENTS = {
  'terms-of-service': { version: TERMS_VERSION, title: 'Terms of Service', text: TERMS_OF_SERVICE },
  privacy: { version: PRIVACY_VERSION, title: 'Privacy Policy', text: PRIVACY_POLICY },
  'purchase-terms': { version: PURCHASE_TERMS_VERSION, title: 'Purchase Terms and AI Disclosure', text: `indiebrotherhood — Purchase Terms and AI Disclosure\n\n${PURCHASE_POLICY}` },
} as const;

export const STUDIO_NOTICES: Record<string, string> = {
  'lyric-pro': 'AI lyrics require human review and are not guaranteed unique or cleared. Explicit mode is restricted to adults 18+.',
  'hang-out': 'Adults 18+ only. Community messages may be moderated for safety. Report predatory, threatening, or exploitative conduct immediately.',
  'artist-assistant': 'General creative and business information only; not legal, financial, or professional advice.',
  'hit-analyzer': 'Scores are estimates, not predictions or guarantees of audience response or commercial success.',
  'judgement-zone': 'Blind judging reduces visible identity cues but does not guarantee anonymity.',
  'royalty-ops': 'Review extracted fields for accuracy. Optional cloud AI sends selected content to the provider.',
  'mastering-suite': 'Core audio processing identified as local stays in your browser; download work you need to keep.',
  'quick-tools': 'Calculated results are estimates. Verify tempo, key, timing, and release data before relying on them.',
  'semantic-lab': 'AI semantic analysis may be incomplete or inaccurate; review before publishing.',
  'sonic-iq': 'Quizzes are for entertainment and informal learning, not professional certification.',
  'meeting-room': 'Only record or share a meeting when every participant has the required permission.',
};
