import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger with GSAP
gsap.registerPlugin(ScrollTrigger);

function Hero() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mixerRef = useRef(null);

  useEffect(() => {
    // Three.js Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    const updateCameraAndRenderer = () => {
      const isMobile = window.innerWidth <= 768;
      camera.fov = isMobile ? 90 : 75;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.position.set(0, isMobile ? 0.5 : 1, isMobile ? 2 : 3);
    };
    updateCameraAndRenderer();

    // Lighting
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Load GLTF Model
    const loader = new GLTFLoader();
    let model, headBone;
    loader.load(
      'https://threejs.org/examples/models/gltf/Soldier.glb', // Replace with your GLTF/GLB model URL
      (gltf) => {
        model = gltf.scene;
        scene.add(model);
        const isMobile = window.innerWidth <= 768;
        model.position.set(0, isMobile ? -0.5 : -1, 0);
        model.scale.set(isMobile ? 1 : 1.5, isMobile ? 1 : 1.5, isMobile ? 1 : 1.5);

        // Animation Mixer
        mixerRef.current = new THREE.AnimationMixer(model);
        const animations = gltf.animations;
        if (animations && animations.length) {
          const idleAction = mixerRef.current.clipAction(animations[0]); // Assume first animation is idle
          idleAction.play();
          // Gesture animation for scroll
          const gestureAction = mixerRef.current.clipAction(animations[1] || animations[0]); // Fallback to idle
          ScrollTrigger.create({
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            onEnter: () => {
              gestureAction.reset().fadeIn(0.5).play();
              idleAction.fadeOut(0.5);
            },
            onLeaveBack: () => {
              idleAction.reset().fadeIn(0.5).play();
              gestureAction.fadeOut(0.5);
            },
          });
        }

        // Find head bone for cursor tracking
        headBone = model.getObjectByName('Head'); // Adjust bone name based on your model
      },
      undefined,
      (error) => console.error('Error loading GLTF model:', error)
    );

    // Particle System for Background
    const particleCount = window.innerWidth <= 768 ? 50 : 100;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({ color: 0x00ff88, size: window.innerWidth <= 768 ? 0.05 : 0.1 });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1, 0);
    controls.enablePan = false;
    controls.touchZoomSpeed = 1.5; // Optimized for mobile touch

    // GSAP Intro Animation
    gsap.from(camera.position, {
      z: window.innerWidth <= 768 ? 3 : 5,
      duration: 2,
      ease: 'power2.out',
    });

    // Cursor/Touch Following
    const mouse = new THREE.Vector2();
    const handlePointerMove = (event) => {
      const isTouchEvent = event.type === 'touchmove';
      const clientX = isTouchEvent ? event.touches[0].clientX : event.clientX;
      const clientY = isTouchEvent ? event.touches[0].clientY : event.clientY;
      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      if (headBone) {
        gsap.to(headBone.rotation, {
          y: mouse.x * 0.3,
          x: mouse.y * 0.2,
          duration: 0.5,
        });
      }
    };
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // ScrollTrigger for Particle Movement
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        particles.rotation.y = self.progress * Math.PI;
      },
    });

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Window Resize
    const handleResize = () => {
      updateCameraAndRenderer();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      renderer.dispose();
    };
  }, []);

  return (
    <section ref={containerRef} className="relative h-screen flex flex-col items-center justify-center bg-secondary dark:bg-dark text-dark dark:text-secondary">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="relative z-10 text-center px-4">
        <h1 className="text-3xl md:text-5xl lg:text-7xl font-extrabold mb-2 md:mb-4 animate-slide-up">
          Welcome to My Digital World
        </h1>
        <p className="text-sm md:text-lg lg:text-xl max-w-md md:max-w-xl mx-auto leading-relaxed">
          Meet my 3D avatar — a glimpse into my passion for tech and creativity.
        </p>
      </div>
    </section>
  );
}

export default Hero;