/* ============================================================
   UI: state, search results, color builder, template picker, drafts, export
   ============================================================ */
const $=s=>document.querySelector(s);
function el(tag,attrs){const n=document.createElement(tag);if(attrs)for(const k in attrs){const v=attrs[k];if(v==null||v===false)continue;if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(k==='style')n.style.cssText=v;else n.setAttribute(k,v===true?'':v);}
  for(let i=2;i<arguments.length;i++){const c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(x=>x!=null&&x!==false&&n.append(x));else n.append(c);}return n;}
const store={get(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
/* A palette is four colors. `surface`, the panel tint, still travels with them so saved brands and posts draw as
   they did, but it is worked out, not chosen: palColors fills it in when it is missing, and putColor re-derives it
   when the ground, primary or text changes. */
const ROLES=[['bg','Ground'],['primary','Primary'],['accent','Accent'],['text','Text']];
const ROLE_NAME={bg:'ground',primary:'primary',accent:'accent',text:'text'};
const palColors=p=>({bg:p.bg,surface:validHex(String(p.surface||''))?p.surface:autoPanel(p.bg,p.primary,p.text),primary:p.primary,accent:p.accent,text:p.text});
function putColor(role,hex){state.colors[role]=hex.toUpperCase();if(role!=='accent')state.colors.surface=autoPanel(state.colors.bg,state.colors.primary,state.colors.text);}
/* A palette drawn as a bar of its four colors. Each segment carries its hex, so pointing at it shows that color's fingerprint. */
const SW_W={bg:34,primary:30,accent:20,text:16};
function swBar(cols,even){return el('span',{class:'vis sw'},ROLES.map(([r])=>el('i',{'data-hex':String(cols[r]).toUpperCase(),'data-role':ROLE_NAME[r],style:`width:${even?25:SW_W[r]}%;background:${cols[r]}`})));}
const FMT={};FORMATS.forEach(f=>FMT[f.id]=f);const PAL={};const TYP={};TYPESETS.forEach(t=>TYP[t.id]=t);const GRA={};GRAPHICS.forEach(g=>GRA[g.id]=g);
/* Palettes the viewer saved from the builder are listed ahead of the preloaded ones. */
let myPalettes=[];
function registerPalettes(){for(let i=PALETTES.length-1;i>=0;i--)if(PALETTES[i].mine)PALETTES.splice(i,1);myPalettes.slice().reverse().forEach(p=>{p.mine=true;p.conv={};PALETTES.unshift(p);});for(const k in PAL)delete PAL[k];PALETTES.forEach(p=>{PAL[p.id]=p;if(!TAGS.palette[p.id]||p.mine)TAGS.palette[p.id]=tagPalette(p);});}
registerPalettes();
/* Custom type pairings work the same way: {id,name,d:[family,weight],b:[family,weight]}, kept with the brand.
   Pairings from every brand are registered so any saved post can be drawn; only the open brand's are listed. */
let myTypes=[];
const validType=m=>m&&m.id&&Array.isArray(m.d)&&Array.isArray(m.b)&&FONT_FACES[m.d[0]]&&FONT_FACES[m.b[0]];
const nearWeight=(family,w)=>{const ws=FONT_FACES[family]||[400];return ws.includes(+w)?+w:ws.reduce((a,b)=>Math.abs(b-w)<Math.abs(a-w)?b:a);};
function specFor(family,weight,role){let base=null;for(const t of TYPESETS){if(!t.mine&&t.display.family===family){base=t.display;break;}}if(!base)for(const t of TYPESETS){if(!t.mine&&t.body.family===family){base=t.body;break;}}
  const o=Object.assign({fb:FB.sans},base||{},{family,weight:nearWeight(family,weight)});if(role==='body'){delete o.upper;delete o.scale;}return o;}
function buildType(m,bid){const src=TYPESETS.find(t=>!t.mine&&t.display.family===m.d[0])||TYPESETS.find(t=>!t.mine&&t.body.family===m.d[0]);
  return{id:m.id,mine:true,bid,cls:src?src.cls:'sans',name:m.name||(m.d[0]+' with '+m.b[0]),display:specFor(m.d[0],m.d[1],'display'),body:specFor(m.b[0],m.b[1],'body'),f:Object.assign({},src?src.f:{sans:1}),conv:{}};}
function registerTypes(extra){for(let i=TYPESETS.length-1;i>=0;i--)if(TYPESETS[i].mine)TYPESETS.splice(i,1);const seen=new Set(),bid=typeof state==='undefined'?null:state.bid;
  const add=(m,b)=>{if(!validType(m)||seen.has(m.id))return;seen.add(m.id);TYPESETS.unshift(buildType(m,b));};
  myTypes.slice().reverse().forEach(m=>add(m,bid));Store.all('brand').forEach(b=>{if(b.id!==bid)(b.types||[]).forEach(m=>add(m,b.id));});(extra||[]).forEach(m=>add(m,'shared'));
  for(const k in TYP)delete TYP[k];TYPESETS.forEach(t=>{TYP[t.id]=t;if(t.mine||!TAGS.type[t.id])TAGS.type[t.id]=tagType(t);});}
const listedTypes=()=>TYPESETS.filter(t=>!t.mine||t.bid===state.bid);

/* Simple shows a guided set of controls; Advanced shows all of them. It is a display
   preference for this browser: it never changes what a post or a brand contains. */
const DEFAULT_PAL=BRANDS.sample.palette;
let uiMode=store.get('brandlab.mode.v1')==='advanced'?'advanced':'simple';
/* Directions on the fingerprint a graphic style can lean toward (see the graphics picker below). */
const LEANS=[{k:'sincerity',i:0,l:'Sincerity'},{k:'excitement',i:1,l:'Excitement'},{k:'competence',i:2,l:'Competence'},{k:'sophistication',i:3,l:'Sophistication'},{k:'ruggedness',i:4,l:'Ruggedness'},
 {k:'p+',i:5,d:1,l:'High pleasure'},{k:'p-',i:5,d:-1,l:'Low pleasure'},{k:'a+',i:6,d:1,l:'High arousal'},{k:'a-',i:6,d:-1,l:'Low arousal'},{k:'d+',i:7,d:1,l:'High dominance'},{k:'d-',i:7,d:-1,l:'Low dominance'}];
const LEAN_MIN=.45;
const LEAN_OPP={'p+':'p-','p-':'p+','a+':'a-','a-':'a+','d+':'d-','d-':'d+'};
const ADV_DEFAULTS={headScale:1,bodyScale:1,caps:'auto',fx:.5,fy:.5,tintAmt:.7,dim:1,showMark:true,showHandle:true};
const advActive=s=>Object.keys(ADV_DEFAULTS).some(k=>s[k]!==ADV_DEFAULTS[k]);
function setMode(m,quiet){uiMode=m==='advanced'?'advanced':'simple';store.set('brandlab.mode.v1',uiMode);document.body.classList.toggle('mode-simple',uiMode==='simple');document.body.classList.toggle('mode-advanced',uiMode==='advanced');
  document.querySelectorAll('#modeSeg button,#welMode button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===uiMode)));setPanel(state.mpanel);if(quiet)return;buildResults();syncAdv();requestPaint(false);}

function defaults(brandId){const b=BRANDS[brandId];return{brandId,brandName:b.name,handle:b.handle,platform:'facebook',format:'fb-feed',layout:'announce',paletteId:b.palette,colors:palColors(PAL[b.palette]),arrangement:'base',typeId:b.type,graphicId:b.graphic,gStrength:.55,seed:11,tint:false,content:Object.assign({},b.content),guides:true,query:b.query,tab:'colors',showAll:false,colorMode:'palettes',buildRole:'primary',showLoose:false,typeClass:'all',typeMode:'sets',shuffle:{layout:true,arrangement:true,colors:true,graphic:false},mpanel:'layouts',gLean:'',fpTarget:[],combo:'all',ground:'any',
  headScale:1,bodyScale:1,caps:'auto',fx:.5,fy:.5,tintAmt:.7,dim:1,showMark:true,showHandle:true,pvFmt:'square',bstep:'describe'};}
function sane(s){const d=defaults(BRANDS[s&&s.brandId]?s.brandId:'sample');if(!s)return d;const o=Object.assign(d,s);o.content=Object.assign({},d.content,s.content||{});o.shuffle=Object.assign({},d.shuffle,s.shuffle||{});
  if(!FMT[o.format])o.format='fb-feed';o.platform=FMT[o.format].p;if(!FMT[o.format].layouts.includes(o.layout))o.layout=FMT[o.format].layouts[0];if(!TYP[o.typeId])o.typeId='clear';if(!GRA[o.graphicId])o.graphicId='none';
  const okColors=o.colors&&ROLES.every(([r])=>validHex(String(o.colors[r]||'')));if(!PAL[o.paletteId]){o.paletteId=DEFAULT_PAL;if(!okColors)o.colors=palColors(PAL[o.paletteId]);}else if(!okColors)o.colors=palColors(PAL[o.paletteId]);
  o.colors=palColors(o.colors);if(!ROLES.some(([r])=>r===o.buildRole))o.buildRole='primary';if(o.combo!=='all'&&!COMBOS.some(c=>c.k===o.combo))o.combo='all';if(!['any','light','dark'].includes(o.ground))o.ground='any';if(!TYPE_CLASSES.some(c=>c[0]===o.typeClass))o.typeClass='all';
  const nm=(k,lo,hi)=>{const v=+o[k];o[k]=isFinite(v)?Math.min(hi,Math.max(lo,v)):ADV_DEFAULTS[k];};nm('headScale',.6,1.5);nm('bodyScale',.8,1.3);nm('fx',0,1);nm('fy',0,1);nm('tintAmt',.1,1);nm('dim',.4,1.3);
  if(!['auto','upper','normal'].includes(o.caps))o.caps='auto';o.showMark=o.showMark!==false;o.showHandle=o.showHandle!==false;if(o.typeMode!=='build')o.typeMode='sets';if(!['colors','type','graphic','identity'].includes(o.tab))o.tab='colors';if(!['square','story','banner'].includes(o.pvFmt))o.pvFmt='square';if(o.bstep!=='build')o.bstep='describe';o.shuffle={layout:o.shuffle.layout!==false,arrangement:o.shuffle.arrangement!==false,colors:o.shuffle.colors!==false,graphic:o.shuffle.graphic===true};if(!['layouts','text','photo','graphic','brand','adjust','posts'].includes(o.mpanel))o.mpanel='layouts';
  if(!LEANS.some(L=>L.k===o.gLean))o.gLean='';
  /* fpTarget replaced gLean (one direction, graphics only); a state saved before it carries the old choice over. */
  {const t=Array.isArray(s.fpTarget)?s.fpTarget:o.gLean?[o.gLean]:[];o.fpTarget=[];t.forEach(k=>{if(LEANS.some(L=>L.k===k)&&!o.fpTarget.includes(k)&&!o.fpTarget.includes(LEAN_OPP[k]))o.fpTarget.push(k);});}
  return o;}
let state=sane(store.get('brandlab.state.v1'));
let photoImg=null,logoImg=null;

function typeFor(s){const t=TYP[s.typeId]||TYP.clear,hs=s.headScale||1,bs=s.bodyScale||1,cp=s.caps||'auto';if(hs===1&&bs===1&&cp==='auto')return t;
  const d=Object.assign({},t.display,{scale:(t.display.scale||1)*hs}),b=Object.assign({},t.body,{scale:(t.body.scale||1)*bs});if(cp==='upper')d.upper=true;else if(cp==='normal')d.upper=false;return Object.assign({},t,{display:d,body:b});}
function snap(s){s=s||state;const lay=LAYOUTS[s.layout];return{fmt:FMT[s.format],layout:s.layout,p:s.colors,arrangement:s.arrangement,type:typeFor(s),graphic:s.graphicId,gStrength:s.gStrength,seed:s.seed,content:s.content,brand:{name:s.brandName,handle:s.handle},photo:lay.photo?photoImg:null,logo:logoImg,tint:s.tint,
  fx:s.fx,fy:s.fy,tintAmt:s.tintAmt,dim:s.dim,noMark:s.showMark===false,noHandle:s.showHandle===false};}
function curPaletteTags(){const base=PAL[state.paletteId];return tagPalette(Object.assign({},state.colors,isCustom()?{conv:{}}:{conv:base.conv,convWhy:base.convWhy,convSrc:base.convSrc}));}
function isCustom(){const b=PAL[state.paletteId];return ROLES.some(([r])=>b[r].toUpperCase()!==state.colors[r].toUpperCase());}

/* Fonts load on demand: only the faces a draft uses are fetched. */
const fontReady={};
function ensureType(id){const t=TYP[id];if(!t)return Promise.resolve();const specs=[t.display,t.body].map(s=>`${s.weight} 24px "${s.family}"`);const key=specs.join('|');if(fontReady[key])return fontReady[key];
  return fontReady[key]=(document.fonts&&document.fonts.load?Promise.all(specs.map(s=>document.fonts.load(s).catch(()=>null))):Promise.resolve()).then(()=>true);}
function useType(id){ensureType(id).then(()=>{updateReadout.k='';requestPaint(true);});}

/* ---------- painting ---------- */
let paintQ=false,thumbT=0,saveT=0;
function requestPaint(thumbs){if(!paintQ){paintQ=true;requestAnimationFrame(()=>{paintQ=false;paint();});}
  if(thumbs){clearTimeout(thumbT);thumbT=setTimeout(()=>{paintLayoutThumbs();paintDrafts();if(state.tab==='graphic'||state.mpanel==='graphic')paintGraphicThumbs();},140);}
  Lib.touchBrand();clearTimeout(saveT);saveT=setTimeout(()=>{store.set('brandlab.state.v1',state);},400);}
function sizeStage(){const st=$('#stage'),fmt=FMT[state.format];const narrow=window.matchMedia('(max-width:1060px)').matches;let h;
  if(narrow){const w=st.clientWidth-36;h=Math.min(w*fmt.h/fmt.w,Math.max(360,window.innerHeight*.6))+36;}
  else{const col=st.parentElement;h=clamp(col.clientHeight-250,320,1000);}
  st.style.height=Math.round(h)+'px';}
function paint(){if(Lib.view==='brand'){paintBrand();return;}const fmt=FMT[state.format],st=$('#stage'),cv=$('#cv');sizeStage();const aw=st.clientWidth-36,ah=st.clientHeight-36;const sc=Math.min(aw/fmt.w,ah/fmt.h);
  const cw=Math.max(60,Math.floor(fmt.w*sc)),ch=Math.max(20,Math.floor(fmt.h*sc));const dpr=Math.min(2,window.devicePixelRatio||1);const pw=Math.min(fmt.w,Math.round(cw*dpr)),ph=Math.round(pw*fmt.h/fmt.w);
  if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}cv.style.width=cw+'px';cv.style.height=ch+'px';const ctx=cv.getContext('2d');ctx.setTransform(pw/fmt.w,0,0,pw/fmt.w,0,0);
  const c=renderDraft(ctx,fmt.w,fmt.h,snap(),{guides:state.guides,preview:true});updateReadout(c);}
function renderTo(cv,s,maxW,maxH,opts){const fmt=FMT[s.format];const sc=Math.min(maxW/fmt.w,maxH/fmt.h);const cw=Math.max(8,Math.round(fmt.w*sc)),ch=Math.max(8,Math.round(fmt.h*sc));cv.width=cw*2;cv.height=ch*2;cv.style.width=cw+'px';cv.style.height=ch+'px';const ctx=cv.getContext('2d');ctx.setTransform(cv.width/fmt.w,0,0,cv.width/fmt.w,0,0);const S=snap(s);if(opts&&'photo'in opts)S.photo=LAYOUTS[s.layout].photo?opts.photo:null;if(opts&&'logo'in opts)S.logo=opts.logo;renderDraft(ctx,fmt.w,fmt.h,S,opts||{});}

/* ---------- left column ---------- */
function buildPlatforms(){const box=$('#plats');box.textContent='';PLATFORMS.forEach(p=>box.append(el('button',{type:'button','aria-pressed':String(state.platform===p.id),text:p.name,onclick:()=>{state.platform=p.id;const f=FORMATS.find(f=>f.p===p.id);setFormat(f.id);}})));}
function buildFormats(){const box=$('#formats');box.textContent='';FORMATS.filter(f=>f.p===state.platform).forEach(f=>{const m=18,r=f.w/f.h,w=r>=1?m:Math.max(5,m*r),h=r>=1?Math.max(4,m/r):m;
  box.append(el('button',{type:'button','aria-pressed':String(state.format===f.id),onclick:()=>setFormat(f.id)},el('span',{class:'ratio'},el('i',{style:`width:${w}px;height:${h}px`})),el('span',{class:'nm',text:f.name}),el('span',{class:'mt',text:`${f.w} \u00D7 ${f.h} \u00B7 ${MEDIA[f.media]}`})));});}
function buildLayouts(){const box=$('#layouts');box.textContent='';FMT[state.format].layouts.forEach(id=>{const cv=el('canvas',{'data-l':id});box.append(el('button',{type:'button','aria-pressed':String(state.layout===id),onclick:()=>{state.layout=id;buildLayouts();buildFields();requestPaint(true);}},el('span',{class:'th'},cv),el('span',{text:LAYOUTS[id].name})));});paintLayoutThumbs();}
function paintLayoutThumbs(){document.querySelectorAll('#layouts canvas').forEach(cv=>{const s=Object.assign({},state,{layout:cv.dataset.l});renderTo(cv,s,104,92,{preview:true});});}
/* The ← Layout and Layout → buttons under the canvas: the next or previous layout this format offers. */
function stepLayout(d){const ls=FMT[state.format].layouts;state.layout=ls[(ls.indexOf(state.layout)+d+ls.length)%ls.length];buildLayouts();buildFields();requestPaint(true);}
function setFormat(id){state.format=id;state.platform=FMT[id].p;if(!FMT[id].layouts.includes(state.layout))state.layout=FMT[id].layouts[0];buildPlatforms();buildFormats();buildLayouts();buildFields();const f=FMT[id];$('#fmtTitle').textContent=PLATFORMS.find(p=>p.id===f.p).name+' \u00B7 '+f.name;$('#fmtDim').textContent=`${f.w} \u00D7 ${f.h} px`;requestPaint(true);}

/* ---------- keywords ---------- */
let parsed={terms:[],cw:{},concepts:[]};
const cLabel=id=>CONCEPT_BY_ID[id].label;
function tierEl(src){const t=SRC[src].t;return el('i',{class:'tier tier-'+t,title:TIER[t].long+': '+SRC[src].short,text:t});}
function addKeyword(w){commitKeywords(w);}
function buildTerms(){const box=$('#terms');box.textContent='';parsed.terms.forEach(t=>{if(t.hits){const parts=[...new Set(t.hits.map(h=>{const c=CONCEPT_BY_ID[h.c];return c.bridge?c.label+' (value) \u2192 '+Object.keys(c.bridge).map(cLabel).join(', '):c.label;}))].join('; ');const ak=t.hits.some(h=>h.kind==='aaker'),br=t.hits.some(h=>CONCEPT_BY_ID[h.c].bridge),sg=t.hits.every(h=>h.kind==='sugg');
    box.append(el('span',{class:'term',title:ak?'One of the 42 trait words in Aaker\u2019s brand-personality scale':br?'A basic value. No study links values to visuals, so it is bridged by meaning to the concepts shown.':sg?'Suggested by a language model and reviewed by hand. Mapped by meaning only: no study links this word to visuals.':'Mapped by meaning to this concept'},el('b',{text:t.text}),'\u2192 '+parts,ak?tierEl('AAKER'):br?tierEl('CONV'):null));}
   else{const s=el('span',{class:'term miss'},`\u201C${t.text}\u201D has no link on file.`);if(t.near&&t.near.length){s.append(' Try ');t.near.forEach((w,i)=>{s.append(el('button',{type:'button',text:w,onclick:()=>replaceKeyword(t.text,w)}));if(i<t.near.length-1)s.append(', ');});}box.append(s);}});}
function buildDirectory(){const box=$('#dirBody');box.textContent='';box.append(el('p',{class:'note',text:`${CONCEPTS.length} ideas, reachable through ${LEX_KEYS.length} keywords. Select one to add it to your search.`}));
  GROUPS.forEach(g=>{const cs=CONCEPTS.filter(c=>c.group===g.id);box.append(el('div',{class:'dirh'},el('b',{text:g.id}),el('span',{text:g.note}),tierEl(g.src)),el('div',{class:'sugg'},cs.map(c=>el('button',{type:'button',text:c.label,title:c.def+'. Also: '+(c.aaker||[]).concat(c.syn).slice(0,8).join(', '),onclick:()=>addKeyword(c.key)}))));});}
function results(){const cw=parsed.cw;return{colors:rank('palette',PALETTES,cw),type:rank('type',listedTypes(),cw),graphic:rank('graphic',GRAPHICS,cw)};}
function whyList(tags,ids,extra){const ul=el('ul',{class:'why'});(extra||[]).forEach(x=>ul.append(x));ids.forEach(c=>{const t=tags[c];ul.append(el('li',null,tierEl(t.src),el('span',null,el('b',{text:cLabel(c)+': '}),t.why+(SRC[t.src].t==='C'?'':' ('+SRC[t.src].short+')'))));});return ul;}
function kwLabels(){return parsed.concepts.map(cLabel).join(', ');}
/* Cards: the ideas an option signals as small tier-marked tags (hover or focus a tag for its reason and source),
   and the strongest reason written out once. The full list stays in the detail panels. */
function tagChip(tags,c){const t=tags[c];return el('span',{class:'tchip',title:t.why+' ('+SRC[t.src].short+(SRC[t.src].t==='C'?', convention':'')+')'},tierEl(t.src),cLabel(c));}
function whyCompact(tags,ids,extra){if(!ids.length&&!(extra&&extra.length))return null;const t=ids.length?tags[ids[0]]:null;
  return el('div',{class:'whyc'},el('div',{class:'tchips'},extra||null,ids.map(c=>tagChip(tags,c))),t?el('p',{class:'why1'},el('b',{text:cLabel(ids[0])+': '}),t.why+(SRC[t.src].t==='C'?'':' ('+SRC[t.src].short+')')):null);}

/* ---------- results ---------- */
function buildSubbar(){const bar=$('#subbar');bar.textContent='';
  if(state.tab==='colors'){bar.append(el('div',{class:'seg',role:'group','aria-label':'Color mode'},[['palettes','Premade palettes'],['build','Build your own']].map(([v,t])=>el('button',{type:'button','aria-pressed':String(state.colorMode===v),text:t,onclick:()=>{state.colorMode=v;buildResults();}}))));}
  else if(state.tab==='type'){const build=uiMode==='advanced'&&state.typeMode==='build',ts=listedTypes();
    if(uiMode==='advanced')bar.append(el('div',{class:'seg',role:'group','aria-label':'Type mode'},[['sets','Ready-made pairings'],['build','Build a pairing']].map(([v,t])=>el('button',{type:'button','aria-pressed':String((build?'build':'sets')===v),text:t,onclick:()=>{state.typeMode=v;buildResults();}}))));
    if(!build)bar.append(el('div',{class:'sugg'},TYPE_CLASSES.map(([v,t])=>el('button',{type:'button',class:state.typeClass===v?'on':'','aria-pressed':String(state.typeClass===v),text:t+' '+(v==='all'?ts.length:ts.filter(x=>x.cls===v).length),onclick:()=>{state.typeClass=v;buildResults();}}))));
    if(!build)bar.append(tgtBar(buildResults,'pairings'));}
  else if(state.tab==='graphic')bar.append(tgtBar(buildResults,'graphics'));
  if(state.tab==='colors')bar.append(comboBar(),tgtBar(buildResults,state.colorMode==='build'?'colors':'palettes'));}
/* ---------- combination filter (Colors tab) ----------
   Premade palettes: show only palettes of one combination type, and optionally only light or dark grounds.
   Build your own: show only partner colors that stand in that relationship to the primary. */
const comboOn=()=>state.combo!=='all';
const groundOf=p=>hexToLch(p.bg).L>=55?'light':'dark';
function palRows(rows){return rows.filter(r=>(state.combo==='all'||comboKey(r.it)===state.combo)&&(state.ground==='any'||groundOf(r.it)===state.ground));}
function comboBar(){const build=state.colorMode==='build';if(build&&state.combo==='other')state.combo='all';const cur=COMBOS.find(c=>c.k===state.combo),cnt={};if(!build)PALETTES.forEach(p=>{const k=comboKey(p);cnt[k]=(cnt[k]||0)+1;});
  const chip=(k,l,d)=>el('button',{type:'button','aria-pressed':String(state.combo===k),title:d,text:build||k==='all'?l:l+' '+(cnt[k]||0),onclick:()=>{state.combo=k;buildResults();}});
  const gchip=(k,l)=>el('button',{type:'button','aria-pressed':String(state.ground===k),text:l,onclick:()=>{state.ground=k;buildResults();}});
  return el('div',{class:'tgtbar cmbbar',role:'group','aria-label':build?'Combination: limit partner colors by how they relate to the primary':'Combination: show palettes of one combination type'},
    el('span',{class:'tgtl',text:'Combination'}),
    el('div',{class:'tgtchips'},el('span',{class:'tgrp sugg'},chip('all','All','Every combination type'),COMBOS.filter(c=>!build||c.k!=='other').map(c=>chip(c.k,c.l,c.d))),
      build?null:el('span',{class:'tgrp'},el('span',{class:'tpair',role:'group','aria-label':'Ground'},el('span',{class:'tpl',text:'Ground'}),gchip('any','Any'),gchip('light','Light'),gchip('dark','Dark')))),
    el('div',{class:'tgtrow'},cur?el('span',null,tierEl('CANVA'),' '+cur.d+(build?(state.buildRole==='primary'?' Applies to the partners suggested for Ground, Accent and Text.':' Partners and single colors are limited to that relationship with your primary.'):'')):el('span',{class:'simple-only',text:build?'Pick a type to see only partner colors with that relationship to your primary.':'Pick a type to see only palettes built that way.'}),
      comboOn()||state.ground!=='any'?el('button',{type:'button',class:'link',text:'Clear',onclick:()=>{state.combo='all';state.ground='any';buildResults();}}):null));}
function buildResults(){const res=results(),has=parsed.concepts.length>0;res.colors=palRows(res.colors);const count=k=>{const rs=has?res[k].filter(r=>r.score>0):res[k];return tgtOn()?rs.filter(r=>tgtFit(itemLean(k,r.it)).ok).length:rs.length;};
  $('#nColors').textContent=count('colors');$('#nType').textContent=count('type');{const gr=graphicRows();$('#nGraphic').textContent=has?gr.filter(r=>r.score>0).length:gr.length;}
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.v===state.tab)));renderSavedPals();
  const idt=state.tab==='identity';$('#bIdentity').hidden=!idt;$('#results').hidden=idt;$('#subbar').hidden=idt;if(idt){$('#rhead').hidden=true;syncIdentity();return;}buildSubbar();
  const kind=state.tab,rbox=$('#results');rbox.classList.remove('flow');
  if(kind==='colors'&&state.colorMode==='build'){$('#rhead').hidden=true;rbox.classList.add('flow');buildColorBuilder();return;}
  if(kind==='type'&&state.typeMode==='build'&&uiMode==='advanced'){$('#rhead').hidden=true;rbox.classList.add('flow');buildTypeBuilder();return;}$('#rhead').hidden=false;
  if(kind==='graphic'){buildGraphicResults();return;}
  let rows=res[kind];if(kind==='type'&&state.typeClass!=='all')rows=rows.filter(r=>r.it.cls===state.typeClass);
  const matches=rows.filter(r=>r.score>0);let show=has&&!state.showAll?matches:rows;const tgt=tgtOn();
  if(tgt)show=show.map(r=>Object.assign({},r,{fit:tgtFit(itemLean(kind,r.it))})).filter(r=>r.fit.ok).sort((a,b)=>b.fit.mean-a.fit.mean||b.score-a.score);
  const narrowed=kind==='colors'&&(comboOn()||state.ground!=='any'),what=kind==='colors'?[state.ground!=='any'?state.ground+'-ground':'',comboOn()?COMBOS.find(c=>c.k===state.combo).l.toLowerCase():'',rows.length===1?'palette':'palettes'].filter(Boolean).join(' '):'pairings';
  $('#rSummary').textContent=(has?(matches.length?`${matches.length} of ${rows.length} ${narrowed?what+' ':''}match your keywords`:`None of the ${rows.length} ${narrowed?what+' ':''}match your keywords`):`${rows.length} ${what}`)+(tgt?` \u00B7 ${show.length} fit your aim`:has?'':'. Add keywords to rank them.');
  const ba=$('#btnAll');ba.hidden=!has||matches.length===rows.length;ba.textContent=state.showAll?'Matches only':`Show all ${rows.length}`;
  const box=$('#results');box.textContent='';const tagKind=kind==='colors'?'palette':kind;
  show.forEach(r=>{const it=r.it;const tg=TAGS[tagKind][it.id].tags;const ids=(r.matched.length?r.matched.filter(c=>tg[c]):topTags(tg,2)).slice(0,3);
    const inUse=kind==='colors'?(state.paletteId===it.id&&!isCustom()):kind==='type'?state.typeId===it.id:state.graphicId===it.id;let vis,meta=null;
    if(kind==='colors'){vis=swBar(it);const ck=comboOf(it);meta=el('div',{class:'meta'},el('span',{class:'cmb',title:(COMBOS.find(c=>c.k===(ck==='neutral'?'other':ck))||{}).d,text:COMBO_LABEL[ck]}),it.mine?' Your palette':it.note?' '+it.note:'');}
    else if(kind==='type'){const d=it.display;vis=el('span',{class:'vis aa',style:`font-family:"${d.family}",${d.fb};font-weight:${d.weight}`,text:d.upper?'AA':'Aa'});meta=el('div',{class:'meta',text:(it.mine?'Your pairing: ':'')+d.family+(it.body.family!==d.family?' with '+it.body.family:'')});}
    else{vis=el('span',{class:'vis'},el('canvas',{'data-g':it.id,width:176,height:120}));}
    box.append(el('button',{type:'button',class:'opt','aria-pressed':String(inUse),onclick:()=>apply(kind,it.id)},vis,el('span',null,el('span',{class:'nm'},it.name,inUse?el('span',{class:'inuse',text:'In use'}):null),meta,r.fit?tgtChips(r.fit.s):null,whyCompact(tg,ids))));});
  if(!show.length&&narrowed&&!rows.length)box.append(el('p',{class:'empty'},'There are no '+what+'. ',el('button',{type:'button',class:'link',text:'Clear the combination filter',onclick:()=>{state.combo='all';state.ground='any';buildResults();}}),'.'));
  else if(!show.length&&tgt)box.append(tgtEmpty(kind==='colors'?(narrowed?what.replace(/s$/,''):'palette'):'pairing',has&&!state.showAll&&rows.length>matches.length,kind==='colors'));
  else if(!show.length)box.append(el('p',{class:'empty',text:kind==='type'&&state.typeClass!=='all'?'No face in this group is linked to those keywords. Try another group or \u201CShow all\u201D.':narrowed?'No palette of this kind is linked to those keywords. Choose \u201CShow all\u201D, or clear the combination filter.':'Try the other tabs, or choose \u201CShow all\u201D.'}));
  if(kind==='graphic')paintGraphicThumbs();}
