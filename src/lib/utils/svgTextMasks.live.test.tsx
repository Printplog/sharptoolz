import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {createRef} from 'react';
import {expect, it, vi} from 'vitest';
import fixture from './__fixtures__/text_mask.svg?raw';
import parseSvgElements from './parseSvgElements';
import {useSvgLiveUpdate} from '@/components/Admin/ToolBuilder/SvgEditor/hooks/useSvgLiveUpdate';

it('reapplies mask attributes after React replaces the live SVG DOM', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const documentSvg = new DOMParser().parseFromString(fixture.replace('.mask_Title',''), 'image/svg+xml');
  documentSvg.querySelectorAll('[id]').forEach((el,i)=>el.setAttribute('data-internal-id',`layer-${i}`));
  const raw = new XMLSerializer().serializeToString(documentSvg);
  const initial = parseSvgElements(raw);
  const ref = createRef<HTMLDivElement>();
  function Canvas({masked, text}: {masked:boolean; text:string}) {
    const elements = initial.map(el => el.tag === 'image'
      ? {...el,id:`Photo.upload${masked?'.mask_Title':''}`,attributes:{...el.attributes,id:`Photo.upload${masked?'.mask_Title':''}`}}
      : el.tag === 'text' ? {...el,innerText:text} : el);
    useSvgLiveUpdate(ref as React.RefObject<HTMLDivElement>,elements);
    return <div ref={ref} dangerouslySetInnerHTML={{__html:raw}}/>;
  }
  const container=document.createElement('div');document.body.append(container);
  const root=createRoot(container);
  try {
    await act(async()=>root.render(<Canvas masked text="LOVE"/>));
    expect(container.querySelector('mask text')?.textContent).toBe('LOVE');
    await act(async()=>root.render(<Canvas masked text="HELLO"/>));
    expect(container.querySelector('mask text')?.textContent).toBe('HELLO');
    expect(container.querySelectorAll('mask')).toHaveLength(1);
    await act(async()=>root.render(<Canvas masked={false} text="HELLO"/>));
    expect(container.querySelectorAll('mask')).toHaveLength(0);
    expect(container.querySelector('text')?.style.display).not.toBe('none');
  } finally {
    await act(async()=>root.unmount());container.remove();vi.unstubAllGlobals();
  }
});
