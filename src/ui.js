/* ============================================================
   UI: state, search results, color builder, template picker, drafts, export
   ============================================================ */
const $=s=>document.querySelector(s);
function el(tag,attrs){const n=document.createElement(tag);if(attrs)for(const k in attrs){const v=attrs[k];if(v==null||v===false)continue;if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k.startsWith('on'))n.addEventListener(k.slice(2),v);else if(k==='style')n.style.cssText=v;else n.setAttribute(k,v===true?'':v);}
  for(let i=2;i<arguments.length;i++){const c=arguments[i];if(c==null||c===false)continue;if(Array.isArray(c))c.forEach(x=>x!=null&&x!==false&&n.append(x));else n.append(c);}return n;}
const store={get(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const ROLES=[['bg','Ground'],['surface','Panel'],['primary','Primary'],['accent','Accent'],['text','Text']];
const ROLE_NAME={bg:'ground',surface:'panel',primary:'primary',accent:'accent',text:'text'};
const palColors=p=>({bg:p.bg,surface:p.surface,primary:p.primary,accent:p.accent,text:p.text});
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
const ADV_DEFAULTS={headScale:1,bodyScale:1,caps:'auto',fx:.5,fy:.5,tintAmt:.7,dim:1,showMark:true,showHandle:true};
const advActive=s=>Object.keys(ADV_DEFAULTS).some(k=>s[k]!==ADV_DEFAULTS[k]);
function setMode(m,quiet){uiMode=m==='advanced'?'advanced':'simple';store.set('brandlab.mode.v1',uiMode);document.body.classList.toggle('mode-simple',uiMode==='simple');document.body.classList.toggle('mode-advanced',uiMode==='advanced');
  document.querySelectorAll('#modeSeg button,#welMode button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===uiMode)));if(quiet)return;buildResults();syncAdv();requestPaint(false);}

function defaults(brandId){const b=BRANDS[brandId];return{brandId,brandName:b.name,handle:b.handle,platform:'facebook',format:'fb-feed',layout:'announce',paletteId:b.palette,colors:palColors(PAL[b.palette]),arrangement:'base',typeId:b.type,graphicId:b.graphic,gStrength:.55,seed:11,tint:false,content:Object.assign({},b.content),guides:true,query:b.query,tab:'colors',showAll:false,colorMode:'palettes',buildRole:'primary',showLoose:false,typeClass:'all',typeMode:'sets',shuffle:{colors:true,type:true,graphic:true,layout:false},
  headScale:1,bodyScale:1,caps:'auto',fx:.5,fy:.5,tintAmt:.7,dim:1,showMark:true,showHandle:true,pvFmt:'square',bstep:'describe'};}
function sane(s){const d=defaults(BRANDS[s&&s.brandId]?s.brandId:'sample');if(!s)return d;const o=Object.assign(d,s);o.content=Object.assign({},d.content,s.content||{});o.shuffle=Object.assign({},d.shuffle,s.shuffle||{});
  if(!FMT[o.format])o.format='fb-feed';o.platform=FMT[o.format].p;if(!FMT[o.format].layouts.includes(o.layout))o.layout=FMT[o.format].layouts[0];if(!TYP[o.typeId])o.typeId='clear';if(!GRA[o.graphicId])o.graphicId='none';
  const okColors=o.colors&&ROLES.every(([r])=>validHex(String(o.colors[r]||'')));if(!PAL[o.paletteId]){o.paletteId=DEFAULT_PAL;if(!okColors)o.colors=palColors(PAL[o.paletteId]);}else if(!okColors)o.colors=palColors(PAL[o.paletteId]);
  if(!ROLES.some(([r])=>r===o.buildRole))o.buildRole='primary';if(!TYPE_CLASSES.some(c=>c[0]===o.typeClass))o.typeClass='all';
  const nm=(k,lo,hi)=>{const v=+o[k];o[k]=isFinite(v)?Math.min(hi,Math.max(lo,v)):ADV_DEFAULTS[k];};nm('headScale',.6,1.5);nm('bodyScale',.8,1.3);nm('fx',0,1);nm('fy',0,1);nm('tintAmt',.1,1);nm('dim',.4,1.3);
  if(!['auto','upper','normal'].includes(o.caps))o.caps='auto';o.showMark=o.showMark!==false;o.showHandle=o.showHandle!==false;if(o.typeMode!=='build')o.typeMode='sets';if(!['colors','type','graphic','identity'].includes(o.tab))o.tab='colors';if(!['square','story','banner'].includes(o.pvFmt))o.pvFmt='square';if(o.bstep!=='build')o.bstep='describe';return o;}
let state=sane(store.get('brandlab.state.v1'));
let photoImg=null,logoImg=null;

function typeFor(s){const t=TYP[s.typeId]||TYP.clear,hs=s.headScale||1,bs=s.bodyScale||1,cp=s.caps||'auto';if(hs===1&&bs===1&&cp==='auto')return t;
  const d=Object.assign({},t.display,{scale:(t.display.scale||1)*hs}),b=Object.assign({},t.body,{scale:(t.body.scale||1)*bs});if(cp==='upper')d.upper=true;else if(cp==='normal')d.upper=false;return Object.assign({},t,{display:d,body:b});}
function snap(s){s=s||state;const lay=LAYOUTS[s.layout];return{fmt:FMT[s.format],layout:s.layout,p:s.colors,arrangement:s.arrangement,type:typeFor(s),graphic:s.graphicId,gStrength:s.gStrength,seed:s.seed,content:s.content,brand:{name:s.brandName,handle:s.handle},photo:lay.photo?photoImg:null,logo:logoImg,tint:s.tint,
  fx:s.fx,fy:s.fy,tintAmt:s.tintAmt,dim:s.dim,noMark:s.showMark===false,noHandle:s.showHandle===false};}
function curPaletteTags(){const base=PAL[state.paletteId];return tagPalette(Object.assign({},state.colors,{conv:isCustom()?{}:base.conv}));}
function isCustom(){const b=PAL[state.paletteId];return ROLES.some(([r])=>b[r].toUpperCase()!==state.colors[r].toUpperCase());}

/* Fonts load on demand: only the faces a draft uses are fetched. */
const fontReady={};
function ensureType(id){const t=TYP[id];if(!t)return Promise.resolve();const specs=[t.display,t.body].map(s=>`${s.weight} 24px "${s.family}"`);const key=specs.join('|');if(fontReady[key])return fontReady[key];
  return fontReady[key]=(document.fonts&&document.fonts.load?Promise.all(specs.map(s=>document.fonts.load(s).catch(()=>null))):Promise.resolve()).then(()=>true);}
function useType(id){ensureType(id).then(()=>{updateReadout.k='';requestPaint(true);});}

/* ---------- painting ---------- */
let paintQ=false,thumbT=0,saveT=0;
function requestPaint(thumbs){if(!paintQ){paintQ=true;requestAnimationFrame(()=>{paintQ=false;paint();});}
  if(thumbs){clearTimeout(thumbT);thumbT=setTimeout(()=>{paintLayoutThumbs();paintDrafts();if(state.tab==='graphic')paintGraphicThumbs();},140);}
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

/* ---------- results ---------- */
function buildSubbar(){const bar=$('#subbar');bar.textContent='';
  if(state.tab==='colors'){bar.append(el('div',{class:'seg',role:'group','aria-label':'Color mode'},[['palettes','Premade palettes'],['build','Build your own']].map(([v,t])=>el('button',{type:'button','aria-pressed':String(state.colorMode===v),text:t,onclick:()=>{state.colorMode=v;buildResults();}}))));}
  else if(state.tab==='type'){const build=uiMode==='advanced'&&state.typeMode==='build',ts=listedTypes();
    if(uiMode==='advanced')bar.append(el('div',{class:'seg',role:'group','aria-label':'Type mode'},[['sets','Ready-made pairings'],['build','Build a pairing']].map(([v,t])=>el('button',{type:'button','aria-pressed':String((build?'build':'sets')===v),text:t,onclick:()=>{state.typeMode=v;buildResults();}}))));
    if(!build)bar.append(el('div',{class:'sugg'},TYPE_CLASSES.map(([v,t])=>el('button',{type:'button',class:state.typeClass===v?'on':'','aria-pressed':String(state.typeClass===v),text:t+' '+(v==='all'?ts.length:ts.filter(x=>x.cls===v).length),onclick:()=>{state.typeClass=v;buildResults();}}))));}}
function buildResults(){const res=results(),has=parsed.concepts.length>0;const count=k=>has?res[k].filter(r=>r.score>0).length:res[k].length;
  $('#nColors').textContent=count('colors');$('#nType').textContent=count('type');$('#nGraphic').textContent=count('graphic');
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.v===state.tab)));renderSavedPals();
  const idt=state.tab==='identity';$('#bIdentity').hidden=!idt;$('#results').hidden=idt;$('#subbar').hidden=idt;if(idt){$('#rhead').hidden=true;syncIdentity();return;}buildSubbar();
  const kind=state.tab;if(kind==='colors'&&state.colorMode==='build'){$('#rhead').hidden=true;buildColorBuilder();return;}
  if(kind==='type'&&state.typeMode==='build'&&uiMode==='advanced'){$('#rhead').hidden=true;buildTypeBuilder();return;}$('#rhead').hidden=false;
  let rows=res[kind];if(kind==='type'&&state.typeClass!=='all')rows=rows.filter(r=>r.it.cls===state.typeClass);
  const matches=rows.filter(r=>r.score>0),show=has&&!state.showAll?matches:rows;
  $('#rSummary').textContent=has?(matches.length?`${matches.length} of ${rows.length} match ${kwLabels()}, best first`:`Nothing here is linked to ${kwLabels()}`):`All ${rows.length}. Type keywords to rank them.`;
  const ba=$('#btnAll');ba.hidden=!has||matches.length===rows.length;ba.textContent=state.showAll?'Matches only':`Show all ${rows.length}`;
  const box=$('#results');box.textContent='';const tagKind=kind==='colors'?'palette':kind;
  show.forEach(r=>{const it=r.it;const tg=TAGS[tagKind][it.id].tags;const ids=(r.matched.length?r.matched.filter(c=>tg[c]):topTags(tg,2)).slice(0,3);
    const inUse=kind==='colors'?(state.paletteId===it.id&&!isCustom()):kind==='type'?state.typeId===it.id:state.graphicId===it.id;let vis,meta=null;
    if(kind==='colors'){const widths={bg:30,surface:14,primary:26,accent:16,text:14};vis=el('span',{class:'vis sw'},ROLES.map(([role])=>el('i',{style:`width:${widths[role]}%;background:${it[role]}`})));if(it.mine)meta=el('div',{class:'meta',text:'Your palette'});else if(it.note)meta=el('div',{class:'meta',text:it.note});}
    else if(kind==='type'){const d=it.display;vis=el('span',{class:'vis aa',style:`font-family:"${d.family}",${d.fb};font-weight:${d.weight}`,text:d.upper?'AA':'Aa'});meta=el('div',{class:'meta',text:(it.mine?'Your pairing: ':'')+d.family+(it.body.family!==d.family?' with '+it.body.family:'')});}
    else{vis=el('span',{class:'vis'},el('canvas',{'data-g':it.id,width:176,height:120}));}
    box.append(el('button',{type:'button',class:'opt','aria-pressed':String(inUse),onclick:()=>apply(kind,it.id)},vis,el('span',null,el('span',{class:'nm'},it.name,inUse?el('span',{class:'inuse',text:'In use'}):null),meta,ids.length?whyList(tg,ids):null)));});
  if(!show.length)box.append(el('p',{class:'empty',text:kind==='type'&&state.typeClass!=='all'?'No face in this group is linked to those keywords. Try another group or \u201CShow all\u201D.':'Try the other tabs, or choose \u201CShow all\u201D.'}));
  if(kind==='graphic')paintGraphicThumbs();}
function paintGraphicThumbs(){const c=makeScheme(state.colors,'base');document.querySelectorAll('#results canvas[data-g]').forEach(cv=>{const ctx=cv.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=c.bg;ctx.fillRect(0,0,cv.width,cv.height);drawGraphic(ctx,cv.dataset.g,{x:0,y:0,w:cv.width,h:cv.height},c,.85,state.seed);});}
function runSearch(){parsed=parseQuery(liveQuery());buildTerms();buildResults();updateReadout.k='';requestPaint(false);}
function apply(kind,id){if(kind==='colors'){state.paletteId=id;state.colors=palColors(PAL[id]);buildColors();renderLook();}else if(kind==='type'){state.typeId=id;useType(id);}else state.graphicId=id;buildResults();requestPaint(true);}

/* ---------- build color by color ---------- */
function setRole(role,hex){state.colors[role]=hex.toUpperCase();buildColors();buildResults();requestPaint(true);}
function colorInfo(hex,forRole){const t=tagColor(hex),has=parsed.concepts.length>0;const m=scoreTags(t.tags,parsed.cw).matched;const ids=(m.length?m:topTags(t.tags,2)).slice(0,3);
  const head=el('div',{class:'cihead'},el('i',{class:'dot',style:'background:'+hex}),el('b',{text:hex.toUpperCase()}),el('span',{text:HUE_LABEL[t.fam]+' family'}),has?el('span',{class:m.length?'pass':'fail',text:m.length?'Matches '+m.map(cLabel).join(', '):'No link to your keywords'}):null);
  const box=el('div',{class:'cinfo'},head,ids.length?whyList(t.tags,ids):el('p',{class:'note',text:'No associations on file for this color.'}));
  t.cautions.forEach(c=>box.append(el('p',{class:'note',text:'Note: '+c.text+' ('+SRC[c.src].short+')'})));return box;}
function buildColorBuilder(){const box=$('#results');box.textContent='';const role=state.buildRole,has=parsed.concepts.length>0,ground=state.colors.bg,anchor=state.colors.primary;
  box.append(el('p',{class:'note',style:'margin-top:0',text:'Pick a role, then choose its color. Start with Primary; the other roles then show partners that suit it.'}));
  box.append(el('div',{class:'roles',role:'group','aria-label':'Color role to change'},ROLES.map(([r,l])=>el('button',{type:'button',class:'role','aria-pressed':String(role===r),onclick:()=>{state.buildRole=r;buildResults();}},el('i',{style:'background:'+state.colors[r]}),el('span',{text:l}),el('code',{text:state.colors[r].toUpperCase()})))));
  const pick=el('input',{type:'color',id:'bPick','aria-label':'Custom '+ROLE_NAME[role]+' color'});pick.value=state.colors[role];pick.addEventListener('change',()=>setRole(role,pick.value));
  const hx=el('input',{type:'text',id:'bHex',maxlength:7,placeholder:'#1A2B3C','aria-label':'Hex code for the '+ROLE_NAME[role]+' color',style:'width:92px'});hx.value=state.colors[role].toUpperCase();
  const useHex=()=>{let v=hx.value.trim();if(v&&v[0]!=='#')v='#'+v;if(validHex(v))setRole(role,v);else{hx.value=state.colors[role].toUpperCase();say('That is not a hex color. Use six characters, such as #1A2B3C.');}};hx.addEventListener('change',useHex);hx.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();useHex();}});
  box.append(el('div',{class:'bhead'},el('h3',{text:'Current '+ROLE_NAME[role]}),el('span',{class:'rowbtns'},hx,el('label',{class:'btn small',for:'bPick',style:'cursor:pointer'},'Any color\u2026',pick))));
  const info=colorInfo(state.colors[role],role);info.id='cinfo';box.append(info);

  if(role!=='primary'){const rows=companions(anchor,role,ground,parsed.cw);const matched=rows.filter(r=>r.matched.length);const list=(has&&!state.showLoose?matched:rows).slice(0,10);
    box.append(el('div',{class:'bhead'},el('h3',null,'Goes with your primary ',el('i',{class:'dot',style:'background:'+anchor}),has?' and matches a keyword':''),has&&rows.length>matched.length?el('button',{type:'button',class:'link',text:state.showLoose?'Keyword matches only':'Include colors with no keyword link',onclick:()=>{state.showLoose=!state.showLoose;buildResults();}}):null));
    if(!list.length)box.append(el('p',{class:'empty',text:has?`No ${ROLE_NAME[role]} color that suits this primary is linked to ${kwLabels()}. Choose \u201CInclude colors with no keyword link\u201D, or change the primary.`:'No suitable partners for this role.'}));
    list.forEach(r=>{const hm=r.hm;const extra=[el('li',null,tierEl(hm.src),el('span',null,el('b',{text:hm.level+' harmony: '}),hm.why+' ('+SRC[hm.src].short+')'+(hm.close?'. Lightness is close to the primary, which lowered harmony ratings.':'')))];
      if(role==='text'||role==='accent')extra.push(el('li',null,tierEl('WCAG'),el('span',null,el('b',{text:'On the ground: '}),r.pop.toFixed(1)+':1 contrast'+(role==='text'?'':r.pop<1.5?', too faint to stand out':r.pop>=3?', stands out':''))));
      box.append(el('button',{type:'button',class:'opt','aria-pressed':String(state.colors[role].toUpperCase()===r.hex),onclick:()=>setRole(role,r.hex)},el('span',{class:'vis sw'},el('i',{style:'width:42%;background:'+anchor}),el('i',{style:'width:58%;background:'+r.hex})),el('span',null,el('span',{class:'nm'},r.hex,el('span',{class:'meta',text:hm.rel+', '+r.label})),whyList(r.tags,r.matched.slice(0,2),extra))));});}
  else box.append(el('p',{class:'note',text:'Partners for this primary appear when you select Ground, Panel, Accent or Text above.'}));

  let lib=rankColors(parsed.cw);if(role==='text')lib=lib.filter(r=>contrast(r.it.hex,ground)>=4.5);if(role==='bg')lib=lib.filter(r=>{const L=hexToLch(r.it.hex).L;return L>80||L<28;});
  const m=lib.filter(r=>r.score>0),show=has?m.slice(0,35):lib;
  box.append(el('div',{class:'bhead'},el('h3',{text:has?(m.length?`Single colors linked to ${kwLabels()}`:`No single color is linked to ${kwLabels()}`):'All colors'}),el('span',{class:'meta',text:has&&m.length?'Best first':''})));
  const live=el('div',{class:'cinfo live',id:'clive'},el('p',{class:'note',style:'margin:0',text:'Point at a swatch to see what it signals. Select it to use it as the '+ROLE_NAME[role]+'.'}));
  const grid=el('div',{class:'swgrid'});show.forEach(r=>{const b=el('button',{type:'button',class:'swatch',style:'background:'+r.it.hex,title:r.it.name+' '+r.it.hex,'aria-label':r.it.name+' '+r.it.hex,'aria-pressed':String(state.colors[role].toUpperCase()===r.it.hex),onclick:()=>setRole(role,r.it.hex)});
    const showInfo=()=>{live.textContent='';const ci=colorInfo(r.it.hex,role);ci.firstChild.insertBefore(el('span',{text:r.it.name}),ci.firstChild.children[2]);live.append(...ci.childNodes);};b.addEventListener('mouseenter',showInfo);b.addEventListener('focus',showInfo);grid.append(b);});
  box.append(grid,live);
  box.append(el('div',{class:'bhead'},el('h3',{text:'Save this combination to the brand'})));
  const pn=el('input',{type:'text',id:'palName',maxlength:40,placeholder:'Name this palette','aria-label':'Palette name'});pn.addEventListener('keydown',e=>{if(e.key==='Enter')Lib.savePalette(pn.value);});
  box.append(el('div',{class:'savepal'},pn,el('button',{type:'button',class:'btn small primary',text:'Save palette',onclick:()=>Lib.savePalette(pn.value)})));
  if(myPalettes.length)box.append(el('div',{class:'mine'},myPalettes.map(p=>{const i=el('input',{type:'text',maxlength:40,'aria-label':'Rename '+p.name});i.value=p.name;i.addEventListener('change',()=>Lib.renamePalette(p.id,i.value));
    return el('span',{class:'term'},el('i',{class:'dot',style:'background:'+p.primary}),i,el('button',{type:'button',class:'link',text:'Use',onclick:()=>apply('colors',p.id)}),el('button',{type:'button','aria-label':'Delete '+p.name,text:'\u00D7',onclick:()=>Lib.deletePalette(p.id)}));})));}

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
  const cu=$('#cautions');cu.textContent='';const cs=[].concat(parts[0][1].cautions,parts[1][1].cautions,parts[2][1].cautions);cs.slice(0,4).forEach(x=>cu.append(el('li',null,el('span',{class:'mk',text:'Note'}),el('span',null,x.text+' ('+SRC[x.src].short+')'))));}

