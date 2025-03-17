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
  const onContextCreate = async (gl) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Arrow helpers (direction vectors)
    const upArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, 0x00ff00);
    const northArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 0, 0), 1, 0xff0000);
    const forwardArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1, 0x0000ff);
    scene.add(upArrow, northArrow, forwardArrow);

    const animate = () => {
      requestAnimationFrame(animate);
      
      const { alpha, beta, gamma } = orientationRef.current;
      const quaternion = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(beta, alpha, -gamma, 'YXZ')
      );
      
      sphere.quaternion.copy(quaternion);
      upArrow.setDirection(new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion));
      northArrow.setDirection(new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion));
      forwardArrow.setDirection(new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion));
      
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />;
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
    backgroundColor: '#000000',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
