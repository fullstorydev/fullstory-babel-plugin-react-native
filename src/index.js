import * as babylon from '@babel/parser';
import * as t from '@babel/types';

// We only add our ref to all Symbol(react.forward_ref) and Symbol(react.element) types, since they support refs
const _createFabricRefCode = (refIdentifier, typeIdentifier, propsIdentifier) => `
  const SUPPORTED_FS_ATTRIBUTES = [
    'fsClass',
    'fsAttribute',
    'fsTagName',
    'dataElement',
    'dataComponent',
    'dataSourceFile',
  ];  
  if (global.__turboModuleProxy != null && Platform.OS === 'ios') {
    if (${typeIdentifier}.$$typeof && (${typeIdentifier}.$$typeof.toString() === 'Symbol(react.forward_ref)' || ${typeIdentifier}.$$typeof.toString() === 'Symbol(react.element)')) {
      if (${propsIdentifier}) {
        const propContainsFSAttribute = SUPPORTED_FS_ATTRIBUTES.some(fsAttribute => {
          return typeof ${propsIdentifier}[fsAttribute] === 'string' && !!${propsIdentifier}[fsAttribute];
        });
        
        const fs  = require('@fullstory/react-native');
        if (propContainsFSAttribute) {
          ${refIdentifier} = fs.applyFSPropertiesWithRef(${refIdentifier});
        }
      }
    }
  }`;

// This is the code that we will generate for Pressability.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
const _onFsPressForward_PressabilityCode = `_onFsPressForward_Pressability = function(isLongPress) {
  try {
    if (!UIManager || !UIManager.onFsPressForward) {
      return;
    }
  } catch (e) {
    return;
  }

  if (this._responderID == null) {
    return;
  }

  var nativeTag = null;
  if (typeof this._responderID === 'number') {
    nativeTag = this._responderID;
  } else if (typeof this._responderID === 'object' && typeof this._responderID._nativeTag === 'number') {
    nativeTag = this._responderID._nativeTag
  }

  if (nativeTag == null) {
    return;
  }

  const {onLongPress, onPress} = this._config;

  var hasPress = !!onPress;
  var hasLongPress = !!onLongPress;
  UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);
}`;
const _onFsPressForwardCallLongPress_PressabilityCode = `this._onFsPressForward_Pressability(true)`;
const _onFsPressForwardCallPress_PressabilityCode = `this._onFsPressForward_Pressability(false)`;

const _onFsPressForward_PressabilityAst = babylon.parseExpression(
  _onFsPressForward_PressabilityCode,
  {},
);
const _onFsPressForwardCallLongPress_PressabilityAst = babylon.parseExpression(
  _onFsPressForwardCallLongPress_PressabilityCode,
  {},
);
const _onFsPressForwardCallPress_PressabilityAst = babylon.parseExpression(
  _onFsPressForwardCallPress_PressabilityCode,
  {},
);

// This is the code that we will generate for Touchable.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
const _onFsPressForwardCode = `_onFsPressForward = function(isLongPress) {
  try {
    if (!UIManager || !UIManager.onFsPressForward) {
      return;
    }
  } catch (e) {
    return;
  }

  const tag = this.state.touchable.responderID;
  if (tag == null) {
    return;
  }

  var nativeTag = null;
  if (typeof tag === 'number') {
    nativeTag = tag;
  } else if (typeof tag === 'object' && typeof tag._nativeTag === 'number') {
    nativeTag = tag._nativeTag
  }

  if (nativeTag == null) {
    return;
  }

  var hasPress = !!this.props.onPress;
  var hasLongPress = !!this.props.onLongPress;
  UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);
}`;
const _onFsPressForwardCallLongPressCode = `this._onFsPressForward(true)`;
const _onFsPressForwardCallPressCode = `this._onFsPressForward(false)`;

const _onFsPressForwardAst = babylon.parseExpression(_onFsPressForwardCode, {});
const _onFsPressForwardCallLongPressAst = babylon.parseExpression(
  _onFsPressForwardCallLongPressCode,
  {},
);
const _onFsPressForwardCallPressAst = babylon.parseExpression(_onFsPressForwardCallPressCode, {});

// just for testing
function safeStringify(obj, indent = 2) {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === 'object' && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent,
  );
  cache = null;
  return retVal;
}

