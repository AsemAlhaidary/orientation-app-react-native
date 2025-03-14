import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import { DeviceMotion } from 'expo-sensors';

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
  // const camera = useRef<THREE.PerspectiveCamera | null>(null);

  const onContextCreate = async (gl) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Dark background

    // Set up camera with angled position
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    // // Position camera 30 degrees above the back
    // const radius = 5; // Distance from cube
    // const angle = 30 * (Math.PI / 180); // Convert degrees to radians
    // camera.position.set(
    //   0,
    //   radius * Math.sin(angle),  // Vertical position
    //   -radius * Math.cos(angle)  // Horizontal position (negative z = behind)
    // );
    // camera.lookAt(0, 0, 0); // Make camera focus on cube

    const renderer = new ExpoTHREE.Renderer({ gl });
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
      linewidth: 2
    });

    // Create cube with transparent faces
    const cube = new THREE.Mesh(geometry, material);

    // Add wireframe borders
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      wireframeMaterial
    );

    cube.add(wireframe);
    cube.rotation.order = 'YXZ'; // Important rotation order for device orientation
    scene.add(cube);

    // camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);

      const { alpha, beta, gamma } = orientationRef.current;

      // Convert device orientation to Three.js rotations
      cube.rotation.set(
        -beta,          // X-axis (vertical tilt)
        alpha,          // Y-axis (compass direction)
        -gamma          // Z-axis (horizontal tilt)
      );

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
      <ThreeDScene orientationRef={orientationRef} />
      <OrientationDisplay orientation={orientation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Black background
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