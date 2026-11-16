import {test,expect} from '@playwright/test';
import {createServer,type Server} from 'node:http';
import type {Page} from '@playwright/test';
let server:Server;let url:string;
const content='  Xin chào tiếng Việt 😀\n\nCâu trả lời đầy đủ.  ';
test.beforeAll(async()=>{
 server=createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','*');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  req.resume();res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8'});
  const event=(type:string,payload:unknown)=>`event: ${type}\r\ndata: ${JSON.stringify(payload)}\r\n\r\n`;
  res.write('event: ready\ndata: {}\n\n');
  if(req.url==='/slow'){
   const slowTimer=setTimeout(()=>{
    if(res.destroyed)return;
    res.write(event('delta',{sequence:0,text:'Phản hồi sau khi chờ sâu.'}));
    res.end(event('done',{content:'Phản hồi sau khi chờ sâu.',finishReason:'STOP',complete:true,model:'mock',requestId:'mock-id'}));
   },3600);
   res.on('close',()=>clearTimeout(slowTimer));
   return;
  }
  const first=setTimeout(()=>{const data=Buffer.from(event('delta',{sequence:0,text:content.slice(0,24)}));let i=0;
   const pieces=setInterval(()=>{if(res.destroyed||i>=data.length){clearInterval(pieces);return}res.write(data.subarray(i,i+1));i++},1);
   res.on('close',()=>clearInterval(pieces));
  },100);
  const last=setTimeout(()=>{
   if(res.destroyed)return;
   if(req.url==='/error'){res.end(event('error',{code:'UPSTREAM'}));return}
   res.write(event('delta',{sequence:1,text:content.slice(24)}));
   res.end(event('done',{content,finishReason:'STOP',complete:true,model:'mock',requestId:'mock-id'}));
  },3500);
  res.on('close',()=>{clearTimeout(first);clearTimeout(last)});
 });await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();if(!address||typeof address==='string')throw Error('server');url=`http://127.0.0.1:${address.port}`;
});
test.afterAll(async()=>{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()))});
const user = { id: 901, username: 'tutorqa', fullName: 'Tutor QA', roles: ['LEARNER'], xpTotal: 44,
  streakCurrent: 0, dailyGoalCards: 20, currentLevel: { id: 1, name: 'Cơ bản (Dưới 500)' }, currentExamType: { id: 1 } };
const envelope = (data: unknown) => ({ success: true, data });
const send = async (page: Page, text: string) => {
  await page.getByRole('textbox', { name: 'Nội dung gửi cho AI Tutor' }).fill(text);
  await page.getByRole('button', { name: 'Gửi tin nhắn', exact: true }).click();
};
const bubble = (page: Page, role: string) => page.locator(`[data-testid="tutor-message"][data-message-role="${role}"]`);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('accessToken', 'test-access'); localStorage.setItem('refreshToken', 'test-refresh'); });
  await page.route('**/api/v1/**', async route => {
    const url = new URL(route.request().url());
    let data: unknown = { content: [] };
    if (url.pathname.endsWith('/profile')) data = user;
    else if (url.pathname.endsWith('/health')) data = {};
    else if (url.pathname.endsWith('/daily-activities/today')) data = { cardsLearned: 1, reviewCount: 5, currentStreak: 1 };
    else if (url.pathname.endsWith('/daily-activities/history')) data = [];
    else if (url.pathname.endsWith('/daily-goal')) data = { shouldShow: false };
    else if (url.pathname.endsWith('/enrollments/my-list')) data = { content: [{ deckId: 1, deckTitle: 'Contracts', masteredCards: 4, deckTotalCards: 16 }] };
    else if (url.pathname.endsWith('/quiz-attempts/my')) data = { content: [{ correctAnswers: 2, totalQuestions: 5 }] };

    await route.fulfill({ json: envelope(data) });
  });
});


