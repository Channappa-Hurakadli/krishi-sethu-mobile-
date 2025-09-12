import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Leaf, CheckCircle, Target } from 'lucide-react-native';

// This defines the structure of the prediction data we expect to receive
type PredictionData = {
    id: string;
    crop: string;
    confidence: number;
    date: string;
    parameters: {
        nitrogen: number;
        phosphorus: number;
        potassium: number;
        temperature: number;
        humidity: number;
        ph: number;
        rainfall: number;
    };
};

const ResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  let prediction: PredictionData | null = null;
  
  try {
    if (typeof params.prediction === 'string') {
      prediction = JSON.parse(params.prediction);
    }
  } catch (e) {
    console.error("Failed to parse prediction data:", e);
    // Handle error, maybe show a message or navigate back
  }

  if (!prediction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Could not load prediction results.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const parameterItems = [
      { label: 'Nitrogen', value: `${prediction.parameters.nitrogen} kg/ha` },
      { label: 'Phosphorus', value: `${prediction.parameters.phosphorus} kg/ha` },
      { label: 'Potassium', value: `${prediction.parameters.potassium} kg/ha` },
      { label: 'Temperature', value: `${prediction.parameters.temperature}°C` },
      { label: 'Humidity', value: `${prediction.parameters.humidity}%` },
      { label: 'pH', value: `${prediction.parameters.ph}` },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
            <View style={styles.headerIconContainer}>
                <CheckCircle size={32} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Recommendation Ready!</Text>
            <Text style={styles.headerSubtitle}>AI analysis completed successfully.</Text>
        </View>

        <View style={styles.resultCard}>
            <Text style={styles.resultCrop}>{prediction.crop}</Text>
            <View style={styles.confidenceCircle}>
                <Text style={styles.confidenceValue}>{prediction.confidence}%</Text>
                <Text style={styles.confidenceLabel}>Confidence</Text>
            </View>
        </View>

        <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Input Parameters</Text>
            <View style={styles.grid}>
                {parameterItems.map((item) => (
                    <View key={item.label} style={styles.gridItem}>
                        <Text style={styles.paramLabel}>{item.label}</Text>
                        <Text style={styles.paramValue}>{item.value}</Text>
                    </View>
                ))}
            </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Leaf size={20} color="#fff" />
          <Text style={styles.buttonText}>Done</Text>
        </TouchableOpacity>
         <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.back()}>
          <Target size={20} color="#166534" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>New Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    container: {
        padding: 24,
    },
    header: {
        backgroundColor: '#22c55e',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    headerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
    },
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    resultCrop: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#166534',
        marginBottom: 16,
    },
    confidenceCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 8,
        borderColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#d1fae5'
    },
    confidenceValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#166534',
    },
    confidenceLabel: {
        fontSize: 14,
        color: '#15803d',
    },
    detailsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    gridItem: {
        width: '50%',
        padding: 8,
        marginBottom: 8,
    },
    paramLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    paramValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
    button: {
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
      backgroundColor: '#d1fae5',
    },
    secondaryButtonText: {
      color: '#166534',
    },
    errorText: {
      textAlign: 'center',
      fontSize: 18,
      color: '#ef4444',
      marginBottom: 20,
    }
});

export default ResultScreen;
