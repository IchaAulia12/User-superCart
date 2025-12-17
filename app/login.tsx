import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [emailPhone, setEmailPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !emailPhone.trim() || !password.trim()) {
      Alert.alert('Error', 'Semua field harus diisi!');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter!');
      return;
    }

    setLoading(true);
    try {
      // Check if username already exists
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        Alert.alert('Error', 'Username sudah terdaftar!');
        setLoading(false);
        return;
      }

      // Create new user document
      await setDoc(userRef, {
        username: username,
        emailPhone: emailPhone,
        password: password, // Note: In production, hash this password!
        createdAt: new Date().toISOString(),
        role: 'cashier'
      });

      Alert.alert('Berhasil', 'Registrasi berhasil! Silakan login.', [
        {
          text: 'OK',
          onPress: () => {
            setIsRegister(false);
            setPassword('');
            setEmailPhone('');
          }
        }
      ]);
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'Gagal mendaftar. Coba lagi.');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Username dan password harus diisi!');
      return;
    }

    setLoading(true);
    try {
      // Get user from Firestore
      const userRef = doc(db, 'users', username);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        Alert.alert('Error', 'Username tidak ditemukan!');
        setLoading(false);
        return;
      }

      const userData = userSnap.data();

      if (userData.password !== password) {
        Alert.alert('Error', 'Password salah!');
        setLoading(false);
        return;
      }

      // Save user data to AsyncStorage for global access
      await AsyncStorage.setItem('currentUser', JSON.stringify({
        username: userData.username,
        emailPhone: userData.emailPhone
      }));

      Alert.alert('Berhasil', 'Login berhasil!');
      router.replace('/loading');
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Gagal login. Coba lagi.');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
                <Image source={require('../assets/images/logo2.png')} style={styles.logo} />
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Email / Nomor Telepon"
              value={emailPhone}
              onChangeText={setEmailPhone}
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.disabledButton]} 
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Memproses...' : (isRegister ? 'Daftar' : 'Login')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => {
              setIsRegister(!isRegister);
              setUsername('');
              setPassword('');
              setEmailPhone('');
            }}
          >
            <Text style={styles.switchText}>
              {isRegister ? 'Sudah punya akun? Login disini' : 'Belum punya akun? Daftar disini'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 40,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#1976D2',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#1976D2',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  logo: {
    width: 150,
    height: 150,
  },
});