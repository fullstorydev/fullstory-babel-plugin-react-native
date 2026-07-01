import * as babylon from '@babel/parser';
import * as t from '@babel/types';

/*
 * FS Fabric commit-phase instrumentation.
 *
 * Injected at the END of `commitMutationEffectsOnFiber` inside the bundled
 * ReactFabric renderer files (ReactFabric-dev.js / -prod.js / -profiling.js).
 *
 * Two coordinated halves run inside the same block:
 *
 *   COLLECT (when finishedWork.tag === 5 / HostComponent):
 *     Push the fiber onto a global pending list if its memoizedProps carry any
 *     FS attribute (fsClass / fsAttribute / fsTagName / data{Element,Component,
 *     SourceFile}).
 *
 *   DRAIN (when finishedWork.tag === 3 / HostRoot):
 *     Walk the pending list and forward each fiber's public instance + props
 *     to `applyFSPropertiesToInstance` on the SDK, which dispatches a single
 *     batched native command.
 *
 * Why split it this way:
 *   - Fabric is persistent mode. `commitMutationEffectsOnFiber` for HostRoot's
 *     case 3 arm calls `replaceContainerChildren` AFTER it recurses into all
 *     children. `replaceContainerChildren` is what synchronously ships the
 *     shadow tree to native; only after it returns do the underlying native
 *     views exist (or get queued for mount on the native side in command
 *     order).
 *   - If we instead dispatched during the tag-5 traversal (which happens
 *     BEFORE the root's `replaceContainerChildren`), the command would target
 *     nativeTags whose backing views have not been mounted yet.
 *
 * `getPublicInstance` is a top-level function in the same Fabric module scope,
 * so the injected code can call it directly to resolve a fiber's public
 * instance without needing a ref.
 */
const _commitMutationEffectsFSPropertiesCode = `
if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook === undefined) {
  const { Platform } = require('react-native');
  // Verify architectural assumptions once at startup. We throw rather than
  // silently disable: a silent failure means FS privacy attributes (fsClass,
  // fsAttribute, etc.) are never forwarded to the SDK, which could cause PII
  // to appear unmasked in session recordings.
  if (typeof getPublicInstance !== 'function') {
    throw new Error(
      '[Fullstory] ReactFabric renderer incompatibility: getPublicInstance is not ' +
      'defined in this build. Please file an issue at ' +
      'https://github.com/fullstorydev/fullstory-babel-plugin-react-native/issues'
    );
  }
  global.__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook =
    (global.RN$Bridgeless || global.__turboModuleProxy != null) &&
    Platform.OS === 'ios' &&
    !Platform.isTV;
}
if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook) {
  // ReactWorkTags (packages/react-reconciler/src/ReactWorkTags.js, stable since React 16):
  //   HostComponent = 5  — native view primitives (View, Text, Image, …)
  //   HostRoot      = 3  — tree root; fires after the shadow tree is committed to native
  if (finishedWork.tag === 5) {
    // HostComponent: the only fiber type where both conditions hold —
    //   (a) memoizedProps carries user-visible FS attributes (fsClass, etc.)
    //   (b) stateNode is a Fabric Instance resolvable via getPublicInstance()
    //       to a handle accepted by applyFSPropertiesToInstance.
    // Other tags are excluded because they lack native-backed stateNodes

    // Once per bundle lifetime: verify tag-5 stateNodes are resolvable via
    // getPublicInstance.
    if (global.__FULLSTORY_BABEL_PLUGIN_instanceValidated !== true && finishedWork.stateNode != null) {
      if (getPublicInstance(finishedWork.stateNode) == null) {
        throw new Error(
          '[Fullstory] ReactFabric renderer incompatibility: getPublicInstance ' +
          'returned null for a HostComponent stateNode. The Fabric API may have ' +
          'changed. Please contact Fullstory support.'
        );
      }
      global.__FULLSTORY_BABEL_PLUGIN_instanceValidated = true;
    }

    var __fsProps = finishedWork.memoizedProps;
    if (
      __fsProps != null &&
      (__fsProps.fsClass ||
        __fsProps.fsAttribute ||
        __fsProps.fsTagName ||
        __fsProps.dataElement ||
        __fsProps.dataComponent ||
        __fsProps.dataSourceFile)
    ) {
      (
        global.__FULLSTORY_FS_PENDING_HOSTS ||
        (global.__FULLSTORY_FS_PENDING_HOSTS = [])
      ).push(finishedWork);
    }
  } else if (finishedWork.tag === 3) {
    // Drain on HostRoot — replaceContainerChildren has now committed the
    // shadow tree to native, so setBatchProperties commands will land on
    // (or be queued behind) real native views.
    var __fsPending = global.__FULLSTORY_FS_PENDING_HOSTS;
    if (__fsPending && __fsPending.length) {
      global.__FULLSTORY_FS_PENDING_HOSTS = [];
      if (!global.__FULLSTORY_BABEL_PLUGIN_module) {
        global.__FULLSTORY_BABEL_PLUGIN_module = require('@fullstory/react-native');
      }
      for (var __fsI = 0; __fsI < __fsPending.length; __fsI++) {
        try {
          var __fsFiber = __fsPending[__fsI];
          var __fsStateNode = __fsFiber.stateNode;
          if (__fsStateNode != null) {
            global.__FULLSTORY_BABEL_PLUGIN_module.applyFSPropertiesToInstance(
              getPublicInstance(__fsStateNode),
              __fsFiber.memoizedProps
            );
          }
        } catch (e) {}
      }
    }
  }
}
`;

