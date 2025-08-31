// Enhanced Configuration with Video Editing Workflow
const CONFIG = {
  password: 'mhm2024', // Legacy password for backward compatibility
  storageKey: 'mhm-tracker-data-v2', // Updated storage key to avoid conflicts
  // Updated stages for video editing workflow
  stages: [
    { id: 'uploaded', name: 'Uploaded', color: '#00ffa3' },
    { id: 'assigned', name: 'Assigned', color: '#00d4ff' },
    { id: 'editing', name: 'Editing', color: '#ff6b35' },
    { id: 'revisions', name: 'Revisions', color: '#ffb347' },
    { id: 'final', name: 'Final', color: '#7c3aed' },
    { id: 'posted', name: 'Posted', color: '#10b981' }
  ],
  defaultPlatforms: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn'],
  defaultEditors: ['Mia', 'Leo', 'Kai'],
  defaultChannels: ['Main Brand', 'Clips Channel', 'Client Channel'],
  cardColors: [
    { value: 'teal', name: 'Teal' },
    { value: 'coral', name: 'Coral' },
    { value: 'navy', name: 'Navy' },
    { value: 'purple', name: 'Purple' },
    { value: 'green', name: 'Green' }
  ],
  // Role-based access control configuration
  roles: {
    admin: {
      name: 'Administrator',
      permissions: {
        viewAll: true,
        editAll: true,
        deleteProjects: true,
        manageTrash: true,
        manageLists: true,
        importExport: true,
        viewStats: true
      }
    },
    editor: {
      name: 'Editor',
      permissions: {
        viewAll: false, // Only assigned projects
        editAll: false, // Only assigned projects
        deleteProjects: false, // Can only move to trash
        manageTrash: false,
        manageLists: false,
        importExport: false,
        viewStats: true // Limited stats
      }
    },
    client: {
      name: 'Client',
      permissions: {
        viewAll: false, // Only client projects
        editAll: false,
        deleteProjects: false,
        manageTrash: false,
        manageLists: false,
        importExport: false,
        viewStats: true // Limited stats
      }
    },
    viewer: {
      name: 'Viewer',
      permissions: {
        viewAll: true,
        editAll: false,
        deleteProjects: false,
        manageTrash: false,
        manageLists: false,
        importExport: false,
        viewStats: true
      }
    }
  }
};

// Enhanced Application State with better error handling
let appState = {
  isLoggedIn: false,
  userRole: null,
  userClient: null, // For client role
  userEditor: null, // For editor role  
  projects: [],
  trash: [],
  editors: [...CONFIG.defaultEditors],
  platforms: [...CONFIG.defaultPlatforms],
  channels: [...CONFIG.defaultChannels],
  editingProject: null,
  currentChecklist: [],
  lastSaveTime: null
};

// Enhanced Utility Functions with better error handling
const utils = {
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
  
  formatDate: (date) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  },
  
  daysBetween: (date1, date2) => {
    try {
      const diff = Math.abs(new Date(date2) - new Date(date1));
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  },
  
  saveToStorage: () => {
    try {
      const dataToSave = {
        projects: appState.projects,
        trash: appState.trash,
        editors: appState.editors,
        platforms: appState.platforms,
        channels: appState.channels,
        lastSaved: Date.now(),
        version: '2.0'
      };
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(dataToSave));
      appState.lastSaveTime = Date.now();
      console.log('Data saved successfully at', new Date().toLocaleTimeString());
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      showNotification('Failed to save data. Please try again.', 'error');
      return false;
    }
  },
  
  loadFromStorage: () => {
    try {
      const data = JSON.parse(localStorage.getItem(CONFIG.storageKey));
      if (data && data.version) {
        // Load data with validation
        appState.projects = Array.isArray(data.projects) ? data.projects : [];
        appState.trash = Array.isArray(data.trash) ? data.trash : [];
        appState.editors = Array.isArray(data.editors) ? data.editors : [...CONFIG.defaultEditors];
        appState.platforms = Array.isArray(data.platforms) ? data.platforms : [...CONFIG.defaultPlatforms];
        appState.channels = Array.isArray(data.channels) ? data.channels : [...CONFIG.defaultChannels];
        
        // Validate and migrate existing projects to new stages if needed
        appState.projects.forEach(project => {
          if (!project.id) project.id = utils.generateId();
          if (!CONFIG.stages.find(s => s.id === project.stage)) {
            // Migrate old stages to new workflow
            const stageMap = {
              'ideation': 'uploaded',
              'filming': 'assigned', 
              'editing': 'editing',
              'revisions': 'revisions',
              'posting': 'posted'
            };
            project.stage = stageMap[project.stage] || 'uploaded';
          }
          if (!project.checklist) project.checklist = [];
          if (!project.timeline) project.timeline = {};
        });
        
        console.log('Data loaded successfully');
        return true;
      } else {
        // Initialize with default data
        console.log('No existing data found, initializing defaults');
        return false;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      return false;
    }
  },

  // Auto-save functionality
  autoSave: () => {
    if (appState.isLoggedIn) {
      utils.saveToStorage();
    }
  },

  // Update all dropdowns consistently
  updateAllDropdowns: () => {
    updateFilters();
    updateFormSelects();
  }
};

// Auto-save every 30 seconds
setInterval(utils.autoSave, 30000);

