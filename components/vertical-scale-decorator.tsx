import React from 'react';
import { useOnCellActiveAnimation } from 'react-native-draggable-flatlist';
import Animated, { useAnimatedStyle, interpolate, withSpring } from 'react-native-reanimated';

type VerticalScaleDecoratorProps = {
  children: React.ReactNode;
  activeScale?: number;
};

export function VerticalScaleDecorator({ children, activeScale = 1.05 }: VerticalScaleDecoratorProps) {
  const { onActiveAnim } = useOnCellActiveAnimation();
  
  const style = useAnimatedStyle(() => {
    const scaleY = withSpring(
      interpolate(
        onActiveAnim.value,
        [0, 1],
        [1, activeScale]
      ),
      {
        damping: 15,
        stiffness: 150,
      }
    );
    
    return {
      transform: [{ scaleY }],
    };
  }, [activeScale]);
  
  return <Animated.View style={style}>{children}</Animated.View>;
}
