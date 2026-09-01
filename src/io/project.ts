import type {MockupDocument} from '../model/types';
import {DocumentFormatError, parseDocument, serializeDocument} from '../model/document';
import {downloadText, pickFile, sanitizeFileName} from './files';

export const MOCKUP_EXTENSION = 'esmockup';
export const MOCKUP_MIME = 'application/json';
const AUTOSAVE_KEY = 'es-mockup:autosave:v1';

export function saveProject(doc: MockupDocument): string {
  const fileName = sanitizeFileName(doc.meta.name, MOCKUP_EXTENSION);
  downloadText(serializeDocument(doc), fileName, MOCKUP_MIME);
  return fileName;
}

export async function openProject(): Promise<{doc: MockupDocument; fileName: string} | null> {
  const file = await pickFile(`.${MOCKUP_EXTENSION},application/json,.json`);
  if (!file) return null;
  const text = await file.text();
  return {doc: parseDocument(text), fileName: file.name};
}

/** Reads a dropped file (drag & drop onto the window). */
export async function readProjectFile(file: File): Promise<{doc: MockupDocument; fileName: string}> {
  const text = await file.text();
  return {doc: parseDocument(text), fileName: file.name};
}

/**
 * Autosave keeps the current mockup in localStorage so a reload or a crashed
 * tab does not lose work. It is a convenience, not the save format - the
 * `.esmockup` file remains the source of truth.
 */
export function writeAutosave(doc: MockupDocument): void {
  try {
    localStorage.setItem(AUTOSAVE_KEY, serializeDocument(doc));
  } catch {
    // Quota exceeded or storage disabled - autosave is best effort.
  }
}

export function readAutosave(): MockupDocument | null {
  try {
    const text = localStorage.getItem(AUTOSAVE_KEY);
    if (!text) return null;
    return parseDocument(text);
  } catch (e) {
    if (e instanceof DocumentFormatError) return null;
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}
