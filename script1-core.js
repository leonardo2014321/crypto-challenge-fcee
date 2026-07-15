/* ================= ESTADO ================= */
const CAPITAL = 100000;
let S = {
  screen:0, name:'', role:'', xp:0,
  acad:[false,false,false,false],
  m:[false,false,false,false,false],
  q1:[], q1ok:false, q2ok:false, q3ok:false, newsSel:-1,
  picks:[], just:{},
  alloc:{}, reserve:15, risk:'', trust:'', trustWhy:'', stopG:0,
  buys:{},
  day:0, plHist:[CAPITAL], log:[],
  kiosk:[false,false,false], kioskAmt:'', kioskDoc:'',
  answers:{}, reflex:'', bonus:''
};

/* ================= MERCADO ================= */
/* Precios base tomados de datos reales de CoinMarketCap (julio 2026) */
const COINS = [
 {sym:'BTC', name:'Bitcoin',   p:63400,  c24:1.3,  c7:3.4,  cap:1270e9, vol:1, col:'#F7931A', about:'La primera criptomoneda; el "oro digital" del mercado.'},
 {sym:'ETH', name:'Ethereum',  p:1790,   c24:0.8,  c7:2.1,  cap:216e9,  vol:2, col:'#8A92B2', about:'Red de contratos inteligentes; base de las finanzas descentralizadas.'},
 {sym:'USDT',name:'Tether',    p:1.00,   c24:0.0,  c7:0.0,  cap:184e9,  vol:0, col:'#26A17B', about:'Moneda estable anclada al dólar: mínima volatilidad, tu refugio.'},
 {sym:'BNB', name:'BNB',       p:570,    c24:0.3,  c7:1.5,  cap:76.8e9, vol:2, col:'#F0B90B', about:'Token del ecosistema del mayor exchange del mundo.'},
 {sym:'XRP', name:'XRP',       p:1.07,   c24:-0.8, c7:2.9,  cap:66.7e9, vol:2, col:'#00AAE4', about:'Enfocada en pagos y transferencias internacionales rápidas.'},
 {sym:'SOL', name:'Solana',    p:75.1,   c24:-1.4, c7:5.0,  cap:43.7e9, vol:2, col:'#9945FF', about:'Blockchain de alta velocidad con creciente interés institucional.'},
 {sym:'DOGE',name:'Dogecoin',  p:0.0721, c24:1.3,  c7:-2.5, cap:10.8e9, vol:3, col:'#C2A633', about:'Nació como meme; extremadamente sensible al ánimo del mercado.'},
 {sym:'ZEC', name:'Zcash',     p:506,    c24:1.4,  c7:12.4, cap:8.3e9,  vol:3, col:'#F4B728', about:'Enfocada en privacidad; protagonista de fuertes subidas recientes.'},
 {sym:'ADA', name:'Cardano',   p:0.159,  c24:1.1,  c7:-0.8, cap:5.7e9,  vol:2, col:'#0033AD', about:'Plataforma académica de contratos inteligentes.'},
 {sym:'LINK',name:'Chainlink', p:7.93,   c24:0.6,  c7:1.8,  cap:5.2e9,  vol:2, col:'#2A5ADA', about:'Conecta blockchains con datos del mundo real (oráculos).'}
];
COINS.forEach(c=>{c.p0=c.p; c.hist=Array.from({length:30},()=>c.p*(1+(Math.random()-.5)*.008*(c.vol||0.3)));c.hist.push(c.p);});

const VOLTXT = ['Estable','Baja','Media','Muy alta'];
const VOLCLS = ['v1','v1','v2','v3'];
const gauss = ()=> (Math.random()+Math.random()+Math.random()-1.5)/1.5;

function fmt(n,dec){ if(dec===undefined) dec = n>=1000?0:(n>=1?2:4);
  return n.toLocaleString('es-BO',{minimumFractionDigits:dec,maximumFractionDigits:dec}); }
function fmtUsd(n){ return '$ '+fmt(n,2); }
function fmtCap(n){ return n>=1e12 ? '$ '+(n/1e12).toFixed(2)+' B (billones)' : '$ '+(n/1e9).toFixed(1)+' MM'; }

function tickMarket(){
  COINS.forEach(c=>{
    const drift = c.c7/700, v = [0.0004,0.0035,0.007,0.016][c.vol];
    const old = c.p;
    c.p = Math.max(c.p*(1+drift+gauss()*v), c.p0*0.4);
    c.hist.push(c.p); if(c.hist.length>40)c.hist.shift();
    c.last = c.p>=old?1:-1;
    c.c24 = c.c24 + gauss()*0.12*(c.vol||0.2);
  });
  renderMarket(); renderTicker();
}

