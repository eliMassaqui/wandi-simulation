import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class WandiSimulador {
    constructor() {
        // Cena com fundo cinza conforme solicitado
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); 

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Renderer otimizado: preserva recursos da GPU
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.setupScene();
        this.animate();
    }

    setupScene() {
        // Cubo Amarelo - Usando MeshBasicMaterial para ser o mais leve possível (não precisa de luz)
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        // Plano Cartesiano (Grade)
        const grid = new THREE.GridHelper(20, 20, 0x888888, 0x555555);
        grid.position.y = -1.1;
        this.scene.add(grid);

        // Posicionamento da Câmera
        this.camera.position.set(4, 3, 6);
        this.camera.lookAt(0, 0, 0);
    }

    // Acompanha TOTALMENTE os valores do serial
    atualizarRotacao(graus) {
        // Conversão direta sem suavização (Zero Latency)
        const rad = graus * (Math.PI / 180);
        this.cube.rotation.y = rad; 
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}