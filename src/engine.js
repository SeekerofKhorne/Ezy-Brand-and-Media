/* ============================================================
   ENGINE: color math, rule-based tagging, harmony, keyword search
   ============================================================ */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
function hexToRgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function rgbToHex(r,g,b){return'#'+[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();}
function mix(a,b,t){const A=hexToRgb(a),B=hexToRgb(b);return rgbToHex(lerp(A[0],B[0],t),lerp(A[1],B[1],t),lerp(A[2],B[2],t));}
function rgba(h,a){const c=hexToRgb(h);return`rgba(${c[0]},${c[1]},${c[2]},${a})`;}
function lum(h){const c=hexToRgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function hexToHsv(h){const[r,g,b]=hexToRgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let H=0;
  if(d){if(mx===r)H=((g-b)/d)%6;else if(mx===g)H=(b-r)/d+2;else H=(r-g)/d+4;H*=60;if(H<0)H+=360;}
  return{h:H,s:mx?d/mx:0,v:mx};}
function hsvToHex(h,s,v){h=((h%360)+360)%360;s=clamp(s,0,1);v=clamp(v,0,1);const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r=0,g=0,b=0;
  if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
  return rgbToHex((r+m)*255,(g+m)*255,(b+m)*255);}
function hexToLch(hex){const[r,g,b]=hexToRgb(hex).map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  const X=(.4124*r+.3576*g+.1805*b)/.95047,Y=.2126*r+.7152*g+.0722*b,Z=(.0193*r+.1192*g+.9505*b)/1.08883;const f=t=>t>.008856?Math.cbrt(t):7.787*t+16/116;
  const L=116*f(Y)-16,a=500*(f(X)-f(Y)),bb=200*(f(Y)-f(Z));let h=Math.atan2(bb,a)*180/Math.PI;if(h<0)h+=360;return{L,C:Math.hypot(a,bb),h};}
function validHex(s){return /^#?[0-9a-fA-F]{6}$/.test(s.trim());}

/* Hue family names follow the 12 color terms in Jonauskaite et al. 2020. */
function hueFamily(hex){const{h,s,v}=hexToHsv(hex);
  if(v<.17)return'black';
  if(s<.17)return v>.85?'white':(v<.3?'black':'gray');
  if(h>=12&&h<48&&v<.68&&s>.3)return'brown';
  if((h>=345||h<12)){if(v>.8&&s<.5)return'pink';return v<.58?'darkred':'red';}
  if(h<40)return'orange';if(h<68)return'yellow';if(h<165)return'green';if(h<195)return'turquoise';
  if(h<258)return'blue';if(h<295)return'purple';return'pink';}
const HUE_LABEL={black:'Black',white:'White',gray:'Gray',brown:'Brown',pink:'Pink',red:'Red',darkred:'Deep red',orange:'Orange',yellow:'Yellow',green:'Green',turquoise:'Turquoise',blue:'Blue',purple:'Purple'};

/* Hue rules: [concept, strength, reason, source]. Partly supported findings get lower strengths. */
const HUE_RULES={
 white:[['sincerity',.9,'White marks were rated more sincere','LM'],['relief',.8,'White pairs with relief across 30 nations','J20'],['calm',.35,'White pairs with relief, a quiet positive emotion','J20'],['modern',.5,'Open white space reads as clean and minimal','CONV']],
 pink:[['sophistication',.7,'Pink marks were rated more sophisticated','LM'],['sincerity',.45,'Pink was linked to sincerity (partly supported)','LM'],['love',.85,'Pink pairs with love across 30 nations','J20'],['joy',.5,'Pink pairs with joy','J20'],['pleasure',.7,'Pink pairs with pleasure across 30 nations','J20'],['delicate',.6,'Pink is used for delicate, feminine-coded brands','CONV'],['beauty',.5,'Common in beauty and skincare','CONV']],
 red:[['excitement',1,'Red marks were rated more exciting','LM'],['love',.7,'Red pairs with love across 30 nations','J20'],['anger',.75,'Red pairs with anger across 30 nations','J20'],['energy',.5,'Red is used to signal urgency','CONV'],['fear',.3,'Red is the standard danger and warning color','CONV'],['food',.3,'Common in food and quick-service brands','CONV']],
 darkred:[['traditional',.6,'Burgundy and oxblood read as established','CONV'],['sophistication',.35,'Deep reds are used for formal, premium brands','CONV'],['mystery',.4,'Blood red is a gothic convention','CONV'],['anger',.35,'Dark red keeps red’s link to anger, by convention','CONV']],
 orange:[['joy',.8,'Orange pairs with joy across 30 nations','J20'],['amusement',.8,'Orange pairs with amusement across 30 nations','J20'],['playful',.5,'Orange pairs with amusement','J20'],['excitement',.45,'Orange was expected to raise excitement (partly supported)','LM'],['food',.4,'Common in food brands','CONV']],
 yellow:[['joy',.9,'Yellow pairs with joy across 30 nations','J20'],['sincerity',.4,'Yellow was linked to sincerity (partly supported)','LM'],['energy',.3,'High-visibility yellow is used for attention','CONV'],['fear',.25,'Yellow and black is the hazard convention','CONV'],['interest',.3,'Highlighter yellow is used to draw the eye','CONV']],
 green:[['natural',.9,'Green is the default signal for nature','CONV'],['health',.6,'Common in health and wellness brands','CONV'],['ruggedness',.3,'Green was expected to raise ruggedness (partly supported)','LM'],['finance',.3,'Used for money and growth','CONV'],['relief',.3,'Green is the go and all-clear convention','CONV']],
 turquoise:[['water',.8,'Turquoise reads as water','CONV'],['calm',.45,'Aqua tones are a spa and wellness convention','CONV'],['health',.45,'Common in clinics and wellness brands','CONV']],
 blue:[['competence',1,'Blue marks were rated more competent','LM'],['calm',.4,'Blue was among the most pleasant hues, purple-blue among the least arousing','VM'],['water',.5,'Blue reads as water and sky','CONV'],['finance',.4,'Common in banking and insurance','CONV'],['tech',.35,'Common in software brands','CONV'],['admiration',.25,'Royal and navy blues are used for honors and institutions','CONV']],
 purple:[['sophistication',.9,'Purple marks were rated more sophisticated','LM'],['beauty',.3,'Used in beauty and wellness','CONV'],['mystery',.5,'Purple is a magic and occult convention','CONV'],['awe',.35,'Purple is used for the cosmic and magical','CONV'],['admiration',.3,'Purple is a royalty convention','CONV']],
 brown:[['ruggedness',1,'Brown marks were rated more rugged','LM'],['natural',.6,'Earth tones read as natural','CONV'],['human',.45,'Kraft and leather tones read as handmade','CONV'],['traditional',.4,'Brown reads as heritage','CONV'],['retro',.4,'Browns and ochres are a 1970s convention','CONV'],['food',.3,'Common for coffee, bakery and chocolate','CONV']],
 black:[['sophistication',1,'Black marks were rated more sophisticated','LM'],['sadness',.7,'Black pairs with sadness across 30 nations','J20'],['fear',.7,'Black pairs with fear across 30 nations','J20'],['anger',.55,'Black pairs with hate across 30 nations','J20'],['mystery',.8,'Black is the gothic and noir convention','CONV'],['modern',.3,'Black and white reads as minimal','CONV']],
 gray:[['sadness',.7,'Gray pairs with sadness and disappointment across 30 nations','J20'],['modern',.35,'Neutral gray reads as understated','CONV'],['tech',.25,'Common in hardware and software brands','CONV']]
};
const HUE_CAUTION={
 red:['Red pairs with both love and anger in the 30-nation data (in Nigeria, with fear too).','J20'],
 black:['Black also pairs with sadness, fear and hate in the 30-nation data.','J20'],
 gray:['Gray pairs with sadness and disappointment in the 30-nation data.','J20'],
 yellow:['Yellow was among the least pleasant hues in controlled tests, and Egypt did not link it with joy.','VM'],
 purple:['Purple had the least consistent meaning across nations; Greece linked it with sadness.','J20'],
 brown:['Brown lowered sophistication ratings and was the least emotional color across nations.','LM'],
 white:['China linked white with sadness as well as relief.','J20']
};

function newTags(){return{};}
function addTag(T,c,w,why,src){if(!(w>0))return;const t=T[c]||(T[c]={w:0,reasons:[]});t.w+=w;t.reasons.push({why,src,w});}
function finishTags(T){for(const c in T){const t=T[c];t.w=clamp(t.w,0,1.5);t.reasons.sort((a,b)=>b.w-a.w);t.src=t.reasons[0].src;t.tier=SRC[t.src].t;t.why=t.reasons[0].why;}return T;}

/* Pleasure, arousal, dominance from brightness (B) and saturation (S).
   Regression weights are Valdez & Mehrabian's (standardized variables).
   Assumption made here: HSV value and saturation stand in for the Munsell value
   and chroma they tested, centered at .62 and .42 with a spread of .25. */
function padFrom(B,S){const zb=(B-.62)/.25,zs=(S-.42)/.25;return{B,S,P:.69*zb+.22*zs,A:-.31*zb+.60*zs,D:-.76*zb+.32*zs};}
function padOf(p){const roles=[['primary',.4],['bg',.4],['accent',.2]];let B=0,S=0;for(const[r,w]of roles){const q=hexToHsv(p[r]);B+=w*q.v;S+=w*q.s;}return padFrom(B,S);}
const PAD_PHRASE={calm:'is pleasant and low in arousal',relief:'is pleasant, quiet and unassertive',pleasure:'scores as pleasant',joy:'is pleasant and stimulating',pride:'is pleasant, stimulating and dominant (the exuberant corner)',awe:'is pleasant and stimulating without dominance',interest:'is pleasant and stimulating without dominance',energy:'raises arousal',power:'raises dominance',anger:'is unpleasant, arousing and dominant (the hostile corner)',fear:'is unpleasant, arousing and submissive (the anxious corner)',shame:'is unpleasant, arousing and submissive (the anxious corner)',disgust:'is unpleasant, quiet and dominant (the disdainful corner)',sadness:'is unpleasant, quiet and submissive (the bored, sad corner)'};
function padLook(pad){const l=pad.B>.72?'Light':pad.B<.45?'Dark':'Mid-tone',s=pad.S>.55?'saturated':pad.S<.25?'low-saturation':'moderately saturated';return l+', '+s+' color';}
/* Score every concept that names a corner of pleasure-arousal-dominance space. */
function tagPad(T,pad,scale){const z=[pad.P,pad.A,pad.D];for(const c of CONCEPTS){if(!c.pad)continue;let sum=0,n=0,ok=true;for(let i=0;i<3;i++){if(!c.pad[i])continue;const v=c.pad[i]*z[i];if(v<.15){ok=false;break;}sum+=Math.min(v,2);n++;}
    if(ok&&n)addTag(T,c.id,clamp(sum/n*.45,0,.9)*(scale||1)*(c.id==='shame'||c.id==='interest'?.6:1),padLook(pad)+' '+PAD_PHRASE[c.id],'VM');}}

function tagPalette(p){const T=newTags();const roles=[['primary',.5],['bg',.3],['accent',.2]];const fams={};
  for(const[role,w]of roles){const fam=hueFamily(p[role]);fams[role]=fam;for(const[c,s,why,src]of(HUE_RULES[fam]||[]))addTag(T,c,s*w*1.6,why,src);}
  const pad=padOf(p);tagPad(T,pad,1);
  const ps=hexToHsv(p.primary),as=hexToHsv(p.accent);const sat=Math.max(ps.s*ps.v,as.s*as.v);
  if(sat>.62)addTag(T,'excitement',(sat-.5)*1.2,'High saturation raised excitement ratings','LM');
  if(pad.B<.5)addTag(T,'ruggedness',(.55-pad.B)*.9,'Darker marks were rated more rugged','LM');
  if(pad.B>.82&&pad.S<.3)addTag(T,'delicate',.4,'Pale tints read as light and airy','CONV');
  if(pad.B<.4&&hueFamily(p.bg)==='black')addTag(T,'sophistication',.3,'Dark grounds are a luxury convention','CONV');
  for(const c in(p.conv||{}))addTag(T,c,p.conv[c],'Palette built for this use','CONV');
  finishTags(T);const cautions=[];const seen={};
  for(const role of['primary','bg']){const f=fams[role];if(HUE_CAUTION[f]&&!seen[f]){seen[f]=1;cautions.push({text:HUE_CAUTION[f][0],src:HUE_CAUTION[f][1]});}}
  return{tags:T,cautions,pad,fams};}

/* One color on its own: same hue rules, and its own brightness and saturation. */
const colorTagCache={};
function tagColor(hex){hex=hex.toUpperCase();if(colorTagCache[hex])return colorTagCache[hex];const T=newTags(),fam=hueFamily(hex),q=hexToHsv(hex);
  for(const[c,s,why,src]of(HUE_RULES[fam]||[]))addTag(T,c,s,why,src);
  const pad=padFrom(q.v,q.s);tagPad(T,pad,.9);
  if(q.s*q.v>.62)addTag(T,'excitement',(q.s*q.v-.5)*1.2,'High saturation raised excitement ratings','LM');
  if(q.v<.42&&fam!=='black')addTag(T,'ruggedness',.4,'Darker marks were rated more rugged','LM');
  if(q.v>.9&&q.s<.3&&fam!=='white')addTag(T,'delicate',.4,'Pale tints read as light and airy','CONV');
  finishTags(T);return colorTagCache[hex]={tags:T,fam,pad,cautions:HUE_CAUTION[fam]?[{text:HUE_CAUTION[fam][0],src:HUE_CAUTION[fam][1]}]:[]};}

/* ---------- single-color library: 15 hues x 7 tones, plus neutrals ---------- */
const HUES=[['red',356],['vermilion',14],['orange',27],['amber',41],['yellow',53],['lime',82],['green',135],['teal',172],['cyan',189],['sky',205],['blue',222],['indigo',245],['violet',270],['magenta',312],['rose',336]];
const TONES=[['Pale',.2,.98],['Light',.38,.95],['Vivid',.85,.92],['Strong',.8,.7],['Deep',.72,.46],['Muted',.32,.66],['Dark',.6,.25]];
const COLORS=[];
HUES.forEach(([hn,h])=>TONES.forEach(([tn,s,v])=>COLORS.push({id:tn+'-'+hn,name:tn+' '+hn,hex:hsvToHex(h,s,v)})));
[['White','#FFFFFF'],['Warm white','#FAF6EE'],['Cool mist','#EEF1F5'],['Sand','#EADFCB'],['Silver','#BFC3C9'],['Stone','#8E8A84'],['Slate','#4A5560'],['Charcoal','#2B2D31'],['Ink','#121316'],['Black','#000000']].forEach(([n,h])=>COLORS.push({id:n,name:n,hex:h}));

/* ---------- harmony between two colors ----------
   Principles, not the authors' fitted equations:
   - harmony and pair preference fall as hue difference grows (Schloss & Palmer 2011);
   - same hue and similar chroma with a clear lightness step harmonize, lightness
     differences under about 15 L* hurt, lighter pairs do better (Ou & Luo 2006);
   - a contrasting hue is rated less harmonious but stands out more on its ground
     (Schloss & Palmer 2011, figural preference). */
function harmonyOf(a,b){const A=hexToLch(a),B=hexToLch(b);const neutral=A.C<10||B.C<10;let dH=Math.abs(A.h-B.h);if(dH>180)dH=360-dH;if(neutral)dH=0;const dL=Math.abs(A.L-B.L),dC=Math.abs(A.C-B.C);
  const sH=dH<=15?1:dH<=50?.78:dH<=100?.42:.22,sC=neutral?.6:1-Math.min(dC,80)/80,sL=dL<15?.25:dL<=60?1:.8,sS=(A.L+B.L)/200;
  const score=.45*sH+.2*sC+.25*sL+.1*sS;let rel,why,src;
  if(neutral){rel='Neutral partner';why='A neutral adds no competing hue; a clear lightness step raised harmony ratings';src='OL';}
  else if(dH<=15){rel='Same hue';why='Same hue with a clear lightness step was rated most harmonious';src='OL';}
  else if(dH<=50){rel='Neighboring hue';why='Pairs with similar hues were rated more harmonious and better liked';src='SP';}
  else{rel=dH>=150?'Opposite hue':'Contrasting hue';why='Strong hue contrast was rated less harmonious, but a contrasting color stands out more on its ground';src='SP';}
  return{score,rel,why,src,dH,dL,close:dL<15,level:score>=.72?'High':score>=.52?'Moderate':'Low'};}

/* Candidate partners for an anchor color, for a given role. */
function companions(anchor,role,ground,cw){const q=hexToHsv(anchor),out=[],seen={};const cs=Object.keys(cw||{});
  const push=(hex,label)=>{hex=hex.toUpperCase();if(seen[hex]||hex===anchor.toUpperCase())return;seen[hex]=1;const L=hexToLch(hex).L;
    if(role==='text'&&contrast(hex,ground)<4.5)return;if(role==='bg'&&!(L>80||L<28))return;
    if(role==='surface'){const k=contrast(hex,ground);if(k<1.04||k>1.7)return;}
    const hm=harmonyOf(anchor,hex),tg=tagColor(hex).tags;let kw=0;const matched=[];for(const c of cs){if(tg[c]&&tg[c].w>=.25){kw+=Math.min(1,tg[c].w)*cw[c];matched.push(c);}}
    matched.sort((x,y)=>tg[y].w-tg[x].w);const pop=contrast(hex,ground),sep=contrast(hex,anchor);let score=Math.min(1,kw/1.5)*.55+hm.score*.45;
    /* A partner that cannot be told apart from its neighbors is not usable, however harmonious. */
    if(role==='accent'){if(pop<1.5)score*=.3;else if(pop<3)score*=.8;if(sep<1.25)score*=.4;}
    if(role==='bg'&&sep<2.2)score*=sep<1.6?.3:.8;
    out.push({hex,label,hm,tags:tg,matched,kw,pop,sep,score});};
  const sat=Math.max(q.s,.25);
  for(const off of[0,25,-25,45,-45,180,150,-150,120,-120]){const h=q.h+off;
    push(hsvToHex(h,sat*.22,.98),'pale tint');push(hsvToHex(h,sat*.5,.95),'light');push(hsvToHex(h,Math.min(1,sat*1.05),Math.max(.55,Math.min(.95,q.v+.25))),'bright');
    push(hsvToHex(h,sat,q.v),'same strength');push(hsvToHex(h,sat*.45,.72),'muted');push(hsvToHex(h,Math.min(1,sat*1.05),.5),'deep');push(hsvToHex(h,sat*.8,.22),'dark shade');}
  [[.03,1,'tinted white'],[.06,.96,'tinted off-white'],[.08,.86,'tinted light gray'],[.1,.55,'tinted gray'],[.14,.24,'tinted charcoal'],[.18,.1,'tinted near-black']].forEach(([s,v,l])=>push(hsvToHex(q.h,s,v),l));
  push('#FFFFFF','white');push('#111111','near-black');
  out.sort((x,y)=>y.score-x.score);return out;}

function tagType(t){const T=newTags(),f=t.f,cautions=[];
  if(f.serif&&!f.slab){addTag(T,'traditional',.8,'Serif faces were rated stable, mature and formal','SCF');addTag(T,'competence',.55,'Serif faces were rated stable and practical','SCF');}
  if(f.sans&&!f.display){addTag(T,'modern',.5,'Plain sans serifs read as clean and current','CONV');addTag(T,'competence',.35,'Plain text faces fall in the directness persona','B03');}
  if(f.harmony){const h=f.harmony;addTag(T,'calm',.4*h,'Harmonious faces are reassuring and pleasing, less attention-grabbing','HGC');addTag(T,'relief',.35*h,'Harmonious faces are reassuring','HGC');addTag(T,'sincerity',.4*h,'Harmony in a typeface raised brand-personality ratings','GGP');addTag(T,'competence',.3*h,'Harmonious faces are reassuring','HGC');}
  if(f.natural){const n=f.natural;addTag(T,'warmth',.7*n,'Natural, hand-drawn forms are pleasing and reassuring','HGC');addTag(T,'pleasure',.4*n,'Natural, script-like faces were rated pleasing','HGC');addTag(T,'sincerity',.6*n,'Naturalness in a typeface raised brand-personality ratings','GGP');addTag(T,'human',.8*n,'Hand-drawn letterforms read as personal','CONV');}
  if(f.hand){addTag(T,'playful',.6,'Script and novelty faces were rated youthful and casual','SCF');addTag(T,'joy',.5,'Script and novelty faces were rated happy','SCF');addTag(T,'amusement',.35,'Script and novelty faces were rated happy and casual','SCF');addTag(T,'human',.5,'Handwriting reads as personal','CONV');cautions.push({text:'Hand-drawn faces are less prominent; keep headlines short.',src:'HGC'});}
  if(f.script){const s=f.script;addTag(T,'sophistication',.8*s,'Formal scripts fall in the elegance persona','B03');addTag(T,'delicate',.8*s,'Subtle, pleasing faces were rated feminine and delicate','HGC');addTag(T,'love',.45*s,'Script is a wedding and romance convention','CONV');cautions.push({text:'Elaborate faces engage but are less reassuring, and scripts are hard to read small.',src:'HGC'});}
  if(f.contrast)addTag(T,'sophistication',.65,'High-contrast serifs are a fashion and editorial convention','CONV');
  if(f.flourish&&!f.script)addTag(T,'sophistication',.4*f.flourish,'Flourish in a typeface raised brand-personality ratings','GGP');
  if(f.light)addTag(T,'delicate',.5*f.light,'Light strokes read as fine and subtle','HGC');
  if(f.heavy){const h=f.heavy;addTag(T,'power',.9*h,'Heavy faces are prominent and were rated strong','HGC');addTag(T,'ruggedness',.6*h,'Heavy faces were rated masculine and strong','HGC');addTag(T,'pride',.3*h,'Heavy faces are prominent and strong','HGC');}
  if(f.display&&f.heavy){addTag(T,'excitement',.45,'Bold display faces were rated assertive','SCF');addTag(T,'anger',.45*f.heavy,'Bold display faces were rated assertive, rude and coarse','SCF');}
  if(f.elaborate){addTag(T,'interest',.5*f.elaborate,'Elaborate faces are more engaging','HGC');addTag(T,'excitement',.3*f.elaborate,'Elaborate faces are more engaging','HGC');cautions.push({text:'Elaborate faces engage but are less pleasing and reassuring; use for a few words only.',src:'HGC'});}
  if(f.condensed)addTag(T,'energy',.5*f.condensed,'Condensed capitals are a headline and sports convention','CONV');
  if(f.rounded){const r=f.rounded;addTag(T,'warmth',.7*r,'Rounded, informal faces fall in the friendliness persona','B03');addTag(T,'playful',.55*r,'Rounded, informal faces fall in the friendliness persona','B03');addTag(T,'sincerity',.3*r,'Friendly faces read as approachable','CONV');}
  if(f.slab){addTag(T,'ruggedness',.6,'Slab serifs read as sturdy','CONV');addTag(T,'traditional',.4,'Slab serifs read as established','CONV');}
  if(f.geometric){addTag(T,'modern',.7,'Geometric sans serifs read as contemporary','CONV');addTag(T,'tech',.35,'Common in software brands','CONV');}
  if(f.mono){addTag(T,'tech',.85,'Monospace reads as code and data','CONV');cautions.push({text:'Monospaced faces were rated plain, dull and unimaginative.',src:'SCF'});}
  if(f.oldstyle){addTag(T,'traditional',.4,'Old-style serifs carry a bookish, literary convention','CONV');addTag(T,'admiration',.3,'Classical book faces signal learning and respect','CONV');}
  if(f.glyphic){addTag(T,'pride',.6,'Inscriptional capitals are the convention for monuments and honors','CONV');addTag(T,'admiration',.6,'Inscriptional capitals are the convention for monuments and honors','CONV');addTag(T,'sophistication',.6,'Roman capitals are a luxury convention','CONV');addTag(T,'awe',.35,'Monumental capitals read as grand','CONV');}
  if(f.memorial){addTag(T,'sadness',.4,'Light, formal serifs are a memorial convention','CONV');}
  if(f.western){addTag(T,'ruggedness',.9,'Western is one of Aaker’s ruggedness trait words; the lettering is its convention','CONV');addTag(T,'retro',.6,'Wood-type lettering is a period convention','CONV');}
  if(f.retro){addTag(T,'retro',.85*f.retro,'Lettering style tied to an earlier decade','CONV');}
  if(f.deco){addTag(T,'retro',.7,'Art Deco lettering evokes the 1920s','CONV');addTag(T,'sophistication',.6,'Art Deco is a glamour convention','CONV');addTag(T,'awe',.3,'Deco lettering is used for cinema and spectacle','CONV');}
  if(f.comic){addTag(T,'amusement',.9,'Comic lettering is the humor convention','CONV');addTag(T,'playful',.7,'Script and novelty faces were rated youthful and casual','SCF');addTag(T,'joy',.4,'Script and novelty faces were rated happy','SCF');}
  if(f.marker){addTag(T,'anger',.4,'Marker lettering is the protest-sign convention','CONV');addTag(T,'excitement',.4,'Marker lettering reads as urgent and unpolished','CONV');}
  if(f.stencil){addTag(T,'ruggedness',.7,'Stencil lettering is a military and industrial convention','CONV');addTag(T,'anger',.4,'Stencil lettering reads as combative','CONV');}
  if(f.futuristic){addTag(T,'tech',.9,'Squared, engineered letterforms are the science-fiction convention','CONV');addTag(T,'awe',.3,'Used for space and spectacle','CONV');}
  if(f.pixel){addTag(T,'retro',.9,'Pixel lettering evokes early video games','CONV');addTag(T,'tech',.6,'Pixel lettering reads as digital','CONV');addTag(T,'amusement',.4,'Game lettering reads as play','CONV');}
  if(f.blackletter){addTag(T,'mystery',.8,'Blackletter is the gothic convention','CONV');addTag(T,'traditional',.5,'Blackletter reads as old-world','CONV');addTag(T,'anger',.5,'Blackletter is a heavy-metal convention','CONV');addTag(T,'fear',.4,'Blackletter is used for the sinister','CONV');}
  if(f.horror){addTag(T,'fear',.95,'Dripping, distressed lettering is the horror convention','CONV');addTag(T,'mystery',.7,'Horror lettering reads as dark','CONV');addTag(T,'disgust',.4,'Dripping forms suggest decay','CONV');}
  if(f.typewriter){addTag(T,'retro',.8,'Typewritten text evokes the analog era','CONV');addTag(T,'mystery',.5,'Typewritten text is a case-file and noir convention','CONV');addTag(T,'human',.4,'Typewritten notes read as personal','CONV');addTag(T,'sadness',.3,'Typewritten notes can read as somber or confessional','CONV');addTag(T,'shame',.3,'Typewritten notes are a confession convention','CONV');addTag(T,'fear',.25,'Typewritten text is a suspense convention','CONV');}
  for(const c in(t.conv||{}))addTag(T,c,t.conv[c],'Often used for this kind of brand','CONV');
  return{tags:finishTags(T),cautions:cautions.slice(0,2)};}

function tagGraphic(g){const T=newTags(),f=g.f,cautions=[];
  if(f.curved){addTag(T,'warmth',.8*f.curved,'Circular shapes prompt softness: comfort and care','JG');addTag(T,'sincerity',.4*f.curved,'Circular shapes made a company seem more caring','JG');addTag(T,'calm',.35*f.curved,'Curved contours are liked more than sharp ones','BN');addTag(T,'pleasure',.3*f.curved,'Curved contours are liked more than sharp ones','BN');}
  if(f.angular){addTag(T,'ruggedness',.8*f.angular,'Angular shapes prompt hardness: durability','JG');addTag(T,'power',.5*f.angular,'Angular shapes read as hard and strong','JG');
    if(f.angular>=1){addTag(T,'fear',.35,'Sharp-angled contours were proposed to signal threat','BN');addTag(T,'anger',.3,'Sharp-angled contours were proposed to signal threat','BN');cautions.push({text:'Sharp-angled contours are liked less than curved ones.',src:'BN'});}}
  if(f.representational){addTag(T,'sincerity',.35,'Marks that depict familiar objects earn more positive response','HC');addTag(T,'human',.3,'Familiar objects are easier to recognize','HC');}
  if(f.harmony){addTag(T,'competence',.4*f.harmony,'Harmonious, balanced designs earn more positive response','HC');addTag(T,'calm',.3*f.harmony,'Harmonious designs are pleasing','HC');}
  if(f.elaborate){addTag(T,'excitement',.5*f.elaborate,'More elaborate designs hold interest','HC');addTag(T,'interest',.45*f.elaborate,'More elaborate designs hold interest','HC');addTag(T,'energy',.35*f.elaborate,'Busy patterns raise visual activity','CONV');}
  for(const c in(g.conv||{}))addTag(T,c,g.conv[c],'Motif used for this theme','CONV');
  return{tags:finishTags(T),cautions};}

/* ---------- keyword index ---------- */
const CONCEPT_BY_ID={};CONCEPTS.forEach(c=>CONCEPT_BY_ID[c.id]=c);
const LEX={};
(function(){for(const c of CONCEPTS){const put=(w,kind)=>{const k=w.toLowerCase();const a=LEX[k]||(LEX[k]=[]);if(!a.some(x=>x.c===c.id))a.push({c:c.id,kind});};
  put(c.label,'name');if(!c.bridge)put(c.id,'name');put(c.key,'name');(c.aaker||[]).forEach(w=>put(w,'aaker'));(c.syn||[]).forEach(w=>put(w,'syn'));}
  /* model-suggested, reviewed words (concepts-suggested.js) come last, so a word also listed above keeps that label */
  if(typeof SUGGESTED!=='undefined')for(const c of CONCEPTS)(SUGGESTED[c.id]||[]).forEach(w=>{const k=w.toLowerCase();const a=LEX[k]||(LEX[k]=[]);if(!a.some(x=>x.c===c.id))a.push({c:c.id,kind:'sugg'});});})();
const LEX_KEYS=Object.keys(LEX);
function stemTry(w){const out=[w];const add=x=>{if(x.length>2&&!out.includes(x))out.push(x);};
  add(w.replace(/-/g,' '));add(w.replace(/\s+/g,'-'));add(w.replace(/[\s-]+/g,''));
  if(w.endsWith('ies'))add(w.slice(0,-3)+'y');if(w.endsWith('s'))add(w.slice(0,-1));
  if(w.endsWith('ing')){add(w.slice(0,-3));add(w.slice(0,-3)+'e');}
  if(w.endsWith('ed')){add(w.slice(0,-2));add(w.slice(0,-1));}
  if(w.endsWith('ly'))add(w.slice(0,-2));if(w.endsWith('ness'))add(w.slice(0,-4));if(w.endsWith('ful'))add(w.slice(0,-3));
  if(w.endsWith('ity'))add(w.slice(0,-3)+'e');if(w.endsWith('al'))add(w.slice(0,-2));
  return out;}
function lookup(w){for(const v of stemTry(w))if(LEX[v])return LEX[v];return null;}
function editDist(a,b){if(Math.abs(a.length-b.length)>2)return 9;const d=[];for(let i=0;i<=a.length;i++){d[i]=[i];}
  for(let j=1;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[a.length][b.length];}
function nearest(w){let best=[];for(const k of LEX_KEYS){if(k.startsWith(w)&&w.length>=3){best.push([0,k]);continue;}const e=editDist(w,k);if(e<=2&&w.length>=4)best.push([e,k]);}
  best.sort((a,b)=>a[0]-b[0]||a[1].length-b[1].length);return best.slice(0,3).map(b=>b[1]);}
const STOP=['and','the','for','with','but','not','a','of','to','in','our','we','is','are','very','more','feel','feels','feeling','brand','like','that','it','be','should','want','make','look','looks'];
/* Parse free text into keywords, the concepts they map to, and a weight per concept.
   Values are bridged to the concepts they resemble, at the bridge's own weights. */
function parseQuery(q){const terms=[];const cw={};
  const phrases=q.toLowerCase().split(/[,;\n]+/).map(s=>s.trim().replace(/[^a-z0-9\s&'-]/g,'')).filter(Boolean);
  for(const ph of phrases){let hit=lookup(ph);if(hit){terms.push({text:ph,hits:hit});continue;}
    const words=ph.split(/\s+/);let i=0;
    while(i<words.length){let done=false;
      for(let n=Math.min(3,words.length-i);n>=1;n--){const cand=words.slice(i,i+n).join(' ');if(n===1&&STOP.includes(cand))break;const h=lookup(cand);if(h){terms.push({text:cand,hits:h});i+=n;done=true;break;}}
      if(!done){const w=words[i];if(w.length>1&&!STOP.includes(w))terms.push({text:w,hits:null,near:nearest(w)});i++;}}}
  for(const t of terms)if(t.hits)for(const h of t.hits){const c=CONCEPT_BY_ID[h.c];if(c.bridge){for(const k in c.bridge)cw[k]=Math.max(cw[k]||0,c.bridge[k]);}else cw[h.c]=1;}
  return{terms,cw,concepts:Object.keys(cw)};}

/* Precompute tags once; palettes are re-tagged when their colors are edited. */
const TAGS={palette:{},type:{},graphic:{}};
PALETTES.forEach(p=>TAGS.palette[p.id]=tagPalette(p));
TYPESETS.forEach(t=>TAGS.type[t.id]=tagType(t));
GRAPHICS.forEach(g=>TAGS.graphic[g.id]=tagGraphic(g));

function scoreTags(tg,cw){let score=0;const matched=[];for(const c in cw){if(tg[c]&&tg[c].w>=.25){score+=Math.min(1,tg[c].w)*cw[c];matched.push(c);}}
  if(matched.length>1)score*=1+.3*(matched.length-1);matched.sort((a,b)=>tg[b].w-tg[a].w);return{score,matched};}
function rank(kind,items,cw){
  const rows=items.map((it,i)=>{const r=scoreTags(TAGS[kind][it.id].tags,cw);return{it,score:r.score,matched:r.matched,i};}).sort((a,b)=>b.score-a.score||a.i-b.i);
  /* A match must reach 45% of the best score, so broad keywords still narrow the list. */
  const top=rows.length?rows[0].score:0;rows.forEach(r=>{if(r.score<top*.45)r.score=0;});return rows;}
function rankColors(cw){const rows=COLORS.map((it,i)=>{const r=scoreTags(tagColor(it.hex).tags,cw);return{it,score:r.score,matched:r.matched,i};}).sort((a,b)=>b.score-a.score||a.i-b.i);
  const top=rows.length?rows[0].score:0;rows.forEach(r=>{if(r.score<top*.45)r.score=0;});return rows;}
function topTags(tags,n){return Object.keys(tags).sort((a,b)=>tags[b].w-tags[a].w).slice(0,n);}