// Role-Based Access Control Functions
const roleUtils = {
  // Parse password to determine role and extract client/editor info
  parsePassword: (password) => {
    // Legacy admin password for backward compatibility
    if (password === CONFIG.password) {
      return { role: 'admin', client: null, editor: null };
    }
    
    // Role-based passwords
    if (password === 'admin-mhm2024') {
      return { role: 'admin', client: null, editor: null };
    }
    
    if (password === 'editor-mhm2024') {
      return { role: 'editor', client: null, editor: null };
    }
    
    if (password === 'viewer-mhm2024') {
      return { role: 'viewer', client: null, editor: null };
    }
    
    // Client passwords: client-[clientname]
    const clientMatch = password.match(/^client-(.+)$/);
    if (clientMatch) {
      return { role: 'client', client: clientMatch[1], editor: null };
    }
    
    return null; // Invalid password
  },
  
  // Check if user has specific permission
  hasPermission: (permission) => {
    if (!appState.userRole || !CONFIG.roles[appState.userRole]) {
      return false;
    }
    return CONFIG.roles[appState.userRole].permissions[permission] || false;
  },
  
  // Filter projects based on user role and permissions
  getFilteredProjects: () => {
    if (!appState.userRole) return [];
    
    const allProjects = appState.projects;
    
    switch (appState.userRole) {
      case 'admin':
        return allProjects; // Admin sees all projects
        
      case 'editor':
        // Editor sees only projects assigned to them
        // For now, we'll show all projects but this can be refined based on editor assignment
        return allProjects.filter(project => {
          // If no specific editor assigned to user, show all
          // This can be enhanced to assign specific editors to editor users
          return true;
        });
        
      case 'client':
        // Client sees only their projects
        return allProjects.filter(project => 
          project.client && project.client.toLowerCase() === appState.userClient?.toLowerCase()
        );
        
      case 'viewer':
        return allProjects; // Viewer sees all projects (read-only)
        
      default:
        return [];
    }
  },
  
  // Check if user can edit a specific project
  canEditProject: (project) => {
    if (!appState.userRole || !project) return false;
    
    switch (appState.userRole) {
      case 'admin':
        return true;
        
      case 'editor':
        // Editor can edit projects assigned to them
        // For now allowing all, but this should be refined
        return true;
        
      case 'client':
      case 'viewer':
        return false; // Read-only roles
        
      default:
        return false;
    }
  },
  
  // Get role display name
  getRoleDisplayName: () => {
    if (!appState.userRole || !CONFIG.roles[appState.userRole]) {
      return 'Unknown';
    }
    
    const roleName = CONFIG.roles[appState.userRole].name;
    if (appState.userRole === 'client' && appState.userClient) {
      return `${roleName} (${appState.userClient})`;
    }
    return roleName;
  }
};

// Fixed Authentication Functions
function checkPassword() {
  const passwordInput = document.getElementById('passwordInput');
  const errorEl = document.getElementById('loginError');
  const password = passwordInput.value.trim();
  
  console.log('Checking password:', password); // Debug log
  
  // Parse password to get role information
  const authInfo = roleUtils.parsePassword(password);
  
  if (authInfo) {
    // Set user authentication and role information
    appState.isLoggedIn = true;
    appState.userRole = authInfo.role;
    appState.userClient = authInfo.client;
    appState.userEditor = authInfo.editor;
    
    // Hide login screen and show main app
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    errorEl.classList.add('hidden');
    
    // Initialize app with role-based permissions
    initializeApp();
    
    console.log('Login successful as:', roleUtils.getRoleDisplayName());
  } else {
    // Invalid password
    errorEl.classList.remove('hidden');
    errorEl.textContent = 'Incorrect password. Please try again.';
    passwordInput.value = '';
    passwordInput.focus();
    
    // Add shake animation to login card
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
      loginCard.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        if (loginCard) loginCard.style.animation = '';
      }, 500);
    }
    console.log('Login failed');
  }
}

function logout() {
  if (confirm('Are you sure you want to logout? Any unsaved changes will be saved automatically.')) {
    utils.saveToStorage(); // Save before logout
    appState.isLoggedIn = false;
    appState.userRole = null;
    appState.userClient = null;
    appState.userEditor = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').classList.add('hidden');
    
    // Hide role indicator
    const roleIndicator = document.getElementById('roleIndicator');
    if (roleIndicator) {
      roleIndicator.classList.add('hidden');
    }
    
    console.log('Logged out successfully');
  }
}

// Notification system
function showNotification(message, type = 'info') {
  // Create notification if it doesn't exist
  let notification = document.getElementById('notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification hidden';
    document.body.appendChild(notification);
  }
  
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (notification) {
      notification.classList.add('hidden');
    }
  }, 3000);
}

// App Initialization
function initializeApp() {
  try {
    console.log('Initializing app...');
    const loaded = utils.loadFromStorage();
    if (!loaded) {
      // Create sample data for new users
      createSampleData();
    }
    
    // Update UI based on user role and permissions
    updateUIForRole();
    
    setupEventListeners();
    renderBoard();
    utils.updateAllDropdowns();
    updateStats();
    
    // Show welcome message
    setTimeout(() => {
      const total = roleUtils.getFilteredProjects().length;
      const roleName = roleUtils.getRoleDisplayName();
      showNotification(`Welcome ${roleName}! Loaded ${total} projects.`, 'success');
    }, 1000);
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error initializing app. Please refresh and try again.', 'error');
  }
}

