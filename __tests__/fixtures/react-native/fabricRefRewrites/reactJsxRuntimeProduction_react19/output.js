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
  if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef === undefined) {
    const { Platform } = require('react-native');
    global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef =
      (global.RN$Bridgeless || global.__turboModuleProxy != null) && Platform.OS === 'ios';
  }
  if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef) {
    const typeSymbol = type.$$typeof;
    const typeString = typeSymbol ? typeSymbol.toString() : '';
    const isValidType =
      false ||
      typeString === 'Symbol(react.forward_ref)' ||
      typeString === 'Symbol(react.element)' ||
      typeString === 'Symbol(react.transitional.element)';
    if (isValidType && maybeKey) {
      const hasFSAttribute = !!(
        maybeKey.fsClass ||
        maybeKey.fsAttribute ||
        maybeKey.fsTagName ||
        maybeKey.dataElement ||
        maybeKey.dataComponent ||
        maybeKey.dataSourceFile
      );
      if (hasFSAttribute) {
        if (!global.__FULLSTORY_BABEL_PLUGIN_module) {
          global.__FULLSTORY_BABEL_PLUGIN_module = require('@fullstory/react-native');
        }
        maybeKey = {
          ...maybeKey,
          ...(!maybeKey['ref'] && maybeKey['forwardedRef']
            ? {}
            : {
                ref: global.__FULLSTORY_BABEL_PLUGIN_module.applyFSPropertiesWithRef(
                  maybeKey['ref'],
                ),
              }),
        };
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