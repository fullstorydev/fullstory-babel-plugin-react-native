// Minimal mock of @fullstory/react-native for runtime tests.
// applyFSPropertiesWithRef must correctly forward any existing ref so that
// ref-related assertions work without requiring the full native FullStory module.
function applyFSPropertiesWithRef(existingRef) {
  function refWrapper(element) {
    if (existingRef) {
      if (typeof existingRef === 'function') {
        existingRef(element);
      } else {
        existingRef.current = element;
      }
    }
  }
  return refWrapper;
}

module.exports = { applyFSPropertiesWithRef };
