import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xDBDBDB);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.targetRotation = 0;
        this.separatorPivot = null; 

        this.init();
        this.animate();
    }

    init() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);

        const loader = new GLTFLoader();
        loader.load('./models/MicroServo.glb', (gltf) => {
            const model = gltf.scene;
            
            // --- CÁLCULO DE CENTRALIZAÇÃO E POSICIONAMENTO ---
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

            // 1. Centraliza no X e Z, mas coloca a BASE (min.y) exatamente no Y=0.01 (um pouquinho acima do plano)
            model.position.x = -center.x;
            model.position.z = -center.z;
            model.position.y = -box.min.y + 0.05; // 0.05 para não haver "z-fighting" com o grid

            // --- CRIAÇÃO DO PLANO CARTESIANO PROPORCIONAL ---
            const maxDim = Math.max(size.x, size.z);
            const gridSize = Math.max(maxDim * 10, 20); // O plano ocupa uma área 10x maior que o modelo
            const gridHelper = new THREE.GridHelper(gridSize, 20, 0x00d2ff, 0x333333);
            this.scene.add(gridHelper);

            const axesHelper = new THREE.AxesHelper(gridSize / 2);
            this.scene.add(axesHelper);

            // --- LÓGICA DO PIVÔ (SEPARATOR) ---
            model.traverse((child) => {
                if (child.isMesh && child.name.includes("SEPARATOR")) {
                    const childBox = new THREE.Box3().setFromObject(child);
                    const childCenter = new THREE.Vector3();
                    childBox.getCenter(childCenter);

                    this.separatorPivot = new THREE.Group();
                    // O pivot deve estar na posição relativa correta
                    this.separatorPivot.position.copy(childCenter);
                    
                    child.parent.add(this.separatorPivot);
                    child.position.sub(childCenter);
                    this.separatorPivot.add(child);
                }
            });

            this.scene.add(model);
            this.setupCamera(size);
        });
    }

    setupCamera(size) {
        const maxDim = Math.max(size.x, size.y, size.z);
        // Posicionamento "um pouco acima" e em ângulo 45 graus
        const dist = maxDim * 3; 
        
        this.camera.position.set(dist, dist * 0.8, dist);
        this.camera.lookAt(0, size.y / 2, 0);
        
        this.controls.target.set(0, size.y / 2, 0);
        this.controls.update();
    }

    atualizarRotacao(graus) {
        this.targetRotation = graus * (Math.PI / 180);
    }

// Dentro da classe WandiSimulador

animate() {
    requestAnimationFrame((t) => this.animate(t));
    
    // 1. Calcular o Delta Time para fluidez constante
    const currentTime = performance.now();
    if (!this.lastTime) this.lastTime = currentTime;
    const deltaTime = (currentTime - this.lastTime) / 1000; // em segundos
    this.lastTime = currentTime;

    this.controls.update();

    if (this.separatorPivot) {
        // 2. Ajuste de Suavização (Smoothing)
        // Aumente 5.0 para mais "peso/atraso" ou diminua para ser mais "seco/direto"
        const smoothing = 8.0; 
        
        // Fórmula de Interpolação Robusta: 1 - exp(-speed * dt)
        const lerpFactor = 1 - Math.exp(-smoothing * deltaTime);

        this.separatorPivot.rotation.y = THREE.MathUtils.lerp(
            this.separatorPivot.rotation.y, 
            this.targetRotation, 
            lerpFactor
        );
    }
    
    this.renderer.render(this.scene, this.camera);
}

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}