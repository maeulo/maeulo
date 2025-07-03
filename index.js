
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const inputRowsContainer = document.getElementById('input-rows');
    const addRowBtn = document.getElementById('add-row-btn');
    const chatContainer = document.getElementById('chat-container');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const userGeneratedStyles = document.getElementById('user-generated-styles');
    
    // Screenshot Overlay elements
    const screenshotOverlay = document.getElementById('screenshot-overlay');
    const screenshotContent = document.getElementById('screenshot-content');

    // --- Functions ---

    /**
     * Sanitizes a string for use in a regular expression.
     */
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    /**
     * Renders the chat bubbles in the live preview container based on all current inputs.
     * This is the core function for the live preview.
     */
    const renderLivePreview = () => {
        // --- Style Injection Logic ---
        const styleRegex = /<style>([\s\S]*?)<\/style>/gi;
        let collectedStyles = '';
        const allTextareas = inputRowsContainer.querySelectorAll('textarea');
        allTextareas.forEach(textarea => {
            const matches = textarea.value.matchAll(styleRegex);
            for (const match of matches) {
                collectedStyles += match[1] + '\n';
            }
        });
        userGeneratedStyles.textContent = collectedStyles;
        
        // --- Rendering Logic ---
        chatContainer.innerHTML = ''; // Clear previous content

        const uNameBefore = document.getElementById('user-name-before').value.trim();
        const uNameAfter = document.getElementById('user-name-after').value.trim();
        const cNameBefore = document.getElementById('char-name-before').value.trim();
        const cNameAfter = document.getElementById('char-name-after').value.trim();

        const rows = inputRowsContainer.querySelectorAll('.input-row');
        let hasContent = false;

        rows.forEach(row => {
            const imageDataUrl = row.dataset.imageDataUrl;
            const role = row.querySelector('.role-btn').dataset.role;
            const messageBubble = document.createElement('div');
            messageBubble.className = `message ${role}-bubble`;

            // If there's an image, render it and skip text processing for this row
            if (imageDataUrl) {
                hasContent = true;
                const img = document.createElement('img');
                img.src = imageDataUrl;
                img.alt = 'Uploaded chat image';
                messageBubble.appendChild(img);
                chatContainer.appendChild(messageBubble);
                return; // continue to next row
            }

            // --- Text processing logic (if no image) ---
            const textarea = row.querySelector('textarea');
            let text = textarea.value.replace(styleRegex, '');
            
            if (text.trim() === '') return;

            hasContent = true;

            // Apply name replacements
            if (uNameBefore && uNameAfter) text = text.replace(new RegExp(escapeRegExp(uNameBefore), 'g'), uNameAfter);
            if (cNameBefore && cNameAfter) text = text.replace(new RegExp(escapeRegExp(cNameBefore), 'g'), cNameAfter);
            
            // Parse text for quotes and create nodes to avoid rendering bugs
            const parts = text.split(/(“.*?”|‘.*?’|".*?"|'.*?'|\*.*?\*)/g);
            parts.forEach(part => {
                if (!part) return;
                if ((part.startsWith('“') && part.endsWith('”')) || (part.startsWith('"') && part.endsWith('"'))) {
                    const span = document.createElement('span');
                    span.className = 'quote-double';
                    span.textContent = part;
                    messageBubble.appendChild(span);
                } else if ((part.startsWith('‘') && part.endsWith('’')) || (part.startsWith("'") && part.endsWith("'"))) {
                    const span = document.createElement('span');
                    span.className = 'quote-single';
                    span.textContent = part;
                    messageBubble.appendChild(span);
                } else if (part.startsWith('*') && part.endsWith('*')) {
                    const span = document.createElement('span');
                    span.className = 'italic-asterisk';
                    span.textContent = part.slice(1, -1);
                    messageBubble.appendChild(span);
                } else {
                    messageBubble.appendChild(document.createTextNode(part));
                }
            });
            chatContainer.appendChild(messageBubble);
        });

        // Enable or disable the fullscreen button based on content
        fullscreenBtn.disabled = !hasContent;
    };

    /**
     * Adds a new input row for a chat message.
     */
    const addInputRow = () => {
        const row = document.createElement('div');
        row.className = 'input-row';

        // --- Role Button ---
        const roleBtn = document.createElement('button');
        roleBtn.className = 'btn role-btn character';
        roleBtn.textContent = '캐릭터';
        roleBtn.dataset.role = 'character';
        roleBtn.type = 'button';

        // --- Text Area ---
        const textarea = document.createElement('textarea');
        textarea.placeholder = '대화 내용을 입력하거나 이미지를 업로드하세요...';
        textarea.rows = 1;

        // --- Action Buttons (Delete, Upload) ---
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'input-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.type = 'button';

        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'btn upload-btn';
        uploadBtn.textContent = '이미지';
        uploadBtn.type = 'button';
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        // --- Event Listeners for the new row ---
        roleBtn.addEventListener('click', () => {
            if (roleBtn.dataset.role === 'character') {
                roleBtn.dataset.role = 'user';
                roleBtn.textContent = '유저';
                roleBtn.classList.replace('character', 'user');
            } else {
                roleBtn.dataset.role = 'character';
                roleBtn.textContent = '캐릭터';
                roleBtn.classList.replace('user', 'character');
            }
            renderLivePreview();
        });

        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
            // If user types, assume they don't want the image anymore
            if (row.classList.contains('has-image')) {
                row.classList.remove('has-image');
                delete row.dataset.imageDataUrl;
                uploadBtn.textContent = '이미지';
                uploadBtn.classList.remove('delete-btn');
                uploadBtn.classList.add('upload-btn');
                fileInput.value = '';
            }
            renderLivePreview();
        });
        
        deleteBtn.addEventListener('click', () => {
            const parent = row.parentElement;
            row.remove();
            if (parent.children.length === 0) {
                 addInputRow();
            }
            renderLivePreview();
        });

        uploadBtn.addEventListener('click', () => {
            if (row.classList.contains('has-image')) {
                // If it has an image, remove it
                row.classList.remove('has-image');
                delete row.dataset.imageDataUrl;
                uploadBtn.textContent = '이미지';
                uploadBtn.classList.remove('delete-btn'); // Revert style
                uploadBtn.classList.add('upload-btn');
                fileInput.value = ''; // Reset to allow re-upload of same file
                renderLivePreview();
            } else {
                // If no image, trigger file selection
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                row.dataset.imageDataUrl = event.target.result;
                row.classList.add('has-image');
                textarea.value = ''; // Clear textarea
                uploadBtn.textContent = '제거'; // Change button text to "Remove"
                uploadBtn.classList.remove('upload-btn');
                uploadBtn.classList.add('delete-btn'); // Make it red to indicate removal
                renderLivePreview();
            };
            reader.readAsDataURL(file);
        });

        // --- Assemble Row ---
        actionsContainer.appendChild(deleteBtn);
        actionsContainer.appendChild(uploadBtn);

        row.appendChild(roleBtn);
        row.appendChild(textarea);
        row.appendChild(fileInput); // hidden
        row.appendChild(actionsContainer);
        
        inputRowsContainer.appendChild(row);
        renderLivePreview();
    };
    
    // --- Initial Setup & Event Listeners ---

    document.querySelectorAll('.name-replacer-inputs input').forEach(input => {
        input.addEventListener('input', renderLivePreview);
    });
    
    const colorMap = {
        'char-color': '--char-bubble-bg',
        'user-color': '--user-bubble-bg',
        'bg-color': '--chat-bg',
        'base-font-color': '--base-font-color',
        'double-quote-color': '--double-quote-color',
        'single-quote-color': '--single-quote-color',
        'asterisk-color': '--asterisk-color',
    };
    
    Object.entries(colorMap).forEach(([id, variable]) => {
        const colorInput = document.getElementById(id);
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                document.documentElement.style.setProperty(variable, e.target.value);
            });
        }
    });

    addRowBtn.addEventListener('click', addInputRow);

    fullscreenBtn.addEventListener('click', () => {
        screenshotContent.innerHTML = chatContainer.innerHTML;
        screenshotOverlay.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
        screenshotOverlay.style.display = 'block';
    });
    
    screenshotOverlay.addEventListener('click', () => {
        screenshotOverlay.style.display = 'none';
    });

    addInputRow();
});
