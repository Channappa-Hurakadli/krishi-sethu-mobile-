import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { Leaf, Plus, Target, User, History } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardScreen = () => {
  const router = useRouter();
  const { user, predictions, getHistory } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const firstName = user?.name?.split(" ")[0] || "Farmer";
  const recentPredictions = predictions.slice(0, 3);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await getHistory();
    setRefreshing(false);
  }, [getHistory]);

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
          </View>
          <View style={styles.avatar}>
            <User size={24} color="#166534" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryActionCard}
          onPress={() => router.push("/predict")} // This will now correctly open the predict screen as a modal
        >
          <View style={styles.primaryActionIconContainer}>
            <Target size={32} color="#fff" />
          </View>
          <Text style={styles.primaryActionTitle}>Soil Analysis Ready</Text>
          <Text style={styles.primaryActionSubtitle}>
            Get AI-powered crop recommendations based on your soil data.
          </Text>
          <View style={styles.primaryActionButton}>
            <Plus size={20} color="#fff" />
            <Text style={styles.primaryActionButtonText}>
              Get New Crop Prediction
            </Text>
          </View>
        </TouchableOpacity>

        {/* Rest of the component... */}
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
                <TouchableOpacity key={item.id} style={styles.recentItem}>
                  <View style={styles.recentItemLeft}>
                    <View style={styles.recentItemIconContainer}>
                      <Leaf size={18} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.recentItemCrop}>{item.crop}</Text>
                      <Text style={styles.recentItemDate}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={styles.recentItemRight}>
                    <Text style={styles.recentItemConfidence}>
                      {item.confidence}%
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

// --- Styles (no changes) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { padding: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerWelcome: { fontSize: 24, fontWeight: "bold", color: "#1f2937" },
  headerSubtitle: { fontSize: 16, color: "#6b7280" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
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
