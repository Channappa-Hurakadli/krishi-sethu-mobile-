import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- v VERY IMPORTANT v ---
// This is the URL of your backend.
// Replace 'YOUR_BACKEND_IP' with your computer's local IP address.
const API_URL = 'http://localhost:5000/api';
// --- ^ VERY IMPORTANT ^ ---

// --- INTERFACES ---
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
// --- UPDATED: PredictionData (no soilImageUri) ---
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
    // soilImageUri removed
  };
}

// --- UPDATED: PredictionParams (no soilImageUri) ---
interface PredictionParams {
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
    soilName?: string;
    // soilImageUri removed
}

// Context Definition
interface AuthContextType {
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  predictCrop: (params: PredictionParams) => Promise<PredictionData>;
  savePrediction: (prediction: PredictionData) => void;
  getHistory: () => Promise<void>;
  fetchLocationAndWeather: () => Promise<void>;
  user: User | null;
  predictions: PredictionData[];
  isLoading: boolean;
  authIsLoading: boolean;
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

// --- PROVIDER COMPONENT ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  // useEffect loadUser
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const { user, token } = JSON.parse(storedUserData);
          setUser(user);
          setToken(token);
          await getHistory(token); 
        }
      } catch (e) { console.error("Failed to load user", e); }
      finally { setAuthIsLoading(false); }
    }
    loadUser();
  }, []);
  
  // fetchLocationAndWeather
  const fetchLocationAndWeather = async () => {
     if (isFetchingWeather || weatherData) return;
    setIsFetchingWeather(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
<<<<<<< HEAD
      if (status !== 'granted') { Alert.alert('Permission Denied', '...'); setIsFetchingWeather(false); return; }
      let loc = await Location.getCurrentPositionAsync({}); setLocation(loc.coords);
      const API_KEY = 'bdcc754e794c6939b366dbdb9eb8deb9'; // Your key
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url); if (!res.ok) throw new Error('Weather fetch failed.');
      const data = await res.json();
      setWeatherData({ temperature: data.main.temp, humidity: data.main.humidity, rainfall: data.rain ? data.rain['1h'] || 0 : 0, locationName: data.name || 'Unknown'});
    } catch (error) { console.error(error); }
    finally { setIsFetchingWeather(false); }
=======
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
>>>>>>> f256e199e6e958462cca35311a121a2465741a2b
  };
  
  // getHistory
  const getHistory = async (loadedToken?: string | null) => {
    const activeToken = token || loadedToken;
    if (!activeToken) return;
    try {
      const res = await fetch(`${API_URL}/predictions/history`, { headers: { 'Authorization': `Bearer ${activeToken}` }});
      if (!res.ok) { if(res.status === 401) logout(); throw new Error('History fetch failed'); }
      const data = await res.json(); setPredictions(data);
    } catch (error) { console.error(error); }
  };
  
  // signIn
  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Login failed');
      const userData = { user: { _id: data._id, name: data.name, email: data.email }, token: data.token };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData.user); setToken(userData.token); await getHistory(userData.token);
    } catch (error: any) { Alert.alert('Login Failed', error.message); }
    finally { setIsLoading(false); }
  };
  
  // signUp
  const signUp = async (name: string, email: string, pass: string) => {
     setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password: pass }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Sign up failed');
      const userData = { user: { _id: data._id, name: data.name, email: data.email }, token: data.token };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData.user); setToken(userData.token); await getHistory(userData.token);
    } catch (error: any) { Alert.alert('Sign Up Failed', error.message); }
    finally { setIsLoading(false); }
  };

  // logout
  const logout = async () => {
    await AsyncStorage.removeItem('userData');
    setUser(null);
    setToken(null);
    setPredictions([]);
    setWeatherData(null);
  };


  // --- UPDATED: predictCrop (Switched back to JSON) ---
  const predictCrop = async (params: PredictionParams): Promise<PredictionData> => {
    if (!token) throw new Error('Not authorized. Please log in.');
    setIsLoading(true);
    
    // We are no longer sending FormData, just plain JSON.
    console.log("AuthContext: Sending this JSON payload:", params);
    
    try {
      const response = await fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // --- FIX: We MUST send application/json ---
          'Content-Type': 'application/json',
        },
        // --- FIX: Send 'params' directly as a JSON string ---
        body: JSON.stringify(params), 
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Prediction failed');
      }
      return data;
    } catch (error) {
        console.error("Error in predictCrop:", error);
        throw error;
    } finally {
      setIsLoading(false);
    }
  };
  // --- END OF FIX ---
  
  const savePrediction = (prediction: PredictionData) => {
    setPredictions(prev => [prediction, ...prev]);
  };

  const value: AuthContextType = {
    signIn,
    signUp: (name: string, email: string, pass: string, confirmPass?: string) => signUp(name, email, pass),
    logout,
    predictCrop,
    savePrediction,
    getHistory: () => getHistory(),
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