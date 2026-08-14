import type { ReactNode } from "react";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

type AppOpeningTransitionProps = {
  children: ReactNode;
};

/**
 * A brief shell reveal that runs once when the app becomes available.
 * Motion is fully disabled when the device requests reduced motion.
 */
export function AppOpeningTransition({ children }: AppOpeningTransitionProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    progress.value = reducedMotion
      ? 1
      : withTiming(1, {
          duration: 260,
          easing: Easing.out(Easing.cubic),
        });
  }, [progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={[styles.shell, animatedStyle]}>{children}</Animated.View>;
}

const styles = {
  shell: { flex: 1 },
};
