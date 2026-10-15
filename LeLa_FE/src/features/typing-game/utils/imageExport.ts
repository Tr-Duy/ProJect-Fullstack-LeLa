import type { TypingRunResultResponse } from '../types/typingGame.types';

export function exportResultImage(result: TypingRunResultResponse): void {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background Gradient (Dark Neo-Brutalist Cyber)
  const bgGrad = ctx.createLinearGradient(0, 0, 800, 600);
  bgGrad.addColorStop(0, '#0F172A');
  bgGrad.addColorStop(1, '#1E293B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 800, 600);

  // Border Outer Frame
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#2A8B9D';
  ctx.strokeRect(5, 5, 790, 590);

  // Accent Corner
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#F05A4A';
  ctx.strokeRect(15, 15, 770, 570);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 36px Inter, sans-serif';
  ctx.fillText('LELA TYPING RAIN', 50, 70);

  ctx.fillStyle = '#F05A4A';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText('CHỨNG NHẬN HOÀN THÀNH LƯỢT CHƠI', 50, 105);

  // Deck Title & Mode
  ctx.fillStyle = '#94A3B8';
  ctx.font = '16px Inter, sans-serif';
  ctx.fillText(`Bộ thẻ: ${result.deckTitle}`, 50, 140);
  ctx.fillText(`Chế độ: ${result.mode} | Trạng thái: ${result.status}`, 50, 165);

  // Metrics Grid Cards
  drawStatBox(ctx, 50, 200, 210, 120, 'ĐIỂM SỐ', `${result.score}`, '#FBBF24');
  drawStatBox(ctx, 290, 200, 210, 120, 'TỐC ĐỘ (WPM)', `${result.wpm}`, '#38BDF8');
  drawStatBox(ctx, 530, 200, 210, 120, 'ĐỘ CHÍNH XÁC', `${result.accuracy}%`, '#4ADE80');

  drawStatBox(ctx, 50, 350, 210, 120, 'TỪ HOÀN THÀNH', `${result.wordsCleared}/${result.wordsCleared + result.wordsMissed}`, '#A855F7');
  drawStatBox(ctx, 290, 350, 210, 120, 'MAX COMBO', `${result.maxCombo}x`, '#FB923C');
  drawStatBox(ctx, 530, 350, 210, 120, 'XP NHẬN ĐƯỢC', `+${result.xpEarned} XP`, '#F43F5E');

  // Footer Tagline & Date
  const dateStr = new Date().toLocaleDateString('vi-VN');
  ctx.fillStyle = '#64748B';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText(`Thời gian hoàn thành: ${dateStr} - LeLa Vocabulary Platform`, 50, 530);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `LeLa_Typing_${result.publicId.substring(0, 8)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function drawStatBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  accentColor: string
) {
  ctx.save();
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.fillRect(x, y, w, h);

  ctx.lineWidth = 2;
  ctx.strokeStyle = accentColor;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText(label, x + 16, y + 32);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 32px Inter, sans-serif';
  ctx.fillText(value, x + 16, y + 80);

  ctx.restore();
}
