import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import GUI from 'lil-gui';

/* ======================
   Cena & Atmosfera
====================== */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc7c7c7); // Cor solicitada: c7c7c7

/* ======================
   Câmera
====================== */
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(6, 4, 8);

/* ======================
   Renderer
====================== */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8; 

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

/* ======================
   Ambiente de Reflexo
====================== */
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.02).texture;

/* ======================
   Controls
====================== */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

/* ======================
   Iluminação
====================== */
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4); 
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.5); 
keyLight.position.set(5, 10, 2); 
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.radius = 4;
keyLight.shadow.bias = -0.0005; 
scene.add(keyLight);

const rimLight = new THREE.SpotLight(0xffffff, 12);
rimLight.position.set(-5, 5, -10);
rimLight.angle = 0.5;
rimLight.penumbra = 1;
scene.add(rimLight);

/* ======================
   Piso & Grid (Ajustados para fundo claro c7c7c7)
====================== */
const floorGeo = new THREE.PlaneGeometry(50, 50);
const floorMat = new THREE.ShadowMaterial({ opacity: 0.4 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(15, 15, 0x888888, 0xaaaaaa);
scene.add(grid);

/* ======================
   GUI Master Control
====================== */
const gui = new GUI({ title: '🕹️ Master Studio' });
const settings = {
    exposure: renderer.toneMappingExposure,
    envIntensity: 0.3,
    bgColor: '#c7c7c7', // Sincronizado com o fundo
    autoRotate: false,
    loadFile: () => fileInput.click()
};

const fRender = gui.addFolder('Render & Ambiente');

fRender.addColor(settings, 'bgColor')
    .name('Cor do Fundo')
    .onChange(v => {
        scene.background.set(v);
    });

fRender.add(settings, 'exposure', 0, 2).name('Exposição').onChange(v => renderer.toneMappingExposure = v);
fRender.add(settings, 'envIntensity', 0, 2).name('Reflexos').onChange(v => {
    scene.traverse(child => {
        if (child.isMesh && child.material) child.material.envMapIntensity = v;
    });
});

/* ======================
   Lógica de Carregamento
====================== */
const loader = new GLTFLoader();
let robotArm = null;

function setupModel(gltf) {
    if (robotArm) {
        scene.remove(robotArm);
        robotArm.traverse(node => {
            if (node.isMesh) {
                node.geometry.dispose();
                if (node.material.dispose) node.material.dispose();
            }
        });
    }

    robotArm = gltf.scene;
    robotArm.traverse((node) => {
        if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            
            if (node.material) {
                node.material.metalness = 0.3; 
                node.material.roughness = 0.6;
                node.material.envMapIntensity = settings.envIntensity;
            }
        }
    });

    const box = new THREE.Box3().setFromObject(robotArm);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    robotArm.position.set(-center.x, -box.min.y, -center.z);

    scene.add(robotArm);
    controls.target.set(0, size.y / 2, 0);
}

// Carregamento Inicial
loader.load('/Robotik arm.glb', (gltf) => {
    setupModel(gltf);
    const fModel = gui.addFolder('Ajuste Modelo');
    fModel.add(settings, 'autoRotate').name('Girar');
    fModel.add(settings, 'loadFile').name('📁 Trocar Modelo');
});

/* ======================
   Input Externo
====================== */
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.glb, .gltf';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            loader.parse(event.target.result, '', (gltf) => setupModel(gltf));
        };
        reader.readAsArrayBuffer(file);
    }
});

/* ======================
   Loop
====================== */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (robotArm && settings.autoRotate) robotArm.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});