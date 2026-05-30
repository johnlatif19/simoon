// ============================================
// Firebase Database Configuration
// رحلة في مصر - Journey in Egypt
// ============================================

const admin = require('firebase-admin');

// Cache for database instance
let db = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Uses FIREBASE_CONFIG from environment variables
 */
function initializeFirebase() {
  if (isInitialized) {
    return db;
  }

  try {
    // Check if Firebase config exists in environment
    const firebaseConfig = process.env.FIREBASE_CONFIG;
    
    if (!firebaseConfig) {
      console.warn('⚠️ FIREBASE_CONFIG not found in environment variables');
      console.warn('⚠️ Using in-memory storage fallback');
      return null;
    }

    // Parse Firebase config JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(firebaseConfig);
    } catch (parseError) {
      console.error('❌ Failed to parse FIREBASE_CONFIG JSON:', parseError.message);
      return null;
    }

    // Check if already initialized
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } else {
      console.log('✅ Firebase already initialized, using existing instance');
    }

    // Get Firestore instance
    db = admin.firestore();
    
    // Optional: Set Firestore settings for better performance
    db.settings({
      ignoreUndefinedProperties: true
    });

    isInitialized = true;
    console.log('✅ Firestore database connection established');
    
    return db;
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('❌ Details:', error);
    return null;
  }
}

/**
 * Get Firestore database instance
 * @returns {Firestore|null} Firestore instance or null if not connected
 */
function getDB() {
  if (!db) {
    return initializeFirebase();
  }
  return db;
}

/**
 * Check if Firestore is connected
 * @returns {boolean}
 */
function isConnected() {
  return db !== null && isInitialized;
}

/**
 * Get a collection reference
 * @param {string} collectionName - Name of the collection
 * @returns {CollectionReference|null}
 */
function getCollection(collectionName) {
  const database = getDB();
  if (!database) return null;
  return database.collection(collectionName);
}

/**
 * Create a document in a collection
 * @param {string} collectionName - Collection name
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Created document with id
 */
async function createDocument(collectionName, data) {
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error('Firestore not connected');
  }

  const docRef = await collection.add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const doc = await docRef.get();
  return {
    id: docRef.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
  };
}

/**
 * Get a document by ID
 * @param {string} collectionName - Collection name
 * @param {string} id - Document ID
 * @returns {Promise<Object|null>}
 */
async function getDocument(collectionName, id) {
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error('Firestore not connected');
  }

  const doc = await collection.doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
    updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt
  };
}

/**
 * Get all documents from a collection with optional filters
 * @param {string} collectionName - Collection name
 * @param {Array} filters - Array of {field, operator, value} filters
 * @param {Object} options - {orderBy, orderDirection, limit}
 * @returns {Promise<Array>}
 */
async function getDocuments(collectionName, filters = [], options = {}) {
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error('Firestore not connected');
  }

  let query = collection;

  // Apply filters
  filters.forEach(filter => {
    query = query.where(filter.field, filter.operator, filter.value);
  });

  // Apply ordering
  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
  }

  // Apply limit
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt
    };
  });
}

/**
 * Update a document
 * @param {string} collectionName - Collection name
 * @param {string} id - Document ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>}
 */
async function updateDocument(collectionName, id, data) {
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error('Firestore not connected');
  }

  await collection.doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return getDocument(collectionName, id);
}

/**
 * Delete a document
 * @param {string} collectionName - Collection name
 * @param {string} id - Document ID
 * @returns {Promise<boolean>}
 */
async function deleteDocument(collectionName, id) {
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error('Firestore not connected');
  }

  await collection.doc(id).delete();
  return true;
}

/**
 * Query documents with pagination
 * @param {string} collectionName - Collection name
 * @param {Object} pagination - {pageSize, lastDoc}
 * @param {Array} filters - Array of filters
 * @returns {Promise<Object>} {items, lastDoc, hasMore}
 */
async function getPaginatedDocuments(collectionName, pagination = { pageSize: 10, lastDoc: null }, filters = []) {
  const collection = getCollection(collectionName);
  if (!collection) {
    throw new Error('Firestore not connected');
  }

  let query = collection;

  // Apply filters
  filters.forEach(filter => {
    query = query.where(filter.field, filter.operator, filter.value);
  });

  // Order by createdAt
  query = query.orderBy('createdAt', 'desc');

  // Apply pagination
  if (pagination.lastDoc) {
    query = query.startAfter(pagination.lastDoc);
  }
  query = query.limit(pagination.pageSize);

  const snapshot = await query.get();
  const items = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt
    };
  });

  const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
  const hasMore = snapshot.docs.length === pagination.pageSize;

  return { items, lastDoc, hasMore };
}

/**
 * Batch write multiple operations
 * @returns {Object} Batch object with add, update, delete methods
 */
function createBatch() {
  const database = getDB();
  if (!database) {
    throw new Error('Firestore not connected');
  }

  const batch = database.batch();
  const operations = [];

  return {
    add(collectionName, data, customId = null) {
      const collection = getCollection(collectionName);
      const docRef = customId ? collection.doc(customId) : collection.doc();
      batch.set(docRef, {
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      operations.push({ type: 'add', ref: docRef, data });
      return this;
    },
    
    update(collectionName, id, data) {
      const collection = getCollection(collectionName);
      const docRef = collection.doc(id);
      batch.update(docRef, {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      operations.push({ type: 'update', ref: docRef, data });
      return this;
    },
    
    delete(collectionName, id) {
      const collection = getCollection(collectionName);
      const docRef = collection.doc(id);
      batch.delete(docRef);
      operations.push({ type: 'delete', ref: docRef });
      return this;
    },
    
    async commit() {
      await batch.commit();
      return operations;
    }
  };
}

/**
 * Run a transaction
 * @param {Function} callback - Transaction callback
 * @returns {Promise<any>}
 */
async function runTransaction(callback) {
  const database = getDB();
  if (!database) {
    throw new Error('Firestore not connected');
  }

  return database.runTransaction(callback);
}

// Export database utilities
module.exports = {
  initializeFirebase,
  getDB,
  isConnected,
  getCollection,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  getPaginatedDocuments,
  createBatch,
  runTransaction,
  
  // Collection names constants
  COLLECTIONS: {
    TOURS: 'tours',
    BOOKINGS: 'bookings',
    CONTACTS: 'contacts',
    RATINGS: 'ratings',
    USERS: 'users'
  }
};