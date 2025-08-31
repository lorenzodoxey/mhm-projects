// Enhanced Configuration with Multi-User Channel-Based Access Control
const CONFIG = {
  password: 'mhm2024', // Legacy password for migration
  storageKey: 'mhm-tracker-data-v3', // Updated storage key for multi-user system
  customRolesKey: 'mhm-custom-roles-v1', // Storage key for custom roles
  
  // Updated stages for video editing workflow
  stages: [
    { id: 'uploaded', name: 'Uploaded', color: '#00ffa3' },
    { id: 'assigned', name: 'Assigned', color: '#00d4ff' },
    { id: 'editing', name: 'Editing', color: '#ff6b35' },
    { id: 'revisions', name: 'Revisions', color: '#ffb347' },
    { id: 'final', name: 'Final', color: '#7c3aed' },
    { id: 'posted', name: 'Posted', color: '#10b981' }
  ],
  
  // Role-based user definitions with channel permissions (PRIMARY FOCUS)
  roles: {
    admin: {
      username: 'Admin',
      password: 'admin2024',
      permissions: {
        canEdit: true,
        canDelete: true,
        canCreate: true,
        canManageRoles: true,
        isViewOnly: false
      },
      channels: ['Main Brand', 'Clips Channel', 'Client Channel'], // Access to ALL channels
      platforms: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn'],
      editors: ['Mia', 'Leo', 'Kai']
    },
    mia: {
      username: 'Mia',
      password: 'mia2024',
      permissions: {
        canEdit: true,
        canDelete: true,
        canCreate: true,
        canManageRoles: false,
        isViewOnly: false
      },
      channels: ['Main Brand', 'Clips Channel'], // Limited channel access
      platforms: ['Instagram', 'TikTok', 'YouTube'], // Limited platform access
      editors: ['Mia'] // Can only assign to self
    },
    leo: {
      username: 'Leo',
      password: 'leo2024',
      permissions: {
        canEdit: true,
        canDelete: true,
        canCreate: true,
        canManageRoles: false,
        isViewOnly: false
      },
      channels: ['Client Channel', 'Main Brand'], // Limited channel access
      platforms: ['YouTube', 'Facebook', 'LinkedIn'], // Limited platform access
      editors: ['Leo'] // Can only assign to self
    },
    client: {
      username: 'Client',
      password: 'client2024',
      permissions: {
        canEdit: false,
        canDelete: false,
        canCreate: false,
        canManageRoles: false,
        isViewOnly: true
      },
      channels: ['Client Channel'], // Very limited channel access
      platforms: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn'], // Can view all platforms
      editors: ['Mia', 'Leo', 'Kai'] // Can see all editors but not edit
    }
  },
  
  defaultPlatforms: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn'],
  defaultEditors: ['Mia', 'Leo', 'Kai'],
  defaultChannels: ['Main Brand', 'Clips Channel', 'Client Channel'],
  cardColors: [
    { value: 'teal', name: 'Teal' },
    { value: 'coral', name: 'Coral' },
    { value: 'navy', name: 'Navy' },
    { value: 'purple', name: 'Purple' },
    { value: 'green', name: 'Green' }
  ]
};

// Enhanced Application State with Multi-User Support
let appState = {
  isLoggedIn: false,
  currentUser: null, // Current logged-in user object
  currentRole: null, // Current user's role key (admin, mia, leo, client)
  customRoles: {}, // Custom roles created by admin
  projects: [],
  trash: [],
  editors: [...CONFIG.defaultEditors],
  platforms: [...CONFIG.defaultPlatforms],
  channels: [...CONFIG.defaultChannels],
  editingProject: null,
  currentChecklist: [],
  lastSaveTime: null
};

