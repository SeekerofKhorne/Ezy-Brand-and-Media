/* ============================================================
   BRAND PAGE: keyword chips with autocomplete, the brand fingerprint (radar),
   the two steps (describe, build), the sample-post preview, saved palettes,
   and the brand-look card on the Media page.
   Uses state, parsed and the builders from ui.js; Lib (lib.js) owns saving.
   ============================================================ */

/* ---------- fingerprint ----------
   Eight fixed axes so every brand's shape means the same thing:
   Aaker's five personality dimensions, then pleasure, arousal and dominance.
   Personality axes run from 0 (not asked for) to 1 (the strongest concept).
   The three feeling axes are bipolar: 0.5 is neutral. Only concepts that carry
   a pleasure-arousal-dominance position in concepts.js move them, so an emotion
   with no position (amusement, love, admiration, compassion) moves no axis.
   No mapping is invented to make the chart look fuller. */
const FP_AXES=[{id:'sincerity',label:'Sincerity'},{id:'excitement',label:'Excitement'},{id:'competence',label:'Competence'},{id:'sophistication',label:'Sophistication'},{id:'ruggedness',label:'Ruggedness'},
  {pad:0,label:'Pleasure'},{pad:1,label:'Arousal'},{pad:2,label:'Dominance'}];
const onChart=id=>{const c=CONCEPT_BY_ID[id];return !!c&&(FP_AXES.some(a=>a.id===id)||!!(c.pad&&c.pad.some(Boolean)));};
/* Both shapes are scaled to their own strongest on-chart concept, so they compare by shape, not by raw totals. */
function fingerprint(w){const ids=Object.keys(w||{}).filter(k=>w[k]>0&&onChart(k));if(!ids.length)return null;const mx=Math.max(...ids.map(k=>w[k]));
  return FP_AXES.map(a=>{if(a.pad==null){const v=w[a.id]||0;return{v:Math.min(1,v/mx),set:v>0};}
    let num=0,den=0;for(const k of ids){const c=CONCEPT_BY_ID[k];if(c.pad&&c.pad[a.pad]){num+=w[k]*c.pad[a.pad];den+=w[k];}}
    return{v:den?.5+.5*clamp(num/Math.max(den,mx),-1,1):.5,set:den>0};});}
/* What the current colors, type and graphic signal, as concept weights. */
function picksWeights(){const a=draftAgg(),w={};for(const k in a)w[k]=a[k].w;return w;}

