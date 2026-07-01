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
      if (
        __fsProps != null &&
        (__fsProps.fsClass ||
          __fsProps.fsAttribute ||
          __fsProps.fsTagName ||
          __fsProps.dataElement ||
          __fsProps.dataComponent ||
          __fsProps.dataSourceFile)
      ) {
        (global.__FULLSTORY_FS_PENDING_HOSTS || (global.__FULLSTORY_FS_PENDING_HOSTS = [])).push(
          finishedWork,
        );
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
                __fsFiber.memoizedProps,
              );
            }
          } catch (e) {}
        }
      }
    }
  }
}