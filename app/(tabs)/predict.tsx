import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Thermometer, CloudRain, TestTube2, Target } from 'lucide-react-native';

// Re-defining this interface here for type-safety inside this file.
// This is good practice and helps TypeScript understand the data shape.
interface PredictionData {
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
}

type FormData = {
    [key: string]: string;
};

const inputFields = [
  { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', icon: TestTube2, placeholder: 'e.g., 90' },
  { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', icon: TestTube2, placeholder: 'e.g., 42' },
  { key: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', icon: TestTube2, placeholder: 'e.g., 43' },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, placeholder: 'e.g., 25' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: Droplets, placeholder: 'e.g., 80' },
  { key: 'ph', label: 'Soil pH', unit: '', icon: TestTube2, placeholder: 'e.g., 6.5' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', icon: CloudRain, placeholder: 'e.g., 120' },
];

export default function PredictScreen() {
  const router = useRouter();
  const { predictCrop, savePrediction, isLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    nitrogen: '', phosphorus: '', potassium: '', temperature: '',
    humidity: '', ph: '', rainfall: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (key: string, value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handlePrediction = async () => {
    const missingField = inputFields.find(field => !formData[field.key]?.trim());
    if (missingField) {
      Alert.alert('Missing Information', `Please fill in the ${missingField.label} field.`);
      return;
    }
    setError('');

    try {
      const numericParams = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, parseFloat(value)])
      );
      
      const result = await predictCrop(numericParams);
      
      // --- FIX IS HERE ---
      // We are casting numericParams to the specific type that PredictionData expects.
      const newPrediction: PredictionData = {
        id: result.id,
        crop: result.crop,
        confidence: result.confidence,
        date: new Date().toISOString().split('T')[0],
        parameters: numericParams as PredictionData['parameters'] // Type Assertion
      };

      savePrediction(newPrediction);
      
      router.replace({ 
        pathname: '/result', 
        params: { prediction: JSON.stringify(newPrediction) } 
      });

    } catch (err) {
      Alert.alert('Prediction Failed', 'An error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "New Prediction" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <Text style={styles.title}>Analyze Your Soil</Text>
            <Text style={styles.subtitle}>Enter your soil parameters to get a prediction.</Text>
        </View>

        {inputFields.map(({ key, label, unit, icon: Icon, placeholder }) => (
          <View style={styles.inputGroup} key={key}>
            <Text style={styles.label}>{label} {unit && `(${unit})`}</Text>
            <View style={styles.inputContainer}>
              <Icon style={styles.inputIcon} size={20} color="#6b7280" />
              <TextInput
                style={styles.input}
                value={formData[key]}
                onChangeText={(text) => handleInputChange(key, text)}
                placeholder={placeholder}
                keyboardType="decimal-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        ))}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handlePrediction}
          disabled={isLoading}
          style={[styles.predictButton, isLoading && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Target size={20} color="#fff" />
              <Text style={styles.predictButtonText}>Predict Best Crop</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
      marginBottom: 24,
      alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    height: 50,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1f2937',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  predictButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  buttonDisabled: {
      backgroundColor: '#166534',
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

