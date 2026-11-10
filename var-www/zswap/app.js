/*! ZSwap Hub © 2026 ZDOS1.3 — P.IVA 11040550961. Tutti i diritti riservati. Vedi LICENSE. */
// ZSwap Hub — app statica companion per utenti pump.fun. Nessuna chiave privata, nessun backend, nessuna fee.
// ======================= CONFIG =======================
const CONFIG = {
  // Ordine di tentativo degli RPC (un RPC personalizzato dalle Impostazioni viene messo in testa).
  RPCS: ["https://api.mainnet-beta.solana.com", "https://solana-rpc.publicnode.com"],
  JUP: "https://lite-api.jup.ag",            // quote/swap: /swap/v1  · prezzi: /price/v3 · token: /tokens/v2
  DEX: "https://api.dexscreener.com",
  // Commissione piattaforma Jupiter: DISATTIVATA. Per attivarla servono ENTRAMBI: bps > 0 e l'indirizzo
  // del token account (ATA) di ricezione, creato dal wallet pubblico del proprietario. Mai chiavi private.
  PLATFORM_FEE_BPS: 0, FEE_ACCOUNT: null,
  IMPACT_WARN: 5, IMPACT_BLOCK: 15,          // % impatto sul prezzo: avviso / richiede conferma
  CACHE_MS: 30000,
};
const SOL = "So11111111111111111111111111111111111111112", USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const FEATURED = [
  { sym:"$DSN", name:"xZDOS", mint:"EnxZzNG8ZarHt1Tez4ipu5yUnXj8rAbyAnXttxnMpump", dec:6, logo:"https://ipfs.io/ipfs/bafkreic3rvidb2rpocfpmmkyrxmr24dyxx4ujngtgjq7qmmkcbo654wb4y" },
  { sym:"$OV", name:"VELVET", mint:"2EN6Y1zM4yyt41gE2muzdJSAgRCAZiXqnmkgpbrspump", dec:6, logo:"https://ipfs.io/ipfs/bafkreiba47ucbf4vpavleqegiiuhb55m2xeik3dysyi3revi7wisgwlizy" },
];
const BASE = [
  { sym:"SOL", name:"Solana", mint:SOL, dec:9, logo:"https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" },
  { sym:"USDC", name:"USD Coin", mint:USDC, dec:6, logo:"https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png" },
  ...FEATURED,
];
// ======================= UTIL =======================
const $ = s => document.querySelector(s), view = $("#view");
const wkey = () => (typeof wallet!=="undefined" && wallet && LS.get("zs_siws",{})[wallet]) ? "zs_watch_"+wallet : "zs_watch";
const LS = { get:(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d; }catch{ return d; } }, set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)) };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const short = m => m ? m.slice(0,4)+"…"+m.slice(-4) : "";
const isMint = s => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s||"");
const usd = v => v==null||isNaN(v) ? "—" : "$"+(v>=1e9?(v/1e9).toFixed(2)+"B":v>=1e6?(v/1e6).toFixed(2)+"M":v>=1e3?(v/1e3).toFixed(1)+"K":v>=1?(+v).toFixed(2):(+v).toPrecision(3));
const pct = v => v==null||isNaN(v) ? "—" : `<span class="${v>=0?"up":"dn"}">${v>=0?"+":""}${(+v).toFixed(1)}%</span>`;
const age = ts => { if(!ts) return "—"; const h=(Date.now()-ts)/36e5; return h<1?Math.round(h*60)+"m":h<48?Math.round(h)+"h":Math.round(h/24)+"g"; };
const num = (v,d=6) => (+v).toLocaleString("it-IT",{maximumFractionDigits:d});
function toast(msg, err=false){ const t=document.createElement("div"); t.className="toast"+(err?" err":""); t.textContent=msg; $("#toasts").append(t); setTimeout(()=>t.remove(),4500); }
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const cache = new Map();
async function getJSON(url, {ttl=CONFIG.CACHE_MS, tries=3}={}){
  const c = cache.get(url); if (c && Date.now()-c.t < ttl) return c.v;
  for (let i=0;i<tries;i++){
    try { const r = await fetch(url);
      if (r.status===429 || r.status>=500){ await sleep(800*2**i); continue; }
      if (!r.ok) throw new Error("HTTP "+r.status);
      const v = await r.json(); cache.set(url,{t:Date.now(),v}); return v;
    } catch(e){ if (i===tries-1) throw e; await sleep(600*2**i); }
  }
  throw new Error("Limite di richieste raggiunto, riprova tra poco");
}
const rpcList = () => { const c = LS.get("zs_rpc",""); return c ? [c, ...CONFIG.RPCS] : CONFIG.RPCS; };
async function rpc(method, params){
  let last;
  for (const url of rpcList()){
    for (let i=0;i<2;i++){
      try { const r = await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
        if (r.status===429){ await sleep(700*2**i); continue; }
        const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result;
      } catch(e){ last=e; break; }
    }
  }
  throw new Error("RPC non disponibile ("+(last?.message||"errore")+"). Imposta un RPC personale in ⚙.");
}
// ======================= DATI TOKEN =======================
function bestPairs(pairs){ const m={}; for (const p of pairs||[]){ if (p.chainId!=="solana") continue; const k=p.baseToken.address; if(!m[k] || (p.liquidity?.usd||0)>(m[k].liquidity?.usd||0)) m[k]=p; } return m; }
async function pairsFor(mints){ const out={}; for (let i=0;i<mints.length;i+=30){ const d = await getJSON(`${CONFIG.DEX}/tokens/v1/solana/${mints.slice(i,i+30).join(",")}`); Object.assign(out,bestPairs(d)); } return out; }
const knownTokens = () => [...BASE, ...LS.get("zs_imported",[])];
const findTok = m => knownTokens().find(t=>t.mint===m);
async function resolveToken(mint){
  const k = findTok(mint); if (k) return k;
  try { const r = await getJSON(`${CONFIG.JUP}/tokens/v2/search?query=${mint}`,{ttl:3e5}); const t=(r||[]).find(x=>x.id===mint);
    if (t) return { sym:t.symbol, name:t.name, mint, dec:t.decimals, logo:t.icon }; } catch {}
  const a = await rpc("getAccountInfo",[mint,{encoding:"jsonParsed"}]); const dec = a?.value?.data?.parsed?.info?.decimals;
  if (dec==null) throw new Error("Mint non valido");
  return { sym:short(mint), name:short(mint), mint, dec, logo:"" };
}
function importToken(t){ if (findTok(t.mint)) return; const l=LS.get("zs_imported",[]); l.push(t); LS.set("zs_imported",l); }
const logo = (src, label) => src ? `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'av',textContent:'${esc((label||'?')[0]).replace(/'/g,'')}'}))">` : `<div class="av">${esc((label||"?").replace("$","")[0]||"?")}</div>`;
// ======================= WALLET =======================
let wallet = null;
const provider = () => window.phantom?.solana?.isPhantom ? window.phantom.solana : (window.solana?.isPhantom ? window.solana : null);
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const siwsOk = () => wallet && LS.get("zs_siws",{})[wallet];
function setWallet(pk){
  wallet = pk ? pk.toString() : null;
  $("#connect").textContent = wallet ? (siwsOk()?"✓ ":"")+short(wallet) : "Collega Phantom";
  $("#waddr").textContent = wallet||""; $("#wsol").href = wallet?`https://solscan.io/account/${wallet}`:"#";
  $("#wsiws").textContent = siwsOk() ? "Accesso locale attivo ✓" : "Accedi con wallet";
  if (!wallet) $("#wmenu").classList.add("hidden");
}
// Attende l'injection di Phantom (nel browser in-app può arrivare in ritardo), max ~3s.
function waitProvider(ms=3000){
  return new Promise(res=>{ const p0=provider(); if (p0) return res(p0);
    const t0=Date.now(); const done=()=>{ const p=provider(); if (p||Date.now()-t0>=ms){ clearInterval(iv); removeEventListener("phantom#initialized",done); res(p); } };
    const iv=setInterval(done,150); addEventListener("phantom#initialized",done); });
}
function phantomDeepLink(){
  const u=new URL(location.href); u.searchParams.set("zc","1");   // zc=1: collega in automatico all'apertura dentro Phantom
  return `https://phantom.app/ul/browse/${encodeURIComponent(u.toString())}?ref=${encodeURIComponent(location.origin)}`;
}
let connecting=false;
async function connect(){
  if (connecting) return; connecting=true;
  try {
    const p = await waitProvider();
    if (!p){
      if (isMobile){ toast("Apro l'app Phantom…"); location.href=phantomDeepLink(); }
      else { toast("Phantom non trovato: installa l'estensione da phantom.app", true); window.open("https://phantom.app/download","_blank","noopener"); }
      return;
    }
    const r = await p.connect(); setWallet(r.publicKey); toast("Wallet collegato"); route();
  } catch(e){ toast(e?.code===4001||/reject|cancel|annull/i.test(e?.message||"") ? "Connessione rifiutata in Phantom: riprova o incolla il tuo indirizzo." : "Connessione non riuscita: "+(e?.message||e), true); }
  finally { connecting=false; }
}
$("#connect").onclick = () => wallet ? $("#wmenu").classList.toggle("hidden") : connect();
$("#wcopy").onclick = () => navigator.clipboard.writeText(wallet).then(()=>toast("Indirizzo copiato")).catch(()=>toast("Copia non riuscita",true));
$("#wdisc").onclick = async () => { try { await provider()?.disconnect(); } catch {} setWallet(null); toast("Disconnesso"); route(); };
// Sign-In With Solana (solo locale): firma un messaggio, nessuna transazione, nessun backend.
$("#wsiws").onclick = async () => {
  if (siwsOk()) return toast("Accesso locale già attivo");
  const nonce = crypto.getRandomValues(new Uint32Array(2)).join("");
  const msg = `${location.host} vuole che tu acceda con il tuo account Solana:\n${wallet}\n\nAccesso locale a ZSwap Hub (watchlist e portfolio personali). Questa firma NON è una transazione e non costa nulla.\n\nURI: ${location.origin}\nVersione: 1\nNonce: ${nonce}\nEmesso il: ${new Date().toISOString()}`;
  try {
    const { signature } = await provider().signMessage(new TextEncoder().encode(msg), "utf8");
    const sig = btoa(String.fromCharCode(...signature));
    const m = LS.get("zs_siws",{}); m[wallet] = { t:Date.now(), msg, sig }; LS.set("zs_siws",m);
    setWallet(wallet); toast("Accesso locale attivo"); route();
  } catch { toast("Firma annullata", true); }
};
(async function initPhantom(){
  const p = await waitProvider(); if (!p) return;
  p.on?.("connect", pk => { if (pk && pk.toString()!==wallet){ setWallet(pk); route(); } });
  p.on?.("accountChanged", pk => { if (pk){ setWallet(pk); toast("Account cambiato: "+short(pk.toString())); } else { setWallet(null); } route(); });
  p.on?.("disconnect", () => { setWallet(null); route(); });
  try { const r=await p.connect({onlyIfTrusted:true}); setWallet(r.publicKey); route(); }
  catch { if (new URLSearchParams(location.search).get("zc")==="1") connect(); }
})();
const xShare = (text, url=location.href) => `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
$("#setBtn").onclick = () => { $("#settings").classList.toggle("hidden"); $("#rpcIn").value = LS.get("zs_rpc",""); };
$("#rpcSave").onclick = () => { const v=$("#rpcIn").value.trim(); if (v && !/^https:\/\//.test(v)) return toast("Serve un URL https", true); LS.set("zs_rpc",v); toast(v?"RPC salvato":"RPC personalizzato rimosso"); $("#settings").classList.add("hidden"); };
async function balanceOf(mint){
  if (!wallet) return null;
  if (mint===SOL) return (await rpc("getBalance",[wallet])).value/1e9;
  const r = await rpc("getTokenAccountsByOwner",[wallet,{mint},{encoding:"jsonParsed"}]);
  return r.value.reduce((s,a)=>s+(a.account.data.parsed.info.tokenAmount.uiAmount||0),0);
}
// ======================= ROUTER =======================
const PX = (s=16) => `<img class="px" src="assets/zdos-pixel.svg" alt="" width="${s}" height="${s}">`;
const feeOn = () => CONFIG.PLATFORM_FEE_BPS>0 && !!CONFIG.FEE_ACCOUNT;
const DSN = FEATURED[0].mint;
function zdosLinks(mint=DSN){
  return `<div class="acts zl"><a class="btn zbtn" href="#/swap?in=${SOL}&out=${mint}">${PX()} Swap su ZSwap</a>
   <a class="btn ghost zbtn" target="_blank" rel="noopener" href="https://pump.fun/coin/${mint}">${PX()} pump.fun</a>
   <a class="btn ghost zbtn" target="_blank" rel="noopener" href="https://dexscreener.com/solana/${mint}">${PX()} DexScreener</a>
   <a class="btn ghost zbtn" target="_blank" rel="noopener" href="https://solscan.io/token/${mint}">${PX()} Solscan</a>
   <a class="btn ghost zbtn" href="#/analysis">${PX()} ZDOS Analysis</a></div>`;
}
const routes = { "":home, swap, portfolio, watch, community, guida, token, analysis, pumpfun, polymarket, referral };
// Referral: ?ref=<indirizzo> salvato solo in questo browser (nessun backend).
(function captureRef(){ try { const r=new URLSearchParams(location.search).get("ref"); if (isMint(r) && !LS.get("zs_ref",null)) LS.set("zs_ref",{addr:r,t:Date.now()}); } catch {} })();
let cleanup = null;
function route(){
  if (cleanup){ cleanup(); cleanup=null; }
  const [, r="", arg] = (location.hash.replace(/^#/,"").split("?")[0] || "/").split("/");
  document.querySelectorAll("#nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#/"+(r==="token"?"":r)));
  view.className = "one"; window.scrollTo(0,0);
  Promise.resolve((routes[r]||home)(decodeURIComponent(arg||""))).catch(e=>{ console.warn(e); toast(e.message||"Errore", true); });
}
addEventListener("hashchange", route);
try { window.Telegram?.WebApp?.ready(); window.Telegram?.WebApp?.expand(); } catch {}
// ======================= ESPLORA =======================
let feedFilter = "nuovi", onlyPump = true;
async function home(){
  view.innerHTML = `<section class="card"><h2>Esplora i token pump.fun</h2>
   <p class="muted small">Nuovi profili, token in tendenza e token migrati su PumpSwap, da dati pubblici DexScreener. Comparire qui non è un consiglio: apri la scheda e guarda il <b>Controllo rischi</b>.</p>
   <input id="q" class="search" placeholder="Cerca per nome, simbolo o incolla un mint…">
   <div class="chips"><button class="chip" data-f="nuovi">🆕 Nuovi</button><button class="chip" data-f="tendenza">🔥 In tendenza</button><button class="chip" data-f="migrati">🚀 Migrati su PumpSwap</button>
   <label class="chip"><input type="checkbox" id="op" ${onlyPump?"checked":""} style="width:auto"> solo pump.fun</label></div></section>
   <section class="card zcard"><h2>${PX(22)} xZDOS <span class="muted">$DSN</span></h2><p class="muted small">Il token della community ZDOS. Link rapidi; i dati e i rischi sono nella sezione Analysis. Nessuna promessa di guadagno, DYOR.</p>${zdosLinks()}</section>
   <a class="card zcard row" href="#/referral" style="justify-content:flex-start;text-decoration:none;color:inherit">${PX(22)}<span><b>Affiliato &amp; Referral</b> <span class="muted small">— crea il tuo link invito ZSwap</span></span></a>
   <section id="feed" class="feed">${'<div class="skel"></div>'.repeat(6)}</section>`;
  view.querySelectorAll("[data-f]").forEach(b=>{ b.classList.toggle("on",b.dataset.f===feedFilter); b.onclick=()=>{ feedFilter=b.dataset.f; home(); }; });
  $("#op").onchange = e => { onlyPump=e.target.checked; loadFeed(); };
  let t; $("#q").oninput = e => { clearTimeout(t); t=setTimeout(()=>loadFeed(e.target.value.trim()),450); };
  $("#q").onkeydown = e => { if (e.key==="Enter" && isMint(e.target.value.trim())) location.hash="#/token/"+e.target.value.trim(); };
  await loadFeed();
}
const isPump = p => p.baseToken.address.endsWith("pump") || ["pumpfun","pumpswap"].includes(p.dexId);
async function loadFeed(q=""){
  const el = $("#feed"); if (!el) return;
  try {
    let pairs;
    if (q){ const d = await getJSON(`${CONFIG.DEX}/latest/dex/search?q=${encodeURIComponent(q)}`); pairs = Object.values(bestPairs(d.pairs)); }
    else if (feedFilter==="migrati"){ const d = await getJSON(`${CONFIG.DEX}/latest/dex/search?q=pumpswap`); pairs = Object.values(bestPairs((d.pairs||[]).filter(p=>p.dexId==="pumpswap"))).sort((a,b)=>(b.volume?.h24||0)-(a.volume?.h24||0)); }
    else {
      const src = feedFilter==="nuovi" ? "token-profiles/latest/v1" : "token-boosts/top/v1";
      const list = (await getJSON(`${CONFIG.DEX}/${src}`)).filter(x=>x.chainId==="solana");
      const icons = Object.fromEntries(list.map(x=>[x.tokenAddress,x.icon]));
      pairs = Object.values(await pairsFor([...new Set(list.map(x=>x.tokenAddress))].slice(0,60))).map(p=>({...p, _icon:icons[p.baseToken.address]}));
      pairs.sort(feedFilter==="nuovi" ? (a,b)=>(b.pairCreatedAt||0)-(a.pairCreatedAt||0) : (a,b)=>(b.volume?.h24||0)-(a.volume?.h24||0));
    }
    if (onlyPump) pairs = pairs.filter(isPump);
    el.innerHTML = pairs.length ? pairs.slice(0,40).map(cardHTML).join("") : `<div class="card muted">Nessun token trovato con questi filtri.</div>`;
  } catch(e){ el.innerHTML = `<div class="card err">Feed non disponibile: ${esc(e.message)}. <button class="btn ghost" onclick="location.reload()">Riprova</button></div>`; }
}
function cardHTML(p){
  const b=p.baseToken, img=p._icon||p.info?.imageUrl;
  return `<a class="card tc" href="#/token/${b.address}">${logo(img,b.symbol)}<div style="min-width:0">
   <h4>${esc(b.name)} <span class="muted">${esc(b.symbol)}</span><span class="tag">${esc(p.dexId)}</span></h4>
   <div class="s"><span>MC ${usd(p.marketCap??p.fdv)}</span><span>Liq ${usd(p.liquidity?.usd)}</span><span>Vol 24h ${usd(p.volume?.h24)}</span><span>Età ${age(p.pairCreatedAt)}</span><span>24h ${pct(p.priceChange?.h24)}</span><span>1h ${pct(p.priceChange?.h1)}</span></div></div></a>`;
}
// ======================= PAGINA TOKEN =======================
async function token(mint){
  if (!isMint(mint)){ view.innerHTML=`<div class="card">Mint non valido.</div>`; return; }
  view.innerHTML = `<div class="skel"></div>`;
  const pairs = (await getJSON(`${CONFIG.DEX}/tokens/v1/solana/${mint}`).catch(()=>[])) || [];
  const p = bestPairs(pairs)[mint]; const k = findTok(mint);
  const name = p?.baseToken.name || k?.name || short(mint), sym = p?.baseToken.symbol || k?.sym || "";
  const watched = LS.get(wkey(),[]).some(w=>w.mint===mint);
  const share = encodeURIComponent(`${name} (${sym}) su ZSwap Hub — controlla rischi e dati prima di tutto. DYOR`), url = encodeURIComponent(location.href);
  view.innerHTML = `<section class="card"><div class="row" style="justify-content:flex-start">${logo(p?.info?.imageUrl||k?.logo, sym)}<div><h2 style="margin:0">${esc(name)} <span class="muted">${esc(sym)}</span></h2><code class="muted small">${mint}</code></div></div>
   <div class="stats" style="margin-top:12px">
    <div class="stat"><span>Prezzo</span><b>${p?.priceUsd?"$"+p.priceUsd:"—"}</b></div><div class="stat"><span>Market cap</span><b>${usd(p?.marketCap??p?.fdv)}</b></div>
    <div class="stat"><span>Liquidità</span><b>${usd(p?.liquidity?.usd)}</b></div><div class="stat"><span>Volume 24h</span><b>${usd(p?.volume?.h24)}</b></div>
    <div class="stat"><span>Var. 24h</span><b>${pct(p?.priceChange?.h24)}</b></div><div class="stat"><span>Età pool</span><b>${age(p?.pairCreatedAt)}</b></div>
    <div class="stat"><span>Pool</span><b>${esc(p?.dexId||"—")}</b></div><div class="stat"><span>Tx 24h</span><b>${p?.txns?.h24?`${p.txns.h24.buys}↑ ${p.txns.h24.sells}↓`:"—"}</b></div></div>
   <div class="acts" style="margin-top:12px">
    <a class="btn" href="#/swap?in=${SOL}&out=${mint}">Compra su ZSwap</a><a class="btn ghost" href="#/swap?in=${mint}&out=${SOL}">Vendi su ZSwap</a>
    <a class="btn ghost" target="_blank" rel="noopener" href="https://pump.fun/coin/${mint}">Apri su pump.fun</a>
    <a class="btn ghost" target="_blank" rel="noopener" href="https://dexscreener.com/solana/${mint}">DexScreener</a>
    <a class="btn ghost" target="_blank" rel="noopener" href="https://solscan.io/token/${mint}">Solscan</a>
    <button class="btn ghost" id="cp">Copia mint</button><button class="btn ghost" id="wl">${watched?"★ In watchlist":"☆ Watchlist"}</button>
    <a class="btn ghost" target="_blank" rel="noopener" href="https://t.me/share/url?url=${url}&text=${share}">Telegram</a>
    <a class="btn ghost" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${share}&url=${url}">Condividi su X</a></div></section>
   ${FEATURED.some(f=>f.mint===mint)?`<section class="card zcard"><h2>${PX(20)} Link ZDOS</h2>${zdosLinks(mint)}</section>`:""}
   <section class="card risk"><h2>Controllo rischi</h2><p class="muted small">Calcolato nel tuo browser da dati pubblici on-chain e DexScreener. È un aiuto, non una garanzia.</p><ul id="risk"><li><span class="b n">…</span>Analisi in corso</li></ul></section>
   <section class="card"><h2>Grafico</h2><iframe title="Grafico DexScreener" loading="lazy" src="https://dexscreener.com/solana/${mint}?embed=1&theme=dark&trades=0&info=0"></iframe></section>`;
  $("#cp").onclick = () => navigator.clipboard.writeText(mint).then(()=>toast("Mint copiato")).catch(()=>toast("Copia non riuscita",true));
  $("#wl").onclick = () => { toggleWatch({mint,sym:sym||short(mint),name,base:+p?.priceUsd||null}); token(mint); };
  riskCheck(mint, p);
}
async function riskCheck(mint, p, sel="#risk"){
  const items = [], add = (lvl,title,txt) => items.push(`<li><span class="b ${lvl}">${{g:"OK",y:"ATTENZIONE",r:"RISCHIO",n:"N/D"}[lvl]}</span><div><b>${title}</b><br><span class="muted small">${txt}</span></div></li>`);
  let supply=null, dec=0;
  try {
    const info = (await rpc("getAccountInfo",[mint,{encoding:"jsonParsed"}]))?.value?.data?.parsed?.info;
    if (!info) throw new Error("account non trovato");
    supply = +info.supply; dec = info.decimals;
    info.mintAuthority ? add("r","Mint authority attiva",`Qualcuno (${short(info.mintAuthority)}) può creare nuovi token e diluire i possessori.`) : add("g","Mint authority revocata","Non si possono creare nuovi token.");
    info.freezeAuthority ? add("r","Freeze authority attiva",`L'indirizzo ${short(info.freezeAuthority)} può congelare i token nei wallet.`) : add("g","Freeze authority revocata","Nessuno può congelare i tuoi token.");
  } catch(e){ add("n","Authority mint/freeze",esc(e.message)); }
  try {
    const big = (await rpc("getTokenLargestAccounts",[mint])).value;
    const top10 = big.slice(0,10).reduce((s,a)=>s+ +a.amount,0) / supply * 100, top1 = +big[0].amount / supply * 100;
    const lvl = top10>50?"r":top10>30?"y":"g";
    add(lvl,`Concentrazione holder: top 10 = ${top10.toFixed(1)}%`,`Il primo account detiene ${top1.toFixed(1)}%. Nota: spesso il primo è la bonding curve o il pool di liquidità, non una persona: verifica su Solscan.`);
  } catch(e){ add("n","Concentrazione holder","Non disponibile con l'RPC pubblico (richiede un RPC personale in ⚙)."); }
  const liq = p?.liquidity?.usd;
  if (p?.dexId==="pumpfun") add("y","Ancora sulla bonding curve pump.fun","Il prezzo segue la curva di pump.fun; la liquidità non è ancora in un pool. Scambia direttamente su pump.fun o via Jupiter se esiste una rotta.");
  else if (liq==null) add("n","Liquidità","Nessun pool trovato su DexScreener.");
  else add(liq<1000?"r":liq<10000?"y":"g",`Liquidità ${usd(liq)}`, liq<1000?"Liquidità molto bassa: anche piccoli scambi muovono molto il prezzo.":liq<10000?"Liquidità limitata: controlla l'impatto sul prezzo.":"Liquidità discreta.");
  if (p?.pairCreatedAt){ const h=(Date.now()-p.pairCreatedAt)/36e5; add(h<24?"r":h<168?"y":"g",`Età del pool: ${age(p.pairCreatedAt)}`, h<24?"Token molto recente: rischio più alto.":h<168?"Meno di una settimana.":"Pool attivo da più di una settimana."); }
  if (p) add(["pumpswap","raydium","meteora","orca"].includes(p.dexId)?"g":"y",`Tipo di pool: ${esc(p.dexId)}`, p.dexId==="pumpswap"?"Token migrato da pump.fun su PumpSwap.":"Verifica il pool su DexScreener.");
  const el=$(sel); if (el) el.innerHTML = items.join("");
}
// ======================= ZDOS ANALYSIS =======================
async function analysis(){
  view.innerHTML = `<section class="card zcard"><h2>${PX(24)} ZDOS Analysis</h2>
   <p class="small"><b>Dati informativi, non consulenza finanziaria.</b> Dati live da DexScreener e dalla blockchain Solana, calcolati nel tuo browser. Possono essere incompleti o in ritardo. Nessuna promessa di guadagno, DYOR.</p></section>
   ${FEATURED.map(f=>`<section class="card" id="an-${f.mint}"><div class="row" style="justify-content:flex-start">${logo(f.logo,f.sym)}<div><h2 style="margin:0">${esc(f.name)} <span class="muted">${esc(f.sym)}</span></h2><code class="muted small">${f.mint}</code></div></div><div class="anb"><div class="skel"></div></div></section>`).join("")}`;
  let pairs={};
  try { pairs = await pairsFor(FEATURED.map(f=>f.mint)); } catch(e){ toast("DexScreener non disponibile: "+e.message,true); }
  FEATURED.forEach((f,i)=>{
    const p=pairs[f.mint], box=document.querySelector(`#an-${f.mint} .anb`); if(!box) return;
    const liq=p?.liquidity?.usd, t=p?.txns?.h24;
    const state = !p ? `<p class="warn small">⚠ Nessun pool trovato su DexScreener: il token potrebbe essere ancora sulla bonding curve pump.fun o senza scambi. Prezzi e liquidità non disponibili.</p>`
      : (liq==null||liq<50) ? `<p class="warn small">⚠ Liquidità ~0 (${usd(liq)}): anche uno scambio minimo muove il prezzo in modo estremo. I valori di prezzo e market cap sono poco significativi.</p>` : "";
    box.innerHTML = `${state}<div class="stats" style="margin-top:12px">
     <div class="stat"><span>Prezzo</span><b>${p?.priceUsd?"$"+p.priceUsd:"—"}</b></div><div class="stat"><span>Liquidità</span><b>${usd(liq)}</b></div>
     <div class="stat"><span>Market cap</span><b>${usd(p?.marketCap)}</b></div><div class="stat"><span>FDV</span><b>${usd(p?.fdv)}</b></div>
     <div class="stat"><span>Volume 24h</span><b>${usd(p?.volume?.h24)}</b></div><div class="stat"><span>Var. 1h / 24h</span><b>${pct(p?.priceChange?.h1)} / ${pct(p?.priceChange?.h24)}</b></div>
     <div class="stat"><span>Tx 24h buy/sell</span><b>${t?`${t.buys}↑ ${t.sells}↓`:"—"}</b></div><div class="stat"><span>Età pool</span><b>${age(p?.pairCreatedAt)}</b></div>
     <div class="stat"><span>DEX</span><b>${esc(p?.dexId||"—")}</b></div></div>
     ${zdosLinks(f.mint)}
     <h3>Controllo rischi</h3><ul class="risk" id="rk${i}"><li><span class="b n">…</span>Analisi in corso</li></ul>`;
    riskCheck(f.mint,p,"#rk"+i);
  });
}
// ======================= PUMP.FUN =======================
async function pumpfun(){
  const L=(u,t)=>`<a class="btn ghost zbtn" target="_blank" rel="noopener" href="${u}">${PX()} ${t}</a>`;
  view.innerHTML = `<section class="card zcard"><h2>${PX(24)} pump.fun</h2>
   <p class="small">ZSwap Hub è uno strumento companion per chi usa pump.fun: <b>non è affiliato a pump.fun</b>. Nessuna promessa di guadagno, DYOR.</p>
   <div class="acts zl">${L("https://pump.fun/board","Board")}${L("https://pump.fun/create","Crea un token")}${FEATURED.map(f=>L("https://pump.fun/coin/"+f.mint,`${esc(f.name)} ${esc(f.sym)}`)).join("")}</div></section>
   <section class="card"><h2>Come funziona: bonding curve → PumpSwap</h2>
   <p class="small">1. Ogni token nasce su una <b>bonding curve</b>: il prezzo sale con gli acquisti e scende con le vendite secondo una formula fissa, senza pool di liquidità.<br>
   2. Quando la curva è completata, il token <b>migra su PumpSwap</b>, l'AMM di pump.fun: da lì si scambia in un pool, anche via Jupiter (quindi da ZSwap).<br>
   3. Prima della migrazione la liquidità su DexScreener può risultare ~0: scambia direttamente su pump.fun e controlla sempre la scheda rischi.</p></section>
   <section class="card"><h2>Feed pump.fun</h2><div class="chips"><button class="chip" data-f="nuovi">🆕 Nuovi</button><button class="chip" data-f="tendenza">🔥 In tendenza</button><button class="chip" data-f="migrati">🚀 Migrati su PumpSwap</button></div></section>
   <section id="feed" class="feed">${'<div class="skel"></div>'.repeat(6)}</section>`;
  onlyPump=true;
  view.querySelectorAll("[data-f]").forEach(b=>{ b.classList.toggle("on",b.dataset.f===feedFilter); b.onclick=()=>{ feedFilter=b.dataset.f; pumpfun(); }; });
  await loadFeed();
}
// ======================= POLYMARKET (sola lettura) =======================
async function polymarket(){
  view.innerHTML = `<section class="card zcard"><h2>${PX(24)} Polymarket · mercati crypto</h2>
   <p class="small warn"><b>Solo informazione. Nessun invito a scommettere. Polymarket può non essere disponibile nel tuo Paese (es. Italia).</b></p>
   <p class="muted small">Dati pubblici in sola lettura dall'API Gamma di Polymarket. ZSwap non è affiliato a Polymarket e non offre alcuna integrazione di trading.</p></section>
   <section id="pm" class="feed">${'<div class="skel"></div>'.repeat(4)}</section>`;
  const el=$("#pm");
  try {
    const evs=[];
    for (const t of ["crypto","solana","bitcoin"]){ try { evs.push(...await getJSON(`https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume&ascending=false&limit=20&tag_slug=${t}`,{ttl:60000,tries:2})); } catch {} }
    const seen=new Set(), ms=[];
    for (const e of evs) for (const m of e.markets||[]){ if (m.closed||!m.active||!m.outcomePrices||seen.has(m.id)) continue; seen.add(m.id); ms.push({...m,_ev:e.slug}); }
    if (!ms.length) throw new Error("nessun mercato ricevuto");
    ms.sort((a,b)=>(+b.volume||0)-(+a.volume||0));
    el.innerHTML = ms.slice(0,30).map(m=>{ let o=[],p=[]; try{o=JSON.parse(m.outcomes);p=JSON.parse(m.outcomePrices);}catch{}
      const odds=o.map((x,i)=>`<span>${esc(x)} <b>${(+p[i]*100).toFixed(1)}%</b></span>`).join("");
      return `<a class="card tc" target="_blank" rel="noopener" href="https://polymarket.com/event/${encodeURIComponent(m._ev)}"><div style="min-width:0"><h4>${esc(m.question)}</h4>
       <div class="s">${odds}<span>Vol ${usd(+m.volume)}</span><span>Scade ${m.endDate?new Date(m.endDate).toLocaleDateString("it-IT"):"—"}</span></div></div></a>`; }).join("");
  } catch(e){ el.innerHTML=`<div class="card">Dati Polymarket non disponibili (${esc(e.message)}). Puoi consultarli direttamente su <a target="_blank" rel="noopener" href="https://polymarket.com/crypto">polymarket.com/crypto</a>.</div>`; }
}
// ======================= AFFILIATO & REFERRAL =======================
function referral(){
  const me = wallet || LS.get("zs_myaddr",null);
  const link = me ? `https://swap.x-zdos.it/?ref=${me}` : null, ref = LS.get("zs_ref",null);
  const msg = "Provo ZSwap Hub di @ZDOS_Core: swap Solana via Jupiter, controllo rischi e dati pump.fun. DYOR";
  view.innerHTML = `<section class="card zcard"><h2>${PX(24)} Affiliato &amp; Referral</h2>
   ${link?`<p class="small row" style="justify-content:flex-start"><img class="mascotte" style="width:40px;height:40px" src="assets/penguin.svg" alt=""> Il tuo link invito:</p><code style="word-break:break-all">${esc(link)}</code>
   <div class="acts zl" style="margin-top:10px"><button class="btn zbtn" id="rcp">${PX()} Copia link</button>
    <a class="btn ghost zbtn" target="_blank" rel="noopener" href="${xShare(msg,link)}">${PX()} Condividi su X</a>
    <a class="btn ghost zbtn" target="_blank" rel="noopener" href="https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(msg)}">${PX()} Telegram</a></div>
   ${wallet?"":`<p class="muted small">Link generato dall'indirizzo inserito a mano. <button class="btn ghost" id="rclr">Cambia indirizzo</button></p>`}`
   :`<p class="small">Collega Phantom per ottenere il tuo link invito personale (usa solo il tuo indirizzo pubblico).</p><button class="btn" id="rcon">Collega Phantom</button>
   <p class="small" style="margin-top:12px">Oppure incolla il tuo <b>indirizzo pubblico</b> Solana (mai la seed phrase o la chiave privata):</p>
   <div class="row"><input id="raddr" placeholder="Indirizzo pubblico Solana" autocomplete="off"><button class="btn" id="rgen">Genera link</button></div><div id="rerr" class="small err"></div>`}
   ${ref?`<p class="muted small">Sei stato invitato da <code>${esc(short(ref.addr))}</code>.</p>`:""}</section>
   <section class="card zcard"><h2>Così ti vedranno i tuoi invitati</h2><div class="row" style="justify-content:flex-start;gap:12px"><img class="mascotte" src="assets/penguin.svg" alt="Pinguino ZSwap">
   <p class="small">Chi apre il tuo link viene accolto dal pinguino ZSwap, con il tuo indirizzo abbreviato nel fumetto.</p></div><button class="btn zbtn" id="rplay">▶ Riproduci</button></section>
   <section class="card"><h2>Come funziona, onestamente</h2><p class="small">
   • Per ora gli inviti sono registrati <b>solo nel browser</b> di chi apre il link: non c'è un backend e nessuno li conteggia ancora.<br>
   • Eventuali premi referral in $DSN arriveranno con <b>ZQuest</b> (quest.x-zdos.it, in costruzione) e saranno legati ad <b>attività verificabili</b>. Non sono promesse di guadagno.<br>
   • Nessuno ti chiederà mai la seed phrase o la chiave privata.</p></section>
   <section class="card"><h2>Commissione piattaforma Jupiter</h2><p class="small">${feeOn()?`Attiva: ${CONFIG.PLATFORM_FEE_BPS/100}% per swap, mostrata in ogni preventivo.`:"<b>Non attiva.</b> Gli swap su ZSwap non hanno commissioni di piattaforma. Se verrà attivata, sarà indicata in modo visibile in ogni swap."}</p></section>`;
  $("#rcp")?.addEventListener("click",()=>navigator.clipboard.writeText(link).then(()=>toast("Link copiato")).catch(()=>toast("Copia non riuscita",true)));
  $("#rcon")?.addEventListener("click",connect);
  $("#rplay")?.addEventListener("click",()=>window.zsPenguin?.play(me||FEATURED[0].mint));
  $("#rclr")?.addEventListener("click",()=>{ localStorage.removeItem("zs_myaddr"); referral(); });
  $("#rgen")?.addEventListener("click",()=>{ const v=$("#raddr").value.trim();
    if (!isMint(v)) { $("#rerr").textContent="Indirizzo non valido: deve essere in base58, 32-44 caratteri."; return; }
    LS.set("zs_myaddr",v); referral(); });
}
// ======================= SWAP =======================
let slippage = 100, quote = null, qTimer;
async function swap(){
  const params = new URLSearchParams(location.hash.split("?")[1]||"");
  for (const m of [params.get("in"),params.get("out")]) if (isMint(m) && !findTok(m)) { try { importToken(await resolveToken(m)); } catch {} }
  const opts = () => knownTokens().map(t=>`<option value="${t.mint}">${esc(t.sym)}</option>`).join("");
  view.className = "";
  view.innerHTML = `<section class="card swap"><div class="row"><h2>Scambia</h2><button id="gear" class="icon" title="Slippage">⚙</button></div>
   <div id="slipbox" class="slip hidden">Slippage: <button data-s="50">0.5%</button><button data-s="100">1%</button><button data-s="300">3%</button><button data-s="1000">10%</button><input id="slipc" type="number" step="0.1" min="0.1" max="50" placeholder="%"></div>
   <div class="box"><div class="row"><span>Da</span><span id="balIn" class="muted small"></span></div><div class="row"><input id="amtIn" inputmode="decimal" placeholder="0.0"><select id="tokIn">${opts()}</select></div>
    <div class="quick" id="quick"></div></div>
   <button id="flip" class="flip" title="Inverti">⇅</button>
   <div class="box"><div class="row"><span>A (stima)</span></div><div class="row"><input id="amtOut" placeholder="0.0" readonly><select id="tokOut">${opts()}</select></div></div>
   <div id="info" class="muted small"></div><label id="guardL" class="small warn hidden"><input type="checkbox" id="guard" style="width:auto"> Ho capito che l'impatto sul prezzo è molto alto</label>
   <button id="go" class="btn big" disabled>Inserisci un importo</button><div id="status" class="small"></div>${LS.get("zs_ref",null)?`<p class="muted small">Invitato da <code>${esc(short(LS.get("zs_ref").addr))}</code></p>`:""}</section>
   <section class="card"><h2>Importa token</h2><p class="muted small">Incolla un mint Solana (es. da pump.fun) per aggiungerlo all'elenco.</p>
    <div class="row"><input id="imp" class="search" placeholder="Mint…"><button id="impB" class="btn">Importa</button></div>
    <h3 style="margin-top:16px">Scambi recenti</h3><div id="hist"></div></section>`;
  $("#tokIn").value = isMint(params.get("in")) ? params.get("in") : SOL;
  $("#tokOut").value = isMint(params.get("out")) ? params.get("out") : FEATURED[0].mint;
  view.querySelectorAll("#slipbox button").forEach(b=>{ b.classList.toggle("on",+b.dataset.s===slippage); b.onclick=()=>{ slippage=+b.dataset.s; view.querySelectorAll("#slipbox button").forEach(x=>x.classList.toggle("on",x===b)); update(); }; });
  $("#slipc").oninput = e => { const v=parseFloat(e.target.value); if (v>0&&v<=50){ slippage=Math.round(v*100); view.querySelectorAll("#slipbox button").forEach(x=>x.classList.remove("on")); update(); } };
  $("#gear").onclick = () => $("#slipbox").classList.toggle("hidden");
  $("#amtIn").oninput = update; $("#guard").onchange = renderBtn;
  ["#tokIn","#tokOut"].forEach(s=>$(s).onchange=()=>{ side(); update(); });
  $("#flip").onclick = () => { const a=$("#tokIn").value; $("#tokIn").value=$("#tokOut").value; $("#tokOut").value=a; side(); update(); };
  $("#impB").onclick = async () => { const m=$("#imp").value.trim(); if(!isMint(m)) return toast("Mint non valido",true);
    try { const t=await resolveToken(m); importToken(t); toast(`Importato ${t.sym}`); location.hash=`#/swap?in=${SOL}&out=${m}`; swap(); } catch(e){ toast(e.message,true); } };
  $("#go").onclick = doSwap; side(); renderHist(); update();
}
async function side(){
  const m=$("#tokIn").value, q=$("#quick"); $("#balIn").textContent="";
  if (m===SOL) q.innerHTML = [0.05,0.1,0.5].map(v=>`<button data-v="${v}">${v} SOL</button>`).join("");
  else q.innerHTML = [25,50,100].map(v=>`<button data-p="${v}">${v}%</button>`).join("");
  let bal=null;
  if (wallet) try { bal = await balanceOf(m); $("#balIn").textContent = "Saldo: "+num(bal); } catch { $("#balIn").textContent = "Saldo non disponibile"; }
  q.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    if (b.dataset.v) $("#amtIn").value=b.dataset.v;
    else { if (bal==null) return toast(wallet?"Saldo non disponibile (RPC)":"Collega Phantom per usare le percentuali",true); $("#amtIn").value = +(bal*b.dataset.p/100).toFixed(6); }
    update(); });
}
function update(){ clearTimeout(qTimer); qTimer=setTimeout(getQuote,400); }
let impact=0;
function renderBtn(){
  const go=$("#go"); if(!go) return;
  if (!quote) return;
  if (!wallet){ go.textContent="Collega Phantom per scambiare"; go.disabled=false; go.onclick=connect; return; }
  go.onclick=doSwap;
  const blocked = impact>CONFIG.IMPACT_BLOCK && !$("#guard").checked;
  go.textContent = blocked ? "Conferma l'impatto sul prezzo" : "Scambia"; go.disabled = blocked;
}
async function getQuote(){
  const go=$("#go"); if(!go) return;
  const a=parseFloat(($("#amtIn").value||"").replace(",",".")), i=findTok($("#tokIn").value), o=findTok($("#tokOut").value);
  quote=null; $("#amtOut").value=""; $("#info").textContent=""; $("#guardL").classList.add("hidden"); go.onclick=doSwap;
  const set=(t,d)=>{ go.textContent=t; go.disabled=d; };
  if (i.mint===o.mint) return set("Scegli due token diversi",true);
  if (!a||a<=0) return set("Inserisci un importo",true);
  set("Cerco il percorso migliore…",true);
  const amount = BigInt(Math.round(a*10**i.dec)).toString();
  let url = `${CONFIG.JUP}/swap/v1/quote?inputMint=${i.mint}&outputMint=${o.mint}&amount=${amount}&slippageBps=${slippage}`;
  if (CONFIG.PLATFORM_FEE_BPS>0 && CONFIG.FEE_ACCOUNT) url += `&platformFeeBps=${CONFIG.PLATFORM_FEE_BPS}`;
  try {
    const q = await getJSON(url,{ttl:8000,tries:2}); if (q.error) throw new Error(q.error);
    quote=q; impact=Number(q.priceImpactPct)*100;
    $("#amtOut").value = num(Number(q.outAmount)/10**o.dec);
    const route=(q.routePlan||[]).map(x=>x.swapInfo.label).join(" → ");
    $("#info").innerHTML = `Minimo ricevuto: ${num(Number(q.otherAmountThreshold)/10**o.dec)} ${esc(o.sym)}<br>Impatto sul prezzo: <span class="${impact>CONFIG.IMPACT_WARN?"warn":""}">${impact.toFixed(2)}%</span> · Slippage ${slippage/100}% · Via ${esc(route)}`
      + (feeOn()?`<br><span class="warn">Commissione piattaforma ZSwap: ${CONFIG.PLATFORM_FEE_BPS/100}% (inclusa nella stima)</span>`:"")
      + (impact>CONFIG.IMPACT_WARN?`<br><span class="warn">⚠ Liquidità bassa: impatto sul prezzo elevato.</span>`:"");
    if (impact>CONFIG.IMPACT_BLOCK) $("#guardL").classList.remove("hidden");
    renderBtn();
  } catch(e){ set("Nessun percorso disponibile",true); $("#info").innerHTML=`<span class="err">${esc(e.message)}${i.mint.endsWith("pump")||o.mint.endsWith("pump")?" — se il token è ancora sulla bonding curve, prova direttamente su pump.fun.":""}</span>`; }
}
async function doSwap(){
  if (!quote||!wallet) return; const go=$("#go"), st=$("#status"), q=quote;
  go.disabled=true; go.textContent="Preparo la transazione…";
  try {
    const body={quoteResponse:q,userPublicKey:wallet,dynamicComputeUnitLimit:true,prioritizationFeeLamports:"auto"};
    if (CONFIG.PLATFORM_FEE_BPS>0 && CONFIG.FEE_ACCOUNT) body.feeAccount=CONFIG.FEE_ACCOUNT;
    const r = await fetch(`${CONFIG.JUP}/swap/v1/swap`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const j = await r.json(); if (!j.swapTransaction) throw new Error(j.error||"Swap non disponibile");
    const { VersionedTransaction } = await import("https://esm.sh/@solana/web3.js@1.95.3");
    const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(j.swapTransaction),c=>c.charCodeAt(0)));
    go.textContent="Firma in Phantom…";
    const { signature } = await provider().signAndSendTransaction(tx);
    st.className="small ok"; st.innerHTML=`Inviata: <a href="https://solscan.io/tx/${signature}" target="_blank" rel="noopener">vedi su Solscan</a>`;
    const i=findTok(q.inputMint), o=findTok(q.outputMint);
    const h=LS.get("zs_hist",[]); h.unshift({t:Date.now(),sig:signature,in:`${num(q.inAmount/10**i.dec)} ${i.sym}`,out:`${num(q.outAmount/10**o.dec)} ${o.sym}`}); LS.set("zs_hist",h.slice(0,20));
    st.innerHTML += ` · <a target="_blank" rel="noopener" href="${xShare(`Ho appena usato ZSwap Hub di @ZDOS_Core per uno scambio su Solana via Jupiter. DYOR`, location.origin)}">Condividi su X</a>`;
    renderHist(); toast("Transazione inviata");
  } catch(e){ st.className="small err"; st.textContent="Errore: "+(e.message||e); }
  getQuote();
}
function renderHist(){ const el=$("#hist"); if(!el) return; const h=LS.get("zs_hist",[]);
  el.innerHTML = h.length ? `<table>${h.map(x=>`<tr><td>${new Date(x.t).toLocaleString("it-IT")}</td><td>${esc(x.in)} → ${esc(x.out)}</td><td><a target="_blank" rel="noopener" href="https://solscan.io/tx/${x.sig}">tx</a></td></tr>`).join("")}</table>` : `<p class="muted small">Nessuno scambio salvato in questo browser.</p>`; }
