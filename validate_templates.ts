import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import { validateSvgId } from './src/lib/utils/svgIdValidator';

const templatesDir = path.resolve('../templates');

function validateFolder() {
  const files = fs.readdirSync(templatesDir);
  for (const file of files) {
    if (!file.endsWith('.svg')) continue;

    console.log(`\nValidating ${file}...`);
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const dom = new JSDOM('<!DOCTYPE html><html><body>' + content + '</body></html>');
    const elements = dom.window.document.querySelectorAll('[id]');
    
    let hasError = false;
    elements.forEach(el => {
      const id = el.getAttribute('id');
      if (!id || id.startsWith('layer') || id.startsWith('g') || id.startsWith('path') || id.startsWith('rect') || id.startsWith('text') || id.startsWith('tspan')) {
        // usually ignore generic illustrator/figma ids if they are not meant to be template fields
        // But we should validate everything just in case, or at least anything with a dot.
      }
      
      // Let's validate anything that has a dot extension, since those are our fields
      if (id && id.includes('.')) {
        const result = validateSvgId(id);
        if (!result.valid) {
          console.log(`  ❌ Invalid ID: "${id}"`);
          console.log(`     Error: ${result.error}`);
          hasError = true;
        }
      }
    });

    if (!hasError) {
      console.log('  ✅ All extension IDs valid.');
    }
  }
}

validateFolder();
