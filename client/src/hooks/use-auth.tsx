import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, 'password'>, Error, InsertUser>;
  signInWithGoogle: () => Promise<void>;
};

type LoginData = {
  username: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user");
        return await res.json();
      } catch (error) {
        // If 401, just return null (not authenticated)
        if (error instanceof Response && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Google Sign In functionality
  const googleSignInMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const res = await apiRequest("POST", "/api/auth/google", { idToken });
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Logged in successfully",
        description: `Welcome, ${user.displayName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Google login failed",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
    },
  });

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    // Check if the Firebase API keys are configured
    const isFirebaseConfigured = 
      import.meta.env.VITE_FIREBASE_API_KEY && 
      import.meta.env.VITE_FIREBASE_PROJECT_ID && 
      import.meta.env.VITE_FIREBASE_APP_ID;
      
    if (!isFirebaseConfigured) {
      toast({
        title: "Firebase not configured",
        description: "Google Sign In is not available. Firebase credentials are missing.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (credential) {
        const idToken = await result.user.getIdToken();
        googleSignInMutation.mutate(idToken);
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        title: "Google login failed",
        description: error instanceof Error ? error.message : "Failed to authenticate with Google",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}