import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Edit2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import DogPhotoUpload from '@/components/DogPhotoUpload';

type DbDog = Tables<'dogs'>;

const DogManagement = () => {
  const [dogs, setDogs] = useState<DbDog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DbDog>>({});
  const { toast } = useToast();

  // Fetch dogs from database
  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('name');

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Failed to fetch dogs:', error);
      toast({
        title: '載入失敗',
        description: '無法載入狗狗列表',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dog: DbDog) => {
    setEditingId(dog.id);
    setFormData(dog);
  };

  const handlePhotoUploadSuccess = (dogId: string, photoUrl: string) => {
    // Update local state
    setDogs(dogs.map(dog => 
      dog.id === dogId ? { ...dog, photo: photoUrl } : dog
    ));
    toast({
      title: '成功',
      description: '照片已更新'
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('dogs')
        .update({
          name: formData.name,
          breed: formData.breed,
          additional_notes: formData.additional_notes,
          photo_url: formData.photo_url,
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: '成功',
        description: '狗狗資料已更新'
      });
      setEditingId(null);
      fetchDogs();
    } catch (error) {
      console.error('Failed to save:', error);
      toast({
        title: '保存失敗',
        description: '無法更新狗狗資料',
        variant: 'destructive'
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">狗狗管理</h1>
          <p className="text-muted-foreground">管理狗狗資料和上傳照片</p>
        </div>

        {editingId && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>編輯狗狗資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">名字</label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">品種</label>
                <Input
                  value={formData.breed || ''}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">備註</label>
                <Textarea
                  value={formData.additional_notes || ''}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} variant="default">
                  保存
                </Button>
                <Button onClick={() => setEditingId(null)} variant="outline">
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dogs.map((dog) => (
            <Card key={dog.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted overflow-hidden">
                {dog.photo_url ? (
                  <img
                    src={dog.photo_url}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{dog.name}</CardTitle>
                <CardDescription>{dog.breed}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>房間色: {dog.room_color || 'N/A'}</p>
                  <p>房號: {dog.room_number || 'N/A'}</p>
                  <p>大小: {dog.size || 'N/A'}</p>
                </div>
                
                <DogPhotoUpload 
                  dogId={dog.id}
                  dogName={dog.name}
                  onUploadSuccess={() => handlePhotoUploadSuccess(dog.id, '')}
                />

                <Button 
                  onClick={() => handleEdit(dog)}
                  variant="outline"
                  className="w-full"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  編輯資料
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DogManagement;