function paintGraphicThumbs(){const c=makeScheme(state.colors,'base');document.querySelectorAll('#results canvas[data-g],#mgPanel canvas[data-g]').forEach(cv=>{const ctx=cv.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=c.bg;ctx.fillRect(0,0,cv.width,cv.height);drawGraphic(ctx,cv.dataset.g,{x:0,y:0,w:cv.width,h:cv.height},c,.85,state.seed);});}
function runSearch(){parsed=parseQuery(liveQuery());buildTerms();buildResults();updateReadout.k='';requestPaint(false);}
function apply(kind,id){if(kind==='colors'){state.paletteId=id;state.colors=palColors(PAL[id]);buildColors();renderLook();}else if(kind==='type'){state.typeId=id;useType(id);}else state.graphicId=id;buildResults();requestPaint(true);}

/* ---------- graphics: families of styles ----------
   A family (Waves) holds three or four styles (Fine lines, Surf...). Each style is tagged from its own shape
   features, so styles lean toward different parts of the fingerprint. The picker shows one card per family:
   select the picture to use it, the arrows or dots (or the arrow keys) to step through its styles. */
const GFAM={};GFAMILIES.forEach(F=>GFAM[F.fam]=F);
const gLabel=g=>g.fam==='none'?g.name:g.name+' · '+g.vn;
/* A style's position on the eight fingerprint axes, from its tags alone, as one score per direction (0 to 1). */
function leanOf(tags){const w={};for(const c in tags)w[c]=Math.min(1,tags[c].w);const fp=fingerprint(w),o={};
  LEANS.forEach(L=>{o[L.k]=!fp?0:L.d?(fp[L.i].set?Math.max(0,(fp[L.i].v-.5)*2*L.d):0):fp[L.i].v;});return o;}
