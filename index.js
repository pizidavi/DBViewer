/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry, useColorScheme } from 'react-native';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';

import { name as appName } from './app.json';
import { themes } from './src/utils/themes';
import { store, persistor } from './src/app/store';
import { SnackBarProvider } from './src/contexts/Snackbar';
import App from './src/App';

// QueryClient for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
    mutations: {
      retry: false,
      staleTime: 0,
      cacheTime: 0,
    },
  },
});

/**
 * Main component
 */
const Main = () => {
  const colorScheme = useColorScheme();
  const theme = themes[colorScheme];
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <NavigationContainer theme={theme}>
              <QueryClientProvider client={queryClient}>
                <SnackBarProvider>
                  <App />
                </SnackBarProvider>
              </QueryClientProvider>
            </NavigationContainer>
          </SafeAreaProvider>
        </PaperProvider>
      </PersistGate>
    </ReduxProvider>
  );
};

AppRegistry.registerComponent(appName, () => Main);
