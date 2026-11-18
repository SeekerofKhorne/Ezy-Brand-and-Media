/* ============================================================
   DRAW: color scheme, text fitting, graphics, layouts (Canvas 2D)
   One renderer serves the preview, the thumbnails and the PNG export.
   Passing opts.rec (an array) to renderDraft makes it a recorder: text, buttons,
   bars and the logo are pushed to the array as layer descriptions instead of
   being painted, so a template post can be reopened as editable layers.
   ============================================================ */
let REC=null;
function recFlat(ctx){if(!REC)return false;const m=ctx.getTransform();return Math.abs(m.b)<1e-6&&Math.abs(m.c)<1e-6;}
function rng(seed){let a=(seed>>>0)||1;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function bestOn(bg,cands,min){for(const c of cands)if(contrast(c,bg)>=min)return c;let b=cands[0],m=0;
  for(const c of cands.concat(['#FFFFFF','#111111'])){const k=contrast(c,bg);if(k>m){m=k;b=c;}}return b;}
function makeScheme(p,arr){
  const bg=arr==='brand'?p.primary:arr==='contrast'?p.text:p.bg;
  const fg=bestOn(bg,[p.text,p.bg],4.5);
  const head=arr==='brand'?bestOn(bg,[p.bg,p.text,p.accent],3):arr==='contrast'?bestOn(bg,[p.bg,p.accent,p.primary],3):bestOn(bg,[p.primary,p.text,p.bg],3);
  const pool=arr==='brand'?[p.accent,p.bg,p.surface,p.text]:arr==='contrast'?[p.accent,p.primary,p.bg,p.surface]:[p.accent,p.primary,p.text,p.surface];
  const accent=pool.find(c=>contrast(c,bg)>=1.45)||fg;
  const onAccent=bestOn(accent,[p.text,p.bg],4.5);
  let surface=arr==='base'?p.surface:mix(bg,fg,.12);if(contrast(surface,bg)<1.05)surface=mix(bg,fg,.1);
  const eyebrow=contrast(accent,bg)>=3?accent:head;
  return{bg,fg,head,accent,onAccent,surface,onSurface:bestOn(surface,[p.text,p.bg],4.5),muted:mix(fg,bg,.3),eyebrow,p};}

/* ---------- text ---------- */
function setFont(ctx,spec,px,track){ctx.font=`${spec.weight} ${px.toFixed(1)}px "${spec.family}", ${spec.fb}`;if('letterSpacing'in ctx)ctx.letterSpacing=track?(px*track).toFixed(2)+'px':'0px';}
function wrapLines(ctx,text,maxW){const out=[];for(const para of String(text).split('\n')){const words=para.split(/\s+/).filter(Boolean);let line='';
  for(const w of words){const t=line?line+' '+w:w;if(!line||ctx.measureText(t).width<=maxW)line=t;else{out.push(line);line=w;}}if(line)out.push(line);}return out;}
function fitText(ctx,text,spec,maxW,maxH,maxPx,minPx,lh,track){text=String(text||'').trim();if(!text)return{px:0,lines:[],h:0,w:0,lh,track,spec};
  if(spec.upper)text=text.toUpperCase();const sc=spec.scale||1;let px=maxPx*sc;const mn=Math.min(minPx*sc,px);
  const measure=()=>{setFont(ctx,spec,px,track);const lines=wrapLines(ctx,text,maxW);let wide=0;for(const l of lines)wide=Math.max(wide,ctx.measureText(l).width);return{lines,wide};};
  for(;px>mn;px*=.95){const m=measure();if(m.lines.length*px*lh<=maxH&&m.wide<=maxW){let lines=m.lines,wide=m.wide;const n=lines.length;if(n>1&&n<=4){let lo=maxW*.45,hi=maxW;for(let i=0;i<7;i++){const mid=(lo+hi)/2,t=wrapLines(ctx,text,mid);let w2=0;for(const l of t)w2=Math.max(w2,ctx.measureText(l).width);if(t.length===n&&w2<=mid){hi=mid;lines=t;wide=w2;}else lo=mid;}}return{px,lines,h:n*px*lh,w:wide,lh,track,spec};}}
  px=mn;const m=measure();let lines=m.lines;const maxLines=Math.max(1,Math.floor(maxH/(px*lh)));
  if(lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=lines[maxLines-1].replace(/\s*\S{0,2}$/,'')+'…';}
  return{px,lines,h:lines.length*px*lh,w:Math.min(m.wide,maxW),lh,track,spec};}
function drawFit(ctx,f,x,y,color,align){if(!f.lines.length)return 0;
  if(recFlat(ctx)){REC.push({k:'text',text:f.lines.join('\n'),ax:x,y,w:f.w,size:f.px,lh:f.lh,track:f.track||0,family:f.spec.family,weight:f.spec.weight,color,align:align||'left'});return f.h;}
  setFont(ctx,f.spec,f.px,f.track);ctx.fillStyle=color;ctx.textAlign=align||'left';ctx.textBaseline='alphabetic';
  const off=f.px*(f.lh-1)/2+f.px*.8;f.lines.forEach((l,i)=>ctx.fillText(l,x,y+off+i*f.px*f.lh));if('letterSpacing'in ctx)ctx.letterSpacing='0px';return f.h;}
function rr(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
/* fx, fy: the focal point of the photo, 0 to 1 (0.5 keeps the middle in view) */
function drawImageCover(ctx,img,x,y,w,h,fx,fy){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;const s=Math.max(w/iw,h/ih);const dw=iw*s,dh=ih*s;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x+(w-dw)*(fx==null?.5:fx),y+(h-dh)*(fy==null?.5:fy),dw,dh);ctx.restore();}
function containRect(img,x,y,w,h,align){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;const s=Math.min(w/iw,h/ih);const dw=iw*s,dh=ih*s;return{x:align==='left'?x:align==='right'?x+w-dw:x+(w-dw)/2,y:y+(h-dh)/2,w:dw,h:dh};}
function logoAt(ctx,S,x,y,w,h,align){const R=containRect(S.logo,x,y,w,h,align);if(S.logoRef&&recFlat(ctx))REC.push({k:'img',ref:S.logoRef,x:R.x,y:R.y,w:R.w,h:R.h,name:'Logo'});else ctx.drawImage(S.logo,R.x,R.y,R.w,R.h);return R.w;}

/* ---------- graphics ----------
   G[family](ctx,w,h,s,k,r,v): v names the style ('' is the family's first style, whose drawing is
   unchanged from before styles existed, so saved posts look the same). s is 1% of the area's
   geometric mean size, k holds the palette tints, r is the seeded random source. */
const TAU=6.283;
function blobPath(ctx,cx,cy,rad,r,n){n=n||7;const pts=[];for(let i=0;i<n;i++){const a=i/n*TAU,q=rad*(.78+r()*.44);pts.push([cx+Math.cos(a)*q,cy+Math.sin(a)*q]);}
  ctx.beginPath();for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;if(i===0){const z=pts[n-1];ctx.moveTo((z[0]+p[0])/2,(z[1]+p[1])/2);}ctx.quadraticCurveTo(p[0],p[1],mx,my);}ctx.closePath();}
function leafPath(ctx,x,y,len,ang){ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*.5,-len*.34,len,0);ctx.quadraticCurveTo(len*.5,len*.34,0,0);}
function leafAt(ctx,k,x,y,len,ang,col,stroke){leafPath(ctx,x,y,len,ang);if(stroke){ctx.strokeStyle=col;ctx.lineWidth=stroke;ctx.stroke();ctx.beginPath();ctx.moveTo(len*.08,0);ctx.lineTo(len*.86,0);ctx.stroke();}
  else{ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.moveTo(len*.06,0);ctx.lineTo(len*.9,0);ctx.strokeStyle=k.bg;ctx.lineWidth=Math.max(1,len*.018);ctx.stroke();}ctx.restore();}
function sparkle(ctx,x,y,q,col,thin){const t=thin||0;ctx.beginPath();ctx.moveTo(x,y-q);ctx.quadraticCurveTo(x+q*t,y-q*t,x+q,y);ctx.quadraticCurveTo(x+q*t,y+q*t,x,y+q);ctx.quadraticCurveTo(x-q*t,y+q*t,x-q,y);ctx.quadraticCurveTo(x-q*t,y-q*t,x,y-q);ctx.fillStyle=col;ctx.fill();}
function heartPath(ctx,q){ctx.beginPath();ctx.moveTo(0,q*.9);ctx.bezierCurveTo(-q*1.5,-q*.2,-q*.6,-q*1.1,0,-q*.35);ctx.bezierCurveTo(q*.6,-q*1.1,q*1.5,-q*.2,0,q*.9);}
function plusPath(ctx,x,y,a,t){ctx.beginPath();ctx.moveTo(x-t/2,y-a);ctx.lineTo(x+t/2,y-a);ctx.lineTo(x+t/2,y-t/2);ctx.lineTo(x+a,y-t/2);ctx.lineTo(x+a,y+t/2);ctx.lineTo(x+t/2,y+t/2);ctx.lineTo(x+t/2,y+a);ctx.lineTo(x-t/2,y+a);ctx.lineTo(x-t/2,y+t/2);ctx.lineTo(x-a,y+t/2);ctx.lineTo(x-a,y-t/2);ctx.lineTo(x-t/2,y-t/2);ctx.closePath();}
function polyline(ctx,pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));}
/* A dry-brush stroke: many thin bristles following f(t)=[x,y,nx,ny], thinning and breaking up toward the ends. */
function bristles(ctx,f,width,n,r,col,lw,alpha){ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';const a0=ctx.globalAlpha;
  for(let j=0;j<n;j++){const o=(j/(n-1)-.5)*width,jit=(r()-.5)*lw*2,start=r()*.12,end=1-r()*.14;ctx.globalAlpha=a0*alpha*(.55+r()*.45);ctx.beginPath();let down=false;
    for(let t=start;t<=end;t+=.012){const taper=Math.sin(Math.PI*Math.min(1,Math.max(0,t)));if(r()<.025*(1-taper)+.006){down=false;continue;}const p=f(t),q=o*(.35+.65*taper)+jit;const x=p[0]+p[2]*q,y=p[1]+p[3]*q;if(down)ctx.lineTo(x,y);else{ctx.moveTo(x,y);down=true;}}ctx.stroke();}
  ctx.globalAlpha=a0;}
function curveF(x0,y0,cx,cy,x1,y1){return t=>{const u=1-t,x=u*u*x0+2*u*t*cx+t*t*x1,y=u*u*y0+2*u*t*cy+t*t*y1,dx=2*u*(cx-x0)+2*t*(x1-cx),dy=2*u*(cy-y0)+2*t*(y1-cy),L=Math.hypot(dx,dy)||1;return[x,y,-dy/L,dx/L];};}

