// ============================================
// BRIGHTPATH - Main Application Script
// Beautiful UX Edition
// ============================================

// Get DOM elements
const elements = {
    previewImage: document.getElementById('previewImage'),
    imagePreview: document.getElementById('imagePreview'),
    placeholder: document.getElementById('placeholder'),
    status: document.getElementById('status'),
    statusMessage: document.getElementById('statusMessage'),
    descriptionContainer: document.getElementById('descriptionContainer'),
    descriptionText: document.getElementById('descriptionText'),
    speakBtn: document.getElementById('speakBtn'),
    errorContainer: document.getElementById('errorContainer'),
    errorText: document.getElementById('errorText'),
    fileInput: document.getElementById('fileInput'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingMessage: document.getElementById('loadingMessage'),
    timestamp: document.getElementById('timestamp'),
    quickTips: document.getElementById('quickTips')
};

// State
let state = {
    currentDescription: '',
    isSpeaking: false,
    processing: false
};

// ============================================
// FILE HANDLING
// ============================================

// Handle file input change (triggered by camera capture)
elements.fileInput.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        handleImageFile(file);
    }
    // Reset input so same file can be selected again
    this.value = '';
});

// Handle image file
function handleImageFile(file) {
    // Preview image with smooth animation
    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImage.src = e.target.result;
        elements.previewImage.style.display = 'block';
        elements.placeholder.style.display = 'none';
        elements.imagePreview.classList.add('has-image');
        
        // Reset animation for smooth transitions
        elements.previewImage.style.animation = 'none';
        requestAnimationFrame(() => {
            elements.previewImage.style.animation = 'fadeIn 0.5s ease-out';
        });
    };
    reader.readAsDataURL(file);
    
    // Analyze image
    analyzeImage(file);
}

// ============================================
// IMAGE ANALYSIS
// ============================================

async function analyzeImage(file) {
    if (state.processing) return;
    state.processing = true;
    
    // Show status with smooth transition
    elements.status.classList.remove('hidden');
    elements.descriptionContainer.style.display = 'none';
    elements.errorContainer.style.display = 'none';
    
    // Status messages with timing
    const messages = [
        { text: '🔍 Analyzing image...', delay: 0 },
        { text: '🧠 Identifying objects...', delay: 1200 },
        { text: '📝 Generating description...', delay: 2400 }
    ];
    
    messages.forEach((msg, index) => {
        setTimeout(() => {
            if (elements.statusMessage) {
                elements.statusMessage.textContent = msg.text;
            }
        }, msg.delay);
    });
    
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
        elements.status.classList.add('hidden');
        elements.loadingOverlay.classList.remove('active');
        state.processing = false;
        
        if (data.success) {
            state.currentDescription = data.description;
            displayDescription(data.description);
            
            // Auto-speak after short delay for UX
            setTimeout(() => {
                speakDescription();
            }, 400);
            
            // Update quick tips to show success
            updateQuickTip('✅ AI description ready! Tap Listen to hear it again.');
        } else {
            showError(data.error || 'Failed to analyze image. Please try again.');
            updateQuickTip('⚠️ Something went wrong. Try taking another photo.');
        }
    } catch (err) {
        console.error('Analysis error:', err);
        elements.status.classList.add('hidden');
        elements.loadingOverlay.classList.remove('active');
        state.processing = false;
        showError('Network error. Please check your connection and try again.');
        updateQuickTip('⚠️ Network error. Please check your connection.');
    }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

// Display description with animation
function displayDescription(text) {
    elements.descriptionText.textContent = text;
    elements.descriptionContainer.style.display = 'block';
    
    // Update timestamp
    const now = new Date();
    elements.timestamp.textContent = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    // Trigger slide-up animation
    elements.descriptionContainer.style.animation = 'none';
    requestAnimationFrame(() => {
        elements.descriptionContainer.style.animation = 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    });
}

// ============================================
// TEXT-TO-SPEECH
// ============================================

