import { useEffect } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type Control, type UseFormGetValues, type UseFormRegister, type UseFormSetValue } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { message, Switch } from 'antd';
import { quizzesApi } from '../api/quizzes.api';
import { decksApi } from '../../study-content/api/decks.api';
import { examTypesApi } from '../../master-data/api/exam-types.api';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { apiClient } from '../../../shared/lib/api';

type OptionFormValues = {
  id?: number;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
};

type QuestionFormValues = {
  id?: number;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';
  points: number;
  displayOrder: number;
  questionImageUrl: string;
  explanation: string;
  isActive: boolean;
  options: OptionFormValues[];
};

type QuizFormValues = {
  quizCode: string;
  quizCategory: 'NORMAL' | 'PLACEMENT' | 'FINAL' | 'LEVEL_UP';
  deckId?: number;
  examTypeId?: number;
  levelId?: number;
  title: string;
  description: string;
  quizType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK' | 'MIXED';
  timeLimitSeconds: number | null;
  passScore: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  isActive: boolean;
  questions: QuestionFormValues[];
};

const buildDefaultOptions = (questionType: QuestionFormValues['questionType']): OptionFormValues[] => {
  if (questionType === 'TRUE_FALSE') {
    return [
      { optionKey: 'True', optionText: 'Dung', isCorrect: true, displayOrder: 1 },
      { optionKey: 'False', optionText: 'Sai', isCorrect: false, displayOrder: 2 },
    ];
  }

  return [
    { optionKey: 'A', optionText: '', isCorrect: true, displayOrder: 1 },
    { optionKey: 'B', optionText: '', isCorrect: false, displayOrder: 2 },
  ];
};

const formatLevelOptionLabel = (level: any) => {
  const min = Number(level?.minScore ?? 0);
  const max = Number(level?.maxScore ?? 0);
  if (min <= 0) {
    return `${level.name} (Duoi ${Math.round(max)})`;
  }
  return `${level.name} (${Math.round(min)} - ${Math.round(max)})`;
};