function leanScores(id){return leanOf(TAGS.graphic[id].tags);}
/* Badges name the two directions where a style leans furthest compared with its family's other styles,
   so "High pleasure", which most curved shapes share, does not crowd out what sets a style apart. */
let leanCache=null;
function leans(id){if(!leanCache){leanCache={};GFAMILIES.forEach(F=>{const S=F.vars.map(v=>leanScores(v.id)),mean={};LEANS.forEach(L=>mean[L.k]=S.reduce((a,o)=>a+o[L.k],0)/S.length);
    F.vars.forEach((v,i)=>{const o=S[i];leanCache[v.id]={s:o,top:LEANS.filter(L=>o[L.k]>=LEAN_MIN).sort((a,b)=>(o[b.k]*2-mean[b.k])-(o[a.k]*2-mean[a.k])).slice(0,2)};});});}
  return leanCache[id]||{s:{},top:[]};}
function leanChips(id){const t=leans(id).top;return t.length?el('div',{class:'glean',title:'Where this style sits on the fingerprint, compared with the other styles of the same graphic'},t.map(L=>el('span',{class:'lean',text:L.l}))):null;}
/* One row per family: its best keyword score, and which style to show when the family is not in use. */
/* With a fingerprint target, a family shows its style that fits the target best, and families with no fitting style drop out. */
function graphicRows(){const has=parsed.concepts.length>0,by={},tgt=tgtOn();rank('graphic',GRAPHICS,parsed.cw).forEach(r=>{(by[r.it.fam]=by[r.it.fam]||[]).push(r);});
  let rows=GFAMILIES.map((F,i)=>{const best=by[F.fam][0];let pick=has&&best.score>0?best.it.id:F.vars[0].id,fit=null;
    if(tgt){const L=F.vars.map(v=>[v.id,tgtFit(leans(v.id).s)]).sort((a,b)=>(b[1].ok-a[1].ok)||(b[1].mean-a[1].mean));fit=L[0][1];if(fit.ok)pick=L[0][0];}
    return{F,score:best.score,pick,fit,i};});
  if(tgt)rows=rows.filter(r=>r.fit.ok);
  return rows.sort((a,b)=>(tgt?b.fit.mean-a.fit.mean:0)||(has?b.score-a.score:0)||a.i-b.i);}

/* ---------- fingerprint target ("Aim for") ----------
   Filters and orders options by where they sit on the fingerprint, whatever the keywords. An option's position comes
   from its own tags through the same fingerprint() the chart draws, so a pick that passes here pulls the chart's
   picks shape the same way. Several directions can be chosen at once; an option passes only when it reaches
   LEAN_MIN on every one, and options are ordered by their average across them. Opposite ends of one feeling axis
   cannot both be chosen. */
const tgtOn=()=>state.fpTarget.length>0;
const tgtNames=()=>{const n=state.fpTarget.map(k=>LEANS.find(L=>L.k===k).l.toLowerCase());return n.length>1?n.slice(0,-1).join(', ')+' and '+n[n.length-1]:n[0]||'';};
const colorLeanCache={};
function colorLean(hex){hex=hex.toUpperCase();return colorLeanCache[hex]||(colorLeanCache[hex]=leanOf(tagColor(hex).tags));}
/* kind: 'colors' (a palette), 'type', 'graphic' or 'color' (one hex). Palettes are not cached: a saved palette can be edited. */
function itemLean(kind,it){return kind==='graphic'?leans(it.id).s:kind==='color'?colorLean(it.hex):leanOf(TAGS[kind==='colors'?'palette':kind][it.id].tags);}
function tgtFit(s){const v=state.fpTarget.map(k=>s[k]||0),min=Math.min(...v);return{s,min,mean:v.reduce((a,b)=>a+b,0)/v.length,ok:min>=LEAN_MIN};}
function tgtToggle(k){const on=state.fpTarget.includes(k),t=state.fpTarget.filter(x=>x!==k&&x!==LEAN_OPP[k]);if(!on)t.push(k);state.fpTarget=LEANS.map(L=>L.k).filter(x=>t.includes(x));}
/* The keywords' own shape, read off the chart: personality axes at half strength or more, feeling axes
   clearly off neutral. At most three, strongest first, so the filter does not demand more than a few things at once. */
function tgtFromKeywords(){const fp=fingerprint(parsed.cw);if(!fp)return[];const c=[];
  FP_AXES.forEach((a,i)=>{const x=fp[i];if(!x.set)return;if(a.pad==null){if(x.v>=.5)c.push([LEANS[i].k,x.v]);return;}
    const d=(x.v-.5)*2;if(Math.abs(d)>=.3)c.push([LEANS.find(L=>L.i===i&&L.d===Math.sign(d)).k,Math.abs(d)]);});
  return c.sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);}
