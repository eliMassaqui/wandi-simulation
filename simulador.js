import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class WandiSimulador {
    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); // Fundo cinza

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, 
            precision: "lowp", 
            powerPreference: "high-performance" 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1);
        document.body.appendChild(this.renderer.domElement);

        this.setupScene();
        this.animate();
    }

    setupScene() {
        // Cubo Amarelo Ultra-Leve
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        // Grade do Plano Cartesiano
        const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        grid.position.y = -1.1;
        this.scene.add(grid);

        // Eixos (X:Vermelho, Y:Verde, Z:Azul) - Ajuda a ver o ponto 0
        const axes = new THREE.AxesHelper(5);
        this.scene.add(axes);

        this.camera.position.set(4, 4, 6);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * Sincronização Absoluta: Se a serial enviar 0, o cubo vai para 0 na hora.
     */
    atualizarRotacao(graus) {
        // Converte o valor absoluto recebido
        const rad = graus * (Math.PI / 180);
        
        // Aplica diretamente. Se o sensor resetar para 0, o cubo reseta junto.
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