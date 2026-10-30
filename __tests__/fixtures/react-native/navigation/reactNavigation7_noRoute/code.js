// Neither `route` nor `descriptor` is in scope: must not reference an unbound `route`.
import * as React from 'react';
import { MaybeScreen } from './ScreenFallback.js';
import { jsx as _jsx } from 'react/jsx-runtime';
function Scene({ isFocused }) {
  return /*#__PURE__*/ _jsx(MaybeScreen, {
    visible: isFocused,
    children: null,
  });
}
function JsxScene({ isFocused }) {
  return <MaybeScreen visible={isFocused} />;
}
