// Set up scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Create main torus
const torusGeometry = new THREE.TorusGeometry(10, 3, 16, 100);
const torusMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x0044ff,
    specular: 0x555555,
    shininess: 30
});
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
scene.add(torus);

// Create background sphere
const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x001133, 
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.6
});
const backgroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(backgroundSphere);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 20);
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

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
    0x0000cc, // Medium Blue
    0x000099, // Dark Blue
    0x000066, // Navy Blue
    0x000033, // Midnight Blue
    0x3366ff, // Royal Blue
    0x6699ff, // Sky Blue
    0x99ccff, // Light Sky Blue
    0xccccff, // Very Light Blue
    0x003366  // Dark Midnight Blue
];

for (let i = 0; i < 10; i++) { 
    // Increased number of shapes
    const shapeType = Math.random() > 0.5 ? new THREE.BoxGeometry(1, 1, 1) : new THREE.SphereGeometry(0.5, 32, 32);
    const shapeMaterial = new THREE.MeshPhongMaterial({ 
        color: colors[Math.floor(Math.random() * colors.length)], 
        shininess: 50 
    });
    const shape = new THREE.Mesh(shapeType, shapeMaterial);
    shape.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200); 
    // Moved to background
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
const totalSections = document.querySelectorAll('.content-section').length;
const sectionHeight = window.innerHeight;

window.addEventListener('wheel', (event) => {
    if (event.deltaY > 0 && currentSection < totalSections - 1) {
        currentSection++;
    } else if (event.deltaY < 0 && currentSection > 0) {
        currentSection--;
    }
    
    updateScene();
});

function updateScene() {
    // Move camera based on scroll
    gsap.to(camera.position, {
        y: currentSection * 10,
        z: 30 - currentSection * 5,
        duration: 1,
        ease: 'power2.out'
    });

    // Move and animate the torus based on scroll
    gsap.to(torus.rotation, {
        x: currentSection * Math.PI / 4,
        y: currentSection * Math.PI / 4,
        duration: 1,
        ease: 'power2.out'
    });

    gsap.to(torus.position, {
        y: -currentSection * 10,
        duration: 1,
        ease: 'power2.out'
    });

    gsap.to(torus.scale, {
        x: 1 - currentSection * 0.1,
        y: 1 - currentSection * 0.1,
        z: 1 - currentSection * 0.1,
        duration: 1,
        ease: 'power2.out'
    });
}


// Initial small movement
function initialMovement() {
    gsap.to(torus.rotation, {
        x: Math.PI / 32,
        y: Math.PI / 32,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
    });
}

initialMovement();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    torus.rotation.x += 0.001;
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

        shape.position.y -= 0.01; 
        // Move shape from bottom to top
        
        if (shape.position.y < -200) {
            shape.position.y = 200; 
            // Reset position to top when it goes out of view
        }

        // Apply blur effect based on distance
        const distance = shape.position.z - camera.position.z;
        const blurAmount = THREE.MathUtils.clamp(Math.abs(distance) / 100, 0, 1);
        shape.material.opacity = 1 - blurAmount;
        shape.material.transparent = true;
    });

    // Pulsating light effect
    const time = Date.now() * 0.001;
    pointLight.intensity = 1 + 0.5 * Math.sin(time * 2);
    
    renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
