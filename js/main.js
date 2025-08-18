import { familyData as initialFamilyData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let familyData = JSON.parse(JSON.stringify(initialFamilyData));
    let currentViewMembers = [];
    let scale = 1;

    // --- DOM ELEMENT REFERENCES ---
    const appOverlay = document.getElementById('app-overlay');
    const treeLayout = document.getElementById('tree-layout');
    const memberCardTemplate = document.getElementById('member-card-template');
    const connectionsSVG = document.getElementById('tree-connections');
    const canvas = document.getElementById('main-canvas');
    const treeContainer = document.getElementById('tree-container');
    const searchInput = document.getElementById('search-member');
    const memberDatalist = document.getElementById('member-names');
    const sideFilter = document.getElementById('side-filter');
    const levelFilter = document.getElementById('level-filter');
    const annotationsContainer = document.getElementById('connection-annotations');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const memberIdInput = document.getElementById('memberId');
    const modalAvatarPreview = document.getElementById('modal-avatar-preview');
    const modalAvatarImg = document.getElementById('modal-avatar-img');
    const modalAvatarInitials = document.getElementById('modal-avatar-initials');
    const avatarUploadInput = document.getElementById('avatarUpload');
    const tagsInputContainer = document.getElementById('tags-input-container');
    const newTagInput = document.getElementById('newTagInput');
    const emptyStateMessage = document.getElementById('empty-state-message');
    
    // --- UTILITY FUNCTIONS ---
    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        return names.length > 1 ? names[0][0] + names[names.length - 1][0] : name[0] || '';
    };

    const tagColors = {
        default: '#4299e1', Military: '#ed8936', Artist: '#9f7aea', Entrepreneur: '#38b2ac', 
        Education: '#48bb78', Healthcare: '#f56565', Craftsman: '#8b4513', Tech: '#3182ce',
    };

    const getTagColor = (tag) => tagColors[tag] || tagColors.default;

    const showToast = (message) => {
        const toast = document.getElementById('toast');
        if(!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    };

    // --- INITIALIZATION ---
    function init() {
        addEventListeners();
        createFloatingLeaves();
        applyFilters(); // Use applyFilters for the initial render
    }

    // --- EVENT LISTENERS ---
    function addEventListeners() {
        const controlsBar = document.getElementById('controls-bar');
        
        // Sidebar Toggle Buttons
        document.getElementById('toggle-controls-btn').addEventListener('click', () => {
            controlsBar.classList.add('is-open');
        });
        document.getElementById('close-controls-btn').addEventListener('click', () => {
            controlsBar.classList.remove('is-open');
        });

        // Top Bar & Global Controls
        searchInput.addEventListener('change', handleSearch);
        sideFilter.addEventListener('change', applyFilters);
        levelFilter.addEventListener('change', applyFilters);
        document.getElementById('globalResetBtn').addEventListener('click', () => { resetView(); resetAllFilters(); });
        document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
        emptyStateMessage.addEventListener('click', () => openEditModal());
        document.getElementById('toggle-lines').addEventListener('change', (e) => {
            document.body.classList.toggle('hide-connections', !e.target.checked);
        });
        document.getElementById('toggle-roles').addEventListener('change', (e) => {
            document.body.classList.toggle('hide-roles', !e.target.checked);
        });
        document.getElementById('toggle-annotations').addEventListener('change', (e) => {
            document.body.classList.toggle('hide-annotations', !e.target.checked);
        });

        // Relationship Manager in Sidebar
        document.getElementById('relationship-form-sidebar').addEventListener('submit', handleRelationshipForm);

        // Zoom, Pan, Fullscreen
        document.getElementById('zoomInBtn').addEventListener('click', () => updateZoom(0.1));
        document.getElementById('zoomOutBtn').addEventListener('click', () => updateZoom(-0.1));
        document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
        addPanControls();

        // Member Edit Modal
        editModal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('modal-save-btn').addEventListener('click', saveMember);
        editModal.addEventListener('click', (e) => e.target === editModal && closeModal());
        document.getElementById('trigger-upload-btn').addEventListener('click', () => avatarUploadInput.click());
        modalAvatarPreview.addEventListener('click', () => avatarUploadInput.click());
        avatarUploadInput.addEventListener('change', handleAvatarUpload);
        newTagInput.addEventListener('keydown', handleTagInput);

        // Relationship Edit Modal
        document.getElementById('relationship-modal-save-btn').addEventListener('click', saveRelationship);
        document.getElementById('relationship-modal-cancel-btn').addEventListener('click', closeRelationshipModal);
        document.getElementById('delete-relationship-btn').addEventListener('click', deleteRelationship);
        document.querySelector('#relationship-modal .modal-close-btn').addEventListener('click', closeRelationshipModal);

        // Export Buttons
        document.getElementById('exportPngBtn').addEventListener('click', exportPng);
        document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
        document.getElementById('exportSvgBtn').addEventListener('click', exportSvg);
        document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
    }

    function createFloatingLeaves() {
        const leavesContainer = document.getElementById('leaves-container');
        if (!leavesContainer) return;
        for (let i = 0; i < 15; i++) {
            const leaf = document.createElement('div');
            leaf.className = 'leaf';
            leaf.style.left = `${Math.random() * 100}vw`;
            leaf.style.animationDuration = `${5 + Math.random() * 10}s`;
            leaf.style.animationDelay = `${Math.random() * 5}s`;
            leaf.style.opacity = Math.random();
            leavesContainer.appendChild(leaf);
        }
    }
    
    function populateSearchDatalist() {
        memberDatalist.innerHTML = '';
        familyData.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.name;
            memberDatalist.appendChild(option);
        });
    }
    
    // --- CORE LOGIC: FILTERING, FOCUSING, CLEARING ---
    function clearAllData() {
        if (confirm("Are you sure you want to clear all family data? This action cannot be undone.")) {
            familyData.members = [];
            familyData.connections = [];
            applyFilters();
            showToast("All data has been cleared.");
        }
    }

    function handleSearch(e) {
        const member = familyData.members.find(m => m.name.toLowerCase() === e.target.value.toLowerCase());
        if (member) {
            focusOnMember(member.id);
        }
    }

    function focusOnMember(memberId) {
        const focusedMember = familyData.members.find(m => m.id === memberId);
        if (!focusedMember) return;
        let visibleMemberIds = new Set([memberId]);
        familyData.connections.forEach(c => {
            if (c.members.includes(memberId)) {
                c.members.forEach(id => visibleMemberIds.add(id));
            }
        });
        currentViewMembers = familyData.members.filter(m => visibleMemberIds.has(m.id));
        renderTree(currentViewMembers);
        showToast(`Focusing on ${focusedMember.name}'s immediate family.`);
    }

    function applyFilters() {
        const side = sideFilter.value;
        const level = levelFilter.value;
        currentViewMembers = familyData.members.filter(member => 
            (side === 'all' || member.side === side || member.side === 'ego') &&
            (level === 'all' || member.generation == level)
        );
        renderTree(currentViewMembers);
        populateRelationshipManager();
    }
    
    function resetAllFilters() {
        sideFilter.value = 'all';
        levelFilter.value = 'all';
        searchInput.value = '';
        applyFilters();
        showToast("Filters reset.");
    }
    
    // --- RENDERING ENGINE ---
    function renderTree(membersToRender) {
        if (!membersToRender || membersToRender.length === 0) {
            treeLayout.innerHTML = '';
            connectionsSVG.innerHTML = '';
            annotationsContainer.innerHTML = '';
            emptyStateMessage.style.display = 'block';
            return;
        }
        
        emptyStateMessage.style.display = 'none';
        treeLayout.innerHTML = '';
        const generations = [...new Set(membersToRender.map(m => m.generation))].sort((a,b) => a - b);

        generations.forEach(genLevel => {
            const generationDiv = document.createElement('div');
            generationDiv.className = 'generation';
            membersToRender.filter(m => m.generation === genLevel).forEach(member => {
                const card = memberCardTemplate.content.cloneNode(true).firstElementChild;
                card.dataset.id = member.id;
                card.querySelector('.member-name').textContent = member.name;
                card.querySelector('.member-relationship').textContent = member.relationship;
                
                let birthDetails = member.birthDate ? new Date(member.birthDate).toLocaleDateString() : 'N/A';
                if (member.deathDate) birthDetails += ` - ${new Date(member.deathDate).toLocaleDateString()}`;
                card.querySelector('.birth-details').textContent = birthDetails;

                const avatarImg = card.querySelector('.avatar-img');
                const avatarInitials = card.querySelector('.avatar-initials');
                if (member.avatar) {
                    avatarImg.src = member.avatar;
                    avatarImg.style.display = 'block';
                    avatarInitials.style.display = 'none';
                } else {
                    avatarInitials.textContent = getInitials(member.name);
                    avatarImg.src = '';
                    avatarImg.style.display = 'none';
                    avatarInitials.style.display = 'flex';
                }

                const tagsContainer = card.querySelector('.member-tags');
                tagsContainer.innerHTML = '';
                (member.tags || []).forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'tag';
                    tagEl.textContent = tag;
                    tagEl.style.backgroundColor = getTagColor(tag);
                    tagsContainer.appendChild(tagEl);
                });
                
                card.querySelector('.edit-button').addEventListener('click', (e) => { e.stopPropagation(); openEditModal(member.id); });
                card.addEventListener('dblclick', () => openEditModal(member.id));
                generationDiv.appendChild(card);
            });
            treeLayout.appendChild(generationDiv);
        });
        setTimeout(drawConnections, 50);
    }
    
    function drawConnections() {
        connectionsSVG.innerHTML = '';
        annotationsContainer.innerHTML = '';
        const visibleMemberIds = new Set(currentViewMembers.map(m => m.id));

        familyData.connections.forEach(conn => {
            if (!conn.members.every(id => visibleMemberIds.has(id))) return;
            const [fromId, toId] = conn.members;
            const fromCard = document.querySelector(`.member-card[data-id='${fromId}']`);
            const toCard = document.querySelector(`.member-card[data-id='${toId}']`);
            if (!fromCard || !toCard) return;

            const fromRect = fromCard.getBoundingClientRect();
            const toRect = toCard.getBoundingClientRect();
            const containerRect = treeContainer.getBoundingClientRect();
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let d = '', midX, midY;

            if (conn.type === 'Spouse') {
                const fromY = (fromRect.top + fromRect.bottom) / 2 - containerRect.top;
                const toY = (toRect.top + toRect.bottom) / 2 - containerRect.top;
                const fromX = fromRect.right - containerRect.left;
                const toX = toRect.left - containerRect.left;
                d = `M ${fromX} ${fromY} C ${fromX + 30} ${fromY}, ${toX - 30} ${toY}, ${toX} ${toY}`;
                [midX, midY] = [(fromX + toX) / 2, fromY];
                path.classList.add(conn.status === 'Divorced' ? 'spouse-divorced' : 'spouse-married');
            } else if (conn.type === 'Parent-Child') {
                const pRect = fromCard.getBoundingClientRect();
                const cRect = toCard.getBoundingClientRect();
                const fromX = (pRect.left + pRect.right) / 2 - containerRect.left;
                const fromY = pRect.bottom - containerRect.top;
                const toX = (cRect.left + cRect.right) / 2 - containerRect.left;
                const toY = cRect.top - containerRect.top;
                const ctrlY = fromY + (toY - fromY) / 2;
                d = `M ${fromX} ${fromY} C ${fromX} ${ctrlY}, ${toX} ${ctrlY}, ${toX} ${toY}`;
                [midX, midY] = [(fromX + toX) / 2, ctrlY];
                path.classList.add('parent-child');
            } else if (conn.type === 'Sibling') {
                const fromY = fromRect.top - containerRect.top;
                const toY = toRect.top - containerRect.top;
                const fromX = (fromRect.left + fromRect.right) / 2 - containerRect.left;
                const toX = (toRect.left + toRect.right) / 2 - containerRect.left;
                d = `M ${fromX} ${fromY} C ${fromX} ${fromY - 40}, ${toX} ${toY - 40}, ${toX} ${toY}`;
                [midX, midY] = [(fromX + toX) / 2, fromY - 30];
                path.classList.add('sibling');
            }

            path.setAttribute('d', d);
            connectionsSVG.appendChild(path);

            const icon = document.createElement('div');
            icon.className = 'annotation-icon';
            icon.dataset.id = conn.id;
            icon.innerHTML = `<i class="fa-solid ${conn.annotation ? 'fa-info' : 'fa-plus'}"></i><div class="annotation-tooltip">${conn.annotation || 'Click to edit'}</div>`;
            icon.style.left = `${midX}px`;
            icon.style.top = `${midY}px`;
            icon.addEventListener('click', (e) => { e.stopPropagation(); openRelationshipModal(e.currentTarget.dataset.id); });
            annotationsContainer.appendChild(icon);
        });
    }

    // --- MODAL & EDITING LOGIC ---
    function openEditModal(id = null) {
        editForm.reset();
        tagsInputContainer.querySelectorAll('.tag-item').forEach(t => t.remove());
        
        if (id) {
            const member = familyData.members.find(m => m.id === id);
            if (!member) return;
            editModal.querySelector('#modal-title').textContent = 'Edit Family Member';
            memberIdInput.value = member.id;
            Object.keys(member).forEach(key => {
                const input = editForm.querySelector(`#${key}`);
                if (input) input.value = member[key] || '';
            });
            (member.tags || []).forEach(createTagElement);
            if(member.avatar) {
                modalAvatarImg.src = member.avatar;
                modalAvatarImg.style.display = 'block';
                modalAvatarInitials.style.display = 'none';
            } else {
                 modalAvatarInitials.textContent = getInitials(member.name);
                 modalAvatarImg.src = '';
                 modalAvatarImg.style.display = 'none';
                 modalAvatarInitials.style.display = 'flex';
            }
        } else {
            editModal.querySelector('#modal-title').textContent = 'Add New Family Member';
            memberIdInput.value = '';
            modalAvatarInitials.textContent = '?';
            modalAvatarImg.src = '';
            modalAvatarImg.style.display = 'none';
            modalAvatarInitials.style.display = 'flex';
        }
        editModal.classList.add('visible');
    }

    function closeModal() { editModal.classList.remove('visible'); }

    function saveMember() {
        const id = parseInt(memberIdInput.value);
        if (id) {
            const member = familyData.members.find(m => m.id === id);
            Object.assign(member, {
                name: document.getElementById('name').value,
                relationship: document.getElementById('relationship').value,
                birthDate: document.getElementById('birthDate').value,
                deathDate: document.getElementById('deathDate').value,
                description: document.getElementById('description').value,
                avatar: (modalAvatarImg.src.startsWith('data:') || modalAvatarImg.src.startsWith('http')) ? modalAvatarImg.src : member.avatar,
                tags: Array.from(tagsInputContainer.querySelectorAll('.tag-item span')).map(t => t.textContent)
            });
            showToast(`${member.name}'s details saved!`);
        } else {
            const newMember = {
                id: Date.now(),
                name: document.getElementById('name').value || 'New Member',
                relationship: document.getElementById('relationship').value || 'Person',
                birthDate: document.getElementById('birthDate').value,
                deathDate: document.getElementById('deathDate').value,
                description: document.getElementById('description').value,
                tags: Array.from(tagsInputContainer.querySelectorAll('.tag-item span')).map(t => t.textContent),
                avatar: (modalAvatarImg.src.startsWith('data:') || modalAvatarImg.src.startsWith('http')) ? modalAvatarImg.src : null,
                generation: 3, side: 'ego'
            };
            familyData.members.push(newMember);
            populateSearchDatalist();
            showToast(`${newMember.name} added to the tree!`);
        }
        closeModal();
        applyFilters();
    }
    
    function createTagElement(tag) {
        const tagEl = document.createElement('div');
        tagEl.className = 'tag-item';
        tagEl.style.backgroundColor = getTagColor(tag);
        tagEl.innerHTML = `<span>${tag}</span><button type="button" class="tag-remove-btn">&times;</button>`;
        tagEl.querySelector('.tag-remove-btn').addEventListener('click', () => tagEl.remove());
        tagsInputContainer.insertBefore(tagEl, newTagInput);
    }
    
    function handleTagInput(e) {
        if (e.key === 'Enter' && newTagInput.value.trim()) {
            e.preventDefault();
            createTagElement(newTagInput.value.trim());
            newTagInput.value = '';
        }
    }

    function handleAvatarUpload(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                modalAvatarImg.src = event.target.result;
                modalAvatarImg.style.display = 'block';
                modalAvatarInitials.style.display = 'none';
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function openRelationshipModal(connId = null) {
        const modal = document.getElementById('relationship-modal');
        const form = document.getElementById('relationship-form-modal');
        form.reset();
        
        const conn = familyData.connections.find(c => c.id === connId);
        if (!conn) return;

        document.getElementById('relationshipId').value = conn.id;
        document.getElementById('relationshipAnnotation').value = conn.annotation || '';
        document.getElementById('relationship-modal-title').textContent = "Edit Relationship Annotation";
        
        modal.classList.add('visible');
    }

    function closeRelationshipModal() { document.getElementById('relationship-modal').classList.remove('visible'); }

    function saveRelationship() {
        const id = document.getElementById('relationshipId').value;
        const annotation = document.getElementById('relationshipAnnotation').value;

        const conn = familyData.connections.find(c => c.id === id);
        if (conn) {
            conn.annotation = annotation;
        }
        
        applyFilters();
        closeRelationshipModal();
    }
    
    function deleteRelationship() {
        const id = document.getElementById('relationshipId').value;
        familyData.connections = familyData.connections.filter(c => c.id !== id);
        applyFilters();
        closeRelationshipModal();
    }

    // --- SIDEBAR RELATIONSHIP MANAGER ---
    function populateRelationshipManager() {
        const fromSelect = document.getElementById('rel-from');
        const toSelect = document.getElementById('rel-to');
        const listContainer = document.getElementById('existing-relationships-list');
        
        const options = familyData.members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;

        listContainer.innerHTML = '';
        familyData.connections.forEach(conn => {
            const fromMember = familyData.members.find(m => m.id === conn.members[0]);
            const toMember = familyData.members.find(m => m.id === conn.members[1]);
            if (!fromMember || !toMember) return;
            
            const item = document.createElement('div');
            item.className = 'relationship-item';
            let annotationHTML = conn.annotation ? `<div class="rel-annotation">'${conn.annotation}'</div>` : '';

            item.innerHTML = `
                <div>
                    <span><strong>${fromMember.name}</strong> &harr; <strong>${toMember.name}</strong><br><small>${conn.type}</small></span>
                    ${annotationHTML}
                </div>
                <div class="actions">
                    <button data-id="${conn.id}" class="edit-rel" title="Edit Annotation"><i class="fa-solid fa-pencil"></i></button>
                    <button data-id="${conn.id}" class="delete-rel" title="Delete Relationship"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            listContainer.appendChild(item);
        });
        
        listContainer.querySelectorAll('.edit-rel').forEach(b => b.addEventListener('click', (e) => openRelationshipModal(e.currentTarget.dataset.id)));
        listContainer.querySelectorAll('.delete-rel').forEach(b => b.addEventListener('click', (e) => {
            if (confirm('Are you sure you want to delete this relationship?')) {
                familyData.connections = familyData.connections.filter(c => c.id !== e.currentTarget.dataset.id);
                applyFilters();
            }
        }));
    }

    function handleRelationshipForm(e) {
        e.preventDefault();
        const fromId = parseInt(document.getElementById('rel-from').value);
        const toId = parseInt(document.getElementById('rel-to').value);
        const type = document.getElementById('rel-type').value;

        if (!fromId || !toId) return showToast("Please select two people.");
        if (fromId === toId) return showToast("Cannot link a person to themselves.");
        
        let members = [fromId, toId];
        if (type === 'Parent-Child') {
            const fromGen = familyData.members.find(m => m.id === fromId)?.generation ?? -1;
            const toGen = familyData.members.find(m => m.id === toId)?.generation ?? -1;
            if(fromGen > toGen) members = [toId, fromId];
            else if (fromGen === toGen) return showToast("Parents and children must be in different generations.");
        }
        
        familyData.connections.push({
            id: `c${Date.now()}`, members, type, 
            status: type === 'Spouse' ? 'Married' : type, 
            annotation: '',
            direct: type !== 'Spouse'
        });

        showToast("Relationship added!");
        applyFilters();
    }

    // --- UI CONTROLS: ZOOM, PAN, FULLSCREEN ---
    function updateZoom(amount) {
        scale = Math.max(0.2, Math.min(2, scale + amount));
        treeContainer.style.transform = `scale(${scale})`;
        zoomLevelDisplay.textContent = `${Math.round(scale * 100)}%`;
        setTimeout(drawConnections, 300);
    }
    
    function resetView() {
        scale = 1;
        treeContainer.style.transform = 'scale(1)';
        zoomLevelDisplay.textContent = '100%';
        canvas.scrollTop = 0; canvas.scrollLeft = 0;
        setTimeout(drawConnections, 300);
    }

    function toggleFullscreen() { !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen(); }
    
    function addPanControls() {
        let isPanning = false, startX, startY, scrollLeft, scrollTop;
        canvas.addEventListener('mousedown', (e) => {
            if (e.target !== canvas) return;
            isPanning = true;
            startX = e.pageX - canvas.offsetLeft; startY = e.pageY - canvas.offsetTop;
            scrollLeft = canvas.scrollLeft; scrollTop = canvas.scrollTop;
        });
        canvas.addEventListener('mouseleave', () => isPanning = false);
        canvas.addEventListener('mouseup', () => isPanning = false);
        canvas.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            e.preventDefault();
            const x = e.pageX - canvas.offsetLeft, y = e.pageY - canvas.offsetTop;
            canvas.scrollLeft = scrollLeft - (x - startX);
            canvas.scrollTop = scrollTop - (y - startY);
        });
    }

    // --- IMPORT / EXPORT FEATURES ---
    function captureTree(callback, format) {
        showToast(`Generating ${format.toUpperCase()}...`);
        const tempClass = 'is-exporting';
        treeContainer.classList.add(tempClass);
        drawConnections();
        
        setTimeout(() => {
            html2canvas(treeContainer, { backgroundColor: null, scale: 2 }).then(canvas => {
                callback(canvas);
                treeContainer.classList.remove(tempClass);
                drawConnections();
            });
        }, 100);
    }

    function exportPng() {
        captureTree(canvas => {
            const link = document.createElement('a');
            link.download = 'family-tree.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }, 'PNG');
    }

    function exportPdf() {
        captureTree(canvas => {
            const { jsPDF } = window.jspdf;
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('family-tree.pdf');
        }, 'PDF');
    }

    function exportSvg() {
        showToast('Generating SVG...');
        const treeNode = document.getElementById('tree-container');
        htmlToImage.toSvg(treeNode, {
            filter: (node) => node.tagName !== 'BUTTON'
        }).then((dataUrl) => {
            const link = document.createElement('a');
            link.download = 'family-tree.svg';
            link.href = dataUrl;
            link.click();
        });
    }

    function exportCsv() {
        showToast('Generating CSV...');
        const headers = ['id', 'name', 'relationship', 'birthDate', 'deathDate', 'generation', 'side', 'tags', 'description'];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + '\n';
        
        familyData.members.forEach(member => {
            const row = headers.map(header => {
                let value = member[header] || '';
                if (Array.isArray(value)) value = value.join('; ');
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });

        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'family-tree.csv');
        link.click();
    }

    // --- Let's get it started! ---
    init();
});