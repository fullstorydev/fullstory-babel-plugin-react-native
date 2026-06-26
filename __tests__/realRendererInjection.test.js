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
