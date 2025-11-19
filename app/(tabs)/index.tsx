import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity, // <-- 1. Import TouchableOpacity
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { Leaf, Plus, Target, User, History, MapPin } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardScreen = () => {
  const router = useRouter();
  const { user, predictions, getHistory, weatherData, isFetchingWeather, fetchLocationAndWeather } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchLocationAndWeather();
        getHistory();
      }
    }, [user, getHistory, fetchLocationAndWeather])
  );

  const firstName = user?.name?.split(" ")[0] || "Farmer";
  const recentPredictions = predictions.slice(0, 3);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getHistory();
    await fetchLocationAndWeather();
    setRefreshing(false);
  }, [getHistory, fetchLocationAndWeather]);

  // Helper component to render the location status
  const renderLocationStatus = () => {
    if (isFetchingWeather) {
      return (
        <View style={styles.locationContainer}>
          <ActivityIndicator size="small" color="#6b7280" />
          <Text style={styles.locationText}>Fetching location...</Text>
        </View>
      );
    }
    if (weatherData && weatherData.locationName) {
      return (
        <View style={styles.locationContainer}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.locationText}>{weatherData.locationName}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#16a34a"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerWelcome}>Welcome, {firstName}!</Text>
            <Text style={styles.headerSubtitle}>Ready for a new season?</Text>
            {renderLocationStatus()}
          </View>
          
          {/* --- THIS IS THE FIX --- */}
          {/* 2. Wrap the View in a TouchableOpacity */}
          <TouchableOpacity onPress={() => router.push('/profile')}>
            {/* 3. The original View is now inside */}
            <View style={styles.avatar}>
              <User size={24} color="#166534" />
            </View>
          </TouchableOpacity>
          {/* --- END OF FIX --- */}

        </View>

        {/* Primary Action Card (with previous button fix) */}
        <View style={styles.primaryActionCard}>
          <View style={styles.primaryActionIconContainer}>
            <Target size={32} color="#fff" />
          </View>
          <Text style={styles.primaryActionTitle}>Soil Analysis Ready</Text>
          <Text style={styles.primaryActionSubtitle}>
            Get AI-powered crop recommendations based on your soil data.
          </Text>
          <TouchableOpacity 
            style={styles.primaryActionButton}
            onPress={() => router.push("/predict")}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.primaryActionButtonText}>
              Get New Crop Prediction
            </Text>
          </TouchableOpacity>
        </View>

        {/* Insights Grid */}
        <View style={styles.insightsGrid}>
          <View style={styles.insightCard}>
            <View
              style={[
                styles.insightIconContainer,
                { backgroundColor: "#d1fae5" },
              ]}
            >
              <Leaf size={20} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.insightLabel}>Last Crop</Text>
              <Text style={styles.insightValue}>
                {predictions[0]?.crop || "None"}
              </Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <View
              style={[
                styles.insightIconContainer,
                { backgroundColor: "#e0e7ff" },
              ]}
            >
              <History size={20} color="#4f46e5" />
            </View>
            <View>
              <Text style={styles.insightLabel}>Total Predictions</Text>
              <Text style={styles.insightValue}>{predictions.length}</Text>
            </View>
          </View>
        </View>

        {/* Recent Predictions */}
        {recentPredictions.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Predictions</Text>
              <TouchableOpacity onPress={() => router.push("/history")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentList}>
              {recentPredictions.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.recentItem}
                  onPress={() => router.push({ 
                    pathname: '/predictionModal', 
                    params: { prediction: JSON.stringify(item) } 
                  })}
                >
                  <View style={styles.recentItemLeft}>
                    <View style={styles.recentItemIconContainer}>
                      <Leaf size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.recentItemCrop}>{item.crop}</Text>
                      <Text style={styles.recentItemDate}>{new Date(item.date).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={styles.recentItemRight}>
                    <Text style={styles.recentItemConfidence}>
                      {item.confidence.toFixed(1)}%
                    </Text>
                    <Text style={styles.recentItemLabel}>Confidence</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles (Unchanged) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerWelcome: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  headerSubtitle: { fontSize: 16, color: "#6b7280" },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  primaryActionCard: {
    backgroundColor: "#166534",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  primaryActionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  primaryActionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: "#d1d5db",
    textAlign: "center",
    marginBottom: 20,
  },
  primaryActionButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryActionButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  insightsGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  insightCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  insightLabel: { fontSize: 12, color: "#6b7280" },
  insightValue: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  recentSection: {},
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  viewAllText: { fontSize: 14, fontWeight: "600", color: "#16a34a" },
  recentList: { gap: 12 },
  recentItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  recentItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentItemIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#22c55e",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  recentItemCrop: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  recentItemDate: { fontSize: 12, color: "#6b7280" },
  recentItemRight: { alignItems: "flex-end" },
  recentItemConfidence: { fontSize: 16, fontWeight: "bold", color: "#16a34a" },
  recentItemLabel: { fontSize: 12, color: "#6b7280" },
});

export default DashboardScreen;