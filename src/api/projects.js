/**
 * Projects API Client (Firebase)
 * Handles project CRUD operations using Firestore
 */

import { v4 as uuidv4 } from 'uuid';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { getFirestoreDB, getStorageService, isFirebaseConfigured } from '../config/firebase.js';

class ProjectsAPI {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all projects
   */
  async listProjects() {
    if (!isFirebaseConfigured()) {
      console.warn('⚠️  Firebase not configured, returning demo projects');
      return this.getDemoProjects();
    }

    const cacheKey = 'projects_list';
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log('📦 Using cached projects');
        return cached.data;
      }
    }

    try {
      const db = getFirestoreDB();
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);

      const projects = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Cache the result
      this.cache.set(cacheKey, {
        data: projects,
        timestamp: Date.now(),
      });

      console.log(`✅ Fetched ${projects.length} projects`);
      return projects;
    } catch (err) {
      console.error('Error fetching projects:', err);
      throw err;
    }
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId) {
    if (!isFirebaseConfigured()) {
      console.warn('⚠️  Firebase not configured, returning demo project');
      const demos = this.getDemoProjects();
      return demos.find(p => p.id === projectId) || demos[0];
    }

    const cacheKey = `project_${projectId}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`📦 Using cached project ${projectId}`);
        return cached.data;
      }
    }

    try {
      const db = getFirestoreDB();
      const projectRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(projectRef);

      if (!docSnap.exists()) {
        throw new Error('Project not found');
      }

      const project = { id: docSnap.id, ...docSnap.data() };

      this.cache.set(cacheKey, {
        data: project,
        timestamp: Date.now(),
      });

      console.log(`✅ Fetched project ${projectId}`);
      return project;
    } catch (err) {
      console.error(`Error fetching project ${projectId}:`, err);
      throw err;
    }
  }

  /**
   * Create a new project
   */
  async createProject(projectData) {
    if (!isFirebaseConfigured()) {
      console.warn('⚠️  Firebase not configured, can\'t create project');
      throw new Error('Firebase not configured');
    }

    try {
      const db = getFirestoreDB();
      const projectsRef = collection(db, 'projects');

      const newProject = {
        name: projectData.name || 'Untitled Project',
        description: projectData.description || '',
        modelType: projectData.modelType || 'ifc',
        owner: projectData.owner || 'anonymous@vismo.local',
        storageUrl: null,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          fileSize: 0,
          meshCount: 0,
        },
      };

      const docRef = await addDoc(projectsRef, newProject);

      this.clearCache();
      console.log(`✅ Created project ${docRef.id}`);

      return { id: docRef.id, ...newProject };
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  }

  /**
   * Update project metadata
   */
  async updateProject(projectId, updates) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    try {
      const db = getFirestoreDB();
      const projectRef = doc(db, 'projects', projectId);

      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(projectRef, updateData);

      this.clearCache();
      console.log(`✅ Updated project ${projectId}`);

      return { id: projectId, ...updateData };
    } catch (err) {
      console.error(`Error updating project ${projectId}:`, err);
      throw err;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    try {
      const db = getFirestoreDB();
      const projectRef = doc(db, 'projects', projectId);

      await deleteDoc(projectRef);

      this.clearCache();
      console.log(`✅ Deleted project ${projectId}`);

      return true;
    } catch (err) {
      console.error(`Error deleting project ${projectId}:`, err);
      throw err;
    }
  }

  /**
   * Upload IFC file to Firebase Storage
   */
  async uploadProjectFile(projectId, file, onProgress = null) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    try {
      const storage = getStorageService();
      const fileName = `${projectId}/${file.name}`;
      const fileRef = ref(storage, `projects/${fileName}`);

      console.log(`📤 Uploading ${file.name} to Firebase Storage...`);

      const snapshot = await uploadBytes(fileRef, file, {
        customMetadata: {
          projectId,
          uploadedAt: new Date().toISOString(),
        },
      });

      console.log(`✅ File uploaded: ${snapshot.ref.fullPath}`);

      // Update project with storage URL
      await this.updateProject(projectId, {
        storageUrl: `gs://${snapshot.ref.bucket}/${snapshot.ref.fullPath}`,
        metadata: {
          fileSize: file.size,
        },
      });

      return {
        path: snapshot.ref.fullPath,
        bucket: snapshot.ref.bucket,
        size: file.size,
      };
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  }

  /**
   * Download IFC file from Firebase Storage
   */
  async downloadProjectFile(storagePath) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    try {
      const storage = getStorageService();
      const fileRef = ref(storage, storagePath);

      console.log(`📥 Downloading ${storagePath}...`);
      const bytes = await getBytes(fileRef);
      console.log(`✅ Downloaded ${bytes.length} bytes`);

      return bytes;
    } catch (err) {
      console.error('Error downloading file:', err);
      throw err;
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteProjectFile(storagePath) {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }

    try {
      const storage = getStorageService();
      const fileRef = ref(storage, storagePath);

      await deleteObject(fileRef);
      console.log(`✅ Deleted ${storagePath}`);

      return true;
    } catch (err) {
      console.error('Error deleting file:', err);
      throw err;
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️  Cache cleared');
  }

  /**
   * Get demo projects (when Firebase not configured)
   */
  getDemoProjects() {
    return [
      {
        id: 'demo-1',
        name: 'Welcome to Vismo',
        description: 'Configure Firebase to get started with real projects',
        modelType: 'ifc',
        owner: 'demo@vismo.local',
        storageUrl: null,
        thumbnailUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          fileSize: 0,
          meshCount: 0,
        },
      },
    ];
  }
}

// Export singleton instance
export const projectsAPI = new ProjectsAPI();

export default ProjectsAPI;