const G={
 waves(ctx,w,h,s,k,r,v){
   if(v==='line'){ctx.lineWidth=Math.max(1,s*.2);for(let i=0;i<14;i++){const base=h*(.46+i*.04),amp=s*(1.6+i*.12),wl=w/(1.3+r()*.35),ph=r()*TAU;ctx.strokeStyle=i%3===2?k.e1l:k.t1;ctx.beginPath();for(let x=0;x<=w;x+=w/90){const y=base+Math.sin(x/wl*TAU+ph)*amp;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}return;}
   if(v==='surf'){for(let i=0;i<3;i++){const base=h*(.6+i*.11),amp=Math.min(s*10,h*.14)*(1-i*.22),wl=w/(1.6+i*.6),ph=r()*TAU,tilt=h*.1;ctx.beginPath();ctx.moveTo(0,h);
       for(let x=0;x<=w;x+=w/120){const c=(Math.sin(x/wl*TAU+ph)+1)/2;ctx.lineTo(x,base+(x/w-.5)*tilt-amp*Math.pow(c,2.6));}ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=[k.e1l,k.e2s,k.e1m][i];ctx.fill();}
     ctx.fillStyle=k.bg;const base=h*.82,amp=Math.min(s*10,h*.14)*.56,wl=w/2.8;for(let i=0;i<46;i++){const x=r()*w;ctx.globalAlpha=.4+.5*r();ctx.beginPath();ctx.arc(x,base+(x/w-.5)*h*.1-amp*r()*.9,s*(.2+r()*.5),0,TAU);ctx.fill();}ctx.globalAlpha=1;return;}
   if(v==='deep'){for(let i=0;i<2;i++){const base=h*(.46+i*.2),amp=h*(.06-i*.015),wl=w/(.75+i*.5),ph=r()*TAU;ctx.beginPath();ctx.moveTo(0,h);for(let x=0;x<=w;x+=w/90)ctx.lineTo(x,base+Math.sin(x/wl*TAU+ph)*amp);ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=[k.e1l,k.e1m][i];ctx.fill();}return;}
   for(let i=0;i<3;i++){const base=h*(.78+i*.075),amp=Math.min(s*(4.6-i*1.1),h*.07),wl=w/(1.1+i*.55),ph=r()*6.28;ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,base);
   for(let x=0;x<=w;x+=w/72){ctx.lineTo(x,base+Math.sin(x/wl*6.283+ph)*amp+Math.sin(x/wl*13.5+ph*2)*amp*.22);}ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=[k.e1l,k.e2s,k.e1m][i];ctx.fill();}},
 ripples(ctx,w,h,s,k,r,v){const mx=Math.hypot(w,h);
   if(v==='drop'){const cx=w/2,cy=h/2,R=mx*.55,n=Math.floor(R/(s*6));ctx.lineWidth=Math.max(1,s*.28);for(let i=0;i<n;i++){ctx.strokeStyle=mix(k.t1,k.bg,i/n);ctx.beginPath();ctx.arc(cx,cy,s*3+i*s*6*(1+i*.04),0,TAU);ctx.stroke();}return;}
   if(v==='overlap'){ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.24);for(let j=0;j<3;j++){const cx=w*(.15+r()*.7),cy=h*(.15+r()*.7);for(let rad=s*3;rad<mx*.5;rad+=s*4.4){ctx.beginPath();ctx.arc(cx,cy,rad,0,TAU);ctx.stroke();}}return;}
   if(v==='bold'){const cx=w*.08,cy=h*.92,bw=s*6;let i=0;for(let rad=mx*.8;rad>0;rad-=bw,i++){ctx.beginPath();ctx.arc(cx,cy,rad,0,TAU);ctx.fillStyle=i%2?k.bg:(i%4===0?k.e1l:k.t2);ctx.fill();}return;}
   const cx=w*(.78+r()*.12),cy=h*(.16+r()*.1);ctx.strokeStyle=k.t1;ctx.lineWidth=s*.42;for(let rad=s*5;rad<mx;rad+=s*5.2){ctx.beginPath();ctx.arc(cx,cy,rad,0,6.283);ctx.stroke();}},
 blobs(ctx,w,h,s,k,r,v){const m=Math.min(w,h);
   if(v==='pebbles'){const cols=[k.t1,k.t2,k.e1l];for(let i=0;i<22;i++){blobPath(ctx,r()*w,r()*h,m*(.03+r()*.06),r,6);ctx.fillStyle=cols[i%3];ctx.fill();}return;}
   if(v==='outline'){ctx.lineWidth=Math.max(1,s*.3);[[w*.9,h*.1,m*.32],[w*.08,h*.9,m*.28]].forEach(([cx,cy,rad])=>{for(let j=0;j<3;j++){blobPath(ctx,cx,cy,rad*(1-j*.16),rng(Math.floor(cx+cy)),7);ctx.strokeStyle=j?k.t1:k.e1s;ctx.stroke();}});return;}
   if(v==='giant'){blobPath(ctx,w*.78,h*.3,Math.max(w,h)*.5,r,8);ctx.fillStyle=k.e1l;ctx.fill();blobPath(ctx,w*.06,h*.95,m*.14,r,6);ctx.fillStyle=k.t1;ctx.fill();return;}
   const spots=[[w*.92,h*.06,m*.34,k.e1s],[w*.04,h*.95,m*.3,k.e2s],[w*.78,h*.86,m*.16,k.t1]];for(const[cx,cy,rad,col]of spots){blobPath(ctx,cx,cy,rad,r,7);ctx.fillStyle=col;ctx.fill();}},
 circles(ctx,w,h,s,k,r,v){const m=Math.min(w,h);
   if(v==='bubbles'){ctx.lineWidth=Math.max(1,s*.28);for(let i=0;i<28;i++){const x=r()*w,y=h*(.1+r()*.95),rad=s*(.8+r()*4.5)*(.5+y/h);ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.strokeStyle=i%3?k.e1s:k.t1;ctx.stroke();ctx.beginPath();ctx.arc(x,y,rad*.62,3.6,4.4);ctx.stroke();}return;}
   if(v==='orbit'){const cx=w*.8,cy=h*.2;ctx.lineWidth=Math.max(1,s*.16);for(let i=0;i<5;i++){const rad=m*(.12+i*.11);ctx.strokeStyle=k.t1;ctx.beginPath();ctx.arc(cx,cy,rad,0,TAU);ctx.stroke();const a=r()*TAU;ctx.beginPath();ctx.arc(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad,s*(.6+r()*.5),0,TAU);ctx.fillStyle=k.e1s;ctx.fill();}
     ctx.beginPath();ctx.arc(cx,cy,m*.055,0,TAU);ctx.fillStyle=k.e1l;ctx.fill();return;}
   if(v==='polka'){const st=s*13,rad=s*3;ctx.fillStyle=k.t1;let row=0;for(let y=st/2;y<h+st;y+=st*.87,row++)for(let x=row%2?0:st/2;x<w+st;x+=st){ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fill();}return;}
   for(let i=0;i<9;i++){const x=r()*w,y=r()*h,rad=s*(3+r()*13);ctx.beginPath();ctx.arc(x,y,rad,0,6.283);if(i%3===2){ctx.strokeStyle=k.e1s;ctx.lineWidth=s*.5;ctx.stroke();}else{ctx.fillStyle=i%2?k.t1:k.t2;ctx.fill();}}},
 arches(ctx,w,h,s,k,r,v){const m=Math.min(w,h);
   if(v==='rainbow'){const n=5,R=Math.min(w*.46,h*.55),bw=R/(n+1.2),cx=w*.5,cols=[k.e1s,k.t2,k.e2s,k.e1l,k.t1];for(let i=0;i<=n;i++){ctx.beginPath();ctx.arc(cx,h,R-i*bw,Math.PI,0);ctx.closePath();ctx.fillStyle=i===n?k.bg:cols[i];ctx.fill();}return;}
   if(v==='window'){const n=Math.max(3,Math.round(w/(m*.24))),aw=w/n,spring=h*.62;ctx.lineJoin='round';for(let i=0;i<n;i++){for(let j=0;j<2;j++){const ins=j*s*1.3,x0=i*aw+aw*.14+ins,ww=aw*.72-ins*2,sp=spring+ins*.3;
       ctx.beginPath();ctx.moveTo(x0,h);ctx.lineTo(x0,sp);ctx.arc(x0+ww,sp,ww,Math.PI,Math.PI*4/3);ctx.arc(x0,sp,ww,Math.PI*5/3,TAU);ctx.lineTo(x0+ww,h);ctx.strokeStyle=j?k.t1:k.e1s;ctx.lineWidth=Math.max(1,s*(j?.15:.32));ctx.stroke();}
     const x0=i*aw+aw*.14,ww=aw*.72;ctx.beginPath();ctx.arc(x0+ww/2,spring-ww*.42,ww*.15,0,TAU);ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.2);ctx.stroke();}return;}
   if(v==='portal'){const ww=Math.min(w*.62,h*.5),x0=(w-ww)/2,top=h*.12,rad=ww/2;ctx.beginPath();ctx.moveTo(x0,h);ctx.lineTo(x0,top+rad);ctx.arc(x0+rad,top+rad,rad,Math.PI,0);ctx.lineTo(x0+ww,h);ctx.closePath();ctx.fillStyle=k.t2;ctx.fill();
     const g=s*1.6,ri=rad-g;ctx.beginPath();ctx.moveTo(x0+g,h);ctx.lineTo(x0+g,top+rad);ctx.arc(x0+rad,top+rad,ri,Math.PI,0);ctx.lineTo(x0+ww-g,h);ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.25);ctx.stroke();return;}
   const n=Math.max(3,Math.round(w/(Math.min(w,h)*.26))),aw=w/n;for(let i=0;i<n;i++){const ah=Math.min(h*(.2+r()*.2),h*.42),x=i*aw+aw*.08,ww=aw*.84,rad=ww/2,top=h-ah;ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x,top+rad);ctx.arc(x+rad,top+rad,rad,Math.PI,0);ctx.lineTo(x+ww,h);ctx.closePath();ctx.fillStyle=[k.e1s,k.t2,k.e2s][i%3];ctx.fill();}},
 leaves(ctx,w,h,s,k,r,v){const m=Math.min(w,h);
   if(v==='scatter'){const cols=[k.e1s,k.e2s,k.t1,k.e1l];for(let i=0;i<16;i++)leafAt(ctx,k,r()*w,r()*h,m*(.06+r()*.08),r()*TAU,cols[i%4]);return;}
   if(v==='line'){const lw=Math.max(1,s*.22);ctx.lineCap='round';[[w,0,Math.PI*.75],[0,h,-Math.PI*.25]].forEach(([x0,y0,a])=>{for(let st=0;st<3;st++){const len=m*(.42+r()*.16),aa=a+(st-1)*.32,x1=x0+Math.cos(aa)*len,y1=y0+Math.sin(aa)*len;
       ctx.beginPath();ctx.moveTo(x0,y0);ctx.quadraticCurveTo((x0+x1)/2+Math.sin(aa)*len*.12,(y0+y1)/2-Math.cos(aa)*len*.12,x1,y1);ctx.strokeStyle=k.e1s;ctx.lineWidth=lw;ctx.stroke();
       for(let i=1;i<=5;i++){const t=i/6,px=x0+(x1-x0)*t,py=y0+(y1-y0)*t;leafAt(ctx,k,px,py,m*.07*(1.1-t*.5),aa+(i%2?.9:-.9),k.e1s,lw);}}});return;}
   if(v==='jungle'){const cols=[k.e1m,k.e1l,k.e2s,k.t1];for(let i=0;i<20;i++){const side=i%4,t=r();const x=side===0?-m*.02:side===1?w+m*.02:t*w,y=side===2?-m*.02:side===3?h+m*.02:t*h;const ang=Math.atan2(h/2-y,w/2-x)+(r()-.5)*1.1;leafAt(ctx,k,x,y,m*(.24+r()*.22),ang,cols[i%4]);}return;}
   for(let i=0;i<6;i++)leafAt(ctx,k,w+m*.02,-m*.02,m*(.2+r()*.2),Math.PI*.5+i*.2+r()*.12,[k.e1s,k.e2s,k.t1][i%3]);
   for(let i=0;i<5;i++)leafAt(ctx,k,-m*.02,h+m*.02,m*(.16+r()*.18),-Math.PI*.5+i*.24+r()*.12,[k.e2s,k.e1s,k.t2][i%3]);},
 glow(ctx,w,h,s,k,r,v){const m=Math.max(w,h),acc=k.c.accent;
   if(v==='aura'){const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,m*.55);g.addColorStop(0,rgba(acc,.12+.45*k.k));g.addColorStop(.6,rgba(acc,.04+.12*k.k));g.addColorStop(1,rgba(acc,0));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);return;}
   if(v==='neon'){ctx.lineCap='round';ctx.shadowBlur=s*3;for(let i=0;i<4;i++){const col=i%2?k.c.head:acc,y0=h*(.15+r()*.8),y1=y0-h*(.25+r()*.4);ctx.shadowColor=rgba(col,.9);ctx.strokeStyle=rgba(col,.25+.6*k.k);ctx.lineWidth=s*(.35+r()*.4);
       ctx.beginPath();ctx.moveTo(w*(r()*.3),y0);ctx.lineTo(w*(.7+r()*.3),y1);ctx.stroke();}ctx.shadowBlur=0;return;}
   if(v==='eclipse'){const cx=w*.76,cy=h*.28,R=Math.min(w,h)*.2;const g=ctx.createRadialGradient(cx,cy,R*.9,cx,cy,R*2.1);g.addColorStop(0,rgba(acc,.25+.55*k.k));g.addColorStop(1,rgba(acc,0));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
     ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fillStyle=mix(k.bg,k.c.head,.15+.3*k.k);ctx.fill();return;}
   const spots=[[w*.85,h*.1,m*.6,acc],[w*.1,h*.95,m*.55,k.c.head],[w*.6,h*.7,m*.35,acc]];
   for(const[x,y,rad,col]of spots){const g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,rgba(col,.1+.4*k.k));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}},
 sunburst(ctx,w,h,s,k,r,v){const R=Math.hypot(w,h);
   if(v==='center'){const cx=w/2,cy=h*.45,n=28;ctx.fillStyle=k.t1;for(let i=0;i<n;i+=2){ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,i/n*TAU,(i+1)/n*TAU);ctx.closePath();ctx.fill();}ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*.1,0,TAU);ctx.fillStyle=k.e1l;ctx.fill();return;}
   if(v==='rising'){const cx=w/2,cy=h,sr=Math.min(w,h)*.3,n=18;ctx.fillStyle=k.t1;for(let i=0;i<n;i+=2){ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,Math.PI+i/n*Math.PI,Math.PI+(i+1)/n*Math.PI);ctx.closePath();ctx.fill();}
     ctx.beginPath();ctx.arc(cx,cy,sr,Math.PI,0);ctx.fillStyle=k.e1l;ctx.fill();ctx.fillStyle=k.bg;for(let i=1;i<=4;i++){const y=cy-sr*i*.18,t=sr*.035*i;ctx.fillRect(cx-sr,y-t/2,sr*2,t);}return;}
   if(v==='fine'){const cx=w*1.04,cy=-h*.06;ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.12);for(let i=0;i<64;i++){const a=Math.PI*.5+i/64*Math.PI*.5;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.stroke();}return;}
   const cx=w*(r()<.5?1:0),cy=0,n=22;ctx.fillStyle=k.t1;for(let i=0;i<n;i+=2){const a0=i/n*Math.PI,a1=(i+1)/n*Math.PI;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a0,a1);ctx.closePath();ctx.fill();}
   ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*.16,0,6.283);ctx.fillStyle=k.e1s;ctx.fill();},
 stripes(ctx,w,h,s,k,r,v){const R=Math.hypot(w,h);
   if(v==='pin'){ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.12);ctx.beginPath();for(let x=s*1.6;x<w;x+=s*3.2){ctx.moveTo(x,0);ctx.lineTo(x,h);}ctx.stroke();return;}
   if(v==='speed'){for(let i=0;i<16;i++){const y=r()*h,len=w*(.2+r()*.5),x1=w*(.55+r()*.5),x0=x1-len,t=s*(.3+r()*1.3);ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y-t/2);ctx.arc(x1,y,t/2,-Math.PI/2,Math.PI/2);ctx.closePath();ctx.fillStyle=i%3?k.t1:k.e1l;ctx.fill();}return;}
   if(v==='bold'){ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-.62);const sw=s*11;let i=0;for(let x=-R;x<R;x+=sw*2,i++){ctx.fillStyle=i%2?k.t2:k.e1l;ctx.fillRect(x,-R,sw,R*2);}ctx.restore();return;}
   ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-.62);const sw=s*4.2;ctx.fillStyle=k.t1;for(let x=-R;x<R;x+=sw*2.4)ctx.fillRect(x,-R,sw,R*2);ctx.restore();},
 chevrons(ctx,w,h,s,k,r,v){
   if(v==='arrows'){const st=Math.min(w,h)*.12,cy=h*.5,cols=[k.t1,k.e1l,k.e1m,k.e1s];ctx.lineWidth=s*2.2;ctx.lineJoin='miter';ctx.lineCap='butt';for(let i=0;i<4;i++){const x=w*.52+i*st*.9;ctx.strokeStyle=cols[i];ctx.beginPath();ctx.moveTo(x,cy-st);ctx.lineTo(x+st*.7,cy);ctx.lineTo(x,cy+st);ctx.stroke();}return;}
   if(v==='zigzag'){const p=s*6,a=s*1.8;ctx.strokeStyle=k.t1;ctx.lineWidth=s*.4;ctx.lineJoin='miter';for(let y=s*4;y<h+a;y+=s*8){ctx.beginPath();for(let x=-p,i=0;x<w+p;x+=p/2,i++)ctx.lineTo(x,y+(i%2?-a:a));ctx.stroke();}return;}
   if(v==='fine'){const cw=s*4,rs=s*2.2;ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.15);ctx.beginPath();for(let c=0;c*cw<w+cw;c++)for(let y=-cw;y<h+cw;y+=rs){const x=c*cw;if(c%2){ctx.moveTo(x,y);ctx.lineTo(x+cw,y+cw*.5);}else{ctx.moveTo(x,y+cw*.5);ctx.lineTo(x+cw,y);}}ctx.stroke();return;}
   const st=s*8;ctx.strokeStyle=k.t1;ctx.lineWidth=s*1.05;ctx.lineJoin='miter';for(let y=st*.5;y<h+st;y+=st)for(let x=0;x<w+st;x+=st){ctx.beginPath();ctx.moveTo(x-st*.3,y);ctx.lineTo(x,y-st*.3);ctx.lineTo(x+st*.3,y);ctx.stroke();}},
 shards(ctx,w,h,s,k,r,v){
   if(v==='crystal'){const cols=7,rows=9,cw=w/(cols-1),rh=h/(rows-1),P=[];for(let j=0;j<rows;j++){P.push([]);for(let i=0;i<cols;i++)P[j].push([i*cw+(i&&i<cols-1?(r()-.5)*cw*.7:0),j*rh+(j&&j<rows-1?(r()-.5)*rh*.7:0)]);}
     const a=lerp(.07,.42,k.k);for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const q=[P[j][i],P[j][i+1],P[j+1][i+1],P[j+1][i]];[[q[0],q[1],q[2]],[q[0],q[2],q[3]]].forEach(t=>{const cx=(t[0][0]+t[1][0]+t[2][0])/3/w,cy=(t[0][1]+t[1][1]+t[2][1])/3/h,d=cx-cy;if(d<.15)return;
       polyline(ctx,t);ctx.closePath();ctx.fillStyle=mix(k.bg,k.c.accent,a*Math.min(1.4,(.25+r()*.9)*(d+.3)));ctx.fill();ctx.strokeStyle=k.bg;ctx.lineWidth=Math.max(.5,s*.08);ctx.stroke();});}return;}
   if(v==='broken'){const cx=w*(.68+r()*.2),cy=h*(.22+r()*.2),n=12,mx=Math.hypot(w,h),cracks=[];ctx.strokeStyle=k.e1s;ctx.lineJoin='miter';ctx.lineWidth=Math.max(1,s*.22);
     for(let i=0;i<n;i++){let a=i/n*TAU+r()*.3,x=cx,y=cy;const pts=[[x,y]];for(let d=0;d<mx*.9;){const st=s*(3+r()*6);d+=st;a+=(r()-.5)*.35;x+=Math.cos(a)*st;y+=Math.sin(a)*st;pts.push([x,y]);}cracks.push(pts);polyline(ctx,pts);ctx.stroke();}
     ctx.lineWidth=Math.max(1,s*.12);for(let ring=1;ring<3;ring++)for(let i=0;i<n;i++){if(r()<.45)continue;const a=cracks[i],b=cracks[(i+1)%n],p=a[Math.min(a.length-1,ring*2+Math.floor(r()*2))],q=b[Math.min(b.length-1,ring*2+Math.floor(r()*3))];ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo((p[0]+q[0])/2+(r()-.5)*s*2,(p[1]+q[1])/2+(r()-.5)*s*2);ctx.lineTo(q[0],q[1]);ctx.stroke();}return;}
   if(v==='paper'){ctx.shadowColor='rgba(0,0,0,.14)';ctx.shadowBlur=s*1.6;ctx.shadowOffsetY=s*.4;const L=[[k.t2,[[w*.45,0],[w,0],[w,h*.55]]],[k.e1l,[[w*.68,0],[w,0],[w,h*.32],[w*.86,h*.2]]],[k.e2s,[[0,h*.58],[w*.36,h],[0,h]]],[k.e1m,[[0,h*.8],[w*.18,h],[0,h]]]];
     L.forEach(([col,pts])=>{polyline(ctx,pts);ctx.closePath();ctx.fillStyle=col;ctx.fill();});ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;return;}
   for(let i=0;i<16;i++){const x=w*(.45+r()*.65),y=r()*h,q=s*(6+r()*16),a=r()*6.283;ctx.beginPath();for(let j=0;j<3;j++){const b=a+j*2.094+r()*.7;ctx.lineTo(x+Math.cos(b)*q,y+Math.sin(b)*q);}ctx.closePath();ctx.fillStyle=[k.t1,k.t2,k.e1s][i%3];ctx.fill();}},
 peaks(ctx,w,h,s,k,r,v){
   if(v==='line'){ctx.lineJoin='round';for(let i=0;i<4;i++){const base=h*(.56+i*.1),amp=Math.min(h*.18,s*11)*(1-i*.15);ctx.beginPath();let x=0;ctx.moveTo(0,base);while(x<w){x+=w*(.06+r()*.09);ctx.lineTo(x-w*.035,base-amp*(.3+r()*.7));ctx.lineTo(x,base-amp*r()*.25);}ctx.strokeStyle=[k.e1s,k.e1m,k.e1l,k.t1][i];ctx.lineWidth=Math.max(1,s*.25);ctx.stroke();}return;}
   if(v==='summit'){const px=w*.64,py=h*.36;ctx.beginPath();ctx.moveTo(-w*.1,h);ctx.lineTo(w*.28,h*.58);ctx.lineTo(w*.4,h*.66);ctx.lineTo(px,py);ctx.lineTo(w*1.1,h);ctx.closePath();ctx.fillStyle=k.e1l;ctx.fill();
     ctx.beginPath();ctx.moveTo(w*.08,h);ctx.lineTo(w*.28,h*.58);ctx.lineTo(w*.5,h);ctx.closePath();ctx.fillStyle=k.e2s;ctx.fill();
     const d=h*.1;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+d*.8,py+d);ctx.lineTo(px+d*.35,py+d*.82);ctx.lineTo(px,py+d*1.05);ctx.lineTo(px-d*.4,py+d*.8);ctx.lineTo(px-d*.75,py+d);ctx.closePath();ctx.fillStyle=mix(k.e1l,k.bg,.65);ctx.fill();return;}
   if(v==='jagged'){for(let row=0;row<2;row++){const base=h*(.78+row*.1);ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,base);let x=row*w*.02;while(x<w){const tw=w*(.025+r()*.03);ctx.lineTo(x+tw/2,base-s*(4+r()*10)*(1-row*.3));x+=tw;ctx.lineTo(x,base);}ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=row?k.e1m:k.e1l;ctx.fill();}return;}
   for(let i=0;i<3;i++){const base=h*(.7+i*.09),amp=Math.min(h*.2,s*14)*(1-i*.22);ctx.beginPath();ctx.moveTo(0,h);let x=0;ctx.lineTo(0,base);while(x<w){x+=w*(.07+r()*.09);ctx.lineTo(x-w*.04,base-amp*(.35+r()*.65));ctx.lineTo(x,base-amp*r()*.25);}ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=[k.e1l,k.e2s,k.e1m][i];ctx.fill();}},
 topo(ctx,w,h,s,k,r,v){
   const rings=(cx,cy,n,step,p1,p2)=>{for(let i=1;i<=n;i++){const rad=i*step;ctx.beginPath();for(let a=0;a<=6.3;a+=.12){const q=rad*(1+.13*Math.sin(a*3+p1)+.07*Math.sin(a*5+p2+i*.3));const x=cx+Math.cos(a)*q,y=cy+Math.sin(a)*q;a?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}};
   if(v==='dense'){ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.18);for(let j=0;j<4;j++)rings(w*r(),h*r(),16,s*3,r()*TAU,r()*TAU);return;}
   if(v==='flow'){ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.24);const p1=r()*TAU,p2=r()*TAU,n=24;for(let i=0;i<=n;i++){const y0=h*i/n;ctx.beginPath();for(let x=0;x<=w;x+=w/80){const bump=Math.exp(-Math.pow((x/w-.65)/.25,2));const y=y0+Math.sin(x/w*TAU+y0/h*3+p1)*s*2+bump*s*7*Math.sin(y0/h*4+p2);x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}return;}
   if(v==='bold'){const cx=w*(.7+r()*.15),cy=h*(.25+r()*.2),p1=r()*TAU,p2=r()*TAU;for(let i=9;i>=1;i--){const rad=i*s*8;ctx.beginPath();for(let a=0;a<=6.3;a+=.1){const q=rad*(1+.15*Math.sin(a*3+p1)+.08*Math.sin(a*5+p2+i*.3));const x=cx+Math.cos(a)*q,y=cy+Math.sin(a)*q;a?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle=i%2?k.e1l:k.bg;ctx.fill();}return;}
   ctx.strokeStyle=k.t1;ctx.lineWidth=s*.34;const cs=[[w*(.2+r()*.2),h*(.25+r()*.2)],[w*(.75+r()*.15),h*(.7+r()*.2)]];
   for(const[cx,cy]of cs){const p1=r()*6.28,p2=r()*6.28;rings(cx,cy,11,s*4.6,p1,p2);}},
 grid(ctx,w,h,s,k,r,v){
   if(v==='blueprint'){const st=s*3;ctx.lineWidth=Math.max(.5,s*.07);ctx.strokeStyle=mix(k.t1,k.bg,.45);ctx.beginPath();for(let x=st;x<w;x+=st){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=st;y<h;y+=st){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
     ctx.lineWidth=Math.max(1,s*.16);ctx.strokeStyle=k.t1;ctx.beginPath();for(let x=st*5;x<w;x+=st*5){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=st*5;y<h;y+=st*5){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
     const cx=st*Math.round(w*.82/st),cy=st*Math.round(h*.2/st),q=st*2.2;ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.2);ctx.beginPath();ctx.arc(cx,cy,q,0,TAU);ctx.moveTo(cx-q*1.5,cy);ctx.lineTo(cx+q*1.5,cy);ctx.moveTo(cx,cy-q*1.5);ctx.lineTo(cx,cy+q*1.5);ctx.stroke();return;}
   if(v==='horizon'){const hz=h*.6,vx=w/2;ctx.save();ctx.beginPath();ctx.rect(0,0,w,hz);ctx.clip();const sr=Math.min(w,h)*.2;ctx.beginPath();ctx.arc(vx,hz,sr,0,TAU);ctx.fillStyle=k.e1l;ctx.fill();ctx.fillStyle=k.bg;for(let i=1;i<=5;i++){const t=sr*.03*i;ctx.fillRect(vx-sr,hz-sr*i*.15-t/2,sr*2,t);}ctx.restore();
     ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.22);ctx.beginPath();ctx.moveTo(0,hz);ctx.lineTo(w,hz);for(let i=-12;i<=12;i++){ctx.moveTo(vx+i*w*.012,hz);ctx.lineTo(vx+i*w*.16,h);}for(let j=1;j<=10;j++){const y=hz+(h-hz)*Math.pow(j/10,2);ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();return;}
   if(v==='iso'){const st=s*7,t=Math.tan(Math.PI/6),R=w+h;ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.16);ctx.beginPath();for(let x=0;x<w;x+=st*.866*2){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let c=-R;c<R;c+=st){ctx.moveTo(0,c);ctx.lineTo(w,c+w*t);ctx.moveTo(0,c);ctx.lineTo(w,c-w*t);}ctx.stroke();return;}
   const st=s*6;ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.16);ctx.beginPath();for(let x=st;x<w;x+=st){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=st;y<h;y+=st){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();},
 dots(ctx,w,h,s,k,r,v){
   if(v==='scatter'){for(let i=0;i<70;i++){ctx.beginPath();ctx.arc(r()*w,r()*h,s*(.25+r()*.9),0,TAU);ctx.fillStyle=i%4?k.t1:k.e1l;ctx.fill();}return;}
   if(v==='bold'){const st=s*9;ctx.fillStyle=k.t1;let row=0;for(let y=st/2;y<h+st;y+=st,row++)for(let x=row%2?st:st/2;x<w+st;x+=st){ctx.beginPath();ctx.arc(x,y,s*2,0,TAU);ctx.fill();}return;}
   if(v==='matrix'){const st=s*3.4,x0=w*.45;for(let y=st/2;y<h;y+=st)for(let x=x0+st/2;x<w;x+=st){const q=r();if(q<.35)continue;ctx.beginPath();ctx.arc(x,y,s*(.35+q*.9)*Math.min(1,(x-x0)/(w*.25)),0,TAU);ctx.fillStyle=q>.85?k.e1s:k.t1;ctx.fill();}return;}
   const st=s*5;ctx.fillStyle=k.t1;for(let y=st/2;y<h;y+=st)for(let x=st/2;x<w;x+=st){ctx.beginPath();ctx.arc(x,y,s*.55,0,6.283);ctx.fill();}},
 halftone(ctx,w,h,s,k,r,v){
   if(v==='band'){const st=s*3,L=(w+h)*.5,half=(w+h)*.2;ctx.fillStyle=k.e1s;for(let y=st/2;y<h;y+=st)for(let x=st/2;x<w;x+=st){const d=Math.abs(x+y-L)/half;const rad=s*1.4*Math.pow(Math.max(0,1-d),1.4);if(rad>.4){ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fill();}}return;}
   if(v==='pop'){const spot=(cx,cy,R,col)=>{const st=s*2.7;ctx.fillStyle=col;for(let y=cy-R;y<cy+R;y+=st)for(let x=cx-R;x<cx+R;x+=st){if(Math.hypot(x-cx,y-cy)<R){ctx.beginPath();ctx.arc(x,y,s*1.05,0,TAU);ctx.fill();}}};const m=Math.min(w,h);spot(w*.8,h*.22,m*.36,k.e1s);spot(w*.12,h*.85,m*.24,k.e2s);return;}
   if(v==='fine'){const st=s*1.7;ctx.fillStyle=k.e1l;for(let y=st/2;y<h*.65;y+=st)for(let x=st/2;x<w;x+=st){const rad=s*.6*(1-y/(h*.65));if(rad>.3){ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fill();}}return;}
   const st=s*3.3,mx=Math.hypot(w,h)*.8;ctx.fillStyle=k.e1s;for(let y=st/2;y<h;y+=st)for(let x=st/2;x<w;x+=st){const d=Math.hypot(w-x,h-y)/mx;const rad=s*1.45*Math.pow(Math.max(0,1-d),1.6);if(rad>.4){ctx.beginPath();ctx.arc(x,y,rad,0,6.283);ctx.fill();}}},
 plus(ctx,w,h,s,k,r,v){
   if(v==='scatter'){const cols=[k.t1,k.t2,k.e1l];for(let i=0;i<32;i++){const x=r()*w,y=r()*h,a=s*(1+r()*2.4);ctx.save();ctx.translate(x,y);ctx.rotate(i%2?Math.PI/4:0);plusPath(ctx,0,0,a,a*.36);ctx.fillStyle=cols[i%3];ctx.fill();ctx.restore();}return;}
   if(v==='bold'){const m=Math.min(w,h),x=w*.8,y=h*.22,a=m*.17;plusPath(ctx,x,y,a,a*.38);ctx.fillStyle=k.e1l;ctx.fill();plusPath(ctx,x+s*1.6,y+s*1.6,a,a*.38);ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.3);ctx.stroke();return;}
   if(v==='fine'){const st=s*11,a=s*1.1;ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.13);ctx.beginPath();for(let y=st/2;y<h;y+=st)for(let x=st/2;x<w;x+=st){ctx.moveTo(x-a,y);ctx.lineTo(x+a,y);ctx.moveTo(x,y-a);ctx.lineTo(x,y+a);}ctx.stroke();
     ctx.strokeStyle=k.e1s;[[st/2,st/2],[w-st/2,st/2],[st/2,h-st/2],[w-st/2,h-st/2]].forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,a*.7,0,TAU);ctx.stroke();});return;}
   const st=s*9,a=s*1.5,t=s*.55;ctx.fillStyle=k.t1;let row=0;for(let y=st/2;y<h;y+=st,row++)for(let x=(row%2?st:st/2);x<w;x+=st){ctx.fillRect(x-a,y-t/2,a*2,t);ctx.fillRect(x-t/2,y-a,t,a*2);}},
 growth(ctx,w,h,s,k,r,v){
   if(v==='area'){const n=9,pts=[];for(let i=0;i<n;i++)pts.push([w*(.04+i*.92/(n-1)),h*(.92-.42*Math.pow(i/(n-1),1.4)-r()*.05)]);ctx.beginPath();ctx.moveTo(pts[0][0],h);pts.forEach((p,i)=>{if(!i){ctx.lineTo(p[0],p[1]);return;}const q=pts[i-1],mx=(q[0]+p[0])/2;ctx.bezierCurveTo(mx,q[1],mx,p[1],p[0],p[1]);});ctx.lineTo(pts[n-1][0],h);ctx.closePath();ctx.fillStyle=k.t1;ctx.fill();
     ctx.beginPath();pts.forEach((p,i)=>{if(!i){ctx.moveTo(p[0],p[1]);return;}const q=pts[i-1],mx=(q[0]+p[0])/2;ctx.bezierCurveTo(mx,q[1],mx,p[1],p[0],p[1]);});ctx.strokeStyle=k.e1;ctx.lineWidth=s*.6;ctx.stroke();pts.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],s*.7,0,TAU);ctx.fillStyle=k.e1s;ctx.fill();});return;}
   if(v==='steps'){const n=6,bw=w/n;for(let i=0;i<n;i++){const bh=h*(.08+.065*i);ctx.fillStyle=i%2?k.t1:k.t2;ctx.fillRect(i*bw,h-bh,bw+.5,bh);ctx.fillStyle=k.e1s;ctx.fillRect(i*bw,h-bh,bw+.5,Math.max(1,s*.45));}return;}
   if(v==='arrow'){const m=Math.min(w,h),x0=w*.08,y0=h*.95,x1=w*.86,y1=h*.3,a=Math.atan2(y1-y0,x1-x0),sw=m*.05,hs=m*.16,L=Math.hypot(x1-x0,y1-y0);ctx.save();ctx.translate(x0,y0);ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,-sw);ctx.lineTo(L-hs,-sw);ctx.lineTo(L-hs,-hs*.8);ctx.lineTo(L,0);ctx.lineTo(L-hs,hs*.8);ctx.lineTo(L-hs,sw);ctx.lineTo(0,sw);ctx.closePath();ctx.fillStyle=k.e1l;ctx.fill();ctx.restore();return;}
   const n=7,bw=w*.055,gap=w*.022,x0=w-(n*(bw+gap))-w*.04,pts=[];for(let i=0;i<n;i++){const bh=h*(.08+.055*i+r()*.035),x=x0+i*(bw+gap);ctx.fillStyle=i%2?k.t1:k.t2;ctx.fillRect(x,h-bh,bw,bh);pts.push([x+bw/2,h-bh-h*.05]);}
   ctx.strokeStyle=k.e1;ctx.lineWidth=s*.75;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
   const e=pts[n-1],d=pts[n-2],a=Math.atan2(e[1]-d[1],e[0]-d[0]),q=s*2.4;ctx.beginPath();ctx.moveTo(e[0]+Math.cos(a)*q,e[1]+Math.sin(a)*q);ctx.lineTo(e[0]+Math.cos(a+2.4)*q,e[1]+Math.sin(a+2.4)*q);ctx.lineTo(e[0]+Math.cos(a-2.4)*q,e[1]+Math.sin(a-2.4)*q);ctx.closePath();ctx.fillStyle=k.e1;ctx.fill();},
 frame(ctx,w,h,s,k,r,v){const corners=fn=>[[0,0,1,1],[w,0,-1,1],[0,h,1,-1],[w,h,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);fn();ctx.restore();});
   if(v==='deco'){const m=Math.min(s*3,h*.08),q=Math.min(s*9,h*.22);ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.22);ctx.strokeRect(m,m,w-2*m,h-2*m);
     corners(()=>{ctx.lineWidth=Math.max(1,s*.28);for(let i=0;i<3;i++){const o=m+s*1.1*(i+1),L=q*(1-i*.22);ctx.beginPath();ctx.moveTo(o,o+L);ctx.lineTo(o,o+L*.45);ctx.lineTo(o+L*.45,o+L*.45);ctx.lineTo(o+L*.45,o);ctx.lineTo(o+L,o);ctx.stroke();}
       ctx.lineWidth=Math.max(1,s*.14);for(let j=0;j<5;j++){const a=j/4*Math.PI/2;ctx.beginPath();ctx.moveTo(m,m);ctx.lineTo(m+Math.cos(a)*q*.4,m+Math.sin(a)*q*.4);ctx.stroke();}});return;}
   if(v==='ornate'){const m=Math.min(s*2.6,h*.07),q=Math.min(s*8,h*.2);ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.14);ctx.strokeRect(m,m,w-2*m,h-2*m);ctx.lineCap='round';
     corners(()=>{ctx.lineWidth=Math.max(1,s*.24);const o=m+s*.9;ctx.beginPath();ctx.moveTo(o,o+q);ctx.bezierCurveTo(o,o+q*.3,o+q*.1,o+q*.08,o+q*.35,o+q*.3);ctx.bezierCurveTo(o+q*.5,o+q*.45,o+q*.3,o+q*.6,o+q*.2,o+q*.45);ctx.stroke();
       ctx.beginPath();ctx.moveTo(o+q,o);ctx.bezierCurveTo(o+q*.3,o,o+q*.08,o+q*.1,o+q*.3,o+q*.35);ctx.bezierCurveTo(o+q*.45,o+q*.5,o+q*.6,o+q*.3,o+q*.45,o+q*.2);ctx.stroke();
       ctx.beginPath();ctx.arc(o+q*.12,o+q*.12,s*.6,0,TAU);ctx.fillStyle=k.e1s;ctx.fill();});return;}
   if(v==='bold'){const t=Math.min(s*2.8,h*.07);ctx.fillStyle=k.e1l;ctx.fillRect(0,0,w,t);ctx.fillRect(0,h-t,w,t);ctx.fillRect(0,0,t,h);ctx.fillRect(w-t,0,t,h);ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.2);const n=t+s*1.2;ctx.strokeRect(n,n,w-2*n,h-2*n);return;}
   const m=Math.min(s*3.2,h*.09);ctx.strokeStyle=k.e1;ctx.lineWidth=Math.max(1.5,s*.3);ctx.strokeRect(m,m,w-2*m,h-2*m);ctx.lineWidth=Math.max(1,s*.12);const n=m+Math.min(s*1.2,h*.035);ctx.strokeRect(n,n,w-2*n,h-2*n);
   const q=Math.min(s*3,h*.08);for(const[cx,cy]of[[n,n],[w-n,n],[n,h-n],[w-n,h-n]]){ctx.beginPath();ctx.arc(cx,cy,q,0,6.283);ctx.fillStyle=k.bg;ctx.fill();ctx.stroke();}},
 sparkles(ctx,w,h,s,k,r,v){
   if(v==='cluster'){const cx=w*.8,cy=h*.2,m=Math.min(w,h)*.2;for(let i=0;i<10;i++){const a=r()*TAU,d=m*Math.sqrt(r());sparkle(ctx,cx+Math.cos(a)*d,cy+Math.sin(a)*d,s*(.8+r()*r()*5)*(1-d/m*.5),i%3?k.e1s:k.t2);}return;}
   if(v==='glint'){for(let i=0;i<7;i++){const x=r()*w,y=r()*h,q=s*(1.6+r()*3);sparkle(ctx,x,y,q,k.e1s,.08);ctx.strokeStyle=k.e1l;ctx.lineWidth=Math.max(1,s*.1);ctx.beginPath();ctx.moveTo(x-q*3.4,y);ctx.lineTo(x+q*3.4,y);ctx.moveTo(x,y-q*3.4);ctx.lineTo(x,y+q*3.4);ctx.stroke();}return;}
   if(v==='burst'){const cx=w*.5,cy=h*.42,mx=Math.hypot(w,h)*.55,cols=[k.c.accent,k.c.head,k.e1s];for(let i=0;i<60;i++){const a=r()*TAU,d=mx*Math.pow(r(),.7),x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d,q=s*(.4+r()*1.8)*(.5+d/mx);ctx.globalAlpha=.3+.6*k.k;
       if(i%3)sparkle(ctx,x,y,q,cols[i%3]);else{ctx.beginPath();ctx.arc(x,y,q*.35,0,TAU);ctx.fillStyle=cols[i%3];ctx.fill();}}ctx.globalAlpha=1;return;}
   for(let i=0;i<15;i++){const x=r()*w,y=r()*h,q=s*(1.4+r()*r()*6.5);sparkle(ctx,x,y,q,i%3?k.e1s:k.t2);}},
 confetti(ctx,w,h,s,k,r,v){const cols=[k.c.accent,k.c.head,k.e1s,k.t2];
   if(v==='streamers'){ctx.lineCap='round';for(let i=0;i<9;i++){const x0=r()*w,y0=r()*h*.6,len=s*(18+r()*20),a=Math.PI*.35+r()*.6,loops=2+r()*2,amp=s*(1.2+r()*1.5);ctx.strokeStyle=cols[i%4];ctx.lineWidth=s*.55;ctx.globalAlpha=.3+.6*k.k;ctx.beginPath();
       for(let t=0;t<=1.001;t+=.02){const b=t*len,c=Math.sin(t*loops*TAU)*amp;const x=x0+Math.cos(a)*b-Math.sin(a)*c,y=y0+Math.sin(a)*b+Math.cos(a)*c;t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}ctx.globalAlpha=1;return;}
   if(v==='memphis'){ctx.lineCap='round';ctx.lineJoin='round';for(let i=0;i<24;i++){const x=r()*w,y=r()*h,q=s*(1.4+r()*2.4),t=i%5,col=cols[i%4];ctx.save();ctx.translate(x,y);ctx.rotate(r()*TAU);ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=s*.45;ctx.globalAlpha=.3+.6*k.k;
       if(t===0){ctx.beginPath();for(let j=0;j<=20;j++){const xx=-q*1.5+j*q*.15;j?ctx.lineTo(xx,Math.sin(j*.9)*q*.35):ctx.moveTo(xx,0);}ctx.stroke();}
       else if(t===1){ctx.beginPath();ctx.moveTo(0,-q);ctx.lineTo(q*.9,q*.6);ctx.lineTo(-q*.9,q*.6);ctx.closePath();ctx.stroke();}
       else if(t===2){ctx.beginPath();ctx.arc(0,0,q*.55,0,TAU);ctx.fill();}
       else if(t===3){ctx.beginPath();for(let j=0;j<6;j++)ctx.lineTo(-q+j*q*.4,j%2?-q*.3:q*.3);ctx.stroke();}
       else{for(let a=0;a<3;a++)for(let b=0;b<3;b++){ctx.beginPath();ctx.arc(a*q*.45,b*q*.45,s*.3,0,TAU);ctx.fill();}}ctx.restore();}ctx.globalAlpha=1;return;}
   if(v==='fall'){for(let i=0;i<18;i++){const x=r()*w,y=h*Math.pow(r(),1.8)*.7,q=s*(.8+r()*1.2);ctx.save();ctx.translate(x,y);ctx.rotate(r()*TAU);ctx.globalAlpha=.25+.65*k.k;ctx.fillStyle=cols[i%4];ctx.fillRect(-q,-q*.35,q*2,q*.7);ctx.restore();}ctx.globalAlpha=1;return;}
   for(let i=0;i<70;i++){const x=r()*w,y=r()*h*(r()<.6?.45:1),q=s*(.8+r()*1.6);ctx.save();ctx.translate(x,y);ctx.rotate(r()*6.283);ctx.globalAlpha=.25+.65*k.k;ctx.fillStyle=cols[i%4];const t=i%3;if(t===0)ctx.fillRect(-q,-q*.4,q*2,q*.8);else if(t===1){ctx.beginPath();ctx.arc(0,0,q*.6,0,6.283);ctx.fill();}else{ctx.beginPath();ctx.moveTo(0,-q);ctx.lineTo(q,q*.8);ctx.lineTo(-q,q*.8);ctx.closePath();ctx.fill();}ctx.restore();}},
 hearts(ctx,w,h,s,k,r,v){
   if(v==='line'){const st=s*10,q=s*1.5;ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.18);let row=0;for(let y=st/2;y<h+st;y+=st*.8,row++)for(let x=row%2?st:st/2;x<w+st;x+=st){ctx.save();ctx.translate(x,y);ctx.rotate(row%2?.15:-.15);heartPath(ctx,q);ctx.stroke();ctx.restore();}return;}
   if(v==='big'){const q=Math.min(w,h)*.24;ctx.save();ctx.translate(w*.74,h*.34);ctx.rotate(.12);heartPath(ctx,q);ctx.fillStyle=k.e1l;ctx.fill();ctx.scale(.84,.84);heartPath(ctx,q);ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.3);ctx.stroke();ctx.restore();return;}
   if(v==='float'){for(let i=0;i<14;i++){const x=r()*w,t=r(),y=h*(1.05-t*.95),q=s*(1.5+(1-t)*4.5);ctx.save();ctx.translate(x,y);ctx.rotate((r()-.5)*.6);heartPath(ctx,q);ctx.fillStyle=i%2?k.t1:k.e1l;ctx.fill();ctx.restore();ctx.fillStyle=k.t1;for(let j=1;j<=3;j++){ctx.beginPath();ctx.arc(x+Math.sin(j*1.7)*s*.8,y+q+j*s*1.6,s*.3,0,TAU);ctx.fill();}}return;}
   for(let i=0;i<13;i++){const x=r()*w,y=r()*h,q=s*(2.5+r()*6);ctx.save();ctx.translate(x,y);ctx.rotate((r()-.5)*.8);heartPath(ctx,q);if(i%3===0){ctx.strokeStyle=k.e1s;ctx.lineWidth=s*.4;ctx.stroke();}else{ctx.fillStyle=i%2?k.t1:k.t2;ctx.fill();}ctx.restore();}},
 scribble(ctx,w,h,s,k,r,v){ctx.lineCap='round';ctx.lineJoin='round';const wob=()=>(r()-.5)*s*.35;
   if(v==='marker'){ctx.strokeStyle=k.e1s;ctx.lineWidth=s*1.6;ctx.globalAlpha=.85;const y0=h*(.7+r()*.12),x0=w*.08,x1=w*.92;ctx.beginPath();for(let t=0;t<=1.001;t+=.02){const x=x0+(x1-x0)*t,y=y0-Math.sin(t*Math.PI)*h*.05+t*h*.02+wob();t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
     ctx.lineWidth=s*.7;const cx=w*.8,cy=h*.2,rx=w*.13,ry=h*.08;ctx.beginPath();for(let a=-.4;a<TAU+.5;a+=.12){const g=1+.06*Math.sin(a*2)+(r()-.5)*.03;ctx.lineTo(cx+Math.cos(a)*rx*g,cy+Math.sin(a)*ry*g);}ctx.stroke();
     for(let i=0;i<3;i++){const x=w*(.1+i*.035),y=h*.12;ctx.beginPath();ctx.moveTo(x,y+h*.05);ctx.lineTo(x+w*.02,y);ctx.stroke();}ctx.globalAlpha=1;return;}
   if(v==='doodle'){ctx.lineWidth=s*.38;for(let i=0;i<11;i++){const x=r()*w,y=r()*h,q=s*(2+r()*2.5),t=i%5;ctx.strokeStyle=i%2?k.e1s:k.e1m;ctx.beginPath();
       if(t===0){for(let j=0;j<=10;j++){const a=-Math.PI/2+j*Math.PI/5,q2=j%2?q*.45:q;ctx.lineTo(x+Math.cos(a)*q2+wob(),y+Math.sin(a)*q2+wob());}}
       else if(t===1){for(let a=0;a<12;a+=.25){const q2=s*.4+a*q*.08;ctx.lineTo(x+Math.cos(a)*q2+wob()*.3,y+Math.sin(a)*q2);}}
       else if(t===2){ctx.moveTo(x-q,y+q*.3);ctx.quadraticCurveTo(x,y-q,x+q,y);ctx.moveTo(x+q*.5,y-q*.35);ctx.lineTo(x+q,y);ctx.lineTo(x+q*.45,y+q*.3);}
       else if(t===3){for(let j=0;j<7;j++)ctx.lineTo(x-q+j*q*.33+wob(),y+(j%2?-q*.4:q*.4));}
       else{for(let a=0;a<=TAU+.3;a+=.2)ctx.lineTo(x+Math.cos(a)*q*.7+wob(),y+Math.sin(a)*q*.7+wob());}ctx.stroke();}return;}
   if(v==='chalk'){ctx.lineWidth=Math.max(1,s*.26);[[w*.85,h*.15],[w*.12,h*.85],[w*.9,h*.88]].forEach(([cx,cy],j)=>{ctx.strokeStyle=j%2?k.t1:k.e1m;for(let i=0;i<34;i++){const x=cx+(r()-.5)*w*.22,y=cy+(r()-.5)*h*.16,L=s*(2+r()*2.5),a=j===1?-.9:.9;ctx.globalAlpha=.35+.5*r();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*L+wob(),y-Math.sin(a)*L+wob());ctx.stroke();}});ctx.globalAlpha=1;return;}
   ctx.strokeStyle=k.e1s;ctx.lineWidth=s*.6;
   for(let i=0;i<4;i++){const x0=r()*w*.7,y0=h*(.08+r()*.84),len=w*(.18+r()*.2),amp=s*(1.5+r()*3),loops=3+Math.floor(r()*4);ctx.beginPath();for(let t=0;t<=1.001;t+=.01){const x=x0+t*len+Math.sin(t*loops*6.283)*amp*.8,y=y0+Math.cos(t*loops*6.283)*amp+(r()-.5)*s*.25;t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
   const cx=w*(.75+r()*.15),cy=h*(.2+r()*.1);ctx.beginPath();for(let a=0;a<12.6;a+=.15){const q=s*(2+a*.75);ctx.lineTo(cx+Math.cos(a)*q+(r()-.5)*s*.3,cy+Math.sin(a)*q*.8);}ctx.stroke();},
 stars(ctx,w,h,s,k,r,v){const dust=n=>{for(let i=0;i<n;i++){ctx.beginPath();ctx.arc(r()*w,r()*h,s*(.1+r()*r()*.4),0,TAU);ctx.fillStyle=i%4?k.e1l:k.e1s;ctx.fill();}};
   if(v==='constellation'){dust(40);ctx.lineWidth=Math.max(1,s*.14);for(let c=0;c<5;c++){const cx=w*(.1+r()*.8),cy=h*(.1+r()*.8),n=4+Math.floor(r()*3),pts=[];for(let i=0;i<n;i++)pts.push([cx+(r()-.5)*w*.26,cy+(r()-.5)*h*.2]);ctx.strokeStyle=k.e1l;polyline(ctx,pts);ctx.stroke();pts.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],s*.45,0,TAU);ctx.fillStyle=k.e1s;ctx.fill();});}return;}
   if(v==='shooting'){dust(40);ctx.lineCap='round';for(let i=0;i<5;i++){const x=w*(.25+r()*.8),y=h*(r()*.6),L=s*(10+r()*14),a=Math.PI*.78;const tx=x+Math.cos(a)*L,ty=y+Math.sin(a)*L,g=ctx.createLinearGradient(x,y,tx,ty);g.addColorStop(0,rgba(k.e1,.9));g.addColorStop(1,rgba(k.e1,0));
       ctx.strokeStyle=g;ctx.lineWidth=s*.45;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(tx,ty);ctx.stroke();ctx.beginPath();ctx.arc(x,y,s*.55,0,TAU);ctx.fillStyle=k.e1;ctx.fill();}return;}
   if(v==='moon'){const R=Math.min(w,h)*.13,cx=w*.78,cy=h*.2;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fillStyle=k.e1s;ctx.fill();ctx.beginPath();ctx.arc(cx+R*.42,cy-R*.22,R*.92,0,TAU);ctx.fillStyle=k.bg;ctx.fill();for(let i=0;i<10;i++)sparkle(ctx,r()*w,r()*h*.6,s*(.5+r()*1.2),k.e1l);return;}
   for(let i=0;i<90;i++){const x=r()*w,y=r()*h,q=s*(.12+r()*r()*.6);ctx.beginPath();ctx.arc(x,y,q,0,6.283);ctx.fillStyle=i%4?k.e1s:k.e1;ctx.fill();}
   for(let i=0;i<6;i++){const x=r()*w,y=r()*h*.7,q=s*(1.2+r()*2.2);sparkle(ctx,x,y,q,k.e1);}},
 rain(ctx,w,h,s,k,r,v){ctx.lineCap='round';
   if(v==='drizzle'){ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.12);for(let i=0;i<50;i++){const x=r()*w,y=r()*h,len=s*(1.2+r()*1.8);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+len);ctx.stroke();}return;}
   if(v==='storm'){for(let i=0;i<230;i++){const x=r()*w*1.3,y=r()*h,len=s*(3+r()*6);ctx.strokeStyle=i%5?k.t1:k.e1l;ctx.lineWidth=s*(.18+r()*.24);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.55,y+len);ctx.stroke();}return;}
   if(v==='drops'){for(let i=0;i<18;i++){const x=r()*w,y=r()*h,q=s*(1.4+r()*2.8);ctx.beginPath();ctx.moveTo(x,y-q*1.5);ctx.bezierCurveTo(x+q*.2,y-q*.9,x+q,y-q*.2,x+q,y+q*.2);ctx.arc(x,y+q*.2,q,0,Math.PI);ctx.bezierCurveTo(x-q,y-q*.2,x-q*.2,y-q*.9,x,y-q*1.5);ctx.fillStyle=i%3?k.t1:k.e1l;ctx.fill();}return;}
   ctx.strokeStyle=k.t1;for(let i=0;i<110;i++){const x=r()*w*1.1,y=r()*h,len=s*(2.5+r()*5);ctx.lineWidth=s*(.16+r()*.2);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.26,y+len);ctx.stroke();}},
 bolts(ctx,w,h,s,k,r,v){
   if(v==='single'){const U=[[.55,0],[.12,.56],[.44,.56],[.28,1],[.88,.38],[.54,.38],[.76,0]],x0=w*.5,y0=h*.04,bw=w*.46,bh=h*.82;polyline(ctx,U.map(([x,y])=>[x0+x*bw,y0+y*bh]));ctx.closePath();ctx.fillStyle=k.e1l;ctx.fill();ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.35);ctx.lineJoin='miter';ctx.stroke();return;}
   if(v==='arcs'){ctx.lineJoin='miter';ctx.shadowColor=rgba(k.c.accent,.8);ctx.shadowBlur=s*1.2;const arc=(x0,y0,x1,y1,d,lw)=>{const pts=[[x0,y0],[x1,y1]];for(let it=0;it<5;it++){for(let i=pts.length-1;i>0;i--){const a=pts[i-1],b=pts[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);pts.splice(i,0,[(a[0]+b[0])/2+(r()-.5)*L*.45,(a[1]+b[1])/2+(r()-.5)*L*.45]);}}
       ctx.strokeStyle=k.e1s;ctx.lineWidth=lw;polyline(ctx,pts);ctx.stroke();if(d>0)for(let b=0;b<2;b++){const p=pts[Math.floor(r()*pts.length*.7)+2];arc(p[0],p[1],p[0]+(r()-.3)*w*.3,p[1]+r()*h*.3,d-1,lw*.6);}};
     arc(w*(.6+r()*.3),0,w*(.5+r()*.3),h*(.7+r()*.3),2,Math.max(1,s*.25));arc(w,h*(.2+r()*.3),w*(.4+r()*.2),h*(.4+r()*.3),1,Math.max(1,s*.18));ctx.shadowBlur=0;return;}
   if(v==='icons'){const st=s*12,q=s*2.6;ctx.fillStyle=k.t1;let row=0;for(let y=st/2;y<h+st;y+=st*.8,row++)for(let x=row%2?st:st/2;x<w+st;x+=st){ctx.save();ctx.translate(x,y);ctx.rotate(row%2?.2:-.1);polyline(ctx,[[.1,-1],[-.55,.12],[-.02,.12],[-.2,1],[.55,-.15],[.04,-.15],[.32,-1]].map(([a,b])=>[a*q,b*q]));ctx.closePath();ctx.fill();ctx.restore();}return;}
   ctx.lineJoin='miter';for(let i=0;i<3;i++){let x=w*(.55+r()*.42),y=-s;const pts=[[x,y]];while(y<h*(.45+r()*.4)){y+=h*(.05+r()*.08);x+=(r()-.62)*w*.09;pts.push([x,y]);y-=h*.012;x+=w*.03;pts.push([x,y]);}
   ctx.strokeStyle=[k.e1s,k.t1,k.e1m][i];ctx.lineWidth=s*(1.3-i*.3);ctx.beginPath();pts.forEach((p,j)=>j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}},
 checker(ctx,w,h,s,k,r,v){
   if(v==='full'){const q=s*6;for(let y=0,j=0;y<h;y+=q,j++)for(let x=0,i=0;x<w;x+=q,i++)if((i+j)%2){ctx.fillStyle=k.t1;ctx.fillRect(x,y,q+.5,q+.5);}return;}
   if(v==='warp'){const q=s*7,f=(x,y)=>[x+Math.sin(y/h*TAU*1.2)*s*3.2,y+Math.sin(x/w*TAU*1.4)*s*3.2];for(let y=-q,j=0;y<h+q;y+=q,j++)for(let x=-q,i=0;x<w+q;x+=q,i++){if((i+j)%2)continue;const c=[f(x,y),f(x+q,y),f(x+q,y+q),f(x,y+q)];polyline(ctx,c);ctx.closePath();ctx.fillStyle=k.t1;ctx.fill();}return;}
   if(v==='flag'){const fx=w*.56,fy=h*.08,fw=w*.38,fh=h*.24,c=8,rws=5,cw=fw/c,ch=fh/rws,f=(x,y)=>[fx+x,fy+y+Math.sin(x/fw*TAU*1.2)*fh*.12];ctx.strokeStyle=k.e1s;ctx.lineWidth=s*.6;ctx.beginPath();ctx.moveTo(fx,fy-s);ctx.lineTo(fx,h*.6);ctx.stroke();
     for(let j=0;j<rws;j++)for(let i=0;i<c;i++){const p=[f(i*cw,j*ch),f((i+1)*cw,j*ch),f((i+1)*cw,(j+1)*ch),f(i*cw,(j+1)*ch)];polyline(ctx,p);ctx.closePath();ctx.fillStyle=(i+j)%2?k.bg:k.e1m;ctx.fill();}return;}
   const q=Math.min(h*.075,s*5);for(let row=0;row<2;row++)for(let i=0;i*q<w;i++){ctx.fillStyle=(i+row)%2?k.e2s:k.t1;ctx.fillRect(i*q,h-(row+1)*q,q+.5,q+.5);}},
 brush(ctx,w,h,s,k,r,v){
   if(v==='dabs'){const cols=[k.e1s,k.t2,k.e1l];for(let i=0;i<24;i++){const x=r()*w,y=r()*h,L=s*(3+r()*4),a=r()*TAU;bristles(ctx,curveF(x,y,x+Math.cos(a)*L*.5+s,y+Math.sin(a)*L*.5,x+Math.cos(a)*L,y+Math.sin(a)*L),s*(1.4+r()*1.2),9,r,cols[i%3],Math.max(1,s*.3),1);}return;}
   if(v==='enso'){const cx=w*.76,cy=h*.27,R=Math.min(w,h)*.21,a0=r()*TAU,span=TAU*.9;bristles(ctx,t=>{const a=a0+t*span;return[cx+Math.cos(a)*R,cy+Math.sin(a)*R,Math.cos(a),Math.sin(a)];},s*3.2,26,r,k.e1m,Math.max(1,s*.28),1);
     const g=ctx.createRadialGradient(w*.12,h*.88,0,w*.12,h*.88,Math.min(w,h)*.3);g.addColorStop(0,rgba(k.c.accent,.06+.2*k.k));g.addColorStop(1,rgba(k.c.accent,0));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);return;}
   bristles(ctx,curveF(w*.02,h*(.74+r()*.06),w*.5,h*(.52+r()*.1),w*.98,h*(.64+r()*.08)),s*7,40,r,k.e1m,Math.max(1,s*.26),1);
   bristles(ctx,curveF(w*.55,h*.12,w*.8,h*.05,w*1.02,h*.2),s*3.5,22,r,k.e1l,Math.max(1,s*.24),1);},
 circuit(ctx,w,h,s,k,r,v){
   if(v==='glitch'){for(let i=0;i<16;i++){const y=r()*h,bh=s*(.4+r()*3.2),x=r()*w*.8,bw=w*(.08+r()*.5);ctx.fillStyle=[k.t1,k.e1l,rgba(k.c.accent,.15+.4*k.k),k.t2][i%4];ctx.fillRect(x,y,bw,bh);ctx.fillStyle=rgba(k.c.head,.1+.3*k.k);ctx.fillRect(x+s*1.2,y+bh,bw*.6,Math.max(1,s*.25));}
     ctx.fillStyle=rgba(k.c.head,.03+.08*k.k);for(let y=0;y<h;y+=s*1.4)ctx.fillRect(0,y,w,Math.max(1,s*.3));return;}
   if(v==='scan'){ctx.fillStyle=rgba(k.c.head,.025+.09*k.k);const st=Math.max(3,s*1.5);for(let y=0;y<h;y+=st)ctx.fillRect(0,y,w,Math.max(1,st*.3));const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.hypot(w,h)*.6);g.addColorStop(0,rgba(k.c.head,0));g.addColorStop(1,rgba(k.c.head,.04+.16*k.k));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);return;}
   const g=s*3,snap=v2=>Math.round(v2/g)*g;ctx.lineWidth=Math.max(1,s*.32);ctx.lineJoin='round';for(let i=0;i<16;i++){const left=i%2===0;let x=left?0:w,y=snap(r()*h);const pts=[[x,y]];const dir=left?1:-1;let segs=2+Math.floor(r()*3);
     while(segs--){x+=dir*snap(w*(.06+r()*.14));pts.push([x,y]);const dy=(r()<.5?-1:1)*snap(s*(2+r()*6));x+=dir*Math.abs(dy);y+=dy;pts.push([x,y]);}ctx.strokeStyle=i%3?k.t1:k.e1l;polyline(ctx,pts);ctx.stroke();const e=pts[pts.length-1];ctx.beginPath();ctx.arc(e[0],e[1],s*.8,0,TAU);ctx.fillStyle=k.bg;ctx.fill();ctx.stroke();}},
 florals(ctx,w,h,s,k,r,v){
   const flower=(x,y,R,n,col,cc,stroke,pointed)=>{ctx.save();ctx.translate(x,y);ctx.rotate(r()*TAU);for(let i=0;i<n;i++){ctx.rotate(TAU/n);ctx.beginPath();if(pointed){ctx.moveTo(0,0);ctx.quadraticCurveTo(R*.32,R*.45,0,R);ctx.quadraticCurveTo(-R*.32,R*.45,0,0);}else ctx.ellipse(0,R*.55,R*.24,R*.48,0,0,TAU);
     if(stroke){ctx.strokeStyle=col;ctx.lineWidth=stroke;ctx.stroke();}else{ctx.fillStyle=col;ctx.fill();}}ctx.beginPath();ctx.arc(0,0,R*.18,0,TAU);if(stroke){ctx.stroke();}else{ctx.fillStyle=cc;ctx.fill();}ctx.restore();};
   if(v==='line'){const lw=Math.max(1,s*.2),m=Math.min(w,h);ctx.lineCap='round';[[w*.86,h*.12],[w*.12,h*.88]].forEach(([x,y],j)=>{ctx.strokeStyle=k.e1s;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+(j?1:-1)*m*.15,y+(j?-1:1)*m*.05,x+(j?1:-1)*m*.3,y+(j?-1:1)*m*.25);ctx.stroke();
     flower(x,y,m*.09,5,k.e1s,0,lw);flower(x+(j?1:-1)*m*.3,y+(j?-1:1)*m*.25,m*.05,5,k.e1s,0,lw);leafAt(ctx,k,x+(j?1:-1)*m*.14,y+(j?-1:1)*m*.08,m*.07,j?-.6:2.5,k.e1s,lw);});return;}
   if(v==='bloom'){const R=Math.min(w,h)*.36,x=w*.84,y=h*.16;flower(x,y,R,12,k.e1l,k.e1s,0,true);flower(x,y,R*.6,10,k.t2,k.e1s,0,true);ctx.beginPath();ctx.arc(x,y,R*.12,0,TAU);ctx.fillStyle=k.e1s;ctx.fill();return;}
   const cols=[k.t1,k.t2,k.e1l];for(let i=0;i<12;i++)flower(r()*w,r()*h,s*(2.5+r()*3.5),6,cols[i%3],k.e1s,0);},
 ornament(ctx,w,h,s,k,r,v){
   if(v==='rose'){const cx=w*.8,cy=h*.22,R=Math.min(w,h)*.3;ctx.beginPath();ctx.arc(cx,cy,R,0,TAU);ctx.fillStyle=k.t2;ctx.fill();ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.24);
     [1,.93,.4].forEach(f=>{ctx.beginPath();ctx.arc(cx,cy,R*f,0,TAU);ctx.stroke();});for(let i=0;i<8;i++){const a=i/8*TAU;ctx.beginPath();ctx.arc(cx+Math.cos(a)*R*.62,cy+Math.sin(a)*R*.62,R*.26,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R*.4,cy+Math.sin(a)*R*.4);ctx.lineTo(cx+Math.cos(a)*R*.93,cy+Math.sin(a)*R*.93);ctx.stroke();}
     for(let i=0;i<6;i++){const a=i/6*TAU;ctx.beginPath();ctx.arc(cx+Math.cos(a)*R*.2,cy+Math.sin(a)*R*.2,R*.09,0,TAU);ctx.stroke();}return;}
   if(v==='thorns'){ctx.lineCap='round';ctx.lineJoin='round';[[0,h*.2,1],[w,h*.75,-1],[w*.3,h,0]].forEach(([x0,y0,d],j)=>{const pts=[],len=Math.min(w,h)*.85,a0=d===0?-Math.PI/2.4:(d>0?.35:Math.PI+.35);for(let t=0;t<=1.001;t+=.02){const a=a0+Math.sin(t*5+j)*.35;const p=pts.length?pts[pts.length-1]:[x0,y0];pts.push([p[0]+Math.cos(a)*len*.02,p[1]+Math.sin(a)*len*.02]);}
     ctx.strokeStyle=k.e1m;ctx.lineWidth=s*.45;polyline(ctx,pts);ctx.stroke();ctx.fillStyle=k.e1m;for(let i=3;i<pts.length-1;i+=3){const p=pts[i],q=pts[i+1],a=Math.atan2(q[1]-p[1],q[0]-p[0])+(i%2?1.3:-1.3),L=s*1.6;ctx.beginPath();ctx.moveTo(p[0]+Math.cos(a+1.57)*s*.4,p[1]+Math.sin(a+1.57)*s*.4);ctx.lineTo(p[0]+Math.cos(a)*L,p[1]+Math.sin(a)*L);ctx.lineTo(p[0]-Math.cos(a+1.57)*s*.4,p[1]-Math.sin(a+1.57)*s*.4);ctx.closePath();ctx.fill();}
     const e=pts[pts.length-1];ctx.beginPath();for(let a=0;a<9;a+=.25){const q=s*(3.5-a*.35);ctx.lineTo(e[0]+Math.cos(a+j)*q,e[1]+Math.sin(a+j)*q);}ctx.lineWidth=s*.3;ctx.stroke();});return;}
   const st=Math.min(w,h)*.34,q=st*.3;ctx.fillStyle=k.t1;ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.18);let row=0;
   for(let y=st*.45;y<h+st;y+=st*.82,row++)for(let x=row%2?0:st/2;x<w+st;x+=st){ctx.save();ctx.translate(x,y);
     ctx.beginPath();ctx.moveTo(0,-q*1.1);ctx.bezierCurveTo(q*.32,-q*.5,q*.32,q*.35,0,q*.75);ctx.bezierCurveTo(-q*.32,q*.35,-q*.32,-q*.5,0,-q*1.1);ctx.fill();
     for(const sx of[1,-1]){ctx.save();ctx.scale(sx,1);leafPath(ctx,q*.12,q*.35,q*.85,-.75);ctx.fill();ctx.restore();leafPath(ctx,q*.1,q*.7,q*.55,.35);ctx.fill();ctx.restore();ctx.restore();
       ctx.save();ctx.scale(sx,1);ctx.beginPath();ctx.moveTo(q*.22,-q*.2);ctx.bezierCurveTo(q*.9,-q*.5,q*1.05,q*.25,q*.7,q*.32);ctx.bezierCurveTo(q*.5,q*.36,q*.48,q*.12,q*.64,q*.1);ctx.stroke();ctx.restore();}
     ctx.beginPath();ctx.arc(0,-q*1.32,q*.1,0,TAU);ctx.fill();ctx.restore();}},
 geo(ctx,w,h,s,k,r,v){const m=Math.min(w,h);
   if(v==='triangles'){const q=s*9,th=q*.866;for(let j=0,y=0;y<h+th;y+=th,j++)for(let i=-1,x=-q;x<w+q;x+=q/2,i++){if(r()<.55)continue;const up=(i+j)%2===0;ctx.beginPath();if(up){ctx.moveTo(x,y+th);ctx.lineTo(x+q/2,y);ctx.lineTo(x+q,y+th);}else{ctx.moveTo(x,y);ctx.lineTo(x+q,y);ctx.lineTo(x+q/2,y+th);}ctx.closePath();ctx.fillStyle=r()<.5?k.t1:k.t2;ctx.fill();}return;}
   if(v==='lines'){ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.15);ctx.beginPath();ctx.moveTo(w*.62,0);ctx.lineTo(w,h*.48);ctx.moveTo(w*.7,0);ctx.lineTo(w*.7,h);ctx.moveTo(0,h*.82);ctx.lineTo(w,h*.82);ctx.stroke();ctx.beginPath();ctx.arc(w*.7,h*.82,m*.12,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(w*.86,h*.26,s*.9,0,TAU);ctx.fillStyle=k.e1s;ctx.fill();return;}
   ctx.beginPath();ctx.arc(w*.82,h*.2,m*.2,0,TAU);ctx.fillStyle=k.e1l;ctx.fill();ctx.beginPath();ctx.moveTo(0,h);ctx.arc(0,h,m*.32,-Math.PI/2,0);ctx.closePath();ctx.fillStyle=k.t2;ctx.fill();
   ctx.fillStyle=k.e1m;ctx.fillRect(w*.56,h*.42,w*.36,Math.max(2,s*1.3));ctx.beginPath();ctx.arc(w*.22,h*.86,m*.08,Math.PI,0);ctx.fillStyle=k.e1s;ctx.fill();ctx.fillStyle=k.t1;ctx.fillRect(w*.04,h*.04,m*.12,m*.12);},
 helix(ctx,w,h,s,k,r,v){const m=Math.min(w,h),ph=r()*TAU;
   /* a strand point: a is the phase, z>0 is the side facing the viewer */
   if(v==='dots'){const cx=w*.84,A=Math.min(w*.1,m*.16),L=Math.max(h*.42,A*4),dy=L/16,D=[];
     for(let y=-dy;y<h+dy;y+=dy){const a=y/L*TAU+ph;for(let j=0;j<2;j++){const b=a+j*Math.PI,z=Math.cos(b);D.push([cx+Math.sin(b)*A,y,z,s*(.45+.5*(z+1)),mix(k.e1l,k.e1,(z+1)/2)]);}
       if(Math.round(y/dy)%2===0){const x0=cx+Math.sin(a)*A,x1=cx-Math.sin(a)*A;for(let q=1;q<4;q++)D.push([x0+(x1-x0)*q/4,y,-1.1,s*.3,k.t1]);}}
     D.sort((p,q)=>p[2]-q[2]).forEach(([x,y,z,rad,col])=>{ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fillStyle=col;ctx.fill();});return;}
   if(v==='strands'){const cy=h*.74,A=Math.min(h*.1,s*8),L=Math.max(w*.55,A*6),n=4;ctx.lineCap='round';
     ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.12);ctx.beginPath();for(let x=0;x<=w;x+=L/14){ctx.moveTo(x,cy-A*Math.abs(Math.sin(x/L*TAU+ph)));ctx.lineTo(x,cy+A*Math.abs(Math.sin(x/L*TAU+ph)));}ctx.stroke();
     for(let i=0;i<n;i++){ctx.strokeStyle=i%2?k.e1l:k.e1s;ctx.lineWidth=Math.max(1,s*(i%2?.2:.3));ctx.beginPath();for(let x=0;x<=w;x+=w/120){const y=cy+Math.sin(x/L*TAU+ph+i/n*TAU)*A;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}return;}
   if(v==='ribbon'){ctx.save();ctx.translate(0,h*.92);ctx.rotate(-Math.atan2(h*.45,w));const len=Math.hypot(w,h*.45),A=Math.min(h*.1,s*9),L=A*6;
     const node=n=>(n*Math.PI-ph)/TAU*L;let n=Math.floor(ph/Math.PI)-1;
     for(;node(n)<len+L;n++){const x0=node(n),x1=node(n+1);if(x1<-L)continue;ctx.beginPath();for(let t=0;t<=24;t++){const x=x0+(x1-x0)*t/24;const y=Math.sin(x/L*TAU+ph)*A;t?ctx.lineTo(x,y):ctx.moveTo(x,y);}
       for(let t=24;t>=0;t--){const x=x0+(x1-x0)*t/24;ctx.lineTo(x,-Math.sin(x/L*TAU+ph)*A);}ctx.closePath();ctx.fillStyle=n%2?k.e1l:k.e1m;ctx.fill();ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.15);ctx.stroke();}
     ctx.restore();return;}
   /* double helix: back halves of the strands, then the base pairs, then the front halves */
   ctx.save();ctx.translate(0,h*.82);ctx.rotate(-Math.atan2(h*.22,w));const len=Math.hypot(w,h*.22),A=Math.min(h*.09,s*7),L=Math.max(w*.36,A*5),st=L/90;ctx.lineCap='round';
   const strand=front=>{for(let j=0;j<2;j++)for(let x=-A*2;x<len+A*2;x+=st){const a=x/L*TAU+ph+j*Math.PI,z=Math.cos(a+st/L*Math.PI);if((z>=0)!==front)continue;
     ctx.beginPath();ctx.moveTo(x,Math.sin(a)*A);ctx.lineTo(x+st,Math.sin(a+st/L*TAU)*A);ctx.strokeStyle=front?k.e1:k.e1l;ctx.lineWidth=s*(front?.9:.6);ctx.stroke();}};
   strand(false);ctx.lineWidth=Math.max(1,s*.35);
   for(let x=-A*2;x<len+A*2;x+=L/12){const y=Math.sin(x/L*TAU+ph)*A;if(Math.abs(y)<A*.12)continue;ctx.strokeStyle=k.e1m;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,0);ctx.stroke();ctx.strokeStyle=k.e2s;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,-y);ctx.stroke();}
   strand(true);ctx.restore();},
 molecule(ctx,w,h,s,k,r,v){const m=Math.min(w,h);
   if(v==='network'){const P=[];for(let i=0;i<18;i++)P.push([r()*w,r()*h,s*(1+r()*2.2)]);ctx.strokeStyle=k.e1l;ctx.lineWidth=Math.max(1,s*.3);
     P.forEach((p,i)=>{P.map((q,j)=>[Math.hypot(p[0]-q[0],p[1]-q[1]),j]).filter(d=>d[1]!==i).sort((a,b)=>a[0]-b[0]).slice(0,2).forEach(([,j])=>{ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(P[j][0],P[j][1]);ctx.stroke();});});
     P.forEach(([x,y,rad],i)=>{ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fillStyle=[k.e1s,k.e2s,k.e1m][i%3];ctx.fill();ctx.beginPath();ctx.arc(x-rad*.3,y-rad*.3,rad*.28,0,TAU);ctx.fillStyle=rgba(k.bg,.5);ctx.fill();});return;}
   if(v==='cells'){const C=[];for(let i=0;i<60&&C.length<8;i++){const rad=m*(.05+r()*.09),x=r()*w,y=r()<.5?r()*h*.28:h*(.72+r()*.28);if(C.some(([cx,cy,cr])=>Math.hypot(x-cx,y-cy)<rad+cr+s))continue;C.push([x,y,rad]);}
     for(const[x,y,rad]of C){ctx.beginPath();ctx.arc(x,y,rad,0,TAU);ctx.fillStyle=k.t1;ctx.fill();ctx.strokeStyle=k.e1l;ctx.lineWidth=Math.max(1,s*.45);ctx.stroke();
       const a=r()*TAU;ctx.beginPath();ctx.arc(x+Math.cos(a)*rad*.25,y+Math.sin(a)*rad*.25,rad*.32,0,TAU);ctx.fillStyle=k.e1l;ctx.fill();}return;}
   /* hexagon rings sharing edges, with atoms at the corners and a few side groups */
   const rings=(cx,cy,R,cells)=>{ctx.lineJoin='round';cells.forEach(([q,p],c)=>{const x=cx+1.5*R*q,y=cy+Math.sqrt(3)*R*(p+q/2),V=[];for(let i=0;i<6;i++)V.push([x+Math.cos(i*Math.PI/3)*R,y+Math.sin(i*Math.PI/3)*R]);
       polyline(ctx,V);ctx.closePath();ctx.strokeStyle=k.e1s;ctx.lineWidth=Math.max(1,s*.35);ctx.stroke();ctx.lineWidth=Math.max(1,s*.25);
       for(let i=c%2;i<6;i+=2){const a=V[i],b=V[(i+1)%6],f=.72;ctx.beginPath();ctx.moveTo(x+(a[0]-x)*f+(b[0]-a[0])*.15,y+(a[1]-y)*f+(b[1]-a[1])*.15);ctx.lineTo(x+(b[0]-x)*f-(b[0]-a[0])*.15,y+(b[1]-y)*f-(b[1]-a[1])*.15);ctx.stroke();}
       V.forEach(([vx,vy])=>{ctx.beginPath();ctx.arc(vx,vy,s*.6,0,TAU);ctx.fillStyle=k.e1m;ctx.fill();});
       if(c===cells.length-1){const[vx,vy]=V[0];ctx.strokeStyle=k.e1s;ctx.beginPath();ctx.moveTo(vx,vy);ctx.lineTo(vx+R*.8,vy);ctx.stroke();ctx.beginPath();ctx.arc(vx+R*.8,vy,s*1.3,0,TAU);ctx.fillStyle=k.e1l;ctx.fill();ctx.stroke();}});};
   rings(w*.64,h*.1,m*.085,[[0,0],[1,0],[1,1],[2,0]]);rings(w*.06,h*.8,m*.07,[[0,0],[1,0]]);},
 pulse(ctx,w,h,s,k,r,v){
   if(v==='wave'){const cy=h*.8,H=Math.min(h*.16,s*15),bw=s*2.4,n=Math.floor(w/bw);ctx.lineCap='round';ctx.lineWidth=s*1.1;
     for(let i=0;i<n;i++){const x=(i+.5)*bw,env=Math.pow(Math.sin(Math.PI*(i+.5)/n),.6),t=env*H*(.25+.75*r());ctx.strokeStyle=t>H*.6?k.e1s:t>H*.3?k.e1l:k.t1;ctx.beginPath();ctx.moveTo(x,cy-t);ctx.lineTo(x,cy+t);ctx.stroke();}return;}
   if(v==='sine'){const n=5;for(let i=0;i<n;i++){const cy=h*(.56+i*.09),L=w/(1.4+i*1.3),A=Math.min(s*2.6,h*.035);ctx.strokeStyle=mix(k.e1l,k.e1,i/(n-1));ctx.lineWidth=Math.max(1,s*.3);ctx.beginPath();
       for(let x=0;x<=w;x+=w/160){const y=cy+Math.sin(x/L*TAU+i*.7)*A;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}return;}
   /* heartbeat trace: flat, P bump, QRS spike, T bump, per beat */
   const cy=h*.8,A=Math.min(h*.16,s*13),bw=Math.max(w*.3,s*26),B=[[0,0],[.16,0],[.21,-.1],[.27,0],[.36,0],[.39,.12],[.43,-1],[.47,.34],[.51,0],[.62,0],[.7,-.18],[.79,0],[1,0]],x0=-bw*r(),pts=[];
   for(let x=x0;x<w+bw;x+=bw)B.forEach(([t,y])=>pts.push([x+t*bw,cy+y*A]));ctx.lineJoin='round';ctx.lineCap='round';
   ctx.strokeStyle=k.e1l;ctx.lineWidth=s*1.4;polyline(ctx,pts);ctx.stroke();ctx.strokeStyle=k.e1;ctx.lineWidth=Math.max(1,s*.45);polyline(ctx,pts);ctx.stroke();},
 smoke(ctx,w,h,s,k,r,v){const c=k.c.head;
   if(v==='wisps'){ctx.lineCap='round';for(let i=0;i<6;i++){const x0=w*(.1+r()*.8),ph=r()*TAU,f=2+r()*2;let px=x0,py=h;for(let j=1;j<=60;j++){const t=j/60,y=h-t*h*.85,x=x0+Math.sin(t*f*Math.PI+ph)*w*.08*t+t*w*.05;ctx.strokeStyle=rgba(c,(.08+.4*k.k)*(1-t*.8));ctx.lineWidth=s*(.7-t*.5);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(x,y);ctx.stroke();px=x;py=y;}}return;}
   if(v==='grain'){const n=9000,q=Math.max(1,s*.22);for(let i=0;i<n;i++){ctx.fillStyle=i%2?rgba(c,.05+.14*k.k):rgba(k.bg,.25);ctx.fillRect(r()*w,r()*h,q,q);}return;}
   for(let i=0;i<8;i++){const x=w*r(),y=h*(.6+r()*.4),R=Math.min(w,h)*(.18+r()*.2);ctx.save();ctx.translate(x,y);ctx.scale(3,1);const g=ctx.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,rgba(c,.03+.11*k.k));g.addColorStop(1,rgba(c,0));ctx.fillStyle=g;ctx.fillRect(-R,-R,R*2,R*2);ctx.restore();}}
};
/* Styles by id, and families in catalog order. */
const GV={};GRAPHICS.forEach(g=>GV[g.id]=g);
const styleOf=g=>g.id===g.fam?'':g.id.slice(g.fam.length+1);
function drawGraphic(ctx,id,R,c,strength,seed){const g=GV[id];if(!g||!G[g.fam]||strength<=0)return;ctx.save();ctx.beginPath();ctx.rect(R.x,R.y,R.w,R.h);ctx.clip();ctx.translate(R.x,R.y);
  const k=clamp(strength,0,1),a=lerp(.07,.42,k),e=lerp(.3,1,k);
  const K={k,bg:c.bg,c,t1:mix(c.bg,c.accent,a),t2:mix(c.bg,c.head,a*.75),e1:mix(c.bg,c.accent,e),e1s:mix(c.bg,c.accent,e*.7),e1m:mix(c.bg,c.accent,e*.5),e1l:mix(c.bg,c.accent,e*.28),e2s:mix(c.bg,c.head,e*.22)};
  G[g.fam](ctx,R.w,R.h,Math.sqrt(R.w*R.h)/100,K,rng(seed),styleOf(g));ctx.restore();}

