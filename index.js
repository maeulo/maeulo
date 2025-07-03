
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
            const textarea = row.querySelector('textarea');
            // Strip style tags before processing text for rendering
            let text = textarea.value.replace(styleRegex, '');
            
            if (text.trim() === '') return;

            hasContent = true;

            // Apply name replacements
            if (uNameBefore && uNameAfter) text = text.replace(new RegExp(escapeRegExp(uNameBefore), 'g'), uNameAfter);
            if (cNameBefore && cNameAfter) text = text.replace(new RegExp(escapeRegExp(cNameBefore), 'g'), cNameAfter);

            const messageBubble = document.createElement('div');
            const role = row.querySelector('.role-btn').dataset.role;
            messageBubble.className = `message ${role}-bubble`;
            
            // Parse text for quotes and create nodes to avoid rendering bugs
            // Updated regex to include curly quotes (“”, ‘’) and asterisks for italics.
            const parts = text.split(/(“.*?”|‘.*?’|".*?"|'.*?'|\*.*?\*)/g);
            parts.forEach(part => {
                if (!part) return;
                // Check for both curly and straight double quotes
                if ((part.startsWith('“') && part.endsWith('”')) || (part.startsWith('"') && part.endsWith('"'))) {
                    const span = document.createElement('span');
                    span.className = 'quote-double';
                    span.textContent = part;
                    messageBubble.appendChild(span);
                // Check for both curly and straight single quotes
                } else if ((part.startsWith('‘') && part.endsWith('’')) || (part.startsWith("'") && part.endsWith("'"))) {
                    const span = document.createElement('span');
                    span.className = 'quote-single';
                    span.textContent = part;
                    messageBubble.appendChild(span);
                // Check for asterisks for italics
                } else if (part.startsWith('*') && part.endsWith('*')) {
                    const span = document.createElement('span');
                    span.className = 'italic-asterisk';
                    span.textContent = part.slice(1, -1); // Remove asterisks before rendering
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

        const roleBtn = document.createElement('button');
        roleBtn.className = 'btn role-btn character';
        roleBtn.textContent = '캐릭터';
        roleBtn.dataset.role = 'character';
        roleBtn.type = 'button';

        const textarea = document.createElement('textarea');
        textarea.placeholder = '대화 내용을 입력하세요...';
        textarea.rows = 1;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn delete-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.type = 'button';

        // Event listeners for the new row
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

        row.appendChild(roleBtn);
        row.appendChild(textarea);
        row.appendChild(deleteBtn);
        inputRowsContainer.appendChild(row);
        renderLivePreview();
    };
    
    // --- Initial Setup & Event Listeners ---

    // Listen to name replacer inputs to re-render the live preview
    document.querySelectorAll('.name-replacer-inputs input').forEach(input => {
        input.addEventListener('input', renderLivePreview);
    });
    
    // Set up color pickers to update CSS variables directly for real-time updates
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

    // Button listeners
    addRowBtn.addEventListener('click', addInputRow);

    fullscreenBtn.addEventListener('click', () => {
        // Copy the live preview content to the screenshot overlay
        screenshotContent.innerHTML = chatContainer.innerHTML;
        // Apply the current background color to the overlay
        screenshotOverlay.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-bg');
        // Show the overlay
        screenshotOverlay.style.display = 'block';
    });
    
    // Close overlay when it's clicked
    screenshotOverlay.addEventListener('click', () => {
        screenshotOverlay.style.display = 'none';
    });

    // Start with one empty row
    addInputRow();
});
