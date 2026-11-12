/* ============================================================
   DATA: sources, keyword concepts, palettes, type, graphics, formats
   Evidence tiers: R = peer-reviewed research, S = industry standard,
   C = practitioner convention (no controlled evidence behind it here).
   ============================================================ */
const SRC = {
  AAKER:{t:'R',short:'Aaker 1997',cite:'Aaker, J. L. (1997). Dimensions of brand personality. Journal of Marketing Research, 34(3), 347–356.',url:'https://doi.org/10.1177/002224379703400304',use:'The five brand-personality dimensions and their 42 trait words are the backbone of the keyword index.'},
  LM:{t:'R',short:'Labrecque & Milne 2012',cite:'Labrecque, L. I., & Milne, G. R. (2012). Exciting red and competent blue: the importance of color in marketing. Journal of the Academy of Marketing Science, 40(5), 711–727.',url:'https://doi.org/10.1007/s11747-010-0245-y',use:'Links logo hue to brand-personality dimensions, and saturation and lightness to excitement and ruggedness. Several hue hypotheses were only partly supported; those links carry less weight here and say so.'},
  VM:{t:'R',short:'Valdez & Mehrabian 1994',cite:'Valdez, P., & Mehrabian, A. (1994). Effects of color on emotions. Journal of Experimental Psychology: General, 123(4), 394–409.',url:'https://pubmed.ncbi.nlm.nih.gov/7996122/',use:'Brightness and saturation predict pleasure, arousal and dominance far better than hue does. Their regression weights drive the Calm, Energy and Power scores.'},
  J20:{t:'R',short:'Jonauskaite et al. 2020',cite:'Jonauskaite, D., et al. (2020). Universal patterns in color-emotion associations are further shaped by linguistic and geographic proximity. Psychological Science, 31(10), 1245–1260.',url:'https://doi.org/10.1177/0956797620948810',use:'Pairings between 12 color terms and the 20 emotions of the Geneva Emotion Wheel, from 4,598 people in 30 nations. Supplies the emotion list, the strongest color-emotion links and most cautions. Only pairings the paper reports as strong are used.'},
  SP:{t:'R',short:'Schloss & Palmer 2011',cite:'Schloss, K. B., & Palmer, S. E. (2011). Aesthetic response to color combinations: preference, harmony, and similarity. Attention, Perception, & Psychophysics, 73(2), 551\u2013571.',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3037488',use:'Harmony and liking of a color pair fall as the hues move apart; a contrasting color is nonetheless preferred as the figure on its ground. Drives the companion-color suggestions.'},
  OL:{t:'R',short:'Ou & Luo 2006',cite:'Ou, L.-C., & Luo, M. R. (2006). A colour harmony model for two-colour combinations. Color Research & Application, 31(3).',url:'https://doi.org/10.1002/col.20208',use:'From 1,431 rated pairs: same hue and similar chroma harmonize, a clear lightness step helps, very small lightness differences hurt, lighter pairs do better. The harmony score here follows these principles, not the authors\u2019 fitted equation.'},
  PAD:{t:'R',short:'Mehrabian 1996',cite:'Mehrabian, A. (1996). Pleasure-arousal-dominance: a general framework for describing and measuring individual differences in temperament. Current Psychology, 14(4), 261\u2013292.',url:'https://doi.org/10.1007/BF02686918',use:'Places emotions in a three-axis space with eight corners (exuberant, relaxed, dependent, docile, hostile, anxious, disdainful, bored). Each emotion keyword is assigned a corner so colors can be scored against it.'},
  SCHW:{t:'R',short:'Schwartz 2012',cite:'Schwartz, S. H. (2012). An overview of the Schwartz theory of basic values. Online Readings in Psychology and Culture, 2(1).',url:'https://doi.org/10.9707/2307-0919.1116',use:'Ten basic values recognized across cultures. They organize the idea keywords. No study links them to visuals, so each value is bridged by meaning to the concepts it most resembles.'},
  HGC:{t:'R',short:'Henderson, Giese & Cote 2004',cite:'Henderson, P. W., Giese, J. L., & Cote, J. A. (2004). Impression management using typeface design. Journal of Marketing, 68(4), 60–72.',url:'https://doi.org/10.1509/jmkg.68.4.60.42736',use:'Typeface design dimensions (natural, harmony, elaborate, flourish, weight, compressed) and the impressions they create (pleasing, engaging, reassuring, prominent).'},
  SCF:{t:'R',short:'Shaikh, Chaparro & Fox 2006',cite:'Shaikh, A. D., Chaparro, B. S., & Fox, D. (2006). Perception of fonts: perceived personality traits and uses. Usability News, 8(1).',url:'https://portfolio.erau.edu/en/publications/perception-of-fonts-perceived-personality-traits-and-uses/',use:'Personality ratings of 20 on-screen fonts by family: serif, sans serif, script, display and monospaced.'},
  B03:{t:'R',short:'Brumberger 2003',cite:'Brumberger, E. R. (2003). The rhetoric of typography: the persona of typeface and text. Technical Communication, 50(2), 206–223.',url:'https://www.ingentaconnect.com/content/stc/tc/2003/00000050/00000002',use:'Readers sort typefaces into three personas: elegance, directness and friendliness.'},
  GGP:{t:'R',short:'Grohmann, Giese & Parkman 2013',cite:'Grohmann, B., Giese, J. L., & Parkman, I. D. (2013). Using type font characteristics to communicate brand personality of new brands. Journal of Brand Management, 20(5), 389–403.',url:'https://doi.org/10.1057/bm.2012.23',use:'Typeface naturalness, harmony and flourish move brand-personality ratings; font color acts independently of the font.'},
  JG:{t:'R',short:'Jiang et al. 2016',cite:'Jiang, Y., Gorn, G. J., Galli, M., & Chattopadhyay, A. (2016). Does your company have the right logo? How and why circular- and angular-logo shapes influence brand attribute judgments. Journal of Consumer Research, 42(5), 709–726.',url:'https://doi.org/10.1093/jcr/ucv049',use:'Circular shapes prompt softness judgments (comfort, care); angular shapes prompt hardness judgments (durability).'},
  BN:{t:'R',short:'Bar & Neta 2006',cite:'Bar, M., & Neta, M. (2006). Humans prefer curved visual objects. Psychological Science, 17(8), 645–648.',url:'https://pubmed.ncbi.nlm.nih.gov/16913943/',use:'Curved contours are liked more than sharp-angled ones. Small sample (14 people), since extended by others.'},
  HC:{t:'R',short:'Henderson & Cote 1998',cite:'Henderson, P. W., & Cote, J. A. (1998). Guidelines for selecting or modifying logos. Journal of Marketing, 62(2), 14–30.',url:'https://doi.org/10.1177/002224299806200202',use:'Natural, harmonious and moderately elaborate marks earn the most positive response and recognition.'},
  WCAG:{t:'S',short:'WCAG 2.2',cite:'W3C (2023). Web Content Accessibility Guidelines 2.2, Success Criterion 1.4.3 Contrast (Minimum).',url:'https://www.w3.org/TR/WCAG22/#contrast-minimum',use:'Contrast checks: 4.5:1 for body text, 3:1 for large text.'},
  SPEC:{t:'S',short:'Platform size guides 2026',cite:'Buffer, Social media image sizes in 2026 (May 2026); Sked Social, Social media image sizes for brands and agencies: the 2026 guide.',url:'https://buffer.com/resources/social-media-image-sizes/',use:'Canvas sizes for each format. Platforms change these often; re-check before production.'},
  SAFE:{t:'S',short:'Safe-zone guides 2026',cite:'Hopper HQ, Instagram Reel size in 2026: dimensions, aspect ratio, and safe zones; AdaptlyPost, Social media safe zones 2026.',url:'https://www.hopperhq.com/blog/instagram-reel-size/',use:'Areas the apps cover with their own buttons and captions. Third-party measurements that differ between guides; treated as approximate.'},
  CONV:{t:'C',short:'Convention',cite:'Practitioner convention: widely repeated in design and marketing practice, without a controlled study behind it in this index.',url:'',use:'Topic links such as green for nature, a cross for health, or monospace for tech.'}
};
const TIER = {R:{label:'Research',long:'Peer-reviewed research'},S:{label:'Standard',long:'Industry standard'},C:{label:'Convention',long:'Practitioner convention'}};

/* ---------- Palettes: five roles each. Tags are DERIVED from the colors by
   rules in engine.js; `conv` adds topic links that rest on convention only. */
const PALETTES = [
 {id:'clinic-blue',name:'Clinic Blue',bg:'#FFFFFF',surface:'#EAF2FB',primary:'#1F5FA8',accent:'#2BB3A3',text:'#12243A',conv:{health:.8}},
 {id:'deep-trust',name:'Deep Trust',bg:'#F5F7FA',surface:'#E1E7EF',primary:'#0F2A4A',accent:'#3D7DD8',text:'#0B1B30',conv:{finance:.8,traditional:.3}},
 {id:'sky-calm',name:'Sky Calm',bg:'#F4F9FC',surface:'#DCEDF5',primary:'#3F7FAE',accent:'#9CCFD8',text:'#23405A',conv:{health:.4,water:.5}},
 {id:'sea-glass',name:'Sea Glass',bg:'#F1F7F5',surface:'#D8EAE5',primary:'#23766C',accent:'#8CC9BE',text:'#173B38',conv:{water:.8,health:.5}},
 {id:'mint-clinic',name:'Mint Clinic',bg:'#F3FBF8',surface:'#D3EFE6',primary:'#0F7F6A',accent:'#0F4C5C',text:'#0E2F36',conv:{health:.9,modern:.3}},
 {id:'garden-fresh',name:'Garden Fresh',bg:'#F7FAF2',surface:'#E3EFD3',primary:'#2F7D2B',accent:'#F2B33D',text:'#1E3320',conv:{food:.7,health:.5}},
 {id:'clean-slate',name:'Clean Slate',bg:'#FFFFFF',surface:'#F0F3F1',primary:'#4F7556',accent:'#C9D8CB',text:'#26302A',conv:{modern:.5,health:.4}},
 {id:'forest-trail',name:'Forest Trail',bg:'#EFEDE4',surface:'#D9D5C3',primary:'#2F4A34',accent:'#B5651D',text:'#1F2A1F',conv:{ruggedness:.5,fitness:.3}},
 {id:'canyon',name:'Canyon',bg:'#F3E9DC',surface:'#E2CFB6',primary:'#7A4A2B',accent:'#C8752E',text:'#3A2416',conv:{human:.4}},
 {id:'workwear',name:'Workwear',bg:'#E9E4DA',surface:'#CFC7B8',primary:'#3B3A36',accent:'#D98A1F',text:'#1E1D1A',conv:{ruggedness:.7}},
 {id:'terracotta',name:'Terracotta Kitchen',bg:'#FBF3EA',surface:'#F1DCC8',primary:'#B8452A',accent:'#5F8245',text:'#3A2018',conv:{food:.9,human:.5,warmth:.4}},
 {id:'signal-red',name:'Signal Red',bg:'#FFFFFF',surface:'#F6E9E7',primary:'#D92B2B',accent:'#1A1A1A',text:'#1A1A1A',conv:{fitness:.5}},
 {id:'citrus-pop',name:'Citrus Pop',bg:'#FFF8EC',surface:'#FFE7BF',primary:'#E85D0F',accent:'#FFC21A',text:'#3A2208',conv:{food:.6,celebration:.5}},
 {id:'sunny-side',name:'Sunny Side',bg:'#FFFBE6',surface:'#FFF0A8',primary:'#F5B700',accent:'#2D6CDF',text:'#2B2A1F',conv:{celebration:.4}},
 {id:'sunset-coast',name:'Sunset Coast',bg:'#FFF4EC',surface:'#FFD9C2',primary:'#E4572E',accent:'#1B7A8C',text:'#2B1D1A',conv:{water:.5,celebration:.3}},
 {id:'pastel-play',name:'Pastel Play',bg:'#FFFDF7',surface:'#E8F3FF',primary:'#6FA8E8',accent:'#FFB5C9',text:'#33415C',conv:{playful:.8,delicate:.5}},
 {id:'blush',name:'Blush',bg:'#FFF5F6',surface:'#FBDDE2',primary:'#C94F6D',accent:'#F2A7B5',text:'#4A1F2B',conv:{beauty:.8}},
 {id:'rose-evening',name:'Rose Evening',bg:'#2A1A20',surface:'#3B252D',primary:'#E8A5A0',accent:'#D8B48A',text:'#FBEFEA',conv:{beauty:.7,sophistication:.4}},
 {id:'plum-velvet',name:'Plum Velvet',bg:'#F7F2F8',surface:'#E8DAEC',primary:'#5B2A6E',accent:'#C59BD1',text:'#2A1433',conv:{beauty:.4}},
 {id:'royal',name:'Royal',bg:'#F5F3FB',surface:'#DAD3F0',primary:'#2E2A8C',accent:'#D4A72C',text:'#151338',conv:{traditional:.5,finance:.3}},
 {id:'heritage',name:'Heritage',bg:'#F2EADB',surface:'#DFD1B5',primary:'#7B1E2B',accent:'#1F3A2E',text:'#2A1A14',conv:{traditional:.9}},
 {id:'ivory-ink',name:'Ivory and Ink',bg:'#FAF8F3',surface:'#ECE7DC',primary:'#111111',accent:'#8A7A5C',text:'#1A1A1A',conv:{modern:.5}},
 {id:'noir',name:'Noir',bg:'#0F0F10',surface:'#1D1D1F',primary:'#F2F2F0',accent:'#B89B5E',text:'#F2F2F0',conv:{sophistication:.5}},
 {id:'graphite',name:'Graphite',bg:'#EDEDED',surface:'#D4D4D4',primary:'#3D3D3D',accent:'#8C8C8C',text:'#1C1C1C',conv:{modern:.6,tech:.3}},
 {id:'slate-tech',name:'Slate Tech',bg:'#F4F6F8',surface:'#DDE3E9',primary:'#334155',accent:'#0EA5E9',text:'#0F172A',conv:{tech:.8,modern:.5}},
 {id:'electric',name:'Electric',bg:'#0E0B1F',surface:'#1B1638',primary:'#8B5CF6',accent:'#22D3EE',text:'#F5F3FF',conv:{tech:.8}},
 {id:'neon-night',name:'Neon Night',bg:'#0B0B0D',surface:'#1A1A1F',primary:'#FF2E88',accent:'#C6FF3D',text:'#FFFFFF',conv:{playful:.3,celebration:.4}},
 {id:'midnight-ocean',name:'Midnight Ocean',bg:'#0C1B2A',surface:'#14293D',primary:'#4FC3D9',accent:'#F2E3C6',text:'#EAF4F8',conv:{water:.9}}
];

/* ---------- Graphics: procedural, drawn in the active palette. `f` = shape features. */
const GRAPHICS = [
 {id:'none',name:'No graphic',f:{},conv:{modern:.5}},
 {id:'waves',name:'Waves',f:{curved:1,organic:1,harmony:1},conv:{water:1,calm:.5,health:.3}},
 {id:'ripples',name:'Ripples',f:{curved:1,harmony:1},conv:{water:.7,calm:.6,relief:.4}},
 {id:'blobs',name:'Soft shapes',f:{curved:1,organic:1},conv:{modern:.4,playful:.3,health:.3}},
 {id:'circles',name:'Circles',f:{curved:1,harmony:.6},conv:{playful:.4,modern:.3}},
 {id:'arches',name:'Arches',f:{curved:1,harmony:1},conv:{sophistication:.4,beauty:.5,modern:.3}},
 {id:'leaves',name:'Leaves',f:{curved:1,organic:1,representational:1},conv:{natural:1,health:.6,food:.5,relief:.3}},
 {id:'glow',name:'Soft glow',f:{curved:1},conv:{calm:.5,modern:.5,tech:.3,beauty:.4,awe:.4,mystery:.3}},
 {id:'sunburst',name:'Sunburst',f:{angular:.5,harmony:1,elaborate:.5},conv:{joy:.7,energy:.6,celebration:.4,awe:.4,pride:.4,retro:.3}},
 {id:'stripes',name:'Diagonal stripes',f:{angular:.6,harmony:1},conv:{energy:.7,fitness:.5}},
 {id:'chevrons',name:'Chevrons',f:{angular:1,harmony:1},conv:{energy:.6,fitness:.5,finance:.3}},
 {id:'shards',name:'Shards',f:{angular:1,elaborate:.7},conv:{excitement:.5,tech:.4,anger:.3}},
 {id:'peaks',name:'Peaks',f:{angular:1,organic:1,representational:1},conv:{ruggedness:.6,fitness:.4,natural:.4}},
 {id:'topo',name:'Contour lines',f:{curved:.6,organic:1,elaborate:.6},conv:{ruggedness:.5,natural:.5,tech:.3}},
 {id:'grid',name:'Grid',f:{angular:.6,harmony:1},conv:{tech:.7,modern:.5,competence:.4}},
 {id:'dots',name:'Dot grid',f:{curved:.5,harmony:1},conv:{modern:.5,tech:.4}},
 {id:'halftone',name:'Halftone',f:{curved:.4,elaborate:.6},conv:{retro:.7,excitement:.4}},
 {id:'plus',name:'Plus signs',f:{angular:.7,harmony:1},conv:{health:.9,competence:.3}},
 {id:'growth',name:'Rising line',f:{angular:.7,representational:1},conv:{finance:1,competence:.4,fitness:.3,pride:.5}},
 {id:'frame',name:'Fine frame',f:{harmony:1},conv:{sophistication:.6,traditional:.6,delicate:.4,admiration:.4,sadness:.3}},
 {id:'sparkles',name:'Sparkles',f:{angular:.6,elaborate:.5},conv:{sophistication:.4,celebration:.6,beauty:.6,awe:.5}},
 {id:'confetti',name:'Confetti',f:{elaborate:1},conv:{celebration:1,playful:.8,joy:.6,amusement:.6,pride:.3}},
 {id:'hearts',name:'Hearts',f:{curved:1,representational:1},conv:{love:1,warmth:.5}},
 {id:'scribble',name:'Scribbles',f:{curved:.7,organic:1,elaborate:.5},conv:{human:1,playful:.5,amusement:.4}},
 {id:'checker',name:'Checkerboard',f:{angular:1,harmony:1},conv:{retro:.7,playful:.4,food:.3}},
 {id:'stars',name:'Night sky',f:{curved:.3,elaborate:.5},conv:{awe:.9,mystery:.7,calm:.3}},
 {id:'rain',name:'Rain',f:{harmony:.5},conv:{sadness:.8,calm:.3,water:.4,relief:.3}},
 {id:'bolts',name:'Lightning',f:{angular:1,elaborate:.6},conv:{energy:.8,anger:.5,fear:.5,power:.5,awe:.3}}
];

/* ---------- Platforms, formats and layouts.
   safe: pixels the app covers with its own interface (approximate, SAFE source).
   center: a centered area that survives every crop. crop: a secondary crop guide. */
const PLATFORMS = [
 {id:'facebook',name:'Facebook'},{id:'instagram',name:'Instagram'},{id:'tiktok',name:'TikTok'},
 {id:'youtube',name:'YouTube'},{id:'linkedin',name:'LinkedIn'},{id:'x',name:'X'},{id:'pinterest',name:'Pinterest'}
];
const MEDIA = {image:'Image post',carousel:'Carousel',story:'Story',short:'Short video cover',thumb:'Video thumbnail',cover:'Cover image',profile:'Profile image',link:'Link or ad image'};
const L_IMAGE=['announce','photo','split','quote','tips','stat','promo'];
const FORMATS = [
 {id:'fb-feed',p:'facebook',name:'Feed post 4:5',w:1080,h:1350,media:'image',layouts:L_IMAGE},
 {id:'fb-square',p:'facebook',name:'Feed post square',w:1080,h:1080,media:'image',layouts:L_IMAGE},
 {id:'fb-link',p:'facebook',name:'Link image',w:1200,h:630,media:'link',layouts:['split','announce','photo','promo','stat']},
 {id:'fb-story',p:'facebook',name:'Story',w:1080,h:1920,media:'story',safe:{top:250,bottom:250,left:0,right:0},layouts:['announce','photo','quote','promo','stat','tips']},
 {id:'fb-reel',p:'facebook',name:'Reel cover',w:1080,h:1920,media:'short',safe:{top:269,bottom:672,left:65,right:65},layouts:['video','photo','announce']},
 {id:'fb-group',p:'facebook',name:'Group cover',w:1640,h:856,media:'cover',layouts:['banner','photo','split']},
 {id:'fb-page',p:'facebook',name:'Page cover',w:851,h:315,media:'cover',layouts:['banner','split']},
 {id:'fb-event',p:'facebook',name:'Event cover',w:1920,h:1005,media:'cover',layouts:['promo','banner','photo']},
 {id:'fb-profile',p:'facebook',name:'Profile picture',w:720,h:720,media:'profile',circle:true,layouts:['avatar']},

 {id:'ig-feed',p:'instagram',name:'Feed post 4:5',w:1080,h:1350,media:'image',crop:{r:3/4,label:'Profile grid crop 3:4'},layouts:L_IMAGE},
 {id:'ig-tall',p:'instagram',name:'Feed post 3:4',w:1080,h:1440,media:'image',layouts:L_IMAGE},
 {id:'ig-square',p:'instagram',name:'Feed post square',w:1080,h:1080,media:'image',layouts:L_IMAGE},
 {id:'ig-carousel',p:'instagram',name:'Carousel slide',w:1080,h:1350,media:'carousel',layouts:['tips','announce','quote','stat','split']},
 {id:'ig-story',p:'instagram',name:'Story',w:1080,h:1920,media:'story',safe:{top:250,bottom:250,left:0,right:0},layouts:['announce','photo','quote','promo','stat','tips']},
 {id:'ig-reel',p:'instagram',name:'Reel cover',w:1080,h:1920,media:'short',safe:{top:269,bottom:672,left:65,right:65},crop:{r:3/4,label:'Profile grid crop 3:4'},layouts:['video','photo','announce']},
 {id:'ig-profile',p:'instagram',name:'Profile picture',w:720,h:720,media:'profile',circle:true,layouts:['avatar']},

 {id:'tt-video',p:'tiktok',name:'Video cover',w:1080,h:1920,media:'short',safe:{top:130,bottom:370,left:60,right:120},layouts:['video','photo','announce']},
 {id:'tt-photo',p:'tiktok',name:'Photo carousel slide',w:1080,h:1920,media:'carousel',safe:{top:130,bottom:370,left:60,right:120},layouts:['tips','announce','quote','stat','photo']},
 {id:'tt-profile',p:'tiktok',name:'Profile picture',w:720,h:720,media:'profile',circle:true,layouts:['avatar']},

 {id:'yt-thumb',p:'youtube',name:'Video thumbnail',w:1280,h:720,media:'thumb',layouts:['video','split','photo']},
 {id:'yt-short',p:'youtube',name:'Shorts cover',w:1080,h:1920,media:'short',safe:{top:120,bottom:300,left:0,right:96},layouts:['video','photo','announce']},
 {id:'yt-banner',p:'youtube',name:'Channel banner',w:2560,h:1440,media:'cover',center:{w:1235,h:338,label:'Visible on every device'},layouts:['banner']},
 {id:'yt-profile',p:'youtube',name:'Channel picture',w:800,h:800,media:'profile',circle:true,layouts:['avatar']},

 {id:'li-land',p:'linkedin',name:'Post landscape',w:1200,h:627,media:'image',layouts:['split','announce','photo','stat','quote','promo']},
 {id:'li-portrait',p:'linkedin',name:'Post portrait 4:5',w:1080,h:1350,media:'image',layouts:L_IMAGE},
 {id:'li-square',p:'linkedin',name:'Post square',w:1200,h:1200,media:'image',layouts:L_IMAGE},
 {id:'li-doc',p:'linkedin',name:'Document carousel page',w:1080,h:1350,media:'carousel',layouts:['tips','stat','announce','quote']},
 {id:'li-cover',p:'linkedin',name:'Company cover',w:1128,h:191,media:'cover',layouts:['banner']},

 {id:'x-post',p:'x',name:'Post image 16:9',w:1600,h:900,media:'image',layouts:['split','announce','photo','stat','quote','promo']},
 {id:'x-header',p:'x',name:'Header',w:1500,h:500,media:'cover',layouts:['banner','split']},
 {id:'x-profile',p:'x',name:'Profile picture',w:720,h:720,media:'profile',circle:true,layouts:['avatar']},

 {id:'pin-std',p:'pinterest',name:'Standard Pin 2:3',w:1000,h:1500,media:'image',layouts:['photo','announce','tips','split','quote','stat','promo']},
 {id:'pin-video',p:'pinterest',name:'Video Pin cover',w:1080,h:1920,media:'short',safe:{top:100,bottom:220,left:40,right:40},layouts:['video','photo','announce']}
];
const LAYOUTS = {
 announce:{name:'Headline',fields:['eyebrow','headline','sub','cta']},
 photo:{name:'Photo with caption',fields:['eyebrow','headline','sub'],photo:true},
 split:{name:'Photo and panel',fields:['eyebrow','headline','sub','cta'],photo:true},
 quote:{name:'Quote',fields:['quote','attribution']},
 tips:{name:'List',fields:['listTitle','item1','item2','item3']},
 stat:{name:'Big number',fields:['stat','statLabel','sub']},
 promo:{name:'Offer or event',fields:['badge','headline','details','cta']},
 video:{name:'Video cover',fields:['videoTitle','eyebrow'],photo:true},
 banner:{name:'Banner',fields:['tagline']},
 avatar:{name:'Profile mark',fields:['monogram']}
};
const FIELDS = {
 eyebrow:{label:'Small label',max:40},headline:{label:'Headline',max:90,area:true},sub:{label:'Supporting line',max:140,area:true},
 cta:{label:'Button text',max:28},quote:{label:'Quote',max:220,area:true},attribution:{label:'Who said it',max:60},
 listTitle:{label:'List title',max:70},item1:{label:'Item 1',max:60},item2:{label:'Item 2',max:60},item3:{label:'Item 3',max:60},
 stat:{label:'Number',max:8},statLabel:{label:'What the number counts',max:70},badge:{label:'Badge (use / for a line break)',max:24},
 details:{label:'Date, place or terms',max:90},videoTitle:{label:'Video title',max:60,area:true},tagline:{label:'Tagline',max:80},monogram:{label:'Initials',max:3}
};

/* ---------- Brand presets. Placeholder copy avoids outcome claims on purpose. */
const BRANDS = {
 sample:{label:'Sample brand',name:'Northfield Co.',handle:'@yourhandle',palette:'ivory-ink',type:'geometric',graphic:'circles',query:'',
  content:{eyebrow:'New this season',headline:'Made for the long run.',sub:'Replace this text with a line your customers would say out loud.',cta:'Learn more',
   quote:'Your customer quote goes here. Use real words from a real customer, with permission.',attribution:'First name, city',
   listTitle:'Three things to know',item1:'First point',item2:'Second point',item3:'Third point',
   stat:'24',statLabel:'what this number counts',badge:'Open / house',details:'Saturday, 10 AM',
   videoTitle:'Watch how it works',tagline:'Made for the long run.',monogram:'NC'}}
};