/* ---------- right column forms ---------- */
function buildFields(){const box=$('#fields');box.textContent='';const mk=(id,label,val,max,area,on)=>{const inp=area?el('textarea',{id:'f_'+id,maxlength:max,rows:2}):el('input',{id:'f_'+id,type:'text',maxlength:max});inp.value=val||'';inp.addEventListener('input',()=>{on(inp.value);requestPaint(true);});return el('label',{for:'f_'+id},label,inp);};
  LAYOUTS[state.layout].fields.forEach(f=>box.append(mk(f,FIELDS[f].label,state.content[f],FIELDS[f].max,FIELDS[f].area,v=>state.content[f]=v)));
  box.append(el('p',{class:'note',text:'Fields change with the layout. Placeholder copy avoids result claims; replace it with wording you can stand behind.'}));}
function buildColors(){const box=$('#colors');box.textContent='';ROLES.forEach(([role,label])=>{const pick=el('input',{type:'color',id:'c_'+role,'aria-label':label+' color'}),hex=el('input',{type:'text',id:'h_'+role,maxlength:7,'aria-label':label+' hex value'});pick.value=state.colors[role];hex.value=state.colors[role].toUpperCase();
    const set=v=>{state.colors[role]=v.toUpperCase();pick.value=v;hex.value=v.toUpperCase();palNote();buildResults();requestPaint(true);};pick.addEventListener('change',()=>set(pick.value));hex.addEventListener('change',()=>{let v=hex.value.trim();if(validHex(v))set(v[0]==='#'?v:'#'+v);else hex.value=state.colors[role];});
    box.append(el('label',null,label,pick,hex));});palNote();$('#gStrength').value=Math.round(state.gStrength*100);$('#tint').checked=state.tint;}
