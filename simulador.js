import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.targetRotation = 0;
        this.currentModel = null;
        this.separatorPivot = null; // Grupo para rotação centralizada do Separator

        this.setupLights();
        this.loadModel('./models/MicroServo.glb');
        this.animate();
    }

    setupLights() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(5, 10, 7.5);
        this.scene.add(sun);
    }

    loadModel(path) {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            if (this.currentModel) this.scene.remove(this.currentModel);
            this.currentModel = gltf.scene;

            // --- LÓGICA DE PIVÔ PARA O SEPARATOR ---
            this.currentModel.traverse((child) => {
                if (child.isMesh && child.name.includes("Separator")) {
                    
                    // 1. Calcula o centro real da peça (Bounding Box)
                    const box = new THREE.Box3().setFromObject(child);
                    const center = new THREE.Vector3();
                    box.getCenter(center);

                    // 2. Cria o Pivô (Grupo Virtual)
                    this.separatorPivot = new THREE.Group();
                    this.separatorPivot.name = "Pivot_Separator";
                    
                    // 3. Posiciona o Pivô no centro exato da peça no espaço do modelo
                    this.separatorPivot.position.copy(center);
                    
                    // 4. Insere o pivô na hierarquia e coloca a peça dentro dele
                    child.parent.add(this.separatorPivot);
                    child.position.sub(center); // Faz a geometria da peça "zerar" no centro do grupo
                    this.separatorPivot.add(child);

                    console.log("Peça 'Separator' vinculada ao pivô centralizado.");
                }
            });

            this.scene.add(this.currentModel);
            this.centralizarEEnquadrar();
        }, undefined, (err) => console.error("Erro GLB:", err));
    }

    centralizarEEnquadrar() {
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Centraliza o modelo inteiro no plano (0,0,0)
        this.currentModel.position.x += (this.currentModel.position.x - center.x);
        this.currentModel.position.z += (this.currentModel.position.z - center.z);
        this.currentModel.position.y -= box.min.y;

        // Auxiliares visuais
        if (this.helpers) this.scene.remove(this.helpers);
        this.helpers = new THREE.Group();
        this.helpers.add(new THREE.GridHelper(Math.max(size.x, size.z) * 5, 20, 0x444444, 0x222222));
        this.helpers.add(new THREE.AxesHelper(Math.max(size.x, size.y, size.z)));
        this.scene.add(this.helpers);

        // Câmera
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2.5; 
        this.camera.position.set(distance, distance, distance);
        this.controls.target.set(0, size.y / 2, 0);
        this.controls.update();
    }

    atualizarRotacao(graus) {
        this.targetRotation = graus * (Math.PI / 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();

        // ROTAÇÃO NO PIVÔ DO SEPARATOR (Não move o corpo do motor)
        if (this.separatorPivot) {
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