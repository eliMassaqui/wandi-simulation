import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class WandiSimulador {
    constructor() {
        // Cena com fundo cinza (solicitado)
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333); 

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Renderer otimizado: Sem antialias para máxima leveza
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, 
            precision: "lowp", // Baixa precisão para economizar GPU
            powerPreference: "high-performance" 
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1); // Trava o pixel ratio para evitar sobrecarga em telas 4K
        document.body.appendChild(this.renderer.domElement);

        this.setupScene();
        this.animate();
    }

    setupScene() {
        // Cubo Amarelo - MeshBasicMaterial é o mais leve que existe (não processa luz/sombras)
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);

        // Plano Cartesiano (Grade cinza)
        const grid = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
        grid.position.y = -1.1;
        this.scene.add(grid);

        // Eixos auxiliares (Opcional, mas ajuda na visualização do plano)
        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);

        this.camera.position.set(4, 3, 6);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * Atualiza a rotação instantaneamente
     * @param {number} graus - Valor vindo direto da Serial
     */
    atualizarRotacao(graus) {
        // Conversão direta: 0 atraso, 0 suavização
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