function tgtBar(onChange,what){const has=parsed.concepts.length>0,on=tgtOn();
  const b=L=>el('button',{type:'button','aria-pressed':String(state.fpTarget.includes(L.k)),'aria-label':L.l,title:L.l,text:L.d?(L.d>0?'High':'Low'):L.l,onclick:()=>{tgtToggle(L.k);onChange();}});
  const pairs=[[5,'Pleasure'],[6,'Arousal'],[7,'Dominance']].map(([i,l])=>el('span',{class:'tpair',role:'group','aria-label':l},el('span',{class:'tpl',text:l}),LEANS.filter(L=>L.i===i).map(b)));
  return el('div',{class:'tgtbar',role:'group','aria-label':'Aim for: show '+what+' that lean toward every direction chosen'},
    el('span',{class:'tgtl',text:'Aim for'}),
    el('div',{class:'tgtchips'},el('span',{class:'tgrp sugg'},LEANS.filter(L=>!L.d).map(b)),el('span',{class:'tgrp'},pairs)),
    el('div',{class:'tgtrow'},on?el('span',{text:'Showing '+what+' that lean toward '+tgtNames()+'.'}):el('span',{class:'simple-only',text:'Pick directions on the fingerprint to see only the '+what+' that lean that way.'}),
      has?el('button',{type:'button',class:'link',text:'Match my keywords',title:'Choose up to three directions where your keyword fingerprint is strongest',onclick:()=>{const t=tgtFromKeywords();state.fpTarget=LEANS.map(L=>L.k).filter(k=>t.includes(k));onChange();if(!t.length)say('Your keywords do not lean clearly toward any direction on the fingerprint.');}}):null,
      on?el('button',{type:'button',class:'link',text:'Clear',onclick:()=>{state.fpTarget=[];onChange();}}):null));}
/* How far an option leans toward each chosen direction, 0 to 100%. A direction below the bar is shown faded. */
function tgtChips(s){return el('div',{class:'glean tfit',title:'How far this leans toward each direction you are aiming for. '+Math.round(LEAN_MIN*100)+'% or more counts.'},
  state.fpTarget.map(k=>{const L=LEANS.find(x=>x.k===k),v=s[k]||0;return el('span',{class:'lean '+(v>=LEAN_MIN?'hit':'short'),text:L.l+' '+Math.round(v*100)+'%'});}));}
function tgtEmpty(noun,kwNarrowed,toBuilder){const p=el('p',{class:'empty'},`No ${noun} leans toward ${tgtNames()} strongly enough. `,kwNarrowed?'Choose \u201CShow all\u201D to look beyond your keyword matches, or drop a direction. ':'Drop a direction to widen the search. ');
  if(toBuilder)p.append('Single colors cover more of the fingerprint than premade palettes: ',el('button',{type:'button',class:'link',text:'build one color by color',onclick:()=>{state.colorMode='build';buildResults();}}),'.');return p;}
let gRefocus=null;
function gCard(row,onPick,compact){const F=row.F,g0=GV[state.graphicId],inUse=!!g0&&g0.fam===F.fam,cur=inUse?state.graphicId:row.pick,g=GV[cur],n=F.vars.length,idx=F.vars.findIndex(v=>v.id===cur);
  const go=(id,key)=>{if(key)gRefocus=F.fam;onPick(id);},step=(d,key)=>go(F.vars[(idx+d+n)%n].id,key);
  const pickBtn=el('button',{type:'button',class:'gpick','aria-pressed':String(inUse),'aria-label':(inUse?'In use: ':'Use ')+gLabel(g)+(n>1?'. Left and right arrow keys change the style.':''),onclick:()=>go(cur),
    onkeydown:e=>{if(n>1&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();step(e.key==='ArrowRight'?1:-1,true);}}},el('canvas',{'data-g':cur,width:240,height:150}));
  const nav=n>1?el('div',{class:'gnav'},el('button',{type:'button',class:'garr','aria-label':'Previous '+F.name.toLowerCase()+' style',text:'‹',onclick:()=>step(-1)}),
    el('span',{class:'gdots'},F.vars.map(v=>el('button',{type:'button',class:'gdot'+(v.id===cur?' cur':''),'aria-label':F.name+': '+v.vn,title:v.vn,'aria-pressed':String(inUse&&v.id===cur),onclick:()=>go(v.id)}))),
    el('button',{type:'button',class:'garr','aria-label':'Next '+F.name.toLowerCase()+' style',text:'›',onclick:()=>step(1)})):null;
  const m=parsed.concepts.length?scoreTags(TAGS.graphic[cur].tags,parsed.cw).matched.slice(0,2):[];
  return el('div',{class:'gcard'+(inUse?' on':''),'data-fam':F.fam},pickBtn,el('div',{class:'ghead'},el('span',{class:'nm'},F.name,inUse?el('span',{class:'inuse',text:'In use'}):null),
    n>1?el('span',{class:'gvn',text:g.vn+' · '+(idx+1)+' of '+n}):null),nav,tgtOn()?tgtChips(leans(cur).s):leanChips(cur),!compact&&m.length?el('div',{class:'tchips'},m.map(c=>tagChip(TAGS.graphic[cur].tags,c))):null);}
/* The graphic in use, with every style of its family side by side. */
function gCurrent(onPick,compact){const g=GV[state.graphicId]||GV.none,F=GFAM[g.fam],box=el('div',{class:'gcur'});
  box.append(el('div',{class:'bhead'},el('h3',null,'In use: ',el('b',{text:gLabel(g)})),F.vars.length>1?el('span',{class:'meta',text:'Each style leans toward a different part of the fingerprint'}):null));
  if(F.vars.length>1)box.append(el('div',{class:'gvars',role:'group','aria-label':F.name+' styles'},F.vars.map(v=>el('button',{type:'button',class:'gvar','aria-pressed':String(v.id===g.id),onclick:()=>onPick(v.id)},
    el('canvas',{'data-g':v.id,width:200,height:130}),el('span',{class:'nm',text:v.vn}),leanChips(v.id)))));
  else box.append(el('p',{class:'note',text:'No graphic is in use. Pick one below; each has three or four styles.'}));
  const tg=TAGS.graphic[g.id],m=scoreTags(tg.tags,parsed.cw).matched,ids=(m.length?m:topTags(tg.tags,3)).slice(0,3);if(ids.length)box.append(compact?whyCompact(tg.tags,ids):whyList(tg.tags,ids));
  tg.cautions.forEach(c=>box.append(el('p',{class:'note',text:'Note: '+c.text+' ('+SRC[c.src].short+')'})));return box;}
function gRefocusNow(){if(!gRefocus)return;const b=document.querySelector('.gcard[data-fam="'+gRefocus+'"] .gpick');gRefocus=null;if(b)b.focus();}
function buildGraphicResults(){const has=parsed.concepts.length>0,rows=graphicRows(),tgt=tgtOn(),matches=rows.filter(r=>r.score>0),show=has&&!state.showAll?matches:rows;
  const nV=GRAPHICS.length-1,nF=GFAMILIES.length-1;
  $('#rSummary').textContent=(has?(matches.length?`${matches.length} of ${GFAMILIES.length} graphics match your keywords`:'No graphic matches your keywords'):`${nF} graphics in ${nV} styles`)+(tgt?` \u00B7 ${show.length} fit your aim`:'');
  const ba=$('#btnAll');ba.hidden=!has||matches.length===rows.length;ba.textContent=state.showAll?'Matches only':`Show all ${rows.length}`;
  const box=$('#results');box.textContent='';const pick=id=>apply('graphic',id);box.append(gCurrent(pick),el('div',{class:'ggrid'},show.map(r=>gCard(r,pick))));
  if(!show.length)box.append(tgt?tgtEmpty('graphic style',has&&!state.showAll,false):el('p',{class:'empty',text:'Try the other tabs, or choose “Show all”.'}));
  paintGraphicThumbs();gRefocusNow();}
/* Media page: the post's graphic. A change here belongs to this post; the brand's graphic is set on the Brand page. */
function buildMediaGraphic(){const cur=$('#mgCur');if(!cur||$('#mgPanel').hidden)return;const L=Lib.look(),bg=L&&GV[L.graphicId]?L.graphicId:null;
  const pick=id=>{state.graphicId=id;renderLook();requestPaint(true);};
  $('#mgNote').textContent='Changes here apply to this post.'+(bg?' The brand’s graphic is '+gLabel(GV[bg])+'.':'')+' Change the brand’s own graphic on the Brand page.';
  const b=$('#mgBrand');b.hidden=!bg||bg===state.graphicId;b.onclick=()=>pick(bg);
  cur.textContent='';cur.append(gCurrent(pick,true));const lb=$('#mgLean');lb.textContent='';lb.append(tgtBar(buildMediaGraphic,'graphics'));
  const grid=$('#mgGrid');grid.textContent='';const rows=graphicRows();grid.append(...rows.map(r=>gCard(r,pick,true)));if(!rows.length)grid.append(tgtEmpty('graphic style',false,false));
  $('#mgStrength').value=Math.round(state.gStrength*100);paintGraphicThumbs();gRefocusNow();}

/* ---------- fingerprint as percentages ----------
   The numbers behind the radar shape, for one option: each personality axis from 0 to 100%, and each feeling axis as
   High or Low with how far it sits from neutral. They come from the same fingerprint() the chart draws and the same
   scale the Aim for filter uses, so 100% is the option's own strongest signal, not an absolute amount. */
function fpPct(tags){const w={};for(const c in tags)w[c]=Math.min(1,tags[c].w);const fp=fingerprint(w);
  return FP_AXES.map((a,i)=>{const x=fp?fp[i]:null;if(a.pad==null)return{l:a.label,pct:Math.round((x?x.v:0)*100),dir:0,bi:false};
    const d=x&&x.set?(x.v-.5)*2:0,pct=Math.round(Math.abs(d)*100);return{l:a.label,pct,dir:pct?Math.sign(d):0,bi:true};});}
const fpVal=a=>a.bi?(a.dir>0?'High '+a.pct+'%':a.dir<0?'Low '+a.pct+'%':'Neutral'):a.pct+'%';
function fpBars(tags,cls){return el('div',{class:'fpbars'+(cls?' '+cls:''),role:'list','aria-label':'Fingerprint as percentages'},fpPct(tags).map(a=>el('div',{class:'fpb',role:'listitem'},el('span',{class:'fl',text:a.l}),
  el('span',{class:'fpbar'+(a.bi?' bi':''),'aria-hidden':'true'},el('i',{style:a.bi?(a.dir<0?`right:50%;width:${a.pct/2}%`:`left:50%;width:${a.pct/2}%`):`width:${a.pct}%`})),el('span',{class:'fv',text:fpVal(a)}))));}
const FP_NOTE='100% is this color’s own strongest signal. Feeling axes show how far it sits from neutral.';
/* The small fingerprint shape with its percentages beside it. */
function fpBlock(tags,cls){const w={};for(const c in tags)w[c]=Math.min(1,tags[c].w);const txt=fpPct(tags).map(a=>a.l+' '+fpVal(a)).join(', ');
  return el('div',{class:'fpblock'+(cls?' '+cls:'')},el('div',{class:'fpmini'},radarSVG([{fp:fingerprint(w),cls:'rc'}],104,'Fingerprint shape: '+txt,true)),fpBars(tags,cls));}

/* ---------- color tip: point at any color to see its fingerprint ----------
   Every swatch in the app carries data-hex. Pointing at one (or moving keyboard focus to one) shows a small card
   with the color, its hue family and its fingerprint percentages. One listener serves the Brand page, the Media
   page and the Library. */
let ctipFor=null;
function ctipHide(){const t=$('#ctip');if(t)t.hidden=true;if(ctipFor){ctipFor.removeAttribute('aria-describedby');ctipFor=null;}}
function ctipShow(node){const hex=String(node.dataset.hex||'');if(!validHex(hex)){ctipHide();return;}let t=$('#ctip');if(!t){t=el('div',{id:'ctip',class:'ctip',role:'tooltip'});document.body.append(t);}
  if(ctipFor&&ctipFor!==node)ctipFor.removeAttribute('aria-describedby');ctipFor=node;const H=hex[0]==='#'?hex.toUpperCase():'#'+hex.toUpperCase(),tc=tagColor(H),nm=node.dataset.name,role=node.dataset.role;
  t.textContent='';t.append(el('div',{class:'cihead'},el('i',{class:'dot',style:'background:'+H}),el('b',{text:H}),el('span',{text:[nm,HUE_LABEL[tc.fam]+' family',role?'used as '+role:''].filter(Boolean).join(' · ')})),fpBlock(tc.tags),el('p',{class:'note',text:FP_NOTE}));
  t.hidden=false;if(node.matches('button,[tabindex]'))node.setAttribute('aria-describedby','ctip');
  const r=node.getBoundingClientRect(),w=t.offsetWidth,h=t.offsetHeight,vw=document.documentElement.clientWidth,vh=window.innerHeight;
  let x=clamp(r.left+r.width/2-w/2,8,Math.max(8,vw-w-8)),y=r.bottom+8;if(y+h>vh-8)y=r.top-h-8>=8?r.top-h-8:Math.max(8,vh-h-8);t.style.left=Math.round(x)+'px';t.style.top=Math.round(y)+'px';}
