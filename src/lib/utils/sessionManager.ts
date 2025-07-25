import { promises as fs } from 'fs';
import path from 'path';

// Session timeout configuration (in hours)
const SESSION_TIMEOUT_HOURS = parseInt(process.env.SESSION_TIMEOUT_HOURS || '6'); // Default 6 hours
const SESSION_CLEANUP_INTERVAL_HOURS = parseInt(process.env.SESSION_CLEANUP_INTERVAL_HOURS || '6'); // Cleanup every 6 hours

export interface SessionData {
  id: string;
  originalFilename?: string;
  fileName?: string;
  fileSize: number;
  recordCount: number;
  lastUpdateId?: number;
  country?: string;
  createdAt: string;
  expiresAt: string; // New field for session expiration
  lastAccessedAt: string; // Track last access for activity-based timeout
  status: 'pending' | 'uploaded' | 'in-progress' | 'completed' | 'failed';
  data: {
    masterData?: any;
    records?: any[];
    processedRecords?: any[];
    validationIssues?: any[];
    validationSummary?: any;
  };
}

export class SessionManager {
  private static dataDir = path.join(process.cwd(), 'data', 'sessions');

  /**
   * Create a new session with expiration timestamp
   */
  static createSessionData(sessionId: string, data: Partial<SessionData>): SessionData {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);

