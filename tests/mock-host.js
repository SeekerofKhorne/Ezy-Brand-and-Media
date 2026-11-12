/* A stand-in for the runtime a Claude artifact page is given (window.claude), used
   only by the tests, so the "hosted with accounts" branch of src/store.js stays
   covered. The signed-in user comes from ?u=<n> in the address. The database lives
   in localStorage so two pages in one browser profile act as two accounts on the
   same page. Privacy rules mirror the real ones: data/users/<id>/ is readable only
   by that user, and shares/<id>/ is writable only by that user. */
(() => {
  const U = new URLSearchParams(location.search).get('u') || '1', uid = 'u_' + U, KEY = 'mockdb';
  const load = () => JSON.parse(localStorage.getItem(KEY) || '{}'), save = d => localStorage.setItem(KEY, JSON.stringify(d));
  const visible = p => { const m = /^data\/users\/([^/]+)/.exec(p); return !m || m[1] === uid; };
  const docRef = path => ({
    id: path.split('/').pop(), path,
    async get() { const d = load(), ok = visible(path) && (path in d); return { id: path.split('/').pop(), exists: ok, data: () => (ok ? d[path] : undefined) }; },
    async set(v) {
      const m = /^shares\/([^/]+)/.exec(path);
      if (!visible(path) || (m && m[1] !== uid) || JSON.stringify(v).length > 262144) throw { code: 'invalid_argument' };
      const d = load(); d[path] = JSON.parse(JSON.stringify(v)); save(d);
    },
    async delete() { const d = load(); delete d[path]; save(d); },
  });
  const colRef = path => ({
    path, doc: id => docRef(path + '/' + (id || Math.random().toString(36).slice(2))),
    async get() { const d = load(); const docs = Object.keys(d).filter(k => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/') && visible(k)).map(k => ({ id: k.split('/').pop(), exists: true, data: () => d[k] })); return { docs, size: docs.length, empty: !docs.length }; },
  });
  const db = { doc: docRef, collection: colRef };
  const user = { me: async () => ({ id: uid, name: 'Tester ' + U, avatarUrl: '' }), id: async () => uid, can: async () => true, profiles: async ids => Object.fromEntries([].concat(ids).map(i => [i, { id: i, name: 'Tester ' + i.slice(2) }])) };
  const assets = { upload: async blob => { const id = 'as' + Math.random().toString(36).slice(2); const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); }); await window.testAsset(id, url); return { id, url: '/_blob/' + id }; } };
  window.__saved = [];
  const downloads = { save: async ({ filename, data }) => { window.__saved.push({ filename, data }); return { status: 'saved' }; } };
  window.claude = { use: async n => ({ db, user, assets, downloads })[n] || null };
})();
