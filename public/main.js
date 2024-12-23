document.addEventListener('DOMContentLoaded', function () {
    // Model list fetch and display
    fetch('/models-list')
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById('model-gallery');
            data.models.forEach(model => {
                const modelCard = document.createElement('div');
                modelCard.classList.add('model-card');
                modelCard.style.cursor = 'pointer';

                const img = document.createElement('img');
                img.src = model.thumbnailPath || '/placeholder.png';
                img.alt = `Thumbnail for ${model.name}`;
                img.classList.add('thumbnail');
                modelCard.appendChild(img);

                const modelName = document.createElement('h3');
                modelName.textContent = model.name;
                modelName.classList.add('model-name');
                modelCard.appendChild(modelName);

                modelCard.onclick = () => openModelViewer(model);
                gallery.appendChild(modelCard);
            });
        })
        .catch(error => console.error('Error fetching model list:', error));

    // Dark mode toggle initialization
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (localStorage.getItem('darkMode') === 'disabled') {
        disableDarkMode();
    } else {
        enableDarkMode();
    }

    darkModeToggle.addEventListener('click', function () {
        if (document.body.classList.contains('dark-mode')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });

    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        document.querySelector('header').classList.add('dark-mode');
        document.querySelector('header').classList.remove('light-mode');
        document.querySelector('.model-info')?.classList.add('dark-mode');
        document.querySelector('.model-info')?.classList.remove('light-mode');
        localStorage.setItem('darkMode', 'enabled');
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
        document.querySelector('header').classList.remove('dark-mode');
        document.querySelector('header').classList.add('light-mode');
        document.querySelector('.model-info')?.classList.remove('dark-mode');
        document.querySelector('.model-info')?.classList.add('light-mode');
        localStorage.setItem('darkMode', 'disabled');
    }

    // Check for a specific model in the URL and load it if present
    const currentModelName = window.location.pathname.split('/model/')[1];
    if (currentModelName) {
        openModelViewer({
            name: decodeURIComponent(currentModelName),
            modelPath: `/models/${decodeURIComponent(currentModelName)}.stl`,
            thumbnailPath: `/thumbnails/${decodeURIComponent(currentModelName)}.png`
        }, replace = true); // Sayfa yenilendiğinde mevcut durumu replaceState ile ekle
    }
});

window.addEventListener('popstate', function (event) {
    if (event.state && event.state.model) {
        openModelViewer({
            name: event.state.model,
            modelPath: `/models/${event.state.model}.stl`,
            thumbnailPath: `/thumbnails/${event.state.model}.png`
        });
    } else {
        loadGallery();
    }
});

function loadGallery() {
    window.location.href = '/'; // Ana sayfaya yönlendir
    // Anasayfayı yeniden yükleyen fonksiyon
    const gallery = document.getElementById('model-gallery');
    gallery.innerHTML = '';  // Galeriyi temizler
    // Galeriyi tekrar yüklemek için `fetch` çağrısını burada yapabilirsiniz
    fetch('/models-list')
        .then(response => response.json())
        .then(data => {
            // Galeriyi yeniden oluşturur
            data.models.forEach(model => {
                const modelCard = document.createElement('div');
                modelCard.classList.add('model-card');
                // Diğer kart içeriği burada
                gallery.appendChild(modelCard);
            });
        });
}


// Function to create the model viewer page
function openModelViewer(model, replace = false) {
    const newUrl = `${window.location.origin}/model/${encodeURIComponent(model.name)}`;

    // `replace` parametresi varsa replaceState, yoksa pushState kullan
    if (replace) {
        history.replaceState({ model: model.name }, `Model Viewer - ${model.name}`, newUrl);
    } else {
        history.pushState({ model: model.name }, `Model Viewer - ${model.name}`, newUrl);
    }

    // Clear the existing content, but keep the site header
    document.querySelector('main').innerHTML = `
 <div class="model-viewer-layout">
     <div class="model-viewer-container">
         <div id="model-container" class="viewer"></div>
     </div>
     <div class="model-info">
         <h2>Model Information</h2>
         <p class="model-name"><strong>Model Name:</strong> ${model.name}</p>
         <p><strong>Description:</strong> Detailed information about the model can be provided here.</p>
         <p><strong>Dimensions:</strong> Placeholder for dimensions, etc.</p>
     </div>
 </div>
`;

    setupViewer('model-container', model.modelPath, model.name);
}

// Event listener for handling the browser's back and forward buttons
window.addEventListener('popstate', function (event) {
    if (event.state && event.state.model) {
        // If a state exists in history, open the corresponding model viewer
        openModelViewer({
            name: event.state.model,
            modelPath: `/models/${event.state.model}.stl`,
            thumbnailPath: `/thumbnails/${event.state.model}.png`
        });
    } else {
        // If no specific state, go back to main gallery
        location.reload(); // Or implement a function to reload the main gallery without a full page refresh
    }
});


function createDynamicGround(scene, modelSize) {
    const groundPaddingFactor = 2;  // Ground size is larger to give some padding around the model
    let constantTileSize = 5;  // Default size of individual tiles

    // Determine the largest model dimension (either X or Z)
    const largestDimension = Math.max(modelSize.x, modelSize.z);

    // Adjust tile size based on model size to maintain good visual proportions
    if (largestDimension > 50) {
        constantTileSize = largestDimension / 10;  // Büyük modellerde daha büyük kareler olsun
    } else if (largestDimension < 10) {
        constantTileSize = largestDimension / 2;  // Küçük modellerde daha küçük ama uygun kareler olsun
    }

    // Calculate the size of the ground based on the model's largest dimension
    const groundSize = largestDimension * groundPaddingFactor;

    // Calculate how many tiles will be used to cover the ground
    const divisions = Math.round(groundSize / constantTileSize);

    // Create a checkered texture for the ground
    const checkeredCanvas = document.createElement('canvas');
    checkeredCanvas.width = divisions;
    checkeredCanvas.height = divisions;
    const ctx = checkeredCanvas.getContext('2d');

    // Create a checkerboard pattern with contrasting colors
    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            ctx.fillStyle = (i + j) % 2 === 0 ? '#444444' : '#888888'; // Daha belirgin gri tonları
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
    ground.receiveShadow = true;

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
    renderer.shadowMap.enabled = true; // Gölge etkisini etkinleştir

    // Dark mode veya light mode'a uygun arka plan rengini ayarla
    if (document.body.classList.contains('dark-mode')) {
        renderer.setClearColor(new THREE.Color('#202123'));  // Dark mode: koyu gri-siyah
    } else {
        renderer.setClearColor(new THREE.Color('#f0f0f0'));  // Light mode: açık gri
    }

    container.appendChild(renderer.domElement);

    // Add controls for model interaction
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Add lights for illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Load and add the model to the scene
    const loader = new THREE.STLLoader();
    loader.load(modelPath, function (geometry) {
        geometry.center();  // Center geometry to adjust pivot
        const material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.1 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
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
