'use strict';

/**
 * Behavioral unit tests for the Fabric commit-hook injection.
 *
 * The fixture output.js is the full commitMutationEffectsOnFiber function as
 * it looks after the plugin runs. We execute it in a vm sandbox, driving it
 * with mock fiber objects, so we can assert the collect/drain logic, the exact
 * command count, and the crash-on-incompatibility assertions without needing a
 * live React Native renderer.
 *
 * What these tests guard:
 *   - Throws if getPublicInstance is missing from the renderer scope.
 *   - Throws if getPublicInstance returns null for a tag-5 stateNode (once per bundle).
 *   - Only tag-5 (HostComponent) fibers with FS props are collected.
 *   - The drain fires exactly once per commit, triggered by tag-3 (HostRoot).
 *   - applyFSPropertiesToInstance is called once per collected fiber (command count).
 *   - The pending queue is reset after each drain so commits are independent.
 */

const vm = require('vm');
const path = require('path');
const fs = require('fs');

const FIXTURE_CODE = fs.readFileSync(
  path.join(__dirname, 'fixtures/react-native/fabricCommitHook/injectsCommitHook/output.js'),
  'utf8',
);

// Sentinel that distinguishes "caller didn't pass getPublicInstance" from
// "caller explicitly wants getPublicInstance stripped from the fixture".
const _USE_FIXTURE_GET_PUBLIC_INSTANCE = Symbol('useFixture');

/**
 * Build a fresh vm sandbox that mimics the ReactFabric renderer closure.
 *
 * @param {object} [opts]
 * @param {Function|null|undefined} [opts.getPublicInstance]
 *   - Omitted (default): the fixture's own `function getPublicInstance` declaration runs.
 *   - A function: the fixture's declaration is stripped; this mock is used instead.
 *   - null / undefined (explicit): the fixture's declaration is stripped and nothing is
 *     injected, so `typeof getPublicInstance` evaluates to `'undefined'` inside the vm —
 *     which triggers the startup-assertion crash.
 */
function makeContext({ getPublicInstance = _USE_FIXTURE_GET_PUBLIC_INSTANCE } = {}) {
  const applyFSPropertiesToInstance = jest.fn();

  const sandbox = {
    recursivelyTraverseMutationEffects: () => {},
    commitReconciliationEffects: () => {},
    require(mod) {
      if (mod === 'react-native') return { Platform: { OS: 'ios', isTV: false } };
      if (mod === '@fullstory/react-native') return { applyFSPropertiesToInstance };
      throw new Error(`Unexpected require('${mod}')`);
    },
  };

  sandbox.global = sandbox;
  sandbox.RN$Bridgeless = true;

  // When the caller supplies an explicit getPublicInstance (even null/undefined),
  // strip the fixture's hoisted function declaration from the source before
  // running it in the vm.  Deleting a sandbox property after the fact cannot
  // undo a hoisted function binding, so we must excise it from the source.
  let code = FIXTURE_CODE;
  if (getPublicInstance !== _USE_FIXTURE_GET_PUBLIC_INSTANCE) {
    code = FIXTURE_CODE.replace(/function getPublicInstance\([^)]*\) \{[\s\S]*?\}\n/, '');
    if (typeof getPublicInstance === 'function') {
      sandbox.getPublicInstance = getPublicInstance;
    }
    // null/undefined → nothing added → typeof getPublicInstance === 'undefined' in vm
  }

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  return { sandbox, applyFSPropertiesToInstance };
}

function runFibers(sandbox, fibers) {
  for (const fiber of fibers) {
    sandbox.commitMutationEffectsOnFiber(fiber, {});
  }
}

// ---------------------------------------------------------------------------
// Startup assertions
// ---------------------------------------------------------------------------

