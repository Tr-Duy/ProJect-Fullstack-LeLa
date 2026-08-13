import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, ArrowLeft, Upload, Wand2, Volume2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Modal as AntdModal, Pagination } from 'antd'; // Keeping message for toast notifications
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flashcardsApi } from '../api/flashcards.api';
import { tagsApi } from '../../master-data/api/tags.api';
import type { FlashcardResponse } from '../../../shared/types/lela';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { apiClient } from '../../../shared/lib/api';

type FormValues = {
  frontText: string;
  backText: string;
  phonetic: string;
  exampleText: string;
  frontImageUrl: string;
  frontAudioUrl: string;
  hint: string;
  cardColor: string;
  tagIds: number[];
  isActive: boolean;
};

const CARD_COLORS = [
  { value: 'bg-brand-coral', label: 'Coral' },
  { value: 'bg-brand-teal', label: 'Teal' },
  { value: 'bg-brand-navy', label: 'Navy' },
  { value: 'bg-[#FFB703]', label: 'Yellow' },
  { value: 'bg-[#FB8500]', label: 'Orange' },
  { value: 'bg-[#FF006E]', label: 'Pink' },
  { value: 'bg-[#8338EC]', label: 'Violet' }
];

function SortableRow({ card, openModal, deleteMutation, onManualReorder }: any) {
  const [inputValue, setInputValue] = useState(card.cardOrder);
  
  useEffect(() => {
    setInputValue(card.cardOrder);
  }, [card.cardOrder]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' as any : 'static' as any,
  };

  return (
    <tr ref={setNodeRef} style={style} className={`hover:bg-geist-gray-100/50 transition-colors ${isDragging ? 'bg-geist-bg-100 shadow-md ring-1 ring-geist-gray-300' : ''}`}>
      <td className="px-4 py-3">
        <button {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing text-geist-gray-400 hover:text-geist-gray-700 rounded transition-colors touch-none">
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-4 py-3 font-mono text-geist-gray-900">{card.id}</td>
      <td className="px-4 py-3">
        <input 
          type="number" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-16 h-7 px-2 text-xs border border-geist-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-geist-blue-500 bg-transparent"
          onBlur={() => {
            const val = parseInt(inputValue, 10);
            if (!isNaN(val) && val !== card.cardOrder) {
              onManualReorder(card, val);
            } else {
              setInputValue(card.cardOrder);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
        />
      </td>
      <td className="px-4 py-3 text-geist-gray-1000 font-medium whitespace-pre-wrap max-w-xs">{card.frontText}</td>
      <td className="px-4 py-3 text-geist-gray-1000 whitespace-pre-wrap max-w-xs">{card.backText}</td>
      <td className="px-4 py-3 text-geist-gray-700">{card.phonetic}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => openModal(card)} title="Chỉnh sửa">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-geist-red-800 hover:text-geist-red-900 hover:bg-geist-red-100"
            title="Xóa"
            onClick={() => {
              AntdModal.confirm({
                title: 'Xác nhận xóa',
                content: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa?',
                okText: 'Xóa',
                cancelText: 'Hủy',
                okButtonProps: { danger: true },
                onOk: () => deleteMutation.mutate(card.id),
              });
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function FlashcardsAdminPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardResponse | null>(null);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);
  const [isPixabayModalOpen, setIsPixabayModalOpen] = useState(false);
  const [pixabayQuery, setPixabayQuery] = useState('');
  const [pixabayResults, setPixabayResults] = useState<any[]>([]);
  const [isPixabayLoading, setIsPixabayLoading] = useState(false);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { register, handleSubmit, reset, watch, setValue, getValues, formState: { errors } } = useForm<FormValues>();

  const { data, isLoading } = useQuery({
    queryKey: ['flashcards', deckId, currentPage, pageSize],
    queryFn: () => flashcardsApi.getByDeckId(Number(deckId), { page: currentPage - 1, size: pageSize, sortBy: 'cardOrder', direction: 'asc' }),
    enabled: !!deckId,
  });

  const [localCardsState, setLocalCardsState] = useState<FlashcardResponse[]>([]);
  
  useEffect(() => {
    if (data?.content) {
      setLocalCardsState(data.content);
    }
  }, [data?.content]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editingCard
        ? flashcardsApi.update(editingCard.id, { ...values, deckId: Number(deckId), createdById: Number(user?.id) })
        : flashcardsApi.create({ ...values, deckId: Number(deckId), createdById: Number(user?.id) }),
    onSuccess: () => {
      message.success(editingCard ? 'Cập nhật thẻ thành công' : 'Tạo thẻ thành công');
      setIsModalOpen(false);
      reset();
      setEditingCard(null);
      queryClient.invalidateQueries({ queryKey: ['flashcards', deckId] });
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => flashcardsApi.delete(id),
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['flashcards', deckId] });
      const previousCards = queryClient.getQueryData(['flashcards', deckId, currentPage, pageSize]);
      
      // Optimistically update local state
      setLocalCardsState(prev => prev.filter(c => c.id !== id));
      
      return { previousCards };
    },
    onSuccess: () => {
      message.success('Xóa thẻ thành công');
      queryClient.invalidateQueries({ queryKey: ['flashcards', deckId] });
    },
    onError: (err: any, _, context: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra');
      if (context?.previousCards) {
         setLocalCardsState((context.previousCards as any).content || []);
      }
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (cardIds: number[]) => flashcardsApi.reorder(Number(deckId), cardIds),
    onSuccess: () => {
      message.success('Cập nhật thứ tự thành công');
      queryClient.invalidateQueries({ queryKey: ['flashcards', deckId] });
    },
    onError: () => message.error('Lỗi khi sắp xếp thẻ'),
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localCardsState.findIndex((i: FlashcardResponse) => i.id === active.id);
      const newIndex = localCardsState.findIndex((i: FlashcardResponse) => i.id === over.id);
      const newItems = arrayMove(localCardsState, oldIndex, newIndex);
      
      const newOrderIds = newItems.map((item: FlashcardResponse) => item.id);
      reorderMutation.mutate(newOrderIds);
      
      setLocalCardsState(newItems);
    }
  };

  const handleManualReorder = (card: FlashcardResponse, newValue: number) => {
    let newIndex = newValue;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= localCardsState.length) newIndex = localCardsState.length - 1;
    
    const oldIndex = localCardsState.findIndex(c => c.id === card.id);
    if (oldIndex !== -1 && oldIndex !== newIndex) {
      const newItems = arrayMove(localCardsState, oldIndex, newIndex);
      const newOrderIds = newItems.map(item => item.id);
      reorderMutation.mutate(newOrderIds);
      setLocalCardsState(newItems);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (values: FormValues[]) => {
      const res = await apiClient.post('/flashcards/bulk', values);
      return res.data;
    },
    onSuccess: () => {
      message.success('Import thẻ thành công');
      setIsImportModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['flashcards', deckId] });
    },
    onError: (err: any) => message.error(err.message || 'Có lỗi xảy ra khi import'),
  });

  const createTagMutation = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: (res) => {
      message.success('Tạo tag thành công');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setNewTagName('');
      setIsCreatingTag(false);
      const currentTags = getValues('tagIds') || [];
      setValue('tagIds', [...currentTags, res.data?.id] as any);
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tag'),
  });

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate(newTagName.trim());
  };

  const handleLookup = async () => {
    const word = getValues('frontText');
    if (!word) {
      message.warning('Vui lòng nhập từ vựng trước');
      return;
    }
    setIsDictionaryLoading(true);

    setValue('phonetic', '');
    setValue('frontAudioUrl', '');
    setValue('backText', '');

    try {
      // 1. Fetch phonetic & audio from Dictionary API (handle multi-word)
      const wordsToLookup = word.trim().split(/\s+/);
      const dictPromises = wordsToLookup.map(async (w) => {
        const cleanWord = w.replace(/[^a-zA-Z]/g, '');
        if (!cleanWord) return { phonetic: w, audio: '' };

        try {
          const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
          if (res.ok) {
            const data = await res.json();
            const entry = data[0];
            let p = entry.phonetic || entry.phonetics?.find((x: any) => x.text)?.text || cleanWord;
            let a = entry.phonetics?.find((x: any) => x.audio)?.audio || '';
            return { phonetic: p, audio: a };
          }
        } catch (e) { }
        return { phonetic: cleanWord, audio: '' };
      });

      const results = await Promise.all(dictPromises);
      const fullPhonetic = results.map(r => r.phonetic).join(' ').trim();
      const firstAudioUrl = results.find(r => r.audio)?.audio || '';

      if (fullPhonetic) setValue('phonetic', fullPhonetic);
      if (firstAudioUrl) setValue('frontAudioUrl', firstAudioUrl);

      // 2. Fetch Vietnamese meaning from MyMemory API
      const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${word}&langpair=en|vi`);
      if (transRes.ok) {
        const transData = await transRes.json();
        if (transData.responseData?.translatedText) {
          setValue('backText', transData.responseData.translatedText);
        }
      }

      message.success('Đã tra cứu thành công');
    } catch (err: any) {
      message.error('Lỗi khi tra cứu');
    } finally {
      setIsDictionaryLoading(false);
    }
  };

  const handlePlayAudio = () => {
    const word = getValues('frontText');
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const searchPixabayApi = async (query: string) => {
    if (!query) return;
    const apiKey = import.meta.env.VITE_PIXABAY_KEY;
    if (!apiKey) {
      message.error('Chưa cấu hình API Key cho Pixabay trong file .env');
      return;
    }

    setIsPixabayLoading(true);
    try {
      const res = await fetch(`https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=48`);
      const data = await res.json();
      setPixabayResults(data.hits || []);
    } catch (err) {
      message.error('Lỗi khi tìm ảnh');
    } finally {
      setIsPixabayLoading(false);
    }
  };

  const handleSearchPixabay = async (e: React.FormEvent) => {
    e.preventDefault();
    searchPixabayApi(pixabayQuery);
  };

  const openPixabayModal = () => {
    const word = getValues('frontText');
    setIsPixabayModalOpen(true);
    if (word) {
      setPixabayQuery(word);
      searchPixabayApi(word);
    } else {
      setPixabayQuery('');
      setPixabayResults([]);
    }
  };

  const selectPixabayImage = (url: string) => {
    setValue('frontImageUrl', url);
    setIsPixabayModalOpen(false);
    setPixabayQuery('');
    setPixabayResults([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: any[] = [];
        if (file.name.endsWith('.json')) {
          parsed = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            let obj: any = {};
            headers.forEach((h, idx) => { obj[h] = values[idx]; });
            parsed.push(obj);
          }
        }

        const cardsToImport = parsed.map(item => ({
          frontText: item.frontText || item.Front || '',
          backText: item.backText || item.Back || '',
          phonetic: item.phonetic || item.Phonetic || '',
          exampleText: item.exampleText || item.Example || '',
          frontImageUrl: item.frontImageUrl || '',
          frontAudioUrl: item.frontAudioUrl || '',
          hint: item.hint || item.Hint || '',
          cardColor: item.cardColor || 'bg-brand-coral',
          tagIds: [],
          deckId: Number(deckId),
          createdById: Number(user?.id),
          isActive: true
        })).filter(c => c.frontText && c.backText);

        if (cardsToImport.length === 0) {
          message.error('Không tìm thấy thẻ hợp lệ trong file');
          return;
        }

        importMutation.mutate(cardsToImport);
      } catch (err) {
        message.error('File không hợp lệ hoặc lỗi parse');
      }
    };
    reader.readAsText(file);
  };

  const openModal = (card?: FlashcardResponse) => {
    if (card) {
      setEditingCard(card);
      reset({
        frontText: card.frontText,
        backText: card.backText,
        phonetic: card.phonetic || '',
        exampleText: card.exampleText || '',
        frontImageUrl: card.frontImageUrl || '',
        frontAudioUrl: card.frontAudioUrl || '',
        hint: card.hint || '',
        cardColor: card.cardColor || 'bg-brand-coral',
        tagIds: card.tagIds?.map(String) as any || [],
        isActive: card.isActive !== false
      });
    } else {
      setEditingCard(null);
      reset({ frontText: '', backText: '', phonetic: '', exampleText: '', frontImageUrl: '', frontAudioUrl: '', hint: '', cardColor: 'bg-brand-coral', tagIds: [], isActive: true });
    }
    setIsModalOpen(true);
    setIsPreviewFlipped(false);
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      tagIds: values.tagIds ? (Array.isArray(values.tagIds) ? values.tagIds.map(Number) : [Number(values.tagIds)]) : []
    };
    saveMutation.mutate(payload as FormValues);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "frontText,backText,phonetic,exampleText,hint,frontImageUrl,frontAudioUrl,cardColor\nHello,Xin chào,həˈləʊ,Hello world,Chào,,,bg-brand-coral\nApple,Quả táo,ˈæp.əl,I eat an apple,Táo,,,bg-brand-coral";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "flashcards_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/decks')} className="text-geist-gray-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại Bộ thẻ
        </Button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000">
            Thẻ ghi nhớ <span className="text-geist-gray-600 font-normal text-lg">/ Bộ thẻ #{deckId}</span>
          </h1>
          <p className="text-sm text-geist-gray-700 mt-1">Quản lý các thẻ ghi nhớ trong bộ thẻ này</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import thẻ
          </Button>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm thẻ
          </Button>
        </div>
      </div>

      <div className="border border-geist-gray-400 rounded-lg bg-geist-bg-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localCardsState.map((c: FlashcardResponse) => c.id)} strategy={verticalListSortingStrategy}>
              <table className="w-full text-sm text-left">
                <thead className="bg-geist-gray-100 text-geist-gray-700 font-medium border-b border-geist-gray-300">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Thứ tự</th>
                    <th className="px-4 py-3">Mặt trước</th>
                    <th className="px-4 py-3">Mặt sau</th>
                    <th className="px-4 py-3">Phiên âm</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-geist-gray-300">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-geist-gray-600">Đang tải...</td></tr>
                  ) : (
                    <>
                      {localCardsState.map((card: FlashcardResponse) => (
                        <SortableRow 
                          key={card.id} 
                          card={card} 
                          openModal={openModal} 
                          deleteMutation={deleteMutation} 
                          onManualReorder={handleManualReorder} 
                        />
                      ))}
                    </>
                  )}
                  {(!localCardsState || localCardsState.length === 0) && !isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center bg-geist-bg-100">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-geist-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-geist-gray-400" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-geist-gray-1000">Chưa có thẻ nào</p>
                            <p className="text-sm text-geist-gray-600">Tạo thẻ mới hoặc import thẻ từ file để bắt đầu học.</p>
                          </div>
                          <Button onClick={() => openModal()} className="mt-2" variant="outline">
                            <Plus className="w-4 h-4 mr-2" /> Thêm thẻ ngay
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {data && data.totalElements > 0 && (
        <div className="flex justify-end mt-4">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={data.totalElements}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            pageSizeOptions={['10', '20', '50', '100']}
            showTotal={(total) => `Tổng ${total} thẻ`}
          />
        </div>
      )}

      <Modal
        title={editingCard ? 'Chỉnh sửa thẻ' : 'Thêm thẻ'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-7xl"
        showCloseButton={false}
        headerActions={
          <>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="h-8 px-3 text-sm">
              Hủy
            </Button>
            <Button type="submit" form="flashcard-form" disabled={saveMutation.isPending} className="h-8 px-3 text-sm">
              {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </>
        }
      >
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form id="flashcard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 lg:col-span-7 xl:col-span-8 relative">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Từ vựng (Mặt trước)</label>
              <textarea
                {...register('frontText', { required: true })}
                className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
                rows={2}
              />
              {errors.frontText && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={handleLookup} disabled={isDictionaryLoading} className="text-geist-gray-600 hover:text-geist-blue-700 flex items-center text-xs gap-1 border border-geist-gray-300 hover:border-geist-blue-400 bg-geist-bg-100 rounded px-3 py-1.5 transition-colors">
                  <Wand2 className="w-3 h-3" />
                  {isDictionaryLoading ? 'Đang tra...' : 'Tự động tra & Dịch'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Ý nghĩa (Mặt sau)</label>
              <textarea
                {...register('backText', { required: true })}
                className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
                rows={2}
              />
              {errors.backText && <span className="text-xs text-geist-red-800">Bắt buộc</span>}
            </div>

            <div className="pt-6 border-t border-geist-gray-300">
              <h4 className="text-xs font-semibold text-geist-gray-600 uppercase tracking-widest mb-4">Thông tin mở rộng</h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-geist-gray-1000">Phiên âm / Phát âm</label>
                  <Input {...register('phonetic')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-geist-gray-1000">Câu ví dụ</label>
                  <textarea
                    {...register('exampleText')}
                    className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-geist-gray-1000">Đường dẫn ảnh</label>
                  <div className="flex gap-2">
                    <Input {...register('frontImageUrl')} placeholder="https://..." className="flex-1" />
                    <Button type="button" variant="outline" onClick={openPixabayModal} className="px-3 flex items-center gap-2" title="Tìm ảnh trên Pixabay">
                      <ImageIcon className="w-4 h-4 text-geist-gray-700" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-geist-gray-1000">Đường dẫn âm thanh</label>
                  <Input {...register('frontAudioUrl')} placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-geist-gray-1000">Gợi ý học tập</label>
                  <Input {...register('hint')} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-geist-gray-1000">Màu sắc thẻ</label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {CARD_COLORS.map(c => (
                      <label key={c.value} htmlFor={`color-${c.label}`} className="cursor-pointer">
                        <input id={`color-${c.label}`} type="radio" value={c.value} {...register('cardColor')} className="sr-only" />
                        <div className={`w-10 h-10 rounded-full ${c.value} ${watch('cardColor') === c.value ? 'ring-2 ring-offset-2 ring-geist-blue-500 scale-105 opacity-100 z-10 relative shadow-sm' : 'border border-geist-gray-200 opacity-60 hover:opacity-100 hover:scale-105'} transition-all duration-200`} title={c.label}></div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-4 mt-4 border-t border-geist-gray-200 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-geist-gray-1000">Tags (Phân loại)</label>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {tagsData?.data?.content?.map(tag => {
                      const isSelected = watch('tagIds')?.includes(tag.id as any) || watch('tagIds')?.includes(String(tag.id) as any);
                      return (
                        <label key={tag.id} className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${isSelected ? 'bg-geist-blue-100 border-geist-blue-300 text-geist-blue-800' : 'bg-geist-gray-100 border-geist-gray-300 text-geist-gray-700 hover:bg-geist-gray-200 hover:border-geist-gray-400'}`}>
                          <input type="checkbox" value={tag.id} {...register('tagIds')} className="sr-only" />
                          <span>{tag.name}</span>
                        </label>
                      );
                    })}
                    
                    {isCreatingTag ? (
                      <div className="flex items-center gap-1 bg-geist-bg-100 border border-geist-gray-300 rounded-full pl-3 pr-1 py-1">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="Tên tag..."
                          className="text-xs bg-transparent border-none outline-none w-20 text-geist-gray-1000 placeholder:text-geist-gray-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateTag();
                            } else if (e.key === 'Escape') {
                              setIsCreatingTag(false);
                            }
                          }}
                        />
                        <button type="button" onClick={handleCreateTag} disabled={createTagMutation.isPending || !newTagName.trim()} className="p-1 text-geist-blue-600 hover:bg-geist-blue-100 rounded-full disabled:opacity-50">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setIsCreatingTag(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-geist-gray-400 text-xs font-medium text-geist-gray-600 hover:text-geist-gray-900 hover:border-geist-gray-600 transition-colors">
                        <Plus className="w-3 h-3" /> Thêm tag
                      </button>
                    )}
                    
                    {(!tagsData?.data?.content || tagsData.data.content.length === 0) && !isCreatingTag && (
                      <span className="text-xs text-geist-gray-500 italic">Chưa có tag nào được tạo.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-geist-gray-300">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-geist-gray-300 rounded-md bg-geist-bg-100 hover:bg-geist-gray-100/50 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-geist-gray-400 text-geist-blue-700 focus:ring-geist-blue-700 bg-transparent"
                  {...register('isActive')}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-geist-gray-1000">Thẻ đang hoạt động</span>
                  <span className="text-xs text-geist-gray-700">Tắt để ẩn thẻ này khỏi bộ học mà không xóa nó khỏi hệ thống.</span>
                </div>
              </label>
            </div>

          </form>

          {/* Live Preview Column */}
          <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-geist-gray-100 rounded-xl relative overflow-hidden lg:col-span-5 xl:col-span-4 sticky top-8 self-start">
            <h3 className="text-sm font-bold text-geist-gray-600 uppercase tracking-widest mb-6">Mô phỏng (Live Preview)</h3>
            <div
              className="relative w-full max-w-[340px] aspect-[3/4] cursor-pointer group"
              style={{ perspective: '1000px' }}
              onClick={() => setIsPreviewFlipped(!isPreviewFlipped)}
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 ${isPreviewFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 bg-white border border-geist-gray-200 shadow-sm rounded-2xl p-8 flex flex-col items-center justify-center text-center overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="absolute top-4 right-4">
                    <button type="button" onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }} className="p-2.5 bg-[#f5f5f5] text-[#4d4d4d] rounded-full hover:bg-[#e5e5e5] hover:text-[#171717] border border-[#e5e5e5] transition-colors shadow-sm">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[11px] font-semibold text-[#8f8f8f] mb-auto tracking-[0.2em] uppercase mt-2">Vocabulary</div>
                  <div className="text-4xl font-semibold tracking-tight text-[#171717] mb-2 break-words w-full">{watch('frontText') || 'Từ vựng'}</div>
                  {watch('phonetic') && <div className="text-base font-normal text-[#4d4d4d] mb-4">{watch('phonetic')}</div>}
                  <div className="text-xs font-medium text-[#8f8f8f] mt-auto flex items-center gap-1 opacity-60">
                    <Wand2 className="w-3 h-3" /> Chạm để lật
                  </div>
                </div>
                <div className={`absolute inset-0 rounded-2xl overflow-hidden ${watch('cardColor') || 'bg-geist-gray-100'} border border-black/5 shadow-sm flex flex-col items-center justify-center text-center`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  {watch('frontImageUrl') ? (
                    <>
                      <div className="w-full h-[55%] relative border-b border-black/10">
                        <img src={watch('frontImageUrl')} alt="Flashcard" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="w-full h-[45%] flex flex-col items-center justify-center p-4 relative">
                        <div className="text-[11px] font-semibold text-white/80 mb-2 tracking-[0.2em] uppercase mt-2">Meaning</div>
                        <div className="text-2xl font-semibold tracking-tight text-white mb-2 break-words w-full">{watch('backText') || 'Ý nghĩa'}</div>
                        {watch('hint') && <div className="text-[11px] font-medium text-white/90 bg-black/10 border border-white/20 px-3 py-1.5 rounded-full mt-auto mb-2 backdrop-blur-sm">Gợi ý: {watch('hint')}</div>}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center relative">
                      <div className="text-[11px] font-semibold text-white/80 mb-auto tracking-[0.2em] uppercase mt-2">Meaning</div>
                      <div className="text-3xl font-semibold tracking-tight text-white mb-2 break-words w-full">{watch('backText') || 'Ý nghĩa'}</div>
                      <div className="mt-auto flex flex-col items-center justify-end min-h-[40px] w-full">
                        {watch('hint') && <div className="text-[11px] font-medium text-white/90 bg-black/10 border border-white/20 px-4 py-1.5 rounded-full backdrop-blur-sm w-fit max-w-full truncate">Gợi ý: {watch('hint')}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title="Import thẻ từ file CSV hoặc JSON"
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      >
        <div className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-geist-gray-700">Tải lên file JSON hoặc CSV để thêm hàng loạt thẻ vào bộ bài.</p>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="shrink-0">
              Tải file mẫu (CSV)
            </Button>
          </div>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-geist-gray-400 border-dashed rounded-lg cursor-pointer bg-geist-bg-100 hover:bg-geist-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-geist-gray-600" />
                <p className="mb-2 text-sm text-geist-gray-600"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả file vào đây</p>
                <p className="text-xs text-geist-gray-600">JSON hoặc CSV (tối đa 5MB)</p>
              </div>
              <input type="file" className="hidden" accept=".json,.csv" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        title="Tìm kiếm ảnh (Pixabay)"
        isOpen={isPixabayModalOpen}
        onClose={() => setIsPixabayModalOpen(false)}
        className="max-w-4xl"
      >
        <div className="mt-4 space-y-4">
          <form onSubmit={handleSearchPixabay} className="flex gap-2">
            <Input
              placeholder="Nhập từ khóa tiếng Anh (VD: apple, house...)"
              value={pixabayQuery}
              onChange={(e) => setPixabayQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isPixabayLoading}>
              {isPixabayLoading ? 'Đang tìm...' : 'Tìm kiếm'}
            </Button>
          </form>

          <div className="h-96 overflow-y-auto border border-geist-gray-300 rounded-md p-4 bg-geist-bg-100">
            {pixabayResults.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {pixabayResults.map((img: any) => (
                  <div
                    key={img.id}
                    className="relative aspect-video cursor-pointer overflow-hidden rounded-md border border-geist-gray-300 hover:border-geist-blue-700 hover:ring-2 hover:ring-geist-blue-300 transition-all group"
                    onClick={() => selectPixabayImage(img.webformatURL)}
                  >
                    <img src={img.previewURL} alt={img.tags} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-medium">Chọn</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-geist-gray-600 text-sm">
                {!isPixabayLoading && 'Chưa có kết quả tìm kiếm'}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
