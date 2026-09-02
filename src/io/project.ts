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

export async function readProjectFile(file: File): Promise<{doc: MockupDocument; fileName: string}> {
  const text = await file.text();
  return {doc: parseDocument(text), fileName: file.name};
}

const SLOTS_KEY = 'es-mockup:autosave:v2';
const MAX_SLOTS = 6;
const MAX_SLOT_BYTES = 1_500_000;

export interface AutosaveSlot {
  id: string;
  name: string;
  savedAt: string;
  text: string;
}

function readSlots(): AutosaveSlot[] {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AutosaveSlot[];
      if (Array.isArray(parsed)) return parsed.filter(slot => slot && typeof slot.text === 'string');
    }
    const legacy = localStorage.getItem(AUTOSAVE_KEY);
    if (legacy) {
      return [{id: 'legacy', name: 'Restored mockup', savedAt: new Date().toISOString(), text: legacy}];
    }
  } catch {
  }
  return [];
}

export type AutosaveOutcome =
  | {ok: true}
  | {ok: false; reason: 'too-large' | 'storage'};

function writeSlots(slots: AutosaveSlot[]): AutosaveOutcome {
  try {
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots.slice(0, MAX_SLOTS)));
    localStorage.removeItem(AUTOSAVE_KEY);
    return {ok: true};
  } catch {
    for (let keep = slots.length - 1; keep >= 1; keep--) {
      try {
        localStorage.setItem(SLOTS_KEY, JSON.stringify(slots.slice(0, keep)));
        return {ok: true};
      } catch {
        continue;
      }
    }
    return {ok: false, reason: 'storage'};
  }
}

export function writeAutosave(doc: MockupDocument, slotId: string): AutosaveOutcome {
  const text = serializeDocument(doc);
  if (text.length > MAX_SLOT_BYTES) return {ok: false, reason: 'too-large'};
  const slots = readSlots().filter(slot => slot.id !== slotId);
  slots.unshift({id: slotId, name: doc.meta.name, savedAt: new Date().toISOString(), text});
  return writeSlots(slots);
}

export function readAutosave(): {doc: MockupDocument; slotId: string} | null {
  const slot = readSlots()[0];
  if (!slot) return null;
  try {
    return {doc: parseDocument(slot.text), slotId: slot.id};
  } catch (e) {
    if (e instanceof DocumentFormatError) return null;
    return null;
  }
}

export function listAutosaves(): Array<Omit<AutosaveSlot, 'text'>> {
  return readSlots().map(({id, name, savedAt}) => ({id, name, savedAt}));
}

export function restoreAutosave(slotId: string): MockupDocument | null {
  const slot = readSlots().find(entry => entry.id === slotId);
  if (!slot) return null;
  try {
    return parseDocument(slot.text);
  } catch {
    return null;
  }
}

export function newSlotId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
