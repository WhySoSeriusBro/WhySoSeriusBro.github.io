// @ts-nocheck
/**
 * Workbench layout and illustrated screen mocks, ported from reference/prototype.html
 * (buildBench() and the scrXxx() functions). The coordinates are the layout source of
 * truth (SPEC §7). This module builds static HTML strings at build time; the mocks are
 * the fallback when a real screenshot is missing (docs/SCREENSHOTS.md).
 */
import { escapeHtml } from './html';

let tt = (en, pt) => en;
let shots = {};
let names = {};
let parts = [];
let groups = {};
let bboxes = {};

function rgb(hex){const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]}
function shade(hex,f,a=1){return `rgba(${rgb(hex).map(v=>Math.round(v*f)).join(',')},${a})`}

function box({key,x,y,w,d,h,col,top='',south='',radius=0,glow='',z=0,alpha=1,shadow=true}){
  let inner='';
  if(shadow&&z<6)inner+=`<div class="shadow" style="border-radius:${radius}px;${glow}"></div>`;
  const Z=z?`translateZ(${z}px) `:'';
  const f=(css,html='',cls='face')=>`<div class="${cls}" style="${css}">${html}</div>`;
  inner+=f(`left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;transform:${Z}rotateX(90deg);background:${shade(col,.55,alpha)}`);
  inner+=f(`left:0;top:0;width:${h}px;height:${d}px;transform-origin:0 0;transform:${Z}rotateY(-90deg);background:${shade(col,.6,alpha)}`);
  inner+=f(`left:${w}px;top:0;width:${h}px;height:${d}px;transform-origin:0 0;transform:${Z}rotateY(-90deg);background:${shade(col,.72,alpha)}`);
  inner+=f(`left:0;top:${d-h}px;width:${w}px;height:${h}px;transform-origin:0 100%;transform:${Z}rotateX(-90deg);background:${shade(col,.82,alpha)};overflow:hidden`,south);
  inner+=f(`transform:translateZ(${h+z}px);background:${shade(col,1,alpha)};border-radius:${radius}px`,top,'face top');
  parts.push(`<div class="obj" data-key="${key}" style="left:${x}px;top:${y}px;width:${w}px;height:${d}px">${inner}</div>`);
  (groups[key]=groups[key]||0, groups[key]++);
  const b=bboxes[key]||(bboxes[key]={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9});
  b.x0=Math.min(b.x0,x);b.y0=Math.min(b.y0,y);b.x1=Math.max(b.x1,x+w);b.y1=Math.max(b.y1,y+d);
}
function label(key,x,y){parts.push(`<div class="label" data-key="${key}" style="left:${x}px;top:${y}px">${escapeHtml(names[key])}</div>`)}
/** Light spill on the mat in front of a large lit screen (dominant colour at 15%). */
function spill(key,x,y,w,id){const s=shots[id];if(!s||!s.dominant)return;parts.push(`<div class="spill" data-key="${key}" style="left:${x}px;top:${y}px;width:${w}px;background:${s.dominant}"></div>`)}

/* devices */
const scr=(html,css='')=>`<div class="scr" style="${css}">${html}</div>`;
function phone(key,x,y,w,d,screen,col='#16191d'){box({key,x,y,w,d,h:9,col,radius:14,top:scr(screen,'inset:6px;border-radius:10px')})}
function tablet(key,x,y,w,d,screen,col='#2a2e33'){box({key,x,y,w,d,h:8,col,radius:12,top:scr(screen,'inset:9px;border-radius:5px')})}
function laptop(key,x,y,w,d,screen){
  box({key,x,y,w,d,h:8,col:'#c3c8cd',radius:4,top:`<div style="position:absolute;left:14px;right:14px;top:12px;height:${Math.round(d*.52)}px;background:repeating-linear-gradient(90deg,#9ea4ab 0 15px,#b4b9bf 15px 17px),#9ea4ab;opacity:.9;border-radius:2px"></div><div style="position:absolute;left:50%;margin-left:-${Math.round(w*.18)}px;bottom:12px;width:${Math.round(w*.36)}px;height:${Math.round(d*.26)}px;background:#b3b8be;border-radius:3px"></div>`});
  box({key,x,y:y-12,w,d:12,h:Math.round(d*.95),col:'#aeb3b9',south:scr(screen,'inset:7px 7px 10px;border-radius:2px'),shadow:false});
}
function monitor(key,x,y,w,h,screen){
  box({key,x:x+w/2-70,y:y+6,w:140,d:56,h:6,col:'#2b2f35',radius:6});
  box({key,x:x+w/2-11,y:y+12,w:22,d:12,h:30,z:6,col:'#2b2f35',shadow:false});
  box({key,x,y,w,d:16,h,z:36,col:'#1d2025',south:scr(screen,'inset:6px 6px 9px;border-radius:2px'),shadow:false});
}

