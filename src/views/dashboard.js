/**
 * Dashboard View
 * Displays project grid and project management interface
 */

import { projectsAPI } from '../api/projects.js';
import { router } from '../utils/router.js';

export class Dashboard {
  constructor() {
    this.projects = [];
    this.currentUser = this.loadUser();
    this.isLoading = false;
  }

  /**
   * Load user profile from localStorage
   */
  loadUser() {
    const userJson = localStorage.getItem('vismo_user');
    if (!userJson) {
      return {
        email: 'anonymous@vismo.local',
        name: 'Anonymous User',
        createdAt: new Date().toISOString(),
      };
    }
    return JSON.parse(userJson);
  }

  /**
   * Initialize and render the dashboard
   */
  async init() {
    console.log('🚀 Initializing Dashboard');

    // Get or create app container
    let appContainer = document.getElementById('app');
    if (!appContainer) {
      const body = document.body;
      appContainer = document.createElement('div');
      appContainer.id = 'app';
      body.insertBefore(appContainer, body.firstChild);
    }

    // Render dashboard HTML
    appContainer.innerHTML = this.render();

    // Attach event listeners
    this.attachEventListeners();

    // Load projects
    await this.loadProjects();

    console.log('✅ Dashboard initialized');
  }

  /**
   * Render dashboard HTML
   */
  render() {
    return `
      <div class="dashboard-container">
        <!-- Header -->
        <header class="dashboard-header">
          <div class="header-content">
            <h1 class="dashboard-title">Vismo 3D Viewer</h1>
            <p class="dashboard-subtitle">Project Management Dashboard</p>
          </div>

          <!-- User Profile Section -->
          <div class="user-profile">
            <button class="user-profile-btn" id="user-menu-btn">
              <span class="user-initial">${this.currentUser.name.charAt(0).toUpperCase()}</span>
              <span class="user-name">${this.currentUser.name}</span>
            </button>
            <div class="user-menu" id="user-menu" style="display: none;">
              <div class="user-menu-item user-info">
                <strong>${this.currentUser.name}</strong>
                <small>${this.currentUser.email}</small>
              </div>
              <hr />
              <button class="user-menu-item" id="settings-btn">
                ⚙️ Settings
              </button>
              <button class="user-menu-item" id="logout-btn">
                🚪 Logout
              </button>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="dashboard-main">
          <!-- Projects Section -->
          <section class="projects-section">
            <div class="section-header">
              <h2>Your Projects</h2>
              <button class="btn-primary" id="new-project-btn">
                + New Project
              </button>
            </div>

            <!-- Projects Grid -->
            <div class="projects-grid" id="projects-grid">
              <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading projects...</p>
              </div>
            </div>
          </section>
        </main>

        <!-- Upload Modal -->
        <div class="modal" id="upload-modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Create New Project</h2>
              <button class="modal-close" id="modal-close">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label for="project-name">Project Name</label>
                <input
                  type="text"
                  id="project-name"
                  placeholder="e.g., Office Building Renovation"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="project-description">Description (optional)</label>
                <textarea
                  id="project-description"
                  placeholder="Describe your project..."
                  class="form-input"
                  rows="3"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="project-file">IFC Model File</label>
                <div class="file-upload-area" id="file-upload-area">
                  <div class="upload-icon">📁</div>
                  <p>Drag & drop your IFC file here, or click to select</p>
                  <small>Supported: .ifc, .glb, .gltf, .las, .laz</small>
                  <input
                    type="file"
                    id="project-file"
                    accept=".ifc,.glb,.gltf,.las,.laz"
                    style="display: none;"
                  />
                </div>
                <div class="file-info" id="file-info" style="display: none;">
                  <p id="file-name"></p>
                  <p id="file-size"></p>
                </div>
              </div>

              <div class="upload-progress" id="upload-progress" style="display: none;">
                <div class="progress-bar">
                  <div class="progress-fill" id="progress-fill"></div>
                </div>
                <p id="progress-text">0%</p>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" id="modal-cancel">Cancel</button>
              <button class="btn-primary" id="modal-create" disabled>Create Project</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // New project button
    document.getElementById('new-project-btn')?.addEventListener('click', () => {
      this.showUploadModal();
    });

    // Modal close button
    document.getElementById('modal-close')?.addEventListener('click', () => {
      this.closeUploadModal();
    });

    // Modal cancel button
    document.getElementById('modal-cancel')?.addEventListener('click', () => {
      this.closeUploadModal();
    });

    // File upload area
    const fileUploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('project-file');

    fileUploadArea?.addEventListener('click', () => {
      fileInput?.click();
    });

    // Drag and drop
    fileUploadArea?.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadArea.classList.add('dragover');
    });

    fileUploadArea?.addEventListener('dragleave', () => {
      fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea?.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadArea.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    // File input change
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelection(e.target.files[0]);
      }
    });

    // Create project button
    document.getElementById('modal-create')?.addEventListener('click', () => {
      this.createProject();
    });

    // User menu toggle
    document.getElementById('user-menu-btn')?.addEventListener('click', () => {
      const menu = document.getElementById('user-menu');
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });

    // User menu items
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      router.navigate('/profile');
    });

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.logout();
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const userProfile = document.querySelector('.user-profile');
      if (!userProfile?.contains(e.target)) {
        document.getElementById('user-menu').style.display = 'none';
      }
    });
  }

  /**
   * Load and display projects
   */
  async loadProjects() {
    try {
      this.isLoading = true;
      this.projects = await projectsAPI.listProjects();
      this.renderProjects();
    } catch (err) {
      console.error('Error loading projects:', err);
      this.showError('Failed to load projects. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render projects grid
   */
  renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    if (this.projects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No projects yet</h3>
          <p>Create your first BIM project to get started</p>
          <button class="btn-primary" id="empty-new-project-btn">
            + New Project
          </button>
        </div>
      `;
      document.getElementById('empty-new-project-btn')?.addEventListener('click', () => {
        this.showUploadModal();
      });
      return;
    }

