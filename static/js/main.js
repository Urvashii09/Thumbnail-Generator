document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generator-form');
    const topicInput = document.getElementById('topic');
    const generateBtn = document.getElementById('generate-btn');
    const loadingState = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Theme setup
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    });
    
    // Result elements
    const visualConceptEl = document.getElementById('visual-concept');
    const mainSubjectEl = document.getElementById('main-subject');
    const backgroundSceneEl = document.getElementById('background-scene');
    const emotionActionEl = document.getElementById('emotion-action');
    const colorPaletteEl = document.getElementById('color-palette');
    const lightingStyleEl = document.getElementById('lighting-style');
    const compositionEl = document.getElementById('composition');
    const textOverlayEl = document.getElementById('text-overlay');
    const viralHookEl = document.getElementById('viral-hook');
    const imagePromptEl = document.getElementById('image-prompt');
    
    // Inputs
    const themeSelect = document.getElementById('theme');
    const logoInput = document.getElementById('logo');
    const fileNameSpan = document.getElementById('file-name');
    const audienceInput = document.getElementById('audience');
    const platformInput = document.getElementById('platform');
    
    // File input listener - handle selected files
    const handleFile = (file) => {
        if (file) {
            fileNameSpan.textContent = file.name;
            fileNameSpan.style.color = 'var(--text-main)';
            // Manually set the files array for the logoInput
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            logoInput.files = dataTransfer.files;
        } else {
            fileNameSpan.textContent = 'Choose Logo';
            fileNameSpan.style.color = 'var(--text-muted)';
            logoInput.value = ''; // Reset
        }
    };

    logoInput.addEventListener('change', (e) => {
        handleFile(e.target.files && e.target.files[0]);
    });

    // Drag and Drop functionality
    const fileUploadBox = document.querySelector('.file-upload');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadBox.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadBox.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadBox.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        fileUploadBox.classList.add('drag-over');
    }

    function unhighlight(e) {
        fileUploadBox.classList.remove('drag-over');
    }

    fileUploadBox.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFile(files[0]);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const topic = topicInput.value.trim();
        if (!topic) return;

        const audience = audienceInput.value.trim();
        const platform = platformInput.value.trim();

        // Read Logo as Base64 if exists
        let logoBase64 = null;
        if (logoInput.files && logoInput.files[0]) {
            logoBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(logoInput.files[0]);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }
        
        const theme = themeSelect.value;

        // UI State: Loading
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Generating...</span>';
        resultArea.classList.add('hidden');
        loadingState.classList.remove('hidden');

        try {
            const response = await fetch('/api/generate_concept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic, theme, logoBase64, audience, platform }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate concept');
            }

            const data = await response.json();
            
            // Image handling
            const imageContainer = document.getElementById('image-container');
            const generatedImage = document.getElementById('generated-image');
            const imageError = document.getElementById('image-error');
            const downloadBtn = document.getElementById('download-btn');
            
            imageContainer.classList.remove('hidden'); // Always show the section title
            
            if (data.generated_image_base64) {
                generatedImage.src = data.generated_image_base64;
                generatedImage.classList.remove('hidden');
                imageError.classList.add('hidden');
                
                // Show and setup download button
                downloadBtn.classList.remove('hidden');
                downloadBtn.onclick = () => {
                    const cleanTopic = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    const a = document.createElement('a');
                    a.href = data.generated_image_base64;
                    a.download = `luminagen_${cleanTopic}_thumbnail.jpg`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                };
            } else if (data.image_error) {
                generatedImage.classList.add('hidden');
                imageError.textContent = data.image_error;
                imageError.classList.remove('hidden');
            } else {
                imageContainer.classList.add('hidden');
            }
            
            // Populate Data
            visualConceptEl.textContent = data.visual_concept;
            mainSubjectEl.textContent = data.main_subject;
            backgroundSceneEl.textContent = data.background_scene;
            emotionActionEl.textContent = data.emotion_action;
            lightingStyleEl.textContent = data.lighting_style;
            compositionEl.textContent = data.composition;
            textOverlayEl.textContent = data.text_overlay;
            viralHookEl.textContent = data.viral_hook;
            imagePromptEl.textContent = data.image_prompt;
            
            // Generate Color Palette
            colorPaletteEl.innerHTML = '';
            if (data.color_palette && Array.isArray(data.color_palette)) {
                data.color_palette.forEach(color => {
                    const swatch = document.createElement('div');
                    swatch.className = 'color-swatch';
                    
                    const box = document.createElement('div');
                    box.className = 'color-box';
                    box.style.backgroundColor = color;
                    
                    const code = document.createElement('div');
                    code.className = 'color-code';
                    code.textContent = color;
                    
                    swatch.appendChild(box);
                    swatch.appendChild(code);
                    colorPaletteEl.appendChild(swatch);
                });
            }

            // UI State: Success
            loadingState.classList.add('hidden');
            resultArea.classList.remove('hidden');
            resultArea.style.opacity = '0';
            setTimeout(() => {
                resultArea.style.opacity = '1';
                resultArea.style.transition = 'opacity 0.5s ease';
            }, 50);

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
            loadingState.classList.add('hidden');
        } finally {
            // UI State: Reset Button
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span>Generate Concept</span><i class="fa-solid fa-bolt"></i>';
        }
    });
});

// Utility function to copy text
window.copyText = function(elementId, btnElement) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        const icon = btnElement.querySelector('i');
        icon.className = 'fa-solid fa-check';
        btnElement.style.color = 'var(--primary)';
        
        setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
            btnElement.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};