/** Real screenshot when the pipeline produced one for this id, else the illustrated mock. */
function shot(id, mock){
  const s=shots[id];
  if(!s)return mock;
  const glass=s.device==='eink-800x480'||s.device==='paper-a4'||s.device==='print-card'?'':'<span class="glass"></span>';
  return `<img src="${s.src}" srcset="${s.src} 1x, ${s.src2x} 2x" width="${s.width}" height="${s.height}" alt="" loading="lazy" decoding="async">${glass}`;
}
function trmnlScreen(){return shots['trmnl-weather']?scr(shot('trmnl-weather',''),'inset:9px'):scrTrmnl()}
function qrCells(){let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;let h='';
  for(let r=0;r<13;r++)for(let c=0;c<13;c++){const fin=(r<3&&c<3)||(r<3&&c>9)||(r>9&&c<3);const mid=r>3&&r<9&&c>3&&c<9;const on=fin?!(r===1&&c%11===1):(!mid&&rnd()>.5);
    h+=`<i style="background:${on?(fin?'#111820':(rnd()>.75?'#2f8a52':'#111820')):'transparent'}"></i>`}
  return h}

/* screens (illustrated mocks) */
function scrLuna(){return `<div style="background:#0c1a26;color:#e6f0f6;height:100%;padding:9px 8px;font:600 7px/1.3 'Bricolage Grotesque'">
  <div style="color:#7fe0a8">BarataEletronics</div><div style="opacity:.55;font-weight:500">192.168.4.1</div>
  <div style="font-size:21px;font-weight:800;margin-top:8px;letter-spacing:-.5px">262<span style="font-size:9px;opacity:.7"> nW</span></div>
  <svg viewBox="0 0 80 34" style="width:100%;height:34px;margin-top:4px;background:#11263a;border-radius:3px"><polyline fill="none" stroke="#FFB45E" stroke-width="1.4" points="0,30 10,30 14,8 22,12 32,15 44,16 56,17 68,17 80,17"/></svg>
  <div style="display:flex;gap:4px;margin-top:6px"><span style="flex:1;text-align:center;background:#19D8E8;color:#082;padding:3px 0;border-radius:3px;color:#081218">${tt('Tare','Tara')}</span><span style="flex:1;text-align:center;background:#1e3448;padding:3px 0;border-radius:3px">CSV</span></div>
  <div style="margin-top:7px;opacity:.7">${tt('Calibration','Calibração')}  R² 0.991</div>
  <svg viewBox="0 0 80 30" style="width:100%;height:30px;margin-top:3px;background:#11263a;border-radius:3px"><line x1="4" y1="27" x2="76" y2="4" stroke="#19D8E8" stroke-width="1"/>${[[10,24],[24,20],[38,15],[52,11],[66,7]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="1.8" fill="#FFB45E"/>`).join('')}</svg></div>`}
function scrTwins(){return `<div style="background:#f3f5f7;color:#1c2630;height:100%;padding:10px 12px;font:600 9px/1.35 'Bricolage Grotesque'">
  <div style="display:flex;justify-content:space-between"><b style="font-size:12px">Dataspace demo</b><span style="color:#2a8a55">${tt('contract agreed','contrato acordado')}</span></div>
  <div style="display:flex;align-items:center;gap:6px;margin-top:8px;font-size:8px">${['ESP32','MQTT','FA³ST','EDC provider','EDC consumer'].map((t,i)=>`<span style="background:${i==4?'#19D8E8':'#dfe5ea'};padding:4px 6px;border-radius:3px">${t}</span>${i<4?'<span style="opacity:.4">→</span>':''}`).join('')}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">
   <div style="background:#fff;padding:7px;border-radius:4px"><div style="opacity:.6">ESP32-C6</div><div style="font-size:18px;font-weight:800">31.2 °C</div></div>
   <div style="background:#fff;padding:7px;border-radius:4px"><div style="opacity:.6">${tt('Press','Prensa')}, ESP8266</div><div style="font-size:18px;font-weight:800">2.1 A</div><div style="opacity:.6">128 ${tt('cycles','ciclos')}</div></div>
   <div style="background:#fff;padding:7px;border-radius:4px"><div style="opacity:.6">${tt('Water','Água')}, ESP32-S2</div><div style="font-size:18px;font-weight:800">3.4 L/min</div></div></div>
  <svg viewBox="0 0 300 40" style="width:100%;height:44px;margin-top:8px;background:#fff;border-radius:4px"><polyline fill="none" stroke="#2a6fdb" stroke-width="1.5" points="${Array.from({length:30},(_,i)=>`${i*10},${22+Math.sin(i/2.3)*9}`).join(' ')}"/></svg>
  <div style="margin-top:6px;opacity:.55;font-size:8px">AAS /api/v3.0, OPC UA :4840, PostgreSQL historian</div></div>`}
function scrTrmnl(){return `<div style="position:absolute;inset:9px;background:#e7e5df;color:#1a1a1a;padding:9px 11px;font:600 9px 'Bricolage Grotesque';filter:grayscale(1)">
  <div style="display:flex;justify-content:space-between"><span>Lisboa</span><span style="opacity:.6">Open-Meteo</span></div>
  <div style="font-weight:800;font-size:44px;line-height:1;margin-top:4px">18°</div>
  <div style="font-weight:500;font-size:9px">${tt('Light rain after 17h','Chuva fraca depois das 17h')}</div>
  <div style="display:flex;align-items:flex-end;gap:5px;height:34px;margin-top:8px">${[14,16,18,19,18,16,15,14].map((t,i)=>`<div style="flex:1;background:#1a1a1a;height:${(t-12)*4}px"></div>`).join('')}</div>
  <div style="display:flex;justify-content:space-between;font-size:7px;margin-top:2px;opacity:.7"><span>12h</span><span>15h</span><span>18h</span><span>21h</span></div></div>`}
function scrP30(){return `<div style="background:#101418;color:#e9eff2;height:100%;padding:8px 10px;font:600 8px 'Bricolage Grotesque';display:grid;grid-template-columns:1fr 1fr;gap:7px">
  ${[[tt('Kitchen','Cozinha'),true,'#FFB45E',80],[tt('Living room','Sala'),false,'#8fb8ff',40]].map(([n,on,c,b])=>`<div style="background:${on?'#1d2a33':'#161c22'};border-radius:6px;padding:7px">
   <div style="display:flex;justify-content:space-between;align-items:center"><span>${n}</span><span style="width:20px;height:11px;border-radius:6px;background:${on?'#19D8E8':'#3a444d'};position:relative"><i style="position:absolute;top:1.5px;${on?'right':'left'}:2px;width:8px;height:8px;border-radius:50%;background:#fff"></i></span></div>
   <div style="opacity:.6;margin-top:4px">Govee H6008</div>
   <div style="height:4px;border-radius:2px;background:#2b353e;margin-top:8px"><div style="width:${b}%;height:100%;border-radius:2px;background:${c}"></div></div>
   <div style="display:flex;gap:4px;margin-top:7px">${['#fff3d6','#FFB45E','#8fb8ff','#d58cff'].map(k=>`<i style="width:11px;height:11px;border-radius:50%;background:${k};outline:${k===c?'1.5px solid #fff':'none'}"></i>`).join('')}</div></div>`).join('')}</div>`}
function scrTigtag(){return `<div style="background:#0f1418;color:#E9EFF2;height:100%;padding:12px 9px;font:600 7.5px/1.4 'Bricolage Grotesque'">
  <div style="font-size:12px;font-weight:800">TigTag</div><div style="opacity:.55;margin-bottom:8px">${tt('Synced from GitHub','Sincronizado do GitHub')}</div>
  ${[[tt('Kitchen light','Luz da cozinha'),'nfc: tag-01','govee.toggle(H6008)',true],[tt('Bus to work','Autocarro para o trabalho'),'nfc: tag-02','maps.route(1612)',false],[tt('TV at 7:45','TV às 7:45'),'at: 07:45','wol + tizen.open()',false]].map(([n,t,a,on])=>`<div style="background:${on?'#13343a':'#182128'};border-radius:5px;padding:6px;margin-bottom:5px">
   <div style="display:flex;justify-content:space-between"><b>${n}</b>${on?'<span style="color:#19D8E8">●</span>':''}</div>
   <div style="font-family:'IBM Plex Mono';font-weight:400;font-size:6.5px;opacity:.7;margin-top:2px">${t}<br>${a}</div></div>`).join('')}</div>`}
function scrPurepolis(){return `<div style="height:100%;position:relative;background:#e9ecef;font:600 7.5px 'Bricolage Grotesque';color:#1b2733">
  <svg viewBox="0 0 96 200" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">
   <rect width="96" height="200" fill="#eef0ea"/><path d="M0 150 C30 140 50 165 96 150 L96 200 L0 200Z" fill="#a9cbe8"/>
   <path d="M-5 40 L101 70 M20 0 L35 200 M70 0 L58 150 M0 110 L96 100" stroke="#fff" stroke-width="4"/>
   <path d="M22 55 L70 48 L78 95 L30 104Z" fill="rgba(93,119,249,.22)" stroke="#5d77f9" stroke-width="1.2"/>
   <circle cx="48" cy="76" r="3.2" fill="#e2513b" stroke="#fff" stroke-width="1"/></svg>
  <div style="position:absolute;left:6px;right:6px;top:8px;background:#fff;border-radius:6px;padding:6px;box-shadow:0 2px 6px rgba(0,0,0,.15)">
   <div style="color:#5d77f9">${tt('Questionnaire available here','Questionário disponível aqui')}</div><div style="font-weight:800;font-size:8.5px;margin-top:2px">Qualidade do ar no seu bairro</div>
   <div style="margin-top:5px;background:#5d77f9;color:#fff;text-align:center;border-radius:4px;padding:3px">${tt('Answer','Responder')}</div></div>
  <div style="position:absolute;left:0;right:0;bottom:0;height:20px;background:#fff;display:flex;justify-content:space-around;align-items:center">${'<i style="width:9px;height:9px;border-radius:2px;background:#c7ced6"></i>'.repeat(5)}</div></div>`}
function scrCir4fun(){const items=[['#8a6a4f',tt('Oak chair','Cadeira de carvalho'),''],['#4f6d8a',tt('Bookshelf','Estante'),tt('Reserved','Reservado')],['#c9b48a',tt('Side table','Mesa de apoio'),''],['#6a8a4f',tt('Floor lamp','Candeeiro de pé'),''],['#8a4f5e',tt('Armchair','Poltrona'),''],['#9aa0a6',tt('Bicycle','Bicicleta'),'']];
  return `<div style="background:#fff;height:100%;padding:8px 10px;font:600 8px 'Bricolage Grotesque';color:#1d2b24">
  <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:11px;color:#2f7a4f">Showcase</b><span style="opacity:.6">PT | EN</span></div>
  <div style="opacity:.6;margin:2px 0 6px">${tt('Collected items waiting for a new home, Guimarães','Objetos recolhidos à espera de nova casa, Guimarães')}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${items.map(([c,n,b])=>`<div style="border:1px solid #e3e7e4;border-radius:4px;overflow:hidden"><div style="height:30px;background:linear-gradient(135deg,${c},${c}cc);position:relative">${b?`<span style="position:absolute;top:3px;left:3px;background:#fff;padding:1px 3px;border-radius:2px;font-size:6px">${b}</span>`:''}</div><div style="padding:3px 4px;font-size:7px">${n}</div></div>`).join('')}</div>
  <div style="margin-top:6px;font-size:6px;opacity:.55">Funded by the European Union, GA 101182081</div></div>`}
function scrPlanner(){const cols=[[tt('To do','Por fazer'),[['#5d77f9',tt('Order Reachy Mini','Encomendar Reachy Mini')],['#e2513b',tt('Lab room layout','Layout da sala')],['#2f9e6b',tt('Workshop slides','Slides do workshop')]]],[tt('In progress','Em curso'),[['#FFB45E',tt('Badge firmware','Firmware dos badges')],['#5d77f9',tt('Monthly summary','Resumo mensal')]]],[tt('Done','Concluído'),[['#2f9e6b',tt('Push notifications','Notificações push')],['#9aa0a6',tt('Recurring tasks','Tarefas recorrentes')],['#e2513b',tt('File attachments','Anexos')]]]];
  return `<div style="background:#f4f6f8;height:100%;padding:9px 11px;font:600 8.5px 'Bricolage Grotesque';color:#1c2630">
  <div style="display:flex;justify-content:space-between"><b style="font-size:12px">Planner</b><span style="opacity:.6">AI X Lab</span></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:8px">${cols.map(([h,cs])=>`<div><div style="opacity:.6;margin-bottom:5px">${h}</div>${cs.map(([c,t])=>`<div style="background:#fff;border-radius:4px;padding:6px;margin-bottom:5px;border-top:3px solid ${c}">${t}<div style="display:flex;justify-content:space-between;margin-top:5px"><i style="width:10px;height:10px;border-radius:50%;background:#c7ced6"></i><span style="opacity:.5;font-size:7px">2/4</span></div></div>`).join('')}</div>`).join('')}</div></div>`}