const connect=async(page:Page,path='/normal')=>page.route('**/ai/chat/stream',r=>r.continue({url:url+path}));
test('real chunked transport renders text under 3s while pending, joins UTF-8 exactly, one turn',async({page})=>{
 await connect(page);let calls=0;page.on('request',r=>{if(r.url().endsWith('/ai/chat/stream'))calls++});
 await page.goto('/ai-chat');const start=Date.now();await send(page,'Stream');
 await expect(bubble(page,'ai')).toContainText('Xin chào tiếng Việt',{timeout:2900});expect(Date.now()-start).toBeLessThan(3000);
 await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','pending');await expect(bubble(page,'ai').getByRole('status')).toContainText('Đang viết');
 await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','complete');
 const stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('lela_ai_chat_session_messages:901')!));
 expect(stored[1].content).toBe(content);expect(calls).toBe(1);await expect(bubble(page,'user')).toHaveCount(1);
});
test('Stop after first text keeps partial explicitly interrupted',async({page})=>{
 await connect(page);await page.goto('/ai-chat');await send(page,'Stop');await expect(bubble(page,'ai')).toContainText('Xin chào');
 await page.getByRole('button',{name:'Dừng tạo câu trả lời'}).click();await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','interrupted');
 await page.waitForTimeout(3600);await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','interrupted');
 await expect(bubble(page,'ai')).not.toContainText('Câu trả lời đầy đủ');
});
test('F5 after first text persists partial as interrupted without resending',async({page})=>{
 await connect(page);let calls=0;page.on('request',r=>{if(r.url().endsWith('/ai/chat/stream'))calls++});
 await page.goto('/ai-chat');await send(page,'Reload');await expect(bubble(page,'ai')).toContainText('Xin chào');await page.reload();
 await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','interrupted');expect(calls).toBe(1);await expect(bubble(page,'user')).toHaveCount(1);
});
test('upstream error after delta cannot become complete',async({page})=>{
 await connect(page,'/error');await page.goto('/ai-chat');await send(page,'Error');await expect(bubble(page,'ai')).toContainText('Xin chào');
 await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','incomplete');await expect(page.getByRole('alert')).toBeVisible();
});
test('token expires during stream: current turn completes; next turn refreshes once with same ID',async({page})=>{
 let refresh=0;const ids:string[]=[];let expiredCalls=0;
 await page.route('**/auth/refresh-token',async r=>{refresh++;await r.fulfill({json:envelope({accessToken:'new-access'})})});
 await page.route('**/ai/chat/stream',async r=>{ids.push(r.request().postDataJSON().clientMessageId);
  if(r.request().headers().authorization==='Bearer expired'){expiredCalls++;await r.fulfill({status:401,json:{}});return}
  await r.continue({url:url+'/normal'});
 });
 await page.goto('/ai-chat');await send(page,'First');await expect(bubble(page,'ai')).toContainText('Xin chào');
 await page.evaluate(()=>localStorage.setItem('accessToken','expired'));await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','complete');
 await send(page,'Second');await expect(page.locator('[data-message-role="ai"][data-message-status="complete"]')).toHaveCount(2);
 expect(expiredCalls).toBe(1);expect(refresh).toBe(1);expect(ids).toHaveLength(3);expect(ids[1]).toBe(ids[2]);await expect(bubble(page,'user')).toHaveCount(2);
});

test('slow response (>3s) transitions from thinking to deep preparation message with stop button',async({page})=>{
 await connect(page,'/slow');await page.goto('/ai-chat');await send(page,'Câu hỏi sâu');
 await expect(bubble(page,'ai')).toContainText('LeLa đang suy nghĩ');
 await expect(bubble(page,'ai')).toContainText('LeLa đang chuẩn bị câu trả lời, có thể mất vài chục giây với câu hỏi sâu',{timeout:4500});
 await expect(page.locator('[data-testid="bubble-stop-button"]')).toBeVisible();
 await page.locator('[data-testid="bubble-stop-button"]').click();
 await expect(bubble(page,'ai')).toHaveAttribute('data-message-status','interrupted');
});
