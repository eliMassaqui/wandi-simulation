import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x121212); // Fundo Grafite Escuro

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        this.setupScene();
        this.animate();
    }

    setupScene() {
        // Cubo Estilizado
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x0078d4, 
            wireframe: false,
            shininess: 80 
        });
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        // Plano Cartesiano (Grade)
        const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
        grid.position.y = -1.1;
        this.scene.add(grid);

        // Iluminação
        const light = new THREE.PointLight(0xffffff, 100, 100);
        light.position.set(5, 5, 5);
        this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040, 2));

        this.camera.position.set(3, 3, 5);
        this.camera.lookAt(0, 0, 0);
    }

    // Método que será chamado pelo WebSocket
    atualizarRotacao(graus) {
        // Converte para radianos: rad = graus * (PI / 180)
        const rad = graus * (Math.PI / 180);
        
        // Suavização simples (Lerp) para evitar trepidação da serial
        this.cube.rotation.y = THREE.MathUtils.lerp(this.cube.rotation.y, rad, 0.15);
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