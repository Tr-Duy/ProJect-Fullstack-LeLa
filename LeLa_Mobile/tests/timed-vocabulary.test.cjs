const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const Renderer = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;

// Render the real native component/hook, replacing only host widgets and network/TTS.
// This validates interactions, not native layout or real device lifecycle delivery.
function harness(matching = false, seconds = 20, legacyType = null) {
  const left = matching ? [{id:'l1',text:'apple'},{id:'l2',text:'book'},{id:'l3',text:'cat'},{id:'l4',text:'sun'}]
    : [{id:'1',text:'enjoy'},{id:'2',text:'build'},{id:'3',text:'write'},{id:'4',text:'walk'}];
  const right = matching ? [{id:'r3',text:'con mèo'},{id:'r1',text:'quả táo'},{id:'r4',text:'mặt trời'},{id:'r2',text:'quyển sách'}] : [];
  const solution = matching ? {l1:'r1',l2:'r2',l3:'r3',l4:'r4'} : {answer:'1'};
  let view = {attemptId:1,publicId:'native-fixture',title:matching?'Ghép cặp từ - Định nghĩa':'Chọn đáp án đúng',
    index:0,total:matching?5:20,serverNow:Date.now(),deadline:Date.now()+seconds*1000,seconds,started:true,
    paused:false,done:false,timedOut:false,closed:false,type:matching?'MATCHING_PAIRS':'MULTIPLE_CHOICE_MEANING',
    prompt:'tận hưởng / thích',left,right,matched:[],errors:0,selected:null,solution:{},score:0,lastCorrect:null};
  const initial = {...view}; const events = []; const finished = [];
  const handlers = new Map(); let failOnce = false; const receipts = new Set();
  const api = { modes:async()=>({MULTIPLE_CHOICE_MEANING:true,MATCHING_PAIRS:true}),
    finish:async(id,abandoned,answers)=>{finished.push({id,abandoned,answers});return {scorePoints:0};},
    event: async(id,event)=>{
      events.push(event);
      if (!receipts.has(event.requestId)) {
        receipts.add(event.requestId); view = {...view,lastCorrect:null};
        if(event.action==='ANSWER'){view.done=true;view.selected=event.leftId;view.lastCorrect=event.leftId==='1';view.score=view.lastCorrect?1:0;}
        if(event.action==='PAIR') {view.lastCorrect=solution[event.leftId]===event.rightId;
          if(view.lastCorrect)view.matched=[...view.matched,event.leftId,event.rightId];else view.errors++;
          view.done=view.matched.length===8;view.score=Math.max(0,view.matched.length/2-view.errors*.25);}
        if(event.action==='TIMEOUT'){view.done=true;view.timedOut=true;}
        if(event.action==='PAUSE')view.paused=true;
        if(event.action==='RESUME')view.paused=false;
        if(event.action==='NEXT'){view.index++;view.done=false;view.matched=[];view.selected=null;}
      }
      if(failOnce){failOnce=false;throw new Error('lost response after server accepted');}
      return {...view,serverNow:Date.now(),solution:view.done?solution:{},...(view.paused?{left:[],right:[],prompt:''}:{left,right})};
    }};
  const native = Object.fromEntries(['ActivityIndicator','Modal','ScrollView','Text','TouchableOpacity','View','TextInput','Image'].map(k=>[k,k]));
  native.StyleSheet={create:s=>s}; native.AppState={addEventListener:(name,fn)=>{handlers.set(name,fn);return{remove:()=>handlers.delete(name)};}};
  native.Dimensions = {get:()=>({width:375,height:812})}; native.Alert={alert:()=>{}};
  const navigation={goBack:()=>{},replace:()=>{},navigate:()=>{}};
  const cache = new Map();
  function load(file) {
    if(cache.has(file))return cache.get(file).exports;
    const mod={exports:{}};cache.set(file,mod);
    const source = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
    function localRequire(name){
      if(name==='react')return React;
      if(name==='react/jsx-runtime')return require(name);
      if(name==='react-native')return native;
      if(name==='react-native-safe-area-context')return{SafeAreaView:'SafeAreaView'};
      if(name==='expo-speech')return{stop:async()=>{},speak:()=>{}};
      if(name==='@expo/vector-icons')return{Ionicons:'Ionicons'};
      if(name==='@react-navigation/native')return{useNavigation:()=>navigation,useRoute:()=>({params:{quizId:1}})};
      if(name.endsWith('/services/quizService'))return{quizService:{startAttempt:async()=>({id:1,publicId:'legacy',questions:[{id:10,questionType:legacyType,questionText:'Existing question',options:[{id:100,optionText:'Existing option'}]}]})}};
      if(name.includes('timedVocabularyService'))return{timedVocabularyService:api};
      const base=path.resolve(path.dirname(file),name);const target=['.ts','.tsx'].map(ext=>base+ext).find(fs.existsSync);
      if(target)return load(target);throw new Error('Unexpected module '+name);
    }
    new Function('require','module','exports',source)(localRequire,mod,mod.exports);return mod.exports;
  }
  const Component = legacyType ? load(path.resolve('src/features/quiz/screens/QuizExamScreen.tsx')).QuizExamScreen
    : load(path.resolve('src/features/quiz/components/TimedVocabularyQuiz.tsx')).TimedVocabularyQuiz;
  let renderer;
  const text=node=> typeof node==='string'?node:node.children?.map(text).join('')||'';
  const button=label=>renderer.root.findAllByType('TouchableOpacity').find(b=>text(b)===label);
  return {events,finished,button,fail:()=>{failOnce=true;},
    render:async()=>{await React.act(async()=>{renderer=Renderer.create(React.createElement(Component,{initial,onFinished:()=>{}}));});},
    press:async label=>{await React.act(async()=>{const b=button(label);assert.ok(b,'Missing '+label);assert.ok(!b.props.disabled,'Disabled '+label);await b.props.onPress();});},
    text:()=>text(renderer.root),
    background:async()=>{await React.act(async()=>handlers.get('change')('background'));},
    foreground:async()=>{await React.act(async()=>handlers.get('change')('active'));},
    close:async()=>{await React.act(async()=>renderer.unmount());},
  };
}

