/*
 * Eclipse Scout color expression tree - GENERATED FILE, DO NOT EDIT.
 *
 * Extracted from @eclipse-scout/core (26.2.2) colors.less by
 * tools/extract-scout-colors.mjs. Upstream is EPL-2.0 - see THIRD-PARTY-NOTICES.md.
 *
 * Evaluated at runtime by src/render/colorSystem.ts so that changing a palette
 * or accent color propagates through the whole Scout color system the same way
 * a recompile of the LESS theme would.
 */

export type ColorExpr =
  | {k: 'lit'; value: string}
  | {k: 'ref'; name: string}
  | {k: 'call'; fn: string; args: ColorExpr[]};

export interface ColorDecl {
  name: string;
  expr: ColorExpr;
}

/** All declarations of colors.less, in source order (later ones may reference earlier ones). */
export const SCOUT_COLOR_DECLS: ColorDecl[] = [
  {
    "name": "palette-black",
    "expr": {
      "k": "lit",
      "value": "#000"
    }
  },
  {
    "name": "palette-white",
    "expr": {
      "k": "lit",
      "value": "#fff"
    }
  },
  {
    "name": "palette-red-0",
    "expr": {
      "k": "lit",
      "value": "#FEE0E0"
    }
  },
  {
    "name": "palette-red-1",
    "expr": {
      "k": "lit",
      "value": "#FFBFBF"
    }
  },
  {
    "name": "palette-red-2",
    "expr": {
      "k": "lit",
      "value": "#FF8888"
    }
  },
  {
    "name": "palette-red-3",
    "expr": {
      "k": "lit",
      "value": "#FF5555"
    }
  },
  {
    "name": "palette-red-4",
    "expr": {
      "k": "lit",
      "value": "#D53F3F"
    }
  },
  {
    "name": "palette-red-5",
    "expr": {
      "k": "lit",
      "value": "#AB3434"
    }
  },
  {
    "name": "palette-green-0",
    "expr": {
      "k": "lit",
      "value": "#DCFBF5"
    }
  },
  {
    "name": "palette-green-1",
    "expr": {
      "k": "lit",
      "value": "#BDF2E8"
    }
  },
  {
    "name": "palette-green-2",
    "expr": {
      "k": "lit",
      "value": "#67E9D1"
    }
  },
  {
    "name": "palette-green-3",
    "expr": {
      "k": "lit",
      "value": "#1FC9AA"
    }
  },
  {
    "name": "palette-green-4",
    "expr": {
      "k": "lit",
      "value": "#0DA98C"
    }
  },
  {
    "name": "palette-green-5",
    "expr": {
      "k": "lit",
      "value": "#00856C"
    }
  },
  {
    "name": "palette-blue-0",
    "expr": {
      "k": "lit",
      "value": "#E9F0F6"
    }
  },
  {
    "name": "palette-blue-1",
    "expr": {
      "k": "lit",
      "value": "#C1DEF9"
    }
  },
  {
    "name": "palette-blue-2",
    "expr": {
      "k": "lit",
      "value": "#74A8D8"
    }
  },
  {
    "name": "palette-blue-3",
    "expr": {
      "k": "lit",
      "value": "#1561A7"
    }
  },
  {
    "name": "palette-blue-4",
    "expr": {
      "k": "lit",
      "value": "#014786"
    }
  },
  {
    "name": "palette-blue-5",
    "expr": {
      "k": "lit",
      "value": "#2F3C45"
    }
  },
  {
    "name": "palette-gray-0",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "palette-gray-1",
    "expr": {
      "k": "lit",
      "value": "#FAFAFA"
    }
  },
  {
    "name": "palette-gray-2",
    "expr": {
      "k": "lit",
      "value": "#F5F5F5"
    }
  },
  {
    "name": "palette-gray-3",
    "expr": {
      "k": "lit",
      "value": "#EFEFEF"
    }
  },
  {
    "name": "palette-gray-4",
    "expr": {
      "k": "lit",
      "value": "#DADADA"
    }
  },
  {
    "name": "palette-gray-5",
    "expr": {
      "k": "lit",
      "value": "#CFCFCF"
    }
  },
  {
    "name": "palette-gray-5-1",
    "expr": {
      "k": "lit",
      "value": "#B2B2B2"
    }
  },
  {
    "name": "palette-gray-6",
    "expr": {
      "k": "lit",
      "value": "#999999"
    }
  },
  {
    "name": "palette-gray-6-1",
    "expr": {
      "k": "lit",
      "value": "#808080"
    }
  },
  {
    "name": "palette-gray-7",
    "expr": {
      "k": "lit",
      "value": "#666666"
    }
  },
  {
    "name": "palette-gray-8",
    "expr": {
      "k": "lit",
      "value": "#5C5C5C"
    }
  },
  {
    "name": "palette-gray-9",
    "expr": {
      "k": "lit",
      "value": "#4C4C4C"
    }
  },
  {
    "name": "palette-gray-10",
    "expr": {
      "k": "lit",
      "value": "#262626"
    }
  },
  {
    "name": "palette-orange-0",
    "expr": {
      "k": "lit",
      "value": "#FCF0E5"
    }
  },
  {
    "name": "palette-orange-1",
    "expr": {
      "k": "lit",
      "value": "#FDE1B1"
    }
  },
  {
    "name": "palette-orange-2",
    "expr": {
      "k": "lit",
      "value": "#FFBE6B"
    }
  },
  {
    "name": "palette-orange-3",
    "expr": {
      "k": "lit",
      "value": "#FE9915"
    }
  },
  {
    "name": "palette-orange-4",
    "expr": {
      "k": "lit",
      "value": "#DA8312"
    }
  },
  {
    "name": "palette-orange-5",
    "expr": {
      "k": "lit",
      "value": "#AD6200"
    }
  },
  {
    "name": "accent-color-0",
    "expr": {
      "k": "ref",
      "name": "palette-blue-0"
    }
  },
  {
    "name": "accent-color-1",
    "expr": {
      "k": "ref",
      "name": "palette-blue-1"
    }
  },
  {
    "name": "accent-color-2",
    "expr": {
      "k": "ref",
      "name": "palette-blue-2"
    }
  },
  {
    "name": "accent-color-3",
    "expr": {
      "k": "ref",
      "name": "palette-blue-3"
    }
  },
  {
    "name": "accent-color-4",
    "expr": {
      "k": "ref",
      "name": "palette-blue-4"
    }
  },
  {
    "name": "accent-color-5",
    "expr": {
      "k": "ref",
      "name": "palette-blue-5"
    }
  },
  {
    "name": "active-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "active-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "12%"
        }
      ]
    }
  },
  {
    "name": "active-solid-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "hover-solid-background-color"
        },
        {
          "k": "lit",
          "value": "5%"
        }
      ]
    }
  },
  {
    "name": "application-loading-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "application-loading01-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "accent-color-3"
        },
        {
          "k": "lit",
          "value": "90%"
        }
      ]
    }
  },
  {
    "name": "application-loading02-color",
    "expr": {
      "k": "ref",
      "name": "palette-green-3"
    }
  },
  {
    "name": "background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "body-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "control-background-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "control-border-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "23%"
        }
      ]
    }
  },
  {
    "name": "control-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "control-disabled-background-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "control-disabled-color",
    "expr": {
      "k": "ref",
      "name": "text-disabled-color"
    }
  },
  {
    "name": "control-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6-1"
    }
  },
  {
    "name": "disabled-inverted-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-white"
        },
        {
          "k": "lit",
          "value": "40%"
        }
      ]
    }
  },
  {
    "name": "drop-shadow-alpha",
    "expr": {
      "k": "lit",
      "value": "0.2"
    }
  },
  {
    "name": "drop-shadow-large-alpha",
    "expr": {
      "k": "lit",
      "value": "0.2"
    }
  },
  {
    "name": "error-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-4"
    }
  },
  {
    "name": "warning-color",
    "expr": {
      "k": "ref",
      "name": "palette-orange-5"
    }
  },
  {
    "name": "info-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "ok-color",
    "expr": {
      "k": "ref",
      "name": "palette-green-5"
    }
  },
  {
    "name": "error-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-0"
    }
  },
  {
    "name": "error-border-color",
    "expr": {
      "k": "ref",
      "name": "error-color"
    }
  },
  {
    "name": "error-default-button-background-hover-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "error-color"
        },
        {
          "k": "lit",
          "value": "6%"
        }
      ]
    }
  },
  {
    "name": "error-default-button-background-active-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "error-color"
        },
        {
          "k": "lit",
          "value": "13%"
        }
      ]
    }
  },
  {
    "name": "error-focus-box-shadow-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "error-color"
        },
        {
          "k": "lit",
          "value": "40%"
        }
      ]
    }
  },
  {
    "name": "warning-default-button-background-hover-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "warning-color"
        },
        {
          "k": "lit",
          "value": "6%"
        }
      ]
    }
  },
  {
    "name": "warning-default-button-background-active-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "warning-color"
        },
        {
          "k": "lit",
          "value": "13%"
        }
      ]
    }
  },
  {
    "name": "warning-focus-box-shadow-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "warning-color"
        },
        {
          "k": "lit",
          "value": "40%"
        }
      ]
    }
  },
  {
    "name": "ok-default-button-background-hover-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "ok-color"
        },
        {
          "k": "lit",
          "value": "6%"
        }
      ]
    }
  },
  {
    "name": "ok-default-button-background-active-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "ok-color"
        },
        {
          "k": "lit",
          "value": "13%"
        }
      ]
    }
  },
  {
    "name": "ok-focus-box-shadow-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "ok-color"
        },
        {
          "k": "lit",
          "value": "40%"
        }
      ]
    }
  },
  {
    "name": "focus-border-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "focus-box-shadow-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "accent-color-1"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "focus-box-shadow-border-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "focus-box-shadow-color"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "focus-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "highlight-color",
    "expr": {
      "k": "ref",
      "name": "palette-orange-3"
    }
  },
  {
    "name": "highlight-inverted-background-color",
    "expr": {
      "k": "ref",
      "name": "highlight-color"
    }
  },
  {
    "name": "hover-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "8%"
        }
      ]
    }
  },
  {
    "name": "hover-solid-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "palette-gray-3"
        },
        {
          "k": "lit",
          "value": "3%"
        }
      ]
    }
  },
  {
    "name": "icon-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "icon-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "icon-inverted-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "icon-light-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "icon-light-hover-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-10"
    }
  },
  {
    "name": "item-selection-background-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-0"
    }
  },
  {
    "name": "item-selection-border-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "item-selection-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "item-selection-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "item-selection-nonfocus-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-1"
    }
  },
  {
    "name": "item-selection-nonfocus-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "item-active-background-color",
    "expr": {
      "k": "ref",
      "name": "active-background-color"
    }
  },
  {
    "name": "label-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "label-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "loading-indicator-knight-rider-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "link-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "link-active-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-5"
    }
  },
  {
    "name": "link-hover-color",
    "expr": {
      "k": "call",
      "fn": "lighten",
      "args": [
        {
          "k": "ref",
          "name": "link-color"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "panel-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-2"
    }
  },
  {
    "name": "read-only-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "selected-active-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "selected-hover-background-color"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "selected-background-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "selected-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6-1"
    }
  },
  {
    "name": "selected-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "selected-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-4"
    }
  },
  {
    "name": "selected-with-popup-background-color",
    "expr": {
      "k": "ref",
      "name": "active-background-color"
    }
  },
  {
    "name": "sub-title-color",
    "expr": {
      "k": "ref",
      "name": "label-color"
    }
  },
  {
    "name": "text-color",
    "expr": {
      "k": "ref",
      "name": "palette-black"
    }
  },
  {
    "name": "text-color-1",
    "expr": {
      "k": "ref",
      "name": "palette-gray-9"
    }
  },
  {
    "name": "text-color-2",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "text-color-3",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "text-inverted-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "text-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "text-selection-background-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "text-selection-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "text-selection-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "text-selection-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-3"
    }
  },
  {
    "name": "text-field-alternative-background-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "text-field-alternative-border-color",
    "expr": {
      "k": "ref",
      "name": "control-border-color"
    }
  },
  {
    "name": "text-field-alternative-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "text-field-icon-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6-1"
    }
  },
  {
    "name": "text-field-icon-hover-color",
    "expr": {
      "k": "ref",
      "name": "closer-hover-color"
    }
  },
  {
    "name": "text-field-icon-error-color",
    "expr": {
      "k": "ref",
      "name": "error-border-color"
    }
  },
  {
    "name": "text-field-icon-focus-color",
    "expr": {
      "k": "ref",
      "name": "focus-border-color"
    }
  },
  {
    "name": "text-field-placeholder-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "55%"
        }
      ]
    }
  },
  {
    "name": "title-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "browser-field-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "button-active-color",
    "expr": {
      "k": "ref",
      "name": "active-color"
    }
  },
  {
    "name": "button-active-background-color",
    "expr": {
      "k": "ref",
      "name": "active-background-color"
    }
  },
  {
    "name": "button-background-color",
    "expr": {
      "k": "ref",
      "name": "control-background-color"
    }
  },
  {
    "name": "button-border-color",
    "expr": {
      "k": "ref",
      "name": "button-color"
    }
  },
  {
    "name": "button-color",
    "expr": {
      "k": "ref",
      "name": "link-color"
    }
  },
  {
    "name": "button-disabled-background-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "button-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "control-disabled-border-color"
    }
  },
  {
    "name": "button-disabled-color",
    "expr": {
      "k": "ref",
      "name": "disabled-color"
    }
  },
  {
    "name": "button-hover-color",
    "expr": {
      "k": "ref",
      "name": "button-color"
    }
  },
  {
    "name": "busyindicator-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "calendar-component-color",
    "expr": {
      "k": "ref",
      "name": "palette-black"
    }
  },
  {
    "name": "calendar-component-intro-color",
    "expr": {
      "k": "ref",
      "name": "text-color-3"
    }
  },
  {
    "name": "calendar-day-color",
    "expr": {
      "k": "ref",
      "name": "text-color-2"
    }
  },
  {
    "name": "calendar-day-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "calendar-day-selected-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "calendar-line-color",
    "expr": {
      "k": "ref",
      "name": "planner-large-scale-item-line-color"
    }
  },
  {
    "name": "calendar-light-line-color",
    "expr": {
      "k": "ref",
      "name": "planner-small-scale-item-line-color"
    }
  },
  {
    "name": "calendar-mode-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "item-selection-background-color"
    }
  },
  {
    "name": "calendar-mode-selected-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-5"
    }
  },
  {
    "name": "calendar-out-background-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "calendar-out-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "calendar-title-color",
    "expr": {
      "k": "ref",
      "name": "title-color"
    }
  },
  {
    "name": "calendar-week-axis-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "calendar-weekend-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-4"
    }
  },
  {
    "name": "calendar-weekend-out-background-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "calendar-weekend-out-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-2"
    }
  },
  {
    "name": "carousel-status-item-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "carousel-status-item-hover-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "carousel-current-item-color",
    "expr": {
      "k": "ref",
      "name": "palette-black"
    }
  },
  {
    "name": "cell-editor-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "check-box-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "check-box-checked-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "check-box-checked-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "check-box-checked-border-color",
    "expr": {
      "k": "ref",
      "name": "check-box-checked-background-color"
    }
  },
  {
    "name": "check-box-checked-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-disabled-background-color"
    }
  },
  {
    "name": "check-box-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "closer-action-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "closer-color",
    "expr": {
      "k": "ref",
      "name": "icon-light-color"
    }
  },
  {
    "name": "closer-hover-color",
    "expr": {
      "k": "ref",
      "name": "icon-light-hover-color"
    }
  },
  {
    "name": "collapse-handle-active-background-color",
    "expr": {
      "k": "ref",
      "name": "active-solid-background-color"
    }
  },
  {
    "name": "collapse-handle-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "collapse-handle-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "collapse-handle-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-8"
    }
  },
  {
    "name": "collapse-handle-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "hover-solid-background-color"
    }
  },
  {
    "name": "column-background-effect-gradient1-start-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-2"
    }
  },
  {
    "name": "column-background-effect-gradient1-end-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-green-1"
    }
  },
  {
    "name": "column-background-effect-gradient2-start-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-green-1"
    }
  },
  {
    "name": "column-background-effect-gradient2-end-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-2"
    }
  },
  {
    "name": "column-background-effect-bar-chart-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-2"
    }
  },
  {
    "name": "command-button-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "command-button-selected-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "command-button-selected-border-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "command-button-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "compact-outline-data-background-color",
    "expr": {
      "k": "ref",
      "name": "dimmed-background-color"
    }
  },
  {
    "name": "compact-outline-menu-item-disabled-color",
    "expr": {
      "k": "ref",
      "name": "disabled-inverted-color"
    }
  },
  {
    "name": "context-menu-item-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "context-menu-item-icon-color",
    "expr": {
      "k": "ref",
      "name": "link-color"
    }
  },
  {
    "name": "context-menu-item-focused-background-color",
    "expr": {
      "k": "ref",
      "name": "item-selection-background-color"
    }
  },
  {
    "name": "dashboard-tile-border-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "palette-gray-3"
        },
        {
          "k": "lit",
          "value": "5%"
        }
      ]
    }
  },
  {
    "name": "dashboard-tile-default-selected-border-color",
    "expr": {
      "k": "ref",
      "name": "item-selection-border-color"
    }
  },
  {
    "name": "dashboard-tile-default-inverted-selected-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-5"
    }
  },
  {
    "name": "dashboard-tile-alternative-selected-border-color",
    "expr": {
      "k": "ref",
      "name": "tile-alternative-inverted-background-color"
    }
  },
  {
    "name": "dashboard-tile-alternative-inverted-selected-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-black"
    }
  },
  {
    "name": "date-picker-day-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "hover-background-color"
    }
  },
  {
    "name": "date-picker-day-selected-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "date-picker-day-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "date-picker-day-preselected-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "4%"
        }
      ]
    }
  },
  {
    "name": "date-picker-day-disabled-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "palette-gray-4"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "date-picker-now-color",
    "expr": {
      "k": "ref",
      "name": "palette-orange-5"
    }
  },
  {
    "name": "date-picker-out-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6-1"
    }
  },
  {
    "name": "date-picker-weekday-color",
    "expr": {
      "k": "ref",
      "name": "label-color"
    }
  },
  {
    "name": "date-picker-arrow-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "date-picker-separator-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "default-button-active-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-active-background-color"
    }
  },
  {
    "name": "default-button-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "default-button-active-background-color"
    }
  },
  {
    "name": "default-button-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "default-button-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "default-button-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-hover-background-color"
    }
  },
  {
    "name": "default-combo-menu-separator-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "desktop-bench-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "desktop-bench-drop-shadow-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "desktop-bench-tab-area-background-color",
    "expr": {
      "k": "ref",
      "name": "dimmed-background-color"
    }
  },
  {
    "name": "desktop-logo-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "desktop-navigation-handle-active-background-color",
    "expr": {
      "k": "ref",
      "name": "collapse-handle-active-background-color"
    }
  },
  {
    "name": "desktop-navigation-handle-background-color",
    "expr": {
      "k": "ref",
      "name": "collapse-handle-background-color"
    }
  },
  {
    "name": "desktop-navigation-handle-border-color",
    "expr": {
      "k": "ref",
      "name": "collapse-handle-border-color"
    }
  },
  {
    "name": "desktop-navigation-handle-color",
    "expr": {
      "k": "ref",
      "name": "collapse-handle-color"
    }
  },
  {
    "name": "desktop-navigation-handle-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "collapse-handle-hover-background-color"
    }
  },
  {
    "name": "desktop-navigation-body-in-background-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-2"
    }
  },
  {
    "name": "desktop-notification-background-color",
    "expr": {
      "k": "ref",
      "name": "popup-2-background-color"
    }
  },
  {
    "name": "desktop-notification-ok-border-color",
    "expr": {
      "k": "ref",
      "name": "ok-color"
    }
  },
  {
    "name": "desktop-notification-info-border-color",
    "expr": {
      "k": "ref",
      "name": "info-color"
    }
  },
  {
    "name": "desktop-notification-warning-border-color",
    "expr": {
      "k": "ref",
      "name": "warning-color"
    }
  },
  {
    "name": "desktop-notification-error-border-color",
    "expr": {
      "k": "ref",
      "name": "error-color"
    }
  },
  {
    "name": "desktop-header-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "desktop-header-disabled-color",
    "expr": {
      "k": "ref",
      "name": "disabled-inverted-color"
    }
  },
  {
    "name": "desktop-header-background-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "desktop-header-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "desktop-tab-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "desktop-tab-border-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "desktop-tab-flash-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "40%"
        }
      ]
    }
  },
  {
    "name": "desktop-tab-closer-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "14%"
        }
      ]
    }
  },
  {
    "name": "desktop-tab-closer-active-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "20%"
        }
      ]
    }
  },
  {
    "name": "desktop-tab-sub-title-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "desktop-header-color"
        },
        {
          "k": "lit",
          "value": "70%"
        }
      ]
    }
  },
  {
    "name": "desktop-tab-status-color",
    "expr": {
      "k": "ref",
      "name": "desktop-tab-sub-title-color"
    }
  },
  {
    "name": "desktop-tab-selected-color",
    "expr": {
      "k": "ref",
      "name": "title-color"
    }
  },
  {
    "name": "desktop-tab-selected-sub-title-color",
    "expr": {
      "k": "ref",
      "name": "sub-title-color"
    }
  },
  {
    "name": "desktop-tab-selected-save-needer-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "23%"
        }
      ]
    }
  },
  {
    "name": "desktop-tab-selected-flash-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "simple-tab-selected-background-color"
        },
        {
          "k": "lit",
          "value": "20%"
        }
      ]
    }
  },
  {
    "name": "desktop-tab-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "view-tab-hover-background-color"
    }
  },
  {
    "name": "desktop-tool-box-item-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "view-tab-hover-background-color"
    }
  },
  {
    "name": "desktop-tool-box-item-selected-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "30%"
        }
      ]
    }
  },
  {
    "name": "detail-table-header-background-color",
    "expr": {
      "k": "ref",
      "name": "table-header-background-color"
    }
  },
  {
    "name": "detail-table-header-border-color",
    "expr": {
      "k": "ref",
      "name": "table-header-border-color"
    }
  },
  {
    "name": "detail-table-footer-background-color",
    "expr": {
      "k": "ref",
      "name": "table-footer-background-color"
    }
  },
  {
    "name": "dimmed-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-2"
    }
  },
  {
    "name": "form-menu-popup-main-menubar-background-color",
    "expr": {
      "k": "ref",
      "name": "menubar-background-color"
    }
  },
  {
    "name": "group-header-color",
    "expr": {
      "k": "lit",
      "value": "inherit"
    }
  },
  {
    "name": "key-box-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-orange-1"
    }
  },
  {
    "name": "key-box-border-color",
    "expr": {
      "k": "ref",
      "name": "key-box-background-color"
    }
  },
  {
    "name": "key-box-background-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "key-box-border-disabled-color",
    "expr": {
      "k": "ref",
      "name": "key-box-background-disabled-color"
    }
  },
  {
    "name": "key-box-color",
    "expr": {
      "k": "ref",
      "name": "palette-black"
    }
  },
  {
    "name": "main-menubar-background-color",
    "expr": {
      "k": "ref",
      "name": "menubar-background-color"
    }
  },
  {
    "name": "menubar-background-color",
    "expr": {
      "k": "ref",
      "name": "control-background-color"
    }
  },
  {
    "name": "menu-item-color",
    "expr": {
      "k": "ref",
      "name": "link-color"
    }
  },
  {
    "name": "menu-item-disabled-color",
    "expr": {
      "k": "ref",
      "name": "disabled-color"
    }
  },
  {
    "name": "mode-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "mode-selected-background-disabled-color",
    "expr": {
      "k": "ref",
      "name": "selected-disabled-background-color"
    }
  },
  {
    "name": "mode-alternative-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "mode-alternative-selected-background-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "mode-alternative-background-color",
    "expr": {
      "k": "call",
      "fn": "rgba",
      "args": [
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0.08"
        }
      ]
    }
  },
  {
    "name": "mode-alternative-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "rgba",
      "args": [
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0.05"
        }
      ]
    }
  },
  {
    "name": "mode-alternative-active-background-color",
    "expr": {
      "k": "call",
      "fn": "rgba",
      "args": [
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0.1"
        }
      ]
    }
  },
  {
    "name": "navigate-up-button-border-color",
    "expr": {
      "k": "ref",
      "name": "button-border-color"
    }
  },
  {
    "name": "navigate-up-button-color",
    "expr": {
      "k": "ref",
      "name": "button-color"
    }
  },
  {
    "name": "desktop-navigation-background-color",
    "expr": {
      "k": "ref",
      "name": "desktop-header-background-color"
    }
  },
  {
    "name": "desktop-navigation-body-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "desktop-navigation-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-10"
    }
  },
  {
    "name": "notification-alternative-ok-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-green-0"
    }
  },
  {
    "name": "notification-alternative-info-background-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-0"
    }
  },
  {
    "name": "notification-alternative-warning-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-orange-0"
    }
  },
  {
    "name": "notification-alternative-error-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-0"
    }
  },
  {
    "name": "notification-alternative-ok-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "ok-color"
        },
        {
          "k": "lit",
          "value": "3%"
        }
      ]
    }
  },
  {
    "name": "notification-alternative-info-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "notification-alternative-warning-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "warning-color"
        },
        {
          "k": "lit",
          "value": "3%"
        }
      ]
    }
  },
  {
    "name": "notification-alternative-error-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "error-color"
        },
        {
          "k": "lit",
          "value": "8%"
        }
      ]
    }
  },
  {
    "name": "notification-alternative-info-marker-color",
    "expr": {
      "k": "ref",
      "name": "info-color"
    }
  },
  {
    "name": "notification-ok-border-color",
    "expr": {
      "k": "ref",
      "name": "ok-color"
    }
  },
  {
    "name": "notification-info-border-color",
    "expr": {
      "k": "ref",
      "name": "info-color"
    }
  },
  {
    "name": "notification-warning-border-color",
    "expr": {
      "k": "ref",
      "name": "warning-color"
    }
  },
  {
    "name": "notification-error-border-color",
    "expr": {
      "k": "ref",
      "name": "error-color"
    }
  },
  {
    "name": "outline-breadcrumb-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "outline-breadcrumb-ancestor-background-color",
    "expr": {
      "k": "ref",
      "name": "desktop-navigation-body-background-color"
    }
  },
  {
    "name": "outline-breadcrumb-child-background-color",
    "expr": {
      "k": "ref",
      "name": "desktop-navigation-body-background-color"
    }
  },
  {
    "name": "outline-breadcrumb-node-active-background-color",
    "expr": {
      "k": "ref",
      "name": "hover-background-color"
    }
  },
  {
    "name": "outline-group-background-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-0"
    }
  },
  {
    "name": "outline-in-background-group-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "desktop-navigation-body-in-background-background-color"
        },
        {
          "k": "lit",
          "value": "5%"
        }
      ]
    }
  },
  {
    "name": "outline-in-background-selection-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-disabled-background-color"
    }
  },
  {
    "name": "outline-in-background-selection-color",
    "expr": {
      "k": "ref",
      "name": "outline-selection-color"
    }
  },
  {
    "name": "outline-selection-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "outline-selection-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "outline-title-color",
    "expr": {
      "k": "ref",
      "name": "outline-selection-background-color"
    }
  },
  {
    "name": "outline-title-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "outline-node-control-color",
    "expr": {
      "k": "ref",
      "name": "outline-node-font-icon-color"
    }
  },
  {
    "name": "outline-node-selected-control-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "outline-selection-color"
        },
        {
          "k": "lit",
          "value": "70%"
        }
      ]
    }
  },
  {
    "name": "outline-node-selected-icon-color",
    "expr": {
      "k": "ref",
      "name": "outline-node-selected-control-color"
    }
  },
  {
    "name": "outline-node-font-icon-color",
    "expr": {
      "k": "ref",
      "name": "icon-light-color"
    }
  },
  {
    "name": "planner-large-scale-item-line-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "20%"
        }
      ]
    }
  },
  {
    "name": "planner-small-scale-item-line-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "7%"
        }
      ]
    }
  },
  {
    "name": "planner-mode-selected-color",
    "expr": {
      "k": "ref",
      "name": "calendar-mode-selected-color"
    }
  },
  {
    "name": "planner-mode-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "calendar-mode-selected-background-color"
    }
  },
  {
    "name": "planner-selector-resize-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "planner-resource-title-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "planner-timeline-background-color",
    "expr": {
      "k": "ref",
      "name": "panel-background-color"
    }
  },
  {
    "name": "planner-activity-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "planner-activity-level-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "popup-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "popup-backdrop-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "popup-backdrop-filter",
    "expr": {
      "k": "lit",
      "value": "none"
    }
  },
  {
    "name": "popup-2-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "popup-2-backdrop-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "popup-2-backdrop-filter",
    "expr": {
      "k": "lit",
      "value": "none"
    }
  },
  {
    "name": "popup-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "profile-menu-icon-background",
    "expr": {
      "k": "call",
      "fn": "linear-gradient",
      "args": [
        {
          "k": "lit",
          "value": "180deg"
        },
        {
          "k": "ref",
          "name": "palette-blue-4"
        },
        {
          "k": "lit",
          "value": "145%"
        },
        {
          "k": "ref",
          "name": "accent-color-2"
        },
        {
          "k": "lit",
          "value": "6%"
        }
      ]
    }
  },
  {
    "name": "profile-menu-icon-color",
    "expr": {
      "k": "ref",
      "name": "icon-inverted-color"
    }
  },
  {
    "name": "proposal-chooser-status-background-color",
    "expr": {
      "k": "ref",
      "name": "panel-background-color"
    }
  },
  {
    "name": "radio-button-border-color",
    "expr": {
      "k": "ref",
      "name": "check-box-border-color"
    }
  },
  {
    "name": "radio-button-checked-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "radio-button-checked-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-disabled-background-color"
    }
  },
  {
    "name": "radio-button-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "check-box-disabled-border-color"
    }
  },
  {
    "name": "save-needer-color",
    "expr": {
      "k": "ref",
      "name": "icon-light-color"
    }
  },
  {
    "name": "scrollbar-thumb-main-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "scrollbar-thumb-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-main-color"
        },
        {
          "k": "lit",
          "value": "30%"
        }
      ]
    }
  },
  {
    "name": "scrollbar-thumb-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-main-color"
        },
        {
          "k": "lit",
          "value": "45%"
        }
      ]
    }
  },
  {
    "name": "scrollbar-thumb-small-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-main-color"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "scrollbar-thumb-small-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-main-color"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "scrollbar-thumb-inverted-main-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "scrollbar-thumb-inverted-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "20%"
        }
      ]
    }
  },
  {
    "name": "scrollbar-thumb-inverted-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "40%"
        }
      ]
    }
  },
  {
    "name": "scrollbar-thumb-inverted-small-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "scrollbar-thumb-inverted-small-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "scroll-shadow-alpha",
    "expr": {
      "k": "lit",
      "value": "30%"
    }
  },
  {
    "name": "scroll-shadow-color",
    "expr": {
      "k": "call",
      "fn": "rgba",
      "args": [
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "lit",
          "value": "0"
        },
        {
          "k": "ref",
          "name": "scroll-shadow-alpha"
        }
      ]
    }
  },
  {
    "name": "scroll-shadow-gradient-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "status-menu-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "status-menu-hover-color",
    "expr": {
      "k": "ref",
      "name": "text-field-icon-hover-color"
    }
  },
  {
    "name": "status-ok-color",
    "expr": {
      "k": "ref",
      "name": "ok-color"
    }
  },
  {
    "name": "status-ok-hover-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "status-ok-color"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "status-info-color",
    "expr": {
      "k": "ref",
      "name": "text-field-icon-color"
    }
  },
  {
    "name": "status-info-hover-color",
    "expr": {
      "k": "ref",
      "name": "text-field-icon-hover-color"
    }
  },
  {
    "name": "status-warning-color",
    "expr": {
      "k": "ref",
      "name": "warning-color"
    }
  },
  {
    "name": "status-warning-hover-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "status-warning-color"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "status-error-color",
    "expr": {
      "k": "ref",
      "name": "error-color"
    }
  },
  {
    "name": "status-error-hover-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "status-error-color"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "switch-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "12%"
        }
      ]
    }
  },
  {
    "name": "switch-border-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "switch-activated-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "switch-disabled-background-color",
    "expr": {
      "k": "lit",
      "value": "transparent"
    }
  },
  {
    "name": "switch-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "check-box-disabled-border-color"
    }
  },
  {
    "name": "switch-disabled-activated-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-disabled-background-color"
    }
  },
  {
    "name": "switch-handle-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "switch-handle-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "switch-handle-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-1"
    }
  },
  {
    "name": "switch-handle-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "switch-icon-color",
    "expr": {
      "k": "ref",
      "name": "text-disabled-color"
    }
  },
  {
    "name": "switch-icon-activated-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-3"
    }
  },
  {
    "name": "switch-icon-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5-1"
    }
  },
  {
    "name": "switch-icon-disabled-activated-color",
    "expr": {
      "k": "ref",
      "name": "switch-icon-disabled-color"
    }
  },
  {
    "name": "switch-style-default-handle-activated-background-color",
    "expr": {
      "k": "ref",
      "name": "switch-handle-background-color"
    }
  },
  {
    "name": "switch-style-slider-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5-1"
    }
  },
  {
    "name": "switch-style-slider-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "table-aggregate-cell-selection-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-3"
    }
  },
  {
    "name": "table-aggregate-row-background-color",
    "expr": {
      "k": "ref",
      "name": "table-header-background-color"
    }
  },
  {
    "name": "table-compact-cell-content-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "table-control-active-color",
    "expr": {
      "k": "ref",
      "name": "link-active-color"
    }
  },
  {
    "name": "table-control-color",
    "expr": {
      "k": "ref",
      "name": "link-color"
    }
  },
  {
    "name": "table-control-container-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "table-control-disabled-color",
    "expr": {
      "k": "ref",
      "name": "disabled-color"
    }
  },
  {
    "name": "table-control-hover-color",
    "expr": {
      "k": "ref",
      "name": "hover-color"
    }
  },
  {
    "name": "table-control-resize-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "table-control-selected-color",
    "expr": {
      "k": "ref",
      "name": "table-control-color"
    }
  },
  {
    "name": "table-control-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-with-popup-background-color"
    }
  },
  {
    "name": "table-footer-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "table-header-background-color",
    "expr": {
      "k": "ref",
      "name": "panel-background-color"
    }
  },
  {
    "name": "table-header-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "table-header-item-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-9"
    }
  },
  {
    "name": "table-header-item-state-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "table-header-menu-filter-number-column-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-8"
    }
  },
  {
    "name": "table-header-resize-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "table-header-resize-hover-color",
    "expr": {
      "k": "ref",
      "name": "table-header-resize-color"
    }
  },
  {
    "name": "table-header-sort-color",
    "expr": {
      "k": "ref",
      "name": "table-header-item-state-color"
    }
  },
  {
    "name": "table-info-color",
    "expr": {
      "k": "ref",
      "name": "label-color"
    }
  },
  {
    "name": "table-info-error-color",
    "expr": {
      "k": "ref",
      "name": "error-color"
    }
  },
  {
    "name": "table-info-error-hover-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-4"
    }
  },
  {
    "name": "table-info-hover-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "table-info-warning-color",
    "expr": {
      "k": "ref",
      "name": "info-color"
    }
  },
  {
    "name": "table-info-warning-hover-color",
    "expr": {
      "k": "ref",
      "name": "accent-color-4"
    }
  },
  {
    "name": "table-row-active-background-color",
    "expr": {
      "k": "ref",
      "name": "item-active-background-color"
    }
  },
  {
    "name": "table-structure-row-background-color",
    "expr": {
      "k": "ref",
      "name": "table-aggregate-row-background-color"
    }
  },
  {
    "name": "table-row-border-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "13%"
        }
      ]
    }
  },
  {
    "name": "table-row-checked-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "table-row-checked-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "table-row-control-color",
    "expr": {
      "k": "ref",
      "name": "tree-node-control-color"
    }
  },
  {
    "name": "tab-area-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "tab-item-color",
    "expr": {
      "k": "ref",
      "name": "text-color"
    }
  },
  {
    "name": "tab-item-active-color",
    "expr": {
      "k": "ref",
      "name": "tab-item-hover-color"
    }
  },
  {
    "name": "tab-item-hover-color",
    "expr": {
      "k": "ref",
      "name": "hover-color"
    }
  },
  {
    "name": "tab-item-selected-color",
    "expr": {
      "k": "ref",
      "name": "title-color"
    }
  },
  {
    "name": "tab-item-marked-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6"
    }
  },
  {
    "name": "tab-item-selection-marker-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "tag-element-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-1"
    }
  },
  {
    "name": "tag-element-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tag-element-background-color"
        },
        {
          "k": "lit",
          "value": "8%"
        }
      ]
    }
  },
  {
    "name": "tag-element-active-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tag-element-background-color"
        },
        {
          "k": "lit",
          "value": "12%"
        }
      ]
    }
  },
  {
    "name": "tag-element-focus-background-color",
    "expr": {
      "k": "ref",
      "name": "tag-element-hover-background-color"
    }
  },
  {
    "name": "tag-overflow-element-selected-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tag-element-background-color"
        },
        {
          "k": "lit",
          "value": "12%"
        }
      ]
    }
  },
  {
    "name": "tag-overflow-element-selected-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-5"
    }
  },
  {
    "name": "tag-icon-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-3"
    }
  },
  {
    "name": "tag-text-color",
    "expr": {
      "k": "ref",
      "name": "palette-black"
    }
  },
  {
    "name": "tile-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-1"
    }
  },
  {
    "name": "tile-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "tile-active-background-color",
    "expr": {
      "k": "ref",
      "name": "active-background-color"
    }
  },
  {
    "name": "tile-selection-background-color",
    "expr": {
      "k": "ref",
      "name": "item-selection-background-color"
    }
  },
  {
    "name": "tile-selection-border-color",
    "expr": {
      "k": "ref",
      "name": "item-selection-border-color"
    }
  },
  {
    "name": "tile-alternative-background-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-background-color"
    }
  },
  {
    "name": "tile-alternative-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-color"
    }
  },
  {
    "name": "tile-alternative-label-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-label-color"
    }
  },
  {
    "name": "tile-alternative-link-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-link-color"
    }
  },
  {
    "name": "tile-alternative-link-active-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-link-active-color"
    }
  },
  {
    "name": "tile-alternative-link-hover-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-link-hover-color"
    }
  },
  {
    "name": "tile-alternative-inverted-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-9"
    }
  },
  {
    "name": "tile-alternative-inverted-selection-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  },
  {
    "name": "tile-alternative-inverted-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-inverted-color"
    }
  },
  {
    "name": "tile-alternative-inverted-label-color",
    "expr": {
      "k": "ref",
      "name": "tile-alternative-inverted-color"
    }
  },
  {
    "name": "tile-alternative-inverted-link-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-alternative-inverted-color"
        },
        {
          "k": "lit",
          "value": "85%"
        }
      ]
    }
  },
  {
    "name": "tile-alternative-inverted-link-active-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-alternative-inverted-color"
        },
        {
          "k": "lit",
          "value": "75%"
        }
      ]
    }
  },
  {
    "name": "tile-alternative-inverted-status-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-inverted-status-hover-background-color"
    }
  },
  {
    "name": "tile-alternative-inverted-status-active-background-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-inverted-status-active-background-color"
    }
  },
  {
    "name": "tile-button-alternative-inverted-active-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tile-alternative-inverted-background-color"
        },
        {
          "k": "lit",
          "value": "10"
        }
      ]
    }
  },
  {
    "name": "tile-button-alternative-inverted-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tile-alternative-inverted-background-color"
        },
        {
          "k": "lit",
          "value": "5"
        }
      ]
    }
  },
  {
    "name": "tile-button-alternative-inverted-color",
    "expr": {
      "k": "ref",
      "name": "tile-button-default-inverted-color"
    }
  },
  {
    "name": "tile-button-alternative-inverted-icon-color",
    "expr": {
      "k": "ref",
      "name": "tile-button-default-inverted-icon-color"
    }
  },
  {
    "name": "tile-button-default-active-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tile-default-background-color"
        },
        {
          "k": "lit",
          "value": "4%"
        }
      ]
    }
  },
  {
    "name": "tile-button-default-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tile-default-background-color"
        },
        {
          "k": "lit",
          "value": "2%"
        }
      ]
    }
  },
  {
    "name": "tile-button-default-icon-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5-1"
    }
  },
  {
    "name": "tile-button-default-inverted-active-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tile-default-inverted-background-color"
        },
        {
          "k": "lit",
          "value": "10"
        }
      ]
    }
  },
  {
    "name": "tile-button-default-inverted-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "darken",
      "args": [
        {
          "k": "ref",
          "name": "tile-default-inverted-background-color"
        },
        {
          "k": "lit",
          "value": "5"
        }
      ]
    }
  },
  {
    "name": "tile-button-default-inverted-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "tile-button-default-inverted-icon-color",
    "expr": {
      "k": "ref",
      "name": "tile-button-default-inverted-color"
    }
  },
  {
    "name": "tile-default-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "tile-default-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "tile-default-color",
    "expr": {
      "k": "ref",
      "name": "label-color"
    }
  },
  {
    "name": "tile-default-link-color",
    "expr": {
      "k": "ref",
      "name": "link-color"
    }
  },
  {
    "name": "tile-default-link-active-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-link-hover-color"
    }
  },
  {
    "name": "tile-default-link-hover-color",
    "expr": {
      "k": "ref",
      "name": "link-hover-color"
    }
  },
  {
    "name": "tile-default-label-color",
    "expr": {
      "k": "ref",
      "name": "label-color"
    }
  },
  {
    "name": "tile-default-inverted-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-3"
    }
  },
  {
    "name": "tile-default-inverted-selection-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-2"
    }
  },
  {
    "name": "tile-default-inverted-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "tile-default-inverted-label-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-inverted-color"
    }
  },
  {
    "name": "tile-default-inverted-link-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-default-inverted-color"
        },
        {
          "k": "lit",
          "value": "85%"
        }
      ]
    }
  },
  {
    "name": "tile-default-inverted-link-active-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-default-inverted-color"
        },
        {
          "k": "lit",
          "value": "75%"
        }
      ]
    }
  },
  {
    "name": "tile-default-inverted-status-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "tile-default-inverted-status-active-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "20%"
        }
      ]
    }
  },
  {
    "name": "tile-default-inverted-error-status-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-3"
    }
  },
  {
    "name": "tile-default-inverted-error-status-hover-color",
    "expr": {
      "k": "ref",
      "name": "tile-default-inverted-error-status-color"
    }
  },
  {
    "name": "tile-placeholder-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-3"
    }
  },
  {
    "name": "tile-scrollbar-thumb-inverted-main-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "tile-scrollbar-thumb-inverted-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "30%"
        }
      ]
    }
  },
  {
    "name": "tile-scrollbar-thumb-inverted-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "45%"
        }
      ]
    }
  },
  {
    "name": "tile-scrollbar-thumb-inverted-small-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "tile-scrollbar-thumb-inverted-small-hover-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tile-scrollbar-thumb-inverted-main-color"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "tile-table-default-color",
    "expr": {
      "k": "ref",
      "name": "text-color-1"
    }
  },
  {
    "name": "tile-table-default-inverted-selection-background-color",
    "expr": {
      "k": "call",
      "fn": "lighten",
      "args": [
        {
          "k": "ref",
          "name": "tile-default-inverted-background-color"
        },
        {
          "k": "lit",
          "value": "5%"
        }
      ]
    }
  },
  {
    "name": "tile-table-default-inverted-selection-border-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-white"
        },
        {
          "k": "lit",
          "value": "50%"
        }
      ]
    }
  },
  {
    "name": "tile-table-default-inverted-border-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-white"
        },
        {
          "k": "lit",
          "value": "25%"
        }
      ]
    }
  },
  {
    "name": "tile-table-alternative-inverted-selection-background-color",
    "expr": {
      "k": "call",
      "fn": "lighten",
      "args": [
        {
          "k": "ref",
          "name": "tile-alternative-inverted-background-color"
        },
        {
          "k": "lit",
          "value": "5%"
        }
      ]
    }
  },
  {
    "name": "tile-table-alternative-inverted-selection-border-color",
    "expr": {
      "k": "ref",
      "name": "tile-table-default-inverted-selection-border-color"
    }
  },
  {
    "name": "time-picker-disabled-color",
    "expr": {
      "k": "ref",
      "name": "date-picker-day-disabled-color"
    }
  },
  {
    "name": "time-picker-hours-color",
    "expr": {
      "k": "ref",
      "name": "date-picker-weekday-color"
    }
  },
  {
    "name": "time-picker-now-color",
    "expr": {
      "k": "ref",
      "name": "date-picker-now-color"
    }
  },
  {
    "name": "time-picker-now-selected-color",
    "expr": {
      "k": "ref",
      "name": "time-picker-selected-color"
    }
  },
  {
    "name": "time-picker-selected-color",
    "expr": {
      "k": "ref",
      "name": "date-picker-day-selected-color"
    }
  },
  {
    "name": "time-picker-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "date-picker-day-selected-background-color"
    }
  },
  {
    "name": "time-picker-preselected-background-color",
    "expr": {
      "k": "ref",
      "name": "date-picker-day-preselected-background-color"
    }
  },
  {
    "name": "tooltip-ok-background-color",
    "expr": {
      "k": "ref",
      "name": "ok-color"
    }
  },
  {
    "name": "tooltip-ok-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "tooltip-info-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-9"
    }
  },
  {
    "name": "tooltip-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "tooltip-info-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "tooltip-menu-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "tooltip-small-color",
    "expr": {
      "k": "ref",
      "name": "tooltip-info-color"
    }
  },
  {
    "name": "tooltip-warning-background-color",
    "expr": {
      "k": "ref",
      "name": "warning-color"
    }
  },
  {
    "name": "tooltip-warning-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "tooltip-error-background-color",
    "expr": {
      "k": "ref",
      "name": "error-color"
    }
  },
  {
    "name": "tooltip-error-color",
    "expr": {
      "k": "ref",
      "name": "text-inverted-color"
    }
  },
  {
    "name": "tooltip-menu-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "tooltip-menu-selected-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "40%"
        }
      ]
    }
  },
  {
    "name": "tooltip-menu-selected-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "60%"
        }
      ]
    }
  },
  {
    "name": "tooltip-menu-focused-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "30%"
        }
      ]
    }
  },
  {
    "name": "tooltip-menu-info-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-white"
        },
        {
          "k": "lit",
          "value": "15%"
        }
      ]
    }
  },
  {
    "name": "tooltip-menu-info-selected-color",
    "expr": {
      "k": "ref",
      "name": "tooltip-info-color"
    }
  },
  {
    "name": "tooltip-menu-info-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "tooltip-menu-selected-background-color"
    }
  },
  {
    "name": "tooltip-menu-info-selected-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "tooltip-menu-selected-hover-background-color"
    }
  },
  {
    "name": "tooltip-menu-item-selected-disabled-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "tooltip-menu-info-selected-color"
        },
        {
          "k": "lit",
          "value": "50%"
        }
      ]
    }
  },
  {
    "name": "tooltip-menu-info-selected-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "tooltip-menu-info-selected-background-color"
    }
  },
  {
    "name": "tooltip-menu-info-focused-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-white"
        },
        {
          "k": "lit",
          "value": "22%"
        }
      ]
    }
  },
  {
    "name": "top-label-color",
    "expr": {
      "k": "ref",
      "name": "label-color"
    }
  },
  {
    "name": "top-label-disabled-color",
    "expr": {
      "k": "ref",
      "name": "label-disabled-color"
    }
  },
  {
    "name": "tree-node-active-background-color",
    "expr": {
      "k": "ref",
      "name": "item-active-background-color"
    }
  },
  {
    "name": "tree-node-control-color",
    "expr": {
      "k": "lit",
      "value": "inherit"
    }
  },
  {
    "name": "view-tab-selected-color",
    "expr": {
      "k": "ref",
      "name": "outline-title-color"
    }
  },
  {
    "name": "view-tab-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "desktop-navigation-body-background-color"
    }
  },
  {
    "name": "view-tab-in-background-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "desktop-navigation-body-in-background-background-color"
    }
  },
  {
    "name": "view-tab-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "20%"
        }
      ]
    }
  },
  {
    "name": "view-menu-tab-hover-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "10%"
        }
      ]
    }
  },
  {
    "name": "view-menu-tab-menu-selected-background-color",
    "expr": {
      "k": "call",
      "fn": "fade",
      "args": [
        {
          "k": "ref",
          "name": "palette-black"
        },
        {
          "k": "lit",
          "value": "20%"
        }
      ]
    }
  },
  {
    "name": "view-menu-tab-selected-menu-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-with-popup-background-color"
    }
  },
  {
    "name": "view-menu-tab-background-color",
    "expr": {
      "k": "ref",
      "name": "view-tab-hover-background-color"
    }
  },
  {
    "name": "view-menu-tile-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-1"
    }
  },
  {
    "name": "view-menu-tile-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "hover-background-color"
    }
  },
  {
    "name": "view-menu-tile-selected-border-color",
    "expr": {
      "k": "ref",
      "name": "item-selection-border-color"
    }
  },
  {
    "name": "simple-tab-sub-title-color",
    "expr": {
      "k": "ref",
      "name": "sub-title-color"
    }
  },
  {
    "name": "simple-tab-selected-background-color",
    "expr": {
      "k": "ref",
      "name": "background-color"
    }
  },
  {
    "name": "simple-tab-selected-color",
    "expr": {
      "k": "ref",
      "name": "title-color"
    }
  },
  {
    "name": "simple-tab-background-color",
    "expr": {
      "k": "ref",
      "name": "panel-background-color"
    }
  },
  {
    "name": "simple-tab-status-notification-badge-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-red-4"
    }
  },
  {
    "name": "simple-tab-status-notification-badge-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "slider-track-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5-1"
    }
  },
  {
    "name": "slider-track-disabled-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "slider-track-color",
    "expr": {
      "k": "ref",
      "name": "palette-blue-3"
    }
  },
  {
    "name": "slider-track-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-6-1"
    }
  },
  {
    "name": "slider-thumb-color",
    "expr": {
      "k": "ref",
      "name": "palette-white"
    }
  },
  {
    "name": "slider-thumb-active-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-1"
    }
  },
  {
    "name": "slider-thumb-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-4"
    }
  },
  {
    "name": "slider-thumb-active-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "slider-thumb-disabled-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-1"
    }
  },
  {
    "name": "slider-thumb-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-5"
    }
  },
  {
    "name": "wizard-steps-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "wizard-step-selected-icon-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "wizard-step-selected-icon-color",
    "expr": {
      "k": "ref",
      "name": "selected-color"
    }
  },
  {
    "name": "wizard-step-disabled-background-color",
    "expr": {
      "k": "lit",
      "value": "inherit"
    }
  },
  {
    "name": "wizard-step-disabled-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "wizard-step-disabled-color",
    "expr": {
      "k": "ref",
      "name": "disabled-color"
    }
  },
  {
    "name": "wizard-step-background-color",
    "expr": {
      "k": "lit",
      "value": "inherit"
    }
  },
  {
    "name": "wizard-step-icon-border-color",
    "expr": {
      "k": "ref",
      "name": "border-color"
    }
  },
  {
    "name": "wizard-step-finished-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-green-0"
    }
  },
  {
    "name": "wizard-step-finished-color",
    "expr": {
      "k": "ref",
      "name": "ok-color"
    }
  },
  {
    "name": "year-panel-range-background-color",
    "expr": {
      "k": "ref",
      "name": "item-selection-background-color"
    }
  },
  {
    "name": "year-panel-range-hover-background-color",
    "expr": {
      "k": "ref",
      "name": "year-panel-range-background-color"
    }
  },
  {
    "name": "year-panel-range-day-background-color",
    "expr": {
      "k": "ref",
      "name": "selected-background-color"
    }
  },
  {
    "name": "year-panel-title-item-color",
    "expr": {
      "k": "ref",
      "name": "text-color-3"
    }
  },
  {
    "name": "year-panel-weekend-background-color",
    "expr": {
      "k": "ref",
      "name": "palette-gray-7"
    }
  }
];

/** The raw palette entries (`@palette-*`) - the base of the whole color system. */
export const SCOUT_PALETTE_NAMES: string[] = ["palette-black","palette-white","palette-red-0","palette-red-1","palette-red-2","palette-red-3","palette-red-4","palette-red-5","palette-green-0","palette-green-1","palette-green-2","palette-green-3","palette-green-4","palette-green-5","palette-blue-0","palette-blue-1","palette-blue-2","palette-blue-3","palette-blue-4","palette-blue-5","palette-gray-0","palette-gray-1","palette-gray-2","palette-gray-3","palette-gray-4","palette-gray-5","palette-gray-5-1","palette-gray-6","palette-gray-6-1","palette-gray-7","palette-gray-8","palette-gray-9","palette-gray-10","palette-orange-0","palette-orange-1","palette-orange-2","palette-orange-3","palette-orange-4","palette-orange-5"];

/** The accent colors that drive headers, selection, focus and default buttons. */
export const SCOUT_ACCENT_NAMES: string[] = ["accent-color-0","accent-color-1","accent-color-2","accent-color-3","accent-color-4","accent-color-5"];

export const SCOUT_VERSION = '26.2.2';
