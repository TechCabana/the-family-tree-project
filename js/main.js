import { familyData as initialFamilyData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let familyData = loadDataFromLocalStorage() || JSON.parse(JSON.stringify(initialFamilyData));
    let currentViewMembers = [];
    let currentViewConnections = [];
    let scale = 1;

    // --- STATIC DATA FOR DROPDOWNS ---
    const relationshipRoles = ["Son", "Daughter", "Father", "Mother", "Grandfather", "Grandmother", "Great-Grandfather", "Great-Grandmother", "Step-Father", "Step-Mother"];
    const relationshipLinks = ["Parent", "Spouse", "Partner", "Sibling"];
    const relationshipStatuses = ["Married", "Engaged", "Separated", "Divorced", "Single", "Partnered"];
    const linkStatuses = ["Married", "Divorced", "Partner", "Engaged", "Separated"];
    const relationshipTypes = ["Biological", "Adopted", "Step-Relationship"];

    // --- DOM ELEMENT REFERENCES ---
    const treeLayout = document.getElementById('tree-layout');
    const memberCardTemplate = document.getElementById('member-card-template');
    const connectionsSVG = document.getElementById('tree-connections');
    const canvas = document.getElementById('main-canvas');
    const treeContainer = document.getElementById('tree-container');
    const searchInput = document.getElementById('search-member');
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

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    function calculateAge(birthDateStr, deathDateStr) {
        if (!birthDateStr) return null;
        const birthDate = new Date(birthDateStr);
        if (isNaN(birthDate.getTime())) return null; 

        const endDate = deathDateStr ? new Date(deathDateStr) : new Date();
         if (isNaN(endDate.getTime())) return null;

        let age = endDate.getFullYear() - birthDate.getFullYear();
        const m = endDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : null;
    }
    
    // --- DATA PERSISTENCE FUNCTIONS ---
    function saveDataToLocalStorage() {
        localStorage.setItem('familyTreeData', JSON.stringify(familyData));
    }

    function loadDataFromLocalStorage() {
        const data = localStorage.getItem('familyTreeData');
        return data ? JSON.parse(data) : null;
    }

    // --- INITIALIZATION ---
    function init() {
        addEventListeners();
        createFloatingLeaves();
        populateStaticDropdowns();
        populateFilterDropdowns();
        injectModalStyles(); 
        resetAllFilters(true);
        showCoachMark();
    }
    
    function injectModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #relationship-modal .modal-content {
                max-height: 85vh;
                display: flex;
                flex-direction: column;
            }
            #relationship-modal .modal-body {
                overflow-y: auto;
                flex-grow: 1;
            }
        `;
        document.head.appendChild(style);
    }

    function populateFilterDropdowns() {
        document.getElementById('role-filter').innerHTML = '<option value="all">All Roles</option>' + relationshipRoles.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('link-filter').innerHTML = '<option value="all">All Links</option>' + relationshipLinks.map(l => `<option value="${l}">${l}</option>`).join('');
        document.getElementById('status-filter').innerHTML = '<option value="all">All Statuses</option>' + relationshipStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    
    function populateStaticDropdowns() {
        document.getElementById('relationship').innerHTML = relationshipRoles.map(r => `<option value="${r}">${r}</option>`).join('');
        document.getElementById('status').innerHTML = relationshipStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('rel-link').innerHTML = relationshipLinks.map(l => `<option value="${l}">${l}</option>`).join('');
        document.getElementById('rel-type').innerHTML = relationshipTypes.map(t => `<option value="${t}">${t}</option>`).join('');
        document.getElementById('rel-status').innerHTML = linkStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // --- EVENT LISTENERS ---
    function addEventListeners() {
        const controlsBar = document.getElementById('controls-bar');
        
        document.getElementById('toggle-controls-btn').addEventListener('click', () => controlsBar.classList.add('is-open'));
        document.getElementById('close-controls-btn').addEventListener('click', () => controlsBar.classList.remove('is-open'));

        document.getElementById('add-new-person-btn').addEventListener('click', () => openEditModal());

        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('focus', handleSearchInput);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const firstResult = document.querySelector('#search-results .search-result-item');
                if (firstResult && firstResult.dataset.id) {
                    focusOnMember(parseInt(firstResult.dataset.id));
                    searchInput.value = '';
                    document.getElementById('search-results').classList.remove('is-visible');
                }
            }
        });

        document.getElementById('tag-filter').addEventListener('input', applyFilters);
        document.getElementById('side-filter').addEventListener('change', applyFilters);
        document.getElementById('level-filter').addEventListener('change', applyFilters);
        document.getElementById('role-filter').addEventListener('change', applyFilters);
        document.getElementById('link-filter').addEventListener('change', applyFilters);
        document.getElementById('status-filter').addEventListener('change', applyFilters);
        
        document.getElementById('globalResetBtn').addEventListener('click', resetApplicationToDemoState);
        document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
        emptyStateMessage.addEventListener('click', () => openEditModal());
        
        document.getElementById('toggle-links').addEventListener('change', (e) => document.body.classList.toggle('hide-connections', !e.target.checked));
        document.getElementById('toggle-roles').addEventListener('change', (e) => document.body.classList.toggle('hide-roles', !e.target.checked));
        document.getElementById('toggle-notes').addEventListener('change', () => drawConnections(currentViewConnections));
        // Add listener for the new deceased toggle
        document.getElementById('toggle-deceased').addEventListener('change', applyFilters);

        document.getElementById('relationship-form-sidebar').addEventListener('submit', handleRelationshipForm);
        
        document.getElementById('level-select-all').addEventListener('click', () => {
            Array.from(document.getElementById('level-filter').options).forEach(opt => opt.selected = true);
            applyFilters();
        });
        document.getElementById('level-deselect-all').addEventListener('click', () => {
            Array.from(document.getElementById('level-filter').options).forEach(opt => opt.selected = false);
            applyFilters();
        });

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

        window.addEventListener('resize', debounce(() => {
            drawConnections(currentViewConnections);
            repositionCoachMark();
        }, 250));
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
    
    // --- CORE LOGIC ---
    function clearAllData() {
        if (confirm("Are you sure you want to clear all family data? This action cannot be undone.")) {
            familyData.members = [];
            familyData.connections = [];
            saveDataToLocalStorage(); 
            applyFilters();
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
                    focusOnMember(parseInt(item.dataset.id));
                    searchInput.value = '';
                    resultsContainer.classList.remove('is-visible');
                });
                resultsContainer.appendChild(item);
            });
        }
        resultsContainer.classList.add('is-visible');
    }

    function focusOnMember(memberId) {
        resetAllFilters(true); 

        setTimeout(() => {
            const card = document.querySelector(`.member-card[data-id='${memberId}']`);
            if (card) {
                card.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });

                card.classList.add('highlight-focus');
                setTimeout(() => {
                    card.classList.remove('highlight-focus');
                }, 2500); 
            }
        }, 100);
    }

    function applyFilters() {
        // Read the state of all filters, including the new one
        const tagQuery = document.getElementById('tag-filter').value.toLowerCase();
        const sideQuery = document.getElementById('side-filter').value;
        const levelQueryValues = Array.from(document.getElementById('level-filter').selectedOptions).map(opt => opt.value);
        const roleQuery = document.getElementById('role-filter').value;
        const linkQuery = document.getElementById('link-filter').value;
        const statusQuery = document.getElementById('status-filter').value;
        const showDeceased = document.getElementById('toggle-deceased').checked;

        let filteredMembers = familyData.members;

        // Apply the new deceased filter
        if (!showDeceased) {
            filteredMembers = filteredMembers.filter(member => !member.deathDate);
        }

        if (tagQuery) {
            filteredMembers = filteredMembers.filter(m => m.tags && m.tags.some(tag => tag.toLowerCase().includes(tagQuery)));
        }
        if (sideQuery !== 'all') {
            filteredMembers = filteredMembers.filter(m => m.side === sideQuery || m.side === 'ego');
        }
        if (levelQueryValues.length > 0) {
            filteredMembers = filteredMembers.filter(m => levelQueryValues.includes(String(m.generation)));
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
        populatePeopleManager();
        populateRelationshipManager();
    }
    
    function resetAllFilters(isSilent) {
        document.getElementById('tag-filter').value = '';
        document.getElementById('side-filter').value = 'all';
        Array.from(document.getElementById('level-filter').options).forEach(opt => opt.selected = true);
        document.getElementById('role-filter').value = 'all';
        document.getElementById('link-filter').value = 'all';
        document.getElementById('status-filter').value = 'all';
        searchInput.value = '';
        // Reset the deceased toggle to its default (checked)
        document.getElementById('toggle-deceased').checked = true;
        
        applyFilters();
        
        if (!isSilent) {
            showToast("Filters reset.");
        }
    }

    function resetApplicationToDemoState() {
        if (confirm("Are you sure you want to reset all data to the original demo? All your changes will be lost.")) {
            familyData = JSON.parse(JSON.stringify(initialFamilyData));
            localStorage.removeItem('familyTreeData');
            resetView();
            resetAllFilters(true);
            showToast("Application has been reset to demo data.");
        }
    }

    function showCoachMark() {
        const coachMark = document.getElementById('coach-mark-clear');
        const closeButton = document.getElementById('coach-mark-close');
        const clearButton = document.getElementById('clearDataBtn');

        if (!coachMark || !closeButton || !clearButton) return;
        
        setTimeout(() => {
            if (clearButton.offsetParent !== null) { 
                repositionCoachMark();
                coachMark.classList.add('is-visible');
            }
        }, 1500);

        closeButton.addEventListener('click', () => {
            coachMark.classList.remove('is-visible');
        });
    }
    
    function repositionCoachMark() {
        const coachMark = document.getElementById('coach-mark-clear');
        const clearButton = document.getElementById('clearDataBtn');
        if (!coachMark || !clearButton) return;

        if (getComputedStyle(clearButton).display === 'none') {
            coachMark.classList.remove('is-visible');
            return;
        }

        const rect = clearButton.getBoundingClientRect();
        const pointer = coachMark.querySelector('.coach-mark-pointer');
        const coachMarkWidth = coachMark.offsetWidth;
        const viewportWidth = window.innerWidth;
        
        let left = rect.left + (rect.width / 2) - (coachMarkWidth / 2);

        if (left < 10) { left = 10; }
        if (left + coachMarkWidth > viewportWidth - 10) {
            left = viewportWidth - coachMarkWidth - 10;
        }

        coachMark.style.top = `${rect.top - coachMark.offsetHeight - 12}px`;
        coachMark.style.left = `${left}px`;
        
        const pointerLeft = rect.left + (rect.width / 2) - left;
        pointer.style.top = '100%';
        pointer.style.left = `${pointerLeft}px`;
        pointer.style.transform = 'translateX(-50%)';
        pointer.style.borderWidth = '12px 12px 0 12px';
        pointer.style.borderColor = 'var(--text-dark) transparent transparent transparent';
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
                
                const detailsEl = card.querySelector('.member-details');
                const detailsParts = [];

                let lifeRange = 'Dates N/A';
                if (member.birthDate) {
                    lifeRange = new Date(member.birthDate).toLocaleDateString();
                    if (member.deathDate) {
                        lifeRange += ` – ${new Date(member.deathDate).toLocaleDateString()}`;
                    }
                }
                detailsParts.push(lifeRange);

                const age = calculateAge(member.birthDate, member.deathDate);
                if (age !== null) {
                    let ageText = member.deathDate ? `(Deceased, Age ${age})` : `(Age ${age})`;
                    detailsParts.push(ageText);
                }
                
                detailsEl.innerHTML = detailsParts.join('<br>');

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
                    [midX, midY] = [(fromX + toX) / 2, (fromY + toY) / 2];
                } else {
                    fromY = (fromRect.top + fromRect.bottom) / 2 - containerRect.top;
                    fromX = fromRect.right - containerRect.left;
                    toX = toRect.left - containerRect.left;
                    d = `M ${fromX} ${fromY} C ${fromX + 30} ${fromY}, ${toX - 30} ${fromY}, ${toX} ${fromY}`;
                    [midX, midY] = [(fromX + toX) / 2, fromY];
                }
            } else if (conn.link === 'Parent') {
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
        const memberData = {
            name: document.getElementById('name').value,
            relationship: document.getElementById('relationship').value,
            status: document.getElementById('status').value,
            birthDate: document.getElementById('birthDate').value,
            deathDate: document.getElementById('deathDate').value,
            generation: parseInt(document.getElementById('generation').value, 10),
            description: document.getElementById('description').value,
            avatar: (modalAvatarImg.src.startsWith('data:') || modalAvatarImg.src.startsWith('http')) ? modalAvatarImg.src : null,
            tags: Array.from(tagsInputContainer.querySelectorAll('.tag-item span')).map(t => t.textContent)
        };

        if (id) {
            const member = familyData.members.find(m => m.id === id);
            Object.assign(member, memberData);
            if (memberData.avatar === null) {
                member.avatar = familyData.members.find(m => m.id === id).avatar;
            }
            showToast(`${member.name}'s details saved!`);
        } else {
            const newMember = {
                ...memberData,
                id: Date.now(),
                name: memberData.name || 'New Member',
                relationship: memberData.relationship || 'Person',
                generation: isNaN(memberData.generation) ? 0 : memberData.generation,
                side: 'ego'
            };
            familyData.members.push(newMember);
            showToast(`${newMember.name} added to the tree!`);
        }
        
        saveDataToLocalStorage(); 
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
        const conn = familyData.connections.find(c => c.id == connId);
        if (!conn) return;

        const [fromId, toId] = conn.members;
        const fromMember = familyData.members.find(m => m.id === fromId);
        const toMember = familyData.members.find(m => m.id === toId);

        document.getElementById('relationshipId').value = conn.id;
        document.getElementById('relationshipLinkModal').innerHTML = relationshipLinks.map(t => `<option value="${t}" ${conn.link === t ? 'selected' : ''}>${t}</option>`).join('');
        document.getElementById('relationshipTypeModal').innerHTML = relationshipTypes.map(t => `<option value="${t}" ${conn.type === t ? 'selected' : ''}>${t}</option>`).join('');
        document.getElementById('relationshipStatusModal').innerHTML = linkStatuses.map(s => `<option value="${s}" ${conn.status === s ? 'selected' : ''}>${s}</option>`).join('');
        document.getElementById('relationshipNoteModal').value = conn.note || '';
        document.getElementById('relFromRoleModal').innerHTML = relationshipRoles.map(r => `<option value="${r}" ${fromMember.relationship === r ? 'selected' : ''}>${r}</option>`).join('');
        document.getElementById('relToRoleModal').innerHTML = relationshipRoles.map(r => `<option value="${r}" ${toMember.relationship === r ? 'selected' : ''}>${r}</option>`).join('');
        document.getElementById('relFromRoleModalLabel').textContent = `${fromMember.name}'s Role`;
        document.getElementById('relToRoleModalLabel').textContent = `${toMember.name}'s Role`;
        
        modal.classList.add('visible');
    }

    function closeRelationshipModal() { document.getElementById('relationship-modal').classList.remove('visible'); }

    function saveRelationship() {
        const id = document.getElementById('relationshipId').value;
        const conn = familyData.connections.find(c => c.id == id);
        if (conn) {
            conn.link = document.getElementById('relationshipLinkModal').value;
            conn.type = document.getElementById('relationshipTypeModal').value;
            conn.status = document.getElementById('relationshipStatusModal').value;
            conn.note = document.getElementById('relationshipNoteModal').value;

            const [fromId, toId] = conn.members;
            const fromMember = familyData.members.find(m => m.id === fromId);
            const toMember = familyData.members.find(m => m.id === toId);

            if(fromMember) fromMember.relationship = document.getElementById('relFromRoleModal').value;
            if(toMember) toMember.relationship = document.getElementById('relToRoleModal').value;
        }
        saveDataToLocalStorage(); 
        applyFilters();
        closeRelationshipModal();
    }
    
    function deleteRelationship() {
        const id = document.getElementById('relationshipId').value;
        if (confirm('Are you sure you want to delete this relationship link?')) {
            familyData.connections = familyData.connections.filter(c => c.id != id);
            saveDataToLocalStorage(); 
            applyFilters();
            closeRelationshipModal();
        }
    }

    // --- SIDEBAR MANAGER ---
    function populatePeopleManager() {
        const listContainer = document.getElementById('existing-people-list');
        listContainer.innerHTML = '';
        
        currentViewMembers.sort((a, b) => a.name.localeCompare(b.name)).forEach(member => {
            const item = document.createElement('div');
            item.className = 'manager-list-item';
            item.dataset.name = member.name.toLowerCase();
            item.innerHTML = `
                <div>
                    <strong>${member.name}</strong>
                    <small class="item-details">${member.relationship || ''}</small>
                </div>
                <div class="actions">
                    <button data-id="${member.id}" class="edit-person" title="Edit Person"><i class="fa-solid fa-pencil"></i></button>
                    <button data-id="${member.id}" class="delete-person" title="Delete Person"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            listContainer.appendChild(item);
        });

        listContainer.querySelectorAll('.edit-person').forEach(b => b.addEventListener('click', (e) => openEditModal(parseInt(e.currentTarget.dataset.id))));
        listContainer.querySelectorAll('.delete-person').forEach(b => b.addEventListener('click', (e) => deleteMember(parseInt(e.currentTarget.dataset.id))));
    }

    function handlePeopleSearch(e) {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('#existing-people-list .manager-list-item').forEach(item => {
            item.style.display = item.dataset.name.includes(query) ? 'flex' : 'none';
        });
    }

    function deleteMember(memberIdToDelete) {
        if (confirm(`Are you sure you want to delete this person? This will also remove all their connections.`)) {
            familyData.members = familyData.members.filter(m => m.id !== memberIdToDelete);
            familyData.connections = familyData.connections.filter(c => !c.members.includes(memberIdToDelete));
            saveDataToLocalStorage(); 
            applyFilters();
        }
    }

    function populateRelationshipManager() {
        const fromSelect = document.getElementById('rel-from');
        const toSelect = document.getElementById('rel-to');
        const listContainer = document.getElementById('existing-relationships-list');
        
        const members = familyData.members.sort((a, b) => a.name.localeCompare(b.name));
        const options = members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        
        fromSelect.innerHTML = options;
        toSelect.innerHTML = options;

        listContainer.innerHTML = '';
        (familyData.connections || []).forEach(conn => {
            const fromMember = familyData.members.find(m => m.id === conn.members[0]);
            const toMember = familyData.members.find(m => m.id === conn.members[1]);
            if (!fromMember || !toMember) return;
            
            const item = document.createElement('div');
            item.className = 'manager-list-item';
            item.dataset.names = `${fromMember.name.toLowerCase()} ${toMember.name.toLowerCase()}`;
            
            let details = `${conn.link} (${conn.type})`;
            if (conn.status) {
                details += ` - ${conn.status}`;
            }

            item.innerHTML = `
                <div>
                    <strong>${fromMember.name} &harr; ${toMember.name}</strong>
                    <small class="item-details">${details}</small>
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
                familyData.connections = familyData.connections.filter(c => c.id != e.currentTarget.dataset.id);
                saveDataToLocalStorage(); 
                applyFilters();
            }
        }));
    }

    function handleRelationshipForm(e) {
        e.preventDefault();
        const fromId = parseInt(document.getElementById('rel-from').value);
        const toId = parseInt(document.getElementById('rel-to').value);
        const link = document.getElementById('rel-link').value;
        const type = document.getElementById('rel-type').value;
        const status = document.getElementById('rel-status').value;
        const note = document.getElementById('rel-note').value;

        if (!fromId || !toId) return showToast("Please select two people.");
        if (fromId === toId) return showToast("Cannot link a person to themselves.");
        
        const fromMember = familyData.members.find(m => m.id === fromId);
        const toMember = familyData.members.find(m => m.id === toId);

        let members = [fromId, toId];
        if (link === 'Parent') {
            if(fromMember.generation > toMember.generation) members = [toId, fromId];
            else if (fromMember.generation === toMember.generation) {
                return showToast("Parents and children must be in different generations. Please check their generation numbers.");
            }
        }
        
        familyData.connections.push({ id: `c${Date.now()}`, members, link, type, status, note });
        saveDataToLocalStorage(); 
        showToast("Relationship Link added!");
        applyFilters();
    }

    function handleRelationshipSearch(e) {
        const query = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#existing-relationships-list .manager-list-item');
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
                    saveDataToLocalStorage(); 
                    resetAllFilters(true);
                } else {
                    alert('Error: Invalid JSON file format.');
                }
            } catch (error) {
                alert('Error parsing JSON file.');
                console.error("JSON Parse Error:", error);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    function captureTree(callback, format) {
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