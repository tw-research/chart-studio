const sample = [
  { label: 'Enjoyment', group: 'agreement', values: [1, 1, 2, 3, 7, 6, 4] },
  { label: 'Exploration', group: 'agreement', values: [0, 1, 2, 4, 5, 7, 3] },
  { label: 'Expressiveness', group: 'agreement', values: [0, 0, 1, 3, 6, 8, 4] },
  { label: 'Immersiveness', group: 'agreement', values: [1, 2, 3, 5, 4, 5, 2] },
  { label: 'Worthwhile', group: 'agreement', values: [0, 1, 2, 3, 7, 5, 4] },
  { label: 'Human–machine collaboration', group: 'agreement', values: [1, 2, 3, 4, 6, 4, 3] },
  { label: 'Communication', group: 'agreement', values: [1, 2, 3, 5, 5, 4, 3] },
  { label: 'Alignment', group: 'agreement', values: [1, 2, 3, 4, 6, 3, 2] },
  { label: 'Agency', group: 'agreement', values: [1, 2, 4, 5, 5, 4, 2] },
  { label: 'Partnership', group: 'agreement', values: [1, 1, 3, 5, 4, 5, 2] },
  { label: 'Contribution', group: 'bipolar', values: [4, 3, 4, 5, 4, 2, 1] },
  { label: 'Satisfaction', group: 'bipolar', values: [0, 1, 2, 4, 5, 7, 4] },
  { label: 'Surprise', group: 'bipolar', values: [3, 3, 4, 4, 4, 6, 3] },
  { label: 'Novelty', group: 'bipolar', values: [0, 1, 2, 4, 6, 5, 4] },
];
const agreement = ['#c94d49', '#bd6561', '#a87978', '#89918b', '#75a893', '#48a987', '#19b978'];
const bipolar = ['#d39a32', '#c49a52', '#a88f69', '#89918b', '#6d99ae', '#438fb2', '#168ec2'];
const seriesColors = ['#24836c', '#478eb7', '#d39a32', '#c4615d', '#785da8', '#57a575', '#d17d35', '#506b80', '#ae709b', '#82954c'];
const svgNS = 'http://www.w3.org/2000/svg';
const chart = document.querySelector('#chart');
const rowsHost = document.querySelector('#dataRows');
const headHost = document.querySelector('#dataHead');
let rows = structuredClone(sample);
let seriesNames = sample[0].values.map((_, i) => String(i + 1));

const el = (id) => document.getElementById(id);
const chartType = () => el('chartType').value;
const isLikert = () => chartType() === 'likert';
const readScaleInput = (id, fallback) => Number.isFinite(Number(el(id).value)) && el(id).value.trim() !== '' ? Math.trunc(Number(el(id).value)) : fallback;
const minValue = () => Math.min(readScaleInput('scaleMin', 1), readScaleInput('scaleMax', 7));
const maxValue = () => Math.max(readScaleInput('scaleMin', 1), readScaleInput('scaleMax', 7));
const scaleCount = () => maxValue() - minValue() + 1;
const seriesColor = (index) => seriesColors[index % seriesColors.length];
function seriesName(index) {
  let name = '', n = index;
  do { name = String.fromCharCode(65 + n % 26) + name; n = Math.floor(n / 26) - 1; } while (n >= 0);
  return `Series ${name}`;
}

function node(tag, attrs = {}, parent = chart) {
  const result = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attrs)) result.setAttribute(key, String(value));
  parent.append(result);
  return result;
}
function label(parent, text, attrs = {}) {
  const item = node('text', attrs, parent); item.textContent = text; return item;
}
function formatNumber(value) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }

function resizeLikertScale(nextMin, nextMax) {
  const oldMin = minValue();
  const oldCount = seriesNames.length;
  const oldPoints = seriesNames.map((name, index) => /^-?\d+$/.test(name) ? Number(name) : oldMin + index);
  const min = Math.min(nextMin, nextMax), max = Math.max(nextMin, nextMax);
  const nextCount = max - min + 1;
  rows = rows.map((row) => {
    const nextValues = Array(nextCount).fill(0);
    for (let oldIndex = 0; oldIndex < oldCount; oldIndex++) {
      const scalePoint = oldPoints[oldIndex];
      if (scalePoint >= min && scalePoint <= max) nextValues[scalePoint - min] = row.values[oldIndex] ?? 0;
    }
    return { ...row, values: nextValues };
  });
  seriesNames = Array.from({ length: nextCount }, (_, index) => String(min + index));
  el('scaleMin').value = min; el('scaleMax').value = max;
}

