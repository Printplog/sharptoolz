import {act, Profiler, useState, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import ElementEditor from '@/components/Admin/ToolBuilder/SvgEditor/ElementEditor';
import SvgEditor from '@/components/Admin/ToolBuilder/SvgEditor';
import {useSvgLiveUpdate} from '@/components/Admin/ToolBuilder/SvgEditor/hooks/useSvgLiveUpdate';
import {useSvgStore} from '@/store/useSvgStore';
import type {SvgElement} from './parseSvgElements';

class PendingReader {
  static instances: PendingReader[] = [];
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  abort = vi.fn();
  readAsDataURL = vi.fn();
  constructor() { PendingReader.instances.push(this); }
  finish(value: string) { this.result = value; this.onload?.(); }
}
const photo: SvgElement = {id:'Photo.upload.mask_Title', internalId:'Photo', tag:'image', attributes:{id:'Photo.upload.mask_Title',href:'old.png'}};
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let client: QueryClient;
const revoke = vi.fn();
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('FileReader', PendingReader);
  PendingReader.instances = [];
  vi.stubGlobal('URL', class extends URL {
    static createObjectURL = vi.fn(() => 'blob:replacement');
    static revokeObjectURL = revoke;
  });
  revoke.mockClear();
  container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
  client = new QueryClient({defaultOptions:{queries:{enabled:false}}});
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); client.clear();
  useSvgStore.getState().reset(); vi.unstubAllGlobals();
});
function choose() {
  const input = container.querySelector('input[type=file]') as HTMLInputElement;
  Object.defineProperty(input, 'files', {configurable:true, value:[new File(['image'], 'new.png', {type:'image/png'})]});
  input.dispatchEvent(new Event('change', {bubbles:true}));
  return PendingReader.instances[PendingReader.instances.length - 1];
}
const textCheck = (el: SvgElement) => el.tag === 'text';
const imageCheck = (el: SvgElement) => el.tag === 'image';
const noUpdate = vi.fn();
function inspector(element: SvgElement) {
  return <QueryClientProvider client={client}><ElementEditor element={element} index={0} onUpdate={noUpdate} isTextElement={textCheck} isImageElement={imageCheck}/></QueryClientProvider>;
}
it('shows pending feedback and ignores reads superseded by another image', async () => {
  await act(async () => root.render(inspector(photo)));
  let first!: PendingReader; let second!: PendingReader;
  await act(async () => {first = choose();});
  expect(container.querySelector('[role=status]')?.textContent).toBe('Loading image…');
  await act(async () => {second = choose();});
  expect(first.abort).toHaveBeenCalled();
  await act(async () => first.finish('data:image/png;base64,OLD'));
  expect(container.querySelector('img')?.getAttribute('src')).toBe('old.png');
  await act(async () => second.finish('data:image/png;base64,NEW'));
  expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:replacement');
  expect(container.querySelector('[role=status]')).toBeNull();
});
it('does not apply an upload to a different layer after switching selection', async () => {
  await act(async () => root.render(inspector(photo)));
  let reader!: PendingReader;
  await act(async () => {reader = choose();});
  await act(async () => root.render(inspector({...photo,internalId:'Other',attributes:{href:'other.png'}})));
  expect(reader.abort).toHaveBeenCalled();
  await act(async () => reader.finish('data:image/png;base64,OLD'));
  expect(container.querySelector('img')?.getAttribute('src')).toBe('other.png');
});
it('commits embedded image data and releases the temporary preview', async () => {
  let committed: SvgElement | undefined;
  function Editor() {
    const [element,setElement] = useState(photo);
    return <ElementEditor element={element} index={0} onUpdate={(_,updates)=>{committed={...element,...updates};setElement(committed);}} isTextElement={textCheck} isImageElement={imageCheck}/>;
  }
  await act(async () => root.render(<QueryClientProvider client={client}><Editor/></QueryClientProvider>));
  await act(async () => choose().finish('data:image/png;base64,NEW'));
  const apply = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === 'Apply')!;
  await act(async () => apply.click());
  expect(committed?.attributes.href).toBe('data:image/png;base64,NEW');
  expect(committed?.id).toBe('Photo.upload.mask_Title');
  expect(revoke).toHaveBeenCalledWith('blob:replacement');
});
it('settles when optional editor metadata is missing instead of continuously rendering', async () => {
  let renders = 0;
  await act(async () => root.render(<QueryClientProvider client={client}><Profiler id="editor" onRender={()=>{
    if (++renders > 30) throw new Error('Editor render loop');
  }}><SvgEditor svgRaw=""/></Profiler></QueryClientProvider>));
  expect(renders).toBeLessThan(10);
});

it('replaces the displayed image immediately and keeps its link valid after serialization', async () => {
  const raw = '<svg xmlns="http://www.w3.org/2000/svg"><image data-internal-id="Photo" id="Photo.upload" href="old.png"/></svg>';
  function Canvas({href}: {href:string}) {
    const ref = useRef<HTMLDivElement>(null);
    const layer = {...photo,id:'Photo.upload',attributes:{href,'xlink:href':href}};
    useSvgLiveUpdate(ref as React.RefObject<HTMLDivElement>, [layer], undefined, raw);
    return <div ref={ref}/>;
  }
  await act(async () => root.render(<Canvas href="old.png"/>));
  await act(async () => root.render(<Canvas href="new.png"/>));
  expect(container.querySelector('image')?.getAttribute('href')).toBe('new.png');
  await act(async () => root.render(<Canvas href=""/>));
  expect(container.querySelector('image')?.hasAttribute('href')).toBe(false);
  expect(container.querySelector('image')?.getAttributeNS('http://www.w3.org/1999/xlink','href')).toBeNull();
  useSvgStore.getState().setInitialSvg(raw);
  const state = useSvgStore.getState();
  state.updateElement(state.elementOrder[0], {attributes:{href:'new.png','xlink:href':'new.png'}});
  state.commitChanges(true);
  const inline = document.createElement('div');
  inline.innerHTML = useSvgStore.getState().workingSvg;
  expect(inline.querySelector('image')?.getAttribute('href')).toBe('new.png');
});
