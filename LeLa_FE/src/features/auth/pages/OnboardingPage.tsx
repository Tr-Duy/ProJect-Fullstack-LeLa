import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { examTypesApi } from '../../master-data/api/exam-types.api';
import { onboardingApi } from '../../users/api/onboarding.api';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { Button, Card, Spin, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { quizAttemptsApi } from '../../quiz/api/quiz-attempts.api';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser, isProfileLoading, isInitializingAuth } = useAuth();
  const queryClient = useQueryClient();

  const { data: examTypes, isLoading: loadingExamTypes } = useQuery({
    queryKey: ['exam-types'],
    queryFn: examTypesApi.getAll,
  });

  const toeicId = examTypes?.[0]?.id;

  const { data: levels, isLoading: loadingLevels } = useQuery({
    queryKey: ['proficiency-levels', toeicId],
    queryFn: () => examTypesApi.getLevels(toeicId!),
    enabled: !!toeicId,
  });

  const { data: attemptsData } = useQuery({
    queryKey: ['my-quiz-attempts'],
    queryFn: () => quizAttemptsApi.getMyAttempts({ size: 100 }),
    enabled: !user?.currentLevel,
  });

  const hasCompletedPlacement = attemptsData?.data?.content?.some(
    (attempt: any) =>
      attempt.quizCategory === 'PLACEMENT' &&
      (attempt.status === 'SUBMITTED' || attempt.status === 'COMPLETED')
  );

  const hasCurrentLevel = user?.currentLevel !== null && user?.currentLevel !== undefined;
  const isPlacementDone = Boolean((user as any)?.placementCompleted || hasCompletedPlacement);

  useEffect(() => {
    if (!isProfileLoading && !isInitializingAuth && user) {
      if (hasCurrentLevel || isPlacementDone) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, hasCurrentLevel, isPlacementDone, isProfileLoading, isInitializingAuth, navigate]);

  useEffect(() => {
    try {
      const profile = queryClient.getQueryData<any>(['profile']);
      console.log('[PROFILE FROM BACKEND]', {
        userId: profile?.data?.id,
        currentLevelId: profile?.data?.currentLevel?.id,
        currentLevelName: profile?.data?.currentLevel?.name,
      });
    } catch (e) {
      console.error('Failed to log profile data in OnboardingPage', e);
    }
  }, [user, queryClient]);

  const sortedLevels = levels ? [...levels].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) : [];
  const showPlacementOption = !hasCurrentLevel && !hasCompletedPlacement;

  const manualSelectMutation = useMutation({
    mutationFn: (levelIdToSelect: number) => onboardingApi.manualSelectLevel(toeicId!, levelIdToSelect),
    onSuccess: async (_, variables) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['explore-decks'] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      
      const targetLvl = sortedLevels.find(l => l.id === variables);
      if (targetLvl) {
        message.success(`Đã thiết lập trình độ học: ${targetLvl.name}`);
      }
      navigate('/dashboard');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi chọn trình độ.');
    }
  });

  const handleLevelClick = (lvl: any) => {
    manualSelectMutation.mutate(lvl.id);
  };

  if (loadingExamTypes || isProfileLoading || isInitializingAuth || hasCurrentLevel || isPlacementDone) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F3EE]"><Spin size="large" /></div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE] p-4">
      <Card className="w-full max-w-lg brutal-card border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white p-2 sm:p-4">
        <div className="text-center mb-6">
          <div className="inline-block bg-black text-yellow-300 font-black text-xs px-3 py-1 mb-2 uppercase tracking-wider border-2 border-black">
            ⚡ HỆ THỐNG TRÌNH ĐỘ TOEIC
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#1D2A3A] flex items-center justify-center gap-2">
            <RocketOutlined className="text-[#F05A4A]" />
            Chọn trình độ bắt đầu
          </h2>
          <p className="text-gray-600 font-bold mt-2 text-sm sm:text-base">
            Hãy chọn trình độ bạn muốn bắt đầu hoặc thi để xác định năng lực!
          </p>
        </div>
        
        <div className="space-y-4">
          {loadingLevels ? (
             <div className="flex justify-center p-4"><Spin /></div>
          ) : (
             sortedLevels.map((lvl) => {
                return (
                  <div 
                    key={lvl.id} 
                    className="flex justify-between items-center p-4 border-3 border-black shadow-[3px_3px_0px_0px_#000] transition-transform bg-white hover:-translate-y-0.5"
                  >
                     <div className="flex flex-col">
                       <span className="font-black text-lg text-[#1D2A3A]">{lvl.name}</span>
                       <span className="text-xs font-bold text-gray-500">
                         {lvl.minScore && lvl.maxScore ? `${lvl.minScore} - ${lvl.maxScore} điểm TOEIC` : 'Trình độ TOEIC'}
                       </span>
                     </div>

                     <Button 
                       className="brutal-pill border-2 border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41] h-10 px-5 shadow-[2px_2px_0px_0px_#000]" 
                       onClick={() => handleLevelClick(lvl)}
                       loading={manualSelectMutation.isPending}
                     >
                       CHỌN
                     </Button>
                  </div>
                );
             })
          )}
        </div>
        
        {showPlacementOption && (
          <div className="flex flex-col space-y-4 mt-6">
            <div className="text-center w-full">
              <span className="text-sm text-gray-500 font-bold mb-2 block">Hoặc</span>
              <Button 
                className="w-full brutal-pill font-black uppercase bg-[#2A8B9D] text-white hover:!bg-[#1F6D7A] h-12 border-2 border-black text-base shadow-[3px_3px_0px_0px_#000]" 
                onClick={() => navigate('/placement-tests')}
              >
                TẤT CẢ BÀI KIỂM TRA ĐẦU VÀO ➔
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
