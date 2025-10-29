import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
// Added new icons
import { Droplets, Thermometer, CloudRain, TestTube2 as TestTube, Target, Leaf, Sprout, Camera, Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker'; // Added ImagePicker

// --- UPDATED Input Fields ---
// Removed N, P, K and added Soil Name
const inputFields = [
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, placeholder: 'e.g., 25.5' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: Droplets, placeholder: 'e.g., 80.2' },
  { key: 'ph', label: 'Soil pH', unit: '', icon: TestTube, placeholder: 'e.g., 6.5' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', icon: CloudRain, placeholder: 'e.g., 120.5' },
  { key: 'soilName', label: 'Soil Name (Optional)', unit: '', icon: Sprout, placeholder: 'e.g., Alluvial Soil' },
];

// FormData state type
type FormData = {
    temperature: string;
    humidity: string;
    ph: string;
    rainfall: string;
    soilName: string;
};

// --- UPDATED PredictionData type (to match backend) ---
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

const PredictScreen = () => {
  // Get new weather data and loading states from context
  const { predictCrop, isLoading, savePrediction, weatherData, isFetchingWeather } = useAuth();
  const router = useRouter();

  // --- UPDATED State ---
  // Removed N, P, K and added soilName
  const [formData, setFormData] = useState<FormData>({
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    soilName: ''
  });
  const [soilImage, setSoilImage] = useState<string | null>(null); // For image URI

  // --- NEW: Auto-fill weather data ---
  useEffect(() => {
    if (weatherData) {
      setFormData(prev => ({
        ...prev,
        temperature: String(weatherData.temperature ?? ''),
        humidity: String(weatherData.humidity ?? ''),
        rainfall: String(weatherData.rainfall ?? ''),
      }));
    }
  }, [weatherData]); // Runs when weatherData is fetched

  // --- NEW: Handle text input change ---
  const handleInputChange = (key: string, value: string) => {
    if (key === 'soilName') {
      setFormData(prev => ({ ...prev, [key]: value }));
    } else if (/^\d*\.?\d*$/.test(value)) { // Only numbers/decimal for others
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  // --- NEW: Image Picker Functions ---
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

  // --- UPDATED: Prediction Handler ---
  const handlePrediction = async () => {
    // Updated validation
    if (!formData.ph.trim()) {
      Alert.alert('Missing Information', 'Please fill in the Soil pH field.');
      return;
    }
    if (!formData.soilName.trim() && !soilImage) {
        Alert.alert('Missing Information', 'Please provide a Soil Name or Soil Image.');
        return;
    }

    try {
      // Create the params object for the API
      const params = {
        temperature: parseFloat(formData.temperature) || 0,
        humidity: parseFloat(formData.humidity) || 0,
        ph: parseFloat(formData.ph),
        rainfall: parseFloat(formData.rainfall) || 0,
        soilName: formData.soilName.trim() || undefined,
        soilImageUri: soilImage || undefined,
      };

      // The new `predictCrop` returns the full prediction object from the backend
      const newPrediction: PredictionData = await predictCrop(params);
      
      // Save to local state for instant UI update
      savePrediction(newPrediction);
      
      // Navigate to the result screen
      router.replace({ 
        pathname: '/result', 
        params: { prediction: JSON.stringify(newPrediction) } 
      });

    } catch (err: any) {
      Alert.alert('Prediction Failed', err.message || 'An error occurred. Please try again.');
    }
  };

  // --- NEW: Placeholder helper ---
  const getPlaceholder = (key: string) => {
    const field = inputFields.find(f => f.key === key);
    if (isFetchingWeather && (key === 'temperature' || key === 'humidity' || key === 'rainfall')) {
        return 'Fetching weather...';
    }
    return field?.placeholder;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconHeader}>
            <Leaf size={48} color="#166534" />
        </View>
        <Text style={styles.title}>New Soil Analysis</Text>
        <Text style={styles.subtitle}>Enter the parameters below to predict the best crop to plant.</Text>

        {/* --- UPDATED: Input field rendering --- */}
        {inputFields.map(({ key, label, unit, icon: Icon, placeholder }) => {
            const isWeatherField = key === 'temperature' || key === 'humidity' || key === 'rainfall';
            const isEditable = !(isFetchingWeather && isWeatherField);

            return (
              <View key={key} style={styles.inputContainer}>
                <Text style={styles.label}>{label} {unit && `(${unit})`}</Text>
                <View style={[styles.inputWrapper, !isEditable && styles.inputDisabled]}>
                  <Icon style={styles.inputIcon} size={20} color="#9ca3af" />
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

        {/* --- NEW: Image Picker UI --- */}
        <View style={styles.inputContainer}>
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

        <TouchableOpacity
          style={[styles.button, (isLoading || isFetchingWeather) && styles.buttonDisabled]}
          onPress={handlePrediction}
          disabled={isLoading || isFetchingWeather}
        >
          {(isLoading || isFetchingWeather) ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Target size={20} color="#fff" />
              <Text style={styles.buttonText}>Predict Best Crop</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- UPDATED: Added new styles ---
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    container: {
        padding: 24,
        paddingBottom: 48, // Added padding
    },
    iconHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        marginLeft: 12,
    },
    input: {
        flex: 1,
        height: 50,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#1f2937',
    },
    inputDisabled: { // New style
        backgroundColor: '#f3f4f6',
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
    button: {
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 10,
    },
    buttonDisabled: {
        backgroundColor: '#166534', // Changed color
        opacity: 0.7, // Added opacity
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PredictScreen;