/*! ZSwap Hub © 2026 ZDOS1.3 — P.IVA 11040550961. Tutti i diritti riservati. Vedi LICENSE. */
// ZSwap · pinguino pixel di benvenuto per chi arriva da un link referral (?ref=).
(() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isAddr = s => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s||"");
  const short = m => m.slice(0,4)+"…"+m.slice(-4);
  const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let svg = null;
  const getSvg = async () => svg || (svg = await fetch("assets/penguin.svg").then(r=>r.text()).catch(()=>`<img src="assets/penguin.svg" alt="">`));
  function snow(stage){ if (RM) return; const c=document.createElement("canvas"); c.className="psnow"; stage.append(c);
    const s=4, W=c.width=Math.ceil(innerWidth/s), H=c.height=Math.ceil(innerHeight/s), x=c.getContext("2d");
    const COL=["#ffffff","#ffc93c","#a855f7","#22d3ee"];
    const fl=Array.from({length:70},()=>({x:Math.random()*W,y:-Math.random()*H,v:.2+Math.random()*.5,c:COL[Math.random()*4|0]}));
    (function t(){ if(!c.isConnected) return; x.clearRect(0,0,W,H); for(const f of fl){ f.y+=f.v; f.x+=Math.sin(f.y/8)*.2; if(f.y>H) f.y=-2; x.fillStyle=f.c; x.fillRect(f.x|0,f.y|0,1,1); }
      if(!document.hidden) requestAnimationFrame(t); else setTimeout(()=>requestAnimationFrame(t),500); })(); }
  async function play(ref){
    if (document.getElementById("pstage")) return;
    const art = await getSvg();
    const st = document.createElement("div"); st.id="pstage"; if (RM) st.classList.add("rm");
    st.innerHTML = `<div class="ice"></div><div class="peng slide">${art}</div>
      <div class="bubble" role="dialog" aria-label="Benvenuto"><p>Ciao! Ti ha invitato <code>${esc(short(ref))}</code>. Benvenuto su ZSwap 🐧</p>
      <div class="acts"><button class="btn" id="pEnter">Entra</button><button class="btn ghost" id="pConn">Collega Phantom</button></div>
      <button class="pskip" id="pSkip" aria-label="Salta">Salta ✕</button></div>`;
    document.body.append(st); snow(st);
    const peng = st.querySelector(".peng");
    window.zsMagic?.beep?.([392,523,659]);
    const t1 = setTimeout(()=>{ peng.classList.replace("slide","wave"); st.classList.add("talk"); }, RM?0:1500);
    const t2 = setTimeout(()=>peng.classList.add("idle"), RM?0:2700);
    const close = (jump) => { clearTimeout(t1); clearTimeout(t2);
      if (RM){ st.remove(); return; }
      st.classList.remove("talk"); peng.className = "peng " + (jump ? "jumpout" : "out");
      window.zsMagic?.beep?.(jump ? [523,784,1047] : [330]); if (jump) window.zsMagic?.confetti?.(50);
      setTimeout(()=>st.remove(), 1100); };
    st.querySelector("#pEnter").onclick = () => close(true);
    st.querySelector("#pSkip").onclick = () => close(false);
    st.querySelector("#pConn").onclick = () => { close(true); setTimeout(()=>document.getElementById("connect")?.click(), RM?0:400); };
    addEventListener("keydown", function k(e){ if (e.key==="Escape"){ removeEventListener("keydown",k); close(false); } });
  }
  window.zsPenguin = { play, getSvg };
  // Accoglienza automatica: una volta per sessione per ciascun ref.
  try {
    const ref = new URLSearchParams(location.search).get("ref");
    if (isAddr(ref) && !sessionStorage.getItem("zs_peng_"+ref)){
      sessionStorage.setItem("zs_peng_"+ref,"1");
      const go = () => setTimeout(()=>play(ref), document.getElementById("splash") ? 2500 : 300);
      document.readyState==="loading" ? addEventListener("DOMContentLoaded",go) : go();
    }
  } catch {}
})();
