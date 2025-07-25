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
  const { Platform } = require('react-native');
  const SUPPORTED_FS_ATTRIBUTES = [
    'fsClass',
    'fsAttribute',
    'fsTagName',
    'dataElement',
    'dataComponent',
    'dataSourceFile',
  ];
  const isTurboModuleEnabled = global.RN$Bridgeless || global.__turboModuleProxy != null;
  if (isTurboModuleEnabled && Platform.OS === 'ios') {
    if (
      c.$$typeof &&
      (c.$$typeof.toString() === 'Symbol(react.forward_ref)' ||
        c.$$typeof.toString() === 'Symbol(react.element)' ||
        c.$$typeof.toString() === 'Symbol(react.transitional.element)')
    ) {
      if (d) {
        const propContainsFSAttribute = SUPPORTED_FS_ATTRIBUTES.some(fsAttribute => {
          if (!!props[fsAttribute]) {
            if (fsAttribute === 'fsAttribute') {
              return typeof props[fsAttribute] === 'object';
            } else {
              return typeof props[fsAttribute] === 'string';
            }
          }
          return false;
        });
        if (propContainsFSAttribute) {
          const fs = require('@fullstory/react-native');
          h = fs.applyFSPropertiesWithRef(h);
        }
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