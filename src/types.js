/* ============================================================
   TYPE: display + body pairings. `cls` = family for the filter.
   `f` = design features the tagging rules read (see tagType).
   ============================================================ */
const FB = {sans:'system-ui, -apple-system, "Segoe UI", sans-serif',serif:'Georgia, "Times New Roman", serif',mono:'ui-monospace, Menlo, Consolas, monospace',script:'"Brush Script MT", cursive'};
const TYPE_CLASSES = [['all','All'],['sans','Sans'],['serif','Serif'],['slab','Slab'],['script','Script and hand'],['display','Display'],['mono','Mono']];
const D=(family,weight,fb,x)=>Object.assign({family,weight,fb:FB[fb]},x||{});
const TYPESETS = [
 /* sans */
 {id:'clear',cls:'sans',name:'Clear Sans',display:D('Source Sans 3',700,'sans'),body:D('Source Sans 3',400,'sans'),f:{sans:1,harmony:1},conv:{health:.4}},
 {id:'humanist',cls:'sans',name:'Humanist Sans',display:D('Open Sans',700,'sans'),body:D('Open Sans',400,'sans'),f:{sans:1,harmony:1},conv:{health:.3}},
 {id:'neo-grotesk',cls:'sans',name:'Neutral Grotesk',display:D('Inter',700,'sans'),body:D('Inter',400,'sans'),f:{sans:1,harmony:1},conv:{tech:.5}},
 {id:'geometric',cls:'sans',name:'Geometric Sans',display:D('Montserrat',700,'sans'),body:D('Montserrat',400,'sans'),f:{sans:1,geometric:1,harmony:1},conv:{}},
 {id:'poppins',cls:'sans',name:'Round Geometric',display:D('Poppins',600,'sans'),body:D('Poppins',400,'sans'),f:{sans:1,geometric:1,rounded:.3},conv:{}},
 {id:'soft-grotesk',cls:'sans',name:'Soft Grotesk',display:D('DM Sans',500,'sans'),body:D('DM Sans',400,'sans'),f:{sans:1,geometric:1,harmony:1,light:1},conv:{modern:.4}},
 {id:'elegant-sans',cls:'sans',name:'Elegant Sans',display:D('Raleway',600,'sans'),body:D('Raleway',400,'sans'),f:{sans:1,geometric:1,light:1},conv:{sophistication:.4,beauty:.4}},
 {id:'wide-tech',cls:'sans',name:'Wide Tech Sans',display:D('Sora',700,'sans'),body:D('Sora',400,'sans'),f:{sans:1,geometric:1},conv:{tech:.6}},
 {id:'quirky-grotesk',cls:'sans',name:'Quirky Grotesk',display:D('Space Grotesk',700,'sans'),body:D('Space Grotesk',400,'sans'),f:{sans:1,geometric:1,elaborate:.3},conv:{tech:.6,excitement:.3}},
 {id:'rounded',cls:'sans',name:'Friendly Rounded',display:D('Nunito',800,'sans'),body:D('Nunito',400,'sans'),f:{sans:1,rounded:1},conv:{health:.3}},
 {id:'soft-round',cls:'sans',name:'Gentle Rounded',display:D('Quicksand',700,'sans'),body:D('Quicksand',500,'sans'),f:{sans:1,rounded:1,light:.6},conv:{}},
 {id:'rubik',cls:'sans',name:'Soft-corner Sans',display:D('Rubik',700,'sans'),body:D('Rubik',400,'sans'),f:{sans:1,rounded:.5},conv:{}},
 {id:'condensed',cls:'sans',name:'Bold Condensed',display:D('Oswald',600,'sans',{upper:true}),body:D('Source Sans 3',400,'sans'),f:{sans:1,heavy:.8,condensed:1,display:1},conv:{fitness:.7}},
 {id:'tall-caps',cls:'sans',name:'Tall Capitals',display:D('Bebas Neue',400,'sans'),body:D('Source Sans 3',400,'sans'),f:{sans:1,heavy:.6,condensed:1,display:1},conv:{fitness:.5,celebration:.3}},
 {id:'impact',cls:'sans',name:'Heavy Impact',display:D('Archivo Black',400,'sans'),body:D('Archivo',400,'sans'),f:{sans:1,heavy:1,display:1},conv:{fitness:.4}},
 {id:'loud-condensed',cls:'sans',name:'Loud Condensed',display:D('Anton',400,'sans'),body:D('Archivo',400,'sans'),f:{sans:1,heavy:1,condensed:1,display:1},conv:{}},
 /* serif */
 {id:'reassuring-serif',cls:'serif',name:'Reassuring Serif',display:D('Lora',600,'serif'),body:D('Lora',400,'serif'),f:{serif:1,harmony:1},conv:{}},
 {id:'garamond',cls:'serif',name:'Old-style Serif',display:D('EB Garamond',600,'serif'),body:D('EB Garamond',400,'serif'),f:{serif:1,harmony:1,oldstyle:1},conv:{}},
 {id:'baskerville',cls:'serif',name:'Transitional Serif',display:D('Libre Baskerville',700,'serif'),body:D('Libre Baskerville',400,'serif'),f:{serif:1,harmony:1},conv:{finance:.3}},
 {id:'screen-serif',cls:'serif',name:'Sturdy Reading Serif',display:D('Merriweather',700,'serif'),body:D('Merriweather',400,'serif'),f:{serif:1,harmony:.7,heavy:.3},conv:{}},
 {id:'soft-serif',cls:'serif',name:'Soft Serif',display:D('Fraunces',600,'serif'),body:D('Source Sans 3',400,'sans'),f:{serif:1,natural:.6,rounded:.4},conv:{food:.5,natural:.4}},
 {id:'editorial',cls:'serif',name:'Editorial Serif',display:D('Playfair Display',700,'serif'),body:D('Source Serif 4',400,'serif'),f:{serif:1,contrast:1,flourish:.4},conv:{beauty:.4}},
 {id:'didone',cls:'serif',name:'Fashion Didone',display:D('Bodoni Moda',700,'serif'),body:D('Source Serif 4',400,'serif'),f:{serif:1,contrast:1,flourish:.3},conv:{beauty:.5}},
 {id:'fine-serif',cls:'serif',name:'Fine Serif',display:D('Cormorant Garamond',600,'serif'),body:D('Source Serif 4',400,'serif'),f:{serif:1,contrast:1,light:1,flourish:.6,memorial:1},conv:{beauty:.5}},
 {id:'bold-serif',cls:'serif',name:'Confident Serif',display:D('DM Serif Display',400,'serif'),body:D('DM Sans',400,'sans'),f:{serif:1,contrast:1,heavy:.5},conv:{food:.3}},
 {id:'roman-caps',cls:'serif',name:'Roman Capitals',display:D('Cinzel',700,'serif'),body:D('Lora',400,'serif'),f:{serif:1,glyphic:1,harmony:1},conv:{}},
 {id:'fat-face',cls:'serif',name:'Fat Face',display:D('Abril Fatface',400,'serif'),body:D('Lora',400,'serif'),f:{serif:1,contrast:1,heavy:.9,display:1},conv:{food:.3}},
 /* slab */
 {id:'slab',cls:'slab',name:'Sturdy Slab',display:D('Roboto Slab',700,'serif'),body:D('Source Sans 3',400,'sans'),f:{serif:1,slab:1,heavy:.7},conv:{}},
 {id:'friendly-slab',cls:'slab',name:'Friendly Slab',display:D('Bitter',700,'serif'),body:D('Bitter',400,'serif'),f:{serif:1,slab:1,harmony:.6},conv:{}},
 {id:'heavy-slab',cls:'slab',name:'Poster Slab',display:D('Alfa Slab One',400,'serif'),body:D('Source Sans 3',400,'sans'),f:{serif:1,slab:1,heavy:1,display:1},conv:{}},
 {id:'western',cls:'slab',name:'Western',display:D('Rye',400,'serif'),body:D('Bitter',400,'serif'),f:{slab:1,western:1,display:1,elaborate:.7,heavy:.5},conv:{}},
 /* script and hand */
 {id:'formal-script',cls:'script',name:'Formal Script',display:D('Great Vibes',400,'script',{scale:1.15}),body:D('Lora',400,'serif'),f:{script:1,flourish:1,natural:.5,light:1},conv:{celebration:.5,beauty:.5}},
 {id:'casual-script',cls:'script',name:'Casual Script',display:D('Dancing Script',700,'script',{scale:1.1}),body:D('Lora',400,'serif'),f:{script:.6,natural:.8,flourish:.5},conv:{celebration:.4,food:.3}},
 {id:'brush-script',cls:'script',name:'Retro Brush Script',display:D('Pacifico',400,'script'),body:D('Nunito',400,'sans'),f:{hand:1,natural:.8,retro:.7,heavy:.3},conv:{food:.5,water:.3}},
 {id:'handwritten',cls:'script',name:'Handwritten',display:D('Caveat',700,'script',{scale:1.2}),body:D('Nunito',400,'sans'),f:{hand:1,natural:1},conv:{food:.3}},
 {id:'note-hand',cls:'script',name:'Notebook Hand',display:D('Kalam',700,'script'),body:D('Kalam',400,'script'),f:{hand:1,natural:1},conv:{}},
 {id:'marker',cls:'script',name:'Marker',display:D('Permanent Marker',400,'script'),body:D('Nunito',400,'sans'),f:{hand:1,natural:.7,marker:1,heavy:.6},conv:{}},
 {id:'craft-caps',cls:'script',name:'Hand-drawn Capitals',display:D('Amatic SC',700,'script',{scale:1.25}),body:D('Nunito',400,'sans'),f:{hand:1,natural:1,condensed:.5,light:.6},conv:{food:.4,natural:.4}},
 /* display */
 {id:'bubbly',cls:'display',name:'Playful Rounded',display:D('Fredoka',600,'sans'),body:D('Nunito',400,'sans'),f:{sans:1,rounded:1,heavy:.5,display:1},conv:{playful:.5,celebration:.4}},
 {id:'comic',cls:'display',name:'Comic',display:D('Bangers',400,'sans'),body:D('Nunito',400,'sans'),f:{comic:1,display:1,heavy:.5,elaborate:.5},conv:{playful:.6}},
 {id:'retro-display',cls:'display',name:'Retro Rounded',display:D('Righteous',400,'sans'),body:D('DM Sans',400,'sans'),f:{display:1,retro:1,rounded:.5,heavy:.4},conv:{}},
 {id:'deco',cls:'display',name:'Art Deco',display:D('Poiret One',400,'sans'),body:D('DM Sans',400,'sans'),f:{display:1,deco:1,light:1,geometric:1},conv:{celebration:.3,beauty:.3}},
 {id:'art-sans',cls:'display',name:'Art-school Sans',display:D('Syne',700,'sans'),body:D('Syne',400,'sans'),f:{sans:1,display:1,elaborate:.6},conv:{excitement:.5}},
 {id:'futuristic',cls:'display',name:'Futuristic',display:D('Orbitron',700,'sans'),body:D('Exo 2',400,'sans'),f:{display:1,futuristic:1,geometric:1,elaborate:.4},conv:{}},
 {id:'pixel',cls:'display',name:'Pixel',display:D('Press Start 2P',400,'mono',{scale:.62}),body:D('IBM Plex Mono',600,'mono'),f:{display:1,pixel:1,elaborate:.5},conv:{playful:.4}},
 {id:'stencil',cls:'display',name:'Stencil',display:D('Black Ops One',400,'sans'),body:D('Archivo',400,'sans'),f:{display:1,stencil:1,heavy:1},conv:{fitness:.3}},
 {id:'blackletter',cls:'display',name:'Blackletter',display:D('Pirata One',400,'serif',{scale:1.1}),body:D('Source Serif 4',400,'serif'),f:{display:1,blackletter:1,elaborate:1,heavy:.5},conv:{}},
 {id:'horror',cls:'display',name:'Horror',display:D('Creepster',400,'serif',{scale:1.1}),body:D('Special Elite',400,'mono'),f:{display:1,horror:1,elaborate:1},conv:{}},
 /* mono */
 {id:'mono',cls:'mono',name:'Technical Mono',display:D('IBM Plex Mono',600,'mono'),body:D('IBM Plex Sans',400,'sans'),f:{mono:1},conv:{finance:.3}},
 {id:'code-mono',cls:'mono',name:'Code Mono',display:D('JetBrains Mono',700,'mono'),body:D('JetBrains Mono',400,'mono'),f:{mono:1},conv:{}},
 {id:'space-mono',cls:'mono',name:'Retro Mono',display:D('Space Mono',700,'mono'),body:D('Space Mono',400,'mono'),f:{mono:1,retro:.6,elaborate:.3},conv:{}},
 {id:'typewriter',cls:'mono',name:'Typewriter',display:D('Special Elite',400,'mono'),body:D('Special Elite',400,'mono'),f:{typewriter:1,retro:1,natural:.3},conv:{}}
];
