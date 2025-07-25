'use strict';

import {
  getDefaultHeaderHeight,
  getHeaderTitle,
  HeaderBackContext,
  HeaderHeightContext,
  HeaderShownContext,
  SafeAreaProviderCompat,
  useFrameSize,
} from '@react-navigation/elements';
import {
  NavigationContext,
  NavigationRouteContext,
  StackActions,
  usePreventRemoveContext,
  useTheme,
} from '@react-navigation/native';
import * as React from 'react';
import { Animated, Platform, StatusBar, StyleSheet, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenStack, ScreenStackItem } from 'react-native-screens';
import { debounce } from '../utils/debounce.js';
import { getModalRouteKeys } from '../utils/getModalRoutesKeys.js';
import { AnimatedHeaderHeightContext } from '../utils/useAnimatedHeaderHeight.js';
import { useDismissedRouteError } from '../utils/useDismissedRouteError.js';
import { useInvalidPreventRemoveError } from '../utils/useInvalidPreventRemoveError.js';
import { useHeaderConfigProps } from './useHeaderConfigProps.js';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
const ANDROID_DEFAULT_HEADER_HEIGHT = 56;
function isFabric() {
  return 'nativeFabricUIManager' in global;
}
const useNativeDriver = Platform.OS !== 'web';
const SceneView = ({
  index,
  focused,
  shouldFreeze,
  descriptor,
  previousDescriptor,
  nextDescriptor,
  isPresentationModal,
  isPreloaded,
  onWillDisappear,
  onWillAppear,
  onAppear,
  onDisappear,
  onDismissed,
  onHeaderBackButtonClicked,
  onNativeDismissCancelled,
  onGestureCancel,
  onSheetDetentChanged,
}) => {
  const { route, navigation, options, render } = descriptor;
  let {
    animation,
    animationMatchesGesture,
    presentation = isPresentationModal ? 'modal' : 'card',
    fullScreenGestureEnabled,
  } = options;
  const {
    animationDuration,
    animationTypeForReplace = 'push',
    fullScreenGestureShadowEnabled = true,
    gestureEnabled,
    gestureDirection = presentation === 'card' ? 'horizontal' : 'vertical',
    gestureResponseDistance,
    header,
    headerBackButtonMenuEnabled,
    headerShown,
    headerBackground,
    headerTransparent,
    autoHideHomeIndicator,
    keyboardHandlingEnabled,
    navigationBarColor,
    navigationBarTranslucent,
    navigationBarHidden,
    orientation,
    sheetAllowedDetents = [1.0],
    sheetLargestUndimmedDetentIndex = -1,
    sheetGrabberVisible = false,
    sheetCornerRadius = -1.0,
    sheetElevation = 24,
    sheetExpandsWhenScrolledToEdge = true,
    sheetInitialDetentIndex = 0,
    statusBarAnimation,
    statusBarHidden,
    statusBarStyle,
    statusBarTranslucent,
    statusBarBackgroundColor,
    unstable_sheetFooter,
    freezeOnBlur,
    contentStyle,
  } = options;
  if (gestureDirection === 'vertical' && Platform.OS === 'ios') {
    // for `vertical` direction to work, we need to set `fullScreenGestureEnabled` to `true`
    // so the screen can be dismissed from any point on screen.
    // `animationMatchesGesture` needs to be set to `true` so the `animation` set by user can be used,
    // otherwise `simple_push` will be used.
    // Also, the default animation for this direction seems to be `slide_from_bottom`.
    if (fullScreenGestureEnabled === undefined) {
      fullScreenGestureEnabled = true;
    }
    if (animationMatchesGesture === undefined) {
      animationMatchesGesture = true;
    }
    if (animation === undefined) {
      animation = 'slide_from_bottom';
    }
  }

  // workaround for rn-screens where gestureDirection has to be set on both
  // current and previous screen - software-mansion/react-native-screens/pull/1509
  const nextGestureDirection = nextDescriptor?.options.gestureDirection;
  const gestureDirectionOverride =
    nextGestureDirection != null ? nextGestureDirection : gestureDirection;
  if (index === 0) {
    // first screen should always be treated as `card`, it resolves problems with no header animation
    // for navigator with first screen as `modal` and the next as `card`
    presentation = 'card';
  }
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // `modal` and `formSheet` presentations do not take whole screen, so should not take the inset.
  const isModal = presentation === 'modal' || presentation === 'formSheet';

  // Modals are fullscreen in landscape only on iPhone
  const isIPhone = Platform.OS === 'ios' && !(Platform.isPad || Platform.isTV);
  const isParentHeaderShown = React.useContext(HeaderShownContext);
  const parentHeaderHeight = React.useContext(HeaderHeightContext);
  const parentHeaderBack = React.useContext(HeaderBackContext);
  const isLandscape = useFrameSize(frame => frame.width > frame.height);
  const topInset =
    isParentHeaderShown || (Platform.OS === 'ios' && isModal) || (isIPhone && isLandscape)
      ? 0
      : insets.top;
  const defaultHeaderHeight = useFrameSize(frame =>
    Platform.select({
      // FIXME: Currently screens isn't using Material 3
      // So our `getDefaultHeaderHeight` doesn't return the correct value
      // So we hardcode the value here for now until screens is updated
      android: ANDROID_DEFAULT_HEADER_HEIGHT + topInset,
      default: getDefaultHeaderHeight(frame, isModal, topInset),
    }),
  );
  const { preventedRoutes } = usePreventRemoveContext();
  const [headerHeight, setHeaderHeight] = React.useState(defaultHeaderHeight);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const setHeaderHeightDebounced = React.useCallback(
    // Debounce the header height updates to avoid excessive re-renders
    debounce(setHeaderHeight, 100),
    [],
  );
  const hasCustomHeader = header != null;
  let headerHeightCorrectionOffset = 0;
  if (Platform.OS === 'android' && !hasCustomHeader) {
    const statusBarHeight = StatusBar.currentHeight ?? 0;

    // FIXME: On Android, the native header height is not correctly calculated
    // It includes status bar height even if statusbar is not translucent
    // And the statusbar value itself doesn't match the actual status bar height
    // So we subtract the bogus status bar height and add the actual top inset
    headerHeightCorrectionOffset = -statusBarHeight + topInset;
  }
  const rawAnimatedHeaderHeight = useAnimatedValue(defaultHeaderHeight);
  const animatedHeaderHeight = React.useMemo(
    () => Animated.add(rawAnimatedHeaderHeight, headerHeightCorrectionOffset),
    [headerHeightCorrectionOffset, rawAnimatedHeaderHeight],
  );

  // During the very first render topInset is > 0 when running
  // in non edge-to-edge mode on Android, while on every consecutive render
  // topInset === 0, causing header content to jump, as we add padding on the first frame,
  // just to remove it in next one. To prevent this, when statusBarTranslucent is set,
  // we apply additional padding in header only if its true.
  // For more details see: https://github.com/react-navigation/react-navigation/pull/12014
  const headerTopInsetEnabled =
    typeof statusBarTranslucent === 'boolean' ? statusBarTranslucent : topInset !== 0;
  const canGoBack = previousDescriptor != null || parentHeaderBack != null;
  const backTitle = previousDescriptor
    ? getHeaderTitle(previousDescriptor.options, previousDescriptor.route.name)
    : parentHeaderBack?.title;
  const headerBack = React.useMemo(() => {
    if (canGoBack) {
      return {
        href: undefined,
        // No href needed for native
        title: backTitle,
      };
    }
    return undefined;
  }, [canGoBack, backTitle]);
  const isRemovePrevented = preventedRoutes[route.key]?.preventRemove;
  const headerConfig = useHeaderConfigProps({
    ...options,
    route,
    headerBackButtonMenuEnabled:
      isRemovePrevented !== undefined ? !isRemovePrevented : headerBackButtonMenuEnabled,
    headerBackTitle: options.headerBackTitle !== undefined ? options.headerBackTitle : undefined,
    headerHeight,
    headerShown: header !== undefined ? false : headerShown,
    headerTopInsetEnabled,
    headerBack,
  });
  return /*#__PURE__*/ _jsx(NavigationContext.Provider, {
    value: navigation,
    children: /*#__PURE__*/ _jsx(NavigationRouteContext.Provider, {
      value: route,
      children: /*#__PURE__*/ _jsx(
        ScreenStackItem,
        {
          screenId: route.key,
          activityState: isPreloaded ? 0 : 2,
          style: StyleSheet.absoluteFill,
          'aria-hidden': !focused,
          customAnimationOnSwipe: animationMatchesGesture,
          fullScreenSwipeEnabled: fullScreenGestureEnabled,
          fullScreenSwipeShadowEnabled: fullScreenGestureShadowEnabled,
          freezeOnBlur: freezeOnBlur,
          gestureEnabled:
            Platform.OS === 'android'
              ? // This prop enables handling of system back gestures on Android
                // Since we handle them in JS side, we disable this
                false
              : gestureEnabled,
          homeIndicatorHidden: autoHideHomeIndicator,
          hideKeyboardOnSwipe: keyboardHandlingEnabled,
          navigationBarColor: navigationBarColor,
          navigationBarTranslucent: navigationBarTranslucent,
          navigationBarHidden: navigationBarHidden,
          replaceAnimation: animationTypeForReplace,
          stackPresentation: presentation === 'card' ? 'push' : presentation,
          stackAnimation: animation,
          screenOrientation: orientation,
          sheetAllowedDetents: sheetAllowedDetents,
          sheetLargestUndimmedDetentIndex: sheetLargestUndimmedDetentIndex,
          sheetGrabberVisible: sheetGrabberVisible,
          sheetInitialDetentIndex: sheetInitialDetentIndex,
          sheetCornerRadius: sheetCornerRadius,
          sheetElevation: sheetElevation,
          sheetExpandsWhenScrolledToEdge: sheetExpandsWhenScrolledToEdge,
          statusBarAnimation: statusBarAnimation,
          statusBarHidden: statusBarHidden,
          statusBarStyle: statusBarStyle,
          statusBarColor: statusBarBackgroundColor,
          statusBarTranslucent: statusBarTranslucent,
          swipeDirection: gestureDirectionOverride,
          transitionDuration: animationDuration,
          onWillAppear: onWillAppear,
          onWillDisappear: onWillDisappear,
          onAppear: onAppear,
          onDisappear: onDisappear,
          onDismissed: onDismissed,
          onGestureCancel: onGestureCancel,
          onSheetDetentChanged: onSheetDetentChanged,
          gestureResponseDistance: gestureResponseDistance,
          nativeBackButtonDismissalEnabled: false,
          // on Android
          onHeaderBackButtonClicked: onHeaderBackButtonClicked,
          preventNativeDismiss: isRemovePrevented,
          // on iOS
          onNativeDismissCancelled: onNativeDismissCancelled,
          // Unfortunately, because of the bug that exists on Fabric, where native event drivers
          // for Animated objects are being created after the first notifications about the header height
          // from the native side, `onHeaderHeightChange` event does not notify
          // `animatedHeaderHeight` about initial values on appearing screens at the moment.
          onHeaderHeightChange: Animated.event(
            [
              {
                nativeEvent: {
                  headerHeight: rawAnimatedHeaderHeight,
                },
              },
            ],
            {
              useNativeDriver,
              listener: e => {
                if (hasCustomHeader) {
                  // If we have a custom header, don't use native header height
                  return;
                }
                if (
                  Platform.OS === 'android' &&
                  (options.headerBackground != null || options.headerTransparent)
                ) {
                  // FIXME: On Android, we get 0 if the header is translucent
                  // So we set a default height in that case
                  setHeaderHeight(ANDROID_DEFAULT_HEADER_HEIGHT + topInset);
                  return;
                }
                if (
                  e.nativeEvent &&
                  typeof e.nativeEvent === 'object' &&
                  'headerHeight' in e.nativeEvent &&
                  typeof e.nativeEvent.headerHeight === 'number'
                ) {
                  const headerHeight = e.nativeEvent.headerHeight + headerHeightCorrectionOffset;

                  // Only debounce if header has large title or search bar
                  // As it's the only case where the header height can change frequently
                  const doesHeaderAnimate =
                    Platform.OS === 'ios' &&
                    (options.headerLargeTitle || options.headerSearchBarOptions);
                  if (doesHeaderAnimate) {
                    setHeaderHeightDebounced(headerHeight);
                  } else {
                    setHeaderHeight(headerHeight);
                  }
                }
              },
            },
          ),
          contentStyle: [
            presentation !== 'transparentModal' &&
              presentation !== 'containedTransparentModal' && {
                backgroundColor: colors.background,
              },
            contentStyle,
          ],
          headerConfig: headerConfig,
          unstable_sheetFooter: unstable_sheetFooter,
          // When ts-expect-error is added, it affects all the props below it
          // So we keep any props that need it at the end
          // Otherwise invalid props may not be caught by TypeScript
          shouldFreeze: shouldFreeze,
          children: /*#__PURE__*/ _jsx(AnimatedHeaderHeightContext.Provider, {
            value: animatedHeaderHeight,
            children: /*#__PURE__*/ _jsxs(HeaderHeightContext.Provider, {
              value: headerShown !== false ? headerHeight : parentHeaderHeight ?? 0,
              children: [
                headerBackground != null /*#__PURE__*/
                  ? /**
                     * To show a custom header background, we render it at the top of the screen below the header
                     * The header also needs to be positioned absolutely (with `translucent` style)
                     */
                    _jsx(View, {
                      style: [
                        styles.background,
                        headerTransparent ? styles.translucent : null,
                        {
                          height: headerHeight,
                        },
                      ],
                      children: headerBackground(),
                    })
                  : null,
                header != null && headerShown !== false
                  ? /*#__PURE__*/ _jsx(View, {
                      onLayout: e => {
                        const headerHeight = e.nativeEvent.layout.height;
                        setHeaderHeight(headerHeight);
                        rawAnimatedHeaderHeight.setValue(headerHeight);
                      },
                      style: [styles.header, headerTransparent ? styles.absolute : null],
                      children: header({
                        back: headerBack,
                        options,
                        route,
                        navigation,
                      }),
                    })
                  : null,
                /*#__PURE__*/ _jsx(HeaderShownContext.Provider, {
                  value: isParentHeaderShown || headerShown !== false,
                  children: /*#__PURE__*/ _jsx(HeaderBackContext.Provider, {
                    value: headerBack,
                    children: render(),
                  }),
                }),
              ],
            }),
          }),
          fsAttribute: {
            'screen-name': route.name,
          },
        },
        route.key,
      ),
    }),
  });
};
export function NativeStackView({ state, navigation, descriptors, describe }) {
  const { setNextDismissedKey } = useDismissedRouteError(state);
  useInvalidPreventRemoveError(descriptors);
  const modalRouteKeys = getModalRouteKeys(state.routes, descriptors);
  const preloadedDescriptors = state.preloadedRoutes.reduce((acc, route) => {
    acc[route.key] = acc[route.key] || describe(route, true);
    return acc;
  }, {});
  return /*#__PURE__*/ _jsx(SafeAreaProviderCompat, {
    children: /*#__PURE__*/ _jsx(ScreenStack, {
      style: styles.container,
      children: state.routes.concat(state.preloadedRoutes).map((route, index) => {
        const descriptor = descriptors[route.key] ?? preloadedDescriptors[route.key];
        const isFocused = state.index === index;
        const isBelowFocused = state.index - 1 === index;
        const previousKey = state.routes[index - 1]?.key;
        const nextKey = state.routes[index + 1]?.key;
        const previousDescriptor = previousKey ? descriptors[previousKey] : undefined;
        const nextDescriptor = nextKey ? descriptors[nextKey] : undefined;
        const isModal = modalRouteKeys.includes(route.key);
        const isPreloaded =
          preloadedDescriptors[route.key] !== undefined && descriptors[route.key] === undefined;

        // On Fabric, when screen is frozen, animated and reanimated values are not updated
        // due to component being unmounted. To avoid this, we don't freeze the previous screen there
        const shouldFreeze = isFabric()
          ? !isPreloaded && !isFocused && !isBelowFocused
          : !isPreloaded && !isFocused;
        return /*#__PURE__*/ _jsx(
          SceneView,
          {
            index: index,
            focused: isFocused,
            shouldFreeze: shouldFreeze,
            descriptor: descriptor,
            previousDescriptor: previousDescriptor,
            nextDescriptor: nextDescriptor,
            isPresentationModal: isModal,
            isPreloaded: isPreloaded,
            onWillDisappear: () => {
              navigation.emit({
                type: 'transitionStart',
                data: {
                  closing: true,
                },
                target: route.key,
              });
            },
            onWillAppear: () => {
              navigation.emit({
                type: 'transitionStart',
                data: {
                  closing: false,
                },
                target: route.key,
              });
            },
            onAppear: () => {
              navigation.emit({
                type: 'transitionEnd',
                data: {
                  closing: false,
                },
                target: route.key,
              });
            },
            onDisappear: () => {
              navigation.emit({
                type: 'transitionEnd',
                data: {
                  closing: true,
                },
                target: route.key,
              });
            },
            onDismissed: event => {
              navigation.dispatch({
                ...StackActions.pop(event.nativeEvent.dismissCount),
                source: route.key,
                target: state.key,
              });
              setNextDismissedKey(route.key);
            },
            onHeaderBackButtonClicked: () => {
              navigation.dispatch({
                ...StackActions.pop(),
                source: route.key,
                target: state.key,
              });
            },
            onNativeDismissCancelled: event => {
              navigation.dispatch({
                ...StackActions.pop(event.nativeEvent.dismissCount),
                source: route.key,
                target: state.key,
              });
            },
            onGestureCancel: () => {
              navigation.emit({
                type: 'gestureCancel',
                target: route.key,
              });
            },
            onSheetDetentChanged: event => {
              navigation.emit({
                type: 'sheetDetentChange',
                target: route.key,
                data: {
                  index: event.nativeEvent.index,
                  stable: event.nativeEvent.isStable,
                },
              });
            },
          },
          route.key,
        );
      }),
    }),
  });
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 1,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
  },
  translucent: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    zIndex: 1,
    elevation: 1,
  },
  background: {
    overflow: 'hidden',
  },
});