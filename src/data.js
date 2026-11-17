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
  BB:{t:'R',short:'Bajaj & Bond 2018',cite:'Bajaj, A., & Bond, S. D. (2018). Beyond beauty: design symmetry and brand personality. Journal of Consumer Psychology, 28(1), 77\u201398.',url:'https://doi.org/10.1002/jcpy.1009',use:'In four experiments, asymmetric logos and artwork were judged more exciting than symmetric ones, partly because asymmetry is more arousing. Drives the asymmetry rule for graphics.'},
  CKE:{t:'R',short:'Cian, Krishna & Elder 2014',cite:'Cian, L., Krishna, A., & Elder, R. S. (2014). This logo moves me: dynamic imagery from static images. Journal of Marketing Research, 51(2), 184\u2013197.',url:'https://scholarsarchive.byu.edu/facpub/8436/',use:'Static logos that imply movement raised engagement and, used with care, brand attitudes; the authors warn the effect can backfire for traditional or conservative brands. Drives the implied-motion rule for graphics.'},
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
 {id:'midnight-ocean',name:'Midnight Ocean',bg:'#0C1B2A',surface:'#14293D',primary:'#4FC3D9',accent:'#F2E3C6',text:'#EAF4F8',conv:{water:.9}},
 /* Fingerprint set: palettes chosen so each part of the fingerprint has premade options. They were picked by
    running candidates through the same tagging rules as every other palette (no hand tags for the fingerprint axes)
    and keeping those that lean clearly toward their target, with text, accent and brand-ground contrast at 4.5:1 or
    better. High dominance needs dark, saturated, colored grounds: black and gray grounds carry the fear and
    sadness hue links, which pull dominance down. The comment on each names where it lands. */
 {id:'oxblood',name:'Oxblood',bg:'#2D120D',surface:'#432722',primary:'#8B1417',accent:'#F08A6C',text:'#F7EAE8',conv:{}},                                 // sophistication, high arousal, high dominance
 {id:'deep-lagoon',name:'Deep Lagoon',bg:'#0D3A39',surface:'#21504E',primary:'#1D6C5D',accent:'#48C6AF',text:'#DCF2F2',conv:{water:.4}},              // high dominance
 {id:'admiralty',name:'Admiralty',bg:'#101E2C',surface:'#1C2A39',primary:'#8B1B26',accent:'#4A9AD0',text:'#E0ECF7',conv:{traditional:.4}},            // competence, high arousal, high dominance
 {id:'verdigris',name:'Verdigris',bg:'#3E2A15',surface:'#4C3925',primary:'#1A745E',accent:'#E4844A',text:'#F0E7DE',conv:{human:.3}},                   // ruggedness, high arousal, high dominance
 {id:'alarm',name:'Alarm',bg:'#2E1C18',surface:'#433230',primary:'#A1252A',accent:'#F25358',text:'#F4E7E4',conv:{}},                                    // excitement, low pleasure, high arousal, high dominance
 {id:'nightshade',name:'Nightshade',bg:'#301613',surface:'#3F2623',primary:'#92141B',accent:'#7FBF8F',text:'#EDE5E4',conv:{mystery:.4}},               // sophistication, low pleasure, high arousal, high dominance
 {id:'overcast',name:'Overcast',bg:'#41434D',surface:'#51545F',primary:'#C3B1A4',accent:'#D5D5D5',text:'#EEF0FA',conv:{}},                              // low pleasure, low arousal, low dominance
 {id:'peat',name:'Peat',bg:'#3B2F25',surface:'#4C4037',primary:'#4E5B59',accent:'#A5AAB6',text:'#FCF9F6',conv:{natural:.3}},                          // ruggedness, low pleasure, low arousal
 {id:'marigold',name:'Marigold Market',bg:'#FBE6C9',surface:'#EDD5B5',primary:'#D46938',accent:'#8F4F01',text:'#271F14',conv:{food:.5}},             // excitement, high pleasure, high arousal
 {id:'fiesta',name:'Fiesta',bg:'#F9E5CE',surface:'#EBD3B8',primary:'#BA0A16',accent:'#6E0A8A',text:'#1E1912',conv:{celebration:.6}},                 // excitement, high arousal
 {id:'tangerine-violet',name:'Tangerine Violet',bg:'#EFD6C4',surface:'#E1C6B2',primary:'#FF5F24',accent:'#3D0D76',text:'#191410',conv:{playful:.3}}  // excitement, high pleasure, high arousal
];

