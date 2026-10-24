import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../../shared/components/ui/Modal';
import { Button } from '../../../../shared/components/ui/Button';
import { Input } from '../../../../shared/components/ui/Input';
import { Sparkles, Plus, X, Bot, User, Layers } from 'lucide-react';
import type { AdminScenario, AdminScenarioRequest } from '../../types/adminAi';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdminScenarioRequest) => Promise<void>;
  initialData?: AdminScenario | null;
  topics: Array<{ id: number; name: string; slug: string }>;
  isSubmitting: boolean;
}

const PLACEHOLDERS = [
  { tag: '{topic}', label: 'Chủ đề bài học', desc: 'Tên chủ đề được liên kết' },
  { tag: '{level}', label: 'Trình độ người học', desc: 'Dải điểm 100 - 1000' },
  { tag: '{target_words}', label: 'Từ vựng mục tiêu', desc: 'Danh sách 2-4 từ vựng SRS cần nói' },
  { tag: '{user_role}', label: 'Vai người học', desc: 'Vai trò người học đảm nhận' },
  { tag: '{ai_role}', label: 'Vai trợ lý AI', desc: 'Vai trò trợ lý AI đóng vai' },
];

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  topics,
  isSubmitting
}) => {
  const [topicId, setTopicId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [levelMin, setLevelMin] = useState(100);
  const [levelMax, setLevelMax] = useState(1000);
  const [aiRole, setAiRole] = useState('Barista');
  const [userRole, setUserRole] = useState('Customer');
  const [description, setDescription] = useState('');
  const [openingLine, setOpeningLine] = useState('');
  const [systemPromptTemplate, setSystemPromptTemplate] = useState('');
  const [fallbackLines, setFallbackLines] = useState<string[]>([]);
  const [newFallbackInput, setNewFallbackInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [autoSlug, setAutoSlug] = useState(true);

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialData) {
      setTopicId(initialData.topicId);
      setTitle(initialData.title);
      setSlug(initialData.slug);
      setLevelMin(initialData.levelMin || 100);
      setLevelMax(initialData.levelMax || 1000);
      setAiRole(initialData.aiRole || '');
      setUserRole(initialData.userRole || '');
      setDescription(initialData.description || '');
      setOpeningLine(initialData.openingLine || '');
      setSystemPromptTemplate(initialData.systemPromptTemplate || '');
      setFallbackLines(initialData.fallbackLines || []);
      setIsPublished(initialData.isActive);
      setAutoSlug(false);
    } else {
      setTopicId(topics[0]?.id);
      setTitle('');
      setSlug('');
      setLevelMin(100);
      setLevelMax(600);
      setAiRole('Barista');
      setUserRole('Customer');
      setDescription('');
      setOpeningLine('Hello! Welcome to our coffee shop. What can I get started for you today?');
      setSystemPromptTemplate(
        'You are a friendly {ai_role} conversing with a {user_role}. Speak naturally at level {level} English. Encourage the learner to use {target_words}. Keep responses concise (under 2 sentences).'
      );
      setFallbackLines([
        'Could you please repeat that for me?',
        'I see. Can you tell me a little bit more about that?'
      ]);
      setIsPublished(true);
      setAutoSlug(true);
    }
  }, [initialData, isOpen, topics]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      const generated = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(generated);
    }
  };

  const handleInsertPlaceholder = (tag: string) => {
    const textarea = promptTextareaRef.current;
    if (!textarea) {
      setSystemPromptTemplate((prev) => prev + ' ' + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = systemPromptTemplate;
    const updated = current.substring(0, start) + tag + current.substring(end);
    setSystemPromptTemplate(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleAddFallbackLine = () => {
    if (newFallbackInput.trim()) {
      setFallbackLines([...fallbackLines, newFallbackInput.trim()]);
      setNewFallbackInput('');
    }
  };

  const handleRemoveFallbackLine = (index: number) => {
    setFallbackLines(fallbackLines.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !systemPromptTemplate.trim()) return;

    await onSubmit({
      topicId: topicId ? Number(topicId) : undefined,
      title: title.trim(),
      slug: slug.trim() || undefined,
      levelMin: Number(levelMin),
      levelMax: Number(levelMax),
      aiRole: aiRole.trim(),
      userRole: userRole.trim(),
      description: description.trim(),
      openingLine: openingLine.trim(),
      systemPromptTemplate: systemPromptTemplate.trim(),
      fallbackLines,
      isActive: isPublished,
      status: isPublished ? 'PUBLISHED' : 'DRAFT'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh sửa Kịch bản AI Voice' : 'Tạo mới Kịch bản AI Voice'}
      className="max-w-3xl"
    >
      <form onSubmit={handleSubmitForm} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
        {/* Row 1: Title & Topic */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
              Tiêu đề kịch bản <span className="text-red-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="VD: Order at a Coffee Shop, Job Interview..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
              Chủ đề liên kết (Topic)
            </label>
            <select
              value={topicId || ''}
              onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-10 px-3 rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-geist-gray-1000"
            >
              <option value="">-- Chọn chủ đề --</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Slug & Roles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
              Đường dẫn tĩnh (Slug)
            </label>
            <Input
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              placeholder="order-coffee-shop"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
              Vai trò AI (AI Role)
            </label>
            <div className="relative">
              <Bot className="w-4 h-4 text-geist-gray-500 absolute left-3 top-3" />
              <Input
                value={aiRole}
                onChange={(e) => setAiRole(e.target.value)}
                placeholder="VD: Barista, HR Interviewer..."
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
              Vai trò Học viên (User Role)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-geist-gray-500 absolute left-3 top-3" />
              <Input
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                placeholder="VD: Customer, Job Applicant..."
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Level Min - Max */}
        <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl border border-orange-200/60 dark:border-orange-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[var(--brand-500)]" /> Khung Level Trình Độ Phù Hợp: {levelMin} - {levelMax}
            </span>
            <span className="text-xs font-medium text-geist-gray-600">
              (Thang điểm 100 - 1000 TOEIC/CEFR)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <div className="flex justify-between text-xs text-geist-gray-600 mb-1">
                <span>Level tối thiểu:</span>
                <span className="font-bold text-[var(--brand-500)]">{levelMin}</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={levelMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLevelMin(val);
                  if (val > levelMax) setLevelMax(val);
                }}
                className="w-full accent-[var(--brand-500)] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-geist-gray-600 mb-1">
                <span>Level tối đa:</span>
                <span className="font-bold text-[var(--brand-500)]">{levelMax}</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={levelMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLevelMax(val);
                  if (val < levelMin) setLevelMin(val);
                }}
                className="w-full accent-[var(--brand-500)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Description & Opening Line */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
              Mô tả ngắn tình huống
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Luyện tập gọi đồ uống và đồ ăn nhẹ tại quán cà phê phong cách Âu..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
              Câu thoại mở đầu của AI (Opening Line) <span className="text-red-500">*</span>
            </label>
            <Input
              value={openingLine}
              onChange={(e) => setOpeningLine(e.target.value)}
              placeholder="VD: Good morning! Welcome to LeLa Coffee. What can I get for you today?"
              required
            />
          </div>
        </div>

        {/* Row 5: System Prompt Template with Placeholder Pills */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider">
              System Prompt Template <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-geist-gray-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-500)]" /> Nhấn vào biến bên dưới để chèn nhanh
            </span>
          </div>

          {/* Placeholders bar */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {PLACEHOLDERS.map((p) => (
              <button
                key={p.tag}
                type="button"
                onClick={() => handleInsertPlaceholder(p.tag)}
                title={p.desc}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-orange-100/70 hover:bg-orange-200 text-orange-900 border border-orange-200 transition-colors cursor-pointer"
              >
                <code className="font-bold text-[var(--brand-600)]">{p.tag}</code>
                <span className="text-[11px] opacity-80">({p.label})</span>
              </button>
            ))}
          </div>

          <textarea
            ref={promptTextareaRef}
            value={systemPromptTemplate}
            onChange={(e) => setSystemPromptTemplate(e.target.value)}
            rows={5}
            className="w-full p-3 font-mono text-xs md:text-sm rounded-lg border border-geist-gray-300 bg-geist-bg-100 text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] leading-relaxed"
            placeholder="Viết hướng dẫn System Prompt cho AI Assistant..."
            required
          />
        </div>

        {/* Row 6: Fallback Lines */}
        <div>
          <label className="block text-xs font-semibold text-geist-gray-700 uppercase tracking-wider mb-1">
            Câu thoại dự phòng khi gián đoạn (Fallback Lines)
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newFallbackInput}
              onChange={(e) => setNewFallbackInput(e.target.value)}
              placeholder="Nhập câu thoại dự phòng và nhấn Thêm..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFallbackLine();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddFallbackLine}>
              <Plus className="w-4 h-4 mr-1" /> Thêm
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            {fallbackLines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-lg bg-geist-gray-100 border border-geist-gray-200"
              >
                <span className="truncate pr-2">"{line}"</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFallbackLine(idx)}
                  className="text-geist-gray-500 hover:text-red-500 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {fallbackLines.length === 0 && (
              <p className="text-xs text-geist-gray-500 italic">Chưa có câu thoại dự phòng nào.</p>
            )}
          </div>
        </div>

        {/* Row 7: Status switch (PUBLISHED vs DRAFT) */}
        <div className="flex items-center justify-between p-3.5 bg-geist-gray-50 rounded-xl border border-geist-gray-200">
          <div>
            <div className="text-sm font-semibold text-geist-gray-1000">Trạng thái xuất bản</div>
            <div className="text-xs text-geist-gray-600">
              {isPublished ? 'Kịch bản đang hoạt động và người học có thể chọn tham gia.' : 'Kịch bản ở trạng thái bản nháp (Draft), tạm ẩn với người học.'}
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-geist-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand-500)]"></div>
          </label>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-geist-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !systemPromptTemplate.trim()}
            className="bg-[var(--brand-500)] hover:bg-[var(--brand-600)] text-white"
          >
            {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật kịch bản' : 'Tạo kịch bản'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