function renderTable() {
  document.querySelector('.data-table').classList.toggle('generic-data', !isLikert());
  headHost.replaceChildren(); rowsHost.replaceChildren();
  const top = document.createElement('tr');
  const categoryHeading = document.createElement('th'); categoryHeading.className = 'question-col'; categoryHeading.textContent = isLikert() ? 'QUESTION' : 'CATEGORY / X'; top.append(categoryHeading);
  if (isLikert()) {
    const paletteHeading = document.createElement('th'); paletteHeading.className = 'group-col'; paletteHeading.textContent = 'PALETTE'; top.append(paletteHeading);
  }
  const valueHeading = document.createElement('th'); valueHeading.colSpan = seriesNames.length; valueHeading.textContent = isLikert() ? 'RESPONSE COUNTS' : 'SERIES VALUES'; top.append(valueHeading);
  const blank = document.createElement('th'); top.append(blank); headHost.append(top);
  const seriesRow = document.createElement('tr'); seriesRow.className = 'scale-row';
  seriesRow.append(document.createElement('th'));
  if (isLikert()) seriesRow.append(document.createElement('th'));
  seriesNames.forEach((name, columnIndex) => {
    const th = document.createElement('th');
    if (isLikert()) { th.textContent = name; if (Number(name) === (minValue() + maxValue()) / 2) th.className = 'neutral-head'; }
    else {
      const input = document.createElement('input'); input.className = 'series-name-input'; input.value = name; input.maxLength = 24; input.setAttribute('aria-label', `Series ${columnIndex + 1} name`);
      input.addEventListener('input', () => { seriesNames[columnIndex] = input.value; render(false); }); th.append(input);
    }
    seriesRow.append(th);
  });
  seriesRow.append(document.createElement('th')); headHost.append(seriesRow);

  rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    const category = document.createElement('td');
    const questionInput = document.createElement('input'); questionInput.className = 'question-input'; questionInput.value = row.label; questionInput.maxLength = 48; questionInput.setAttribute('aria-label', `${isLikert() ? 'Question' : 'Category'} ${rowIndex + 1}`);
    questionInput.addEventListener('input', () => { rows[rowIndex].label = questionInput.value; render(false); }); category.append(questionInput); tr.append(category);
    if (isLikert()) {
      const paletteCell = document.createElement('td');
      const select = document.createElement('select'); select.className = 'group-select'; select.setAttribute('aria-label', `Palette for ${row.label}`);
      select.innerHTML = '<option value="agreement">Agree</option><option value="bipolar">Bipolar</option>'; select.value = row.group;
      select.addEventListener('change', () => { rows[rowIndex].group = select.value; render(false); }); paletteCell.append(select); tr.append(paletteCell);
    }
    seriesNames.forEach((_, valueIndex) => {
      const cell = document.createElement('td'); cell.className = `count-cell${isLikert() && valueIndex === Math.floor((scaleCount() - 1) / 2) ? ' neutral-cell' : ''}`;
      const input = document.createElement('input'); input.className = 'count-input'; input.type = 'number'; input.step = isLikert() ? '1' : 'any'; if (isLikert()) input.min = '0'; input.value = row.values[valueIndex] ?? 0;
      input.setAttribute('aria-label', `${row.label}, ${isLikert() ? `response ${minValue() + valueIndex}` : seriesNames[valueIndex]}`);
      input.addEventListener('input', () => { const entered = Number(input.value) || 0; rows[rowIndex].values[valueIndex] = isLikert() ? Math.max(0, Math.floor(entered)) : entered; render(false); }); cell.append(input); tr.append(cell);
    });
    const removeCell = document.createElement('td'); removeCell.className = 'remove-cell';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'remove-question'; remove.textContent = '×'; remove.title = 'Remove row'; remove.disabled = rows.length <= 1; remove.setAttribute('aria-label', `Remove ${row.label}`);
    remove.addEventListener('click', () => { rows.splice(rowIndex, 1); renderTable(); render(); }); removeCell.append(remove); tr.append(removeCell); rowsHost.append(tr);
  });
}

function setupSvg(width, height) {
  chart.setAttribute('viewBox', `0 0 ${width} ${height}`); chart.replaceChildren();
  node('rect', { x: 0, y: 0, width, height, fill: '#ffffff' });
}
function chartText(text, x, y, { fill = '#68736d', size = 10, anchor = 'middle', family = 'DM Sans, sans-serif' } = {}) {
  return label(chart, text, { x, y, fill, 'font-size': size, 'font-family': family, 'text-anchor': anchor });
}
function drawGrid({ x, y, width, height, min, max, step, baseline = null, formatter = formatNumber }) {
  for (let value = min; value <= max + step / 100; value += step) {
    const px = x + ((value - min) / (max - min || 1)) * width;
    node('line', { x1: px, y1: y, x2: px, y2: y + height, stroke: baseline !== null && Math.abs(value - baseline) < 0.0001 ? '#53625b' : '#eceee8', 'stroke-width': baseline !== null && Math.abs(value - baseline) < 0.0001 ? 1.5 : 1 });
    chartText(formatter(value), px, y + height + 16, { fill: '#9aa19b', size: 9, family: 'DM Mono, monospace' });
  }
}
function niceStep(range) { return range > 100 ? 20 : range > 40 ? 10 : range > 20 ? 5 : range > 10 ? 2 : 1; }

