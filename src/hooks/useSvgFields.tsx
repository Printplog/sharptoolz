import { useState, useEffect } from 'react';

// Define parsed field interface
export interface EditableField {
  id: string;
  name: string;
  label: string;
  type: string;
  editable: boolean;
}

// Custom hook to load and parse SVG
export function useSvgFields(svgPath: string = '/card.svg') {
  const [fields, setFields] = useState<EditableField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAndParseSVG() {
      try {
        // Step 1: Fetch the SVG file
        const response = await fetch(svgPath);
        if (!response.ok) throw new Error('Failed to fetch SVG');

        const textData = await response.text();

        // Step 2: Parse SVG as XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, 'application/xml');

        // Step 3: Extract all elements with `id` attributes
        const elements = xmlDoc.querySelectorAll('[id]');
        const idList = Array.from(elements).map((el) => el.getAttribute('id') || '');

        // Step 4: Analyze each ID based on your naming convention
        const parsedFields: EditableField[] = [];

        for (const id of idList) {
          const match = id.match(/(.+?)\.([a-zA-Z0-9_]+)/);

          if (!match) {
            // No extension — not editable
            parsedFields.push({
              id,
              name: id,
              label: id.replace(/_/g, ' '),
              type: 'static',
              editable: false,
            });
            continue;
          }

          const [, baseName, ext] = match;

          // Determine field type
          const type = ext.split('_')[0]; // e.g., upload, checkbox, text

          parsedFields.push({
            id,
            name: baseName,
            label: baseName.replace(/_/g, ' '),
            type,
            editable: true,
          });
        }

        setFields(parsedFields);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'An error occurred while parsing the SVG');
      } finally {
        setLoading(false);
      }
    }

    loadAndParseSVG();
  }, [svgPath]);

  return { fields, loading, error };
}