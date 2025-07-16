'use strict';

import {
  getHeaderTitle,
  Header,
  SafeAreaProviderCompat,
  Screen,
  useFrameSize,
} from '@react-navigation/elements';
import { DrawerActions, StackActions, useLocale, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import useLatestCallback from 'use-latest-callback';
import { addCancelListener } from '../utils/addCancelListener';
import { DrawerPositionContext } from '../utils/DrawerPositionContext.js';
import { DrawerStatusContext } from '../utils/DrawerStatusContext.js';
import { getDrawerStatusFromState } from '../utils/getDrawerStatusFromState.js';
import { DrawerContent } from './DrawerContent.js';
import { DrawerToggleButton } from './DrawerToggleButton.js';
import { MaybeScreen, MaybeScreenContainer } from './ScreenFallback.js';
import { jsx as _jsx } from 'react/jsx-runtime';
const DRAWER_BORDER_RADIUS = 16;
const renderDrawerContentDefault = props =>
  /*#__PURE__*/ _jsx(DrawerContent, {
    ...props,
  });
function DrawerViewBase({
  state,
  navigation,
  descriptors,
  defaultStatus,
  drawerContent = renderDrawerContentDefault,
  detachInactiveScreens = Platform.OS === 'web' ||
    Platform.OS === 'android' ||
    Platform.OS === 'ios',
}) {
  const { direction } = useLocale();
  const focusedRouteKey = state.routes[state.index].key;
  const {
    drawerHideStatusBarOnOpen,
    drawerPosition = direction === 'rtl' ? 'right' : 'left',
    drawerStatusBarAnimation,
    drawerStyle,
    drawerType = Platform.select({
      ios: 'slide',
      default: 'front',
    }),
    configureGestureHandler,
    keyboardDismissMode,
    overlayColor = 'rgba(0, 0, 0, 0.5)',
    swipeEdgeWidth,
    swipeEnabled = Platform.OS !== 'web' && Platform.OS !== 'windows' && Platform.OS !== 'macos',
    swipeMinDistance,
    overlayAccessibilityLabel,
  } = descriptors[focusedRouteKey].options;
  const [loaded, setLoaded] = React.useState([focusedRouteKey]);
  if (!loaded.includes(focusedRouteKey)) {
    setLoaded([...loaded, focusedRouteKey]);
  }
  const previousRouteKeyRef = React.useRef(focusedRouteKey);
  React.useEffect(() => {
    const previousRouteKey = previousRouteKeyRef.current;
    if (
      previousRouteKey !== focusedRouteKey &&
      descriptors[previousRouteKey]?.options.popToTopOnBlur
    ) {
      const prevRoute = state.routes.find(route => route.key === previousRouteKey);
      if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
        navigation.dispatch({
          ...StackActions.popToTop(),
          target: prevRoute.state.key,
        });
      }
    }
    previousRouteKeyRef.current = focusedRouteKey;
  }, [descriptors, focusedRouteKey, navigation, state.routes]);
  const dimensions = useFrameSize(size => size, true);
  const { colors } = useTheme();
  const drawerStatus = getDrawerStatusFromState(state);
  const handleDrawerOpen = useLatestCallback(() => {
    navigation.dispatch({
      ...DrawerActions.openDrawer(),
      target: state.key,
    });
  });
  const handleDrawerClose = useLatestCallback(() => {
    navigation.dispatch({
      ...DrawerActions.closeDrawer(),
      target: state.key,
    });
  });
  const handleGestureStart = useLatestCallback(() => {
    navigation.emit({
      type: 'gestureStart',
      target: state.key,
    });
  });
  const handleGestureEnd = useLatestCallback(() => {
    navigation.emit({
      type: 'gestureEnd',
      target: state.key,
    });
  });
  const handleGestureCancel = useLatestCallback(() => {
    navigation.emit({
      type: 'gestureCancel',
      target: state.key,
    });
  });
  const handleTransitionStart = useLatestCallback(closing => {
    navigation.emit({
      type: 'transitionStart',
      data: {
        closing,
      },
      target: state.key,
    });
  });
  const handleTransitionEnd = useLatestCallback(closing => {
    navigation.emit({
      type: 'transitionEnd',
      data: {
        closing,
      },
      target: state.key,
    });
  });
  React.useEffect(() => {
    if (drawerStatus === defaultStatus || drawerType === 'permanent') {
      return;
    }
    const handleHardwareBack = () => {
      // We shouldn't handle the back button if the parent screen isn't focused
      // This will avoid the drawer overriding event listeners from a focused screen
      if (!navigation.isFocused()) {
        return false;
      }
      if (defaultStatus === 'open') {
        handleDrawerOpen();
      } else {
        handleDrawerClose();
      }
      return true;
    };

    // We only add the listeners when drawer opens
    // This way we can make sure that the listener is added as late as possible
    // This will make sure that our handler will run first when back button is pressed
    return addCancelListener(handleHardwareBack);
  }, [defaultStatus, drawerStatus, drawerType, handleDrawerClose, handleDrawerOpen, navigation]);
  const renderDrawerContent = () => {
    return /*#__PURE__*/ _jsx(DrawerPositionContext.Provider, {
      value: drawerPosition,
      children: drawerContent({
        state: state,
        navigation: navigation,
        descriptors: descriptors,
      }),
    });
  };
  const renderSceneContent = () => {
    return /*#__PURE__*/ _jsx(MaybeScreenContainer, {
      enabled: detachInactiveScreens,
      hasTwoStates: true,
      style: styles.content,
      children: state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        const { lazy = true } = descriptor.options;
        const isFocused = state.index === index;
        const isPreloaded = state.preloadedRouteKeys.includes(route.key);
        if (lazy && !loaded.includes(route.key) && !isFocused && !isPreloaded) {
          // Don't render a lazy screen if we've never navigated to it or it wasn't preloaded
          return null;
        }
        const {
          freezeOnBlur,
          header = ({ layout, options }) =>
            /*#__PURE__*/ _jsx(Header, {
              ...options,
              layout: layout,
              title: getHeaderTitle(options, route.name),
              headerLeft:
                drawerPosition === 'left' && options.headerLeft == null
                  ? props =>
                      /*#__PURE__*/ _jsx(DrawerToggleButton, {
                        ...props,
                      })
                  : options.headerLeft,
              headerRight:
                drawerPosition === 'right' && options.headerRight == null
                  ? props =>
                      /*#__PURE__*/ _jsx(DrawerToggleButton, {
                        ...props,
                      })
                  : options.headerRight,
            }),
          headerShown,
          headerStatusBarHeight,
          headerTransparent,
          sceneStyle,
        } = descriptor.options;
        return /*#__PURE__*/ _jsx(
          MaybeScreen,
          {
            style: [
              StyleSheet.absoluteFill,
              {
                zIndex: isFocused ? 0 : -1,
              },
            ],
            visible: isFocused,
            enabled: detachInactiveScreens,
            freezeOnBlur: freezeOnBlur,
            shouldFreeze: !isFocused && !isPreloaded,
            children: /*#__PURE__*/ _jsx(Screen, {
              focused: isFocused,
              route: descriptor.route,
              navigation: descriptor.navigation,
              headerShown: headerShown,
              headerStatusBarHeight: headerStatusBarHeight,
              headerTransparent: headerTransparent,
              header: header({
                layout: dimensions,
                route: descriptor.route,
                navigation: descriptor.navigation,
                options: descriptor.options,
              }),
              style: sceneStyle,
              children: descriptor.render(),
            }),
          },
          route.key,
        );
      }),
    });
  };
  return /*#__PURE__*/ _jsx(DrawerStatusContext.Provider, {
    value: drawerStatus,
    children: /*#__PURE__*/ _jsx(Drawer, {
      open: drawerStatus !== 'closed',
      onOpen: handleDrawerOpen,
      onClose: handleDrawerClose,
      onGestureStart: handleGestureStart,
      onGestureEnd: handleGestureEnd,
      onGestureCancel: handleGestureCancel,
      onTransitionStart: handleTransitionStart,
      onTransitionEnd: handleTransitionEnd,
      layout: dimensions,
      direction: direction,
      configureGestureHandler: configureGestureHandler,
      swipeEnabled: swipeEnabled,
      swipeEdgeWidth: swipeEdgeWidth,
      swipeMinDistance: swipeMinDistance,
      hideStatusBarOnOpen: drawerHideStatusBarOnOpen,
      statusBarAnimation: drawerStatusBarAnimation,
      keyboardDismissMode: keyboardDismissMode,
      drawerType: drawerType,
      overlayAccessibilityLabel: overlayAccessibilityLabel,
      drawerPosition: drawerPosition,
      drawerStyle: [
        {
          backgroundColor: colors.card,
        },
        drawerType === 'permanent' &&
          ((
            Platform.OS === 'web'
              ? drawerPosition === 'right'
              : (direction === 'rtl' && drawerPosition !== 'right') ||
                (direction !== 'rtl' && drawerPosition === 'right')
          )
            ? {
                borderLeftColor: colors.border,
                borderLeftWidth: StyleSheet.hairlineWidth,
              }
            : {
                borderRightColor: colors.border,
                borderRightWidth: StyleSheet.hairlineWidth,
              }),
        drawerType === 'front' &&
          (drawerPosition === 'left'
            ? {
                borderTopRightRadius: DRAWER_BORDER_RADIUS,
                borderBottomRightRadius: DRAWER_BORDER_RADIUS,
              }
            : {
                borderTopLeftRadius: DRAWER_BORDER_RADIUS,
                borderBottomLeftRadius: DRAWER_BORDER_RADIUS,
              }),
        drawerStyle,
      ],
      overlayStyle: {
        backgroundColor: overlayColor,
      },
      renderDrawerContent: renderDrawerContent,
      children: renderSceneContent(),
    }),
  });
}
export function DrawerView({ navigation, ...rest }) {
  return /*#__PURE__*/ _jsx(SafeAreaProviderCompat, {
    children: /*#__PURE__*/ _jsx(DrawerViewBase, {
      navigation: navigation,
      ...rest,
    }),
  });
}
const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
//# sourceMappingURL=DrawerView.js.map