function createSampleData() {
  const sampleProjects = [
    {
      id: utils.generateId(),
      title: 'Client Nova – Launch Campaign',
      client: 'Nova',
      editor: 'Mia',
      platform: 'Instagram',
      channel: 'Main Brand',
      due: '2025-09-05',
      uploadDate: '',
      priority: 'HIGH',
      stage: 'editing',
      color: 'teal',
      links: '',
      rawFootage: '',
      notes: 'Focus on product hero shots and brand messaging.',
      hook: 'Show hero shot in first 1s',
      ending: 'Swipe up for full reveal',
      script: '',
      voiceover: '',
      keyShots: 'Hero shot\nLogo sting\nProduct close-up',
      locations: 'Studio A\nOutdoor location',
      music: '',
      editNotes: 'Add dynamic transitions',
      checklist: [
        { id: utils.generateId(), text: 'Review raw footage', done: true },
        { id: utils.generateId(), text: 'Create rough cut', done: false },
        { id: utils.generateId(), text: 'Add sound design', done: false }
      ],
      createdAt: Date.now(),
      timeline: { uploaded: Date.now() - 86400000, assigned: Date.now() - 43200000, editing: Date.now() }
    },
    {
      id: utils.generateId(),
      title: 'TechCorp – Behind the Scenes',
      client: 'TechCorp',
      editor: 'Leo',
      platform: 'YouTube',
      channel: 'Client Channel',
      due: '2025-09-02',
      uploadDate: '',
      priority: 'MEDIUM',
      stage: 'revisions',
      color: 'navy',
      links: '',
      rawFootage: '',
      notes: 'Documentary style editing with interviews.',
      hook: 'Cold open with team at work',
      ending: 'Subscribe for more content',
      script: '',
      voiceover: '',
      keyShots: 'Interview setups\nOffice b-roll\nTeam collaboration',
      locations: 'Client office\nConference room',
      music: 'Corporate upbeat',
      editNotes: 'Keep pace engaging, use split screens',
      checklist: [
        { id: utils.generateId(), text: 'First cut complete', done: true },
        { id: utils.generateId(), text: 'Client feedback received', done: true },
        { id: utils.generateId(), text: 'Implement revisions', done: false }
      ],
      createdAt: Date.now() - 172800000,
      timeline: { 
        uploaded: Date.now() - 172800000, 
        assigned: Date.now() - 129600000, 
        editing: Date.now() - 86400000,
        revisions: Date.now() - 43200000
      }
    }
  ];
  
  appState.projects = sampleProjects;
  utils.saveToStorage();
}

// Update UI elements based on user role and permissions
function updateUIForRole() {
  try {
    // Update role indicator
    const roleIndicator = document.getElementById('roleIndicator');
    if (roleIndicator) {
      roleIndicator.textContent = roleUtils.getRoleDisplayName();
      roleIndicator.classList.remove('hidden');
    }
    
    // Hide/show action buttons based on permissions
    const importBtn = document.querySelector('button[onclick="importData()"]');
    const exportBtn = document.querySelector('button[onclick="exportData()"]');
    const manageBtn = document.querySelector('button[onclick="openManageModal()"]');
    const trashBtn = document.querySelector('button[onclick="openTrash()"]');
    const addProjectBtns = document.querySelectorAll('button[onclick="addNewProject()"], button[onclick*="addNewProject"]');
    
    // Import/Export - only admin has access
    if (importBtn) importBtn.style.display = roleUtils.hasPermission('importExport') ? 'block' : 'none';
    if (exportBtn) exportBtn.style.display = roleUtils.hasPermission('importExport') ? 'block' : 'none';
    
    // Manage lists - only admin has access
    if (manageBtn) manageBtn.style.display = roleUtils.hasPermission('manageLists') ? 'block' : 'none';
    
    // Trash - only admin has access
    if (trashBtn) trashBtn.style.display = roleUtils.hasPermission('manageTrash') ? 'block' : 'none';
    
    // Add project buttons - hide for client and viewer roles
    addProjectBtns.forEach(btn => {
      if (btn) {
        btn.style.display = (roleUtils.hasPermission('editAll') || appState.userRole === 'editor') ? 'block' : 'none';
      }
    });
    
    console.log('UI updated for role:', roleUtils.getRoleDisplayName());
  } catch (error) {
    console.error('Error updating UI for role:', error);
  }
}

function setupEventListeners() {
  try {
    // Search and filters
    const searchInput = document.getElementById('searchInput');
    const editorFilter = document.getElementById('editorFilter');
    const platformFilter = document.getElementById('platformFilter');
    const channelFilter = document.getElementById('channelFilter');
    
    if (searchInput) searchInput.addEventListener('input', debounce(renderBoard, 300));
    if (editorFilter) editorFilter.addEventListener('change', renderBoard);
    if (platformFilter) platformFilter.addEventListener('change', renderBoard);
    if (channelFilter) channelFilter.addEventListener('change', renderBoard);
    
    // Form submission with proper error handling
    const projectForm = document.getElementById('projectForm');
    if (projectForm) projectForm.addEventListener('submit', handleFormSubmit);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'n' && e.ctrlKey) {
        e.preventDefault();
        addNewProject();
      }
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        utils.saveToStorage();
        showNotification('Data saved manually', 'success');
      }
    });
    
    // Password input enter key
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          checkPassword();
        }
      });
    }

    // Handle page unload to save data
    window.addEventListener('beforeunload', (e) => {
      if (appState.isLoggedIn) {
        utils.saveToStorage();
      }
    });

    // Click outside modal to close
    document.addEventListener('click', (e) => {
      const manageModal = document.getElementById('manageModal');
      const trashModal = document.getElementById('trashModal');
      const projectModal = document.getElementById('projectModal');
      
      if (manageModal && !manageModal.classList.contains('hidden') && e.target === manageModal) {
        closeModal();
      }
      if (trashModal && !trashModal.classList.contains('hidden') && e.target === trashModal) {
        closeModal();
      }
      if (projectModal && !projectModal.classList.contains('hidden') && e.target === projectModal) {
        closeModal();
      }
    });
    
    console.log('Event listeners set up successfully');
  } catch (error) {
    console.error('Error setting up event listeners:', error);
  }
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// HTML escape function for security
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Enhanced Project Management with better error handling
function addNewProject(stage = 'uploaded') {
  try {
    appState.editingProject = null;
    appState.currentChecklist = [];
    resetForm();
    document.getElementById('modalTitle').textContent = 'New Project';
    document.getElementById('projectModal').classList.remove('hidden');
    document.getElementById('projectTitle').focus();
    renderChecklist();
  } catch (error) {
    console.error('Error opening new project modal:', error);
    showNotification('Error opening project form. Please try again.', 'error');
  }
}

