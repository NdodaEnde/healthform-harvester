import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Mail, Lock, ArrowRight, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [confirmationRequired, setConfirmationRequired] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthState = async () => {
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkAuthState();
  }, [navigate]);

  useEffect(() => {
    // Check if the URL contains a confirmation success message
    const urlParams = new URLSearchParams(window.location.search);
    const confirmSuccess = urlParams.get("confirmation");
    
    if (confirmSuccess === "success") {
      toast.success("Email confirmed successfully! You can now sign in.");
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Attempting to sign in with email:", email);
      const { error } = await signIn(email, password);

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      toast.success("Signed in successfully");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Sign in error:", error);
      setAuthError(error.message || "Failed to sign in");
      
      // Detailed error message for debugging
      if (error.message.includes("Invalid login")) {
        toast.error("Authentication failed", {
          description: "Invalid email or password. Please check your credentials and try again."
        });
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Email not confirmed", {
          description: "Please check your email and confirm your account before signing in."
        });
        setConfirmationRequired(true);
      } else {
        toast.error("Authentication failed", {
          description: error.message || "Please check your credentials and try again"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setAuthError(null);

    try {
      console.log("Signing up with email:", email);
      
      // Use the signUp function from AuthContext
      const { error, data } = await signUp(email, password);

      if (error) {
        throw error;
      }

      console.log("Sign up response:", data);
      
      if (data?.user) {
        // Check if email confirmation is required
        const emailConfirmRequired = data.session === null && data.user.identities?.length === 1;
        setConfirmationRequired(emailConfirmRequired);
        
        // Set signup success state to show confirmation message
        setSignupSuccess(true);
        
        if (emailConfirmRequired) {
          toast.success("Sign up successful", {
            description: "Please check your email to confirm your account"
          });
          
          // Log to help with debugging
          console.log("Email confirmation is required. Confirmation email should be sent.");
        } else {
          // If email confirmation is disabled in Supabase settings
          toast.success("Sign up successful!");
          
          // Try to automatically sign in the user
          try {
            const { error: signInError } = await signIn(email, password);
            if (!signInError) {
              navigate("/dashboard");
              return;
            }
          } catch (err) {
            console.error("Auto sign-in after signup failed:", err);
          }
        }
        
        // Create user profile
        try {
          const { error: profileError } = await supabase.rpc('direct_insert_profile', {
            p_id: data.user.id,
            p_email: email,
            p_full_name: email.split('@')[0]
          });
          
          if (profileError) {
            console.error("Error creating profile with direct_insert_profile:", profileError);
            
            // Fallback: Try creating profile directly
            const { error: insertError } = await supabase.from('profiles').insert({
              id: data.user.id,
              email: email,
              full_name: email.split('@')[0],
              updated_at: new Date().toISOString()
            });
            
            if (insertError) {
              console.error("Error with direct profile insert:", insertError);
            }
          }
        } catch (profileErr) {
          console.error("Failed to create profile:", profileErr);
        }
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      setAuthError(error.message || "Failed to sign up");
      toast.error("Sign up failed", {
        description: error.message || "Please try again with a different email"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend confirmation email
  const handleResendConfirmation = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success("Confirmation email sent", {
        description: "Please check your inbox for the confirmation link"
      });
    } catch (error: any) {
      console.error("Failed to resend confirmation email:", error);
      toast.error("Failed to resend email", {
        description: error.message || "Please try again later"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show a different UI when signup is successful and confirmation is required
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
              <FileText className="h-6 w-6" />
              <span className="font-medium text-lg">HealthForm Harvester</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <div className="border rounded-lg shadow-sm overflow-hidden bg-card p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="mx-auto bg-green-100 text-green-800 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {confirmationRequired ? 
                    `We've sent a confirmation email to ${email}` : 
                    `Account created successfully for ${email}`}
                </p>
              </div>
              
              <div className="space-y-4">
                {confirmationRequired ? (
                  <>
                    <p className="text-sm">
                      Click the link in the email to verify your account and complete the sign-up process.
                    </p>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                      <p className="flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>If you don't see the email, check your spam folder.</span>
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleResendConfirmation}
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending..." : "Resend confirmation email"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm">
                    You can now sign in to your account.
                  </p>
                )}
                
                <div className="pt-4">
                  <Button 
                    variant="default" 
                    className="w-full" 
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                      setSignupSuccess(false);
                      setConfirmationRequired(false);
                    }}
                  >
                    Back to sign in
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <FileText className="h-6 w-6" />
            <span className="font-medium text-lg">HealthForm Harvester</span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in to your account to upload and manage documents
                </p>
              </div>
              
              <Tabs defaultValue="signin" className="space-y-6">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          className="pl-10"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Password"
                          className="pl-10"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Link 
                          to="/reset-password" 
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                    
                    {authError && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="mr-2">Signing in</span>
                          <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Email address"
                          className="pl-10"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Password"
                          className="pl-10"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Confirm Password"
                          className="pl-10"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {authError && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      By signing up, you agree to our 
                      <Link to="/terms" className="text-primary hover:underline mx-1">Terms</Link> 
                      and 
                      <Link to="/privacy" className="text-primary hover:underline mx-1">Privacy Policy</Link>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <span className="mr-2">Creating account</span>
                          <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                        </>
                      ) : (
                        <>
                          Create Account
                          <User className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
