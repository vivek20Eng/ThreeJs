// Set up scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Create gradient background
const gradientTexture = new THREE.Texture(generateGradientTexture());
gradientTexture.needsUpdate = true;
const gradientMaterial = new THREE.MeshBasicMaterial({ map: gradientTexture, depthWrite: false });
const gradientPlane = new THREE.PlaneGeometry(2, 2);
const gradientQuad = new THREE.Mesh(gradientPlane, gradientMaterial);
gradientQuad.position.z = -1000;
scene.add(gradientQuad);

// Create main torus
const torusGeometry = new THREE.TorusGeometry(10, 3, 16, 100);
const torusMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ccff,
    specular: 0x555555,
    shininess: 30
});
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
scene.add(torus);

// Create text
const loader = new THREE.FontLoader();
let scrollTextMesh;

loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    const textGeometry = new THREE.TextGeometry('Scroll to explore', {
        font: font,
        size: 2.5,
        height: 0.3,
    });
    const textMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
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
        `
    });
    scrollTextMesh = new THREE.Mesh(textGeometry, textMaterial);
    scrollTextMesh.position.set(0, 0, 0);
    scene.add(scrollTextMesh);
});

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 20);
scene.add(pointLight);

// Position camera
camera.position.z = 30;

// Create stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

const starsVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 1000;
    const z = -Math.random() * 100;
    starsVertices.push(x, y, z);
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Create particle system
const particlesGeometry = new THREE.BufferGeometry();
const particlesCnt = 5000;
const posArray = new Float32Array(particlesCnt * 3);

for(let i = 0; i < particlesCnt * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Create background shapes
const shapes = [];
const colors = [
    0x0000cc, 
    0x000099, 
    0x000066, 
    0x000033, 
    0x3366ff, 
    0x6699ff, 
    0x99ccff, 
    0xccccff,
    0x003366 
];

for (let i = 0; i < 20; i++) { 
    const shapeType = Math.random() > 0.5 ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.5, 32, 32);
    const shapeMaterial = new THREE.MeshPhongMaterial({ 
        color: colors[Math.floor(Math.random() * colors.length)], 
        shininess: 50 
    });
    const shape = new THREE.Mesh(shapeType, shapeMaterial);
    shape.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
    shape.scale.setScalar(Math.random() * 10 + 2);
    shape.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
    };
    shapes.push(shape);
    scene.add(shape);
}

// Scroll-based navigation
let currentSection = 0;
const totalSections = 4; 
// Adjust based content intial add 4 section only
let scrollY = 0;

window.addEventListener('wheel', (event) => {
    scrollY += event.deltaY * 0.01;
    scrollY = Math.max(0, Math.min(scrollY, totalSections - 1));
    currentSection = Math.floor(scrollY);
    updateScene();
});

function updateScene() {
    // Rotate torus based on scroll
    gsap.to(torus.rotation, {
        x: scrollY * Math.PI / 2,
        duration: 1,
        ease: 'power2.out'
    });

    // Move torus horizontally
    gsap.to(torus.position, {
        x: Math.sin(scrollY * Math.PI) * 10,
        duration: 1,
        ease: 'power2.inOut'
    });

    // Change torus color
    const hue = (scrollY / (totalSections - 1)) * 0.1 + 0.5;
    torus.material.color.setHSL(hue, 1, 0.5);

    // Adjust camera position for last section
    if (currentSection === totalSections - 1) {
        gsap.to(camera.position, {
            y: -10,
            z: 20,
            duration: 1,
            ease: 'power2.inOut'
        });
        gsap.to(camera.rotation, {
            x: Math.PI / 6,
            duration: 1,
            ease: 'power2.inOut'
        });
    } else {
        gsap.to(camera.position, {
            y: 0,
            z: 30,
            duration: 1,
            ease: 'power2.inOut'
        });
        gsap.to(camera.rotation, {
            x: 0,
            duration: 1,
            ease: 'power2.inOut'
        });
    }

    // Move scroll text
    if (scrollTextMesh) {
        gsap.to(scrollTextMesh.position, {
            x: Math.sin(scrollY * Math.PI * 2) * 10,
            duration: 1,
            ease: 'power2.inOut'
        });
    }
}

// Initial torus animation
gsap.from(torus.scale, {
    x: 0,
    y: 0,
    z: 0,
    duration: 1.5,
    ease: 'elastic.out(1, 0.3)',
    // onComplete: () => {
    //     gsap.to(torus.rotation, {
    //         y: Math.PI * 2,
    //         duration: 2,
    //         ease: 'power2.inOut',
    //         repeat: -1,
    //         yoyo: true
    //     });
    // }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate torus continuously
    torus.rotation.y += 0.001;

    // Animate stars
    stars.rotation.y += 0.0002;
    
    // Animate particles
    particlesMesh.rotation.y += 0.0005;
    
    // Animate background shapes
    shapes.forEach(shape => {
        shape.rotation.x += shape.rotationSpeed.x;
        shape.rotation.y += shape.rotationSpeed.y;
        shape.rotation.z += shape.rotationSpeed.z;

        shape.position.y -= 0.1; 
        // Move from bottom to top
        
        if (shape.position.y < -200) {
            shape.position.y = 200; 
            // Reset position when out of view
        }
    });

    // Update scroll text color
    if (scrollTextMesh) {
        scrollTextMesh.material.uniforms.time.value += 0.05;
    }

    renderer.render(scene, camera);
}

animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Generate gradient texture
function generateGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#4a00e0');
    gradient.addColorStop(1, '#8e2de2');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    return canvas;
}

// Marquee text animation
const marqueeText = document.getElementById('marquee-text');
gsap.to(marqueeText, {
    x: "-100%",
    duration: 20,
    ease: "linear",
    repeat: -1
});

// Loading animation
const loadingElement = document.getElementById('loading');

// Load manager to track asset loading
const loadManager = new THREE.LoadingManager();
loadManager.onLoad = () => {
    gsap.to(loadingElement, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            loadingElement.style.display = 'none';
            startAnimation();
        }
    });
};

// Use the load manager for font loading
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    // Font loading code...
}, undefined, function(error) {
    console.error('An error occurred while loading the font:', error);
}, loadManager);

// Initial torus animation
function startAnimation() {
    gsap.from(torus.position, {
        y: -30,
        duration: 2,
        ease: 'bounce.out',
        onComplete: () => {
            // Start the continuous bounce
            gsap.to(torus.position, {
                y: '+=0.5',
                duration: 1,
                ease: 'power1.inOut',
                yoyo: true,
                repeat: -1
            });
        }
    });
}

// Scroll-based animations
function setupScrollAnimations() {
    gsap.utils.toArray('.content-section').forEach((section, index) => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => {
                section.classList.add('active');
                animateTorus(index);
            },
            onLeaveBack: () => {
                section.classList.remove('active');
            }
        });
    });
}

function animateTorus(index) {
    const positions = [
        { x: 0, y: 0, z: 0 },
        { x: 10, y: 5, z: -5 },
        { x: -10, y: -5, z: 5 },
        { x: 0, y: 10, z: -10 }
    ];
    
    gsap.to(torus.position, {
        ...positions[index],
        duration: 1.5,
        ease: 'power2.inOut'
    });
    
    gsap.to(torus.rotation, {
        x: Math.PI * 2 * Math.random(),
        y: Math.PI * 2 * Math.random(),
        z: Math.PI * 2 * Math.random(),
        duration: 1.5,
        ease: 'power2.inOut'
    });
}

// Start the animation loop immediately
animate();

// Set up scroll animations after the page loads
window.addEventListener('load', setupScrollAnimations);
