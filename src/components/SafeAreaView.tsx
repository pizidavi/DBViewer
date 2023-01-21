import React from 'react';
import type { PropsWithChildren } from 'react';
import { SafeAreaView as SAW } from 'react-native-safe-area-context';
import type { SafeAreaViewProps } from 'react-native-safe-area-context';
import { useTheme } from '@react-navigation/native';

const SafeAreaView = ({
  children,
  style = {},
  ...others
}: PropsWithChildren<SafeAreaViewProps>) => {
  const theme = useTheme();
  return (
    <SAW
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingBottom: 5,
        ...(style as object),
      }}
      {...others}
    >
      {children}
    </SAW>
  );
};

export default SafeAreaView;
