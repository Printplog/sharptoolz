/**
 * /admin/svg-test-render — SVG gradient diagnostic page inside the real admin layout
 *
 * This lets us test SVG rendering under the exact same conditions as the live
 * admin editor — same dark background, same CSS context, same DOM structure.
 */

import { useEffect, useState } from 'react';
import { sanitizeSvgGradients, svgNamespace } from '@/lib/utils/sanitizeSvgGradients';
import { applySvgPatches } from '@/lib/utils/applySvgPatches';
import updateSvgFromFormData from '@/lib/utils/updateSvgFromFormData';
import { injectFontsIntoSVG } from '@/lib/utils/fontInjector';

const SVG_URL = '/test-svgs/flight-itinerary.svg';

type RenderMode = 'img' | 'object' | 'inline-raw' | 'inline-sanitized';

const MODES: { key: RenderMode; label: string; desc: string }[] = [
    {
        key: 'img',
        label: '① <img>',
        desc: 'Browser renders as opaque image document — gold standard.',
    },
    {
        key: 'object',
        label: '② <object>',
        desc: 'Embedded SVG in its own document context.',
    },
    {
        key: 'inline-raw',
        label: '③ Inline RAW',
        desc: 'dangerouslySetInnerHTML WITHOUT sanitizeSvgGradients.',
    },
    {
        key: 'inline-sanitized',
        label: '④ Inline SANITIZED',
        desc: 'dangerouslySetInnerHTML WITH sanitizeSvgGradients — same as the live preview.',
    },
];

export default function AdminSvgTestRender() {
    const [svgText, setSvgText] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<RenderMode>('inline-sanitized');

    useEffect(() => {
        fetch(SVG_URL)
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.text();
            })
            .then(text => {
                setSvgText(text);
                setLoading(false);
            })
            .catch(err => {
                setError(String(err));
                setLoading(false);
            });
    }, []);

    const [sanitizedSvg, setSanitizedSvg] = useState<string>('');

    useEffect(() => {
        const process = async () => {
            if (!svgText) return;
            try {
                // 1. applySvgPatches
                const patchedBase = applySvgPatches(svgText, []);

                // 2. updateSvgFromFormData (mock empty fields)
                const updatedSvg = updateSvgFromFormData(patchedBase, []);

                // 3. injectFontsIntoSVG (mock empty fonts)
                const withFonts = await injectFontsIntoSVG(updatedSvg, []);

                // 4. sanitizeSvgGradients
                const finalSvg = sanitizeSvgGradients(withFonts, svgNamespace(withFonts));

                setSanitizedSvg(finalSvg);
            } catch (err) {
                console.error(err);
                setSanitizedSvg(svgText);
            }
        };
        process();
    }, [svgText]);

    return (
        <div>
            <h1 className="text-xl font-bold text-white mb-2">SVG Gradient Test Render</h1>
            <p className="text-sm text-white/50 mb-4">
                Rendered inside the real admin layout — same bg, same CSS, same DOM context as the editor.
            </p>

            {/* Mode switcher */}
            <div className="flex flex-wrap gap-2 mb-3">
                {MODES.map(m => (
                    <button
                        key={m.key}
                        onClick={() => setActiveMode(m.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${activeMode === m.key
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-white/20 bg-white/5 text-white/60 hover:bg-white/10'
                            }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Description */}
            <p className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-4">
                {MODES.find(m => m.key === activeMode)?.desc}
            </p>

            {/* Render area */}
            {loading && <p className="text-white/40 text-sm">Loading SVG…</p>}
            {error && <p className="text-red-400 text-sm">Error: {error}</p>}

            {
                !loading && !error && (
                    <>
                        {/* Single-mode view */}
                        <div className="w-full overflow-auto rounded-xl border border-white/10 p-4 bg-white/5">
                            {activeMode === 'img' && (
                                <img src={SVG_URL} alt="Flight Itinerary SVG" className="max-w-full block" />
                            )}
                            {activeMode === 'object' && (
                                <object data={SVG_URL} type="image/svg+xml" className="w-full min-h-[600px] block">
                                    SVG not supported
                                </object>
                            )}
                            {activeMode === 'inline-raw' && (
                                
                                <div className="max-w-full [&_svg]:max-w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svgText }} />
                            )}
                            {activeMode === 'inline-sanitized' && (
                                
                                <div
                                    className="max-w-full [&_svg]:max-w-full [&_svg]:h-auto"
                                    style={{
                                        transform: 'translate(0px, 0px) scale(1)', // Forces hardware acceleration
                                        willChange: 'transform',                   // Forces independent compositing layer
                                    }}
                                    dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
                                />
                            )}
                        </div>

                        {/* 2×2 comparison grid */}
                        <details className="mt-8">
                            <summary className="cursor-pointer text-sm font-semibold text-white/60 mb-3 select-none hover:text-white/80">
                                ↕ Show all 4 modes side-by-side
                            </summary>
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                {MODES.map(m => (
                                    <div key={m.key} className="border border-white/10 rounded-lg overflow-hidden">
                                        <div className="px-3 py-1.5 bg-white/5 border-b border-white/10 text-xs font-semibold text-white/60">
                                            {m.label}
                                        </div>
                                        <div className="p-3 overflow-auto max-h-[500px]">
                                            {m.key === 'img' && (
                                                <img src={SVG_URL} alt="Flight Itinerary" className="max-w-full" />
                                            )}
                                            {m.key === 'object' && (
                                                <object data={SVG_URL} type="image/svg+xml" className="w-full min-h-[400px] block">
                                                    SVG not supported
                                                </object>
                                            )}
                                            {m.key === 'inline-raw' && (
                                                
                                                <div className="max-w-full [&_svg]:max-w-full [&_svg]:h-auto" dangerouslySetInnerHTML={{ __html: svgText }} />
                                            )}
                                            {m.key === 'inline-sanitized' && (
                                                
                                                <div
                                                    className="max-w-full [&_svg]:max-w-full [&_svg]:h-auto"
                                                    style={{
                                                        transform: 'translate(0px, 0px) scale(1)', // Forces hardware acceleration
                                                        willChange: 'transform',                   // Forces independent compositing layer
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </>
                )
            }
        </div >
    );
}
