// Enhanced Configuration with Video Editing Workflow
const CONFIG = {
  password: 'mhm2024', // Change this password (backwards compatibility - admin access)
  storageKey: 'mhm-tracker-data-v3', // Updated storage key for role-based version
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
  // Role-based access control system
  roles: {
    admin: {
      name: 'Administrator',
      permissions: ['all'], // Full access to everything
      description: 'Full access to everything, can manage users, see all projects, manage all data'
    },
    editor: {
      name: 'Editor',
      permissions: ['view_assigned_projects', 'edit_assigned_projects', 'view_basic_lists'],
      description: 'Can see and edit projects assigned to them, limited access to certain features'
    },
    client: {
      name: 'Client',
      permissions: ['view_assigned_projects', 'view_assigned_channels'],
      description: 'Read-only access to specific projects/channels assigned to them'
    },
    viewer: {
      name: 'Viewer',
      permissions: ['view_basic_info'],
      description: 'Read-only access to basic project information'
    }
  },
  // Default users (admin password provides backwards compatibility)
  defaultUsers: [
    {
      id: 'admin',
      username: 'Admin',
      password: 'mhm2024',
      role: 'admin',
      assignedEditors: [],
      assignedChannels: [],
      assignedClients: []
    }
  ]
};

// Enhanced Application State with better error handling
let appState = {
  isLoggedIn: false,
  currentUser: null, // Current logged-in user object
  userRole: null, // Current user role
  userPermissions: [], // Current user permissions
  projects: [],
  trash: [],
  editors: [...CONFIG.defaultEditors],
  platforms: [...CONFIG.defaultPlatforms],
  channels: [...CONFIG.defaultChannels],
  users: [...CONFIG.defaultUsers], // User management
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
        users: appState.users, // Include users in saved data
        lastSaved: Date.now(),
        version: '3.0' // Updated version for role-based system
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
        appState.users = Array.isArray(data.users) ? data.users : [...CONFIG.defaultUsers];
        
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
const rbac = {
  // Check if current user has a specific permission
  hasPermission: (permission) => {
    if (!appState.currentUser || !appState.userPermissions) return false;
    if (appState.userPermissions.includes('all')) return true;
    return appState.userPermissions.includes(permission);
  },

  // Check if current user can view a specific project
  canViewProject: (project) => {
    if (rbac.hasPermission('all')) return true;
    if (!rbac.hasPermission('view_assigned_projects')) return false;
    
    const user = appState.currentUser;
    if (!user) return false;

    // Editor role: can view projects assigned to them
    if (appState.userRole === 'editor') {
      return user.assignedEditors.includes(project.editor);
    }
    
    // Client role: can view projects from assigned channels or clients
    if (appState.userRole === 'client') {
      return user.assignedChannels.includes(project.channel) || 
             user.assignedClients.includes(project.client);
    }
    
    // Viewer role: can view all basic info
    if (appState.userRole === 'viewer') {
      return rbac.hasPermission('view_basic_info');
    }
    
    return false;
  },

  // Check if current user can edit a specific project
  canEditProject: (project) => {
    if (rbac.hasPermission('all')) return true;
    if (!rbac.hasPermission('edit_assigned_projects')) return false;
    
    const user = appState.currentUser;
    if (!user || appState.userRole !== 'editor') return false;
    
    return user.assignedEditors.includes(project.editor);
  },

  // Get filtered projects based on user permissions
  getFilteredProjects: () => {
    if (rbac.hasPermission('all')) return appState.projects;
    
    return appState.projects.filter(project => rbac.canViewProject(project));
  },

  // Check if current user can access management features
  canAccessManagement: () => {
    return rbac.hasPermission('all');
  },

  // Set user role and permissions
  setUserRole: (user) => {
    appState.currentUser = user;
    appState.userRole = user.role;
    appState.userPermissions = CONFIG.roles[user.role]?.permissions || [];
  }
};

// Fixed Authentication Functions
function checkPassword() {
  const passwordInput = document.getElementById('passwordInput');
  const errorEl = document.getElementById('loginError');
  const password = passwordInput.value.trim();
  
  console.log('Checking password:', password); // Debug log
  
  // Check if password matches any user (including backwards compatibility)
  let matchedUser = null;
  
  // First check backwards compatibility with admin password
  if (password === CONFIG.password) {
    matchedUser = appState.users.find(u => u.role === 'admin') || CONFIG.defaultUsers[0];
  } else {
    // Check against all users
    matchedUser = appState.users.find(u => u.password === password);
  }
  
  if (matchedUser) {
    appState.isLoggedIn = true;
    rbac.setUserRole(matchedUser);
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    errorEl.classList.add('hidden');
    
    initializeApp();
    console.log('Login successful as', matchedUser.role, '-', matchedUser.username);
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
    appState.isLoggedIn = false;
    appState.currentUser = null;
    appState.userRole = null;
    appState.userPermissions = [];
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

// Update UI based on user role and permissions
function updateUIForRole() {
  const userRoleIndicator = document.getElementById('userRoleIndicator');
  if (userRoleIndicator && appState.currentUser) {
    const roleName = CONFIG.roles[appState.userRole]?.name || appState.userRole;
    userRoleIndicator.textContent = `${appState.currentUser.username} (${roleName})`;
    userRoleIndicator.className = `user-role role-${appState.userRole}`;
  }
  
  // Hide/show management features based on permissions
  const manageBtn = document.querySelector('button[onclick="openManageModal()"]');
  const exportBtn = document.querySelector('button[onclick="exportData()"]');
  const importBtn = document.querySelector('button[onclick="importData()"]');
  const trashBtn = document.querySelector('button[onclick="openTrash()"]');
  const addProjectBtns = document.querySelectorAll('button[onclick="addNewProject()"], button[onclick*="addNewProject"]');
  
  const canManage = rbac.canAccessManagement();
  const canEdit = rbac.hasPermission('all') || rbac.hasPermission('edit_assigned_projects');
  
  if (manageBtn) manageBtn.style.display = canManage ? 'inline-block' : 'none';
  if (exportBtn) exportBtn.style.display = canManage ? 'inline-block' : 'none';
  if (importBtn) importBtn.style.display = canManage ? 'inline-block' : 'none';
  if (trashBtn) trashBtn.style.display = canManage ? 'inline-block' : 'none';
  
  // Hide add project buttons for read-only roles (client, viewer)
  addProjectBtns.forEach(btn => {
    if (btn) btn.style.display = canEdit ? 'inline-block' : 'none';
  });
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
    
    setupEventListeners();
    updateUIForRole(); // Update UI based on user role
    renderBoard();
    utils.updateAllDropdowns();
    updateStats();
    
    // Show welcome message
    setTimeout(() => {
      const total = rbac.getFilteredProjects().length;
      const roleName = CONFIG.roles[appState.userRole]?.name || 'User';
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
    
    // Get role-based filtered projects first
    const accessibleProjects = rbac.getFilteredProjects();
    
    // Then apply UI filters
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
          ${rbac.hasPermission('all') || rbac.hasPermission('edit_assigned_projects') ? `
          <button class="btn secondary" onclick="addNewProject('${stage.id}')" style="margin-top: auto;">
            + Add Project
          </button>
          ` : ''}
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
        ${rbac.hasPermission('all') || rbac.hasPermission('edit_assigned_projects') || rbac.hasPermission('view_assigned_projects') ? `
        <div class="card-actions">
          ${rbac.canEditProject(project) ? `<button class="icon-btn" onclick="editProject('${project.id}')" title="Edit">✏️</button>` : ''}
          ${rbac.hasPermission('all') ? `<button class="icon-btn" onclick="duplicateProject('${project.id}')" title="Duplicate">📋</button>` : ''}
          ${rbac.hasPermission('all') ? `<button class="icon-btn" onclick="deleteProject('${project.id}')" title="Delete">🗑️</button>` : ''}
        </div>
        ` : ''}
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
    const accessibleProjects = rbac.getFilteredProjects();
    const total = accessibleProjects.length;
    const completed = accessibleProjects.filter(p => p.stage === 'posted').length;
    
    // Calculate average cycle time
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
    // Show/hide user management section based on permissions
    const usersSection = document.getElementById('usersSection');
    if (usersSection) {
      usersSection.style.display = rbac.hasPermission('all') ? 'block' : 'none';
    }
    
    // Render users list (admin only)
    const usersContainer = document.getElementById('manageUsers');
    if (usersContainer && rbac.hasPermission('all')) {
      usersContainer.innerHTML = `
        <div class="manage-list-wrapper">
          <div class="manage-items-container">
            ${appState.users.map((user, index) => `
              <div class="manage-item user-item" data-index="${index}">
                <div class="user-info">
                  <span class="manage-item-text">${escapeHtml(user.username)}</span>
                  <span class="user-role role-${user.role}">${CONFIG.roles[user.role]?.name || user.role}</span>
                  ${user.role !== 'admin' && user.role !== 'viewer' ? `
                    <div class="user-assignments">
                      ${user.role === 'editor' ? `Editors: ${user.assignedEditors.join(', ') || 'None'}` : ''}
                      ${user.role === 'client' ? `Channels: ${user.assignedChannels.join(', ') || 'None'} | Clients: ${user.assignedClients.join(', ') || 'None'}` : ''}
                    </div>
                  ` : ''}
                </div>
                <div class="user-actions">
                  ${user.role !== 'admin' && user.role !== 'viewer' ? `<button class="btn-edit" onclick="editUserAssignments('${user.id}')" title="Edit assignments">⚙️</button>` : ''}
                  ${user.id !== 'admin' ? `<button class="btn-remove" onclick="removeUser('${user.id}')" title="Remove ${escapeHtml(user.username)}">×</button>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          <div class="manage-add">
            <button class="btn primary" onclick="openAddUserDialog()">Add User</button>
          </div>
        </div>
      `;
    }
    
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

// User management functions (admin only)
function openAddUserDialog() {
  if (!rbac.hasPermission('all')) {
    showNotification('Access denied: Admin permissions required', 'error');
    return;
  }
  
  const username = prompt('Enter username:');
  if (!username) return;
  
  const password = prompt('Enter password:');
  if (!password) return;
  
  const role = prompt('Enter role (admin, editor, client, viewer):');
  if (!role || !CONFIG.roles[role]) {
    showNotification('Invalid role. Valid roles: admin, editor, client, viewer', 'error');
    return;
  }
  
  // Check if user already exists
  if (appState.users.find(u => u.username === username)) {
    showNotification('Username already exists', 'error');
    return;
  }
  
  const newUser = {
    id: utils.generateId(),
    username: username.trim(),
    password: password.trim(),
    role: role.trim(),
    assignedEditors: [],
    assignedChannels: [],
    assignedClients: []
  };
  
  appState.users.push(newUser);
  utils.saveToStorage();
  renderManagementLists();
  showNotification(`User "${username}" added successfully`, 'success');
}

function removeUser(userId) {
  if (!rbac.hasPermission('all')) {
    showNotification('Access denied: Admin permissions required', 'error');
    return;
  }
  
  const user = appState.users.find(u => u.id === userId);
  if (!user) return;
  
  if (user.id === 'admin') {
    showNotification('Cannot remove admin user', 'error');
    return;
  }
  
  if (confirm(`Remove user "${user.username}"?\n\nThis will permanently delete their access.`)) {
    appState.users = appState.users.filter(u => u.id !== userId);
    utils.saveToStorage();
    renderManagementLists();
    showNotification(`User "${user.username}" removed successfully`, 'success');
  }
}

function editUserAssignments(userId) {
  if (!rbac.hasPermission('all')) {
    showNotification('Access denied: Admin permissions required', 'error');
    return;
  }
  
  const user = appState.users.find(u => u.id === userId);
  if (!user) return;
  
  if (user.role === 'admin') {
    showNotification('Admin users do not require assignments', 'info');
    return;
  }
  
  let assignmentText = '';
  if (user.role === 'editor') {
    assignmentText = `Current assigned editors: ${user.assignedEditors.join(', ') || 'None'}\n\nEnter editors this user can manage (comma-separated):`;
    const assignments = prompt(assignmentText, user.assignedEditors.join(', '));
    if (assignments !== null) {
      user.assignedEditors = assignments.split(',').map(s => s.trim()).filter(s => s);
    }
  } else if (user.role === 'client') {
    assignmentText = `Current assigned channels: ${user.assignedChannels.join(', ') || 'None'}\nCurrent assigned clients: ${user.assignedClients.join(', ') || 'None'}\n\nEnter channels this user can view (comma-separated):`;
    const channels = prompt(assignmentText, user.assignedChannels.join(', '));
    if (channels !== null) {
      user.assignedChannels = channels.split(',').map(s => s.trim()).filter(s => s);
      
      const clientText = `Enter client names this user can view (comma-separated):`;
      const clients = prompt(clientText, user.assignedClients.join(', '));
      if (clients !== null) {
        user.assignedClients = clients.split(',').map(s => s.trim()).filter(s => s);
      }
    }
  }
  
  utils.saveToStorage();
  renderManagementLists();
  showNotification(`Assignments updated for ${user.username}`, 'success');
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