function editProject(projectId) {
  try {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project) {
      showNotification('Project not found', 'error');
      return;
    }
    
    appState.editingProject = project;
    appState.currentChecklist = project.checklist ? [...project.checklist] : [];
    populateForm(project);
    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('projectModal').classList.remove('hidden');
    renderChecklist();
  } catch (error) {
    console.error('Error editing project:', error);
    showNotification('Error opening project for editing. Please try again.', 'error');
  }
}

function deleteProject(projectId) {
  try {
    if (!confirm('Delete this project? It will be moved to trash.')) return;
    
    const projectIndex = appState.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      const project = appState.projects.splice(projectIndex, 1)[0];
      project.deletedAt = Date.now();
      appState.trash.push(project);
      
      if (utils.saveToStorage()) {
        renderBoard();
        updateStats();
        showNotification('Project moved to trash', 'success');
      }
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    showNotification('Error deleting project. Please try again.', 'error');
  }
}

function duplicateProject(projectId) {
  try {
    const original = appState.projects.find(p => p.id === projectId);
    if (!original) {
      showNotification('Project not found', 'error');
      return;
    }
    
    const duplicate = {
      ...JSON.parse(JSON.stringify(original)), // Deep clone
      id: utils.generateId(),
      title: original.title + ' (Copy)',
      createdAt: Date.now(),
      timeline: { [original.stage]: Date.now() },
      checklist: (original.checklist || []).map(item => ({
        id: utils.generateId(),
        text: item.text,
        done: false
      }))
    };
    
    appState.projects.push(duplicate);
    
    if (utils.saveToStorage()) {
      renderBoard();
      updateStats();
      showNotification('Project duplicated successfully', 'success');
    }
  } catch (error) {
    console.error('Error duplicating project:', error);
    showNotification('Error duplicating project. Please try again.', 'error');
  }
}

function moveProject(projectId, newStage) {
  try {
    const project = appState.projects.find(p => p.id === projectId);
    if (!project || project.stage === newStage) return;
    
    project.stage = newStage;
    project.timeline = project.timeline || {};
    project.timeline[newStage] = Date.now();
    
    if (utils.saveToStorage()) {
      renderBoard();
      updateStats();
      const stageName = CONFIG.stages.find(s => s.id === newStage)?.name || newStage;
      showNotification(`Project moved to ${stageName}`, 'success');
    }
  } catch (error) {
    console.error('Error moving project:', error);
    showNotification('Error moving project. Please try again.', 'error');
  }
}

// Enhanced Form Handling
function resetForm() {
  try {
    const form = document.getElementById('projectForm');
    if (form) form.reset();
    updateFormSelects();
    appState.currentChecklist = [];
    renderChecklist();
    
    // Show/hide action buttons appropriately
    const deleteBtn = document.getElementById('deleteBtn');
    const duplicateBtn = document.getElementById('duplicateBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';
    if (duplicateBtn) duplicateBtn.style.display = 'none';
  } catch (error) {
    console.error('Error resetting form:', error);
  }
}

function populateForm(project) {
  try {
    // Update form selects first to ensure options are available
    updateFormSelects();
    
    // Basic info
    const fields = [
      'projectTitle', 'projectClient', 'projectEditor', 'projectPlatform',
      'projectChannel', 'projectDue', 'projectUpload', 'projectPriority',
      'projectStage', 'projectColor', 'projectLinks', 'projectFootage',
      'projectNotes', 'projectHook', 'projectEnding', 'projectScript',
      'projectVoiceover', 'projectKeyShots', 'projectLocations',
      'projectMusic', 'projectEditNotes'
    ];
    
    const fieldMap = {
      projectTitle: 'title',
      projectClient: 'client',
      projectEditor: 'editor',
      projectPlatform: 'platform',
      projectChannel: 'channel',
      projectDue: 'due',
      projectUpload: 'uploadDate',
      projectPriority: 'priority',
      projectStage: 'stage',
      projectColor: 'color',
      projectLinks: 'links',
      projectFootage: 'rawFootage',
      projectNotes: 'notes',
      projectHook: 'hook',
      projectEnding: 'ending',
      projectScript: 'script',
      projectVoiceover: 'voiceover',
      projectKeyShots: 'keyShots',
      projectLocations: 'locations',
      projectMusic: 'music',
      projectEditNotes: 'editNotes'
    };
    
    fields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      const projectField = fieldMap[fieldId];
      if (element && projectField) {
        element.value = project[projectField] || '';
      }
    });
    
    // Show action buttons for existing projects
    const deleteBtn = document.getElementById('deleteBtn');
    const duplicateBtn = document.getElementById('duplicateBtn');
    if (deleteBtn) deleteBtn.style.display = '';
    if (duplicateBtn) duplicateBtn.style.display = '';
  } catch (error) {
    console.error('Error populating form:', error);
    showNotification('Error loading project data into form.', 'error');
  }
}

