import {div, h, span} from '../render/dom';
import type {MockupDocument} from '../model/types';
import {validateDocument, type Finding} from '../model/validate';
import {editorIcon} from './icons';

const SEVERITY_LABEL: Record<Finding['severity'], string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Hint'
};

/** Lists everything in the mockup that standard Scout cannot reproduce. */
export function showCheckDialog(doc: MockupDocument, select: (nodeId: string) => void): void {
  document.querySelector('.es-modal-backdrop')?.remove();
  const findings = validateDocument(doc);

  const backdrop = div('es-modal-backdrop');
  const dialog = div('es-modal es-check-dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Check the mockup');

  const header = div('es-modal-header');
  header.appendChild(span('es-modal-title', 'Check the mockup'));
  const closeButton = h('button', 'es-modal-close');
  closeButton.type = 'button';
  closeButton.textContent = '✕';
  closeButton.title = 'Close (Esc)';
  header.appendChild(closeButton);
  dialog.appendChild(header);

  const body = div('es-modal-body');
  if (!findings.length) {
    const clean = div('es-check-clean');
    clean.appendChild(editorIcon('help'));
    clean.appendChild(span('', 'Nothing to report. Every widget uses layout that standard Scout configuration can reproduce.'));
    body.appendChild(clean);
  } else {
    const counts = findings.reduce<Record<string, number>>((all, finding) => {
      all[finding.severity] = (all[finding.severity] ?? 0) + 1;
      return all;
    }, {});
    const summary = div('es-check-summary');
    (['error', 'warning', 'info'] as Finding['severity'][]).forEach(severity => {
      if (!counts[severity]) return;
      summary.appendChild(span(`es-check-count ${severity}`, `${counts[severity]} × ${SEVERITY_LABEL[severity]}`));
    });
    body.appendChild(summary);

    for (const finding of findings) {
      const row = h('button', `es-check-row ${finding.severity}`);
      row.type = 'button';
      row.appendChild(span('es-check-path', finding.path));
      row.appendChild(span('es-check-message', finding.message));
      row.addEventListener('click', () => {
        select(finding.nodeId);
        backdrop.remove();
      });
      body.appendChild(row);
    }
  }
  dialog.appendChild(body);
  backdrop.appendChild(dialog);
  document.body.appendChild(backdrop);

  const close = (): void => {
    backdrop.remove();
    document.removeEventListener('keydown', onKeyDown, true);
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };
  document.addEventListener('keydown', onKeyDown, true);
  closeButton.addEventListener('click', close);
  backdrop.addEventListener('mousedown', event => {
    if (event.target === backdrop) close();
  });
  closeButton.focus();
}