function QuestionOptions({
  control,
  register,
  questionIndex,
  qType,
  getValues,
}: {
  control: Control<QuizFormValues>;
  register: UseFormRegister<QuizFormValues>;
  questionIndex: number;
  qType: string;
  getValues: UseFormGetValues<QuizFormValues>;
  setValue: UseFormSetValue<QuizFormValues>;
}) {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options`,
    keyName: 'fieldKey',
  });

  useEffect(() => {
    if (qType !== 'TRUE_FALSE') return;
    const currentOpts = getValues(`questions.${questionIndex}.options`);
    const isAlreadyTrueFalse = currentOpts?.length === 2
      && currentOpts[0]?.optionKey === 'True'
      && currentOpts[1]?.optionKey === 'False';

    if (!isAlreadyTrueFalse) {
      replace([
        {
          id: currentOpts?.[0]?.id,
          optionKey: 'True',
          optionText: currentOpts?.[0]?.optionText || 'Dung',
          isCorrect: currentOpts?.[0]?.isCorrect ?? true,
          displayOrder: 1,
        },
        {
          id: currentOpts?.[1]?.id,
          optionKey: 'False',
          optionText: currentOpts?.[1]?.optionText || 'Sai',
          isCorrect: currentOpts?.[1]?.isCorrect ?? false,
          displayOrder: 2,
        },
      ]);
    }
  }, [getValues, qType, questionIndex, replace]);

  const isTrueFalse = qType === 'TRUE_FALSE';

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <label className="text-sm font-medium text-geist-gray-1000">Lua chon dap an</label>
        {!isTrueFalse && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ optionKey: '', optionText: '', isCorrect: false, displayOrder: fields.length + 1 })}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Them dap an
          </Button>
        )}
      </div>
      <div className="space-y-3 flex-1">
        {fields.map((field, optionIndex) => (
          <div key={field.fieldKey} className="flex items-start gap-3 p-3 border border-geist-gray-300 rounded-lg bg-geist-bg-200 shadow-sm">
            <input type="hidden" {...register(`questions.${questionIndex}.options.${optionIndex}.id` as const)} />
            <div className="pt-2">
              <Controller
                name={`questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                control={control}
                render={({ field: controllerField }) => (
                  <Switch size="small" checked={controllerField.value} onChange={controllerField.onChange} />
                )}
              />
            </div>
            <div className="flex-1 flex gap-2">
              <textarea
                placeholder="Noi dung dap an"
                className="flex-1 bg-geist-bg-100 resize-none rounded-md border border-geist-gray-400 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 transition-colors overflow-hidden"
                rows={1}
                readOnly={isTrueFalse}
                onInput={(e) => {
                  e.currentTarget.style.height = 'auto';
                  e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                }}
                {...register(`questions.${questionIndex}.options.${optionIndex}.optionText`, { required: true })}
              />
              {!isTrueFalse && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-geist-gray-500 hover:text-geist-red-800"
                  onClick={() => remove(optionIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionCard({
  qField,
  qIndex,
  control,
  register,
  removeQuestion,
  errors,
  globalQuizType,
  getValues,
  setValue,
  onSaveSingleQuestion,
  isEditing,
}: any) {
  const localType = useWatch({ control, name: `questions.${qIndex}.questionType`, defaultValue: qField.questionType });
  const qType = globalQuizType === 'MIXED' ? localType : (globalQuizType === 'FILL_BLANK' ? 'FILL_BLANK' : globalQuizType);

  useEffect(() => {
    if (globalQuizType !== 'MIXED' && localType !== qType) {
      setValue(`questions.${qIndex}.questionType`, qType);
    }
  }, [globalQuizType, localType, qType, qIndex, setValue]);

  return (
    <div className="bg-geist-bg-100 border border-geist-gray-300 rounded-xl p-6 relative shadow-sm mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5 border-b lg:border-b-0 lg:border-r border-geist-gray-200 pb-6 lg:pb-0 lg:pr-8">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-geist-gray-1000 block">
                Noi dung cau hoi <span className="text-geist-gray-500 font-mono text-xs ml-1">#{qIndex + 1}</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-geist-gray-1000">
                  <span className="text-xs">Hoat dong</span>
                  <Controller
                    name={`questions.${qIndex}.isActive`}
                    control={control}
                    render={({ field }) => <Switch size="small" checked={field.value} onChange={field.onChange} />}
                  />
                </label>
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-geist-blue-700 hover:text-geist-blue-900 hover:bg-geist-blue-50 h-7 px-2"
                    onClick={() => onSaveSingleQuestion(qIndex)}
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Luu
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-geist-red-600 hover:text-geist-red-800 hover:bg-geist-red-50 -mr-2 h-7 px-2"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xoa
                </Button>
              </div>
            </div>
            <textarea
              {...register(`questions.${qIndex}.questionText`, { required: true })}
              className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-geist-bg-50 px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors overflow-hidden"
              rows={2}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              placeholder="Nhap noi dung cau hoi..."
            />
            {errors.questions?.[qIndex]?.questionText && <span className="text-xs text-geist-red-800">Bat buoc</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Loai cau hoi</label>
              <select
                {...register(`questions.${qIndex}.questionType`)}
                disabled={globalQuizType !== 'MIXED'}
                className="flex h-9 w-full rounded-md border border-geist-gray-400 bg-transparent px-3 py-1.5 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors disabled:opacity-50 disabled:bg-geist-bg-200"
              >
                <option value="MULTIPLE_CHOICE">Trac nghiem</option>
                <option value="TRUE_FALSE">Dung / Sai</option>
                <option value="FILL_BLANK">Dien vao cho trong</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-geist-gray-1000">Diem</label>
                <Input type="number" {...register(`questions.${qIndex}.points`)} min="1" className="h-9 bg-transparent" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-geist-gray-1000">Thu tu</label>
                <Input type="number" {...register(`questions.${qIndex}.displayOrder`)} min="0" className="h-9 bg-transparent" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-geist-gray-1000">Giai thich</label>
            <textarea
              {...register(`questions.${qIndex}.explanation`)}
              className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors overflow-hidden"
              rows={2}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
              placeholder="Giai thich cho dap an dung..."
            />
          </div>
        </div>

        <div className="h-full">
          <QuestionOptions
            control={control}
            register={register}
            questionIndex={qIndex}
            qType={qType}
            getValues={getValues}
            setValue={setValue}
          />
        </div>
      </div>
    </div>
  );
}

export function QuizBuilderAdminPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const saveSingleQuestionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { id: questionId, ...submitData } = payload;
      if (questionId) {
        const res = await apiClient.patch(`/quiz-questions/${questionId}`, submitData);
        return res.data;
      }
      const res = await apiClient.post('/quiz-questions', submitData);
      return res.data;
    },
    onSuccess: () => {
      message.success('Da luu cau hoi');
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['admin-quiz-detail', id] });
      }
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || 'Loi khi luu cau hoi');
    },
  });

  const { register, handleSubmit, control, reset, getValues, setValue, watch, formState: { errors } } = useForm<QuizFormValues>({
    defaultValues: {
      quizCategory: 'NORMAL',
      quizType: 'MIXED',
      maxAttempts: 3,
      shuffleQuestions: true,
      isActive: true,
      passScore: 80,
      questions: [],
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: 'questions',
    keyName: 'fieldKey',
  });

  const watchQuizType = useWatch({ control, name: 'quizType' });
  const watchQuizCategory = watch('quizCategory');
  const watchExamTypeId = watch('examTypeId');

  const { data: decksData } = useQuery({
    queryKey: ['admin-decks'],
    queryFn: () => decksApi.getAll({ size: 100 }),
  });

  const { data: examTypesData } = useQuery({
    queryKey: ['admin-exam-types'],
    queryFn: () => examTypesApi.getAll(),
  });

  const toeicExamType = examTypesData?.find((examType: any) => examType.code === 'TOEIC') ?? examTypesData?.[0];
  const toeicId = toeicExamType?.id;

  const { data: levelsData } = useQuery({
    queryKey: ['admin-levels', toeicId],
    queryFn: () => examTypesApi.getLevels(Number(toeicId)),
    enabled: !!toeicId,
  });

  const { data: quizData, isLoading: isQuizLoading } = useQuery({
    queryKey: ['admin-quiz-detail', id],
    queryFn: () => quizzesApi.getById(Number(id)),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!toeicId) return;
    if (!watchExamTypeId || Number(watchExamTypeId) !== Number(toeicId)) {
      setValue('examTypeId', Number(toeicId));
    }
  }, [setValue, toeicId, watchExamTypeId]);

  useEffect(() => {
    if (!isEditing || !quizData?.data) return;
    const q = quizData.data;
    reset({
      quizCode: q.quizCode,
      quizCategory: q.quizCategory as any,
      deckId: q.deckId,
      examTypeId: q.examTypeId,
      levelId: q.levelId,
      title: q.title,
      description: q.description || '',
      quizType: q.quizType,
      timeLimitSeconds: q.timeLimitSeconds || null,
      passScore: q.passScore || 80,
      maxAttempts: q.maxAttempts,
      shuffleQuestions: q.shuffleQuestions,
      isActive: q.isActive,
      questions: q.questions?.map(qItem => ({
        id: qItem.id,
        questionText: qItem.questionText,
        questionType: qItem.questionType as any,
        points: qItem.points,
        displayOrder: qItem.displayOrder,
        questionImageUrl: qItem.questionImageUrl || '',
        explanation: qItem.explanation || '',
        isActive: qItem.isActive,
        options: qItem.options?.map(opt => ({
          id: opt.id,
          optionKey: opt.optionKey,
          optionText: opt.optionText,
          isCorrect: Boolean(opt.isCorrect),
          displayOrder: opt.displayOrder,
        })) || [],
      })) || [],
    });
  }, [isEditing, quizData, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: QuizFormValues) =>
      isEditing
        ? quizzesApi.update(Number(id), { ...values, createdById: 1 })
        : quizzesApi.create({ ...values, createdById: 1 }),
    onSuccess: (res) => {
      message.success(isEditing ? 'Cap nhat bai kiem tra thanh cong' : 'Tao bai kiem tra thanh cong');
      if (isEditing) {
        queryClient.setQueryData(['admin-quiz-detail', id], res);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      if (!isEditing && res?.data?.id) {
        navigate(`/admin/quizzes/${res.data.id}/edit`, { replace: true });
      }
    },
    onError: (err: any) => message.error(err.response?.data?.message || 'Co loi xay ra'),
  });

  const handleSaveSingleQuestion = (qIndex: number) => {
    if (!isEditing) {
      message.error('Vui long luu bai kiem tra truoc khi luu tung cau hoi.');
      return;
    }

    const qData = getValues(`questions.${qIndex}`);
    const transformedOptions = (qData.options || []).map((opt: any, oIdx: number) => ({
      ...opt,
      questionId: qData.id,
      optionKey: qData.questionType === 'TRUE_FALSE' ? (oIdx === 0 ? 'True' : 'False') : String.fromCharCode(65 + oIdx),
      displayOrder: Number(opt.displayOrder) || (oIdx + 1),
    }));

    saveSingleQuestionMutation.mutate({
      ...qData,
      quizId: Number(id),
      options: transformedOptions,
    });
  };

  const onSubmit = (values: QuizFormValues) => {
    const payload = {
      ...values,
      deckId: values.deckId ? Number(values.deckId) : undefined,
      examTypeId: values.examTypeId ? Number(values.examTypeId) : undefined,
      levelId: values.levelId ? Number(values.levelId) : undefined,
      maxAttempts: Number(values.maxAttempts),
      passScore: Number(values.passScore),
      timeLimitSeconds: values.timeLimitSeconds ? Number(values.timeLimitSeconds) : null,
      questions: values.questions.map((q, idx) => ({
        ...q,
        quizId: Number(id),
        points: Number(q.points),
        displayOrder: Number(q.displayOrder) || (idx + 1),
        options: q.options.map((opt, oIdx) => ({
          ...opt,
          questionId: q.id,
          optionKey: q.questionType === 'TRUE_FALSE' ? (oIdx === 0 ? 'True' : 'False') : String.fromCharCode(65 + oIdx),
          displayOrder: Number(opt.displayOrder) || (oIdx + 1),
        })),
      })),
    };

    saveMutation.mutate(payload as any);
  };

  const derivedQuestionType = watchQuizType === 'MIXED'
    ? 'MULTIPLE_CHOICE'
    : (watchQuizType === 'FILL_BLANK' ? 'FILL_BLANK' : watchQuizType);

  const showDeckField = watchQuizCategory === 'NORMAL';
  const showLevelField = watchQuizCategory === 'NORMAL' || watchQuizCategory === 'FINAL' || watchQuizCategory === 'LEVEL_UP';
  const levelLabel = watchQuizCategory === 'LEVEL_UP' ? 'Trinh do muc tieu' : 'Trinh do TOEIC';

  if (isEditing && isQuizLoading) {
    return <div className="p-8 text-center text-geist-gray-600">Dang tai cau truc bai kiem tra...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="sticky top-0 z-40 bg-geist-bg-100 border-b border-geist-gray-300 pb-4 mb-8 pt-4 flex justify-between items-center shadow-sm -mx-6 px-6">
          <div className="flex items-center gap-4">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/quizzes')} className="text-geist-gray-700 p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-geist-gray-1000 flex items-baseline gap-2">
                {isEditing ? 'Chinh sua Bai kiem tra' : 'Tao Bai kiem tra moi'}
                <span className="text-lg text-geist-gray-500 font-normal">({questionFields.length} cau hoi)</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/quizzes')}>
              Huy
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Dang luu...' : 'Luu tat ca'}
            </Button>
          </div>
        </div>

        <section className="bg-geist-bg-200 border border-geist-gray-300 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-medium text-geist-gray-1000 mb-6 pb-2 border-b border-geist-gray-200">Thong tin chung</h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Ma bai kiem tra</label>
              <Input {...register('quizCode', { required: true })} placeholder="Vi du: QUIZ-001" />
              {errors.quizCode && <span className="text-xs text-geist-red-800">Bat buoc</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Phan loai</label>
              <select
                {...register('quizCategory', { required: true })}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
                onChange={(e) => {
                  setValue('quizCategory', e.target.value as any);
                  setValue('deckId', undefined);
                  setValue('levelId', undefined);
                  if (toeicId) {
                    setValue('examTypeId', Number(toeicId));
                  }
                }}
              >
                <option value="NORMAL">Thong thuong</option>
                <option value="PLACEMENT">Kiem tra dau vao</option>
                <option value="FINAL">Kiem tra ket thuc</option>
                <option value="LEVEL_UP">Kiem tra nang cap</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            {showDeckField ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-geist-gray-1000">Bo the (Deck)</label>
                <select
                  {...register('deckId', { required: showDeckField })}
                  className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
                >
                  <option value="">-- Chon bo the --</option>
                  {decksData?.content?.map((deck: any) => (
                    <option key={deck.id} value={deck.id}>{deck.title} (ID: {deck.id})</option>
                  ))}
                </select>
                {errors.deckId && <span className="text-xs text-geist-red-800">Bat buoc</span>}
              </div>
            ) : <div />}

            {showLevelField ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-geist-gray-1000">{levelLabel}</label>
                <select
                  {...register('levelId', { required: showLevelField })}
                  disabled={!toeicId}
                  className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors disabled:opacity-60"
                >
                  <option value="">-- Chon trinh do --</option>
                  {levelsData?.map((level: any) => (
                    <option key={level.id} value={level.id}>{formatLevelOptionLabel(level)}</option>
                  ))}
                </select>
                {errors.levelId && <span className="text-xs text-geist-red-800">Bat buoc</span>}
              </div>
            ) : <div />}
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-geist-gray-1000">Tieu de bai kiem tra</label>
            <Input {...register('title', { required: true })} placeholder="Nhap tieu de..." />
            {errors.title && <span className="text-xs text-geist-red-800">Bat buoc</span>}
          </div>

          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-geist-gray-1000">Mo ta</label>
            <textarea
              {...register('description')}
              className="flex w-full resize-none rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors overflow-hidden"
              rows={2}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">Loai bai kiem tra</label>
              <select
                {...register('quizType', { required: true })}
                className="flex h-10 w-full rounded-md border border-geist-gray-400 bg-transparent px-3 py-2 text-sm text-geist-gray-1000 focus:outline-none focus:ring-2 focus:ring-geist-blue-700 hover:border-geist-gray-600 transition-colors"
              >
                <option value="MIXED">Hon hop</option>
                <option value="MULTIPLE_CHOICE">Trac nghiem</option>
                <option value="TRUE_FALSE">Dung / Sai</option>
                <option value="FILL_BLANK">Dien vao cho trong</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-geist-gray-1000">Thoi gian (giay)</label>
                <Input type="number" {...register('timeLimitSeconds')} placeholder="Tuy chon" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-geist-gray-1000">Diem do (0-100)</label>
                <Input type="number" {...register('passScore')} placeholder="80" min="0" max="100" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-geist-gray-1000">So lan lam toi da</label>
              <Input type="number" {...register('maxAttempts')} min="1" />
            </div>
            <div className="space-y-2 flex flex-col justify-center mt-6">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-geist-gray-1000">
                <Controller
                  name="shuffleQuestions"
                  control={control}
                  render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
                />
                Tron cau hoi
              </label>
            </div>
            <div className="space-y-2 flex flex-col justify-center mt-6">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-geist-gray-1000">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => <Switch checked={field.value} onChange={field.onChange} />}
                />
                Hoat dong
              </label>
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-geist-gray-1000">Danh sach cau hoi</h2>
              <p className="text-sm text-geist-gray-600 mt-1">Quan ly noi dung chi tiet cua bai kiem tra</p>
            </div>
            <Button
              type="button"
              onClick={() => appendQuestion({
                questionText: '',
                questionType: derivedQuestionType as any,
                points: 1,
                displayOrder: questionFields.length + 1,
                questionImageUrl: '',
                explanation: '',
                isActive: true,
                options: buildDefaultOptions(derivedQuestionType as QuestionFormValues['questionType']),
              })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Them cau hoi
            </Button>
          </div>

          {questionFields.map((qField, qIndex) => (
            <QuestionCard
              key={qField.fieldKey}
              qField={qField}
              qIndex={qIndex}
              control={control}
              register={register}
              removeQuestion={removeQuestion}
              errors={errors}
              globalQuizType={watchQuizType}
              getValues={getValues}
              setValue={setValue}
              onSaveSingleQuestion={handleSaveSingleQuestion}
              isEditing={isEditing}
            />
          ))}

          {questionFields.length === 0 && (
            <div className="p-12 border-2 border-dashed border-geist-gray-300 rounded-lg text-center bg-geist-bg-200">
              <p className="text-geist-gray-600 mb-4">Bai kiem tra nay chua co cau hoi nao.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => appendQuestion({
                  questionText: '',
                  questionType: derivedQuestionType as any,
                  points: 1,
                  displayOrder: 1,
                  questionImageUrl: '',
                  explanation: '',
                  isActive: true,
                  options: buildDefaultOptions(derivedQuestionType as QuestionFormValues['questionType']),
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Them cau hoi dau tien
              </Button>
            </div>
          )}
        </section>
      </form>
    </div>
  );
}