function bootColorTip(){const find=e=>e.target&&e.target.closest?e.target.closest('[data-hex]'):null;
  document.addEventListener('mouseover',e=>{const n=find(e);if(n){if(n!==ctipFor||$('#ctip').hidden)ctipShow(n);}else if(ctipFor)ctipHide();});
  document.addEventListener('focusin',e=>{const n=find(e);if(n)ctipShow(n);else if(ctipFor)ctipHide();});
  /* Scrolling hides the card, unless it belongs to the focused color: tabbing to a swatch scrolls it into view, and the card should follow it there. */
  let st=0;document.addEventListener('scroll',()=>{if(!ctipFor)return;if(document.activeElement!==ctipFor){ctipHide();return;}cancelAnimationFrame(st);st=requestAnimationFrame(()=>{if(ctipFor&&ctipFor.isConnected)ctipShow(ctipFor);else ctipHide();});},true);
  document.addEventListener('mouseleave',ctipHide);document.addEventListener('pointerdown',ctipHide,true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')ctipHide();});}

/* ---------- color wheel ----------
   An in-page wheel in place of the browser's own picker, so the fingerprint percentages can sit under it and follow
   the pointer. Hue runs around the circle (red at the top, as on Canva's RGB wheel), saturation from the centre to
   the edge, and brightness is the slider. Pointing at the wheel previews the color under the pointer in the
   percentages; pressing or dragging chooses it, and letting go applies it to the role. */
const wheel={open:false,h:0,s:0,v:1,hex:'',focus:''};
function hsvRgb(h,s,v){const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}return[(r+m)*255,(g+m)*255,(b+m)*255];}
function wheelBtn(role,open){const rn=ROLE_NAME[role];return el('button',{type:'button',class:'wheelbtn',id:'bWheel','aria-expanded':String(!!open),'aria-controls':'wheelPanel',title:open?'Close the color wheel':'Choose any '+rn+' color on the color wheel',
  onclick:()=>{wheel.open=!wheel.open;wheel.focus=wheel.open?'cv':'btn';buildResults();}},el('span',{class:'wring','aria-hidden':'true'},el('i',{style:'background:'+state.colors[role]})),el('span',{text:open?'Close color wheel':'Color wheel'}));}
function openWheel(role){state.tab='colors';state.colorMode='build';state.buildRole=role;wheel.open=true;wheel.focus='cv';buildResults();const w=$('#wheelPanel');if(w&&w.scrollIntoView)w.scrollIntoView({block:'center'});}
function wheelPanel(role){const rn=ROLE_NAME[role],cur=state.colors[role].toUpperCase(),N=200,D=N*2;
  /* Black, white and gray have no hue or saturation of their own: keep the ones the wheel was on. */
  if(wheel.hex!==cur){const q=hexToHsv(cur);wheel.v=q.v;if(q.v>0){wheel.s=q.s;if(q.s>0)wheel.h=q.h;}wheel.hex=cur;}
  const cv=el('canvas',{class:'wheelcv',id:'wheelCv',width:D,height:D,tabindex:0,role:'img','aria-label':'Color wheel for the '+rn+' color. Hue runs around the circle and saturation from the centre to the edge. Left and right arrow keys change the hue, up and down the saturation; hold Shift for larger steps.'});
  const mark=el('i',{class:'wmark','aria-hidden':'true'}),wrap=el('div',{class:'wheelwrap'},cv,mark);
  const bri=el('input',{type:'range',id:'wheelV',class:'wbri',min:0,max:100,step:1});bri.value=Math.round(wheel.v*100);const briL=el('span'),dim=el('p',{class:'note wdim',text:'Brightness is low, so a color comes out darker than the wheel shows. Raise Brightness for brighter colors.'});
  const dot=el('i',{class:'wsw'}),hexEl=el('b',{id:'wheelHex'}),famEl=el('span'),whoEl=el('span',{class:'wwho'}),metrics=el('div',{id:'wheelFp'}),sig=el('div',{class:'tchips',id:'wheelSig'});
  const sel=()=>hsvToHex(wheel.h,wheel.s,wheel.v);
  /* The wheel is never drawn darker than 40% brightness, or a dark color would open an unreadable black disc. */
  const draw=()=>{const ctx=cv.getContext('2d'),img=ctx.createImageData(D,D),d=img.data,R=D/2,v=Math.max(wheel.v,.4);for(let y=0;y<D;y++)for(let x=0;x<D;x++){const dx=x+.5-R,dy=y+.5-R,r=Math.hypot(dx,dy);if(r>R)continue;
      const c=hsvRgb((Math.atan2(dy,dx)*180/Math.PI+450)%360,Math.min(1,r/(R-1)),v),o=(y*D+x)*4;d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255*Math.min(1,R-r);}ctx.putImageData(img,0,0);};
  /* show(hex, hovering): the readout and the percentages for a color, without changing the palette */
  const show=(hex,hover)=>{const t=tagColor(hex,true);dot.style.background=hex;hexEl.textContent=hex;famEl.textContent=HUE_LABEL[t.fam]+' family';whoEl.textContent=hover?'Under the pointer':'Selected';
    metrics.textContent='';metrics.append(fpBlock(t.tags,'two'));sig.textContent='';const m=scoreTags(t.tags,parsed.cw).matched,ids=(m.length?m:topTags(t.tags,3)).slice(0,3);sig.append(...ids.map(c=>tagChip(t.tags,c)));};
  const place=()=>{const a=(wheel.h-90)*Math.PI/180;mark.style.left=(50+50*wheel.s*Math.cos(a))+'%';mark.style.top=(50+50*wheel.s*Math.sin(a))+'%';const hex=sel();mark.style.background=hex;mark.style.borderColor=lum(hex)>.4?'#111':'#fff';};
  const live=()=>{place();show(sel(),false);briL.textContent='Brightness '+Math.round(wheel.v*100)+'%';dim.hidden=wheel.v>=.4;};
  const commit=f=>{const hex=sel();wheel.hex=hex;wheel.focus=f;if(hex!==state.colors[role].toUpperCase())setRole(role,hex);else{wheel.focus='';}};
  const at=e=>{const b=cv.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2;return{h:(Math.atan2(dy,dx)*180/Math.PI+450)%360,s:Math.hypot(dx,dy)/(b.width/2)};};
  let drag=false,kt=0;
  cv.addEventListener('pointerdown',e=>{e.preventDefault();drag=true;try{cv.setPointerCapture(e.pointerId);}catch(x){}cv.focus();const q=at(e);wheel.h=q.h;wheel.s=clamp(q.s,0,1);live();});
  cv.addEventListener('pointermove',e=>{const q=at(e);if(drag){wheel.h=q.h;wheel.s=clamp(q.s,0,1);live();}else if(e.pointerType==='mouse'){if(q.s<=1)show(hsvToHex(q.h,q.s,wheel.v),true);else show(sel(),false);}});
  const end=()=>{if(!drag)return;drag=false;commit('cv');};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('pointerleave',()=>{if(!drag)show(sel(),false);});
  cv.addEventListener('keydown',e=>{const big=e.shiftKey,k=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k))return;e.preventDefault();
    if(k==='ArrowLeft')wheel.h=(wheel.h-(big?15:3)+360)%360;else if(k==='ArrowRight')wheel.h=(wheel.h+(big?15:3))%360;else wheel.s=clamp(wheel.s+(k==='ArrowUp'?1:-1)*(big?.1:.02),0,1);live();clearTimeout(kt);kt=setTimeout(()=>commit('cv'),450);});
  bri.addEventListener('input',()=>{wheel.v=bri.value/100;draw();live();});bri.addEventListener('change',()=>commit('v'));
  draw();live();
  return el('div',{class:'wheelpanel',id:'wheelPanel',role:'group','aria-label':'Color wheel for the '+rn+' color'},
    el('div',{class:'wheeltop'},wrap,el('div',{class:'wheelside'},el('div',{class:'wread','aria-live':'polite'},dot,el('span',null,whoEl,el('span',{class:'wline'},hexEl,' ',famEl))),
      el('label',{for:'wheelV'},briL,bri),dim,sig,el('p',{class:'note',text:'Point at the wheel to preview a color below. Click or drag to choose it; it becomes the '+rn+' when you let go.'}))),
    el('div',{class:'bhead'},el('h3',{text:'Fingerprint of this color'}),el('span',{class:'meta',text:'Updates as you move'})),metrics,el('p',{class:'note',text:FP_NOTE}));}
function wheelRefocus(){const f=wheel.focus;wheel.focus='';if(!f)return;const n=f==='cv'?$('#wheelCv'):f==='v'?$('#wheelV'):$('#bWheel');if(n)n.focus({preventScroll:true});}

/* ---------- build color by color ---------- */
function setRole(role,hex){putColor(role,hex);buildColors();buildResults();requestPaint(true);}
function colorInfo(hex,forRole,bars){const t=tagColor(hex),has=parsed.concepts.length>0;const m=scoreTags(t.tags,parsed.cw).matched;const ids=(m.length?m:topTags(t.tags,2)).slice(0,3);
  const head=el('div',{class:'cihead'},el('i',{class:'dot',style:'background:'+hex}),el('b',{text:hex.toUpperCase()}),el('span',{text:HUE_LABEL[t.fam]+' family'}),has?el('span',{class:m.length?'pass':'fail',text:m.length?'Matches '+m.map(cLabel).join(', '):'No link to your keywords'}):null);
  const box=el('div',{class:'cinfo'},head,ids.length?whyList(t.tags,ids):el('p',{class:'note',text:'No associations on file for this color.'}));
  if(tgtOn())box.append(tgtChips(colorLean(hex)));
  t.cautions.forEach(c=>box.append(el('p',{class:'note',text:'Note: '+c.text+' ('+SRC[c.src].short+')'})));
  if(bars)box.append(el('div',{class:'fphead',text:'Fingerprint of this color'}),fpBlock(t.tags,'two'));return box;}
