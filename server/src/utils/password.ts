import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Hash of a throwaway string, compared against when a user doesn't exist (or has no password),
// so "no such user" takes the same time as "wrong password" — prevents user enumeration.
const DUMMY_HASH = bcrypt.hashSync('grove-timing-dummy', SALT_ROUNDS);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string | null | undefined): Promise<boolean> {
  const matches = await bcrypt.compare(plain, hash ?? DUMMY_HASH);
  return matches && Boolean(hash);
}
