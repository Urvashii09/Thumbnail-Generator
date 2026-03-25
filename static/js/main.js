// Global Theme Logic (Available immediately)
window.toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    window.setTheme(newTheme);
};

window.setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('thumbify-theme', theme);
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        const icon = theme === 'light' ? 'fa-moon' : 'fa-sun';
        const i = themeToggleBtn.querySelector('i');
        if (i) i.className = `fa-solid ${icon}`;
    }
};

// Apply saved theme immediately
(function() {
    const savedTheme = localStorage.getItem('thumbify-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const form = document.getElementById('generator-form');
    const topicInput = document.getElementById('topic');
    const generateBtn = document.getElementById('generate-btn');
    const loadingState = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const resultArea = document.getElementById('result-area');
    const carouselResultArea = document.getElementById('carousel-result-area');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const genModeInput = document.getElementById('gen-mode');
    
    // Dashboard Stats State
    let appState = {
        projectCount: 0,
        downloadCount: 0,
        creditsLeft: 500,
        totalCredits: 500,
        recentProjects: []
    };

    function updateDashboardStats() {
        const projEl = document.getElementById('count-projects');
        const downEl = document.getElementById('count-downloads');
        const credEl = document.getElementById('count-credits');
        const progressBar = document.querySelector('.stats-progress-bar');
        const recentList = document.getElementById('recent-projects-list');

        if (projEl) projEl.textContent = appState.projectCount;
        if (downEl) downEl.textContent = appState.downloadCount;
        if (credEl) credEl.textContent = appState.creditsLeft;
        
        if (progressBar) {
            const percentage = (appState.creditsLeft / appState.totalCredits) * 100;
            progressBar.style.width = `${percentage}%`;
        }

        if (recentList) {
            if (appState.recentProjects.length === 0) {
                recentList.innerHTML = `
                    <div style="grid-column: 1/-1; padding: 40px; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px;">
                        <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 2rem; margin-bottom: 15px; display: block;"></i>
                        <p>No projects yet. Your creations will appear here!</p>
                    </div>
                `;
            } else {
                recentList.innerHTML = appState.recentProjects.slice(0, 3).map(p => `
                    <div class="recent-card animate-fade-in shadow-modern">
                        <div class="recent-preview">
                            <img src="${p.img}" alt="${p.title}">
                        </div>
                        <div class="recent-meta">
                            <span class="recent-title">${p.title}</span>
                            <span class="recent-date">${p.date}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    }
    
    // Initial UI update
    updateDashboardStats();
    
    // Navbar & Profile Elements
    const profileSection = document.getElementById('profile-section');
    const profileTrigger = document.getElementById('profile-trigger');
    const navLinks = document.querySelectorAll('.nav-link');
    const profileDropdown = document.getElementById('profile-dropdown');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const editProfileTrigger = document.getElementById('edit-profile-trigger');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const saveProfileBtn = document.getElementById('save-profile');
    const usernameDisplay = document.getElementById('nav-username');
    const avatarContainer = document.getElementById('nav-avatar');
    const modalAvatar = document.getElementById('modal-avatar');
    const newUsernameInput = document.getElementById('new-username');
    
    // 1. Sidebar Interactivity
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && 
                sidebar.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                e.target !== sidebarToggle) {
                sidebar.classList.remove('active');
            }
        });

        // Set active link on click
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                if (window.innerWidth <= 992) sidebar.classList.remove('active');
            });
        });
    }

    // 2. Profile Dropdown Interactivity
    if (profileTrigger && profileSection) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileSection.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (profileSection && !profileSection.contains(e.target)) {
                profileSection.classList.remove('open');
            }
        });
    }

    // Edit Profile Modal Logic
    if (editProfileTrigger && editProfileModal) {
        editProfileTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            profileSection.classList.remove('open');
            editProfileModal.classList.remove('hidden');
        });

        const closeModal = () => editProfileModal.classList.add('hidden');
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        
        window.addEventListener('click', (e) => {
            if (e.target === editProfileModal) closeModal();
        });

        if (newUsernameInput && modalAvatar) {
            newUsernameInput.addEventListener('input', (e) => {
                const val = e.target.value.trim();
                if (val) modalAvatar.textContent = val.substring(0, 1).toUpperCase();
            });
        }

        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const newName = newUsernameInput.value.trim();
                if (newName) {
                    usernameDisplay.textContent = newName;
                    const dashUser = document.getElementById('dash-username');
                    if (dashUser) dashUser.textContent = newName;
                    
                    // Update avatar initials
                    const initials = newName.substring(0, 1).toUpperCase();
                    avatarContainer.textContent = initials;
                    avatarContainer.style.fontSize = '0.9rem';
                    avatarContainer.style.fontWeight = '800';
                }
                closeModal();
            });
        }
    }

    // 10. Navigation & View Switching
    const dashboardSection = document.getElementById('dashboard-section');
    const templatesSection = document.getElementById('templates-section');
    const dashboardLinks = [document.getElementById('nav-dashboard'), document.getElementById('side-dashboard')];
    const createLinks = [document.getElementById('nav-create'), document.getElementById('side-create')];
    const templatesLinks = [document.getElementById('nav-templates'), document.getElementById('side-templates')];

    const magicLabSection = document.getElementById('magic-lab-section');
    const studioSection = document.getElementById('studio-section');
    const modeSelectorArea = document.getElementById('mode-selector-area');
    const magicLinks = [document.getElementById('side-magic')];
    const studioLinks = [document.getElementById('side-studio')];
    const settingsLinks = [document.getElementById('nav-settings'), document.getElementById('side-settings')];

    function showView(view) {
        // Toggle studio mode on body for specialized layout
        if (view === 'studio') {
            document.body.classList.add('studio-active');
        } else {
            document.body.classList.remove('studio-active');
        }

        // Hide all major areas
        dashboardSection.classList.add('hidden');
        form.classList.add('hidden');
        if (templatesSection) templatesSection.classList.add('hidden');
        if (magicLabSection) magicLabSection.classList.add('hidden');
        if (studioSection) studioSection.classList.add('hidden');
        if (modeSelectorArea) modeSelectorArea.classList.add('hidden');
        resultArea.classList.add('hidden');
        if (carouselResultArea) carouselResultArea.classList.add('hidden');
        const settingsSection = document.getElementById('settings-section');
        if (settingsSection) settingsSection.classList.add('hidden');

        // Show target
        if (view === 'templates') {
            templatesSection.classList.remove('hidden');
        } else if (view === 'dashboard') {
            dashboardSection.classList.remove('hidden');
        } else if (view === 'magic') {
            magicLabSection.classList.remove('hidden');
        } else if (view === 'studio') {
            studioSection.classList.remove('hidden');
        } else if (view === 'settings') {
            if (settingsSection) settingsSection.classList.remove('hidden');
        } else {
            form.classList.remove('hidden');
            if (modeSelectorArea) modeSelectorArea.classList.remove('hidden');
        }
    }

    function updateActiveLinks(clickedLink) {
        const allLinks = [...navLinks, ...sidebarLinks];
        allLinks.forEach(l => l.classList.remove('active'));
        
        const text = clickedLink.innerText.trim();
        allLinks.forEach(l => {
            if (l.innerText.trim() === text) l.classList.add('active');
        });
    }

    // Initialize with Dashboard
    showView('dashboard');
    updateActiveLinks(document.getElementById('nav-dashboard') || document.getElementById('side-dashboard'));

    templatesLinks.forEach(link => {
        if (link) link.addEventListener('click', (e) => {
            e.preventDefault();
            showView('templates');
            updateActiveLinks(link);
            if (window.innerWidth <= 992) sidebar.classList.remove('active');
        });
    });

    const sideSettingsLink = document.getElementById('side-settings');
    [...dashboardLinks, ...createLinks, ...magicLinks, ...studioLinks, sideSettingsLink].forEach(link => {
        if (link) link.addEventListener('click', (e) => {
            e.preventDefault();
            const text = link.innerText.trim().toLowerCase();
            let view = 'generator';
            if (text.includes('dashboard') || text.includes('home')) view = 'dashboard';
            else if (text.includes('magic')) view = 'magic';
            else if (text.includes('studio')) view = 'studio';
            else if (text.includes('settings')) view = 'settings';
            
            showView(view);
            if (link.id) updateActiveLinks(link);
            if (window.innerWidth <= 992) sidebar.classList.remove('active');
        });
    });

    // Dashboard Quick Actions
    const dashCreateBtn = document.getElementById('btn-dash-create');
    const dashTemplatesBtn = document.getElementById('btn-dash-templates');

    if (dashCreateBtn) {
        dashCreateBtn.addEventListener('click', () => {
            showView('generator');
            updateActiveLinks(document.getElementById('nav-create') || document.getElementById('side-create'));
        });
    }

    if (dashTemplatesBtn) {
        dashTemplatesBtn.addEventListener('click', () => {
            showView('templates');
            updateActiveLinks(document.getElementById('nav-templates') || document.getElementById('side-templates'));
        });
    }

    // 11. Magic Quick Actions (Form-based) - REMOVED for simplification

    // 11. Magic Lab Tool Interactions (Legacy redirected) - REMOVED redundant cards logic

    const closeToolBtn = document.querySelector('.close-tool-btn');
    if (closeToolBtn) {
        closeToolBtn.addEventListener('click', () => {
            document.getElementById('magic-tool-styling').classList.add('hidden');
        });
    }
    // 11. Magic Lab Tool Interactions (Already implemented)
    
    // 12. Advanced Studio Interactive Engine
    let studioState = {
        layers: [],
        selectedLayer: null,
        canvasSize: { width: 1280, height: 720 }
    };

    let carouselState = {
        slides: [],
        history: [],
        historyIndex: -1,
        topic: '',
        aspectRatio: '1:1'
    };

    const canvas = document.getElementById('main-canvas');
    const layersList = document.getElementById('layers-list');
    const propsContent = document.getElementById('props-content');
    const canvasPreset = document.getElementById('canvas-preset');
    const studioUpload = document.getElementById('studio-upload');
    const shapeTrigger = document.getElementById('btn-add-element-trigger');
    const shapePalette = document.getElementById('shape-palette');
    const quickColorInput = document.getElementById('studio-quick-color');

    function updateStudioUI() {
        renderLayers();
        renderCanvas();
    }

    function renderLayers() {
        if (!layersList) return;
        if (studioState.layers.length === 0) {
            layersList.innerHTML = '<div class="empty-layers">No layers yet.</div>';
            return;
        }
        layersList.innerHTML = studioState.layers.map((l, index) => {
            let icon = 'fa-image';
            if (l.type === 'text') icon = 'fa-font';
            if (l.type === 'shape') {
                if (l.shapeType === 'circle') icon = 'fa-circle';
                else if (l.shapeType === 'square') icon = 'fa-square';
                else icon = 'fa-shapes';
            }
            return `
                <div class="layer-item ${studioState.selectedLayer === index ? 'active' : ''}" onclick="selectStudioLayer(${index})">
                    <i class="fa-solid ${icon}"></i>
                    <span>${l.name}</span>
                </div>
            `;
        }).reverse().join('');
    }

    function renderCanvas() {
        if (!canvas) return;
        // Keep elements synced with state
    }

    // Canvas Resizing
    if (canvasPreset) {
        canvasPreset.addEventListener('change', (e) => {
            const val = e.target.value;
            let w = 1280, h = 720;
            if (val === 'insta-post') { w = 1080; h = 1080; }
            else if (val === 'insta-story') { w = 1080; h = 1920; }
            studioState.canvasSize = { width: w, height: h };
            canvas.style.width = w + 'px';
            canvas.style.height = h + 'px';
            canvas.style.aspectRatio = (w/h);
        });
    }

    // Adding Text
    const btnAddText = document.getElementById('btn-add-text');
    if (btnAddText) {
        btnAddText.addEventListener('click', () => {
            const color = quickColorInput ? quickColorInput.value : '#818cf8';
            addStudioLayer({
                type: 'text',
                name: 'New Text',
                content: 'Double click to edit',
                x: 50, y: 50,
                color: color,
                fontSize: 48
            });
        });
    }

    const shapeMap = {
        'star': 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        'triangle': 'polygon(50% 0%, 0% 100%, 100% 100%)',
        'hexagon': 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        'pentagon': 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        'diamond': 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        'arrow': 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
        'rhombus': 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        'parallelogram': 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
        'cross': 'polygon(33% 0%, 66% 0%, 66% 33%, 100% 33%, 100% 66%, 66% 66%, 66% 100%, 33% 100%, 33% 66%, 0% 66%, 0% 33%, 33% 33%)'
    };

    if (shapeTrigger && shapePalette) {
        shapeTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            shapePalette.classList.toggle('hidden');
        });

        document.querySelectorAll('.shape-opt').forEach(opt => {
            opt.addEventListener('click', () => {
                const type = opt.dataset.shape;
                const clipPath = shapeMap[type] || 'none';
                
                addStudioLayer({
                    type: 'shape',
                    shapeType: type,
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    x: 100, y: 100,
                    width: 150,
                    height: type === 'rect' ? 100 : 150,
                    color: '#818cf8',
                    clipPath: clipPath,
                    borderRadius: (type === 'circle' ? '50%' : (clipPath !== 'none' ? '0px' : '12px'))
                });
                shapePalette.classList.add('hidden');
            });
        });

        // Close logic moved to global listener below

        const aiShapeGo = document.getElementById('btn-ai-shape-go');
        const aiShapeInput = document.getElementById('ai-shape-prompt');

        if (aiShapeGo && aiShapeInput) {
            aiShapeGo.addEventListener('click', () => {
                const query = aiShapeInput.value.toLowerCase().trim();
                const clipPath = shapeMap[query] || '';
                
                if (clipPath) {
                    addStudioLayer({
                        type: 'shape',
                        shapeType: 'custom',
                        name: query.charAt(0).toUpperCase() + query.slice(1),
                        x: 150, y: 150,
                        width: 150, height: 150,
                        color: '#f43f5e',
                        clipPath: clipPath,
                        borderRadius: '0px'
                    });
                    aiShapeInput.value = '';
                    shapePalette.classList.add('hidden');
                } else {
                    alert("Shape not recognized. Try 'star', 'hexagon', 'triangle', 'diamond', etc.");
                }
            });
        }
    }

    // Asset Upload
    if (studioUpload) {
        studioUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (f) => {
                    addStudioLayer({
                        type: 'image',
                        name: 'Uploaded Image',
                        src: f.target.result,
                        x: 0, y: 0,
                        width: 400
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function addStudioLayer(layer) {
        studioState.layers.push(layer);
        const index = studioState.layers.length - 1;
        
        const el = document.createElement('div');
        el.className = 'canvas-element draggable';
        el.style.left = layer.x + 'px';
        el.style.top = layer.y + 'px';
        if (layer.width) el.style.width = layer.width + 'px';
        if (layer.height) el.style.height = layer.height + 'px';
        el.dataset.index = index;
        el.style.zIndex = 100 + index; // Ensure stacking order
        
        if (layer.type === 'text') {
            el.innerHTML = `<span style="font-size: ${layer.fontSize}px; color: ${layer.color}">${layer.content}</span>`;
        } else if (layer.type === 'shape') {
            el.innerHTML = `<div class="canvas-shape" style="width: ${layer.width}px; height: ${layer.height}px; background-color: ${layer.color}; border-radius: ${layer.borderRadius}; clip-path: ${layer.clipPath || 'none'}"></div>`;
        } else {
            el.innerHTML = `<img src="${layer.src}" style="width: ${layer.width}px">`;
        }
        
        el.addEventListener('mousedown', initDrag);
        canvas.appendChild(el);
        
        // Remove placeholder if present
        const ph = canvas.querySelector('.canvas-placeholder');
        if (ph) ph.remove();
        
        updateStudioUI();
    }

    function initDrag(e) {
        const el = e.currentTarget;
        let startX = e.clientX;
        let startY = e.clientY;
        let origX = parseInt(el.style.left);
        let origY = parseInt(el.style.top);

        function doDrag(moveE) {
            el.style.left = (origX + (moveE.clientX - startX)) + 'px';
            el.style.top = (origY + (moveE.clientY - startY)) + 'px';
        }

        function stopDrag() {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            const index = parseInt(el.dataset.index);
            studioState.layers[index].x = parseInt(el.style.left);
            studioState.layers[index].y = parseInt(el.style.top);
            selectStudioLayer(index); // Auto-select on drag end
        }

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    window.selectStudioLayer = (index) => {
        studioState.selectedLayer = index;
        
        // Highlight in canvas
        document.querySelectorAll('.canvas-element').forEach(el => el.classList.remove('selected'));
        const canvasEl = canvas.querySelector(`.canvas-element[data-index="${index}"]`);
        if (canvasEl) canvasEl.classList.add('selected');

        renderLayers();
        
        const layer = studioState.layers[index];
        propsContent.innerHTML = `
            <div class="prop-group">
                <label>Layer Name</label>
                <input type="text" value="${layer.name}" onchange="updateLayerProp(${index}, 'name', this.value)">
            </div>
            ${layer.type === 'text' ? `
                <div class="prop-group">
                    <label>Text Content</label>
                    <input type="text" value="${layer.content}" oninput="updateLayerProp(${index}, 'content', this.value)">
                </div>
                <div class="prop-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="prop-group">
                        <label>Font Size</label>
                        <input type="number" value="${layer.fontSize}" min="10" max="200" oninput="updateLayerProp(${index}, 'fontSize', this.value)">
                    </div>
                    <div class="prop-group">
                        <label>Color</label>
                        <input type="color" value="${layer.color}" oninput="updateLayerProp(${index}, 'color', this.value)">
                    </div>
                </div>
                <!-- Magic Integration -->
                <div class="prop-group" style="display: flex; gap: 8px;">
                    <button class="tool-btn magic-btn-sm" onclick="generateStudioTitles(${index})" style="flex: 1;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Magic Titles
                    </button>
                    <button class="tool-btn magic-btn-sm" onclick="applyStudioSmartStyle(${index})" title="Smart Style" style="width: 40px;">
                        <i class="fa-solid fa-palette"></i>
                    </button>
                </div>
            ` : (layer.type === 'shape' ? `
                <div class="prop-group">
                    <label>Color</label>
                    <input type="color" value="${layer.color}" oninput="updateLayerProp(${index}, 'color', this.value)">
                </div>
                <div class="prop-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="prop-group">
                        <label>Width</label>
                        <input type="number" value="${layer.width}" oninput="updateLayerProp(${index}, 'width', this.value)">
                    </div>
                    <div class="prop-group">
                        <label>Height</label>
                        <input type="number" value="${layer.height}" oninput="updateLayerProp(${index}, 'height', this.value)">
                    </div>
                </div>
            ` : `
                <div class="prop-group">
                    <label>Image Width (px)</label>
                    <input type="number" value="${layer.width}" min="20" max="2000" oninput="updateLayerProp(${index}, 'width', this.value)">
                </div>
                </div>
            `)}
            <button class="delete-btn-sm" onclick="deleteStudioLayer(${index})">
                <i class="fa-solid fa-trash"></i> Delete Layer
            </button>
        `;
    }

    window.updateLayerProp = (index, prop, val) => {
        studioState.layers[index][prop] = val;
        const el = canvas.querySelector(`.canvas-element[data-index="${index}"]`);
        if (!el) return;

        if (prop === 'content') {
            if (el.querySelector('span')) el.querySelector('span').textContent = val;
            studioState.layers[index].name = val.substring(0, 15); // Update name to match content
            renderLayers();
        } else if (prop === 'fontSize') {
            if (el.querySelector('span')) el.querySelector('span').style.fontSize = val + 'px';
        } else if (prop === 'color') {
            if (el.querySelector('span')) el.querySelector('span').style.color = val;
            if (el.querySelector('.canvas-shape')) el.querySelector('.canvas-shape').style.backgroundColor = val;
        } else if (prop === 'width') {
            if (el.querySelector('img')) el.querySelector('img').style.width = val + 'px';
            if (el.querySelector('.canvas-shape')) el.querySelector('.canvas-shape').style.width = val + 'px';
        } else if (prop === 'height') {
            if (el.querySelector('.canvas-shape')) el.querySelector('.canvas-shape').style.height = val + 'px';
        }
    }

    window.deleteStudioLayer = (index) => {
        if (!confirm('Delete this layer?')) return;
        studioState.layers.splice(index, 1);
        studioState.selectedLayer = null;
        
        // Refresh canvas elements completely to maintain indices
        canvas.innerHTML = '';
        if (studioState.layers.length === 0) {
            canvas.innerHTML = '<div class="canvas-placeholder"><i class="fa-solid fa-expand"></i><p>Interactive Canvas Ready</p></div>';
        } else {
            const oldLayers = [...studioState.layers];
            studioState.layers = [];
            oldLayers.forEach(l => addStudioLayer(l));
        }
        
        propsContent.innerHTML = '<div class="empty-props">Select a layer to edit properties.</div>';
        updateStudioUI();
    }

    // 13. Template Selection Logic
    const useTemplateBtns = document.querySelectorAll('.use-template-btn');
    useTemplateBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.template-card');
            const category = card.dataset.category;
            const title = card.querySelector('h3').innerText;
            
            // Auto-fill form
            topicInput.value = `Professional ${title}`;
            
            // Trigger niche selection
            const themeInput = document.getElementById('theme');
            if (themeInput) {
                const options = themeInput.closest('.custom-select').querySelectorAll('.select-option');
                
                options.forEach(opt => {
                    if (opt.innerText.toLowerCase().includes(category.toLowerCase())) {
                        opt.click();
                    }
                });
            }

            showView('generator');
            updateActiveLinks(document.getElementById('nav-create') || document.getElementById('side-create'));
            form.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // 2. Custom Select Logic
    const customSelects = document.querySelectorAll('.custom-select');
    customSelects.forEach(select => {
        const trigger = select.querySelector('.select-trigger');
        const options = select.querySelectorAll('.select-option');
        const hiddenInput = select.querySelector('input[type="hidden"]');
        const label = trigger.querySelector('span');

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customSelects.forEach(s => { if (s !== select) s.classList.remove('open'); });
            select.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', () => {
                const val = option.getAttribute('data-val');
                const text = option.innerText;
                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                label.innerText = text;
                hiddenInput.value = val;
                select.classList.remove('open');
                hiddenInput.dispatchEvent(new Event('change'));
            });
        });
    });

    document.addEventListener('click', () => {
        customSelects.forEach(s => s.classList.remove('open'));
    });

    // 2. Chip Logic (Include Elements)
    const chips = document.querySelectorAll('.chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            const val = chip.getAttribute('data-val');
            const checkbox = document.getElementById(`elem-${val}`);
            if (checkbox) {
                checkbox.checked = chip.classList.contains('active');
            }
        });
    });

    // 3. Toggle Buttons (AI vs Manual, Image vs Text)
    const toggleGroups = document.querySelectorAll('.toggle-group');
    toggleGroups.forEach(group => {
        const btns = group.querySelectorAll('.toggle-btn');
        const input = group.querySelector('input[type="hidden"]');
        
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.getAttribute('data-val');
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                input.value = val;
                
                // Conditional Visibility
                if (input.id === 'content-mode') {
                    const manualGroup = document.getElementById('manual-content-group');
                    if (val === 'manual') manualGroup.classList.remove('hidden');
                    else manualGroup.classList.add('hidden');
                }
                
                if (input.id === 'bg-mode') {
                    const bgPromptGroup = document.getElementById('bg-prompt-group');
                    if (val === 'image') bgPromptGroup.classList.remove('hidden');
                    else bgPromptGroup.classList.add('hidden');
                }
                
                input.dispatchEvent(new Event('change'));
            });
        });
    });

    // 4. Mode Switching
    const modeTabs = document.querySelectorAll('.mode-tab');
    const platformGroup = document.getElementById('platform-group');
    const ratioGroup = document.getElementById('ratio-group');
    const carouselOptions = document.getElementById('carousel-options');

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

    // 5. Theme Toggle Logic
    // Handled globally at the top of the file

    // Initial Icon Sync
    window.setTheme(localStorage.getItem('thumbify-theme') || 'dark');

    // 6. Number of Slides Slider
    const numSlidesSlider = document.getElementById('num-slides');
    const numSlidesValLabel = document.getElementById('num-slides-val');
    if (numSlidesSlider && numSlidesValLabel) {
        numSlidesSlider.addEventListener('input', (e) => {
            numSlidesValLabel.textContent = e.target.value;
        });
    }

    // 7. File Upload (Logo)
    const logoInput = document.getElementById('logo');
    const fileNameSpan = document.getElementById('file-name');
    const fileUploadBox = document.querySelector('.file-upload');

    const handleFile = (file) => {
        if (file) {
            fileNameSpan.textContent = file.name;
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            logoInput.files = dataTransfer.files;
        } else {
            fileNameSpan.textContent = 'Choose Logo';
            logoInput.value = '';
        }
    };

    logoInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        fileUploadBox.addEventListener(name, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    fileUploadBox.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));

    // 8. Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = genModeInput.value;
        const topic = topicInput.value.trim();
        if (!topic) return;

        // Collect Logo
        let logoBase64 = null;
        if (logoInput.files && logoInput.files[0]) {
            logoBase64 = await new Promise((res) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result);
                reader.readAsDataURL(logoInput.files[0]);
            });
        }

        // Credit Check
        const cost = mode === 'carousel' ? 25 : 10;
        if (appState.creditsLeft < cost) {
            alert('Insufficient credits! Please upgrade your plan to continue generating thumbnails.');
            return;
        }

        // Prepare UI
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Processing...</span>';
        resultArea.classList.add('hidden');
        if (carouselResultArea) carouselResultArea.classList.add('hidden');
        loadingState.classList.remove('hidden');

        try {
            const endpoint = mode === 'carousel' ? '/api/generate_carousel' : '/api/generate_concept';
            let payload = {
                topic,
                theme: document.getElementById('theme').value,
                audience: document.getElementById('audience').value,
                logoBase64
            };

            if (mode === 'carousel') {
                payload = {
                    ...payload,
                    aspectRatio: document.getElementById('aspect-ratio').value,
                    numSlides: parseInt(numSlidesSlider.value),
                    contentMode: document.getElementById('content-mode').value,
                    manualText: document.getElementById('manual-text').value,
                    bgMode: document.getElementById('bg-mode').value,
                    bgCustomPrompt: document.getElementById('bg-custom-prompt').value
                };
            } else {
                payload.platform = document.getElementById('platform').value;
                // Add Visual Style Preset
                payload.visualStyle = document.getElementById('bg-mode').value;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Generation failed');
            }
            const data = await response.json();

            if (mode === 'single') renderSingleResult(data, topic);
            else renderCarouselResult(data, topic, payload.aspectRatio);

            // Increment Stats on Success
            appState.projectCount++;
            appState.creditsLeft -= cost;
            
            // Add to Recent Projects
            const previewImg = mode === 'single' ? data.generated_image_base64 : data.slides[0]?.generated_image_base64;
            appState.recentProjects.unshift({
                id: Date.now(),
                title: topic,
                date: 'Just now',
                img: previewImg || ''
            });

            updateDashboardStats();

        } catch (error) {
            console.error(error);
            alert(error.message || 'Something went wrong. Please try again.');
        } finally {
            loadingState.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span>Generate Concept</span><i class="fa-solid fa-bolt"></i>';
        }
    });

    // 9. Results Rendering
    function renderSingleResult(data, topic) {
        document.getElementById('visual-concept').textContent = data.visual_concept;
        document.getElementById('main-subject').textContent = data.main_subject;
        document.getElementById('text-overlay').textContent = data.text_overlay;
        document.getElementById('image-prompt').textContent = data.image_prompt;
        
        const paletteContainer = document.getElementById('color-palette');
        paletteContainer.innerHTML = '';
        if (data.color_palette) {
            data.color_palette.forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = color;
                swatch.title = color;
                paletteContainer.appendChild(swatch);
            });
        }

        const imgContainer = document.getElementById('image-container');
        const img = document.getElementById('generated-image');
        const exportTrigger = document.getElementById('btn-single-export-trigger');
        if (data.generated_image_base64) {
            img.src = data.generated_image_base64;
            imgContainer.classList.remove('hidden');
            exportTrigger.classList.remove('hidden');
            
            // Set up download actions
            document.getElementById('btn-single-download-png').onclick = () => {
                downloadImage(data.generated_image_base64, `thumbify_${topic.replace(/\s+/g, '_')}.png`);
                document.getElementById('single-export-palette').classList.add('hidden');
            };
            
            document.getElementById('btn-single-download-pdf').onclick = () => {
                exportSingleThumbnailAsPDF(data.generated_image_base64, topic);
                document.getElementById('single-export-palette').classList.add('hidden');
            };
        } else {
            imgContainer.classList.add('hidden');
            exportTrigger.classList.add('hidden');
        }

        resultArea.classList.remove('hidden');
    }

    function renderCarouselResult(data, topic, ratio) {
        document.getElementById('consistency-note').textContent = data.visual_consistency_note || '';
        
        // Initialize State
        carouselState.slides = data.slides;
        carouselState.topic = topic;
        carouselState.aspectRatio = ratio;
        carouselState.history = [];
        carouselState.historyIndex = -1;
        
        saveCarouselHistory();
        renderCarousel();
        const resultArea = document.getElementById('carousel-result-area');
        if (resultArea) resultArea.classList.remove('hidden');
    }

    function downloadImage(base64, name) {
        const a = document.createElement('a');
        a.href = base64;
        a.download = name;
        a.click();

        // Increment Download Count
        appState.downloadCount++;
        updateDashboardStats();
    }

    // Magic Studio Actions

    window.generateStudioTitles = (index) => {
        const current = studioState.layers[index].content;
        const topic = prompt("Magic Titles: Enter topic for variations:", current);
        if (topic) {
            const variations = [
                `UNSTOPPABLE: ${topic}`,
                `How ${topic} Changed My Life`,
                `The Truth About ${topic} revealed`,
                `${topic}: Step-by-Step Guide`
            ];
            const choice = prompt(`Choose a variation to apply:\n1. ${variations[0]}\n2. ${variations[1]}\n3. ${variations[2]}\n4. ${variations[3]}`, "1");
            if (choice && variations[choice-1]) {
                updateLayerProp(index, 'content', variations[choice-1]);
                updateStudioUI();
            }
        }
    };

    window.applyStudioSmartStyle = (index) => {
        const styles = [
            { color: '#f43f5e', shadow: '0 0 20px rgba(244, 63, 94, 0.4)' },
            { color: '#818cf8', shadow: '0 0 20px rgba(129, 140, 248, 0.4)' },
            { color: '#10b981', shadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
            { color: '#f59e0b', shadow: '0 0 20px rgba(245, 158, 11, 0.4)' }
        ];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        updateLayerProp(index, 'color', randomStyle.color);
        const el = canvas.querySelector(`.canvas-element[data-index="${index}"]`);
        if (el) el.style.boxShadow = randomStyle.shadow;
        alert('AI Applied a "Vibrant" aesthetic style to your layer!');
        updateStudioUI();
    };

    // 10. Carousel Management Engine
    const slidesContainer = document.getElementById('slides-container');
    const undoBtn = document.getElementById('btn-carousel-undo');
    const redoBtn = document.getElementById('btn-carousel-redo');
    const addBtn = document.getElementById('btn-carousel-add');
    const countLabel = document.getElementById('current-slide-total');

    function saveCarouselHistory() {
        if (carouselState.historyIndex < carouselState.history.length - 1) {
            carouselState.history = carouselState.history.slice(0, carouselState.historyIndex + 1);
        }
        carouselState.history.push(JSON.parse(JSON.stringify(carouselState.slides)));
        if (carouselState.history.length > 20) carouselState.history.shift();
        else carouselState.historyIndex++;
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        if (!undoBtn || !redoBtn) return;
        undoBtn.disabled = carouselState.historyIndex <= 0;
        redoBtn.disabled = carouselState.historyIndex >= carouselState.history.length - 1;
        if (countLabel) countLabel.textContent = carouselState.slides.length;
    }

    window.undoCarousel = () => {
        if (carouselState.historyIndex > 0) {
            carouselState.historyIndex--;
            carouselState.slides = JSON.parse(JSON.stringify(carouselState.history[carouselState.historyIndex]));
            renderCarousel();
            updateHistoryButtons();
        }
    };

    window.redoCarousel = () => {
        if (carouselState.historyIndex < carouselState.history.length - 1) {
            carouselState.historyIndex++;
            carouselState.slides = JSON.parse(JSON.stringify(carouselState.history[carouselState.historyIndex]));
            renderCarousel();
            updateHistoryButtons();
        }
    };

    window.addCarouselSlide = () => {
        const newSlide = {
            slide_number: carouselState.slides.length + 1,
            heading: "New Slide Topic",
            subtext: "Add your descriptions here...",
            generated_image_base64: carouselState.slides[0]?.generated_image_base64 || "",
            bgColor: '#1e293b',
            textColor: '#ffffff',
            fontSize: 24,
            fontWeight: '600',
            textAlign: 'center'
        };
        carouselState.slides.push(newSlide);
        saveCarouselHistory();
        renderCarousel();
    };

    window.duplicateCarouselSlide = (index) => {
        const copy = JSON.parse(JSON.stringify(carouselState.slides[index]));
        carouselState.slides.splice(index + 1, 0, copy);
        saveCarouselHistory();
        renderCarousel();
    };

    window.deleteCarouselSlide = (index) => {
        if (carouselState.slides.length <= 1) {
            alert("Carousel must have at least one slide.");
            return;
        }
        carouselState.slides.splice(index, 1);
        saveCarouselHistory();
        renderCarousel();
    };

    function renderCarousel() {
        if (!slidesContainer) return;
        slidesContainer.innerHTML = '';
        carouselState.slides.forEach((slide, index) => {
            const card = document.createElement('div');
            card.className = 'slide-card glass-card';
            card.draggable = true;
            card.dataset.index = index;
            
            // Set styles
            card.style.backgroundColor = slide.bgColor || '#1e293b';
            card.style.color = slide.textColor || '#ffffff';
            
            const ratioClass = `ratio-${carouselState.aspectRatio.replace(':', '-')}`;
            card.innerHTML = `
                <div class="slide-editor-toolbar">
                    <div class="editor-group">
                        <input type="color" value="${slide.bgColor || '#1e293b'}" title="Background Color" class="editor-input-sm" onchange="updateSlideStyle(${index}, 'bgColor', this.value)">
                        <input type="color" value="${slide.textColor || '#ffffff'}" title="Text Color" class="editor-input-sm" onchange="updateSlideStyle(${index}, 'textColor', this.value)">
                    </div>
                    <div class="editor-group">
                        <select class="editor-select-sm" onchange="updateSlideStyle(${index}, 'fontSize', this.value)">
                            <option value="18" ${slide.fontSize == 18 ? 'selected' : ''}>18px</option>
                            <option value="24" ${slide.fontSize == 24 ? 'selected' : ''}>24px</option>
                            <option value="32" ${slide.fontSize == 32 ? 'selected' : ''}>32px</option>
                            <option value="48" ${slide.fontSize == 48 ? 'selected' : ''}>48px</option>
                        </select>
                        <button class="editor-btn-sm ${slide.fontWeight === '800' ? 'active' : ''}" onclick="updateSlideStyle(${index}, 'fontWeight', this.classList.contains('active') ? '400' : '800')" title="Bold"><i class="fa-solid fa-bold"></i></button>
                    </div>
                    <div class="editor-group">
                        <button class="editor-btn-sm" onclick="updateSlideStyle(${index}, 'textAlign', 'left')" title="Align Left"><i class="fa-solid fa-align-left"></i></button>
                        <button class="editor-btn-sm" onclick="updateSlideStyle(${index}, 'textAlign', 'center')" title="Align Center"><i class="fa-solid fa-align-center"></i></button>
                        <button class="editor-btn-sm" onclick="updateSlideStyle(${index}, 'textAlign', 'right')" title="Align Right"><i class="fa-solid fa-align-right"></i></button>
                    </div>
                    <div class="editor-group">
                        <button class="editor-btn-sm" onclick="magicGenerateSlide(${index}, false)" title="Magic Text (Keep Image)"><i class="fa-solid fa-wand-sparkles"></i></button>
                        <button class="editor-btn-sm" onclick="magicGenerateSlide(${index}, true)" title="Magic Full (Text + Image)"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
                        <button class="editor-btn-sm" onclick="uploadSlideImage(${index})" title="Upload Image"><i class="fa-solid fa-image"></i></button>
                        <button class="editor-btn-sm" onclick="toggleGlobalStyle(${index})" title="Apply to All slides"><i class="fa-solid fa-earth-americas"></i></button>
                    </div>
                </div>
                <div class="slide-card-actions">
                    <button class="action-btn-circle duplicate" onclick="duplicateCarouselSlide(${index})"><i class="fa-solid fa-copy"></i></button>
                    <button class="action-btn-circle delete" onclick="deleteCarouselSlide(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="slide-img-container ${ratioClass}">
                    <div class="slide-info" style="text-align: ${slide.textAlign || 'center'}">
                        <h4 class="slide-heading" contenteditable="true" style="font-size: ${slide.fontSize || 24}px; font-weight: ${slide.fontWeight || '600'}" onblur="updateSlideText(${index}, 'heading', this.innerText)">${slide.heading}</h4>
                        <p class="slide-subtext" contenteditable="true" onblur="updateSlideText(${index}, 'subtext', this.innerText)">${slide.subtext}</p>
                    </div>
                    ${slide.generated_image_base64 ? `<img src="${slide.generated_image_base64}" class="slide-img">` : '<div class="error-msg">Image missing</div>'}
                </div>
                <div class="slide-actions">
                    <button class="icon-btn-sm" onclick="downloadImage('${slide.generated_image_base64}', 'slide_${index + 1}.png')">
                        <i class="fa-solid fa-download"></i> Save
                    </button>
                </div>
            `;
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('drop', handleDrop);
            card.addEventListener('dragend', handleDragEnd);
            slidesContainer.appendChild(card);
        });
    }

    window.updateSlideStyle = (index, prop, val) => {
        carouselState.slides[index][prop] = val;
        saveCarouselHistory();
        renderCarousel();
    };

    window.toggleGlobalStyle = (index) => {
        const source = carouselState.slides[index];
        const props = ['bgColor', 'textColor', 'fontSize', 'fontWeight', 'textAlign'];
        if (confirm("Apply this slide's style to all slides in the carousel?")) {
            carouselState.slides.forEach(slide => {
                props.forEach(p => slide[p] = source[p]);
            });
            saveCarouselHistory();
            renderCarousel();
        }
    };

    window.uploadSlideImage = (index) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (f) => {
                    carouselState.slides[index].generated_image_base64 = f.target.result;
                    saveCarouselHistory();
                    renderCarousel();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    window.magicGenerateSlide = async (index, genImage = true) => {
        const slide = carouselState.slides[index];
        const topic = carouselState.topic || document.getElementById('topic')?.value || "Thumbnail Design";
        const card = document.querySelector(`.slide-card[data-index="${index}"]`);
        
        if (card) card.classList.add('processing');
        
        try {
            const response = await fetch('/api/generate_slide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    slideNumber: index + 1,
                    theme: document.getElementById('theme')?.value || 'Aesthetic',
                    aspectRatio: carouselState.aspectRatio,
                    logoBase64: window.logoBase64 || null,
                    genImage: genImage,
                    currentImage: slide.generated_image_base64
                })
            });
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            
            carouselState.slides[index].heading = data.heading;
            carouselState.slides[index].subtext = data.subtext;
            if (genImage) {
                carouselState.slides[index].generated_image_base64 = data.generated_image_base64;
            }
            
            saveCarouselHistory();
            renderCarousel();
            
        } catch (error) {
            console.error('Magic Slide Error:', error);
            // alert(`Magic Error: ${error.message}`);
        } finally {
            if (card) card.classList.remove('processing');
        }
    };

    window.updateSlideText = (index, field, val) => {
        if (carouselState.slides[index][field] !== val) {
            carouselState.slides[index][field] = val;
            saveCarouselHistory();
        }
    };


    let dragSrcIndex = null;
    function handleDragStart(e) { 
        dragSrcIndex = parseInt(this.dataset.index); 
        this.classList.add('dragging'); 
        e.dataTransfer.effectAllowed = 'move'; 
    }
    function handleDragOver(e) { e.preventDefault(); return false; }
    function handleDrop(e) {
        e.stopPropagation();
        const targetIndex = parseInt(this.dataset.index);
        if (dragSrcIndex !== targetIndex) {
            const slide = carouselState.slides.splice(dragSrcIndex, 1)[0];
            carouselState.slides.splice(targetIndex, 0, slide);
            saveCarouselHistory();
            renderCarousel();
        }
        return false;
    }
    function handleDragEnd() { this.classList.remove('dragging'); }

    if (undoBtn) undoBtn.onclick = undoCarousel;
    if (redoBtn) redoBtn.onclick = redoCarousel;
    if (addBtn) addBtn.onclick = addCarouselSlide;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undoCarousel(); }
        if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redoCarousel(); }
    });

    // 12. Data Tools (Bulk Import/Export)
    const dataImportInput = document.getElementById('data-import-input');
    const studioDataTrigger = document.getElementById('btn-studio-data-trigger');
    const studioDataPalette = document.getElementById('studio-data-palette');
    const carouselDataTrigger = document.getElementById('btn-carousel-data-trigger');
    const carouselDataPalette = document.getElementById('carousel-data-palette');

    if (studioDataTrigger && studioDataPalette) {
        studioDataTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            studioDataPalette.classList.toggle('hidden');
        });
    }

    if (carouselDataTrigger && carouselDataPalette) {
        carouselDataTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            carouselDataPalette.classList.toggle('hidden');
        });
    }

    // Close logic moved to global listener below

    window.triggerCSVImport = () => {
        if (dataImportInput) dataImportInput.click();
    };

    window.handleDataImport = (input) => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            let data = [];

            try {
                if (file.name.endsWith('.json')) {
                    data = JSON.parse(content);
                } else {
                    // Simple CSV Parser (Heading | Subtext OR Heading, Subtext)
                    const lines = content.split('\n');
                    lines.forEach(line => {
                        if (!line.trim()) return;
                        let parts = line.split('|');
                        if (parts.length < 2) parts = line.split(',');
                        
                        if (parts.length >= 2) {
                            data.push({
                                heading: parts[0].trim(),
                                subtext: parts[1].trim()
                            });
                        } else if (parts.length === 1) {
                            data.push({
                                heading: parts[0].trim(),
                                subtext: ''
                            });
                        }
                    });
                }

                if (data.length > 0) {
                    if (confirm(`Found ${data.length} records. Import and create slides?`)) {
                        bulkCreateCarouselSlides(data);
                    }
                } else {
                    alert("No valid data found in file. Use format: Heading | Subtext");
                }
            } catch (err) {
                console.error(err);
                alert("Error parsing file. Please check the format.");
            }
            input.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    window.bulkCreateCarouselSlides = (data) => {
        data.forEach((item, i) => {
            const newSlide = {
                slide_number: carouselState.slides.length + 1,
                heading: item.heading || "New Slide",
                subtext: item.subtext || "Enter description...",
                generated_image_base64: carouselState.slides[0]?.generated_image_base64 || "",
                bgColor: carouselState.slides[0]?.bgColor || '#1e293b',
                textColor: carouselState.slides[0]?.textColor || '#ffffff',
                fontSize: carouselState.slides[0]?.fontSize || 24,
                fontWeight: carouselState.slides[0]?.fontWeight || '600',
                textAlign: carouselState.slides[0]?.textAlign || 'center'
            };
            carouselState.slides.push(newSlide);
        });
        saveCarouselHistory();
        renderCarousel();
        alert(`Successfully imported ${data.length} slides! You can now use "Magic Full" on each to generate AI visuals.`);
    };

    window.exportCarouselCSV = () => {
        if (carouselState.slides.length === 0) {
            alert("No slides to export.");
            return;
        }

        let csvContent = "Heading,Subtext\n";
        carouselState.slides.forEach(slide => {
            const heading = slide.heading || "";
            const subtext = slide.subtext || "";
            const row = `"${heading.replace(/"/g, '""')}","${subtext.replace(/"/g, '""')}"`;
            csvContent += row + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `carousel_data_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.clearAllSlides = () => {
        if (confirm("Are you sure you want to CLEAR ALL slides? This action cannot be undone.")) {
            carouselState.slides = [];
            saveCarouselHistory();
            renderCarousel();
        }
    };

    // Advanced Studio Specific Data Tools
    window.triggerStudioImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (reE) => {
                try {
                    const layers = JSON.parse(reE.target.result);
                    if (Array.isArray(layers)) {
                        if (confirm(`Import ${layers.length} layers? This will clear current stage.`)) {
                            studioState.layers = layers;
                            canvas.innerHTML = '';
                            studioState.layers.forEach((l, i) => addStudioLayer(l));
                            updateStudioUI();
                        }
                    }
                } catch (err) { alert("Invalid JSON format."); }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    window.exportStudioLayers = () => {
        if (studioState.layers.length === 0) {
            alert("No layers to export.");
            return;
        }
        const data = JSON.stringify(studioState.layers, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `thumbify_studio_layers_${Date.now()}.json`;
        link.click();
    };

    window.clearStudioCanvas = () => {
        if (confirm("Clear all layers from the stage?")) {
            studioState.layers = [];
            studioState.selectedLayer = null;
            canvas.innerHTML = '<div class="canvas-placeholder"><i class="fa-solid fa-expand"></i><p>Interactive Canvas Ready</p></div>';
            propsContent.innerHTML = '<div class="empty-props">Select a layer to edit properties.</div>';
            updateStudioUI();
        }
    };

    // 13. Export Options (PNG/PDF Bundle)
    const studioExportTrigger = document.getElementById('btn-studio-export-trigger');
    const studioExportPalette = document.getElementById('studio-export-palette');
    const carouselExportTrigger = document.getElementById('btn-carousel-export-trigger');
    const carouselExportPalette = document.getElementById('carousel-export-palette');
    const singleExportTrigger = document.getElementById('btn-single-export-trigger');
    const singleExportPalette = document.getElementById('single-export-palette');

    if (studioExportTrigger && studioExportPalette) {
        studioExportTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            studioExportPalette.classList.toggle('hidden');
        });
    }

    if (carouselExportTrigger && carouselExportPalette) {
        carouselExportTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            carouselExportPalette.classList.toggle('hidden');
        });
    }

    if (singleExportTrigger && singleExportPalette) {
        singleExportTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            singleExportPalette.classList.toggle('hidden');
        });
    }

    // Unified Global Palette Closing Logic
    document.addEventListener('click', (e) => {
        const palettes = [
            { el: shapePalette, trigger: shapeTrigger },
            { el: studioDataPalette, trigger: studioDataTrigger },
            { el: carouselDataPalette, trigger: carouselDataTrigger },
            { el: studioExportPalette, trigger: studioExportTrigger },
            { el: carouselExportPalette, trigger: carouselExportTrigger },
            { el: singleExportPalette, trigger: singleExportTrigger }
        ];

        palettes.forEach(p => {
            if (p.el && p.trigger && !p.el.contains(e.target) && !p.trigger.contains(e.target)) {
                p.el.classList.add('hidden');
            }
        });
    });

    window.exportStudioElement = async (format) => {
        const canvasEl = document.getElementById('main-canvas');
        if (!canvasEl) return;

        // Visual Feedback
        const originalBtn = document.getElementById('btn-studio-export-trigger');
        const originalHtml = originalBtn.innerHTML;
        originalBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
        
        try {
            const canvas = await html2canvas(canvasEl, {
                useCORS: true,
                scale: 2, // Higher resolution
                backgroundColor: null
            });

            if (format === 'png') {
                const imgData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `thumbify_studio_${Date.now()}.png`;
                link.href = imgData;
                link.click();
            } else if (format === 'pdf') {
                const { jsPDF } = window.jspdf;
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'l' : 'p',
                    unit: 'px',
                    format: [canvas.width / 2, canvas.height / 2]
                });
                pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`thumbify_design_${Date.now()}.pdf`);
            }
        } catch (err) {
            console.error("Export failed:", err);
            alert("Export failed. Please try again.");
        } finally {
            originalBtn.innerHTML = originalHtml;
            if (studioExportPalette) studioExportPalette.classList.add('hidden');
        }
    };

    window.downloadAllCarouselSlides = () => {
        if (carouselState.slides.length === 0) {
            alert("No slides to download.");
            return;
        }

        if (confirm(`Download ${carouselState.slides.length} slides as individual PNGs?`)) {
            carouselState.slides.forEach((slide, index) => {
                setTimeout(() => {
                    downloadImage(slide.generated_image_base64, `slide_${index + 1}.png`);
                }, index * 300); // Small delay to prevent browser blocks
            });
        }
    };

    window.exportCarouselAsPDF = async () => {
        if (carouselState.slides.length === 0) {
            alert("No slides to export.");
            return;
        }

        const btn = document.getElementById('btn-carousel-export-trigger');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF...';

        try {
            const { jsPDF } = window.jspdf;
            let pdf = null;

            // Find all visible slide cards
            const cards = document.querySelectorAll('.slide-card');
            
            for (let i = 0; i < cards.length; i++) {
                const canvas = await html2canvas(cards[i], {
                    useCORS: true,
                    scale: 2,
                    backgroundColor: '#111827'
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.9);
                const width = canvas.width / 2;
                const height = canvas.height / 2;

                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: width > height ? 'l' : 'p',
                        unit: 'px',
                        format: [width, height]
                    });
                } else {
                    pdf.addPage([width, height], width > height ? 'l' : 'p');
                }

                pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
            }

            if (pdf) {
                pdf.save(`thumbify_carousel_${Date.now()}.pdf`);
            }
        } catch (err) {
            console.error("PDF Export failed:", err);
            alert("PDF Generation failed. Please try again.");
        } finally {
            btn.innerHTML = originalHtml;
            if (carouselExportPalette) carouselExportPalette.classList.add('hidden');
        }
    };

    window.exportSingleThumbnailAsPDF = async (base64, topic) => {
        const btn = document.getElementById('btn-single-export-trigger');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ...';

        try {
            const { jsPDF } = window.jspdf;
            
            // Create a temporary image to get dimensions
            const img = new Image();
            img.src = base64;
            
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const width = img.width;
            const height = img.height;

            const pdf = new jsPDF({
                orientation: width > height ? 'l' : 'p',
                unit: 'px',
                format: [width, height]
            });

            pdf.addImage(base64, 'JPEG', 0, 0, width, height);
            pdf.save(`thumbify_${topic.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
            
            // Increment Download Count
            appState.downloadCount++;
            updateDashboardStats();
        } catch (err) {
            console.error("Single PDF Export failed:", err);
            alert("PDF Generation failed. Please try again.");
        } finally {
            btn.innerHTML = originalHtml;
        }
    };
});

// Helper for inline copy
function copyText(id, btn) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(() => {
        const icon = btn.querySelector('i');
        icon.className = 'fa-solid fa-check';
        setTimeout(() => { icon.className = 'fa-regular fa-copy'; }, 2000);
    });
}
