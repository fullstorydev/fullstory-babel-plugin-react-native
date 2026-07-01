const babel = require('@babel/core');
const path = require('path');
const fs = require('fs');
const plugin = require('../src/index').default;

const RENDERER_DIR = path.join(
  path.dirname(require.resolve('react-native/package.json')),
  'Libraries/Renderer/implementations',
);

const RENDERER_FILES = ['ReactFabric-dev.js', 'ReactFabric-prod.js', 'ReactFabric-profiling.js'];

const SENTINEL = '__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook';

describe('FullStory commit hook is injected into shipped ReactFabric renderers', () => {
  for (const file of RENDERER_FILES) {
    const filePath = path.join(RENDERER_DIR, file);

    it(`injects into ${file}`, () => {
      const src = fs.readFileSync(filePath, 'utf8');
      const result = babel.transformSync(src, {
        filename: filePath,
        plugins: [plugin],
        parserOpts: { plugins: ['jsx', 'flow'] },
        presets: [],
        compact: false,
      });

      expect(result).not.toBeNull();
      // The sentinel appears 3 times per injection:
      //   1. undefined-check  (=== undefined)
      //   2. flag write       (shouldInjectFSCommitHook = ...)
      //   3. flag read        (if (global.__FULLSTORY_...))
      const occurrences = (result.code.match(new RegExp(SENTINEL, 'g')) || []).length;
      expect(occurrences).toBeGreaterThanOrEqual(3);
    });
  }
});

// ---------------------------------------------------------------------------
// Structural assertions — these guard the assumptions that underpin the injected
// hook.  If any of these fail after a react-native upgrade, the hook must be
// re-evaluated against the new renderer.
// ---------------------------------------------------------------------------
describe('ReactFabric renderer structural assumptions', () => {
  for (const file of RENDERER_FILES) {
    const filePath = path.join(RENDERER_DIR, file);
    let src;

    beforeAll(() => {
      src = fs.readFileSync(filePath, 'utf8');
    });

    describe(file, () => {
      it('assigns fiberTag = 5 for string element types (HostComponent)', () => {
        // React's createFiberFromTypeAndProps sets fiberTag = 5 when
        // `typeof type === "string"`, which covers all native host primitives
        // (View, Text, Image, …).  Our injected hook filters on tag === 5;
        // if React renumbers HostComponent this check will catch it.
        expect(src).toMatch(/"string"\s*===\s*typeof\s+\w+\s*\)\s*\w+\s*=\s*5/);
      });

      it('defines getPublicInstance as a function declaration in the same renderer scope', () => {
        // The injected code calls getPublicInstance(stateNode) without any
        // import — it relies on this being a hoisted function declaration in the
        // same closure scope as commitMutationEffectsOnFiber.
        // If getPublicInstance is removed or converted to a variable, the
        // injected call will throw a ReferenceError at runtime.
        expect(src).toMatch(/function getPublicInstance\s*\(/);
      });

      it('contains a case 3 (HostRoot) arm inside commitMutationEffectsOnFiber', () => {
        // Our drain fires after tag-3 (HostRoot) because the HostRoot case in
        // commitMutationEffectsOnFiber is what synchronously commits the Fabric
        // shadow tree to native (via replaceContainerChildren in dev builds, or
        // its prod-renamed equivalent completeRoot in prod/profiling builds).
        // Our injected code runs at the END of the function, after that call.
        // If the HostRoot arm ever moves outside this function, the ordering
        // guarantee is lost and setBatchProperties may target unmounted views.
        const cmIdx = src.indexOf('function commitMutationEffectsOnFiber(');
        expect(cmIdx).toBeGreaterThan(-1);
        const bodySlice = src.slice(cmIdx, cmIdx + 15000);
        expect(bodySlice).toMatch(/case 3:/);
      });
    });
  }
});