/* ---------- shared layout parts ---------- */
function contentBox(W,H,fmt,u){if(fmt.center)return{x:(W-fmt.center.w)/2,y:(H-fmt.center.h)/2,w:fmt.center.w,h:fmt.center.h};
  const s=fmt.safe||{top:0,bottom:0,left:0,right:0};const pad=Math.min(6.5*u,H*.15,W*.09);
  const l=Math.max(pad,s.left+2.5*u),r=Math.max(pad,s.right+2.5*u),t=Math.max(pad,s.top+2.5*u),b=Math.max(pad,s.bottom+2.5*u);
  return{x:l,y:t,w:W-l-r,h:H-t-b};}
function brandMark(ctx,S,x,y,h,color,maxW,align){if(S.noMark)return 0;if(S.logo){return logoAt(ctx,S,align==='center'?x-maxW/2:x,y,maxW,h,align==='center'?'center':'left');}
  const f=fitText(ctx,S.brand.name,S.type.display,maxW,h*1.3,h*.86,h*.4,1.05,0);if(!f.lines.length)return 0;f.lines=[f.lines[0]];drawFit(ctx,f,x,y+(h-f.px*1.05)/2,color,align);return f.w;}
function brandRow(ctx,S,b,u,color,muted){const car=S.fmt.media==='carousel',showH=!S.noHandle&&!!S.brand.handle;if(S.noMark&&!car&&!showH)return 0;
  const h=Math.min(4.2*u,b.h*.16);const y=b.y+b.h-h;brandMark(ctx,S,b.x,y,h,color,b.w*.5,'left');
  const px=Math.min(2.3*u,h*.6);setFont(ctx,S.type.body,px,0);ctx.fillStyle=muted;ctx.textAlign='right';ctx.textBaseline='alphabetic';
  if(S.fmt.media==='carousel'){ctx.fillText('Swipe',b.x+b.w-px*1.3,y+h/2+px*.34);ctx.strokeStyle=muted;ctx.lineWidth=px*.13;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();const ax=b.x+b.w-px*.7,ay=y+h/2;ctx.moveTo(ax,ay-px*.36);ctx.lineTo(ax+px*.4,ay);ctx.lineTo(ax,ay+px*.36);ctx.stroke();}
  else if(showH){if(recFlat(ctx))REC.push({k:'text',text:S.brand.handle,ax:b.x+b.w,y:y+h/2+px*.34-px*.8,w:ctx.measureText(S.brand.handle).width,size:px,lh:1,track:0,family:S.type.body.family,weight:S.type.body.weight,color:muted,align:'right'});else ctx.fillText(S.brand.handle,b.x+b.w,y+h/2+px*.34);}return h;}
