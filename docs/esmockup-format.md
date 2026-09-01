# The `.esmockup` file format

ES Mockup saves a project as a single JSON file with the extension `.esmockup`.
JSON was chosen over a binary or zipped format because a mockup is small,
benefits from being diffable in Git, and should stay readable and repairable by
hand. There are no external references: a `.esmockup` file is self-contained.

## Top level

```jsonc
{
  "format": "es-mockup",   // magic marker, always this string
  "formatVersion": 1,      // incremented on breaking changes
  "meta": { ... },
  "theme": { ... },
  "canvas": { ... },
  "root": { ... }          // the widget tree, always a Desktop
}
```

A file whose `format` is not `es-mockup` is rejected. A file whose
`formatVersion` is **higher** than the running build understands is also
rejected, with a message naming the version, rather than being opened and
silently mis-rendered.

### `meta`

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Mockup name; also the default file name of exports. |
| `description` | string | Free text. |
| `author` | string | Free text. |
| `createdAt` / `modifiedAt` | ISO 8601 string | `modifiedAt` is refreshed on every save. |
| `generator` | string | `"ES Mockup"`. |
| `scoutVersion` | string | Version of `@eclipse-scout/core` the look & feel was derived from. |

### `theme`

| Field | Type | Notes |
| --- | --- | --- |
| `base` | `"default"` \| `"dark"` | Which Scout theme the colors start from. |
| `colors` | object | Overrides for Scout LESS colour variables, keyed **without** the leading `@`, e.g. `{"accent-color-3": "#7A2E96"}`. |
| `dense` | boolean | Scout's compact display style. |
| `fontFamily` | string | CSS font stack; Scout's default is `Arial, sans-serif`. |

Only the variables the user actually changed are stored. Everything else is
recomputed from `colors.less` at load time, so a file stays small and
automatically picks up upstream palette changes when the Scout version is
bumped.

### `canvas`

| Field | Type | Notes |
| --- | --- | --- |
| `width`, `height` | number | Size of the mockup in CSS pixels; also the size of the PNG/HTML export. |
| `browserFrame` | boolean | Draws a browser-window frame around the mockup. |
| `zoom` | number | Editor zoom only; exports always render at 1:1. |

## Widget nodes

Every node in `root` has the same shape:

```jsonc
{
  "id": "w3f8ab",           // unique within the document
  "objectType": "StringField", // matches Scout's own object types
  "slot": "fields",         // which child slot of the parent this node belongs to
  "properties": { ... },    // only the properties that differ from the default
  "children": [ ... ]
}
```

* **`objectType`** is the Scout object type (`GroupBox`, `TableField`,
  `SmartField`, …), so the file reads like a Scout model JSON.
* **`slot`** exists because Scout containers have more than one kind of child: a
  `GroupBox` has `fields` and `menus`, a `TabBox` has `tabItems`, a `Desktop`
  has `outlines`, `views`, `toolMenus`, `notifications` and `dialogs`. Omitting
  it means "the container's first slot".
* **`properties`** stores only what was changed. Anything absent falls back to
  the Scout default declared in the widget catalog, which keeps files small and
  lets a later ES Mockup version correct a wrong default everywhere at once.

### Grid properties

Scout's logical grid hints are stored as flat property names so they can be
edited like any other property:

```jsonc
"properties": {
  "label": "Notes",
  "gridDataHints.w": 2,
  "gridDataHints.h": 3,
  "gridDataHints.weightY": -1
}
```

`gridDataHints.x` / `.y` pin a field to a cell; `-1` (the default) means
"place it automatically", exactly as in Scout.

### Free placement

A container whose `layoutMode` is `"free"` positions its children by absolute
coordinates instead of the logical grid. Those children carry `bounds.x`,
`bounds.y`, `bounds.width` and `bounds.height`. This is a sketching aid: such a
layout generally **cannot** be reproduced with standard Scout layout
configuration, and the editor says so while the mode is active.

## Forward compatibility

* Unknown `objectType`s survive a load/save round trip: they are kept in the
  tree and rendered as a visible "Unknown widget" marker, so a file written by a
  newer catalog is not silently destroyed by an older build.
* Unknown property names are preserved for the same reason.
* Missing `id`s are regenerated on load, so hand-written files are accepted.
