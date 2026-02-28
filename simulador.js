import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); 

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, 
            precision: "lowp", 
            powerPreference: "high-performance" 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1);
        document.body.appendChild(this.renderer.domElement);

        // VARIÁVEIS DE CONTROLE
        this.targetRotation = 0; // Onde o cubo deve chegar
        this.lerpSpeed = 0.4;    // Velocidade do giro (0.1 lento, 0.9 quase instantâneo)

        this.setupScene();
        this.animate();
    }

    setupScene() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        grid.position.y = -1.1;
        this.scene.add(grid);

        const axes = new THREE.AxesHelper(5);
        this.scene.add(axes);

        this.camera.position.set(4, 4, 6);
        this.camera.lookAt(0, 0, 0);
    }

    atualizarRotacao(graus) {
        const novoAlvo = graus * (Math.PI / 180);
        
        // Só atualiza se a diferença for relevante (evita processamento de ruído)
        if (Math.abs(this.targetRotation - novoAlvo) > 0.001) {
            this.targetRotation = novoAlvo;
        }
    }
    animate() {
        requestAnimationFrame(() => this.animate());

        // LÓGICA DE GIRO RÁPIDO:
        // O cubo persegue o alvo (targetRotation) constantemente.
        // Quando o sensor pula de 180 para 0, o 'lerp' faz ele girar rápido de volta
        this.cube.rotation.y = THREE.MathUtils.lerp(
            this.cube.rotation.y, 
            this.targetRotation, 
            this.lerpSpeed
        );

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}