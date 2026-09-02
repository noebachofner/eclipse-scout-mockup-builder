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
 * Autosave keeps recent mockups in localStorage so a reload, a crashed tab or
 * an accidental "New mockup" does not lose work. It is a convenience, not the
 * save format - the `.esmockup` file remains the source of truth.
 *
 * Several slots are kept rather than one: starting a new mockup used to wipe
 * the only copy of what came before, which is exactly when you want it back.
 */
const SLOTS_KEY = 'es-mockup:autosave:v2';
const MAX_SLOTS = 6;
/** Slots larger than this are dropped rather than filling up the quota. */
const MAX_SLOT_BYTES = 1_500_000;

export interface AutosaveSlot {
  id: string;
  name: string;
  /** ISO timestamp of the last write. */
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
    // One-time migration from the single slot the earlier version wrote.
    const legacy = localStorage.getItem(AUTOSAVE_KEY);
    if (legacy) {
      return [{id: 'legacy', name: 'Restored mockup', savedAt: new Date().toISOString(), text: legacy}];
    }
  } catch {
    // Corrupt or blocked storage simply means no autosave.
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
    // The oldest slots are worth less than the current one, so give up on them
    // before giving up on saving at all.
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

/**
 * Upserts the slot `slotId`, moving it to the front of the list.
 *
 * The outcome is returned rather than swallowed: a mockup that is silently not
 * being saved is worse than one that says so.
 */
export function writeAutosave(doc: MockupDocument, slotId: string): AutosaveOutcome {
  const text = serializeDocument(doc);
  if (text.length > MAX_SLOT_BYTES) return {ok: false, reason: 'too-large'};
  const slots = readSlots().filter(slot => slot.id !== slotId);
  slots.unshift({id: slotId, name: doc.meta.name, savedAt: new Date().toISOString(), text});
  return writeSlots(slots);
}

/** The most recently autosaved document, or null when there is none. */
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

/** Metadata of every stored slot, newest first. */
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

/** A fresh slot id, so a new or opened mockup does not overwrite the last one. */
export function newSlotId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
