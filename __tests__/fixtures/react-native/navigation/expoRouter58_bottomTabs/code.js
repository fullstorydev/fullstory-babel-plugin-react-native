// MaybeScreen reached through a namespace member, inside a routes.map callback.
function BottomTabView({ state }) {
  return state.routes.map((route, index) => {
    return /*#__PURE__*/ (0, _jsxruntime().jsx)(_ScreenFallback.MaybeScreen, {
      active: index === state.index,
      children: null,
    });
  });
}
