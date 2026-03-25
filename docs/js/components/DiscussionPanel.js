window.DiscussionPanel = function ({ onBack }) {
    const container = document.createElement('div');
    container.className = 'dashboard-container animate-fade-in';
    container.style.maxWidth = '800px';
    container.style.margin = '0 auto';
    container.style.padding = '20px';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Back';
    backBtn.onclick = onBack;
    
    const title = document.createElement('h2');
    title.textContent = 'Discussion Panel';
    title.className = 'text-gradient';
    title.style.margin = '0';

    const newPostBtn = document.createElement('button');
    newPostBtn.className = 'btn btn-primary';
    newPostBtn.textContent = '+ New Post';

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(newPostBtn);
    container.appendChild(header);

    const feedContainer = document.createElement('div');
    feedContainer.style.display = 'flex';
    feedContainer.style.flexDirection = 'column';
    feedContainer.style.gap = '16px';
    container.appendChild(feedContainer);

    const loadPosts = async () => {
        feedContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted)">Loading discussions...</div>';
        try {
            const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/discussions`);
            const data = await res.json();
            if (data.success) {
                feedContainer.innerHTML = '';
                if (data.discussions.length === 0) {
                    feedContainer.innerHTML = '<div style="text-align:center; color:var(--text-muted)">No discussions yet. Be the first to post!</div>';
                }
                data.discussions.forEach(post => {
                    const card = document.createElement('div');
                    card.className = 'card-glass';
                    card.style.padding = '20px';
                    card.style.textAlign = 'left';

                    const meta = document.createElement('div');
                    meta.style.fontSize = '0.85rem';
                    meta.style.color = 'var(--text-muted)';
                    meta.style.marginBottom = '12px';
                    meta.style.display = 'flex';
                    meta.style.justifyContent = 'space-between';
                    
                    const timeAgo = new Date(post.timestamp).toLocaleString();
                    meta.innerHTML = `<span><strong>${post.name}</strong> ${post.role === 'admin' ? '<span style="color:var(--accent); font-size:0.75rem;">[ADMIN]</span>' : ''}</span> <span>${timeAgo}</span>`;
                    
                    const content = document.createElement('div');
                    content.style.color = 'var(--text-main)';
                    content.style.lineHeight = '1.6';
                    content.style.marginBottom = '12px';
                    content.style.whiteSpace = 'pre-wrap';
                    content.textContent = post.content;

                    card.appendChild(meta);
                    card.appendChild(content);

                    if (post.imageData) {
                        const img = document.createElement('img');
                        img.src = post.imageData;
                        img.style.maxWidth = '100%';
                        img.style.maxHeight = '400px';
                        img.style.borderRadius = '8px';
                        img.style.marginTop = '10px';
                        img.style.cursor = 'pointer';
                        img.onclick = () => window.open(post.imageData, '_blank');
                        card.appendChild(img);
                    }

                    feedContainer.appendChild(card);
                });
            }
        } catch (e) {
            feedContainer.innerHTML = '<div style="color:var(--error); text-align:center;">Failed to load discussions.</div>';
        }
    };

    newPostBtn.onclick = () => {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; justify-content:center; align-items:center; padding:20px;';
        
        const card = document.createElement('div');
        card.className = 'card-glass animate-pop';
        card.style.cssText = 'max-width: 500px; width: 100%; padding: 30px; position: relative; display:flex; flex-direction:column; gap:16px;';
        
        card.innerHTML = `
            <h3 style="margin:0; color:var(--text-main);">Create New Post</h3>
            <textarea id="post-content" placeholder="Describe the issue or ask a question..." style="width:100%; height:120px; padding:12px; border-radius:8px; background:rgba(0,0,0,0.2); border:1px solid var(--surface-border); color:var(--text-main); font-family:inherit; resize:vertical;"></textarea>
            <div>
                <label style="font-size:0.85rem; color:var(--text-muted); display:block; margin-bottom:8px;">Attach Screenshot (Optional, max 5MB)</label>
                <input type="file" id="post-image" accept="image/*" style="font-size:0.85rem; color:var(--text-main); width:100%;">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
                <button id="post-cancel" class="btn btn-secondary">Cancel</button>
                <button id="post-submit" class="btn btn-primary">Post</button>
            </div>
        `;
        
        modal.appendChild(card);
        document.body.appendChild(modal);

        let imageData = null;

        card.querySelector('#post-image').onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                alert("File is too large. Max 5MB.");
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                imageData = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        card.querySelector('#post-cancel').onclick = () => modal.remove();
        
        card.querySelector('#post-submit').onclick = async () => {
            const content = card.querySelector('#post-content').value.trim();
            if (!content) {
                alert("Please enter some content.");
                return;
            }
            
            const btn = card.querySelector('#post-submit');
            btn.disabled = true;
            btn.textContent = 'Posting...';

            const activeProfile = window.ProfileService.getActiveProfile();
            if (!activeProfile) {
                alert("You must be logged in to post.");
                modal.remove();
                return;
            }

            try {
                const res = await fetch(`${window.CONFIG.API_BASE_URL}/api/discussions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: activeProfile.studentId,
                        content: content,
                        imageData: imageData
                    })
                });
                const data = await res.json();
                if (data.success) {
                    modal.remove();
                    loadPosts();
                } else {
                    alert(data.error || 'Failed to post.');
                    btn.disabled = false;
                    btn.textContent = 'Post';
                }
            } catch (e) {
                alert("Network error.");
                btn.disabled = false;
                btn.textContent = 'Post';
            }
        };
    };

    loadPosts();

    return container;
};
