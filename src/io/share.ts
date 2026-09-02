/**
 * Share links: the whole mockup travels inside the URL fragment.
 *
 * A fragment never reaches a server, so this works on plain static hosting and
 * shares nothing with anyone but the person holding the link. The document is
 * gzipped before it is encoded, which brings a typical mockup down to a couple
 * of kilobytes; `CompressionStream` is used when the browser has it and the
 * plain JSON is encoded otherwise, with a one character marker saying which.
 */
import type {MockupDocument} from '../model/types';
import {parseDocument, serializeDocument} from '../model/document';

const PREFIX = '#m=';
/**
 * Browsers accept far longer URLs than this, but chat clients and mail
 * gateways start cutting links somewhere above it, so the caller gets warned.
 */
export const COMFORTABLE_URL_LENGTH = 8000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  // Chunked, because a spread of a large array blows the argument limit.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function through(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const {done, value} = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/** Builds the full share URL for `doc`, based on the current location. */
export async function buildShareUrl(doc: MockupDocument): Promise<string> {
  const json = serializeDocument(doc);
  const raw = new TextEncoder().encode(json);
  let payload = `r${toBase64Url(raw)}`;

  if (typeof CompressionStream === 'function') {
    const blob = new Blob([raw as BlobPart]);
    const compressed = await through(blob.stream().pipeThrough(new CompressionStream('gzip')));
    payload = `z${toBase64Url(compressed)}`;
  }
  const base = `${location.origin}${location.pathname}${location.search}`;
  return `${base}${PREFIX}${payload}`;
}

/** Reads a document out of a location hash, or null when there is none. */
export async function readShareUrl(hash: string): Promise<MockupDocument | null> {
  if (!hash.startsWith(PREFIX)) return null;
  const payload = hash.slice(PREFIX.length);
  if (payload.length < 2) return null;
  try {
    const bytes = fromBase64Url(payload.slice(1));
    let json: string;
    if (payload[0] === 'z') {
      if (typeof DecompressionStream !== 'function') return null;
      const blob = new Blob([bytes as BlobPart]);
      json = new TextDecoder().decode(await through(blob.stream().pipeThrough(new DecompressionStream('gzip'))));
    } else {
      json = new TextDecoder().decode(bytes);
    }
    return parseDocument(json);
  } catch {
    return null;
  }
}