    return {
      ...data,
      id: sessionId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastAccessedAt: now.toISOString(),
      fileSize: data.fileSize || 0,
      recordCount: data.recordCount || 0,
      status: data.status || 'pending',
      data: data.data || {}
    } as SessionData;
  }

  /**
   * Check if a session has expired
   */
  static isSessionExpired(sessionData: SessionData): boolean {
    const now = new Date();
    const expiresAt = new Date(sessionData.expiresAt);
    return now > expiresAt;
  }

  /**
   * Update session's last accessed timestamp and extend expiration
   */
  static updateSessionAccess(sessionData: SessionData): SessionData {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);

    return {
      ...sessionData,
      lastAccessedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Validate and retrieve session with expiration check
   */
  static async getValidSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionFilePath = path.join(this.dataDir, `${sessionId}.json`);
      
      // Check if session file exists
      try {
        await fs.access(sessionFilePath);
      } catch (error) {
        console.log(`Session file not found: ${sessionId}`);
        return null;
      }

      // Read session data
      const sessionDataRaw = await fs.readFile(sessionFilePath, 'utf-8');
      let sessionData: SessionData = JSON.parse(sessionDataRaw);

      // Handle legacy sessions without expiration fields
      if (!sessionData.expiresAt) {
        console.log(`Migrating legacy session: ${sessionId}`);
        const createdAt = new Date(sessionData.createdAt);
        const expiresAt = new Date(createdAt.getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
        
        sessionData.expiresAt = expiresAt.toISOString();
        sessionData.lastAccessedAt = sessionData.createdAt;
        
        // Save updated session data
        await this.saveSession(sessionData);
      }

      // Check if session has expired
      if (this.isSessionExpired(sessionData)) {
        console.log(`Session expired: ${sessionId}`);
        await this.removeSession(sessionId);
        return null;
      }

      // Update last accessed timestamp and extend expiration
      sessionData = this.updateSessionAccess(sessionData);
      await this.saveSession(sessionData);

      return sessionData;
    } catch (error) {
      console.error(`Error retrieving session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Save session data to file
   */
  static async saveSession(sessionData: SessionData): Promise<void> {
    const sessionFilePath = path.join(this.dataDir, `${sessionData.id}.json`);
    
    // Ensure directory exists
    await fs.mkdir(this.dataDir, { recursive: true });
    
    await fs.writeFile(
      sessionFilePath,
      JSON.stringify(sessionData, null, 2),
      'utf8'
    );
  }

  /**
   * Remove expired session
   */
  static async removeSession(sessionId: string): Promise<void> {
    try {
      const sessionFilePath = path.join(this.dataDir, `${sessionId}.json`);
      const markerFilePath = path.join(this.dataDir, `${sessionId}.marker`);
      const altMarkerFilePath = path.join(this.dataDir, `${sessionId}-marker`);

      // Remove session file
      try {
        await fs.unlink(sessionFilePath);
        console.log(`Removed expired session file: ${sessionId}`);
      } catch (error) {
        // File might not exist, ignore
      }

      // Remove marker files
      try {
        await fs.unlink(markerFilePath);
      } catch (error) {
        // File might not exist, ignore
      }

      try {
        await fs.unlink(altMarkerFilePath);
      } catch (error) {
        // File might not exist, ignore
      }
    } catch (error) {
      console.error(`Error removing session ${sessionId}:`, error);
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  static async cleanupExpiredSessions(): Promise<{ removed: number; errors: string[] }> {
    const results = { removed: 0, errors: [] as string[] };

    try {
      // Ensure directory exists
      await fs.mkdir(this.dataDir, { recursive: true });
      
      const files = await fs.readdir(this.dataDir);
      const sessionFiles = files.filter(file => file.endsWith('.json') && !file.includes('backup'));

      console.log(`Checking ${sessionFiles.length} sessions for expiration...`);

      for (const file of sessionFiles) {
        try {
          const sessionFilePath = path.join(this.dataDir, file);
          const sessionDataRaw = await fs.readFile(sessionFilePath, 'utf-8');
          const sessionData: SessionData = JSON.parse(sessionDataRaw);

          // Handle legacy sessions without expiration
          if (!sessionData.expiresAt) {
            const createdAt = new Date(sessionData.createdAt);
            const now = new Date();
            const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

            // Remove legacy sessions older than timeout period
            if (ageInHours > SESSION_TIMEOUT_HOURS) {
              await this.removeSession(sessionData.id);
              results.removed++;
              console.log(`Removed legacy expired session: ${sessionData.id} (age: ${ageInHours.toFixed(1)}h)`);
            } else {
              // Migrate legacy session
              const expiresAt = new Date(createdAt.getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
              sessionData.expiresAt = expiresAt.toISOString();
              sessionData.lastAccessedAt = sessionData.createdAt;
              await this.saveSession(sessionData);
              console.log(`Migrated legacy session: ${sessionData.id}`);
            }
          } else if (this.isSessionExpired(sessionData)) {
            await this.removeSession(sessionData.id);
            results.removed++;
            console.log(`Removed expired session: ${sessionData.id}`);
          }
        } catch (error) {
          const errorMsg = `Error processing session file ${file}: ${error}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`Session cleanup completed. Removed: ${results.removed}, Errors: ${results.errors.length}`);
    } catch (error) {
      const errorMsg = `Error during session cleanup: ${error}`;
      results.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return results;
  }

  /**
   * Get session timeout configuration
   */
  static getSessionConfig() {
    return {
      timeoutHours: SESSION_TIMEOUT_HOURS,
      cleanupIntervalHours: SESSION_CLEANUP_INTERVAL_HOURS
    };
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    legacy: number;
  }> {
    const stats = { total: 0, active: 0, expired: 0, legacy: 0 };

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const files = await fs.readdir(this.dataDir);
      const sessionFiles = files.filter(file => file.endsWith('.json') && !file.includes('backup'));

      stats.total = sessionFiles.length;

      for (const file of sessionFiles) {
        try {
          const sessionFilePath = path.join(this.dataDir, file);
          const sessionDataRaw = await fs.readFile(sessionFilePath, 'utf-8');
          const sessionData: SessionData = JSON.parse(sessionDataRaw);

          if (!sessionData.expiresAt) {
            stats.legacy++;
          } else if (this.isSessionExpired(sessionData)) {
            stats.expired++;
          } else {
            stats.active++;
          }
        } catch (error) {
          // Ignore invalid session files
        }
      }
    } catch (error) {
      console.error('Error getting session stats:', error);
    }

    return stats;
  }
}

// Utility function for API routes to handle session validation
export async function validateSessionMiddleware(sessionId: string | null): Promise<{
  success: boolean;
  sessionData?: SessionData;
  error?: string;
  statusCode?: number;
}> {
  if (!sessionId) {
    return {
      success: false,
      error: 'Session ID is required',
      statusCode: 400
    };
  }

  const sessionData = await SessionManager.getValidSession(sessionId);
  
  if (!sessionData) {
    return {
      success: false,
      error: 'Session not found or has expired. Please upload a file again.',
      statusCode: 404
    };
  }

  return {
    success: true,
    sessionData
  };
}