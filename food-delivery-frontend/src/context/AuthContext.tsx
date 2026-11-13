import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
} from '../api/client';
import {
  fetchCurrentUser,
  loginUser,
  registerUser,
} from '../api/endpoints';
import type {
  LoginUserRequestDto,
  RegisterUserRequestDto,
  RegisterUserResponseDto,
} from '../types/api';

interface AuthContextValue {
  user: RegisterUserResponseDto | null;
  token: string | null;
  isLoading: boolean;
  authNotice: string | null;
  login: (credentials: LoginUserRequestDto) => Promise<RegisterUserResponseDto>;
  register: (payload: RegisterUserRequestDto) => Promise<RegisterUserResponseDto>;
  logout: (notice?: string) => void;
  clearAuthNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<RegisterUserResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getStoredToken()));
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const logout = useCallback((notice?: string) => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setAuthNotice(notice ?? null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout('Your session expired or is invalid. Please sign in again.');
    });
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchCurrentUser(token)
      .then((profile) => {
        if (!cancelled) {
          setUser(profile);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStoredToken(null);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(
    async (credentials: LoginUserRequestDto): Promise<RegisterUserResponseDto> => {
      const response = await loginUser(credentials);
      const profile = await fetchCurrentUser(response.token);
      setStoredToken(response.token);
      setUser(profile);
      setToken(response.token);
      setAuthNotice(null);
      return profile;
    },
    [],
  );

  const register = useCallback(
    async (payload: RegisterUserRequestDto): Promise<RegisterUserResponseDto> => {
      const created = await registerUser(payload);
      return created;
    },
    [],
  );

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        authNotice,
        login,
        register,
        logout,
        clearAuthNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
