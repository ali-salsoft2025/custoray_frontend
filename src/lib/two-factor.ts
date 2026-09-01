const CHALLENGE_KEY = "custoray:2fa-challenge"

export function saveTwoFactorChallenge(token: string) {
  sessionStorage.setItem(CHALLENGE_KEY, token)
}

export function loadTwoFactorChallenge() {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(CHALLENGE_KEY)
}

export function clearTwoFactorChallenge() {
  sessionStorage.removeItem(CHALLENGE_KEY)
}

export function formatTotpSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim()
}