/* How a library color relates to the primary, in combination terms (hue angles on the RGB wheel). */
function relToPrimary(hex){if(!isHue(hex)||!isHue(state.colors.primary))return'mono';let d=Math.abs(hexToHsv(hex).h-hexToHsv(state.colors.primary).h);if(d>180)d=360-d;return d<=15?'mono':d<=50?'analogous':d>=105&&d<=135?'triadic':d>=165?'complementary':'other';}
function buildColorBuilder(){const box=$('#results');box.textContent='';const role=state.buildRole,has=parsed.concepts.length>0,ground=state.colors.bg,anchor=state.colors.primary,tgt=tgtOn(),rn=ROLE_NAME[role],cmb=comboOn()&&role!=='primary'?state.combo:'',cmbL=cmb?COMBOS.find(c=>c.k===cmb).l.toLowerCase():'';
  box.append(el('p',{class:'note simple-only',style:'margin:0 0 8px',text:'A palette is four colors. Pick a role, then its color. Start with Primary: the other roles then suggest partners for it.'}));
  box.append(el('div',{class:'roles',role:'group','aria-label':'Color role to change'},ROLES.map(([r,l])=>el('button',{type:'button',class:'role','aria-pressed':String(role===r),'data-hex':state.colors[r].toUpperCase(),'data-role':ROLE_NAME[r],onclick:()=>{state.buildRole=r;buildResults();}},el('i',{style:'background:'+state.colors[r]}),el('span',{text:l}),el('code',{text:state.colors[r].toUpperCase()})))));
  {const ck=comboOf(state.colors),C=COMBOS.find(c=>c.k===(ck==='neutral'?'other':ck));box.append(el('p',{class:'note cmbnow',id:'cmbNow',title:C.d},tierEl('CANVA'),' These four colors make a ',el('b',{text:COMBO_LABEL[ck].toLowerCase()}),' combination. The panel tint behind cards is worked out from the ground.'));}
  const hx=el('input',{type:'text',id:'bHex',maxlength:7,placeholder:'#1A2B3C','aria-label':'Hex code for the '+rn+' color',style:'width:92px'});hx.value=state.colors[role].toUpperCase();
  const useHex=()=>{let v=hx.value.trim();if(v&&v[0]!=='#')v='#'+v;if(validHex(v))setRole(role,v);else{hx.value=state.colors[role].toUpperCase();say('That is not a hex color. Use six characters, such as #1A2B3C.');}};hx.addEventListener('change',useHex);hx.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();useHex();}});
  const sec=(title,right)=>el('div',{class:'bhead'},el('h3',null,title),right||null);
  box.append(sec('Current '+rn,el('span',{class:'rowbtns'},hx,wheelBtn(role,wheel.open))));
  if(wheel.open)box.append(wheelPanel(role));
  {const info=colorInfo(state.colors[role],role,!wheel.open);info.id='cinfo';box.append(info);}

  if(role!=='primary'){const rows=companions(anchor,role,ground,parsed.cw);const matched=rows.filter(r=>r.matched.length);let list=has&&!state.showLoose?matched:rows;
    /* Partners keep their order (how well they suit the primary); the combination and the target only filter them. */
    if(cmb)list=list.filter(r=>comboOfOffset(r.off)===cmb);
    if(tgt)list=list.filter(r=>tgtFit(colorLean(r.hex)).ok);list=list.slice(0,10);
    const narrowed=has&&!state.showLoose;
    box.append(sec(['Partners for ',el('i',{class:'dot','data-hex':anchor.toUpperCase(),'data-role':'primary',style:'background:'+anchor}),' your primary'],has&&rows.length>matched.length?el('button',{type:'button',class:'link',text:state.showLoose?'Keyword matches only':'Include colors with no keyword link',onclick:()=>{state.showLoose=!state.showLoose;buildResults();}}):null));
    box.append(el('p',{class:'note',style:'margin:0 0 8px',text:'Ranked by how well they suit the primary'+(cmb?', '+cmbL+' partners only':'')+(narrowed?', among colors that match a keyword':'')+(tgt?', that lean toward '+tgtNames():'')+'.'}));
    if(!list.length)box.append(el('p',{class:'empty',text:tgt?`None of the ${cmb?cmbL+' ':''}partners leans toward ${tgtNames()}. `+(narrowed?'Include colors with no keyword link, drop a direction, or pick from the single colors below.':'Drop a direction, or pick from the single colors below.'):cmb?`No ${cmbL} partner ${narrowed?'that matches your keywords ':''}works as the ${rn}. Choose All under Combination, ${narrowed?'include colors with no keyword link, ':''}or use the color wheel.`:has?`No ${rn} color that suits this primary matches your keywords. Include colors with no keyword link, or change the primary.`:'No suitable partners for this role.'}));
    const og=el('div',{class:'optgrid'});
    list.forEach(r=>{const hm=r.hm;
      const facts=[el('span',{class:'tchip',title:hm.why+' ('+SRC[hm.src].short+')'+(hm.close?'. Lightness is close to the primary, which lowered harmony ratings.':'')},tierEl(hm.src),hm.level+' harmony')];
      if(role==='text'||role==='accent')facts.push(el('span',{class:'tchip',title:'Contrast against the ground (WCAG 2.2)'+(role==='text'?'':r.pop<1.5?': too faint to stand out':r.pop>=3?': stands out':'')},tierEl('WCAG'),r.pop.toFixed(1)+':1 on ground'));
      og.append(el('button',{type:'button',class:'opt','aria-pressed':String(state.colors[role].toUpperCase()===r.hex),onclick:()=>setRole(role,r.hex)},el('span',{class:'vis sw'},el('i',{'data-hex':anchor.toUpperCase(),'data-role':'primary',style:'width:42%;background:'+anchor}),el('i',{'data-hex':r.hex,style:'width:58%;background:'+r.hex})),
        el('span',null,el('span',{class:'nm'},r.hex),el('div',{class:'meta',text:hm.rel+', '+r.label}),tgt?tgtChips(colorLean(r.hex)):null,whyCompact(r.tags,r.matched.slice(0,2),facts))));});
    box.append(og);}

  let lib=rankColors(parsed.cw);if(role==='text')lib=lib.filter(r=>contrast(r.it.hex,ground)>=4.5);if(role==='bg')lib=lib.filter(r=>{const L=hexToLch(r.it.hex).L;return L>80||L<28;});
  if(cmb)lib=lib.filter(r=>relToPrimary(r.it.hex)===cmb);
  const m=lib.filter(r=>r.score>0);let show=has?m.slice(0,35):lib;
  /* With a target, every color that fits is listed (keyword matches only, when there are keywords), closest first. */
  if(tgt)show=(has?m:lib).map(r=>Object.assign({},r,{fit:tgtFit(colorLean(r.it.hex))})).filter(r=>r.fit.ok).sort((a,b)=>b.fit.mean-a.fit.mean||b.score-a.score);
  box.append(sec('Single colors',el('span',{class:'meta',text:show.length+(cmb?' '+cmbL:'')+(tgt?(has?' match your keywords and fit your aim':' fit your aim'):has?' best matches for your keywords':' colors')})));
  if(!show.length)box.append(el('p',{class:'empty',text:tgt?`No ${cmb?cmbL+' ':'single '}color${has?' that matches your keywords':''} leans toward ${tgtNames()}. Drop a direction to widen the search.`:cmb?`No ${cmbL} color${has?' that matches your keywords':''} works as the ${rn}. Choose All under Combination, or use the color wheel.`:'No single color matches your keywords.'}));
  const live=el('div',{class:'cinfo live',id:'clive'},el('p',{class:'note',style:'margin:0',text:'Point at a swatch to see what it signals and its fingerprint percentages. Select it to use it as the '+rn+'.'}));
  const grid=el('div',{class:'swgrid'});show.forEach(r=>{const b=el('button',{type:'button',class:'swatch',style:'background:'+r.it.hex,'data-hex':r.it.hex,'data-name':r.it.name,'aria-label':r.it.name+' '+r.it.hex,'aria-pressed':String(state.colors[role].toUpperCase()===r.it.hex),onclick:()=>setRole(role,r.it.hex)});
    const showInfo=()=>{live.textContent='';const ci=colorInfo(r.it.hex,role);ci.firstChild.insertBefore(el('span',{text:r.it.name}),ci.firstChild.children[2]);live.append(...ci.childNodes);};b.addEventListener('mouseenter',showInfo);b.addEventListener('focus',showInfo);grid.append(b);});
  if(show.length)box.append(el('div',{class:'swwrap'},grid,live));
  box.append(sec('Save these colors as a palette'));
  const pn=el('input',{type:'text',id:'palName',maxlength:40,placeholder:'Name this palette','aria-label':'Palette name'});pn.addEventListener('keydown',e=>{if(e.key==='Enter')Lib.savePalette(pn.value);});
  box.append(el('div',{class:'savepal'},pn,el('button',{type:'button',class:'btn small primary',text:'Save palette',onclick:()=>Lib.savePalette(pn.value)})));
  if(myPalettes.length)box.append(el('div',{class:'mine'},myPalettes.map(p=>{const i=el('input',{type:'text',maxlength:40,'aria-label':'Rename '+p.name});i.value=p.name;i.addEventListener('change',()=>Lib.renamePalette(p.id,i.value));
    return el('span',{class:'term'},el('i',{class:'dot','data-hex':p.primary.toUpperCase(),style:'background:'+p.primary}),i,el('button',{type:'button',class:'link',text:'Use',onclick:()=>apply('colors',p.id)}),el('button',{type:'button','aria-label':'Delete '+p.name,text:'×',onclick:()=>Lib.deletePalette(p.id)}));})));
  wheelRefocus();}

/* ---------- build a type pairing (Advanced) ---------- */
function buildTypeBuilder(){const box=$('#results');box.textContent='';const cur=TYP[state.typeId]||TYP.clear,mine=cur.mine?myTypes.find(m=>m.id===cur.id):null,fams=Object.keys(FONT_FACES).sort();
  box.append(el('p',{class:'note',style:'margin-top:0',text:`Pair any two of the ${fams.length} typefaces that ship with the app. A pairing is saved with the brand and listed first under Ready-made pairings.`}));
  if(!mine){box.append(el('div',{class:'cinfo'},el('div',{class:'cihead'},el('b',{text:cur.name}),el('span',{text:cur.display.family+(cur.body.family!==cur.display.family?' with '+cur.body.family:'')})),el('p',{class:'note',text:'Ready-made pairings cannot be changed. Start your own from this one, then swap either face.'})),
      el('div',{class:'rowbtns'},el('button',{type:'button',class:'btn primary',text:'Start a pairing from this one',onclick:()=>Lib.saveType({name:'',d:[cur.display.family,cur.display.weight],b:[cur.body.family,cur.body.weight]})})));}
  else{const sel=(id,label,list,val,on)=>{const x=el('select',{id});list.forEach(v=>x.append(el('option',{value:v,text:typeof v==='number'?(v>=600?'Bold '+v:v===500?'Medium 500':'Regular '+v):v})));x.value=val;x.addEventListener('change',()=>on(x.value));return el('label',{for:id},label,x);};
    const upd=ch=>Lib.updateType(mine.id,ch);const nm=el('input',{type:'text',id:'tName',maxlength:40,'aria-label':'Pairing name'});nm.value=mine.name;nm.addEventListener('change',()=>upd({name:nm.value}));
    box.append(el('div',{class:'fields'},el('label',{for:'tName'},'Pairing name',nm),
      el('div',{class:'two'},sel('tDF','Headline typeface',fams,mine.d[0],v=>upd({d:[v,nearWeight(v,mine.d[1])]})),sel('tDW','Weight',FONT_FACES[mine.d[0]],mine.d[1],v=>upd({d:[mine.d[0],+v]}))),
      el('div',{class:'two'},sel('tBF','Supporting text typeface',fams,mine.b[0],v=>upd({b:[v,nearWeight(v,mine.b[1])]})),sel('tBW','Weight',FONT_FACES[mine.b[0]],mine.b[1],v=>upd({b:[mine.b[0],+v]})))));
    const d=cur.display,b=cur.body;box.append(el('div',{class:'specimen'},el('div',{style:`font-family:"${d.family}",${d.fb};font-weight:${d.weight};font-size:28px;line-height:1.1`,text:d.upper?'HEADLINE SAMPLE':'Headline sample'}),el('div',{style:`font-family:"${b.family}",${b.fb};font-weight:${b.weight};font-size:14px;margin-top:6px`,text:'Supporting text sample. The quick brown fox jumps over the lazy dog.'})));
    const tg=TAGS.type[cur.id];const ids=topTags(tg.tags,3);box.append(el('div',{class:'bhead'},el('h3',{text:'What this pairing signals'})),ids.length?whyList(tg.tags,ids):el('p',{class:'note',text:'No associations on file for this headline face.'}),el('p',{class:'note',text:'Associations follow the headline face, because the studies behind them rated single typefaces, not pairs.'}));
    tg.cautions.forEach(c=>box.append(el('p',{class:'note',text:'Note: '+c.text+' ('+SRC[c.src].short+')'})));}
  if(myTypes.length){box.append(el('div',{class:'bhead'},el('h3',{text:'Your pairings in this brand'})));box.append(el('div',{class:'mine'},myTypes.map(m=>el('span',{class:'term'},el('b',{text:m.name}),el('button',{type:'button',class:'link',text:m.id===state.typeId?'In use':'Use',onclick:()=>apply('type',m.id)}),el('button',{type:'button','aria-label':'Delete '+m.name,text:'\u00D7',onclick:()=>Lib.deleteType(m.id)})))));}}

/* ---------- readout ---------- */
/* What the current colors, type and graphic signal together: one weight per concept. */
function draftParts(){return[['Color',curPaletteTags(),1],['Type',TAGS.type[state.typeId]||TAGS.type.clear,.8],['Graphic',TAGS.graphic[state.graphicId]||TAGS.graphic.none,.6]];}
function draftAgg(parts){const agg={};(parts||draftParts()).forEach(([nm,tg,w])=>{for(const k in tg.tags){const t=tg.tags[k];const a=agg[k]||(agg[k]={w:0,from:[],srcs:{}});a.w+=Math.min(1,t.w)*w;a.from.push(nm);a.srcs[SRC[t.src].t]=t.src;}});return agg;}
function updateReadout(c){const parts=draftParts(),agg=draftAgg(parts);
  const ids=Object.keys(agg).sort((a,b)=>agg[b].w-agg[a].w).slice(0,6),mx=ids.length?agg[ids[0]].w:1;const key=JSON.stringify([ids.map(i=>[i,agg[i].w.toFixed(2)]),c.bg,c.fg,c.head,c.accent,c.onAccent,state.typeId,state.graphicId,parsed.concepts]);if(key===updateReadout.k)return;updateReadout.k=key;
  const box=$('#signals');box.textContent='';ids.forEach(id=>{const a=agg[id];const hit=parsed.concepts.includes(id);box.append(el('div',{class:'sig'},el('span',{class:'nm',text:cLabel(id)+(hit?' \u2713':'')}),el('span',{class:'bar'},el('i',{style:`width:${Math.round(a.w/mx*100)}%`})),el('span',{class:'from'},['R','S','C'].filter(t=>a.srcs[t]).map(t=>tierEl(a.srcs[t])),' from '+a.from.join(', ').toLowerCase())));});
  const miss=parsed.concepts.filter(cid=>!agg[cid]||agg[cid].w<.25);if(miss.length)box.append(el('div',{class:'empty',text:'Asked for but weak or missing in this draft: '+miss.map(cLabel).join(', ')+'.'}));
  const ck=$('#checks');ck.textContent='';[['Headline',c.head,c.bg,3],['Body text',c.fg,c.bg,4.5],['Button text',c.onAccent,c.accent,4.5]].forEach(([nm,fg,bg,min])=>{const r=contrast(fg,bg),ok=r>=min;
    ck.append(el('span',{class:'check',title:`WCAG 2.2 asks for at least ${min}:1 here`},el('span',{class:'sw',style:`background:${bg};color:${fg}`,text:'Aa'}),nm+' ',el('b',{text:r.toFixed(1)+':1'}),el('span',{class:ok?'pass':'fail',text:ok?'Passes':'Below '+min+':1'}),tierEl('WCAG')));});
  const hm=harmonyOf(state.colors.primary,state.colors.accent);ck.append(el('span',{class:'check',title:hm.why},el('span',{class:'sw',style:`background:linear-gradient(90deg,${state.colors.primary} 50%,${state.colors.accent} 50%)`}),'Primary with accent ',el('b',{text:hm.level+' harmony'}),el('span',{text:hm.rel.toLowerCase()}),tierEl(hm.src)));
  const cu=$('#cautions');cu.textContent='';const cs=[].concat(parts[0][1].cautions,parts[1][1].cautions,parts[2][1].cautions);
  {const pass=ck.querySelectorAll('.pass').length,fail=ck.querySelectorAll('.fail').length,n=Math.min(4,cs.length);const d=$('#dSum');d.textContent='';d.append(el('span',{class:fail?'fail':'pass',text:fail?fail+' contrast '+(fail===1?'check is':'checks are')+' below the minimum':'Text contrast passes ('+pass+' of '+pass+')'}),n?el('span',{class:'cau',text:n+' '+(n===1?'note':'notes')}):null);}
  cs.slice(0,4).forEach(x=>cu.append(el('li',null,el('span',{class:'mk',text:'Note'}),el('span',null,x.text+' ('+SRC[x.src].short+')'))));}

