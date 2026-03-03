import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222); // Fundo levemente mais escuro para contraste

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true; // Habilita sombras para realismo
        document.body.appendChild(this.renderer.domElement);

        // Controles de câmera
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.targetRotation = 0;
        this.currentModel = null;

        this.setupLights();
        this.loadModel('./public/models/MicroServo.glb'); // Carrega o modelo
        this.animate();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1.5);
        sun.position.set(5, 10, 7.5);
        sun.castShadow = true;
        this.scene.add(sun);
    }

    loadModel(path) {
        const loader = new GLTFLoader();
        loader.load(path, (gltf) => {
            if (this.currentModel) this.scene.remove(this.currentModel);
            
            this.currentModel = gltf.scene;
            this.scene.add(this.currentModel);

            this.ajustarAmbientePerfeito();
            console.log("Objeto centralizado e câmera focada!");
        });
    }

    ajustarAmbientePerfeito() {
        // 1. Calcular a "caixa" (Box) do objeto para saber o tamanho real
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // 2. Centralizar o objeto no meio do plano (0,0,0)
        this.currentModel.position.x += (this.currentModel.position.x - center.x);
        this.currentModel.position.z += (this.currentModel.position.z - center.z);
        
        // 3. Colocar o objeto EXATAMENTE em cima da grade (y=0)
        this.currentModel.position.y -= box.min.y;

        // 4. Resetar a grade para o tamanho do objeto
        if (this.grid) this.scene.remove(this.grid);
        const maxDim = Math.max(size.x, size.z);
        this.grid = new THREE.GridHelper(maxDim * 4, 20, 0x444444, 0x333333);
        this.scene.add(this.grid);

        // 5. POSICIONAR CÂMERA AUTOMATICAMENTE
        // Calculamos a distância ideal baseada no tamanho do objeto
        const fov = this.camera.fov * (Math.PI / 180);
        let distance = Math.abs(size.y / Math.sin(fov / 2));
        distance *= 1.5; // Margem de segurança para não ficar colado

        this.camera.position.set(distance, distance, distance);
        this.camera.lookAt(0, size.y / 2, 0);
        
        // Atualiza o ponto de rotação da câmera para o meio do objeto
        this.controls.target.set(0, size.y / 2, 0);
        this.controls.update();
    }

    atualizarRotacao(graus) {
        this.targetRotation = graus * (Math.PI / 180);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();

        if (this.currentModel) {
            this.currentModel.rotation.y = THREE.MathUtils.lerp(
                this.currentModel.rotation.y, 
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