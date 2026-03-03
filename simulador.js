import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); 

        this.camera = new THREE.PerspectiveCamera(53, window.innerWidth / window.innerHeight, 0.1, 2000);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            precision: "mediump", 
            powerPreference: "high-performance" 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // VARIÁVEIS DE CONTROLE
        this.separatorPivot = null; // Substitui o cube na lógica de movimento
        this.targetRotation = 0;    // Alvo vindo do Serial
        this.lerpSpeed = 0.3;       // Mantendo sua velocidade original de 0.3

        this.setupScene();
        this.loadMicroServo(); // Nova função de carga
        this.animate();
    }

    setupScene() {
        // Iluminação essencial para o modelo GLB
        const ambient = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(50, 100, 75);
        this.scene.add(sun);

        const grid = new THREE.GridHelper(200, 20, 0x888888, 0x444444);
        grid.position.y = -22; 
        this.scene.add(grid);

        this.camera.position.set(130, 110, -55);
        this.camera.lookAt(0, 0, 0);
    }

    loadMicroServo() {
        const loader = new GLTFLoader();
        // Carrega o seu modelo na pasta especificada
        loader.load('./models/MicroServo.glb', (gltf) => {
            const model = gltf.scene;
            model.position.set(-65.6, -21.2, 23.2);
            model.scale.setScalar(1.7226);
            this.scene.add(model);

            // LOGICA ORIGINAL DE PIVÔS
            const meshes = [];
            model.traverse((node) => { if (node.isMesh) meshes.push(node); });

            meshes.forEach((child) => {
                const box = new THREE.Box3().setFromObject(child);
                const center = new THREE.Vector3();
                box.getCenter(center);

                const pivot = new THREE.Group();
                pivot.name = "Pivot_" + child.name;
                pivot.position.copy(center);
                child.parent.add(pivot);

                child.position.sub(center);
                pivot.add(child);

                // Vincula a peça específica à variável de controle
                if (child.name === "Separator") {
                    this.separatorPivot = pivot;
                }
            });
        });
    }

    atualizarRotacao(graus) {
        // Converte e armazena o alvo (exatamente como sua lógica original)
        this.targetRotation = graus * (Math.PI / 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Só executa o movimento se o separatorPivot já foi carregado
        if (this.separatorPivot) {
            const diferenca = Math.abs(this.separatorPivot.rotation.y - this.targetRotation);
            
            if (diferenca > 0.0001) {
                // Aplicando o LERP original no pivô do braço do servo
                this.separatorPivot.rotation.y = THREE.MathUtils.lerp(
                    this.separatorPivot.rotation.y, 
                    this.targetRotation, 
                    this.lerpSpeed 
                );
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}