function pill(ctx,S,text,x,y,u,bg,fg,align){if(!text)return{w:0,h:0};const px=2.6*u,h=6*u,padX=3.2*u;setFont(ctx,S.type.body,px,0);const tw=ctx.measureText(text).width,w=tw+padX*2;const px0=align==='right'?x-w:x;
  if(recFlat(ctx)){REC.push({k:'rect',x:px0,y,w,h,radius:h/2,fill:bg,name:'Button'},{k:'text',text,ax:px0+padX,y:y+h/2+px*.35-px*.8,w:tw,size:px,lh:1,track:0,family:S.type.body.family,weight:S.type.body.weight,color:fg,align:'left'});return{w,h};}
  rr(ctx,px0,y,w,h,h/2);ctx.fillStyle=bg;ctx.fill();ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(text,px0+padX,y+h/2+px*.35);return{w,h};}
function chip(ctx,S,text,x,y,u,bg,fg){if(!text)return 0;const px=2.1*u,h=4.4*u,padX=1.8*u;setFont(ctx,S.type.body,px,.1);const t=text.toUpperCase(),tw=ctx.measureText(t).width;
  if(recFlat(ctx)){REC.push({k:'rect',x,y,w:tw+padX*2,h,radius:h*.28,fill:bg,name:'Label'},{k:'text',text:t,ax:x+padX,y:y+h/2+px*.36-px*.8,w:tw,size:px,lh:1,track:.1,family:S.type.body.family,weight:S.type.body.weight,color:fg,align:'left'});if('letterSpacing'in ctx)ctx.letterSpacing='0px';return h;}
  rr(ctx,x,y,tw+padX*2,h,h*.28);ctx.fillStyle=bg;ctx.fill();ctx.fillStyle=fg;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(t,x+padX,y+h/2+px*.36);if('letterSpacing'in ctx)ctx.letterSpacing='0px';return h;}
