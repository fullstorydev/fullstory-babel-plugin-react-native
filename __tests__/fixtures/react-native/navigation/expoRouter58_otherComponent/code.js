// Only MaybeScreen and ScreenStackItem get the attribute, and a computed member must not match.
function Scene({ route }) {
  return [
    (0, _jsxruntime().jsx)(_native.NavigationProvider, { route: route }),
    (0, _jsxruntime().jsx)(_ns["MaybeScreen"], { route: route }),
  ];
}
