import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dog, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

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

    const { error } = await signIn(loginEmail, loginPassword);
    
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      toast({
        variant: 'destructive',
        title: '密碼不一致',
        description: '請確認兩次輸入的密碼相同',
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: '密碼太短',
        description: '密碼至少需要 6 個字元',
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(signupEmail, signupPassword, displayName);
    
    if (error) {
      toast({
        variant: 'destructive',
        title: '註冊失敗',
        description: error.message,
      });
    } else {
      setShowConfirmation(true);
    }
    
    setIsSubmitting(false);
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-soft-lg border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-mint-bg rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">確認您的電子郵件</CardTitle>
            <CardDescription className="text-base mt-2">
              我們已寄送確認信到 <span className="font-semibold text-foreground">{signupEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              請點擊郵件中的連結來啟用您的帳號，然後返回此頁面登入。
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
              className="w-full"
            >
              返回登入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="login" className="text-base font-semibold">
                  登入
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-base font-semibold">
                  註冊
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="pt-6">
              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-base">
                      電子郵件
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-12 text-base"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-base">
                      密碼
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
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
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-base">
                      顯示名稱
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="您的名字"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-base">
                      電子郵件
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 h-12 text-base"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-base">
                      密碼
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="至少 6 個字元"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 h-12 text-base"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-base">
                      確認密碼
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="再次輸入密碼"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
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
                        註冊中...
                      </>
                    ) : (
                      '建立帳號'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          註冊即表示您同意我們的服務條款
        </p>
      </div>
    </div>
  );
}
