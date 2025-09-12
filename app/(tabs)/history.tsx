import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Leaf, Calendar, TrendingUp, History as HistoryIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HistoryScreen = () => {
  const { predictions, getHistory } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getHistory();
    setRefreshing(false);
  }, [getHistory]);

  const renderItem = ({ item }: { item: typeof predictions[0] }) => (
    <TouchableOpacity style={styles.historyItem}>
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          <Leaf color="#fff" size={24} />
        </View>
        <View>
          <Text style={styles.cropName}>{item.crop}</Text>
          <View style={styles.dateContainer}>
            <Calendar color="#6b7280" size={14} />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.confidenceText}>{item.confidence}%</Text>
        <Text style={styles.confidenceLabel}>Confidence</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prediction History</Text>
        <Text style={styles.headerSubtitle}>{predictions.length} predictions recorded</Text>
      </View>
      <FlatList
        data={predictions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <HistoryIcon size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No predictions yet.</Text>
            <Text style={styles.emptySubtext}>Your past predictions will appear here.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#166534',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  listContainer: {
    padding: 24,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#4b5563',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default HistoryScreen;
