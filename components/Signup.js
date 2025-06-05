import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';
import styles from './styles/AuthStyles';
import { API_URL } from '../config';

export default function Signup({ navigation }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const { username, password } = formData;

    if (!username || !password) {
      Alert.alert('Validation Error', 'Both fields are required.');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/register/`, { username, password });
      Alert.alert('Success', 'Account created. You can now login.');
      navigation.navigate('Login');
    } catch (err) {
      console.log("Signup error:", err.message);
      Alert.alert('Signup Failed', 'Try another username or check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sign Up</Text>
      <TextInput
        placeholder="Username"
        style={styles.input}
        autoCapitalize="none"
        value={formData.username}
        onChangeText={text => setFormData({ ...formData, username: text })}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={formData.password}
        onChangeText={text => setFormData({ ...formData, password: text })}
      />
      <Button title={loading ? 'Signing Up...' : 'Sign Up'} onPress={handleSubmit} disabled={loading} />
      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Already have an account? Login here
      </Text>
    </View>
  );
}
