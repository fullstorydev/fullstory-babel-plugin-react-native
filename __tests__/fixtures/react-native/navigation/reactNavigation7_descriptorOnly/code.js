// drawer >= 7.14: DrawerScene only receives `descriptor`, not `route`.
import * as React from 'react';
import { MaybeScreen } from './ScreenFallback.js';
import { jsx as _jsx } from 'react/jsx-runtime';
const DrawerScene = React.memo(function DrawerScene({ descriptor, isFocused }) {
  return /*#__PURE__*/ _jsx(MaybeScreen, {
    visible: isFocused,
    children: null,
  });
});
function JsxScene({ descriptor, isFocused }) {
  return <MaybeScreen visible={isFocused} />;
}
