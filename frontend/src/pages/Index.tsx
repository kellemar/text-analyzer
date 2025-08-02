import { useState, useEffect } from "react";
import { Login } from "@/components/Login";
import { TextAnalyzer } from "@/components/TextAnalyzer";

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Session {
  access_token: string;
  expires_at: string;
}


const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Restore user and session from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedSession = localStorage.getItem("session");
    if (storedUser && storedSession) {
      try {
        setUser(JSON.parse(storedUser));
        setSession(JSON.parse(storedSession));
      } catch (e) {
        // If parsing fails, clear localStorage
        localStorage.removeItem("user");
        localStorage.removeItem("session");
      }
    }
  }, []);

  const handleLogin = (userData: User, sessionData: Session) => {
    setUser(userData);
    setSession(sessionData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("session", JSON.stringify(sessionData));
  };

  const handleLogout = () => {
    setUser(null);
    setSession(null);
    localStorage.removeItem("user");
    localStorage.removeItem("session");
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <TextAnalyzer username={user.email} session={session} onLogout={handleLogout} />;
};

export default Index;