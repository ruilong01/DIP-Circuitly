// ChatbotUI.js - Renders the floating chat window and handles interaction

window.ChatbotUI = {
    isOpen: false,
    container: null,
    messagesContainer: null,
    inputField: null,
    sendBtn: null,
    
    init: function() {
        // Prevent multiple initializations
        if (document.getElementById('chatbot-wrapper')) return;

        this.renderShell();
        this.bindEvents();
        
        // Add a welcoming message from the AI
        this.addMessage("Hello! I'm your AI Tutor. Let me know if you need help understanding a circuit concept or working through a problem.", 'bot');
    },

    /**
     * Renders the HTML shell for the floating button and the chat window
     */
    renderShell: function() {
        const wrapper = document.createElement('div');
        wrapper.id = 'chatbot-wrapper';
        
        // 1. Floating Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'chatbot-toggle';
        toggleBtn.className = 'btn btn-primary';
        toggleBtn.innerHTML = '&#129302;'; // Robot emoji
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.width = '60px';
        toggleBtn.style.height = '60px';
        toggleBtn.style.borderRadius = '30px';
        toggleBtn.style.fontSize = '24px';
        toggleBtn.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
        toggleBtn.style.zIndex = '1000';
        toggleBtn.style.display = 'flex';
        toggleBtn.style.alignItems = 'center';
        toggleBtn.style.justifyContent = 'center';
        
        // 2. Chat Window Container (Hidden by default)
        this.container = document.createElement('div');
        this.container.id = 'chatbot-container';
        this.container.className = 'card-glass';
        this.container.style.position = 'fixed';
        this.container.style.bottom = '90px';
        this.container.style.right = '20px';
        this.container.style.width = '350px';
        this.container.style.height = '500px';
        this.container.style.maxWidth = 'calc(100vw - 40px)'; // Mobile responsive
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.zIndex = '999';
        this.container.style.transform = 'translateY(20px)';
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
        this.container.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        this.container.style.overflow = 'hidden';

        // Header
        const header = document.createElement('div');
        header.style.padding = '15px 20px';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        header.style.background = 'rgba(59, 130, 246, 0.1)';
        header.innerHTML = '<h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">AI Tutor <span style="font-size: 0.8rem; color: var(--accent);">(Powered by Gemini)</span></h3>';
        this.container.appendChild(header);

        // Messages Area
        this.messagesContainer = document.createElement('div');
        this.messagesContainer.id = 'chatbot-messages';
        this.messagesContainer.style.flex = '1';
        this.messagesContainer.style.padding = '15px';
        this.messagesContainer.style.overflowY = 'auto';
        this.messagesContainer.style.display = 'flex';
        this.messagesContainer.style.flexDirection = 'column';
        this.messagesContainer.style.gap = '10px';
        this.container.appendChild(this.messagesContainer);

        // Input Area
        const inputArea = document.createElement('div');
        inputArea.style.padding = '15px';
        inputArea.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
        inputArea.style.display = 'flex';
        inputArea.style.gap = '8px';
        
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.placeholder = 'Ask a concept...';
        this.inputField.className = 'input-field';
        this.inputField.style.flex = '1';
        this.inputField.style.margin = '0';
        this.inputField.style.padding = '10px 15px';
        
        this.sendBtn = document.createElement('button');
        this.sendBtn.className = 'btn btn-primary';
        this.sendBtn.innerHTML = '&#10148;'; // Send icon
        this.sendBtn.style.padding = '0 20px';
        
        inputArea.appendChild(this.inputField);
        inputArea.appendChild(this.sendBtn);
        this.container.appendChild(inputArea);

        wrapper.appendChild(toggleBtn);
        wrapper.appendChild(this.container);
        document.body.appendChild(wrapper);
        
        this.toggleBtn = toggleBtn;
    },

    bindEvents: function() {
        // Toggle visibility
        this.toggleBtn.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.container.style.transform = 'translateY(0)';
                this.container.style.opacity = '1';
                this.container.style.pointerEvents = 'auto';
                this.toggleBtn.style.background = 'var(--error)';
                this.toggleBtn.innerHTML = '&times;';
                setTimeout(() => this.inputField.focus(), 300);
            } else {
                this.container.style.transform = 'translateY(20px)';
                this.container.style.opacity = '0';
                this.container.style.pointerEvents = 'none';
                this.toggleBtn.style.background = 'var(--primary)';
                this.toggleBtn.innerHTML = '&#129302;';
            }
        });

        // Send message on Enter key
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSend();
            }
        });

        // Send message on button click
        this.sendBtn.addEventListener('click', () => {
            this.handleSend();
        });

        // Close when clicking outside the panel (but not on the toggle button)
        document.addEventListener('click', (e) => {
            if (!this.isOpen) return;
            const wrapper = document.getElementById('chatbot-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                this.isOpen = false;
                this.container.style.transform = 'translateY(20px)';
                this.container.style.opacity = '0';
                this.container.style.pointerEvents = 'none';
                this.toggleBtn.style.background = 'var(--primary)';
                this.toggleBtn.innerHTML = '&#129302;';
            }
        });
    },

    handleSend: async function() {
        const text = this.inputField.value.trim();
        if (!text) return;

        // 1. Show user message
        this.addMessage(text, 'user');
        this.inputField.value = '';
        
        // 2. Show loading indicator
        const loadingId = this.addLoadingIndicator();
        
        // 3. Prevent multiple sends
        this.inputField.disabled = true;
        this.sendBtn.disabled = true;

        // 4. Call Gemini
        if (window.GeminiService) {
            const response = await window.GeminiService.sendMessage(text);
            this.removeMessage(loadingId);
            this.addMessage(response, 'bot');
        } else {
            this.removeMessage(loadingId);
            this.addMessage("Error: GeminiService is not loaded.", 'bot');
        }

        // 5. Re-enable input
        this.inputField.disabled = false;
        this.sendBtn.disabled = false;
        this.inputField.focus();
    },

    addMessage: function(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.padding = '10px 14px';
        msgDiv.style.borderRadius = '14px';
        msgDiv.style.fontSize = '0.9rem';
        msgDiv.style.wordWrap = 'break-word';
        
        // 1. Escape HTML first to prevent injection and accidental tag cutting (e.g. "< 5V")
        let escapedText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        // 2. Handle triple backtick code blocks
        let parsedText = escapedText.replace(/```([\s\S]*?)```/g, '<pre style="background:rgba(0,0,0,0.3); padding:10px; border-radius:4px; overflow-x:auto; margin:10px 0; font-family:monospace; line-height:1.2;"><code>$1</code></pre>');

        // 3. Handle bold/italic
        parsedText = parsedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        parsedText = parsedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 4. Handle line breaks
        parsedText = parsedText.replace(/\n/g, '<br>');

        msgDiv.innerHTML = parsedText;

        if (sender === 'user') {
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.style.background = 'rgba(59, 130, 246, 0.8)';
            msgDiv.style.color = 'white';
            msgDiv.style.borderBottomRightRadius = '4px';
        } else {
            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.background = 'rgba(255, 255, 255, 0.1)';
            msgDiv.style.color = 'var(--text-main)';
            msgDiv.style.borderBottomLeftRadius = '4px';
            msgDiv.style.border = '1px solid rgba(255,255,255,0.05)';
        }

        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
        
        // Typeset math if any
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([msgDiv]).catch(e => console.warn(e));
        }
        
        return msgDiv;
    },

    addLoadingIndicator: function() {
        const id = 'loading-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = id;
        msgDiv.style.alignSelf = 'flex-start';
        msgDiv.style.background = 'rgba(255, 255, 255, 0.05)';
        msgDiv.style.padding = '10px 14px';
        msgDiv.style.borderRadius = '14px';
        msgDiv.style.borderBottomLeftRadius = '4px';
        
        // Simple 3-dot typing animation
        msgDiv.innerHTML = `
            <div class="typing-indicator" style="display: flex; gap: 4px; align-items: center; height: 16px;">
                <span class="dot" style="width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: blink 1.4s infinite .2s;"></span>
                <span class="dot" style="width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: blink 1.4s infinite .4s;"></span>
                <span class="dot" style="width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: blink 1.4s infinite .6s;"></span>
            </div>
            <style>
                @keyframes blink { 0% { opacity: 0.2; } 20% { opacity: 1; } 100% { opacity: 0.2; } }
            </style>
        `;
        
        this.messagesContainer.appendChild(msgDiv);
        this.scrollToBottom();
        return id;
    },

    removeMessage: function(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    },

    scrollToBottom: function() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
};
