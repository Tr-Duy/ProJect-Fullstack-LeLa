import React from 'react';
import { Button } from 'antd';
import { CustomerServiceOutlined, QuestionCircleOutlined, LockOutlined, CreditCardOutlined, BugOutlined } from '@ant-design/icons';

export const LeLaSupportTool: React.FC = () => {
  const supportTopics = [
    {
      title: 'Tài khoản & Đăng nhập',
      icon: <LockOutlined className="text-xl text-[#F05A4A]" />,
      desc: 'Quên mật khẩu, không đăng nhập được, xác thực email.',
      contactText: 'Vui lòng sử dụng tính năng "Quên mật khẩu" tại màn hình đăng nhập hoặc gửi phản hồi cho Ban Quản Trị.',
    },
    {
      title: 'Bài kiểm tra & Trình độ',
      icon: <QuestionCircleOutlined className="text-xl text-[#2A8B9D]" />,
      desc: 'Lỗi làm bài Final quiz, điểm số placement test, thăng cấp.',
      contactText: 'Nếu bài test bị gián đoạn do sự cố mạng, bài làm của bạn vẫn được lưu trong Lịch Sử Kiểm Tra.',
    },
    {
      title: 'Thanh toán & Gói dịch vụ',
      icon: <CreditCardOutlined className="text-xl text-[#FFD700]" />,
      desc: 'Lỗi giao dịch, nâng cấp tài khoản Premium, hoá đơn.',
      contactText: 'Liên hệ bộ phận chăm sóc khách hàng qua livechat Support ở góc màn hình.',
    },
    {
      title: 'Báo lỗi hệ thống & Góp ý',
      icon: <BugOutlined className="text-xl text-[#1D2A3A]" />,
      desc: 'Gặp lỗi giao diện, từ vựng sai hoặc đóng góp ý kiến.',
      contactText: 'Mọi góp ý của bạn giúp hệ thống học tập LeLa hoàn thiện hơn!',
    },
  ];

  return (
    <div className="bg-white brutal-card brutal-shadow p-6 border-[3px] border-black rounded-2xl">
      <div className="flex items-center gap-2 border-b-[3px] border-black pb-3 mb-6">
        <CustomerServiceOutlined className="text-2xl text-[#2A8B9D]" />
        <h2 className="text-xl font-black uppercase text-[#1D2A3A] m-0">
          TRUNG TÂM HỖ TRỢ LELA (SYSTEM SUPPORT)
        </h2>
      </div>

      <p className="text-gray-600 font-medium mb-6">
        Nếu bạn gặp các vấn đề về tài khoản, bài kiểm tra, thanh toán hoặc sự cố kỹ thuật, hãy chọn chủ đề tương ứng bên dưới để nhận hướng dẫn.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {supportTopics.map((topic, idx) => (
          <div
            key={idx}
            className="p-5 bg-[#F4F3EE] rounded-xl border-[2px] border-black shadow-[2px_2px_0px_0px_#000]"
          >
            <div className="flex items-center gap-3 mb-2">
              {topic.icon}
              <h3 className="text-lg font-black text-[#1D2A3A] m-0">{topic.title}</h3>
            </div>
            <p className="text-xs font-bold text-gray-500 mb-3">{topic.desc}</p>
            <div className="text-sm font-medium text-gray-700 bg-white p-3 rounded-lg border border-gray-300">
              {topic.contactText}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1D2A3A] text-white p-6 rounded-xl border-[2px] border-black flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="text-lg font-black text-[#FFD700] m-0">Cần trò chuyện trực tiếp với Ban Quản Trị?</h4>
          <p className="text-sm font-medium text-gray-300 m-0 mt-1">
            Vui lòng nhấn vào nút biểu tượng **💬 Hỗ trợ trực tuyến LeLa** ở góc phải bên dưới màn hình.
          </p>
        </div>
        <Button
          onClick={() => {
            const chatWidgetButton = document.querySelector('button[aria-label="Mở livechat support"], button.bg-orange-500') as HTMLButtonElement;
            if (chatWidgetButton) {
              chatWidgetButton.click();
            }
          }}
          className="brutal-pill border-black font-black uppercase text-black bg-[#FFD700] hover:!bg-white h-11 px-6 text-sm shrink-0"
        >
          MỞ CHAT HỖ TRỢ
        </Button>
      </div>
    </div>
  );
};
