import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit2, Trash2, Dog, ArrowLeft, Search, CalendarDays } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import DogFormDialog from '@/components/DogFormDialog';
import { useDogs } from '@/context/DogsContext';

type DbDog = Tables<'dogs'>;

const sizeLabel: Record<string, string> = { S: '小型', M: '中型', L: '大型' };
const roomColorEmoji: Record<string, string> = { '黃': '🟡', '綠': '🟢', '藍': '🔵', '紅': '🔴' };

const DogManagement = () => {
  const [dogs, setDogs] = useState<DbDog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshDogs } = useDogs();

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<DbDog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DbDog | null>(null);

  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('room_color')
        .order('room_number')
        .order('name');

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Failed to fetch dogs:', error);
      toast({
        title: '載入失敗',
        description: '無法載入狗狗列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingDog(null);
    setFormOpen(true);
  };

  const handleEdit = (dog: DbDog) => {
    setEditingDog(dog);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from('dogs').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast({ title: '已刪除', description: `${deleteTarget.name} 已從系統移除` });
      setDeleteTarget(null);
      fetchDogs();
      refreshDogs();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({ title: '刪除失敗', description: '無法刪除此筆資料', variant: 'destructive' });
    }
  };

  const filteredDogs = dogs.filter(dog => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      dog.name.toLowerCase().includes(q) ||
      dog.breed.toLowerCase().includes(q) ||
      dog.room_color.includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="狗狗管理" showBack onBack={() => navigate('/')} hideManagementIcons={true}>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground hidden sm:block">
            共 {dogs.length} 隻狗狗
          </p>
          <Button onClick={handleCreate} className="font-semibold px-3 h-9">
            <Plus className="h-4 w-4 mr-1" />
            新增狗狗
          </Button>
        </div>
      </Header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜尋名字、品種、房間顏色..."
            className="pl-10"
          />
        </div>

        {/* Dog Grid */}
        {filteredDogs.length === 0 ? (
          <div className="text-center py-16">
            <Dog className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery ? '找不到符合的狗狗' : '尚未新增任何狗狗'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-1" /> 新增第一隻狗狗
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDogs.map((dog) => (
              <Card key={dog.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 group">
                {/* Photo */}
                <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                  {dog.photo_url ? (
                    <img
                      src={dog.photo_url}
                      alt={dog.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/15">
                      <Dog className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs font-medium">
                      {roomColorEmoji[dog.room_color] || ''} {dog.room_color}{dog.room_number}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs font-medium">
                      {sizeLabel[dog.size] || dog.size}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{dog.name}</CardTitle>
                  <CardDescription>{dog.breed}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>{dog.check_in_date || '?'} ~ {dog.check_out_date || '?'}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(dog)} variant="outline" size="sm" className="flex-1">
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      編輯
                    </Button>
                    <Button
                      onClick={() => setDeleteTarget(dog)}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <DogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        dog={editingDog}
        onSuccess={() => {
          fetchDogs();
          refreshDogs();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除 {deleteTarget?.name} 嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。所有與 {deleteTarget?.name} 相關的資料都會被永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DogManagement;
