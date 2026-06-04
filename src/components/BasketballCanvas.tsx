"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface BasketballCanvasProps {
  ballColor: string;
  isFloating?: boolean;
  renderScale?: number;
  onLoaded?: () => void;
}

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getValidHexColor = (hexColor: string) =>
  HEX_COLOR_PATTERN.test(hexColor) ? hexColor : "#ff5500";

const rgbToHsl = (red: number, green: number, blue: number) => {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    switch (max) {
      case red:
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        hue = (blue - red) / delta + 2;
        break;
      default:
        hue = (red - green) / delta + 4;
        break;
    }

    hue /= 6;
  }

  return { hue, saturation, lightness };
};

const hueToRgb = (p: number, q: number, t: number) => {
  let value = t;
  if (value < 0) value += 1;
  if (value > 1) value -= 1;
  if (value < 1 / 6) return p + (q - p) * 6 * value;
  if (value < 1 / 2) return q;
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
  return p;
};

const hslToRgb = (hue: number, saturation: number, lightness: number) => {
  if (saturation === 0) {
    return { red: lightness, green: lightness, blue: lightness };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    red: hueToRgb(p, q, hue + 1 / 3),
    green: hueToRgb(p, q, hue),
    blue: hueToRgb(p, q, hue - 1 / 3),
  };
};

const createTintedTexture = (
  sourceTexture: THREE.Texture,
  hexColor: string,
) => {
  const image = sourceTexture.image as CanvasImageSource & {
    height?: number;
    naturalHeight?: number;
    naturalWidth?: number;
    width?: number;
  };
  const width = image.naturalWidth || image.width || 0;
  const height = image.naturalHeight || image.height || 0;

  if (width === 0 || height === 0) return null;

  const targetColor = new THREE.Color(hexColor);
  const targetHsl = rgbToHsl(targetColor.r, targetColor.g, targetColor.b);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i] / 255;
    const green = data[i + 1] / 255;
    const blue = data[i + 2] / 255;
    const sourceHsl = rgbToHsl(red, green, blue);
    const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

    // Keep the black channels, logo grooves, and deepest texture pores dark.
    const leatherMask =
      clamp((sourceHsl.saturation - 0.08) / 0.22, 0, 1) *
      clamp((luminance - 0.16) / 0.26, 0, 1);

    if (leatherMask === 0) continue;

    const tintedRgb = hslToRgb(
      targetHsl.hue,
      Math.max(targetHsl.saturation, 0.36),
      clamp(sourceHsl.lightness * 0.9 + 0.08, 0.12, 0.78),
    );

    data[i] = Math.round(
      (red * (1 - leatherMask) + tintedRgb.red * leatherMask) * 255,
    );
    data[i + 1] = Math.round(
      (green * (1 - leatherMask) + tintedRgb.green * leatherMask) * 255,
    );
    data[i + 2] = Math.round(
      (blue * (1 - leatherMask) + tintedRgb.blue * leatherMask) * 255,
    );
  }

  context.putImageData(imageData, 0, 0);

  const tintedTexture = new THREE.CanvasTexture(canvas);
  tintedTexture.colorSpace = sourceTexture.colorSpace;
  tintedTexture.flipY = sourceTexture.flipY;
  tintedTexture.wrapS = sourceTexture.wrapS;
  tintedTexture.wrapT = sourceTexture.wrapT;
  tintedTexture.minFilter = sourceTexture.minFilter;
  tintedTexture.magFilter = sourceTexture.magFilter;
  tintedTexture.anisotropy = sourceTexture.anisotropy;
  tintedTexture.needsUpdate = true;

  return tintedTexture;
};

// Helper to tint leather parts of the ball (declared outside to satisfy linter dependencies)
const applyColorTint = (model: THREE.Group, hexColor: string) => {
  if (!HEX_COLOR_PATTERN.test(hexColor)) return;

  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        for (const mat of materials) {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.color.set(0xffffff);

            if (!mat.map) {
              mat.color.set(hexColor);
              continue;
            }

            const originalMap =
              (mat.userData.originalMap as THREE.Texture | undefined) ??
              mat.map;
            const previousTintedMap = mat.userData.tintedMap as
              | THREE.Texture
              | undefined;
            const tintedMap = createTintedTexture(originalMap, hexColor);

            if (tintedMap) {
              mat.userData.originalMap = originalMap;
              mat.userData.tintedMap = tintedMap;
              mat.map = tintedMap;
              mat.needsUpdate = true;

              if (previousTintedMap && previousTintedMap !== tintedMap) {
                previousTintedMap.dispose();
              }
            }
          }
        }
      }
    }
  });
};

