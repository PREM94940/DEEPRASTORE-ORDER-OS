require('@babel/register')({
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  extensions: ['.ts', '.tsx']
});

const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { DynamicSection } = require('./src/components/theme/DynamicSection');

console.log("=== Corrupted Data Validation Matrix ===");

// We mock console.error to avoid polluting the test output with React error boundary logs
const originalConsoleError = console.error;
console.error = () => {};

try {
  const html = ReactDOMServer.renderToString(
    React.createElement(DynamicSection, {
      type: "hero",
      props: { overlayOpacity: "HIGH", backgroundImage: 12345 }
    })
  );

  console.error = originalConsoleError;

  if (html.includes('Invalid Configuration')) {
    console.log('[PASS] Zod validation caught corrupted props (overlayOpacity: "HIGH")');
    console.log('[PASS] Rendered "Invalid Configuration" fallback block instead of crashing');
  } else {
    console.error('[FAIL] Corrupted props did not trigger the expected fallback UI.');
    process.exit(1);
  }
} catch (e) {
  console.error = originalConsoleError;
  console.error('[FAIL] React crashed instead of rendering fallback:', e.message);
  process.exit(1);
}
