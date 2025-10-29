import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import SplashScreen from '../screens/SplashScreen';

const RootLayoutNav = () => {
  // Get the new function from useAuth
  const { user, authIsLoading, fetchLocationAndWeather } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authIsLoading) return; 
    const inTabsGroup = segments[0] === '(tabs)';

    if (user && !inTabsGroup) {
      router.replace('/(tabs)');
    } else if (!user && inTabsGroup) {
      router.replace('/signin');
    }
  }, [user, authIsLoading, segments, router]);

  // --- NEW EFFECT HOOK ---
  // This separate effect will run whenever 'user' changes.
  // If the user logs in (user object appears), it triggers the fetch.
  useEffect(() => {
    if (user) {
      fetchLocationAndWeather();
    }
  }, [user]); // Dependency array ensures this runs when user logs in

  if (authIsLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="signin" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="signup" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="predict" options={{ presentation: 'modal', title: "New Prediction" }} />
      <Stack.Screen name="result" options={{ presentation: 'modal', title: "Prediction Result" }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}