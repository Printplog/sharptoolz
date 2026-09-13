import type { SvgElement } from '@/lib/utils/parseSvgElements';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Props {
  element: SvgElement;
  elements: SvgElement[];
  onChange: (updates: Partial<SvgElement>) => void;
}

export function TextMaskSettings({ element, elements, onChange }: Props) {
  if (!['image', 'text', 'rect', 'circle', 'ellipse', 'path', 'g', 'use'].includes(element.tag)) return null;
  const id = element.id || element.attributes.id || '';
  const parts = id.split(/\.(?![^(]*\))/);
  const source = parts.find(part => part.startsWith('mask_'))?.slice(5) || '';
  const sources = [...new Set(elements.filter(el => el.tag === 'text').map(el => (el.id || '').split('.')[0]).filter(Boolean))];
  return (
    <div className="space-y-2">
      <Label htmlFor="text-mask-source">Text mask</Label>
      <Select
        value={source || "__none__"}
        onValueChange={value => {
          const selected = value === "__none__" ? "" : value;
          const next = parts.filter(part => !part.startsWith('mask_'));
          if (selected) {
            if (next.length === 1) next.push('fixed');
            next.splice(2, 0, `mask_${selected}`);
          }
          const newId = next.join('.');
          onChange({ id: newId, attributes: { ...element.attributes, id: newId } });
        }}
      >
        <SelectTrigger id="text-mask-source" className="w-full min-w-0">
          <SelectValue placeholder="Choose text layer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">None — show full image</SelectItem>
          {source && !sources.includes(source) && <SelectItem value={source}>Missing text: {source}</SelectItem>}
          {sources.map(name => <SelectItem key={name} value={name}>{name.replace(/_/g, ' ')}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="text-xs text-white/50">This layer appears inside the letters. Baked (.fixed) by default — switch the type to .upload if the user should provide the picture. Choose None to remove the mask.</p>
    </div>
  );
}
