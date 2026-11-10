/*! ZSwap Hub © 2026 ZDOS1.3 — P.IVA 11040550961. Tutti i diritti riservati. Vedi LICENSE. */
// ZSwap · modalità scenografica: stelle pixel, splash, transizioni, coriandoli, chiptune opzionale, easter egg.
(() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LSg = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch{ return d; } };
  // ---- Sfondo stelle pixel parallax (canvas, rAF, pausa se tab nascosta) ----
  const cv = document.createElement("canvas"); cv.id = "stars"; cv.setAttribute("aria-hidden","true"); document.body.prepend(cv);
  const cx = cv.getContext("2d"); let W=0,H=0,stars=[],raf=0,scrollY0=0;
  const COLS=["#ffffff","#a855f7","#22d3ee","#ffc93c"];
  function resize(){ const s=4; W=cv.width=Math.ceil(innerWidth/s); H=cv.height=Math.ceil(innerHeight/s);
    const n=Math.min(140,Math.round(W*H/180)); stars=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,z:1+Math.floor(Math.random()*3),c:COLS[Math.floor(Math.random()*4)],t:Math.random()*6})); draw(0); }
  function draw(dt){ cx.clearRect(0,0,W,H); const sy=scrollY*0.02;
    for (const s of stars){ s.x-=dt*0.004*s.z; if(s.x<0) s.x+=W; s.t+=dt*0.003;
      const y=((s.y - sy*s.z)%H+H)%H; cx.globalAlpha = .35+.35*s.z/3*(0.6+0.4*Math.sin(s.t)); cx.fillStyle=s.c; cx.fillRect(Math.round(s.x),Math.round(y),1,1); } }
  let last=0; function loop(t){ draw(Math.min(50,t-(last||t))); last=t; raf=requestAnimationFrame(loop); }
  addEventListener("resize",resize); resize();
  if (!RM){ raf=requestAnimationFrame(loop);
    document.addEventListener("visibilitychange",()=>{ if(document.hidden){ cancelAnimationFrame(raf); raf=0; } else if(!raf){ last=0; raf=requestAnimationFrame(loop); } }); }
  // ---- Chiptune opzionale (Web Audio, OFF di default) ----
  let ac=null; const soundOn=()=>LSg("zs_sound",false);
  function beep(notes){ if(!soundOn()) return; try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); let t=ac.currentTime;
    for(const f of notes){ const o=ac.createOscillator(),g=ac.createGain(); o.type="square"; o.frequency.value=f; g.gain.setValueAtTime(.06,t); g.gain.exponentialRampToValueAtTime(.001,t+.12); o.connect(g).connect(ac.destination); o.start(t); o.stop(t+.13); t+=.09; } }catch{} }
  const sb=document.createElement("button"); sb.className="icon"; sb.id="soundBtn"; const setSb=()=>{ sb.textContent=soundOn()?"🔊":"🔈"; sb.title=soundOn()?"Suoni chiptune attivi":"Suoni chiptune disattivati"; }; setSb();
  sb.onclick=()=>{ localStorage.setItem("zs_sound",JSON.stringify(!soundOn())); setSb(); beep([523,659,784]); };
  document.querySelector(".hbtns")?.prepend(sb);
  // ---- Coriandoli pixel ----
  function confetti(n=60){ beep([523,659,784,1047]); if(RM) return;
    const c=document.createElement("canvas"); c.className="confetti"; document.body.append(c); const s=4; c.width=Math.ceil(innerWidth/s); c.height=Math.ceil(innerHeight/s); const x=c.getContext("2d");
    const ps=Array.from({length:n},()=>({x:c.width/2+(Math.random()-.5)*20,y:c.height*.35,vx:(Math.random()-.5)*2.4,vy:-Math.random()*2.8-1,c:COLS[Math.floor(Math.random()*4)]}));
    let f=0; (function tick(){ x.clearRect(0,0,c.width,c.height); for(const p of ps){ p.vy+=.08; p.x+=p.vx; p.y+=p.vy; x.fillStyle=p.c; x.fillRect(Math.round(p.x),Math.round(p.y),2,2); }
      if(++f<110 && !document.hidden) requestAnimationFrame(tick); else c.remove(); })(); }
  window.zsMagic = { confetti, beep };
  // Festeggia i momenti chiave intercettando i toast esistenti.
  const toasts=document.getElementById("toasts");
  if (toasts) new MutationObserver(ms=>{ for(const m of ms) for(const n of m.addedNodes){ const t=n.textContent||"";
    if (/Wallet collegato|Link copiato|Accesso locale attivo/.test(t)) confetti(); else if(n.classList?.contains("err")) beep([196,147]); } }).observe(toasts,{childList:true});
  // Link referral generato a mano → festa.
  document.addEventListener("click",e=>{ if(e.target.closest?.("#rgen")) setTimeout(()=>{ if(document.querySelector("#rcp")) confetti(); },50); });
  // ---- Transizioni tra rotte ----
  const view=document.getElementById("view");
  addEventListener("hashchange",()=>{ if(RM||!view) return; view.classList.remove("enter"); void view.offsetWidth; view.classList.add("enter"); beep([880]); });
  // ---- Micro-interazioni: ripple pixel sui pulsanti ----
  document.addEventListener("pointerdown",e=>{ const b=e.target.closest?.(".btn,.chip"); if(!b||RM) return; const r=b.getBoundingClientRect(), d=document.createElement("i");
    d.className="pxr"; d.style.left=(e.clientX-r.left)+"px"; d.style.top=(e.clientY-r.top)+"px"; b.append(d); setTimeout(()=>d.remove(),450); });
  // ---- Splash intro (una volta per sessione, skippabile) ----
  if (!RM && !sessionStorage.getItem("zs_intro")){
    sessionStorage.setItem("zs_intro","1");
    const sp=document.createElement("div"); sp.id="splash"; sp.setAttribute("role","button"); sp.setAttribute("aria-label","Salta intro");
    const word="ZSWAP"; sp.innerHTML=`<img class="drop" src="assets/zdos-pixel.svg" alt="" width="72" height="72"><div class="bricks">${[...word].map((ch,i)=>`<span style="animation-delay:${.55+i*.09}s">${ch}</span>`).join("")}</div><small>ZLang by ZDOS · tocca per saltare</small>`;
    document.body.append(sp); const end=()=>{ sp.classList.add("out"); setTimeout(()=>sp.remove(),350); };
    sp.onclick=end; addEventListener("keydown",end,{once:true}); setTimeout(end,2300);
  }
  // ---- Easter egg: Konami code → modalità "ZLang retro" ----
  const K=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"]; let ki=0;
  const setRetro=on=>{ document.body.classList.toggle("retro",on); localStorage.setItem("zs_retro",JSON.stringify(on)); };
  if (LSg("zs_retro",false)) setRetro(true);
  addEventListener("keydown",e=>{ ki = (e.key===K[ki]||e.key.toLowerCase()===K[ki]) ? ki+1 : (e.key===K[0]?1:0);
    if (ki===K.length){ ki=0; const on=!document.body.classList.contains("retro"); setRetro(on); confetti(90);
      const t=document.createElement("div"); t.className="toast"; t.textContent=on?"▶ Modalità ZLang retro attivata":"Modalità ZLang retro disattivata"; toasts?.append(t); setTimeout(()=>t.remove(),3000); } });
  // Su mobile: 5 tocchi rapidi sul logo attivano lo stesso easter egg.
  let taps=0,tt; document.querySelector(".logo .coin")?.addEventListener("click",e=>{ taps++; clearTimeout(tt); tt=setTimeout(()=>taps=0,900);
    if(taps>=5){ e.preventDefault(); taps=0; ki=K.length-1; dispatchEvent(new KeyboardEvent("keydown",{key:"a"})); } });
})();
