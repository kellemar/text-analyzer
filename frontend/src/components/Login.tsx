import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Session {
  access_token: string;
  expires_at: string;
}

interface AuthResponse {
  message: string;
  user: User;
  session: Session;
}

interface LoginProps {
  onLogin: (user: User, session: Session) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { toast } = useToast();

  const apiUrl = import.meta.env.VITE_ANALYZER_API_URL;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    if (!apiUrl) {
      toast({
        title: "Configuration Error",
        description: "API URL not configured",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const endpoint = isSignUp ? '/signup' : '/login';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = `${isSignUp ? 'Signup' : 'Login'} failed`;
        
        try {
          const errorData = await response.json();
          // Handle different error response formats from backend
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch {
          // If JSON parsing fails, use HTTP status text or default message
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data: AuthResponse = await response.json();
      
      toast({
        title: "Success!",
        description: isSignUp ? "Account created successfully" : "Successfully logged in",
      });
      
      onLogin(data.user, data.session);
    } catch (error) {
      toast({
        title: isSignUp ? "Signup Failed" : "Login Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TextAnalyzer Pro
          </h1>
          <p className="text-muted-foreground">
            Intelligent document analysis and summarization
          </p>
        </div>
        
        <Card className="shadow-[var(--shadow-elegant)] border-border/50 bg-gradient-to-b from-card to-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">{isSignUp ? "Sign Up" : "Sign In"}</CardTitle>
            <CardDescription className="text-center">
              {isSignUp ? "Create an account to access the analyzer" : "Enter your credentials to access the analyzer"}
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="transition-all duration-300 focus:shadow-[var(--shadow-glow)]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="transition-all duration-300 focus:shadow-[var(--shadow-glow)]"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-[var(--shadow-glow)] transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Sign In")}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
                className="w-full"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};