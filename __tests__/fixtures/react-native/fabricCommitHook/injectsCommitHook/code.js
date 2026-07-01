function getPublicInstance(instance) {
  return instance;
}

function commitMutationEffectsOnFiber(finishedWork, root) {
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}
