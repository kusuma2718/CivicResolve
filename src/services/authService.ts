/**
 * authService.ts
 * Manages cryptographically verified JWT tokens for municipal officer operations.
 */

const TOKEN_STORAGE_KEY = 'civicresolve_officer_token';

export class AuthService {
  private static cachedToken: string | null = null;
  private static tokenFetchPromise: Promise<string | null> | null = null;

  /**
   * Check whether a JWT token has expired based on its client-decodable 'exp' claim.
   */
  private static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      const now = Math.floor(Date.now() / 1000);
      return now >= payload.exp;
    } catch {
      return true;
    }
  }

  /**
   * Retrieve active officer JWT, fetching a signed token from the backend if not cached or expired.
   */
  public static async getOfficerToken(): Promise<string | null> {
    if (this.cachedToken) {
      if (this.isTokenExpired(this.cachedToken)) {
        this.clearSession();
      } else {
        return this.cachedToken;
      }
    }

    // Check sessionStorage
    try {
      const stored = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        if (this.isTokenExpired(stored)) {
          this.clearSession();
        } else {
          this.cachedToken = stored;
          return stored;
        }
      }
    } catch {
      // Storage access blocked or unavailable
    }

    // Deduplicate concurrent fetch requests
    if (!this.tokenFetchPromise) {
      this.tokenFetchPromise = this.fetchOfficerToken();
    }

    const token = await this.tokenFetchPromise;
    this.tokenFetchPromise = null;
    return token;
  }

  private static async fetchOfficerToken(): Promise<string | null> {
    try {
      const res = await fetch('/api/auth/officer-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          officerName: 'Municipal Duty Officer',
          departmentId: 'dept-pwd',
        }),
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (data?.success && data?.token) {
        this.cachedToken = data.token;
        try {
          sessionStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        } catch {
          // ignore storage quota errors
        }
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Return Authorization headers with Bearer token for protected API calls.
   */
  public static async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getOfficerToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
      };
    }
    return {};
  }

  /**
   * Inspect response from protected API endpoints; automatically clears session if 401 Unauthorized is received.
   */
  public static handleResponse(res: Response): void {
    if (res.status === 401) {
      this.clearSession();
    }
  }

  /**
   * Clear session token (logout)
   */
  public static clearSession() {
    this.cachedToken = null;
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
