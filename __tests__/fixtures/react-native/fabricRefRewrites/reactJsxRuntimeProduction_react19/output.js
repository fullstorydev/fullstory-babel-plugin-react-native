/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var REACT_ELEMENT_TYPE = Symbol.for('react.transitional.element'),
  REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
function jsxProd(type, config, maybeKey) {
  var key = null;
  void 0 !== maybeKey && (key = '' + maybeKey);
  void 0 !== config.key && (key = '' + config.key);
  if ('key' in config) {
    maybeKey = {};
    for (var propName in config) 'key' !== propName && (maybeKey[propName] = config[propName]);
  } else maybeKey = config;
  config = maybeKey.ref;
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
      type.$$typeof &&
      (type.$$typeof.toString() === 'Symbol(react.forward_ref)' ||
        type.$$typeof.toString() === 'Symbol(react.element)' ||
        type.$$typeof.toString() === 'Symbol(react.transitional.element)')
    ) {
      if (maybeKey) {
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
          maybeKey = {
            ...maybeKey,
            ref: fs.applyFSPropertiesWithRef(maybeKey['ref']),
          };
        }
      }
    }
  }
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: void 0 !== config ? config : null,
    props: maybeKey,
  };
}
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.jsx = jsxProd;
exports.jsxs = jsxProd;