test('native meaning: locks continue, shows correction and advances',async()=>{
  const h=harness();await h.render();try{
    assert.ok(h.button('Tiếp tục').props.disabled);await h.press('build');
    assert.match(h.text(),/Đáp án đúng: enjoy/);assert.ok(!h.button('Tiếp tục').props.disabled);
    await h.press('Tiếp tục');assert.equal(h.events.at(-1).action,'NEXT');
  }finally{await h.close();}
});
test('native matching: four pairs lock, completion unlocks next',async()=>{
  const h=harness(true);await h.render();try{
    assert.ok(h.button('Tiếp theo').props.disabled);
    for(const [en,vi] of [['apple','quả táo'],['book','quyển sách'],['cat','con mèo'],['sun','mặt trời']]){
      await h.press(en);await h.press(vi);assert.ok(h.button(en+' ✓').props.disabled);
    }
    assert.ok(!h.button('Tiếp theo').props.disabled);assert.match(h.text(),/Điểm màn: 4/);
  }finally{await h.close();}
});
test('native wrong pair records one error and flashes red',async()=>{
  const h=harness(true);await h.render();try{
    await h.press('apple');await h.press('con mèo');assert.match(h.text(),/Lỗi: 1/);assert.ok(h.button('apple ✕'));
    assert.equal(h.events.filter(e=>e.action==='PAIR').length,1);
  }finally{await h.close();}
});
test('native pause hides all answer cells until resume',async()=>{
  const h=harness();await h.render();try{
    await h.press('||');assert.match(h.text(),/Đã tạm dừng/);assert.equal(h.button('enjoy'),undefined);
    const count=h.events.length;await React.act(async()=>new Promise(r=>setTimeout(r,250)));assert.equal(h.events.length,count);
    await h.press('Tiếp tục');
  }finally{await h.close();}
});
test('native timeout reveals answer and unlocks continue',async()=>{
  const h=harness(false,1);await h.render();try{
    await React.act(async()=>new Promise(r=>setTimeout(r,1250)));
    assert.match(h.text(),/Hết giờ/);assert.ok(!h.button('Tiếp tục').props.disabled);
  }finally{await h.close();}
});
test('native lost response retries with same id, no duplicate incorrect pair',async()=>{
  const h=harness(true);await h.render();try{
    h.fail();await h.press('apple');await h.press('con mèo');assert.match(h.text(),/Chưa nhận/);
    await h.press('Thử lại');assert.equal(h.events[0].requestId,h.events[1].requestId);assert.match(h.text(),/Lỗi: 1/);
  }finally{await h.close();}
});
test('native background conceals content and foreground synchronizes server',async()=>{
  const h=harness();await h.render();try{
    await h.background();assert.equal(h.button('enjoy'),undefined);
    await h.foreground();assert.equal(h.events.at(-1).action,'SYNC');assert.ok(h.button('enjoy'));
  }finally{await h.close();}
});
test('native exit confirms then submits through existing quiz submit adapter',async()=>{
  const h=harness();await h.render();try{
    await h.press('X');assert.match(h.text(),/Thoát bài thi/);assert.equal(h.finished.length,0);
    await h.press('Thoát');assert.equal(h.finished[0].abandoned,true);assert.deepEqual(h.finished[0].answers,[]);
  }finally{await h.close();}
});
for (const type of ['MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK']) test(`legacy native ${type} retains its existing selection UI`,async()=>{
  const h=harness(false,20,type);await h.render();try{
    assert.ok(h.button('AExisting option'));await h.press('AExisting option');
    assert.match(h.text(),/Existing question/);assert.equal(h.events.length,0);
  }finally{await h.close();}
});
