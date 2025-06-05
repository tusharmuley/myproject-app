import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import styles from './styles/AuthStyles';
import { API_URL } from '../config';

export default function Login({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    if (!username || !password) {
      Alert.alert("Validation", "Please fill in both fields.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/token/`, {
        username,
        password
      });

      if (res.data.access) {
        await AsyncStorage.setItem('access', res.data.access);
        await AsyncStorage.setItem('refresh', res.data.refresh);
        navigation.replace('Home');
      } else {
        Alert.alert("Login Failed", "Token not received.");
      }
    } catch (err) {
      console.log('Login error:', err.message);
      Alert.alert("Login Failed", "Invalid username or password.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={login} />
      <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
        Don't have an account? Sign up here
      </Text>
    </View>
  );
}
