import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './components/Login';
import Signup from './components/Signup';
import HomeScreen from './components/HomeScreen';
import CreateTaskScreen from './components/CreateTaskScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('access');
      setInitialRoute(token ? 'Home' : 'Login');
    };
    checkAuth();
  }, []);
  
  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* <Stack.Screen name="CreateTask" component={CreateTaskScreen} /> */}
        <Stack.Screen name="TaskForm" component={CreateTaskScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
