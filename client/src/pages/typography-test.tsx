import React from 'react';

export default function TypographyTest() {
  const typographyClasses = [
    { class: 'text-display', label: 'Display / Mega', size: '110px', weight: '700 (Bold)', case: 'ALL CAPS' },
    { class: 'text-h1', label: 'H1 - Major Section', size: '68px', weight: '700 (Bold)', case: 'ALL CAPS' },
    { class: 'text-h2', label: 'H2 - Subsection', size: '42px', weight: '600 (SemiBold)', case: 'ALL CAPS' },
    { class: 'text-h3', label: 'H3 - Sub-subsection', size: '26px', weight: '600 (SemiBold)', case: 'ALL CAPS' },
    { class: 'text-body-large', label: 'Body Large', size: '20px', weight: '400 (Regular)', case: 'Normal' },
    { class: 'text-body', label: 'Body', size: '16px', weight: '400 (Regular)', case: 'Normal' },
    { class: 'text-body-small', label: 'Body Small', size: '14px', weight: '400 (Regular)', case: 'Normal' },
    { class: 'text-caption', label: 'Caption / Label', size: '12px', weight: '600 (SemiBold)', case: 'ALL CAPS' },
  ];

  const legacyClasses = [
    { class: 'text-mega', mapsTo: 'text-display' },
    { class: 'text-xl-display', mapsTo: 'text-h1' },
    { class: 'text-brutalist-h1', mapsTo: 'text-h1' },
    { class: 'text-brutalist-h2', mapsTo: 'text-h2' },
    { class: 'text-brutalist-body', mapsTo: 'text-body-large' },
    { class: 'text-brutalist-small', mapsTo: 'text-body-small' },
    { class: 'text-brutalist-caption', mapsTo: 'text-caption' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div>
        <h1 className="text-display mb-4">Typography Test</h1>
        <p className="text-body text-gray-600">
          Testing the Golden Ratio Typography Scale (1.618) with Nohemi fonts
        </p>
      </div>

      {/* Main Typography Classes */}
      <section>
        <h2 className="text-h2 mb-6">Main Typography Classes</h2>
        <div className="space-y-8">
          {typographyClasses.map((item) => (
            <div key={item.class} className="border border-gray-200 rounded-lg p-6">
              <div className="mb-2">
                <code className="text-sm text-gray-500">{item.class}</code>
                <span className="ml-4 text-sm text-gray-400">
                  {item.size} • {item.weight} • {item.case}
                </span>
              </div>
              <div className={item.class}>
                {item.label} - The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legacy Classes */}
      <section>
        <h2 className="text-h2 mb-6">Legacy Classes (Backward Compatibility)</h2>
        <div className="space-y-4">
          {legacyClasses.map((item) => (
            <div key={item.class} className="border border-gray-200 rounded-lg p-4">
              <div className="mb-2">
                <code className="text-sm text-gray-500">{item.class}</code>
                <span className="ml-4 text-sm text-gray-400">→ maps to {item.mapsTo}</span>
              </div>
              <div className={item.class}>
                Legacy class test - The quick brown fox jumps over the lazy dog
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weight Test */}
      <section>
        <h2 className="text-h2 mb-6">Font Weight Test</h2>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-body mb-2">Nohemi Light (300)</div>
            <div style={{ fontFamily: 'Nohemi', fontWeight: 300, fontSize: '20px' }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-body mb-2">Nohemi Regular (400)</div>
            <div style={{ fontFamily: 'Nohemi', fontWeight: 400, fontSize: '20px' }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-body mb-2">Nohemi Medium (500)</div>
            <div style={{ fontFamily: 'Nohemi', fontWeight: 500, fontSize: '20px' }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-body mb-2">Nohemi SemiBold (600)</div>
            <div style={{ fontFamily: 'Nohemi', fontWeight: 600, fontSize: '20px' }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-body mb-2">Nohemi Bold (700)</div>
            <div style={{ fontFamily: 'Nohemi', fontWeight: 700, fontSize: '20px' }}>
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Test Note */}
      <section className="border rounded-lg p-6" style={{ backgroundColor: 'rgba(124, 173, 197, 0.1)', borderColor: 'var(--blue-7)', borderWidth: '1px', borderStyle: 'solid' }}>
        <h3 className="text-h3 mb-4">Responsive Testing</h3>
        <p className="text-body">
          Resize your browser to less than 768px wide to see the responsive typography scaling:
        </p>
        <ul className="text-body-small mt-2 space-y-1 list-disc list-inside">
          <li>Display: 110px → 68px on mobile</li>
          <li>H1: 68px → 42px on mobile</li>
          <li>H2: 42px → 26px on mobile</li>
          <li>H3: 26px → 20px on mobile</li>
        </ul>
      </section>
    </div>
  );
}

