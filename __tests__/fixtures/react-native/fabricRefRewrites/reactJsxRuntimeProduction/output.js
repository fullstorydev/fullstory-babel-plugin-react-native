/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

var f = require('react'),
  k = Symbol.for('react.element'),
  l = Symbol.for('react.fragment'),
  m = Object.prototype.hasOwnProperty,
  n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  p = {
    key: !0,
    ref: !0,
    __self: !0,
    __source: !0,
  };
function q(c, a, g) {
  var b,
    d = {},
    e = null,
    h = null;
  void 0 !== g && (e = '' + g);
  void 0 !== a.key && (e = '' + a.key);
  void 0 !== a.ref && (h = a.ref);
  for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
  if (c && c.defaultProps) for (b in ((a = c.defaultProps), a)) void 0 === d[b] && (d[b] = a[b]);
  if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef === undefined) {
    const { Platform } = require('react-native');
    global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef =
      (global.RN$Bridgeless || global.__turboModuleProxy != null) &&
      Platform.OS === 'ios' &&
      !Platform.isTV;
  }
  if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef) {
    const typeSymbol = c.$$typeof;
    const typeString = typeSymbol ? typeSymbol.toString() : '';
    const isValidType =
      false ||
      typeString === 'Symbol(react.forward_ref)' ||
      typeString === 'Symbol(react.element)' ||
      typeString === 'Symbol(react.transitional.element)';
    if (isValidType && d) {
      const hasFSAttribute = !!(
        d.fsClass ||
        d.fsAttribute ||
        d.fsTagName ||
        d.dataElement ||
        d.dataComponent ||
        d.dataSourceFile
      );
      if (hasFSAttribute) {
        if (!global.__FULLSTORY_BABEL_PLUGIN_module) {
          global.__FULLSTORY_BABEL_PLUGIN_module = require('@fullstory/react-native');
        }
        h = global.__FULLSTORY_BABEL_PLUGIN_module.applyFSPropertiesWithRef(h);
      }
    }
  }
  return {
    $$typeof: k,
    type: c,
    key: e,
    ref: h,
    props: d,
    _owner: n.current,
  };
}
exports.Fragment = l;
exports.jsx = q;
exports.jsxs = q;