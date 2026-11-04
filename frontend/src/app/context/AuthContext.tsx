
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface UserData {
  name: string;
  email: string;
  phone: string;
  role?: string;
  userId?: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserData;
  accessToken: string | null;
  login: (data: UserData, token?: string | null) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const defaultUser: UserData = {
  name: "",
  email: "",
  phone: "",
  role: undefined,
  userId: undefined,
};

const STORAGE_KEY = "swasthai_user";
const TOKEN_KEY = "swasthai_access_token";

function loadStored() {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEY);
    const token = localStorage.getItem(TOKEN_KEY);

    if (rawUser && token) {
      return {
        user: JSON.parse(rawUser) as UserData,
        token,
        loggedIn: true,
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    user: defaultUser,
    token: null,
    loggedIn: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stored] = useState(loadStored);

  const [isLoggedIn, setIsLoggedIn] = useState(stored.loggedIn);
  const [user, setUser] = useState<UserData>(stored.user);
  const [accessToken, setAccessToken] = useState<string | null>(
    stored.token
  );

  const login = (data: UserData, token?: string | null) => {
    setUser(data);
    setAccessToken(token ?? null);
    setIsLoggedIn(Boolean(token));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const logout = () => {
    setUser(defaultUser);
    setAccessToken(null);
    setIsLoggedIn(false);

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("access_token");
  };

  const updateProfile = (data: Partial<UserData>) => {
    setUser((prev) => {
      const next = { ...prev, ...data };

      if (isLoggedIn) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }

      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        accessToken,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
