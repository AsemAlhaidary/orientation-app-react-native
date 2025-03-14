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

  // Radial gradient shader
  const gradientShader = {
    uniforms: {},
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float distance = length(vUv - center);
        float intensity = 1.0 - smoothstep(0.0, 0.7, distance);
        vec3 color = mix(vec3(0.0), vec3(0.9), intensity);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  };

  const onContextCreate = async (gl) => {
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0x1a1a1a); // Dark background
    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );

    camera.position.z = 5;

    const renderer = new ExpoTHREE.Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Add gradient background
    const bgGeometry = new THREE.PlaneGeometry(2, 2);
    const bgMaterial = new THREE.ShaderMaterial({
      ...gradientShader,
      depthTest: false,
      depthWrite: false
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    background.renderOrder = -1; // Ensure it renders first
    scene.add(background);

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
    cube.rotation.order = 'ZXY';
    scene.add(cube);

    const animate = () => {
      requestAnimationFrame(animate);

      const { alpha, beta, gamma } = orientationRef.current;

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