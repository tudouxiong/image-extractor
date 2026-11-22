import JSZip from "jszip";

export type PackedImage = {
  name: string;
  bytes: Uint8Array;
  type: string;
};

const OFFICE_MEDIA = /^(?:word|ppt|xl)\/media\/.+\.(png|jpe?g|gif|webp|bmp|tiff?)$/i;

function mimeFromName(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "bmp") return "image/bmp";
  if (ext === "tif" || ext === "tiff") return "image/tiff";
  return "image/png";
}

export async function imagesFromOffice(data: ArrayBuffer): Promise<PackedImage[]> {
  const zip = await JSZip.loadAsync(data);
  const images: PackedImage[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || !OFFICE_MEDIA.test(path)) continue;
    const bytes = await entry.async("uint8array");
    if (bytes.byteLength < 80) continue;
    images.push({
      name: path.split("/").pop() || "image",
      bytes,
      type: mimeFromName(path),
    });
    if (images.length >= 80) break;
  }

  return images;
}

function remember(images: PackedImage[], image: PackedImage, seen: Set<string>) {
  const key = `${image.bytes.byteLength}:${image.bytes[0]}:${image.bytes[1]}:${image.bytes[image.bytes.byteLength - 2]}`;
  if (seen.has(key)) return;
  seen.add(key);
  images.push(image);
}

function findJpegs(data: Uint8Array, images: PackedImage[], seen: Set<string>) {
  let i = 0;
  let count = 0;
  while (i < data.length - 4 && images.length < 80) {
    if (data[i] !== 0xff || data[i + 1] !== 0xd8 || data[i + 2] !== 0xff) {
      i += 1;
      continue;
    }
    let j = i + 3;
    const limit = Math.min(data.length - 1, i + 8_000_000);
    let end = -1;
    while (j < limit) {
      if (data[j] === 0xff && data[j + 1] === 0xd9) {
        end = j + 2;
        break;
      }
      j += 1;
    }
    if (end === -1) {
      i += 1;
      continue;
    }
    if (end - i >= 500) {
      count += 1;
      remember(images, { name: `image-${count}.jpg`, bytes: data.slice(i, end), type: "image/jpeg" }, seen);
    }
    i = end;
  }
}

const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_END = [73, 69, 78, 68, 174, 66, 96, 130];

function findPngs(data: Uint8Array, images: PackedImage[], seen: Set<string>) {
  let i = 0;
  let count = 0;
  while (i < data.length - 24 && images.length < 80) {
    let match = true;
    for (let k = 0; k < PNG_SIG.length; k += 1) {
      if (data[i + k] !== PNG_SIG[k]) {
        match = false;
        break;
      }
    }
    if (!match) {
      i += 1;
      continue;
    }
    let j = i + 8;
    const limit = Math.min(data.length - 8, i + 8_000_000);
    let end = -1;
    while (j < limit) {
      let ok = true;
      for (let k = 0; k < PNG_END.length; k += 1) {
        if (data[j + k] !== PNG_END[k]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        end = j + 8;
        break;
      }
      j += 1;
    }
    if (end === -1) {
      i += 1;
      continue;
    }
    if (end - i >= 500) {
      count += 1;
      remember(images, { name: `image-${count}.png`, bytes: data.slice(i, end), type: "image/png" }, seen);
    }
    i = end;
  }
}

export function imagesFromBinary(data: Uint8Array): PackedImage[] {
  const images: PackedImage[] = [];
  const seen = new Set<string>();
  findJpegs(data, images, seen);
  findPngs(data, images, seen);
  return images;
}
