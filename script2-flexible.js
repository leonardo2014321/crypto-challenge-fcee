/* ================================================================
   CAPA FLEXIBLE V2 · misiones autónomas + ficha objetivo por misión
   ================================================================ */
(function(){
  const legacyGo = go;
  const legacyBuildReport = buildReport;
  const legacyRenderFinal = renderFinal;
  const MISSION_META = [
    null,
    {icon:'🔍', title:'Explora el mercado', time:'8–15 min', desc:'Lee datos, contrasta fuentes y selecciona tres activos con argumentos.'},
    {icon:'📐', title:'Diseña la estrategia', time:'10–15 min', desc:'Define riesgo, reserva, diversificación y límite de pérdida.'},
    {icon:'⚡', title:'Ejecuta inversiones', time:'12–18 min', desc:'Registra órdenes, take-profit, stop-loss y observa siete jornadas.'},
    {icon:'🛡️', title:'Valida la operación', time:'5–10 min', desc:'Aplica control interno, trazabilidad y documentación en modo demo.'},
    {icon:'🎤', title:'Defiende la decisión', time:'8–15 min', desc:'Argumenta con la fórmula Decisión + Dato + Razón y reflexiona.'}
  ];
  const GOALS = {
    1:'Identificar tres criptoactivos con señales distintas y justificar su selección usando datos verificables.',
    2:'Distribuir USD 100 000 con coherencia entre riesgo, diversificación, liquidez y límites de pérdida.',
    3:'Ejecutar y monitorear un portafolio virtual aplicando take-profit y stop-loss.',
    4:'Documentar una operación demo mediante validación cruzada, presupuesto y evidencia verificable.',
    5:'Comunicar una decisión financiera con datos, reconocer riesgos y explicar el aprendizaje logrado.'
  };
  const AWARDS = {1:[100,'Misión 1 completada'],2:[150,'Estrategia formalizada'],3:[120,'Misión 3 completada'],4:[80,'Validación operativa completada'],5:[150,'Defensa ante el comité']};
  const COLORS=['#F7931A','#7C6CF0','#2BD98F'];
  let pendingMission=0;

  function normalizeFlexibleState(){
    S.teamName=S.teamName||S.name||'';
    S.members=Array.isArray(S.members)?S.members.slice(0,4):['','','',''];
    while(S.members.length<4)S.members.push('');
    S.objectives=S.objectives&&typeof S.objectives==='object'?S.objectives:{};
    S.starterUsed=S.starterUsed||{};
  }
  normalizeFlexibleState();

  function setField(id,val){const e=document.getElementById(id);if(e)e.value=val||'';}
  function hydrateTeamFields(){
    setField('inpName',S.teamName||S.name);
    S.members.forEach((v,i)=>setField('member'+(i+1),v));
  }
  hydrateTeamFields();

  window.startChallenge=function(){
    const team=document.getElementById('inpName').value.trim();
    const members=[1,2,3,4].map(i=>document.getElementById('member'+i).value.trim()).filter(Boolean);
    if(!team){toast('✋ Escribe un nombre para el equipo');return;}
    if(!members.length){toast('✋ Registra al menos un integrante');return;}
    if(!S.role){toast('✋ Selecciona la carrera responsable principal');return;}
    S.name=team;S.teamName=team;S.members=[...members,'','','',''].slice(0,4);setTeamPill();
    if(!S.challengeStarted){S.challengeStarted=true;addXp(30,'Desafío aceptado');}
    save();openMissionHub();
  };

  function starterBasket(){
    if(S.picks.length===3)return false;
    S.picks=['BTC','ETH','USDT'];
    S.just.BTC=S.just.BTC||'Activo de mayor capitalización y referencia principal del mercado.';
    S.just.ETH=S.just.ETH||'Segundo activo por capitalización y plataforma con utilidad tecnológica.';
    S.just.USDT=S.just.USDT||'Moneda estable usada como refugio y soporte de liquidez.';
    return true;
  }
  function starterStrategy(){
    starterBasket();
    const sum=S.picks.reduce((a,s)=>a+(+S.alloc[s]||0),0)+(+S.reserve||0);
    if(sum!==100){S.reserve=15;S.alloc={...S.alloc,BTC:35,ETH:30,USDT:20};}
    S.risk=S.risk||'Moderado';S.trust=S.trust||'BTC';S.trustWhy=S.trustWhy||'Combina liderazgo por capitalización, liquidez y reconocimiento global.';S.stopG=S.stopG||10;
  }
  function ensureMissionReady(i){
    normalizeFlexibleState();
    if(i===2){const used=starterBasket();buildM2();if(used&&!S.starterUsed[2]){S.starterUsed[2]=true;toast('🧰 Modo autónomo: cargué BTC, ETH y USDT como canasta inicial. Puedes modificarlos al completar la Misión 1.');}}
    if(i===3){starterStrategy();buildM2();if(!S.starterUsed[3]){S.starterUsed[3]=true;toast('🧰 Modo autónomo: cargué una estrategia moderada editable para iniciar la simulación.');}}
  }
  window.go=function(i){
    if(i>=1&&i<=5&&!S.name){toast('👥 Registra primero tu equipo en la historia inicial');legacyGo(0);storyStep(3);return;}
    ensureMissionReady(i);legacyGo(i);injectMissionFlexNote(i);
  };

  window.renderRail=function(){
    normalizeFlexibleState();
    const r=document.getElementById('rail');
    r.innerHTML=MISSIONS.map((m,i)=>{
      const done=i>0&&i<6&&S.m[i-1];
      const sheeted=i>0&&i<6&&!!S.objectives[i];
      const unlocked=i===0||(S.name&&i>=1&&i<=5)||(i===6&&S.m.some(Boolean));
      const action=i>=1&&i<=5?`openMission(${i})`:`go(${i})`;
      return `<button class="${S.screen===i?'active':''} ${done?'done':''} ${sheeted?'sheeted':''} ${unlocked?'':'locked'}" onclick="${unlocked?action:''}" ${unlocked?'':'disabled'} title="${sheeted?'Ficha de objetivo guardada':'Misión disponible de forma independiente'}"><span class="n">${done?'✓':(i===0?'★':(i===6?'🏆':i))}</span>${m.icon} ${m.n}</button>`;
    }).join('');
    document.getElementById('progFill').style.width=(S.m.filter(Boolean).length/5*100)+'%';
  };

  function injectMissionFlexNote(i){
    if(i<1||i>5)return;const s=document.getElementById('s'+i);if(!s||s.querySelector('.mission-flex-note'))return;
    const title=s.querySelector('.title');if(!title)return;
    const note=document.createElement('div');note.className='mission-flex-note';note.innerHTML=`<div class="mficon">🧩</div><div><b>Misión autónoma y complementaria</b><p>Puedes resolverla sin completar las anteriores. Si ya existen decisiones previas, se reutilizan; si no, el simulador carga un kit inicial editable. Al terminar, completarás la Ficha de Objetivo del Equipo y volverás al mapa.</p></div>`;
    const sub=s.querySelector('.sub');(sub||title).insertAdjacentElement('afterend',note);
  }
  [1,2,3,4,5].forEach(injectMissionFlexNote);

  window.openMissionHub=function(){
    if(!S.name){toast('👥 Registra tu equipo para desbloquear el mapa');go(0);storyStep(3);return;}
    normalizeFlexibleState();
    const grid=document.getElementById('missionGrid');
    grid.innerHTML=MISSION_META.slice(1).map((m,idx)=>{const i=idx+1,done=S.m[i-1],sheet=!!S.objectives[i];return `<article class="mission-card ${done?'done':''}"><div class="mc-top"><span class="mc-icon">${m.icon}</span><span class="mc-status">${done?'COMPLETADA':sheet?'FICHA GUARDADA':'DISPONIBLE'}</span></div><h4>Misión ${i} · ${m.title}</h4><p>${m.desc}</p><div class="mc-time">${m.time} · independiente</div><button class="btn ${done?'':'gold'}" onclick="openMission(${i})">${done?'Revisar / mejorar':'Iniciar misión'} →</button></article>`;}).join('');
    const done=S.m.filter(Boolean).length,sheets=Object.keys(S.objectives).length;
    document.getElementById('hubProgressFill').style.width=(done/5*100)+'%';document.getElementById('hubProgressText').textContent=`${done}/5 misiones completadas`;document.getElementById('hubSheetText').textContent=`${sheets} ficha${sheets===1?'':'s'} objetivo`;
    document.getElementById('hubResultsBtn').disabled=done===0;document.getElementById('missionHubBk').classList.add('on');
  };
  window.closeMissionHub=function(){document.getElementById('missionHubBk').classList.remove('on');};
  window.openMission=function(i){closeMissionHub();go(i);};

  function validateM1(){const miss=[];if(!S.q1ok)miss.push('Tarea 1');if(!S.q2ok)miss.push('Tarea 2');if(!S.q3ok)miss.push('Tarea 3');if(S.newsSel<0)miss.push('Tarea 4');if(!checkT5())miss.push('Tarea 5');if(miss.length){toast('✋ Falta completar '+miss[0]);return false;}return true;}
  window.completeM1=function(){if(validateM1())showObjectiveSheet(1);};
  window.completeM2=function(){
    starterBasket();const tot=S.picks.reduce((a,s)=>a+(S.alloc[s]||0),0)+S.reserve;
    if(!S.risk){toast('✋ Paso 1: selecciona tu perfil de riesgo');return;}if(tot!==100){toast(`✋ El total debe ser 100% (llevas ${tot}%)`);return;}
    for(const s of S.picks){const v=S.alloc[s]||0;if(v>60){toast(`✋ ${s} supera el 60%`);return;}if(v<5){toast(`✋ ${s} necesita al menos 5%`);return;}}
    if(!S.trust){toast('✋ Elige el activo de mayor confianza');return;}if((S.trustWhy||'').trim().length<4){toast('✋ Justifica el activo de confianza con una frase completa');return;}if(!S.stopG){toast('✋ Define el límite de pérdida');return;}showObjectiveSheet(2);
  };
  window.completeM3=function(){if(S.day<7){toast('✋ Completa los 7 días de simulación');return;}showObjectiveSheet(3);};
  window.completeM4=function(){if(!S.kiosk.every(Boolean)){toast('✋ Faltan los tres sellos de validación');return;}showObjectiveSheet(4);};
  window.completeM5=function(){
    const ids=['c1','c2','c3','c4','c5','c6'];for(let i=0;i<ids.length;i++){const v=document.getElementById(ids[i]).value.trim();if(v.length<15){toast(`✋ Completa mejor la respuesta ${i+1}`);return;}S.answers[ids[i]]=v;}
    const w=countWords();if(w<100||w>150){toast(`✋ Ajusta la reflexión a 100–150 palabras (tienes ${w})`);return;}S.bonus=document.getElementById('bonusTxt').value.trim();showObjectiveSheet(5);
  };

  function objectiveDefault(m){
    starterStrategy();
    const existing=S.objectives[m];if(existing)return JSON.parse(JSON.stringify(existing));
    const rows=S.picks.slice(0,3).map((s,i)=>{const c=COINS.find(x=>x.sym===s),b=S.buys[s],pct=+S.alloc[s]||[35,30,20][i],price=b?.price||c.p,amount=CAPITAL*pct/100;return {crypto:s,price:+price.toFixed(price<1?6:2),amount:+amount.toFixed(2),qty:amount/price,pct,trend:c.c7>1?'Sube':c.c7<-1?'Baja':'Estable',risk:VOLTXT[c.vol],tp:b?.tp||15,sl:b?.sl||S.stopG||10,reason:S.just[s]||`Seleccionado por su ${c.vol<=1?'estabilidad relativa':'combinación de tendencia y potencial'}, considerando una capitalización de ${fmtCap(c.cap)}.`};});
    return {mission:m,goal:GOALS[m],capital:CAPITAL,target:m===1?5:m===2?8:m===3?10:m===4?4:8,strategy:(S.risk||'Moderado').replace('Moderado','Moderada').replace('Agresivo','Agresiva').replace('Conservador','Conservadora'),team:S.teamName||S.name,members:S.members,rows};
  }
  window.showObjectiveSheet=function(m){pendingMission=m;const o=objectiveDefault(m);document.getElementById('objectiveStamp').innerHTML=`MISIÓN<br>${m}`;setField('objGoal',o.goal);setField('objTarget',o.target);setField('objTeam',o.team);document.getElementById('objStrategy').value=o.strategy||'Moderada';[1,2,3,4].forEach(i=>setField('objMember'+i,(o.members||[])[i-1]||''));renderObjectiveRows(o.rows);document.getElementById('objectiveBk').classList.add('on');objectiveRecalc();};
  window.closeObjectiveSheet=function(){document.getElementById('objectiveBk').classList.remove('on');};

  function coinOptions(selected){return COINS.map(c=>`<option value="${c.sym}" ${c.sym===selected?'selected':''}>${c.sym} · ${c.name}</option>`).join('');}
  function renderObjectiveRows(rows){document.getElementById('objectiveRows').innerHTML=rows.map((r,i)=>`<tr data-row="${i}"><td class="calc">${i+1}</td><td><select class="or-coin" onchange="objectiveCoinChanged(${i})">${coinOptions(r.crypto)}</select></td><td><input class="or-price" type="number" min="0.000001" step="any" value="${r.price}" oninput="objectiveRecalc()"></td><td><input class="or-amount" type="number" min="0" max="100000" step="100" value="${r.amount}" oninput="objectiveRecalc()"></td><td class="calc or-qty">${fmt(r.qty,6)}</td><td class="calc or-pct">${r.pct.toFixed(1)}%</td><td><select class="or-trend"><option ${r.trend==='Sube'?'selected':''}>⬆ Sube</option><option ${r.trend==='Estable'?'selected':''}>➡ Estable</option><option ${r.trend==='Baja'?'selected':''}>⬇ Baja</option></select></td><td><select class="or-risk"><option ${r.risk==='Baja'?'selected':''}>Bajo</option><option ${r.risk==='Media'?'selected':''}>Medio</option><option ${r.risk==='Muy alta'?'selected':''}>Alto</option></select></td><td><input class="or-tp" type="number" min="1" max="100" value="${r.tp}"></td><td><input class="or-sl" type="number" min="1" max="50" value="${r.sl}"></td><td><textarea class="or-reason" placeholder="Dato + criterio + relación con el objetivo">${r.reason}</textarea></td></tr>`).join('');}
  window.objectiveCoinChanged=function(i){const tr=document.querySelector(`#objectiveRows tr[data-row="${i}"]`),sym=tr.querySelector('.or-coin').value,c=COINS.find(x=>x.sym===sym);tr.querySelector('.or-price').value=c.p.toFixed(c.p<1?6:2);tr.querySelector('.or-trend').value=c.c7>1?'⬆ Sube':c.c7<-1?'⬇ Baja':'➡ Estable';tr.querySelector('.or-risk').value=c.vol<=1?'Bajo':c.vol===2?'Medio':'Alto';objectiveRecalc();};
  window.objectiveRecalc=function(){
    let amount=0;const seg=[];document.querySelectorAll('#objectiveRows tr').forEach((tr,i)=>{const a=+tr.querySelector('.or-amount').value||0,p=+tr.querySelector('.or-price').value||0,pct=a/CAPITAL*100;amount+=a;tr.querySelector('.or-qty').textContent=p?fmt(a/p,6):'0';tr.querySelector('.or-pct').textContent=pct.toFixed(1)+'%';seg.push({pct,sym:tr.querySelector('.or-coin').value,col:COLORS[i]});});
    const pct=amount/CAPITAL*100,res=Math.max(0,100-pct);document.getElementById('objTotalAmount').textContent=fmtUsd(amount);document.getElementById('objTotalPct').textContent=pct.toFixed(1)+'%';document.getElementById('objReserve').textContent=res.toFixed(1)+'%';const ok=amount>0&&amount<=CAPITAL;document.getElementById('objStatus').textContent=ok?'Coherente':'Revisar';document.getElementById('objStatus').style.color=ok?'var(--up)':'var(--down)';document.getElementById('allocationVisual').innerHTML=seg.map(x=>`<i style="width:${Math.min(x.pct,100)}%;background:${x.col}"></i>`).join('')+`<i style="width:${res}%;background:#34415c"></i>`;document.getElementById('allocationLegend').innerHTML=seg.map(x=>`<span style="color:${x.col}">● ${x.sym} ${x.pct.toFixed(1)}%</span>`).join('')+`<span>● Reserva ${res.toFixed(1)}%</span>`;
  };
  function collectObjective(){const rows=[...document.querySelectorAll('#objectiveRows tr')].map(tr=>{const sym=tr.querySelector('.or-coin').value,price=+tr.querySelector('.or-price').value||0,amount=+tr.querySelector('.or-amount').value||0,c=COINS.find(x=>x.sym===sym);return {crypto:sym,price,amount,qty:price?amount/price:0,pct:amount/CAPITAL*100,trend:tr.querySelector('.or-trend').value.replace(/^.\s/,''),risk:tr.querySelector('.or-risk').value,tp:+tr.querySelector('.or-tp').value||0,sl:+tr.querySelector('.or-sl').value||0,reason:tr.querySelector('.or-reason').value.trim(),name:c.name};});return {mission:pendingMission,goal:document.getElementById('objGoal').value.trim(),capital:CAPITAL,target:+document.getElementById('objTarget').value||0,strategy:document.getElementById('objStrategy').value,team:document.getElementById('objTeam').value.trim(),members:[1,2,3,4].map(i=>document.getElementById('objMember'+i).value.trim()).filter(Boolean),rows,savedAt:Date.now()};}
  window.saveObjectiveSheet=function(){const o=collectObjective(),amount=o.rows.reduce((a,r)=>a+r.amount,0);if(o.goal.length<20){toast('✋ Explica el objetivo del equipo con al menos una frase completa');return;}if(!o.team){toast('✋ Registra el nombre del equipo');return;}if(!o.members.length){toast('✋ Registra al menos un integrante');return;}if(o.rows.some(r=>!r.crypto||r.amount<=0||r.price<=0||r.reason.length<12)){toast('✋ Completa las tres decisiones: activo, precio, monto y motivo');return;}if(amount>CAPITAL){toast('✋ El monto invertido supera USD 100 000');return;}
    S.objectives[pendingMission]=o;S.teamName=o.team;S.name=o.team;S.members=[...o.members,'','','',''].slice(0,4);if(!S.m[pendingMission-1]){S.m[pendingMission-1]=true;const [xp,msg]=AWARDS[pendingMission];addXp(xp,msg);if(pendingMission===2&&S.reserve>=10&&S.reserve<=25)addXp(30,'Bonus: liquidez saludable');if(pendingMission===5&&S.bonus.length>20)addXp(50,'Bonus: visión USD 50 000');}
    save();closeObjectiveSheet();renderRail();toast('▣ Ficha de objetivo guardada. La misión ya dejó una evidencia visible.');setTimeout(openMissionHub,450);
  };
  window.printObjectiveSheet=function(){const o=collectObjective();document.getElementById('report').innerHTML=objectivePrintHtml(o,true);window.print();};
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function objectivePrintHtml(o,solo){const rows=o.rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name||r.crypto)} (${esc(r.crypto)})</td><td>${fmt(r.price,6)}</td><td>${fmtUsd(r.amount)}</td><td>${fmt(r.qty,6)}</td><td>${r.pct.toFixed(1)}%</td><td>${esc(r.trend)}</td><td>${esc(r.risk)}</td><td>+${r.tp}%</td><td>−${r.sl}%</td><td>${esc(r.reason)}</td></tr>`).join('');return `${solo?`<img src="${document.querySelector('.logoplate img').src}" style="height:48px;margin-bottom:8px">`:''}<h1>Ficha de Objetivo del Equipo · Misión ${o.mission}</h1><h2>Crypto Challenge FCEE · UNIFRANZ · Evidencia de aprendizaje significativo</h2><p><b>Objetivo:</b> ${esc(o.goal)}</p><p><b>Capital inicial:</b> USD 100 000 · <b>Meta:</b> ${o.target}% · <b>Estrategia:</b> ${esc(o.strategy)}</p><p><b>Equipo:</b> ${esc(o.team)} · <b>Integrantes:</b> ${o.members.map(esc).join(' · ')}</p><table><tr><th>N.º</th><th>Criptomoneda</th><th>Precio</th><th>Monto</th><th>Cantidad</th><th>%</th><th>Tendencia</th><th>Riesgo</th><th>TP</th><th>SL</th><th>Motivo</th></tr>${rows}</table>`;}

  window.buildReport=function(v,d){legacyBuildReport(v,d);const saved=Object.keys(S.objectives).sort((a,b)=>a-b);if(saved.length){document.getElementById('report').insertAdjacentHTML('beforeend','<h3>Fichas de Objetivo por misión</h3>'+saved.map(k=>objectivePrintHtml(S.objectives[k],false)).join('<hr style="margin:18px 0">'));}};
  window.renderFinal=function(){
    starterStrategy();legacyRenderFinal();const done=S.m.filter(Boolean).length;document.getElementById('finMis').textContent=`${done} / 5`;if(!Object.keys(S.buys).length){document.getElementById('finVal').textContent='USD 100 000';document.getElementById('finVal').style.color='var(--gold)';document.getElementById('finDelta').textContent='Capital de referencia · aún no se ejecutó la Misión 3';}
    if(done<5)document.getElementById('verdict').innerHTML=`"El equipo completó <b style='color:var(--up)'>${done} misión${done===1?'':'es'}</b> y dejó ${Object.keys(S.objectives).length} evidencia${Object.keys(S.objectives).length===1?'':'s'} documentada${Object.keys(S.objectives).length===1?'':'s'}. En una demostración breve, esto permite ver aprendizaje significativo sin exigir un recorrido lineal. El mapa queda abierto para seguir construyendo."`;
  };

  // Safer wording in runtime controls.
  const kDoc=document.getElementById('kioskDoc');if(kDoc)kDoc.setAttribute('placeholder','Ej.: Demo #4521 · 10:35 · orden simulada de BTC · captura guardada');
  document.querySelectorAll('.navbtns .btn').forEach(b=>{if(b.textContent.includes('Convencer al comité'))b.textContent='Completar ficha objetivo';});
  hydrateTeamFields();renderRail();
})();
