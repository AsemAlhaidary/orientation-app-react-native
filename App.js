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

  const onContextCreate = async (gl) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);

      const { alpha, beta, gamma } = orientationRef.current;

      cube.rotation.order = 'ZXY';
      cube.rotation.z = alpha; // Z-axis rotation (compass direction)
      cube.rotation.x = beta;  // X-axis rotation (front/back tilt)
      cube.rotation.y = gamma; // Y-axis rotation (left/right tilt)

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
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});