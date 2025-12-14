import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, SlideInDown, SlideOutDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ModernAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  buttonText?: string;
}

export function ModernAlert({
  visible,
  title,
  message,
  type = 'success',
  onClose,
  buttonText = 'Tamam',
}: ModernAlertProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 saniye sonra otomatik kapanır

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return colors.tint;
      default:
        return '#10b981';
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'success':
        return isDark ? ['#064e3b', '#065f46'] : ['#d1fae5', '#a7f3d0'];
      case 'error':
        return isDark ? ['#7f1d1d', '#991b1b'] : ['#fee2e2', '#fecaca'];
      case 'warning':
        return isDark ? ['#78350f', '#92400e'] : ['#fef3c7', '#fde68a'];
      case 'info':
        return isDark ? ['#1e3a8a', '#1e40af'] : ['#dbeafe', '#bfdbfe'];
      default:
        return isDark ? ['#064e3b', '#065f46'] : ['#d1fae5', '#a7f3d0'];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      hardwareAccelerated
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInDown.duration(300).easing(Easing.out(Easing.quad))}
          exiting={SlideOutDown.duration(250).easing(Easing.in(Easing.quad))}
          style={styles.container}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.alertCard,
                {
                  backgroundColor: colors.card,
                  borderColor: getIconColor(),
                },
              ]}
            >
              <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
              <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}15` }]}>
                  <Ionicons name={getIcon()} size={32} color={getIconColor()} />
                </View>
                <View style={styles.textContainer}>
                  <ThemedText style={[styles.title, { color: colors.text }]}>
                    {title}
                  </ThemedText>
                  <ThemedText style={[styles.message, { color: colors.textSecondary }]}>
                    {message}
                  </ThemedText>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: getIconColor() }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.buttonText}>{buttonText}</ThemedText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: width,
    paddingHorizontal: 20,
    paddingBottom: 40,
    zIndex: 1000,
    position: 'relative',
  },
  alertCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
