import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Import AsyncStorage

// --- v VERY IMPORTANT v ---
// This is the URL of your backend.
// Replace 'YOUR_BACKEND_IP' with your computer's local IP address.
// DO NOT use 'localhost' if you are testing on a real device.
const API_URL = 'http://localhost:5000/api';
// --- ^ VERY IMPORTANT ^ ---


// --- INTERFACES (Matching our new backend) ---
interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  locationName: string;
}

interface User {
  _id: string; // From MongoDB
  name: string;
  email: string;
}

interface PredictionData {
  id: string; // This will be _id from MongoDB
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

// Params for creating a prediction
interface PredictionParams {
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
    soilName?: string;
    soilImageUri?: string;
}

// Context Definition
interface AuthContextType {
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  predictCrop: (params: PredictionParams) => Promise<PredictionData>; // Now returns the created prediction
  savePrediction: (prediction: PredictionData) => void; // We keep this to update UI instantly
  getHistory: () => Promise<void>;
  fetchLocationAndWeather: () => Promise<void>;
  user: User | null;
  predictions: PredictionData[];
  isLoading: boolean; // For general API calls (like predict)
  authIsLoading: boolean; // For initial auth load
  isFetchingWeather: boolean;
  weatherData: WeatherData | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// --- PROVIDER COMPONENT (Fully Integrated) ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // State to hold the auth token
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(true); // Start as true

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // --- NEW: Load user from storage on app start ---
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const { user, token } = JSON.parse(storedUserData);
          setUser(user);
          setToken(token);
          // Manually set the history (getHistory will be called by dashboard)
          // We set the token so getHistory() will work when it's called
        }
      } catch (e) {
        console.error("Failed to load user from storage", e);
      } finally {
        setAuthIsLoading(false); // We're done loading, show the app
      }
    }
    loadUser();
  }, []);
  
  // --- fetchLocationAndWeather (No changes) ---
  const fetchLocationAndWeather = async () => {
    // ... (This function is identical to my previous response, no changes needed)
    if (isFetchingWeather || weatherData) return;
    setIsFetchingWeather(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location access in settings.');
        setIsFetchingWeather(false);
        return;
      }
      let locationResult = await Location.getCurrentPositionAsync({});
      setLocation(locationResult.coords);
      // ---- YOUR API KEY IS HERE ----
      const API_KEY = 'WEATHER_API_KEY';
      console.log("Location:", locationResult.coords.latitude, locationResult.coords.longitude);

      

      // --- BUG FIX: I REMOVED THE FAULTY IF STATEMENT ---
      // We will now directly try to fetch.
      
      const fetchURL = `https://api.openweathermap.org/data/2.5/weather?lat=${locationResult.coords.latitude}&lon=${locationResult.coords.longitude}&appid=${API_KEY}&units=metric`;
      const response = await fetch(fetchURL);
      if (!response.ok) throw new Error('Failed to fetch weather data.');
      const data = await response.json();
      const fetchedWeather: WeatherData = {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        rainfall: data.rain ? data.rain['1h'] || 0 : 0, 
        locationName: data.name || 'Unknown Location'
      };
      setWeatherData(fetchedWeather);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingWeather(false);
    }
  };
  
  // --- NEW: getHistory (Integrated) ---
  const getHistory = async () => {
    if (!token) return; // Don't fetch if no token
    try {
        const response = await fetch(`${API_URL}/predictions/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!response.ok) {
             if(response.status === 401) logout(); // Bad token, log out
             throw new Error('Failed to fetch history');
        }
        const data: PredictionData[] = await response.json();
        setPredictions(data);
    } catch (error) {
        console.error(error);
    }
  };

  // --- NEW: signIn (Integrated) ---
  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      const userData = { user: { _id: data._id, name: data.name, email: data.email }, token: data.token };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData.user);
      setToken(userData.token);
      await getHistory(); // Fetch history after logging in
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: signUp (Integrated) ---
  const signUp = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }
      
      const userData = { user: { _id: data._id, name: data.name, email: data.email }, token: data.token };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData.user);
      setToken(userData.token);
      setPredictions([]); // New user, no predictions
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: logout (Integrated) ---
  const logout = async () => {
    await AsyncStorage.removeItem('userData');
    setUser(null);
    setToken(null);
    setPredictions([]);
    setWeatherData(null);
  };
  
  // --- NEW: predictCrop (Integrated) ---
  const predictCrop = async (params: PredictionParams): Promise<PredictionData> => {
    if (!token) throw new Error('Not authorized. Please log in.');
    setIsLoading(true);
    
    // 1. Create FormData
    const formData = new FormData();
    
    // 2. Append all text fields
    formData.append('ph', String(params.ph));
    formData.append('temperature', String(params.temperature));
    formData.append('humidity', String(params.humidity));
    formData.append('rainfall', String(params.rainfall));
    if (params.soilName) {
      formData.append('soilName', params.soilName);
    }

    // 3. Append the image file
    if (params.soilImageUri) {
        const filename = params.soilImageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename!);
        const type = match ? `image/${match[1]}` : `image`;

        // The 'as any' is a small hack to make TypeScript happy with React Native's file format
        formData.append('soilImage', { uri: params.soilImageUri, name: filename, type } as any);
    }
    
    try {
      const response = await fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' <-- DO NOT SET THIS.
          // fetch() sets it automatically with the correct boundary.
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Prediction failed');
      }
      
      return data; // This is the new PredictionData object
      
    } catch (error) {
        console.error(error);
        throw error; // Re-throw to be caught by predict.tsx
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- This function is now just for local UI state updates ---
  const savePrediction = (prediction: PredictionData) => {
    // Add new prediction to the top of the list for a snappy UI
    setPredictions(prev => [prediction, ...prev]);
  };


  const value: AuthContextType = {
    signIn,
    signUp: (name: string, email: string, pass: string, confirmPass?: string) => signUp(name, email, pass), // Adapt to old frontend call
    logout,
    predictCrop,
    savePrediction,
    getHistory,
    fetchLocationAndWeather,
    user,
    predictions,
    isLoading,
    authIsLoading,
    isFetchingWeather,
    weatherData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
