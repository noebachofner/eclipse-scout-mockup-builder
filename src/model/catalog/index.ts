/**
 * Importing this module registers the whole ES Mockup widget catalog.
 * Order matters only in so far as `containers` exports helpers used by `tiles`.
 */
import './desktop';
import './containers';
import './valueFields';
import './selectionFields';
import './tablesTrees';
import './buttonsMenus';
import './tiles';
import './advanced';

export * from './registry';
export * from './common';
