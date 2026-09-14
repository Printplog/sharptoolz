import { describe, expect, it } from 'vitest';
import svg from './__fixtures__/text_mask.svg?raw';
import { applyTextMasks, clearTextMasks } from './svgTextMasks';
import parseSvgToFormFields from './parseSvgToFormFields';
import updateSvgFromFormData from './updateSvgFromFormData';
import { generateAutoFields } from './fieldGenerator';
import { validateSvgId } from './svgIdValidator';
import { getSuggestions } from '@/components/Admin/ToolBuilder/SvgEditor/idExtensions';

const parse = (value = svg) => new DOMParser().parseFromString(value, 'image/svg+xml').documentElement;

describe('SVG text masks', () => {
  it('recognizes the extension in parsing, validation and autocomplete', () => {
    expect(parseSvgToFormFields(svg).find(f => f.id === 'Photo')?.maskSource).toBe('Title');
    for (const id of ['Photo.upload.mask_Title', 'Photo.upload.mask_Title.editable']) expect(validateSvgId(id).valid).toBe(true);
    expect(validateSvgId('Photo.text.mask_Title').valid).toBe(false);
    expect(validateSvgId('Photo.upload.mask_').valid).toBe(false);
    expect(getSuggestions('Photo.upload.').some(s => s.key === 'mask')).toBe(true);
  });
  it('uses alpha geometry and preserves group positioning and original layers', () => {
    const root = parse();
    const source = root.querySelector('text')!;
    const image = root.querySelector('image')!;
    applyTextMasks(root);
    expect(source.getAttribute('style')).toContain('display:none');
    expect(image.parentElement?.getAttribute('mask')).toMatch(/^url\(#/);
    const mask = root.querySelector('mask')!;
    expect(mask.getAttribute('style')).toBe('mask-type:alpha');
    expect(mask.querySelector('g')?.getAttribute('transform')).toContain('translate(-40 0)');
    expect(mask.querySelector('text')?.textContent).toBe('LOVE');
    expect(mask.querySelector('text')?.hasAttribute('id')).toBe(false);
    applyTextMasks(root);
    expect(root.querySelectorAll('mask')).toHaveLength(1);
    image.id = 'Photo.upload';
    applyTextMasks(root);
    expect(root.querySelectorAll('mask')).toHaveLength(0);
    expect(source.hasAttribute('style')).toBe(false);
    expect(root.querySelectorAll('image')).toHaveLength(1);
  });
  it.each(['HELLO', ''])('updates mask geometry when source becomes %s', text => {
    const fields = parseSvgToFormFields(svg).map(f => f.id === 'Title' ? {...f, currentValue:text, touched:true} : f);
    const root = parse(updateSvgFromFormData(svg, fields));
    expect(root.querySelector('mask text')?.textContent).toBe(text);
    expect(root.querySelectorAll('image')).toHaveLength(1);
  });
  it('shares a source without cloning its hidden state', () => {
    const root = parse();
    const extra = root.querySelector('image')!.cloneNode(true) as Element;
    extra.id = 'Second.upload.mask_Title'; root.appendChild(extra);
    applyTextMasks(root);
    expect(root.querySelectorAll('mask')).toHaveLength(2);
    root.querySelectorAll('mask text').forEach(t => expect(t.getAttribute('style') || '').not.toContain('display:none'));
    clearTextMasks(root);
    expect(root.querySelectorAll('[data-st-mask-source-style]')).toHaveLength(0);
  });
  it('uses the generated text value before building the mask', () => {
    const generatedSvg = svg.replace('Title.text', 'Title.gen_AUTO:(dep_Message[w1])').replace('</svg>', '<text id="Message.text">LOVE YOU</text></svg>');
    const fields = generateAutoFields(parseSvgToFormFields(generatedSvg));
    const root = parse(updateSvgFromFormData(generatedSvg, fields));
    expect(root.querySelector('mask text')?.textContent).toBe('LOVE');
  });
  it('rejects missing and non-text sources', () => {
    expect(() => applyTextMasks(parse(svg.replace('mask_Title','mask_Missing')))).toThrow('one text layer');
    expect(() => applyTextMasks(parse(svg.replace('mask_Title','mask_Photo')))).toThrow('one text layer');
  });
});
