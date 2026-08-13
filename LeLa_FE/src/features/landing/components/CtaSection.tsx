import { Button } from "antd";

interface Props {
  onAction?: (path: string) => void;
}

export function CtaSection({ onAction }: Props) {
  return (
    <section className="w-full bg-brand-navy py-32 border-y-[3px] border-brand-black">
      <div className="mx-auto max-w-[1000px] px-6 lg:px-12 text-center">
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-8">
          Sẵn sàng mở rộng vốn từ?
        </h2>
        <p className="text-xl font-medium text-white/80 mb-12 max-w-2xl mx-auto">
          Tạo tài khoản miễn phí và bắt đầu xây dựng bộ flashcard đầu tiên của bạn ngay hôm nay.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            onClick={() => onAction?.('/login')}
            type="primary" 
            size="large" 
            className="h-16 px-10 text-xl font-bold brutal-shadow brutal-border brutal-pill bg-brand-coral text-white hover:bg-brand-teal transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000]"
          >
            Đăng ký miễn phí
          </Button>
          <Button 
            onClick={() => onAction?.('#features')}
            size="large" 
            className="h-16 px-10 text-xl font-bold brutal-shadow brutal-border brutal-pill bg-white text-brand-navy hover:bg-brand-offwhite transition-all hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000000]"
          >
            Tìm hiểu thêm
          </Button>
        </div>
      </div>
    </section>
  );
}
