// Promote an existing account to a site-wide role (default: super_admin).
//
//   dev:  npm run make-admin -- you@example.com
//   prod: npm run make-admin:prod -- you@example.com
//   other roles: npm run make-admin -- you@example.com content_mod
//
// The user's existing sessions are signed out so their next login carries the new role.
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { ROLES, User, type Role } from '../models/User.js';

const [identifier, roleArg = 'super_admin'] = process.argv.slice(2);

if (!identifier) {
  console.error('Usage: npm run make-admin -- <email or username> [role]');
  process.exit(1);
}
if (!ROLES.includes(roleArg as Role)) {
  console.error(`Unknown role "${roleArg}". Use one of: ${ROLES.join(', ')}`);
  process.exit(1);
}

await connectDB();

const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { username: identifier.toLowerCase() };
const user = await User.findOneAndUpdate(
  query,
  { $set: { role: roleArg }, $inc: { tokenVersion: 1 } },
  { returnDocument: 'after' },
);

if (!user) {
  console.error(`❌ No user found for "${identifier}". Register the account first, then run this again.`);
  await mongoose.disconnect();
  process.exit(1);
}

console.log(`✅ @${user.username} (${user.email}) is now ${user.role}. Log in again to use it.`);
await mongoose.disconnect();
