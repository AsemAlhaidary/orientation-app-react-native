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
    scene.background = new THREE.Color(0x1a1a1a); // Dark background
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Create a sphere
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0x2194f3, wireframe: true });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Create axis lines
    const createAxis = (color, direction) => {
      const material = new THREE.LineBasicMaterial({ color, linewidth: 4 });
      const points = [new THREE.Vector3(0, 0, 0), direction.clone().multiplyScalar(1.5)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(geometry, material);
    };

    const upAxis = createAxis(0xff0000, new THREE.Vector3(0, 1, 0)); // Red - Up
    const northAxis = createAxis(0x00ff00, new THREE.Vector3(0, 0, -1)); // Green - North
    const frontAxis = createAxis(0x0000ff, new THREE.Vector3(1, 0, 0)); // Blue - Forward

    scene.add(upAxis);
    scene.add(northAxis);
    scene.add(frontAxis);

    camera.position.z = 3;

    const animate = () => {
      requestAnimationFrame(animate);

      const { alpha, beta, gamma } = orientationRef.current;

      sphere.rotation.order = 'ZXY';
      sphere.rotation.z = alpha;
      sphere.rotation.x = beta;
      sphere.rotation.y = gamma;

      upAxis.rotation.set(beta, gamma, alpha);
      northAxis.rotation.set(beta, gamma, alpha);
      frontAxis.rotation.set(beta, gamma, alpha);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
};

const OrientationDisplay = ({ orientation }) => (
  <View style={styles.overlay}>
    <Text style={styles.text}>Alpha (Z Rotation): {orientation.alpha.toFixed(2)}</Text>
    <Text style={styles.text}>Beta (X Rotation): {orientation.beta.toFixed(2)}</Text>
    <Text style={styles.text}>Gamma (Y Rotation): {orientation.gamma.toFixed(2)}</Text>
    <Text style={styles.label}>🔴 Up Axis - Shows device's upward direction</Text>
    <Text style={styles.label}>🟢 North Axis - Represents the north direction</Text>
    <Text style={styles.label}>🔵 Front Axis - Shows where the top of the device is pointing</Text>
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
    right: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)', // Darker overlay
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: '#FFFFFF', // White text
    fontSize: 16,
  },
  label: {
    color: '#FFD700', // Gold color for better readability
    fontSize: 14,
    marginTop: 5,
  },
});
