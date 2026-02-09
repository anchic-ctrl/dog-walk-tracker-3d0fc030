import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

interface DogPhotoUploadProps {
  dogId: string;
  dogName: string;
  onUploadSuccess: (photoUrl: string) => void;
}

const DogPhotoUpload = ({ dogId, dogName, onUploadSuccess }: DogPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: '無效的文件',
        description: '請選擇圖片文件',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploading(true);

      // Create a unique filename using dogId and timestamp
      const timestamp = Date.now();
      const ext = file.name.split('.').pop();
      const filename = `${dogId}_${timestamp}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('dog-photos')
        .upload(filename, file, { upsert: false });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from('dog-photos')
        .getPublicUrl(filename);

      const photoUrl = data.publicUrl;

      // Update database with the photo URL
      const { error: updateError } = await supabase
        .from('dogs')
        .update({ photo_url: photoUrl })
        .eq('id', dogId);

      if (updateError) throw updateError;

      toast({
        title: '成功',
        description: `${dogName}的照片已上傳並保存`
      });

      onUploadSuccess(photoUrl);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: '上傳失敗',
        description: '無法上傳照片，請重試',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        variant="outline"
        className="w-full"
        size="sm"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            上傳中...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            上傳照片
          </>
        )}
      </Button>
    </div>
  );
};

export default DogPhotoUpload;
