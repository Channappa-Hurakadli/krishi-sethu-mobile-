import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// --- DATA INTERFACES --- (No changes here)
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

// --- MOCK API --- (No changes here)
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

// --- CONTEXT DEFINITION --- (FIX APPLIED HERE)
interface AuthContextType {
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (name: string, email: string, pass: string, confirmPass: string) => Promise<void>;
  logout: () => void;
  predictCrop: (params: any) => Promise<any>;
  savePrediction: (prediction: PredictionData) => void;
  getHistory: () => Promise<void>; // Added this line
  user: User | null;
  predictions: PredictionData[];
  isLoading: boolean;
  authIsLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// --- PROVIDER COMPONENT --- (No changes needed here for this fix)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authIsLoading, setAuthIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); 
      setUser(null); 
      setAuthIsLoading(false);
    }
    loadUser();
  }, []);


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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