// This is the code that we will generate for Pressability.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
const _onFsPressForward_PressabilityCode = `_onFsPressForward_Pressability = function(isLongPress) {
  if (this._responderID == null) {
    return;
  }

  var nativeTag = null;
  if (typeof this._responderID === 'number') {
    nativeTag = this._responderID;
  } else if (typeof this._responderID === 'object') {
    if (typeof this._responderID._nativeTag === 'number') {
      nativeTag = this._responderID._nativeTag;
    } else if (typeof this._responderID.__nativeTag === 'number') {
      nativeTag = this._responderID.__nativeTag;
    }
  }

  if (nativeTag == null) {
    return;
  }

  const { onLongPress, onPress } = this._config;

  var hasPress = !!onPress;
  var hasLongPress = !!onLongPress;

  try {
    if (UIManager && UIManager.onFsPressForward) {
      UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);
      return;
    }
  } catch (e) {}

  try {
    var FullStory = require("@fullstory/react-native");
    if (FullStory && FullStory.PrivateInterface && FullStory.PrivateInterface.onFSPressForward) {
      FullStory.PrivateInterface.onFSPressForward(nativeTag, isLongPress, hasPress, hasLongPress);
      return;
    }
  } catch (e) {}
}`;
const _onFsPressForwardCallLongPress_PressabilityCode = `this._onFsPressForward_Pressability(true)`;
const _onFsPressForwardCallPress_PressabilityCode = `this._onFsPressForward_Pressability(false)`;

