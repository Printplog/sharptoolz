import { describe, it, expect } from 'vitest';
import { applySvgPatches } from '@/lib/utils/applySvgPatches';
import type { SvgPatch } from '@/types';

describe('applySvgPatches', () => {
    const sampleSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
            <rect id="rect1" x="10" y="10" width="80" height="80" fill="red" />
            <text id="text1" x="20" y="50">Original Text</text>
            <circle data-internal-id="circle1" cx="50" cy="50" r="40" fill="blue" />
        </svg>
    `;

    it('should return original content if svgContent is empty', () => {
        expect(applySvgPatches('', [])).toBe('');
    });

    it('should return original content if no svg element is found', () => {
        const noSvg = '<div>Not an SVG</div>';
        expect(applySvgPatches(noSvg, [])).toBe(noSvg);
    });

    it('should apply attribute patches correctly', () => {
        const patches: SvgPatch[] = [
            { id: 'rect1', attribute: 'fill', value: 'green' },
            { id: 'rect1', attribute: 'width', value: '90' }
        ];

        const result = applySvgPatches(sampleSvg, patches);
        expect(result).toContain('fill="green"');
        expect(result).toContain('width="90"');
    });

    it('should apply text patches using innerText attribute', () => {
        const patches: SvgPatch[] = [
            { id: 'text1', attribute: 'innerText', value: 'Updated Text' }
        ];

        const result = applySvgPatches(sampleSvg, patches);
        expect(result).toContain('Updated Text');
        expect(result).not.toContain('Original Text');
    });

    it('should find elements by data-internal-id', () => {
        const patches: SvgPatch[] = [
            { id: 'circle1', attribute: 'fill', value: 'yellow' }
        ];

        const result = applySvgPatches(sampleSvg, patches);
        expect(result).toContain('fill="yellow"');
    });

    it('should add data-internal-id if not present', () => {
        const result = applySvgPatches(sampleSvg, []);
        // The rect1 has an id, so it should get a data-internal-id="rect1"
        expect(result).toContain('data-internal-id="rect1"');
    });

    it('should handle complex patches with multiple elements', () => {
        const patches: SvgPatch[] = [
            { id: 'rect1', attribute: 'fill', value: 'purple' },
            { id: 'text1', attribute: 'innerText', value: 'New Message' },
            { id: 'circle1', attribute: 'r', value: '20' }
        ];

        const result = applySvgPatches(sampleSvg, patches);
        expect(result).toContain('fill="purple"');
        expect(result).toContain('New Message');
        expect(result).toContain('r="20"');
    });

    it('should not corrupt the SVG structure', () => {
        const result = applySvgPatches(sampleSvg, []);
        expect(result).toContain('<svg');
        expect(result).toContain('</svg>');
        expect(result).toContain('<rect');
        expect(result).toContain('<text');
        expect(result).toContain('<circle');
    });
});
