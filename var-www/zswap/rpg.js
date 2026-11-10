(() => {
  const $=s=>document.querySelector(s), K="zs_rpg", esc=s=>String(s).replace(/[&<>"']/g,c=>"&#"+c.charCodeAt(0)+";");
  let S=JSON.parse(localStorage.getItem(K)||"null");
  const save=()=>localStorage.setItem(K,JSON.stringify(S)), say=t=>$("#msg").innerHTML=t, r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
  const need=()=>S.lv*20;
  function confetti(){ if(matchMedia("(prefers-reduced-motion: reduce)").matches) return; const c=$("#cf"),x=c.getContext("2d");c.width=innerWidth/4|0;c.height=innerHeight/4|0;
    const C=["#ffc93c","#a855f7","#22d3ee","#fff"],P=Array.from({length:60},()=>({x:c.width/2,y:c.height/3,vx:(Math.random()-.5)*2.5,vy:-Math.random()*3,c:C[Math.random()*4|0]}));let f=0;
    (function t(){x.clearRect(0,0,c.width,c.height);for(const p of P){p.vy+=.08;p.x+=p.vx;p.y+=p.vy;x.fillStyle=p.c;x.fillRect(p.x|0,p.y|0,2,2);} if(++f<100)requestAnimationFrame(t);else x.clearRect(0,0,c.width,c.height);})(); }
  function ask(){ say("Ciao! Io sono il pinguino ZSwap 🐧 Come ti chiami?");
    $("#game").innerHTML=`<div class="row"><input id="nm" maxlength="20" placeholder="Il tuo nome"><button class="btn" id="ok">Inizia</button></div>`;
    const go=()=>{ const n=$("#nm").value.trim(); if(!n) return; S={name:n,lv:1,hp:20,xp:0,z:0}; save(); render(`Piacere, <b>${esc(n)}</b>! Pronto per l'avventura sul ghiaccio?`); };
    $("#ok").onclick=go; $("#nm").onkeydown=e=>{ if(e.key==="Enter") go(); }; }
  function render(t){ if(t) say(t); const mh=20+S.lv*5;
    $("#game").innerHTML=`<b>${esc(S.name)}</b> · Livello ${S.lv} · 🪙 ${S.z} monete Z (finte)
     <div class="small">HP ${S.hp}/${mh}</div><div class="bar hp"><i style="width:${S.hp/mh*100}%"></i></div>
     <div class="small">XP ${S.xp}/${need()}</div><div class="bar xp"><i style="width:${S.xp/need()*100}%"></i></div>
     <div class="acts"><button class="btn" data-a="ex">🧊 Esplora il ghiaccio</button><button class="btn ghost" data-a="co">🪙 Raccogli monete Z</button><button class="btn ghost" data-a="tr">🥋 Allenati</button>
     <button class="btn ghost" data-a="rs">💤 Riposa</button><button class="btn ghost small" data-a="new">Cambia nome</button></div>`;
    $("#game").querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>act(b.dataset.a)); }
  function act(a){ const n=`<b>${esc(S.name)}</b>`, mh=20+S.lv*5; let t, xp=0;
    if(a==="new"){ localStorage.removeItem(K); S=null; return ask(); }
    if(a==="rs"){ S.hp=mh; t=`${n} si fa un pisolino nell'igloo. HP al massimo! 😴`; }
    else if(S.hp<=0){ t=`${n}, sei stremato! Riposa prima di continuare.`; }
    else if(a==="ex"){ const k=r(1,4); if(k===1){S.hp-=r(3,7);t=`${n} scivola su una lastra e fa un triplo carpiato... sulla pancia. -HP ma che stile!`;}
      else if(k===2){xp=r(6,10);t=`${n} trova una grotta di ghiaccio piena di cristalli pixel! +${xp} XP`;}
      else if(k===3){S.hp-=r(2,5);xp=r(4,8);t=`Un tricheco brontolone sfida ${n}! Vittoria ai punti. +${xp} XP`;}
      else {xp=r(3,6);t=`${n} saluta una foca che risponde con un rutto. +${xp} XP di amicizia.`;} }
    else if(a==="co"){ const z=r(0,6); S.z+=z; xp=z?2:1; t= z?`${n} raccoglie ${z} monete Z finte dalla neve! 🪙 (solo nel gioco, valgono zero)`:`${n} scava, scava... e trova un calzino. Niente monete.`; }
    else { S.hp-=r(1,3); xp=r(5,9); t=`${n} fa 50 flessioni con le alette. Il gabbiano applaude. +${xp} XP`; }
    S.hp=Math.max(0,Math.min(mh,S.hp)); S.xp+=xp;
    if(S.xp>=need()){ S.xp-=need(); S.lv++; S.hp=20+S.lv*5; t+=`<br>🎉 <b>LEVEL UP!</b> ${n} è ora al livello ${S.lv}!`; confetti(); }
    save(); render(t); }
  S ? render(`Bentornato, <b>${esc(S.name)}</b>! Il ghiaccio ti aspetta.`) : ask();
})();
