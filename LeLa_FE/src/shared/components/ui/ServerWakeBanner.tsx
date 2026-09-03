import React from 'react';
import { useServerHealth } from '../../providers/ServerHealthProvider';
import { LoadingOutlined, ReloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Button } from 'antd';

export const ServerWakeBanner: React.FC = () => {
  const { isBackendReady, status, elapsedSeconds, retryCheck } = useServerHealth();

  // If backend is ready or idle, don't show any banner
  if (isBackendReady || status === 'idle' || status === 'ready') {
    return null;
  }

  const isFailed = status === 'timeout' || status === 'error';

  return (
    <div className="w-full bg-[#FFE8E5] border-b-[3px] border-black py-2.5 px-4 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          {isFailed ? (
            <ExclamationCircleOutlined className="text-lg text-brand-coral font-bold" />
          ) : (
            <LoadingOutlined className="text-lg text-brand-coral animate-spin" />
          )}
          <span className="font-bold text-brand-navy">
            {isFailed ? (
              <>Không thể kết nối máy chủ. Máy chủ Render Free có thể đang khởi động chậm.</>
            ) : status === 'waking' ? (
              <>
                Máy chủ đang khởi động, vui lòng chờ một chút...{' '}
                <span className="text-xs font-semibold text-gray-600">({elapsedSeconds}s)</span>
              </>
            ) : (
              <>Đang kết nối máy chủ...</>
            )}
          </span>
        </div>

        {isFailed && (
          <Button
            size="small"
            type="primary"
            onClick={retryCheck}
            icon={<ReloadOutlined />}
            className="brutal-pill !bg-brand-coral !text-white font-bold h-8 px-4 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] hover:!bg-[#d94f41]"
          >
            Thử lại
          </Button>
        )}
      </div>
    </div>
  );
};