function drawLikert() {
  const width = 1100, left = 255, right = 75, top = 15, rowHeight = 29, barHeight = 16;
  const plotWidth = width - left - right;
  const midpoint = (minValue() + maxValue()) / 2;
  const leftTotals = rows.map((row) => row.values.reduce((sum, count, index) => sum + ((minValue() + index) < midpoint ? count : (minValue() + index) === midpoint ? count / 2 : 0), 0));
  const rightTotals = rows.map((row) => row.values.reduce((sum, count, index) => sum + ((minValue() + index) > midpoint ? count : (minValue() + index) === midpoint ? count / 2 : 0), 0));
  const maxHalf = Math.max(1, ...leftTotals, ...rightTotals);
  const step = niceStep(maxHalf); const domain = Math.ceil(maxHalf / step) * step;
  const center = left + plotWidth / 2, scale = (plotWidth / 2) / domain;
  const height = top + rows.length * rowHeight + 50; setupSvg(width, height);
  for (let tick = -domain; tick <= domain; tick += step) {
    const x = center + tick * scale;
    if (el('showGrid').checked || tick === 0) node('line', { x1: x, y1: top - 4, x2: x, y2: height - 20, stroke: tick === 0 ? '#53625b' : '#eceee8', 'stroke-width': tick === 0 ? 1.5 : 1 });
    chartText(String(Math.abs(tick)), x, height - 23, { fill: '#9aa19b', size: 9, family: 'DM Mono, monospace' });
  }
  chartText(el('lowLabel').value.trim(), left, height - 3, { fill: '#707b74', size: 9, anchor: 'start' });
  chartText(el('highLabel').value.trim(), width - right, height - 3, { fill: '#707b74', size: 9, anchor: 'end' });
  rows.forEach((row, rowIndex) => {
    const y = top + rowIndex * rowHeight + 4;
    chartText(row.label || `Row ${rowIndex + 1}`, left - 13, y + 12, { fill: '#4b554f', size: 11, anchor: 'end' });
    const colors = row.group === 'bipolar' ? bipolar : agreement;
    let leftCursor = center;
    for (let i = seriesNames.length - 1; i >= 0; i--) {
      const point = minValue() + i, count = row.values[i] ?? 0;
      if (point > midpoint) continue;
      const amount = point === midpoint ? count / 2 : count;
      const segmentWidth = amount * scale; leftCursor -= segmentWidth;
      if (segmentWidth > 0) node('rect', { x: leftCursor, y, width: segmentWidth, height: barHeight, fill: colors[i % colors.length], stroke: '#ffffff', 'stroke-width': .7, rx: .7 });
    }
    let rightCursor = center;
    for (let i = 0; i < seriesNames.length; i++) {
      const point = minValue() + i, count = row.values[i] ?? 0;
      if (point < midpoint) continue;
      const amount = point === midpoint ? count / 2 : count;
      const segmentWidth = amount * scale;
      if (segmentWidth > 0) node('rect', { x: rightCursor, y, width: segmentWidth, height: barHeight, fill: colors[i % colors.length], stroke: '#ffffff', 'stroke-width': .7, rx: .7 });
      rightCursor += segmentWidth;
    }
    if (el('showCounts').checked) chartText(String(row.values.reduce((sum, count) => sum + count, 0)), Math.min(rightCursor + 8, width - 22), y + 12, { fill: '#858d87', size: 9, anchor: 'start', family: 'DM Mono, monospace' });
  });
}