// ======================= PORTFOLIO =======================
async function portfolio(){
  if (!wallet){ view.innerHTML=`<section class="card"><h2>Portfolio</h2><p class="muted">Collega Phantom per vedere SOL e token SPL del tuo wallet. Solo lettura: nessuna firma richiesta.</p><button class="btn" id="pc">Collega Phantom</button></section>`; $("#pc").onclick=connect; return; }
  view.innerHTML=`<section class="card"><h2>Portfolio <span class="muted small">${short(wallet)}</span></h2><div id="pf"><div class="skel"></div></div></section>`;
  try {
    const sol=(await rpc("getBalance",[wallet])).value/1e9;
    const progs=["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];
    const accs=(await Promise.all(progs.map(pid=>rpc("getTokenAccountsByOwner",[wallet,{programId:pid},{encoding:"jsonParsed"}]).then(r=>r.value).catch(()=>[])))).flat();
    const toks={}; for (const a of accs){ const i=a.account.data.parsed.info; const v=i.tokenAmount.uiAmount||0; if (v>0) toks[i.mint]=(toks[i.mint]||0)+v; }
    const mints=[SOL,...Object.keys(toks)]; const prices={};
    for (let i=0;i<mints.length;i+=50){ try { Object.assign(prices, await getJSON(`${CONFIG.JUP}/price/v3?ids=${mints.slice(i,i+50).join(",")}`)); } catch {} }
    const pairs = await pairsFor(Object.keys(toks)).catch(()=>({}));
    const rows=[{mint:SOL,sym:"SOL",amt:sol},...Object.entries(toks).map(([m,a])=>({mint:m,sym:pairs[m]?.baseToken.symbol||findTok(m)?.sym||short(m),amt:a}))]
      .map(r=>({...r,val:r.amt*(prices[r.mint]?.usdPrice ?? +pairs[r.mint]?.priceUsd ?? NaN)})).sort((a,b)=>(b.val||0)-(a.val||0));
    const tot=rows.reduce((s,r)=>s+(r.val||0),0);
    $("#pf").innerHTML=`<p>Valore stimato: <b>${usd(tot)}</b></p><table><tr><th>Token</th><th>Quantità</th><th>Valore</th><th></th></tr>${rows.map(r=>`<tr><td><a href="#/token/${r.mint}">${esc(r.sym)}</a></td><td>${num(r.amt,4)}</td><td>${usd(r.val)}</td><td>${r.mint!==SOL?`<a href="#/swap?in=${r.mint}&out=${SOL}">Vendi</a>`:""}</td></tr>`).join("")}</table>`;
  } catch(e){ $("#pf").innerHTML=`<p class="err">${esc(e.message)}</p>`; }
}
// ======================= WATCHLIST & AVVISI =======================
function toggleWatch(t){ let l=LS.get(wkey(),[]); if (l.some(w=>w.mint===t.mint)){ l=l.filter(w=>w.mint!==t.mint); toast("Rimosso dalla watchlist"); } else { l.push({...t,thr:10}); toast("Aggiunto alla watchlist"); } LS.set(wkey(),l); }
async function watch(){
  const l=LS.get(wkey(),[]);
  view.innerHTML=`<section class="card"><h2>Watchlist & Avvisi</h2><p class="muted small">Salvata solo in questo browser. Gli avvisi funzionano mentre la pagina è aperta: ricevi una notifica quando il prezzo si muove oltre la soglia rispetto al prezzo di riferimento.</p>
   ${siwsOk()?`<p class="ok small">Watchlist personale del wallet ${short(wallet)}</p>`:`<p class="muted small">Suggerimento: con “Accedi con wallet” (menu del wallet) la watchlist diventa personale per quel wallet, sempre solo in questo browser.</p>`}<div class="acts"><button class="btn ghost" id="notif">Attiva notifiche del browser</button><a class="btn ghost" id="wshare" target="_blank" rel="noopener">Condividi su X</a></div><div id="wl" style="margin-top:12px"></div></section>`;
  $("#notif").onclick=()=>("Notification" in window)?Notification.requestPermission().then(p=>toast(p==="granted"?"Notifiche attive":"Notifiche non consentite",p!=="granted")):toast("Notifiche non supportate",true);
  $("#wshare").href = xShare(`La mia watchlist Solana su ZSwap Hub: ${l.map(w=>w.sym).join(" ")||"(vuota)"} — sempre DYOR`, location.origin+location.pathname+"#/watch");
  if (!l.length){ $("#wl").innerHTML=`<p class="muted">Vuota. Aggiungi token dalla loro scheda (☆ Watchlist).</p>`; return; }
  const pairs=await pairsFor(l.map(w=>w.mint)).catch(()=>({}));
  $("#wl").innerHTML=`<table><tr><th>Token</th><th>Prezzo</th><th>Da rif.</th><th>Soglia %</th><th></th></tr>${l.map(w=>{ const p=+pairs[w.mint]?.priceUsd; const ch=w.base&&p?(p/w.base-1)*100:null;
    return `<tr><td><a href="#/token/${w.mint}">${esc(w.sym)}</a></td><td>${p?"$"+p:"—"}</td><td>${pct(ch)}</td><td><input type="number" min="1" value="${w.thr}" data-thr="${w.mint}" style="width:60px;font-size:.9rem"></td><td><button class="btn ghost" data-rb="${w.mint}" title="Usa il prezzo attuale come riferimento">↺</button> <button class="btn ghost" data-rm="${w.mint}">✕</button></td></tr>`; }).join("")}</table>`;
  const save=f=>{ const l2=LS.get(wkey(),[]); f(l2); LS.set(wkey(),l2); };
  view.querySelectorAll("[data-thr]").forEach(i=>i.onchange=()=>save(l2=>{ const w=l2.find(x=>x.mint===i.dataset.thr); if(w) w.thr=Math.max(1,+i.value); }));
  view.querySelectorAll("[data-rb]").forEach(b=>b.onclick=()=>{ save(l2=>{ const w=l2.find(x=>x.mint===b.dataset.rb); if(w) w.base=+pairs[w.mint]?.priceUsd||w.base; }); watch(); });
  view.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{ save(l2=>l2.splice(l2.findIndex(x=>x.mint===b.dataset.rm),1)); watch(); });
}
async function alertLoop(){
  const l=LS.get(wkey(),[]); if (!l.length) return;
  try { const pairs=await pairsFor(l.map(w=>w.mint)); let changed=false;
    for (const w of l){ const p=+pairs[w.mint]?.priceUsd; if(!p) continue; if(!w.base){ w.base=p; changed=true; continue; }
      const ch=(p/w.base-1)*100;
      if (Math.abs(ch)>=w.thr){ const msg=`${w.sym}: ${ch>=0?"+":""}${ch.toFixed(1)}% dal riferimento`; toast("🔔 "+msg);
        if ("Notification" in window && Notification.permission==="granted") new Notification("ZSwap Hub",{body:msg});
        w.base=p; changed=true; } }
    if (changed) LS.set(wkey(),l);
  } catch {}
}
setInterval(alertLoop,60000); setTimeout(alertLoop,5000);
// ======================= COMMUNITY =======================
async function community(){
  view.innerHTML=`<section class="card"><h2>Community ZDOS</h2><p class="muted">Token di community usati nell'ecosistema ZDOS / Red Velvet. Nessuna promessa di guadagno.</p>
   <div class="acts"><a class="btn ghost" target="_blank" rel="noopener" href="https://x-zdos.it">🌐 x-zdos.it</a><a class="btn ghost" target="_blank" rel="noopener" href="https://x.com/ZDOS_Core">𝕏 @ZDOS_Core</a>
   <a class="btn ghost" target="_blank" rel="noopener" href="https://t.me/RedVelvetOfficial_bot">✈ @RedVelvetOfficial_bot</a><a class="btn ghost" target="_blank" rel="noopener" href="https://high-cde.github.io/VelvetHub/">🍷 VelvetHub</a><a class="btn" target="_blank" rel="noopener" href="https://x.com/intent/follow?screen_name=ZDOS_Core">Segui @ZDOS_Core</a></div></section>
   <section class="card"><h2>Ultimi post di @ZDOS_Core</h2><div class="xbox" id="xbox"><a class="twitter-timeline" data-theme="dark" data-height="520" data-chrome="noheader nofooter transparent" href="https://twitter.com/ZDOS_Core">Post di @ZDOS_Core</a></div></section>
   <section class="feed" id="feat">${'<div class="skel"></div>'.repeat(2)}</section>`;
  loadXEmbed();
  const pairs=await pairsFor(FEATURED.map(f=>f.mint)).catch(()=>({}));
  $("#feat").innerHTML=FEATURED.map(f=>{ const p=pairs[f.mint]; return `<div class="card"><a class="tc" style="padding:0" href="#/token/${f.mint}">${logo(f.logo,f.sym)}<div><h4>${f.name} <span class="muted">${f.sym}</span></h4><div class="s"><span>Prezzo ${p?.priceUsd?"$"+p.priceUsd:"—"}</span><span>Liq ${usd(p?.liquidity?.usd)}</span><span>Pool ${esc(p?.dexId||"—")}</span><span>24h ${pct(p?.priceChange?.h24)}</span></div></div></a>
    <code class="muted small" style="word-break:break-all">${f.mint}</code><div class="acts" style="margin-top:8px"><a class="btn" href="#/token/${f.mint}">Scheda & rischi</a><a class="btn ghost" href="#/swap?in=${SOL}&out=${f.mint}">Swap</a></div></div>`; }).join("");
}
function loadXEmbed(){
  const fallback = () => { const b=$("#xbox"); if (b && !b.querySelector("iframe")) b.innerHTML = `<p class="muted">Il widget di X non si è caricato (bloccato dal browser, da un'estensione o da Telegram). <a target="_blank" rel="noopener" href="https://x.com/ZDOS_Core">Apri @ZDOS_Core su X →</a></p>`; };
  const go = () => window.twttr?.widgets?.load($("#xbox")).then(()=>setTimeout(fallback,4000)).catch(fallback);
  if (window.twttr?.widgets) return go();
  const sc=document.createElement("script"); sc.src="https://platform.twitter.com/widgets.js"; sc.async=true; sc.onload=go; sc.onerror=fallback; document.head.append(sc);
  setTimeout(fallback,9000);
}
// ======================= GUIDA =======================
function guida(){
  view.innerHTML=`<section class="card guide"><h2>Guida & Sicurezza per utenti pump.fun</h2>
  <h3>Bonding curve</h3><p>Su pump.fun ogni nuovo token nasce su una <b>bonding curve</b>: il prezzo sale quando si compra e scende quando si vende, secondo una formula. Non c'è ancora un pool di liquidità separato.</p>
  <h3>Migrazione su PumpSwap</h3><p>Quando la curva si completa, la liquidità viene spostata su <b>PumpSwap</b> (DEX di pump.fun). Da lì il token è scambiabile anche tramite aggregatori come Jupiter, che ZSwap usa per le quotazioni.</p>
  <h3>Slippage e impatto sul prezzo</h3><p>Lo <b>slippage</b> è la variazione massima che accetti tra stima ed esecuzione. L'<b>impatto sul prezzo</b> dipende da quanto è grande il tuo ordine rispetto alla liquidità: con pool piccoli può essere enorme. ZSwap avvisa sopra il ${CONFIG.IMPACT_WARN}% e chiede conferma sopra il ${CONFIG.IMPACT_BLOCK}%.</p>
  <h3>Segnali di rischio (rug)</h3><ul><li>Mint authority o freeze authority non revocate.</li><li>Pochi wallet che detengono gran parte della supply.</li><li>Liquidità molto bassa o rimossa all'improvviso.</li><li>Token di poche ore con hype aggressivo, promesse di guadagno, finti "partner" famosi.</li><li>Siti o bot che chiedono di "verificare" o "sincronizzare" il wallet.</li></ul>
  <h3>Regole d'oro</h3><ul><li><b>Non condividere mai la seed phrase o la chiave privata</b>, con nessuno, nemmeno con "il supporto".</li><li>Controlla sempre il mint, non solo il nome: i nomi si copiano facilmente.</li><li>Leggi cosa firmi in Phantom.</li><li>Usa solo cifre che puoi permetterti di perdere.</li></ul>
  <h3>Wallet e X</h3><p>“Accedi con wallet” chiede solo di <b>firmare un messaggio</b> (non una transazione): la firma resta in questo browser per personalizzare watchlist e portfolio. ZSwap non chiede mai seed phrase o chiavi private. I pulsanti “Condividi su X” aprono solo la finestra di X precompilata: nulla viene pubblicato automaticamente.</p><h3>Avvertenze</h3><p>ZSwap Hub è un'interfaccia statica e indipendente, companion per la community pump.fun, <b>non affiliata a pump.fun</b>. Non custodisce fondi, non ha chiavi private e non applica commissioni. Gli scambi passano da Jupiter e li firmi tu. I dati provengono da fonti pubbliche e possono essere incompleti o in ritardo. Nessun contenuto è un consiglio finanziario. Token di community, nessuna promessa di guadagno. DYOR.</p></section>`;
}
route();
