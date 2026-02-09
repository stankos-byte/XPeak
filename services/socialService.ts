/**
 * SocialService - Manages Operatives (Friends) and Contracts (Challenges)
 * 
 * This service handles:
 * - Caching operatives and contracts in localStorage
 * - Async fetching from remote sources
 * - Real-time updates via listeners (ready for Firestore onSnapshot)
 * 
 * Currently uses mock data with localStorage caching, but structured to easily
 * replace with Firestore real-time listeners for live updates in the Global Network.
 */

import { Friend, FriendChallenge } from '../types';
import { DEBUG_FLAGS } from '../config/debugFlags';

// Type aliases for domain-specific terminology
export type Operative = Friend;
export type Contract = FriendChallenge;

// Storage keys
const OPERATIVES_CACHE_KEY = 'xpeak_operatives';
const CONTRACTS_CACHE_KEY = 'xpeak_contracts';
const CACHE_TIMESTAMP_KEY = 'xpeak_social_cache_timestamp';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Mock data fallback - Empty by default for new profiles
const MOCK_OPERATIVES: Operative[] = [];

// Helper to create expiration date from duration string
const createExpiresAt = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// Mock data fallback - Empty by default for new profiles
const MOCK_CONTRACTS: Contract[] = [];

/**
 * Cache management utilities
 */
const getCacheTimestamp = (): number | null => {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error getting cache timestamp:', error);
    return null;
  }
};

const setCacheTimestamp = (): void => {
  try {
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error setting cache timestamp:', error);
  }
};

const isCacheValid = (): boolean => {
  const timestamp = getCacheTimestamp();
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_EXPIRY_MS;
};