function drawBars(stacked, vertical = false) {
  if (vertical) {
    const width = 1100, left = 78, right = 34, top = 25, bottom = 92;
    const plotWidth = width - left - right, plotHeight = 310;
    const values = rows.flatMap((row) => row.values.slice(0, seriesNames.length));
    const domainMin = stacked ? Math.min(0, ...rows.map((row) => row.values.reduce((sum, v) => sum + Math.min(0, v), 0))) : Math.min(0, ...values);
    const domainMax = stacked ? Math.max(1, ...rows.map((row) => row.values.reduce((sum, v) => sum + Math.max(0, v), 0))) : Math.max(1, ...values);
    const step = niceStep(domainMax - domainMin), axisMin = Math.floor(domainMin / step) * step, axisMax = Math.ceil(domainMax / step) * step || 1;
    const height = top + plotHeight + bottom; setupSvg(width, height);
    const yFor = (value) => top + plotHeight - (value - axisMin) / (axisMax - axisMin) * plotHeight;
    for (let value = axisMin; value <= axisMax + step / 100; value += step) {
      const y = yFor(value);
      node('line', { x1: left, y1: y, x2: left + plotWidth, y2: y, stroke: value === 0 ? '#53625b' : el('showGrid').checked ? '#eceee8' : 'transparent', 'stroke-width': value === 0 ? 1.5 : 1 });
      chartText(formatNumber(value), left - 12, y + 3, { fill: '#9aa19b', size: 9, anchor: 'end', family: 'DM Mono, monospace' });
    }
    const cellWidth = plotWidth / Math.max(rows.length, 1);
    rows.forEach((row, rowIndex) => {
      const centerX = left + cellWidth * (rowIndex + .5);
      if (stacked) {
        let positive = 0, negative = 0;
        row.values.forEach((value, seriesIndex) => {
          const start = value >= 0 ? positive : negative, end = start + value;
          const y1 = yFor(start), y2 = yFor(end);
          node('rect', { x: centerX - Math.min(30, cellWidth * .34), y: Math.min(y1, y2), width: Math.min(60, cellWidth * .68), height: Math.max(0, Math.abs(y2 - y1)), fill: seriesColor(seriesIndex), stroke: '#ffffff', 'stroke-width': .8, rx: 1 });
          if (value >= 0) positive = end; else negative = end;
        });
      } else {
        const slot = Math.min(52, cellWidth * .75) / Math.max(seriesNames.length, 1);
        const barWidth = Math.min(19, slot * .78);
        const startX = centerX - slot * seriesNames.length / 2;
        row.values.forEach((value, seriesIndex) => {
          const y1 = yFor(0), y2 = yFor(value);
          node('rect', { x: startX + seriesIndex * slot, y: Math.min(y1, y2), width: barWidth, height: Math.max(0, Math.abs(y2 - y1)), fill: seriesColor(seriesIndex), rx: 1 });
        });
      }
      const item = chartText(row.label || `Row ${rowIndex + 1}`, centerX, top + plotHeight + 20, { fill: '#737d77', size: 9 });
      if (rows.length > 8) { item.setAttribute('text-anchor', 'end'); item.setAttribute('transform', `rotate(-38 ${centerX} ${top + plotHeight + 20})`); }
    });
    return;
  }
  const width = 1100, left = 255, right = 75, top = 20, plotWidth = width - left - right;
  const values = rows.flatMap((row) => row.values.slice(0, seriesNames.length));
  const min = Math.min(0, ...values), max = Math.max(1, ...values);
  const sums = rows.map((row) => row.values.reduce((sum, value) => sum + value, 0));
  const domainMin = stacked ? Math.min(0, ...rows.map((row) => row.values.reduce((sum, value) => sum + Math.min(0, value), 0))) : min;
  const domainMax = stacked ? Math.max(1, ...rows.map((row) => row.values.reduce((sum, value) => sum + Math.max(0, value), 0))) : max;
  const step = niceStep(domainMax - domainMin); const axisMin = Math.floor(domainMin / step) * step, axisMax = Math.ceil(domainMax / step) * step || 1;
  const rowHeight = stacked ? 34 : Math.max(36, seriesNames.length * 14 + 8);
  const height = top + rows.length * rowHeight + 35; setupSvg(width, height);
  const zeroX = left + (0 - axisMin) / (axisMax - axisMin) * plotWidth;
  if (el('showGrid').checked) drawGrid({ x: left, y: top, width: plotWidth, height: height - top - 28, min: axisMin, max: axisMax, step, baseline: 0 });
  else node('line', { x1: zeroX, y1: top, x2: zeroX, y2: height - 28, stroke: '#53625b', 'stroke-width': 1.5 });
  rows.forEach((row, rowIndex) => {
    const rowTop = top + rowIndex * rowHeight;
    chartText(row.label || `Row ${rowIndex + 1}`, left - 12, rowTop + rowHeight / 2 + 4, { fill: '#4b554f', size: 11, anchor: 'end' });
    if (stacked) {
      let positive = 0, negative = 0;
      row.values.forEach((value, i) => {
        const start = value >= 0 ? positive : negative;
        const end = start + value;
        const x1 = left + (start - axisMin) / (axisMax - axisMin) * plotWidth;
        const x2 = left + (end - axisMin) / (axisMax - axisMin) * plotWidth;
        node('rect', { x: Math.min(x1, x2), y: rowTop + 8, width: Math.max(0, Math.abs(x2 - x1)), height: 18, fill: seriesColor(i), stroke: '#ffffff', 'stroke-width': .7, rx: 1 });
        if (value >= 0) positive = end; else negative = end;
      });
      if (el('showCounts').checked) chartText(formatNumber(sums[rowIndex]), left + (positive - axisMin) / (axisMax - axisMin) * plotWidth + 7, rowTop + 21, { fill: '#858d87', size: 9, anchor: 'start' });
    } else {
      const barHeight = Math.min(10, Math.max(5, (rowHeight - 8) / seriesNames.length - 2));
      row.values.forEach((value, i) => {
        const x1 = left + (0 - axisMin) / (axisMax - axisMin) * plotWidth;
        const x2 = left + (value - axisMin) / (axisMax - axisMin) * plotWidth;
        const y = rowTop + 4 + i * ((rowHeight - 8) / seriesNames.length);
        node('rect', { x: Math.min(x1, x2), y, width: Math.max(0, Math.abs(x2 - x1)), height: barHeight, fill: seriesColor(i), rx: 1 });
      });
    }
  });
}