const SVGNS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs){const n=document.createElementNS(SVGNS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);return n;}
/* series: [{fp, cls}] drawn in order. */
function radarSVG(series,size,label){const W=size+150,H=size+44,cx=W/2,cy=H/2,r=size/2-4,n=FP_AXES.length;
  const pt=(i,v)=>{const a=-Math.PI/2+i*2*Math.PI/n;return[cx+r*v*Math.cos(a),cy+r*v*Math.sin(a)];};const pts=vals=>vals.map((v,i)=>pt(i,v).map(x=>x.toFixed(1)).join(',')).join(' ');
  const svg=svgEl('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':label,class:'radarsvg'});
  [.25,.5,.75,1].forEach(k=>svg.append(svgEl('polygon',{points:pts(Array(n).fill(k)),class:'rg'})));
  for(let i=0;i<n;i++){const[x,y]=pt(i,1);svg.append(svgEl('line',{x1:cx,y1:cy,x2:x.toFixed(1),y2:y.toFixed(1),class:'rg'}));}
  /* the neutral line on the three bipolar axes */
  const pad=FP_AXES.map((a,i)=>a.pad!=null?i:-1).filter(i=>i>=0);svg.append(svgEl('polyline',{points:pad.map(i=>pt(i,.5).map(x=>x.toFixed(1)).join(',')).join(' '),class:'rn'}));
  series.forEach(s=>{if(!s.fp)return;svg.append(svgEl('polygon',{points:pts(s.fp.map(a=>a.v)),class:'rs '+s.cls}));
    s.fp.forEach((a,i)=>{if(!a.set)return;const[x,y]=pt(i,a.v);svg.append(svgEl('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:3,class:'rd '+s.cls}));});});
  FP_AXES.forEach((a,i)=>{const[x,y]=pt(i,1.1);const deg=i*360/n;const t=svgEl('text',{x:x.toFixed(1),y:(y+(deg===0?-2:deg===180?10:4)).toFixed(1),'text-anchor':deg===0||deg===180?'middle':deg<180?'start':'end',class:'rl'});t.textContent=a.label;svg.append(t);});
  const title=svgEl('title',{});title.textContent=label;svg.prepend(title);return svg;}
function fpText(fp){return FP_AXES.map((a,i)=>a.label+' '+(a.pad==null?Math.round(fp[i].v*100)+'%':fp[i].v>.6?'high':fp[i].v<.4?'low':'neutral')).join(', ');}

function updateFingerprint(){const tgt=fingerprint(parsed.cw),cur=fingerprint(picksWeights());
  const big=$('#radarBig');big.textContent='';big.append(radarSVG([{fp:tgt,cls:'rt'}],300,tgt?'Brand fingerprint from your keywords: '+fpText(tgt):'Brand fingerprint: no keywords yet'));
  const sm=$('#radarSmall');sm.textContent='';sm.append(radarSVG([{fp:cur,cls:'rc'},{fp:tgt,cls:'rt'}],190,'Keywords compared with current picks'+(tgt?'. Keywords: '+fpText(tgt):'')+(cur?'. Picks: '+fpText(cur):'')));
  const list=$('#fpList');list.textContent='';const cw=parsed.cw,ids=Object.keys(cw).sort((a,b)=>cw[b]-cw[a]).slice(0,6);
  if(!ids.length)list.append(el('p',{class:'empty',text:'Add a keyword to see what it asks for.'}));
  const mx=ids.length?cw[ids[0]]:1;ids.forEach(id=>list.append(el('div',{class:'sig'},el('span',{class:'nm',text:cLabel(id)}),el('span',{class:'bar'},el('i',{style:`width:${Math.round(cw[id]/mx*100)}%`})),el('span',{class:'from',text:onChart(id)?'':'not on the chart'}))));
  $('#fpFit').textContent=fitSentence(tgt,cur);}
function fitSentence(t,c){if(!t)return'Add keywords to compare them with your picks.';if(!c)return'';const d=FP_AXES.map((a,i)=>({a,d:c[i].v-t[i].v})).filter(x=>Math.abs(x.d)>=.2).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d));
  if(!d.length)return'Close fit: your picks signal what your keywords ask for.';const hi=d.filter(x=>x.d>0).slice(0,2).map(x=>x.a.label),lo=d.filter(x=>x.d<0).slice(0,2).map(x=>x.a.label);
  return'Your picks run '+[hi.length?'higher on '+hi.join(' and '):'',lo.length?'lower on '+lo.join(' and '):''].filter(Boolean).join(' and ')+' than your keywords ask for.';}

/* ---------- keywords: committed words are chips; the box holds the word being typed ---------- */
const kwList=()=>String(state.query||'').split(/[,;\n]+/).map(s=>s.trim()).filter(Boolean);
function setKw(list){state.query=list.join(', ');renderChips();runSearch();}
function commitKeywords(text){const cur=kwList(),low=cur.map(w=>w.toLowerCase());String(text).split(/[,;\n]+/).map(s=>s.trim().replace(/\s+/g,' ')).filter(Boolean).forEach(w=>{if(!low.includes(w.toLowerCase())){cur.push(w);low.push(w.toLowerCase());}});setKw(cur);}
function removeKeyword(i){const cur=kwList();cur.splice(i,1);setKw(cur);}
function replaceKeyword(from,to){const cur=kwList().map(w=>w.toLowerCase()===from.toLowerCase()?to:w);setKw(cur);}
/* The word being typed counts toward the results and the fingerprint as soon as it is a known keyword. */
function liveQuery(){const q=$('#q'),f=q?q.value.trim():'';return f&&lookup(f.toLowerCase())?(state.query?state.query+', ':'')+f:state.query||'';}
function renderChips(){const box=$('#kwChips');box.textContent='';kwList().forEach((w,i)=>{const miss=!lookup(w.toLowerCase())&&parseQuery(w).concepts.length===0;
  box.append(el('span',{class:'chip'+(miss?' miss':''),title:miss?'No link on file for this word':''},el('span',{text:w}),el('button',{type:'button','aria-label':'Remove '+w,text:'×',onclick:()=>{removeKeyword(i);$('#q').focus();}})));});
  const ws=kwList();$('#q').placeholder=ws.length?'Add another word':'calm, trustworthy, premium';
  const rd=$('#kwRead');rd.textContent='';if(!ws.length)rd.append(el('p',{class:'empty',text:'No keywords. Everything is listed unranked.'}));ws.forEach(w=>rd.append(el('span',{class:'term',text:w})));}

/* Autocomplete over every word the index knows: concept names, Aaker's trait words,
   synonyms and the reviewed suggested words. Prefix match; known kinds rank first. */
const KIND_RANK={name:0,aaker:1,syn:2,sugg:3};
let acItems=[],acIdx=-1;
function acCandidates(f){const taken=new Set(kwList().map(w=>w.toLowerCase()));const rows=[];
  for(const k of LEX_KEYS){if(!k.startsWith(f)||taken.has(k))continue;const hits=LEX[k];rows.push({w:k,hits,rank:k===f?-1:Math.min(...hits.map(h=>KIND_RANK[h.kind]))});}
  rows.sort((a,b)=>a.rank-b.rank||a.w.length-b.w.length||a.w.localeCompare(b.w));return rows.slice(0,8);}
function acRender(){const q=$('#q'),list=$('#acList'),f=q.value.trim().toLowerCase();list.textContent='';acItems=[];acIdx=-1;q.removeAttribute('aria-activedescendant');
  if(f.length<2){list.hidden=true;q.setAttribute('aria-expanded','false');return;}
  acItems=acCandidates(f);let near=false;if(!acItems.length&&f.length>=4){acItems=nearest(f).filter(w=>LEX[w]).map(w=>({w,hits:LEX[w]}));near=acItems.length>0;}
  if(!acItems.length){list.append(el('div',{class:'acnone',text:'No keyword starts with “'+f+'”. Press Enter to add it anyway; it will be reported, not guessed.'}));}
  else if(near)list.append(el('div',{class:'acnone',text:'No exact match. Did you mean:'}));
  acItems.forEach((it,i)=>{const cs=[...new Set(it.hits.map(h=>h.c))].slice(0,2),sg=it.hits.every(h=>h.kind==='sugg'),c0=CONCEPT_BY_ID[cs[0]],g=GROUPS.find(x=>x.id===c0.group);
    const word=near?el('span',{class:'w',text:it.w}):el('span',{class:'w'},el('b',{text:it.w.slice(0,f.length)}),it.w.slice(f.length));
    const opt=el('div',{role:'option',id:'ac-'+i,class:'acopt','aria-selected':'false'},word,el('span',{class:'to',text:'→ '+cs.map(id=>cLabel(id)+(CONCEPT_BY_ID[id].bridge?' (value)':'')).join(', ')}),sg?el('span',{class:'ev',text:'suggested word',title:'Suggested by a language model and reviewed by hand. Mapped by meaning only.'}):tierEl(g.src));
    opt.addEventListener('mousedown',e=>{e.preventDefault();acPick(i);});list.append(opt);});
  list.hidden=false;q.setAttribute('aria-expanded','true');}
function acMove(d){if(!acItems.length)return;acIdx=(acIdx+d+acItems.length)%acItems.length;document.querySelectorAll('#acList .acopt').forEach((o,i)=>o.setAttribute('aria-selected',String(i===acIdx)));
  const q=$('#q');q.setAttribute('aria-activedescendant','ac-'+acIdx);const o=$('#ac-'+acIdx);if(o&&o.scrollIntoView)o.scrollIntoView({block:'nearest'});}
function acPick(i){const it=acItems[i];if(!it)return;$('#q').value='';commitKeywords(it.w);acClose();$('#q').focus();}
function acClose(){$('#acList').hidden=true;acItems=[];acIdx=-1;const q=$('#q');q.setAttribute('aria-expanded','false');q.removeAttribute('aria-activedescendant');}

/* ---------- steps and the build panel ---------- */
function setStep(s){state.bstep=s==='build'?'build':'describe';const b=state.bstep==='build';$('#bDescribe').hidden=b;$('#bBuild').hidden=!b;
  $('#bStep1').setAttribute('aria-current',String(!b));$('#bStep2').setAttribute('aria-current',String(b));if(b){buildResults();}requestPaint(false);}
const PV_FMT={square:'ig-square',story:'ig-story',banner:'fb-link'};
function paintBrand(){updateFingerprint();if(state.bstep!=='build')return;const fid=PV_FMT[state.pvFmt]||PV_FMT.square,f=FMT[fid];
  const layout=f.layouts.includes(state.layout)?state.layout:f.layouts.includes('announce')?'announce':f.layouts[0];
  const st=$('#pvStage'),aw=Math.max(120,st.clientWidth-36),ah=Math.max(160,st.clientHeight-36);renderTo($('#pcv'),Object.assign({},state,{format:fid,layout}),aw,ah,{});}
function syncPvFmt(){document.querySelectorAll('#pvFmt button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===state.pvFmt)));}
function syncIdentity(){const n=$('#bName'),h=$('#bHandle');if(document.activeElement!==n)n.value=state.brandName||'';if(document.activeElement!==h)h.value=state.handle||'';}
/* Saved palettes lead the Colors tab: the brand's own set, switched with one click. */
function renderSavedPals(){const box=$('#savedPals');box.textContent='';box.hidden=state.tab!=='colors';if(box.hidden)return;
  box.append(el('div',{class:'h',style:'margin:0 0 6px',text:'Saved to this brand'}));const row=el('div',{class:'mpals'});
  myPalettes.forEach(p=>row.append(palChip(p.name,p,state.paletteId===p.id&&!isCustom(),()=>apply('colors',p.id))));
  row.append(el('button',{type:'button',class:'btn small',text:myPalettes.length?'+ Save current colors':'+ Save current colors as a palette',onclick:()=>Lib.askPalette()}));box.append(row);
  if(!myPalettes.length)box.append(el('p',{class:'note',text:'Pick a premade palette or build your own, then save it here. Saved palettes can be switched on any post.'}));}
function palChip(name,cols,on,fn){return el('button',{type:'button',class:'palpick','aria-pressed':String(on),onclick:fn},el('span',{class:'vis sw'},ROLES.map(([r])=>el('i',{style:'width:20%;background:'+cols[r]}))),el('span',{text:name}));}
const sameColors=(a,b)=>ROLES.every(([r])=>String(a[r]).toUpperCase()===String(b[r]).toUpperCase());

/* ---------- Media page: the brand's look, and switching between its palettes ---------- */
function renderLook(){const box=$('#mPals');if(!box)return;const L=Lib.look(),t=TYP[state.typeId]||TYP.clear,g=GRA[state.graphicId];box.textContent='';
  $('#mLookNote').textContent=(state.brandName||'This brand')+': '+t.name+' type, '+(g?g.name.toLowerCase():'no')+' graphic. Choose which saved palette this post uses.';
  if(L)box.append(palChip('Brand colors',L.colors,sameColors(state.colors,L.colors),()=>{state.paletteId=L.paletteId;state.colors=Object.assign({},L.colors);buildColors();renderLook();requestPaint(true);}));
  myPalettes.forEach(p=>box.append(palChip(p.name,p,sameColors(state.colors,p),()=>{state.paletteId=p.id;state.colors=palColors(p);buildColors();renderLook();requestPaint(true);})));}

function bootBrand(){const q=$('#q');let qt=0;const live=()=>{clearTimeout(qt);qt=setTimeout(runSearch,120);};
  q.addEventListener('input',()=>{const v=q.value;if(/[,;\n]/.test(v)){const parts=v.split(/[,;\n]/),last=parts.pop();if(parts.join('').trim())commitKeywords(parts.join(','));q.value=last.replace(/^\s+/,'');}acRender();live();});
  q.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();if($('#acList').hidden)acRender();acMove(1);}else if(e.key==='ArrowUp'){e.preventDefault();acMove(-1);}
    /* Enter keeps a known word as typed; a partial word takes the top prefix match. A near spelling is only offered, never taken. */
    else if(e.key==='Enter'){e.preventDefault();const f=q.value.trim();if(acIdx>=0)acPick(acIdx);else if(f&&!lookup(f.toLowerCase())&&acItems.length&&acItems[0].w.startsWith(f.toLowerCase()))acPick(0);else if(f){commitKeywords(f);q.value='';acClose();}}
    else if(e.key==='Escape'){if(!$('#acList').hidden){e.stopPropagation();acClose();}}
    else if(e.key==='Backspace'&&!q.value&&kwList().length){removeKeyword(kwList().length-1);}});
  q.addEventListener('blur',()=>setTimeout(acClose,120));
  $('#kwbox').addEventListener('click',e=>{if(e.target===e.currentTarget||e.target.id==='kwChips')q.focus();});
  const sg=$('#sugg');sg.append(el('span',{class:'note',style:'margin:0 4px 0 0',text:'Try:'}));SUGGEST.forEach(w=>sg.append(el('button',{type:'button',text:w,onclick:()=>addKeyword(w)})));buildDirectory();
  $('#btnUseKw').addEventListener('click',()=>{if(q.value.trim()){commitKeywords(q.value);q.value='';}setStep('build');window.scrollTo(0,0);});
  $('#btnEditKw').addEventListener('click',()=>{setStep('describe');q.focus();});
  $('#bStep1').addEventListener('click',()=>setStep('describe'));$('#bStep2').addEventListener('click',()=>setStep('build'));
  document.querySelectorAll('#pvFmt button').forEach(b=>b.addEventListener('click',()=>{state.pvFmt=b.dataset.v;syncPvFmt();requestPaint(false);}));
  $('#bName').addEventListener('input',e=>{state.brandName=e.target.value;requestPaint(true);});$('#bHandle').addEventListener('input',e=>{state.handle=e.target.value;requestPaint(true);});
  $('#btnEditBrand').addEventListener('click',()=>Lib.setView('brand'));}
