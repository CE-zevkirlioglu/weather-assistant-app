import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SplashScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Run intro animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to main tabs after splash
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
      ]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.title}>
          Weather Assistant
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Stay ahead of the forecast.
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
});

