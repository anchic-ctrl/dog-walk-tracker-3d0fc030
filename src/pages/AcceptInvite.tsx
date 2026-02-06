import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dog, Mail, Loader2, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type InviteStatus = 'loading' | 'valid' | 'not_found' | 'already_activated' | 'disabled' | 'expired' | 'sent';

interface ValidationResult {
  status: string;
  member_id: string | null;
  invited_by_name: string | null;
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState('');

  // Get email from URL params if provided
  const urlEmail = searchParams.get('email');

  useEffect(() => {
    if (urlEmail) {
      setEmail(urlEmail);
      validateInvitation(urlEmail);
    } else {
      setInviteStatus('valid'); // Allow manual email entry
    }
  }, [urlEmail]);

  const validateInvitation = async (emailToValidate: string) => {
    setInviteStatus('loading');
    
    try {
      const { data, error } = await supabase
        .rpc('validate_invitation', { invite_email: emailToValidate });

      if (error) {
        console.error('Validation error:', error);
        setInviteStatus('not_found');
        return;
      }

      const result = data?.[0] as ValidationResult | undefined;
      
      if (!result) {
        setInviteStatus('not_found');
        return;
      }

      setInviterName(result.invited_by_name);

      switch (result.status) {
        case 'VALID':
          setInviteStatus('valid');
          break;
        case 'NOT_FOUND':
          setInviteStatus('not_found');
          break;
        case 'ALREADY_ACTIVATED':
          setInviteStatus('already_activated');
          break;
        case 'DISABLED':
          setInviteStatus('disabled');
          break;
        case 'EXPIRED':
          setInviteStatus('expired');
          break;
        default:
          setInviteStatus('not_found');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setInviteStatus('not_found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: '請輸入 Email',
        description: '請輸入您的工作 email 地址',
      });
      return;
    }

    // First validate the invitation
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .rpc('validate_invitation', { invite_email: email.trim() });

      if (error) {
        toast({
          variant: 'destructive',
          title: '驗證失敗',
          description: '無法驗證邀請狀態，請稍後再試',
        });
        setIsSubmitting(false);
        return;
      }

      const result = data?.[0] as ValidationResult | undefined;

      if (!result || result.status !== 'VALID') {
        // Update status based on validation result
        if (result) {
          switch (result.status) {
            case 'NOT_FOUND':
              setInviteStatus('not_found');
              break;
            case 'ALREADY_ACTIVATED':
              setInviteStatus('already_activated');
              break;
            case 'DISABLED':
              setInviteStatus('disabled');
              break;
            case 'EXPIRED':
              setInviteStatus('expired');
              break;
          }
        } else {
          setInviteStatus('not_found');
        }
        setIsSubmitting(false);
        return;
      }

      // Send magic link
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signInError) {
        toast({
          variant: 'destructive',
          title: '發送失敗',
          description: signInError.message,
        });
        setIsSubmitting(false);
        return;
      }

      setSentEmail(email.trim());
      setInviteStatus('sent');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        variant: 'destructive',
        title: '發生錯誤',
        description: '請稍後再試',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (inviteStatus) {
      case 'loading':
        return (
          <Card className="shadow-soft-lg border-0">
            <CardContent className="py-12 flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">驗證邀請中...</p>
            </CardContent>
          </Card>
        );

      case 'sent':
        return (
          <Card className="shadow-soft-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">請查收您的信箱</CardTitle>
              <CardDescription className="text-base mt-2">
                我們已寄送登入連結到 <span className="font-semibold text-foreground">{sentEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                請點擊郵件中的連結完成帳號啟用，連結將在 1 小時後失效。
              </p>
              <p className="text-sm text-muted-foreground">
                沒收到信？請檢查垃圾郵件匣，或稍後再試。
              </p>
            </CardContent>
          </Card>
        );

      case 'valid':
        return (
          <Card className="shadow-soft-lg border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">歡迎加入！</CardTitle>
              <CardDescription className="text-base mt-2">
                {inviterName 
                  ? `${inviterName} 邀請您加入 Amazing Dog 團隊`
                  : '您被邀請加入 Amazing Dog 團隊'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">
                    請輸入您的工作 Email
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
                      disabled={isSubmitting}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    請使用您被邀請時的 email 地址
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      處理中...
                    </>
                  ) : (
                    '發送登入連結'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'not_found':
        return (
          <Card className="shadow-soft-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">找不到邀請</CardTitle>
              <CardDescription className="text-base mt-2">
                此 email 沒有待處理的邀請
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                請確認您輸入的 email 正確，或聯繫管理員取得邀請。
              </p>
              <div className="pt-2 space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEmail('');
                    setInviteStatus('valid');
                  }}
                  className="w-full"
                >
                  重新輸入 Email
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  返回登入頁
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'already_activated':
        return (
          <Card className="shadow-soft-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">帳號已啟用</CardTitle>
              <CardDescription className="text-base mt-2">
                您的帳號已經啟用囉！
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                請直接登入系統開始使用。
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full h-12 text-base font-semibold"
              >
                前往登入
              </Button>
            </CardContent>
          </Card>
        );

      case 'disabled':
        return (
          <Card className="shadow-soft-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold">帳號已停用</CardTitle>
              <CardDescription className="text-base mt-2">
                您的帳號目前處於停用狀態
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                如有疑問，請聯繫系統管理員。
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                返回登入頁
              </Button>
            </CardContent>
          </Card>
        );

      case 'expired':
        return (
          <Card className="shadow-soft-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <CardTitle className="text-2xl font-bold">邀請已過期</CardTitle>
              <CardDescription className="text-base mt-2">
                此邀請連結已超過有效期限
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                請聯繫管理員重新發送邀請。
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="w-full"
              >
                返回登入頁
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

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

        {renderContent()}
      </div>
    </div>
  );
}
