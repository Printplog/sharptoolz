const NS = 'http://www.w3.org/2000/svg';
const GENERATED = 'data-st-mask-generated';
const HIDDEN = 'data-st-mask-source-style';
const namespaces = new WeakMap<Element, number>();
let nextNamespace = 0;

/** Invert SVG affine transforms without depending on a mounted browser DOM. */
function inverseTransform(value: string): string {
  const operations = [...value.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g)];
  if (value.replace(/([a-zA-Z]+)\s*\(([^)]*)\)/g, '').replace(/[\s,]/g, '')) {
    throw new Error('Text masks require SVG transform attributes.');
  }
  return operations.reverse().map(([, name, raw]) => {
    const n = raw.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (n.some(v => !Number.isFinite(v))) throw new Error('Invalid mask transform.');
    if (name === 'translate' && (n.length === 1 || n.length === 2)) return `translate(${-n[0]} ${-(n[1] ?? 0)})`;
    if (name === 'scale' && (n.length === 1 || n.length === 2) && n[0] && (n[1] ?? n[0])) return `scale(${1 / n[0]} ${1 / (n[1] ?? n[0])})`;
    if (name === 'rotate' && (n.length === 1 || n.length === 3)) return `rotate(${-n[0]}${n.length === 3 ? ` ${n[1]} ${n[2]}` : ''})`;
    if ((name === 'skewX' || name === 'skewY') && n.length === 1) return `${name}(${-n[0]})`;
    if (name === 'matrix' && n.length === 6) {
      const [a,b,c,d,e,f] = n, det = a*d-b*c;
      if (det) return `matrix(${[d/det,-b/det,-c/det,a/det,(c*f-d*e)/det,(b*e-a*f)/det].join(' ')})`;
    }
    throw new Error('Unsupported or singular mask transform.');
  }).join(' ');
}

export function clearTextMasks(root: Element): void {
  root.querySelectorAll(`[${HIDDEN}]`).forEach(el => {
    const style = JSON.parse(el.getAttribute(HIDDEN)!) as string | null;
    if (style === null) el.removeAttribute('style'); else el.setAttribute('style', style);
    el.removeAttribute(HIDDEN);
  });
  root.querySelectorAll(`[${GENERATED}="wrapper"]`).forEach(el => el.replaceWith(...Array.from(el.childNodes)));
  root.querySelectorAll(`[${GENERATED}="definition"]`).forEach(el => el.remove());
}

/** Rebuild disposable mask geometry from the current image/text layers. */
export function applyTextMasks(root: Element): void {
  clearTextMasks(root);
  const doc = root.ownerDocument;
  if (!namespaces.has(root)) namespaces.set(root, ++nextNamespace);
  const layers = Array.from(root.querySelectorAll('[id]')).filter(el => !el.closest('defs,mask,clipPath'));
  const sources = new Set<Element>();
  for (const image of layers) {
    const part = (image.id || '').split(/\.(?![^(]*\))/).find(p => p.startsWith('mask_'));
    if (!part) continue;
    if (!['image', 'text', 'rect', 'circle', 'ellipse', 'path', 'g', 'use'].includes(image.localName)) throw new Error('Text masks can only be applied to drawable layers.');
    const sourceId = part.slice(5);
    const matches = layers.filter(el => el.id.split('.')[0] === sourceId);
    if (matches.length !== 1 || matches[0].localName !== 'text') throw new Error(`Mask source "${sourceId}" must identify one text layer.`);
    const source = matches[0];
    const ancestors: Element[] = [];
    for (let p = image.parentElement; p && p !== root; p = p.parentElement) ancestors.push(p);
    const inverse = ancestors.map(p => inverseTransform(p.getAttribute('transform') || '')).join(' ');
    let clone = source.cloneNode(true) as Element;
    // Preserve inherited font, opacity and transform from the source's groups.
    for (let p = source.parentElement; p && p !== root; p = p.parentElement) {
      if (p.localName !== 'g') throw new Error('Text mask sources must be in SVG groups, not nested viewports.');
      const group = p.cloneNode(false) as Element;
      group.appendChild(clone); clone = group;
    }
    [clone, ...Array.from(clone.querySelectorAll('*'))].forEach(el => {
      el.removeAttribute('id'); el.removeAttribute('data-internal-id'); el.removeAttribute('data-name');
    });
    let id = `st-text-mask-${namespaces.get(root)}-${layers.indexOf(image)}`;
    while (Array.from(root.querySelectorAll('[id]')).some(el => el.id === id)) id += '-';
    const mask = doc.createElementNS(NS, 'mask');
    mask.setAttribute('id', id);
    mask.setAttribute(GENERATED, 'definition');
    mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
    mask.setAttribute('style', 'mask-type:alpha');
    const projection = doc.createElementNS(NS, 'g');
    projection.setAttribute('transform', inverse);
    projection.appendChild(clone); mask.appendChild(projection);
    root.appendChild(mask);
    const wrapper = doc.createElementNS(NS, 'g');
    wrapper.setAttribute(GENERATED, 'wrapper');
    wrapper.setAttribute('mask', `url(#${id})`);
    image.replaceWith(wrapper); wrapper.appendChild(image);
    sources.add(source);
  }
  // Hide after cloning so one source can mask several images.
  sources.forEach(source => {
    source.setAttribute(HIDDEN, JSON.stringify(source.getAttribute('style')));
    source.setAttribute('style', `${source.getAttribute('style') || ''};display:none!important`);
  });
}
