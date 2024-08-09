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

  // Initial torus animation (zoom out and bounce)
  gsap.from(torus.scale, {
    x: 0.1,
    y: 0.1,
    z: 0.1,
    duration: 1.5,
    ease: "elastic.out(1, 0.3)",
  });

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

  // Load and add the 3D model
  const gltfLoader = new THREE.GLTFLoader();
  let model;
  let totalRotation = 0;
  const maxRotation = Math.PI * 6; // 3 full rotations

  gltfLoader.load(
    "models/3dMen/scene.gltf",
    function (gltf) {
      model = gltf.scene;

      model.scale.set(10, 10, 10);

      // Rotate the model to make it stand upright
      model.rotation.x = Math.PI / 2;
      model.rotation.z = Math.PI / 0.03;

      model.position.set(40, -10, 0);

      // Add model to the scene
      scene.add(model);

      // Initial model animation (move from bottom to top)
      gsap.from(model.position, {
        y: -50,
        duration: 2,
        ease: "power2.out",
      });
    },
    undefined,
    function (error) {
      console.error("An error occurred loading the model:", error);
    }
  );

  // Create background blue shapes
  const blueShapesGroup = new THREE.Group();
  const blueShapesMaterial = new THREE.MeshPhongMaterial({
    color: 0x0066cc,
    specular: 0x555555,
    shininess: 30,
  });

  for (let i = 0; i < 5; i++) {
    const geometry = new THREE.SphereGeometry(3, 32, 32);
    const mesh = new THREE.Mesh(geometry, blueShapesMaterial);
    mesh.position.set(
      (Math.random() - 0.5) * 50,
      -50 - i * 20,
      -30 - Math.random() * 20
    );
    blueShapesGroup.add(mesh);
  }

  scene.add(blueShapesGroup);

  // Create new geometric models
  const geometries = [
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.CircleGeometry(3, 32),
    new THREE.ConeGeometry(3, 5, 32),
  ];

  const blueMaterial = new THREE.MeshPhongMaterial({ color: 0x0066cc });

  const newModels = [];

  for (let i = 0; i < geometries.length; i++) {
    const mesh = new THREE.Mesh(geometries[i], blueMaterial);
    mesh.position.set((i - 1) * 15, 40, 0);
    mesh.rotation.x = Math.PI / 6; // Incline the models
    scene.add(mesh);
    newModels.push(mesh);
  }

  // Scroll-based navigation
  let scrollY = 0;
  const totalSections = 4;

  // Add event listeners for both mouse wheel and scrollbar
  window.addEventListener("wheel", (event) => {
    scrollY += event.deltaY * 0.001;
    scrollY = Math.max(0, Math.min(scrollY, 1));
    // Clamp between 0 and 1
    updateScene();
  });

  window.addEventListener("scroll", () => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    scrollY = window.pageYOffset / scrollHeight;
    updateScene();
  });

  // Add event listeners for touch events
  window.addEventListener("touchstart", handleTouchStart, false);
  window.addEventListener("touchmove", handleTouchMove, false);

  let touchStartY = 0;

  function handleTouchStart(event) {
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    const touchY = event.touches[0].clientY;
    const deltaY = touchStartY - touchY;
    scrollY += deltaY * 0.001;
    scrollY = Math.max(0, Math.min(scrollY, 1));
    // Clamp between 0 and 1
    touchStartY = touchY;
    updateScene();
  }

  function updateScene() {
    const currentSection = Math.floor(scrollY * totalSections);

    // Update 3D model
    if (model) {
      // Translate the model horizontally and scale based on scroll position
      const xTranslation = 30 * Math.sin(scrollY * Math.PI);
      const scale = 10 * (1 + 0.2 * Math.sin(scrollY * Math.PI * 2));
      gsap.to(model.position, {
        x: xTranslation + 10,
        y: -10 + scrollY * 20, // Move from bottom to top
        duration: 1,
        ease: "power2.out",
      });
      gsap.to(model.scale, {
        x: 5 + scale * 0.2,
        y: 5 + scale * 0.2,
        z: 5 + scale * 0.2,
        duration: 1,
        ease: "power2.out",
      });

      // Rotate the model smoothly around the Z-axis based on scroll position
      if (totalRotation < maxRotation) {
        const zRotation = Math.min(
          scrollY * Math.PI * 6,
          maxRotation - totalRotation
        );
        totalRotation += zRotation;
        gsap.to(model.rotation, {
          z: model.rotation.z + zRotation,
          duration: 1,
          ease: "power2.out",
        });
      }
    }

    // Update torus with zigzag pattern and bounce effect
    const xTranslation = 20 * Math.sin(scrollY * Math.PI * 4);
    const yTranslation = 10 * Math.cos(scrollY * Math.PI * 2);
    gsap.to(torus.position, {
      x: xTranslation,
      y: yTranslation,
      duration: 1,
      ease: "power2.out",
    });

    gsap.to(torus.rotation, {
      x: scrollY * Math.PI * 2,
      y: scrollY * Math.PI * 4,
      duration: 1,
      ease: "power2.out",
    });

    // Add bounce effect to torus with decreasing height
    const bounceHeight = 10 * (1 - scrollY); // Decrease bounce height as we scroll down
    gsap.to(torus.position, {
      y: yTranslation + Math.sin(Date.now() * 0.001) ,
      duration: 0.5,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
    });

    // Update text
    const textTargetPositions = [{ y: 10 }, { y: 20 }, { y: 30 }, { y: 40 }];

    for (let i = 0; i < scrollTextMeshes.length; i++) {
      const textNewPosition = textTargetPositions[i];
      gsap.to(scrollTextMeshes[i].position, {
        y: textNewPosition.y,
        x: Math.sin(scrollY * Math.PI * 2) * 10,
        duration: 1.5,
        ease: "power2.inOut",
      });
    }

    // Update torus color
    const hue = (currentSection / (totalSections - 1)) * 0.1 + 0.5;
    torus.material.color.setHSL(hue, 1, 0.5);

    // Update stars
    const starScale = 1 + 0.5 * Math.sin(scrollY * Math.PI * 2);
    gsap.to(stars.scale, {
      x: starScale,
      y: starScale,
      z: starScale,
      duration: 1,
      ease: "power2.out",
    });

    // Update blue shapes
    blueShapesGroup.children.forEach((shape, index) => {
      const yPos = -50 + scrollY * 100 + index * 20;
      const xPos = Math.sin((yPos + index * 30) * 0.02) * 20;
      gsap.to(shape.position, {
        y: yPos > 50 ? -50 : yPos,
        x: xPos,
        duration: 1,
        ease: "power2.out",
      });
    });
  }

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

    // Animate blue shapes
    blueShapesGroup.children.forEach((shape, index) => {
      shape.rotation.y += 0.01 * (index + 1);
    });

    // Animate new geometric models
    newModels.forEach((model, index) => {
      model.rotation.y += 0.02;
      model.rotation.z += 0.01;
    });

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
}
