export function canMountMasteringSuite(userId: string | null | undefined): boolean {
  return Boolean(userId && userId !== 'guest');
}
