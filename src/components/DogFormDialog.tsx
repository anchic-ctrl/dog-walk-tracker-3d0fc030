import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Upload, Camera, Check, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { FoodInfo, FoodSource, SupplementItem, MedicationItem, FeedingMethod, IndoorNotes } from '@/types/dog';

type DbDog = Tables<'dogs'>;

interface WalkingNotes {
    pullsOnLeash: boolean;
    reactiveToOtherDogs: boolean;
    singleLeash: boolean;
    chasesCars: boolean;
    notes: string;
}

const defaultWalkingNotes: WalkingNotes = {
    pullsOnLeash: false,
    reactiveToOtherDogs: false,
    singleLeash: false,
    chasesCars: false,
    notes: '',
};

const defaultIndoorNotes: IndoorNotes = {
    requiresPeePad: false,
    requiresDiaper: false,
};

const BREED_OPTIONS = ['米克斯', '瑪爾濟斯', '貴賓', '標準貴賓', '法鬥', '惡霸'] as const;
const CUSTOM_BREED_VALUE = '__custom__';

const FEEDING_METHOD_OPTIONS: FeedingMethod[] = ['加飯裡', '用塞的', '直接吃', '外用塗抹', '膠囊打開放飯', '磨碎加飯裡'];
const FOOD_SOURCE_OPTIONS: FoodSource[] = ['自備', '店家提供'];

const defaultFoodInfo: FoodInfo = {
    description: '',
    foodSource: '自備',
    forbiddenFood: '',
    remainingCount: '',
};

const emptySupplementItem: SupplementItem = {
    name: '',
    dosage: '',
    frequency: '',
    method: '加飯裡',
};