    grid.innerHTML = this.projects.map(project => `
      <div class="project-card" data-project-id="${project.id}">
        <div class="project-thumbnail">
          ${project.thumbnailUrl ? `
            <img src="${project.thumbnailUrl}" alt="${project.name}" />
          ` : `
            <div class="thumbnail-placeholder">
              <span class="file-icon">📐</span>
            </div>
          `}
        </div>
        <div class="project-info">
          <h3>${project.name}</h3>
          <p class="project-description">${project.description || 'No description'}</p>
          <div class="project-meta">
            <span class="project-type">${project.modelType?.toUpperCase() || 'BIM'}</span>
            <span class="project-date">${new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="project-actions">
          <button class="btn-view" title="Open in viewer">👁️ View</button>
          <button class="btn-delete" title="Delete project">🗑️</button>
        </div>
      </div>
    `).join('');

    // Attach project card listeners
    document.querySelectorAll('.project-card').forEach(card => {
      const projectId = card.dataset.projectId;
      card.querySelector('.btn-view')?.addEventListener('click', () => {
        this.openProject(projectId);
      });
      card.querySelector('.btn-delete')?.addEventListener('click', () => {
        this.deleteProject(projectId);
      });
      // Click anywhere on card to open
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.project-actions')) {
          this.openProject(projectId);
        }
      });
    });
  }

  /**
   * Handle file selection
   */
  handleFileSelection(file) {
    const fileInput = document.getElementById('project-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');

    fileInput.files = file; // Update hidden input

    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    fileName.textContent = file.name;
    fileSize.textContent = `${sizeInMB} MB`;
    fileInfo.style.display = 'block';

    // Enable create button
    const createBtn = document.getElementById('modal-create');
    const projectName = document.getElementById('project-name').value.trim();
    if (projectName && file) {
      createBtn.disabled = false;
    }
  }

  /**
   * Show upload modal
   */
  showUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }

  /**
   * Close upload modal
   */
  closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    // Reset form
    document.getElementById('project-name').value = '';
    document.getElementById('project-description').value = '';
    document.getElementById('project-file').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('modal-create').disabled = true;
  }

  /**
   * Create a new project
   */
  async createProject() {
    const projectName = document.getElementById('project-name').value.trim();
    const projectDesc = document.getElementById('project-description').value.trim();
    const fileInput = document.getElementById('project-file');
    const file = fileInput.files[0];

    if (!projectName || !file) {
      alert('Please fill in project name and select a file');
      return;
    }

    try {
      // Show progress
      const uploadProgress = document.getElementById('upload-progress');
      const progressFill = document.getElementById('progress-fill');
      const progressText = document.getElementById('progress-text');
      uploadProgress.style.display = 'block';

      // Create project
      const project = await projectsAPI.createProject({
        name: projectName,
        description: projectDesc,
        modelType: file.name.split('.').pop().toLowerCase(),
      });

      console.log('✅ Project created:', project.id);

      // Upload file to Firebase Storage
      progressText.textContent = 'Uploading file...';
      progressFill.style.width = '50%';

      await projectsAPI.uploadProjectFile(project.id, file);

      progressFill.style.width = '100%';
      progressText.textContent = '100%';

      console.log('✅ File uploaded!');
      alert(`Project "${projectName}" created successfully!`);

      this.closeUploadModal();
      await this.loadProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      alert(`Failed: ${err.message}`);
    } finally {
      document.getElementById('upload-progress').style.display = 'none';
    }
  }

  /**
   * Open project in viewer
   */
  openProject(projectId) {
    console.log(`📂 Opening project ${projectId}`);
    router.navigate('/viewer/:id', { id: projectId });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await projectsAPI.deleteProject(projectId);
      console.log('✅ Project deleted');
      await this.loadProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const grid = document.getElementById('projects-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Error</h3>
          <p>${message}</p>
          <button class="btn-primary" id="retry-btn">Retry</button>
        </div>
      `;
      document.getElementById('retry-btn')?.addEventListener('click', () => {
        this.loadProjects();
      });
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('vismo_user');
    this.currentUser = { email: 'anonymous@vismo.local', name: 'Anonymous User' };
    alert('Logged out. Redirecting to dashboard...');
    router.navigate('/');
  }

  /**
   * Cleanup when view is unloaded
   */
  cleanup() {
    console.log('🧹 Cleaning up Dashboard');
    // Remove event listeners if needed
  }
}

// Export singleton instance
export const dashboard = new Dashboard();
