app.get('/model/:modelName', (req, res) => {
    const modelName = req.params.modelName;
    const modelPath = path.join(__dirname, 'public', 'models', `${modelName}.stl`);

    fs.access(modelPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('Model not found');
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${modelName} - 3D Viewer</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <div id="model-container" style="width: 100%; height: 100vh;"></div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
                <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js"></script>
                <script>
                    // Set up scene, camera, renderer, and controls
                    const container = document.getElementById('model-container');
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 2000);
                    camera.position.set(0, 50, 200);
                    
                    const renderer = new THREE.WebGLRenderer({ antialias: true });
                    renderer.setSize(container.clientWidth, container.clientHeight);
                    container.appendChild(renderer.domElement);

                    // Add ambient and directional lights
                    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
                    scene.add(ambientLight);
                    
                    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                    directionalLight.position.set(50, 200, 100);
                    scene.add(directionalLight);

                    // Load the STL model
                    const loader = new THREE.STLLoader();
                    loader.load('/models/${modelName}.stl', function (geometry) {
                        const material = new THREE.MeshStandardMaterial({ color: 0x606060 });
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.rotation.x = -Math.PI / 2;  // Adjust the orientation
                        scene.add(mesh);
                    });

                    // Set up OrbitControls
                    const controls = new THREE.OrbitControls(camera, renderer.domElement);
                    controls.enableDamping = true;

                    // Animate and render the scene
                    function animate() {
                        requestAnimationFrame(animate);
                        controls.update();
                        renderer.render(scene, camera);
                    }
                    animate();

                    // Handle window resize
                    window.addEventListener('resize', () => {
                        camera.aspect = container.clientWidth / container.clientHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(container.clientWidth, container.clientHeight);
                    });
                </script>
            </body>
            </html>
        `);
    });
});