const getCachedOperatives = (): Operative[] | null => {
  try {
    if (!isCacheValid()) return null;
    const cached = localStorage.getItem(OPERATIVES_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as Operative[];
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error reading cached operatives:', error);
    return null;
  }
};

const setCachedOperatives = (operatives: Operative[]): void => {
  try {
    localStorage.setItem(OPERATIVES_CACHE_KEY, JSON.stringify(operatives));
    setCacheTimestamp();
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error caching operatives:', error);
  }
};

const getCachedContracts = (): Contract[] | null => {
  try {
    if (!isCacheValid()) return null;
    const cached = localStorage.getItem(CONTRACTS_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as Contract[];
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error reading cached contracts:', error);
    return null;
  }
};

const setCachedContracts = (contracts: Contract[]): void => {
  try {
    localStorage.setItem(CONTRACTS_CACHE_KEY, JSON.stringify(contracts));
    setCacheTimestamp();
  } catch (error) {
    if (DEBUG_FLAGS.storage) console.error('Error caching contracts:', error);
  }
};

/**
 * Listener type for real-time updates
 * Compatible with Firestore onSnapshot unsubscribe pattern
 */
export type Unsubscribe = () => void;
export type OperativesListener = (operatives: Operative[]) => void;
export type ContractsListener = (contracts: Contract[]) => void;

/**
 * SocialService class
 * 
 * Manages operatives and contracts with caching and real-time listener support.
 * Ready to be extended with Firestore onSnapshot integration.
 */
export class SocialService {
  private operativesListeners: Set<OperativesListener> = new Set();
  private contractsListeners: Set<ContractsListener> = new Set();
  private currentOperatives: Operative[] = [];
  private currentContracts: Contract[] = [];
  private fetchOperativesPromise: Promise<Operative[]> | null = null;
  private fetchContractsPromise: Promise<Contract[]> | null = null;

  /**
   * Initialize the service by loading from cache or fetching fresh data
   */
  async initialize(): Promise<{ operatives: Operative[]; contracts: Contract[] }> {
    // Try to load from cache first
    const cachedOperatives = getCachedOperatives();
    const cachedContracts = getCachedContracts();

    if (cachedOperatives && cachedContracts) {
      this.currentOperatives = cachedOperatives;
      this.currentContracts = cachedContracts;
      this.notifyOperativesListeners();
      this.notifyContractsListeners();
      
      // Fetch fresh data in background (don't await)
      this.fetchOperatives().catch((error) => {
        if (DEBUG_FLAGS.social) console.error('Background fetch of operatives failed:', error);
      });
      this.fetchContracts().catch((error) => {
        if (DEBUG_FLAGS.social) console.error('Background fetch of contracts failed:', error);
      });
      
      return { operatives: cachedOperatives, contracts: cachedContracts };
    }

    // No valid cache, fetch fresh data
    const [operatives, contracts] = await Promise.all([
      this.fetchOperatives(),
      this.fetchContracts()
    ]);

    return { operatives, contracts };
  }

  /**
   * Fetch operatives from remote source
   * Currently returns mock data, but structured for async API calls
   */
  async fetchOperatives(): Promise<Operative[]> {
    // If there's already a fetch in progress, return that promise
    if (this.fetchOperativesPromise) {
      return this.fetchOperativesPromise;
    }

    this.fetchOperativesPromise = (async () => {
      try {
        // IMPLEMENTATION NOTE: Currently using mock data for development
        // To integrate with real backend:
        // 1. Uncomment and configure the API endpoint below
        // 2. Update the response parsing as needed
        // 3. Consider using Firebase Firestore queries instead:
        //    const operativesRef = collection(db, 'friends');
        //    const q = query(operativesRef, where('userId', '==', currentUserId));
        //    const snapshot = await getDocs(q);
        //    const operatives = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Example REST API call:
        // const response = await fetch('/api/operatives');
        // const operatives = await response.json();
        
        // Simulate network delay for mock data
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const operatives = [...MOCK_OPERATIVES];
        
        // Cache the results
        setCachedOperatives(operatives);
        this.currentOperatives = operatives;
        this.notifyOperativesListeners();
        
        return operatives;
      } catch (error) {
        if (DEBUG_FLAGS.social) console.error('Error fetching operatives:', error);
        // Fallback to mock data on error
        const fallback = [...MOCK_OPERATIVES];
        this.currentOperatives = fallback;
        this.notifyOperativesListeners();
        return fallback;
      } finally {
        this.fetchOperativesPromise = null;
      }
    })();

    return this.fetchOperativesPromise;
  }

  /**
   * Fetch contracts from remote source
   * Currently returns mock data, but structured for async API calls
   */
  async fetchContracts(): Promise<Contract[]> {
    // If there's already a fetch in progress, return that promise
    if (this.fetchContractsPromise) {
      return this.fetchContractsPromise;
    }

    this.fetchContractsPromise = (async () => {
      try {
        // IMPLEMENTATION NOTE: Currently using mock data for development
        // To integrate with real backend:
        // 1. Uncomment and configure the API endpoint below
        // 2. Update the response parsing as needed
        // 3. Consider using Firebase Firestore queries instead:
        //    const contractsRef = collection(db, 'challenges');
        //    const q = query(contractsRef, where('partnerIds', 'array-contains', currentUserId));
        //    const snapshot = await getDocs(q);
        //    const contracts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Example REST API call:
        // const response = await fetch('/api/contracts');
        // const contracts = await response.json();
        
        // Simulate network delay for mock data
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const contracts = [...MOCK_CONTRACTS];
        
        // Cache the results
        setCachedContracts(contracts);
        this.currentContracts = contracts;
        this.notifyContractsListeners();
        
        return contracts;
      } catch (error) {
        if (DEBUG_FLAGS.social) console.error('Error fetching contracts:', error);
        // Fallback to mock data on error
        const fallback = [...MOCK_CONTRACTS];
        this.currentContracts = fallback;
        this.notifyContractsListeners();
        return fallback;
      } finally {
        this.fetchContractsPromise = null;
      }
    })();

    return this.fetchContractsPromise;
  }

  /**
   * Get current operatives (synchronous, from memory)
   */
  getOperatives(): Operative[] {
    return this.currentOperatives;
  }

  /**
   * Get current contracts (synchronous, from memory)
   */
  getContracts(): Contract[] {
    return this.currentContracts;
  }

  /**
   * Update operatives and notify listeners
   * Used for local updates and will be called by Firestore listeners
   */
  updateOperatives(operatives: Operative[]): void {
    this.currentOperatives = operatives;
    setCachedOperatives(operatives);
    this.notifyOperativesListeners();
  }

  /**
   * Update contracts and notify listeners
   * Used for local updates and will be called by Firestore listeners
   */
  updateContracts(contracts: Contract[]): void {
    this.currentContracts = contracts;
    setCachedContracts(contracts);
    this.notifyContractsListeners();
  }

  /**
   * Subscribe to operatives updates
   * Returns unsubscribe function compatible with Firestore onSnapshot pattern
   * 
   * Example Firestore integration:
   *   const unsubscribe = onSnapshot(
   *     collection(db, 'operatives'),
   *     (snapshot) => {
   *       const operatives = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   *       socialService.updateOperatives(operatives);
   *     }
   *   );
   *   socialService.onOperativesChange(() => {}); // Register listener
   */
  onOperativesChange(listener: OperativesListener): Unsubscribe {
    this.operativesListeners.add(listener);
    // Immediately call with current data
    listener(this.currentOperatives);
    
    return () => {
      this.operativesListeners.delete(listener);
    };
  }

  /**
   * Subscribe to contracts updates
   * Returns unsubscribe function compatible with Firestore onSnapshot pattern
   * 
   * Example Firestore integration:
   *   const unsubscribe = onSnapshot(
   *     collection(db, 'contracts'),
   *     (snapshot) => {
   *       const contracts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
   *       socialService.updateContracts(contracts);
   *     }
   *   );
   *   socialService.onContractsChange(() => {}); // Register listener
   */
  onContractsChange(listener: ContractsListener): Unsubscribe {
    this.contractsListeners.add(listener);
    // Immediately call with current data
    listener(this.currentContracts);
    
    return () => {
      this.contractsListeners.delete(listener);
    };
  }

  /**
   * Notify all operatives listeners
   */
  private notifyOperativesListeners(): void {
    this.operativesListeners.forEach(listener => {
      try {
        listener(this.currentOperatives);
      } catch (error) {
        if (DEBUG_FLAGS.social) console.error('Error in operatives listener:', error);
      }
    });
  }

  /**
   * Notify all contracts listeners
   */
  private notifyContractsListeners(): void {
    this.contractsListeners.forEach(listener => {
      try {
        listener(this.currentContracts);
      } catch (error) {
        if (DEBUG_FLAGS.social) console.error('Error in contracts listener:', error);
      }
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    try {
      localStorage.removeItem(OPERATIVES_CACHE_KEY);
      localStorage.removeItem(CONTRACTS_CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      if (DEBUG_FLAGS.storage) console.error('Error clearing cache:', error);
    }
  }
}

// Export singleton instance
export const socialService = new SocialService();

// Export mock data for backward compatibility
export const INITIAL_OPERATIVES = MOCK_OPERATIVES; // Empty array by default
export const INITIAL_CONTRACTS = MOCK_CONTRACTS;
