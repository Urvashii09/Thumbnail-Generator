document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('generator-form');
    const topicInput = document.getElementById('topic');
    const generateBtn = document.getElementById('generate-btn');
    const loadingState = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const resultArea = document.getElementById('result-area');
    const carouselResultArea = document.getElementById('carousel-result-area');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const genModeInput = document.getElementById('gen-mode');
    
    // Mode Switching
    const modeTabs = document.querySelectorAll('.mode-tab');
    const platformGroup = document.getElementById('platform-group');
    const ratioGroup = document.getElementById('ratio-group');

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.dataset.mode;
            genModeInput.value = mode;

            if (mode === 'carousel') {
                platformGroup.classList.add('hidden');
                ratioGroup.classList.remove('hidden');
                loadingText.textContent = 'Generating consistent carousel slides...';
            } else {
                platformGroup.classList.remove('hidden');
                ratioGroup.classList.add('hidden');
                loadingText.textContent = 'Generating aesthetic concept...';
            }
        });
    });

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
    
    // Result elements (Single)
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
    
    // Result elements (Carousel)
    const slidesContainer = document.getElementById('slides-container');
    const consistencyNoteEl = document.getElementById('consistency-note');
    
    // Inputs
    const themeSelect = document.getElementById('theme');
    const logoInput = document.getElementById('logo');
    const fileNameSpan = document.getElementById('file-name');
    const audienceInput = document.getElementById('audience');
    const platformInput = document.getElementById('platform');
    const ratioSelect = document.getElementById('aspect-ratio');
    
    // File input listener - handle selected files
    const handleFile = (file) => {
        if (file) {
            fileNameSpan.textContent = file.name;
            fileNameSpan.style.color = 'var(--text-main)';
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

    // Drag and Drop
    const fileUploadBox = document.querySelector('.file-upload');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadBox.addEventListener(eventName, preventDefaults, false);
    });
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter', 'dragover'].forEach(eventName => { fileUploadBox.addEventListener(eventName, highlight, false); });
    ['dragleave', 'drop'].forEach(eventName => { fileUploadBox.addEventListener(eventName, unhighlight, false); });
    function highlight(e) { fileUploadBox.classList.add('drag-over'); }
    function unhighlight(e) { fileUploadBox.classList.remove('drag-over'); }
    fileUploadBox.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]), false);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const mode = genModeInput.value;
        const topic = topicInput.value.trim();
        if (!topic) return;

        const audience = audienceInput.value.trim();
        const platform = platformInput.value.trim();
        const theme = themeSelect.value;
        const aspectRatio = ratioSelect.value;

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
        
        // UI State: Loading
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Generating...</span>';
        resultArea.classList.add('hidden');
        carouselResultArea.classList.add('hidden');
        loadingState.classList.remove('hidden');

        try {
            const endpoint = mode === 'carousel' ? '/api/generate_carousel' : '/api/generate_concept';
            const payload = { topic, theme, logoBase64, audience };
            if (mode === 'carousel') payload.aspectRatio = aspectRatio;
            else payload.platform = platform;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate content');
            }

            const data = await response.json();
            
            if (mode === 'single') {
                renderSingleResult(data, topic);
            } else {
                renderCarouselResult(data, topic, aspectRatio);
            }

        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span>Generate Concept</span><i class="fa-solid fa-bolt"></i>';
        }
    });

    function renderSingleResult(data, topic) {
        const imageContainer = document.getElementById('image-container');
        const generatedImage = document.getElementById('generated-image');
        const imageError = document.getElementById('image-error');
        const downloadBtn = document.getElementById('download-btn');
        
        imageContainer.classList.remove('hidden');
        if (data.generated_image_base64) {
            generatedImage.src = data.generated_image_base64;
            generatedImage.classList.remove('hidden');
            imageError.classList.add('hidden');
            downloadBtn.classList.remove('hidden');
            downloadBtn.onclick = () => downloadImage(data.generated_image_base64, `thumbify_ai_${cleanString(topic)}_thumbnail.jpg`);
        } else {
            generatedImage.classList.add('hidden');
            imageError.textContent = data.image_error || 'Failed to generate image';
            imageError.classList.remove('hidden');
            downloadBtn.classList.add('hidden');
        }
        
        visualConceptEl.textContent = data.visual_concept;
        mainSubjectEl.textContent = data.main_subject;
        backgroundSceneEl.textContent = data.background_scene;
        emotionActionEl.textContent = data.emotion_action;
        lightingStyleEl.textContent = data.lighting_style;
        compositionEl.textContent = data.composition;
        textOverlayEl.textContent = data.text_overlay;
        viralHookEl.textContent = data.viral_hook;
        imagePromptEl.textContent = data.image_prompt;
        
        renderPalette(data.color_palette);
        resultArea.classList.remove('hidden');
    }

    function renderCarouselResult(data, topic, ratio) {
        slidesContainer.innerHTML = '';
        consistencyNoteEl.textContent = data.visual_consistency_note || '';
        const ratioClass = `ratio-${ratio.replace(':', '-')}`;

        data.slides.forEach(slide => {
            const card = document.createElement('div');
            card.className = 'slide-card glass-card';
            
            let imgHtml = '';
            if (slide.generated_image_base64) {
                imgHtml = `<div class="slide-img-container ${ratioClass}">
                    <img src="${slide.generated_image_base64}" class="slide-img" alt="Slide ${slide.slide_number}">
                </div>`;
            } else {
                imgHtml = `<div class="slide-img-container ${ratioClass}" style="display:flex;align-items:center;justify-content:center;background:rgba(255,0,0,0.1);color:#ef4444;padding:20px;text-align:center;">
                    <p>Image Generation Failed</p>
                </div>`;
            }

            card.innerHTML = `
                ${imgHtml}
                <div class="slide-info">
                    <span class="slide-number">Slide ${slide.slide_number}</span>
                    <h4 class="slide-heading">${slide.heading}</h4>
                    <p class="slide-subtext">${slide.subtext}</p>
                </div>
                <div class="slide-actions">
                    <button class="icon-btn" onclick="downloadImage('${slide.generated_image_base64}', 'thumbify_ai_slide_${slide.slide_number}.jpg')">
                        <i class="fa-solid fa-download"></i> Save Slide
                    </button>
                    <button class="icon-btn" onclick="copyTextToClipboard('${slide.heading}: ${slide.subtext}', this)">
                        <i class="fa-regular fa-copy"></i> Copy Text
                    </button>
                </div>
            `;
            slidesContainer.appendChild(card);
        });
        carouselResultArea.classList.remove('hidden');
    }

    function renderPalette(palette) {
        colorPaletteEl.innerHTML = '';
        if (palette && Array.isArray(palette)) {
            palette.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.innerHTML = `<div class="color-box" style="background-color: ${color}"></div><div class="color-code">${color}</div>`;
                colorPaletteEl.appendChild(swatch);
            });
        }
    }

    function cleanString(str) { return str.replace(/[^a-z0-9]/gi, '_').toLowerCase(); }
    
    window.downloadImage = function(base64, name) {
        if (!base64) return;
        const a = document.createElement('a');
        a.href = base64;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    window.copyTextToClipboard = function(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const icon = btnElement.querySelector('i');
            const originalClass = icon.className;
            icon.className = 'fa-solid fa-check';
            setTimeout(() => icon.className = originalClass, 2000);
        });
    };
});

window.copyText = function(elementId, btnElement) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        const icon = btnElement.querySelector('i');
        icon.className = 'fa-solid fa-check';
        setTimeout(() => icon.className = 'fa-regular fa-copy', 2000);
    });
};
