"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var babylon = _interopRequireWildcard(require("@babel/parser"));
var t = _interopRequireWildcard(require("@babel/types"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// Compute React version ONCE at build time (when Babel plugin loads)
var IS_REACT_19_PLUS = function () {
  try {
    var _require = require('react'),
      version = _require.version;
    if (version) {
      var majorVersion = parseInt(version.split('.')[0], 10);
      return majorVersion >= 19;
    }
  } catch (_unused) {}
  // fallback to React 18
  return false;
}();
var setRefBackwardCompat = function setRefBackwardCompat(refIdentifier, propsIdentifier, moduleRef, hasDynamicAttribute) {
  if (refIdentifier) {
    // React versions < 19
    return "".concat(refIdentifier, " = ").concat(moduleRef, ".applyFSPropertiesWithRef(").concat(refIdentifier, ", ").concat(hasDynamicAttribute, ");");
  }
  // React versions >= 19 — synthetic refs are non-enumerable to prevent leaking through {...rest} spreads
  return "if (".concat(propsIdentifier, "['ref']) {\n  ").concat(propsIdentifier, " = { ...").concat(propsIdentifier, ", ref: ").concat(moduleRef, ".applyFSPropertiesWithRef(").concat(propsIdentifier, "['ref'], ").concat(hasDynamicAttribute, ") };\n} else {\n  ").concat(propsIdentifier, " = Object.defineProperty({ ...").concat(propsIdentifier, " }, 'ref', { value: ").concat(moduleRef, ".applyFSPropertiesWithRef(").concat(propsIdentifier, "['ref'], ").concat(hasDynamicAttribute, "), enumerable: false, configurable: true });\n}");
};

// We only add our ref to all Symbol(react.forward_ref) and Symbol(react.element) types, since they support refs
var _createFabricRefCode = function _createFabricRefCode(refIdentifier, typeIdentifier, propsIdentifier) {
  return "\nif (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef === undefined) {\n  const { Platform } = require('react-native');\n  global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef = (global.RN$Bridgeless || global.__turboModuleProxy != null) && Platform.OS === 'ios' && !Platform.isTV;\n}\nif (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectRef) {\n  const typeSymbol = ".concat(typeIdentifier, ".$$typeof;\n  const typeString = typeSymbol ? typeSymbol.toString() : '';\n  const isValidType = ").concat(IS_REACT_19_PLUS, " || (typeString === 'Symbol(react.forward_ref)' || typeString === 'Symbol(react.element)' || typeString === 'Symbol(react.transitional.element)');\n  if (isValidType && ").concat(propsIdentifier, ") {\n    const hasFSDynamicAttribute = !!(").concat(propsIdentifier, ".fsClass || ").concat(propsIdentifier, ".fsAttribute || ").concat(propsIdentifier, ".fsTagName);\n    const hasFSStaticAttribute = !!(").concat(propsIdentifier, ".dataElement || ").concat(propsIdentifier, ".dataComponent || ").concat(propsIdentifier, ".dataSourceFile);\n    const hasFSAttribute = hasFSDynamicAttribute || hasFSStaticAttribute;\n    if (hasFSAttribute) {\n      if (!global.__FULLSTORY_BABEL_PLUGIN_module) {\n        global.__FULLSTORY_BABEL_PLUGIN_module = require('@fullstory/react-native');\n      }\n      ").concat(setRefBackwardCompat(refIdentifier, propsIdentifier, 'global.__FULLSTORY_BABEL_PLUGIN_module', 'hasFSDynamicAttribute'), "\n    }\n  }\n}");
};

// This is the code that we will generate for Pressability.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
var _onFsPressForward_PressabilityCode = "_onFsPressForward_Pressability = function(isLongPress) {\n  if (this._responderID == null) {\n    return;\n  }\n\n  var nativeTag = null;\n  if (typeof this._responderID === 'number') {\n    nativeTag = this._responderID;\n  } else if (typeof this._responderID === 'object') {\n    if (typeof this._responderID._nativeTag === 'number') {\n      nativeTag = this._responderID._nativeTag;\n    } else if (typeof this._responderID.__nativeTag === 'number') {\n      nativeTag = this._responderID.__nativeTag;\n    }\n  }\n\n  if (nativeTag == null) {\n    return;\n  }\n\n  const { onLongPress, onPress } = this._config;\n\n  var hasPress = !!onPress;\n  var hasLongPress = !!onLongPress;\n\n  try {\n    if (UIManager && UIManager.onFsPressForward) {\n      UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);\n      return;\n    }\n  } catch (e) {}\n\n  try {\n    var FullStory = require(\"@fullstory/react-native\");\n    if (FullStory && FullStory.PrivateInterface && FullStory.PrivateInterface.onFSPressForward) {\n      FullStory.PrivateInterface.onFSPressForward(nativeTag, isLongPress, hasPress, hasLongPress);\n      return;\n    }\n  } catch (e) {}\n}";
var _onFsPressForwardCallLongPress_PressabilityCode = "this._onFsPressForward_Pressability(true)";
var _onFsPressForwardCallPress_PressabilityCode = "this._onFsPressForward_Pressability(false)";

// This is the code that we will generate for Touchable.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
var _onFsPressForwardCode = "_onFsPressForward = function(isLongPress) {\n  const tag = this.state.touchable.responderID;\n  if (tag == null) {\n    return;\n  }\n\n  var nativeTag = null;\n  if (typeof tag === 'number') {\n    nativeTag = tag;\n  } else if (typeof tag === 'object') {\n    if (typeof tag._nativeTag === 'number') {\n      nativeTag = tag._nativeTag;\n    } else if (typeof tag.nativeID === 'number') {\n      nativeTag = tag.nativeID;\n    }\n  }\n\n  if (nativeTag == null) {\n    return;\n  }\n\n  var hasPress = !!this.props.onPress;\n  var hasLongPress = !!this.props.onLongPress;\n  try {\n    if (UIManager && UIManager.onFsPressForward) {\n      UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);\n      return;\n    }\n  } catch (e) {}\n\n  try {\n    var FullStory = require(\"@fullstory/react-native\");\n    if (FullStory && FullStory.PrivateInterface && FullStory.PrivateInterface.onFSPressForward) {\n      FullStory.PrivateInterface.onFSPressForward(nativeTag, isLongPress, hasPress, hasLongPress);\n      return;\n    }\n  } catch (e) {}\n}";
var _onFsPressForwardCallLongPressCode = "this._onFsPressForward(true)";
var _onFsPressForwardCallPressCode = "this._onFsPressForward(false)";
var _onFsPressForwardAst = babylon.parseExpression(_onFsPressForwardCode, {});
var _onFsPressForwardCallLongPressAst = babylon.parseExpression(_onFsPressForwardCallLongPressCode, {});
var _onFsPressForwardCallPressAst = babylon.parseExpression(_onFsPressForwardCallPressCode, {});

// just for testing
function safeStringify(obj) {
  var indent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
  var cache = [];
  var retVal = JSON.stringify(obj, function (key, value) {
    return _typeof(value) === 'object' && value !== null ? cache.includes(value) ? undefined // Duplicate reference found, discard key
    : cache.push(value) && value // Store value in our collection
    : value;
  }, indent);
  cache = null;
  return retVal;
}
function addFullStoryPressHandlerDeclaration(props) {
  var prop = {};
  prop.type = 'ObjectProperty';
  prop.key = t.identifier('onFsPressForward');
  prop.value = {};
  prop.value.type = 'FunctionTypeAnnotation';
  prop.value.params = [];
  prop.value.params.push(t.functionTypeParam(t.identifier('reactTag'), t.numberTypeAnnotation()));
  prop.value.params.push(t.functionTypeParam(t.identifier('isLongPress'), t.booleanTypeAnnotation()));
  prop.value.params.push(t.functionTypeParam(t.identifier('hasPressHandler'), t.booleanTypeAnnotation()));
  prop.value.params.push(t.functionTypeParam(t.identifier('hasLongPressHandler'), t.booleanTypeAnnotation()));
  prop.value.rest = null;
  prop.value.returnType = t.voidTypeAnnotation();
  prop.value.typeParameters = null;
  prop.optional = false;
  prop.static = false;
  prop.variance = null;
  props.push(prop);
}
function addFullStoryProperties(properties) {
  // add fsAttribute
  properties.push(t.objectProperty(t.identifier('fsAttribute'), t.booleanLiteral(true)));

  // add fsClass
  properties.push(t.objectProperty(t.identifier('fsClass'), t.booleanLiteral(true)));

  // add fsTagName
  properties.push(t.objectProperty(t.identifier('fsTagName'), t.booleanLiteral(true)));

  // add dataComponent
  properties.push(t.objectProperty(t.identifier('dataComponent'), t.booleanLiteral(true)));

  // add dataElement
  properties.push(t.objectProperty(t.identifier('dataElement'), t.booleanLiteral(true)));

  // add dataSourceFile
  properties.push(t.objectProperty(t.identifier('dataSourceFile'), t.booleanLiteral(true)));
}
function fixReactNativeViewConfig(path) {
  // make sure that this path has a node with a declarations array of size 1
  if (!path.node.declarations || path.node.declarations.length !== 1) {
    return;
  }
  var declaration = path.node.declarations[0];
  // validate that there is a name node and its value is what we expect
  if (!declaration.id || !declaration.id.name || declaration.id.name !== 'ReactNativeViewConfig' && declaration.id.name !== 'PlatformBaseViewConfigIos' && declaration.id.name !== 'PlatformBaseViewConfigAndroid') {
    return;
  }

  // make sure that the declaration has an init node with a properties array
  if (!declaration.init || !declaration.init.properties || !declaration.init.properties.length) {
    return;
  }
  var props = declaration.init.properties;
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    if (!prop.key || prop.key.name !== 'validAttributes') {
      continue;
    }

    // make sure this has a value node and is an array
    if (!prop.value || !prop.value.properties || !prop.value.properties.length) {
      continue;
    }

    // we found `validAttributes`, so this is most likely the declaration we are searching for
    addFullStoryProperties(prop.value.properties);
    break;
  }
}
function fixReactNativeViewAttributes(path) {
  // make sure that this path has a node with a declarations array of size 1
  if (!path.node.declarations || path.node.declarations.length !== 1) {
    return;
  }
  var declaration = path.node.declarations[0];
  // validate that there is a name node and its value is what we expect
  if (!declaration.id || !declaration.id.name || declaration.id.name !== 'UIView') {
    return;
  }

  // make sure that the declaration has an init node with a properties array
  if (!declaration.init || !declaration.init.properties || !declaration.init.properties.length) {
    return;
  }
  var props = declaration.init.properties;
  for (var i = 0; i < props.length; i++) {
    var prop = props[i];
    if (!prop.key || prop.key.name !== 'testID') {
      continue;
    }

    // we found `testID`, so this is most likely the declaration we are searching for
    addFullStoryProperties(declaration.init.properties);
    break;
  }
}
function fixUIManagerJSInterface(path) {
  // make sure that this path has a node with an id named what we expect
  if (!path.node || !path.node.id || !path.node.id.name || path.node.id.name !== 'UIManagerJSInterface') {
    return;
  }

  // make sure that the path has a body node with a properties array
  if (!path.node.body || !path.node.body.properties || !path.node.body.properties.length) {
    return;
  }
  for (var i = 0; i < path.node.body.properties.length; i++) {
    var key = path.node.body.properties[i].key;
    if (!key || !key.name || key.name !== 'updateView') {
      continue;
    }

    // we found the `updateView` method, so we can be reasonably assured that we are at the right interface declaration
    addFullStoryPressHandlerDeclaration(path.node.body.properties);
    break;
  }
}
function fixPressability(t, path) {
  // make sure that this path has a node with an id named what we expect
  if (!path.node || !path.node.id || !path.node.id.name || path.node.id.name !== 'Pressability') {
    return;
  }

  // make sure that the path has a body node with a body array
  if (!path.node.body || !path.node.body.body || !path.node.body.body || !path.node.body.body.length) {
    return;
  }
  var bodyArray = path.node.body.body;

  // traverse the path's visitor pattern
  path.traverse({
    // test out the Object properties
    ClassMethod: function ClassMethod(classMethodPath) {
      if (classMethodPath.node.key && classMethodPath.node.key.name == '_performTransitionSideEffects') {
        var _onFsPressForward_PressabilityAst = babylon.parseExpression(_onFsPressForward_PressabilityCode, {});
        var _onFsPressForwardCallLongPress_PressabilityAst = babylon.parseExpression(_onFsPressForwardCallLongPress_PressabilityCode, {});
        var _onFsPressForwardCallPress_PressabilityAst = babylon.parseExpression(_onFsPressForwardCallPress_PressabilityCode, {});

        // this method is named `_performTransitionSideEffects`, so traverse the body
        classMethodPath.traverse({
          CallExpression: function CallExpression(callPath) {
            if (t.isIdentifier(callPath.node.callee)) {
              var name = callPath.node.callee.name;
              if (name == 'onLongPress') {
                // get the parent statement and insert the call after
                callPath.getStatementParent().insertAfter(t.expressionStatement(_onFsPressForwardCallLongPress_PressabilityAst));
              } else if (name == 'onPress') {
                // get the parent statement and insert the call after
                callPath.getStatementParent().insertAfter(t.expressionStatement(_onFsPressForwardCallPress_PressabilityAst));
              }
            }
          }
        });

        // now add the new ClassMethod to the bodyArray
        bodyArray.push(t.classMethod('method', t.identifier('_onFsPressForward_Pressability'), _onFsPressForward_PressabilityAst.right.params, _onFsPressForward_PressabilityAst.right.body, false, false));
      } else {
        // skip further processing on this object property
        classMethodPath.skip();
      }
    }
  });
}
function fixTouchableMixin(t, path) {
  // make sure that this path has a node with a declarations array
  if (!path.node || !path.node.declarations || !path.node.declarations.length) {
    return;
  }
  var mixin = null;
  for (var i = 0; i < path.node.declarations.length; i++) {
    var decl = path.node.declarations[i];
    if (decl.id && decl.id.name == 'TouchableMixin') {
      mixin = decl;
      break;
    }
  }

  // validate that the found the TouchableMxin and it contains an init node with a properties array
  if (!mixin || !mixin.init || !mixin.init.properties || !mixin.init.properties.length) {
    return;
  }

  // traverse the path's visitor pattern
  path.traverse({
    // test out the Object properties
    ObjectProperty: function ObjectProperty(mixinPath) {
      // detect if this property is named `_performSideEffectsForTransition`
      if (mixinPath.node.key && mixinPath.node.key.name == '_performSideEffectsForTransition') {
        // traverse the inner path
        mixinPath.traverse({
          // detect the function expression that this is bound to
          FunctionExpression: function FunctionExpression(functionPath) {
            // traverse the inner function expression
            functionPath.traverse({
              CallExpression: function CallExpression(callPath) {
                if (t.isMemberExpression(callPath.node.callee)) {
                  var name = callPath.node.callee.property.name;
                  if (name == 'touchableHandleLongPress') {
                    // get the parent statement and insert the call after
                    callPath.getStatementParent().insertAfter(t.expressionStatement(_onFsPressForwardCallLongPressAst));
                  } else if (name == 'touchableHandlePress') {
                    // get the parent statement and insert the call after
                    callPath.getStatementParent().insertAfter(t.expressionStatement(_onFsPressForwardCallPressAst));
                  }
                }
              }
            });
          }
        });

        // now add the new ObjectProperty to the parent path
        mixin.init.properties.push(t.objectProperty(t.identifier('_onFsPressForward'), _onFsPressForwardAst.right));
      } else {
        // skip further processing on this object property
        mixinPath.skip();
      }
    }
  });
}
function extendReactElementWithRef(path) {
  /* We look in React for when it creates a ReactElement.
   * https://github.com/facebook/react/blob/b2f6365745416be4d7dad7799a2cfbfbbf425389/packages/react/src/jsx/ReactJSXElement.js#L176
    * We identify this by looking for the $$typeof property set on an object and
   * where $$typeof is set to Symbol.for('react.element') or Symbol.for('react.transitional.element')
   * 
   * This is the structure of the element object in React:
   *   const element = {
   *     $$typeof: REACT_ELEMENT_TYPE,
   *     type: type,
   *     key: key,
   *     ref: ref, // this does not exist in React >=19
   *     props: props, // props.ref has the ref in React >=19
   *     _owner: owner,
   */

  // Are we actually looking at the ref: in there, and does it refer to a single variable?
  if (path.node.key.name !== '$$typeof' || !t.isIdentifier(path.node.value)) {
    return;
  }

  // Ensure that the value of $$typeof is a Symbol for 'react.element' or 'react.transitional.element'
  var typeofDeclPath = path.scope.getBinding(path.node.value.name).path;
  if (!t.isVariableDeclarator(typeofDeclPath.node) || !t.isCallExpression(typeofDeclPath.node.init) ||
  // we could validate typeofDeclPath.node.init.callee to make sure it is 'Symbol.for', but life is too long
  typeofDeclPath.node.init.arguments.length != 1 || !t.isStringLiteral(typeofDeclPath.node.init.arguments[0]) || !(typeofDeclPath.node.init.arguments[0].value === 'react.element' || typeofDeclPath.node.init.arguments[0].value === 'react.transitional.element')) {
    return;
  }

  // Need to dynamically grab variable names for variables since minified
  // code will change variable names; this is the lookup for the "var foo"
  // above.
  var typeIdentifierNode = path.parentPath.node.properties.find(function (property) {
    return t.isObjectProperty(property) && property.key.name === 'type';
  });
  var propsIdentifierNode = path.parentPath.node.properties.find(function (property) {
    return t.isObjectProperty(property) && property.key.name === 'props';
  });

  // Doesn't exist in React 19+
  var refIdentifierNode = path.parentPath.node.properties.find(function (property) {
    return t.isObjectProperty(property) && property.key.name === 'ref';
  });
  if (!typeIdentifierNode || !propsIdentifierNode) {
    return;
  }
  var typeIdentifierValueIsIdentifier = t.isIdentifier(typeIdentifierNode.value);
  // variable "type" is a MemberExpression in production code
  var typeIdentifierValueIsMemberExpression = t.isMemberExpression(typeIdentifierNode.value);
  if (!(typeIdentifierValueIsIdentifier || typeIdentifierValueIsMemberExpression) || !t.isIdentifier(propsIdentifierNode.value)) {
    return;
  }
  var typeIdentifier = typeIdentifierValueIsIdentifier ? typeIdentifierNode.value.name : typeIdentifierNode.value.object.name;
  var propsIdentifier = propsIdentifierNode.value.name;
  var refIdentifier = refIdentifierNode && refIdentifierNode.value.name;

  // pass props, type, and ref values to the createFabricRefCode for processing
  // again, these variable identifiers are dynamic due to minification
  var fabricRefCodeAST = babylon.parse(_createFabricRefCode(refIdentifier, typeIdentifier, propsIdentifier));
  path.getStatementParent().insertBefore(fabricRefCodeAST.program.body);
}

/* eslint-disable complexity */
function _default(_ref) {
  var t = _ref.types;
  return {
    visitor: {
      /* Looks like we don't currently need to add this to the interface declaration
      InterfaceDeclaration(path, state) {
        fixUIManagerJSInterface(path);
      }, */
      ClassDeclaration: function ClassDeclaration(path, state) {
        fixPressability(t, path);
      },
      VariableDeclaration: function VariableDeclaration(path, state) {
        fixReactNativeViewConfig(path);
        fixReactNativeViewAttributes(path);
        fixTouchableMixin(t, path);
      },
      ObjectProperty: function ObjectProperty(path, state) {
        var reactFilesRegex = /node_modules\/react\/cjs\/.*\.js$/;
        // only rewrite files in react/cjs directory
        if (reactFilesRegex.test(state.file.opts.filename)) {
          extendReactElementWithRef(path);
        }
      },
      // React Navigation <7.x screen name support
      JSXOpeningElement: function JSXOpeningElement(path, state) {
        var filename = state.file.opts.filename;
        var isReactNavigationFile = filename.includes('node_modules/@react-navigation');
        if (!isReactNavigationFile) {
          return;
        }
        if (!t.isJSXIdentifier(path.node.name)) {
          return;
        }

        // rewrite all `<MaybeScreen />` components.
        var isMaybeScreenView = path.node.name.name === 'MaybeScreen';

        // <Screen /> is a bit more generic so we want to be specific here
        var isNativeStackView = path.node.name.name === 'Screen' && filename.includes('native-stack/src/views/NativeStackView');
        if (isMaybeScreenView || isNativeStackView) {
          path.node.attributes.push(t.jsxAttribute(t.jsxIdentifier('fsAttribute'), t.jsxExpressionContainer(t.objectExpression([t.objectProperty(t.stringLiteral('screen-name'), t.memberExpression(t.identifier('route'), t.identifier('name')))]))));
        }
      },
      // React Navigation 7.x screen name support
      CallExpression: function CallExpression(path, state) {
        var filename = state.file.opts.filename;
        // only process react-navigation files
        if (!filename.includes('node_modules/@react-navigation')) {
          return;
        }

        // Defensive checks for path.node and its properties
        if (!path.node || !path.node.callee || !path.node.arguments || path.node.arguments.length < 2) {
          return;
        }

        // Check if this is a _jsx call
        if (!t.isIdentifier(path.node.callee) || path.node.callee.name !== '_jsx') {
          return;
        }

        // Check if first argument is MaybeScreen
        var maybeScreenComponent = path.node.arguments[0];
        if (!t.isIdentifier(maybeScreenComponent) || maybeScreenComponent.name !== 'MaybeScreen' && maybeScreenComponent.name !== 'ScreenStackItem') {
          return;
        }

        // Check if second argument exists (props object)
        var maybeProps = path.node.arguments[1];
        if (!t.isObjectExpression(maybeProps)) {
          return;
        }

        // Add fsAttribute to the props object
        maybeProps.properties.push(t.objectProperty(t.identifier('fsAttribute'), t.objectExpression([t.objectProperty(t.stringLiteral('screen-name'), t.memberExpression(t.identifier('route'), t.identifier('name')))])));
      },
      JSXAttribute: function JSXAttribute(path) {
        // disable view optimization for only View component
        if (path.parent.name.name !== 'View') return;

        // must be manually annotated with at least one fs attribute
        if (path.node.name.name !== 'fsClass' && path.node.name.name !== 'fsTagName' && path.node.name.name !== 'fsAttribute') {
          return;
        }

        // check if view optimization is already disabled
        // Note: testID is intentionally excluded here. testID prevents the view itself
        // from being removed, but does NOT prevent view flattening.
        var isViewOptimizationDisabled = path.container.some(function (attribute) {
          return t.isJSXIdentifier(attribute.name, {
            name: 'id'
          }) || t.isJSXIdentifier(attribute.name, {
            name: 'nativeID'
          });
        });
        if (isViewOptimizationDisabled) {
          return;
        }
        path.insertAfter(t.jsxAttribute(t.jsxIdentifier('nativeID'), t.stringLiteral('__FS_NATIVEID')));
      }
    }
  };
}