import { FetchPageError, SafeUrlError } from "@/lib/errors";

export function errorResponse(error: unknown) {
  if (error instanceof SafeUrlError) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof FetchPageError) {
    const status = error.message.includes("too large") ? 413 : 502;
    return Response.json({ error: error.message }, { status });
  }

  console.error(error);
  return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
}
