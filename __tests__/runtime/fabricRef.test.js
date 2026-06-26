import * as React from 'react';
import { render } from '@testing-library/react-native';
import { View, Platform } from 'react-native';

// Reset the plugin's cached shouldInjectRef flag between tests so Platform.OS
// changes take effect.
beforeEach(() => {
  global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef = undefined;
  global.__FULLSTORY_BABEL_PLUGIN_module = undefined;
});

describe('ref injection on iOS new-arch', () => {
  let originalPlatformOS;
  let originalPlatformIsTV;

  beforeAll(() => {
    originalPlatformOS = Platform.OS;
    originalPlatformIsTV = Platform.isTV;
    global.__turboModuleProxy = jest.fn(() => ({}));
    Object.defineProperty(Platform, 'OS', { writable: true, configurable: true, value: 'ios' });
    Object.defineProperty(Platform, 'isTV', { writable: true, configurable: true, value: false });
  });

  afterAll(() => {
    global.__turboModuleProxy = undefined;
    Object.defineProperty(Platform, 'OS', {
      writable: true,
      configurable: true,
      value: originalPlatformOS,
    });
    Object.defineProperty(Platform, 'isTV', {
      writable: true,
      configurable: true,
      value: originalPlatformIsTV,
    });
  });

  it('injected ref propagates through {...props} spread to forwarded child components', () => {
    // Regression test for: HOCs that intentionally forward refs to a single
    // inner component via `{...props}` spread (notably Reanimated's
    // `Animated.createAnimatedComponent`) must see the synthetic ref. Defining
    // it as non-enumerable would silently drop the ref into those HOCs and
    // break downstream scroll-lifecycle callbacks and other ref-dependent
    // behavior on iOS new arch + React 19.
    //
    // Trade-off: consumers who use the `const { ref, ...rest } = props; <Child {...rest} />`
    // pattern can opt out by destructuring `ref` explicitly. See the
    // sibling test below.
    const childRef = React.createRef();

    const HOCComponent = props => {
      // Forwarding pattern used by Animated.createAnimatedComponent and many
      // ref-forwarding HOCs: spread everything (including the synthetic ref)
      // to a single inner host component.
      return <View {...props} />;
    };

    render(<HOCComponent fsClass="hoc-class" ref={childRef} />);

    expect(childRef.current).not.toBeNull();
    expect(childRef.current?._reactInternals?.type).toBe(View);
  });

  it('consumers can opt out of synthetic-ref propagation by destructuring `ref`', () => {
    // Consumers that wrap a host component and don't want the synthetic ref
    // (or any other unknown ref) to reach the host can destructure it out
    // before spreading the remainder.
    const childRef = React.createRef();

    const CustomComponent = props => {
      // Explicitly destructure both `ref` and `fsClass` out of props so they
      // don't leak into `rest`.
      const { ref: _ref, fsClass: _fsClass, ...rest } = props;
      return <View ref={childRef} {...rest} />;
    };

    render(<CustomComponent fsClass="custom-text-class" />);

    expect(childRef.current).not.toBeNull();
    expect(childRef.current?._reactInternals?.type).toBe(View);
  });

  it('does not inject ref when Platform.isTV is true (shouldInjectRef false)', () => {
    const previousIsTV = Platform.isTV;
    try {
      Object.defineProperty(Platform, 'isTV', { writable: true, configurable: true, value: true });

      render(<View fsClass="tv-app-class" />);

      expect(global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef).toBe(false);
      expect(global.__FULLSTORY_BABEL_PLUGIN_module).toBeUndefined();
    } finally {
      Object.defineProperty(Platform, 'isTV', {
        writable: true,
        configurable: true,
        value: previousIsTV,
      });
    }
  });

  it('does not throw when cloneElement runs with a typeless element', () => {
    // React.cloneElement forwards element.type into ReactElement(); a malformed
    // "element" with no `type` passes undefined.
    const fakeElement = { dummy: true, children: [], props: {} };

    expect(() => {
      React.cloneElement(fakeElement, { key: 0 });
    }).not.toThrow();

    expect(global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef).toBe(true);
  });
});