export default function BasketballCanvas({
  ballColor,
  isFloating = true,
  renderScale = 1,
  onLoaded,
}: BasketballCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const basketballRef = useRef<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Store ballColor in ref to avoid re-running initialization effect
  const ballColorRef = useRef(ballColor);
  ballColorRef.current = ballColor;

  const isFloatingRef = useRef(isFloating);
  isFloatingRef.current = isFloating;

  const renderScaleRef = useRef(renderScale);
  renderScaleRef.current = renderScale;

  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLight2Ref = useRef<THREE.DirectionalLight | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);

  const updateAccentLights = useCallback((hexColor: string) => {
    const accentColor = new THREE.Color(getValidHexColor(hexColor));
    const accentHsl = { h: 0, s: 0, l: 0 };
    accentColor.getHSL(accentHsl);
    accentColor.setHSL(accentHsl.h, Math.min(accentHsl.s * 0.75, 0.85), 0.62);

    rimLightRef.current?.color.copy(accentColor);
    rimLight2Ref.current?.color.copy(accentColor);
    glowLightRef.current?.color.copy(accentColor);
  }, []);

  // Effect for dynamic color updates
  useEffect(() => {
    if (basketballRef.current) {
      applyColorTint(basketballRef.current, ballColor);
    }
    updateAccentLights(ballColor);
  }, [ballColor, updateAccentLights]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // Transparent background
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const getTargetPixelRatio = () =>
      Math.min(window.devicePixelRatio * renderScaleRef.current, 4);
    renderer.setPixelRatio(getTargetPixelRatio());

    // Group to hold the basketball for easy rotation
    const ballGroup = new THREE.Group();
    scene.add(ballGroup);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1028;
    keyLight.shadow.mapSize.height = 1028;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xa5c9ff, 0.8);
    fillLight.position.set(-5, 0, 2);
    scene.add(fillLight);

    // Back rim lights use the active ball color so custom tints do not leave orange highlights.
    const rimLight = new THREE.DirectionalLight(0xffffff, 3.5);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    const rimLight2 = new THREE.DirectionalLight(0xffffff, 2.0);
    rimLight2.position.set(4, -2, -3);
    scene.add(rimLight2);
    rimLight2Ref.current = rimLight2;

    const glowLight = new THREE.PointLight(0xffffff, 4.0, 10);
    glowLight.position.set(0, 0, -2);
    scene.add(glowLight);
    glowLightRef.current = glowLight;
    updateAccentLights(ballColorRef.current);

    // Load Model
    const loader = new GLTFLoader();

    loader.load(
      "/basketball/scene.gltf",
      (gltf) => {
        const basketball = gltf.scene;

        basketball.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              const mat = child.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.max(mat.roughness, 0.45);
              mat.metalness = Math.min(mat.metalness, 0.1);

              if (mat.normalScale) {
                mat.normalScale.set(1.5, 1.5);
              }

              for (const texture of [
                mat.map,
                mat.normalMap,
                mat.roughnessMap,
                mat.metalnessMap,
                mat.aoMap,
              ]) {
                if (texture) {
                  texture.anisotropy = maxAnisotropy;
                  texture.needsUpdate = true;
                }
              }
            }
          }
        });

        // Center and scale
        const box = new THREE.Box3().setFromObject(basketball);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        basketball.position.x += basketball.position.x - center.x;
        basketball.position.y += basketball.position.y - center.y;
        basketball.position.z += basketball.position.z - center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.4 / maxDim;
        basketball.scale.setScalar(targetScale);

        // Apply dynamic color tint immediately upon load
        applyColorTint(basketball, ballColorRef.current);

        basketballRef.current = basketball;
        ballGroup.add(basketball);
        setLoading(false);
        onLoaded?.();
      },
      (xhr) => {
        if (xhr.total > 0) {
          setProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (error) => {
        console.error("Error loading basketball GLB model:", error);
        setLoading(false);
      },
    );

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;

    let isInteracting = false;
    controls.addEventListener("start", () => {
      isInteracting = true;
    });
    controls.addEventListener("end", () => {
      isInteracting = false;
    });

    // Track mouse move for subtle interactive tilting (parallax effect)
    let targetRotationX = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      targetRotationX = -y * 0.25;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(getTargetPixelRatio());
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const targetPixelRatio = getTargetPixelRatio();
      if (renderer.getPixelRatio() !== targetPixelRatio) {
        renderer.setPixelRatio(targetPixelRatio);
        renderer.setSize(container.clientWidth, container.clientHeight);
      }

      // Constant slow spin
      if (basketballRef.current && !isInteracting) {
        ballGroup.rotation.y += 0.004;
      } else {
        ballGroup.rotation.y += 0.002;
      }

      // Gentle floating animation
      const elapsedTime = clock.getElapsedTime();
      const targetY = isFloatingRef.current
        ? Math.sin(elapsedTime * 1.5) * 0.08
        : 0;
      ballGroup.position.y += (targetY - ballGroup.position.y) * 0.1;

      // Apply pointer parallax
      ballGroup.rotation.x += (targetRotationX - ballGroup.rotation.x) * 0.05;
      ballGroup.rotation.z = Math.sin(elapsedTime * 0.5) * 0.05;

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      rimLightRef.current = null;
      rimLight2Ref.current = null;
      glowLightRef.current = null;

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            for (const mat of object.material) mat.dispose();
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, [updateAccentLights]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d]/80 backdrop-blur-md rounded-3xl">
          <div className="w-12 h-12 border-2 border-neutral-700 border-t-orange-500 rounded-full animate-spin mb-4" />
          <p className="text-orange-500 font-mono text-xs tracking-[0.2em] font-semibold uppercase animate-pulse">
            LOADING MODEL {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
