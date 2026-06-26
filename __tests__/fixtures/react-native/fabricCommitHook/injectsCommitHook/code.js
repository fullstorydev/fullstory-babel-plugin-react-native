function getPublicInstance(instance) {
  return instance;
}

function commitMutationEffectsOnFiber(finishedWork, root) {
  switch (finishedWork.tag) {
    case 3:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    default:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
  }
}
