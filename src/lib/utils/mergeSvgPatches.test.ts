import {expect,it} from 'vitest';
import {mergeSvgPatches} from './mergeSvgPatches';
import {applySvgPatches} from './applySvgPatches';
import type {SvgPatch} from '@/types';
const svg='<svg xmlns="http://www.w3.org/2000/svg"><image id="Photo.upload" href="old.png"/><text id="Title.text">LOVE</text></svg>';
it('keeps repeated mask changes and image replacement after serializing and reloading saved patches',()=>{
  let patches: SvgPatch[]=[];
  let current='Photo.upload';
  for(const next of ['Photo.upload.mask_Title','Photo.upload','Photo.upload.mask_Title','Photo.upload']) {
    patches=mergeSvgPatches([...patches,{id:current,attribute:'id',value:next},{id:next,attribute:'href',value:'new.png'}]);
    patches=JSON.parse(JSON.stringify(patches));
    const doc=new DOMParser().parseFromString(applySvgPatches(svg,patches),'image/svg+xml');
    expect(doc.querySelector('image')?.id).toBe(next);
    expect(doc.querySelector('image')?.getAttribute('href')).toBe('new.png');
    expect(patches).toHaveLength(2);
    current=next;
  }
});
it('loads existing chained patches and retains edits addressed to intermediate names',()=>{
  const patches: SvgPatch[]=[
    {id:'Photo.upload',attribute:'id',value:'Photo.upload.mask_Title'},
    {id:'Photo.upload.mask_Title',attribute:'href',value:'new.png'},
    {id:'Photo.upload.mask_Title',attribute:'id',value:'Photo.upload'},
  ];
  const doc=new DOMParser().parseFromString(applySvgPatches(svg,patches),'image/svg+xml');
  expect(doc.querySelector('image')?.id).toBe('Photo.upload');
  expect(doc.querySelector('image')?.getAttribute('href')).toBe('new.png');
});
