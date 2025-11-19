import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
// Removed Camera, ImageIcon, X
import { Droplets, Thermometer, CloudRain, TestTube2, Target, Sprout } from 'lucide-react-native';
// Removed * as ImagePicker

// Interface (Unchanged)
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
  };
}

// FormData state type
type FormData = {
    temperature: string;
    humidity: string;
    ph: string;
    rainfall: string;
    soilName: string;
};

// Input field definitions
const inputFields = [
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, placeholder: 'e.g., 25' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: Droplets, placeholder: 'e.g., 80' },
  { key: 'ph', label: 'Soil pH', unit: '', icon: TestTube2, placeholder: 'e.g., 6.5' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', icon: CloudRain, placeholder: 'e.g., 120' },
  { key: 'soilName', label: 'Soil Name', unit: '', icon: Sprout, placeholder: 'e.g., Alluvial Soil' },
];

export default function PredictScreen() {
  const router = useRouter();
  const { predictCrop, savePrediction, isLoading, weatherData, isFetchingWeather } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    temperature: '', humidity: '', ph: '', rainfall: '', soilName: ''
  });
  const [error, setError] = useState('');

  // Auto-fill weather data (Unchanged)
  useEffect(() => {
    if (weatherData) {
      setFormData(prev => ({
        ...prev,
        temperature: String(weatherData.temperature ?? ''),
        humidity: String(weatherData.humidity ?? ''),
        rainfall: String(weatherData.rainfall ?? ''),
      }));
    }
  }, [weatherData]);

  // Handle input change (Unchanged)
  const handleInputChange = (key: string, value: string) => {
    if (key === 'soilName') {
      setFormData(prev => ({ ...prev, [key]: value }));
    } else if (/^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  // --- UPDATED PREDICTION HANDLER ---
  const handlePrediction = async () => {
    // Validation (Unchanged)
    if (!formData.ph.trim()) {
      Alert.alert('Missing Information', `Please fill in the Soil pH field.`);
      return;
    }
    if (!formData.soilName.trim()) {
      Alert.alert('Missing Information', 'Please provide a Soil Name.');
      return;
    }
    setError('');

    try {
      // Collect parameters (Unchanged)
      const params = {
        temperature: parseFloat(formData.temperature) || 0,
        humidity: parseFloat(formData.humidity) || 0,
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall) || 0,
        soilName: formData.soilName.trim(),
      };
      
      const newPrediction = await predictCrop(params);
      
      savePrediction(newPrediction);
      
      // --- THIS IS THE FIX ---
      // Reset the manually-entered fields.
      // The weather data in 'prev' will be kept.
      setFormData(prev => ({
        ...prev,
        ph: '',
        soilName: ''
      }));
      // ----------------------
      
      router.replace({ 
        pathname: '/result', 
        params: { prediction: JSON.stringify(newPrediction) } 
      });

    } catch (err: any) {
      console.error(err);
      Alert.alert('Prediction Failed', err.message || 'An error occurred. Please try again.');
    }
  };

  // Helper for placeholders (Unchanged)
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
            <Text style={styles.subtitle}>Enter soil data to get a prediction.</Text>
        </View>

        {/* --- Render Input Fields (Unchanged) --- */}
        {inputFields.map(({ key, label, unit, icon: Icon }) => {
            const isWeatherField = key === 'temperature' || key === 'humidity' || key === 'rainfall';
            const isEditable = !(isFetchingWeather && isWeatherField);
            
            return (
              <View style={styles.inputGroup} key={key}>
                <Text style={styles.label}>{label} {unit && `(${unit})`}</Text>
                <View style={[styles.inputContainer, !isEditable && styles.inputDisabled]}>
                  <Icon style={styles.inputIcon} size={20} color="#6b7280" />
                  <TextInput
                    style={styles.input}
                    value={formData[key as keyof FormData]}
                    onChangeText={(text) => handleInputChange(key, text)}
                    placeholder={getPlaceholder(key)}
                    keyboardType={key === 'soilName' ? 'default' : 'decimal-pad'}
                    placeholderTextColor="#9ca3af"
                    editable={isEditable}
                  />
                </View>
              </View>
            )
        })}

        {/* --- Image Picker UI was already removed --- */}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handlePrediction}
          disabled={isLoading || isFetchingWeather}
          style={[styles.predictButton, (isLoading || isFetchingWeather) && styles.buttonDisabled]}
        >
          {(isLoading || isFetchingWeather) ? (
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

// --- Styles (Unchanged) ---
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
  inputDisabled: {
    backgroundColor: '#f3f4f6',
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
      opacity: 0.7,
  },
  predictButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});