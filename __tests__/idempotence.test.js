import fs from 'fs';
import path from 'path';
import { transformSync } from '@babel/core';

const reactNativePlugin = require('../src/index').default;

/*
 * The Pressability and TouchableMixin patches insert a press forward after every
 * `onPress` / `onLongPress` (or `touchableHandle*Press`) call and append a method that performs it.
 * If the plugin sees the same source twice, an un-guarded patch would do all of that again, and every
 * tap would be forwarded to the native SDK twice (recorded as two clicks).
 *
 * "Twice" can happen without Babel's duplicate-plugin warning:
 *   - the file is transformed a second time (a re-transform of already patched output, or a cache),
 *   - the plugin is registered under two different instance names,
 * These tests run the real RN fixtures through both paths and require exactly one patch.
 */

const FIXTURES = path.join(__dirname, 'fixtures', 'react-native');
const read = name => fs.readFileSync(path.join(FIXTURES, name, 'code.js'), 'utf8');

const BASE = {
  babelrc: false,
  configFile: false,
  filename: 'node_modules/react-native/Libraries/Pressability/Pressability.js',
};
const SYNTAX = ['@babel/plugin-syntax-jsx', '@babel/plugin-syntax-flow'];

const transform = (code, plugins = [reactNativePlugin], filename = BASE.filename) =>
  transformSync(code, { ...BASE, filename, plugins: [...SYNTAX, ...plugins] }).code;

const count = (code, re) => (code.match(re) || []).length;

const pressability = code => ({
  definitions: count(code, /^\s*_onFsPressForward_Pressability\s*\(isLongPress\)\s*\{/gm),
  pressCalls: count(code, /this\._onFsPressForward_Pressability\(false\)/g),
  longPressCalls: count(code, /this\._onFsPressForward_Pressability\(true\)/g),
});

const touchable = code => ({
  definitions: count(code, /^\s*_onFsPressForward\s*:\s*function\s*\(isLongPress\)/gm),
  pressCalls: count(code, /this\._onFsPressForward\(false\)/g),
  longPressCalls: count(code, /this\._onFsPressForward\(true\)/g),
});

describe('Pressability patch is idempotent', () => {
  const source = read('pressability');
  const once = transform(source);

  it('patches once: one definition, one press forward, one long-press forward', () => {
    expect(pressability(once)).toEqual({ definitions: 1, pressCalls: 1, longPressCalls: 1 });
  });

  it('does not patch again when its own output is transformed a second time', () => {
    const twice = transform(once);
    expect(pressability(twice)).toEqual({ definitions: 1, pressCalls: 1, longPressCalls: 1 });
    expect(twice).toBe(once);
  });

  it('does not patch twice when the plugin is registered under two instance names', () => {
    const doubled = transform(source, [
      [reactNativePlugin, {}, 'first'],
      [reactNativePlugin, {}, 'second'],
    ]);
    expect(pressability(doubled)).toEqual({ definitions: 1, pressCalls: 1, longPressCalls: 1 });
  });

  it('patches every unpatched copy of the file, not just the first one in the process', () => {
    // Each file must be judged by its own contents, so a second, separate
    // unpatched copy still has to be patched after the first one was.
    transform(source);
    expect(pressability(transform(source))).toEqual({
      definitions: 1,
      pressCalls: 1,
      longPressCalls: 1,
    });
  });
});

describe('TouchableMixin patch is idempotent', () => {
  const source = read('touchable');
  const filename = 'node_modules/react-native/Libraries/Components/Touchable/Touchable.js';
  const once = transform(source, [reactNativePlugin], filename);

  it('patches once: one definition, one press forward, one long-press forward', () => {
    expect(touchable(once)).toEqual({ definitions: 1, pressCalls: 1, longPressCalls: 1 });
  });

  it('does not patch again when its own output is transformed a second time', () => {
    const twice = transform(once, [reactNativePlugin], filename);
    expect(touchable(twice)).toEqual({ definitions: 1, pressCalls: 1, longPressCalls: 1 });
    expect(twice).toBe(once);
  });

  it('does not patch twice when the plugin is registered under two instance names', () => {
    const doubled = transform(
      source,
      [
        [reactNativePlugin, {}, 'first'],
        [reactNativePlugin, {}, 'second'],
      ],
      filename,
    );
    expect(touchable(doubled)).toEqual({ definitions: 1, pressCalls: 1, longPressCalls: 1 });
  });
});

describe('Fabric commit hook is idempotent', () => {
  const source = read('fabricCommitHook/injectsCommitHook');
  const filename =
    'node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js';
  const hooks = code =>
    count(code, /global\.__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook === undefined/g);
  const once = transform(source, [reactNativePlugin], filename);

  it('injects once', () => {
    expect(hooks(once)).toBe(1);
  });

  it('does not inject again when its own output is transformed a second time', () => {
    const twice = transform(once, [reactNativePlugin], filename);
    expect(hooks(twice)).toBe(1);
    expect(twice).toBe(once);
  });

  it('does not inject twice when the plugin is registered under two instance names', () => {
    const doubled = transform(
      source,
      [
        [reactNativePlugin, {}, 'first'],
        [reactNativePlugin, {}, 'second'],
      ],
      filename,
    );
    expect(hooks(doubled)).toBe(1);
  });
});
