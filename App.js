import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import { DeviceMotion } from 'expo-sensors';
import { BlurView } from 'expo-blur';

const useOrientation = () => {
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const orientationRef = useRef(orientation);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(16); // ~60fps

    const subscription = DeviceMotion.addListener((data) => {
      if (data.rotation) {
        const { alpha, beta, gamma } = data.rotation;
        const newOrientation = { alpha, beta, gamma };
        orientationRef.current = newOrientation;
        setOrientation(newOrientation);
      }
    });

    return () => subscription.remove();
  }, []);

  return { orientation, orientationRef };
};

const ThreeDScene = ({ orientationRef }) => {
  let animationFrameId;

  const onContextCreate = async (gl) => {
    const scene = new THREE.Scene();
    scene.background = null; // Make Three.js scene transparent

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    const renderer = new ExpoTHREE.Renderer({ 
      gl,
      alpha: true, // Enable transparency
      antialias: true 
    });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Cube geometry
    const geometry = new THREE.BoxGeometry();

    // Modified cube materials for dark theme
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x2194f3, // Blue color
      transparent: true,
      opacity: 0.3
    });

    // Gray wireframe material for borders
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0xAAAAAA, // Brighter gray
      linewidth: 4
    });

    // Create cube with transparent faces
    const cube = new THREE.Mesh(geometry, material);

    // Add wireframe borders
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      wireframeMaterial
    );

    cube.add(wireframe);
    scene.add(cube);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);

      const { alpha, beta, gamma } = orientationRef.current;

      cube.rotation.order = 'ZXY';
      cube.rotation.z = alpha;
      cube.rotation.x = beta;
      cube.rotation.y = gamma;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return (
    <GLView
      style={{ flex: 1 }}
      onContextCreate={onContextCreate}
    />
  );
};

const OrientationDisplay = ({ orientation }) => (
  <View style={styles.overlay}>
    <Text style={styles.text}>Alpha: {orientation.alpha.toFixed(2)}</Text>
    <Text style={styles.text}>Beta: {orientation.beta.toFixed(2)}</Text>
    <Text style={styles.text}>Gamma: {orientation.gamma.toFixed(2)}</Text>
  </View>
);

export default function App() {
  const { orientation, orientationRef } = useOrientation();

  return (
    <View style={styles.container}>
      {/* Background Container */}
      <View style={styles.background}>
        <BlurView 
          style={styles.radialGradient}
          intensity={30}
          tint="dark"
        >
          <View style={styles.gradientInner} />
        </BlurView>
      </View>

      {/* 3D Scene (should be on top of background) */}
      <ThreeDScene orientationRef={orientationRef} />

      {/* Orientation Display */}
      <OrientationDisplay orientation={orientation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  radialGradient: {
    width: '200%',
    height: '200%',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    borderRadius: 1000,
  },
  gradientInner: {
    flex: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)', // Darker overlay
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: '#FFFFFF', // White text
    fontSize: 16,
  },
});