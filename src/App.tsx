import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Header from '@components/Header';

import type { RootStackParamList } from 'screens/types';
import Home from 'screens/Home';
import ServerManager from 'screens/ServerManager';
import Server from 'screens/Server';
import Query from 'screens/Query';
import Tables from 'screens/Tables';
import RowManager from 'screens/RowManager';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        header: props => <Header {...props} />,
      }}
    >
      <Stack.Group>
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ title: 'DB Viewer', headerTitleStyle: { fontSize: 24 } }}
        />
        <Stack.Screen name="Server" component={Server} />
        <Stack.Screen name="Tables" component={Tables} />
        <Stack.Screen name="Query" component={Query} />
        <Stack.Screen name="ServerManager" component={ServerManager} />
        <Stack.Screen name="RowManager" component={RowManager} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default App;