function scrGerador(){const ev=[['18 NOV',tt('DEEC seminar','Seminário DEEC')],['19 NOV',tt('PhD defence','Defesa de doutoramento')],['20 NOV',tt('Careers fair','Feira de emprego')],['21 NOV',tt('Open lab session','Sessão de laboratório aberto')]];
  return `<div style="background:#fff;height:100%;padding:9px 11px;font:600 8.5px 'Bricolage Grotesque';color:#1c2630">
  <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:11px">NOVA FCT ${tt('Institutional Generator','Gerador Institucional')}</b><span style="background:#1f5fa8;color:#fff;padding:3px 7px;border-radius:3px">${tt('Generate Word','Gerar Word')}</span></div>
  <div style="opacity:.6;margin:4px 0 6px">${tt('Agenda extracted, 4 events this week','Agenda extraída, 4 eventos esta semana')}</div>
  ${ev.map(([d,t])=>`<div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid #eef1f4"><span style="font-family:'IBM Plex Mono';font-size:7px;color:#1f5fa8;width:40px">${d}</span><span style="flex:1">${t}</span><i style="width:10px;height:10px;border-radius:2px;background:#2f9e6b"></i></div>`).join('')}</div>`}
function scrHome(){const rows=[['T1','Carcavelos','900 €','Idealista','6 min'],['T0','Parede','750 €','OLX','—'],['T1','Oeiras','950 €','Imovirtual','11 min'],['T1','Cascais','980 €','ERA','4 min'],['T0','Algés','820 €','Casa Sapo','—']];
  return `<div style="background:#f7f8fa;height:100%;padding:8px 10px;font:600 8px 'Bricolage Grotesque';color:#1c2630">
  <div style="display:flex;justify-content:space-between"><b style="font-size:11px">HomeHunter</b><span style="opacity:.6">${tt('8 portals','8 portais')}</span></div>
  <div style="display:flex;gap:4px;margin:5px 0">${['T0, T1',tt('≤ 1000 €','≤ 1000 €'),tt('Cascais line','Linha de Cascais')].map(f=>`<span style="background:#e6ebf0;padding:2px 5px;border-radius:3px">${f}</span>`).join('')}</div>
  ${rows.map(r=>`<div style="display:grid;grid-template-columns:18px 1fr 36px 44px 30px;gap:4px;padding:4px 0;border-bottom:1px solid #e9edf1"><b>${r[0]}</b><span>${r[1]}</span><span>${r[2]}</span><span style="opacity:.6">${r[3]}</span><span style="opacity:${r[4]==='—'?.35:.8}">${r[4]}</span></div>`).join('')}
  <div style="margin-top:5px;opacity:.55;font-size:7px">${tt('Walking time: real route, or empty if no address','Tempo a pé: rota real, ou vazio sem morada')}</div></div>`}
function scrNutri(){return `<div style="background:#fbfaf6;height:100%;padding:10px 11px;font:600 8.5px 'Bricolage Grotesque';color:#24301f">
  <b style="font-size:13px;color:#4f7a2f">LusoNutri</b>
  <div style="display:flex;gap:10px;align-items:center;margin-top:8px">
   <svg viewBox="0 0 40 40" width="46" height="46"><circle cx="20" cy="20" r="15" fill="none" stroke="#e8e4d8" stroke-width="6"/><circle cx="20" cy="20" r="15" fill="none" stroke="#4f7a2f" stroke-width="6" stroke-dasharray="66 94" transform="rotate(-90 20 20)"/></svg>
   <div><div style="font-size:14px;font-weight:800">1 420 kcal</div><div style="opacity:.6">${tt('of 2 000 today','de 2 000 hoje')}</div></div></div>
  ${[[tt('Breakfast','Pequeno-almoço'),'420'],[tt('Lunch','Almoço'),'680'],[tt('Snack','Lanche'),'320']].map(([m,k])=>`<div style="display:flex;justify-content:space-between;background:#fff;border-radius:5px;padding:6px 7px;margin-top:6px"><span>${m}</span><span style="opacity:.6">${k} kcal</span></div>`).join('')}</div>`}
function scrExpo(){return `<div style="background:#dfeaf2;height:100%;position:relative;font:600 8px 'Bricolage Grotesque';color:#17222c">
  <svg viewBox="0 0 220 150" style="position:absolute;inset:0;width:100%;height:100%">
   <path d="M0 110 L220 70 L220 150 L0 150Z" fill="#cfe0c4"/>
   ${[[40,60,'#f3f1ec'],[90,48,'#f3f1ec'],[140,40,'#5d77f9'],[70,90,'#f3f1ec'],[120,80,'#f3f1ec'],[170,70,'#f3f1ec']].map(([x,y,c])=>`<g><path d="M${x} ${y} l18 -8 l18 8 l-18 8z" fill="${c}"/><path d="M${x} ${y} l18 8 v14 l-18 -8z" fill="${c==='#5d77f9'?'#4459c4':'#cfd3d8'}"/><path d="M${x+36} ${y} l-18 8 v14 l18 -8z" fill="${c==='#5d77f9'?'#3a4ca8':'#b8bdc4'}"/></g>`).join('')}
   <circle cx="158" cy="30" r="4" fill="#e2513b" stroke="#fff"/></svg>
  <div style="position:absolute;left:7px;top:7px;background:#fff;border-radius:4px;padding:4px 6px">${tt('Electrical Eng.','Eng. Eletrotécnica')}</div>
  <div style="position:absolute;right:7px;bottom:7px;background:#17222c;color:#fff;border-radius:4px;padding:4px 6px">${tt('Stamps','Selos')} 3/8</div></div>`}


/**
 * Build the mat contents for one language.
 * @param lang 'en' | 'pt'
 * @param projectNames id -> localised name
 * @param screenshots id -> { src, src2x, width, height, device, dominant }
 */
export function buildBench(lang, projectNames, screenshots){
  tt=(en,pt)=>lang==='pt'?pt:en; names=projectNames; shots=screenshots; parts=[]; groups={}; bboxes={};
  /* LUNA: laser on its sleeve, optics module with cuvette, electronics module opened, power bank, phone with the ESP32 dashboard */
  box({key:'luna',x:176,y:452,w:38,d:112,h:30,col:'#1b1b1e'});
  box({key:'luna',x:184,y:438,w:22,d:124,h:20,z:30,col:'#8d939b',radius:2,shadow:false,top:`<div style="position:absolute;left:4px;right:4px;top:18px;height:10px;background:#5b6068"></div><div style="position:absolute;left:7px;bottom:2px;width:8px;height:5px;border-radius:50%;background:#7fb8ff;box-shadow:0 0 8px #3d8bff"></div>`});
  box({key:'luna',x:120,y:560,w:150,d:130,h:95,col:'#1b1b1e',radius:3,top:`<div style="position:absolute;inset:7px;background:#0b0b0c;border-radius:2px">
    <div style="position:absolute;left:64px;top:-7px;width:5px;height:53px;background:#5aa2ff;box-shadow:0 0 6px #3d8bff,0 0 14px #3d8bff"></div>
    <div style="position:absolute;left:44px;top:34px;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle,rgba(184,255,90,.55),transparent 70%)"></div>
    <div style="position:absolute;right:-3px;top:46px;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle,#2b2b40 40%,#b7bcc2 44%,#8d939b 70%)"></div>
    <div style="position:absolute;right:3px;top:70px;font:500 7px 'IBM Plex Mono';color:#8d939b">BPW21</div></div>`});
  box({key:'luna',x:183,y:612,w:24,d:24,h:52,z:70,col:'#c8ff70',alpha:.5,shadow:false,top:`<div style="position:absolute;inset:3px;background:rgba(220,255,140,.9);box-shadow:0 0 10px #b8ff5a"></div>`});
  box({key:'luna',x:270,y:560,w:256,d:130,h:95,col:'#1b1b1e',radius:3,top:`<div style="position:absolute;inset:7px;background:#0b0b0c;border-radius:2px">
    <div style="position:absolute;left:8px;top:8px;right:8px;bottom:8px;background:#f1efe9;border-radius:3px;background-image:radial-gradient(#c9c6bd 1px,transparent 1.2px);background-size:6px 6px"></div>
    <div style="position:absolute;left:16px;top:30px;width:118px;height:52px;background:#16181b;border-radius:2px"><div style="position:absolute;left:44px;top:8px;width:40px;height:34px;background:linear-gradient(135deg,#d7dbe0,#9aa1a9);border-radius:1px"></div><div style="position:absolute;left:-4px;top:20px;width:9px;height:12px;background:#9aa1a9"></div><div style="position:absolute;right:6px;top:4px;font:500 6px 'IBM Plex Mono';color:#9aa1a9;writing-mode:vertical-rl">ESP32-WROOM-32E</div></div>
    <div style="position:absolute;left:146px;top:22px;width:40px;height:32px;background:#1f4fb5;border-radius:2px"><div style="position:absolute;left:12px;top:9px;width:14px;height:14px;background:#111"></div><div style="position:absolute;left:3px;bottom:2px;right:3px;height:3px;background:repeating-linear-gradient(90deg,#d9b44a 0 3px,transparent 3px 5px)"></div></div>
    <div style="position:absolute;left:198px;top:30px;width:14px;height:22px;background:#151515;border-radius:1px"><i style="position:absolute;left:4px;top:2px;width:3px;height:3px;border-radius:50%;background:#555"></i></div>
    ${[[150,66],[166,66],[182,66]].map(([a,b])=>`<div style="position:absolute;left:${a}px;top:${b}px;width:13px;height:5px;background:repeating-linear-gradient(90deg,#d8c6a0 0 2px,#a0522d 2px 3px,#d8c6a0 3px 5px,#222 5px 6px,#d8c6a0 6px 13px);border-radius:2px"></div>`).join('')}
    <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 242 116"><path d="M134 54 C140 60 142 40 154 40" stroke="#e2513b" stroke-width="1.6" fill="none"/><path d="M134 62 C150 70 160 58 166 42" stroke="#2a6fdb" stroke-width="1.6" fill="none"/><path d="M186 40 C194 40 196 44 204 42" stroke="#2f9e6b" stroke-width="1.6" fill="none"/><path d="M212 44 C224 40 230 56 236 58" stroke="#FFB45E" stroke-width="1.6" fill="none"/></svg></div>`});
  box({key:'luna',x:290,y:735,w:92,d:150,h:22,col:'#3a3f46',radius:6,top:`<div style="position:absolute;left:10px;top:12px;display:flex;gap:4px">${'<i style="width:5px;height:5px;border-radius:50%;background:#19D8E8"></i>'.repeat(3)}</div><div style="position:absolute;left:10px;bottom:12px;font:500 8px 'IBM Plex Mono';color:#aab4bd">USB 5 V</div>`});
  phone('luna',420,730,104,205,shot('luna-dashboard',scrLuna()));
  label('luna',122,705);
  /* Digital twins: monitor with the dataspace dashboard + three dev boards */
  spill('twins',70,76,420,'twins-dashboard');
  monitor('twins',70,60,420,205,shot('twins-dashboard',scrTwins()));
  const board=(x,y,w,d,name,mod)=>box({key:'twins',x,y,w,d,h:9,col:'#17191c',top:`<div style="position:absolute;left:8px;top:${d/2-15}px;width:36px;height:30px;background:linear-gradient(135deg,#d7dbe0,#98a0a8)"></div><div style="position:absolute;left:4px;right:4px;top:3px;height:4px;background:repeating-linear-gradient(90deg,#d9b44a 0 3px,transparent 3px 6px)"></div><div style="position:absolute;left:4px;right:4px;bottom:3px;height:4px;background:repeating-linear-gradient(90deg,#d9b44a 0 3px,transparent 3px 6px)"></div><div style="position:absolute;left:52px;top:${d/2-8}px;font:500 8px 'IBM Plex Mono';color:#c9ced3;line-height:1.2">${name}<br><span style="opacity:.6">${mod}</span></div><div style="position:absolute;right:-3px;top:${d/2-6}px;width:9px;height:12px;background:#9aa1a9"></div>`});
  board(70,312,140,56,'ESP32-C6','DevKitC-1');
  board(228,308,128,60,'ESP8266',tt('press','prensa'));
  board(374,310,140,58,'ESP32-S2',tt('water','água'));
  label('twins',290,382);
  /* Gesture lights: Raspberry Pi 5, camera module on a stand, Govee bulb */
  box({key:'gestures',x:560,y:250,w:170,d:115,h:16,col:'#1e7a4c',top:`<div style="position:absolute;left:14px;top:20px;width:58px;height:58px;border-radius:50%;background:radial-gradient(circle,#1a1a1a 25%,#2c2c2c 26% 60%,#1a1a1a 61%);box-shadow:0 0 0 4px #0f0f0f"></div><div style="position:absolute;left:8px;top:5px;width:130px;height:7px;background:repeating-linear-gradient(90deg,#d9b44a 0 3px,#222 3px 6px)"></div><div style="position:absolute;right:0;top:16px;width:30px;height:24px;background:#c7ccd1"></div><div style="position:absolute;right:0;top:46px;width:30px;height:24px;background:#3d6fd6"></div><div style="position:absolute;right:0;top:76px;width:30px;height:26px;background:#c7ccd1"></div><div style="position:absolute;left:86px;top:66px;font:500 7px 'IBM Plex Mono';color:#cfe8da">Raspberry Pi 5</div>`});
  box({key:'gestures',x:728,y:286,w:34,d:14,h:2,col:'#d6c27a',shadow:false});
  box({key:'gestures',x:760,y:240,w:44,d:44,h:78,col:'#22262b',south:`<div style="position:absolute;left:50%;top:10px;margin-left:-10px;width:20px;height:20px;border-radius:50%;background:radial-gradient(circle,#4a6a8a 20%,#0b0b0b 30% 70%,#2b2f35 72%)"></div>`,top:`<div style="position:absolute;inset:6px;background:#1e7a4c"></div>`});
  box({key:'gestures',x:832,y:226,w:74,d:74,h:104,col:'#e8e6e1',radius:37,glow:'background:rgba(255,180,94,.6);filter:blur(34px);inset:-40px',top:`<div style="position:absolute;inset:4px;border-radius:50%;background:radial-gradient(circle,#fff8e6,#ffd59a 55%,#f2b467)"></div>`});
  label('gestures',562,382);
  /* TRMNL */
  box({key:'trmnl',x:560,y:70,w:240,d:26,h:160,col:'#e3e0d9',south:trmnlScreen()});
  label('trmnl',562,112);
  /* P30 Pro on a stand */
  box({key:'p30',x:990,y:330,w:140,d:56,h:10,col:'#2b2f35',radius:6});
  box({key:'p30',x:950,y:332,w:220,d:12,h:106,z:10,col:'#1a1d22',shadow:false,south:scr(shot('p30-lights',scrP30()),'inset:6px 9px;border-radius:6px')});
  label('p30',952,402);
  /* Planner on the big monitor */
  spill('planner',930,56,440,'planner-board');
  monitor('planner',930,40,440,225,shot('planner-board',scrPlanner()));
  label('planner',932,120);
  /* Institutional generator: monitor + the printed Word newsletter */
  spill('gerador',1420,66,340,'gerador-agenda');
  monitor('gerador',1420,50,340,200,shot('gerador-agenda',scrGerador()));
  box({key:'gerador',x:1632,y:130,w:128,d:180,h:2,col:'#fbfbf8',top:shots['gerador-word']?scr(shot('gerador-word',''),'inset:0'):`<div style="padding:14px 12px;font:600 8px 'Bricolage Grotesque';color:#1f5fa8"><div style="font-weight:800;font-size:12px">${tt('Agenda','Agenda')}</div><div style="color:#555;margin-top:2px">NOVA FCT</div>${'<div style="height:4px;background:#d9dde2;margin-top:8px"></div><div style="height:4px;width:70%;background:#e6e9ec;margin-top:4px"></div>'.repeat(5)}</div>`});
  label('gerador',1500,334);
  /* cir4fun-reuse showcase on a laptop */
  spill('cir4fun',1180,555,280,'cir4fun-showcase');
  laptop('cir4fun',1180,380,280,175,shot('cir4fun-showcase',scrCir4fun()));
  label('cir4fun',1356,594);
  /* EXPO FCT tablet */
  tablet('expo',1500,400,240,170,shot('expo-map',scrExpo()));
  label('expo',1548,585);
  /* TigTag: phone + two NFC tags */
  phone('tigtag',620,600,104,205,shot('tigtag-macros',scrTigtag()));
  [[750,615],[750,700]].forEach(([x,y],i)=>box({key:'tigtag',x,y,w:64,d:64,h:2,col:'#f4f3ef',radius:32,top:`<svg viewBox="0 0 64 64" width="64" height="64"><path d="M24 22c5 5 5 15 0 20M31 17c8 8 8 22 0 30M38 12c11 11 11 29 0 40" stroke="#1f3d36" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="32" y="58" font-size="6" text-anchor="middle" font-family="IBM Plex Mono" fill="#666">tag-0${i+1}</text></svg>`}));
  label('tigtag',622,820);
  /* Árvore QR card with voxel tree */
  box({key:'arvore',x:850,y:640,w:140,d:140,h:3,col:'#f4f1e8',top:shots['arvore-qr']?scr(shot('arvore-qr',''),'inset:12px'):`<div class="qr" style="position:absolute;inset:12px;display:grid;grid-template-columns:repeat(13,1fr)">${qrCells()}</div><svg viewBox="0 0 40 40" style="position:absolute;left:46px;top:42px;width:48px;height:48px"><path d="M20 4l10 5-10 5-10-5z" fill="#5fb35f"/><path d="M10 9l10 5v10l-10-5z" fill="#3f8a3f"/><path d="M30 9l-10 5v10l10-5z" fill="#2f6f2f"/><path d="M18 24h4v10h-4z" fill="#7a5230"/></svg>`});
  label('arvore',852,795);
  /* HomeHunter on a laptop */
  spill('homehunter',1020,815,280,'homehunter-list');
  laptop('homehunter',1020,640,280,175,shot('homehunter-list',scrHome()));
  label('homehunter',1022,830);
  /* PUREPOLIS PWA on a phone */
  phone('purepolis',1340,640,108,215,shot('purepolis-citizen',scrPurepolis()));
  label('purepolis',1342,872);
  /* LusoNutri tablet */
  tablet('lusonutri',1490,640,200,260,shot('lusonutri-home',scrNutri()),'#e9e6df');
  label('lusonutri',1492,915);
  return { html: parts.join(''), bboxes };
}
