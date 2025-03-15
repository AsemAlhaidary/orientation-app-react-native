import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import SensorFusion from 'react-native-sensor-fusion';

const ARROW_LENGTH = 1.5;
const ARROW_COLORS = {
  up: '#00ff00',     // Green (vertical)
  north: '#ff0000',  // Red (magnetic north)
  forward: '#0000ff' // Blue (device forward)
};

const useOrientation = () => {
  const [orientation, setOrientation] = useState({
    qw: 1, qx: 0, qy: 0, qz: 0
  });
  // const orientationRef = useRef(orientation);

  useEffect(() => {
    SensorFusion.start();
    const subscription = SensorFusion.onUpdate(setOrientation);

    return () => {
      SensorFusion.stop();
      subscription.remove();
    };
  }, []);

  return { orientation };
};

const ThreeDScene = ({ orientationRef }) => {
  // let animationFrameId;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    gl.drawingBufferWidth/gl.drawingBufferHeight,
    0.1,
    1000
  );

  // Create sphere
  const createSphere = () => {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x808080,
      wireframe: true
    });
    return new THREE.Mesh(geometry, material);
  };

  // Create directional arrows
  const createArrows = () => ({
    up: new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      ARROW_LENGTH,
      ARROW_COLORS.up
    ),
    north: new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0, 0),
      ARROW_LENGTH,
      ARROW_COLORS.north
    ),
    forward: new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      ARROW_LENGTH,
      ARROW_COLORS.forward
    )
  });

  const onContextCreate = async (gl) => {
    scene.background = new THREE.Color(0x1a1a1a); // Dark background
    camera.position.z = 5;

    // Create objects
    const sphere = createSphere();
    const arrows = createArrows();

    scene.add(sphere, ...Object.values(arrows));

    // Renderer setup
    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    const animate = () => {
      requestAnimationFrame(animate);

      // Update phone orientation
      const quaternion = new THREE.Quaternion(
        orientation.qx,
        orientation.qy,
        orientation.qz,
        orientation.qw
      );

      // Rotate sphere (phone body)
      sphere.quaternion.copy(quaternion);

      // Update forward vector (relative to phone orientation)
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyQuaternion(quaternion);
      arrows.forward.setDirection(forward.normalize());

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  return (
    <GLView
      style={styles.container}
      onContextCreate={onContextCreate}
    />
  );
};

const OrientationDisplay = ({ orientation }) => (
  <View style={styles.overlay}>
    <Text style={styles.text}>Quaternion:</Text>
    <Text style={styles.text}>W: {orientation.qw.toFixed(3)}</Text>
    <Text style={styles.text}>X: {orientation.qx.toFixed(3)}</Text>
    <Text style={styles.text}>Y: {orientation.qy.toFixed(3)}</Text>
    <Text style={styles.text}>Z: {orientation.qz.toFixed(3)}</Text>
  </View>
);

export default function App() {
  const { orientation } = useOrientation();

  return (
    <View style={styles.container}>
      <ThreeDScene orientationRef={orientationRef} />
      <OrientationDisplay orientation={orientation} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    backgroundColor: '#000'
  },
  overlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5
  },
  text: {
    color: '#fff',
    fontSize: 14
  }
});