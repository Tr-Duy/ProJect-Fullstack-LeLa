import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { examTypesApi } from '../../master-data/api/exam-types.api';
import { onboardingApi } from '../../users/api/onboarding.api';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { Button, Card, Spin, Modal, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';

import { quizAttemptsApi } from '../../quiz/api/quiz-attempts.api';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser, isProfileLoading } = useAuth();
  const queryClient = useQueryClient();

  const [isDowngradeModalVisible, setIsDowngradeModalVisible] = useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);
  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);
  const [targetLevel, setTargetLevel] = useState<any>(null);

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

  // Debug logs to verify single source of truth for currentLevel
  useEffect(() => {
    try {
      const profile = queryClient.getQueryData<any>(['profile']);
      console.log('[PROFILE FROM BACKEND]', {
        userId: profile?.data?.id,
        currentLevelId: profile?.data?.currentLevel?.id,
        currentLevelName: profile?.data?.currentLevel?.name,
        currentExamTypeId: profile?.data?.currentExamType?.id,
      });
      console.log('[ONBOARDING] useAuth user', { userId: user?.id, currentLevelId: user?.currentLevel?.id, currentLevelName: user?.currentLevel?.name });
    } catch (e) {
      console.error('Failed to log profile data in OnboardingPage', e);
    }
  }, [user, queryClient]);

  const sortedLevels = levels ? [...levels].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) : [];
  const currentLevelId = user?.currentLevel?.id;
  const currentLevelIndex = sortedLevels.findIndex(l => l.id === currentLevelId);
  const hasCurrentLevel = !!user?.currentLevel && currentLevelIndex !== -1;
  const userRank = hasCurrentLevel ? currentLevelIndex + 1 : 0;
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
      queryClient.invalidateQueries({ queryKey: ['daily-goal', user?.id] });
      
      const targetLvl = sortedLevels.find(l => l.id === variables);
      if (hasCurrentLevel && targetLvl) {
          message.success(`Đã chuyển trình độ học sang: ${targetLvl.name}`);
      }
      navigate('/dashboard');
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || 'Có lỗi xảy ra khi đổi trình độ.');
    }
  });

  const handlePlacementTest = () => {
    navigate(`/placement-tests`);
  };

  const handleLevelClick = (lvl: any, idx: number) => {
    const targetRank = idx + 1;

    if (!hasCurrentLevel) {
      manualSelectMutation.mutate(lvl.id);
      return;
    }

    if (targetRank === userRank) {
      return;
    } else if (targetRank < userRank) {
      setTargetLevel(lvl);
      setIsDowngradeModalVisible(true);
    } else if (targetRank === userRank + 1) {
      setTargetLevel(lvl);
      setIsUpgradeModalVisible(true);
    } else {
      setTargetLevel(lvl);
      setIsBlockModalVisible(true);
    }
  };

  if (loadingExamTypes || isProfileLoading) {
    return <div className="flex h-screen items-center justify-center"><Spin size="large" /></div>;
  }

  const nextLevel = hasCurrentLevel && currentLevelIndex + 1 < sortedLevels.length ? sortedLevels[currentLevelIndex + 1] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F3EE] p-4">
      <Card className="w-full max-w-md brutal-card brutal-shadow border-[3px] border-black">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black uppercase text-[#1D2A3A]">
            {hasCurrentLevel ? 'Đổi trình độ học' : 'Chào mừng đến với LeLa'}
          </h2>
          <p className="text-gray-600 font-bold mt-2">
            {hasCurrentLevel 
              ? `Trình độ hiện tại: ${user?.currentLevel?.name}`
              : 'Bạn đã biết trình độ TOEIC của mình chưa?'}
          </p>
        </div>
        
        <div className="space-y-4">
          {loadingLevels ? (
             <div className="flex justify-center p-4"><Spin /></div>
          ) : (
             sortedLevels.map((lvl, idx) => {
                const targetRank = idx + 1;
                let statusButton = null;
                
                if (!hasCurrentLevel) {
                   statusButton = (
                     <Button 
                       className="brutal-pill border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41]" 
                       onClick={() => handleLevelClick(lvl, idx)}
                       loading={manualSelectMutation.isPending}
                     >
                        CHỌN
                     </Button>
                   );
                } else if (targetRank === userRank) {
                   statusButton = (
                     <Button disabled className="brutal-pill border-black font-black uppercase text-gray-700 bg-gray-200 cursor-not-allowed">
                        ĐANG HỌC
                     </Button>
                   );
                } else if (targetRank < userRank) {
                   statusButton = (
                     <Button 
                       className="brutal-pill border-black font-black uppercase text-white bg-[#F05A4A] hover:!bg-[#d94f41]" 
                       onClick={() => handleLevelClick(lvl, idx)}
                     >
                        ĐỔI XUỐNG
                     </Button>
                   );
                } else if (targetRank === userRank + 1) {
                   statusButton = (
                     <Button 
                       className="brutal-pill border-black font-black uppercase text-white bg-[#2A8B9D] hover:!bg-[#1f6d7a]" 
                       onClick={() => handleLevelClick(lvl, idx)}
                     >
                        <LockOutlined /> YÊU CẦU THI
                     </Button>
                   );
                } else {
                   statusButton = (
                     <Button 
                       className="brutal-pill border-black font-black uppercase text-gray-600 bg-gray-100 hover:!bg-gray-200" 
                       onClick={() => handleLevelClick(lvl, idx)}
                     >
                        <LockOutlined /> KHÓA
                     </Button>
                   );
                }

                return (
                  <div key={lvl.id} className="flex justify-between items-center p-4 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] bg-white">
                     <span className="font-bold text-lg">{lvl.name}</span>
                     {statusButton}
                  </div>
                );
             })
          )}
        </div>
        
        {showPlacementOption && (
          <div className="flex flex-col space-y-4 mt-8">
            <div className="text-center w-full mt-4">
              <span className="text-sm text-gray-500 font-bold mb-2 block">Hoặc</span>
              <Button 
                type="link" 
                className="w-full text-[#F05A4A] font-bold underline hover:text-[#d94f41] text-lg" 
                onClick={handlePlacementTest}
              >
                CHƯA BIẾT TRÌNH ĐỘ?
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Downgrade Modal */}
      <Modal
        title={null}
        open={isDowngradeModalVisible}
        onCancel={() => setIsDowngradeModalVisible(false)}
        footer={null}
        className="brutal-modal"
        closable={false}
      >
        <div className="p-6">
          <h2 className="text-2xl font-black mb-4 uppercase text-[#1D2A3A]">THAY ĐỔI TRÌNH ĐỘ</h2>
          <p className="font-bold text-lg mb-2">
            Bạn đang học: <span className="text-[#F05A4A]">{user?.currentLevel?.name}</span>
          </p>
          <p className="font-bold text-lg mb-4">
            Bạn muốn chuyển xuống: <span className="text-[#F05A4A]">{targetLevel?.name}</span>
          </p>
          <div className="bg-gray-100 p-4 rounded-xl mb-4 space-y-1 text-sm font-bold text-gray-700">
            <p>Sau khi đổi:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Lộ trình học sẽ chuyển sang trình độ mới.</li>
              <li>Bộ thẻ sẽ được điều chỉnh theo trình độ mới.</li>
              <li>Các bài kiểm tra đề xuất sẽ thay đổi.</li>
              <li>Lịch sử các bài kiểm tra cũ KHÔNG bị thay đổi.</li>
            </ul>
          </div>
          <p className="font-bold text-base mb-6 text-gray-600">Bạn có chắc chắn muốn đổi xuống không?</p>
          <div className="flex gap-4">
            <Button 
              className="flex-1 brutal-pill h-12 font-black uppercase border-[2px] border-black bg-white text-black hover:!bg-gray-100"
              onClick={() => setIsDowngradeModalVisible(false)}
            >
              HỦY
            </Button>
            <Button 
              className="flex-1 brutal-pill h-12 font-black uppercase border-[2px] border-black bg-[#F05A4A] text-white hover:!bg-[#d94f41]"
              onClick={() => {
                 manualSelectMutation.mutate(targetLevel?.id);
                 setIsDowngradeModalVisible(false);
              }}
              loading={manualSelectMutation.isPending}
            >
              ĐỔI CẤP ĐỘ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upgrade Next Level Modal */}
      <Modal
        title={null}
        open={isUpgradeModalVisible}
        onCancel={() => setIsUpgradeModalVisible(false)}
        footer={null}
        className="brutal-modal"
        closable={false}
      >
        <div className="p-6">
          <h2 className="text-2xl font-black mb-4 uppercase text-[#1D2A3A]">MỞ KHÓA TRÌNH ĐỘ MỚI</h2>
          <p className="font-bold text-lg mb-2">
            Bạn đang ở: <span className="text-[#2A8B9D]">{user?.currentLevel?.name}</span>
          </p>
          <p className="font-bold text-lg mb-4">
            Để chuyển lên: <span className="text-[#2A8B9D]">{targetLevel?.name}</span>
          </p>
          <p className="font-bold text-base mb-6 text-gray-600">
            Bạn cần hoàn thành Bài kiểm tra kết thúc cấp độ hiện tại và đạt ít nhất 80%. Bạn có muốn làm bài kiểm tra ngay không?
          </p>
          <div className="flex gap-4">
            <Button 
              className="flex-1 brutal-pill h-12 font-black uppercase border-[2px] border-black bg-white text-black hover:!bg-gray-100"
              onClick={() => setIsUpgradeModalVisible(false)}
            >
              HỦY
            </Button>
            <Button 
              className="flex-1 brutal-pill h-12 font-black uppercase border-[2px] border-black bg-[#2A8B9D] text-white hover:!bg-[#1f6d7a]"
              onClick={() => {
                setIsUpgradeModalVisible(false);
                navigate(`/quizzes?category=LEVEL_UP&levelId=${targetLevel?.id}`);
              }}
            >
              LÀM BÀI KIỂM TRA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Block Jump Modal */}
      <Modal
        title={null}
        open={isBlockModalVisible}
        onCancel={() => setIsBlockModalVisible(false)}
        footer={null}
        className="brutal-modal"
        closable={false}
      >
        <div className="p-6">
          <h2 className="text-2xl font-black mb-4 uppercase text-[#F05A4A]">KHÔNG THỂ NHẢY TRÌNH ĐỘ</h2>
          <p className="font-bold text-lg mb-2">
            Bạn hiện đang ở: <span className="text-[#1D2A3A]">{user?.currentLevel?.name}</span>
          </p>
          {nextLevel && (
            <p className="font-bold text-lg mb-4">
              Bạn chỉ có thể nâng lên: <span className="text-[#2A8B9D]">{nextLevel.name}</span>
            </p>
          )}
          <p className="font-bold text-base mb-6 text-gray-600">
            Bạn cần hoàn thành bài kiểm tra kết thúc cấp độ hiện tại để mở khóa trình độ tiếp theo.
          </p>
          <div className="flex justify-end">
            <Button 
              className="w-full brutal-pill h-12 font-black uppercase border-[2px] border-black bg-white text-black hover:!bg-gray-100"
              onClick={() => setIsBlockModalVisible(false)}
            >
              HỦY
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
