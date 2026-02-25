import { useState, useEffect } from 'react';
import { supabase, supabaseInvite } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2, ArrowLeft, Shield, ShieldAlert, Mail, UserPlus,
    Copy, UserX, UserCheck, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tables } from '@/integrations/supabase/types';

type Member = Tables<'members'>;

const StaffManagement = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user: currentUser, isSuperAdmin } = useAuth();

    // Invite dialog state
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'staff'>('staff');
    const [inviting, setInviting] = useState(false);

    // Disable confirm dialog
    const [disableTarget, setDisableTarget] = useState<Member | null>(null);

    // Current user's member record (needed for invited_by)
    const [myMemberId, setMyMemberId] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers();
        fetchMyMemberId();
    }, []);

    const fetchMyMemberId = async () => {
        if (!currentUser) return;
        const { data } = await supabase
            .from('members')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle();
        if (data) setMyMemberId(data.id);
    };

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('is_super_admin', { ascending: false })
                .order('role')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMembers(data as Member[]);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            toast({
                title: '載入失敗',
                description: '無法載入員工列表',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            toast({ title: '請輸入 Email', variant: 'destructive' });
            return;
        }

        const normalizedEmail = inviteEmail.trim().toLowerCase();

        // Check if email already in the loaded list
        const existing = members.find(m => m.email.toLowerCase() === normalizedEmail);
        if (existing) {
            // If already invited (status='invited'), offer to resend
            if (existing.status === 'invited') {
                toast({
                    title: '此 Email 已受邀',
                    description: '請點擊清單中的「重新發送邀請」按鈕重新寄信',
                });
            } else {
                toast({
                    title: '此 Email 已存在',
                    description: '該員工已在系統中，請直接管理其權限',
                    variant: 'destructive',
                });
            }
            return;
        }

        setInviting(true);
        try {
            // 1. Insert the member record
            const { error: insertError } = await supabase
                .from('members')
                .insert({
                    email: normalizedEmail,
                    role: isSuperAdmin ? inviteRole : 'staff',
                    status: 'invited',
                    invited_by: myMemberId,
                });

            // If duplicate key: the email is already in DB but wasn't loaded in UI
            if (insertError) {
                if (insertError.code === '23505') {
                    // Record exists — refresh the list and tell admin to use resend
                    await fetchMembers();
                    toast({
                        title: '此 Email 已在系統中',
                        description: '清單已更新，請使用「重新發送邀請」按鈕寄信給對方',
                    });
                    setInviteOpen(false);
                } else {
                    throw insertError;
                }
                return;
            }

            // 2. Send magic link directly to the invitee's inbox
            const { error: otpError } = await supabaseInvite.auth.signInWithOtp({
                email: normalizedEmail,
                options: {
                    emailRedirectTo: window.location.origin + '/',
                    shouldCreateUser: true,
                },
            });

            // If OTP rate-limited: member record was already created, just inform admin
            if (otpError) {
                await fetchMembers();
                const isRateLimit = otpError.message?.toLowerCase().includes('rate limit');
                toast({
                    title: isRateLimit ? '發送頻率過高' : '邀請信發送失敗',
                    description: isRateLimit
                        ? `${normalizedEmail} 已加入系統，但寄信頻率受限。請稍後在清單中點「重新發送邀請」。`
                        : `員工已加入系統，但邀請信未寄出（${otpError.message}）。請使用清單中的「重新發送邀請」。`,
                    variant: 'destructive',
                });
                setInviteOpen(false);
                return;
            }

            toast({
                title: '邀請信已發送 🎉',
                description: `邀請信已寄送至 ${normalizedEmail}，請對方查收信箱。`,
            });

            setInviteEmail('');
            setInviteRole('staff');
            setInviteOpen(false);
            fetchMembers();
        } catch (error: any) {
            console.error('Invite failed:', error);
            toast({
                title: '邀請失敗',
                description: error.message || '無法發送邀請信，請稍後再試',
                variant: 'destructive',
            });
        } finally {
            setInviting(false);
        }
    };

    // Resend: send a fresh magic link to an already-invited member
    const handleResendInvite = async (email: string) => {
        try {
            const { error } = await supabaseInvite.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin + '/',
                    shouldCreateUser: true,
                },
            });
            if (error) {
                const isRateLimit = error.message?.toLowerCase().includes('rate limit');
                toast({
                    title: isRateLimit ? '發送頻率過高，請稍後再試' : '發送失敗',
                    description: error.message,
                    variant: 'destructive',
                });
            } else {
                toast({ title: '邀請信已重新發送', description: `已寄送至 ${email}` });
            }
        } catch {
            toast({ title: '發送失敗', variant: 'destructive' });
        }
    };

    const handleRoleChange = async (memberId: string, newRole: 'admin' | 'staff') => {
        try {
            const { error } = await supabase
                .from('members')
                .update({ role: newRole })
                .eq('id', memberId);

            if (error) throw error;

            setMembers(members.map(m =>
                m.id === memberId ? { ...m, role: newRole } : m
            ));

            toast({
                title: '更新成功',
                description: `已將權限更改為 ${newRole === 'admin' ? '管理員' : '一般員工'}`,
            });
        } catch (error) {
            console.error('Failed to update role:', error);
            toast({ title: '更新失敗', description: '無法更改權限', variant: 'destructive' });
        }
    };

    const handleToggleDisable = async (member: Member) => {
        const newStatus = member.status === 'disabled' ? 'active' : 'disabled';
        try {
            const { error } = await supabase
                .from('members')
                .update({ status: newStatus })
                .eq('id', member.id);

            if (error) throw error;

            setMembers(members.map(m =>
                m.id === member.id ? { ...m, status: newStatus } : m
            ));

            toast({
                title: newStatus === 'disabled' ? '已停用帳號' : '已重新啟用帳號',
                description: member.email,
            });
            setDisableTarget(null);
        } catch (error) {
            console.error('Failed to toggle status:', error);
            toast({ title: '操作失敗', variant: 'destructive' });
        }
    };

    // Permission helpers
    const canChangeRole = (target: Member): boolean => {
        if (target.is_super_admin) return false; // super admin role is immutable
        if (target.user_id === currentUser?.id) return false; // can't change own role
        if (isSuperAdmin) return true; // super admin can change anyone
        // regular admin can only change staff
        return target.role === 'staff';
    };

    const canDisable = (target: Member): boolean => {
        if (target.is_super_admin) return false;
        if (target.user_id === currentUser?.id) return false;
        if (isSuperAdmin) return true;
        return target.role === 'staff';
    };

    const statusBadge = (status: Member['status']) => {
        if (status === 'active') return <Badge className="bg-green-500 hover:bg-green-600 text-white">啟用中</Badge>;
        if (status === 'invited') return <Badge variant="secondary">邀請中</Badge>;
        return <Badge variant="destructive" className="opacity-70">已停用</Badge>;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            員工權限管理
                        </h1>
                        <p className="text-sm text-muted-foreground">共 {members.length} 位員工</p>
                    </div>
                    <Button onClick={() => setInviteOpen(true)} className="font-semibold">
                        <UserPlus className="h-4 w-4 mr-2" />
                        邀請員工
                    </Button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[260px]">員工 Email</TableHead>
                                <TableHead>狀態</TableHead>
                                <TableHead>權限</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id} className={member.status === 'disabled' ? 'opacity-50' : ''}>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="truncate">{member.email}</span>
                                                {member.user_id === currentUser?.id && (
                                                    <Badge variant="outline" className="text-xs shrink-0">你</Badge>
                                                )}
                                            </div>
                                            {member.is_super_admin && (
                                                <span className="text-xs text-primary flex items-center gap-1 ml-6">
                                                    <ShieldAlert className="h-3 w-3" /> 超級管理員
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{statusBadge(member.status)}</TableCell>
                                    <TableCell>
                                        {canChangeRole(member) ? (
                                            <Select
                                                value={member.role}
                                                onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'staff')}
                                            >
                                                <SelectTrigger className="w-[110px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="staff">一般員工</SelectItem>
                                                    <SelectItem value="admin">管理員</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                                                {member.role === 'admin' ? '管理員' : '員工'}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Resend invite email */}
                                            {member.status === 'invited' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs"
                                                    onClick={() => handleResendInvite(member.email)}
                                                >
                                                    <Send className="h-3.5 w-3.5 mr-1" />
                                                    重新發送邀請
                                                </Button>
                                            )}
                                            {/* Disable / Enable button */}
                                            {canDisable(member) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`h-8 text-xs ${member.status === 'disabled' ? 'text-green-600 hover:text-green-700' : 'text-destructive hover:text-destructive'}`}
                                                    onClick={() => {
                                                        if (member.status === 'disabled') {
                                                            handleToggleDisable(member);
                                                        } else {
                                                            setDisableTarget(member);
                                                        }
                                                    }}
                                                >
                                                    {member.status === 'disabled' ? (
                                                        <><UserCheck className="h-3.5 w-3.5 mr-1" />重新啟用</>
                                                    ) : (
                                                        <><UserX className="h-3.5 w-3.5 mr-1" />停用帳號</>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Invite Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            邀請新員工
                        </DialogTitle>
                        <DialogDescription>
                            填入員工 Email，系統將直接寄送邀請信到對方信箱。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email">員工 Email</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="staff@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>權限角色</Label>
                            {isSuperAdmin ? (
                                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'staff')}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">一般員工</SelectItem>
                                        <SelectItem value="admin">管理員</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                                    一般員工（Admin 僅可邀請員工）
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>取消</Button>
                        <Button onClick={handleInvite} disabled={inviting}>
                            {inviting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                            發送邀請信
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disable Confirm Dialog */}
            <AlertDialog open={!!disableTarget} onOpenChange={(open) => !open && setDisableTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確認停用帳號？</AlertDialogTitle>
                        <AlertDialogDescription>
                            停用後，<strong>{disableTarget?.email}</strong> 將無法登入系統。您隨時可以重新啟用。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => disableTarget && handleToggleDisable(disableTarget)}
                        >
                            確認停用
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default StaffManagement;
