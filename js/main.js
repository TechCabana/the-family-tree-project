import { familyData as initialFamilyData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let familyData = JSON.parse(JSON.stringify(initialFamilyData));
    let currentViewMembers = [];
    let currentViewConnections = [];
    let scale = 1;

    // --- STATIC DATA FOR DROPDOWNS ---
    const relationshipRoles = ["Son", "Daughter", "Father", "Mother", "Grandfather", "Grandmother", "Great-Grandfather", "Great-Grandmother", "Step-Father", "Step-Mother"];
    const relationshipLinks = ["Parent-Child", "Spouse", "Partner", "Sibling"];
    const relationshipStatuses = ["Married", "Engaged", "Separated", "Divorced", "Single"];
    const linkStatuses = ["Married", "Divorced", "Partner", "Engaged", "Separated"];
    const relationshipTypes = ["Biological", "Adopted", "Step-Relationship"];

    // --- DOM ELEMENT REFERENCES ---
    const treeLayout = document.getElementById('tree-layout');
    const memberCardTemplate = document.getElementById('member-card-template');
    const connectionsSVG = document.getElementById('tree-connections');
    const canvas = document.getElementById('main-canvas');
    const treeContainer = document.getElementById('tree-container');
    const searchInput = document.getElementById('search-member');
    const memberDatalist = document.getElementById('member-names');
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
        populateStaticDropdowns();
        populateFilterDropdowns();
        applyFilters(); 
    }

    function populateFilterDropdowns() {
        document.getElementById('role-filter').innerHTML = '<option value="all">All Roles</option>' + relationshipRoles.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('link-filter').innerHTML = '<option value="all">All Links</option>' + relationshipLinks.map(l => `<option value="${l}">${l}</option>`).join('');
        document.getElementById('status-filter').innerHTML = '<option value="all">All Statuses</option>' + relationshipStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    
    function populateStaticDropdowns() {
        document.getElementById('relationship').innerHTML = relationshipRoles.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('status').innerHTML = relationshipStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('rel-from-role').innerHTML = relationshipRoles.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('rel-to-role').innerHTML = relationshipRoles.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('rel-link').innerHTML = relationshipLinks.map(l => `<option value="${l}">${l}</option>`).join('');
        document.getElementById('rel-type').innerHTML = relationshipTypes.map(t => `<option value="${t}">${t}</option>`).join('');
        document.getElementById('rel-status').innerHTML = linkStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // --- EVENT LISTENERS ---
    function addEventListeners() {
        const controlsBar = document.getElementById('controls-bar');
        
        document.getElementById('toggle-controls-btn').addEventListener('click', () => controlsBar.classList.add('is-open'));
        document.getElementById('close-controls-btn').addEventListener('click', () => controlsBar.classList.remove('is-open'));

        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', handleSearchInput);
        searchInput.addEventListener('change', handleSearchSelection); 

        document.getElementById('tag-filter').addEventListener('input', applyFilters);
        document.getElementById('role-filter').addEventListener('change', applyFilters);
        document.getElementById('link-filter').addEventListener('change', applyFilters);
        document.getElementById('status-filter').addEventListener('change', applyFilters);

        document.getElementById('globalResetBtn').addEventListener('click', () => { resetView(); resetAllFilters(); });
        document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
        emptyStateMessage.addEventListener('click', () => openEditModal());
        
        document.getElementById('toggle-links').addEventListener('change', (e) => document.body.classList.toggle('hide-connections', !e.target.checked));
        document.getElementById('toggle-roles').addEventListener('change', (e) => document.body.classList.toggle('hide-roles', !e.target.checked));
        document.getElementById('toggle-notes').addEventListener('change', () => drawConnections(currentViewConnections));

        document.getElementById('relationship-form-sidebar').addEventListener('submit', handleRelationshipForm);
        document.getElementById('search-relationships').addEventListener('input', handleRelationshipSearch);

        document.getElementById('zoomInBtn').addEventListener('click', () => updateZoom(0.1));
        document.getElementById('zoomOutBtn').addEventListener('click', () => updateZoom(-0.1));
        document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
        addPanControls();

        editModal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
        document.getElementById('modal-save-btn').addEventListener('click', saveMember);
        editModal.addEventListener('click', (e) => e.target === editModal && closeModal());
        document.getElementById('trigger-upload-btn').addEventListener('click', () => avatarUploadInput.click());
        modalAvatarPreview.addEventListener('click', () => avatarUploadInput.click());
        avatarUploadInput.addEventListener('change', handleAvatarUpload);
        newTagInput.addEventListener('keydown', handleTagInput);

        document.getElementById('relationship-modal-save-btn').addEventListener('click', saveRelationship);
        document.getElementById('relationship-modal-cancel-btn').addEventListener('click', closeRelationshipModal);
        document.getElementById('delete-relationship-btn').addEventListener('click', deleteRelationship);
        document.querySelector('#relationship-modal .modal-close-btn').addEventListener('click', closeRelationshipModal);

        document.getElementById('importJsonBtn').addEventListener('click', () => document.getElementById('json-file-input').click());
        document.getElementById('json-file-input').addEventListener('change', importJson);
        document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
        document.getElementById('exportPngBtn').addEventListener('click', exportPng);
        document.getElementById('exportPdfBtn').addEventListener('click', exportPdf);
        document.getElementById('exportSvgBtn').addEventListener('click', exportSvg);
        document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
        
        annotationsContainer.addEventListener('click', (e) => {
            const note = e.target.closest('.connection-note');
            if (note) {
                openRelationshipModal(note.dataset.id);
            }
        });

        document.querySelectorAll('.dropdown-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = button.closest('.dropdown');
                document.querySelectorAll('.dropdown.is-active').forEach(openDropdown => {
                    if (openDropdown !== dropdown) openDropdown.classList.remove('is-active');
                });
                dropdown.classList.toggle('is-active');
            });
        });

        const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const mobileNavClose = document.getElementById('mobile-nav-close');

        if(mobileNavToggle) {
            mobileNavToggle.addEventListener('click', () => mobileNavOverlay.classList.add('is-open'));
            mobileNavClose.addEventListener('click', () => mobileNavOverlay.classList.remove('is-open'));
        }

        window.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown.is-active').forEach(dropdown => {
                    dropdown.classList.remove('is-active');
                });
            }
            if (!e.target.closest('.search-container')) {
                document.getElementById('search-results').classList.remove('is-visible');
            }
        });
    }

    function createFloatingLeaves() {
        const leavesContainer = document.getElementById('leaves-container');
        if (!leavesContainer) return;
        leavesContainer.innerHTML = '';
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

    function handleSearchSelection(e) { 
        const member = familyData.members.find(m => m.name.toLowerCase() === e.target.value.toLowerCase());
        if (member) {
            focusOnMember(member.id);
            e.target.value = '';
            document.getElementById('search-results').classList.remove('is-visible');
        }
    }

    function handleSearchInput(e) {
        const query = e.target.value.toLowerCase();
        const resultsContainer = document.getElementById('search-results');
        
        if (query.length < 1) {
            resultsContainer.classList.remove('is-visible');
            return;
        }
        const filteredMembers = familyData.members.filter(member => 
            member.name.toLowerCase().includes(query)
        );
        renderSearchResults(filteredMembers);
    }
    
    function renderSearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';

        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="search-result-item">No results found</div>`;
        } else {
            results.forEach(member => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.dataset.id = member.id;
                item.innerHTML = `${member.name} <small>(${member.relationship || ''})</small>`;
                item.addEventListener('click', () => {
                    focusOnMember(member.id);
                    searchInput.value = '';
                    resultsContainer.classList.remove('is-visible');
                });
                resultsContainer.appendChild(item);
            });
        }
        resultsContainer.classList.add('is-visible');
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
        
        const membersToRender = familyData.members.filter(m => visibleMemberIds.has(m.id));
        const connectionsToRender = familyData.connections.filter(c => c.members.every(id => visibleMemberIds.has(id)));

        renderTree(membersToRender, connectionsToRender);
        showToast(`Focusing on ${focusedMember.name}'s immediate family.`);
    }

    function applyFilters() {
        const tagQuery = document.getElementById('tag-filter').value.toLowerCase();
        const roleQuery = document.getElementById('role-filter').value;
        const linkQuery = document.getElementById('link-filter').value;
        const statusQuery = document.getElementById('status-filter').value;

        let filteredMembers = familyData.members;

        if (tagQuery) {
            filteredMembers = filteredMembers.filter(m => m.tags && m.tags.some(tag => tag.toLowerCase().includes(tagQuery)));
        }
        if (roleQuery !== 'all') {
            filteredMembers = filteredMembers.filter(m => m.relationship === roleQuery);
        }
        if (statusQuery !== 'all') {
            filteredMembers = filteredMembers.filter(m => m.status === statusQuery);
        }
        
        const filteredMemberIds = new Set(filteredMembers.map(m => m.id));

        let filteredConnections = familyData.connections;
        if (linkQuery !== 'all') {
            filteredConnections = filteredConnections.filter(conn => conn.link === linkQuery);
        }

        currentViewConnections = filteredConnections.filter(conn => conn.members.every(id => filteredMemberIds.has(id)));
        currentViewMembers = filteredMembers;
        
        renderTree(currentViewMembers, currentViewConnections);
        populateRelationshipManager();
    }
    
    function resetAllFilters() {
        document.getElementById('tag-filter').value = '';
        document.getElementById('role-filter').value = 'all';
        document.getElementById('link-filter').value = 'all';
        document.getElementById('status-filter').value = 'all';
        searchInput.value = '';
        applyFilters();
        showToast("Filters reset.");
    }
    
    // --- RENDERING ENGINE ---
    function renderTree(membersToRender, connectionsToRender) {
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
                card.querySelector('.member-relationship').textContent = member.relationship || '';
                
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
        setTimeout(() => drawConnections(connectionsToRender), 50);
    }
    
    function drawConnections(connectionsToRender) {
        connectionsSVG.innerHTML = '';
        annotationsContainer.innerHTML = '';
        const showNotes = document.getElementById('toggle-notes').checked;

        (connectionsToRender || []).forEach(conn => {
            const [fromId, toId] = conn.members;
            const fromCard = document.querySelector(`.member-card[data-id='${fromId}']`);
            const toCard = document.querySelector(`.member-card[data-id='${toId}']`);
            if (!fromCard || !toCard) return;

            const fromRect = fromCard.getBoundingClientRect();
            const toRect = toCard.getBoundingClientRect();
            const containerRect = treeContainer.getBoundingClientRect();
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            let d = '', midX, midY;

            if (conn.link === 'Spouse' || conn.link === 'Partner') {
                let fromX, fromY, toX, toY;
                if (window.innerWidth <= 768) {
                    fromX = (fromRect.left + fromRect.right) / 2 - containerRect.left;
                    toX = (toRect.left + toRect.right) / 2 - containerRect.left;
                    fromY = fromRect.bottom - containerRect.top;
                    toY = toRect.top - containerRect.top;
                    d = `M ${fromX} ${fromY} L ${toX} ${toY}`;
                } else {
                    fromY = (fromRect.top + fromRect.bottom) / 2 - containerRect.top;
                    fromX = fromRect.right - containerRect.left;
                    toX = toRect.left - containerRect.left;
                    d = `M ${fromX} ${fromY} C ${fromX + 30} ${fromY}, ${toX - 30} ${fromY}, ${toX} ${fromY}`;
                }
                [midX, midY] = [(fromX + toX) / 2, (fromY + (toRect.top + toRect.bottom) / 2 - containerRect.top) / 2];
            } else if (conn.link === 'Parent-Child') {
                const pRect = fromCard.getBoundingClientRect();
                const cRect = toCard.getBoundingClientRect();
                const fromX = (pRect.left + pRect.right) / 2 - containerRect.left;
                const fromY = pRect.bottom - containerRect.top;
                const toX = (cRect.left + cRect.right) / 2 - containerRect.left;
                const toY = cRect.top - containerRect.top;
                const ctrlY = fromY + (toY - fromY) / 2;
                d = `M ${fromX} ${fromY} C ${fromX} ${ctrlY}, ${toX} ${ctrlY}, ${toX} ${toY}`;
                [midX, midY] = [(fromX + toX) / 2, ctrlY];
            } else if (conn.link === 'Sibling') {
                const fromY = fromRect.top - containerRect.top;
                const fromX = (fromRect.left + fromRect.right) / 2 - containerRect.left;
                const toX = (toRect.left + toRect.right) / 2 - containerRect.left;
                d = `M ${fromX} ${fromY} C ${fromX} ${fromY - 40}, ${toX} ${fromY - 40}, ${toX} ${fromY}`;
                [midX, midY] = [(fromX + toX) / 2, fromY - 30];
            }

            path.setAttribute('d', d);
            path.classList.add(conn.link);
            connectionsSVG.appendChild(path);
            
            if (showNotes && conn.note) {
                const noteText = document.createElement('div');
                noteText.className = 'connection-note';
                noteText.dataset.id = conn.id;
                noteText.textContent = conn.note;
                noteText.style.left = `${midX}px`;
                noteText.style.top = `${midY}px`;
                annotationsContainer.appendChild(noteText);
            }
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
                status: document.getElementById('status').value,
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
                status: document.getElementById('status').value,
                birthDate: document.getElementById('birthDate').value,
                deathDate: document.getElementById('deathDate').value,
                description: document.getElementById('description').value,
                tags: Array.from(tagsInputContainer.querySelectorAll('.tag-item span')).map(t => t.textContent),
                avatar: (modalAvatarImg.src.startsWith('data:') || modalAvatarImg.src.startsWith('http')) ? modalAvatarImg.src : null,
                generation: 3, side: 'ego'
            };
            familyData.members.push(newMember);
            populateSearchDatalist();
            populateFilterDropdowns();
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
        if (e.key === 'Enter' && e.target.value.trim()) {
            e.preventDefault();
            createTagElement(e.target.value.trim());
            e.target.value = '';
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
        const conn = familyData.connections.find(c => c.id === connId);
        if (!conn) return;

        document.getElementById('relationshipId').value = conn.id;
        document.getElementById('relationshipLinkModal').innerHTML = relationshipLinks.map(t => `<option value="${t}" ${conn.link === t ? 'selected' : ''}>${t}</option>`).join('');
        document.getElementById('relationshipTypeModal').innerHTML = relationshipTypes.map(t => `<option value="${t}" ${conn.type === t ? 'selected' : ''}>${t}</option>`).join('');
        document.getElementById('relationshipStatusModal').innerHTML = linkStatuses.map(s => `<option value="${s}" ${conn.status === s ? 'selected' : ''}>${s}</option>`).join('');
        document.getElementById('relationshipNoteModal').value = conn.note || '';
        
        modal.classList.add('visible');
    }

    function closeRelationshipModal() { document.getElementById('relationship-modal').classList.remove('visible'); }

    function saveRelationship() {
        const id = document.getElementById('relationshipId').value;
        const conn = familyData.connections.find(c => c.id === id);
        if (conn) {
            conn.type = document.getElementById('relationshipTypeModal').value;
            conn.status = document.getElementById('relationshipStatusModal').value;
            conn.note = document.getElementById('relationshipNoteModal').value;
        }
        applyFilters();
        closeRelationshipModal();
    }
    
    function deleteRelationship() {
        const id = document.getElementById('relationshipId').value;
        if (confirm('Are you sure you want to delete this relationship link?')) {
            familyData.connections = familyData.connections.filter(c => c.id !== id);
            applyFilters();
            closeRelationshipModal();
        }
    }

    // --- SIDEBAR RELATIONSHIP MANAGER ---
    function populateRelationshipManager() {
        const fromSelect = document.getElementById('rel-from');
        const toSelect = document.getElementById('rel-to');
        const listContainer = document.getElementById('existing-relationships-list');
        
        const members = familyData.members.sort((a, b) => a.name.localeCompare(b.name));
        const options = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;

        listContainer.innerHTML = '';
        familyData.connections.forEach(conn => {
            const fromMember = familyData.members.find(m => m.id === conn.members[0]);
            const toMember = familyData.members.find(m => m.id === conn.members[1]);
            if (!fromMember || !toMember) return;
            
            const item = document.createElement('div');
            item.className = 'relationship-item';
            item.dataset.names = `${fromMember.name.toLowerCase()} ${toMember.name.toLowerCase()}`;
            let statusHTML = conn.status ? `<div class="rel-status">'${conn.status}'</div>` : '';

            item.innerHTML = `
                <div>
                    <span><strong>${fromMember.name}</strong> &harr; <strong>${toMember.name}</strong><br><small>${conn.link} (${conn.type})</small></span>
                    ${statusHTML}
                </div>
                <div class="actions">
                    <button data-id="${conn.id}" class="edit-rel" title="Edit Link"><i class="fa-solid fa-pencil"></i></button>
                    <button data-id="${conn.id}" class="delete-rel" title="Delete Link"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            listContainer.appendChild(item);
        });
        
        listContainer.querySelectorAll('.edit-rel').forEach(b => b.addEventListener('click', (e) => openRelationshipModal(e.currentTarget.dataset.id)));
        listContainer.querySelectorAll('.delete-rel').forEach(b => b.addEventListener('click', (e) => {
            if (confirm('Are you sure you want to delete this relationship link?')) {
                familyData.connections = familyData.connections.filter(c => c.id !== e.currentTarget.dataset.id);
                applyFilters();
            }
        }));
    }

    function handleRelationshipForm(e) {
        e.preventDefault();
        const fromId = parseInt(document.getElementById('rel-from').value);
        const toId = parseInt(document.getElementById('rel-to').value);
        const fromRole = document.getElementById('rel-from-role').value;
        const toRole = document.getElementById('rel-to-role').value;
        const link = document.getElementById('rel-link').value;
        const type = document.getElementById('rel-type').value;
        const status = document.getElementById('rel-status').value;
        const note = document.getElementById('rel-note').value;

        if (!fromId || !toId) return showToast("Please select two people.");
        if (fromId === toId) return showToast("Cannot link a person to themselves.");
        
        const fromMember = familyData.members.find(m => m.id === fromId);
        const toMember = familyData.members.find(m => m.id === toId);
        if (fromMember) fromMember.relationship = fromRole;
        if (toMember) toMember.relationship = toRole;

        let members = [fromId, toId];
        if (link === 'Parent-Child') {
            if(fromMember.generation > toMember.generation) members = [toId, fromId];
            else if (fromMember.generation === toMember.generation) return showToast("Parents and children must be in different generations.");
        }
        
        familyData.connections.push({ id: `c${Date.now()}`, members, link, type, status, note });

        showToast("Relationship Link added!");
        applyFilters();
    }

    function handleRelationshipSearch(e) {
        const query = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#existing-relationships-list .relationship-item');
        items.forEach(item => {
            const names = item.dataset.names;
            if (names.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // --- UI CONTROLS: ZOOM, PAN, FULLSCREEN ---
    function updateZoom(amount) {
        scale = Math.max(0.2, Math.min(2, scale + amount));
        treeContainer.style.transform = `scale(${scale})`;
        zoomLevelDisplay.textContent = `${Math.round(scale * 100)}%`;
        setTimeout(() => drawConnections(currentViewConnections), 300);
    }
    
    function resetView() {
        scale = 1;
        treeContainer.style.transform = 'scale(1)';
        zoomLevelDisplay.textContent = '100%';
        canvas.scrollTop = 0; canvas.scrollLeft = 0;
        setTimeout(() => drawConnections(currentViewConnections), 300);
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

    // --- DATA MANAGEMENT & EXPORT ---
    function exportJson() {
        const dataStr = JSON.stringify(familyData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', 'family-tree-data.json');
        linkElement.click();
        showToast('JSON data exported.');
    }

    function importJson(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.members && importedData.connections) {
                    familyData = importedData;
                    populateSearchDatalist();
                    populateFilterDropdowns();
                    resetAllFilters();
                    showToast('Family data imported successfully!');
                } else {
                    showToast('Error: Invalid JSON file format.');
                }
            } catch (error) {
                showToast('Error parsing JSON file.');
                console.error("JSON Parse Error:", error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function captureTree(callback, format) {
        showToast(`Generating ${format.toUpperCase()}...`);
        const tempClass = 'is-exporting';
        treeContainer.classList.add(tempClass);
        drawConnections(currentViewConnections);
        
        setTimeout(() => {
            html2canvas(treeContainer, { backgroundColor: null, scale: 2 }).then(canvas => {
                callback(canvas);
                treeContainer.classList.remove(tempClass);
                drawConnections(currentViewConnections);
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
        const headers = ['id', 'name', 'relationship', 'status', 'birthDate', 'deathDate', 'generation', 'side', 'tags', 'description'];
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