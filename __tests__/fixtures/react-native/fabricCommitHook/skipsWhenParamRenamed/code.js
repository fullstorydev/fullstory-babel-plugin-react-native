function getPublicInstance(instance) {
  return instance;
}

function commitMutationEffectsOnFiber(a, root) {
  recursivelyTraverseMutationEffects(root, a);
  commitReconciliationEffects(a);
}
