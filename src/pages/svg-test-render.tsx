/**
 * /svg-test-render  — Standalone diagnostic page (no user/admin layout)
 *
 * Renders the flight-itinerary SVG in four different ways so we can visually
 * compare which rendering path introduces gradient ridges / banding.
 */

import { useEffect, useState } from 'react';
import { sanitizeSvgGradients, svgNamespace } from '@/lib/utils/sanitizeSvgGradients';

const SVG_URL = '/test-svgs/flight-itinerary.svg';

/** The app's actual dark background color from index.css */
const APP_BG = '#0f1620';

type RenderMode = 'img' | 'object' | 'inline-raw' | 'inline-sanitized';

const MODES: { key: RenderMode; label: string; desc: string }[] = [
    {
        key: 'img',
        label: '① <img> tag',
        desc: 'Browser renders as opaque image doc. Gold standard — ridges here = problem is in the SVG file itself.',
    },
    {
        key: 'object',
        label: '② <object> tag',
        desc: 'Embedded SVG in its own document context.',
    },
    {
        key: 'inline-raw',
        label: '③ Inline (RAW)',
        desc: 'dangerouslySetInnerHTML WITHOUT sanitizeSvgGradients. Isolates whether plain injection causes ridges.',
    },
    {
        key: 'inline-sanitized',
        label: '④ Inline (SANITIZED)',
        desc: 'dangerouslySetInnerHTML WITH sanitizeSvgGradients — exactly like SvgFormTranslator.',
    },
];

type BgPreset = { label: string; color: string };
const BG_PRESETS: BgPreset[] = [
    { label: 'App dark (#0f1620)', color: APP_BG },
    { label: 'White', color: '#ffffff' },
    { label: 'Light gray', color: '#f3f4f6' },
    { label: 'Mid gray', color: '#6b7280' },
    { label: 'Black', color: '#000000' },
];

export default function SvgTestRender() {
    const [svgText, setSvgText] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<RenderMode>('inline-sanitized');
    const [bg, setBg] = useState(APP_BG);
    const [customBg, setCustomBg] = useState(APP_BG);

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

    const sanitizedSvg = svgText
        ? sanitizeSvgGradients(svgText, svgNamespace(svgText))
        : '';

    // Text color for the controls bar — always light so readable over dark bg
    const isDark = bg === APP_BG || bg === '#000000';

    return (
        <div style={{ background: bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif', transition: 'background 0.2s' }}>

            {/* Controls bar */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: 'rgba(15,22,32,0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '10px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
            }}>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    🎨 BG:
                </span>
                {BG_PRESETS.map(p => (
                    <button
                        key={p.color}
                        onClick={() => { setBg(p.color); setCustomBg(p.color); }}
                        title={p.label}
                        style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            border: bg === p.color ? '2px solid #60a5fa' : '2px solid rgba(255,255,255,0.3)',
                            background: p.color,
                            cursor: 'pointer',
                            flexShrink: 0,
                            outline: bg === p.color ? '2px solid #60a5fa' : 'none',
                            outlineOffset: '2px',
                        }}
                    />
                ))}
                <input
                    type="color"
                    value={customBg}
                    onChange={e => { setCustomBg(e.target.value); setBg(e.target.value); }}
                    title="Custom color"
                    style={{ width: '28px', height: '22px', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                />
                <span style={{ color: '#64748b', fontSize: '11px', marginLeft: '4px' }}>{bg}</span>

                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Mode:</span>
                {MODES.map(m => (
                    <button
                        key={m.key}
                        onClick={() => setActiveMode(m.key)}
                        style={{
                            padding: '4px 10px',
                            border: '1px solid',
                            borderColor: activeMode === m.key ? '#60a5fa' : 'rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            background: activeMode === m.key ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.05)',
                            color: activeMode === m.key ? '#93c5fd' : '#94a3b8',
                            fontWeight: activeMode === m.key ? 700 : 400,
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Mode description */}
            <div style={{ padding: '8px 20px', background: 'rgba(96,165,250,0.08)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#7dd3fc' }}>
                    {MODES.find(m => m.key === activeMode)?.desc}
                </p>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
                {loading && (
                    <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading SVG…</p>
                )}
                {error && (
                    <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px', color: '#dc2626' }}>
                        Error: {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {activeMode === 'img' && (
                            <img
                                src={SVG_URL}
                                alt="Flight Itinerary SVG"
                                style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
                            />
                        )}

                        {activeMode === 'object' && (
                            <object
                                data={SVG_URL}
                                type="image/svg+xml"
                                style={{ width: '100%', minHeight: '600px', display: 'block' }}
                            >
                                SVG not supported
                            </object>
                        )}

                        {activeMode === 'inline-raw' && (
                            <div
                                style={{ maxWidth: '100%' }}
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{ __html: svgText }}
                            />
                        )}

                        {activeMode === 'inline-sanitized' && (
                            <div
                                style={{ maxWidth: '100%' }}
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
                            />
                        )}

                        {/* Side-by-side 2×2 */}
                        <details style={{ marginTop: '40px' }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                color: isDark ? '#94a3b8' : '#374151',
                                marginBottom: '12px',
                                userSelect: 'none',
                            }}>
                                ↕ Show all 4 modes side-by-side (2×2)
                            </summary>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                                {MODES.map(m => (
                                    <div key={m.key} style={{
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: bg,
                                    }}>
                                        <div style={{
                                            padding: '6px 12px',
                                            background: 'rgba(0,0,0,0.4)',
                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#94a3b8',
                                        }}>
                                            {m.label}
                                        </div>
                                        <div style={{ padding: '8px', overflow: 'auto', maxHeight: '500px' }}>
                                            {m.key === 'img' && (
                                                <img src={SVG_URL} alt="Flight Itinerary" style={{ maxWidth: '100%' }} />
                                            )}
                                            {m.key === 'object' && (
                                                <object data={SVG_URL} type="image/svg+xml" style={{ width: '100%', minHeight: '400px', display: 'block' }}>
                                                    SVG not supported
                                                </object>
                                            )}
                                            {m.key === 'inline-raw' && (
                                                // eslint-disable-next-line react/no-danger
                                                <div style={{ maxWidth: '100%' }} dangerouslySetInnerHTML={{ __html: svgText }} />
                                            )}
                                            {m.key === 'inline-sanitized' && (
                                                // eslint-disable-next-line react/no-danger
                                                <div style={{ maxWidth: '100%' }} dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </details>
                    </>
                )}
            </div>
        </div>
    );
}
