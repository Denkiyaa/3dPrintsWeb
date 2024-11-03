document.addEventListener('DOMContentLoaded', function () {
    fetch('/models-list')
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById('model-gallery');

            data.models.forEach(model => {
                // Create a container for each model
                const modelCard = document.createElement('div');
                modelCard.classList.add('model-card');
                modelCard.style.cursor = 'pointer';

                // Add a thumbnail for the model
                const img = document.createElement('img');
                img.src = model.thumbnailPath || '/placeholder.png';
                img.alt = `Thumbnail for ${model.name}`;
                img.classList.add('thumbnail');
                modelCard.appendChild(img);

                // Add the model name below the thumbnail
                const modelName = document.createElement('h3');
                modelName.textContent = model.name;
                modelName.classList.add('model-name');
                modelCard.appendChild(modelName);

                // Make the model card clickable
                modelCard.onclick = () => {
                    openModelViewer(model);
                };

                gallery.appendChild(modelCard);
            });
        })
        .catch(error => {
            console.error('Error fetching model list:', error);
        });
});

// Function to create the model viewer page
function openModelViewer(model) {
    // Clear the existing content
    document.body.innerHTML = `
        <button class="back-button" onclick="history.back()"> ⏎ </button>
        <header>
            <h1>Model Viewer - ${model.name}</h1>
        </header>
        <div class="model-viewer-layout">
            <div class="model-viewer-container">
                <div id="model-container" class="viewer"></div>
            </div>
            <div class="model-info">
                <h2>Model Information</h2>
                <p><strong>Model Name:</strong> ${model.name}</p>
                <p><strong>Description:</strong> Detailed information about the model can be provided here.</p>
                <p><strong>Dimensions:</strong> Placeholder for dimensions, etc.</p>
            </div>
        </div>
    `;

    setupViewer('model-container', model.modelPath, model.name);
}


function createDynamicGround(scene, modelSize) {
    const groundPaddingFactor = 2;  // Ground size is larger to give some padding around the model
    const constantTileSize = 5;  // Size of individual tiles

    // Determine the largest model dimension (either X or Z)
    const largestDimension = Math.max(modelSize.x, modelSize.z);

    // Calculate the size of the ground based on the model's largest dimension
    const groundSize = largestDimension * groundPaddingFactor;

    // Calculate how many tiles will be used to cover the ground
    const divisions = Math.round(groundSize / constantTileSize);

    // Create a checkered texture for the ground
    const checkeredCanvas = document.createElement('canvas');
    checkeredCanvas.width = divisions;
    checkeredCanvas.height = divisions;
    const ctx = checkeredCanvas.getContext('2d');

    // Create a checkerboard pattern
    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? '#cccccc' : '#333333';
            ctx.fillRect(i, j, 1, 1);
        }
    }

    const checkeredTexture = new THREE.CanvasTexture(checkeredCanvas);
    checkeredTexture.magFilter = THREE.NearestFilter;
    checkeredTexture.minFilter = THREE.LinearMipMapLinearFilter;

    // Create the ground plane with the checkered texture
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshStandardMaterial({ map: checkeredTexture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Rotate to lie flat on XZ plane
    ground.position.y = 0;  // Set ground to Y=0

    scene.add(ground);  // Add the ground to the scene
}

function setupViewer(containerId, modelPath, modelName) {
    const container = document.getElementById(containerId);

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 2000);
    camera.zoom = 1;
    camera.updateProjectionMatrix();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setClearColor(new THREE.Color('rgb(230, 230, 230)'));  // Set a light gray background
    container.appendChild(renderer.domElement);

    // Add controls for model interaction
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Add lights for illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemisphereLight.position.set(0, 1, 0);
    scene.add(hemisphereLight);

    // Load and add the model to the scene
    const loader = new THREE.STLLoader();
    loader.load(modelPath, function (geometry) {
        geometry.center();  // Center geometry to adjust pivot
        const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        adjustModel(mesh, scene);  // Rotate and adjust model position

        // Adjust camera based on the model size and center
        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const size = boundingBox.getSize(new THREE.Vector3());
        const center = boundingBox.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxDim / (2 * Math.atan((Math.PI * camera.fov) / 360));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const distance = Math.max(fitHeightDistance, fitWidthDistance);

        camera.position.set(center.x, center.y + size.y / 2, distance * 1.5);
        camera.lookAt(center);
        controls.maxDistance = distance * 6;
        controls.minDistance = distance * 0.5;
        controls.update();
    }, undefined, function (error) {
        console.error(`Error loading the model in ${containerId}:`, error);
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
}

// Helper function to rotate the model onto its flat side and adjust vertical position
function adjustModel(mesh, scene) {
    mesh.geometry.computeBoundingBox();
    let boundingBox = new THREE.Box3().setFromObject(mesh);
    const size = boundingBox.getSize(new THREE.Vector3());

    // Create dynamic ground based on model size
    createDynamicGround(scene, size);

    // Rotate model to lay flat
    if (size.y < size.x && size.y < size.z) {
        console.log("Model is already flat on the XZ plane.");
    } else if (size.x < size.y && size.x < size.z) {
        mesh.rotation.z = Math.PI / 2;
        mesh.rotation.y = Math.PI;
    } else if (size.z < size.x && size.z < size.y) {
        mesh.rotation.x = Math.PI / 2;
        mesh.rotation.y = Math.PI;
    }

    mesh.geometry.computeBoundingBox();
    boundingBox = new THREE.Box3().setFromObject(mesh);
    const minY = boundingBox.min.y;
    mesh.position.y -= minY;
}
