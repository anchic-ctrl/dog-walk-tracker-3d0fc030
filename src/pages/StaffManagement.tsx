import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Shield, ShieldAlert, User, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Tables } from '@/integrations/supabase/types';

type Member = Tables<'members'>;

const StaffManagement = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth(); // To avoid modifying self if needed, though id might be different from user_id

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .order('created_at', { ascending: false });

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
            toast({
                title: '更新失敗',
                description: '無法更改權限',
                variant: 'destructive',
            });
        }
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
                        <p className="text-sm text-muted-foreground">
                            管理員工權限與查看名單
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">員工</TableHead>
                                <TableHead>狀態</TableHead>
                                <TableHead>權限</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {member.email}
                                            </div>
                                            {member.is_super_admin && (
                                                <span className="text-xs text-primary mt-1 flex items-center gap-1">
                                                    <ShieldAlert className="h-3 w-3" /> 超級管理員
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={member.status === 'active' ? 'default' : 'secondary'}
                                            className={member.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
                                        >
                                            {member.status === 'active' ? '啟用中' :
                                                member.status === 'invited' ? '邀請中' : '已停用'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                                                {member.role === 'admin' ? '管理員' : '員工'}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Select
                                            disabled={member.is_super_admin} // Cannot change super admin role easily
                                            value={member.role}
                                            onValueChange={(value) => handleRoleChange(member.id, value as 'admin' | 'staff')}
                                        >
                                            <SelectTrigger className="w-[110px] ml-auto">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="staff">一般員工</SelectItem>
                                                <SelectItem value="admin">管理員</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export default StaffManagement;
