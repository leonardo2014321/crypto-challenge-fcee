(function(){
  'use strict';

  function safeKioskState(){
    if(!Array.isArray(S.kiosk)) S.kiosk=[false,false,false];
    S.kiosk=[Boolean(S.kiosk[0]),Boolean(S.kiosk[1]),Boolean(S.kiosk[2])];
    S.kioskMode=S.kioskMode||'demo';
    S.kioskAsset=S.kioskAsset||'BTC';
    S.newsReason=S.newsReason||'';
  }

  function impactMeta(n){
    if(n.t==='pos') return {label:'Impacto alcista', cls:'t-pos', decision:'Podría aumentar la demanda. El equipo debe decidir si entra de forma gradual y sin abandonar sus límites de riesgo.'};
    if(n.t==='neg') return {label:'Impacto bajista', cls:'t-neg', decision:'Podría aumentar la incertidumbre. El equipo puede protegerse con reserva, menor exposición y stop-loss.'};
    return {label:'Impacto mixto', cls:'t-neu', decision:'Su efecto depende del contexto. Conviene contrastar datos antes de modificar la distribución del capital.'};
  }

  function buildQ4Choices(){
    const host=document.getElementById('q4NewsChoices');
    if(!host) return;
    host.innerHTML=NEWS.map((n,i)=>{
      const tag=n.t==='pos'?'Alcista':n.t==='neg'?'Bajista':'Neutro';
      return `<button type="button" class="q4-news-option" data-i="${i}" onclick="newsPick(${i},this)" aria-pressed="false"><span class="q4-tag t-${n.t}">${tag}</span><span class="q4-copy"><b>${n.h}</b><small>${n.s}</small></span></button>`;
    }).join('');
    const reason=document.getElementById('q4Reason');
    if(reason){
      reason.value=S.newsReason||'';
      reason.addEventListener('input',()=>{S.newsReason=reason.value;save();});
    }
    syncQ4UI();
  }

  function syncQ4UI(){
    document.querySelectorAll('.newsitem,.q4-news-option').forEach(el=>{
      const selected=Number(el.dataset.i)===Number(S.newsSel);
      el.classList.toggle('sel',selected);
      if(el.matches('.q4-news-option')) el.setAttribute('aria-pressed',selected?'true':'false');
    });
    const panel=document.getElementById('q4SelectionPanel');
    const hint=document.getElementById('q4hint');
    if(!(Number.isInteger(S.newsSel)&&S.newsSel>=0&&S.newsSel<NEWS.length)){
      if(panel) panel.hidden=true;
      if(hint){hint.className='hint';hint.textContent='Selecciona una tarjeta. No necesitas desplazarte a otra sección para completar esta tarea.';}
      if(document.getElementById('t4')) setTask('t4',false);
      return;
    }
    const n=NEWS[S.newsSel], meta=impactMeta(n);
    if(panel) panel.hidden=false;
    const badge=document.getElementById('q4ImpactBadge');
    if(badge){badge.textContent=meta.label;badge.className=meta.cls;}
    const title=document.getElementById('q4SelectedTitle'); if(title) title.textContent=n.h;
    const why=document.getElementById('q4SelectedWhy'); if(why) why.innerHTML=`${n.why}<br><b style="color:var(--txt)">Decisión posible:</b> ${meta.decision}`;
    if(hint){hint.className='hint ok';hint.innerHTML='✓ <b>Tarea 4 completada.</b> La noticia quedó seleccionada también en el radar superior. Puedes cambiarla cuando quieras.';}
    if(document.getElementById('t4')) setTask('t4',true);
  }

  window.newsPick=function(i){
    i=Number(i);
    if(!Number.isInteger(i)||i<0||i>=NEWS.length){toast('No pude identificar esa noticia. Prueba con otra tarjeta.');return;}
    S.newsSel=i;
    if(!S.newsReason){
      const n=NEWS[i], m=impactMeta(n);
      S.newsReason=`La noticia puede influir en nuestra estrategia porque ${m.decision.charAt(0).toLowerCase()+m.decision.slice(1)}`;
      const reason=document.getElementById('q4Reason'); if(reason) reason.value=S.newsReason;
    }
    syncQ4UI();
    save();
    toast('📰 Noticia analizada. La Tarea 4 quedó completada.');
  };

  function modeLabel(v){return v==='simulada'?'orden simulada':v==='institucional'?'kiosco institucional':'demo guiada';}

  function syncKioskUI(){
    safeKioskState();
    const mode=document.getElementById('kioskMode'), asset=document.getElementById('kioskAsset');
    if(mode) mode.value=S.kioskMode;
    if(asset) asset.value=S.kioskAsset;
    for(let i=1;i<=3;i++){
      const ok=S.kiosk[i-1], task=document.getElementById('k'+i), btn=task?.querySelector('.action-opt'), fb=document.getElementById('kioskFb'+i);
      if(task) setTask('k'+i,ok);
      if(btn){btn.classList.toggle('sel',ok);btn.textContent=ok?(i===1?'✓ Activo validado':i===2?'✓ Monto confirmado':'✓ Evidencia registrada'):(i===1?'Confirmar activo analizado':i===2?'Confirmar monto dentro del plan':'Confirmar registro y evidencia');}
      if(fb){
        fb.className='kiosk-feedback'+(ok?' ok':'');
        if(ok) fb.textContent=i===1?`${S.kioskAsset} fue validado por ICO.`:i===2?`${S.kioskAmt||0} fue confirmado dentro del plan.`:`Registro guardado: ${S.kioskDoc||'evidencia demo'}`;
      }
    }
    const n=S.kiosk.filter(Boolean).length;
    const fill=document.getElementById('kioskProgressFill'); if(fill) fill.style.width=(n/3*100)+'%';
    const text=document.getElementById('kioskProgressText'); if(text) text.textContent=`${n} de 3 sellos`;
    const next=document.getElementById('kioskNextHint');
    if(next) next.textContent=n===0?'Comienza validando el activo.':n===1?'Ahora confirma el monto.':n===2?'Falta documentar la evidencia.':'Protocolo completo. Ya puedes cerrar la misión.';
    const done=document.getElementById('m4completeBtn');
    if(done){done.classList.toggle('ready',n===3);done.textContent=n===3?'✓ Cerrar misión y completar ficha':'Revisar y cerrar Misión 4';}
  }

  function focusKioskStep(n,msg){
    const task=document.getElementById('k'+n); if(!task)return;
    task.classList.remove('kiosk-focus'); void task.offsetWidth; task.classList.add('kiosk-focus');
    task.scrollIntoView({behavior:'smooth',block:'center'});
    const fb=document.getElementById('kioskFb'+n); if(fb){fb.className='kiosk-feedback err';fb.textContent=msg;}
  }

  window.kioskCheck=function(n){
    safeKioskState();
    n=Number(n);
    const amount=document.getElementById('kioskAmt')?.value.trim()||'';
    const doc=document.getElementById('kioskDoc')?.value.trim()||'';
    S.kioskMode=document.getElementById('kioskMode')?.value||'demo';
    S.kioskAsset=document.getElementById('kioskAsset')?.value||'BTC';
    if(n===1){
      if(!S.kioskAsset){focusKioskStep(1,'Selecciona el activo que será documentado.');return;}
    }
    if(n===2){
      if(!(Number(amount)>0)){focusKioskStep(2,'Escribe un monto virtual mayor que cero. Ejemplo: 20.');toast('✋ Falta registrar el monto virtual');return;}
      S.kioskAmt=amount;
    }
    if(n===3){
      if(doc.length<4){focusKioskStep(3,'Escribe al menos una referencia breve: modalidad, activo y hora o número demo.');toast('✋ La evidencia necesita una referencia un poco más completa');return;}
      S.kioskDoc=doc;
    }
    S.kiosk[n-1]=true;
    syncKioskUI();save();
    const count=S.kiosk.filter(Boolean).length;
    toast(count===3?'🤝 Protocolo completo: los tres sellos están activos.':`✓ Sello ${n} guardado. Continúa con el siguiente paso.`);
  };

  window.fillDemoOperation=function(){
    safeKioskState();
    const mode=document.getElementById('kioskMode'),asset=document.getElementById('kioskAsset'),amount=document.getElementById('kioskAmt'),doc=document.getElementById('kioskDoc');
    if(mode) mode.value='demo'; if(asset) asset.value='BTC'; if(amount) amount.value='20';
    const stamp=new Date().toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});
    if(doc) doc.value=`DEMO-BTC-${Date.now().toString().slice(-5)} · ${stamp} · orden educativa sin dinero real`;
    S.kioskMode='demo';S.kioskAsset='BTC';S.kioskAmt='20';S.kioskDoc=doc?.value||'';S.kiosk=[false,false,false];
    syncKioskUI();save();toast('✨ Ejemplo cargado. Ahora activa los tres sellos para comprender el control cruzado.');
  };

  window.resetKioskTask=function(){
    safeKioskState();S.kiosk=[false,false,false];S.kioskAmt='';S.kioskDoc='';S.kioskMode='demo';S.kioskAsset='BTC';
    const amount=document.getElementById('kioskAmt'),doc=document.getElementById('kioskDoc');if(amount)amount.value='';if(doc)doc.value='';
    syncKioskUI();save();toast('↻ Misión 4 reiniciada. Puedes comenzar nuevamente.');
  };

  window.completeM4=function(){
    safeKioskState();
    const first=S.kiosk.findIndex(v=>!v);
    if(first!==-1){
      const messages=['Primero confirma que el activo fue analizado.','Registra y confirma el monto virtual.','Documenta la operación demo con una referencia breve.'];
      focusKioskStep(first+1,messages[first]);toast(`✋ Falta el sello ${first+1} de 3`);return;
    }
    S.kioskMode=document.getElementById('kioskMode')?.value||S.kioskMode;
    S.kioskAsset=document.getElementById('kioskAsset')?.value||S.kioskAsset;
    S.kioskAmt=document.getElementById('kioskAmt')?.value||S.kioskAmt;
    S.kioskDoc=document.getElementById('kioskDoc')?.value||S.kioskDoc;
    save();showObjectiveSheet(4);
  };

  function bindKioskInputs(){
    safeKioskState();
    const mode=document.getElementById('kioskMode'),asset=document.getElementById('kioskAsset'),amount=document.getElementById('kioskAmt'),doc=document.getElementById('kioskDoc');
    if(mode){mode.value=S.kioskMode;mode.addEventListener('change',()=>{S.kioskMode=mode.value;save();});}
    if(asset){asset.value=S.kioskAsset;asset.addEventListener('change',()=>{S.kioskAsset=asset.value;S.kiosk[0]=false;syncKioskUI();save();});}
    if(amount){amount.value=S.kioskAmt||amount.value;amount.addEventListener('input',()=>{S.kioskAmt=amount.value;S.kiosk[1]=false;syncKioskUI();save();});}
    if(doc){doc.value=S.kioskDoc||doc.value;doc.addEventListener('input',()=>{S.kioskDoc=doc.value;S.kiosk[2]=false;syncKioskUI();save();});}
    syncKioskUI();
  }

  function injectPrintStyle(){
    if(document.getElementById('v4-print-style')) return;
    const st=document.createElement('style');
    st.id='v4-print-style';
    st.textContent=`
      @media print{
        @page{ margin:14mm; }
        #report{ width:100%; max-width:100%; }
        #report table{ width:100% !important; max-width:100% !important; table-layout:fixed !important; border-collapse:collapse; }
        #report th, #report td{
          word-wrap:break-word; overflow-wrap:break-word; white-space:normal;
          font-size:10px; line-height:1.3; padding:4px 5px; border:1px solid #999;
        }
        #report th:last-child, #report td:last-child{ width:18%; }
        #report img{ max-width:160px; height:auto; }
        #report h1{ font-size:16px; }
        #report h2{ font-size:12px; }
        #report p{ font-size:11px; }
      }
    `;
    document.head.appendChild(st);
  }

  function injectTickerStyle(){
    if(document.getElementById('v4-ticker-style')) return;
    const st=document.createElement('style');
    st.id='v4-ticker-style';
    st.textContent=`
      #ticker .tk-item{ display:inline-flex; align-items:center; gap:7px; margin:0 16px; }
      #ticker .tk-sym{ font-weight:800; font-size:11px; padding:2px 9px; border-radius:999px; letter-spacing:.3px; }
      #ticker .tk-price{ font-variant-numeric:tabular-nums; opacity:.92; }
      #ticker .tk-badge{ font-weight:700; font-size:11px; padding:2px 9px; border-radius:999px; }
      #ticker .tk-badge-up{ background:rgba(43,217,143,.18); color:var(--up,#2BD98F); }
      #ticker .tk-badge-down{ background:rgba(255,90,110,.18); color:var(--down,#FF5A6E); }
      #ticker .tk-brand{ font-weight:700; letter-spacing:.4px; }
      .ticker-wrap{ position:relative; }
      .ticker-wrap::before, .ticker-wrap::after{ content:''; position:absolute; top:0; bottom:0; width:44px; z-index:2; pointer-events:none; }
      .ticker-wrap::before{ left:0; background:linear-gradient(90deg, #05080F 15%, transparent); }
      .ticker-wrap::after{ right:0; background:linear-gradient(270deg, #05080F 15%, transparent); }
    `;
    document.head.appendChild(st);
  }

  function injectFieldOkStyle(){
    if(document.getElementById('v4-field-ok-style')) return;
    const st=document.createElement('style');
    st.id='v4-field-ok-style';
    st.textContent='.f4-field-ok{border:2px solid var(--up,#2BD98F) !important;background:rgba(43,217,143,.08) !important;transition:border-color .2s,background .2s}';
    document.head.appendChild(st);
  }

  function bindLiveFieldFeedback(){
    injectFieldOkStyle();
    const ids=['trustWhy','c1','c2','c3','c4','c5','c6'];
    const nameIds=['inpName','member1','member2','member3','member4'];
    setInterval(()=>{
      ids.forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.classList.toggle('f4-field-ok', el.value.trim().length>=4);
      });
      nameIds.forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.classList.toggle('f4-field-ok', el.value.trim().length>=1);
      });
      document.querySelectorAll('#q5just textarea[data-s]').forEach(el=>{
        el.classList.toggle('f4-field-ok', el.value.trim().length>=4);
      });
    }, 400);
  }

  const START_META={
    1:{icon:'🔎',title:'Explora el mercado',sub:'Compararás datos de mercado y elegirás tres criptoactivos con evidencia.'},
    2:{icon:'🧩',title:'Diseña la estrategia',sub:'Repartirás el capital y fijarás tus límites de riesgo.'},
    3:{icon:'⚡',title:'Prueba tus decisiones',sub:'Ejecutarás compras virtuales y avanzarás siete jornadas.'},
    4:{icon:'🛡️',title:'Valida la operación',sub:'Aplicarás tres controles de equipo y dejarás evidencia.'},
    5:{icon:'🎙️',title:'Explica tu decisión',sub:'Construirás argumentos con datos y una reflexión final.'}
  };

  function celebrateMissionStart(m){
    const meta=START_META[m]; if(!meta) return;
    const badge=document.getElementById('msBadge'); if(badge) badge.textContent=meta.icon;
    const title=document.getElementById('msTitle'); if(title) title.textContent=`Misión ${m} · ${meta.title}`;
    const sub=document.getElementById('msSub'); if(sub) sub.textContent=meta.sub;
    const bk=document.getElementById('missionStartBk'); if(bk) bk.classList.add('on');
  }
  window.closeMissionStart=function(){ const bk=document.getElementById('missionStartBk'); if(bk) bk.classList.remove('on'); };

  function bindMissionStartPopup(){
    const btn=document.getElementById('msStartBtn');
    if(btn) btn.onclick=closeMissionStart;
    const legacyOpenMission=window.openMission;
    if(typeof legacyOpenMission==='function'){
      window.openMission=function(i){
        legacyOpenMission(i);
        celebrateMissionStart(i);
      };
    }
  }

  safeKioskState();
  buildQ4Choices();
  bindKioskInputs();
  bindLiveFieldFeedback();
  injectPrintStyle();
  injectTickerStyle();
  bindMissionStartPopup();
  if(typeof renderTicker==='function') renderTicker();
})();