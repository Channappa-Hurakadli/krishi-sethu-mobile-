import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

// --- UPDATED INTERFACE ---
// We add locationName here
interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number; // rainfall in mm (last 1hr)
  locationName: string; // <-- FIX IS HERE
}

// --- DATA INTERFACES ---
interface User {
  name: string;
  email: string;
}
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

// --- MOCK API --- (No changes)
const mockAPI = {
  signIn: async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email && password) {
          resolve({ success: true, user: { name: 'Rajesh Kumar', email: email } });
        } else {
          resolve({ success: false, message: 'Invalid credentials' });
        }
      }, 1500);
    });
  },
  signUp: async (name: string, email: string, password: string, confirmPassword: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (name && email && password && password === confirmPassword) {
          resolve({ success: true, user: { name: name, email: email } });
        } else if (password !== confirmPassword) {
          resolve({ success: false, message: 'Passwords do not match' });
        } else {
          resolve({ success: false, message: 'Please fill all fields' });
        }
      }, 1500);
    });
  },
  predictCrop: async (params: any): Promise<{ crop: string; confidence: number; id: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const crops = [{ name: 'Rice', minConf: 85, maxConf: 95 }, { name: 'Wheat', minConf: 80, maxConf: 90 }, { name: 'Maize', minConf: 75, maxConf: 88 }];
        const selectedCrop = crops[Math.floor(Math.random() * crops.length)];
        const confidence = Math.floor(Math.random() * (selectedCrop.maxConf - selectedCrop.minConf + 1)) + selectedCrop.minConf;
        resolve({ crop: selectedCrop.name, confidence, id: Date.now().toString() });
      }, 2000);
    });
  },
  getHistory: async (): Promise<PredictionData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '1', crop: 'Rice', confidence: 92, date: '2024-01-15', parameters: { nitrogen: 90, phosphorus: 42, potassium: 43, temperature: 25, humidity: 80, ph: 6.5, rainfall: 120 }},
          { id: '2', crop: 'Wheat', confidence: 88, date: '2024-01-10', parameters: { nitrogen: 85, phosphorus: 38, potassium: 40, temperature: 22, humidity: 65, ph: 7.2, rainfall: 80 }},
        ]);
      }, 1000);
    });
  }
};

// --- CONTEXT DEFINITION --- (Updated)
interface AuthContextType {
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string, confirmPass: string) => Promise<void>;
  logout: () => void;
  predictCrop: (params: any) => Promise<any>;
  savePrediction: (prediction: PredictionData) => void;
  getHistory: () => Promise<void>;
  fetchLocationAndWeather: () => Promise<void>;
  user: User | null;
  predictions: PredictionData[];
  isLoading: boolean;
  authIsLoading: boolean;
  isFetchingWeather: boolean;
  weatherData: WeatherData | null; // This now includes locationName
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// --- PROVIDER COMPONENT --- (Updated)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(true);

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); 
      setUser(null); 
      setAuthIsLoading(false);
    }
    loadUser();
  }, []);

  // --- UPDATED FUNCTION ---
  const fetchLocationAndWeather = async () => {
    if (isFetchingWeather || weatherData) return;

    console.log("--- Starting fetchLocationAndWeather ---");
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
      console.log("Location:", locationResult.coords.latitude, locationResult.coords.longitude);

      // ---- YOUR API KEY IS HERE ----
      const API_KEY = 'WEATHER_API_KEY';

      // --- BUG FIX: I REMOVED THE FAULTY IF STATEMENT ---
      // We will now directly try to fetch.
      
      const fetchURL = `https://api.openweathermap.org/data/2.5/weather?lat=${locationResult.coords.latitude}&lon=${locationResult.coords.longitude}&appid=${API_KEY}&units=metric`;
      console.log("Fetching from URL:", fetchURL);

      const response = await fetch(fetchURL);
      
      if (!response.ok) {
        // This will tell you if the API key is wrong (e.g., 401 Unauthorized)
        console.error("Fetch failed:", response.status, response.statusText);
        throw new Error('Failed to fetch weather data.');
      }
      
      const data = await response.json();
      console.log("API Response Data:", data);
      
      // --- FIX: ADDED locationName and rainfall ---
      const fetchedWeather: WeatherData = {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        // This correctly gets rainfall (or 0 if not raining)
        rainfall: data.rain ? data.rain['1h'] || 0 : 0, 
        // This correctly gets the city name
        locationName: data.name || 'Unknown Location'
      };

      console.log("Setting weather data:", fetchedWeather);
      setWeatherData(fetchedWeather);

    } catch (error) {
      console.error("Error in fetchLocationAndWeather:", error);
      Alert.alert('Error', 'Could not fetch location or weather data.');
    } finally {
      setIsFetchingWeather(false);
      console.log("--- Finished fetchLocationAndWeather ---");
    }
  };


  const getHistory = async () => {
    const history = await mockAPI.getHistory();
    setPredictions(history);
  };

  const value = {
    signIn: async (email: string, pass: string) => {
        setIsLoading(true);
        const result = await mockAPI.signIn(email, pass);
        if(result.success && result.user) {
            setUser(result.user);
            await getHistory();
        } else {
            alert(result.message);
        }
        setIsLoading(false);
    },
    signUp: async (name: string, email: string, pass: string, confirmPass: string) => {
        setIsLoading(true);
        const result = await mockAPI.signUp(name, email, pass, confirmPass);
         if(result.success && result.user) {
            setUser(result.user);
            await getHistory();
        } else {
            alert(result.message);
        }
        setIsLoading(false);
    },
    logout: () => {
      setUser(null);
      setPredictions([]);
      setWeatherData(null); // Clear weather on logout
      setLocation(null); // Clear location on logout
    },
    predictCrop: (params: any) => {
        setIsLoading(true);
        return mockAPI.predictCrop(params).finally(() => setIsLoading(false));
    },
    savePrediction: (prediction: PredictionData) => {
        setPredictions(prev => [prediction, ...prev]);
    },
    getHistory,
    user,
    predictions,
    isLoading,
    authIsLoading,
    fetchLocationAndWeather,
    isFetchingWeather,
    weatherData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
