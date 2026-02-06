import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dog, Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, loading, signIn } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: '登入失敗',
        description: error.message === 'Invalid login credentials' 
          ? '電子郵件或密碼錯誤' 
          : error.message,
      });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
            <Dog className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">狗狗旅館</h1>
          <p className="text-muted-foreground">放風管理系統</p>
        </div>

        <Card className="shadow-soft-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">登入</CardTitle>
            <CardDescription>請輸入您的帳號密碼</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">
                  電子郵件
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">
                  密碼
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    登入中...
                  </>
                ) : (
                  '登入'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link 
            to="/accept-invite" 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            收到邀請？點此啟用帳號
          </Link>
        </div>
      </div>
    </div>
  );
}