// Speak description
function speakDescription() {
    if (!state.currentDescription) return;
    
    if (!('speechSynthesis' in window)) {
        showError('Text-to-speech is not supported in this browser.');
        return;
    }
    
    // Toggle speak on/off
    if (state.isSpeaking) {
        window.speechSynthesis.cancel();
        state.isSpeaking = false;
        updateSpeakButton(false);
        return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(state.currentDescription);
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    
    // Find best voice for mobile/desktop
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = [
        'Google UK English Female',
        'Google US English Female',
        'Samantha',
        'Alex',
        'Microsoft Zira Desktop',
        'Microsoft David Desktop'
    ];
    
    let selectedVoice = voices.find(v => 
        preferredVoices.some(name => v.name.includes(name))
    );
    
    if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en'));
    }
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    // Speech events
    utterance.onstart = () => {
        state.isSpeaking = true;
        updateSpeakButton(true);
    };
    
    utterance.onend = () => {
        state.isSpeaking = false;
        updateSpeakButton(false);
    };
    
    utterance.onerror = () => {
        state.isSpeaking = false;
        updateSpeakButton(false);
    };
    
    window.speechSynthesis.speak(utterance);
}

// Update speak button UI
function updateSpeakButton(isSpeaking) {
    if (isSpeaking) {
        elements.speakBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
        elements.speakBtn.style.background = 'rgba(239, 68, 68, 0.15)';
        elements.speakBtn.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        elements.speakBtn.style.color = '#f87171';
    } else {
        elements.speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Listen';
        elements.speakBtn.style.background = '';
        elements.speakBtn.style.borderColor = '';
        elements.speakBtn.style.color = '';
    }
}

// ============================================
// UI HELPERS
// ============================================

// Show error with animation
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorContainer.style.display = 'flex';
    
    // Shake animation for errors
    elements.errorContainer.style.animation = 'none';
    requestAnimationFrame(() => {
        elements.errorContainer.style.animation = 'shake 0.5s ease-out';
    });
    
    // Auto-hide after 6 seconds
    clearTimeout(window.errorTimeout);
    window.errorTimeout = setTimeout(() => {
        elements.errorContainer.style.display = 'none';
    }, 6000);
}

// Update quick tip
function updateQuickTip(message) {
    if (elements.quickTips) {
        elements.quickTips.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        
        // Reset animation
        elements.quickTips.style.animation = 'none';
        requestAnimationFrame(() => {
            elements.quickTips.style.animation = 'fadeIn 0.3s ease-out';
        });
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

// Speak button (click and touch for mobile)
elements.speakBtn.addEventListener('click', function(e) {
    e.preventDefault();
    speakDescription();
});

elements.speakBtn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    speakDescription();
}, { passive: true });

// ============================================
// VOICE SUPPORT
// ============================================

// Load voices when available
if ('speechSynthesis' in window) {
    // Try to load voices immediately
    window.speechSynthesis.getVoices();
    
    // Listen for voice changes (important for mobile Chrome)
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// ============================================
// KEYBOARD SHORTCUTS (Desktop only)
// ============================================

document.addEventListener('keydown', function(e) {
    // Space to speak description (only when not in input)
    if (e.key === ' ' && !e.target.matches('input, textarea')) {
        if (elements.descriptionContainer.style.display !== 'none') {
            e.preventDefault();
            speakDescription();
        }
    }
    
    // Escape to close error
    if (e.key === 'Escape') {
        elements.errorContainer.style.display = 'none';
    }
});

// ============================================
// MOBILE OPTIMIZATIONS
// ============================================

// Handle orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        // Ensure UI adjusts properly
        const video = document.getElementById('cameraVideo');
        if (video && video.srcObject) {
            // Video will auto-adjust
        }
    }, 300);
});

// Prevent zoom on double tap
document.addEventListener('touchend', function(e) {
    if (e.target.closest('.container') || e.target.closest('.fullscreen-tap')) {
        // Allow normal behavior
    }
}, { passive: true });

// ============================================
// INITIALIZATION
// ============================================

// Update quick tips periodically
const tipMessages = [
    '👆 Tap anywhere on the screen to take a photo',
    '📸 Hold your phone steady for better photos',
    '💡 Good lighting helps AI see better',
    '🔊 Tap Listen to hear the description aloud',
    '📱 Tap anywhere — no buttons needed!'
];

let tipIndex = 0;
setInterval(() => {
    if (!state.processing && elements.descriptionContainer.style.display === 'none') {
        tipIndex = (tipIndex + 1) % tipMessages.length;
        if (elements.quickTips) {
            elements.quickTips.innerHTML = `<i class="fas fa-lightbulb"></i> ${tipMessages[tipIndex]}`;
        }
    }
}, 8000);

console.log('🌟 BrightPath: Beautiful UX ready!');
console.log('👆 Tap anywhere to capture photos.');
console.log('🔊 Descriptions will be spoken aloud automatically.');