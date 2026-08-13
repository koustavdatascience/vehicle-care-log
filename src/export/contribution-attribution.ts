/**
 * Validates the GitHub no-reply address format used for attribution of future
 * substantive repository commits. Commit configuration remains local and is
 * therefore verified separately before a release push.
 */
export function isGithubNoReplyEmail(email: string, login: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedLogin = login.trim().toLowerCase();
  const expectedSuffix = `+${normalizedLogin}@users.noreply.github.com`;
  const plusIndex = normalizedEmail.indexOf("+");

  return (
    normalizedLogin.length > 0 &&
    plusIndex > 0 &&
    normalizedEmail.endsWith(expectedSuffix) &&
    /^\d+$/.test(normalizedEmail.slice(0, plusIndex))
  );
}
