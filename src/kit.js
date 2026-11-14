/* ============================================================
   KIT: export a brand as a package other design tools can take in.
   Canva's Brand Kit Builder reads a brand-guidelines PDF, and its Brand Kit
   accepts PNG/SVG logos, hex colors and OTF/TTF/WOFF fonts, so the package is
   a guidelines PDF plus those raw ingredients.
   ============================================================ */
const Kit=(function(){
  const loaded={};
  function script(src){return loaded[src]||(loaded[src]=new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('load '+src));document.head.append(s);}));}
  const rgb=h=>hexToRgb(h);const ascii=s=>String(s==null?'':s).replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/[–—]/g,'-').replace(/·/g,'-').replace(/[^\x20-\x7E]/g,'');
  const palOf=b=>{const p=b.colors||{};return ROLES.map(([r,n])=>({role:n,key:r,hex:String(p[r]||'#000000').toUpperCase()}));};
  const toBlob=(c,t,q)=>new Promise(r=>c.toBlob(r,t||'image/png',q));
  async function wordmark(b,color){const t=TYP[b.typeId]||TYP.clear;await ensureType(t.id);const c=document.createElement('canvas');c.width=1600;c.height=420;const x=c.getContext('2d');let px=260;const name=t.display.upper?b.name.toUpperCase():b.name;
    do{x.font=`${t.display.weight} ${px}px "${t.display.family}", ${t.display.fb}`;px-=8;}while(x.measureText(name).width>1480&&px>40);x.fillStyle=color;x.textBaseline='middle';x.textAlign='center';x.fillText(name,800,215);return c;}
  async function specimen(b){const t=TYP[b.typeId]||TYP.clear;await ensureType(t.id);const P=b.colors,c=document.createElement('canvas');c.width=1500;c.height=560;const x=c.getContext('2d');x.fillStyle='#FFFFFF';x.fillRect(0,0,1500,560);x.fillStyle=contrast(P.primary,'#FFFFFF')>=3?P.primary:'#111111';x.textBaseline='alphabetic';
    x.font=`${t.display.weight} 150px "${t.display.family}", ${t.display.fb}`;x.fillText(t.display.upper?'AA BB CC 123':'Aa Bb Cc 123',20,160);
    x.font=`${t.display.weight} 76px "${t.display.family}", ${t.display.fb}`;const hl=(b.content&&b.content.headline)||b.name;x.fillText(t.display.upper?hl.toUpperCase():hl,20,290,1460);
    x.fillStyle='#222222';x.font=`${t.body.weight} 44px "${t.body.family}", ${t.body.fb}`;wrapLines(x,(b.content&&b.content.sub)||'Body text is set in this face. The quick brown fox jumps over the lazy dog.',1440).slice(0,2).forEach((s,i)=>x.fillText(s,20,390+i*60));
    x.fillStyle='#666666';x.font=`${t.body.weight} 36px "${t.body.family}", ${t.body.fb}`;x.fillText('ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',20,530,1460);return c;}
  function ase(cols){const blocks=cols.map(c=>{const name=c.name+'\0',len=2+name.length*2+4+12+2,buf=new DataView(new ArrayBuffer(6+len));let o=0;buf.setUint16(o,1);o+=2;buf.setUint32(o,len);o+=4;buf.setUint16(o,name.length);o+=2;for(const ch of name){buf.setUint16(o,ch.charCodeAt(0));o+=2;}'RGB '.split('').forEach(ch=>{buf.setUint8(o++,ch.charCodeAt(0));});rgb(c.hex).forEach(v=>{buf.setFloat32(o,v/255);o+=4;});buf.setUint16(o,2);return new Uint8Array(buf.buffer);});
    const head=new DataView(new ArrayBuffer(12));'ASEF'.split('').forEach((ch,i)=>head.setUint8(i,ch.charCodeAt(0)));head.setUint16(4,1);head.setUint16(6,0);head.setUint32(8,blocks.length);return new Blob([new Uint8Array(head.buffer),...blocks]);}
  function signals(b){const tg=tagPalette(Object.assign({},b.colors,{conv:{}})).tags;return topTags(tg,4).map(c=>CONCEPT_BY_ID[c].label);}
  async function guidelines(b,posts){await script('vendor/jspdf.umd.min.js');const{jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'letter'});const M=48,W=612;let y=64;const t=TYP[b.typeId]||TYP.clear,cols=palOf(b);
    const H=txt=>{pdf.setFont('helvetica','bold');pdf.setFontSize(13);pdf.setTextColor(20,20,24);pdf.text(ascii(txt).toUpperCase(),M,y,{charSpace:1});pdf.setDrawColor(200,200,205);pdf.line(M,y+6,W-M,y+6);y+=26;};
    const T=(txt,size,bold,gray)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size||10.5);pdf.setTextColor(gray?95:25,gray?95:25,gray?100:30);const ls=pdf.splitTextToSize(ascii(txt),W-2*M);pdf.text(ls,M,y);y+=ls.length*(size||10.5)*1.32;};
    pdf.setFont('helvetica','bold');pdf.setFontSize(27);pdf.setTextColor(20,20,24);pdf.text(ascii(b.name)+' brand guidelines',M,y);y+=20;T([b.handle,'Prepared '+new Date().toISOString().slice(0,10),'Exported from '+APP_NAME].filter(Boolean).join('  |  '),10,false,true);y+=14;
    H('Logo');let logoIm=b.logo?await Store.loadImage(b.logo):null;const lc=document.createElement('canvas');
    if(logoIm){const s=Math.min(640/logoIm.naturalWidth,240/logoIm.naturalHeight,1);lc.width=Math.round(logoIm.naturalWidth*s*2);lc.height=Math.round(logoIm.naturalHeight*s*2);lc.getContext('2d').drawImage(logoIm,0,0,lc.width,lc.height);pdf.addImage(lc.toDataURL('image/png'),'PNG',M,y,lc.width/4,lc.height/4);y+=lc.height/4+10;T('Primary logo. Keep clear space around it equal to the height of one letter.',10,false,true);}
    else{const wm=await wordmark(b,contrast(b.colors.primary,'#FFFFFF')>=3?b.colors.primary:b.colors.text);pdf.addImage(wm.toDataURL('image/png'),'PNG',M-10,y,260,68);y+=76;T('Wordmark: the brand name set in '+t.display.family+'. No logo file has been added to this brand yet.',10,false,true);}
    y+=10;H('Brand colors');const sw=(W-2*M-4*10)/5;cols.forEach((c,i)=>{const x=M+i*(sw+10),[r,g,bb]=rgb(c.hex);pdf.setFillColor(r,g,bb);pdf.setDrawColor(190,190,195);pdf.rect(x,y,sw,58,'FD');pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);pdf.setTextColor(25,25,30);pdf.text(c.role,x,y+74);pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.text(c.hex,x,y+88);pdf.setTextColor(95,95,100);pdf.setFontSize(8.5);pdf.text(`RGB ${r}, ${g}, ${bb}`,x,y+100);});y+=118;
    T('Primary color: '+cols[2].hex+'. Accent color: '+cols[3].hex+'. Background color: '+cols[0].hex+'. Text color: '+cols[4].hex+'. Panel color: '+cols[1].hex+'.',10,false,true);
    (b.palettes||[]).slice(0,5).forEach(p=>{y+=4;pdf.setFont('helvetica','bold');pdf.setFontSize(10);pdf.setTextColor(25,25,30);pdf.text(ascii('Palette: '+p.name),M,y+10);ROLES.forEach(([r],i)=>{const[rr2,g,bb]=rgb(p[r]);pdf.setFillColor(rr2,g,bb);pdf.setDrawColor(190,190,195);pdf.rect(M+190+i*74,y,18,14,'FD');pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(60,60,66);pdf.text(p[r].toUpperCase(),M+212+i*74,y+10);});y+=20;});
    y+=14;if(y>560){pdf.addPage();y=64;}H('Typography');T('Heading font: '+t.display.family+', weight '+t.display.weight+(t.display.upper?', set in capitals':'')+'.',11,true);T('Body font: '+t.body.family+', weight '+t.body.weight+'.',11,true);T('Both are open-licensed Google Fonts. Font files are in the fonts folder of this kit.',10,false,true);y+=4;
    const sp=await specimen(b);pdf.addImage(sp.toDataURL('image/jpeg',.9),'JPEG',M,y,W-2*M,(W-2*M)*560/1500);y+=(W-2*M)*560/1500+18;
    if(y>690){pdf.addPage();y=64;}H('Brand voice');if(b.content&&b.content.tagline)T('Tagline: '+b.content.tagline,11,true);if(b.query)T('Brand keywords: '+b.query+'.');T('The brand colors signal: '+signals(b).join(', ')+'.',10,false,true);
    if(posts&&posts.length){pdf.addPage();y=64;H('Example posts');let x=M,rowH=0;for(const p of posts.slice(0,6)){const c=document.createElement('canvas');if(p.type==='free')await Free.renderDocTo(c,p.doc,300,300);else{await ensureType(p.s.typeId);renderTo(c,sane(p.s),300,300,{photo:p.photo?await Store.loadImage(p.photo):null,logo:logoIm});}
        const w=c.width/2*.55,h=c.height/2*.55;if(x+w>W-M){x=M;y+=rowH+26;rowH=0;}if(y+h>740){pdf.addPage();y=64;x=M;rowH=0;}pdf.addImage(c.toDataURL('image/jpeg',.88),'JPEG',x,y,w,h);pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);pdf.setTextColor(95,95,100);pdf.text(ascii(p.name).slice(0,34),x,y+h+11);x+=w+16;rowH=Math.max(rowH,h);}}
    return pdf.output('blob');}
  const README=(b,t,fonts)=>`${b.name} brand kit
Exported from ${APP_NAME} on ${new Date().toISOString().slice(0,10)}

WHAT IS IN THIS FOLDER
  Brand-guidelines.pdf    One document with the logo, colors, typefaces and brand keywords.
  colors/                 The palette as hex codes (txt), CSS variables, design tokens (json)
                          and an Adobe swatch file (ase).
  logo/                   The logo you uploaded, if any, and a wordmark in the heading typeface.
  fonts/                  ${fonts.length?'WOFF font files for the heading and body typefaces.':'(No font files could be added.)'}

CANVA
  Fastest: Brand > Brand Kit > create a new, empty Brand Kit > "Upload a PDF brand guidelines
  document" and choose Brand-guidelines.pdf. Canva's Brand Kit Builder reads the colors, fonts
  and guidelines from it. Review what it found before you save. (Paid Canva plans.)
  By hand: add each hex code from colors/hex-codes.txt under Colors; upload the PNG files in
  logo/ under Logos; under Fonts choose ${t.display.family}${t.body.family!==t.display.family?' and '+t.body.family:''} from Canva's list, or use
  "Upload a font" with the files in fonts/. Canva accepts OTF, TTF and WOFF one file at a time,
  not a zip.

ADOBE AND OTHERS
  colors/palette.ase loads into Adobe swatch panels and Creative Cloud Libraries.
  colors/tokens.json and colors/palette.css suit Figma token plugins and web projects.

FONT LICENSE
  ${t.display.family}${t.body.family!==t.display.family?' and '+t.body.family:''}: open-licensed Google Fonts (SIL Open Font License or Apache 2.0).
  The files here are the Latin subset. Get the complete families at https://fonts.google.com
`;
  async function zip(b,posts){await script('vendor/jszip.min.js');const z=new JSZip(),t=TYP[b.typeId]||TYP.clear,cols=palOf(b);
    z.file('Brand-guidelines.pdf',await guidelines(b,posts));
    const all=[{name:b.name+' current',cols}].concat((b.palettes||[]).map(p=>({name:p.name,cols:ROLES.map(([r,n])=>({role:n,key:r,hex:p[r].toUpperCase()}))})));
    z.file('colors/hex-codes.txt',all.map(p=>p.name+'\n'+p.cols.map(c=>'  '+c.role.padEnd(8)+c.hex).join('\n')).join('\n\n')+'\n');
    z.file('colors/palette.css',':root{\n'+cols.map(c=>`  --brand-${c.key==='bg'?'background':c.key}: ${c.hex};`).join('\n')+'\n}\n');
    z.file('colors/tokens.json',JSON.stringify({brand:b.name,color:Object.fromEntries(cols.map(c=>[c.key==='bg'?'background':c.key,{value:c.hex,type:'color'}])),palettes:Object.fromEntries(all.slice(1).map(p=>[p.name,Object.fromEntries(p.cols.map(c=>[c.key,c.hex]))])),font:{heading:{family:t.display.family,weight:t.display.weight},body:{family:t.body.family,weight:t.body.weight}}},null,2));
    z.file('colors/palette.ase',ase(all.flatMap((p,i)=>p.cols.map(c=>({name:(i?p.name+' ':'')+c.role,hex:c.hex})))));
    if(b.logo){const lb=await Store.refBlob(b.logo);if(lb)z.file('logo/logo.'+(/svg/.test(lb.type)?'svg':/jpe?g/.test(lb.type)?'jpg':'png'),lb);}
    const dark=lum(b.colors.primary)<lum(b.colors.bg)?b.colors.primary:b.colors.text,light=lum(b.colors.bg)>lum(b.colors.text)?b.colors.bg:b.colors.text;
    z.file('logo/wordmark-dark.png',await toBlob(await wordmark(b,dark)));z.file('logo/wordmark-light.png',await toBlob(await wordmark(b,light)));
    const fonts=[];for(const s of[t.display,t.body]){const slug=FONT_FILES[s.family];if(!slug||fonts.includes(slug+s.weight))continue;try{const r=await fetch(`fonts-woff/${slug}-${s.weight}.woff`);if(r.ok){z.file(`fonts/${s.family.replace(/\s+/g,'')}-${s.weight}.woff`,await r.blob());fonts.push(slug+s.weight);}}catch(e){}}
    z.file('README.txt',README(b,t,fonts));return await z.generateAsync({type:'blob'});}
  return{zip,guidelines};
})();
