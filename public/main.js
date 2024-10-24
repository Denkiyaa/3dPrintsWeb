document.addEventListener('DOMContentLoaded', function () {
    // Fetch the list of models from the server
    fetch('/models-list')
        .then(response => response.json())
        .then(data => {
            const gallery = document.getElementById('model-gallery');

            data.models.forEach(model => {
                // Create container for each model
                const modelContainer = document.createElement('div');
                modelContainer.classList.add('model-container');

                // Create and append thumbnail image
                const img = document.createElement('img');
                img.src = model.thumbnailPath;
                img.alt = `Thumbnail for ${model.name}`;
                img.classList.add('thumbnail');
                modelContainer.appendChild(img);

                // Create and append link to individual model page
                const link = document.createElement('a');
                link.href = `/model/${model.name}`;
                link.textContent = `View ${model.name}`;
                modelContainer.appendChild(link);

                gallery.appendChild(modelContainer);
            });
        })
        .catch(error => {
            console.error('Error fetching model list:', error);
        });
});
