import {createDocument, node} from './document';
import type {MockupDocument} from './types';

export function defaultDesktopTemplate(name = 'New mockup'): MockupDocument {
  return createDocument(
    node({
      objectType: 'Desktop',
      properties: {
        title: 'ES Mockup Application',
        logoText: 'ES',
        selectedOutline: 0,
        selectedView: 0
      },
      children: [
        {
          objectType: 'Outline',
          slot: 'outlines',
          properties: {
            title: 'Navigation',
            selectedNode: 3,
            nodes: [
              'Dashboard [chart]',
              'Customers [group]',
              '  Companies',
              '  Persons',
              'Orders [list]',
              '  Open orders',
              '  Archived orders',
              '+ Administration [gear]'
            ].join('\n')
          }
        },
        {
          objectType: 'Form',
          slot: 'views',
          properties: {
            title: 'Person',
            subTitle: 'Ada Lovelace',
            iconId: 'person-solid',
            displayHint: 'view',
            gridColumnCount: 2
          },
          children: [
            {
              objectType: 'GroupBox',
              slot: 'fields',
              properties: {
                label: 'Personal data',
                gridColumnCount: 2
              },
              children: [
                {objectType: 'StringField', slot: 'fields', properties: {label: 'First name', displayText: 'Ada', mandatory: true}},
                {objectType: 'StringField', slot: 'fields', properties: {label: 'Last name', displayText: 'Lovelace', mandatory: true}},
                {objectType: 'DateField', slot: 'fields', properties: {label: 'Date of birth', displayText: '10.12.1815'}},
                {objectType: 'SmartField', slot: 'fields', properties: {label: 'Country', displayText: 'United Kingdom'}},
                {objectType: 'StringField', slot: 'fields', properties: {label: 'E-mail', displayText: 'ada@example.org', 'gridDataHints.w': 2}},
                {
                  objectType: 'StringField',
                  slot: 'fields',
                  properties: {label: 'Notes', displayText: 'Wrote the first algorithm intended for a machine.', multilineText: true, 'gridDataHints.w': 2, 'gridDataHints.h': 3}
                }
              ]
            },
            {
              objectType: 'TabBox',
              slot: 'fields',
              properties: {'gridDataHints.h': 8, selectedTab: 0},
              children: [
                {
                  objectType: 'TabItem',
                  slot: 'tabItems',
                  properties: {label: 'Orders', gridColumnCount: 1},
                  children: [
                    {
                      objectType: 'TableField',
                      slot: 'fields',
                      properties: {
                        labelVisible: false,
                        'gridDataHints.h': 6,
                        columns: [
                          ['Order no.', 'left', '110'],
                          ['Date', 'left', '110'],
                          ['Status', 'left', ''],
                          ['Amount', 'right', '110']
                        ],
                        rows: [
                          ['ORD-1042', '03.08.2026', 'Shipped', "1 250.00"],
                          ['ORD-1043', '17.08.2026', 'Open', '980.50'],
                          ['ORD-1051', '29.08.2026', 'Open', "3 400.00"]
                        ],
                        selectedRow: 1,
                        footerVisible: true
                      },
                      children: [
                        {objectType: 'Menu', slot: 'menus', properties: {text: 'New', iconId: 'plus'}},
                        {objectType: 'Menu', slot: 'menus', properties: {text: 'Edit', iconId: 'pencil'}},
                        {objectType: 'Menu', slot: 'menus', properties: {text: 'Delete', iconId: 'remove'}}
                      ]
                    }
                  ]
                },
                {
                  objectType: 'TabItem',
                  slot: 'tabItems',
                  properties: {label: 'Statistics', gridColumnCount: 1},
                  children: [
                    {
                      objectType: 'ChartField',
                      slot: 'fields',
                      properties: {
                        labelVisible: false,
                        chartType: 'bar',
                        'gridDataHints.h': 6,
                        categories: 'Q1, Q2, Q3, Q4',
                        series: [
                          ['Revenue', '120, 190, 150, 220'],
                          ['Cost', '80, 110, 95, 130']
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          ]
        },
        {objectType: 'Menu', slot: 'toolMenus', properties: {text: '', iconId: 'search'}},
        {
          objectType: 'Menu',
          slot: 'toolMenus',
          properties: {text: 'Quick access', iconId: 'star'},
          children: [
            {objectType: 'Menu', slot: 'childActions', properties: {text: 'Recently opened', iconId: 'clock'}},
            {objectType: 'Menu', slot: 'childActions', properties: {text: 'Bookmarks', iconId: 'star-marked'}}
          ]
        },
        {objectType: 'Menu', slot: 'toolMenus', properties: {text: 'Options', iconId: 'gear'}},
        {objectType: 'Menu', slot: 'toolMenus', properties: {text: 'Alice', iconId: 'person-solid', displayStyle: 'avatar'}}
      ]
    }),
    name
  );
}

export function emptyDesktopTemplate(name = 'Empty mockup'): MockupDocument {
  return createDocument(
    node({
      objectType: 'Desktop',
      properties: {title: 'Application', logoText: 'ES'},
      children: [
        {objectType: 'Outline', slot: 'outlines', properties: {title: 'Navigation', nodes: 'First page\nSecond page', selectedNode: 0}},
        {objectType: 'Form', slot: 'views', properties: {title: 'Form', displayHint: 'view'}}
      ]
    }),
    name
  );
}

export function formOnlyTemplate(name = 'Form mockup'): MockupDocument {
  const doc = createDocument(
    node({
      objectType: 'Desktop',
      properties: {navigationVisible: false, headerVisible: false, title: 'Form only'},
      children: [
        {
          objectType: 'Form',
          slot: 'views',
          properties: {title: 'Form', displayHint: 'view', gridColumnCount: 2},
          children: [
            {objectType: 'StringField', slot: 'fields', properties: {label: 'First field'}},
            {objectType: 'StringField', slot: 'fields', properties: {label: 'Second field'}}
          ]
        }
      ]
    }),
    name
  );
  doc.canvas.width = 900;
  doc.canvas.height = 560;
  return doc;
}

export function widgetGalleryTemplate(name = 'Widget gallery'): MockupDocument {
  const doc = createDocument(
    node({
      objectType: 'Desktop',
      properties: {title: 'Scout widget gallery', logoText: 'ES', selectedView: 0},
      children: [
        {
          objectType: 'Outline',
          slot: 'outlines',
          properties: {title: 'Widgets', selectedNode: 0, nodes: 'Value fields [pencil]\nSelection fields [list]\nTables & trees [folder]\nTiles & layout [group]\nAdvanced [chart]'}
        },
        {
          objectType: 'Form',
          slot: 'views',
          properties: {title: 'Value fields', displayHint: 'view', gridColumnCount: 2},
          children: [
            {objectType: 'StringField', slot: 'fields', properties: {label: 'String field', displayText: 'Some text', mandatory: true}},
            {objectType: 'StringField', slot: 'fields', properties: {label: 'Password', displayText: 'secret42', inputMasked: true}},
            {objectType: 'NumberField', slot: 'fields', properties: {label: 'Number field', displayText: "1'234.50"}},
            {objectType: 'IntegerField', slot: 'fields', properties: {label: 'Integer field', displayText: '42'}},
            {objectType: 'DateField', slot: 'fields', properties: {label: 'Date field', displayText: '01.09.2026'}},
            {objectType: 'DateField', slot: 'fields', properties: {label: 'Date & time', displayText: '01.09.2026', hasTime: true, timeDisplayText: '14:30'}},
            {objectType: 'SmartField', slot: 'fields', properties: {label: 'Smart field', displayText: 'Switzerland'}},
            {objectType: 'ProposalField', slot: 'fields', properties: {label: 'Proposal field', displayText: 'Free text or proposal'}},
            {objectType: 'TagField', slot: 'fields', properties: {label: 'Tag field'}},
            {objectType: 'ColorField', slot: 'fields', properties: {label: 'Color field', value: '#0DA98C'}},
            {objectType: 'FileChooserField', slot: 'fields', properties: {label: 'File chooser', displayText: 'contract.pdf'}},
            {objectType: 'SliderField', slot: 'fields', properties: {label: 'Slider field', value: 65}},
            {objectType: 'LabelField', slot: 'fields', properties: {label: 'Label field', displayText: 'Read only output'}},
            {objectType: 'StringField', slot: 'fields', properties: {label: 'With error', displayText: 'Not a number', errorStatus: 'error', errorStatusMessage: 'Please enter a number.'}},
            {objectType: 'StringField', slot: 'fields', properties: {label: 'Multiline', displayText: 'Line one\nLine two', multilineText: true, 'gridDataHints.w': 2, 'gridDataHints.h': 2}},
            {objectType: 'SequenceBox', slot: 'fields', properties: {label: 'From - to', 'gridDataHints.w': 2}, children: [
              {objectType: 'DateField', slot: 'fields', properties: {label: 'From', displayText: '01.09.2026'}},
              {objectType: 'DateField', slot: 'fields', properties: {label: 'To', displayText: '30.09.2026'}}
            ]},
            {objectType: 'HtmlField', slot: 'fields', properties: {label: 'HTML field', displayText: 'Rich text content', 'gridDataHints.w': 2, 'gridDataHints.h': 2}}
          ]
        },
        {
          objectType: 'Form',
          slot: 'views',
          properties: {title: 'Selection fields', displayHint: 'view', gridColumnCount: 2},
          children: [
            {objectType: 'CheckBoxField', slot: 'fields', properties: {text: 'Check box (checked)', value: true}},
            {objectType: 'CheckBoxField', slot: 'fields', properties: {text: 'Check box (unchecked)'}},
            {objectType: 'SwitchField', slot: 'fields', properties: {label: 'Switch', value: true}},
            {objectType: 'ModeSelectorField', slot: 'fields', properties: {label: 'Mode selector'}},
            {objectType: 'RadioButtonGroup', slot: 'fields', properties: {label: 'Radio buttons', 'gridDataHints.h': 3}},
            {objectType: 'ListBox', slot: 'fields', properties: {label: 'List box', 'gridDataHints.h': 4}},
            {objectType: 'TreeBox', slot: 'fields', properties: {label: 'Tree box', 'gridDataHints.h': 5}},
            {objectType: 'Button', slot: 'fields', properties: {text: 'Default button', defaultButton: true}},
            {objectType: 'Button', slot: 'fields', properties: {text: 'Normal button'}},
            {objectType: 'Button', slot: 'fields', properties: {text: 'Toggle (selected)', displayStyle: 'toggle', selected: true}},
            {objectType: 'FileChooserButton', slot: 'fields', properties: {label: 'Attachment'}}
          ]
        },
        {
          objectType: 'Form',
          slot: 'views',
          properties: {title: 'Tables & trees', displayHint: 'view', gridColumnCount: 1},
          children: [
            {objectType: 'TableField', slot: 'fields', properties: {labelVisible: false, 'gridDataHints.h': 6, checkable: true, checkedRows: '0\n2', footerVisible: true, selectedRow: 0}, children: [
              {objectType: 'Menu', slot: 'menus', properties: {text: 'New', iconId: 'plus'}},
              {objectType: 'Menu', slot: 'menus', properties: {text: 'Export', iconId: 'file'}}
            ]},
            {objectType: 'TreeField', slot: 'fields', properties: {labelVisible: false, 'gridDataHints.h': 5}},
            {objectType: 'CalendarField', slot: 'fields', properties: {labelVisible: false, 'gridDataHints.h': 10}},
            {objectType: 'PlannerField', slot: 'fields', properties: {labelVisible: false, 'gridDataHints.h': 6}}
          ]
        },
        {
          objectType: 'Form',
          slot: 'views',
          properties: {title: 'Tiles & layout', displayHint: 'view', gridColumnCount: 1},
          children: [
            {objectType: 'BreadcrumbBarField', slot: 'fields', properties: {}},
            {objectType: 'WizardProgressField', slot: 'fields', properties: {}},
            {objectType: 'TileField', slot: 'fields', properties: {labelVisible: false, 'gridDataHints.h': 5, gridColumnCount: 4}, children: [
              {objectType: 'Tile', slot: 'tiles', properties: {title: 'Open orders', content: '17'}},
              {objectType: 'Tile', slot: 'tiles', properties: {title: 'Revenue', content: "1'250'000", colorScheme: 'alternative'}},
              {objectType: 'Tile', slot: 'tiles', properties: {title: 'Customers', content: '482', colorScheme: 'ranking'}},
              {objectType: 'Tile', slot: 'tiles', properties: {title: 'Alerts', content: '3', colorScheme: 'inverted'}}
            ]},
            {objectType: 'Accordion', slot: 'fields', properties: {}, children: [
              {objectType: 'Group', slot: 'groups', properties: {title: 'Contact', subTitle: '3 entries', gridColumnCount: 2}, children: [
                {objectType: 'StringField', slot: 'fields', properties: {label: 'Phone', displayText: '+41 44 000 00 00'}},
                {objectType: 'StringField', slot: 'fields', properties: {label: 'Mobile', displayText: '+41 79 000 00 00'}}
              ]},
              {objectType: 'Group', slot: 'groups', properties: {title: 'Address', collapsed: true}}
            ]},
            {objectType: 'TileAccordion', slot: 'fields', properties: {'gridDataHints.h': 7, gridColumnCount: 3}, children: [
              {objectType: 'Group', slot: 'groups', properties: {title: 'Favourites', subTitle: '2 tiles'}, children: [
                {objectType: 'Tile', slot: 'tiles', properties: {title: 'Open orders', content: '17'}},
                {objectType: 'Tile', slot: 'tiles', properties: {title: 'Revenue', content: "1'250'000", colorScheme: 'default-inverted'}}
              ]},
              {objectType: 'Group', slot: 'groups', properties: {title: 'Archive', collapsed: true}}
            ]},
            {objectType: 'Carousel', slot: 'fields', properties: {'gridDataHints.h': 4}},
            {objectType: 'SplitBox', slot: 'fields', properties: {'gridDataHints.h': 6}, children: [
              {objectType: 'GroupBox', slot: 'fields', properties: {label: 'Left', gridColumnCount: 1}, children: [
                {objectType: 'StringField', slot: 'fields', properties: {label: 'Field A'}}
              ]},
              {objectType: 'GroupBox', slot: 'fields', properties: {label: 'Right', gridColumnCount: 1}, children: [
                {objectType: 'StringField', slot: 'fields', properties: {label: 'Field B'}}
              ]}
            ]}
          ]
        },
        {
          objectType: 'Form',
          slot: 'views',
          properties: {title: 'Advanced', displayHint: 'view', gridColumnCount: 2},
          children: [
            {objectType: 'ChartField', slot: 'fields', properties: {labelVisible: false, chartType: 'bar', 'gridDataHints.h': 6}},
            {objectType: 'ChartField', slot: 'fields', properties: {labelVisible: false, chartType: 'line', 'gridDataHints.h': 6}},
            {objectType: 'ChartField', slot: 'fields', properties: {labelVisible: false, chartType: 'pie', 'gridDataHints.h': 6, series: [['Share', '35, 25, 22, 18']], categories: 'North, South, East, West'}},
            {objectType: 'ChartField', slot: 'fields', properties: {labelVisible: false, chartType: 'doughnut', 'gridDataHints.h': 6, series: [['Share', '40, 30, 30']], categories: 'Web, Mobile, Desk'}},
            {objectType: 'BrowserField', slot: 'fields', properties: {labelVisible: false, 'gridDataHints.w': 2, 'gridDataHints.h': 4}},
            {objectType: 'ClipboardField', slot: 'fields', properties: {label: 'Clipboard', 'gridDataHints.w': 2, 'gridDataHints.h': 3}},
            {objectType: 'HeatmapField', slot: 'fields', properties: {'gridDataHints.w': 2, 'gridDataHints.h': 8}}
          ]
        },
        {objectType: 'Notification', slot: 'notifications', properties: {severity: 'info', message: 'This gallery shows one instance of every widget in the catalog.'}},
        {objectType: 'Popup', slot: 'popups', properties: {title: 'Popup', content: 'Floating panel - it does not dim the desktop.', 'bounds.x': 980, 'bounds.y': 620}},
        {objectType: 'Tooltip', slot: 'popups', properties: {text: 'Tooltips explain a field or a menu.', 'bounds.x': 980, 'bounds.y': 830}},
        {objectType: 'Menu', slot: 'toolMenus', properties: {text: '', iconId: 'search'}},
        {objectType: 'Menu', slot: 'toolMenus', properties: {text: '', iconId: 'star'}},
        {objectType: 'Menu', slot: 'toolMenus', properties: {text: '', iconId: 'person-solid'}}
      ]
    }),
    name
  );
  doc.canvas.height = 1760;
  return doc;
}

export const TEMPLATES = [
  {id: 'desktop', label: 'Scout desktop (default)', description: 'Navigation, outline, view tabs, tool box, logo and a sample form.', create: defaultDesktopTemplate},
  {id: 'empty', label: 'Empty desktop', description: 'The desktop chrome with an empty outline and bench.', create: emptyDesktopTemplate},
  {id: 'form', label: 'Form only', description: 'A single form without the desktop chrome.', create: formOnlyTemplate},
  {id: 'gallery', label: 'Widget gallery', description: 'One of every widget, grouped into five views - a visual catalog.', create: widgetGalleryTemplate}
];