function eyebrowFit(ctx,S,text,maxW,u){return fitText(ctx,(text||'').toUpperCase(),S.type.body,maxW,2.4*u*1.3*2,2.4*u,1.7*u,1.3,.12);}
function stack(blocks,y,gap){for(const b of blocks){if(!b||!b.h)continue;b.draw(y);y+=b.h+(b.gap===undefined?gap:b.gap);}return y;}
function stackH(blocks,gap){let t=0,n=0;for(const b of blocks){if(!b||!b.h)continue;t+=b.h+(b.gap===undefined?gap:b.gap);n++;}return n?t-gap:0;}
function darkOf(p){let d=[p.text,p.primary,p.bg,p.accent].sort((a,b)=>lum(a)-lum(b))[0];return lum(d)>.06?mix(d,'#000000',.55):d;}
function photoOrPlaceholder(ctx,S,R){if(S.photo){drawImageCover(ctx,S.photo,R.x,R.y,R.w,R.h,S.fx,S.fy);if(S.tint){ctx.save();ctx.globalCompositeOperation='color';ctx.globalAlpha=S.tintAmt==null?.7:S.tintAmt;ctx.fillStyle=S.c.p.primary;ctx.fillRect(R.x,R.y,R.w,R.h);ctx.restore();}return true;}
  const c2=Object.assign({},S.c,{bg:S.c.surface});ctx.fillStyle=S.c.surface;ctx.fillRect(R.x,R.y,R.w,R.h);drawGraphic(ctx,S.graphic==='none'?'blobs':S.graphic,R,c2,Math.max(.7,S.gStrength),S.seed+3);
  if(S.preview){const u=Math.sqrt(R.w*R.h)/100,px=Math.max(11,2.6*u);ctx.font=`500 ${px}px ${FB.sans}`;if('letterSpacing'in ctx)ctx.letterSpacing='0px';const t='Your photo goes here',tw=ctx.measureText(t).width,h=px*2.2,x=R.x+(R.w-tw)/2-px,y=R.y+R.h*.42;rr(ctx,x,y,tw+px*2,h,h/2);ctx.fillStyle=rgba(S.c.onSurface,.82);ctx.fill();ctx.fillStyle=S.c.surface;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText(t,x+px,y+h/2+px*.35);}
  return false;}
