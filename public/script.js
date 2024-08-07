// Set up scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create main torus
const torusGeometry = new THREE.TorusGeometry(10, 3, 16, 100);
const torusMaterial = new THREE.MeshPhongMaterial({ color: 0x0044ff });
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
scene.add(torus);

// Create background sphere
const sphereGeometry = new THREE.SphereGeometry(50, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x001133, side: THREE.BackSide });
const backgroundSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(backgroundSphere);

// Add lighting
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(0, 0, 20);
scene.add(light);

// Position camera
camera.position.z = 30;

// Create stars
const starsGeometry = new THREE.BufferGeometry();
const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

const starsVertices = [];
for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = -Math.random() * 2000;
    starsVertices.push(x, y, z);
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Scroll-based navigation
let currentSection = 0;
const totalSections = 3;
const sectionHeight = window.innerHeight;

window.addEventListener('wheel', (event) => {
    if (event.deltaY > 0 && currentSection < totalSections - 1) {
        currentSection++;
    } else if (event.deltaY < 0 && currentSection > 0) {
        currentSection--;
    }
    
    gsap.to(window, {
        scrollTo: { y: currentSection * sectionHeight, autoKill: false },
        duration: 1,
        ease: 'power2.out'
    });

    gsap.to(camera.position, {
        y: -currentSection * 10,
        duration: 1,
        ease: 'power2.out'
    });

    gsap.to(torus.rotation, {
        x: currentSection * Math.PI / 4,
        y: currentSection * Math.PI / 4,
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
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    torus.rotation.x += 0.001;
    torus.rotation.y += 0.001;

    // Animate stars
    stars.rotation.y += 0.0002;
    
    renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});