function drawLines(mode = 'line') {
  const scatter = mode === 'scatter', area = mode === 'area';
  const width = 1100, left = 76, right = 42, top = 24, bottom = 58;
  const plotWidth = width - left - right, plotHeight = Math.max(130, rows.length * 26);
  const height = top + plotHeight + bottom; setupSvg(width, height);
  const all = rows.flatMap((row) => row.values);
  const ymin = Math.min(0, ...all), ymax = Math.max(1, ...all), yStep = niceStep(ymax - ymin);
  const yMin = Math.floor(ymin / yStep) * yStep, yMax = Math.ceil(ymax / yStep) * yStep || 1;
  for (let value = yMin; value <= yMax + yStep / 100; value += yStep) {
    const y = top + plotHeight - (value - yMin) / (yMax - yMin || 1) * plotHeight;
    node('line', { x1: left, y1: y, x2: left + plotWidth, y2: y, stroke: el('showGrid').checked ? '#eceee8' : value === 0 ? '#53625b' : 'transparent', 'stroke-width': value === 0 ? 1.4 : 1 });
    chartText(formatNumber(value), left - 12, y + 3, { fill: '#9aa19b', size: 9, anchor: 'end', family: 'DM Mono, monospace' });
  }
  const numericX = rows.map((row, i) => Number(row.label));
  const useNumeric = scatter && numericX.every(Number.isFinite);
  const xvalues = useNumeric ? numericX : rows.map((_, i) => i + 1);
  const xmin = Math.min(...xvalues), xmax = Math.max(...xvalues, xmin + 1);
  const x = (i) => left + ((xvalues[i] - xmin) / (xmax - xmin || 1)) * plotWidth;
  const y = (value) => top + plotHeight - (value - yMin) / (yMax - yMin || 1) * plotHeight;
  rows.forEach((row, i) => {
    if (rows.length < 15 || i % Math.ceil(rows.length / 12) === 0 || i === rows.length - 1) chartText(row.label, x(i), top + plotHeight + 19, { fill: '#737d77', size: 9 });
  });
  seriesNames.forEach((name, seriesIndex) => {
    const color = seriesColor(seriesIndex);
    const points = rows.map((row, i) => ({ x: x(i), y: y(row.values[seriesIndex] ?? 0), value: row.values[seriesIndex] ?? 0, label: row.label }));
    if (area && points.length > 1) {
      const zeroY = y(0);
      const polygon = [`${points[0].x},${zeroY}`, ...points.map((point) => `${point.x},${point.y}`), `${points[points.length - 1].x},${zeroY}`].join(' ');
      node('polygon', { points: polygon, fill: color, opacity: .15 });
    }
    if (!scatter && points.length > 1) node('polyline', { points: points.map((point) => `${point.x},${point.y}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    points.forEach((point) => {
      node('circle', { cx: point.x, cy: point.y, r: scatter ? 5 : 3.5, fill: color, stroke: '#ffffff', 'stroke-width': 1.5 });
      const circle = chart.lastChild; circle.setAttribute('aria-label', `${point.label}, ${name}: ${point.value}`);
    });
  });
}

function drawDonut(pie = false) {
  const width = 1100, height = Math.max(430, 120 + rows.length * 25), cx = 550, cy = height / 2 - 10, radius = Math.min(145, height / 2 - 55), inner = pie ? 0 : radius * .55; setupSvg(width, height);
  const values = rows.map((row) => Math.max(0, row.values.reduce((sum, value) => sum + value, 0)));
  const total = values.reduce((sum, value) => sum + value, 0);
  const denominator = total || 1;
  let angle = -Math.PI / 2;
  rows.forEach((row, i) => {
    const portion = values[i] / denominator, endAngle = angle + portion * Math.PI * 2;
    const x1 = cx + radius * Math.cos(angle), y1 = cy + radius * Math.sin(angle), x2 = cx + radius * Math.cos(endAngle), y2 = cy + radius * Math.sin(endAngle);
    const ix2 = cx + inner * Math.cos(endAngle), iy2 = cy + inner * Math.sin(endAngle), ix1 = cx + inner * Math.cos(angle), iy1 = cy + inner * Math.sin(angle);
    const large = portion > .5 ? 1 : 0;
    if (portion >= .999) {
      if (pie) node('circle', { cx, cy, r: radius, fill: seriesColor(i) });
      else node('circle', { cx, cy, r: (radius + inner) / 2, fill: 'none', stroke: seriesColor(i), 'stroke-width': radius - inner });
    }
    else if (portion > 0) {
      const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;
      node('path', { d: path, fill: seriesColor(i), stroke: '#ffffff', 'stroke-width': 2 });
    }
    angle = endAngle;
  });
  if (!pie) {
    label(chart, String(total), { x: cx, y: cy + 4, fill: '#29332e', 'font-size': 25, 'font-family': 'DM Sans, sans-serif', 'font-weight': '600', 'text-anchor': 'middle' });
    chartText('TOTAL', cx, cy + 22, { fill: '#89918b', size: 8 });
  }
}

function renderLegend() {
  const legend = el('legend'); legend.replaceChildren();
  const categoryLegend = chartType() === 'pie' || chartType() === 'donut';
  const groups = isLikert() ? [
    { key: 'agreement', name: 'Agreement scale', colors: agreement, values: seriesNames },
    { key: 'bipolar', name: 'Bipolar scale', colors: bipolar, values: seriesNames },
  ].filter(({ key }) => rows.some((row) => row.group === key)) : [{ key: 'series', name: '', colors: categoryLegend ? rows.map((_, i) => seriesColor(i)) : seriesNames.map((_, i) => seriesColor(i)), values: categoryLegend ? rows.map((row) => `${row.label}${el('showCounts').checked ? ` (${formatNumber(row.values.reduce((sum, value) => sum + Math.max(0, value), 0))})` : ''}`) : seriesNames }];
  groups.forEach(({ name, colors, values }, groupIndex) => {
    const group = document.createElement('div'); group.className = 'legend-group';
    if (name) { const title = document.createElement('span'); title.className = 'legend-title'; title.textContent = `${name}:`; group.append(title); }
    colors.forEach((color, i) => {
      if (isLikert()) {
        const chip = document.createElement('span'); chip.className = 'legend-chip'; chip.style.backgroundColor = color; chip.textContent = values[i] || String(i + 1); group.append(chip);
      } else {
        const item = document.createElement('span'); item.className = 'legend-item';
        const swatch = document.createElement('i'); swatch.style.backgroundColor = color;
        const text = document.createElement('span'); text.textContent = values[i] || `Series ${i + 1}`;
        item.append(swatch, text); group.append(item);
      }
    });
    legend.append(group);
  });
}

function render(rebuildTable = true) {
  el('chartTypeSetting').value = chartType();
  chart.setAttribute('aria-label', `${el('chartType').selectedOptions[0]?.textContent || 'Data'} chart`);
  const showTitle = el('showTitle').checked, showSubtitle = el('showSubtitle').checked;
  el('titleInput').disabled = !showTitle; el('subtitleInput').disabled = !showSubtitle;
  el('previewTitle').hidden = !showTitle; el('previewSubtitle').hidden = !showSubtitle;
  el('previewTitle').textContent = el('titleInput').value.trim() || 'Untitled chart';
  el('previewSubtitle').textContent = el('subtitleInput').value.trim();
  el('scaleSettings').hidden = !isLikert();
  el('scaleNote').hidden = !isLikert();
  el('midpointNote').hidden = !isLikert(); el('paletteKey').hidden = !isLikert();
  el('addSeries').hidden = isLikert();
  el('removeSeries').hidden = isLikert(); el('removeSeries').disabled = seriesNames.length <= 1;
  el('chartHint').textContent = ({ likert: `Responses from ${minValue()} to ${maxValue()} split around the midpoint.`, bar: 'Compare multiple series across categories.', stacked: 'See how each category total is composed.', column: 'Compare series with vertical bars.', 'stacked-column': 'Compare category totals and their parts.', line: 'Follow each series across your ordered rows.', area: 'Compare trends and volume over ordered rows.', scatter: 'Compare numeric x-values with each series.', donut: 'Show each category’s share of the total.', pie: 'Show each category’s share of the total.' })[chartType()];
  if (rebuildTable) renderTable();
  if (isLikert()) drawLikert();
  else if (chartType() === 'bar') drawBars(false);
  else if (chartType() === 'stacked') drawBars(true);
  else if (chartType() === 'column') drawBars(false, true);
  else if (chartType() === 'stacked-column') drawBars(true, true);
  else if (chartType() === 'line' || chartType() === 'area' || chartType() === 'scatter') drawLines(chartType());
  else drawDonut(chartType() === 'pie');
  renderLegend();
  const responseTotal = rows.reduce((sum, row) => sum + row.values.reduce((rowSum, value) => rowSum + value, 0), 0);
  el('responseTotal').textContent = `${formatNumber(responseTotal)} total`;
}

function download(name, type, contents) {
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([contents], { type })); link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
function svgLabel(parent, text, x, y, attrs = {}) { return label(parent, text, { x, y, ...attrs }); }
function makeExportSvg() {
  const plot = chart.cloneNode(true), plotHeight = Number(chart.viewBox.baseVal.height);
  const showTitle = el('showTitle').checked, showSubtitle = el('showSubtitle').checked;
  const plotTop = showTitle ? (showSubtitle ? 62 : 43) : (showSubtitle ? 43 : 16);
  const legendTop = plotTop + plotHeight + 74, groupGap = 58, chipWidth = 30, chipHeight = 23;
  const categoryLegend = chartType() === 'pie' || chartType() === 'donut';
  const legendGroups = isLikert() ? [
    { name: 'Agreement', colors: agreement, labels: seriesNames, visible: rows.some((row) => row.group === 'agreement') },
    { name: 'Bipolar', colors: bipolar, labels: seriesNames, visible: rows.some((row) => row.group === 'bipolar') },
  ].filter((group) => group.visible) : [{ name: '', colors: categoryLegend ? rows.map((_, i) => seriesColor(i)) : seriesNames.map((_, i) => seriesColor(i)), labels: categoryLegend ? rows.map((row) => `${row.label}${el('showCounts').checked ? ` (${formatNumber(row.values.reduce((sum, value) => sum + Math.max(0, value), 0))})` : ''}`) : seriesNames, visible: true }];
  const groupWidths = legendGroups.map((group) => group.name ? 69 + group.colors.length * chipWidth : group.labels.reduce((sum, name) => sum + Math.max(42, name.length * 6 + 18), 0));
  const totalLegendWidth = groupWidths.reduce((sum, groupWidth) => sum + groupWidth, 0) + Math.max(0, legendGroups.length - 1) * groupGap;
  const exportWidth = Math.max(1100, totalLegendWidth + 80);
  const exportHeight = legendTop + Math.ceil(legendGroups.length / 2) * (chipHeight + 20) + 24;
  const root = document.createElementNS(svgNS, 'svg'); root.setAttribute('xmlns', svgNS); root.setAttribute('viewBox', `0 0 ${exportWidth} ${exportHeight}`); root.setAttribute('width', exportWidth); root.setAttribute('height', exportHeight);
  const bg = document.createElementNS(svgNS, 'rect'); bg.setAttribute('width', exportWidth); bg.setAttribute('height', exportHeight); bg.setAttribute('fill', '#ffffff'); root.append(bg);
  if (showTitle) svgLabel(root, el('titleInput').value.trim() || 'Untitled chart', 24, 27, { fill: '#252d2b', 'font-size': 18, 'font-family': 'DM Sans, sans-serif', 'font-weight': 600 });
  if (showSubtitle) svgLabel(root, el('subtitleInput').value, 24, showTitle ? 46 : 27, { fill: '#89908a', 'font-size': 11, 'font-family': 'DM Sans, sans-serif' });
  const plotGroup = document.createElementNS(svgNS, 'g'); plotGroup.setAttribute('transform', `translate(0 ${plotTop})`); plotGroup.append(plot); root.append(plotGroup);
  const startX = (exportWidth - totalLegendWidth) / 2;
  legendGroups.forEach((group, groupIndex) => {
    const row = Math.floor(groupIndex / 2), col = groupIndex % 2;
    let x = startX + groupWidths.slice(0, groupIndex).reduce((sum, groupWidth) => sum + groupWidth + groupGap, 0);
    const y = legendTop + row * (chipHeight + 20);
    group.colors.forEach((color, i) => {
      if (group.name) {
        if (i === 0) { svgLabel(root, `${group.name}:`, x, y + 15, { fill: '#69736e', 'font-size': 11, 'font-family': 'DM Sans, sans-serif' }); x += 69; }
        const swatch = document.createElementNS(svgNS, 'rect'); swatch.setAttribute('x', x); swatch.setAttribute('y', y); swatch.setAttribute('width', chipWidth - 3); swatch.setAttribute('height', chipHeight); swatch.setAttribute('rx', 3); swatch.setAttribute('fill', color); root.append(swatch);
        svgLabel(root, group.labels[i] || String(i + 1), x + (chipWidth - 3) / 2, y + 15, { fill: '#ffffff', 'font-size': 10, 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle' }); x += chipWidth;
      } else {
        const text = group.labels[i] || `Series ${i + 1}`, itemWidth = Math.max(42, text.length * 6 + 18);
        const swatch = document.createElementNS(svgNS, 'rect'); swatch.setAttribute('x', x); swatch.setAttribute('y', y + 7); swatch.setAttribute('width', '9'); swatch.setAttribute('height', '9'); swatch.setAttribute('rx', '2'); swatch.setAttribute('fill', color); root.append(swatch);
        svgLabel(root, text, x + 14, y + 15, { fill: '#69736e', 'font-size': 10, 'font-family': 'DM Sans, sans-serif', 'text-anchor': 'start' }); x += itemWidth;
      }
    });
  });
  return root;
}

function changeChartType(value) {
  const previousType = chartType();
  el('chartType').value = value; el('chartTypeSetting').value = value;
  if (previousType === 'likert' && value !== 'likert' && seriesNames.every((name, i) => name === String(minValue() + i))) {
    seriesNames = seriesNames.map((_, i) => `Series ${String.fromCharCode(65 + i)}`);
  } else if (value === 'likert') {
    const numericPoints = seriesNames.every((name) => /^-?\d+$/.test(name)) && seriesNames.every((name, i) => Number(name) === Number(seriesNames[0]) + i);
    if (numericPoints) { el('scaleMin').value = Number(seriesNames[0]); el('scaleMax').value = Number(seriesNames[seriesNames.length - 1]); }
    const count = scaleCount();
    rows = rows.map((row) => ({ ...row, values: Array.from({ length: count }, (_, i) => row.values[i] ?? 0) }));
    seriesNames = Array.from({ length: count }, (_, i) => String(minValue() + i));
  }
  render();
}

function splitDelimitedLine(line, delimiter) {
  const cells = []; let cell = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { cells.push(cell.trim()); cell = ''; }
    else cell += char;
  }
  cells.push(cell.trim()); return cells;
}
function importTable() {
  const raw = el('pasteInput').value.trim();
  if (!raw) { el('importStatus').textContent = 'Paste a table first.'; return; }
  const delimiter = raw.includes('\t') ? '\t' : ',';
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  const matrix = lines.map((line) => splitDelimitedLine(line, delimiter));
  const headers = matrix[0];
  if (headers.length < 2 || matrix.length < 2) { el('importStatus').textContent = 'Include a header row, one category column, and at least one data row.'; return; }
  const importedRows = [];
  for (const [index, cells] of matrix.slice(1).entries()) {
    if (!cells[0]) { el('importStatus').textContent = `Row ${index + 2} needs a category label.`; return; }
    const values = headers.slice(1).map((_, i) => {
      const value = cells[i + 1] ?? '';
      return value.trim() === '' ? 0 : Number(value);
    });
    if (values.some((value) => !Number.isFinite(value))) { el('importStatus').textContent = `Row ${index + 2} contains a non-numeric value.`; return; }
    importedRows.push({ label: cells[0], group: 'agreement', values });
  }
  const importedNames = headers.slice(1).map((name, i) => name || `Series ${i + 1}`);
  if (isLikert()) {
    const numericScale = importedNames.every((name) => /^-?\d+$/.test(name)) && importedNames.every((name, i) => Number(name) === Number(importedNames[0]) + i);
    const min = numericScale ? Number(importedNames[0]) : 1;
    const max = min + importedNames.length - 1;
    el('scaleMin').value = min; el('scaleMax').value = max;
    seriesNames = Array.from({ length: importedNames.length }, (_, i) => String(min + i));
  } else seriesNames = importedNames;
  rows = importedRows; render();
  el('importStatus').textContent = `Imported ${rows.length} rows and ${seriesNames.length} series.`;
}

el('chartType').addEventListener('change', () => changeChartType(el('chartType').value));
el('chartTypeSetting').addEventListener('change', () => changeChartType(el('chartTypeSetting').value));
el('scaleMin').addEventListener('change', () => { resizeLikertScale(readScaleInput('scaleMin', 1), readScaleInput('scaleMax', 7)); render(); });
el('scaleMax').addEventListener('change', () => { resizeLikertScale(readScaleInput('scaleMin', 1), readScaleInput('scaleMax', 7)); render(); });
el('lowLabel').addEventListener('input', () => render(false)); el('highLabel').addEventListener('input', () => render(false));
el('titleInput').addEventListener('input', () => render(false)); el('subtitleInput').addEventListener('input', () => render(false));
el('showTitle').addEventListener('change', () => render(false)); el('showSubtitle').addEventListener('change', () => render(false));
el('showCounts').addEventListener('change', () => render(false)); el('showGrid').addEventListener('change', () => render(false));
el('addQuestion').addEventListener('click', () => { rows.push({ label: `New row ${rows.length + 1}`, group: 'agreement', values: Array(seriesNames.length).fill(0) }); render(); rowsHost.querySelector('tr:last-child .question-input')?.focus(); });
el('addSeries').addEventListener('click', () => { seriesNames.push(seriesName(seriesNames.length)); rows = rows.map((row) => ({ ...row, values: [...row.values, 0] })); render(); });
el('removeSeries').addEventListener('click', () => { if (seriesNames.length <= 1) return; seriesNames.pop(); rows = rows.map((row) => ({ ...row, values: row.values.slice(0, seriesNames.length) })); render(); });
el('importData').addEventListener('click', importTable);
el('resetSample').addEventListener('click', () => {
  rows = structuredClone(sample); seriesNames = sample[0].values.map((_, i) => String(i + 1));
  el('chartType').value = 'likert'; el('chartTypeSetting').value = 'likert'; el('scaleMin').value = 1; el('scaleMax').value = 7;
  el('titleInput').value = 'A little more room to create'; el('subtitleInput').value = 'Workshop feedback · 24 participants';
  el('showTitle').checked = false; el('showSubtitle').checked = false; el('showCounts').checked = true; el('showGrid').checked = true;
  render();
});
el('exportSvg').addEventListener('click', () => download('chart.svg', 'image/svg+xml;charset=utf-8', new XMLSerializer().serializeToString(makeExportSvg())));
el('downloadPng').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(makeExportSvg())], { type: 'image/svg+xml;charset=utf-8' }));
  const image = new Image(); image.onload = () => {
    const canvas = document.createElement('canvas'); canvas.width = 2200; canvas.height = Math.round(2200 * image.height / image.width);
    const context = canvas.getContext('2d');
    if (context) { context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); canvas.toBlob((blob) => { if (blob) download('chart.png', 'image/png', blob); }); }
    URL.revokeObjectURL(url);
  };
  image.src = url;
});

render();