function accentBar(ctx,x,y,u,color,align){const w=7*u,h=.8*u;if(recFlat(ctx)){REC.push({k:'rect',x:align==='center'?x-w/2:x,y,w,h,radius:0,fill:color,name:'Accent bar'});return h;}ctx.fillStyle=color;ctx.fillRect(align==='center'?x-w/2:x,y,w,h);return h;}

/* ---------- layouts ---------- */
const L={
 announce(ctx,W,H,S,u,b){const c=S.c,ct=S.content,wide=W/H>1.45;ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,{x:0,y:0,w:W,h:H},c,S.gStrength,S.seed);
   const fh=brandRow(ctx,S,b,u,c.head,c.muted);const aw=wide?b.w*.64:b.w,ah=b.h-fh-3*u;
   const eb=eyebrowFit(ctx,S,ct.eyebrow,aw,u),hd=fitText(ctx,ct.headline,S.type.display,aw,ah*.56,(wide?9.5:11.5)*u,3.6*u,1.06,0),sb=fitText(ctx,ct.sub,S.type.body,aw*.94,ah*.22,3.3*u,2.1*u,1.36,0);
   const blocks=[{h:.8*u,gap:2.2*u,draw:y=>accentBar(ctx,b.x,y,u,c.accent)},{h:eb.h,gap:1.6*u,draw:y=>drawFit(ctx,eb,b.x,y,c.eyebrow)},{h:hd.h,gap:2.4*u,draw:y=>drawFit(ctx,hd,b.x,y,c.head)},{h:sb.h,gap:3.2*u,draw:y=>drawFit(ctx,sb,b.x,y,c.fg)},{h:ct.cta?6*u:0,draw:y=>pill(ctx,S,ct.cta,b.x,y,u,c.accent,c.onAccent)}];
   stack(blocks,b.y+Math.max(0,(ah-stackH(blocks,0))*.42),0);},
 quote(ctx,W,H,S,u,b){const c=S.c,ct=S.content,wide=W/H>1.45;ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,{x:0,y:0,w:W,h:H},c,S.gStrength,S.seed);
   const fh=brandRow(ctx,S,b,u,c.head,c.muted);const ah=b.h-fh-3*u,aw=wide?b.w*.8:b.w;const qpx=Math.min(20*u,ah*.3);
   const qt=fitText(ctx,ct.quote,S.type.display,aw,ah-qpx*.62-7*u,7.4*u,3*u,1.2,0),at=fitText(ctx,ct.attribution,S.type.body,aw-9*u,3.2*u*1.3*2,3*u,2*u,1.3,0);
   const blocks=[{h:qpx*.62,gap:1*u,draw:y=>{ctx.font=`700 ${qpx}px Georgia, serif`;if('letterSpacing'in ctx)ctx.letterSpacing='0px';ctx.fillStyle=c.eyebrow;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('“',b.x-qpx*.04,y+qpx*.86);}},{h:qt.h,gap:3*u,draw:y=>drawFit(ctx,qt,b.x,y,c.head)},{h:at.h,draw:y=>{ctx.fillStyle=c.accent;ctx.fillRect(b.x,y+at.px*.62,6*u,.5*u);drawFit(ctx,at,b.x+8*u,y,c.fg);}}];
   stack(blocks,b.y+Math.max(0,(ah-stackH(blocks,0))*.4),0);},
 photo(ctx,W,H,S,u,b){const c=S.c,ct=S.content,dk=darkOf(c.p),tc=bestOn(dk,[c.p.bg,c.p.text],4.5);photoOrPlaceholder(ctx,S,{x:0,y:0,w:W,h:H});
   const aw=W/H>1.45?b.w*.7:b.w;const hd=fitText(ctx,ct.headline,S.type.display,aw,b.h*.36,10.5*u,3.6*u,1.06,0),sb=fitText(ctx,ct.sub,S.type.body,aw*.94,b.h*.16,3.2*u,2.1*u,1.36,0);
   const ebH=ct.eyebrow?4.4*u:0,total=ebH+(ebH?2*u:0)+hd.h+(sb.h?1.8*u+sb.h:0);const top=b.y+b.h-total;
   const dm=S.dim==null?1:S.dim,sh=a=>Math.min(1,a*dm);
   let g=ctx.createLinearGradient(0,Math.max(0,top-14*u),0,H);g.addColorStop(0,rgba(dk,0));g.addColorStop(.45,rgba(dk,sh(.78)));g.addColorStop(1,rgba(dk,sh(.94)));ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   g=ctx.createLinearGradient(0,0,0,b.y+10*u);g.addColorStop(0,rgba(dk,sh(.62)));g.addColorStop(1,rgba(dk,0));ctx.fillStyle=g;ctx.fillRect(0,0,W,b.y+10*u);
   brandMark(ctx,S,b.x,b.y,Math.min(4.2*u,b.h*.14),tc,b.w*.5,'left');
   let y=top;if(ebH){chip(ctx,S,ct.eyebrow,b.x,y,u,c.accent,c.onAccent);y+=ebH+2*u;}y+=drawFit(ctx,hd,b.x,y,tc);if(sb.h){y+=1.8*u;drawFit(ctx,sb,b.x,y,mix(tc,dk,.12));}},
 split(ctx,W,H,S,u,b){const c=S.c,ct=S.content,wide=W/H>=1.15;const P=wide?{x:0,y:0,w:W*.44,h:H}:{x:0,y:0,w:W,h:H*.45},N=wide?{x:W*.44,y:0,w:W*.56,h:H}:{x:0,y:H*.45,w:W,h:H*.55};
   ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,N,c,S.gStrength,S.seed);photoOrPlaceholder(ctx,S,P);
   const pad=Math.min(5.5*u,N.h*.12);const x0=Math.max(N.x+pad,b.x),y0=Math.max(N.y+pad,b.y),x1=Math.min(N.x+N.w-pad,b.x+b.w),y1=Math.min(N.y+N.h-pad,b.y+b.h);const t={x:x0,y:y0,w:x1-x0,h:y1-y0};
   const fh=brandRow(ctx,S,t,u,c.head,c.muted);const ah=t.h-fh-2.4*u;
   const eb=eyebrowFit(ctx,S,ct.eyebrow,t.w,u),hd=fitText(ctx,ct.headline,S.type.display,t.w,ah*.52,8.6*u,3.2*u,1.07,0),sb=fitText(ctx,ct.sub,S.type.body,t.w,ah*.24,3*u,2*u,1.36,0);const showCta=ct.cta&&ah>30*u;
   const blocks=[{h:eb.h,gap:1.5*u,draw:y=>drawFit(ctx,eb,t.x,y,c.eyebrow)},{h:hd.h,gap:2*u,draw:y=>drawFit(ctx,hd,t.x,y,c.head)},{h:sb.h,gap:2.8*u,draw:y=>drawFit(ctx,sb,t.x,y,c.fg)},{h:showCta?6*u:0,draw:y=>pill(ctx,S,ct.cta,t.x,y,u,c.accent,c.onAccent)}];
   stack(blocks,t.y+Math.max(0,(ah-stackH(blocks,0))*.4),0);},
 tips(ctx,W,H,S,u,b){const c=S.c,ct=S.content;ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,{x:0,y:0,w:W,h:H},c,S.gStrength*.8,S.seed);
   const fh=brandRow(ctx,S,b,u,c.head,c.muted);const ah=b.h-fh-3*u;const items=[ct.item1,ct.item2,ct.item3].filter(Boolean);
   const ti=fitText(ctx,ct.listTitle,S.type.display,b.w,ah*.3,8*u,3.2*u,1.08,0);const d=Math.min(7.4*u,ah*.13),rowGap=2.6*u;
   const rows=items.map(t=>fitText(ctx,t,S.type.body,b.w-d-3*u,d*1.5,4.1*u,2.2*u,1.25,0));
   const blocks=[{h:.8*u,gap:2.2*u,draw:y=>accentBar(ctx,b.x,y,u,c.accent)},{h:ti.h,gap:4.4*u,draw:y=>drawFit(ctx,ti,b.x,y,c.head)}].concat(rows.map((f,i)=>({h:Math.max(d,f.h),gap:rowGap,draw:y=>{const hh=Math.max(d,f.h);ctx.beginPath();ctx.arc(b.x+d/2,y+hh/2,d/2,0,6.283);ctx.fillStyle=c.accent;ctx.fill();
     setFont(ctx,S.type.display,d*.5*(S.type.display.scale||1),0);ctx.fillStyle=c.onAccent;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(String(i+1),b.x+d/2,y+hh/2+d*.17);drawFit(ctx,f,b.x+d+3*u,y+(hh-f.h)/2,c.fg);
     if(i<rows.length-1){ctx.fillStyle=rgba(c.fg,.14);ctx.fillRect(b.x+d+3*u,y+hh+rowGap/2,b.w-d-3*u,Math.max(1,u*.12));}}})));
   stack(blocks,b.y+Math.max(0,(ah-stackH(blocks,0))*.38),0);},
 stat(ctx,W,H,S,u,b){const c=S.c,ct=S.content,wide=W/H>1.45;ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,{x:0,y:0,w:W,h:H},c,S.gStrength,S.seed);
   const fh=brandRow(ctx,S,b,u,c.head,c.muted);const ah=b.h-fh-3*u,aw=wide?b.w*.7:b.w;
   const st=fitText(ctx,ct.stat,S.type.display,aw,ah*.5,Math.min(44*u,ah*.5),8*u,.98,0);st.lines=st.lines.slice(0,1);st.h=st.px*.98;
   const lb=fitText(ctx,ct.statLabel,S.type.display,aw,ah*.24,5*u,2.4*u,1.14,0),sb=fitText(ctx,ct.sub,S.type.body,aw*.9,ah*.16,2.9*u,2*u,1.36,0);
   const numCol=contrast(c.accent,c.bg)>=3?c.accent:c.head;
   const blocks=[{h:st.h,gap:1.2*u,draw:y=>drawFit(ctx,st,b.x-st.px*.03,y,numCol)},{h:lb.h,gap:2.6*u,draw:y=>drawFit(ctx,lb,b.x,y,c.head)},{h:sb.h,draw:y=>drawFit(ctx,sb,b.x,y,c.muted)}];
   stack(blocks,b.y+Math.max(0,(ah-stackH(blocks,0))*.42),0);},
 promo(ctx,W,H,S,u,b){const c=S.c,ct=S.content,wide=W/H>1.3;ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,{x:0,y:0,w:W,h:H},c,S.gStrength,S.seed);
   const fh=brandRow(ctx,S,b,u,c.head,c.muted);const ah=b.h-fh-3*u;const d=wide?Math.min(ah*.78,b.w*.3):Math.min(b.w*.44,ah*.34);
   const cx=b.x+b.w-d/2,cy=wide?b.y+ah/2:b.y+d/2;
   if(ct.badge){ctx.save();ctx.translate(cx,cy);ctx.rotate(-.12);ctx.beginPath();ctx.arc(0,0,d/2,0,6.283);ctx.fillStyle=c.accent;ctx.fill();ctx.beginPath();ctx.arc(0,0,d/2-1.1*u,0,6.283);ctx.strokeStyle=rgba(c.onAccent,.35);ctx.lineWidth=Math.max(1,.22*u);ctx.stroke();
     const bt=fitText(ctx,ct.badge.split('/').map(s=>s.trim()).join('\n'),S.type.display,d*.7,d*.6,d*.26,d*.09,1.05,0);drawFit(ctx,bt,0,-bt.h/2,c.onAccent,'center');ctx.restore();}
   const aw=wide?b.w-d-5*u:b.w,ay=wide?b.y:b.y+d+3*u,ahh=wide?ah:ah-d-3*u;
   const hd=fitText(ctx,ct.headline,S.type.display,aw,ahh*.52,9.5*u,3.2*u,1.06,0),dt=fitText(ctx,ct.details,S.type.body,aw,ahh*.2,3.3*u,2.1*u,1.34,0);const showCta=ct.cta&&ahh>24*u;
   const blocks=[{h:hd.h,gap:2.2*u,draw:y=>drawFit(ctx,hd,b.x,y,c.head)},{h:dt.h,gap:3*u,draw:y=>drawFit(ctx,dt,b.x,y,c.fg)},{h:showCta?6*u:0,draw:y=>pill(ctx,S,ct.cta,b.x,y,u,c.head,bestOn(c.head,[c.bg,c.fg],4.5))}];
   const th=stackH(blocks,0);stack(blocks,wide?ay+Math.max(0,(ahh-th)*.45):ay+Math.max(0,ahh-th),0);},
 video(ctx,W,H,S,u,b){const c=S.c,ct=S.content,dk=darkOf(c.p),tc=bestOn(dk,[c.p.bg,c.p.text],4.5),wide=W/H>1.2;const has=photoOrPlaceholder(ctx,S,{x:0,y:0,w:W,h:H});
   const dm=S.dim==null?1:S.dim,sh=a=>Math.min(1,a*dm);
   ctx.fillStyle=rgba(dk,sh(has?.34:.5));ctx.fillRect(0,0,W,H);let g=ctx.createLinearGradient(0,H*.3,0,H);g.addColorStop(0,rgba(dk,0));g.addColorStop(1,rgba(dk,sh(.82)));ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   const aw=wide?b.w*.62:b.w;const ti=fitText(ctx,ct.videoTitle,S.type.display,aw,b.h*(wide?.6:.4),(wide?13:12)*u,4*u,1.03,0);const ebH=ct.eyebrow?4.4*u:0;const total=ebH+(ebH?2.2*u:0)+ti.h;
   let y=wide?b.y+(b.h-total)*.6:b.y+b.h-total-2*u;if(ebH){chip(ctx,S,ct.eyebrow,b.x,y,u,c.accent,c.onAccent);y+=ebH+2.2*u;}drawFit(ctx,ti,b.x,y,tc);
   const d=(wide?15:17)*u,px=wide?b.x+b.w-d*.75:b.x+b.w/2,py=wide?b.y+b.h/2:b.y+Math.max(d*.7,(b.h-total)*.45);
   ctx.beginPath();ctx.arc(px,py,d/2,0,6.283);ctx.fillStyle=c.accent;ctx.fill();ctx.beginPath();ctx.moveTo(px-d*.13,py-d*.2);ctx.lineTo(px+d*.23,py);ctx.lineTo(px-d*.13,py+d*.2);ctx.closePath();ctx.fillStyle=c.onAccent;ctx.fill();
   brandMark(ctx,S,b.x,b.y,Math.min(4.2*u,b.h*.12),tc,b.w*.5,'left');},
 banner(ctx,W,H,S,u,b){const c=S.c,ct=S.content;ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,{x:0,y:0,w:W,h:H},c,S.gStrength,S.seed);
   const cx=b.x+b.w/2,flat=b.w/b.h>4.2;const uu=Math.min(u,b.h/22);
   if(flat){const mh=b.h*.56,mw=brandMark(ctx,S,b.x,b.y+(b.h-mh)/2,mh,c.head,b.w*.42,'left');const tx=b.x+mw+5*uu;ctx.fillStyle=c.accent;ctx.fillRect(tx-2.5*uu,b.y+b.h*.24,Math.max(2,.5*uu),b.h*.52);
     const tg=fitText(ctx,ct.tagline,S.type.body,b.x+b.w-tx,b.h*.7,b.h*.26,b.h*.12,1.25,0);drawFit(ctx,tg,tx,b.y+(b.h-tg.h)/2,c.fg);return;}
   const mh=Math.min(b.h*.4,16*u),tg=fitText(ctx,ct.tagline,S.type.body,b.w*.86,b.h*.3,Math.min(4.6*u,b.h*.13),Math.min(2*u,b.h*.07),1.3,0);const gap=Math.min(3*u,b.h*.08),total=mh+gap+.8*uu+gap+tg.h;let y=b.y+(b.h-total)/2;
   if(S.logo)logoAt(ctx,S,b.x+b.w*.1,y,b.w*.8,mh,'center');else{const f=fitText(ctx,S.brand.name,S.type.display,b.w*.92,mh*1.2,mh*.92,mh*.3,1.02,0);f.lines=f.lines.slice(0,1);drawFit(ctx,f,cx,y+(mh-f.px*1.02)/2,c.head,'center');}
   y+=mh+gap;ctx.fillStyle=c.accent;ctx.fillRect(cx-5*uu,y,10*uu,.8*uu);y+=.8*uu+gap;drawFit(ctx,tg,cx,y,c.fg,'center');},
 avatar(ctx,W,H,S,u,b){const c=S.c,ct=S.content;ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);drawGraphic(ctx,S.graphic,{x:0,y:0,w:W,h:H},c,S.gStrength*.7,S.seed);
   if(S.logo){logoAt(ctx,S,W*.22,H*.22,W*.56,H*.56,'center');return;}
   const f=fitText(ctx,ct.monogram||S.brand.name.slice(0,2),S.type.display,W*.58,H*.5,H*.42,H*.14,1,0);f.lines=f.lines.slice(0,1);drawFit(ctx,f,W/2,H/2-f.px*.52,c.head,'center');
   ctx.fillStyle=c.accent;ctx.fillRect(W/2-W*.09,H*.5+f.px*.42,W*.18,H*.014);}
};

