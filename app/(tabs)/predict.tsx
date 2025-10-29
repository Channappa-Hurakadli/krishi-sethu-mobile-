import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
// Import useEffect
import React, { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Thermometer, CloudRain, TestTube2, Target } from 'lucide-react-native';

// ... (PredictionData interface remains the same)
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
  // Get weatherData from useAuth
  const { predictCrop, savePrediction, isLoading, weatherData, isFetchingWeather } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    nitrogen: '', phosphorus: '', potassium: '', temperature: '',
    humidity: '', ph: '', rainfall: ''
  });
  const [error, setError] = useState('');

  // --- NEW EFFECT HOOK ---
  // This effect listens for changes to weatherData from the context
  useEffect(() => {
    if (weatherData) {
      setFormData(prev => ({
        ...prev,
        temperature: String(weatherData.temperature || ''),
        humidity: String(weatherData.humidity || ''),
        rainfall: String(weatherData.rainfall || ''),
      }));
    }
  }, [weatherData]); // Runs when weatherData is fetched

  const handleInputChange = (key: string, value: string) => {
    // Only allow numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handlePrediction = async () => {
    // ... (prediction logic remains the same)
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
      
      const newPrediction: PredictionData = {
        id: result.id,
        crop: result.crop,
        confidence: result.confidence,
        date: new Date().toISOString().split('T')[0],
        parameters: numericParams as PredictionData['parameters']
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

  // Helper function to show a placeholder or fetching indicator
  const getPlaceholder = (key: string) => {
    const field = inputFields.find(f => f.key === key);
    if (isFetchingWeather && (key === 'temperature' || key === 'humidity' || key === 'rainfall')) {
        return 'Fetching weather...';
    }
    return field?.placeholder;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "New Prediction" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <Text style={styles.title}>Analyze Your Soil</Text>
            <Text style={styles.subtitle}>Enter your soil parameters to get a prediction.</Text>
        </View>

        {inputFields.map(({ key, label, unit, icon: Icon }) => {
            const isWeatherField = key === 'temperature' || key === 'humidity' || key === 'rainfall';
            return (
              <View style={styles.inputGroup} key={key}>
                <Text style={styles.label}>{label} {unit && `(${unit})`}</Text>
                <View style={[styles.inputContainer, isFetchingWeather && isWeatherField && styles.inputDisabled]}>
                  <Icon style={styles.inputIcon} size={20} color="#6b7280" />
                  <TextInput
                    style={styles.input}
                    value={formData[key]}
                    onChangeText={(text) => handleInputChange(key, text)}
                    placeholder={getPlaceholder(key)} // Use helper for placeholder
                    keyboardType="decimal-pad"
                    placeholderTextColor="#9ca3af"
                    editable={!(isFetchingWeather && isWeatherField)} // Disable field while fetching
                  />
                </View>
              </View>
            )
        })}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handlePrediction}
          disabled={isLoading || isFetchingWeather} // Disable button while fetching weather
          style={[styles.predictButton, (isLoading || isFetchingWeather) && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : isFetchingWeather ? (
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

// Add/update styles
const styles = StyleSheet.create({
  // ... (all existing styles)
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
  // NEW STYLE
  inputDisabled: {
    backgroundColor: '#f3f4f6', // Grey out background
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
      opacity: 0.7, // Make it look disabled
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});