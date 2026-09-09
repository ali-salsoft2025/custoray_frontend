export function firstSegmentAfter(pathname: string, prefix: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/"
  const base = prefix.replace(/\/+$/, "")
  if (!normalized.startsWith(`${base}/`)) return ""
  return decodeURIComponent(normalized.slice(base.length + 1).split("/")[0] || "")
}

export function pathMatch(pathname: string, pattern: RegExp): string {
  const normalized = pathname.replace(/\/+$/, "") || "/"
  const match = normalized.match(pattern)
  return match?.[1] ? decodeURIComponent(match[1]) : ""
}
