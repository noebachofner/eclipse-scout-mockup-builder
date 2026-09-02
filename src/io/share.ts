import type {MockupDocument, MockupNode} from '../model/types';
import {parseDocument, serializeDocument} from '../model/document';

const PREFIX = '#m=';
export const COMFORTABLE_URL_LENGTH = 8000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
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

export function findEmbeddedImages(doc: MockupDocument): Array<{path: string; bytes: number}> {
  const found: Array<{path: string; bytes: number}> = [];
  const walk = (node: MockupNode, trail: string[]): void => {
    const label = String(node.properties.label ?? node.properties.title ?? '') || node.objectType;
    const path = [...trail, label];
    for (const [name, value] of Object.entries(node.properties)) {
      if (typeof value === 'string' && value.startsWith('data:')) {
        found.push({path: `${path.join(' › ')} (${name})`, bytes: value.length});
      }
    }
    node.children.forEach(child => walk(child, path));
  };
  walk(doc.root, []);
  return found;
}

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
