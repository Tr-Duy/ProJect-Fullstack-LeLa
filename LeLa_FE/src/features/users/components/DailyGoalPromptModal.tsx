import { useState, useEffect } from 'react';
import { Modal, Button, App } from 'antd';
import { useAuth } from '../../../shared/providers/AuthProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dailyGoalApi } from '../api/daily-goal.api';
import { BrutalNumberInput } from '../../../shared/components/ui/BrutalNumberInput';

export function DailyGoalPromptModal() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(false);
  const [goal, setGoal] = useState<number>(20);

  const { data: goalStatus } = useQuery({
    queryKey: ['daily-goal', user?.id],
    queryFn: () => dailyGoalApi.getStatus(),
    enabled: !!user && user?.currentLevel != null,
  });

  useEffect(() => {
    if (goalStatus?.shouldShow) {
      setGoal(user?.dailyGoalCards || 20);
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [goalStatus, user]);

  const updateMutation = useMutation({
    mutationFn: (newGoal: number) => dailyGoalApi.confirmGoal({ targetCards: newGoal }),
    onSuccess: () => {
      message.success('Đã cập nhật mục tiêu học tập hôm nay!');
      queryClient.invalidateQueries({ queryKey: ['daily-goal', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setVisible(false);
    },
    onError: () => {
      message.error('Có lỗi xảy ra khi lưu mục tiêu.');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(goal);
  };

  const handleSkip = () => {
    setVisible(false);
  };

  if (!user) {
    return null;
  }

  return (
    <Modal
      open={visible}
      closable={false}
      mask={{ closable: false }}
      footer={null}
      className="[&_.ant-modal-content]:!rounded-[var(--radius-card)] [&_.ant-modal-content]:!p-8 [&_.ant-modal-content]:!border-[3px] [&_.ant-modal-content]:!border-[var(--border)] [&_.ant-modal-content]:!rounded-3xl"
      width={400}
      centered
    >
      <div className="text-center">
        <div className="text-5xl mb-4">🦊</div>
        <h2 className="text-2xl font-black  text-[#2B1B0E] mb-2 tracking-tighter">
          Mục tiêu hôm nay
        </h2>
        <p className="font-bold text-gray-500 mb-6">
          Bạn muốn ôn tập bao nhiêu thẻ từ vựng trong hôm nay?
        </p>

        <div className="mb-6">
          <BrutalNumberInput
            min={1}
            max={100}
            step={1}
            value={goal}
            onChange={(val) => setGoal(val || 20)}
          />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSkip}
            className="flex-1 brutal-pill border border-[var(--border)] bg-white text-black h-14 font-black text-lg hover:!bg-gray-100 transition-colors"
          >
            Bỏ qua
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            loading={updateMutation.isPending}
            className="flex-1 brutal-pill border border-[var(--border)] bg-[#F05A4A] text-white h-14 font-black text-lg tracking-normal hover:!translate-y-[-2px] hover:!shadow-[var(--shadow-md)] transition-all"
          >
            Quyết tâm!
          </Button>
        </div>
      </div>
    </Modal>
  );
}