describe('Fabric commit hook — startup assertions', () => {
  it('throws if getPublicInstance is not defined in the renderer scope', () => {
    // Pass null so makeContext strips the fixture's hoisted function declaration
    // without injecting a replacement — typeof getPublicInstance === 'undefined' in vm.
    const { sandbox } = makeContext({ getPublicInstance: null });

    expect(() => {
      sandbox.commitMutationEffectsOnFiber({ tag: 99, memoizedProps: null }, {});
    }).toThrow(
      '[Fullstory] ReactFabric renderer incompatibility: getPublicInstance is not defined',
    );
  });

  it('does not throw when getPublicInstance is present and conditions are met', () => {
    const { sandbox } = makeContext();
    expect(() => {
      sandbox.commitMutationEffectsOnFiber({ tag: 99, memoizedProps: null }, {});
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tag-5 structural validation (lazy, once per bundle lifetime)
// ---------------------------------------------------------------------------

describe('Fabric commit hook — tag-5 stateNode validation', () => {
  it('throws on the first tag-5 fiber if getPublicInstance returns null for its stateNode', () => {
    const { sandbox } = makeContext({ getPublicInstance: () => null });

    expect(() => {
      sandbox.commitMutationEffectsOnFiber(
        { tag: 5, memoizedProps: { fsClass: 'X' }, stateNode: { id: 1 } },
        {},
      );
    }).toThrow(
      '[Fullstory] ReactFabric renderer incompatibility: getPublicInstance returned null for a HostComponent stateNode',
    );
  });

  it('only validates once — does not throw on subsequent tag-5 fibers after passing', () => {
    const { sandbox } = makeContext();

    // First fiber triggers and passes validation
    sandbox.commitMutationEffectsOnFiber(
      { tag: 5, memoizedProps: { fsClass: 'A' }, stateNode: { id: 1 } },
      {},
    );
    expect(sandbox.__FULLSTORY_BABEL_PLUGIN_instanceValidated).toBe(true);

    // Second fiber does not re-run the check
    expect(() => {
      sandbox.commitMutationEffectsOnFiber(
        { tag: 5, memoizedProps: { fsClass: 'B' }, stateNode: { id: 2 } },
        {},
      );
    }).not.toThrow();
  });

  it('skips validation when stateNode is null (waits for a fiber with a real stateNode)', () => {
    const { sandbox } = makeContext();

    expect(() => {
      sandbox.commitMutationEffectsOnFiber(
        { tag: 5, memoizedProps: { fsClass: 'X' }, stateNode: null },
        {},
      );
    }).not.toThrow();
    expect(sandbox.__FULLSTORY_BABEL_PLUGIN_instanceValidated).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Collect phase
// ---------------------------------------------------------------------------

describe('Fabric commit hook — collect phase (tag 5 / HostComponent)', () => {
  it('collects a fiber and calls applyFSPropertiesToInstance on drain', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();
    const stateNode = { id: 'view' };

    runFibers(sandbox, [{ tag: 5, memoizedProps: { fsClass: 'Foo' }, stateNode }, { tag: 3 }]);

    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(1);
    expect(applyFSPropertiesToInstance).toHaveBeenCalledWith(stateNode, { fsClass: 'Foo' });
  });

  it.each([
    'fsClass',
    'fsAttribute',
    'fsTagName',
    'dataElement',
    'dataComponent',
    'dataSourceFile',
  ])('collects a fiber with %s prop', prop => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();
    runFibers(sandbox, [{ tag: 5, memoizedProps: { [prop]: 'value' }, stateNode: {} }, { tag: 3 }]);
    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(1);
  });

  it('does not collect a tag-5 fiber with no FS props', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();
    runFibers(sandbox, [
      { tag: 5, memoizedProps: { testID: 'x', style: {} }, stateNode: {} },
      { tag: 3 },
    ]);
    expect(applyFSPropertiesToInstance).not.toHaveBeenCalled();
  });

  it.each([0, 1, 6, 11, 14])('ignores fibers with tag %d (non-HostComponent)', tag => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();
    runFibers(sandbox, [{ tag, memoizedProps: { fsClass: 'X' }, stateNode: {} }, { tag: 3 }]);
    expect(applyFSPropertiesToInstance).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Command count and drain ordering
// ---------------------------------------------------------------------------

describe('Fabric commit hook — command count and drain ordering', () => {
  it('calls applyFSPropertiesToInstance exactly once per FS-annotated fiber', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();

    runFibers(sandbox, [
      { tag: 5, memoizedProps: { fsClass: 'A' }, stateNode: { id: 1 } },
      { tag: 5, memoizedProps: { dataComponent: 'B' }, stateNode: { id: 2 } },
      { tag: 5, memoizedProps: { fsTagName: 'section' }, stateNode: { id: 3 } },
      { tag: 5, memoizedProps: { style: {} }, stateNode: { id: 4 } }, // no FS props — skipped
      { tag: 3 },
    ]);

    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(3);
  });

  it('does not drain before tag-3 fires', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();

    sandbox.commitMutationEffectsOnFiber(
      { tag: 5, memoizedProps: { fsClass: 'X' }, stateNode: {} },
      {},
    );
    expect(applyFSPropertiesToInstance).not.toHaveBeenCalled();

    sandbox.commitMutationEffectsOnFiber({ tag: 3 }, {});
    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(1);
  });

  it('resets the pending queue after draining so the next commit starts clean', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();

    runFibers(sandbox, [{ tag: 5, memoizedProps: { fsClass: 'A' }, stateNode: {} }, { tag: 3 }]);
    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(1);

    runFibers(sandbox, [{ tag: 5, memoizedProps: { fsClass: 'B' }, stateNode: {} }, { tag: 3 }]);
    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(2);
  });
});

/**
 * These tests don't simulate Fabric's traversal, they reproduce its effect: the hook
 * gets invoked for the same unchanged fibers on every commit, and must not
 * redispatch for them.
 *
 * Out of scope: object/array-valued FS attributes use `!==`, so a new object
 * literal reads as "changed" even if deeply equal.
 */
describe('Fabric commit hook — call-count regression under sibling-fanout (realistic fiber shape)', () => {
  function makeStateNodes() {
    return {
      wrapper: { id: 'wrapper' },
      staticLeaves: Array.from({ length: 20 }, (_, i) => ({ id: `static-leaf-${i}` })),
      cyclingLeaf: { id: 'cycling-leaf' },
    };
  }

  // Simulates one commit. `prev` is the fiber set returned by the previous
  // commit() call, or null for the initial mount -- this is what determines
  // whether `alternate` is null (mount) or points at the fiber actually
  // committed last time (update), matching real React double-buffering.
  // Every fiber is passed to commitMutationEffectsOnFiber on every commit,
  // simulating Fabric revisiting the whole subtree whenever anything in it
  // changes -- exactly what happens in a real app whenever the cycling leaf
  // updates.
  function commit(sandbox, stateNodes, prev, cyclingValue) {
    const wrapper = {
      tag: 5,
      memoizedProps: { dataComponent: 'ScreenWrapper' },
      stateNode: stateNodes.wrapper,
      alternate: prev ? prev.wrapper : null,
    };
    const staticLeaves = stateNodes.staticLeaves.map((stateNode, i) => ({
      tag: 5,
      memoizedProps: { fsClass: `static-leaf-${i}` },
      stateNode,
      alternate: prev ? prev.staticLeaves[i] : null,
    }));
    const cyclingLeaf = {
      tag: 5,
      memoizedProps: { dataElement: cyclingValue },
      stateNode: stateNodes.cyclingLeaf,
      alternate: prev ? prev.cyclingLeaf : null,
    };

    runFibers(sandbox, [wrapper, ...staticLeaves, cyclingLeaf, { tag: 3 }]);

    return { wrapper, staticLeaves, cyclingLeaf };
  }

  it('dispatches every fiber once on initial mount', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();
    const stateNodes = makeStateNodes();

    commit(sandbox, stateNodes, null, 'score-0');

    // wrapper + 20 static leaves + 1 cycling leaf
    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(22);
  });

  it('does not redispatch unchanged ancestor/sibling fibers on repeated commits, even though they are revisited every commit', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();
    const stateNodes = makeStateNodes();

    let prev = commit(sandbox, stateNodes, null, 'score-0'); // initial mount
    applyFSPropertiesToInstance.mockClear();

    for (let i = 1; i <= 10; i++) {
      prev = commit(sandbox, stateNodes, prev, `score-${i}`);
    }

    // Only the cycling leaf's own dataElement value actually changes on each
    // of these 10 commits, so it must dispatch every time. The wrapper and
    // all 20 static leaves are revisited on every commit -- as they would be
    // in a real app whenever anything anywhere on screen changes -- but their
    // own FS values never change, so none of them should redispatch.
    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(10);
    for (const call of applyFSPropertiesToInstance.mock.calls) {
      expect(call[0]).toBe(stateNodes.cyclingLeaf);
    }
  });

  it('dispatches again when a static fiber legitimately changes value after being stable for several commits', () => {
    const { sandbox, applyFSPropertiesToInstance } = makeContext();
    const stateNodes = makeStateNodes();

    let prev = commit(sandbox, stateNodes, null, 'score-0');
    prev = commit(sandbox, stateNodes, prev, 'score-1');
    prev = commit(sandbox, stateNodes, prev, 'score-2');
    applyFSPropertiesToInstance.mockClear();

    const wrapper = {
      tag: 5,
      memoizedProps: { dataComponent: 'ScreenWrapper' },
      stateNode: stateNodes.wrapper,
      alternate: prev.wrapper,
    };
    const staticLeaves = stateNodes.staticLeaves.map((stateNode, i) => ({
      tag: 5,
      memoizedProps: { fsClass: i === 0 ? 'now-different' : `static-leaf-${i}` },
      stateNode,
      alternate: prev.staticLeaves[i],
    }));
    const cyclingLeaf = {
      tag: 5,
      memoizedProps: { dataElement: 'score-3' },
      stateNode: stateNodes.cyclingLeaf,
      alternate: prev.cyclingLeaf,
    };

    runFibers(sandbox, [wrapper, ...staticLeaves, cyclingLeaf, { tag: 3 }]);

    // Only the fiber whose value actually changed (plus the always-changing
    // cycling leaf) should dispatch -- the wrapper and the other 19 untouched
    // static leaves must still be skipped.
    expect(applyFSPropertiesToInstance).toHaveBeenCalledTimes(2);
    const dispatchedNodes = applyFSPropertiesToInstance.mock.calls.map(call => call[0]);
    expect(dispatchedNodes).toEqual(
      expect.arrayContaining([staticLeaves[0].stateNode, cyclingLeaf.stateNode]),
    );
  });
});