// This is the code that we will generate for Touchable.
// Note that `typeof UIManager` will cause an exception, so we use a try/catch.
const _onFsPressForwardCode = `_onFsPressForward = function(isLongPress) {
  const tag = this.state.touchable.responderID;
  if (tag == null) {
    return;
  }

  var nativeTag = null;
  if (typeof tag === 'number') {
    nativeTag = tag;
  } else if (typeof tag === 'object') {
    if (typeof tag._nativeTag === 'number') {
      nativeTag = tag._nativeTag;
    } else if (typeof tag.nativeID === 'number') {
      nativeTag = tag.nativeID;
    }
  }

  if (nativeTag == null) {
    return;
  }

  var hasPress = !!this.props.onPress;
  var hasLongPress = !!this.props.onLongPress;
  try {
    if (UIManager && UIManager.onFsPressForward) {
      UIManager.onFsPressForward(nativeTag, isLongPress, hasPress, hasLongPress);
      return;
    }
  } catch (e) {}

  try {
    var FullStory = require("@fullstory/react-native");
    if (FullStory && FullStory.PrivateInterface && FullStory.PrivateInterface.onFSPressForward) {
      FullStory.PrivateInterface.onFSPressForward(nativeTag, isLongPress, hasPress, hasLongPress);
      return;
    }
  } catch (e) {}
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

/*
 * Locate `function commitMutationEffectsOnFiber(finishedWork, root) { ... }`
 * inside a ReactFabric renderer file and append the FS commit-phase tracking
 * code at the END of the function body.
 *
 * End-of-function placement is intentional. The hook needs to run AFTER the
 * function's switch statement so that, for HostRoot (tag 3), the case-3 arm
 * has already called `replaceContainerChildren` and committed the shadow tree
 * to the native side. By that point our drain-pending logic can safely call
 * `setBatchProperties` against view tags that exist on (or are queued for) the
 * native mount layer.
 *
 * The function name is stable across React's dev and prod renderer builds
 * (verified in ReactFabric-dev.js, ReactFabric-prod.js, and
 * ReactFabric-profiling.js shipped with react-native), so we can match by
 * identifier rather than structural heuristics.
 */
function instrumentReactFabricCommitMutationEffects(path) {
  if (!path.node.id || path.node.id.name !== 'commitMutationEffectsOnFiber') {
    return;
  }

  // The injected code references `finishedWork` (first param) and
  // `getPublicInstance` (same module scope). Both exist in all ReactFabric
  // bundles; bail defensively if `finishedWork` was renamed under minification.
  const firstParam = path.node.params[0];
  if (!firstParam || !t.isIdentifier(firstParam) || firstParam.name !== 'finishedWork') {
    return;
  }

  const commitHookAST = babylon.parse(_commitMutationEffectsFSPropertiesCode);
  path.get('body').pushContainer('body', commitHookAST.program.body);
}

const REACT_FABRIC_FILE_RE =
  /node_modules\/react-native\/Libraries\/Renderer\/implementations\/ReactFabric-(dev|prod|profiling)\.js$/;

function isReactFabricRendererFile(filename) {
  if (!filename) return false;
  return REACT_FABRIC_FILE_RE.test(filename);
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
      FunctionDeclaration(path, state) {
        // Instrument the Fabric renderer's commit phase to forward FS props to
        // the native side.
        if (isReactFabricRendererFile(state.file.opts.filename)) {
          instrumentReactFabricCommitMutationEffects(path);
        }
      },
      // React Navigation <7.x screen name support
      JSXOpeningElement: function JSXOpeningElement(path, state) {
        const filename = state.file.opts.filename;
        const isReactNavigationFile = filename.includes('node_modules/@react-navigation');
        if (!isReactNavigationFile) {
          return;
        }
        if (!t.isJSXIdentifier(path.node.name)) {
          return;
        }

        // rewrite all `<MaybeScreen />` components.
        const isMaybeScreenView = path.node.name.name === 'MaybeScreen';

        // <Screen /> is a bit more generic so we want to be specific here
        const isNativeStackView =
          path.node.name.name === 'Screen' &&
          filename.includes('native-stack/src/views/NativeStackView');

        if (isMaybeScreenView || isNativeStackView) {
          path.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier('fsAttribute'),
              t.jsxExpressionContainer(
                t.objectExpression([
                  t.objectProperty(
                    t.stringLiteral('screen-name'),
                    t.memberExpression(t.identifier('route'), t.identifier('name')),
                  ),
                ]),
              ),
            ),
          );
        }
      },
      // React Navigation 7.x screen name support
      CallExpression: function CallExpression(path, state) {
        const filename = state.file.opts.filename;
        // only process react-navigation files
        if (!filename.includes('node_modules/@react-navigation')) {
          return;
        }

        // Defensive checks for path.node and its properties
        if (
          !path.node ||
          !path.node.callee ||
          !path.node.arguments ||
          path.node.arguments.length < 2
        ) {
          return;
        }

        // Check if this is a _jsx call
        if (!t.isIdentifier(path.node.callee) || path.node.callee.name !== '_jsx') {
          return;
        }

        // Check if first argument is MaybeScreen
        const maybeScreenComponent = path.node.arguments[0];
        if (
          !t.isIdentifier(maybeScreenComponent) ||
          (maybeScreenComponent.name !== 'MaybeScreen' &&
            maybeScreenComponent.name !== 'ScreenStackItem')
        ) {
          return;
        }

        // Check if second argument exists (props object)
        const maybeProps = path.node.arguments[1];
        if (!t.isObjectExpression(maybeProps)) {
          return;
        }

        // Add fsAttribute to the props object
        maybeProps.properties.push(
          t.objectProperty(
            t.identifier('fsAttribute'),
            t.objectExpression([
              t.objectProperty(
                t.stringLiteral('screen-name'),
                t.memberExpression(t.identifier('route'), t.identifier('name')),
              ),
            ]),
          ),
        );
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

        // check if view optimization is already disabled
        // Note: testID is intentionally excluded here. testID prevents the view itself
        // from being removed, but does NOT prevent view flattening.
        const isViewOptimizationDisabled = path.container.some(attribute => {
          return (
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
