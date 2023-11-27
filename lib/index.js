"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var babylon = _interopRequireWildcard(require("@babel/parser"));
var t = _interopRequireWildcard(require("@babel/types"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
// We only add our ref to all Symbol(react.forward_ref) and Symbol(react.element) types, since they support refs
var _createFabricRefCode = function _createFabricRefCode(refIdentifier, typeIdentifier, propsIdentifier) {
  return "\n  const SUPPORTED_FS_ATTRIBUTES = [\n    'fsClass',\n    'fsAttribute',\n    'fsTagName',\n    'dataElement',\n    'dataComponent',\n    'dataSourceFile',\n  ];  \n  if (global.__turboModuleProxy != null && Platform.OS === 'ios') {\n    if (".concat(typeIdentifier, ".$$typeof && (").concat(typeIdentifier, ".$$typeof.toString() === 'Symbol(react.forward_ref)' || ").concat(typeIdentifier, ".$$typeof.toString() === 'Symbol(react.element)')) {\n      if (").concat(propsIdentifier, ") {\n        const propContainsFSAttribute = SUPPORTED_FS_ATTRIBUTES.some(fsAttribute => {\n          return typeof ").concat(propsIdentifier, "[fsAttribute] === 'string' && !!").concat(propsIdentifier, "[fsAttribute];\n        });\n        \n        if (propContainsFSAttribute) {\n          const fs  = require('@fullstory/react-native');\n          ").concat(refIdentifier, " = fs.applyFSPropertiesWithRef(").concat(refIdentifier, ");\n        }\n      }\n    }\n  }");
};

// This is the code that we will generate for Pressability.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
var _onFsPressForward_PressabilityCode = "_onFsPressForward_Pressability = function(isLongPress) {\n  try {\n    if (!UIManager || !UIManager.onFsPressForward) {\n      return;\n    }\n  } catch (e) {\n    return;\n  }\n\n  if (this._responderID == null) {\n    return;\n  }\n\n  var nativeTag = null;\n  if (typeof this._responderID === 'number') {\n    nativeTag = this._responderID;\n  } else if (typeof this._responderID === 'object' && typeof this._responderID._nativeTag === 'number') {\n    nativeTag = this._responderID._nativeTag\n  }\n\n  if (nativeTag == null) {\n    return;\n  }\n\n  const {onLongPress, onPress} = this._config;\n\n  var hasPress = !!onPress;\n  var hasLongPress = !!onLongPress;\n  UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);\n}";
var _onFsPressForwardCallLongPress_PressabilityCode = "this._onFsPressForward_Pressability(true)";
var _onFsPressForwardCallPress_PressabilityCode = "this._onFsPressForward_Pressability(false)";
var _onFsPressForward_PressabilityAst = babylon.parseExpression(_onFsPressForward_PressabilityCode, {});
var _onFsPressForwardCallLongPress_PressabilityAst = babylon.parseExpression(_onFsPressForwardCallLongPress_PressabilityCode, {});
var _onFsPressForwardCallPress_PressabilityAst = babylon.parseExpression(_onFsPressForwardCallPress_PressabilityCode, {});

// This is the code that we will generate for Touchable.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
var _onFsPressForwardCode = "_onFsPressForward = function(isLongPress) {\n  try {\n    if (!UIManager || !UIManager.onFsPressForward) {\n      return;\n    }\n  } catch (e) {\n    return;\n  }\n\n  const tag = this.state.touchable.responderID;\n  if (tag == null) {\n    return;\n  }\n\n  var nativeTag = null;\n  if (typeof tag === 'number') {\n    nativeTag = tag;\n  } else if (typeof tag === 'object' && typeof tag._nativeTag === 'number') {\n    nativeTag = tag._nativeTag\n  }\n\n  if (nativeTag == null) {\n    return;\n  }\n\n  var hasPress = !!this.props.onPress;\n  var hasLongPress = !!this.props.onLongPress;\n  UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);\n}";
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
  /* We're looking for the bit where react actually creates a ReactElement.
   * We identify this by it being an object that has a ref property, and
   * then after that, we verify that there is a $$typeof property that is
   * the magic ReactElement.  i.e., we're looking for a whole object with:
   *
   *   var blah1 = Symbol.for('react.element');
   *   [...]
   *   var blah2;
   *   { $$typeof: blah1, ..., ref: blah2, ... }
   */

  // Are we actually looking at the ref: in there, and does it refer to a single variable?
  if (path.node.key.name !== 'ref' || !t.isIdentifier(path.node.value)) {
    return;
  }

  // Make sure that we have the $$typeof as a sibling, and it has a variable
  // reference as its contents.
  var typeofIdentifierNode = path.parentPath.node.properties.find(function (property) {
    return t.isObjectProperty(property) && property.key.name === '$$typeof';
  });
  if (!typeofIdentifierNode || !t.isIdentifier(typeofIdentifierNode.value)) {
    return;
  }

  // In this case, the typeofDeclPath points to the 'var blah1' declaration
  // in the above snippet; make sure it's of the form we expect it to be.
  var typeofDeclPath = path.scope.getBinding(typeofIdentifierNode.value.name).path;
  if (!t.isVariableDeclarator(typeofDeclPath.node) || !t.isCallExpression(typeofDeclPath.node.init) ||
  // we could validate typeofDeclPath.node.init.callee to make sure it is 'Symbol.for', but life is too long
  typeofDeclPath.node.init.arguments.length != 1 || !t.isStringLiteral(typeofDeclPath.node.init.arguments[0]) || typeofDeclPath.node.init.arguments[0].value != 'react.element') {
    return;
  }

  // Need to dynamically grab variable names for variables since minified
  // code will change variable names; this is the lookup for the "var blah2"
  // above.
  var refIdentifier = path.node.value.name;
  var typeIdentifierNode = path.parentPath.node.properties.find(function (property) {
    return t.isObjectProperty(property) && property.key.name === 'type';
  });
  var propsIdentifierNode = path.parentPath.node.properties.find(function (property) {
    return t.isObjectProperty(property) && property.key.name === 'props';
  });
  var typeIdentifierValueIsIdentifier = t.isIdentifier(typeIdentifierNode.value);
  // variable "type" is a MemberExpression in production code
  var typeIdentifierValueIsMemberExpression = t.isMemberExpression(typeIdentifierNode.value);
  if (!(typeIdentifierValueIsIdentifier || typeIdentifierValueIsMemberExpression) || !t.isIdentifier(propsIdentifierNode.value)) {
    return;
  }
  var typeIdentifier = typeIdentifierValueIsIdentifier ? typeIdentifierNode.value.name : typeIdentifierNode.value.object.name;
  var propsIdentifier = propsIdentifierNode.value.name;

  // at long last, insert our code before the object declaration
  // https://github.com/facebook/react/blob/bbb9cb116dbf7b6247721aa0c4bcb6ec249aa8af/packages/react/src/ReactElement.js#L149
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
      JSXAttribute: function JSXAttribute(path) {
        // disable view optimization for only View component
        if (path.parent.name.name !== 'View') return;

        // must be manually annotated with at least one fs attribute
        if (path.node.name.name !== 'fsClass' && path.node.name.name !== 'fsTagName' && path.node.name.name !== 'fsAttribute') {
          return;
        }
        var isViewOptimizationDisabled = path.container.some(function (attribute) {
          return t.isJSXIdentifier(attribute.name, {
            name: 'testID'
          }) || t.isJSXIdentifier(attribute.name, {
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