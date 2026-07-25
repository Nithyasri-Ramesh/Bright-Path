// Get DOM elements
const cameraBtn = document.getElementById('cameraBtn');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const imagePreview = document.getElementById('imagePreview');
const status = document.getElementById('status');
const descriptionContainer = document.getElementById('descriptionContainer');
const descriptionText = document.getElementById('descriptionText');
const errorContainer = document.getElementById('errorContainer');
const errorText = document.getElementById('errorText');
const speakBtn = document.getElementById('speakBtn');

// State
let currentImageFile = null;
let currentDescription = '';

// Camera handling
cameraBtn.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        // Create video element for capture
        const video = document.createElement('video');
        video.srcObject = stream;
        video.style.display = 'none';
        document.body.appendChild(video);
        
        await video.play();
        
        // Capture frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to file
        canvas.toBlob((blob) => {
            const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
            handleImageFile(file);
        }, 'image/jpeg', 0.9);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        
    } catch (err) {
        console.error('Camera error:', err);
        showError('Could not access camera. Please check permissions or use upload option.');
    }
});

// Upload handling
if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
}

fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
    }
});

// Handle image file
function handleImageFile(file) {
    currentImageFile = file;
    
    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        imagePreview.querySelector('.placeholder').style.display = 'none';
        imagePreview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
    
    // Analyze image
    analyzeImage(file);
}

// Analyze image
async function analyzeImage(file) {
    // Show status
    status.classList.remove('hidden');
    descriptionContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // Hide status
        status.classList.add('hidden');
        
        if (data.success) {
            currentDescription = data.description;
            descriptionText.textContent = currentDescription;
            descriptionContainer.style.display = 'block';
            
            // Auto-speak if description is available
            speakDescription();
        } else {
            showError(data.error || 'Failed to analyze image');
        }
    } catch (err) {
        console.error('Analysis error:', err);
        status.classList.add('hidden');
        showError('Network error. Please try again.');
    }
}

// Speak description using Web Speech API
function speakDescription() {
    if (!currentDescription) return;
    
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(currentDescription);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Try to use a natural voice
        const voices = window.speechSynthesis.getVoices();
        const naturalVoice = voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Natural')
        );
        if (naturalVoice) {
            utterance.voice = naturalVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    } else {
        showError('Text-to-speech is not supported in this browser.');
    }
}

// Speak button
speakBtn.addEventListener('click', speakDescription);

// Show error
function showError(message) {
    errorText.textContent = message;
    errorContainer.style.display = 'block';
}

// Error handling for images
previewImage.addEventListener('error', () => {
    previewImage.style.display = 'none';
    imagePreview.querySelector('.placeholder').style.display = 'block';
    imagePreview.classList.remove('has-image');
});

// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        cameraBtn.click();
    } else if (e.key === 'u' || e.key === 'U') {
        uploadBtn.click();
    } else if (e.key === ' ' || e.key === 'Enter') {
        if (descriptionContainer.style.display !== 'none') {
            e.preventDefault();
            speakBtn.click();
        }
    }
});