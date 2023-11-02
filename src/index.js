import * as babylon from '@babel/parser';
import * as t from '@babel/types';
import { isReactCreateElementCall } from './isReactCreateElement';

const applyFSPropertiesWithRef = 'applyFSPropertiesWithRef';
const elements = [
  'View',
  'Text',
  'Image',
  'TextInput',
  'ScrollView',
  'Button',
  'Switch',
  'FlatList',
  'SectionList',
];

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

function isReactFragment(openingElement) {
  if (openingElement.isJSXFragment()) {
    return true;
  }

  if (!openingElement.node || !openingElement.node.name) return;

  if (
    openingElement.node.name.name === 'Fragment' ||
    openingElement.node.name.name === 'React.Fragment'
  )
    return true;

  if (
    !openingElement.node.name.type ||
    !openingElement.node.name.object ||
    !openingElement.node.name.property
  )
    return;

  return (
    openingElement.node.name.type === 'JSXMemberExpression' &&
    openingElement.node.name.object.name === 'React' &&
    openingElement.node.name.property.name === 'Fragment'
  );
}

function extendExistingRef(path) {
  // process existing ref value
  if (path.node.name.name === 'ref') {
    // ignore if the ref value is already applyFSPropertiesWithRef
    if (
      t.isJSXExpressionContainer(path.node.value) &&
      !(
        t.isCallExpression(path.node.value.expression) &&
        path.node.value.expression.callee.name === applyFSPropertiesWithRef
      )
    ) {
      // only process refs on base components and applyFSPropertiesWithRef must be imported
      if (
        !elements.includes(path.parent.name.name) ||
        !path.scope.hasBinding(applyFSPropertiesWithRef)
      )
        return;

      const originalRef = path.node.value.expression;

      path.replaceWith(
        t.jsxAttribute(
          t.jsxIdentifier('ref'),
          t.JSXExpressionContainer(
            t.CallExpression(t.identifier(applyFSPropertiesWithRef), [originalRef]),
          ),
        ),
      );
    }
  }
}

/* eslint-disable complexity */
export default function ({ types: t }) {
  return {
    name: 'fullstory-react-native',
    visitor: {
      /* Looks like we don't currently need to add this to the interface declaration
      InterfaceDeclaration(path, state) {
        fixUIManagerJSInterface(path);
      }, */

      Program: {
        enter(path, { file, opts }) {
          if (opts.isNewArchitectureEnabled) {
            const hasReactNativeOrReact = path.node.body.some(x => {
              return (
                t.isImportDeclaration(x) &&
                (x.source.value === 'react-native' || x.source.value === 'react')
              );
            });
            // Do nothing if applyFSPropertiesWithRef is already declared
            // React Native needs to be in scope
            if (path.scope.hasBinding(applyFSPropertiesWithRef) || !hasReactNativeOrReact) {
              return;
            }

            // create applyFSPropertiesWithRef import statement
            const applyFSImportStatement = t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier(applyFSPropertiesWithRef),
                  t.identifier(applyFSPropertiesWithRef),
                ),
              ],
              t.stringLiteral('@fullstory/react-native'),
            );

            // add import statement to top of file
            const [newPath] = path.unshiftContainer('body', applyFSImportStatement);

            // register import in scope
            newPath.get('specifiers').forEach(specifier => {
              path.scope.registerBinding('module', specifier);
            });

            // save import node in state
            file.set('ourPath', newPath);

            // Add a placeholder variable bount to applyFSPropertiesWithRef to prevent
            // unused variable deletion from other plugins (@babel/plugin-transform-typescript)
            const placeholder = t.variableDeclaration('let', [
              t.variableDeclarator(
                t.identifier('handle'),
                t.toExpression(t.identifier(applyFSPropertiesWithRef)),
              ),
            ]);

            const [placeholderPath] = path.pushContainer('body', placeholder);
            path.scope.registerDeclaration(placeholderPath);

            // save for deletion later
            file.set('placeholder', placeholderPath);

            // update scope reference paths
            path.scope.crawl();
          }
        },

        exit(_, { file, opts }) {
          if (!opts.isNewArchitectureEnabled) return;

          // delete placeholder variable
          const placeholder = file.get('placeholder');

          if (placeholder) {
            placeholder.remove();
          }

          // If our import is still intact and we haven't encountered any JSX in
          // the program, then we just remove it. There's an edge case, where
          // some other plugin could add JSX in its `Program.exit`, so our
          // `JSXOpeningElement` will trigger only after this method
          const ourPath = file.get('ourPath');
          if (ourPath && !file.get('hasJSX')) {
            if (!ourPath.removed) {
              ourPath.remove();
            }
            file.set('ourPath', undefined);
          }
        },
      },
      CallExpression(path, { file, opts }) {
        if (!opts.isNewArchitectureEnabled) return;

        if (
          isReactCreateElementCall(path) &&
          path.node.arguments.length >= 2 &&
          t.isIdentifier(path.node.arguments[0])
        ) {
          // check if we support rewrite on this element
          if (elements.includes(path.node.arguments[0].name)) {
            const props = path.node.arguments[1];

            if (t.isObjectExpression(props)) {
              const hasRef = props.properties.some(attribute => {
                return attribute.key?.name === 'ref';
              });

              if (!hasRef) {
                props.properties.push(
                  t.objectProperty(
                    t.identifier('ref'),
                    t.CallExpression(t.identifier(applyFSPropertiesWithRef), []),
                  ),
                );
                file.set('hasJSX', true);
              }
            }
          }
        }
      },
      ImportDeclaration(path, { file, opts }) {
        if (!opts.isNewArchitectureEnabled) return;

        // check if applyFSPropertiesWithRef is imported
        if (
          path.node.specifiers.every(x => {
            return x.local.name !== 'applyFSPropertiesWithRef';
          })
        ) {
          return;
        }

        // If our import is still intact and we encounter some other import
        // which also imports `applyFSPropertiesWithRef`, then we remove ours.
        const ourPath = file.get('ourPath');
        if (ourPath && path !== ourPath) {
          if (!ourPath.removed) {
            ourPath.remove();
          }
          file.set('ourPath', undefined);
        }
      },

      JSXOpeningElement(path, { file, opts }) {
        if (!opts.isNewArchitectureEnabled) return;
        // do not annotate fragments
        if (isReactFragment(path)) return;

        // only annotate specific base components
        if (!elements.includes(path.node.name.name)) return;

        // only annotate when applyFSPropertiesWithRef is in scope
        if (!path.scope.hasBinding(applyFSPropertiesWithRef)) return;

        file.set('hasJSX', true);

        // check if Component has any `ref` value
        const hasRef = path.get('attributes').some(attribute => {
          return attribute.node.name?.name === 'ref';
        });

        if (!hasRef) {
          // create a new `ref` value
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('ref'),
              t.JSXExpressionContainer(
                t.CallExpression(t.identifier(applyFSPropertiesWithRef), []),
              ),
            ),
          );
        }
      },

      ClassDeclaration(path, state) {
        fixPressability(t, path);
      },
      VariableDeclaration(path, state) {
        fixReactNativeViewConfig(path);
        fixReactNativeViewAttributes(path);
        fixTouchableMixin(t, path);
      },
      JSXAttribute(path, { opts }) {
        if (opts.isNewArchitectureEnabled) {
          extendExistingRef(path);
        }

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
            t.isJSXIdentifier(attribute.name, { name: 'viewID' }) ||
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
