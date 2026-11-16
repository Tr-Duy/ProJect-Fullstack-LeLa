import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TutorSseParser} from '../src/features/ai-chat/api/tutorSse.ts';
const encode=s=>new TextEncoder().encode(s);
test('every byte boundary, UTF-8, CRLF, multiple events and exact whitespace',()=>{
 const text='event: delta\r\ndata: {"sequence":0,"text":"  Tiếng Việt 😀\\n"}\r\n\r\nevent: done\ndata: {"complete":true}\n\n';
 const bytes=encode(text);
 for(let split=0;split<=bytes.length;split++){
  const events=[];const parser=new TutorSseParser((event,data)=>events.push([event,JSON.parse(data)]));
  parser.push(bytes.slice(0,split));parser.push(bytes.slice(split));parser.finish();
  assert.deepEqual(events,[['delta',{sequence:0,text:'  Tiếng Việt 😀\n'}],['done',{complete:true}]]);
 }
});
test('one-byte chunks and EOF without a final newline',()=>{
 const events=[];const parser=new TutorSseParser((event,data)=>events.push([event,data]));
 for(const byte of encode('event: delta\ndata: tiếng Việt\ndata:  trailing  '))parser.push(Uint8Array.of(byte));
 parser.finish();assert.deepEqual(events,[['delta','tiếng Việt\n trailing  ']]);
});
test('error event interrupts after delta and never invents done',()=>{
 const events=[];const parser=new TutorSseParser((event,data)=>{events.push(event);if(event==='error')throw Error('provider error')});
 assert.throws(()=>parser.push(encode('event: delta\ndata: {}\n\nevent: error\ndata: {}\n\n')),/provider error/);
 assert.deepEqual(events,['delta','error']);
});
test('truncated UTF-8 is a protocol error',()=>{
 const parser=new TutorSseParser(()=>{});parser.push(Uint8Array.of(0xe1));assert.throws(()=>parser.finish());
});