/* ---------- platform guides (preview only, never exported) ---------- */
function drawGuides(ctx,W,H,fmt){const col='rgba(226,0,116,',u=Math.sqrt(W*H)/100,px=Math.max(12,1.7*u);const label=(t,x,y,al)=>{ctx.font=`600 ${px}px ${FB.sans}`;if('letterSpacing'in ctx)ctx.letterSpacing='0px';ctx.textAlign=al||'left';ctx.textBaseline='alphabetic';const tw=ctx.measureText(t).width,xx=al==='center'?x-tw/2:x;ctx.fillStyle='rgba(255,255,255,.92)';rr(ctx,xx-px*.5,y-px*1.05,tw+px,px*1.5,px*.3);ctx.fill();ctx.fillStyle='rgb(190,0,98)';ctx.textAlign='left';ctx.fillText(t,xx,y);};
  const band=(x,y,w,h)=>{if(w<=0||h<=0)return;ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle=col+'.11)';ctx.fillRect(x,y,w,h);ctx.strokeStyle=col+'.38)';ctx.lineWidth=Math.max(1,u*.12);const st=u*2.6;ctx.beginPath();for(let i=-h;i<w+h;i+=st){ctx.moveTo(x+i,y+h);ctx.lineTo(x+i+h,y);}ctx.stroke();ctx.restore();};
  if(fmt.safe){const s=fmt.safe;band(0,0,W,s.top);band(0,H-s.bottom,W,s.bottom);band(0,s.top,s.left,H-s.top-s.bottom);band(W-s.right,s.top,s.right,H-s.top-s.bottom);if(s.top>px*2)label('Covered by the app',W/2,s.top/2+px*.4,'center');if(s.bottom>px*2)label('Covered by captions and buttons',W/2,H-s.bottom/2+px*.4,'center');}
  if(fmt.center){const c=fmt.center,x=(W-c.w)/2,y=(H-c.h)/2;ctx.fillStyle='rgba(20,20,24,.42)';ctx.fillRect(0,0,W,y);ctx.fillRect(0,y+c.h,W,H-y-c.h);ctx.fillRect(0,y,x,c.h);ctx.fillRect(x+c.w,y,x,c.h);ctx.strokeStyle=col+'.9)';ctx.lineWidth=Math.max(2,u*.2);ctx.strokeRect(x,y,c.w,c.h);label(c.label,W/2,y-px*.8,'center');}
  if(fmt.crop){const r=fmt.crop.r;let cw=W,ch=W/r;if(ch>H){ch=H;cw=H*r;}const x=(W-cw)/2,y=(H-ch)/2;ctx.setLineDash([u*1.4,u*1]);ctx.strokeStyle=col+'.9)';ctx.lineWidth=Math.max(2,u*.2);ctx.strokeRect(x+1,y+1,cw-2,ch-2);ctx.setLineDash([]);label(fmt.crop.label,x+px,y+px*1.8);}
  if(fmt.circle){ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.arc(W/2,H/2,Math.min(W,H)/2,0,6.283,true);ctx.fillStyle='rgba(20,20,24,.5)';ctx.fill('evenodd');ctx.restore();ctx.beginPath();ctx.arc(W/2,H/2,Math.min(W,H)/2-1,0,6.283);ctx.strokeStyle=col+'.9)';ctx.lineWidth=Math.max(2,u*.2);ctx.stroke();}}

/* S: {fmt,layout,p(colors),arrangement,type,graphic,gStrength,seed,content,brand,photo,logo,tint}
   Optional: fx,fy (photo focal point 0-1), tintAmt, dim (shade behind text on photo layouts),
   noMark, noHandle, logoRef (lets the recorder lift the logo onto its own layer). */
function renderDraft(ctx,W,H,S,opts){opts=opts||{};const u=Math.sqrt(W*H)/100;S.c=makeScheme(S.p,S.arrangement);S.preview=!!opts.preview;
  REC=opts.rec||null;ctx.save();ctx.clearRect(0,0,W,H);const b=contentBox(W,H,S.fmt,u);try{(L[S.layout]||L.announce)(ctx,W,H,S,u,b);}finally{REC=null;ctx.restore();}
  if('letterSpacing'in ctx)ctx.letterSpacing='0px';if(opts.guides)drawGuides(ctx,W,H,S.fmt);return S.c;}
