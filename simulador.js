import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.targetRotation = 0;
        this.separatorPivot = null; 

        this.init();
        this.animate();
    }

    init() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(5, 10, 5);
        this.scene.add(sun);

        const loader = new GLTFLoader();
        // Certifique-se de que o caminho do modelo está correto
        loader.load('./public/models/MicroServo.glb', (gltf) => {
            const model = gltf.scene;
            
            model.traverse((child) => {
                if (child.isMesh && child.name.includes("Separator")) {
                    // Lógica de Pivô: Centraliza a rotação na própria peça
                    const box = new THREE.Box3().setFromObject(child);
                    const center = new THREE.Vector3();
                    box.getCenter(center);

                    this.separatorPivot = new THREE.Group();
                    this.separatorPivot.position.copy(center);
                    
                    child.parent.add(this.separatorPivot);
                    child.position.sub(center); // Offset local
                    this.separatorPivot.add(child);
                }
            });

            this.scene.add(model);
            this.setupCamera(model);
        });
    }

    setupCamera(obj) {
        const box = new THREE.Box3().setFromObject(obj);
        const size = box.getSize(new THREE.Vector3());
        this.camera.position.set(size.y * 2, size.y * 2, size.y * 2);
        this.camera.lookAt(0, size.y / 2, 0);
    }

    atualizarRotacao(graus) {
        this.targetRotation = graus * (Math.PI / 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.separatorPivot) {
            // Movimento suave (Lerp 0.1)
            this.separatorPivot.rotation.y = THREE.MathUtils.lerp(
                this.separatorPivot.rotation.y, 
                this.targetRotation, 
                0.1
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