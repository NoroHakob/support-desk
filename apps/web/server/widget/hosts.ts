const DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1"]);

// Outside production, localhost counts as allowed for every workspace without
// being stored (TECH-STACK section 6). It never marks the snippet installed.
export function isDevelopmentHost(host: string) {
  return process.env.NODE_ENV !== "production" && DEVELOPMENT_HOSTS.has(host);
}

export function isAllowedHost(host: string, allowedDomains: readonly string[]) {
  return allowedDomains.includes(host) || isDevelopmentHost(host);
}

/** The `frame-ancestors` sources for a workspace's widget iframe. */
export function frameAncestors(allowedDomains: readonly string[]) {
  const hosts = [
    ...allowedDomains,
    ...(process.env.NODE_ENV !== "production" ? DEVELOPMENT_HOSTS : []),
  ];
  if (hosts.length === 0) {
    return "'none'";
  }
  // Exact host, any port, http or https.
  return hosts
    .flatMap((host) => [`https://${host}:*`, `http://${host}:*`])
    .join(" ");
}