function addFullStoryPressHandlerDeclaration(props) {
  const prop = {};
  prop.type = 'ObjectProperty';
  prop.key = t.identifier('onFsPressForward');
  prop.value = {};

  prop.value.type = 'FunctionTypeAnnotation';
  prop.value.params = [];
  prop.value.params.push(t.functionTypeParam(t.identifier('reactTag'), t.numberTypeAnnotation()));
  prop.value.params.push(
    t.functionTypeParam(t.identifier('isLongPress'), t.booleanTypeAnnotation()),
  );
  prop.value.params.push(
    t.functionTypeParam(t.identifier('hasPressHandler'), t.booleanTypeAnnotation()),
  );
  prop.value.params.push(
    t.functionTypeParam(t.identifier('hasLongPressHandler'), t.booleanTypeAnnotation()),
  );

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

  const declaration = path.node.declarations[0];
  // validate that there is a name node and its value is what we expect
  if (
    !declaration.id ||
    !declaration.id.name ||
    (declaration.id.name !== 'ReactNativeViewConfig' &&
      declaration.id.name !== 'PlatformBaseViewConfigIos' &&
      declaration.id.name !== 'PlatformBaseViewConfigAndroid')
  ) {
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

  const declaration = path.node.declarations[0];
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
  if (
    !path.node ||
    !path.node.id ||
    !path.node.id.name ||
    path.node.id.name !== 'UIManagerJSInterface'
  ) {
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
  if (
    !path.node.body ||
    !path.node.body.body ||
    !path.node.body.body ||
    !path.node.body.body.length
  ) {
    return;
  }

  var bodyArray = path.node.body.body;

  // traverse the path's visitor pattern
  path.traverse({
    // test out the Object properties
    ClassMethod(classMethodPath) {
      if (
        classMethodPath.node.key &&
        classMethodPath.node.key.name == '_performTransitionSideEffects'
      ) {
        // this method is named `_performTransitionSideEffects`, so traverse the body
        classMethodPath.traverse({
          CallExpression(callPath) {
            if (t.isIdentifier(callPath.node.callee)) {
              var name = callPath.node.callee.name;
              if (name == 'onLongPress') {
                // get the parent statement and insert the call after
                callPath
                  .getStatementParent()
                  .insertAfter(
                    t.expressionStatement(_onFsPressForwardCallLongPress_PressabilityAst),
                  );
              } else if (name == 'onPress') {
                // get the parent statement and insert the call after
                callPath
                  .getStatementParent()
                  .insertAfter(t.expressionStatement(_onFsPressForwardCallPress_PressabilityAst));
              }
            }
          },
        });

        // now add the new ClassMethod to the bodyArray
        bodyArray.push(
          t.classMethod(
            'method',
            t.identifier('_onFsPressForward_Pressability'),
            _onFsPressForward_PressabilityAst.right.params,
            _onFsPressForward_PressabilityAst.right.body,
            false,
            false,
          ),
        );
      } else {
        // skip further processing on this object property
        classMethodPath.skip();
      }
    },
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
    ObjectProperty(mixinPath) {
      // detect if this property is named `_performSideEffectsForTransition`
      if (mixinPath.node.key && mixinPath.node.key.name == '_performSideEffectsForTransition') {
        // traverse the inner path
        mixinPath.traverse({
          // detect the function expression that this is bound to
          FunctionExpression(functionPath) {
            // traverse the inner function expression
            functionPath.traverse({
              CallExpression(callPath) {
                if (t.isMemberExpression(callPath.node.callee)) {
                  var name = callPath.node.callee.property.name;
                  if (name == 'touchableHandleLongPress') {
                    // get the parent statement and insert the call after
                    callPath
                      .getStatementParent()
                      .insertAfter(t.expressionStatement(_onFsPressForwardCallLongPressAst));
                  } else if (name == 'touchableHandlePress') {
                    // get the parent statement and insert the call after
                    callPath
                      .getStatementParent()
                      .insertAfter(t.expressionStatement(_onFsPressForwardCallPressAst));
                  }
                }
              },
            });
          },
        });

        // now add the new ObjectProperty to the parent path
        mixin.init.properties.push(
          t.objectProperty(t.identifier('_onFsPressForward'), _onFsPressForwardAst.right),
        );
      } else {
        // skip further processing on this object property
        mixinPath.skip();
      }
    },
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
  const typeofIdentifierNode = path.parentPath.node.properties.find(property => {
    return t.isObjectProperty(property) && property.key.name === '$$typeof';
  });
  if (!typeofIdentifierNode || !t.isIdentifier(typeofIdentifierNode.value)) {
    return;
  }

  // In this case, the typeofDeclPath points to the 'var blah1' declaration
  // in the above snippet; make sure it's of the form we expect it to be.
  const typeofDeclPath = path.scope.getBinding(typeofIdentifierNode.value.name).path;
  if (
    !t.isVariableDeclarator(typeofDeclPath.node) ||
    !t.isCallExpression(typeofDeclPath.node.init) ||
    // we could validate typeofDeclPath.node.init.callee to make sure it is 'Symbol.for', but life is too long
    typeofDeclPath.node.init.arguments.length != 1 ||
    !t.isStringLiteral(typeofDeclPath.node.init.arguments[0]) ||
    typeofDeclPath.node.init.arguments[0].value != 'react.element'
  ) {
    return;
  }

  // Need to dynamically grab variable names for variables since minified
  // code will change variable names; this is the lookup for the "var blah2"
  // above.
  const refIdentifier = path.node.value.name;
  const typeIdentifierNode = path.parentPath.node.properties.find(property => {
    return t.isObjectProperty(property) && property.key.name === 'type';
  });
  const propsIdentifierNode = path.parentPath.node.properties.find(property => {
    return t.isObjectProperty(property) && property.key.name === 'props';
  });

  const typeIdentifierValueIsIdentifier = t.isIdentifier(typeIdentifierNode.value);
  // variable "type" is a MemberExpression in production code
  const typeIdentifierValueIsMemberExpression = t.isMemberExpression(typeIdentifierNode.value);

  if (
    !(typeIdentifierValueIsIdentifier || typeIdentifierValueIsMemberExpression) ||
    !t.isIdentifier(propsIdentifierNode.value)
  ) {
    return;
  }
  const typeIdentifier = typeIdentifierValueIsIdentifier
    ? typeIdentifierNode.value.name
    : typeIdentifierNode.value.object.name;
  const propsIdentifier = propsIdentifierNode.value.name;

  // at long last, insert our code before the object declaration
  // https://github.com/facebook/react/blob/bbb9cb116dbf7b6247721aa0c4bcb6ec249aa8af/packages/react/src/ReactElement.js#L149
  const fabricRefCodeAST = babylon.parse(
    _createFabricRefCode(refIdentifier, typeIdentifier, propsIdentifier),
  );
  path.getStatementParent().insertBefore(fabricRefCodeAST.program.body);
}

/* eslint-disable complexity */
export default function ({ types: t }) {
  return {
    visitor: {
      /* Looks like we don't currently need to add this to the interface declaration
      InterfaceDeclaration(path, state) {
        fixUIManagerJSInterface(path);
      }, */
      ClassDeclaration(path, state) {
        fixPressability(t, path);
      },
      VariableDeclaration(path, state) {
        fixReactNativeViewConfig(path);
        fixReactNativeViewAttributes(path);
        fixTouchableMixin(t, path);
      },
      ObjectProperty(path, state) {
        const reactFilesRegex = /node_modules\/react\/cjs\/.*\.js$/;
        // only rewrite files in react/cjs directory
        if (reactFilesRegex.test(state.file.opts.filename)) {
          extendReactElementWithRef(path);
        }
      },
      JSXAttribute(path) {
        // disable view optimization for only View component
        if (path.parent.name.name !== 'View') return;

        // must be manually annotated with at least one fs attribute
        if (
          path.node.name.name !== 'fsClass' &&
          path.node.name.name !== 'fsTagName' &&
          path.node.name.name !== 'fsAttribute'
        ) {
          return;
        }

        const isViewOptimizationDisabled = path.container.some(attribute => {
          return (
            t.isJSXIdentifier(attribute.name, { name: 'testID' }) ||
            t.isJSXIdentifier(attribute.name, { name: 'id' }) ||
            t.isJSXIdentifier(attribute.name, { name: 'nativeID' })
          );
        });

        if (isViewOptimizationDisabled) {
          return;
        }

        path.insertAfter(
          t.jsxAttribute(t.jsxIdentifier('nativeID'), t.stringLiteral('__FS_NATIVEID')),
        );
      },
    },
  };
}
