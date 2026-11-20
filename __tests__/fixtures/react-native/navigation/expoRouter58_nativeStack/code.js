// Expo Router SDK 58 ships precompiled CJS: `(0, _jsxruntime().jsx)(_reactnativescreens().ScreenStackItem, {...})`.
function SceneView({ route, focused }) {
  return /*#__PURE__*/ (0, _jsxruntime().jsx)(_native.NavigationProvider, {
    route: route,
    children: /*#__PURE__*/ (0, _jsxruntime().jsx)(_reactnativescreens().ScreenStackItem, {
      screenId: route.key,
      "aria-hidden": !focused,
    }),
  });
}