const emptyMedicationItem: MedicationItem = {
    name: '',
    dosage: '',
    frequency: '',
    method: '加飯裡',
    condition: '',
    remainingCount: '',
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
    const [breedSelection, setBreedSelection] = useState<string>('');
    const [customBreed, setCustomBreed] = useState('');
    const [tempCustomBreed, setTempCustomBreed] = useState('');
    const [breedPopoverOpen, setBreedPopoverOpen] = useState(false);
    const [size, setSize] = useState<'S' | 'M' | 'L'>('M');
    const [roomColor, setRoomColor] = useState<'黃' | '綠' | '藍' | '紅'>('黃');
    const [roomNumber, setRoomNumber] = useState<number>(1);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');

    // JSON field state
    const [walkingNotes, setWalkingNotes] = useState<WalkingNotes>(defaultWalkingNotes);
    const [indoorNotes, setIndoorNotes] = useState<IndoorNotes>(defaultIndoorNotes);
    const [foodInfo, setFoodInfo] = useState<FoodInfo>(defaultFoodInfo);
    const [supplements, setSupplements] = useState<SupplementItem[]>([]);
    const [medications, setMedications] = useState<MedicationItem[]>([]);

    // Populate form when editing
    useEffect(() => {
        if (dog) {
            setName(dog.name);
            setBreed(dog.breed);
            if (BREED_OPTIONS.includes(dog.breed as typeof BREED_OPTIONS[number])) {
                setBreedSelection(dog.breed);
                setCustomBreed('');
                setTempCustomBreed('');
            } else {
                setBreedSelection(CUSTOM_BREED_VALUE);
                setCustomBreed(dog.breed);
                setTempCustomBreed(dog.breed);
            }
            setSize(dog.size);
            setRoomColor(dog.room_color);
            setRoomNumber(dog.room_number);
            setPhotoUrl(dog.photo_url);
            setAdditionalNotes(dog.additional_notes || '');
            setCheckInDate(dog.check_in_date || '');
            setCheckOutDate(dog.check_out_date || '');
            setWalkingNotes({ ...defaultWalkingNotes, ...(dog.walking_notes as unknown as WalkingNotes) });
            setIndoorNotes({ ...defaultIndoorNotes, ...(dog.indoor_notes as unknown as IndoorNotes) });
            // Backward-compatible food info parsing
            const rawFood = dog.food_info as unknown as Record<string, any>;
            if (rawFood) {
                setFoodInfo({
                    description: rawFood.description || rawFood.specialInstructions || '',
                    foodSource: rawFood.foodSource || '自備',
                    forbiddenFood: rawFood.forbiddenFood || '',
                    remainingCount: rawFood.remainingCount || '',
                });
            } else {
                setFoodInfo(defaultFoodInfo);
            }
            const rawMedInfo = dog.medication_info as unknown as Record<string, any>;
            setSupplements(rawMedInfo?.supplements || []);
            setMedications(rawMedInfo?.medications || []);
        } else {
            // Reset for create mode
            setName('');
            setBreed('');
            setBreedSelection('');
            setCustomBreed('');
            setTempCustomBreed('');
            setBreedPopoverOpen(false);
            setSize('M');
            setRoomColor('黃');
            setRoomNumber(1);
            setPhotoUrl(null);
            setAdditionalNotes('');
            setCheckInDate('');
            setCheckOutDate('');
            setWalkingNotes(defaultWalkingNotes);
            setIndoorNotes(defaultIndoorNotes);
            setFoodInfo(defaultFoodInfo);
            setSupplements([]);
            setMedications([]);
        }
    }, [dog, open]);

    useEffect(() => {
        if (breedSelection === CUSTOM_BREED_VALUE) {
            setBreed(customBreed);
        }
    }, [breedSelection, customBreed]);

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
        if (checkInDate && checkOutDate && checkOutDate < checkInDate) {
            toast({ title: '日期錯誤', description: '退房日期不能早於入住日期', variant: 'destructive' });
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
                photo_url: photoUrl,
                additional_notes: additionalNotes.trim() || null,
                walking_notes: walkingNotes as unknown as Record<string, unknown>,
                indoor_notes: indoorNotes as unknown as Record<string, unknown>,
                food_info: foodInfo as unknown as Record<string, unknown>,
                medication_info: { supplements, medications } as unknown as Record<string, unknown>,
                check_in_date: checkInDate || null,
                check_out_date: checkOutDate || null,
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
            <DialogContent className="max-w-2xl h-[90vh] p-0 flex flex-col overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                    <DialogTitle className="text-xl font-bold">
                        {isEdit ? `編輯 ${dog?.name}` : '新增狗狗'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        填寫狗狗的基本資料、散步注意事項、飲食資訊及用藥資訊。
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <Tabs defaultValue="basic" className="w-full px-6">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="basic">基本資料</TabsTrigger>
                            <TabsTrigger value="walking">散步注意</TabsTrigger>
                            <TabsTrigger value="food">飲食</TabsTrigger>
                            <TabsTrigger value="medication">用藥</TabsTrigger>
                        </TabsList>

                        {/* === 基本資料 === */}
                        <TabsContent value="basic" className="space-y-4 pb-6 px-1">
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
                                    <Popover open={breedPopoverOpen} onOpenChange={setBreedPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={breedPopoverOpen}
                                                className="w-full justify-between font-normal text-left"
                                            >
                                                <span className="truncate">
                                                    {breedSelection === CUSTOM_BREED_VALUE
                                                        ? (customBreed || '其他')
                                                        : (breedSelection || '請選擇品種')}
                                                </span>
                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                                            <div className="flex flex-col">
                                                {BREED_OPTIONS.map((option) => (
                                                    <Button
                                                        key={option}
                                                        variant="ghost"
                                                        className="justify-start font-normal h-9 px-2 gap-2"
                                                        onClick={() => {
                                                            setBreedSelection(option);
                                                            setBreed(option);
                                                            setBreedPopoverOpen(false);
                                                            setTempCustomBreed('');
                                                        }}
                                                    >
                                                        <div className="w-4 flex items-center justify-center">
                                                            {breedSelection === option && <Check className="h-4 w-4" />}
                                                        </div>
                                                        {option}
                                                    </Button>
                                                ))}

                                                <div className="flex items-center px-2 py-1.5 gap-2 border-t mt-1 bg-muted/30">
                                                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">其他:</span>
                                                    <div className="relative flex-1">
                                                        <Input
                                                            className="h-8 pr-16 text-sm bg-background border-muted-foreground/20 focus-visible:ring-1"
                                                            value={tempCustomBreed}
                                                            onChange={(e) => setTempCustomBreed(e.target.value)}
                                                            placeholder="輸入其他品種"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && tempCustomBreed.trim()) {
                                                                    setBreedSelection(CUSTOM_BREED_VALUE);
                                                                    setCustomBreed(tempCustomBreed.trim());
                                                                    setBreed(tempCustomBreed.trim());
                                                                    setBreedPopoverOpen(false);
                                                                }
                                                            }}
                                                        />
                                                        {tempCustomBreed.trim() && (
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-1">
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-100/50"
                                                                    onClick={() => {
                                                                        setBreedSelection(CUSTOM_BREED_VALUE);
                                                                        setCustomBreed(tempCustomBreed.trim());
                                                                        setBreed(tempCustomBreed.trim());
                                                                        setBreedPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 text-destructive hover:text-destructive hover:bg-red-100/50"
                                                                    onClick={() => setTempCustomBreed('')}
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>入住日期</Label>
                                    <Input
                                        type="date"
                                        value={checkInDate}
                                        onChange={e => setCheckInDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>退房日期</Label>
                                    <Input
                                        type="date"
                                        value={checkOutDate}
                                        onChange={e => setCheckOutDate(e.target.value)}
                                    />
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

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-base">室內放風需求</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                                        <Label className="cursor-pointer" htmlFor="requires-pee-pad">需要尿布墊</Label>
                                        <Switch
                                            id="requires-pee-pad"
                                            checked={indoorNotes.requiresPeePad}
                                            onCheckedChange={v => setIndoorNotes(prev => ({ ...prev, requiresPeePad: v }))}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg border border-border/50">
                                        <Label className="cursor-pointer" htmlFor="requires-diaper">包尿布 (禮貌帶)</Label>
                                        <Switch
                                            id="requires-diaper"
                                            checked={indoorNotes.requiresDiaper}
                                            onCheckedChange={v => setIndoorNotes(prev => ({ ...prev, requiresDiaper: v }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

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
                        <TabsContent value="walking" className="space-y-4 pb-6 px-1">
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
                                    <Label className="text-base">單牽</Label>
                                    <Switch
                                        checked={walkingNotes.singleLeash}
                                        onCheckedChange={v => setWalkingNotes(prev => ({ ...prev, singleLeash: v }))}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <Label className="text-base">追車</Label>
                                    <Switch
                                        checked={walkingNotes.chasesCars}
                                        onCheckedChange={v => setWalkingNotes(prev => ({ ...prev, chasesCars: v }))}
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
                        <TabsContent value="food" className="space-y-4 pb-6 px-1">
                            <div className="space-y-2">
                                <Label>吃飯方式</Label>
                                <Textarea
                                    value={foodInfo.description}
                                    onChange={e => setFoodInfo(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="例：早晚一包鮮食 + 50~80cc水 + 2匙凍乾"
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>飼料來源</Label>
                                    <Select value={foodInfo.foodSource} onValueChange={(v) => setFoodInfo(prev => ({ ...prev, foodSource: v as FoodSource }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {FOOD_SOURCE_OPTIONS.map(opt => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>剩餘數量（選填）</Label>
                                    <Input
                                        value={foodInfo.remainingCount || ''}
                                        onChange={e => setFoodInfo(prev => ({ ...prev, remainingCount: e.target.value }))}
                                        placeholder="例：共26包"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>禁食項目</Label>
                                <Input
                                    value={foodInfo.forbiddenFood}
                                    onChange={e => setFoodInfo(prev => ({ ...prev, forbiddenFood: e.target.value }))}
                                    placeholder="例：雞肉（過敏）"
                                />
                            </div>

                            <Separator />

                            {/* 保健品列表 */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">保健品</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSupplements(prev => [...prev, { ...emptySupplementItem }])}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> 新增
                                    </Button>
                                </div>
                                {supplements.length === 0 && (
                                    <p className="text-sm text-muted-foreground">尚無保健品</p>
                                )}
                                {supplements.map((item, idx) => (
                                    <div key={idx} className="border rounded-lg p-3 space-y-3 relative">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => setSupplements(prev => prev.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid grid-cols-2 gap-3 pr-8">
                                            <div className="space-y-1">
                                                <Label className="text-xs">品名</Label>
                                                <Input
                                                    value={item.name}
                                                    onChange={e => setSupplements(prev => prev.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                                                    placeholder="例：Wakamoto"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">劑量</Label>
                                                <Input
                                                    value={item.dosage}
                                                    onChange={e => setSupplements(prev => prev.map((s, i) => i === idx ? { ...s, dosage: e.target.value } : s))}
                                                    placeholder="例：一顆"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">頻率</Label>
                                                <Input
                                                    value={item.frequency}
                                                    onChange={e => setSupplements(prev => prev.map((s, i) => i === idx ? { ...s, frequency: e.target.value } : s))}
                                                    placeholder="例：每次飯後"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">餵食方式</Label>
                                                <Select value={item.method} onValueChange={(v) => setSupplements(prev => prev.map((s, i) => i === idx ? { ...s, method: v as FeedingMethod } : s))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {FEEDING_METHOD_OPTIONS.map(opt => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* === 用藥資訊 === */}
                        <TabsContent value="medication" className="space-y-4 pb-6 px-1">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">藥品</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setMedications(prev => [...prev, { ...emptyMedicationItem }])}
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> 新增藥品
                                    </Button>
                                </div>
                                {medications.length === 0 && (
                                    <p className="text-sm text-muted-foreground">尚無藥品</p>
                                )}
                                {medications.map((item, idx) => (
                                    <div key={idx} className="border rounded-lg p-3 space-y-3 relative">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => setMedications(prev => prev.filter((_, i) => i !== idx))}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <div className="grid grid-cols-2 gap-3 pr-8">
                                            <div className="space-y-1">
                                                <Label className="text-xs">藥名</Label>
                                                <Input
                                                    value={item.name}
                                                    onChange={e => setMedications(prev => prev.map((m, i) => i === idx ? { ...m, name: e.target.value } : m))}
                                                    placeholder="例：CystoPro"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">劑量</Label>
                                                <Input
                                                    value={item.dosage}
                                                    onChange={e => setMedications(prev => prev.map((m, i) => i === idx ? { ...m, dosage: e.target.value } : m))}
                                                    placeholder="例：一顆"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">頻率</Label>
                                                <Input
                                                    value={item.frequency}
                                                    onChange={e => setMedications(prev => prev.map((m, i) => i === idx ? { ...m, frequency: e.target.value } : m))}
                                                    placeholder="例：早晚各一次"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">餵藥方式</Label>
                                                <Select value={item.method} onValueChange={(v) => setMedications(prev => prev.map((m, i) => i === idx ? { ...m, method: v as FeedingMethod } : m))}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {FEEDING_METHOD_OPTIONS.map(opt => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs">使用條件 / 備註</Label>
                                                <Input
                                                    value={item.condition}
                                                    onChange={e => setMedications(prev => prev.map((m, i) => i === idx ? { ...m, condition: e.target.value } : m))}
                                                    placeholder="例：若血尿才給"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs">剩餘數量（選填）</Label>
                                                <Input
                                                    value={item.remainingCount || ''}
                                                    onChange={e => setMedications(prev => prev.map((m, i) => i === idx ? { ...m, remainingCount: e.target.value } : m))}
                                                    placeholder="例：剩129顆"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </ScrollArea>

                <DialogFooter className="bg-background border-t px-6 py-4 flex justify-center sm:justify-center gap-3 shrink-0">
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
            </DialogContent >
        </Dialog >
    );
}
