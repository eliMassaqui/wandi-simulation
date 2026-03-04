import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Adicionando OrbitControls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Auxiliares Visuais (Eixos e Grade)
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);
        
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        this.scene.add(gridHelper);

        this.targetRotation = 0;
        this.separatorPivot = null; 

        this.init();
        this.animate();
    }

    init() {
        // Iluminação Global e Direcional
        this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(10, 20, 10);
        this.scene.add(sun);

        const loader = new GLTFLoader();
        loader.load('./models/MicroServo.glb', (gltf) => {
            const model = gltf.scene;
            
            // 1. Centralização Real: Calcula a bounding box do modelo
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);

            // Reposiciona o modelo para que o centro dele fique no (0,0,0)
            model.position.x += (model.position.x - center.x);
            model.position.y += (model.position.y - center.y);
            model.position.z += (model.position.z - center.z);
            
            // Coloca a "base" do modelo no chão (opcional, remova se quiser centro absoluto)
            model.position.y -= (model.position.y - box.min.y); 

            // 2. Lógica do Pivô para a peça móvel (Separator)
            model.traverse((child) => {
                if (child.isMesh && child.name.includes("Separator")) {
                    const childBox = new THREE.Box3().setFromObject(child);
                    const childCenter = new THREE.Vector3();
                    childBox.getCenter(childCenter);

                    this.separatorPivot = new THREE.Group();
                    // O pivot fica na posição global do centro da peça
                    this.separatorPivot.position.copy(childCenter);
                    
                    child.parent.add(this.separatorPivot);
                    child.position.sub(childCenter); // Local offset
                    this.separatorPivot.add(child);
                }
            });

            this.scene.add(model);
            this.setupCamera(size);
        });
    }

    setupCamera(size) {
        // Cálculo de distância baseado no tamanho do objeto para enquadramento perfeito
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        
        cameraZ *= 2.5; // Multiplicador para dar um recuo confortável

        this.camera.position.set(cameraZ, cameraZ, cameraZ);
        this.camera.lookAt(0, 0, 0);
        
        this.controls.target.set(0, size.y / 2, 0);
        this.controls.update();
    }

    atualizarRotacao(graus) {
        this.targetRotation = graus * (Math.PI / 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update(); // Necessário para o damping do OrbitControls

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