import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Droplets, Thermometer, CloudRain, TestTube, Target, Leaf } from 'lucide-react-native';

const inputFields = [
  { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'kg/ha', icon: TestTube, placeholder: 'e.g., 90' },
  { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'kg/ha', icon: TestTube, placeholder: 'e.g., 42' },
  { key: 'potassium', label: 'Potassium (K)', unit: 'kg/ha', icon: TestTube, placeholder: 'e.g., 43' },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, placeholder: 'e.g., 25.5' },
  { key: 'humidity', label: 'Humidity', unit: '%', icon: Droplets, placeholder: 'e.g., 80.2' },
  { key: 'ph', label: 'Soil pH', unit: '', icon: TestTube, placeholder: 'e.g., 6.5' },
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', icon: CloudRain, placeholder: 'e.g., 120.5' },
];

const PredictScreen = () => {
  const { predictCrop, isLoading, savePrediction } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  });

  const handlePrediction = async () => {
    const requiredFields = ['nitrogen', 'phosphorus', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData].trim());
    
    if (missingFields.length > 0) {
      Alert.alert('Missing Information', 'Please fill all the fields to get a prediction.');
      return;
    }

    try {
      const result = await predictCrop(formData);
      const newPrediction = {
        id: result.id,
        crop: result.crop,
        confidence: result.confidence,
        date: new Date().toISOString().split('T')[0],
        parameters: {
          nitrogen: parseFloat(formData.nitrogen),
          phosphorus: parseFloat(formData.phosphorus),
          potassium: parseFloat(formData.potassium),
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          ph: parseFloat(formData.ph),
          rainfall: parseFloat(formData.rainfall)
        }
      };
      
      savePrediction(newPrediction);
      
      // Navigate to a new result screen, passing the prediction data
      router.replace({ pathname: '/result', params: { prediction: JSON.stringify(newPrediction) } });

    } catch (err) {
      Alert.alert('Prediction Failed', 'An error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconHeader}>
            <Leaf size={48} color="#166534" />
        </View>
        <Text style={styles.title}>New Soil Analysis</Text>
        <Text style={styles.subtitle}>Enter the parameters below to predict the best crop to plant.</Text>

        {inputFields.map(({ key, label, unit, icon: Icon, placeholder }) => (
          <View key={key} style={styles.inputContainer}>
            <Text style={styles.label}>{label} {unit && `(${unit})`}</Text>
            <View style={styles.inputWrapper}>
              <Icon style={styles.inputIcon} size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                value={formData[key as keyof typeof formData]}
                onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
                placeholder={placeholder}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePrediction}
          disabled={isLoading}
        >
          {isLoading ? (
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    container: {
        padding: 24,
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
        backgroundColor: '#6ee7b7',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PredictScreen;
