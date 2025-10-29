import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Thermometer, CloudRain, TestTube2, Target, Camera, Image as ImageIcon, X, Sprout } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

// --- UPDATED INTERFACE (matches AuthContext) ---
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
  { key: 'ph', label: 'Soil pH (Otptional)', unit: '', icon: TestTube2, placeholder: 'e.g., 6.5' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', icon: CloudRain, placeholder: 'e.g., 120' },
  { key: 'soilName', label: 'Soil Name (Optional)', unit: '', icon: Sprout, placeholder: 'e.g., Alluvial Soil' },
];

export default function PredictScreen() {
  const router = useRouter();
  const { predictCrop, savePrediction, isLoading, weatherData, isFetchingWeather } = useAuth();
  
  // --- UPDATED STATE ---
  const [formData, setFormData] = useState<FormData>({
    temperature: '', humidity: '', ph: '', rainfall: '', soilName: ''
  });
  const [soilImage, setSoilImage] = useState<string | null>(null); // For image URI
  const [error, setError] = useState('');

  // Auto-fill weather data
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

  const handleInputChange = (key: string, value: string) => {
    // Allow non-numeric for soilName
    if (key === 'soilName') {
      setFormData(prev => ({ ...prev, [key]: value }));
    } else if (/^\d*\.?\d*$/.test(value)) { // Only numbers/decimal for others
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  // --- NEW IMAGE PICKER FUNCTIONS ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSoilImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please enable camera access in your settings.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSoilImage(result.assets[0].uri);
    }
  };
  
  // --- UPDATED PREDICTION HANDLER ---
  const handlePrediction = async () => {
    // ph is the only manually required numeric field
    if (!formData.ph.trim()) {
      Alert.alert('Missing Information', `Please fill in the Soil pH field.`);
      return;
    }
    // At least one soil identifier must be provided
    if (!formData.soilName.trim() && !soilImage) {
        Alert.alert('Missing Information', 'Please provide a Soil Name or Soil Image.');
        return;
    }
    setError('');

    try {
      // Collect all parameters
      const params = {
        temperature: parseFloat(formData.temperature) || 0,
        humidity: parseFloat(formData.humidity) || 0,
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall) || 0,
        soilName: formData.soilName.trim() || undefined,
        soilImageUri: soilImage || undefined,
      };
      
      const result = await predictCrop(params);
      
      const newPrediction: PredictionData = {
        id: result.id,
        crop: result.crop,
        confidence: result.confidence,
        date: new Date().toISOString().split('T')[0],
        parameters: params // Pass the whole params object
      };

      savePrediction(newPrediction);
      
      router.replace({ 
        pathname: '/result', 
        params: { prediction: JSON.stringify(newPrediction) } 
      });

    } catch (err) {
      console.error(err);
      Alert.alert('Prediction Failed', 'An error occurred. Please try again.');
    }
  };

  // Helper for placeholders
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

        {/* --- Render Input Fields --- */}
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

        {/* --- NEW Image Picker UI --- */}
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Soil Image (Optional)</Text>
            {soilImage ? (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: soilImage }} style={styles.imagePreview} />
                    <TouchableOpacity onPress={() => setSoilImage(null)} style={styles.removeImageButton}>
                        <X size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.imageButtonContainer}>
                    <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                        <Camera size={20} color="#166534" />
                        <Text style={styles.imageButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                        <ImageIcon size={20} color="#166534" />
                        <Text style={styles.imageButtonText}>From Gallery</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>


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

// --- UPDATED STYLES ---
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
  // --- NEW IMAGE STYLES ---
  imageButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    height: 50,
  },
  imageButtonText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- ----------------- ---
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