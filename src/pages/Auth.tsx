import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { toast } = useToast();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      fetch(`${API}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: formData.email, password: formData.password })
      }).then(async (r) => {
        if (!r.ok) throw new Error('Invalid credentials');
        const data = await r.json();
        toast({ title: 'Login Successful!', description: `Welcome back, ${data.user.name || 'User'}!` });
        localStorage.setItem('token', data.token);
        window.location.href = '/admin';
      }).catch(() => {
        toast({ title: 'Login Failed', description: 'Invalid email or password.', variant: 'destructive' });
      });
    } else {
      fetch(`${API}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password })
      }).then(async (r) => {
        if (!r.ok) throw new Error('Register failed');
        toast({ title: 'Registration Successful!', description: 'Your account has been created. Please login.' });
        setIsLogin(true);
      }).catch(() => {
        toast({ title: 'Registration Failed', description: 'Unable to register.', variant: 'destructive' });
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center shadow-md">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Fresh<span className="text-primary">Mart</span>
              </h1>
              <p className="text-sm text-muted-foreground">Admin Portal</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-2">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLogin
                ? "Login to access your admin dashboard"
                : "Register to get started"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@freshmart.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" variant="hero" className="w-full" size="lg">
                {isLogin ? "Login" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-semibold hover:underline"
                >
                  {isLogin ? "Register" : "Login"}
                </button>
              </p>
            </div>

            {isLogin && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">
                  Demo: admin@freshmart.com / admin123
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground">
          <h2 className="text-4xl font-bold mb-4">Manage Your Store</h2>
          <p className="text-lg opacity-90 max-w-md">
            Add products, manage categories, track inventory, and grow your business 
            with our powerful admin dashboard.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">📦</p>
              <p className="text-sm mt-1">Product Management</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">📊</p>
              <p className="text-sm mt-1">Stock Tracking</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">🏷️</p>
              <p className="text-sm mt-1">Category Control</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold">📈</p>
              <p className="text-sm mt-1">Analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
