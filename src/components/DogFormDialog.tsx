import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Loader2, Upload, Camera } from 'lucide-react';

type DbDog = Tables<'dogs'>;

interface WalkingNotes {
    pullsOnLeash: boolean;
    reactiveToOtherDogs: boolean;
    needsMuzzle: boolean;
    mustWalkAlone: boolean;
    notes: string;
}

interface FoodInfo {
    foodType: string;
    feedingTime: string;
    specialInstructions: string;
    forbiddenFood: string;
}

interface MedicationInfo {
    medicationName: string;
    frequency: string;
    howToGive: string;
    notes: string;
}

const defaultWalkingNotes: WalkingNotes = {
    pullsOnLeash: false,
    reactiveToOtherDogs: false,
    needsMuzzle: false,
    mustWalkAlone: false,
    notes: '',
};

const defaultFoodInfo: FoodInfo = {
    foodType: '',
    feedingTime: '',
    specialInstructions: '',
    forbiddenFood: '',
};

const defaultMedicationInfo: MedicationInfo = {
    medicationName: '',
    frequency: '',
    howToGive: '',
    notes: '',
};

interface DogFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dog?: DbDog | null; // null = create mode
    onSuccess: () => void;
}

export default function DogFormDialog({ open, onOpenChange, dog, onSuccess }: DogFormDialogProps) {
    const isEdit = !!dog;
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
    const [roomColor, setRoomColor] = useState<'黃' | '綠' | '藍' | '紅'>('黃');
    const [roomNumber, setRoomNumber] = useState<number>(1);
    const [indoorSpace, setIndoorSpace] = useState<'1樓客廳' | '2樓大房間' | '2樓小房間'>('1樓客廳');
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [additionalNotes, setAdditionalNotes] = useState('');

    // JSON field state
    const [walkingNotes, setWalkingNotes] = useState<WalkingNotes>(defaultWalkingNotes);
    const [foodInfo, setFoodInfo] = useState<FoodInfo>(defaultFoodInfo);
    const [medicationInfo, setMedicationInfo] = useState<MedicationInfo>(defaultMedicationInfo);

    // Populate form when editing
    useEffect(() => {
        if (dog) {
            setName(dog.name);
            setBreed(dog.breed);
            setSize(dog.size);
            setRoomColor(dog.room_color);
            setRoomNumber(dog.room_number);
            setIndoorSpace(dog.indoor_space);
            setPhotoUrl(dog.photo_url);
            setAdditionalNotes(dog.additional_notes || '');
            setWalkingNotes({ ...defaultWalkingNotes, ...(dog.walking_notes as unknown as WalkingNotes) });
            setFoodInfo({ ...defaultFoodInfo, ...(dog.food_info as unknown as FoodInfo) });
            setMedicationInfo({ ...defaultMedicationInfo, ...(dog.medication_info as unknown as MedicationInfo) });
        } else {
            // Reset for create mode
            setName('');
            setBreed('');
            setSize('M');
            setRoomColor('黃');
            setRoomNumber(1);
            setIndoorSpace('1樓客廳');
            setPhotoUrl(null);
            setAdditionalNotes('');
            setWalkingNotes(defaultWalkingNotes);
            setFoodInfo(defaultFoodInfo);
            setMedicationInfo(defaultMedicationInfo);
        }
    }, [dog, open]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast({ title: '無效的檔案', description: '請選擇圖片檔案', variant: 'destructive' });
            return;
        }

        try {
            setUploading(true);
            const timestamp = Date.now();
            const ext = file.name.split('.').pop();
            const filename = `${dog?.id || 'new'}_${timestamp}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('dog-photos')
                .upload(filename, file, { upsert: false });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('dog-photos').getPublicUrl(filename);
            setPhotoUrl(data.publicUrl);

            toast({ title: '上傳成功', description: '照片已上傳' });
        } catch (error) {
            console.error('Upload failed:', error);
            toast({ title: '上傳失敗', description: '無法上傳照片，請重試', variant: 'destructive' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        // Validation
        if (!name.trim()) {
            toast({ title: '請輸入名字', variant: 'destructive' });
            return;
        }
        if (!breed.trim()) {
            toast({ title: '請輸入品種', variant: 'destructive' });
            return;
        }

        setSaving(true);
        try {
            const dogData = {
                name: name.trim(),
                breed: breed.trim(),
                size,
                room_color: roomColor,
                room_number: roomNumber,
                indoor_space: indoorSpace,
                photo_url: photoUrl,
                additional_notes: additionalNotes.trim() || null,
                walking_notes: walkingNotes as unknown as Record<string, unknown>,
                food_info: foodInfo as unknown as Record<string, unknown>,
                medication_info: medicationInfo as unknown as Record<string, unknown>,
            };

            if (isEdit && dog) {
                const { error } = await supabase
                    .from('dogs')
                    .update(dogData as TablesUpdate<'dogs'>)
                    .eq('id', dog.id);
                if (error) throw error;
                toast({ title: '成功', description: `${name} 的資料已更新` });
            } else {
                const { error } = await supabase
                    .from('dogs')
                    .insert(dogData as TablesInsert<'dogs'>);
                if (error) throw error;
                toast({ title: '成功', description: `${name} 已新增` });
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Save failed:', error);
            toast({ title: '儲存失敗', description: '無法儲存資料，請重試', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] p-0">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-xl font-bold">
                        {isEdit ? `編輯 ${dog?.name}` : '新增狗狗'}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="px-6 max-h-[calc(90vh-10rem)]">
                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="basic">基本資料</TabsTrigger>
                            <TabsTrigger value="walking">散步注意</TabsTrigger>
                            <TabsTrigger value="food">飲食</TabsTrigger>
                            <TabsTrigger value="medication">用藥</TabsTrigger>
                        </TabsList>

                        {/* === 基本資料 === */}
                        <TabsContent value="basic" className="space-y-4 pb-4">
                            {/* Photo */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-28 h-28 rounded-2xl bg-muted overflow-hidden border-2 border-dashed border-border flex items-center justify-center">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> 上傳中...</>
                                    ) : (
                                        <><Upload className="h-4 w-4 mr-1" /> {photoUrl ? '更換照片' : '上傳照片'}</>
                                    )}
                                </Button>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>名字 *</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="例：Max" />
                                </div>
                                <div className="space-y-2">
                                    <Label>品種 *</Label>
                                    <Input value={breed} onChange={e => setBreed(e.target.value)} placeholder="例：黃金獵犬" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>體型</Label>
                                    <Select value={size} onValueChange={(v) => setSize(v as 'S' | 'M' | 'L')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="S">S（小型）</SelectItem>
                                            <SelectItem value="M">M（中型）</SelectItem>
                                            <SelectItem value="L">L（大型）</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>房間顏色</Label>
                                    <Select value={roomColor} onValueChange={(v) => setRoomColor(v as typeof roomColor)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="黃">🟡 黃</SelectItem>
                                            <SelectItem value="綠">🟢 綠</SelectItem>
                                            <SelectItem value="藍">🔵 藍</SelectItem>
                                            <SelectItem value="紅">🔴 紅</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>房號</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={roomNumber}
                                        onChange={e => setRoomNumber(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>室內活動空間</Label>
                                <Select value={indoorSpace} onValueChange={(v) => setIndoorSpace(v as typeof indoorSpace)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1樓客廳">1樓客廳</SelectItem>
                                        <SelectItem value="2樓大房間">2樓大房間</SelectItem>
                                        <SelectItem value="2樓小房間">2樓小房間</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>其他備註</Label>
                                <Textarea
                                    value={additionalNotes}
                                    onChange={e => setAdditionalNotes(e.target.value)}
                                    placeholder="例：對工作人員很友善，喜歡被摸肚子。"
                                    rows={3}
                                />
                            </div>
                        </TabsContent>

                        {/* === 散步注意事項 === */}
                        <TabsContent value="walking" className="space-y-4 pb-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">會暴衝</Label>
                                    <Switch
                                        checked={walkingNotes.pullsOnLeash}
                                        onCheckedChange={v => setWalkingNotes(prev => ({ ...prev, pullsOnLeash: v }))}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">對其他狗有反應</Label>
                                    <Switch
                                        checked={walkingNotes.reactiveToOtherDogs}
                                        onCheckedChange={v => setWalkingNotes(prev => ({ ...prev, reactiveToOtherDogs: v }))}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">需要戴口罩</Label>
                                    <Switch
                                        checked={walkingNotes.needsMuzzle}
                                        onCheckedChange={v => setWalkingNotes(prev => ({ ...prev, needsMuzzle: v }))}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">必須單獨散步</Label>
                                    <Switch
                                        checked={walkingNotes.mustWalkAlone}
                                        onCheckedChange={v => setWalkingNotes(prev => ({ ...prev, mustWalkAlone: v }))}
                                    />
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label>散步備註</Label>
                                    <Textarea
                                        value={walkingNotes.notes}
                                        onChange={e => setWalkingNotes(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="例：喜歡停下來聞東西，請耐心等待。"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* === 飲食資訊 === */}
                        <TabsContent value="food" className="space-y-4 pb-4">
                            <div className="space-y-2">
                                <Label>飼料種類</Label>
                                <Input
                                    value={foodInfo.foodType}
                                    onChange={e => setFoodInfo(prev => ({ ...prev, foodType: e.target.value }))}
                                    placeholder="例：Royal Canin 大型犬成犬糧"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>餵食時間</Label>
                                <Input
                                    value={foodInfo.feedingTime}
                                    onChange={e => setFoodInfo(prev => ({ ...prev, feedingTime: e.target.value }))}
                                    placeholder="例：早上 8:00 / 晚上 6:00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>特殊指示</Label>
                                <Textarea
                                    value={foodInfo.specialInstructions}
                                    onChange={e => setFoodInfo(prev => ({ ...prev, specialInstructions: e.target.value }))}
                                    placeholder="例：加溫水軟化飼料"
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>禁食項目</Label>
                                <Input
                                    value={foodInfo.forbiddenFood}
                                    onChange={e => setFoodInfo(prev => ({ ...prev, forbiddenFood: e.target.value }))}
                                    placeholder="例：雞肉（過敏）"
                                />
                            </div>
                        </TabsContent>

                        {/* === 用藥資訊 === */}
                        <TabsContent value="medication" className="space-y-4 pb-4">
                            <div className="space-y-2">
                                <Label>藥品名稱</Label>
                                <Input
                                    value={medicationInfo.medicationName}
                                    onChange={e => setMedicationInfo(prev => ({ ...prev, medicationName: e.target.value }))}
                                    placeholder="例：關節保健品"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>頻率</Label>
                                <Input
                                    value={medicationInfo.frequency}
                                    onChange={e => setMedicationInfo(prev => ({ ...prev, frequency: e.target.value }))}
                                    placeholder="例：每日一次"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>給藥方式</Label>
                                <Input
                                    value={medicationInfo.howToGive}
                                    onChange={e => setMedicationInfo(prev => ({ ...prev, howToGive: e.target.value }))}
                                    placeholder="例：混入食物中"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>用藥備註</Label>
                                <Textarea
                                    value={medicationInfo.notes}
                                    onChange={e => setMedicationInfo(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="例：早餐時給予"
                                    rows={2}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </ScrollArea>

                <DialogFooter className="px-6 pb-6 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> 儲存中...</>
                        ) : (
                            isEdit ? '儲存變更' : '新增狗狗'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