/* ---------- Graphics: procedural, drawn in the active palette.
   Each family holds several styles. A style's `f` lists its shape features; engine.js derives its tags
   from them, so two styles of one family can lean toward different parts of the fingerprint.
   The first style keeps the family's original id, so saved brands and posts open unchanged.
   Feature scale is 0 to 1: curved, angular, organic, harmony (balanced, symmetric), elaborate,
   representational (depicts a thing), asym (asymmetric), motion (implies movement), fine (thin lines),
   bold (large solid masses), sparse (mostly empty space), rough (hand-made, irregular edges). */
const GFAMILIES = [
 {fam:'none',name:'No graphic',vars:[{id:'none',vn:'Plain ground',f:{},conv:{modern:.5}}]},
 {fam:'waves',name:'Waves',vars:[
  {id:'waves',vn:'Rolling swell',f:{curved:1,organic:1,harmony:1},conv:{water:1,calm:.5,health:.3}},
  {id:'waves-line',vn:'Fine lines',f:{curved:1,harmony:1,fine:1},conv:{water:.7,calm:.5}},
  {id:'waves-surf',vn:'Surf',f:{curved:.7,organic:1,asym:.7,motion:1,elaborate:.5},conv:{water:.8,energy:.4}},
  {id:'waves-deep',vn:'Deep current',f:{curved:1,organic:1,bold:1},conv:{water:.6,power:.3}}]},
 {fam:'ripples',name:'Ripples',vars:[
  {id:'ripples',vn:'Corner rings',f:{curved:1,harmony:1},conv:{water:.7,calm:.6,relief:.4}},
  {id:'ripples-drop',vn:'Still drop',f:{curved:1,harmony:1,sparse:1,fine:.6},conv:{calm:.7,relief:.4}},
  {id:'ripples-overlap',vn:'Interference',f:{curved:1,asym:.7,elaborate:.7},conv:{water:.5,interest:.3}},
  {id:'ripples-bold',vn:'Bold bands',f:{curved:1,bold:1,harmony:.6},conv:{retro:.4,power:.3}}]},
 {fam:'blobs',name:'Soft shapes',vars:[
  {id:'blobs',vn:'Corner forms',f:{curved:1,organic:1},conv:{modern:.4,playful:.3,health:.3}},
  {id:'blobs-pebbles',vn:'Pebbles',f:{curved:1,organic:1,elaborate:.6,asym:.5},conv:{playful:.5,natural:.3}},
  {id:'blobs-outline',vn:'Outlines',f:{curved:1,organic:1,fine:.9,sparse:.4},conv:{modern:.5,delicate:.3}},
  {id:'blobs-giant',vn:'One big form',f:{curved:1,organic:1,bold:1,sparse:.5},conv:{modern:.4,calm:.2}}]},
 {fam:'circles',name:'Circles',vars:[
  {id:'circles',vn:'Scattered',f:{curved:1,harmony:.6},conv:{playful:.4,modern:.3}},
  {id:'circles-bubbles',vn:'Bubbles',f:{curved:1,elaborate:.6,motion:.6,asym:.4},conv:{playful:.6,joy:.3}},
  {id:'circles-orbit',vn:'Orbits',f:{curved:1,harmony:1,fine:.8},conv:{tech:.4,awe:.3}},
  {id:'circles-polka',vn:'Polka dots',f:{curved:1,harmony:1,bold:.7},conv:{retro:.5,playful:.5}}]},
 {fam:'arches',name:'Arches',vars:[
  {id:'arches',vn:'Row of arches',f:{curved:1,harmony:1},conv:{sophistication:.4,beauty:.5,modern:.3}},
  {id:'arches-rainbow',vn:'Rainbow',f:{curved:1,harmony:1,elaborate:.4},conv:{joy:.6,playful:.5,retro:.4}},
  {id:'arches-window',vn:'Pointed windows',f:{curved:.5,angular:.5,harmony:1,fine:.7,elaborate:.5},conv:{traditional:.6,mystery:.5,awe:.3}},
  {id:'arches-portal',vn:'Single portal',f:{curved:1,harmony:1,sparse:1},conv:{sophistication:.4,beauty:.4,calm:.3}}]},
 {fam:'leaves',name:'Leaves',vars:[
  {id:'leaves',vn:'Corner sprays',f:{curved:1,organic:1,representational:1},conv:{natural:1,health:.6,food:.5,relief:.3}},
  {id:'leaves-scatter',vn:'Falling leaves',f:{curved:1,organic:1,representational:1,asym:.6,motion:.6},conv:{natural:.8,playful:.3}},
  {id:'leaves-line',vn:'Line botanicals',f:{curved:1,organic:1,representational:1,fine:1},conv:{natural:.7,delicate:.5,beauty:.4}},
  {id:'leaves-jungle',vn:'Dense foliage',f:{curved:1,organic:1,representational:1,bold:1,elaborate:.6},conv:{natural:1,ruggedness:.3}}]},
 {fam:'glow',name:'Soft glow',vars:[
  {id:'glow',vn:'Drifting light',f:{curved:1},conv:{calm:.5,modern:.5,tech:.3,beauty:.4,awe:.4,mystery:.3}},
  {id:'glow-aura',vn:'Centered aura',f:{curved:1,harmony:1,sparse:1},conv:{calm:.6,awe:.4,beauty:.4}},
  {id:'glow-neon',vn:'Neon streaks',f:{angular:.4,motion:.7,elaborate:.4,asym:.5},conv:{tech:.7,excitement:.5,energy:.5}},
  {id:'glow-eclipse',vn:'Eclipse',f:{curved:1,bold:.9,harmony:1},conv:{mystery:.7,power:.6,awe:.3}}]},
 {fam:'sunburst',name:'Sunburst',vars:[
  {id:'sunburst',vn:'Corner rays',f:{angular:.5,harmony:1,elaborate:.5},conv:{joy:.7,energy:.6,celebration:.4,awe:.4,pride:.4,retro:.3}},
  {id:'sunburst-center',vn:'Full burst',f:{angular:.5,harmony:1,bold:.7},conv:{joy:.6,retro:.6,celebration:.4,pride:.4}},
  {id:'sunburst-rising',vn:'Rising sun',f:{curved:.6,angular:.3,harmony:1,representational:.7},conv:{joy:.7,retro:.5,relief:.3}},
  {id:'sunburst-fine',vn:'Fine rays',f:{angular:.4,fine:1,harmony:.8,sparse:.4},conv:{awe:.5,joy:.3}}]},
 {fam:'stripes',name:'Stripes',vars:[
  {id:'stripes',vn:'Diagonal',f:{angular:.6,harmony:1},conv:{energy:.7,fitness:.5}},
  {id:'stripes-pin',vn:'Pinstripe',f:{harmony:1,fine:1,sparse:.5},conv:{traditional:.5,finance:.4,competence:.3}},
  {id:'stripes-speed',vn:'Speed lines',f:{angular:.5,motion:1,asym:.6},conv:{energy:.8,fitness:.5}},
  {id:'stripes-bold',vn:'Wide bands',f:{angular:.6,harmony:1,bold:1},conv:{retro:.5,energy:.3}}]},
 {fam:'chevrons',name:'Chevrons',vars:[
  {id:'chevrons',vn:'Small chevrons',f:{angular:1,harmony:1},conv:{energy:.6,fitness:.5,finance:.3}},
  {id:'chevrons-arrows',vn:'Forward arrows',f:{angular:1,motion:1,bold:.6},conv:{energy:.7,fitness:.5,pride:.3}},
  {id:'chevrons-zigzag',vn:'Zigzag',f:{angular:1,harmony:.8,elaborate:.5},conv:{retro:.6,playful:.4,energy:.3}},
  {id:'chevrons-fine',vn:'Herringbone',f:{angular:.7,harmony:1,fine:.8},conv:{traditional:.6,ruggedness:.2}}]},
 {fam:'shards',name:'Shards',vars:[
  {id:'shards',vn:'Scattered',f:{angular:1,elaborate:.7},conv:{excitement:.5,tech:.4,anger:.3}},
  {id:'shards-crystal',vn:'Crystal facets',f:{angular:1,elaborate:.6,harmony:.5,fine:.3},conv:{sophistication:.5,beauty:.3,awe:.3}},
  {id:'shards-broken',vn:'Broken glass',f:{angular:1,asym:1,elaborate:.6,fine:.4},conv:{anger:.5,fear:.5}},
  {id:'shards-paper',vn:'Paper cut',f:{angular:.7,bold:.8,asym:.5},conv:{modern:.5,playful:.3}}]},
 {fam:'peaks',name:'Peaks',vars:[
  {id:'peaks',vn:'Mountain ranges',f:{angular:1,organic:1,representational:1},conv:{ruggedness:.6,fitness:.4,natural:.4}},
  {id:'peaks-line',vn:'Ridge lines',f:{angular:.6,organic:1,representational:1,fine:1,sparse:.4},conv:{natural:.5,calm:.3}},
  {id:'peaks-summit',vn:'Single summit',f:{angular:1,representational:1,bold:1,harmony:.5},conv:{ruggedness:.7,pride:.6,awe:.5}},
  {id:'peaks-jagged',vn:'Jagged teeth',f:{angular:1,elaborate:.5,asym:.5},conv:{ruggedness:.5,anger:.3,energy:.3}}]},
 {fam:'topo',name:'Contour lines',vars:[
  {id:'topo',vn:'Two summits',f:{curved:.6,organic:1,elaborate:.6},conv:{ruggedness:.5,natural:.5,tech:.3}},
  {id:'topo-dense',vn:'Dense terrain',f:{curved:.6,organic:1,elaborate:1,fine:.6},conv:{natural:.4,tech:.4}},
  {id:'topo-flow',vn:'Flow lines',f:{curved:.9,organic:.6,motion:.8,harmony:.6,fine:.5},conv:{tech:.4,modern:.4}},
  {id:'topo-bold',vn:'Bold bands',f:{curved:.6,organic:1,bold:1},conv:{ruggedness:.5,retro:.4,natural:.4}}]},
 {fam:'grid',name:'Grid',vars:[
  {id:'grid',vn:'Line grid',f:{angular:.6,harmony:1},conv:{tech:.7,modern:.5,competence:.4}},
  {id:'grid-blueprint',vn:'Blueprint',f:{angular:.5,harmony:1,fine:1},conv:{tech:.7,competence:.5}},
  {id:'grid-horizon',vn:'Horizon grid',f:{angular:.6,harmony:1,motion:.6,elaborate:.4},conv:{retro:.8,tech:.5,excitement:.4}},
  {id:'grid-iso',vn:'Isometric',f:{angular:1,harmony:1},conv:{tech:.6,modern:.4}}]},
 {fam:'dots',name:'Dot grid',vars:[
  {id:'dots',vn:'Even grid',f:{curved:.5,harmony:1},conv:{modern:.5,tech:.4}},
  {id:'dots-scatter',vn:'Scattered',f:{curved:.5,asym:.8,sparse:.6},conv:{modern:.4,playful:.3}},
  {id:'dots-bold',vn:'Large dots',f:{curved:1,harmony:1,bold:.7},conv:{retro:.5,playful:.5}},
  {id:'dots-matrix',vn:'LED matrix',f:{curved:.5,harmony:.8,elaborate:.5},conv:{tech:.7,retro:.3}}]},
 {fam:'halftone',name:'Halftone',vars:[
  {id:'halftone',vn:'Corner fade',f:{curved:.4,elaborate:.6},conv:{retro:.7,excitement:.4}},
  {id:'halftone-band',vn:'Diagonal band',f:{curved:.4,elaborate:.6,motion:.6},conv:{retro:.6,energy:.3}},
  {id:'halftone-pop',vn:'Pop-art spots',f:{curved:.7,elaborate:.6,bold:.7},conv:{retro:.7,amusement:.5,playful:.5}},
  {id:'halftone-fine',vn:'Fine screen',f:{curved:.4,fine:1,harmony:.8},conv:{modern:.4,retro:.3}}]},
 {fam:'plus',name:'Plus signs',vars:[
  {id:'plus',vn:'Even grid',f:{angular:.7,harmony:1},conv:{health:.9,competence:.3}},
  {id:'plus-scatter',vn:'Scattered marks',f:{angular:.7,asym:.7,elaborate:.4},conv:{playful:.4,health:.4}},
  {id:'plus-bold',vn:'One bold cross',f:{angular:.7,harmony:1,bold:1,sparse:.5},conv:{health:1,competence:.4}},
  {id:'plus-fine',vn:'Registration marks',f:{angular:.5,harmony:1,fine:1},conv:{tech:.4,competence:.4,modern:.4}}]},
 {fam:'growth',name:'Rising line',vars:[
  {id:'growth',vn:'Bars and line',f:{angular:.7,representational:1},conv:{finance:1,competence:.4,fitness:.3,pride:.5}},
  {id:'growth-area',vn:'Smooth curve',f:{curved:.8,representational:1,motion:.5},conv:{finance:.9,competence:.4,pride:.4}},
  {id:'growth-steps',vn:'Steps',f:{angular:1,representational:.6,bold:.8,harmony:1},conv:{finance:.6,pride:.6,fitness:.3}},
  {id:'growth-arrow',vn:'Big arrow',f:{angular:.8,motion:1,bold:1,representational:.6},conv:{finance:.6,energy:.5,pride:.5}}]},
 {fam:'frame',name:'Frame',vars:[
  {id:'frame',vn:'Double rule',f:{harmony:1},conv:{sophistication:.6,traditional:.6,delicate:.4,admiration:.4,sadness:.3}},
  {id:'frame-deco',vn:'Deco corners',f:{angular:.7,harmony:1,elaborate:.6},conv:{retro:.6,sophistication:.7,admiration:.3}},
  {id:'frame-ornate',vn:'Scrollwork',f:{curved:1,harmony:1,elaborate:1,fine:.6},conv:{traditional:.8,admiration:.5,delicate:.3}},
  {id:'frame-bold',vn:'Thick border',f:{harmony:1,bold:1,sparse:.7},conv:{modern:.5,competence:.3}}]},
 {fam:'sparkles',name:'Sparkles',vars:[
  {id:'sparkles',vn:'Scattered',f:{angular:.6,elaborate:.5},conv:{sophistication:.4,celebration:.6,beauty:.6,awe:.5}},
  {id:'sparkles-cluster',vn:'Corner cluster',f:{angular:.5,sparse:.8,asym:.5},conv:{beauty:.7,sophistication:.5,delicate:.4}},
  {id:'sparkles-glint',vn:'Long glints',f:{angular:.6,fine:.8,elaborate:.4},conv:{awe:.6,beauty:.4,mystery:.2}},
  {id:'sparkles-burst',vn:'Glitter burst',f:{angular:.5,elaborate:1,motion:.6},conv:{celebration:.9,joy:.5}}]},
 {fam:'confetti',name:'Confetti',vars:[
  {id:'confetti',vn:'Party mix',f:{elaborate:1},conv:{celebration:1,playful:.8,joy:.6,amusement:.6,pride:.3}},
  {id:'confetti-streamers',vn:'Streamers',f:{curved:1,elaborate:.8,motion:.7},conv:{celebration:.9,playful:.6,joy:.6}},
  {id:'confetti-memphis',vn:'Memphis',f:{elaborate:1,asym:.8,angular:.4,curved:.4},conv:{retro:.8,playful:.8,amusement:.5}},
  {id:'confetti-fall',vn:'Gentle fall',f:{elaborate:.4,sparse:.8,motion:.4},conv:{celebration:.6,joy:.4}}]},
 {fam:'hearts',name:'Hearts',vars:[
  {id:'hearts',vn:'Scattered',f:{curved:1,representational:1},conv:{love:1,warmth:.5}},
  {id:'hearts-line',vn:'Line pattern',f:{curved:1,representational:1,fine:1,harmony:.6},conv:{love:.8,delicate:.5,warmth:.4}},
  {id:'hearts-big',vn:'One big heart',f:{curved:1,representational:1,bold:1,sparse:.6},conv:{love:1,warmth:.6}},
  {id:'hearts-float',vn:'Floating up',f:{curved:1,representational:1,motion:.8,elaborate:.5},conv:{love:.9,joy:.5,playful:.5}}]},
 {fam:'scribble',name:'Scribbles',vars:[
  {id:'scribble',vn:'Loops',f:{curved:.7,organic:1,elaborate:.5},conv:{human:1,playful:.5,amusement:.4}},
  {id:'scribble-marker',vn:'Marker marks',f:{curved:.6,organic:1,rough:1,asym:.6,motion:.6,bold:.4},conv:{human:.9,interest:.3}},
  {id:'scribble-doodle',vn:'Doodles',f:{curved:.6,organic:1,rough:1,elaborate:.8,representational:.5},conv:{human:1,playful:.8,amusement:.6}},
  {id:'scribble-chalk',vn:'Chalk hatching',f:{angular:.6,organic:.7,rough:1,elaborate:.5},conv:{human:.7,ruggedness:.4,retro:.3}}]},
 {fam:'checker',name:'Checkerboard',vars:[
  {id:'checker',vn:'Bottom strip',f:{angular:1,harmony:1},conv:{retro:.7,playful:.4,food:.3}},
  {id:'checker-full',vn:'All over',f:{angular:1,harmony:1,elaborate:.4},conv:{retro:.8,playful:.4}},
  {id:'checker-warp',vn:'Warped',f:{angular:.4,curved:.6,elaborate:.8,asym:.4},conv:{retro:.8,playful:.6}},
  {id:'checker-flag',vn:'Racing flag',f:{angular:1,motion:.8,representational:.6},conv:{energy:.6,fitness:.5,pride:.4}}]},
 {fam:'stars',name:'Night sky',vars:[
  {id:'stars',vn:'Starfield',f:{curved:.3,elaborate:.5},conv:{awe:.9,mystery:.7,calm:.3}},
  {id:'stars-constellation',vn:'Constellations',f:{angular:.4,fine:1,elaborate:.5},conv:{awe:.7,mystery:.5,interest:.4}},
  {id:'stars-shooting',vn:'Shooting stars',f:{motion:1,asym:.6,elaborate:.4},conv:{awe:.6,joy:.4}},
  {id:'stars-moon',vn:'Crescent moon',f:{curved:1,representational:1,sparse:.8},conv:{calm:.6,mystery:.6,awe:.4}}]},
 {fam:'rain',name:'Rain',vars:[
  {id:'rain',vn:'Shower',f:{harmony:.5},conv:{sadness:.8,calm:.3,water:.4,relief:.3}},
  {id:'rain-drizzle',vn:'Drizzle',f:{harmony:.7,fine:1,sparse:.8},conv:{sadness:.6,calm:.5}},
  {id:'rain-storm',vn:'Storm',f:{angular:.5,motion:1,elaborate:.6},conv:{sadness:.5,fear:.5,water:.4}},
  {id:'rain-drops',vn:'Droplets',f:{curved:1,representational:1},conv:{water:.6,sadness:.4,relief:.3}}]},
 {fam:'bolts',name:'Lightning',vars:[
  {id:'bolts',vn:'Forked',f:{angular:1,elaborate:.6},conv:{energy:.8,anger:.5,fear:.5,power:.5,awe:.3}},
  {id:'bolts-single',vn:'One big bolt',f:{angular:1,bold:1,motion:.6},conv:{energy:.9,power:.7}},
  {id:'bolts-arcs',vn:'Electric arcs',f:{angular:1,fine:.8,elaborate:1,asym:.6},conv:{energy:.7,tech:.5,fear:.4}},
  {id:'bolts-icons',vn:'Bolt pattern',f:{angular:1,harmony:1,representational:.6},conv:{energy:.6,playful:.4,tech:.3}}]},
 {fam:'brush',name:'Brush strokes',vars:[
  {id:'brush',vn:'Swash',f:{curved:.6,organic:1,rough:1,motion:.6},conv:{human:.8,beauty:.3}},
  {id:'brush-dabs',vn:'Paint dabs',f:{organic:1,rough:1,elaborate:.6,asym:.6},conv:{human:.7,playful:.5,joy:.3}},
  {id:'brush-enso',vn:'Ink circle',f:{curved:1,organic:1,rough:.6,sparse:.8},conv:{calm:.6,traditional:.3,human:.4}}]},
 {fam:'circuit',name:'Circuitry',vars:[
  {id:'circuit',vn:'Circuit traces',f:{angular:1,harmony:.7,elaborate:.6},conv:{tech:1,competence:.3}},
  {id:'circuit-glitch',vn:'Glitch',f:{angular:1,asym:1,elaborate:.7,motion:.5},conv:{tech:.7,fear:.3,retro:.3}},
  {id:'circuit-scan',vn:'Scanlines',f:{harmony:1,fine:1},conv:{retro:.6,tech:.6,mystery:.3}}]},
 {fam:'florals',name:'Flowers',vars:[
  {id:'florals',vn:'Daisies',f:{curved:1,organic:1,representational:1,elaborate:.4},conv:{natural:.6,joy:.5,playful:.5}},
  {id:'florals-line',vn:'Line blossoms',f:{curved:1,organic:1,representational:1,fine:1},conv:{beauty:.7,delicate:.7,love:.4}},
  {id:'florals-bloom',vn:'One big bloom',f:{curved:1,organic:1,representational:1,bold:1,harmony:1},conv:{natural:.5,beauty:.5,joy:.4}}]},
 {fam:'ornament',name:'Ornament',vars:[
  {id:'ornament',vn:'Damask',f:{curved:1,harmony:1,elaborate:1},conv:{traditional:.8,sophistication:.6}},
  {id:'ornament-rose',vn:'Rose window',f:{curved:.8,angular:.3,harmony:1,elaborate:1,fine:.6},conv:{traditional:.7,mystery:.6,awe:.6}},
  {id:'ornament-thorns',vn:'Thorned vines',f:{curved:.6,angular:.8,organic:1,elaborate:.7,asym:.5},conv:{mystery:.7,fear:.5}}]},
 {fam:'geo',name:'Geometric',vars:[
  {id:'geo',vn:'Bauhaus blocks',f:{curved:.5,angular:.5,bold:1,asym:.6},conv:{modern:.7,retro:.4}},
  {id:'geo-triangles',vn:'Triangle tiles',f:{angular:1,harmony:1,elaborate:.5},conv:{modern:.5,tech:.3}},
  {id:'geo-lines',vn:'Minimal lines',f:{fine:1,sparse:1,harmony:.4,asym:.4},conv:{modern:.8,sophistication:.4}}]},
 {fam:'smoke',name:'Mist and grain',vars:[
  {id:'smoke',vn:'Low fog',f:{curved:1,organic:1,sparse:.5},conv:{mystery:.6,calm:.4,sadness:.3}},
  {id:'smoke-wisps',vn:'Smoke wisps',f:{curved:1,organic:1,motion:.6,fine:.8},conv:{mystery:.7}},
  {id:'smoke-grain',vn:'Film grain',f:{elaborate:.4,rough:.8},conv:{retro:.6,human:.3,mystery:.2}}]}
];
const GRAPHICS = [];
GFAMILIES.forEach(F=>F.vars.forEach(v=>GRAPHICS.push(Object.assign({fam:F.fam,name:F.name},v))));

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
