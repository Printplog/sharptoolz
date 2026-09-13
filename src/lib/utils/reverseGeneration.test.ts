import svg from './__fixtures__/reverse_text.svg?raw';
import { describe, expect, it } from 'vitest';
import { generateValue, generateAutoFields } from './fieldGenerator';
import parseSvgToFormFields from './parseSvgToFormFields';
import updateSvgFromFormData from './updateSvgFromFormData';


describe('reverse generation', () => {
  it.each([
    ['LOVE', 'EVOL'], ['Hello world!', '!dlrow olleH'], ['', ''],
    [0, '0'], [false, 'eslaf'], ['A😀B', 'B😀A'],
  ])('reverses %s', (source, expected) => {
    expect(generateValue('AUTO:(dep_Message[reverse])', { Message: source })).toBe(expected);
  });
  it('supports extraction, missing sources, literals and limits', () => {
    expect(generateValue('(dep_Missing[reverse])', {})).toBe('');
    expect(generateValue('(dep_Message[w1][reverse])', { Message: 'LOVE YOU' })).toBe('EVOL');
    expect(generateValue('(dep_Message[ch1-3][reverse])', { Message: 'LOVE' })).toBe('VOL');
    expect(generateValue('X_(dep_Message[reverse])', { Message: 'LOVE' }, 4)).toBe('X EV');
  });
  it.each(['LOVE', 'HELLO WORLD', '', 'A😀B'])('parses and updates a real SVG with %s', source => {
    const fields = parseSvgToFormFields(svg).map(field => field.id === 'Message' ? { ...field, currentValue: source, touched: true } : field);
    const generated = generateAutoFields(fields);
    expect(generated.find(field => field.id === 'Chain')?.currentValue).toBe(Array.from(source).reverse().join(''));
    const output = updateSvgFromFormData(svg, generated);
    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(doc.getElementById('Reversed.gen_AUTO:(dep_Message[reverse])')?.textContent).toBe(Array.from(source).reverse().join(''));
    expect(doc.getElementById('Message.text')?.textContent).toBe(source);
    expect(generateAutoFields(generated, true)).toBe(generated);
  });
  it('rejects circular generation references', () => {
    const fields = parseSvgToFormFields('<svg><text id="A.gen_AUTO:(dep_B[reverse])"/><text id="B.gen_AUTO:(dep_A[reverse])"/></svg>');
    expect(() => generateAutoFields(fields)).toThrow('Circular generation reference');
  });
});