function sparkline(c){
  const h=c.hist, min=Math.min(...h), max=Math.max(...h), rg=(max-min)||1;
  const pts=h.map((v,i)=>`${(i/(h.length-1))*90},${24-((v-min)/rg)*20+1}`).join(' ');
  const up = h[h.length-1]>=h[0];
  return `<svg class="spark" viewBox="0 0 90 26"><polyline points="${pts}" fill="none" stroke="${up?'#2BD98F':'#FF5A6E'}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}

function renderMarket(){
  const tb=document.getElementById('mktBody'); if(!tb)return;
  tb.innerHTML = COINS.map(c=>`
   <tr>
    <td><div class="coinname"><div class="ic" style="background:${c.col}22;color:${c.col};border:1px solid ${c.col}55">${c.sym.slice(0,3)}</div>
      <div><b>${c.name}</b><small>${c.sym} · ${c.about}</small></div></div></td>
    <td class="${c.last>0?'flash-up':'flash-down'}">${fmt(c.p)}</td>
    <td class="${c.c24>=0?'up':'down'}">${c.c24>=0?'▲':'▼'} ${Math.abs(c.c24).toFixed(2)}%</td>
    <td class="${c.c7>=0?'up':'down'}">${c.c7>=0?'▲':'▼'} ${Math.abs(c.c7).toFixed(1)}%</td>
    <td>${fmtCap(c.cap)}</td>
    <td style="text-align:right"><span class="volb ${VOLCLS[c.vol]}">${VOLTXT[c.vol]}</span></td>
    <td>${sparkline(c)}</td>
   </tr>`).join('');
}

function renderTicker(){
  const t=document.getElementById('ticker');
  t.innerHTML = COINS.map(c=>{
    const up=c.c24>=0;
    return `<span class="tk-item"><span class="tk-sym" style="background:${c.col}22;color:${c.col};border:1px solid ${c.col}55">${c.sym}</span> <span class="tk-price">${fmt(c.p)}</span> <span class="tk-badge ${up?'tk-badge-up':'tk-badge-down'}">${up?'▲':'▼'}${Math.abs(c.c24).toFixed(2)}%</span></span>`;
  }).join('') + `<span class="tk-brand" style="color:var(--gold)">● CRYPTO CHALLENGE FCEE · CAPITAL VIRTUAL USD 100 000 ●</span>`;
}
setInterval(tickMarket, 3000);
/* Autoguardado de respaldo cada 20 s + al cerrar la pestaña */
setInterval(()=>{ if(hasProgress()) save(); }, 20000);
window.addEventListener('beforeunload', ()=>{ try{ if(!window.__resetting && hasProgress()) localStorage.setItem('ccfcee_amigable_v4', JSON.stringify(S)); }catch(e){} });

/* ================= NOTICIAS ================= */
const NEWS = [
 {t:'pos', h:'Fondos institucionales aumentan posiciones en Bitcoin vía ETF', s:'Los flujos hacia ETF al contado marcan su mejor semana del trimestre, reforzando la demanda de BTC.', why:'💭 Cómo leerla: más demanda institucional suele sostener el precio de BTC — un punto a favor de los activos de gran capitalización.'},
 {t:'pos', h:'Grandes tesorerías corporativas comienzan a acumular Solana', s:'Empresas listadas en bolsa replican con SOL la estrategia de reservas que popularizó Bitcoin.', why:'💭 Cómo leerla: la adopción corporativa da respaldo a SOL, pero recuerda que sigue siendo más volátil que BTC.'},
 {t:'neu', h:'La Reserva Federal de EE. UU. insinúa recortes de tasas para fin de año', s:'Tasas más bajas suelen empujar capital hacia activos de riesgo como las criptomonedas.', why:'💭 Cómo leerla: si baja el "premio" por ahorrar en bancos, más inversionistas buscan rendimiento en cripto. Suele favorecer a todo el mercado.'},
 {t:'neg', h:'Un exchange mediano suspende retiros por fallas de seguridad', s:'El incidente reaviva el debate sobre la custodia de fondos y golpea el sentimiento de corto plazo.', why:'💭 Cómo leerla: las malas noticias de seguridad asustan al mercado entero por unos días — argumento para mantener reserva y stop-loss.'},
 {t:'neu', h:'Nueva regulación de monedas estables entra en vigor en Europa', s:'Mayor claridad regulatoria para stablecoins como USDT: menos incertidumbre, más supervisión.', why:'💭 Cómo leerla: reglas claras reducen el riesgo de sorpresas regulatorias — refuerza el rol de USDT como refugio.'},
 {t:'neg', h:'Analistas advierten sobre volatilidad extrema en monedas meme', s:'Tokens como DOGE registran oscilaciones diarias de dos dígitos sin fundamentos que las respalden.', why:'💭 Cómo leerla: si vas a incluir DOGE, que sea con un porcentaje pequeño y un stop-loss firme. Volatilidad extrema exige límites estrictos.'}
];

/* ================= GLOSARIO ================= */
const GLOSS = [
 ['Criptoactivo','Activo digital que usa criptografía y funciona sin un banco central (ej.: Bitcoin).','Como dinero que viaja por internet sin pasar por ningún banco.'],
 ['Capitalización de mercado','Precio del activo × unidades en circulación. Mide el "tamaño" y solidez relativa del activo.','Bitcoin es la exportadora gigante del mercado; una moneda nueva es un puesto de feria que recién abre.'],
 ['Volatilidad','Qué tanto sube y baja un precio en poco tiempo. Más volatilidad = más riesgo (y más oportunidad).','USDT es una carretera plana; DOGE es el camino a Los Yungas.'],
 ['Tendencia','Dirección general del precio en un período: alcista (sube), bajista (baja) o lateral (se mantiene).','La variación de 7 días te dice hacia dónde "camina" el activo esta semana.'],
 ['Portafolio','Conjunto de inversiones que posees. Aquí: tus 3 criptomonedas + tu reserva.','Tu canasta completa de inversiones, vista como un todo.'],
 ['Diversificación','Repartir el capital entre varios activos para que la caída de uno no hunda todo el portafolio.','No pongas todos los huevos en la misma canasta.'],
 ['Moneda estable (stablecoin)','Criptomoneda anclada al dólar (ej.: USDT). Casi no varía: sirve como refugio.','Es como guardar dólares digitales dentro del mundo cripto.'],
 ['Take-profit','Precio objetivo al que vendes automáticamente para asegurar la ganancia antes de que el mercado cambie.','Compras a $100, fijas +15%: al llegar a $115 el sistema vende solo y tu ganancia queda asegurada.'],
 ['Stop-loss','Precio límite al que vendes automáticamente para frenar una pérdida. Tu "freno de mano".','Compras a $100, fijas −10%: si cae a $90 el sistema vende solo y proteges el resto de tu capital.'],
 ['Reserva / liquidez','Capital que no inviertes y mantienes en caja para reaccionar ante oportunidades o crisis.','El "colchón" de la empresa: si el mercado se pone en descuento, tienes con qué comprar.'],
 ['Runway','Tiempo que una empresa puede operar con la caja disponible. Proteger el runway = proteger la vida de la empresa.','Si tu caja cubre 6 meses de gastos, tu runway es de 6 meses.'],
 ['Costo de oportunidad','Lo que dejas de ganar por elegir una alternativa en lugar de otra.','Si inviertes el 100% de inmediato, tu costo de oportunidad es no poder comprar barato si el mercado cae mañana.'],
 ['Perfil de riesgo','Tu tolerancia a las pérdidas: conservador, moderado o agresivo. Define cómo distribuyes el capital.','¿Cuánto puedes perder sin perder el sueño? Esa es tu verdadera medida.'],
 ['Orden de compra','Instrucción de comprar un activo a precio de mercado. Registra precio, monto y unidades recibidas.','Unidades = monto invertido ÷ precio. $10 000 en algo que vale $50 = 200 unidades.']
];

/* ================= PERSISTENCIA ================= */
let mem={};
let saveFlashT;
function save(){
  S.savedAt = Date.now();
  try{ localStorage.setItem('ccfcee_amigable_v4', JSON.stringify(S)); }catch(e){ mem.s=JSON.stringify(S); }
  const chip=document.getElementById('saveChip'), txt=document.getElementById('saveTxt');
  if(chip&&txt){ const t=new Date(S.savedAt);
    txt.textContent='Guardado '+String(t.getHours()).padStart(2,'0')+':'+String(t.getMinutes()).padStart(2,'0')+':'+String(t.getSeconds()).padStart(2,'0');
    chip.classList.add('flash'); clearTimeout(saveFlashT);
    saveFlashT=setTimeout(()=>chip.classList.remove('flash'),900); }
}
function load(){ try{ const d=localStorage.getItem('ccfcee_amigable_v4'); if(d){ S=Object.assign(S,JSON.parse(d)); return true; } }catch(e){ if(mem.s){ S=Object.assign(S,JSON.parse(mem.s)); return true; } } return false; }
function hasProgress(){ return !!(S.name || S.xp>0 || S.acad.some(Boolean)); }
function resumeSession(){
  document.getElementById('resumeBk').classList.remove('on');
  toast(`👋 ¡Bienvenido de vuelta${S.name?', <b>'+S.name+'</b>':''}! Continúas en ${S.screen===0?'la historia':S.screen===6?'los resultados':'la Misión '+S.screen}.`);
}
function freshStart(){
  window.__resetting = true;
  try{ localStorage.removeItem('ccfcee_amigable_v4'); }catch(e){}
  mem={}; location.reload();
}
function resetAll(){
  if(!confirm('Esto borrará todo el avance del reto guardado en este navegador. ¿Reiniciar?'))return;
  freshStart();
}
function setTeamPill(){
  if(S.name){ document.getElementById('teamPill').style.display='flex';
    document.getElementById('teamName').textContent=S.name; }
}

/* ================= NAVEGACIÓN Y GAMIFICACIÓN ================= */
const MISSIONS=[
 {n:'Historia', icon:'🏢'},
 {n:'Explora el mercado', icon:'🔍', min:15},
 {n:'Diseña tu estrategia', icon:'📐', min:15},
 {n:'Ejecuta inversiones', icon:'⚡', min:15},
 {n:'Kiosco Bitcoin', icon:'₿', min:5},
 {n:'Explica tu decisión', icon:'🎤', min:10},
 {n:'Resultados', icon:'🏆'}
];
function renderRail(){
  const r=document.getElementById('rail');
  r.innerHTML = MISSIONS.map((m,i)=>{
    const done = i>0 && i<6 && S.m[i-1];
    const unlocked = i===0 || i===1 && S.name || (i>1 && i<6 && S.m[i-2]) || (i===6 && S.m[4]);
    return `<button class="${S.screen===i?'active':''} ${done?'done':''} ${unlocked?'':'locked'}" onclick="${unlocked?`go(${i})`:''}" ${unlocked?'':'disabled'}>
      <span class="n">${done?'✓':(i===0?'★':(i===6?'🏆':i))}</span>${m.icon} ${m.n}</button>`;
  }).join('');
  const prog = (S.m.filter(Boolean).length/5)*100;
  document.getElementById('progFill').style.width = prog+'%';
}
function go(i){ S.screen=i; document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  document.getElementById('s'+i).classList.add('on'); renderRail(); startTimer(i); save();
  window.scrollTo({top:0,behavior:'smooth'});
  if(i===3) renderBuyRows(); if(i===6) renderFinal();
}
function addXp(n,msg){ S.xp+=n; document.getElementById('xp').textContent=S.xp; updateLevel();
  toast(`+${n} XP ${msg?'· '+msg:''}`); save(); }
function updateLevel(){
  const L = S.xp>=700?'Director de Inversiones': S.xp>=480?'Estratega Senior': S.xp>=240?'Analista Senior':'Analista Junior';
  document.getElementById('level').textContent=L; return L;
}
let toastT;
function toast(msg){ const t=document.getElementById('toast'); t.innerHTML=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),3200); }

/* ================= TEMPORIZADOR ================= */
let timerInt=null, timerLeft=0;
function startTimer(scr){
  const pill=document.getElementById('timerPill');
  clearInterval(timerInt); timerInt=null;
  if(scr>=1&&scr<=5){ pill.style.display='flex'; timerLeft=MISSIONS[scr].min*60; drawTimer();
    document.getElementById('timerBtn').textContent='▶';
  } else pill.style.display='none';
}
function drawTimer(){ const m=Math.floor(timerLeft/60),s=timerLeft%60;
  document.getElementById('timerTxt').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
document.getElementById('timerBtn').onclick=function(){
  if(timerInt){ clearInterval(timerInt); timerInt=null; this.textContent='▶'; }
  else{ this.textContent='⏸'; timerInt=setInterval(()=>{ if(timerLeft>0){timerLeft--;drawTimer();}
      else{clearInterval(timerInt);timerInt=null;toast('⏱ Tiempo sugerido agotado — puedes continuar con calma');} },1000); }
};

/* ================= HISTORIA + ACADEMIA ================= */
function storyStep(n){ document.querySelectorAll('.story-step').forEach(s=>s.classList.remove('on'));
  document.getElementById('st'+n).classList.add('on');
  window.scrollTo({top:0,behavior:'smooth'}); }
function learnCard(i,btn){
  if(S.acad[i])return;
  S.acad[i]=true;
  btn.classList.add('done'); btn.textContent='✓ Dominado';
  document.getElementById('ac'+i).classList.add('learned');
  addXp(15,'Concepto dominado');
  const n=S.acad.filter(Boolean).length;
  document.getElementById('acadHint').innerHTML=`Conceptos dominados: <b style="color:${n===4?'var(--up)':'var(--gold)'}">${n} / 4</b>${n===4?' — ¡idioma del mercado desbloqueado! 🎓':' — marca los cuatro para continuar.'}`;
  if(n===4) document.getElementById('acadNext').disabled=false;
  save();
}
document.querySelectorAll('#roleSel .role').forEach(r=>r.onclick=()=>{
  document.querySelectorAll('#roleSel .role').forEach(x=>x.classList.remove('sel'));
  r.classList.add('sel'); S.role=r.dataset.r;
});
function startChallenge(){
  const n=document.getElementById('inpName').value.trim();
  if(!n){ toast('✋ Escribe el nombre del o los analistas'); return; }
  if(!S.role){ toast('✋ Selecciona la carrera responsable'); return; }
  S.name=n; setTeamPill(); addXp(30,'Desafío aceptado'); go(1);
}

/* ================= MISIÓN 1 ================= */
function buildM1(){
  const q1=document.getElementById('q1opts');
  q1.innerHTML = COINS.map(c=>`<div class="opt" data-s="${c.sym}" onclick="q1pick(this)">${c.sym} · ${c.name}</div>`).join('');
  const mk=(el,fn)=>{ document.getElementById(el).innerHTML =
    COINS.filter(c=>['BTC','ETH','SOL','ZEC','DOGE','XRP'].includes(c.sym))
      .map(c=>`<div class="opt" data-s="${c.sym}" onclick="${fn}(this)">${c.sym} · ${c.name}</div>`).join(''); };
  mk('q2opts','q2pick'); mk('q3opts','q3pick');
  document.getElementById('newsList').innerHTML = NEWS.map((n,i)=>`
    <div class="newsitem" data-i="${i}" onclick="newsPick(${i},this)">
      <span class="tag t-${n.t}">${n.t==='pos'?'Alcista':n.t==='neg'?'Bajista':'Neutro'}</span>
      <div><b>${n.h}</b><span>${n.s}</span><div class="why">${n.why}</div></div></div>`).join('');
  document.getElementById('q5opts').innerHTML = COINS.map(c=>`<div class="opt" data-s="${c.sym}" onclick="q5pick(this)">${c.sym} · ${c.name}</div>`).join('');
}
function setTask(id,ok){ const t=document.getElementById(id); t.classList.toggle('ok',ok);
  t.querySelector('.st').textContent = ok?'✓ completada':'pendiente'; }

function q1pick(el){
  el.classList.toggle('sel');
  S.q1=[...document.querySelectorAll('#q1opts .opt.sel')].map(o=>o.dataset.s);
  const h=document.getElementById('q1hint');
  if(S.q1.length!==3){ h.className='hint'; h.textContent=`Seleccionadas: ${S.q1.length}/3`; S.q1ok=false; setTask('t1',false); save(); return; }
  const target=['BTC','ETH','USDT'];
  S.q1ok = target.every(s=>S.q1.includes(s));
  if(S.q1ok){ h.className='hint ok'; h.innerHTML='✓ <b>Correcto:</b> Bitcoin ($1,27 billones), Ethereum ($216 MM) y Tether ($184 MM) dominan por capitalización. Dato curioso: Tether es una moneda ESTABLE — su tamaño refleja cuánta gente la usa como refugio. Verifícalo también en CoinMarketCap.'; setTask('t1',true); addXp(20,'Ojo de analista'); }
  else{ h.className='hint err'; h.textContent='Casi… revisa la columna "Cap. de mercado": recuerda que 1 B (billón) es MIL veces más grande que 1 MM (mil millones). Ordena de mayor a menor.'; setTask('t1',false); }
  save();
}
function q2pick(el){
  [...document.querySelectorAll('#q2opts .opt')].forEach(o=>o.classList.remove('sel','right','wrong'));
  const ok = el.dataset.s==='ZEC'; el.classList.add(ok?'right':'wrong');
  const h=document.getElementById('q2hint');
  if(ok){ S.q2ok=true; h.className='hint ok'; h.innerHTML='✓ <b>Exacto:</b> Zcash lidera la variación a 7 días (+12,4%). Lección de analista: una subida rápida atrae compradores… pero también puede revertirse rápido. Antes de subirte a un cohete, pregunta cuánto combustible le queda.'; setTask('t2',true); addXp(20,'Cazador de tendencias'); }
  else{ h.className='hint err'; h.textContent='Compara la columna "7 d": busca el porcentaje positivo (▲ verde) más alto de toda la tabla, no el precio más alto.'; }
  save();
}
function q3pick(el){
  [...document.querySelectorAll('#q3opts .opt')].forEach(o=>o.classList.remove('sel','right','wrong'));
  const ok = el.dataset.s==='DOGE'; el.classList.add(ok?'right':'wrong');
  const h=document.getElementById('q3hint');
  if(ok){ S.q3ok=true; h.className='hint ok'; h.innerHTML='✓ <b>Correcto:</b> Dogecoin muestra volatilidad "Muy alta": puede moverse ±10% en un solo día. Eso significa que $10 000 invertidos hoy podrían valer $11 000… o $9 000 mañana. No es "malo": es RIESGO, y el riesgo se gestiona con porcentajes pequeños y stop-loss.'; setTask('t3',true); addXp(20,'Detector de riesgo'); }
  else{ h.className='hint err'; h.textContent='Observa la columna "Volatilidad": busca la etiqueta roja "Muy alta". El precio no importa aquí — importa qué tan bruscamente se mueve.'; }
  save();
}
function newsPick(i,el){
  document.querySelectorAll('.newsitem').forEach(n=>n.classList.remove('sel'));
  el.classList.add('sel'); S.newsSel=i;
  document.getElementById('q4hint').innerHTML=`<span style="color:var(--up)">✓ Noticia elegida:</span> "${NEWS[i].h}". En la Misión 2 podrás usarla como argumento para justificar tu activo de mayor confianza.`;
  setTask('t4',true); save();
}
function q5pick(el){
  const s=el.dataset.s;
  if(el.classList.contains('sel')){ el.classList.remove('sel'); S.picks=S.picks.filter(x=>x!==s); }
  else{ if(S.picks.length>=3){ toast('Solo 3 criptomonedas: quita una para cambiar'); return; }
    el.classList.add('sel'); S.picks.push(s); }
  renderQ5just(); save();
}
function renderQ5just(){
  const d=document.getElementById('q5just');
  d.innerHTML = S.picks.map(s=>{ const c=COINS.find(x=>x.sym===s);
    return `<label class="f">¿Por qué ${c.name} (${s}) merece un lugar en el portafolio?</label>
    <textarea data-s="${s}" oninput="S.just['${s}']=this.value;save();checkT5()" placeholder="Elijo ${c.name} porque… (usa un dato de la tabla: su capitalización de ${fmtCap(c.cap)}, su variación 7d, su volatilidad ${VOLTXT[c.vol].toLowerCase()}, o una noticia)">${S.just[s]||''}</textarea>`;
  }).join('');
  checkT5();
}
function checkT5(){
  const ok = S.picks.length===3 && S.picks.every(s=>(S.just[s]||'').trim().length>=4);
  setTask('t5',ok); return ok;
}
function completeM1(){
  const missing=[];
  if(!S.q1ok) missing.push('Tarea 1 (top 3 por capitalización)');
  if(!S.q2ok) missing.push('Tarea 2 (mayor subida 7d)');
  if(!S.q3ok) missing.push('Tarea 3 (mayor volatilidad)');
  if(S.newsSel<0) missing.push('Tarea 4 (elegir una noticia)');
  if(!checkT5()) missing.push('Tarea 5 (3 monedas + justificación de al menos una frase)');
  if(missing.length){ toast('✋ Falta: '+missing[0]); return; }
  if(!S.m[0]){ S.m[0]=true; addXp(100,'Misión 1 completada'); }
  buildM2(); go(2);
}

/* ================= MISIÓN 2 ================= */
function buildM2(){
  const rows=document.getElementById('allocRows');
  rows.innerHTML = S.picks.map(s=>{ const c=COINS.find(x=>x.sym===s); if(S.alloc[s]===undefined)S.alloc[s]=28;
    return `<div class="alloc"><div class="row">
      <div class="nm"><div class="ic" style="width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:700;background:${c.col}22;color:${c.col};border:1px solid ${c.col}55">${s.slice(0,3)}</div> ${c.name}</div>
      <input type="range" min="0" max="80" value="${S.alloc[s]}" data-s="${s}" oninput="S.alloc['${s}']=+this.value;allocChanged()">
      <div class="pct"><span id="pct_${s}">${S.alloc[s]}%</span><small id="usd_${s}"></small></div>
    </div></div>`; }).join('');
  const t=document.getElementById('trustSel');
  t.innerHTML='<option value="">— Selecciona —</option>'+S.picks.map(s=>{const c=COINS.find(x=>x.sym===s);return `<option ${S.trust===s?'selected':''} value="${s}">${c.name} (${s})</option>`;}).join('');
  t.onchange=()=>{S.trust=t.value;save();};
  document.getElementById('trustWhy').value=S.trustWhy||'';
  document.getElementById('trustWhy').oninput=e=>{S.trustWhy=e.target.value;save();};
  document.querySelectorAll('#slOpts .opt').forEach(o=>{ o.classList.toggle('sel',+o.dataset.v===S.stopG);
    o.onclick=()=>{ document.querySelectorAll('#slOpts .opt').forEach(x=>x.classList.remove('sel'));
      o.classList.add('sel'); S.stopG=+o.dataset.v; slCalc(); save(); };});
  document.querySelectorAll('#riskSel .role').forEach(r=>{ r.classList.toggle('sel',S.risk===r.dataset.r);
    r.onclick=()=>{ document.querySelectorAll('#riskSel .role').forEach(x=>x.classList.remove('sel'));
      r.classList.add('sel'); S.risk=r.dataset.r; coherenceCheck(); save(); };});
  document.getElementById('rgRes').value=S.reserve;
  slCalc(); allocChanged();
}
function slCalc(){
  const el=document.getElementById('slCalc');
  if(!S.stopG){ el.textContent='Selecciona un límite y te mostraré en dólares dónde queda tu "freno".'; return; }
  el.innerHTML=`Con límite de <b>−${S.stopG}%</b>: si tus $100 000 caen a <b style="color:var(--down)">${fmtUsd(CAPITAL*(1-S.stopG/100))}</b>, activas el freno y conservas ese capital para seguir compitiendo.`;
}
function coherenceCheck(){
  const box=document.getElementById('cohereBox'); if(!box)return;
  const inv=S.picks.reduce((a,s)=>a+(S.alloc[s]||0),0);
  if(!S.risk||!inv){ box.className='cohere'; box.innerHTML='🧪 <b>Verificador de coherencia:</b> elige tu perfil y mueve los deslizadores; aquí te diré si tu distribución coincide con tu perfil de riesgo.'; return; }
  const score = S.picks.reduce((a,s)=>{const c=COINS.find(x=>x.sym===s);return a+(S.alloc[s]||0)*c.vol;},0)/inv;
  const nivel = score<1.1?'baja':score<2.1?'media':'alta';
  const esperado = {Conservador:'baja',Moderado:'media',Agresivo:'alta'}[S.risk];
  if(nivel===esperado){ box.className='cohere good';
    box.innerHTML=`🧪 <b>Coherencia ✓</b> Tu distribución tiene un riesgo <b>${nivel}</b> y tu perfil es <b>${S.risk}</b>: tu estrategia cuenta una historia consistente. Así se presenta un plan ante un comité.`; }
  else{ box.className='cohere warn';
    box.innerHTML=`🧪 <b>Atención (no bloquea, solo enseña):</b> declaraste perfil <b>${S.risk}</b>, pero tu distribución tiene un riesgo <b>${nivel}</b> según la volatilidad de tus activos. Puedes: ① ajustar los porcentajes para alinearte, o ② mantenerla y <b>explicar el porqué</b> ante el comité — ambas son decisiones válidas si las argumentas.`; }
}
function allocChanged(){
  S.reserve=+document.getElementById('rgRes').value;
  let tot=S.reserve;
  document.getElementById('pctRes').textContent=S.reserve+'%';
  document.getElementById('usdRes').textContent=fmtUsd(CAPITAL*S.reserve/100);
  const bar=document.getElementById('totalBar'); let bars='';
  S.picks.forEach(s=>{ const c=COINS.find(x=>x.sym===s), v=S.alloc[s]||0; tot+=v;
    const p=document.getElementById('pct_'+s), u=document.getElementById('usd_'+s);
    if(p){p.textContent=v+'%'; u.textContent=fmtUsd(CAPITAL*v/100);}
    bars+=`<div style="width:${v}%;background:${c.col}"></div>`; });
  bars+=`<div style="width:${S.reserve}%;background:var(--muted2)"></div>`;
  bar.innerHTML=bars;
  const t=document.getElementById('totalTxt');
  t.textContent=tot+'%'; t.className= tot===100?'ok':'bad';
  coherenceCheck();
  save();
}
function completeM2(){
  const tot=S.picks.reduce((a,s)=>a+(S.alloc[s]||0),0)+S.reserve;
  if(!S.risk){ toast('✋ Paso 1: selecciona tu perfil de riesgo'); return; }
  if(tot!==100){ toast(`✋ El total debe ser exactamente 100% (llevas ${tot}%). Ajusta los deslizadores.`); return; }
  for(const s of S.picks){ const v=S.alloc[s]||0;
    if(v>60){ toast(`✋ Regla de diversificación: ${s} supera el 60% del capital`); return; }
    if(v<5){ toast(`✋ Cada moneda elegida necesita al menos 5% (revisa ${s})`); return; } }
  if(!S.trust){ toast('✋ Paso 4: elige tu activo de mayor confianza'); return; }
  if((S.trustWhy||'').trim().length<15){ toast('✋ Justifica tu activo de confianza con datos (una frase completa)'); return; }
  if(!S.stopG){ toast('✋ Paso 5: define tu límite de pérdida'); return; }
  if(!S.m[1]){ S.m[1]=true; addXp(150,'Estrategia formalizada');
    if(S.reserve>=10&&S.reserve<=25) addXp(30,'Bonus: liquidez saludable (10–25%)'); }
  go(3);
}

/* ================= MISIÓN 3 ================= */
function targetLinesHtml(price,tp,sl){
  return `<span class="tp">▲ Vendo con ganancia a ${fmt(price*(1+tp/100))}</span><br><span class="sl">▼ Freno pérdidas a ${fmt(price*(1-sl/100))}</span>`;
}
function tgtHtml(s,price){
  const b=S.buys[s];
  return targetLinesHtml(price, b?b.tp:15, b?b.sl:(S.stopG||10));
}
function renderBuyRows(){
  const d=document.getElementById('buyRows');
  d.innerHTML = S.picks.map(s=>{ const c=COINS.find(x=>x.sym===s), b=S.buys[s];
    const amt = CAPITAL*(S.alloc[s]||0)/100;
    if(b){
      return `<div class="buyrow">
       <div><span class="lab">Activo · asignación</span><div class="coinname"><div class="ic" style="background:${c.col}22;color:${c.col};border:1px solid ${c.col}55">${s.slice(0,3)}</div><div><b>${c.name}</b><small>${S.alloc[s]}% del capital = ${fmtUsd(amt)}</small></div></div></div>
       <div><span class="lab">Precio de compra ✓</span><div class="val">${fmt(b.price)}</div><div class="tgt">${targetLinesHtml(b.price,b.tp,b.sl)}</div></div>
       <div><span class="lab">Unidades recibidas</span><div class="val">${fmt(b.units,4)} ${s}</div><small class="hint">Comprobante #${b.orderId||'—'}</small></div>
       <div style="padding-top:18px"><span class="volb v1">✓ Ejecutada</span></div>
      </div>`;
    }
    return `<div class="buyrow">
     <div><span class="lab">Activo · asignación</span><div class="coinname"><div class="ic" style="background:${c.col}22;color:${c.col};border:1px solid ${c.col}55">${s.slice(0,3)}</div><div><b>${c.name}</b><small>${S.alloc[s]}% del capital = ${fmtUsd(amt)}</small></div></div></div>
     <div><span class="lab">Precio actual (en vivo)</span><div class="val" id="live_${s}">${fmt(c.p)}</div></div>
     <div><span class="lab">Recibirás aprox.</span><div class="val" id="qty_${s}">${fmt(amt/c.p,6)} ${s}</div></div>
     <div style="padding-top:18px"><button class="btn gold sm" onclick="openBuyModal('${s}')">⚡ Iniciar compra</button></div>
    </div>`; }).join('');
  document.getElementById('simCard').style.display = Object.keys(S.buys).length===S.picks.length && S.picks.length? 'block':'none';
  renderInvTable(); drawChart(); updateDayBtn();
}
setInterval(()=>{ S.picks.forEach(s=>{ if(!S.buys[s]){
  const c=COINS.find(x=>x.sym===s), amt=CAPITAL*(S.alloc[s]||0)/100;
  const el=document.getElementById('live_'+s); if(el) el.textContent=fmt(c.p);
  const q=document.getElementById('qty_'+s); if(q) q.textContent=fmt(amt/c.p,6)+' '+s;
} });},1500);

/* -------- Ticket de compra dinámico (simula un exchange real) -------- */
let buyModalSym=null, buyModalTP=15, buyModalSL=10, buyModalTicker=null, buyProcessing=false;

function openBuyModal(s){
  if(buyProcessing) return;
  buyModalSym=s;
  const savedTp=Number(localStorage.getItem('ccfcee_lastTp')); const savedSl=Number(localStorage.getItem('ccfcee_lastSl'));
  buyModalTP = savedTp>0?savedTp:15; buyModalSL = savedSl>0?savedSl:(S.stopG||10);
  renderBuyModalTicket();
  document.getElementById('buyModalBk').classList.add('on');
  clearInterval(buyModalTicker);
  buyModalTicker=setInterval(()=>{
    if(!buyModalSym) return;
    const c=COINS.find(x=>x.sym===buyModalSym);
    const priceEl=document.getElementById('bmLivePrice'); if(priceEl) priceEl.textContent=fmt(c.p);
    updateBmQty(); updateBmTargets();
  },800);
}
function closeBuyModal(){
  if(buyProcessing) return;
  document.getElementById('buyModalBk').classList.remove('on');
  clearInterval(buyModalTicker); buyModalSym=null;
}
function updateBmQty(){
  const s=buyModalSym; if(!s) return;
  const c=COINS.find(x=>x.sym===s), amt=CAPITAL*(S.alloc[s]||0)/100;
  const el=document.getElementById('bmQty'); if(el) el.textContent=fmt(amt/c.p,6)+' '+s;
}
function bmTpChanged(v){ buyModalTP=Math.min(100,Math.max(1,+v||15)); updateBmTargets(); }
function bmSlChanged(v){ buyModalSL=Math.min(50,Math.max(1,+v||10)); updateBmTargets(); }
function updateBmTargets(){
  const s=buyModalSym; if(!s) return;
  const c=COINS.find(x=>x.sym===s);
  const el=document.getElementById('bmTgt'); if(el) el.innerHTML=targetLinesHtml(c.p,buyModalTP,buyModalSL);
}
function renderBuyModalTicket(){
  const s=buyModalSym, c=COINS.find(x=>x.sym===s), amt=CAPITAL*(S.alloc[s]||0)/100;
  document.getElementById('buyModalBody').innerHTML = `
    <div class="order-head">
      <div class="coinname"><div class="ic" style="background:${c.col}22;color:${c.col};border:1px solid ${c.col}55">${s.slice(0,3)}</div><div><b>${c.name}</b><small>Orden de mercado · ${s}/USD</small></div></div>
      <button class="btn sm ghost" type="button" onclick="closeBuyModal()">✕</button>
    </div>
    <div class="order-price">
      <span class="lab">Precio en vivo</span>
      <div class="order-price-val"><span id="bmLivePrice">${fmt(c.p)}</span><span class="pulse-dot"></span></div>
    </div>
    <div class="order-grid">
      <div><span class="lab">Monto a invertir</span><div class="val">${fmtUsd(amt)}</div><small class="hint">${S.alloc[s]}% del capital, según tu estrategia</small></div>
      <div><span class="lab">Recibirás aprox.</span><div class="val" id="bmQty">${fmt(amt/c.p,6)} ${s}</div></div>
    </div>
    <div class="order-grid">
      <div><span class="lab">Take-profit % <span class="term" onclick="gotoTerm('Take-profit')" style="font-size:10px">?</span></span><input type="number" id="bmTp" min="1" max="100" value="${buyModalTP}" oninput="bmTpChanged(this.value)"></div>
      <div><span class="lab">Stop-loss % <span class="term" onclick="gotoTerm('Stop-loss')" style="font-size:10px">?</span></span><input type="number" id="bmSl" min="1" max="50" value="${buyModalSL}" oninput="bmSlChanged(this.value)"></div>
    </div>
    <div class="tgt" id="bmTgt">${targetLinesHtml(c.p,buyModalTP,buyModalSL)}</div>
    <p class="hint" style="margin-top:8px">Al confirmar, el sistema toma el precio <b>exacto</b> del mercado en ese instante — igual que en un exchange real, el precio puede moverse mientras decides.</p>
    <button class="btn gold" style="width:100%;margin-top:10px" onclick="submitBuyOrder()">⚡ Confirmar compra</button>
  `;
}
function submitBuyOrder(){
  if(buyProcessing) return;
  buyProcessing=true;
  clearInterval(buyModalTicker);
  const s=buyModalSym, c=COINS.find(x=>x.sym===s);
  const execPrice=c.p, orderId='ORD-'+Date.now().toString(36).toUpperCase().slice(-6);
  try{ localStorage.setItem('ccfcee_lastTp',buyModalTP); localStorage.setItem('ccfcee_lastSl',buyModalSL); }catch(e){}
  const steps=['Enviando orden al exchange…','Verificando fondos y límites…','Buscando el mejor precio disponible…','Ejecutando orden…'];
  document.getElementById('buyModalBody').innerHTML = `
    <div class="order-processing">
      <div class="spinner"></div>
      <h3>Procesando tu orden</h3>
      <ul class="proc-steps" id="procSteps">${steps.map((t,i)=>`<li id="pstep${i}"><span class="pstep-dot"></span>${t}</li>`).join('')}</ul>
    </div>`;
  steps.forEach((_,i)=>{ setTimeout(()=>{ const li=document.getElementById('pstep'+i); if(li) li.classList.add('done'); }, 320*(i+1)); });
  setTimeout(()=>finishBuyOrder(s,execPrice,orderId), 320*steps.length+300);
}
function finishBuyOrder(s,execPrice,orderId){
  const amt=CAPITAL*(S.alloc[s]||0)/100;
  S.buys[s]={price:execPrice, units:amt/execPrice, tp:buyModalTP, sl:buyModalSL, status:'abierta', orderId, ts:Date.now()};
  addXp(25,`Compra ejecutada: ${fmtUsd(amt)} → ${fmt(amt/execPrice,4)} ${s} a ${fmt(execPrice)} c/u`);
  save();
  const t=new Date();
  document.getElementById('buyModalBody').innerHTML = `
    <div class="order-done">
      <div class="order-check">✓</div>
      <h3>Compra ejecutada</h3>
      <p class="hint">Comprobante #${orderId} · ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}</p>
      <div class="order-grid">
        <div><span class="lab">Precio de ejecución</span><div class="val">${fmt(execPrice)}</div></div>
        <div><span class="lab">Unidades recibidas</span><div class="val">${fmt(amt/execPrice,6)} ${s}</div></div>
      </div>
      <div class="tgt">${targetLinesHtml(execPrice,buyModalTP,buyModalSL)}</div>
      <button class="btn gold" style="width:100%;margin-top:14px" onclick="closeBuyModalAfterOrder()">Continuar</button>
    </div>`;
  buyProcessing=false;
  renderBuyRows();
  if(Object.keys(S.buys).length===S.picks.length) toast('🎯 Portafolio ejecutado. ¡Ahora avanza los 7 días de mercado y observa qué pasa!');
}
function closeBuyModalAfterOrder(){
  document.getElementById('buyModalBk').classList.remove('on');
  buyModalSym=null;
}
function portfolioValue(){
  let v = CAPITAL*S.reserve/100;
  S.picks.forEach(s=>{ const b=S.buys[s]; if(!b)return; const c=COINS.find(x=>x.sym===s);
    v += b.status==='abierta' ? b.units*c.p : b.closedVal; });
  return v;
}
const DAYEVENTS=[
 {p:.18,t:'pos',msg:'Noticia alcista: nuevos flujos institucionales impulsan al mercado. (Cuando entra dinero grande, casi todo sube.)',f:1.03},
 {p:.15,t:'neg',msg:'Corrección del mercado: toma de ganancias generalizada. (Tras varias subidas, muchos venden para asegurar ganancias — los precios bajan.)',f:0.96},
 {p:.08,t:'neg',msg:'Rumor regulatorio golpea a las monedas más volátiles. (Los activos de mayor riesgo son los primeros en caer ante la incertidumbre.)',f:0.93,volOnly:true},
 {p:.10,t:'pos',msg:'Rally de altcoins: los activos de mediana capitalización despegan. (A veces el dinero rota de Bitcoin hacia monedas más pequeñas.)',f:1.05,altOnly:true}
];
function advanceDay(){
  if(S.day>=7)return;
  S.day++;
  COINS.forEach(c=>{ const v=[0.001,0.012,0.025,0.05][c.vol];
    c.p=Math.max(c.p*(1+ c.c7/900 + gauss()*v), c.p0*0.4); });
  let evMsg=null;
  const r=Math.random(); let acc=0;
  for(const e of DAYEVENTS){ acc+=e.p; if(r<acc){ evMsg=e;
      COINS.forEach(c=>{ if(e.volOnly&&c.vol<3)return; if(e.altOnly&&(c.sym==='BTC'||c.sym==='USDT'))return; c.p*=e.f; }); break; } }
  const notes=[];
  S.picks.forEach(s=>{ const b=S.buys[s]; if(!b||b.status!=='abierta')return; const c=COINS.find(x=>x.sym===s);
    const chg=(c.p-b.price)/b.price*100;
    if(chg>=b.tp){ b.status='take-profit'; b.closedVal=b.units*b.price*(1+b.tp/100);
      notes.push(`<span class="pos">✓ ${s}: alcanzó su take-profit (+${b.tp}%) y se vendió solo. Ganancia asegurada: así trabaja una orden automática.</span>`); }
    else if(chg<=-b.sl){ b.status='stop-loss'; b.closedVal=b.units*b.price*(1-b.sl/100);
      notes.push(`<span class="neg">⛔ ${s}: activó su stop-loss (−${b.sl}%) y se vendió solo. Pérdida controlada — el freno de mano funcionó y protegió el resto de tu capital.</span>`); }
  });
  const v=portfolioValue(); S.plHist.push(v);
  const dchg=((v-S.plHist[S.plHist.length-2])/S.plHist[S.plHist.length-2]*100).toFixed(2);
  S.log.unshift(`<span class="d">Día ${S.day} ·</span> ${evMsg?`<span class="${evMsg.t}">${evMsg.msg}</span> `:'Jornada tranquila, sin grandes titulares. '}Portafolio: <b>${fmtUsd(v)}</b> (${dchg>=0?'+':''}${dchg}% vs. ayer)${notes.length?'<br>'+notes.join('<br>'):''}`);
  document.getElementById('evLog').innerHTML=S.log.join('<br>');
  drawChart(); renderInvTable(); updateDayBtn(); renderMarket();
  if(S.day===7){ addXp(60,'Sobreviviste 7 días de mercado'); document.getElementById('m3done').disabled=false;
    toast('📊 Semana completada. Lee tu bitácora, revisa tu tabla de inversiones y cierra la misión.'); }
  save();
}
function updateDayBtn(){
  const b=document.getElementById('dayBtn');
  b.textContent = S.day>=7 ? '✓ Semana simulada completa' : `☀️ Avanzar 1 día (${S.day}/7)`;
  b.disabled = S.day>=7;
  const v=portfolioValue();
  document.getElementById('plNow').textContent=fmtUsd(v);
  const d=((v-CAPITAL)/CAPITAL*100);
  const el=document.getElementById('plDelta');
  el.innerHTML=`${d>=0?'▲':'▼'} ${Math.abs(d).toFixed(2)}% desde el inicio (${fmtUsd(Math.abs(v-CAPITAL))} ${d>=0?'ganados':'menos'})`;
  el.style.color = d>=0?'var(--up)':'var(--down)';
  document.getElementById('plNow').style.color = d>=0?'var(--up)':'var(--down)';
  document.getElementById('m3done').disabled = S.day<7;
}
function drawChart(){
  const svg=document.getElementById('plChart'); if(!svg)return;
  const h=S.plHist, min=Math.min(...h)*0.995, max=Math.max(...h)*1.005, rg=(max-min)||1;
  const X=i=>40+(i/Math.max(h.length-1,1))*740, Y=v=>210-((v-min)/rg)*180;
  let grid='';
  for(let g=0;g<=4;g++){ const yv=min+rg*g/4, y=Y(yv);
    grid+=`<line x1="40" y1="${y}" x2="780" y2="${y}" stroke="#1E2A44" stroke-width="1"/>
    <text x="36" y="${y+4}" fill="#5E6A82" font-size="10" text-anchor="end" font-family="monospace">${(yv/1000).toFixed(0)}k</text>`; }
  const up=h[h.length-1]>=h[0], col=up?'#2BD98F':'#FF5A6E';
  const pts=h.map((v,i)=>`${X(i)},${Y(v)}`).join(' ');
  const area=`M ${X(0)},${Y(h[0])} `+h.map((v,i)=>`L ${X(i)},${Y(v)}`).join(' ')+` L ${X(h.length-1)},210 L ${X(0)},210 Z`;
  svg.innerHTML=`${grid}
   <path d="${area}" fill="${col}18"/>
   <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>
   ${h.map((v,i)=>`<circle cx="${X(i)}" cy="${Y(v)}" r="3.4" fill="${col}"/><text x="${X(i)}" y="226" fill="#5E6A82" font-size="10" text-anchor="middle" font-family="monospace">${i===0?'Inicio':'D'+i}</text>`).join('')}`;
}
function renderInvTable(){
  const card=document.getElementById('invTableCard');
  if(!Object.keys(S.buys).length){ card.style.display='none'; return; }
  card.style.display='block';
  const t=document.getElementById('invTable');
  t.innerHTML=`<tr><th>Criptoactivo</th><th>% invertido</th><th>Monto USD</th><th>Precio de compra</th><th>Unidades</th><th>TP / SL</th><th>Estado</th><th>Motivo de elección</th></tr>`+
   S.picks.map(s=>{ const b=S.buys[s]; if(!b)return''; const c=COINS.find(x=>x.sym===s);
    const st = b.status==='abierta'?`Abierta · ${fmt(c.p)}`: b.status==='take-profit'?'✓ Cerrada en ganancia':'⛔ Cerrada por stop-loss';
    return `<tr><td>${c.name} (${s})</td><td>${S.alloc[s]}%</td><td>${fmtUsd(CAPITAL*S.alloc[s]/100)}</td><td>${fmt(b.price)}</td><td>${fmt(b.units,4)}</td><td>+${b.tp}% / −${b.sl}%</td><td>${st}</td><td style="font-family:var(--body)">${(S.just[s]||'—')}</td></tr>`; }).join('')+
   `<tr><td><b>Reserva (caja)</b></td><td>${S.reserve}%</td><td>${fmtUsd(CAPITAL*S.reserve/100)}</td><td colspan="4">Liquidez para oportunidades e imprevistos</td><td style="font-family:var(--body)">Gestión del runway</td></tr>`;
}
function completeM3(){
  if(S.day<7){ toast('✋ Completa los 7 días de simulación'); return; }
  if(!S.m[2]){ S.m[2]=true; addXp(120,'Misión 3 completada'); }
  go(4);
}

/* ================= MISIÓN 4 ================= */
function kioskCheck(n,el){
  if(n===2 && !(+document.getElementById('kioskAmt').value>0)){ toast('✋ Primero registra el monto del anticipo'); return; }
  if(n===3 && document.getElementById('kioskDoc').value.trim().length<5){ toast('✋ Registra el comprobante o una nota de la operación'); return; }
  S.kiosk[n-1]=true; el.classList.add('sel');
  S.kioskAmt=document.getElementById('kioskAmt').value; S.kioskDoc=document.getElementById('kioskDoc').value;
  setTask('k'+n,true); save();
  if(S.kiosk.every(Boolean)) toast('🤝 Los tres sellos están completos: la operación conjunta es válida');
}
function completeM4(){
  if(!S.kiosk.every(Boolean)){ toast('✋ Faltan sellos: ICO valida, NGE confirma, IEF documenta'); return; }
  if(!S.m[3]){ S.m[3]=true; addXp(80,'Puente virtual→real completado'); }
  go(5);
}

/* ================= MISIÓN 5 ================= */
function countWords(){
  const txt=document.getElementById('reflex').value.trim();
  const n = txt? txt.split(/\s+/).length : 0;
  const el=document.getElementById('wc');
  el.textContent = n<100? `${n} palabras · te faltan ${100-n} para el mínimo (objetivo: 100–150)`
                 : n>150? `${n} palabras · recorta ${n-150} para entrar al rango (objetivo: 100–150)`
                 : `${n} palabras · ✓ dentro del rango 100–150`;
  el.className='wordcount '+(n>=100&&n<=150?'ok':'bad');
  S.reflex=txt; save(); return n;
}
function completeM5(){
  const ids=['c1','c2','c3','c4','c5','c6'];
  for(let i=0;i<ids.length;i++){ const v=document.getElementById(ids[i]).value.trim();
    if(v.length<15){ toast(`✋ La pregunta ${i+1} del comité necesita una respuesta más completa. Usa la fórmula: Decisión + Dato + Razón.`); return; }
    S.answers[ids[i]]=v; }
  const w=countWords();
  if(w<100||w>150){ toast(`✋ La reflexión tiene ${w} palabras: ajústala a 100–150`); return; }
  S.bonus=document.getElementById('bonusTxt').value.trim();
  if(!S.m[4]){ S.m[4]=true; addXp(150,'Defensa ante el comité');
    if(S.bonus.length>20) addXp(50,'Bonus: reto adicional de USD 50 000'); }
  go(6);
}

/* ================= RESULTADOS ================= */
function renderFinal(){
  const v=portfolioValue(), d=(v-CAPITAL)/CAPITAL*100;
  document.getElementById('finVal').textContent=fmtUsd(v);
  document.getElementById('finVal').style.color = d>=0?'var(--up)':'var(--down)';
  document.getElementById('finDelta').textContent=`${d>=0?'▲ +':'▼ '}${d.toFixed(2)}% en 7 días simulados`;
  document.getElementById('finXp').textContent=S.xp+' XP';
  document.getElementById('finLevel').textContent='Rango alcanzado: '+updateLevel();
  const closedSL=S.picks.some(s=>S.buys[s]&&S.buys[s].status==='stop-loss');
  const closedTP=S.picks.some(s=>S.buys[s]&&S.buys[s].status==='take-profit');
  document.getElementById('verdict').innerHTML =
    d>=0 ? `"El portafolio terminó en <b style='color:var(--up)'>${fmtUsd(v)}</b>. Pero lo que más me impresionó no fue el número: fue que diversificaron, guardaron reserva y supieron explicar cada decisión con datos. <b>Eso es pensar como estrategas.</b> Bienvenidos al equipo."`
        : `"El portafolio cerró en <b style='color:var(--down)'>${fmtUsd(v)}</b>. ¿Perdimos? Solo capital virtual. Lo que ganaron — leer el mercado, controlar el riesgo${closedSL?' y dejar que el stop-loss los protegiera':''} — <b>vale mucho más que USD 100 000</b>. En este comité, aprender a perder poco es aprender a ganar."`;
  const B=[
   ['🎓','Idioma del Mercado','Dominaste los 4 conceptos de la Academia', S.acad.every(Boolean)],
   ['🔍','Ojo de Analista','Dominaste el reconocimiento del mercado', S.m[0]],
   ['📐','Arquitecto Financiero','Estrategia diversificada y con reserva', S.m[1]],
   ['🛡','Gestor del Riesgo','Definiste stop-loss y límites de pérdida', S.stopG>0],
   ['🎯','Francotirador','Al menos un take-profit se ejecutó', closedTP],
   ['🧊','Sangre Fría','Un stop-loss protegió tu capital', closedSL],
   ['₿','Pionero Cripto','Completaste la operación real en el Kiosco', S.m[3]],
   ['🎤','Voz del Comité','Defendiste tu estrategia con argumentos', S.m[4]],
   ['💎','Visión 50K','Resolviste el reto adicional', S.bonus.length>20]
  ];
  document.getElementById('badges').innerHTML=B.map(b=>`<div class="badge ${b[3]?'won':''}"><div class="em">${b[0]}</div><b>${b[1]}</b><span>${b[2]}</span></div>`).join('');
  buildReport(v,d);
}
function buildReport(v,d){
  const date=new Date().toLocaleDateString('es-BO',{day:'numeric',month:'long',year:'numeric'});
  const rows=S.picks.map(s=>{ const b=S.buys[s]||{}; const c=COINS.find(x=>x.sym===s);
    const st=b.status==='abierta'?'Abierta':b.status==='take-profit'?'Cerrada en ganancia (TP)':b.status==='stop-loss'?'Cerrada por stop-loss':'—';
    return `<tr><td>${c.name} (${s})</td><td>${S.alloc[s]}%</td><td>${fmtUsd(CAPITAL*S.alloc[s]/100)}</td><td>${b.price?fmt(b.price):'—'}</td><td>+${b.tp||'—'}% / −${b.sl||'—'}%</td><td>${st}</td><td>${S.just[s]||'—'}</td></tr>`; }).join('');
  const Q=['¿Cuál fue la estrategia?','¿Por qué esas criptomonedas?','¿Se realizó la operación demo o el registro del Kiosco?','¿Qué riesgo se identificó?','¿Qué harían si el mercado cae 10% mañana?','¿Qué aprendieron sobre invertir en criptoactivos?'];
  document.getElementById('report').innerHTML=`
   <img src="${document.querySelector('.logoplate img').src}" alt="UNIFRANZ" style="height:52px;margin-bottom:10px">
   <h1>Crypto Challenge — Informe Final</h1>
   <h2>UNIFRANZ · Facultad de Ciencias Económicas y Empresariales · Reto interdisciplinario ICO · NGE · IEF</h2>
   <p class="meta"><b>Analista(s):</b> ${S.name} &nbsp;·&nbsp; <b>Carrera responsable:</b> ${S.role} &nbsp;·&nbsp; <b>Fecha:</b> ${date}</p>
   <p class="meta"><b>Perfil de riesgo:</b> ${S.risk} &nbsp;·&nbsp; <b>Reserva de liquidez:</b> ${S.reserve}% &nbsp;·&nbsp; <b>Límite de pérdida global:</b> −${S.stopG}% &nbsp;·&nbsp; <b>Activo de mayor confianza:</b> ${S.trust} (${S.trustWhy})</p>
   <h3>Resultado del portafolio</h3>
   <p>Capital inicial: <b>USD 100 000</b> · Valor final tras 7 días simulados: <b>${fmtUsd(v)}</b> (${d>=0?'+':''}${d.toFixed(2)}%)</p>
   <h3>Tabla de inversiones</h3>
   <table><tr><th>Criptoactivo</th><th>% invertido</th><th>Monto</th><th>Precio compra</th><th>TP / SL</th><th>Estado</th><th>Motivo de elección</th></tr>${rows}
   <tr><td><b>Reserva (caja)</b></td><td>${S.reserve}%</td><td>${fmtUsd(CAPITAL*S.reserve/100)}</td><td colspan="4">Liquidez estratégica (gestión del runway)</td></tr></table>
   <h3>Operación real — Kiosco Bitcoin</h3>
   <p>Anticipo: ${S.kioskAmt||'—'} · Documentación: ${S.kioskDoc||'—'} · Validación conjunta ICO / NGE / IEF: completa.</p>
   <h3>Defensa ante el comité</h3>
   ${Q.map((q,i)=>`<p><b>${i+1}. ${q}</b><br>${S.answers['c'+(i+1)]||'—'}</p>`).join('')}
   <h3>Reflexión escrita</h3><p>${S.reflex||'—'}</p>
   ${S.bonus?`<h3>Reto adicional (USD 50 000)</h3><p>${S.bonus}</p>`:''}
   <p class="meta" style="margin-top:14px">Simulador educativo con capital 100% virtual · Fuentes de apoyo: coinmarketcap.com · labolsavirtual.com · Experiencia: ${S.xp} XP · Rango: ${updateLevel()}</p>`;
}
function printReport(){ buildReport(portfolioValue(),(portfolioValue()-CAPITAL)/CAPITAL*100); window.print(); }

/* ================= GLOSARIO ================= */
function renderGloss(){
  document.getElementById('glossList').innerHTML=GLOSS.map(g=>`<div class="gterm" data-term="${g[0]}"><b>${g[0]}</b><p>${g[1]}</p><p class="ana">💬 <b>En simple:</b> ${g[2]}</p></div>`).join('');
}
function openGloss(){ renderGloss(); document.getElementById('glossBk').classList.add('on'); }
function gotoTerm(name){
  renderGloss(); document.getElementById('glossBk').classList.add('on');
  const el=document.querySelector(`.gterm[data-term="${name}"]`);
  if(el){ el.classList.add('hl'); if(el.scrollIntoView) el.scrollIntoView({block:'center'});
    setTimeout(()=>el.classList.remove('hl'),2500); }
}

/* ================= INIT ================= */
function init(){
  const hadSave = load();
  buildM1(); renderMarket(); renderTicker(); renderRail();
  if(S.name){ document.getElementById('inpName').value=S.name;
    document.querySelectorAll('#roleSel .role').forEach(r=>r.classList.toggle('sel',r.dataset.r===S.role)); }
  setTeamPill();
  document.getElementById('xp').textContent=S.xp; updateLevel();
  // academia
  S.acad.forEach((v,i)=>{ if(v){ const c=document.getElementById('ac'+i); c.classList.add('learned');
    const b=c.querySelector('.okbtn'); b.classList.add('done'); b.textContent='✓ Dominado'; }});
  const nA=S.acad.filter(Boolean).length;
  if(nA){ document.getElementById('acadHint').innerHTML=`Conceptos dominados: <b style="color:${nA===4?'var(--up)':'var(--gold)'}">${nA} / 4</b>`;
    if(nA===4) document.getElementById('acadNext').disabled=false; }
  if(S.q1ok){setTask('t1',true); S.q1.forEach(s=>{const o=document.querySelector(`#q1opts .opt[data-s="${s}"]`);if(o)o.classList.add('sel');});}
  if(S.q2ok){setTask('t2',true); const o=document.querySelector('#q2opts .opt[data-s="ZEC"]'); if(o)o.classList.add('right');}
  if(S.q3ok){setTask('t3',true); const o=document.querySelector('#q3opts .opt[data-s="DOGE"]'); if(o)o.classList.add('right');}
  if(S.newsSel>=0){ const n=document.querySelector(`.newsitem[data-i="${S.newsSel}"]`); if(n){n.classList.add('sel');
    document.getElementById('q4hint').innerHTML=`<span style="color:var(--up)">✓ Noticia elegida:</span> "${NEWS[S.newsSel].h}"`; setTask('t4',true);} }
  S.picks.forEach(s=>{const o=document.querySelector(`#q5opts .opt[data-s="${s}"]`);if(o)o.classList.add('sel');});
  renderQ5just();
  if(S.reflex) document.getElementById('reflex').value=S.reflex;
  Object.keys(S.answers).forEach(k=>{const e=document.getElementById(k);if(e)e.value=S.answers[k];});
  if(S.bonus) document.getElementById('bonusTxt').value=S.bonus;
  if(!Array.isArray(S.kiosk)) S.kiosk=[false,false,false];
  S.kiosk=[Boolean(S.kiosk[0]),Boolean(S.kiosk[1]),Boolean(S.kiosk[2])];
  if(S.kioskAmt) document.getElementById('kioskAmt').value=S.kioskAmt;
  if(S.kioskDoc) document.getElementById('kioskDoc').value=S.kioskDoc;
  S.kiosk.forEach((v,i)=>{ if(v){ setTask('k'+(i+1),true);
    const o=document.querySelector(`#k${i+1} .opt`); if(o)o.classList.add('sel'); }});
  if(S.m[0]) buildM2();
  if(S.log.length) document.getElementById('evLog').innerHTML=S.log.join('<br>');
  if(S.screen>0) go(S.screen); else renderRail();
  countWords();
  // ¿Sesión previa con avance? Ofrecer continuar o empezar de cero
  if(hadSave && hasProgress()){
    const when = S.savedAt ? new Date(S.savedAt).toLocaleString('es-BO',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
    const misTxt = S.screen===0?'Historia / Academia': S.screen===6?'Resultados finales': `Misión ${S.screen} · ${MISSIONS[S.screen].n}`;
    document.getElementById('resumeInfo').innerHTML =
      `<b>👥 Equipo:</b> ${S.name||'(sin registrar aún)'}<br>`+
      `<b>📍 Te quedaste en:</b> ${misTxt}<br>`+
      `<b>⚡ Progreso:</b> ${S.xp} XP · ${S.m.filter(Boolean).length}/5 misiones completadas<br>`+
      `<b>🕐 Último guardado:</b> ${when}`;
    document.getElementById('resumeBk').classList.add('on');
  }
}
init();