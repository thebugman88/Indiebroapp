// Settings may persist preferences, never provider credentials. BYOK stays in UI memory.
export function withoutProviderCredentials<T extends object>(settings: T): T {
  const safe: any = { ...settings };
  for (const key of ['customApiKey', 'geminiApiKey']) {
    if (key in safe) safe[key] = '';
  }
  if (safe.byokKeys && typeof safe.byokKeys === 'object') {
    safe.byokKeys = Object.fromEntries(Object.keys(safe.byokKeys).map(key => [key, '']));
  }
  return safe;
}
