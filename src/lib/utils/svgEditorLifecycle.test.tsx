import { act, useLayoutEffect, useMemo, useRef } from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import fixture from './__fixtures__/text_mask.svg?raw';
import {applySvgPatches} from './applySvgPatches';
import {useSvgStore} from '@/store/useSvgStore';
import {useSvgLiveUpdate} from '@/components/Admin/ToolBuilder/SvgEditor/hooks/useSvgLiveUpdate';
import {regenerateSvg} from '@/components/Admin/ToolBuilder/SvgEditor/utils/regenerateSvg';

beforeEach(()=>{vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);useSvgStore.getState().reset();});
afterEach(()=>{useSvgStore.getState().reset();vi.useRealTimers();vi.unstubAllGlobals();});

it('keeps a manually entered mask visible before and after the delayed store commit',async()=>{
  useSvgStore.getState().setInitialSvg(applySvgPatches(fixture.replace('.mask_Title',''), []));
  const container=document.createElement('div');document.body.append(container);
  const root=createRoot(container);
  const frames: string[]=[];
  function Canvas(){
    const {workingSvg,elements,elementOrder}=useSvgStore();
    const ordered=useMemo(()=>elementOrder.map(id=>elements[id]),[elements,elementOrder]);
    const ref=useRef<HTMLDivElement>(null);
    useSvgLiveUpdate(ref as React.RefObject<HTMLDivElement>,ordered,undefined,workingSvg);
    useLayoutEffect(()=>{frames.push(ref.current?.querySelector('image')?.id||'');});
    return <div ref={ref}/>;
  }
  try {
    await act(async()=>root.render(<Canvas/>));
    const imageId=useSvgStore.getState().elementOrder.find(id=>useSvgStore.getState().elements[id].tag==='image')!;
    const textId=useSvgStore.getState().elementOrder.find(id=>useSvgStore.getState().elements[id].tag==='text')!;
    await act(async()=>useSvgStore.getState().updateElement(imageId,{id:'Photo.upload.mask_Title'}));
    expect(container.querySelector('mask text')?.textContent).toBe('LOVE');
    const frameStart=frames.length;
    await act(async()=>vi.advanceTimersByTime(4000));
    expect(container.querySelectorAll('mask')).toHaveLength(1);
    expect(frames.slice(frameStart).every(id=>id==='Photo.upload.mask_Title')).toBe(true);
    await act(async()=>useSvgStore.getState().updateElement(textId,{innerText:'HELLO'}));
    await act(async()=>vi.advanceTimersByTime(4000));
    expect(container.querySelector('mask text')?.textContent).toBe('HELLO');
    await act(async()=>useSvgStore.getState().undo());
    expect(container.querySelector('mask text')?.textContent).toBe('LOVE');
    await act(async()=>useSvgStore.getState().undo());
    expect(container.querySelectorAll('mask')).toHaveLength(0);
  } finally {await act(async()=>root.unmount());container.remove();}
});

it('does not restore an old document after switching while a commit is pending',()=>{
  useSvgStore.getState().setInitialSvg('<svg xmlns="http://www.w3.org/2000/svg"><text id="Old.text">OLD</text></svg>');
  useSvgStore.getState().updateElement('Old.text',{innerText:'EDIT'});
  useSvgStore.getState().setInitialSvg('<svg xmlns="http://www.w3.org/2000/svg"><text id="New.text">NEW</text></svg>');
  vi.advanceTimersByTime(4000);
  expect(useSvgStore.getState().workingSvg).toContain('NEW');
  expect(useSvgStore.getState().workingSvg).not.toContain('EDIT');
});

it('preserves named groups and their child image/text when regenerating',()=>{
  const svg=fixture.replace('<g transform="translate(20 0)"','<g id="TextGroup" transform="translate(20 0)"').replace('<g transform="translate(40 0)"','<g id="ImageGroup" transform="translate(40 0)"');
  useSvgStore.getState().setInitialSvg(svg);
  const state=useSvgStore.getState();
  const output=regenerateSvg(state.originalSvg,state.getOrderedElements(),{keepInternalIds:true});
  const doc=new DOMParser().parseFromString(output,'image/svg+xml');
  expect(doc.querySelector('#TextGroup text')?.textContent).toBe('LOVE');
  expect(doc.querySelector('#ImageGroup image')).not.toBeNull();
});

it('keeps imported tspan positioning when an unrelated layer changes',()=>{
  const svg='<svg xmlns="http://www.w3.org/2000/svg"><text id="Title.text"><tspan x="50" y="180" font-size="120">LOVE</tspan></text><rect id="Box" width="20" height="20"/></svg>';
  useSvgStore.getState().setInitialSvg(svg);
  useSvgStore.getState().updateElement('Box',{attributes:{fill:'red'}});
  vi.advanceTimersByTime(4000);
  const doc=new DOMParser().parseFromString(useSvgStore.getState().workingSvg,'image/svg+xml');
  expect(doc.querySelector('tspan')?.getAttribute('y')).toBe('180');
  expect(doc.querySelector('tspan')?.getAttribute('font-size')).toBe('120');
});

it('preserves the full admin-loaded document after toggling a saved mask', () => {
  const adminSvg = applySvgPatches(fixture.replace('.mask_Title', ''), [
    {id: 'Photo.upload', attribute: 'id', value: 'Photo.upload.mask_Title'},
  ]);
  useSvgStore.getState().setInitialSvg(adminSvg);
  const imageId = useSvgStore.getState().elementOrder.find(id => useSvgStore.getState().elements[id].tag === 'image')!;
  for (const nextId of ['Photo.upload', 'Photo.upload.mask_Title', 'Photo.upload']) {
    useSvgStore.getState().updateElement(imageId, {id: nextId});
    vi.advanceTimersByTime(4000);
    const doc = new DOMParser().parseFromString(useSvgStore.getState().workingSvg, 'image/svg+xml');
    expect(doc.querySelectorAll('g')).toHaveLength(2);
    expect(doc.querySelector('g image')?.id).toBe(nextId);
    expect(doc.querySelector('g text')?.textContent).toBe('LOVE');
    expect(doc.querySelector('rect')).not.toBeNull();
  }
});

it('still removes a tracked image without deleting its untracked parent group', () => {
  useSvgStore.getState().setInitialSvg(applySvgPatches(fixture, []));
  const state = useSvgStore.getState();
  const imageId = state.elementOrder.find(id => state.elements[id].tag === 'image')!;
  state.deleteElement(imageId);
  vi.advanceTimersByTime(4000);
  const doc = new DOMParser().parseFromString(useSvgStore.getState().workingSvg, 'image/svg+xml');
  expect(doc.querySelector('image')).toBeNull();
  expect(doc.querySelectorAll('g')).toHaveLength(2);
  expect(doc.querySelector('text')?.textContent).toBe('LOVE');
});
