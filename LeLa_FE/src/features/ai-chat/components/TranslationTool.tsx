import React, { useState, useRef } from 'react';
import { Button, Input, message as antMessage } from 'antd';
import { SwapOutlined, CopyOutlined, SoundOutlined, TranslationOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import { aiApi } from '../api/aiApi';

export const TranslationTool: React.FC = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [direction, setDirection] = useState<'EN_VI' | 'VI_EN'>('EN_VI');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSwap = () => {
    setDirection((prev) => (prev === 'EN_VI' ? 'VI_EN' : 'EN_VI'));
    setSourceText('');
    setTranslatedText('');
    setError(null);
    setIsCopied(false);
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      antMessage.warning('Vui lòng nhập nội dung cần dịch.');
      return;
    }

    setTranslatedText('');
    setError(null);
    setIsLoading(true);
    setIsCopied(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fromLang = direction === 'EN_VI' ? 'English' : 'Vietnamese';
    const toLang = direction === 'EN_VI' ? 'natural Vietnamese' : 'natural English';

    const prompt = `You are a professional ${fromLang}-${toLang} translator.

Translate the following ${fromLang} text into ${toLang}.

Rules:
- Return ONLY the translation.
- Do NOT explain grammar.
- Do NOT explain vocabulary.
- Do NOT add notes.
- Do NOT add quotation marks.
- Preserve the original meaning.
- Preserve paragraphs and line breaks when possible.

Text:
${sourceText.trim()}`;

    try {
      await aiApi.streamChat(
        { message: prompt },
        (chunk) => {
          setTranslatedText((prev) => prev + chunk);
        },
        (err) => {
          console.error('[Translation API Error]', err);
          setError('Không thể dịch lúc này. Vui lòng thử lại.');
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        },
        abortControllerRef.current.signal
      );
    } catch (err) {
      setError('Không thể dịch lúc này. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, langType: 'source' | 'target') => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (langType === 'source') {
          utterance.lang = direction === 'EN_VI' ? 'en-US' : 'vi-VN';
        } else {
          utterance.lang = direction === 'EN_VI' ? 'vi-VN' : 'en-US';
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech synthesis error', err);
      }
    } else {
      antMessage.info('Trình duyệt không hỗ trợ đọc âm thanh.');
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    antMessage.success('Đã sao chép!');
    setTimeout(() => {
      setIsCopied(false);
    }, 1500);
  };

  return (
    <div className="bg-white brutal-card p-6 md:p-8 border-[2px] border-black rounded-[24px] shadow-[6px_6px_0px_0px_#000]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-[2px] border-black pb-4 mb-6 gap-3">
        <div className="flex items-center gap-2.5">
          <TranslationOutlined className="text-2xl text-[#2A8B9D]" />
          <h2 className="text-xl md:text-2xl font-black uppercase text-[#1D2A3A] m-0 tracking-tight flex items-baseline gap-2">
            <span>DỊCH TIẾNG ANH</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">TRANSLATOR</span>
          </h2>
        </div>

        {/* Language Selector Button */}
        <Button
          onClick={handleSwap}
          className="brutal-pill border-[2px] border-black bg-[#FFD700] hover:bg-[#ffe247] font-black text-[#1D2A3A] flex items-center gap-2 text-xs md:text-sm h-10 px-4 shadow-[2px_2px_0px_0px_#000]"
        >
          <span>{direction === 'EN_VI' ? '🇬🇧 Tiếng Anh  ➔  🇻🇳 Tiếng Việt' : '🇻🇳 Tiếng Việt  ➔  🇬🇧 Tiếng Anh'}</span>
          <SwapOutlined className="text-base" />
        </Button>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Left Column: Source Text */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center h-6">
            <label className="text-xs font-black uppercase tracking-wider text-gray-600">
              VĂN BẢN GỐC ({direction === 'EN_VI' ? '🇬🇧 TIẾNG ANH' : '🇻🇳 TIẾNG VIỆT'})
            </label>
            {sourceText && (
              <Button
                type="text"
                onClick={() => handleSpeak(sourceText, 'source')}
                icon={<SoundOutlined />}
                className="font-bold text-xs p-0 text-gray-600 hover:text-black flex items-center gap-1"
              >
                Nghe
              </Button>
            )}
          </div>
          <Input.TextArea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder={
              direction === 'EN_VI'
                ? 'Nhập hoặc dán tiếng Anh cần dịch...'
                : 'Nhập hoặc dán tiếng Việt cần dịch...'
            }
            className="brutal-input p-5 font-medium text-[17px] leading-relaxed rounded-[22px] border-[2px] border-black shadow-[2px_2px_0px_0px_#000] focus:border-[#F05A4A] focus:ring-0 h-[300px] resize-none"
          />
          <div className="text-[11px] font-bold text-gray-400 px-1 mt-0.5">
            {sourceText ? `${sourceText.length} ký tự` : 'Bạn có thể nhập một câu hoặc cả đoạn văn.'}
          </div>
        </div>

        {/* Right Column: Translation Result */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center h-6">
            <label className="text-xs font-black uppercase tracking-wider text-gray-600">
              BẢN DỊCH ({direction === 'EN_VI' ? '🇻🇳 TIẾNG VIỆT' : '🇬🇧 TIẾNG ANH'})
            </label>
            {translatedText && !isLoading && (
              <div className="flex items-center gap-3">
                <Button
                  type="text"
                  onClick={() => handleSpeak(translatedText, 'target')}
                  icon={<SoundOutlined />}
                  className="font-bold text-xs p-0 text-gray-600 hover:text-black flex items-center gap-1"
                >
                  🔊 Nghe
                </Button>
                <Button
                  type="text"
                  onClick={() => handleCopy(translatedText)}
                  icon={isCopied ? <CheckOutlined className="text-green-600" /> : <CopyOutlined />}
                  className={`font-bold text-xs p-0 flex items-center gap-1 ${
                    isCopied ? 'text-green-600 font-black' : 'text-[#2A8B9D] hover:text-[#1D2A3A]'
                  }`}
                >
                  {isCopied ? '✓ Đã sao chép' : '📋 Sao chép'}
                </Button>
              </div>
            )}
          </div>

          <div className="h-[300px] p-5 bg-[#F4F3EE] rounded-[22px] border-[2px] border-black shadow-[2px_2px_0px_0px_#000] overflow-y-auto flex flex-col justify-between">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                <span className="font-black text-base text-[#2A8B9D] animate-pulse">🤖 Đang dịch...</span>
                {translatedText && (
                  <div className="w-full text-[#1D2A3A] font-medium text-[18px] leading-[1.7] text-left whitespace-pre-wrap mt-2">
                    {translatedText}
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-3 text-red-600">
                <span className="font-bold text-sm">⚠️ {error}</span>
                <Button
                  onClick={handleTranslate}
                  icon={<ReloadOutlined />}
                  className="brutal-pill border-black bg-white font-bold text-xs"
                >
                  Vui lòng thử lại
                </Button>
              </div>
            ) : translatedText ? (
              <div className="text-[#1D2A3A] font-medium text-[18px] leading-[1.7] text-left whitespace-pre-wrap">
                {translatedText}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 gap-2">
                <span className="text-3xl opacity-60">🌐</span>
                <span className="text-gray-500 font-bold text-sm">Bản dịch sẽ xuất hiện ở đây</span>
                <span className="text-gray-400 font-medium text-xs">
                  {direction === 'EN_VI'
                    ? 'Nhập tiếng Anh ở bên trái và bấm "Dịch ngay".'
                    : 'Nhập tiếng Việt ở bên trái và bấm "Dịch ngay".'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-6 flex flex-wrap items-center justify-end border-t-[2px] border-black pt-5">
        <Button
          onClick={handleTranslate}
          disabled={isLoading}
          className="w-full md:w-auto brutal-pill border-[2px] border-black font-black uppercase text-white !bg-[#F05A4A] hover:!bg-[#d94f41] disabled:opacity-50 h-12 px-10 text-base shadow-[3px_3px_0px_0px_#000] flex items-center justify-center gap-2"
        >
          {isLoading ? '🤖 ĐANG DỊCH...' : translatedText ? 'DỊCH LẠI' : '🌐 DỊCH NGAY'}
        </Button>
      </div>
    </div>
  );
};