/* ---------- right column forms ---------- */
function buildFields(){const box=$('#fields');box.textContent='';const mk=(id,label,val,max,area,on)=>{const inp=area?el('textarea',{id:'f_'+id,maxlength:max,rows:2}):el('input',{id:'f_'+id,type:'text',maxlength:max});inp.value=val||'';inp.addEventListener('input',()=>{on(inp.value);requestPaint(true);});return el('label',{for:'f_'+id},label,inp);};
  LAYOUTS[state.layout].fields.forEach(f=>box.append(mk(f,FIELDS[f].label,state.content[f],FIELDS[f].max,FIELDS[f].area,v=>state.content[f]=v)));
  box.append(el('p',{class:'note',text:'Fields change with the layout. Placeholder copy avoids result claims; replace it with wording you can stand behind.'}));}
function buildColors(){const box=$('#colors');box.textContent='';ROLES.forEach(([role,label])=>{const hex=el('input',{type:'text',id:'h_'+role,maxlength:7,'aria-label':label+' hex value'});hex.value=state.colors[role].toUpperCase();
    const pick=el('button',{type:'button',class:'cwell',id:'c_'+role,'data-hex':state.colors[role].toUpperCase(),'data-role':ROLE_NAME[role],style:'background:'+state.colors[role],'aria-label':'Open the color wheel for the '+ROLE_NAME[role]+' color',onclick:()=>openWheel(role)});
    hex.addEventListener('change',()=>{let v=hex.value.trim();if(v&&v[0]!=='#')v='#'+v;if(validHex(v))setRole(role,v);else hex.value=state.colors[role].toUpperCase();});
    box.append(el('div',{class:'cfield'},el('label',{for:'h_'+role,text:label}),pick,hex));});palNote();$('#gStrength').value=Math.round(state.gStrength*100);$('#tint').checked=state.tint;}
function palNote(){const p=PAL[state.paletteId];$('#palNote').textContent=(isCustom()?'Edited from '+p.name+'. Associations are recalculated from your colors. ':p.name+'. ')+(p.note||'');}

/* ---------- export ---------- */
const dlReady=(window.claude&&typeof window.claude.use==='function')?Promise.resolve().then(()=>window.claude.use('downloads')).catch(()=>null):Promise.resolve(null);
/* Messages go to the status line of the page in view: the Brand page has its own. */
function statusEl(){const b=$('#viewBrand'),bs=$('#bStatus');return b&&!b.hidden&&bs?bs:$('#status');}
function say(t){const s=statusEl();document.querySelectorAll('#status,#bStatus').forEach(x=>x.textContent='');s.textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>{s.textContent='';},6000);}
/* A status message with one button, such as Undo. It stays a little longer than a plain message. */
function sayAction(t,label,fn){const s=statusEl();document.querySelectorAll('#status,#bStatus').forEach(x=>x.textContent='');s.textContent=t+' ';s.append(el('button',{type:'button',class:'link',text:label,onclick:()=>{s.textContent='';fn();}}));clearTimeout(say.t);say.t=setTimeout(()=>{s.textContent='';},12000);}
function slug(t){return String(t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'draft';}
async function saveFile(filename,data,isImage){const dl=await dlReady;if(dl){try{await dl.save({filename,data});say('Saved '+filename+'.');return;}catch(e){if(e&&e.code==='declined'){say('Export cancelled.');return;}if(e&&e.code==='rate_limited'){say('A save prompt is already open. Answer it, then try again.');return;}}}
  if(!window.claude){try{const u=URL.createObjectURL(data instanceof Blob?data:new Blob([data])),a=el('a',{href:u,download:filename});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);say('Saved '+filename+' to your downloads.');return;}catch(e){}}
  if(isImage){$('#outMsg').textContent='If no download started, press and hold or right-click the image and choose Save image. File name: '+filename;const box=$('#outImg');box.textContent='';box.append(el('img',{src:URL.createObjectURL(data),alt:'Exported draft'}));$('#ovOut').hidden=false;}
  else say('This view cannot save files. Open the page on its own and try again.');}
const scriptP={};function loadScript(src){return scriptP[src]||(scriptP[src]=new Promise((res,rej)=>{const t=document.createElement('script');t.src=src;t.onload=res;t.onerror=()=>{delete scriptP[src];rej(new Error('Could not load '+src));};document.head.append(t);}));}
async function draftBlob(s,jpg){await ensureType(s.typeId);const fmt=FMT[s.format];const cv=document.createElement('canvas');cv.width=fmt.w;cv.height=fmt.h;renderDraft(cv.getContext('2d'),fmt.w,fmt.h,snap(s),{});return await new Promise(r=>cv.toBlob(r,jpg?'image/jpeg':'image/png',jpg?.92:undefined));}
async function exportPNG(s,jpg){s=s||state;const fmt=FMT[s.format],blob=await draftBlob(s,jpg);if(!blob){say('The browser could not create the image.');return;}await saveFile(`${slug(s.brandName)}-${slug(fmt.p+'-'+fmt.name)}-${fmt.w}x${fmt.h}.${jpg?'jpg':'png'}`,blob,true);}
/* Advanced: one PNG per format of the current platform, zipped. A format keeps the current layout when it offers it. */
async function exportSet(){const plat=PLATFORMS.find(p=>p.id===state.platform),fs=FORMATS.filter(f=>f.p===state.platform);say('Building '+fs.length+' '+plat.name+' sizes\u2026');
  try{await loadScript('vendor/jszip.min.js');const z=new JSZip();for(const f of fs){const s=Object.assign({},state,{format:f.id,layout:f.layouts.includes(state.layout)?state.layout:f.layouts[0]});const blob=await draftBlob(s,false);if(blob)z.file(`${slug(f.name)}-${f.w}x${f.h}.png`,blob);}
    await saveFile(`${slug(state.brandName)}-${slug(plat.name)}-all-sizes.zip`,await z.generateAsync({type:'blob'}),false);}catch(e){console.error(e);say('The set could not be built. Try again.');}}
/* Advanced: reopen the current post in the Layer editor. Text, buttons, bars and the logo become layers;
   the ground, photo and graphic are flattened into one locked background layer. */
async function toLayers(){await ensureType(state.typeId);const fmt=FMT[state.format],cv=document.createElement('canvas');cv.width=fmt.w;cv.height=fmt.h;const rec=[],S=snap();S.logoRef=logoImg&&logoRef?logoRef:null;renderDraft(cv.getContext('2d'),fmt.w,fmt.h,S,{rec});
  const blob=await new Promise(r=>cv.toBlob(r,'image/png'));if(!blob){say('The browser could not prepare the layers.');return;}
  const layers=[{id:'L'+uidGen(),t:'img',ref:Store.memRef(blob),x:0,y:0,w:fmt.w,h:fmt.h,lock:true,name:'Background (ground, photo, graphic)'}];
  rec.forEach(r=>{const id='L'+uidGen();if(r.k==='rect')layers.push({id,t:'rect',x:r.x,y:r.y,w:r.w,h:r.h,fill:r.fill,radius:r.radius||0,name:r.name});else if(r.k==='img')layers.push({id,t:'img',ref:r.ref,x:r.x,y:r.y,w:r.w,h:r.h,name:r.name});
    else{const w=r.w*1.04+4,x=r.align==='center'?r.ax-w/2:r.align==='right'?r.ax-w:r.ax;layers.push({id,t:'text',text:r.text,x,y:r.y,w,h:r.text.split('\n').length*r.size*r.lh,size:r.size,lh:r.lh,track:r.track||0,family:r.family,weight:r.weight,color:r.color,align:r.align});}});
  const name=(($('#postName').value||'').trim()||state.content.headline||'Post').slice(0,46)+' (layers)';
  Free.open({id:null,name,w:fmt.w,h:fmt.h,bg:S.c.bg,layers},['This is a copy of your template post. The original is unchanged.','Each piece of text, each button and bar, and the logo is its own layer. The ground, photo and graphic are one locked background layer: unlock it in the list to move or replace it.','A layer layout no longer follows the template, so changing the format or layout in the Designer will not affect it. Use Resize to a platform format here instead.']);
  Lib.setView('free');Free.say('Opened as '+layers.length+' layers. Save it to keep it with the brand.');}

