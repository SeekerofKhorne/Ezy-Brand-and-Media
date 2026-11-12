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

/* ---------- graphics ---------- */
const G={
 waves(ctx,w,h,s,k,r){for(let i=0;i<3;i++){const base=h*(.78+i*.075),amp=Math.min(s*(4.6-i*1.1),h*.07),wl=w/(1.1+i*.55),ph=r()*6.28;ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,base);
   for(let x=0;x<=w;x+=w/72){ctx.lineTo(x,base+Math.sin(x/wl*6.283+ph)*amp+Math.sin(x/wl*13.5+ph*2)*amp*.22);}ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=[k.e1l,k.e2s,k.e1m][i];ctx.fill();}},
 ripples(ctx,w,h,s,k,r){const cx=w*(.78+r()*.12),cy=h*(.16+r()*.1),mx=Math.hypot(w,h);ctx.strokeStyle=k.t1;ctx.lineWidth=s*.42;for(let rad=s*5;rad<mx;rad+=s*5.2){ctx.beginPath();ctx.arc(cx,cy,rad,0,6.283);ctx.stroke();}},
 blobs(ctx,w,h,s,k,r){const m=Math.min(w,h);const spots=[[w*.92,h*.06,m*.34,k.e1s],[w*.04,h*.95,m*.3,k.e2s],[w*.78,h*.86,m*.16,k.t1]];
   for(const[cx,cy,rad,col]of spots){const n=7,pts=[];for(let i=0;i<n;i++){const a=i/n*6.283,q=rad*(.78+r()*.44);pts.push([cx+Math.cos(a)*q,cy+Math.sin(a)*q]);}
    ctx.beginPath();for(let i=0;i<n;i++){const p=pts[i],q=pts[(i+1)%n],mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2;if(i===0){const z=pts[n-1];ctx.moveTo((z[0]+p[0])/2,(z[1]+p[1])/2);}ctx.quadraticCurveTo(p[0],p[1],mx,my);}ctx.closePath();ctx.fillStyle=col;ctx.fill();}},
 circles(ctx,w,h,s,k,r){for(let i=0;i<9;i++){const x=r()*w,y=r()*h,rad=s*(3+r()*13);ctx.beginPath();ctx.arc(x,y,rad,0,6.283);if(i%3===2){ctx.strokeStyle=k.e1s;ctx.lineWidth=s*.5;ctx.stroke();}else{ctx.fillStyle=i%2?k.t1:k.t2;ctx.fill();}}},
 arches(ctx,w,h,s,k,r){const n=Math.max(3,Math.round(w/(Math.min(w,h)*.26))),aw=w/n;for(let i=0;i<n;i++){const ah=Math.min(h*(.2+r()*.2),h*.42),x=i*aw+aw*.08,ww=aw*.84,rad=ww/2,top=h-ah;ctx.beginPath();ctx.moveTo(x,h);ctx.lineTo(x,top+rad);ctx.arc(x+rad,top+rad,rad,Math.PI,0);ctx.lineTo(x+ww,h);ctx.closePath();ctx.fillStyle=[k.e1s,k.t2,k.e2s][i%3];ctx.fill();}},
 leaves(ctx,w,h,s,k,r){const m=Math.min(w,h);const leaf=(x,y,len,ang,col)=>{ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(len*.5,-len*.34,len,0);ctx.quadraticCurveTo(len*.5,len*.34,0,0);ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.moveTo(len*.06,0);ctx.lineTo(len*.9,0);ctx.strokeStyle=k.bg;ctx.lineWidth=Math.max(1,len*.018);ctx.stroke();ctx.restore();};
   for(let i=0;i<6;i++)leaf(w+m*.02,-m*.02,m*(.2+r()*.2),Math.PI*.5+i*.2+r()*.12,[k.e1s,k.e2s,k.t1][i%3]);
   for(let i=0;i<5;i++)leaf(-m*.02,h+m*.02,m*(.16+r()*.18),-Math.PI*.5+i*.24+r()*.12,[k.e2s,k.e1s,k.t2][i%3]);},
 glow(ctx,w,h,s,k,r){const m=Math.max(w,h);const spots=[[w*.85,h*.1,m*.6,k.c.accent],[w*.1,h*.95,m*.55,k.c.head],[w*.6,h*.7,m*.35,k.c.accent]];
   for(const[x,y,rad,col]of spots){const g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,rgba(col,.1+.4*k.k));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}},
 sunburst(ctx,w,h,s,k,r){const cx=w*(r()<.5?1:0),cy=0,n=22,R=Math.hypot(w,h);ctx.fillStyle=k.t1;for(let i=0;i<n;i+=2){const a0=i/n*Math.PI,a1=(i+1)/n*Math.PI;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a0,a1);ctx.closePath();ctx.fill();}
   ctx.beginPath();ctx.arc(cx,cy,Math.min(w,h)*.16,0,6.283);ctx.fillStyle=k.e1s;ctx.fill();},
 stripes(ctx,w,h,s,k,r){ctx.save();ctx.translate(w/2,h/2);ctx.rotate(-.62);const R=Math.hypot(w,h),sw=s*4.2;ctx.fillStyle=k.t1;for(let x=-R;x<R;x+=sw*2.4)ctx.fillRect(x,-R,sw,R*2);ctx.restore();},
 chevrons(ctx,w,h,s,k,r){const st=s*8;ctx.strokeStyle=k.t1;ctx.lineWidth=s*1.05;ctx.lineJoin='miter';for(let y=st*.5;y<h+st;y+=st)for(let x=0;x<w+st;x+=st){ctx.beginPath();ctx.moveTo(x-st*.3,y);ctx.lineTo(x,y-st*.3);ctx.lineTo(x+st*.3,y);ctx.stroke();}},
 shards(ctx,w,h,s,k,r){for(let i=0;i<16;i++){const x=w*(.45+r()*.65),y=r()*h,q=s*(6+r()*16),a=r()*6.283;ctx.beginPath();for(let j=0;j<3;j++){const b=a+j*2.094+r()*.7;ctx.lineTo(x+Math.cos(b)*q,y+Math.sin(b)*q);}ctx.closePath();ctx.fillStyle=[k.t1,k.t2,k.e1s][i%3];ctx.fill();}},
 peaks(ctx,w,h,s,k,r){for(let i=0;i<3;i++){const base=h*(.7+i*.09),amp=Math.min(h*.2,s*14)*(1-i*.22);ctx.beginPath();ctx.moveTo(0,h);let x=0;ctx.lineTo(0,base);while(x<w){x+=w*(.07+r()*.09);ctx.lineTo(x-w*.04,base-amp*(.35+r()*.65));ctx.lineTo(x,base-amp*r()*.25);}ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=[k.e1l,k.e2s,k.e1m][i];ctx.fill();}},
 topo(ctx,w,h,s,k,r){ctx.strokeStyle=k.t1;ctx.lineWidth=s*.34;const cs=[[w*(.2+r()*.2),h*(.25+r()*.2)],[w*(.75+r()*.15),h*(.7+r()*.2)]];
   for(const[cx,cy]of cs){const p1=r()*6.28,p2=r()*6.28;for(let i=1;i<=11;i++){const rad=i*s*4.6;ctx.beginPath();for(let a=0;a<=6.3;a+=.12){const q=rad*(1+.13*Math.sin(a*3+p1)+.07*Math.sin(a*5+p2+i*.3));const x=cx+Math.cos(a)*q,y=cy+Math.sin(a)*q;a?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.stroke();}}},
 grid(ctx,w,h,s,k,r){const st=s*6;ctx.strokeStyle=k.t1;ctx.lineWidth=Math.max(1,s*.16);ctx.beginPath();for(let x=st;x<w;x+=st){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=st;y<h;y+=st){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();},
 dots(ctx,w,h,s,k,r){const st=s*5;ctx.fillStyle=k.t1;for(let y=st/2;y<h;y+=st)for(let x=st/2;x<w;x+=st){ctx.beginPath();ctx.arc(x,y,s*.55,0,6.283);ctx.fill();}},
 halftone(ctx,w,h,s,k,r){const st=s*3.3,mx=Math.hypot(w,h)*.8;ctx.fillStyle=k.e1s;for(let y=st/2;y<h;y+=st)for(let x=st/2;x<w;x+=st){const d=Math.hypot(w-x,h-y)/mx;const rad=s*1.45*Math.pow(Math.max(0,1-d),1.6);if(rad>.4){ctx.beginPath();ctx.arc(x,y,rad,0,6.283);ctx.fill();}}},
 plus(ctx,w,h,s,k,r){const st=s*9,a=s*1.5,t=s*.55;ctx.fillStyle=k.t1;let row=0;for(let y=st/2;y<h;y+=st,row++)for(let x=(row%2?st:st/2);x<w;x+=st){ctx.fillRect(x-a,y-t/2,a*2,t);ctx.fillRect(x-t/2,y-a,t,a*2);}},
 growth(ctx,w,h,s,k,r){const n=7,bw=w*.055,gap=w*.022,x0=w-(n*(bw+gap))-w*.04,pts=[];for(let i=0;i<n;i++){const bh=h*(.08+.055*i+r()*.035),x=x0+i*(bw+gap);ctx.fillStyle=i%2?k.t1:k.t2;ctx.fillRect(x,h-bh,bw,bh);pts.push([x+bw/2,h-bh-h*.05]);}
   ctx.strokeStyle=k.e1;ctx.lineWidth=s*.75;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();
   const e=pts[n-1],d=pts[n-2],a=Math.atan2(e[1]-d[1],e[0]-d[0]),q=s*2.4;ctx.beginPath();ctx.moveTo(e[0]+Math.cos(a)*q,e[1]+Math.sin(a)*q);ctx.lineTo(e[0]+Math.cos(a+2.4)*q,e[1]+Math.sin(a+2.4)*q);ctx.lineTo(e[0]+Math.cos(a-2.4)*q,e[1]+Math.sin(a-2.4)*q);ctx.closePath();ctx.fillStyle=k.e1;ctx.fill();},
 frame(ctx,w,h,s,k,r){const m=Math.min(s*3.2,h*.09);ctx.strokeStyle=k.e1;ctx.lineWidth=Math.max(1.5,s*.3);ctx.strokeRect(m,m,w-2*m,h-2*m);ctx.lineWidth=Math.max(1,s*.12);const n=m+Math.min(s*1.2,h*.035);ctx.strokeRect(n,n,w-2*n,h-2*n);
   const q=Math.min(s*3,h*.08);for(const[cx,cy]of[[n,n],[w-n,n],[n,h-n],[w-n,h-n]]){ctx.beginPath();ctx.arc(cx,cy,q,0,6.283);ctx.fillStyle=k.bg;ctx.fill();ctx.stroke();}},
 sparkles(ctx,w,h,s,k,r){for(let i=0;i<15;i++){const x=r()*w,y=r()*h,q=s*(1.4+r()*r()*6.5);ctx.beginPath();ctx.moveTo(x,y-q);ctx.quadraticCurveTo(x,y,x+q,y);ctx.quadraticCurveTo(x,y,x,y+q);ctx.quadraticCurveTo(x,y,x-q,y);ctx.quadraticCurveTo(x,y,x,y-q);ctx.fillStyle=i%3?k.e1s:k.t2;ctx.fill();}},
 confetti(ctx,w,h,s,k,r){const cols=[k.c.accent,k.c.head,k.e1s,k.t2];for(let i=0;i<70;i++){const x=r()*w,y=r()*h*(r()<.6?.45:1),q=s*(.8+r()*1.6);ctx.save();ctx.translate(x,y);ctx.rotate(r()*6.283);ctx.globalAlpha=.25+.65*k.k;ctx.fillStyle=cols[i%4];const t=i%3;if(t===0)ctx.fillRect(-q,-q*.4,q*2,q*.8);else if(t===1){ctx.beginPath();ctx.arc(0,0,q*.6,0,6.283);ctx.fill();}else{ctx.beginPath();ctx.moveTo(0,-q);ctx.lineTo(q,q*.8);ctx.lineTo(-q,q*.8);ctx.closePath();ctx.fill();}ctx.restore();}},
 hearts(ctx,w,h,s,k,r){for(let i=0;i<13;i++){const x=r()*w,y=r()*h,q=s*(2.5+r()*6);ctx.save();ctx.translate(x,y);ctx.rotate((r()-.5)*.8);ctx.beginPath();ctx.moveTo(0,q*.9);ctx.bezierCurveTo(-q*1.5,-q*.2,-q*.6,-q*1.1,0,-q*.35);ctx.bezierCurveTo(q*.6,-q*1.1,q*1.5,-q*.2,0,q*.9);if(i%3===0){ctx.strokeStyle=k.e1s;ctx.lineWidth=s*.4;ctx.stroke();}else{ctx.fillStyle=i%2?k.t1:k.t2;ctx.fill();}ctx.restore();}},
 scribble(ctx,w,h,s,k,r){ctx.strokeStyle=k.e1s;ctx.lineWidth=s*.6;ctx.lineCap='round';ctx.lineJoin='round';
   for(let i=0;i<4;i++){const x0=r()*w*.7,y0=h*(.08+r()*.84),len=w*(.18+r()*.2),amp=s*(1.5+r()*3),loops=3+Math.floor(r()*4);ctx.beginPath();for(let t=0;t<=1.001;t+=.01){const x=x0+t*len+Math.sin(t*loops*6.283)*amp*.8,y=y0+Math.cos(t*loops*6.283)*amp+(r()-.5)*s*.25;t?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
   const cx=w*(.75+r()*.15),cy=h*(.2+r()*.1);ctx.beginPath();for(let a=0;a<12.6;a+=.15){const q=s*(2+a*.75);ctx.lineTo(cx+Math.cos(a)*q+(r()-.5)*s*.3,cy+Math.sin(a)*q*.8);}ctx.stroke();},
 stars(ctx,w,h,s,k,r){for(let i=0;i<90;i++){const x=r()*w,y=r()*h,q=s*(.12+r()*r()*.6);ctx.beginPath();ctx.arc(x,y,q,0,6.283);ctx.fillStyle=i%4?k.e1s:k.e1;ctx.fill();}
   for(let i=0;i<6;i++){const x=r()*w,y=r()*h*.7,q=s*(1.2+r()*2.2);ctx.beginPath();ctx.moveTo(x,y-q);ctx.quadraticCurveTo(x,y,x+q,y);ctx.quadraticCurveTo(x,y,x,y+q);ctx.quadraticCurveTo(x,y,x-q,y);ctx.quadraticCurveTo(x,y,x,y-q);ctx.fillStyle=k.e1;ctx.fill();}},
 rain(ctx,w,h,s,k,r){ctx.strokeStyle=k.t1;ctx.lineCap='round';for(let i=0;i<110;i++){const x=r()*w*1.1,y=r()*h,len=s*(2.5+r()*5);ctx.lineWidth=s*(.16+r()*.2);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-len*.26,y+len);ctx.stroke();}},
 bolts(ctx,w,h,s,k,r){ctx.lineJoin='miter';for(let i=0;i<3;i++){let x=w*(.55+r()*.42),y=-s;const pts=[[x,y]];while(y<h*(.45+r()*.4)){y+=h*(.05+r()*.08);x+=(r()-.62)*w*.09;pts.push([x,y]);y-=h*.012;x+=w*.03;pts.push([x,y]);}
   ctx.strokeStyle=[k.e1s,k.t1,k.e1m][i];ctx.lineWidth=s*(1.3-i*.3);ctx.beginPath();pts.forEach((p,j)=>j?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}},
 checker(ctx,w,h,s,k,r){const q=Math.min(h*.075,s*5);for(let row=0;row<2;row++)for(let i=0;i*q<w;i++){ctx.fillStyle=(i+row)%2?k.e2s:k.t1;ctx.fillRect(i*q,h-(row+1)*q,q+.5,q+.5);}}
};
function drawGraphic(ctx,id,R,c,strength,seed){if(!G[id]||strength<=0)return;ctx.save();ctx.beginPath();ctx.rect(R.x,R.y,R.w,R.h);ctx.clip();ctx.translate(R.x,R.y);
  const k=clamp(strength,0,1),a=lerp(.07,.42,k),e=lerp(.3,1,k);
  const K={k,bg:c.bg,c,t1:mix(c.bg,c.accent,a),t2:mix(c.bg,c.head,a*.75),e1:mix(c.bg,c.accent,e),e1s:mix(c.bg,c.accent,e*.7),e1m:mix(c.bg,c.accent,e*.5),e1l:mix(c.bg,c.accent,e*.28),e2s:mix(c.bg,c.head,e*.22)};
  G[id](ctx,R.w,R.h,Math.sqrt(R.w*R.h)/100,K,rng(seed));ctx.restore();}

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
