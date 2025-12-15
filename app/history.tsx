import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface TransactionItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
}

interface Transaction {
  id: string;
  cartNumber: string;
  items: TransactionItem[];
  totalItems: number;
  totalPrice: number;
  timestamp: any;
  createdAt: string;
}

interface MonthGroup {
  month: string;
  year: string;
  transactions: Transaction[];
  totalAmount: number;
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'transactions'),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fetchedTransactions: Transaction[] = [];

      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({
          id: doc.id,
          ...doc.data(),
        } as Transaction);
      });

      setTransactions(fetchedTransactions);
      groupByMonth(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByMonth = (transactions: Transaction[]) => {
    const grouped: { [key: string]: MonthGroup } = {};

    transactions.forEach((transaction) => {
      const date = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
      const monthYear = `${date.toLocaleString('id-ID', { month: 'long' })} ${date.getFullYear()}`;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: date.toLocaleString('id-ID', { month: 'long' }),
          year: String(date.getFullYear()),
          transactions: [],
          totalAmount: 0,
        };
      }

      grouped[monthKey].transactions.push(transaction);
      grouped[monthKey].totalAmount += transaction.totalPrice;
    });

    const sortedGroups = Object.values(grouped).sort((a, b) => {
      return `${b.year}-${b.month}`.localeCompare(`${a.year}-${a.month}`);
    });

    setMonthlyData(sortedGroups);
  };

  const formatRupiah = (number: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(number);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleTransaction = (transactionId: string) => {
    setExpandedTransaction(
      expandedTransaction === transactionId ? null : transactionId
    );
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isExpanded = expandedTransaction === item.id;

    return (
      <View style={styles.transactionCard}>
        <TouchableOpacity
          style={styles.transactionHeader}
          onPress={() => toggleTransaction(item.id)}
        >
          <View style={styles.transactionHeaderLeft}>
            <Text style={styles.cartNumberText}>🛒 #{item.cartNumber}</Text>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.transactionHeaderRight}>
            <Text style={styles.totalPriceText}>{formatRupiah(item.totalPrice)}</Text>
            <Text style={styles.totalItemsText}>{item.totalItems} item</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.transactionDetails}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Produk</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Harga</Text>
              <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: 'right' }]}>Subtotal</Text>
            </View>

            {item.items.map((product, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.productNameText}>{product.name}</Text>
                  <Text style={styles.productIdText}>ID: {product.id}</Text>
                </View>
                <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center' }]}>
                  {product.qty}
                </Text>
                <Text style={[styles.tableCellText, { flex: 1.5, textAlign: 'right' }]}>
                  {formatRupiah(product.price)}
                </Text>
                <Text style={[styles.tableCellText, { flex: 1.5, textAlign: 'right' }]}>
                  {formatRupiah(product.subtotal)}
                </Text>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatRupiah(item.totalPrice)}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderMonthSection = ({ item }: { item: MonthGroup }) => {
    const monthKey = `${item.year}-${item.month}`;
    const isSelected = selectedMonth === monthKey;

    return (
      <View style={styles.monthSection}>
        <TouchableOpacity
          style={styles.monthHeader}
          onPress={() => setSelectedMonth(isSelected ? null : monthKey)}
        >
          <View>
            <Text style={styles.monthTitle}>{item.month} {item.year}</Text>
            <Text style={styles.monthSubtitle}>
              {item.transactions.length} transaksi
            </Text>
          </View>
          <View style={styles.monthAmountContainer}>
            <Text style={styles.monthAmount}>{formatRupiah(item.totalAmount)}</Text>
            <Text style={styles.expandIcon}>{isSelected ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        {isSelected && (
          <FlatList
            data={item.transactions}
            keyExtractor={(transaction) => transaction.id}
            renderItem={renderTransactionItem}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <TouchableOpacity onPress={fetchTransactions}>
          <Text style={styles.refreshButton}>↻</Text>
        </TouchableOpacity>
      </View>

      {monthlyData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>📋</Text>
          <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
          <Text style={styles.emptySubtitle}>
            Transaksi yang Anda simpan akan muncul di sini
          </Text>
        </View>
      ) : (
        <FlatList
          data={monthlyData}
          keyExtractor={(item) => `${item.year}-${item.month}`}
          renderItem={renderMonthSection}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  monthSection: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  monthSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  monthAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  transactionCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  transactionHeaderLeft: {
    flex: 1,
  },
  transactionHeaderRight: {
    alignItems: 'flex-end',
  },
  cartNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  totalPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalItemsText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  transactionDetails: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  productNameText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  productIdText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tableCellText: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});