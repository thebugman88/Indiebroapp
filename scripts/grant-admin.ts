import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '../server/auth';

const uid = process.argv[2];
if (!uid || process.argv[3] !== '--confirm') {
  throw new Error('Usage: npx tsx scripts/grant-admin.ts <verified Firebase UID> --confirm');
}
const auth = getAuth(getFirebaseAdminApp());
const user = await auth.getUser(uid);
if (!user.emailVerified || user.disabled) throw new Error('Verify the account email before granting admin access.');
await auth.setCustomUserClaims(uid, { ...user.customClaims, admin: true });
console.log('Admin claim saved for the specified UID. Sign out and back in to refresh the session.');
