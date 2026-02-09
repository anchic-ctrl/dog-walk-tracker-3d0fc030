import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dog, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

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

    try {
      // Use edge function to validate email (bypasses RLS for unauthenticated users)
      const { data: validationResult, error: validationError } = await supabase.functions.invoke(
        'validate-login-email',
        { body: { email: email.trim() } }
      );

      if (validationError) {
        toast({
          variant: 'destructive',
          title: '系統錯誤',
          description: '無法驗證您的身分，請稍後再試',
        });
        setIsSubmitting(false);
        return;
      }

      if (!validationResult.valid) {
        toast({
          variant: 'destructive',
          title: validationResult.status === 'disabled' ? '帳號已停用' : '無法登入',
          description: validationResult.message,
        });
        setIsSubmitting(false);
        return;
      }

      // Email is in the allowed list, send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        toast({
          variant: 'destructive',
          title: '發送失敗',
          description: error.message,
        });
      } else {
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: '系統錯誤',
        description: '發生未預期的錯誤，請稍後再試',
      });
    }
    
    setIsSubmitting(false);
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
              <Dog className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Amazing Dog</h1>
            <p className="text-muted-foreground">放風管理系統</p>
          </div>

          <Card className="shadow-soft-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">請查收您的信箱</CardTitle>
              <CardDescription className="text-base mt-2">
                我們已寄送登入連結到 <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                請點擊郵件中的連結登入系統。
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                className="w-full"
              >
                重新輸入 Email
              </Button>
            </CardContent>
          </Card>
        </div>
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
          <h1 className="text-3xl font-bold text-foreground">Amazing Dog</h1>
          <p className="text-muted-foreground">放風管理系統</p>
        </div>

        <Card className="shadow-soft-lg border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">登入</CardTitle>
            <CardDescription>輸入您的Email登入</CardDescription>
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

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    取得中...
                  </>
                ) : (
                  '取得登入連結'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
