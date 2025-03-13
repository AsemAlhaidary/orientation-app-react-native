import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import { GLView } from 'expo-gl';
import * as THREE from 'three';

const App = () => {
  const [rotation, setRotation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const rotationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  useEffect(() => {
    const subscribe = async () => {
      try {
        const { status } = await DeviceMotion.requestPermissionsAsync();
        if (status === 'granted') {
          DeviceMotion.setUpdateInterval(16); // ~60 FPS
          const subscription = DeviceMotion.addListener((data) => {
            rotationRef.current = data.rotation;
            setRotation(data.rotation);
          });
          return subscription; // Return subscription to properly remove later
        } else {
          console.log('Permission denied');
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    const subscription = subscribe();

    return () => {
      subscription?.remove();
      DeviceMotion.removeAllListeners();
    };
  }, []);

  const onContextCreate = async (gl) => {
    console.log('GLView context created'); // Debug log
  
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setClearColor(0xffffff, 1); // Set background to white

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 3;

    const animate = () => {
      cube.rotation.x = rotationRef.current.beta;
      cube.rotation.y = rotationRef.current.gamma;
      cube.rotation.z = rotationRef.current.alpha;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    const renderLoop = () => {
      requestAnimationFrame(renderLoop);
      animate();
    };
    renderLoop();
  };

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
      <View style={styles.dataContainer}>
        <Text>Alpha: {rotation.alpha?.toFixed(2)}</Text>
        <Text>Beta: {rotation.beta?.toFixed(2)}</Text>
        <Text>Gamma: {rotation.gamma?.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  glView: {
    width: 300,
    height: 300,
    marginVertical: 20,
    backgroundColor: '#f0f0f0',
  },
  dataContainer: {
    alignItems: 'center',
  },
});

export default App;