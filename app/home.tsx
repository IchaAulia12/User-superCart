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
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { collection, doc, getDoc, addDoc, setDoc, serverTimestamp, query, getDocs, where } from 'firebase/firestore';
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
  userId?: string;
}

interface SearchResult {
  id: string;
  name: string;
  price: number;
}

import { homeStyles as styles } from "../styles/homeStyles";

export default function HomeScreen({ navigation }: any) {
  const [cart, setCart] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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

  // Send payment data every second
  useEffect(() => {
    if (!savedCartNumber || !mqttConnected || cart.length === 0) return;

    const intervalId = setInterval(() => {
      sendPaymentToMQTT();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [savedCartNumber, mqttConnected, cart]);

  // Subscribe to payment status from cashier
  useEffect(() => {
    if (savedCartNumber && mqttConnected) {
      const paymentStatusTopic = `${savedCartNumber}/payment-status`;
      
      const handlePaymentStatus = (data: any) => {
        console.log('📥 Payment status received:', data);
        
        if (data.status === 'paid') {
          setPaid(true);
          Alert.alert(
            'Pembayaran Berhasil!',
            `Transaksi Anda telah dibayar di kasir.\n\nMetode: ${data.paymentMethod}\nTotal: Rp ${data.totalAmount.toLocaleString('id-ID')}`,
            [{ text: 'OK' }]
          );
        }
      };

      mqttService.subscribe(paymentStatusTopic, handlePaymentStatus);
      console.log(`📡 Subscribed to payment status: ${paymentStatusTopic}`);

      return () => {
        mqttService.unsubscribe(paymentStatusTopic, handlePaymentStatus);
      };
    }
  }, [savedCartNumber, mqttConnected]);

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
          await addProductById(id);
        }
      };

      mqttService.subscribe(topic, handleMQTTMessage);
      console.log(`Subscribed to MQTT topic: ${topic}`);

      return () => {
        mqttService.unsubscribe(topic, handleMQTTMessage);
      };
    }
  }, [savedCartNumber, mqttConnected]);

  // Search products by name
  const searchProducts = async (searchText: string) => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setShowSearchModal(false);
      return;
    }

    try {
      setIsSearching(true);
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      const results: SearchResult[] = [];
      const searchLower = searchText.toLowerCase();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const productName = data.name?.toLowerCase() || '';
        
        // Search by name (case insensitive, partial match)
        if (productName.includes(searchLower)) {
          results.push({
            id: doc.id,
            name: data.name,
            price: data.price,
          });
        }
      });

      setSearchResults(results);
      setShowSearchModal(results.length > 0);
    } catch (error) {
      console.error('Error searching products:', error);
      Alert.alert('Error', 'Gagal mencari produk');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchModal(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

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
      id: currentUser?.username || 'unknown',
      items: cart.map(item => ({
        id: item.id,
        qty: item.qty,
      })),
    };
  };

  const sendPaymentToMQTT = () => {
    if (!savedCartNumber) {
      return;
    }

    if (cart.length === 0) {
      return;
    }

    const topic = `${savedCartNumber}/payment`;
    const payload = buildPaymentPayload();

    try {
      mqttService.publish(topic, JSON.stringify(payload));
      console.log('📤 MQTT payment sent:', topic, payload);
    } catch (error) {
      console.error('MQTT publish error:', error);
    }
  };

  // Fetch product by ID from Firestore
  const fetchProductById = async (productId: string): Promise<Product | null> => {
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

  // Add product by ID (for MQTT)
  const addProductById = async (productId: string) => {
    const product = await fetchProductById(productId);

    if (!product) {
      Alert.alert('Error', 'ID Produk tidak ditemukan di database!');
      return;
    }

    addProductToCart(product);
  };

  // Add product to cart (generic function)
  const addProductToCart = (product: Product) => {
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

  // Add product from search result
  const addProductFromSearch = (searchResult: SearchResult) => {
    const product: Product = {
      id: searchResult.id,
      name: searchResult.name,
      price: searchResult.price,
      qty: 1
    };

    addProductToCart(product);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchModal(false);
    
    Alert.alert('Berhasil', `${product.name} ditambahkan ke keranjang`);
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

  // Reset transaction and start new
  const handleNewTransaction = () => {
    Alert.alert(
      'Transaksi Baru',
      'Mulai transaksi baru?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: () => {
            setCart([]);
            setPaid(false);
            setCartNumber('');
            setSavedCartNumber('');
          }
        }
      ]
    );
  };

  const renderCartItem = ({ item }: { item: Product }) => (
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

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <View style={styles.searchResultItem}>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultId}>ID: {item.id}</Text>
        <Text style={styles.searchResultPrice}>{formatRupiah(item.price)}</Text>
      </View>
      <TouchableOpacity
        style={styles.searchResultAddButton}
        onPress={() => addProductFromSearch(item)}
      >
        <Text style={styles.searchResultAddButtonText}>+ Tambah</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Logo di pojok kanan atas */}
      {/* <View style={styles.logoContainer}>
        <Image 
          source={require("../assets/images/logo.png")} 
          style={styles.logo}
        />
      </View> */}

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
            editable={!paid}
          />
          <TouchableOpacity 
            onPress={saveCartNumber} 
            style={styles.cartNumberButton}
            disabled={paid}
          >
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
          placeholder="Cari nama produk..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.input}
          autoCapitalize="none"
          editable={!paid}
        />
        {isSearching && (
          <View style={styles.searchingIndicator}>
            <Text style={styles.searchingText}>🔍</Text>
          </View>
        )}
      </View>

      <Text style={styles.infoText}>
        {searchResults.length > 0 
          ? `${searchResults.length} produk ditemukan` 
          : 'Ketik minimal 2 huruf untuk mencari produk'}
      </Text>

      {/* Search Results Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <Pressable 
          style={styles.searchModalOverlay}
          onPress={() => setShowSearchModal(false)}
        >
          <View style={styles.searchModalContent}>
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>
                Hasil Pencarian ({searchResults.length})
              </Text>
              <TouchableOpacity onPress={() => setShowSearchModal(false)}>
                <Text style={styles.searchModalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchResult}
              style={styles.searchResultsList}
            />
          </View>
        </Pressable>
      </Modal>

      <FlatList 
        data={cart} 
        keyExtractor={(item) => item.id} 
        renderItem={renderCartItem}
        contentContainerStyle={{ paddingBottom: 200 }}
      />

      {cart.length > 0 && (
        <View style={styles.floatingTotal}>
          <Text style={styles.floatingTotalText}>
            Total: {totalItems} item • {formatRupiah(totalPrice)}
          </Text>
        </View>
      )}

      {/* Payment Status Button - Read Only */}
      <TouchableOpacity
        style={[styles.paymentButton, paid && styles.paymentButtonPaid]}
        disabled={true}
      >
        <Text style={styles.paymentText}>
          {paid ? '✓ Sudah Dibayar' : '○ Menunggu Pembayaran Kasir'}
        </Text>
      </TouchableOpacity>

      {!paid && cart.length > 0 && (
        <Text style={styles.paymentInfoText}>
          Silakan lakukan pembayaran di kasir
        </Text>
      )}

      {paid && (
        <View style={styles.successMessage}>
          <Text style={styles.successText}>
            ✓ Transaksi telah selesai dan tersimpan
          </Text>
          <TouchableOpacity
            style={styles.newTransactionButton}
            onPress={handleNewTransaction}
          >
            <Text style={styles.newTransactionText}>
              🛒 Mulai Transaksi Baru
            </Text>
          </TouchableOpacity>
        </View>
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