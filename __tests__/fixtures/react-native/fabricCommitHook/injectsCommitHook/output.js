function getPublicInstance(instance) {
  return instance;
}
function commitMutationEffectsOnFiber(finishedWork, root) {
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
  if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook === undefined) {
    const { Platform } = require('react-native');
    global.__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook =
      (global.RN$Bridgeless || global.__turboModuleProxy != null) &&
      Platform.OS === 'ios' &&
      !Platform.isTV;
  }
  if (global.__FULLSTORY_BABEL_PLUGIN_shouldInjectFSCommitHook) {
    if (finishedWork.tag === 5) {
      // Collect host fibers with FS attributes.
      // ReactWorkTags.HostComponent === 5 — the only fiber tag in React Native
      // whose stateNode is a Fabric ShadowNode resolvable via getPublicInstance.
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