function palNote(){const p=PAL[state.paletteId];$('#palNote').textContent=(isCustom()?'Edited from '+p.name+'. Associations are recalculated from your colors. ':p.name+'. ')+(p.note||'');}

/* ---------- export ---------- */
const dlReady=(window.claude&&typeof window.claude.use==='function')?Promise.resolve().then(()=>window.claude.use('downloads')).catch(()=>null):Promise.resolve(null);
function say(t){$('#status').textContent=t;clearTimeout(say.t);say.t=setTimeout(()=>{$('#status').textContent='';},6000);}
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
function shuffle(){const res=results(),has=parsed.concepts.length>0;const pool=k=>{const m=res[k].filter(r=>r.score>0);const src=has&&m.length>=2?m.slice(0,Math.max(3,Math.ceil(m.length*.6))):res[k];return src[Math.floor(Math.random()*src.length)].it;};
  if(state.shuffle.colors){const p=pool('colors');state.paletteId=p.id;state.colors=palColors(p);const r=Math.random();state.arrangement=r<.55?'base':r<.82?'brand':'contrast';}
  if(state.shuffle.type){state.typeId=pool('type').id;useType(state.typeId);}
  if(state.shuffle.graphic){let g=pool('graphic');if(g.id==='none')g=pool('graphic');state.graphicId=g.id;state.seed=1+Math.floor(Math.random()*9999);}
  if(state.shuffle.layout){const ls=FMT[state.format].layouts;state.layout=ls[Math.floor(Math.random()*ls.length)];buildLayouts();buildFields();}
  syncSeg();buildColors();buildResults();requestPaint(true);}