function updateFormSelects() {
  try {
    const selects = [
      { id: 'projectEditor', data: appState.editors, placeholder: 'Select Editor' },
      { id: 'projectPlatform', data: appState.platforms, placeholder: 'Select Platform' },
      { id: 'projectChannel', data: appState.channels, placeholder: 'Select Channel' }
    ];
    
    selects.forEach(({ id, data, placeholder }) => {
      const select = document.getElementById(id);
      if (select) {
        const currentValue = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>` +
          data.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
        if (currentValue && data.includes(currentValue)) {
          select.value = currentValue;
        }
      }
    });
    
    // Update stage select
    const stageSelect = document.getElementById('projectStage');
    if (stageSelect) {
      const currentValue = stageSelect.value;
      stageSelect.innerHTML = CONFIG.stages.map(stage => 
        `<option value="${stage.id}">${stage.name}</option>`).join('');
      if (currentValue) {
        stageSelect.value = currentValue;
      }
    }
    
    // Update color select
    const colorSelect = document.getElementById('projectColor');
    if (colorSelect) {
      const currentValue = colorSelect.value;
      colorSelect.innerHTML = CONFIG.cardColors.map(color => 
        `<option value="${color.value}">${color.name}</option>`).join('');
      if (currentValue) {
        colorSelect.value = currentValue;
      }
    }
  } catch (error) {
    console.error('Error updating form selects:', error);
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  try {
    const getFieldValue = (id) => {
      const element = document.getElementById(id);
      return element ? element.value.trim() : '';
    };
    
    const formData = {
      title: getFieldValue('projectTitle'),
      client: getFieldValue('projectClient'),
      editor: getFieldValue('projectEditor'),
      platform: getFieldValue('projectPlatform'),
      channel: getFieldValue('projectChannel'),
      due: getFieldValue('projectDue'),
      uploadDate: getFieldValue('projectUpload'),
      priority: getFieldValue('projectPriority') || 'MEDIUM',
      stage: getFieldValue('projectStage') || 'uploaded',
      color: getFieldValue('projectColor') || 'teal',
      links: getFieldValue('projectLinks'),
      rawFootage: getFieldValue('projectFootage'),
      notes: getFieldValue('projectNotes'),
      hook: getFieldValue('projectHook'),
      ending: getFieldValue('projectEnding'),
      script: getFieldValue('projectScript'),
      voiceover: getFieldValue('projectVoiceover'),
      keyShots: getFieldValue('projectKeyShots'),
      locations: getFieldValue('projectLocations'),
      music: getFieldValue('projectMusic'),
      editNotes: getFieldValue('projectEditNotes'),
      checklist: appState.currentChecklist.slice()
    };
    
    if (!formData.title) {
      showNotification('Please enter a project title', 'error');
      document.getElementById('projectTitle').focus();
      return;
    }
    
    if (appState.editingProject) {
      // Update existing project
      Object.assign(appState.editingProject, formData);
      showNotification('Project updated successfully', 'success');
    } else {
      // Create new project
      const newProject = {
        id: utils.generateId(),
        ...formData,
        createdAt: Date.now(),
        timeline: { [formData.stage]: Date.now() }
      };
      appState.projects.push(newProject);
      showNotification('Project created successfully', 'success');
    }
    
    // Add new items to lists if they don't exist
    const updated = updateListsFromForm(formData);
    
    if (utils.saveToStorage()) {
      closeModal();
      renderBoard();
      // Update dropdowns if new items were added
      if (updated) {
        utils.updateAllDropdowns();
      }
      updateStats();
    }
  } catch (error) {
    console.error('Error saving project:', error);
    showNotification('Error saving project. Please try again.', 'error');
  }
}

function updateListsFromForm(formData) {
  let updated = false;
  
  if (formData.editor && !appState.editors.includes(formData.editor)) {
    appState.editors.push(formData.editor);
    appState.editors.sort();
    updated = true;
  }
  if (formData.platform && !appState.platforms.includes(formData.platform)) {
    appState.platforms.push(formData.platform);
    appState.platforms.sort();
    updated = true;
  }
  if (formData.channel && !appState.channels.includes(formData.channel)) {
    appState.channels.push(formData.channel);
    appState.channels.sort();
    updated = true;
  }
  
  return updated;
}

function closeModal() {
  try {
    const modals = ['projectModal', 'manageModal', 'trashModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.add('hidden');
    });
    appState.editingProject = null;
  } catch (error) {
    console.error('Error closing modal:', error);
  }
}

// Enhanced Checklist Management
function renderChecklist() {
  const container = document.getElementById('checklistContainer');
  if (!container) return;
  
  try {
    if (appState.currentChecklist.length === 0) {
      container.innerHTML = '<p class="empty-checklist">No items yet. Add some above.</p>';
    } else {
      container.innerHTML = appState.currentChecklist.map(item => `
        <div class="checklist-item">
          <input type="checkbox" ${item.done ? 'checked' : ''} 
                 onchange="toggleChecklistItem('${item.id}')" />
          <input type="text" value="${escapeHtml(item.text)}" 
                 onchange="updateChecklistItem('${item.id}', this.value)" />
          <button type="button" class="btn-remove" onclick="removeChecklistItem('${item.id}')">×</button>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error rendering checklist:', error);
    container.innerHTML = '<p class="empty-checklist">Error loading checklist</p>';
  }
}

function addChecklistItem() {
  try {
    const input = document.getElementById('newChecklistItem');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    appState.currentChecklist.push({
      id: utils.generateId(),
      text: text,
      done: false
    });
    
    input.value = '';
    renderChecklist();
  } catch (error) {
    console.error('Error adding checklist item:', error);
  }
}

function toggleChecklistItem(itemId) {
  try {
    const item = appState.currentChecklist.find(i => i.id === itemId);
    if (item) {
      item.done = !item.done;
    }
  } catch (error) {
    console.error('Error toggling checklist item:', error);
  }
}

function updateChecklistItem(itemId, newText) {
  try {
    const item = appState.currentChecklist.find(i => i.id === itemId);
    if (item) {
      item.text = newText.trim();
    }
  } catch (error) {
    console.error('Error updating checklist item:', error);
  }
}

function removeChecklistItem(itemId) {
  try {
    appState.currentChecklist = appState.currentChecklist.filter(i => i.id !== itemId);
    renderChecklist();
  } catch (error) {
    console.error('Error removing checklist item:', error);
  }
}

// Enhanced Rendering Functions
function renderBoard() {
  try {
    const board = document.getElementById('kanbanBoard');
    if (!board) return;
    
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const editorFilter = document.getElementById('editorFilter')?.value || '';
    const platformFilter = document.getElementById('platformFilter')?.value || '';
    const channelFilter = document.getElementById('channelFilter')?.value || '';
    
    // Get role-filtered projects first, then apply other filters
    const roleFilteredProjects = roleUtils.getFilteredProjects();
    
    // Apply additional filters
    const filteredProjects = roleFilteredProjects.filter(project => {
      const matchesSearch = !searchTerm || 
        project.title.toLowerCase().includes(searchTerm) ||
        (project.client || '').toLowerCase().includes(searchTerm);
      const matchesEditor = !editorFilter || project.editor === editorFilter;
      const matchesPlatform = !platformFilter || project.platform === platformFilter;
      const matchesChannel = !channelFilter || project.channel === channelFilter;
      
      return matchesSearch && matchesEditor && matchesPlatform && matchesChannel;
    });
    
    // Group by stage
    const projectsByStage = CONFIG.stages.reduce((acc, stage) => {
      acc[stage.id] = filteredProjects.filter(p => p.stage === stage.id);
      return acc;
    }, {});
    
    // Check if user can add projects
    const canAddProjects = roleUtils.hasPermission('editAll') || appState.userRole === 'editor';
    
    // Render columns
    board.innerHTML = CONFIG.stages.map(stage => `
      <div class="column" style="border-top: 3px solid ${stage.color};">
        <div class="column-header" style="background: linear-gradient(135deg, ${stage.color}20, ${stage.color}10);">
          <span style="color: ${stage.color}; font-weight: 700;">${stage.name}</span>
          <span class="column-count" style="background: ${stage.color}30; color: ${stage.color}; border-color: ${stage.color}50;">${projectsByStage[stage.id].length}</span>
        </div>
        <div class="drop-zone" data-stage="${stage.id}" ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
          ${projectsByStage[stage.id].map(renderProjectCard).join('')}
          ${canAddProjects ? `<button class="btn secondary" onclick="addNewProject('${stage.id}')" style="margin-top: auto;">
            + Add Project
          </button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error rendering board:', error);
    showNotification('Error rendering board. Please refresh.', 'error');
  }
}

function renderProjectCard(project) {
  try {
    const dueDate = project.due ? new Date(project.due) : null;
    const isOverdue = dueDate && dueDate < new Date();
    const dueSoon = dueDate && utils.daysBetween(new Date(), dueDate) <= 3;
    
    const stageIndex = CONFIG.stages.findIndex(s => s.id === project.stage);
    const progress = ((stageIndex + 1) / CONFIG.stages.length) * 100;
    
    const completedTasks = (project.checklist || []).filter(item => item.done).length;
    const totalTasks = (project.checklist || []).length;
    
    // Check user permissions for this project
    const canEdit = roleUtils.canEditProject(project);
    const canDelete = roleUtils.hasPermission('deleteProjects');
    const canDuplicate = roleUtils.hasPermission('editAll') || appState.userRole === 'editor';
    
    // Determine if card should be draggable
    const isDraggable = canEdit;
    
    return `
      <div class="project-card ${project.color || 'teal'}" ${isDraggable ? 'draggable="true"' : ''} data-id="${project.id}" 
           ${isDraggable ? 'ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)"' : ''}
           ${isDraggable ? `ondblclick="quickComplete('${project.id}')"` : ''}>
        <div class="card-header">
          <h4 class="card-title">${escapeHtml(project.title)}</h4>
          <span class="priority ${project.priority.toLowerCase()}">${project.priority.charAt(0)}</span>
        </div>
        <div class="card-meta">
          ${project.client ? `<span class="meta-tag">${escapeHtml(project.client)}</span>` : ''}
          ${project.editor ? `<span class="meta-tag">👤 ${escapeHtml(project.editor)}</span>` : ''}
          ${project.platform ? `<span class="meta-tag">📱 ${escapeHtml(project.platform)}</span>` : ''}
          ${project.channel ? `<span class="meta-tag">📺 ${escapeHtml(project.channel)}</span>` : ''}
          ${project.due ? `<span class="meta-tag ${isOverdue ? 'overdue' : dueSoon ? 'due-soon' : ''}">📅 ${utils.formatDate(project.due)}</span>` : ''}
          ${project.uploadDate ? `<span class="meta-tag">📤 ${utils.formatDate(project.uploadDate)}</span>` : ''}
        </div>
        <div class="card-progress">
          <div class="progress-bar" style="width: ${progress}%"></div>
        </div>
        ${totalTasks > 0 ? `<div class="checklist-progress">${completedTasks}/${totalTasks} tasks completed</div>` : ''}
        <div class="card-actions">
          ${canEdit ? `<button class="icon-btn" onclick="editProject('${project.id}')" title="Edit">✏️</button>` : ''}
          ${canDuplicate ? `<button class="icon-btn" onclick="duplicateProject('${project.id}')" title="Duplicate">📋</button>` : ''}
          ${canDelete ? `<button class="icon-btn" onclick="deleteProject('${project.id}')" title="Delete">🗑️</button>` : ''}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering project card:', error);
    return '<div class="project-card">Error loading project</div>';
  }
}

function updateFilters() {
  try {
    const filters = [
      { id: 'editorFilter', data: appState.editors, label: 'All Editors' },
      { id: 'platformFilter', data: appState.platforms, label: 'All Platforms' },
      { id: 'channelFilter', data: appState.channels, label: 'All Channels' }
    ];
    
    filters.forEach(({ id, data, label }) => {
      const filter = document.getElementById(id);
      if (filter) {
        const currentValue = filter.value;
        filter.innerHTML = `<option value="">${label}</option>` +
          data.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
        if (currentValue && data.includes(currentValue)) {
          filter.value = currentValue;
        }
      }
    });
  } catch (error) {
    console.error('Error updating filters:', error);
  }
}

function updateStats() {
  try {
    // Use role-filtered projects for stats
    const filteredProjects = roleUtils.getFilteredProjects();
    const total = filteredProjects.length;
    const completed = filteredProjects.filter(p => p.stage === 'posted').length;
    
    // Calculate average cycle time
    const completedProjects = filteredProjects.filter(p => 
      p.stage === 'posted' && p.timeline && p.timeline.uploaded && p.timeline.posted
    );
    
    const avgDays = completedProjects.length > 0 
      ? Math.round(completedProjects.reduce((sum, p) => 
          sum + utils.daysBetween(p.timeline.uploaded, p.timeline.posted), 0
        ) / completedProjects.length)
      : 0;
    
    const updateStat = (id, value) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };
    
    updateStat('totalCount', total);
    updateStat('completedCount', completed);
    updateStat('avgDays', avgDays || '-');
    
    // Only show trash count for admin users
    if (roleUtils.hasPermission('manageTrash')) {
      updateStat('trashCount', appState.trash.length);
    }
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// Drag and Drop Functions
function handleDragStart(e) {
  try {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.classList.add('dragging');
  } catch (error) {
    console.error('Error starting drag:', error);
  }
}

function handleDragEnd(e) {
  try {
    e.target.classList.remove('dragging');
  } catch (error) {
    console.error('Error ending drag:', error);
  }
}

function handleDragOver(e) {
  try {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  } catch (error) {
    console.error('Error during drag over:', error);
  }
}

function handleDragLeave(e) {
  try {
    e.currentTarget.classList.remove('drag-over');
  } catch (error) {
    console.error('Error during drag leave:', error);
  }
}

function handleDrop(e) {
  try {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const projectId = e.dataTransfer.getData('text/plain');
    const newStage = e.currentTarget.dataset.stage;
    
    moveProject(projectId, newStage);
  } catch (error) {
    console.error('Error dropping item:', error);
  }
}

// Quick Actions
function quickComplete(projectId) {
  moveProject(projectId, 'posted');
}

function exportData() {
  try {
    const data = {
      projects: appState.projects,
      trash: appState.trash,
      editors: appState.editors,
      platforms: appState.platforms,
      channels: appState.channels,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mhm-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting data:', error);
    showNotification('Error exporting data', 'error');
  }
}

function importData() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.click();
}

// File input handling
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.projects && Array.isArray(data.projects)) {
            if (confirm('This will replace all current data. Continue?')) {
              appState.projects = data.projects;
              appState.trash = data.trash || [];
              appState.editors = data.editors || [...CONFIG.defaultEditors];
              appState.platforms = data.platforms || [...CONFIG.defaultPlatforms];
              appState.channels = data.channels || [...CONFIG.defaultChannels];
              
              if (utils.saveToStorage()) {
                renderBoard();
                utils.updateAllDropdowns();
                updateStats();
                showNotification('Data imported successfully!', 'success');
              }
            }
          } else {
            showNotification('Invalid file format', 'error');
          }
        } catch (error) {
          console.error('Error importing data:', error);
          showNotification('Error reading file: ' + error.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }
});

// Fixed Management Functions
function openManageModal() {
  try {
    renderManagementLists();
    document.getElementById('manageModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error opening manage modal:', error);
    showNotification('Error opening management interface', 'error');
  }
}

function renderManagementLists() {
  try {
    // Render editors list
    const editorsContainer = document.getElementById('manageEditors');
    if (editorsContainer) {
      editorsContainer.innerHTML = `
        <div class="manage-list-wrapper">
          <div class="manage-items-container">
            ${appState.editors.map((editor, index) => `
              <div class="manage-item" data-index="${index}">
                <span class="manage-item-text">${escapeHtml(editor)}</span>
                <button class="btn-remove" onclick="removeEditor('${escapeHtml(editor)}')" title="Remove ${escapeHtml(editor)}">×</button>
              </div>
            `).join('')}
          </div>
          <div class="manage-add">
            <input type="text" id="newEditor" placeholder="Add new editor" maxlength="50" />
            <button class="btn secondary" onclick="addEditor()">Add Editor</button>
          </div>
        </div>
      `;
    }
    
    // Render platforms list
    const platformsContainer = document.getElementById('managePlatforms');
    if (platformsContainer) {
      platformsContainer.innerHTML = `
        <div class="manage-list-wrapper">
          <div class="manage-items-container">
            ${appState.platforms.map((platform, index) => `
              <div class="manage-item" data-index="${index}">
                <span class="manage-item-text">${escapeHtml(platform)}</span>
                <button class="btn-remove" onclick="removePlatform('${escapeHtml(platform)}')" title="Remove ${escapeHtml(platform)}">×</button>
              </div>
            `).join('')}
          </div>
          <div class="manage-add">
            <input type="text" id="newPlatform" placeholder="Add new platform" maxlength="50" />
            <button class="btn secondary" onclick="addPlatform()">Add Platform</button>
          </div>
        </div>
      `;
    }
    
    // Render channels list
    const channelsContainer = document.getElementById('manageChannels');
    if (channelsContainer) {
      channelsContainer.innerHTML = `
        <div class="manage-list-wrapper">
          <div class="manage-items-container">
            ${appState.channels.map((channel, index) => `
              <div class="manage-item" data-index="${index}">
                <span class="manage-item-text">${escapeHtml(channel)}</span>
                <button class="btn-remove" onclick="removeChannel('${escapeHtml(channel)}')" title="Remove ${escapeHtml(channel)}">×</button>
              </div>
            `).join('')}
          </div>
          <div class="manage-add">
            <input type="text" id="newChannel" placeholder="Add new channel" maxlength="50" />
            <button class="btn secondary" onclick="addChannel()">Add Channel</button>
          </div>
        </div>
      `;
    }

    // Add enter key listeners for inputs
    ['newEditor', 'newPlatform', 'newChannel'].forEach(id => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (id === 'newEditor') addEditor();
            else if (id === 'newPlatform') addPlatform();
            else if (id === 'newChannel') addChannel();
          }
        });
      }
    });
  } catch (error) {
    console.error('Error rendering management lists:', error);
  }
}

// Editor management functions
function addEditor() {
  const input = document.getElementById('newEditor');
  const value = input.value.trim();
  if (value && !appState.editors.includes(value)) {
    appState.editors.push(value);
    appState.editors.sort();
    input.value = '';
    utils.saveToStorage();
    renderManagementLists();
    utils.updateAllDropdowns();
    showNotification(`Editor "${value}" added successfully`, 'success');
  } else if (appState.editors.includes(value)) {
    showNotification('Editor already exists', 'warning');
    input.focus();
  }
}

function removeEditor(editor) {
  if (confirm(`Remove "${editor}" from editors list?\n\nNote: This won't affect existing projects using this editor.`)) {
    appState.editors = appState.editors.filter(e => e !== editor);
    utils.saveToStorage();
    renderManagementLists();
    utils.updateAllDropdowns();
    showNotification(`Editor "${editor}" removed successfully`, 'success');
  }
}

// Platform management functions
function addPlatform() {
  const input = document.getElementById('newPlatform');
  const value = input.value.trim();
  if (value && !appState.platforms.includes(value)) {
    appState.platforms.push(value);
    appState.platforms.sort();
    input.value = '';
    utils.saveToStorage();
    renderManagementLists();
    utils.updateAllDropdowns();
    showNotification(`Platform "${value}" added successfully`, 'success');
  } else if (appState.platforms.includes(value)) {
    showNotification('Platform already exists', 'warning');
    input.focus();
  }
}

function removePlatform(platform) {
  if (confirm(`Remove "${platform}" from platforms list?\n\nNote: This won't affect existing projects using this platform.`)) {
    appState.platforms = appState.platforms.filter(p => p !== platform);
    utils.saveToStorage();
    renderManagementLists();
    utils.updateAllDropdowns();
    showNotification(`Platform "${platform}" removed successfully`, 'success');
  }
}

// Channel management functions
function addChannel() {
  const input = document.getElementById('newChannel');
  const value = input.value.trim();
  if (value && !appState.channels.includes(value)) {
    appState.channels.push(value);
    appState.channels.sort();
    input.value = '';
    utils.saveToStorage();
    renderManagementLists();
    utils.updateAllDropdowns();
    showNotification(`Channel "${value}" added successfully`, 'success');
  } else if (appState.channels.includes(value)) {
    showNotification('Channel already exists', 'warning');
    input.focus();
  }
}

function removeChannel(channel) {
  if (confirm(`Remove "${channel}" from channels list?\n\nNote: This won't affect existing projects using this channel.`)) {
    appState.channels = appState.channels.filter(c => c !== channel);
    utils.saveToStorage();
    renderManagementLists();
    utils.updateAllDropdowns();
    showNotification(`Channel "${channel}" removed successfully`, 'success');
  }
}

// Trash Management
function openTrash() {
  try {
    const trashList = document.getElementById('trashList');
    const trashModal = document.getElementById('trashModal');
    
    if (!trashList || !trashModal) return;
    
    if (appState.trash.length === 0) {
      trashList.innerHTML = '<p class="empty-state">Trash is empty</p>';
    } else {
      trashList.innerHTML = appState.trash.map(project => `
        <div class="trash-item">
          <div class="trash-item-info">
            <strong>${escapeHtml(project.title)}</strong>
            <br><small>${escapeHtml(project.client || 'No client')} • ${escapeHtml(project.editor || 'No editor')}</small>
          </div>
          <div class="trash-item-actions">
            <button class="btn secondary" onclick="restoreProject('${project.id}')">Restore</button>
            <button class="btn warning" onclick="permanentDelete('${project.id}')">Delete Forever</button>
          </div>
        </div>
      `).join('');
    }
    
    trashModal.classList.remove('hidden');
  } catch (error) {
    console.error('Error opening trash:', error);
    showNotification('Error opening trash', 'error');
  }
}

function closeTrash() {
  const trashModal = document.getElementById('trashModal');
  if (trashModal) trashModal.classList.add('hidden');
}

function restoreProject(projectId) {
  try {
    const projectIndex = appState.trash.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      const project = appState.trash.splice(projectIndex, 1)[0];
      delete project.deletedAt;
      appState.projects.push(project);
      
      if (utils.saveToStorage()) {
        renderBoard();
        updateStats();
        openTrash(); // Refresh trash view
        showNotification('Project restored successfully', 'success');
      }
    }
  } catch (error) {
    console.error('Error restoring project:', error);
    showNotification('Error restoring project', 'error');
  }
}

function permanentDelete(projectId) {
  try {
    if (confirm('Permanently delete this project? This cannot be undone.')) {
      appState.trash = appState.trash.filter(p => p.id !== projectId);
      
      if (utils.saveToStorage()) {
        updateStats();
        openTrash(); // Refresh trash view
        showNotification('Project deleted permanently', 'success');
      }
    }
  } catch (error) {
    console.error('Error permanently deleting project:', error);
    showNotification('Error deleting project', 'error');
  }
}

function emptyTrash() {
  try {
    if (confirm('Permanently delete ALL projects in trash? This cannot be undone.')) {
      appState.trash = [];
      
      if (utils.saveToStorage()) {
        updateStats();
        closeTrash();
        showNotification('Trash emptied successfully', 'success');
      }
    }
  } catch (error) {
    console.error('Error emptying trash:', error);
    showNotification('Error emptying trash', 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Auto-focus password input
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
      passwordInput.focus();
    }
    
    console.log('DOM loaded, ready for login');
    console.log('Password is:', CONFIG.password); // Debug - remove in production
  } catch (error) {
    console.error('Error during DOM load:', error);
  }
});