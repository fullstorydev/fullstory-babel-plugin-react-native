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
    // Builds the batch of FS props native needs to change: a value for a prop that is set or
    // changed, null for a prop that lost its value. Unchanged props are left out, because every
    // native setter flushes FullStory's caches for the view and its descendants. Returns null when
    // there is nothing to send. On update (oldProps != null) the data* props are skipped: the
    // babel plugin injects them and they never change after mount.
    // Written as straight-line code on purpose: this runs for every queued fiber, and looping over
    // a key list was measured at ~3x the cost.
    global.__FULLSTORY_BABEL_PLUGIN_buildBatch = function (props, oldProps) {
      var batch = {},
        count = 0;
      if (oldProps == null) {
        if (props.fsClass) {
          batch.fsClass = props.fsClass;
          count++;
        }
        if (props.fsAttribute) {
          batch.fsAttribute = props.fsAttribute;
          count++;
        }
        if (props.fsTagName) {
          batch.fsTagName = props.fsTagName;
          count++;
        }
        if (props.dataElement) {
          batch.dataElement = props.dataElement;
          count++;
        }
        if (props.dataComponent) {
          batch.dataComponent = props.dataComponent;
          count++;
        }
        if (props.dataSourceFile) {
          batch.dataSourceFile = props.dataSourceFile;
          count++;
        }
      } else {
        if (props.fsClass !== oldProps.fsClass && (props.fsClass || oldProps.fsClass)) {
          batch.fsClass = props.fsClass || null;
          count++;
        }
        if (
          props.fsAttribute !== oldProps.fsAttribute &&
          (props.fsAttribute || oldProps.fsAttribute)
        ) {
          batch.fsAttribute = props.fsAttribute || null;
          count++;
        }
        if (props.fsTagName !== oldProps.fsTagName && (props.fsTagName || oldProps.fsTagName)) {
          batch.fsTagName = props.fsTagName || null;
          count++;
        }
      }
      return count ? batch : null;
    };
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
        // Cheap inline check first; the batch is only built when something differs.
        var __fsDirty =
          __fsOldProps == null
            ? // If there are no old props, we are mounting, so any present FS prop makes the fiber dirty.
              __fsProps.fsClass ||
              __fsProps.fsAttribute ||
              __fsProps.fsTagName ||
              __fsProps.dataElement ||
              __fsProps.dataComponent ||
              __fsProps.dataSourceFile
            : // Otherwise, we are updating, so compare each FS prop. We assume data* props do not change after mount.
              __fsProps.fsClass !== __fsOldProps.fsClass ||
              __fsProps.fsAttribute !== __fsOldProps.fsAttribute ||
              __fsProps.fsTagName !== __fsOldProps.fsTagName;
        if (__fsDirty) {
          var __fsBatch = global.__FULLSTORY_BABEL_PLUGIN_buildBatch(__fsProps, __fsOldProps);
          if (__fsBatch) {
            (
              global.__FULLSTORY_FS_PENDING_HOSTS || (global.__FULLSTORY_FS_PENDING_HOSTS = [])
            ).push(finishedWork, __fsBatch);
          }
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
        // The queue is flat: [fiber, batch, fiber, batch, ...]
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