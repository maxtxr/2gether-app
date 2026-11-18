import React from 'react';
import Logo from '../components/common/Logo';
import { colors } from '../theme';

/**
 * Styling shared by every native stack header in the app.
 * Change the header look for the whole app from here.
 */
export const headerOptions = {
  headerStyle: { backgroundColor: colors.green },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
  headerShadowVisible: false,
};

/**
 * App logo used as the header title on the main tab screens.
 * Pass it to a screen with `headerTitle: () => <HeaderLogo />`.
 */
export default function HeaderLogo() {
  return <Logo />;
}
