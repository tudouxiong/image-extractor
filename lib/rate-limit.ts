const buckets = new Map<string, number[]>();

export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  return request.headers.get("x-real-ip")?.slice(0, 80) || "local";
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }

  recent.push(now);
  buckets.set(key, recent);

  if (buckets.size > 5000) {
    const oldest = buckets.keys().next().value;
    if (oldest) buckets.delete(oldest);
  }

  return true;
}

export function rejectIfCrossSite(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return null;

  const host = request.headers.get("host");
  if (!host) return null;

  try {
    if (new URL(referer).host !== host) {
      return Response.json({ error: "This request is not allowed." }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "This request is not allowed." }, { status: 403 });
  }

  return null;
}
