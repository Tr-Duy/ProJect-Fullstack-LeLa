import React from 'react';
import { Modal } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, ExclamationCircleOutlined, GoogleOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface GoogleLoginWakeModalProps {
  isOpen: boolean;
  status: 'connecting' | 'waking' | 'ready' | 'timeout' | 'error';
  elapsedSeconds: number;
  onRetry: () => void;
  onClose: () => void;
}

export const GoogleLoginWakeModal: React.FC<GoogleLoginWakeModalProps> = ({
  isOpen,
  status,
  elapsedSeconds,
  onRetry,
  onClose,
}) => {
  const getStatusContent = () => {
    switch (status) {
      case 'ready':
        return {
          icon: <CheckCircleOutlined className="text-5xl text-green-500 animate-bounce" />,
          title: 'Đã sẵn sàng!',
          desc: 'Đang chuyển hướng sang Google OAuth...',
          subtext: 'Vui lòng chọn tài khoản Google của bạn trong giây lát.',
        };
      case 'timeout':
      case 'error':
        return {
          icon: <ExclamationCircleOutlined className="text-5xl text-amber-500" />,
          title: 'Không thể kết nối máy chủ',
          desc: 'Máy chủ mất quá nhiều thời gian để phản hồi.',
          subtext: 'Vui lòng thử lại sau vài giây hoặc kiểm tra kết nối mạng.',
        };
      case 'waking':
        return {
          icon: <LoadingOutlined className="text-5xl text-brand-coral animate-spin" />,
          title: 'Đang khởi động máy chủ',
          desc: 'Máy chủ đang thức dậy, vui lòng chờ một chút...',
          subtext: `Thời gian đã chờ: ${elapsedSeconds}s (Có thể mất 20 - 40 giây khi máy chủ bắt đầu phiên mới)`,
        };
      case 'connecting':
      default:
        return {
          icon: <LoadingOutlined className="text-5xl text-brand-coral animate-spin" />,
          title: 'Đang kết nối máy chủ',
          desc: 'Đang kiểm tra trạng thái dịch vụ...',
          subtext: 'Hệ thống đang chuẩn bị môi trường đăng nhập an toàn.',
        };
    }
  };

  const { icon, title, desc, subtext } = getStatusContent();
  const isFailed = status === 'timeout' || status === 'error';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      centered
      closable={true}
      maskClosable={isFailed}
      width={440}
      className="brutal-modal"
    >
      <div className="text-center py-4 px-2">
        {/* Mascot & Icon Header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 flex items-center justify-center p-1 bg-amber-100 rounded-2xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000]">
            <img
              src="/images/lela_fox_logo.png"
              alt="LeLa Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-2xl font-black text-brand-navy tracking-tight">LeLa</span>
        </div>

        {/* Status Animation Icon */}
        <div className="my-5 flex items-center justify-center">
          {icon}
        </div>

        {/* Title & Descriptions */}
        <h3 className="text-2xl font-black uppercase text-brand-navy mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-base font-bold text-gray-700 mb-1">
          {desc}
        </p>
        <p className="text-xs font-semibold text-gray-500 mb-6">
          {subtext}
        </p>

        {/* Action buttons on error/timeout */}
        {isFailed ? (
          <div className="flex gap-3 justify-center pt-2">
            <Button
              onClick={onClose}
              className="brutal-pill border-[2px] border-black bg-white text-black font-bold h-12 px-6 hover:bg-gray-100 transition-transform"
            >
              Đóng
            </Button>
            <Button
              type="primary"
              onClick={onRetry}
              icon={<GoogleOutlined />}
              className="brutal-pill border-[2px] border-black !bg-brand-coral !text-white font-black h-12 px-6 shadow-[3px_3px_0px_0px_#000] hover:!bg-[#d94f41] transition-all"
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden border border-black/20">
            <div
              className={`h-full bg-brand-coral transition-all duration-500 ${
                status === 'ready' ? 'w-full !bg-green-500' : 'w-2/3 animate-pulse'
              }`}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
