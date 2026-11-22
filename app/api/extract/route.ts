import { extractFromPage } from "@/lib/extract-images";
import { errorResponse } from "@/lib/http";
import { clientKey, rateLimit, rejectIfCrossSite } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = rejectIfCrossSite(request);
  if (blocked) return blocked;

  if (!rateLimit(`extract:${clientKey(request)}`, 20, 60_000)) {
    return Response.json(
      { error: "Too many requests. Wait a minute and try again." },
      { status: 429 },
    );
  }

  let url = "";
  try {
    const body = (await request.json()) as { url?: unknown };
    url = typeof body.url === "string" ? body.url : "";
  } catch {
    return Response.json({ error: "Enter a valid webpage URL." }, { status: 400 });
  }

  if (!url.trim()) {
    return Response.json({ error: "Enter a webpage URL." }, { status: 400 });
  }

  try {
    const result = await extractFromPage(url);
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
