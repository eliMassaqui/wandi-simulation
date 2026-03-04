import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            powerPreference: "high-performance" 
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Variáveis de Movimento Realista
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.lerpSpeed = 0.15; // Suavidade do movimento
        this.separatorPivot = null;
        this.grid = null;

        this.init();
        this.animate();
    }

    init() {
        // Iluminação de Estúdio
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);

        const spot = new THREE.PointLight(0x00d2ff, 2, 50);
        spot.position.set(5, 5, 5);
        this.scene.add(spot);

        const loader = new GLTFLoader();
        loader.load('./models/MicroServo.glb', (gltf) => {
            const model = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const center = new THREE.Vector3();
            box.getCenter(center);

            // Posicionamento Base
            model.position.set(-center.x, -box.min.y + 0.01, -center.z);

            // Grid Proporcional
            this.grid = new THREE.GridHelper(20, 40, 0x00d2ff, 0x222222);
            this.grid.material.opacity = 0.2;
            this.grid.material.transparent = true;
            this.scene.add(this.grid);

            // Lógica do Horn (Separator)
            model.traverse((child) => {
                if (child.isMesh && (child.name.includes("Separator") || child.name.includes("Horn"))) {
                    // Criar pivô no centro geométrico da peça de rotação
                    const childBox = new THREE.Box3().setFromObject(child);
                    const childCenter = new THREE.Vector3();
                    childBox.getCenter(childCenter);

                    this.separatorPivot = new THREE.Group();
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
        const dist = Math.max(size.x, size.y, size.z) * 2.5;
        this.camera.position.set(dist, dist, dist);
        this.controls.target.set(0, size.y / 2, 0);
        this.controls.update();
    }

    setGridStatus(isOnline) {
        if (this.grid) {
            this.grid.material.color.setHex(isOnline ? 0x00d2ff : 0xff4757);
        }
    }

    atualizarRotacao(graus) {
        // Converte para Radianos e limita entre 0 e 180 (física de servo)
        const clamped = Math.max(0, Math.min(180, graus));
        this.targetRotation = clamped * (Math.PI / 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();

        if (this.separatorPivot) {
            // Interpolação Linear para suavizar a telemetria
            this.currentRotation = THREE.MathUtils.lerp(
                this.currentRotation, 
                this.targetRotation, 
                this.lerpSpeed
            );
            this.separatorPivot.rotation.y = this.currentRotation;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}