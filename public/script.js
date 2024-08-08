// Set up scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Check if WebGL is supported
if (!renderer.getContext("webgl")) {
  alert("Your browser does not support WebGL. Please use a different browser.");
} else {
  initializeScene();
}

// Function to initialize the scene
function initializeScene() {
  // Create gradient background
  const gradientTexture = new THREE.Texture(generateGradientTexture());
  gradientTexture.needsUpdate = true;
  const gradientMaterial = new THREE.MeshBasicMaterial({
    map: gradientTexture,
    depthWrite: false,
  });
  const gradientPlane = new THREE.PlaneGeometry(2, 2);
  const gradientQuad = new THREE.Mesh(gradientPlane, gradientMaterial);
  gradientQuad.position.z = -1000;
  scene.add(gradientQuad);

  // Create main torus
  const torusGeometry = new THREE.TorusGeometry(10, 3, 16, 100);
  const torusMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ccff,
    specular: 0x555555,
    shininess: 30,
  });
  const torus = new THREE.Mesh(torusGeometry, torusMaterial);
  scene.add(torus);

  // Create text
  const loader = new THREE.FontLoader();
  let scrollTextMeshes = [];

  loader.load(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
    function (font) {
      const textGeometries = [
        new THREE.TextGeometry("Scroll to explore", {
          font: font,
          size: 2.5,
          height: 0.3,
        }),
      ];

      const textMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          varying vec2 vUv;
          void main() {
            float r = sin(vUv.x * 10.0 + time) * 0.5 + 0.5;
            float g = sin(vUv.x * 10.0 + time + 2.094) * 0.5 + 0.5;
            float b = sin(vUv.x * 10.0 + time + 4.188) * 0.5 + 0.5;
            gl_FragColor = vec4(r, g, b, 1.0);
          }
        `,
      });

      for (let i = 0; i < textGeometries.length; i++) {
        const scrollTextMesh = new THREE.Mesh(textGeometries[i], textMaterial);
        scrollTextMesh.position.set(0, -1, 0);
        // Center the text initially
        scene.add(scrollTextMesh);
        scrollTextMeshes.push(scrollTextMesh);
      }
    }
  );

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(30, 20, 20);
  scene.add(pointLight);

  // Position camera
  camera.position.z = 30;

  // Create stars
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
  });

  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 1000;
    const z = -Math.random() * 100;
    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starsVertices, 3)
  );
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // Create particle system
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCnt = 5000;
  const posArray = new Float32Array(particlesCnt * 3);

  for (let i = 0; i < particlesCnt * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Scroll-based navigation
  let currentSection = 0;
  const totalSections = 4;
  let scrollY = 0;
  let scrollDirection = 1; // 1 for right, -1 for left
  let previousScrollDirection = 1;
  let zigzagDirection = 1;

  // Add event listeners for both mouse wheel and scrollbar
  window.addEventListener("wheel", (event) => {
    scrollY += event.deltaY * 0.01;
    updateScene();
  });

  window.addEventListener("scroll", () => {
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    scrollY = (window.pageYOffset / scrollHeight) * (totalSections - 1);
    updateScene();
  });

  // Add event listeners for touch events
  window.addEventListener("touchstart", handleTouchStart, false);
  window.addEventListener("touchmove", handleTouchMove, false);
  window.addEventListener("touchend", handleTouchEnd, false);

  let touchStartY = 0;
  let touchStartTime = 0;
  let touchEndY = 0;
  let touchEndTime = 0;

  function handleTouchStart(event) {
    touchStartY = event.touches[0].clientY;
    touchStartTime = performance.now();
  }

  function handleTouchMove(event) {
    scrollY += (event.touches[0].clientY - touchStartY) * 0.01;
    updateScene();
  }

  function handleTouchEnd(event) {
    touchEndY = event.changedTouches[0].clientY;
    touchEndTime = performance.now();

    // Determine the scroll direction based on touch events
    scrollDirection = touchEndY > touchStartY ? 1 : -1;
    previousScrollDirection = scrollDirection;
  }

  function updateScene() {
    scrollY = Math.max(0, Math.min(scrollY, totalSections - 1));
    currentSection = Math.floor(scrollY);

    // Determine the current scroll direction
    scrollDirection = scrollY > previousScrollDirection ? 1 : -1;
    previousScrollDirection = scrollDirection;

    // Translate torus based on scroll
    let xTranslation =
      ((scrollY * 20 * -scrollDirection) / 4) * (scrollY / (totalSections - 1));
    let yRotation =
      ((scrollY * Math.PI * -scrollDirection) / 4) *
      (scrollY / (totalSections - 1));
    let zRotation =
      ((scrollY * Math.PI * -scrollDirection) / 4) *
      (scrollY / (totalSections - 1));

    // Add zig-zag effect in y
    yRotation += zigzagDirection * Math.sin(scrollY * Math.PI * 2) * 0.5;

    gsap.to(torus.position, {
      x: xTranslation,
      duration: 1,
      ease: "power2.out",
    });

    gsap.to(torus.rotation, {
      y: yRotation,
      z: zRotation,
      duration: 1,
      ease: "power2.out",
    });

    // Move text vertically
    const textTargetPositions = [{ y: 10 }, { y: 20 }, { y: 30 }, { y: 40 }];

    for (let i = 0; i < scrollTextMeshes.length; i++) {
      const textNewPosition = textTargetPositions[i];
      gsap.to(scrollTextMeshes[i].position, {
        y: textNewPosition.y,
        duration: 1.5,
        ease: "power2.inOut",
      });
    }

    // Change torus color
    const hue = (currentSection / (totalSections - 1)) * 0.1 + 0.5;
    torus.material.color.setHSL(hue, 1, 0.5);

    // Scroll text animation
    for (let i = 0; i < scrollTextMeshes.length; i++) {
      gsap.to(scrollTextMeshes[i].position, {
        x: Math.sin(scrollY * Math.PI * 2) * 10,
        duration: 1,
        ease: "power2.inOut",
      });
    }

    // Update the zig-zag direction
    zigzagDirection *= -1;

    // Zoom in on the stars
    const starScale = 1 + 0.5 * Math.sin(scrollY * Math.PI * 2);
    gsap.to(stars.scale, {
      x: starScale,
      y: starScale,
      z: starScale,
      duration: 1,
      ease: "power2.out",
    });

    // Adjust the camera position to center on the stars
    adjustCameraPosition();
  }

  // Initial smooth up and down animation for the torus
  gsap.to(torus.position, {
    y: "+=2.9",
    x: "+=2.9",
    duration: 2,
    ease: "power1.inOut",
    yoyo: true,
    repeat: -1,
  });

  // Load and add the 3D model
  const gltfLoader = new THREE.GLTFLoader();
  gltfLoader.load(
    "models/3dMen/scene.gltf",
    function (gltf) {
      const model = gltf.scene;

      model.scale.set(10, 10, 10);

      // Rotate the model to make it stand upright
      model.rotation.x = Math.PI / 2;
      model.rotation.z = Math.PI / 0.05;

      model.position.set(10, -10, 0);

      // Add model to the scene
      scene.add(model);

      // Animate model based on scroll
      function animateModel() {
        requestAnimationFrame(animateModel);

        // Scale the model based on scroll position
        const scale = 10 * (1 + 0.2 * Math.sin(scrollY * Math.PI * 2));
        gsap.to(model.scale, {
          x: scale,
          y: scale,
          z: scale,
          duration: 1,
          ease: "power2.out",
        });

        // Translate the model horizontally based on scroll position
        const xTranslation = 30;
        gsap.to(model.position, {
          x: xTranslation,
          duration: 1,
          ease: "power2.out",
        });

        // Rotate the model smoothly around the Z-axis based on scroll position
        const zRotation = scrollY * 0.01;
        gsap.to(model.rotation, {
          z: zRotation,
          duration: 2,
          ease: "power2.out",
        });

        renderer.render(scene, camera);
      }

      animateModel();
    },
    undefined,
    function (error) {
      console.error("An error occurred loading the model:", error);
    }
  );

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Animate stars
    stars.rotation.y += 0.0001;

    // Animate particles
    particlesMesh.rotation.y += 0.0005;

    // Update scroll text color
    for (let i = 0; i < scrollTextMeshes.length; i++) {
      scrollTextMeshes[i].material.uniforms.time.value += 0.05;
    }

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Generate gradient texture
  function generateGradientTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "#4a00e0");
    gradient.addColorStop(1, "#8e2de2");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    return canvas;
  }

  function adjustCameraPosition() {
    const cameraZ = 30 - 10 * Math.sin(scrollY * Math.PI * 2);
    const targetPosition = new THREE.Vector3(
      camera.position.x,
      camera.position.y,
      cameraZ
    );
    gsap.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 10,
      ease: "power2.out",
    });
  }
}
