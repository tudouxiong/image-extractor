import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";
import { FetchPageError, SafeUrlError } from "@/lib/errors";

const blocked = new BlockList();

for (const [base, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blocked.addSubnet(base, prefix, "ipv4");
}

blocked.addAddress("255.255.255.255", "ipv4");
blocked.addAddress("::1", "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("fec0::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");

function isBlockedIp(ip: string) {
  const mapped = ip.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : "";
  if (mapped && isIP(mapped) === 4) return blocked.check(mapped, "ipv4");

  const kind = isIP(ip);
  if (kind === 4) return blocked.check(ip, "ipv4");
  if (kind === 6) return blocked.check(ip, "ipv6");
  return true;
}

export async function assertPublicHttpUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SafeUrlError("Enter a valid http or https URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeUrlError("Enter a valid http or https URL.");
  }

  if (url.username || url.password || url.href.length > 2000) {
    throw new SafeUrlError("This URL is not allowed.");
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new SafeUrlError("This URL is not allowed.");
  }

  const hostname = url.hostname.replace(/\.$/, "").toLowerCase();
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.includes("%") ||
    hostname.includes("0x") ||
    /^\d+(\.\d+){0,2}$/.test(hostname)
  ) {
    throw new SafeUrlError("This URL is not allowed.");
  }

  const kind = isIP(hostname);
  if (kind) {
    if (isBlockedIp(hostname)) throw new SafeUrlError("This URL is not allowed.");
  } else if (!hostname.includes(".")) {
    throw new SafeUrlError("This URL is not allowed.");
  } else {
    let records: { address: string }[];
    try {
      records = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new FetchPageError("That page could not be reached.");
    }
    if (records.length === 0 || records.some((record) => isBlockedIp(record.address))) {
      throw new SafeUrlError("This URL is not allowed.");
    }
  }

  url.hash = "";
  return url.href;
}
