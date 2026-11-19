// Same CJS call shape outside a navigation library must be left alone.
function Scene({ route }) {
  return /*#__PURE__*/ (0, _jsxruntime().jsx)(_reactnativescreens().ScreenStackItem, {
    screenId: route.key,
  });
}