import React, { useMemo } from 'react';
import { StatusBar } from 'react-native';
import { useTheme, Appbar, Tooltip } from 'react-native-paper';
import {
  NativeStackHeaderProps,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

/**
 * Component to show a Header
 */
const Header = ({
  navigation,
  back,
  route,
  options,
}: NativeStackHeaderProps) => {
  const theme = useTheme();

  const {
    title,
    // headerLeft,
    headerRight,
    headerStyle,
    headerTitleStyle = {},
    headerTintColor,
  }: NativeStackNavigationOptions = options;

  // buttonProps is used to pass props to headerRight
  const buttonProps = useMemo(
    () => ({
      canGoBack: navigation.canGoBack(),
      tintColor: headerTintColor,
    }),
    [navigation, headerTintColor],
  );

  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      <Appbar.Header elevated style={headerStyle}>
        {back ? (
          <Tooltip title={back.title ?? 'Go Back'}>
            <Appbar.BackAction onPress={navigation.goBack} />
          </Tooltip>
        ) : null}
        <Appbar.Content
          title={title ?? route.name}
          titleStyle={[{ fontSize: 18 }, headerTitleStyle]}
        />
        {headerRight ? headerRight(buttonProps) : null}
      </Appbar.Header>
    </>
  );
};

export const HeaderButton = (
  props: React.ComponentProps<typeof Appbar.Action> &
    Partial<React.ComponentProps<typeof Tooltip>>,
) => {
  const action = <Appbar.Action {...props} />;
  if (props.title) return <Tooltip title={props.title}>{action}</Tooltip>;
  return action;
};

export default Header;
