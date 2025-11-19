import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Leaf, X, CheckCircle } from 'lucide-react-native';

// Define the PredictionData type (copy from history.tsx)
type PredictionData = {
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
};

// Helper component for a single parameter row
const DetailRow = ({ label, value }: { label: string, value: string | number | undefined }) => {
    if (!value) return null; // Don't show if no value
    return (
        <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>{label}</Text>
            <Text style={styles.paramValue}>{value}</Text>
        </View>
    );
};

export default function PredictionModal() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { prediction: predictionString } = params;

  if (!predictionString || typeof predictionString !== 'string') {
    return (
      <View style={styles.modalContainer}>
        <Text style={styles.errorText}>No prediction data found.</Text>
      </View>
    );
  }

  const prediction: PredictionData = JSON.parse(predictionString);
  const { parameters } = prediction;

  return (
    <View style={styles.modalContainer}>
        {/* Clickable overlay to close modal */}
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => router.back()} />

        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Leaf size={24} color="#166534" />
                </View>
                <Text style={styles.headerTitle}>Prediction Details</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <X size={20} color="#6b7280" />
                </TouchableOpacity>
            </View>

            {/* Result */}
            <View style={styles.resultSection}>
                <Text style={styles.resultCrop}>{prediction.crop}</Text>
                <View style={styles.confidenceBadge}>
                    <CheckCircle size={16} color="#16a34a" />
                    <Text style={styles.confidenceText}>{prediction.confidence.toFixed(1)}% Confidence</Text>
                </View>
            </View>

            {/* Parameters */}
            <View style={styles.paramsSection}>
                <Text style={styles.paramsTitle}>Input Parameters</Text>
                <DetailRow label="Soil pH" value={parameters.ph} />
                <DetailRow label="Temperature" value={`${parameters.temperature} °C`} />
                <DetailRow label="Humidity" value={`${parameters.humidity} %`} />
                <DetailRow label="Rainfall" value={`${parameters.rainfall} mm`} />
                <DetailRow label="Soil Name" value={parameters.soilName} />
                <DetailRow label="Soil Image" value={parameters.soilImageUri ? 'Provided' : undefined} />
            </View>

            {/* Date */}
            <Text style={styles.dateText}>
                Predicted on: {new Date(prediction.date).toLocaleDateString()}
            </Text>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1, // Make text take available space
    textAlign: 'center',
    marginLeft: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultCrop: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#166534',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  paramsSection: {
    marginBottom: 24,
  },
  paramsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paramLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  paramValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
  },
});