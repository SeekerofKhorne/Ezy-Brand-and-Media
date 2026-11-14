/* ============================================================
   STORE: where brands, posts and images are kept. This file is the only place
   that knows about storage, so a different backend can be added here later.

   Two modes:
   - local (the default, and the only mode when the app runs on its own):
     everything is kept in this browser's IndexedDB. People move work between
     computers and share it with others as files (pack / unpack below).
   - cloud (only when the page is hosted as a Claude artifact, which provides
     window.claude): the viewer's Claude identity is the account, records live
     in their private part of the page database, images in the page's asset
     store, and brands and posts can also be shared by link.
   ============================================================ */
const APP_NAME=(typeof APP_CONFIG!=='undefined'&&APP_CONFIG.name)||'Ezy Brand and Media';
const SHARE_BASE=(typeof APP_CONFIG!=='undefined'&&APP_CONFIG.shareBase)||'';
const uidGen=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const Store=(function(){
  let db=null,user=null,assets=null,uid=null,col=null;
  const S={mode:'local',reason:'',me:{id:null,name:'',avatarUrl:''},ready:false,canShare:false,standalone:!window.claude};
  const cache={brand:new Map(),post:new Map()},imgCache=new Map(),queue={};
  const timeout=(p,ms)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej({code:'timeout'}),ms))]);
  /* --- this browser's storage (IndexedDB) --- */
  let idbP=null;
  function idb(){if(idbP)return idbP;idbP=new Promise((res,rej)=>{try{const r=indexedDB.open('brand-media-lab',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}catch(e){rej(e);}});return idbP;}
  const mem=new Map();
  async function kv(op,key,val){try{const d=await idb();return await new Promise((res,rej)=>{const tx=d.transaction('kv',op==='get'||op==='keys'?'readonly':'readwrite'),st=tx.objectStore('kv');const r=op==='get'?st.get(key):op==='set'?st.put(val,key):op==='del'?st.delete(key):st.getAllKeys();
      /* a write counts as done only when its transaction has committed, so closing the tab right after a save cannot lose it */
      if(op==='set'||op==='del'){tx.oncomplete=()=>res(r.result);tx.onabort=tx.onerror=()=>rej(tx.error||r.error);}else{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}});}
    catch(e){if(op==='get')return mem.get(key);if(op==='set')mem.set(key,val);else if(op==='del')mem.delete(key);else return[...mem.keys()];}}
  function chain(key,fn){const p=(queue[key]||Promise.resolve()).then(fn,fn);queue[key]=p.catch(()=>{});return p;}
  const plain=o=>JSON.parse(JSON.stringify(o));

  async function init(){
    const use=n=>(window.claude&&typeof window.claude.use==='function')?Promise.race([Promise.resolve().then(()=>window.claude.use(n)).catch(()=>null),new Promise(r=>setTimeout(()=>r(null),7000))]):Promise.resolve(null);
    [user,db,assets]=await Promise.all([use('user'),use('db'),use('assets')]);
    if(user){try{const m=await user.me();S.me={id:m.id,name:m.name||'',avatarUrl:m.avatarUrl||''};uid=m.id;}catch(e){}}
    if(db&&uid){try{col=db.collection('data/users/'+uid);const snap=await timeout(col.get(),10000);snap.docs.forEach(d=>{const v=d.data();if(v&&cache[v.kind])cache[v.kind].set(v.id,plain(v));});S.mode='cloud';S.canShare=true;
        if(user.can){const w=await user.can('data.write');if(w===false){S.mode='local';S.canShare=false;S.reason='Your access to this page is view-only, so your work is kept in this browser only. Ask the owner for Contributor access to save to your account.';}}}
      catch(e){S.mode='local';S.reason='Your account storage could not be reached, so your work is kept in this browser for now.';}}
    else S.reason=!window.claude?'Your work is saved in this browser, on this device. Nothing is uploaded. To keep a copy or move to another computer, use Back up everything under Brands and posts.':'No signed-in account was found for this page, so your work is kept in this browser only.';
    if(S.mode==='local'){const keys=await kv('keys')||[];for(const k of keys){const m=/^(brand|post):/.exec(k);if(m){const v=await kv('get',k);if(v)cache[m[1]].set(v.id,v);}}}
    S.ready=true;return S;}
  function all(kind){return[...cache[kind].values()].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));}
  function get(kind,id){return cache[kind].get(id)||null;}
  async function put(kind,obj){obj.kind=kind;obj.updatedAt=Date.now();const v=plain(obj);cache[kind].set(v.id,v);
    if(S.mode==='cloud'){try{await chain(kind+v.id,()=>col.doc(kind+'_'+v.id).set(v));return true;}
      catch(e){if(e&&e.code==='invalid_argument'&&JSON.stringify(v).length>240000)throw{code:'too_large'};if(e&&(e.code==='invalid_argument'||e.code==='revoked'||e.code==='not_granted')){S.mode='local';S.canShare=false;S.reason='This page would not accept the save, so your work is kept in this browser only. You may have view-only access.';await kv('set',kind+':'+v.id,v);return true;}throw e;}}
    await kv('set',kind+':'+v.id,v);return true;}
  async function del(kind,id){cache[kind].delete(id);if(S.mode==='cloud'){try{await chain(kind+id,()=>col.doc(kind+'_'+id).delete());}catch(e){}}else await kv('del',kind+':'+id);}

  /* --- images: ref strings. a:<asset id> (account), l:<id> (this browser), mem:<id> (this session) --- */
  const memBlobs=new Map();
  function memRef(blob){const id='mem:'+uidGen();memBlobs.set(id,blob);return id;}
  async function refBlob(ref){if(memBlobs.has(ref))return memBlobs.get(ref);if(ref.startsWith('l:'))return await kv('get','img:'+ref.slice(2));if(ref.startsWith('a:')){const r=await fetch('/_blob/'+ref.slice(2));return await r.blob();}return null;}
  async function persistRef(ref){if(!ref||!ref.startsWith('mem:'))return ref;const blob=memBlobs.get(ref);if(!blob)return null;let out;
    if(S.mode==='cloud'&&assets){try{const r=await assets.upload(blob);out='a:'+r.id;}catch(e){return ref;}}
    else if(S.mode==='cloud')return ref;
    else{const id=uidGen();await kv('set','img:'+id,blob);out='l:'+id;}
    if(imgCache.has(ref))imgCache.set(out,imgCache.get(ref));return out;}
  function loadImage(ref){if(!ref)return Promise.resolve(null);if(imgCache.has(ref))return imgCache.get(ref);
    const p=(async()=>{let url;if(ref.startsWith('a:'))url='/_blob/'+ref.slice(2);else{const b=await refBlob(ref);if(!b)return null;url=URL.createObjectURL(b);}
      return await new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=url;});})();
    imgCache.set(ref,p);return p;}
  const imagesSaved=()=>S.mode!=='cloud'||!!assets;

  /* --- share links: a snapshot other accounts on this page can open and copy --- */
  async function share(kind,data){if(!S.canShare)throw{code:'no_share'};const code=(Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-5));
    const body={kind,at:Date.now(),data:plain(data)};if(JSON.stringify(body).length>240000)throw{code:'too_large'};
    await db.doc('shares/'+uid+'/items/'+code).set(body);await db.doc('links/'+code).set({u:uid,kind,at:body.at});return{code,url:(SHARE_BASE||location.href.split('#')[0])+'#s-'+code};}
  async function getShare(code){if(!db)return{error:'signin'};try{const l=await timeout(db.doc('links/'+code).get(),10000);if(!l.exists)return{error:'missing'};const u=l.data().u;const s=await timeout(db.doc('shares/'+u+'/items/'+code).get(),10000);if(!s.exists)return{error:'missing'};
      let by='';try{if(user&&user.profiles){const ps=await user.profiles([u]);by=(ps[u]&&ps[u].name)||'';}}catch(e){}
      return Object.assign({by,mine:u===uid},plain(s.data()));}catch(e){return{error:'unreachable'};}}
  /* --- files: a brand, a post or a whole backup as one JSON file, images included --- */
  const FILE_APP='brand-media-lab';
  const toDataURL=b=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>rej(fr.error);fr.readAsDataURL(b);});
  function fromDataURL(u){const m=/^data:([^;,]*)(;base64)?,(.*)$/s.exec(u);if(!m)return null;if(!m[2])return new Blob([decodeURIComponent(m[3])],{type:m[1]});const bin=atob(m[3]),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:m[1]||'application/octet-stream'});}
  /* image references sit under the keys logo, photo and ref */
  function walkRefs(o,fn){if(!o||typeof o!=='object')return;for(const k of Object.keys(o)){const v=o[k];if(typeof v==='string'){if((k==='logo'||k==='photo'||k==='ref')&&/^(a|l|mem):/.test(v))o[k]=fn(v);}else walkRefs(v,fn);}}
  async function pack(kind,data){const body=plain(data),refs=new Set();walkRefs(body,r=>{refs.add(r);return r;});const images={};let lost=0;
    for(const r of refs){try{const b=await refBlob(r);if(b)images[r]=await toDataURL(b);else lost++;}catch(e){lost++;}}
    return{file:{app:FILE_APP,v:1,kind,at:Date.now(),by:S.me.name||'',data:body,images},lost};}
  async function unpack(file){if(!file||typeof file!=='object')throw{code:'bad_file'};
    if(!file.app&&(Array.isArray(file.brands)||Array.isArray(file.posts)))file={app:FILE_APP,v:1,kind:'backup',data:{brands:file.brands||[],posts:file.posts||[]},images:{}};
    if(file.app!==FILE_APP||!file.data||!/^(brand|post|backup)$/.test(file.kind))throw{code:'bad_file'};
    const map={};for(const r of Object.keys(file.images||{})){try{const b=fromDataURL(file.images[r]);if(b){const m=memRef(b);map[r]=(await persistRef(m))||m;}}catch(e){}}
    const data=plain(file.data),noImages=!Object.keys(file.images||{}).length;let lost=0;walkRefs(data,r=>{if(map[r])return map[r];if(noImages&&!r.startsWith('mem:'))return r;lost++;return null;});return{kind:file.kind,by:file.by||'',data,lost};}
  async function exportAll(){return(await pack('backup',{brands:all('brand'),posts:all('post')})).file;}
  return{S,init,all,get,put,del,memRef,persistRef,loadImage,refBlob,imagesSaved,share,getShare,exportAll,pack,unpack};
})();