/* ---------- advanced options panel ---------- */
/* Media page tool rail: one panel open at a time, like Canva's side panel. */
function setPanel(p){if(p==='adjust'&&uiMode!=='advanced')p='layouts';state.mpanel=p;document.querySelectorAll('#rail button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.p===p)));
  document.querySelectorAll('#mPanel .mp').forEach(x=>x.hidden=x.dataset.p!==p);if(p==='brand'||p==='graphic')renderLook();}
function syncAdv(){const pc=v=>Math.round(v*100);$('#aHead').value=pc(state.headScale);$('#aBody').value=pc(state.bodyScale);$('#oHead').textContent=pc(state.headScale)+'%';$('#oBody').textContent=pc(state.bodyScale)+'%';$('#aCaps').value=state.caps;
  $('#aFx').value=pc(state.fx);$('#aFy').value=pc(state.fy);$('#aTint').value=pc(state.tintAmt);$('#aDim').value=pc(state.dim);$('#aMark').checked=state.showMark;$('#aHandle').checked=state.showHandle;
  const n=$('#advNote'),on=advActive(state);n.hidden=!on;if(on){n.textContent='This post uses Advanced settings for text size, photo or brand mark. ';n.append(el('button',{type:'button',class:'link',text:'Reset them',onclick:()=>{Object.assign(state,ADV_DEFAULTS);syncAdv();requestPaint(true);}}),' or switch to Advanced to change them.');}}
function bootAdv(){const rng=(id,key)=>$(id).addEventListener('input',e=>{state[key]=e.target.value/100;syncAdv();requestPaint(true);});rng('#aHead','headScale');rng('#aBody','bodyScale');rng('#aFx','fx');rng('#aFy','fy');rng('#aTint','tintAmt');rng('#aDim','dim');
  $('#aCaps').addEventListener('change',e=>{state.caps=e.target.value;syncAdv();requestPaint(true);});$('#aMark').addEventListener('change',e=>{state.showMark=e.target.checked;syncAdv();requestPaint(true);});$('#aHandle').addEventListener('change',e=>{state.showHandle=e.target.checked;syncAdv();requestPaint(true);});
  $('#aReset').addEventListener('click',()=>{Object.assign(state,ADV_DEFAULTS);syncAdv();requestPaint(true);});
  $('#btnLayers').addEventListener('click',toLayers);$('#btnJpg').addEventListener('click',()=>exportPNG(null,true));$('#btnSet').addEventListener('click',exportSet);
  document.querySelectorAll('#modeSeg button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.v)));document.querySelectorAll('#welMode button').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.v)));
  $('#btnHelp').addEventListener('click',()=>{$('#ovWelcome').hidden=false;});}

/* ---------- shuffle ---------- */
/* Shuffle stays inside the brand: another layout, another color arrangement, another of the brand's
   saved palettes or (when chosen, Advanced) another style of the post's graphic. It never changes the type
   or the graphic family; those belong to the brand. */
function shuffle(){const pick=a=>a[Math.floor(Math.random()*a.length)];let changed=false;
  if(state.shuffle.layout){const ls=FMT[state.format].layouts.filter(l=>l!==state.layout);if(ls.length){state.layout=pick(ls);buildLayouts();buildFields();changed=true;}}
  if(state.shuffle.arrangement){state.arrangement=pick(['base','brand','contrast'].filter(a=>a!==state.arrangement));syncSeg();changed=true;}
  if(state.shuffle.colors){const L=Lib.look(),opts=[L?{id:L.paletteId,cols:L.colors}:null].concat(myPalettes.map(p=>({id:p.id,cols:palColors(p)}))).filter(Boolean).filter(o=>!sameColors(o.cols,state.colors));
    if(opts.length){const o=pick(opts);state.paletteId=o.id;state.colors=Object.assign({},o.cols);buildColors();renderLook();changed=true;}}
  if(state.shuffle.graphic){const os=GFAM[(GV[state.graphicId]||GV.none).fam].vars.filter(v=>v.id!==state.graphicId);if(os.length){state.graphicId=pick(os).id;renderLook();changed=true;}}
  if(changed)requestPaint(true);else say('Nothing to shuffle: choose what Shuffle changes, or save more palettes to the brand.');}
function syncSeg(){document.querySelectorAll('#arr button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===state.arrangement)));document.querySelectorAll('#shuf button').forEach(b=>b.setAttribute('aria-pressed',String(!!state.shuffle[b.dataset.v])));$('#btnGuides').setAttribute('aria-pressed',String(state.guides));}

/* ---------- sources ---------- */
function buildSources(){const box=$('#srcBody');box.textContent='';const P=t=>box.append(el('p',{text:t})),H=t=>box.append(el('h3',{text:t}));
  P('Every palette, single color, type pairing and graphic carries tags. A tag is not hand-assigned: it is worked out from the item\u2019s measurable features by a rule, and each rule names the study or convention it rests on. Your keywords are matched to the same tags, so the options you see are the ones whose features point where you asked.');
  H('How keywords are organized');
  P('Three established frameworks give the index its coverage. Brand personality uses the five dimensions and 42 trait words of Aaker\u2019s scale. Emotions use the 20 emotions of the Geneva Emotion Wheel, the set measured against color in 30 nations, grouped here into 15 concepts plus Awe, Energy and Power from the pleasure-arousal-dominance model. Ideas use Schwartz\u2019s ten basic values. Styles and topics are added as conventions. Words with no mapping are reported, not guessed.');
  P('Around 2,100 further everyday words, slang and trade terms among them, were suggested by a language model and reviewed by hand. They are mapped by meaning in the same way as the synonyms, and their keyword chips say so. They widen what a search understands; they add no evidence about what a color or typeface conveys.');
  P('Difficult emotions are included because the spectrum is incomplete without them, and because a memorial post, a warning or a horror release needs them. Few type and graphic options are linked to them; the app says so instead of stretching.');
  H('How colors are scored');
  P('Hue links come from the logo and emotion studies. Brightness and saturation are scored separately: each emotion sits in a corner of pleasure-arousal-dominance space, and a color\u2019s position in that space is estimated from its brightness and saturation with Valdez and Mehrabian\u2019s regression weights. The same rules score a single color and a whole palette, so a color you pick yourself is read the same way as a preloaded one.');
  H('Four colors, and how they combine');
  P('A palette is four colors: ground, primary, accent and text. The panel tint behind cards and photo placeholders is not a fifth choice; it is worked out from the ground and the primary. Brands and posts saved before this change keep the panel tint they had.');
  P('Monochromatic, analogous, complementary and triadic are the color-wheel combinations taught in design guides such as Canva\u2019s. The app reads a palette\u2019s type from the hue angles of its colors on the RGB wheel: all within 24 degrees is monochromatic, within 72 analogous, two groups at least 150 degrees apart complementary, three groups 90 to 150 degrees apart triadic. Near-white, near-black and gray colors have no hue and are left out. These types are conventions for building a palette, not measured effects, so they filter the list but add nothing to a palette\u2019s score.');
  P('The palettes marked \u201CCanva no.\u201D are four-color combinations from Canva\u2019s list of 100. Canva does not say which color is the ground or the text, so the app assigns the roles by rule: the two colors with the most contrast become ground and text, the less colorful of them the ground, and of the other two the one that shows better on the ground becomes the primary. A combination is left out when none of its colors can be read as text on another at 4.5:1; 58 of the 100 qualify. The theme Canva gives each combination is recorded as a convention.');
  P('Pointing at any color shows its fingerprint as percentages, the numbers behind the radar shape. 100% is that color\u2019s own strongest signal, so the figures compare directions within one color; they are not an absolute amount, and two colors at 100% on the same axis are not equally strong.');
  H('How graphics are scored');
  P('Each graphic comes in three or four styles, and each style is described by its shape features: curved or angular, balanced or asymmetric, fine lines or heavy masses, busy or sparse, still or implying movement. The same rules tag every style from those features, so two styles of one graphic can point to different parts of the fingerprint. Curved, angular, balanced, elaborate, asymmetric and moving shapes rest on logo studies; fine, heavy, sparse and hand-made shapes are conventions and say so. The badges on each style name where it leans furthest compared with the other styles of the same graphic.');
  H('How companion colors are chosen');
  P('In Build color by color, partners for your primary are generated around it (same hue, neighboring hues, contrasting hues, tinted neutrals), scored for harmony, and kept only if they also match one of your keywords. Harmony follows two findings: pairs are rated more harmonious the closer their hues, and same-hue pairs with a clear lightness step do best. The popular rule that opposite hues harmonize did not hold up in that research; a contrasting hue is rated less harmonious but stands out more, which is why it can still suit an accent.');
  H('Saving, sharing and import');
  if(window.claude)P('Your account here is your Claude sign-in; the page cannot run its own registration. Brands, palettes and posts are stored in your private part of this page\u2019s database, and uploaded images in its asset store. A share link stores a snapshot that any account with access to the page can copy. People need access to the page itself, at Contributor level or above, to save their own work.');
  else P('This copy of the app has no accounts and no server. Brands, palettes, pairings, posts and uploaded images are stored in this browser on this device, and nothing is uploaded. Clearing the browser\u2019s site data removes them, so keep a backup file. To give a brand or a post to someone else, share it as a file; they add it to their own copy of the app, images included.');
  P('Edit as layers redraws a template post with a recorder in place of the brush: each piece of text, each button and bar, and the logo is written down as a layer at the position and size the template gave it, and everything else is kept as one background image.');
  P('PDF import redraws the page once per element to lift each shape and image onto its own layer, reads the live text with its position and size, and samples each text color from the rendering. Typefaces that are not bundled are replaced with the nearest available one and listed. Flattened PDFs have no live text to recover. The guidelines PDF in a brand kit is written so Canva\u2019s Brand Kit Builder can read it; how much that tool picks up is Canva\u2019s decision.');
  H('What the three labels mean');
  const ul0=el('ul',{class:'srcs'});[['AAKER','Research: a peer-reviewed study measured this link. Effects are averages across participants, mostly in North America and Europe, and often for logos or color chips seen in isolation.'],['WCAG','Standard: a published specification, or a platform\u2019s own requirement as reported by current industry guides.'],['CONV','Convention: common practice in design and marketing. Useful as a shared code with your audience, but nobody in this index tested it. Bridged values carry this label too.']].forEach(([s,t])=>ul0.append(el('li',null,tierEl(s),el('span',{text:t}))));box.append(ul0);
  H('Limits worth knowing');
  const lim=el('ul',{style:'margin:0;padding-left:18px;color:var(--ink-2);max-width:70ch;display:grid;gap:4px'});['Color meaning is weaker than the popular charts suggest. Brightness and saturation move feelings more than hue does, and fit with the brand and product matters more than any single color.','Several hue links in Labrecque and Milne were only partly supported. They are included at reduced weight and labelled.','The 30-nation study reports only its strongest color-emotion pairings in the text. Emotions without a strong color there (pride, admiration, shame and others) are scored from brightness and saturation alone, or not at all.','Pleasure-arousal-dominance scores use screen brightness and saturation in place of the printed samples the study tested. Treat them as a ranking, not a measurement.','The harmony score applies the published principles with weights chosen here. It is a sorting aid; your eye has the final say.','The research covers colors, typefaces and simple shapes one at a time. Nothing here predicts how a full post performs. Test finalists with the real audience.','Safe zones and sizes are third-party measurements that vary between guides and change without notice.'].forEach(t=>lim.append(el('li',{text:t})));box.append(lim);
  H('Sources');const ul=el('ul',{class:'srcs'});Object.keys(SRC).forEach(k=>{const s=SRC[k];ul.append(el('li',null,tierEl(k),el('span',null,el('div',null,s.cite+' ',s.url?el('a',{href:s.url,target:'_blank',rel:'noopener',text:'Open source'}):null),el('div',{class:'use',text:s.use}))));});box.append(ul);}
function closeOverlays(){document.querySelectorAll('.overlay').forEach(o=>o.hidden=true);}

/* ---------- wiring ---------- */
function loadImage(file,cb){if(!file)return;const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>cb(im);im.onerror=()=>say('That file could not be read as an image.');im.src=fr.result;};fr.readAsDataURL(file);}
function initAll(){$('#q').value='';renderChips();setPanel(state.mpanel);syncIdentity();syncPvFmt();setStep(state.bstep);renderLook();syncSeg();syncAdv();setFormat(state.format);buildColors();buildFields();parsed=parseQuery(state.query);buildTerms();buildResults();buildDrafts();requestPaint(true);useType(state.typeId);}
function boot(){
  $('#appName').textContent=APP_NAME;setMode(uiMode,true);bootAdv();
  bootBrand();
  document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.v;buildResults();}));
  $('#btnAll').addEventListener('click',()=>{state.showAll=!state.showAll;buildResults();});
  document.querySelectorAll('#arr button').forEach(b=>b.addEventListener('click',()=>{state.arrangement=b.dataset.v;syncSeg();requestPaint(true);}));
  document.querySelectorAll('#shuf button').forEach(b=>b.addEventListener('click',()=>{state.shuffle[b.dataset.v]=!state.shuffle[b.dataset.v];syncSeg();}));
  $('#btnGuides').addEventListener('click',()=>{state.guides=!state.guides;syncSeg();requestPaint(false);});
  document.querySelectorAll('#rail button').forEach(b=>b.addEventListener('click',()=>{setPanel(b.dataset.p);store.set('brandlab.state.v1',state);}));
  $('#btnPrev').addEventListener('click',()=>stepLayout(-1));$('#btnNext').addEventListener('click',()=>stepLayout(1));$('#btnShuffle').addEventListener('click',shuffle);
  $('#btnExport').addEventListener('click',()=>exportPNG());
  $('#inPhoto').addEventListener('change',e=>loadImage(e.target.files[0],im=>{photoImg=im;photoRef=Store.memRef(e.target.files[0]);if(!LAYOUTS[state.layout].photo){const l=FMT[state.format].layouts.find(x=>LAYOUTS[x].photo);if(l){state.layout=l;buildLayouts();buildFields();}else say('This format has no photo layout. The photo will show when you pick one that does.');}requestPaint(true);}));
  $('#inLogo').addEventListener('change',e=>loadImage(e.target.files[0],im=>{logoImg=im;logoRef=Store.memRef(e.target.files[0]);requestPaint(true);}));
  $('#rmPhoto').addEventListener('click',()=>{photoImg=null;photoRef=null;$('#inPhoto').value='';requestPaint(true);});$('#rmLogo').addEventListener('click',()=>{logoImg=null;logoRef=null;$('#inLogo').value='';requestPaint(true);});
  $('#tint').addEventListener('change',e=>{state.tint=e.target.checked;requestPaint(true);});
  $('#gStrength').addEventListener('input',e=>{state.gStrength=e.target.value/100;requestPaint(true);});
  $('#btnSeed').addEventListener('click',()=>{state.seed=1+Math.floor(Math.random()*9999);requestPaint(true);});
  $('#mgStrength').addEventListener('input',e=>{state.gStrength=e.target.value/100;$('#gStrength').value=e.target.value;requestPaint(true);});
  $('#mgSeed').addEventListener('click',()=>{state.seed=1+Math.floor(Math.random()*9999);requestPaint(true);});
  $('#btnSavePal').addEventListener('click',()=>Lib.savePalette($('#palName2').value));
  $('#btnResetPal').addEventListener('click',()=>{state.colors=palColors(PAL[state.paletteId]);buildColors();buildResults();requestPaint(true);});
  $('#btnSources').addEventListener('click',()=>{$('#ovSources').hidden=false;});$('#btnSources2').addEventListener('click',()=>{$('#ovSources').hidden=false;});
  document.querySelectorAll('.overlay').forEach(o=>{o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-close]'))o.hidden=true;});});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlays();});
  let rz=0;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>requestPaint(false),80);});
  bootColorTip();buildSources();initAll();
  if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{clearTimeout(boot.t);boot.t=setTimeout(()=>{updateReadout.k='';requestPaint(true);},120);});}

