import {registerWidgets, type WidgetDef} from './registry';
import {formFieldDefaults, formFieldProps, GROUP_CONTENT, GROUP_STYLE, WIDGET_DEFAULTS, WIDGET_PROPS} from './common';
import {div, span} from '../../render/dom';
import {lines} from '../../render/parts';
import {renderIcon} from '../../render/icons';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(tag: string, attrs: Record<string, string | number>): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}

/** Scout's chart colors follow the accent/palette scheme; these map onto the tokens. */
const CHART_COLORS = [
  'var(--scout-accent-color-3)',
  'var(--scout-palette-green-4)',
  'var(--scout-palette-orange-3)',
  'var(--scout-palette-red-4)',
  'var(--scout-accent-color-2)',
  'var(--scout-palette-green-2)'
];

interface Series {
  label: string;
  values: number[];
}

function parseSeries(raw: unknown, fallback: string[]): Series[] {
  return lines(raw, fallback).map(line => {
    const [label, ...rest] = line.split('|').map(p => p.trim());
    const values = (rest[0] ?? '').split(/[,\s]+/).filter(Boolean).map(Number).filter(n => Number.isFinite(n));
    return {label: label ?? '', values};
  });
}

const defs: WidgetDef[] = [
  {
    objectType: 'ChartField',
    label: 'Chart field',
    category: 'Advanced',
    icon: 'diagram-bar',
    description: 'Chart from @eclipse-scout/chart: bar, line, area, pie or doughnut.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.chartfield.AbstractChartField',
    jsClass: 'ChartField',
    isFormField: true,
    defaults: formFieldDefaults({
      label: 'Chart',
      labelVisible: false,
      'gridDataHints.w': 2,
      'gridDataHints.h': 6,
      chartType: 'bar',
      categories: 'Q1, Q2, Q3, Q4',
      series: 'Revenue|120, 190, 150, 220\nCost|80, 110, 95, 130',
      legendVisible: true,
      legendPosition: 'right'
    }),
    props: formFieldProps(
      {name: 'chartType', label: 'Chart type', type: 'enum', group: GROUP_CONTENT, options: [
        {value: 'bar', label: 'BAR_VERTICAL'},
        {value: 'barHorizontal', label: 'BAR_HORIZONTAL'},
        {value: 'line', label: 'LINE'},
        {value: 'area', label: 'AREA'},
        {value: 'pie', label: 'PIE'},
        {value: 'doughnut', label: 'DOUGHNUT'}
      ]},
      {name: 'categories', label: 'Categories (comma separated)', type: 'string', group: GROUP_CONTENT},
      {name: 'series', label: 'Series (Name|v1, v2, v3)', type: 'lines', group: GROUP_CONTENT},
      {name: 'legendVisible', label: 'Legend visible', type: 'boolean', group: GROUP_STYLE},
      {name: 'legendPosition', label: 'Legend position', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'right', label: 'RIGHT'},
        {value: 'bottom', label: 'BOTTOM'}
      ]}
    ),
    slots: [],
    defaultGridH: 6,
    render(ctx, node) {
      const type = ctx.prop<string>(node, 'chartType', 'bar');
      const categories = String(ctx.prop<string>(node, 'categories', '')).split(',').map(c => c.trim()).filter(Boolean);
      const series = parseSeries(ctx.prop<string>(node, 'series', ''), ['Series|10, 20, 30']);
      const legendVisible = ctx.prop<boolean>(node, 'legendVisible', true);
      const legendPosition = ctx.prop<string>(node, 'legendPosition', 'right');

      const root = div(`chart chart-${type} legend-${legendPosition}`);
      const plot = div('chart-plot');
      const width = 400;
      const height = 240;
      // Bars and lines may stretch to the field; a pie must stay round.
      const round = type === 'pie' || type === 'doughnut';
      const canvas = svg('svg', {
        viewBox: `0 0 ${width} ${height}`,
        preserveAspectRatio: round ? 'xMidYMid meet' : 'none',
        class: 'chart-svg'
      });

      if (type === 'pie' || type === 'doughnut') {
        const values = series.length === 1 ? series[0].values : series.map(s => s.values.reduce((a, b) => a + b, 0));
        const labels = series.length === 1 ? categories : series.map(s => s.label);
        const total = values.reduce((a, b) => a + b, 0) || 1;
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.min(width, height) / 2 - 12;
        const inner = type === 'doughnut' ? r * 0.6 : 0;
        let angle = -Math.PI / 2;
        values.forEach((value, i) => {
          const sweep = (value / total) * Math.PI * 2;
          const end = angle + sweep;
          const large = sweep > Math.PI ? 1 : 0;
          const p = (radius: number, a: number): string => `${cx + radius * Math.cos(a)} ${cy + radius * Math.sin(a)}`;
          const d = inner
            ? `M ${p(r, angle)} A ${r} ${r} 0 ${large} 1 ${p(r, end)} L ${p(inner, end)} A ${inner} ${inner} 0 ${large} 0 ${p(inner, angle)} Z`
            : `M ${cx} ${cy} L ${p(r, angle)} A ${r} ${r} 0 ${large} 1 ${p(r, end)} Z`;
          canvas.appendChild(svg('path', {d, fill: CHART_COLORS[i % CHART_COLORS.length], stroke: 'var(--scout-background-color)', 'stroke-width': 1.5}));
          angle = end;
        });
        void labels;
      } else {
        const max = Math.max(1, ...series.flatMap(s => s.values));
        const count = Math.max(1, ...series.map(s => s.values.length), categories.length);
        const padL = 34;
        const padB = 22;
        const plotW = width - padL - 8;
        const plotH = height - padB - 10;
        for (let i = 0; i <= 4; i++) {
          const y = 10 + (plotH / 4) * i;
          canvas.appendChild(svg('line', {x1: padL, y1: y, x2: width - 8, y2: y, stroke: 'var(--scout-border-color)', 'stroke-width': 1}));
          const text = svg('text', {x: padL - 6, y: y + 4, 'text-anchor': 'end', class: 'chart-axis-label'});
          text.textContent = String(Math.round(max - (max / 4) * i));
          canvas.appendChild(text);
        }
        const step = plotW / count;
        if (type === 'bar') {
          const barWidth = (step * 0.7) / series.length;
          series.forEach((s, si) => {
            s.values.forEach((value, i) => {
              const h = (value / max) * plotH;
              canvas.appendChild(svg('rect', {
                x: padL + i * step + step * 0.15 + si * barWidth,
                y: 10 + plotH - h,
                width: Math.max(2, barWidth - 2),
                height: h,
                fill: CHART_COLORS[si % CHART_COLORS.length],
                rx: 2
              }));
            });
          });
        } else if (type === 'barHorizontal') {
          const barHeight = (plotH / count) * 0.7 / series.length;
          series.forEach((s, si) => {
            s.values.forEach((value, i) => {
              const w = (value / max) * plotW;
              canvas.appendChild(svg('rect', {
                x: padL,
                y: 10 + (plotH / count) * i + (plotH / count) * 0.15 + si * barHeight,
                width: w,
                height: Math.max(2, barHeight - 2),
                fill: CHART_COLORS[si % CHART_COLORS.length],
                rx: 2
              }));
            });
          });
        } else {
          series.forEach((s, si) => {
            const points = s.values.map((value, i) => {
              const x = padL + step * i + step / 2;
              const y = 10 + plotH - (value / max) * plotH;
              return `${x},${y}`;
            });
            if (type === 'area' && points.length) {
              const first = points[0].split(',')[0];
              const last = points[points.length - 1].split(',')[0];
              canvas.appendChild(svg('polygon', {
                points: `${first},${10 + plotH} ${points.join(' ')} ${last},${10 + plotH}`,
                fill: CHART_COLORS[si % CHART_COLORS.length],
                'fill-opacity': 0.25
              }));
            }
            canvas.appendChild(svg('polyline', {
              points: points.join(' '),
              fill: 'none',
              stroke: CHART_COLORS[si % CHART_COLORS.length],
              'stroke-width': 2
            }));
            s.values.forEach((value, i) => {
              canvas.appendChild(svg('circle', {
                cx: padL + step * i + step / 2,
                cy: 10 + plotH - (value / max) * plotH,
                r: 3,
                fill: CHART_COLORS[si % CHART_COLORS.length]
              }));
            });
          });
        }
        categories.forEach((category, i) => {
          const text = svg('text', {x: padL + step * i + step / 2, y: height - 6, 'text-anchor': 'middle', class: 'chart-axis-label'});
          text.textContent = category;
          canvas.appendChild(text);
        });
      }
      plot.appendChild(canvas);
      root.appendChild(plot);

      if (legendVisible) {
        const legend = div('chart-legend');
        const labels = (type === 'pie' || type === 'doughnut') && series.length === 1 ? categories : series.map(s => s.label);
        labels.forEach((label, i) => {
          const item = div('chart-legend-item');
          const dot = span('chart-legend-dot');
          dot.style.backgroundColor = CHART_COLORS[i % CHART_COLORS.length];
          dot.style.borderColor = CHART_COLORS[i % CHART_COLORS.length];
          item.appendChild(dot);
          item.appendChild(span('chart-legend-label', label));
          legend.appendChild(item);
        });
        root.appendChild(legend);
      }
      return root;
    }
  },
  {
    objectType: 'WizardProgressField',
    label: 'Wizard progress',
    category: 'Advanced',
    icon: 'angle-right',
    description: 'Step indicator of a Scout wizard.',
    javaClass: 'org.eclipse.scout.rt.client.ui.form.fields.wizard.AbstractWizardProgressField',
    jsClass: 'WizardProgressField',
    isFormField: true,
    defaults: formFieldDefaults({
      label: '',
      labelVisible: false,
      'gridDataHints.w': 2,
      steps: 'Customer\nProducts\nDelivery\nSummary',
      activeStep: 1
    }),
    props: formFieldProps(
      {name: 'steps', label: 'Steps (one per line)', type: 'lines', group: GROUP_CONTENT},
      {name: 'activeStep', label: 'Active step index', type: 'number', group: GROUP_CONTENT, min: 0}
    ),
    slots: [],
    render(ctx, node) {
      const steps = lines(ctx.prop<string>(node, 'steps', ''), ['Step 1', 'Step 2']);
      const active = Number(ctx.prop<number>(node, 'activeStep', 0));
      const bar = div('wizard-steps');
      steps.forEach((text, i) => {
        const step = div('wizard-step');
        if (i === active) step.classList.add('active-step');
        if (i < active) step.classList.add('finished');
        const bubble = span('wizard-step-content', i < active ? '' : String(i + 1));
        if (i < active) bubble.classList.add('font-icon');
        step.appendChild(bubble);
        step.appendChild(span('wizard-step-title', text));
        bar.appendChild(step);
      });
      return bar;
    }
  },
  {
    objectType: 'Notification',
    label: 'Notification',
    category: 'Advanced',
    icon: 'info',
    description: 'Inline notification bar with a severity.',
    jsClass: 'Notification',
    isFormField: false,
    defaults: {...WIDGET_DEFAULTS, severity: 'info', message: 'The data was saved successfully.', closable: true, iconVisible: true},
    props: [
      ...WIDGET_PROPS,
      {name: 'message', label: 'Message', type: 'text', group: GROUP_CONTENT},
      {name: 'severity', label: 'Severity', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'ok', label: 'OK'},
        {value: 'info', label: 'INFO'},
        {value: 'warning', label: 'WARNING'},
        {value: 'error', label: 'ERROR'}
      ]},
      {name: 'iconVisible', label: 'Icon visible', type: 'boolean', group: GROUP_STYLE},
      {name: 'closable', label: 'Closable', type: 'boolean', group: GROUP_CONTENT}
    ],
    slots: [],
    render(ctx, node) {
      const severity = ctx.prop<string>(node, 'severity', 'info');
      const root = div(`notification ${severity}`);
      if (ctx.prop<boolean>(node, 'iconVisible', true)) {
        const badge = div('notification-icon');
        const icon = renderIcon(severity === 'ok' ? 'checked-bold' : severity === 'info' ? 'info' : 'exclamation-mark-bold');
        if (icon) badge.appendChild(icon);
        root.appendChild(badge);
      }
      root.appendChild(span('notification-message', ctx.prop<string>(node, 'message', '')));
      if (ctx.prop<boolean>(node, 'closable', true)) {
        const closer = renderIcon('remove', 'closer');
        if (closer) root.appendChild(closer);
      }
      return root;
    }
  },
  {
    objectType: 'MessageBox',
    label: 'Message box',
    category: 'Advanced',
    icon: 'exclamation-mark-circle',
    description: 'Modal message box with header, body and action buttons.',
    jsClass: 'MessageBox',
    isFormField: false,
    defaults: {
      ...WIDGET_DEFAULTS,
      header: 'Delete entry?',
      body: 'The selected entry will be permanently deleted.',
      severity: 'warning',
      yesButtonText: 'Yes',
      noButtonText: 'No',
      cancelButtonText: ''
    },
    props: [
      ...WIDGET_PROPS,
      {name: 'header', label: 'Header', type: 'string', group: GROUP_CONTENT},
      {name: 'body', label: 'Body', type: 'text', group: GROUP_CONTENT},
      {name: 'severity', label: 'Severity', type: 'enum', group: GROUP_STYLE, options: [
        {value: 'ok', label: 'OK'},
        {value: 'info', label: 'INFO'},
        {value: 'warning', label: 'WARNING'},
        {value: 'error', label: 'ERROR'}
      ]},
      {name: 'yesButtonText', label: 'Yes button', type: 'string', group: GROUP_CONTENT},
      {name: 'noButtonText', label: 'No button', type: 'string', group: GROUP_CONTENT},
      {name: 'cancelButtonText', label: 'Cancel button', type: 'string', group: GROUP_CONTENT}
    ],
    slots: [],
    render(ctx, node) {
      const box = div(`messagebox ${ctx.prop<string>(node, 'severity', 'warning')}`);
      box.appendChild(div('messagebox-label messagebox-header', ctx.prop<string>(node, 'header', '')));
      box.appendChild(div('messagebox-label messagebox-body', ctx.prop<string>(node, 'body', '')));
      const buttons = div('messagebox-buttons');
      for (const key of ['yesButtonText', 'noButtonText', 'cancelButtonText'] as const) {
        const text = ctx.prop<string>(node, key, '');
        if (!text) continue;
        const button = div('button');
        if (key === 'yesButtonText') button.classList.add('default');
        button.appendChild(span('text', text));
        buttons.appendChild(button);
      }
      box.appendChild(buttons);
      return box;
    }
  }
];

registerWidgets(defs);