// Enhanced Utility Functions with Multi-User Support and Channel Permissions
const utils = {
  generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
  
  formatDate: (date) => {
    try {
      return new Date(date).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  },
  
  // HTML escaping for security
  escapeHtml: (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  // User Permission Utilities
  getCurrentUser: () => appState.currentUser,
  getCurrentRole: () => appState.currentRole,
  
  // Channel Permission Checking (PRIMARY VALIDATION LAYER)
  hasChannelAccess: (channel) => {
    if (!appState.currentUser) return false;
    return appState.currentUser.channels.includes(channel);
  },
  
  getUserAccessibleChannels: () => {
    if (!appState.currentUser) return [];
    return appState.currentUser.channels;
  },
  
  getUserAccessiblePlatforms: () => {
    if (!appState.currentUser) return [];
    return appState.currentUser.platforms;
  },
  
  getUserAccessibleEditors: () => {
    if (!appState.currentUser) return [];
    return appState.currentUser.editors;
  },
  
  // Permission checking utilities
  canUserEdit: () => {
    return appState.currentUser && appState.currentUser.permissions.canEdit;
  },
  
  canUserDelete: () => {
    return appState.currentUser && appState.currentUser.permissions.canDelete;
  },
  
  canUserCreate: () => {
    return appState.currentUser && appState.currentUser.permissions.canCreate;
  },
  
  canUserManageRoles: () => {
    return appState.currentUser && appState.currentUser.permissions.canManageRoles;
  },
  
  isUserViewOnly: () => {
    return appState.currentUser && appState.currentUser.permissions.isViewOnly;
  },
  
  // Project channel validation (PRIMARY PROJECT FILTER)
  canUserAccessProject: (project) => {
    if (!project || !project.channel) return false;
    return utils.hasChannelAccess(project.channel);
  },
  
  // Get projects filtered by user's channel access
  getAccessibleProjects: () => {
    return appState.projects.filter(project => utils.canUserAccessProject(project));
  },
  
  daysBetween: (date1, date2) => {
    try {
      const diff = Math.abs(new Date(date2) - new Date(date1));
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  },
  
  // Custom role management
  loadCustomRoles: () => {
    try {
      const customRoles = JSON.parse(localStorage.getItem(CONFIG.customRolesKey)) || {};
      appState.customRoles = customRoles;
      return true;
    } catch (error) {
      console.error('Failed to load custom roles:', error);
      appState.customRoles = {};
      return false;
    }
  },
  
  saveCustomRoles: () => {
    try {
      localStorage.setItem(CONFIG.customRolesKey, JSON.stringify(appState.customRoles));
      return true;
    } catch (error) {
      console.error('Failed to save custom roles:', error);
      return false;
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
        version: '3.0' // Updated version for multi-user system
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

// Enhanced Multi-User Authentication Functions
function checkPassword() {
  const passwordInput = document.getElementById('passwordInput');
  const errorEl = document.getElementById('loginError');
  const password = passwordInput.value.trim();
  
  console.log('Checking password:', password); // Debug log
  
  // Check against all defined roles (including custom roles)
  const allRoles = { ...CONFIG.roles, ...appState.customRoles };
  let authenticatedRole = null;
  let authenticatedUser = null;
  
  // Check built-in roles
  for (const [roleKey, roleData] of Object.entries(allRoles)) {
    if (password === roleData.password) {
      authenticatedRole = roleKey;
      authenticatedUser = roleData;
      break;
    }
  }
  
  // Legacy password support (maps to admin)
  if (!authenticatedUser && password === CONFIG.password) {
    authenticatedRole = 'admin';
    authenticatedUser = CONFIG.roles.admin;
  }
  
  if (authenticatedUser) {
    // Set user state
    appState.isLoggedIn = true;
    appState.currentRole = authenticatedRole;
    appState.currentUser = authenticatedUser;
    
    // Hide login, show main app
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    errorEl.classList.add('hidden');
    
    // Initialize app with user context
    initializeApp();
    
    console.log('Login successful for user:', authenticatedUser.username);
    showNotification(`Welcome back, ${authenticatedUser.username}!`, 'success');
  } else {
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
    
    // Clear user state
    appState.isLoggedIn = false;
    appState.currentUser = null;
    appState.currentRole = null;
    
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('passwordInput').value = '';
    document.getElementById('loginError').classList.add('hidden');
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
    
    // Load custom roles first
    utils.loadCustomRoles();
    
    const loaded = utils.loadFromStorage();
    if (!loaded) {
      // Create sample data for new users
      createSampleData();
    }
    
    setupEventListeners();
    renderBoard(); // This will now filter by user's channel access
    utils.updateAllDropdowns(); // This will now filter by user's accessible options
    updateStats(); // This will now show stats for user's accessible projects
    updateUserInterface(); // New function to update UI based on user permissions
    
    // Show welcome message with user-specific info
    setTimeout(() => {
      const accessibleProjects = utils.getAccessibleProjects();
      const total = accessibleProjects.length;
      const channelCount = utils.getUserAccessibleChannels().length;
      showNotification(`Welcome ${appState.currentUser.username}! Access to ${channelCount} channels with ${total} projects.`, 'success');
    }, 1000);
    
    console.log('App initialized successfully for user:', appState.currentUser.username);
  } catch (error) {
    console.error('Error initializing app:', error);
    showNotification('Error initializing application. Please refresh and try again.', 'error');
  }
}

// Update UI based on user permissions and channel access
function updateUserInterface() {
  try {
    // Update header with user info
    updateHeaderUserInfo();
    
    // Show/hide buttons based on permissions
    updatePermissionBasedUI();
    
    // Filter all dropdowns by user access
    updateAccessBasedDropdowns();
    
  } catch (error) {
    console.error('Error updating user interface:', error);
  }
}

function updateHeaderUserInfo() {
  // Update or add user info to header
  let userInfo = document.getElementById('userInfo');
  if (!userInfo) {
    const header = document.querySelector('header .title');
    if (header) {
      userInfo = document.createElement('div');
      userInfo.id = 'userInfo';
      userInfo.className = 'user-info';
      header.appendChild(userInfo);
    }
  }
  
  if (userInfo && appState.currentUser) {
    userInfo.innerHTML = `
      <span class="user-name">👤 ${utils.escapeHtml(appState.currentUser.username)}</span>
      <span class="user-channels">📺 ${utils.getUserAccessibleChannels().join(', ')}</span>
    `;
  }
}

function updatePermissionBasedUI() {
  // Update buttons based on permissions
  const actionButtons = document.querySelectorAll('.btn');
  actionButtons.forEach(button => {
    const buttonText = button.textContent.toLowerCase();
    
    // Hide certain buttons for view-only users
    if (utils.isUserViewOnly()) {
      if (buttonText.includes('add') || buttonText.includes('manage') || 
          buttonText.includes('import') || buttonText.includes('export')) {
        button.style.display = 'none';
      }
    }
  });
  
  // Show admin panel button only for admins
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (adminPanelBtn) {
    adminPanelBtn.style.display = utils.canUserManageRoles() ? 'inline-block' : 'none';
  }
}

function updateAccessBasedDropdowns() {
  // This will be called to filter dropdowns by user access
  // Implementation will be added in the filter update functions
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
    
    // CHANNEL PERMISSION CHECK (PRIMARY SECURITY)
    if (!utils.canUserAccessProject(project)) {
      showNotification('You do not have access to this project channel', 'error');
      return;
    }
    
    // Additional permission check
    if (!utils.canUserEdit()) {
      showNotification('You do not have permission to edit projects', 'error');
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
      const project = appState.projects[projectIndex];
      
      // CHANNEL PERMISSION CHECK (PRIMARY SECURITY)
      if (!utils.canUserAccessProject(project)) {
        showNotification('You do not have access to this project channel', 'error');
        return;
      }
      
      // Additional permission check
      if (!utils.canUserDelete()) {
        showNotification('You do not have permission to delete projects', 'error');
        return;
      }
      
      appState.projects.splice(projectIndex, 1);
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
    
    // CHANNEL PERMISSION CHECK (PRIMARY SECURITY)
    if (!utils.canUserAccessProject(original)) {
      showNotification('You do not have access to this project channel', 'error');
      return;
    }
    
    // Additional permission check
    if (!utils.canUserCreate()) {
      showNotification('You do not have permission to create projects', 'error');
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
    // Use user-accessible data for form selects
    const selects = [
      { id: 'projectEditor', data: utils.getUserAccessibleEditors(), placeholder: 'Select Editor' },
      { id: 'projectPlatform', data: utils.getUserAccessiblePlatforms(), placeholder: 'Select Platform' },
      { id: 'projectChannel', data: utils.getUserAccessibleChannels(), placeholder: 'Select Channel' }
    ];
    
    selects.forEach(({ id, data, placeholder }) => {
      const select = document.getElementById(id);
      if (select) {
        const currentValue = select.value;
        select.innerHTML = `<option value="">${placeholder}</option>` +
          data.map(item => `<option value="${utils.escapeHtml(item)}">${utils.escapeHtml(item)}</option>`).join('');
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
    
    // CHANNEL PERMISSION VALIDATION (PRIMARY SECURITY CHECK)
    if (formData.channel && !utils.hasChannelAccess(formData.channel)) {
      showNotification('You do not have access to this channel', 'error');
      document.getElementById('projectChannel').focus();
      return;
    }
    
    // Additional permission checks
    if (appState.editingProject && !utils.canUserEdit()) {
      showNotification('You do not have permission to edit projects', 'error');
      return;
    }
    
    if (!appState.editingProject && !utils.canUserCreate()) {
      showNotification('You do not have permission to create projects', 'error');
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
    const modals = ['projectModal', 'manageModal', 'trashModal', 'adminModal'];
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
    
    // Start with user-accessible projects only (PRIMARY CHANNEL FILTER)
    const accessibleProjects = utils.getAccessibleProjects();
    
    // Apply additional filters
    const filteredProjects = accessibleProjects.filter(project => {
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
    
    // Render columns
    board.innerHTML = CONFIG.stages.map(stage => `
      <div class="column" style="border-top: 3px solid ${stage.color};">
        <div class="column-header" style="background: linear-gradient(135deg, ${stage.color}20, ${stage.color}10);">
          <span style="color: ${stage.color}; font-weight: 700;">${stage.name}</span>
          <span class="column-count" style="background: ${stage.color}30; color: ${stage.color}; border-color: ${stage.color}50;">${projectsByStage[stage.id].length}</span>
        </div>
        <div class="drop-zone" data-stage="${stage.id}" ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
          ${projectsByStage[stage.id].map(renderProjectCard).join('')}
          ${utils.canUserCreate() ? `<button class="btn secondary" onclick="addNewProject('${stage.id}')" style="margin-top: auto;">
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
    
    return `
      <div class="project-card ${project.color || 'teal'}" draggable="true" data-id="${project.id}" 
           ondragstart="handleDragStart(event)" ondragend="handleDragEnd(event)"
           ondblclick="quickComplete('${project.id}')">
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
          ${utils.canUserEdit() ? `<button class="icon-btn" onclick="editProject('${project.id}')" title="Edit">✏️</button>` : ''}
          ${utils.canUserCreate() ? `<button class="icon-btn" onclick="duplicateProject('${project.id}')" title="Duplicate">📋</button>` : ''}
          ${utils.canUserDelete() ? `<button class="icon-btn" onclick="deleteProject('${project.id}')" title="Delete">🗑️</button>` : ''}
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
    // Get user-accessible data for filters
    const accessibleEditors = utils.getUserAccessibleEditors();
    const accessiblePlatforms = utils.getUserAccessiblePlatforms();
    const accessibleChannels = utils.getUserAccessibleChannels();
    
    const filters = [
      { id: 'editorFilter', data: accessibleEditors, label: 'All Editors' },
      { id: 'platformFilter', data: accessiblePlatforms, label: 'All Platforms' },
      { id: 'channelFilter', data: accessibleChannels, label: 'All Channels' }
    ];
    
    filters.forEach(({ id, data, label }) => {
      const filter = document.getElementById(id);
      if (filter) {
        const currentValue = filter.value;
        filter.innerHTML = `<option value="">${label}</option>` +
          data.map(item => `<option value="${utils.escapeHtml(item)}">${utils.escapeHtml(item)}</option>`).join('');
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
    // Use only user-accessible projects for stats
    const accessibleProjects = utils.getAccessibleProjects();
    const total = accessibleProjects.length;
    const completed = accessibleProjects.filter(p => p.stage === 'posted').length;
    
    // Calculate average cycle time using accessible projects only
    const completedProjects = accessibleProjects.filter(p => 
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
    updateStat('trashCount', appState.trash.length);
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

// Admin Panel Functions (Channel-Based Role Management)
function openAdminPanel() {
  if (!utils.canUserManageRoles()) {
    showNotification('You do not have permission to manage roles', 'error');
    return;
  }
  
  try {
    renderAdminPanel();
    document.getElementById('adminModal').classList.remove('hidden');
  } catch (error) {
    console.error('Error opening admin panel:', error);
    showNotification('Error opening admin panel', 'error');
  }
}

function renderAdminPanel() {
  // Render built-in roles
  const builtinRolesList = document.getElementById('builtinRolesList');
  if (builtinRolesList) {
    builtinRolesList.innerHTML = Object.entries(CONFIG.roles).map(([roleKey, roleData]) => `
      <div class="role-item builtin-role">
        <div class="role-info">
          <h5>${utils.escapeHtml(roleData.username)} (${roleKey})</h5>
          <div class="role-details">
            <div class="role-channels"><strong>Channels:</strong> ${roleData.channels.join(', ')}</div>
            <div class="role-platforms"><strong>Platforms:</strong> ${roleData.platforms.join(', ')}</div>
            <div class="role-permissions">
              <strong>Permissions:</strong> 
              ${roleData.permissions.canEdit ? 'Edit' : ''} 
              ${roleData.permissions.canCreate ? 'Create' : ''} 
              ${roleData.permissions.canDelete ? 'Delete' : ''} 
              ${roleData.permissions.isViewOnly ? 'View-Only' : ''}
              ${roleData.permissions.canManageRoles ? 'Admin' : ''}
            </div>
          </div>
        </div>
        <span class="role-type">Built-in</span>
      </div>
    `).join('');
  }
  
  // Render custom roles
  const customRolesList = document.getElementById('customRolesList');
  if (customRolesList) {
    const customRoleEntries = Object.entries(appState.customRoles);
    if (customRoleEntries.length === 0) {
      customRolesList.innerHTML = '<p class="empty-state">No custom roles created</p>';
    } else {
      customRolesList.innerHTML = customRoleEntries.map(([roleKey, roleData]) => `
        <div class="role-item custom-role">
          <div class="role-info">
            <h5>${utils.escapeHtml(roleData.username)} (${roleKey})</h5>
            <div class="role-details">
              <div class="role-channels"><strong>Channels:</strong> ${roleData.channels.join(', ')}</div>
              <div class="role-platforms"><strong>Platforms:</strong> ${roleData.platforms.join(', ')}</div>
              <div class="role-permissions">
                <strong>Permissions:</strong> 
                ${roleData.permissions.canEdit ? 'Edit' : ''} 
                ${roleData.permissions.canCreate ? 'Create' : ''} 
                ${roleData.permissions.canDelete ? 'Delete' : ''} 
                ${roleData.permissions.isViewOnly ? 'View-Only' : ''}
              </div>
            </div>
          </div>
          <button class="btn warning btn-sm" onclick="deleteCustomRole('${roleKey}')">Delete</button>
        </div>
      `).join('');
    }
  }
  
  // Render access checkboxes
  renderAccessCheckboxes();
}

function renderAccessCheckboxes() {
  // Channel checkboxes
  const channelCheckboxes = document.getElementById('channelCheckboxes');
  if (channelCheckboxes) {
    channelCheckboxes.innerHTML = appState.channels.map(channel => `
      <label>
        <input type="checkbox" name="channels" value="${utils.escapeHtml(channel)}" checked>
        ${utils.escapeHtml(channel)}
      </label>
    `).join('');
  }
  
  // Platform checkboxes
  const platformCheckboxes = document.getElementById('platformCheckboxes');
  if (platformCheckboxes) {
    platformCheckboxes.innerHTML = appState.platforms.map(platform => `
      <label>
        <input type="checkbox" name="platforms" value="${utils.escapeHtml(platform)}" checked>
        ${utils.escapeHtml(platform)}
      </label>
    `).join('');
  }
  
  // Editor checkboxes
  const editorCheckboxes = document.getElementById('editorCheckboxes');
  if (editorCheckboxes) {
    editorCheckboxes.innerHTML = appState.editors.map(editor => `
      <label>
        <input type="checkbox" name="editors" value="${utils.escapeHtml(editor)}" checked>
        ${utils.escapeHtml(editor)}
      </label>
    `).join('');
  }
}

function createCustomRole() {
  try {
    const roleName = document.getElementById('newRoleName')?.value.trim();
    const password = document.getElementById('newRolePassword')?.value.trim();
    
    if (!roleName || !password) {
      showNotification('Please enter both role name and password', 'error');
      return;
    }
    
    // Check if role already exists
    const roleKey = roleName.toLowerCase().replace(/\s+/g, '');
    if (CONFIG.roles[roleKey] || appState.customRoles[roleKey]) {
      showNotification('Role already exists', 'error');
      return;
    }
    
    // Get selected permissions
    const permissions = {
      canEdit: document.getElementById('newRoleCanEdit')?.checked || false,
      canDelete: document.getElementById('newRoleCanDelete')?.checked || false,
      canCreate: document.getElementById('newRoleCanCreate')?.checked || false,
      canManageRoles: false, // Only built-in admin can manage roles
      isViewOnly: document.getElementById('newRoleViewOnly')?.checked || false
    };
    
    // Get selected channels
    const selectedChannels = Array.from(document.querySelectorAll('input[name="channels"]:checked'))
      .map(cb => cb.value);
    
    if (selectedChannels.length === 0) {
      showNotification('Please select at least one channel', 'error');
      return;
    }
    
    // Get selected platforms
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked'))
      .map(cb => cb.value);
    
    // Get selected editors
    const selectedEditors = Array.from(document.querySelectorAll('input[name="editors"]:checked'))
      .map(cb => cb.value);
    
    // Create the new role
    const newRole = {
      username: roleName,
      password: password,
      permissions: permissions,
      channels: selectedChannels,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : [...appState.platforms],
      editors: selectedEditors.length > 0 ? selectedEditors : [...appState.editors]
    };
    
    // Save the custom role
    appState.customRoles[roleKey] = newRole;
    if (utils.saveCustomRoles()) {
      showNotification(`Custom role "${roleName}" created successfully`, 'success');
      renderAdminPanel(); // Refresh the panel
      
      // Clear form
      document.getElementById('newRoleName').value = '';
      document.getElementById('newRolePassword').value = '';
    } else {
      showNotification('Error saving custom role', 'error');
    }
    
  } catch (error) {
    console.error('Error creating custom role:', error);
    showNotification('Error creating custom role', 'error');
  }
}

function deleteCustomRole(roleKey) {
  if (confirm(`Delete custom role "${roleKey}"? This cannot be undone.`)) {
    try {
      delete appState.customRoles[roleKey];
      if (utils.saveCustomRoles()) {
        showNotification(`Custom role "${roleKey}" deleted successfully`, 'success');
        renderAdminPanel(); // Refresh the panel
      } else {
        showNotification('Error deleting custom role', 'error');
      }
    } catch (error) {
      console.error('Error deleting custom role:', error);
      showNotification('Error deleting custom role', 'error');
    }
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