import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { collection, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import mqttService from '../mqttService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Product {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface UserData {
  username: string;
  emailPhone: string;
}

import { homeStyles as styles } from "../styles/homeStyles";

export default function HomeScreen({ navigation }: any) {
  const [cart, setCart] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [cartNumber, setCartNumber] = useState(''); 
  const [savedCartNumber, setSavedCartNumber] = useState(''); 
  const [sidebarAnim] = useState(new Animated.Value(-280)); 
  const [open, setOpen] = useState(false);
  const [paid, setPaid] = useState(false);
  const [mqttConnected, setMqttConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // Load current user data
  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
  if (!savedCartNumber || !mqttConnected || cart.length === 0) return;

  const intervalId = setInterval(() => {
    sendPaymentToMQTT();
  }, 1000);

  return () => clearInterval(intervalId);
}, [savedCartNumber, mqttConnected, cart]);


  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem('currentUser');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Initialize MQTT connection
  useEffect(() => {
    const initMQTT = async () => {
      try {
        await mqttService.connect('wss://test.mosquitto.org:8081/mqtt');
        setMqttConnected(true);
        console.log('MQTT initialized successfully');
      } catch (error) {
        console.error('Failed to connect to MQTT:', error);
        Alert.alert('Error', 'Tidak dapat terhubung ke MQTT broker');
      }
    };

    initMQTT();

    return () => {
      mqttService.disconnect();
    };
  }, []);

  const processProductId = (input: any): string | null => {
    if (typeof input === 'string') return input.trim();
    if (typeof input === 'number') return input.toString();
    if (typeof input === 'object' && input !== null) {
      if (input.id) return String(input.id).trim();
      if (input.productId) return String(input.productId).trim();
    }
    return null;
  };

  // Subscribe to MQTT topic when cart number is saved
  useEffect(() => {
    if (savedCartNumber && mqttConnected) {
      const topic = `${savedCartNumber}/IDProducts`;
      
      const handleMQTTMessage = async (data: any) => {
        const id = processProductId(data);
        if (id) {
          await addProductFromFirestore(id);
          setProductId('');
        }
      };

      mqttService.subscribe(topic, handleMQTTMessage);
      console.log(`Subscribed to MQTT topic: ${topic}`);

      return () => {
        mqttService.unsubscribe(topic, handleMQTTMessage);
      };
    }
  }, [savedCartNumber, mqttConnected]);

  const formatRupiah = (number: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };
  
  const saveCartNumber = () => {
    const num = parseInt(cartNumber) || 0;
    if (num < 1 || num > 100) {
      Alert.alert('Error', 'Nomor keranjang harus antara 1-100');
      return;
    }
    
    const formattedNumber = cartNumber.padStart(3, '0');
    setSavedCartNumber(formattedNumber);
    Alert.alert('Berhasil', `Keranjang #${formattedNumber} tersimpan dan terhubung ke MQTT`);
  };

  const buildPaymentPayload = () => {
    return {
      items: cart.map(item => ({
        id: item.id,
        qty: item.qty,
      })),
    };
  };

  const sendPaymentToMQTT = () => {
    if (!savedCartNumber) {
      Alert.alert('Error', 'Keranjang belum disimpan');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Error', 'Keranjang masih kosong');
      return;
    }

    const topic = `${savedCartNumber}/payment`;
    const payload = buildPaymentPayload();

    try {
      mqttService.publish(topic, JSON.stringify(payload));
      console.log('MQTT payment sent:', topic, payload);
      //Alert.alert('Sukses', 'Data pembayaran berhasil dikirim');
    } catch (error) {
      console.error('MQTT publish error:', error);
      Alert.alert('Error', 'Gagal mengirim data ke MQTT');
    }
  };

  // Fetch product from Firestore
  const fetchProductFromFirestore = async (productId: string): Promise<Product | null> => {
    try {
      const productRef = doc(db, 'products', productId.toUpperCase());
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const data = productSnap.data();
        return {
          id: productSnap.id,
          name: data.name,
          price: data.price,
          qty: 1
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Gagal mengambil data produk dari database');
      return null;
    }
  };

  // Add product from Firestore
  const addProductFromFirestore = async (productId: string) => {
    const product = await fetchProductFromFirestore(productId);

    if (!product) {
      Alert.alert('Error', 'ID Produk tidak ditemukan di database!');
      return;
    }

    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);

      if (existing) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prevCart, product];
    });
  };

  // Add product manually
  const addProduct = async () => {
    if (!productId.trim()) {
      Alert.alert('Error', 'Masukkan ID Produk!');
      return;
    }
    await addProductFromFirestore(productId.trim());
    setProductId('');
  };

  const increaseQty = (id: string) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, qty: item.qty + 1 } : item
    ));
  };

  const decreaseQty = (id: string) => {
    setCart(cart.map(item =>
      item.id === id && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
    ));
  };

  const deleteProduct = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const closeSidebar = () => {
    if (!open) return;
    setOpen(false);

    Animated.timing(sidebarAnim, {
      toValue: -280,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  const toggleSidebar = () => {
    const toValue = open ? -280 : 0;
    setOpen(!open);

    Animated.timing(sidebarAnim, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start();
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin logout?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('currentUser');
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }
        }
      ]
    );
  };

  // Save transaction to Firestore
  const saveTransaction = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Keranjang masih kosong!');
      return;
    }

    if (!paid) {
      Alert.alert('Error', 'Transaksi belum dibayar!');
      return;
    }

    try {
      const transaction = {
        cartNumber: savedCartNumber || 'N/A',
        cashier: currentUser?.username || 'Unknown',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          subtotal: item.price * item.qty
        })),
        totalItems,
        totalPrice,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'transactions'), transaction);
      
      Alert.alert('Berhasil', 'Transaksi berhasil disimpan!', [
        {
          text: 'OK',
          onPress: () => {
            setCart([]);
            setPaid(false);
            setCartNumber('');
            setSavedCartNumber('');
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Gagal menyimpan transaksi');
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productId}>ID: {item.id}</Text>
        <Text style={styles.productPrice}>{formatRupiah(item.price)}</Text>

        <View style={styles.qtyDeleteRow}>
          <View style={styles.qtyControls}>
            <TouchableOpacity 
              style={styles.qtyButton}
              onPress={() => decreaseQty(item.id)}
            >
              <Text style={styles.qtyText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.qtyNumber}>{item.qty}</Text>
            
            <TouchableOpacity 
              style={styles.qtyButton}
              onPress={() => increaseQty(item.id)}
            >
              <Text style={styles.qtyText}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteProduct(item.id)}
          >
            <Text style={styles.deleteText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Text style={styles.navText}>☰ Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/history')}>
          <Text style={styles.navText}>Riwayat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>Shopping Cart</Text>
        <View style={styles.cartNumberContainer}>
          <TextInput
            placeholder="No"
            value={cartNumber}
            onChangeText={setCartNumber}
            keyboardType="numeric"
            style={styles.cartNumberInput}
            maxLength={3}
          />
          <TouchableOpacity onPress={saveCartNumber} style={styles.cartNumberButton}>
            <Text style={styles.cartNumberButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>

      {savedCartNumber ? (
        <Text style={styles.savedCartText}>
          🛒 Keranjang #{savedCartNumber} {mqttConnected ? '(MQTT Connected)' : '(MQTT Disconnected)'}
        </Text>
      ) : null}

      <View style={styles.form}>
        <TextInput
          placeholder="Masukkan ID Produk"
          value={productId}
          onChangeText={setProductId}
          style={styles.input}
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={addProduct} style={styles.addButton}>
          <Text style={styles.addText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>Scan menggunakan keranjang / masukkan manual ID produk</Text>

      <FlatList 
        data={cart} 
        keyExtractor={(item) => item.id} 
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      {cart.length > 0 && (
        <View style={styles.floatingTotal}>
          <Text style={styles.floatingTotalText}>
            Total: {totalItems} item • {formatRupiah(totalPrice)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.paymentButton, paid && styles.paymentButtonPaid]}
        onPress={() => setPaid(!paid)}
      >
        <Text style={styles.paymentText}>
          {paid ? '✓ Sudah Dibayar' : '○ Belum Dibayar'}
        </Text>
      </TouchableOpacity>

      {paid && (
        <TouchableOpacity
          style={styles.saveTransactionButton}
          onPress={saveTransaction}
        >
          <Text style={styles.saveTransactionText}>💾 Simpan Transaksi</Text>
        </TouchableOpacity>
      )}

      {open && (
        <Pressable 
          style={styles.overlay}
          onPress={closeSidebar}
        />
      )}

      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <View style={styles.profileSection}>
          <Image 
            source={require("../assets/images/Avatar-1.png")} 
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>
            {currentUser?.username || 'Guest'}
          </Text>
          <Text style={styles.profileEmail}>
            {currentUser?.emailPhone || 'Belum login'}
          </Text>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity>
            <Text style={styles.menuItem}>📦 My Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.menuItem}>⚙ Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.menuItem}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}