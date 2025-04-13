document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const uploadButton = document.getElementById('uploadButton');
    const listButton = document.getElementById('listButton');
    const fileList = document.getElementById('fileList');

    const API_BASE = 'http://Load-Balancer-final-701069350.us-east-1.elb.amazonaws.com';

    uploadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        fetch(`${API_BASE}/objects`, {
            method: 'POST',
            mode: 'cors',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert(`Upload failed: ${data.error} - ${data.details}`);
            } else {
                alert(data.message);
                fileInput.value = '';
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            alert('Upload failed.');
        });
    });

    listButton.addEventListener('click', () => {
        fetch(`${API_BASE}/objects`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            fileList.innerHTML = '';
            if (data.error) {
                alert(`List files failed: ${data.error} - ${data.details}`);
            } else if (data.length === 0) {
                fileList.innerHTML = '<p>No files found.</p>';
            } else {
                const ul = document.createElement('ul');
                data.forEach(item => {
                    const li = document.createElement('li');

                    // Display Resized Image
                    const resizedImage = new Image();
                    resizedImage.onload = () => {
                        resizedImage.alt = `Resized: ${item.Key}`;
                        resizedImage.style.maxWidth = '200px'; // Adjust as needed
                        li.appendChild(resizedImage);
                    };
                    resizedImage.onerror = (error) => {
                        console.error('Error loading resized image:', error, item.Url);
                        li.innerHTML += `<p>Error loading resized image: ${item.Key}</p>`;
                    };
                    resizedImage.src = item.Url;

                    // Display Original Image Link
                    const originalImageLink = document.createElement('a');
                    originalImageLink.href = `${API_BASE}/objects/${item.Key}`; // Use the resized key to fetch the original
                    originalImageLink.textContent = `Original: ${item.Key}`;
                    originalImageLink.target = '_blank'; // Open in a new tab
                    li.appendChild(document.createElement('br')); // Add a line break
                    li.appendChild(originalImageLink);

                    ul.appendChild(li);
                });
                fileList.appendChild(ul);
            }
        })
        .catch(error => {
            console.error('List files error:', error);
            alert('Failed to list files.');
        });
    });
});