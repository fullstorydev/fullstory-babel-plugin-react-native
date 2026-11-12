function getPublicInstance(instance) {
  return instance;
}
function commitMutationEffectsOnFiber(finishedWork, root) {
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
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
          'https://github.com/fullstorydev/fullstory-babel-plugin-react-native/issues',
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
      if (
        global.__FULLSTORY_BABEL_PLUGIN_instanceValidated !== true &&
        finishedWork.stateNode != null
      ) {
        if (getPublicInstance(finishedWork.stateNode) == null) {
          throw new Error(
            '[Fullstory] ReactFabric renderer incompatibility: getPublicInstance ' +
              'returned null for a HostComponent stateNode. The Fabric API may have ' +
              'changed. Please contact Fullstory support.',
          );
        }
        global.__FULLSTORY_BABEL_PLUGIN_instanceValidated = true;
      }
      var __fsProps = finishedWork.memoizedProps;
      var __fsAlt = finishedWork.alternate;
      var __fsOldProps = __fsAlt != null ? __fsAlt.memoizedProps : null;
      if (__fsProps != null && __fsProps !== __fsOldProps) {
        // The props to send are normally the fiber's own props. A prop that went from a value to
        // nothing is absent from the new props, so the callee could not tell it was removed; for
        // that case send a shallow copy where the key is null, which means "clear it".
        var __fsSend = __fsProps;
        var __fsDirty;
        if (__fsOldProps == null) {
          // No old props, so we are mounting: any present FS prop makes the fiber dirty.
          __fsDirty =
            __fsProps.fsClass ||
            __fsProps.fsAttribute ||
            __fsProps.fsTagName ||
            __fsProps.dataElement ||
            __fsProps.dataComponent ||
            __fsProps.dataSourceFile;
        } else {
          // Updating: one comparison per FS prop. A prop that differs makes the fiber dirty, and if
          // it lost its value it is also sent as null. The copy is made on the first removal.
          __fsDirty = false;
          if (__fsProps.fsClass !== __fsOldProps.fsClass) {
            __fsDirty = true;
            if (__fsOldProps.fsClass && !__fsProps.fsClass) {
              if (__fsSend === __fsProps) __fsSend = Object.assign({}, __fsProps);
              __fsSend.fsClass = null;
            }
          }
          if (__fsProps.fsAttribute !== __fsOldProps.fsAttribute) {
            __fsDirty = true;
            if (__fsOldProps.fsAttribute && !__fsProps.fsAttribute) {
              if (__fsSend === __fsProps) __fsSend = Object.assign({}, __fsProps);
              __fsSend.fsAttribute = null;
            }
          }
          if (__fsProps.fsTagName !== __fsOldProps.fsTagName) {
            __fsDirty = true;
            if (__fsOldProps.fsTagName && !__fsProps.fsTagName) {
              if (__fsSend === __fsProps) __fsSend = Object.assign({}, __fsProps);
              __fsSend.fsTagName = null;
            }
          }
          if (__fsProps.dataElement !== __fsOldProps.dataElement) {
            __fsDirty = true;
            if (__fsOldProps.dataElement && !__fsProps.dataElement) {
              if (__fsSend === __fsProps) __fsSend = Object.assign({}, __fsProps);
              __fsSend.dataElement = null;
            }
          }
          if (__fsProps.dataComponent !== __fsOldProps.dataComponent) {
            __fsDirty = true;
            if (__fsOldProps.dataComponent && !__fsProps.dataComponent) {
              if (__fsSend === __fsProps) __fsSend = Object.assign({}, __fsProps);
              __fsSend.dataComponent = null;
            }
          }
          if (__fsProps.dataSourceFile !== __fsOldProps.dataSourceFile) {
            __fsDirty = true;
            if (__fsOldProps.dataSourceFile && !__fsProps.dataSourceFile) {
              if (__fsSend === __fsProps) __fsSend = Object.assign({}, __fsProps);
              __fsSend.dataSourceFile = null;
            }
          }
        }
        if (__fsDirty) {
          (global.__FULLSTORY_FS_PENDING_HOSTS || (global.__FULLSTORY_FS_PENDING_HOSTS = [])).push(
            finishedWork,
            __fsSend,
          );
        }
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
        // The queue is flat: [fiber, props to send, fiber, props to send, ...]
        for (var __fsI = 0; __fsI < __fsPending.length; __fsI += 2) {
          try {
            var __fsStateNode = __fsPending[__fsI].stateNode;
            if (__fsStateNode != null) {
              global.__FULLSTORY_BABEL_PLUGIN_module.applyFSPropertiesToInstance(
                getPublicInstance(__fsStateNode),
                __fsPending[__fsI + 1],
              );
            }
          } catch (e) {}
        }
      }
    }
  }
}