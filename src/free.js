/* ============================================================
   FREE: the layer editor, and PDF / image import into layers
   A layout is {w,h,bg,layers[]}. Layer types: text, img, rect. Imported vector
   shapes arrive as img layers; flat ones carry `flat` so they can be recolored.
   ============================================================ */
const Free=(function(){
  let doc=null,sel=null,hist=[],drag=null,notes=[],guides=[],pdfState=null,scaleNow=1,dirty=false;
  const imgs=new Map(),tints=new Map();
  const FAMS=Object.keys(FONT_FACES).sort((a,b)=>b.length-a.length),normF=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
  const fbFor=f=>/serif|lora|garamond|baskerville|playfair|merriweather|bitter|slab|bodoni|cinzel|fraunces|abril|rye|pirata/i.test(f)&&!/sans/i.test(f)?FB.serif:/mono|elite|press start/i.test(f)?FB.mono:FB.sans;
  const fontOf=l=>`${l.weight} ${l.size}px "${l.family}", ${fbFor(l.family)}`;
  const lid=()=>'L'+uidGen();
  function blank(w,h,name){return{id:null,name:name||'Untitled layout',w,h,bg:'#FFFFFF',layers:[]};}
  function ensureFont(family,weight){return document.fonts&&document.fonts.load?document.fonts.load(`${weight} 24px "${family}"`).catch(()=>null):Promise.resolve();}

  /* ---------- drawing ---------- */
  function linesOf(ctx,l){ctx.font=fontOf(l);if('letterSpacing'in ctx)ctx.letterSpacing=l.track?(l.size*l.track).toFixed(2)+'px':'0px';const out=[];String(l.text).split('\n').forEach(par=>{if(!par.trim()){out.push('');return;}wrapLines(ctx,par,Math.max(10,l.w)).forEach(x=>out.push(x));});return out;}
  function tinted(l,im){const key=l.ref+'|'+l.tint;if(tints.has(key))return tints.get(key);const c=document.createElement('canvas');c.width=im.width||im.naturalWidth;c.height=im.height||im.naturalHeight;const x=c.getContext('2d');x.drawImage(im,0,0);x.globalCompositeOperation='source-in';x.fillStyle=l.tint;x.fillRect(0,0,c.width,c.height);tints.set(key,c);return c;}
  function render(ctx,d){ctx.fillStyle=d.bg;ctx.fillRect(0,0,d.w,d.h);
    for(const l of d.layers){if(l.hide)continue;ctx.save();ctx.globalAlpha=l.op==null?1:l.op;
      if(l.t==='rect'){ctx.fillStyle=l.fill;if(l.radius){rr(ctx,l.x,l.y,l.w,l.h,l.radius);ctx.fill();}else ctx.fillRect(l.x,l.y,l.w,l.h);}
      else if(l.t==='img'){const im=imgs.get(l.ref);if(im)ctx.drawImage(l.tint?tinted(l,im):im,l.x,l.y,l.w,l.h);else{ctx.fillStyle='rgba(128,128,128,.25)';ctx.fillRect(l.x,l.y,l.w,l.h);}}
      else{const ls=linesOf(ctx,l);ctx.fillStyle=l.color;ctx.textBaseline='alphabetic';ctx.textAlign=l.align||'left';const ax=l.align==='center'?l.x+l.w/2:l.align==='right'?l.x+l.w:l.x;
        ls.forEach((s,i)=>ctx.fillText(s,ax,l.y+l.size*(l.lh-1)/2+l.size*.8+i*l.size*l.lh));l.h=Math.max(1,ls.length)*l.size*l.lh;if('letterSpacing'in ctx)ctx.letterSpacing='0px';}
      ctx.restore();}}
  async function prepare(d){const jobs=[];for(const l of d.layers){if(l.t==='img'&&!imgs.has(l.ref))jobs.push(Store.loadImage(l.ref).then(im=>{if(im)imgs.set(l.ref,im);}));if(l.t==='text')jobs.push(ensureFont(l.family,l.weight));}await Promise.all(jobs);}
  async function renderDocTo(cv,d,maxW,maxH){const sc=Math.min(maxW/d.w,maxH/d.h),cw=Math.max(8,Math.round(d.w*sc)),ch=Math.max(8,Math.round(d.h*sc));cv.width=cw*2;cv.height=ch*2;cv.style.width=cw+'px';cv.style.height=ch+'px';const ctx=cv.getContext('2d');const draw=()=>{ctx.setTransform(cv.width/d.w,0,0,cv.width/d.w,0,0);render(ctx,d);};draw();await prepare(d);draw();}

  /* ---------- editor canvas ---------- */
  const $f=id=>document.getElementById(id);
  let pq=false;function paint(){if(pq)return;pq=true;requestAnimationFrame(()=>{pq=false;paintNow();});}
  function paintNow(){if(!doc||$f('viewFree').hidden)return;const st=$f('fStage'),cv=$f('fcv');const narrow=window.matchMedia('(max-width:1060px)').matches;
    const hh=narrow?Math.min((st.clientWidth-36)*doc.h/doc.w,Math.max(360,window.innerHeight*.6))+36:clamp(st.parentElement.clientHeight-150,320,1200);st.style.height=Math.round(hh)+'px';
    const aw=st.clientWidth-36,ah=st.clientHeight-36,sc=Math.min(aw/doc.w,ah/doc.h);const cw=Math.max(60,Math.floor(doc.w*sc)),ch=Math.max(20,Math.floor(doc.h*sc)),dpr=Math.min(2,window.devicePixelRatio||1);
    const pw=Math.min(doc.w,Math.round(cw*dpr)),ph=Math.round(pw*doc.h/doc.w);if(cv.width!==pw||cv.height!==ph){cv.width=pw;cv.height=ph;}cv.style.width=cw+'px';cv.style.height=ch+'px';scaleNow=cw/doc.w;
    const ctx=cv.getContext('2d');ctx.setTransform(pw/doc.w,0,0,pw/doc.w,0,0);render(ctx,doc);
    const px=1/scaleNow;ctx.save();
    guides.forEach(g=>{ctx.strokeStyle='rgb(226,0,116)';ctx.lineWidth=px;ctx.beginPath();if(g.x!=null){ctx.moveTo(g.x,0);ctx.lineTo(g.x,doc.h);}else{ctx.moveTo(0,g.y);ctx.lineTo(doc.w,g.y);}ctx.stroke();});
    const l=cur();if(l&&!l.hide){ctx.strokeStyle='#2F6BFF';ctx.lineWidth=1.5*px;ctx.strokeRect(l.x,l.y,l.w,l.h);if(!l.lock){ctx.fillStyle='#fff';handles(l).forEach(h=>{ctx.fillRect(h.x-5*px,h.y-5*px,10*px,10*px);ctx.strokeRect(h.x-5*px,h.y-5*px,10*px,10*px);});}}
    ctx.restore();}
  const cur=()=>doc&&sel?doc.layers.find(l=>l.id===sel):null;
  function handles(l){const x0=l.x,x1=l.x+l.w,y0=l.y,y1=l.y+l.h,xm=l.x+l.w/2,ym=l.y+l.h/2;const hs=[{k:'nw',x:x0,y:y0},{k:'ne',x:x1,y:y0},{k:'se',x:x1,y:y1},{k:'sw',x:x0,y:y1},{k:'e',x:x1,y:ym},{k:'w',x:x0,y:ym}];if(l.t!=='text')hs.push({k:'n',x:xm,y:y0},{k:'s',x:xm,y:y1});return hs;}
  function pt(e){const r=$f('fcv').getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*doc.w,y:(e.clientY-r.top)/r.height*doc.h};}
  function hit(p){for(let i=doc.layers.length-1;i>=0;i--){const l=doc.layers[i];if(l.hide||l.lock)continue;if(p.x>=l.x&&p.x<=l.x+l.w&&p.y>=l.y&&p.y<=l.y+l.h)return l;}return null;}
  function down(e){if(!doc)return;const p=pt(e),l=cur(),tol=9/scaleNow;
    if(l&&!l.lock){const h=handles(l).find(h=>Math.abs(h.x-p.x)<=tol&&Math.abs(h.y-p.y)<=tol);if(h){drag={mode:h.k,p,o:Object.assign({},l)};$f('fcv').setPointerCapture(e.pointerId);e.preventDefault();return;}}
    const t=hit(p);select(t?t.id:null);if(t){drag={mode:'move',p,o:Object.assign({},t)};$f('fcv').setPointerCapture(e.pointerId);}e.preventDefault();}
  function move(e){if(!drag||!doc)return;const l=cur();if(!l)return;const p=pt(e),dx=p.x-drag.p.x,dy=p.y-drag.p.y,o=drag.o,m=drag.mode;guides=[];
    if(m==='move'){l.x=o.x+dx;l.y=o.y+dy;const s=7/scaleNow,cx=l.x+l.w/2,cy=l.y+l.h/2;
      if(Math.abs(cx-doc.w/2)<s){l.x=doc.w/2-l.w/2;guides.push({x:doc.w/2});}else if(Math.abs(l.x)<s)l.x=0;else if(Math.abs(l.x+l.w-doc.w)<s)l.x=doc.w-l.w;
      if(Math.abs(cy-doc.h/2)<s){l.y=doc.h/2-l.h/2;guides.push({y:doc.h/2});}else if(Math.abs(l.y)<s)l.y=0;else if(Math.abs(l.y+l.h-doc.h)<s)l.y=doc.h-l.h;}
    else if(m==='e'){l.w=Math.max(20,o.w+dx);}
    else if(m==='w'){const w=Math.max(20,o.w-dx);l.x=o.x+o.w-w;l.w=w;}
    else if(m==='n'){const h=Math.max(8,o.h-dy);l.y=o.y+o.h-h;l.h=h;}
    else if(m==='s'){l.h=Math.max(8,o.h+dy);}
    else{const sx=m.includes('e')?1:-1,sy=m.includes('s')?1:-1;let w=Math.max(20,o.w+sx*dx),h=Math.max(8,o.h+sy*dy);
      if(l.t==='text'||(l.t==='img'&&!e.shiftKey)){const f=Math.max(w/o.w,l.t==='text'?0:h/o.h)||w/o.w;w=o.w*f;h=o.h*f;if(l.t==='text')l.size=Math.max(6,o.size*f);}
      l.w=w;l.h=h;l.x=sx>0?o.x:o.x+o.w-w;l.y=sy>0?o.y:o.y+o.h-h;}
    paint();}
  function up(){if(drag){drag=null;guides=[];commit();buildProps();paint();}}
  function select(id){sel=id;buildLayers();buildProps();paint();}
  function snapshot(){return JSON.stringify({w:doc.w,h:doc.h,bg:doc.bg,layers:doc.layers});}
  function commit(){const s=snapshot();if(hist[hist.length-1]!==s){hist.push(s);if(hist.length>60)hist.shift();dirty=true;}}
  function undo(){if(hist.length<2)return;hist.pop();const s=JSON.parse(hist[hist.length-1]);Object.assign(doc,s);if(!cur())sel=null;buildLayers();buildProps();paint();}
  function touch(){paint();clearTimeout(touch.t);touch.t=setTimeout(commit,350);}

  /* ---------- panels ---------- */
  function labelOf(l){return l.name||(l.t==='text'?(l.text.replace(/\s+/g,' ').slice(0,26)||'Text'):l.t==='rect'?'Rectangle':l.flat?'Shape':'Image');}
  function buildLayers(){const box=$f('fLayers');if(!box)return;box.textContent='';if(!doc)return;
    if(!doc.layers.length)box.append(el('p',{class:'empty',text:'No layers yet. Import a PDF, or add text, a rectangle or an image.'}));
    doc.layers.slice().reverse().forEach(l=>{box.append(el('div',{class:'lrow'+(l.id===sel?' on':'')},
      el('button',{type:'button',class:'lsel',onclick:()=>select(l.id)},el('i',{class:'lt',text:l.t==='text'?'T':l.t==='rect'?'□':l.flat?'◆':'▣'}),el('span',{text:labelOf(l)})),
      el('button',{type:'button',class:'lbtn','aria-pressed':String(!!l.hide),title:l.hide?'Show layer':'Hide layer','aria-label':(l.hide?'Show ':'Hide ')+labelOf(l),text:l.hide?'Hidden':'Hide',onclick:()=>{l.hide=!l.hide;commit();buildLayers();paint();}}),
      el('button',{type:'button',class:'lbtn','aria-pressed':String(!!l.lock),title:l.lock?'Unlock so it can be selected on the canvas':'Lock so clicks pass through it','aria-label':(l.lock?'Unlock ':'Lock ')+labelOf(l),text:l.lock?'Locked':'Lock',onclick:()=>{l.lock=!l.lock;commit();buildLayers();paint();}})));});}
  function field(label,input){return el('label',null,label,input);}
  function num(v,min,max,step,on){const i=el('input',{type:'number',min,max,step});i.value=Math.round(v*100)/100;i.addEventListener('input',()=>{const n=parseFloat(i.value);if(!isNaN(n)){on(clamp(n,min,max));touch();}});return i;}
  function colorRow(val,on){const wrap=el('div',{class:'crow'});const pick=el('input',{type:'color','aria-label':'Custom color'});pick.value=validHex(val||'')?val:'#000000';pick.addEventListener('input',()=>{on(pick.value.toUpperCase());touch();});
    ROLES.forEach(([r,n])=>wrap.append(el('button',{type:'button',class:'cdot',style:'background:'+state.colors[r],title:'Brand '+n.toLowerCase()+' '+state.colors[r],'aria-label':'Use brand '+n.toLowerCase(),onclick:()=>{on(state.colors[r]);pick.value=state.colors[r];touch();buildProps();}})));wrap.append(pick);return wrap;}
  function buildProps(){const box=$f('fProps');if(!box)return;box.textContent='';if(!doc){box.append(el('p',{class:'empty',text:'Import a PDF or start a blank canvas to begin.'}));return;}
    const l=cur();
    if(!l){box.append(el('div',{class:'h',text:'Canvas'}));const sz=el('select',{id:'fSize','aria-label':'Canvas size'});sz.append(el('option',{value:'',text:`${doc.w} × ${doc.h} px (current)`}));
      FORMATS.forEach(f=>sz.append(el('option',{value:f.id,text:`${PLATFORMS.find(p=>p.id===f.p).name}: ${f.name} (${f.w} × ${f.h})`})));sz.addEventListener('change',()=>{if(sz.value)resize(FMT[sz.value].w,FMT[sz.value].h);});
      const cw=el('input',{type:'number',min:64,max:6000,step:1,'aria-label':'Canvas width in pixels'}),chh=el('input',{type:'number',min:64,max:6000,step:1,'aria-label':'Canvas height in pixels'});cw.value=doc.w;chh.value=doc.h;
      const applySize=()=>{const w=clamp(Math.round(+cw.value)||doc.w,64,6000),h=clamp(Math.round(+chh.value)||doc.h,64,6000);if(w!==doc.w||h!==doc.h)resize(w,h);};
      box.append(el('div',{class:'fields'},field('Resize to a platform format',sz),el('div',{class:'two'},field('Width (px)',cw),field('Height (px)',chh)),el('div',{class:'rowbtns'},el('button',{type:'button',class:'btn small',text:'Apply custom size',onclick:applySize})),field('Background color',colorRow(doc.bg,v=>{doc.bg=v;}))),el('p',{class:'note',text:'Select a layer on the canvas or in the list to edit it. Drag to move, pull a handle to resize, arrow keys nudge, Delete removes.'}));return;}
    box.append(el('div',{class:'h',text:l.t==='text'?'Text layer':l.t==='rect'?'Rectangle':l.flat?'Shape':'Image'}));const f=el('div',{class:'fields'});
    if(l.t==='text'){const ta=el('textarea',{id:'fText',rows:3});ta.value=l.text;ta.addEventListener('input',()=>{l.text=ta.value;touch();buildLayers();});
      const fam=el('select',{id:'fFam'});Object.keys(FONT_FACES).sort().forEach(n=>fam.append(el('option',{value:n,text:n})));fam.value=l.family;
      const wt=el('select',{id:'fWt'});const fillW=()=>{wt.textContent='';FONT_FACES[l.family].forEach(w=>wt.append(el('option',{value:w,text:w>=600?'Bold '+w:w===500?'Medium 500':'Regular '+w})));if(!FONT_FACES[l.family].includes(l.weight))l.weight=FONT_FACES[l.family].reduce((a,b)=>Math.abs(b-l.weight)<Math.abs(a-l.weight)?b:a);wt.value=l.weight;};fillW();
      fam.addEventListener('change',()=>{l.family=fam.value;fillW();ensureFont(l.family,l.weight).then(paint);touch();});wt.addEventListener('change',()=>{l.weight=+wt.value;ensureFont(l.family,l.weight).then(paint);touch();});
      const al=el('div',{class:'seg'},['left','center','right'].map(a=>el('button',{type:'button','aria-pressed':String((l.align||'left')===a),text:a[0].toUpperCase()+a.slice(1),onclick:()=>{l.align=a;touch();buildProps();}})));
      f.append(field('Text',ta),el('div',{class:'two'},field('Typeface',fam),field('Weight',wt)),el('div',{class:'two'},field('Size (px)',num(l.size,6,800,1,v=>{l.size=v;})),field('Line height',num(l.lh,.8,3,.05,v=>{l.lh=v;}))),field('Letter spacing (% of size)',num((l.track||0)*100,-8,60,1,v=>{l.track=v/100;})),field('Color',colorRow(l.color,v=>{l.color=v;})),field('Alignment',al));}
    else if(l.t==='rect'){f.append(field('Fill',colorRow(l.fill,v=>{l.fill=v;})),field('Corner radius (px)',num(l.radius||0,0,2000,1,v=>{l.radius=v;})));}
    else{if(l.flat)f.append(field('Shape color',colorRow(l.tint||l.flat,v=>{l.tint=v;})),el('p',{class:'note',text:'This shape came from the imported file as a picture of a flat color, so it can be recolored and resized, but not reshaped.'}));
      const rep=el('input',{type:'file',accept:'image/*'});rep.addEventListener('change',()=>{const fl=rep.files[0];if(!fl)return;const ref=Store.memRef(fl);Store.loadImage(ref).then(im=>{if(!im)return;imgs.set(ref,im);l.ref=ref;delete l.flat;delete l.tint;const r=im.naturalHeight/im.naturalWidth;l.h=l.w*r;commit();buildProps();paint();});});f.append(field('Replace with another image',rep));}
    f.append(field('Opacity (%)',num((l.op==null?1:l.op)*100,5,100,5,v=>{l.op=v/100;})));
    f.append(el('div',{class:'rowbtns'},el('button',{type:'button',class:'btn small',text:'Bring forward',onclick:()=>order(1)}),el('button',{type:'button',class:'btn small',text:'Send back',onclick:()=>order(-1)}),el('button',{type:'button',class:'btn small',text:'Duplicate',onclick:dup}),el('button',{type:'button',class:'btn small',text:'Delete',onclick:remove})));
    box.append(f);}
  function order(d){const i=doc.layers.findIndex(l=>l.id===sel),j=i+d;if(i<0||j<0||j>=doc.layers.length)return;const[x]=doc.layers.splice(i,1);doc.layers.splice(j,0,x);commit();buildLayers();paint();}
  function dup(){const l=cur();if(!l)return;const c=JSON.parse(JSON.stringify(l));c.id=lid();c.x+=24;c.y+=24;doc.layers.splice(doc.layers.indexOf(l)+1,0,c);sel=c.id;commit();buildLayers();buildProps();paint();}
  function remove(){const l=cur();if(!l)return;doc.layers=doc.layers.filter(x=>x!==l);sel=null;commit();buildLayers();buildProps();paint();}
  function resize(w,h){const s=Math.min(w/doc.w,h/doc.h),ox=(w-doc.w*s)/2,oy=(h-doc.h*s)/2;doc.layers.forEach(l=>{l.x=l.x*s+ox;l.y=l.y*s+oy;l.w*=s;l.h*=s;if(l.t==='text')l.size*=s;if(l.radius)l.radius*=s;});doc.w=w;doc.h=h;commit();header();buildProps();paint();}
  function add(l){l.id=lid();doc.layers.push(l);sel=l.id;commit();buildLayers();buildProps();paint();}
  function addText(){const t=TYP[state.typeId].display,sz=Math.round(doc.w*.07);ensureFont(t.family,t.weight).then(paint);add({t:'text',text:'Your text',x:doc.w*.1,y:doc.h*.42,w:doc.w*.8,h:sz*1.2,size:sz,lh:1.15,family:t.family,weight:t.weight,color:bestOn(doc.bg,[state.colors.primary,state.colors.text,state.colors.bg],3),align:'left'});}
  function addRect(){add({t:'rect',x:doc.w*.25,y:doc.h*.35,w:doc.w*.5,h:doc.h*.18,fill:state.colors.accent,radius:0});}
  function addImage(file){if(!file)return;const ref=Store.memRef(file);Store.loadImage(ref).then(im=>{if(!im){say2('That file could not be read as an image.');return;}imgs.set(ref,im);const w=Math.min(doc.w*.6,im.naturalWidth),h=w*im.naturalHeight/im.naturalWidth;add({t:'img',ref,x:(doc.w-w)/2,y:(doc.h-h)/2,w,h});});}
  function say2(t){const s=$f('fStatus');if(s){s.textContent=t;clearTimeout(say2.t);say2.t=setTimeout(()=>{s.textContent='';},9000);}}
  function header(){if(!doc)return;$f('fName').value=doc.name;$f('fDim').textContent=`${doc.w} × ${doc.h} px`;}
  function showNotes(){const box=$f('fNotes');box.textContent='';$f('fNotesCard').hidden=!notes.length;notes.forEach(n=>box.append(el('li',{text:n})));
    if(pdfState&&pdfState.pages>1){const row=el('div',{class:'rowbtns',style:'margin-top:8px'},'Import another page: ');for(let i=1;i<=Math.min(pdfState.pages,12);i++)row.append(el('button',{type:'button',class:'btn small','aria-pressed':String(i===pdfState.page),text:String(i),onclick:()=>importPDF(pdfState.buf,pdfState.name,i)}));box.append(row);}}
  function open(d,ns){doc=d;sel=null;hist=[];notes=ns||[];dirty=false;commit();dirty=false;header();buildLayers();buildProps();showNotes();prepare(doc).then(paint);paint();}

  /* ---------- restyle an imported layout with the active brand ---------- */
  function backdrop(l){const cx=l.x+l.w/2,cy=l.y+l.h/2,i=doc.layers.indexOf(l);for(let j=i-1;j>=0;j--){const b=doc.layers[j];if(b.hide||b.t==='text')continue;if(cx>=b.x&&cx<=b.x+b.w&&cy>=b.y&&cy<=b.y+b.h){if(b.t==='rect')return b.fill;if(b.flat)return b.tint||b.flat;return null;}}return doc.bg;}
  function brandColors(){const P=state.colors,area=doc.w*doc.h;doc.bg=P.bg;const flats=doc.layers.filter(l=>l.t==='rect'||l.flat);
    const sat=h=>{const q=hexToHsv(h);return q.s*q.v;};const cols=[...new Set(flats.map(l=>(l.t==='rect'?l.fill:l.flat).toUpperCase()))].sort((a,b)=>sat(b)-sat(a));const map={};
    cols.forEach((c,i)=>{const q=hexToHsv(c);map[c]=sat(c)>.25?(i===0?P.accent:i===1?P.primary:mix(P.accent,P.bg,.4)):q.v>.7?P.surface:P.text;});
    flats.forEach(l=>{const src=(l.t==='rect'?l.fill:l.flat).toUpperCase();const nv=l.w*l.h>area*.85?P.bg:map[src];if(l.t==='rect')l.fill=nv;else l.tint=nv;});
    const texts=doc.layers.filter(l=>l.t==='text'),mx=Math.max(1,...texts.map(l=>l.size));
    texts.forEach(l=>{const bd=backdrop(l)||P.text;l.color=l.size>=mx*.75?bestOn(bd,[P.primary,P.text,P.bg],3):bestOn(bd,[P.text,P.bg,P.primary],4.5);});
    commit();buildProps();paint();say2('Brand colors applied. Photos and multi-color artwork were left as they were.');}
  function brandFonts(){const t=TYP[state.typeId],texts=doc.layers.filter(l=>l.t==='text'),mx=Math.max(1,...texts.map(l=>l.size));
    texts.forEach(l=>{const s=l.size>=mx*.75?t.display:t.body;l.family=s.family;l.weight=FONT_FACES[s.family].includes(s.weight)?s.weight:FONT_FACES[s.family][0];});
    Promise.all(texts.map(l=>ensureFont(l.family,l.weight))).then(()=>{commit();buildProps();paint();});say2('Brand typefaces applied: '+t.display.family+' for headlines, '+t.body.family+' for the rest.');}

  /* ---------- import ---------- */
  function matchFont(real,bold,serif){const base=String(real||'').replace(/^[A-Z]{6}\+/,'');const fam=normF(base.split(/[-,]/)[0]);let hit=FAMS.find(f=>normF(f)===fam)||FAMS.find(f=>normF(f).length>=5&&fam.startsWith(normF(f)));let sub=false;
    if(!hit){sub=true;hit=(serif||/serif|times|garamond|georgia|didot|bodoni|baskerville|caslon|minion|roman/i.test(base))&&!/sans/i.test(base)?'Lora':'Source Sans 3';}
    const want=/black|heavy|extrabold|ultra/i.test(base)?900:(/semibold|demibold|bold/i.test(base)||bold)?700:/medium/i.test(base)?500:400;const ws=FONT_FACES[hit];
    return{family:hit,weight:ws.reduce((a,b)=>Math.abs(b-want)<Math.abs(a-want)?b:a),sub,orig:base.replace(/-/g,' ')};}
  async function pdfLib(){if(!pdfLib.m){pdfLib.m=await import('./vendor/pdf.min.js');pdfLib.m.GlobalWorkerOptions.workerSrc='./vendor/pdf.worker.min.js';}return pdfLib.m;}
  function scan(cv){const w=cv.width,h=cv.height,d=cv.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1,n=0,r=0,g=0,b=0,r2=0,g2=0,b2=0,amin=255;
    for(let y=0;y<h;y++){const row=y*w*4;for(let x=0;x<w;x++){const a=d[row+x*4+3];if(a>10){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(a>200){const R=d[row+x*4],G=d[row+x*4+1],B=d[row+x*4+2];n++;r+=R;g+=G;b+=B;r2+=R*R;g2+=G*G;b2+=B*B;}else if(a<amin)amin=a;}}}
    if(x1<0)return null;const sd=n?Math.sqrt(Math.max(0,r2/n-(r/n)**2)+Math.max(0,g2/n-(g/n)**2)+Math.max(0,b2/n-(b/n)**2)):99;
    return{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,flat:n>20&&sd<7?rgbToHex(r/n,g/n,b/n):null,fill:n/((x1-x0+1)*(y1-y0+1))};}
  function crop(cv,b){const c=document.createElement('canvas');c.width=b.w;c.height=b.h;c.getContext('2d').drawImage(cv,b.x,b.y,b.w,b.h,0,0,b.w,b.h);return c;}
  const toBlob=(c,type,q)=>new Promise(r=>c.toBlob(r,type||'image/png',q));
  async function importPDF(buf,name,pageNo){pageNo=pageNo||1;busy('Reading the PDF…');
    try{const pdfjs=await pdfLib();const pdf=await pdfjs.getDocument({data:buf.slice(0),fontExtraProperties:true}).promise;const page=await pdf.getPage(pageNo);const v1=page.getViewport({scale:1});
      let scale=4/3;const mx=Math.max(v1.width,v1.height)*scale,mn=Math.min(v1.width,v1.height)*scale;if(mx>2600)scale*=2600/mx;else if(mn<1000)scale*=Math.min(1080/mn,2600/mx);
      const vp=page.getViewport({scale}),W=Math.round(vp.width),H=Math.round(vp.height);const O=pdfjs.OPS;
      const PP=new Set([O.fill,O.eoFill,O.stroke,O.fillStroke,O.eoFillStroke,O.closeStroke,O.closeFillStroke,O.closeEOFillStroke]),TX=new Set([O.showText,O.showSpacedText,O.nextLineShowText,O.nextLineSetSpacingShowText]),IM=new Set([O.paintImageXObject,O.paintInlineImageXObject,O.paintImageMaskXObject,O.paintImageXObjectRepeat,O.paintImageMaskXObjectRepeat,O.paintInlineImageXObjectGroup,O.paintImageMaskXObjectGroup,O.paintSolidColorImageMask]);
      const kindOf=(i,ol)=>{const f=ol.fnArray[i];if(TX.has(f))return'text';if(IM.has(f))return'img';if(f===O.shadingFill||f===O.rawFillPath)return'shape';if(f===O.constructPath){const a=ol.argsArray[i];return a&&PP.has(a[0])?'shape':null;}return null;};
      const filt=pred=>(i,ol)=>{const k=kindOf(i,ol);if(k)return pred(i,k);const f=ol.fnArray[i];if(f===O.clip||f===O.eoClip){for(let j=i+1;j<ol.fnArray.length&&j<i+4;j++)if(ol.fnArray[j]===O.constructPath){const kk=kindOf(j,ol);return kk?pred(j,kk):true;}}return true;};
      const pass=async(f,bg)=>{const c=document.createElement('canvas');c.width=W;c.height=H;await page.render({canvas:c,canvasContext:c.getContext('2d',{willReadFrequently:true}),viewport:vp,background:bg||'rgba(0,0,0,0)',operationsFilter:f}).promise;return c;};
      /* pass 1: find every painting operation */
      const els=[],seen=new Set();await pass((i,ol)=>{if(!seen.has(i)){seen.add(i);const k=kindOf(i,ol);if(k&&k!=='text')els.push({i,k});}return true;},'#FFFFFF');els.sort((a,b)=>a.i-b.i);
      const d=blank(W,H,String(name||'Imported layout').replace(/\.[a-z0-9]+$/i,''));const ns=[];const shapes=els.filter(e=>e.k==='shape'),pics=els.filter(e=>e.k==='img');const layers=[];
      const pushEl=async(pred,label,lock)=>{const c=await pass(filt(pred));const b=scan(c);if(!b)return null;const cc=crop(c,b);const blob=await toBlob(cc);const ref=Store.memRef(blob);imgs.set(ref,cc);const l={id:lid(),t:'img',ref,x:b.x,y:b.y,w:b.w,h:b.h};if(b.flat)l.flat=b.flat;if(label)l.name=label;if(lock)l.lock=true;l._full=b.flat&&b.fill>.97&&b.w>=W*.97&&b.h>=H*.97;return l;};
      const merged=shapes.length>28;let done=0;const total=(merged?1:shapes.length)+Math.min(pics.length,30)+1;
      if(merged){busy('Separating artwork…');const set=new Set(shapes.map(s=>s.i));const l=await pushEl((i,k)=>set.has(i),'Artwork',true);if(l){l.i=shapes[0].i;layers.push(l);}ns.push(`The page has ${shapes.length} vector shapes, too many to separate one by one, so they are kept together as one locked Artwork layer.`);}
      else for(const s of shapes){busy(`Separating element ${++done} of ${total}…`);const l=await pushEl(i=>i===s.i);if(l){l.i=s.i;layers.push(l);}}
      const extra=pics.slice(30);for(const p of pics.slice(0,30)){busy(`Separating element ${++done} of ${total}…`);const l=await pushEl(i=>i===p.i);if(l){l.i=p.i;delete l.flat;layers.push(l);}}
      if(extra.length){const set=new Set(extra.map(s=>s.i));const l=await pushEl(i=>set.has(i),'More images',true);if(l){l.i=extra[0].i;layers.push(l);}ns.push('More than 30 images were found; the rest are kept together as one layer.');}
      layers.sort((a,b)=>a.i-b.i);const first=layers[0];if(first&&first._full){d.bg=first.flat;layers.shift();}layers.forEach(l=>{delete l.i;delete l._full;});
      /* text */
      busy('Reading text…');const tc=await page.getTextContent();const tcv=await pass(filt((i,k)=>k==='text'));const tctx=tcv.getContext('2d',{willReadFrequently:true});
      const items=[];for(const it of tc.items){if(!it.str||!it.str.trim())continue;const m=pdfjs.Util.transform(vp.transform,it.transform);const size=Math.hypot(m[2],m[3]);if(size<3)continue;let real='',bold=false,serif=false;
        try{const f=page.commonObjs.get(it.fontName);real=f.name||'';bold=!!(f.bold||f.black);serif=!!f.isSerifFont;}catch(e){}if(!real){const st=tc.styles[it.fontName];real=(st&&st.fontFamily)||'';serif=/serif/.test(real)&&!/sans/.test(real);}
        items.push({str:it.str,x:m[4],base:m[5],size,w:it.width*scale,font:real,bold,serif,rot:Math.abs(Math.atan2(m[1],m[0]))>.03});}
      if(items.some(i=>i.rot))ns.push('Some text was rotated in the original. It was imported upright.');
      const lines=[];for(const it of items){const L=lines[lines.length-1];if(L&&L.font===it.font&&Math.abs(L.size-it.size)<L.size*.03&&Math.abs(L.base-it.base)<L.size*.25&&it.x>=L.x+L.w-L.size*.4&&it.x-(L.x+L.w)<L.size*2){const gap=it.x-(L.x+L.w);L.str+=(gap>L.size*.18&&!/\s$/.test(L.str)&&!/^\s/.test(it.str)?' ':'')+it.str;L.w=it.x+it.w-L.x;}else lines.push(Object.assign({},it));}
      lines.sort((a,b)=>a.base-b.base||a.x-b.x);const blocks=[];
      for(const L of lines){const B=blocks.find(B=>{const p=B.lines[B.lines.length-1],dy=L.base-p.base;return B.font===L.font&&Math.abs(B.size-L.size)<B.size*.03&&dy>B.size*.8&&dy<B.size*1.9&&(Math.abs(L.x-p.x)<B.size*.6||Math.abs(L.x+L.w/2-(p.x+p.w/2))<B.size*.6||Math.abs(L.x+L.w-(p.x+p.w))<B.size*.6);});if(B)B.lines.push(L);else blocks.push({font:L.font,size:L.size,bold:L.bold,serif:L.serif,lines:[L]});}
      const subs=new Set();
      for(const B of blocks){const ls=B.lines,n=ls.length,size=B.size;const x0=Math.min(...ls.map(l=>l.x)),x1=Math.max(...ls.map(l=>l.x+l.w));const sp=f=>{const v=ls.map(f);return Math.max(...v)-Math.min(...v);};
        let align='left';if(n>1){const sl=sp(l=>l.x),sc=sp(l=>l.x+l.w/2),sr=sp(l=>l.x+l.w);align=sc<sl&&sc<=sr?'center':sr<sl&&sr<sc?'right':'left';}else if(Math.abs((x0+x1)/2-W/2)<W*.015&&x0>W*.08)align='center';
        const lh=n>1?clamp((ls[n-1].base-ls[0].base)/(n-1)/size,.9,2.2):1.2;const fm=matchFont(B.font,B.bold,B.serif);if(fm.sub&&fm.orig)subs.add(fm.orig+' → '+fm.family);
        const fl=ls[0],bx=Math.max(0,Math.floor(fl.x)),by=Math.max(0,Math.floor(fl.base-size)),bw=Math.max(1,Math.min(W-bx,Math.ceil(fl.w))),bh=Math.max(1,Math.min(H-by,Math.ceil(size*1.25)));let color='#111111';
        try{const px=tctx.getImageData(bx,by,bw,bh).data;let r=0,g=0,b=0,k=0;for(let i=0;i<px.length;i+=4)if(px[i+3]>160){r+=px[i];g+=px[i+1];b+=px[i+2];k++;}if(k>3)color=rgbToHex(r/k,g/k,b/k);}catch(e){}
        const pad=size*.06;layers.push({id:lid(),t:'text',text:ls.map(l=>l.str.trim()).join('\n'),x:x0-pad,y:fl.base-size*.8-size*(lh-1)/2,w:x1-x0+pad*2,h:n*size*lh,size:Math.round(size*10)/10,lh:Math.round(lh*100)/100,family:fm.family,weight:fm.weight,color,align});}
      d.layers=layers;await Promise.all(layers.filter(l=>l.t==='text').map(l=>ensureFont(l.family,l.weight)));
      const mc=document.createElement('canvas').getContext('2d');layers.forEach(l=>{if(l.t!=='text')return;mc.font=fontOf(l);const need=Math.max(...l.text.split('\n').map(s=>mc.measureText(s).width))+l.size*.12;if(need>l.w){const grow=need-l.w;if(l.align==='center')l.x-=grow/2;else if(l.align==='right')l.x-=grow;l.w=need;}});
      const nt=layers.filter(l=>l.t==='text').length,ni=layers.length-nt;ns.unshift(`Imported page ${pageNo} of ${pdf.numPages}: ${nt} text ${nt===1?'layer':'layers'} and ${ni} image or shape ${ni===1?'layer':'layers'}.`);
      if(!nt)ns.push('No live text was found. If the PDF was flattened or exported as an image, its text is part of the picture and cannot be edited.');
      if(subs.size)ns.push('Typefaces not in this app were replaced with the closest available: '+[...subs].slice(0,8).join('; ')+'. Line breaks may shift slightly.');
      ns.push('Clipped and masked images keep their shape. Shadows, blends and gradients inside a shape are kept as pictures.');
      pdfState={buf,name,page:pageNo,pages:pdf.numPages};open(d,ns);busy('');say2('Import finished. Select any layer to edit it.');}
    catch(e){busy('');console.error(e);say2('That PDF could not be read. It may be password-protected or damaged.');}}
  async function importImage(file){busy('Reading the image…');const ref=Store.memRef(file);const im=await Store.loadImage(ref);busy('');if(!im){say2('That file could not be read as an image.');return;}
    let w=im.naturalWidth,h=im.naturalHeight;const s=Math.min(1,2600/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);imgs.set(ref,im);const d=blank(w,h,String(file.name||'Imported image').replace(/\.[a-z0-9]+$/i,''));d.layers.push({id:lid(),t:'img',ref,x:0,y:0,w,h,lock:true,name:'Imported image'});pdfState=null;
    open(d,['An image has no separate layers, so it was placed as one locked picture. Add text and shapes on top, or import the PDF version to get editable layers.']);}
  function importFile(file){if(!file)return;if(/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name)){file.arrayBuffer().then(b=>importPDF(b,file.name,1));}else if(/^image\//.test(file.type))importImage(file);else say2('Choose a PDF, PNG or JPG file.');}
  function busy(t){const b=$f('fBusy');if(b){b.hidden=!t;b.textContent=t;}}

  /* ---------- export and save ---------- */
  async function exportPNG(d){d=d||doc;if(!d)return;await prepare(d);const cv=document.createElement('canvas');cv.width=d.w;cv.height=d.h;render(cv.getContext('2d'),d);const blob=await toBlob(cv);if(blob)await saveFile(`${slug(d.name)}-${d.w}x${d.h}.png`,blob,true);}
  async function persistable(){const d=JSON.parse(JSON.stringify(doc));let lost=0;for(const l of d.layers){if(l.t==='img'){const live=doc.layers.find(x=>x.id===l.id);const nr=await Store.persistRef(l.ref);if(!nr||nr.startsWith('mem:'))lost++;else{if(imgs.has(l.ref))imgs.set(nr,imgs.get(l.ref));l.ref=nr;if(live)live.ref=nr;}}}return{doc:d,lost};}
  function boot(){const cv=$f('fcv');cv.addEventListener('pointerdown',down);cv.addEventListener('pointermove',move);cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
    cv.addEventListener('dblclick',()=>{const t=$f('fText');if(t){t.focus();t.select();}});
    $f('fImport').addEventListener('change',e=>{importFile(e.target.files[0]);e.target.value='';});
    const st=$f('fStage');st.addEventListener('dragover',e=>e.preventDefault());st.addEventListener('drop',e=>{e.preventDefault();importFile(e.dataTransfer.files[0]);});
    const bs=$f('fBlank');FORMATS.forEach(f=>bs.append(el('option',{value:f.id,text:`${PLATFORMS.find(p=>p.id===f.p).name}: ${f.name}`})));bs.addEventListener('change',()=>{if(!bs.value)return;const f=FMT[bs.value];const d=blank(f.w,f.h,'Untitled layout');d.bg=state.colors.bg;pdfState=null;open(d,[]);bs.value='';});
    $f('fAddText').addEventListener('click',()=>doc&&addText());$f('fAddRect').addEventListener('click',()=>doc&&addRect());$f('fAddImg').addEventListener('change',e=>{if(doc)addImage(e.target.files[0]);e.target.value='';});
    $f('fUndo').addEventListener('click',undo);$f('fBrandC').addEventListener('click',()=>doc&&brandColors());$f('fBrandF').addEventListener('click',()=>doc&&brandFonts());$f('fExport').addEventListener('click',()=>exportPNG());
    $f('fName').addEventListener('input',e=>{if(doc){doc.name=e.target.value;dirty=true;}});
    document.addEventListener('keydown',e=>{if($f('viewFree').hidden||!doc)return;const tg=e.target.tagName;if(tg==='INPUT'||tg==='TEXTAREA'||tg==='SELECT')return;const l=cur();
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();return;}if(!l)return;const st=e.shiftKey?10:1;
      if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();dup();}
      else if(e.key==='ArrowLeft'){l.x-=st;touch();e.preventDefault();}else if(e.key==='ArrowRight'){l.x+=st;touch();e.preventDefault();}else if(e.key==='ArrowUp'){l.y-=st;touch();e.preventDefault();}else if(e.key==='ArrowDown'){l.y+=st;touch();e.preventDefault();}else if(e.key==='Escape')select(null);});
    let rz=0;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(paint,80);});buildLayers();buildProps();}
  return{boot,open,blank,paint,render,renderDocTo,prepare,exportPNG,persistable,importFile,get doc(){return doc;},get dirty(){return dirty;},clean(){dirty=false;},say:say2,refresh(){buildProps();paint();}};
})();
