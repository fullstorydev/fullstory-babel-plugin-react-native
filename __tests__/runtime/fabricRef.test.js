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

  it('injected ref on a custom component is non-enumerable and does not appear in {...rest} spreads', () => {
    // Regression test for: when a custom (non-host) component receives FS attributes,
    // the babel plugin injects a `ref` into its props object. In React 19 props are
    // plain objects, so a regular enumerable `ref` would leak into `{...rest}` spreads
    // and be passed down to host components that don't accept it, breaking the tree.
    // The fix defines the injected `ref` as non-enumerable so it is invisible to spreads.
    const childRef = React.createRef();

    const CustomComponent = props => {
      const { fsClass: _fsClass, ...rest } = props;
      // If `ref` were enumerable it would end up in `rest` and be forwarded to
      // the inner <View>, overriding childRef and causing childRef.current to
      // remain null (or point to the wrong node).
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
