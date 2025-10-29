import { View, Text, StyleSheet, ScrollView } from 'react-native';
import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Thermometer, CloudRain, TestTube2 as TestTube, Leaf, Sprout, Image as ImageIcon } from 'lucide-react-native';

// --- UPDATED INTERFACE ---
interface PredictionData {
  id: string;
  crop: string;
  confidence: number;
  date: string;
  parameters: {
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
    soilName?: string;
    soilImageUri?: string;
  };
}

// Helper component
const DetailRow = ({ icon: Icon, label, value, unit }: { icon: React.ElementType, label: string, value: string | number, unit: string }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Icon size={20} color="#16a34a" />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value} {unit}</Text>
  </View>
);

export default function PredictionDetailScreen() {
  const params = useLocalSearchParams();
  const { prediction: predictionString } = params;

  if (!predictionString || typeof predictionString !== 'string') {
    // ... (error UI remains the same)
    return (
      <SafeAreaView style={styles.container}>
        <Text>No prediction data found.</Text>
      </SafeAreaView>
    );
  }

  const prediction: PredictionData = JSON.parse(predictionString);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Prediction Details', headerBackTitle: 'Back' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- Header remains the same --- */}
        <View style={styles.header}>
            <View style={styles.headerIconContainer}>
                <Leaf size={48} color="#fff" />
            </View>
            <Text style={styles.cropTitle}>{prediction.crop}</Text>
            <Text style={styles.confidenceText}>{prediction.confidence}% Confidence</Text>
            <Text style={styles.dateText}>{new Date(prediction.date).toDateString()}</Text>
        </View>

        {/* --- UPDATED Details Card --- */}
        <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Soil & Weather Conditions</Text>
            {/* N, P, K removed */}
            <DetailRow icon={TestTube} label="Soil pH" value={prediction.parameters.ph} unit="" />
            <DetailRow icon={Thermometer} label="Temperature" value={prediction.parameters.temperature} unit="°C" />
            <DetailRow icon={Droplets} label="Humidity" value={prediction.parameters.humidity} unit="%" />
            <DetailRow icon={CloudRain} label="Rainfall" value={prediction.parameters.rainfall} unit="mm" />
            
            {/* Conditionally show soil name */}
            {prediction.parameters.soilName && (
                <DetailRow icon={Sprout} label="Soil Name" value={prediction.parameters.soilName} unit="" />
            )}
            {/* Conditionally show soil image status */}
            {prediction.parameters.soilImageUri && (
                <DetailRow icon={ImageIcon} label="Soil Image" value="Provided" unit="" />
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles (no changes) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cropTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  confidenceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#374151',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});