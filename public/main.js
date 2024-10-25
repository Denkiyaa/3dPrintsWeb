function createDynamicGround(scene, modelSize) {
    const groundPaddingFactor = 2;  // Ground size is 1.25x larger than the model
    const constantTileSize = 5;  // Set a constant tile size (you can adjust this value)

    // Get the largest dimension (X or Z) to create square tiles
    const largestDimension = Math.max(modelSize.x, modelSize.z);
    
    // Calculate ground size based on the largest dimension and padding factor
    const groundSize = largestDimension * groundPaddingFactor;

    // Calculate the number of tiles based on the constant tile size
    const divisions = Math.round(groundSize / constantTileSize);

    // Create a checkered texture for the ground
    const checkeredCanvas = document.createElement('canvas');
    checkeredCanvas.width = divisions;
    checkeredCanvas.height = divisions;
    const ctx = checkeredCanvas.getContext('2d');

    // Create the checkerboard pattern
    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? '#cccccc' : '#333333';  // Alternate colors
            ctx.fillRect(i, j, 1, 1);
        }
    }

    const checkeredTexture = new THREE.CanvasTexture(checkeredCanvas);
    checkeredTexture.magFilter = THREE.NearestFilter;
    checkeredTexture.minFilter = THREE.LinearMipMapLinearFilter;

    // Create the ground plane with the dynamic checkered texture
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);  // Ground size is a square
    const groundMaterial = new THREE.MeshStandardMaterial({ map: checkeredTexture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;  // Rotate to lie flat on the XZ plane
    ground.position.y = 0;  // Set ground at Y=0

    scene.add(ground);  // Add ground to the scene
}


// Function to set up a viewer with a specific container, model path, and model name
function setupViewer(containerId, modelPath, modelName) {
    const container = document.getElementById(containerId);

    // Create a scene, camera, and renderer for each viewer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 2000);
    camera.zoom = 1;  // Set initial zoom
    camera.updateProjectionMatrix();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));  // Reduce pixel ratio for performance
    renderer.setSize(container.offsetWidth, container.offsetHeight);

    // Set a light gradient background
    renderer.setClearColor(new THREE.Color('rgb(230, 230, 230)'));  // Start with a light gray background
    container.appendChild(renderer.domElement);

    // Add a header for displaying the model's name
    const header = document.createElement('h3');
    header.textContent = `Model: ${modelName}`;
    header.style.textAlign = 'center';
    header.style.marginBottom = '10px';
    container.prepend(header);

    // Add OrbitControls to allow interaction with the model
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;  // Enable damping for smoother interactions

    // Add ambient light for even illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);  // Ambient light for soft overall illumination
    scene.add(ambientLight);

    // Add hemisphere light for uniform lighting from top and bottom
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);  // Simulates sky and ground lighting
    hemisphereLight.position.set(0, 1, 0);  // Positioned above the model
    scene.add(hemisphereLight);

    // Helper function to rotate the model onto its flat side and adjust vertical position
    function adjustModel(mesh, scene) {
        mesh.geometry.computeBoundingBox();  // Ensure the bounding box is computed after loading the model
        let boundingBox = new THREE.Box3().setFromObject(mesh);
        const size = boundingBox.getSize(new THREE.Vector3());  // Get the size of the model

        // Call dynamic ground creation based on the model size
        createDynamicGround(scene, size);

        // Detect the "flat side" (smallest dimension)
        if (size.y < size.x && size.y < size.z) {
            console.log("Model is already flat on the XZ plane.");
        } else if (size.x < size.y && size.x < size.z) {
            mesh.rotation.z = Math.PI / 2;  // Rotate along Z axis to lay flat on X axis
            mesh.rotation.y = Math.PI;      // Flip the model if upside down
        } else if (size.z < size.x && size.z < size.y) {
            mesh.rotation.x = Math.PI / 2;  // Rotate along X axis to lay flat on Z axis
            mesh.rotation.y = Math.PI;      // Flip the model if upside down
        }

        mesh.geometry.computeBoundingBox();
        boundingBox = new THREE.Box3().setFromObject(mesh);

        // Align the model's bottom with the ground (Y=0)
        const minY = boundingBox.min.y;  // Find the lowest point of the model
        mesh.position.y -= minY;  // Adjust the Y position of the model so its bottom touches the ground
    }

    // Load and display the model
    const loader = new THREE.STLLoader();
    loader.load(modelPath, function (geometry) {
        geometry.center();  // Center the geometry to adjust pivot
        const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
        const mesh = new THREE.Mesh(geometry, material);

        // Add mesh to the scene
        scene.add(mesh);

        // Rotate the model onto its flat side and adjust vertical position
        adjustModel(mesh, scene);

        // Adjust camera based on model size and center
        const boundingBox = new THREE.Box3().setFromObject(mesh);
        const size = boundingBox.getSize(new THREE.Vector3());  // Get the size of the model
        const center = boundingBox.getCenter(new THREE.Vector3());  // Get the center of the model
        const maxDim = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxDim / (2 * Math.atan((Math.PI * camera.fov) / 360));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const distance = Math.max(fitHeightDistance, fitWidthDistance);

        // Set camera position based on the model size
        camera.position.set(center.x, center.y + size.y / 2, distance * 1.5);  // Set camera higher up
        camera.lookAt(center);
        controls.maxDistance = distance * 6;  // Set a maximum zoom-out distance
        controls.minDistance = distance * 0.5;  // Prevent zooming too close
        controls.update();
    }, undefined, function (error) {
        console.error(`Error loading the model in ${containerId}:`, error);
    });

    // Animation loop to render the scene
    const animate = function () {
        requestAnimationFrame(animate);

        // Update controls and render the scene
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    // Handle window resize for responsive behavior
    window.addEventListener('resize', () => {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
}

// Fetch the list of model files and load them into viewers
fetch('/models-list')
    .then(response => response.json())
    .then(data => {
        const models = data.models;

        if (models.length >= 2) {
            // Load the first two models into the two viewers, with their names
            setupViewer('model-container-1', `/models/${models[0]}`, models[0]);
            setupViewer('model-container-2', `/models/${models[1]}`, models[1]);
        } else {
            console.error('Not enough models to display.');
        }
    })
    .catch(error => {
        console.error('Error fetching model list:', error);
    });