function stepLayout(d){const ls=FMT[state.format].layouts;state.layout=ls[(ls.indexOf(state.layout)+d+ls.length)%ls.length];buildLayouts();buildFields();requestPaint(true);}
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
function initAll(){$('#q').value='';renderChips();syncIdentity();syncPvFmt();setStep(state.bstep);renderLook();syncSeg();syncAdv();setFormat(state.format);buildColors();buildFields();parsed=parseQuery(state.query);buildTerms();buildResults();buildDrafts();requestPaint(true);useType(state.typeId);}
function boot(){
  $('#appName').textContent=APP_NAME;setMode(uiMode,true);bootAdv();
  bootBrand();
  document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.v;buildResults();}));
  $('#btnAll').addEventListener('click',()=>{state.showAll=!state.showAll;buildResults();});
  document.querySelectorAll('#arr button').forEach(b=>b.addEventListener('click',()=>{state.arrangement=b.dataset.v;syncSeg();requestPaint(true);}));
  document.querySelectorAll('#shuf button').forEach(b=>b.addEventListener('click',()=>{state.shuffle[b.dataset.v]=!state.shuffle[b.dataset.v];syncSeg();}));
  $('#btnGuides').addEventListener('click',()=>{state.guides=!state.guides;syncSeg();requestPaint(false);});
  $('#btnPrev').addEventListener('click',()=>stepLayout(-1));$('#btnNext').addEventListener('click',()=>stepLayout(1));$('#btnShuffle').addEventListener('click',shuffle);
  $('#btnExport').addEventListener('click',()=>exportPNG());
  $('#inPhoto').addEventListener('change',e=>loadImage(e.target.files[0],im=>{photoImg=im;photoRef=Store.memRef(e.target.files[0]);if(!LAYOUTS[state.layout].photo){const l=FMT[state.format].layouts.find(x=>LAYOUTS[x].photo);if(l){state.layout=l;buildLayouts();buildFields();}else say('This format has no photo layout. The photo will show when you pick one that does.');}requestPaint(true);}));
  $('#inLogo').addEventListener('change',e=>loadImage(e.target.files[0],im=>{logoImg=im;logoRef=Store.memRef(e.target.files[0]);requestPaint(true);}));
  $('#rmPhoto').addEventListener('click',()=>{photoImg=null;photoRef=null;$('#inPhoto').value='';requestPaint(true);});$('#rmLogo').addEventListener('click',()=>{logoImg=null;logoRef=null;$('#inLogo').value='';requestPaint(true);});
  $('#tint').addEventListener('change',e=>{state.tint=e.target.checked;requestPaint(true);});
  $('#gStrength').addEventListener('input',e=>{state.gStrength=e.target.value/100;requestPaint(true);});
  $('#btnSeed').addEventListener('click',()=>{state.seed=1+Math.floor(Math.random()*9999);requestPaint(true);});
  $('#btnSavePal').addEventListener('click',()=>Lib.savePalette($('#palName2').value));
  $('#btnResetPal').addEventListener('click',()=>{state.colors=palColors(PAL[state.paletteId]);buildColors();buildResults();requestPaint(true);});
  $('#btnSources').addEventListener('click',()=>{$('#ovSources').hidden=false;});$('#btnSources2').addEventListener('click',()=>{$('#ovSources').hidden=false;});
  document.querySelectorAll('.overlay').forEach(o=>{o.addEventListener('click',e=>{if(e.target===o||e.target.closest('[data-close]'))o.hidden=true;});});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlays();});
  let rz=0;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>requestPaint(false),80);});
  buildSources();initAll();
  if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',()=>{clearTimeout(boot.t);boot.t=setTimeout(()=>{updateReadout.k='';requestPaint(true);},120);});}

