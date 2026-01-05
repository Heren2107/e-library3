// Frontend-only e-library (IndexedDB)
const qs = s => document.querySelector(s);
const booksGrid = qs('#booksGrid');
const statusEl = qs('#status');
const addBtn = qs('#addBtn');
const modal = qs('#modal');
const closeModal = qs('#closeModal');
const cancelBtn = qs('#cancel');
const form = qs('#bookForm');
const search = qs('#search');
const emptyEl = qs('#empty');
const favToggle = qs('#favToggle');
const favBadge = qs('#favBadge');
const exportBtn = qs('#exportBtn');
const importBtn = qs('#importBtn');
const importFileInput = qs('#importFileInput');
const logoutBtn = qs('#logoutBtn');
// simple toast element
const toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast);

function showToast(msg, ms=1800){ toast.textContent = msg; toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(()=>{ toast.classList.remove('show'); }, ms); }

// animate grid fade when toggling filters
function animateFavoritesToggle(cb){ booksGrid.classList.add('grid-fade'); setTimeout(()=>{ try{ cb && cb(); }catch(e){} booksGrid.classList.remove('grid-fade'); }, 220); }

const DB_NAME = 'elib_db_v1';
const DB_VERSION = 1;
const STORE_BOOKS = 'books';
const STORE_FILES = 'files';

let booksCache = [];
const urlCache = new Map();
let skipAutoSeed = false;
let showOnlyFavs = false;
let isLoggedIn = false;

// ====================
// DATA BUKU DEFAULT (LANGSUNG DI JAVASCRIPT)
// ====================
const DEFAULT_BOOKS = [
  {
    id: 1001,
    title: "Laskar Pelangi",
    author: "Andrea Hirata",
    year: 2005,
    genre: "Novel",
    description: "Kisah tentang persahabatan 10 anak di Belitung yang penuh perjuangan dan mimpi. Novel ini menginspirasi tentang pentingnya pendidikan dan semangat pantang menyerah.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1489104986i/800945.jpg",
    file: "https://www.gutenberg.org/ebooks/1112",
    rating: 4,
    fav: true
  },
  {
    id: 1002,
    title: "Bumi Manusia",
    author: "Pramoedya Ananta Toer",
    year: 1980,
    genre: "Sejarah",
    description: "Novel sejarah tentang pergerakan nasional Indonesia awal abad ke-20. Mengisahkan tentang Minke, pemuda pribumi yang berjuang melawan kolonialisme.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1564709874i/220106.jpg",
    file: "https://www.gutenberg.org/ebooks/39478",
    rating: 5,
    fav: true
  },
  {
    id: 1003,
    title: "Atomic Habits",
    author: "James Clear",
    year: 2018,
    genre: "Self-help",
    description: "Buku tentang membangun kebiasaan kecil yang membawa perubahan besar dalam hidup. Metode praktis untuk mengubah kebiasaan buruk menjadi baik.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg",
    file: "https://jamesclear.com/atomic-habits",
    rating: 4,
    fav: false
  },
  {
    id: 1004,
    title: "Filosofi Teras",
    author: "Henry Manampiring",
    year: 2018,
    genre: "Filsafat",
    description: "Pengenalan stoisisme untuk kehidupan modern yang lebih tenang dan bermakna. Filosofi kuno yang masih relevan di zaman sekarang.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1545465167i/43263654.jpg",
    file: "https://www.gutenberg.org/ebooks/18966",
    rating: 3,
    fav: false
  },
  {
    id: 1005,
    title: "Sapiens: Riwayat Singkat Umat Manusia",
    author: "Yuval Noah Harari",
    year: 2011,
    genre: "Sejarah",
    description: "Sejarah evolusi manusia dari zaman batu hingga era digital. Buku yang mengubah cara pandang tentang peradaban manusia.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1420585954i/23692271.jpg",
    file: "https://www.gutenberg.org/ebooks/23692",
    rating: 5,
    fav: true
  },
  {
    id: 1006,
    title: "The Psychology of Money",
    author: "Morgan Housel",
    year: 2020,
    genre: "Self-help",
    description: "Kumpulan cerita pendek tentang bagaimana orang berpikir tentang uang dan mengambil keputusan finansial.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581421265i/41881472.jpg",
    file: "https://www.gutenberg.org/ebooks/50000",
    rating: 4,
    fav: false
  },
  {
    id: 1007,
    title: "Negeri 5 Menara",
    author: "Ahmad Fuadi",
    year: 2009,
    genre: "Novel",
    description: "Kisah inspiratif tentang perjuangan anak pesantren yang berhasil meraih mimpi hingga ke luar negeri.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1333579119i/11027475.jpg",
    file: "https://www.gutenberg.org/ebooks/40000",
    rating: 4,
    fav: true
  },
  {
    id: 1008,
    title: "Clean Code",
    author: "Robert C. Martin",
    year: 2008,
    genre: "Teknologi",
    description: "Panduan praktis untuk menulis kode yang bersih, mudah dipelihara, dan efisien bagi programmer.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg",
    file: "https://www.gutenberg.org/ebooks/34901",
    rating: 5,
    fav: false
  },
  {
    id: 1009,
    title: "Hujan",
    author: "Tere Liye",
    year: 2016,
    genre: "Novel",
    description: "Kisah romantis dan penuh misteri tentang Lail dan Esok yang dipertemukan kembali setelah 13 tahun.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1484562043i/32768540.jpg",
    file: "https://www.gutenberg.org/ebooks/45000",
    rating: 4,
    fav: false
  },
  {
    id: 1010,
    title: "The Subtle Art of Not Giving a F*ck",
    author: "Mark Manson",
    year: 2016,
    genre: "Self-help",
    description: "Pendekatan kontra-intuitif untuk hidup yang baik dengan fokus pada apa yang benar-benar penting.",
    coverUrl: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1465761302i/28257707.jpg",
    file: "the-subtle-art-of-not-giving-a-fck.pdf",  // PERBAIKI: ./pdfs/ bukan .pdf/
    rating: 3,
    fav: false
  }
];

function setStatus(t,c){ if (!statusEl) return; statusEl.textContent = t; if (c) statusEl.style.color = c }
function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function openIndexedDB(){
	return new Promise((res,rej)=>{
		if (!('indexedDB' in window)) return rej(new Error('no idb'));
		const r = indexedDB.open(DB_NAME, DB_VERSION);
		r.onupgradeneeded = e => { const db = e.target.result; if (!db.objectStoreNames.contains(STORE_BOOKS)) db.createObjectStore(STORE_BOOKS,{ keyPath:'id' }); if (!db.objectStoreNames.contains(STORE_FILES)) db.createObjectStore(STORE_FILES,{ keyPath:'id' }) };
		r.onsuccess = e => res(e.target.result);
		r.onerror = e => rej(e.target.error);
	});
}

// Check session/local storage for login token (login page sets one)
function checkLogin(){ if (localStorage.getItem('elib_logged') || sessionStorage.getItem('elib_logged')){ isLoggedIn = true; if (logoutBtn) logoutBtn.style.display = 'inline-block'; return true } isLoggedIn = false; if (logoutBtn) logoutBtn.style.display = 'none'; return false }

// logout behavior: clear both session/local markers and redirect to login page
if (logoutBtn){ logoutBtn.addEventListener('click', ()=>{ if (!confirm('Keluar dari E-Library?')) return; localStorage.removeItem('elib_logged'); sessionStorage.removeItem('elib_logged'); window.location = './login.html'; }) }

// Immediately ensure user is logged in or redirect to login
if (!checkLogin()){ window.location = './login.html'; }


async function idbPut(store, val){ const db = await openIndexedDB(); return new Promise((res,rej)=>{ const tx = db.transaction(store,'readwrite'); tx.objectStore(store).put(val); tx.oncomplete = ()=>res(); tx.onerror = ()=>rej(tx.error); }) }
async function idbGet(store, key){ const db = await openIndexedDB(); return new Promise((res,rej)=>{ const tx = db.transaction(store,'readonly'); const r = tx.objectStore(store).get(key); r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error); }) }
async function idbGetAll(store){ const db = await openIndexedDB(); return new Promise((res,rej)=>{ const tx = db.transaction(store,'readonly'); const r = tx.objectStore(store).getAll(); r.onsuccess = ()=>res(r.result); r.onerror = ()=>rej(r.error); }) }
async function idbDelete(store, key){ const db = await openIndexedDB(); return new Promise((res,rej)=>{ const tx = db.transaction(store,'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = ()=>res(); tx.onerror = ()=>rej(tx.error); }) }

async function migrateLocalStorage(){ try{ const raw = localStorage.getItem('elib_books_v1'); if (!raw) return; const arr = JSON.parse(raw); if (!Array.isArray(arr)) return; for (const b of arr.reverse()){ const id = b.id || Date.now(); await idbPut(STORE_BOOKS,{ id, title:b.title||'Untitled', author:b.author||'', year:b.year||null, genre:b.genre||'', description:b.description||'', file:b.file||null }); } localStorage.removeItem('elib_books_v1'); console.log('migrated'); }catch(e){} }

// FUNGSI BARU: Memuat buku default jika database kosong
async function loadDefaultBooksIfEmpty() {
    try {
        const existing = await idbGetAll(STORE_BOOKS);
        
        // Jika belum ada buku, load data default dari array DEFAULT_BOOKS
        if (!existing || existing.length === 0) {
            console.log('Database kosong, memuat buku default...');
            
            // Simpan setiap buku dari array DEFAULT_BOOKS
            for (const book of DEFAULT_BOOKS) {
                await idbPut(STORE_BOOKS, book);
            }
            
            console.log(`${DEFAULT_BOOKS.length} buku default berhasil dimuat`);
            showToast(`${DEFAULT_BOOKS.length} buku default tersedia`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading default books:', error);
        return false;
    }
}

// FUNGSI BARU: Impor buku default (untuk tombol)
async function importDefaultBooks() {
    try {
        // Hapus semua buku yang ada
        const db = await openIndexedDB();
        const tx = db.transaction([STORE_BOOKS, STORE_FILES], 'readwrite');
        tx.objectStore(STORE_BOOKS).clear();
        
        await new Promise((res, rej) => {
            tx.oncomplete = res;
            tx.onerror = () => rej(tx.error);
        });
        
        // Tambahkan buku default
        let added = 0;
        for (const book of DEFAULT_BOOKS) {
            await idbPut(STORE_BOOKS, book);
            added++;
        }
        
        await loadBooks(); // Refresh tampilan
        showToast(`Berhasil mengimpor ${added} buku default`);
        return added;
    } catch (error) {
        console.error('Import error:', error);
        alert('Gagal mengimpor buku default');
        return 0;
    }
}

async function loadBooks(){ 
    try{ 
        await migrateLocalStorage();
        
        // TAMBAH INI: Load buku default jika kosong
        await loadDefaultBooksIfEmpty();
        
        // Seed public domain (opsional, bisa dihapus)
        await seedPublicDomainMerge();
        
        const arr = await idbGetAll(STORE_BOOKS);
        booksCache = (arr||[]).sort((a,b)=>b.id - a.id);
        setStatus('Bekerja secara lokal (IndexedDB).','#16a34a');
        render();
    }catch(e){ 
        setStatus('IndexedDB tidak tersedia', '#b45309'); 
        booksCache = []; 
        render(); 
    } 
}

function updateFavCount(){ if (!favBadge) return; const c = booksCache.filter(b=>b.fav).length; favBadge.textContent = String(c); favBadge.style.display = c? 'inline-flex':'none'; }

async function seedPublicDomainMerge(){ if (skipAutoSeed) return; try{ const existing = await idbGetAll(STORE_BOOKS) || []; const keys = new Set(existing.map(b=>((b.title||'').toLowerCase()+'|'+(b.author||'').toLowerCase())));
		try{ const resp = await fetch('./seeds/public_domain_seeds.json'); if (!resp.ok) throw new Error('no'); const seeds = await resp.json(); let idBase = Date.now(); let added=0; for (const s of seeds){ const key = ((s.title||'').toLowerCase()+'|'+(s.author||'').toLowerCase()); if (keys.has(key)) continue; idBase+=1; const fileLink = s.file || (`https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent((s.title||'')+' '+(s.author||''))}`); const rec = { id:idBase, title:s.title, author:s.author, year:s.year||null, genre:s.genre||'', description:s.description||'', file:fileLink, coverUrl:s.coverUrl||null }; await idbPut(STORE_BOOKS, rec); keys.add(key); added++; } if (added) console.log('Added seeds',added); }catch(e){ console.log('no seeds') }
	}catch(e){ console.warn(e) } }

async function saveBookLocal(book, fileBlob){ if (fileBlob){ const fileId = 'f'+Date.now(); await idbPut(STORE_FILES, { id:fileId, name:fileBlob.name||'file.pdf', blob:fileBlob }); book.fileId = fileId; book.file = fileId; } await idbPut(STORE_BOOKS, book); }

async function deleteBookLocal(id){ const book = await idbGet(STORE_BOOKS,id); if (!book) return; if (book.fileId) { await idbDelete(STORE_FILES, book.fileId); const u = urlCache.get(book.fileId); if (u){ URL.revokeObjectURL(u); urlCache.delete(book.fileId) } } if (book.coverId){ await idbDelete(STORE_FILES, book.coverId); const u2 = urlCache.get(book.coverId); if (u2){ URL.revokeObjectURL(u2); urlCache.delete(book.coverId) } } await idbDelete(STORE_BOOKS,id); }

async function getFileUrl(fileId){ if (!fileId) return null; if (urlCache.has(fileId)) return urlCache.get(fileId); try{ const rec = await idbGet(STORE_FILES,fileId); if (!rec || !rec.blob) return null; const obj = URL.createObjectURL(rec.blob); urlCache.set(fileId,obj); return obj; }catch(e){ return null } }

function teaser(text, n=120){ if (!text) return ''; return text.length>n? text.slice(0,n).trim()+'...': text }

// simple debounce helper for input events
function debounce(fn, wait=200){ let t = null; return (...args)=>{ if (t) clearTimeout(t); t = setTimeout(()=>{ t=null; fn(...args) }, wait); } }

function render(){
	booksGrid.innerHTML = '';
	const q = (search && search.value? search.value.trim().toLowerCase() : '');
	const tokens = q? q.split(/\s+/).filter(Boolean) : [];

	// match any book where ALL tokens appear in any of these fields
	const list = booksCache.filter(b => {
		if (!tokens.length) return true;
		return tokens.every(tok => {
			const inTitle = (b.title||'').toLowerCase().includes(tok);
			const inAuthor = (b.author||'').toLowerCase().includes(tok);
			const inGenre = (b.genre||'').toLowerCase().includes(tok);
			const inDesc = (b.description||'').toLowerCase().includes(tok);
			const inYear = (b.year? String(b.year) : '').toLowerCase().includes(tok);
			const inFile = (b.file? String(b.file) : '').toLowerCase().includes(tok);
			const inFileId = (b.fileId? String(b.fileId) : '').toLowerCase().includes(tok);
			const inCover = (b.coverUrl? String(b.coverUrl) : '').toLowerCase().includes(tok);
			const inId = (b.id? String(b.id) : '').includes(tok);
			return inTitle || inAuthor || inGenre || inDesc || inYear || inFile || inFileId || inCover || inId;
		})
	});

	// apply favorites filter if active
	const filtered = showOnlyFavs ? list.filter(b => b.fav) : list;
	if (!filtered.length){ emptyEl.style.display='block'; return } else emptyEl.style.display='none';

	for (const b of filtered){
		const el = document.createElement('article'); el.className='card'; el.setAttribute('data-id', String(b.id));
		const hasExternal = b.file && /^https?:\/\//i.test(b.file);
		const downloadHtml = hasExternal? `<a class="btn ext-download" data-url="${escapeHtml(b.file)}" href="#">Download</a>` : (b.fileId? `<a class="btn" data-fileid="${b.fileId}" href="#">Download</a>` : '');
		const coverHtml = b.coverUrl? `<img class="cover" src="${escapeHtml(b.coverUrl)}" alt="cover">` : (b.coverId? `<img class="cover" data-coverid="${b.coverId}" src="" alt="cover">` : `<div class="cover"></div>`);
		const favHtml = `<div class="fav-wrap"><span class="${b.fav? 'star fav':'star'}" data-action="fav" data-id="${b.id}" title="Favorit">★</span></div>`;

		// rating HTML: 5 stars, mark filled by comparing to b.rating
		const ratingHtml = (function(rate,id){ let out = '<div class="rating" data-id="'+id+'">'; for(let i=1;i<=5;i++){ out += `<span class="rating-star ${rate>=i? 'on':''}" data-action="rate" data-value="${i}" data-id="${id}" title="${i} bintang">★</span>`; } out += '</div>'; return out; })(b.rating||0, b.id);

		el.innerHTML = `${favHtml}<div class="card-inner"><div class="cover-col">${coverHtml}${ratingHtml}</div><div class="card-content"><h3>${escapeHtml(b.title)}</h3><div class="meta">${escapeHtml(b.author||'')} ${b.year? '• '+escapeHtml(String(b.year)) : ''} ${b.genre? '• <span class="tag">'+escapeHtml(b.genre)+'</span>':''}</div><div class="desc">${escapeHtml(teaser(b.description,100))}</div><div class="actions small">${downloadHtml}<button class="btn" data-id="${b.id}" data-action="delete">Hapus</button></div></div></div>`;
		booksGrid.appendChild(el);
	}

	// bind blob download
	booksGrid.querySelectorAll('a[data-fileid]').forEach(a=>{ a.addEventListener('click', async e=>{ e.preventDefault(); if (!isLoggedIn){ if (loginGate) loginGate.style.display = 'flex'; return; } const id = a.getAttribute('data-fileid'); const url = await getFileUrl(id); if (!url) return alert('File tidak tersedia'); const rec = await idbGet(STORE_FILES, id); const name = (rec&&rec.name)||'ebook.pdf'; const link = document.createElement('a'); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); }) })


	// external download handlers
	booksGrid.querySelectorAll('a.ext-download').forEach(a=>{ a.addEventListener('click', async e=>{ e.preventDefault(); if (!isLoggedIn){ if (loginGate) loginGate.style.display = 'flex'; return; } const url = a.getAttribute('data-url'); try{ await tryDirectDownload(url); }catch(err){ window.open(url,'_blank','noopener') } }) })

	// cover blobs
	booksGrid.querySelectorAll('img[data-coverid]').forEach(async img=>{ const cid = img.getAttribute('data-coverid'); const u = await getFileUrl(cid); if (u) img.src = u; })
}

// click handlers for delete
booksGrid.addEventListener('click', async e=>{
	const btn = e.target.closest('button');
	const star = e.target.closest('.star');
	const ratingStar = e.target.closest('.rating-star');
	const card = e.target.closest('.card');
	// delete action
	if (btn && btn.getAttribute('data-action')==='delete'){
		const id = Number(btn.getAttribute('data-id'));
		if (!confirm('Hapus buku ini?')) return;
		try{ await deleteBookLocal(id); await loadBooks(); }catch(err){ alert('Gagal menghapus') }
		return;
	}

	// favorite star toggle
	if (star && star.getAttribute('data-action')==='fav'){
		const id = Number(star.getAttribute('data-id'));
		const book = booksCache.find(b=>b.id===id);
		if (!book) return;
		book.fav = !book.fav;
		try{ await idbPut(STORE_BOOKS, book); }catch(e){ console.error('fav save',e) }
		// animate star briefly
		star.classList.remove('pop');
		void star.offsetWidth;
		star.classList.add('pop');
		render();
		showToast(book.fav? 'Ditandai favorit' : 'Dihapus dari favorit');
		return;
	}

	// rating click
	if (ratingStar && ratingStar.getAttribute('data-action')==='rate'){
		const id = Number(ratingStar.getAttribute('data-id'));
		const val = Number(ratingStar.getAttribute('data-value'));
		const book = booksCache.find(b=>b.id===id);
		if (!book) return;
		book.rating = val;
		try{ await idbPut(STORE_BOOKS, book); }catch(e){ console.error('rating save', e); }
		render();
		showToast(`Dinilai ${val} bintang`);
		return;
	}

	// open detail when clicking a card
	if (card){
		const idAttr = card.getAttribute('data-id'); if (!idAttr) return;
		const bookId = Number(idAttr);
		const book = booksCache.find(b => b.id === bookId);
		if (!book) return;

		const dm = document.getElementById('detailModal');
		const dt = document.getElementById('detailTitle');
		const da = document.getElementById('detailAuthor');
		const dy = document.getElementById('detailYear');
		const dd = document.getElementById('detailDesc');
		const dc = document.getElementById('detailCover');
		const dg = document.getElementById('detailGenre');
		const dl = document.getElementById('detailDownload');

		dt.textContent = book.title || '';
		da.textContent = book.author || '';
		dy.textContent = book.year? '• '+String(book.year):'';
		dd.textContent = book.description||'';
		dg.textContent = book.genre||'';

		// render rating inside detail modal
		const dr = document.getElementById('detailRating');
		if (dr){
			let out = '';
			const r = book.rating || 0;
			for (let i=1;i<=5;i++){ out += `<span class="rating-star ${r>=i? 'on':''}" data-action="rate" data-value="${i}" data-id="${book.id}" title="${i} bintang">★</span>`; }
			dr.innerHTML = out;
		}

		if (book.coverUrl){
			dc.src = book.coverUrl; dc.style.display = 'block';
		} else if (book.coverId){
			const u = await getFileUrl(book.coverId);
			dc.src = u||''; dc.style.display = u? 'block':'none';
		} else dc.style.display = 'none';

			// Download behavior: local blob or try direct-download for external links
			dl.style.display = 'none'; dl.onclick = null; dl.removeAttribute('download'); dl.href = '#';
			if (book.file && /^https?:\/\//i.test(book.file)){
				dl.style.display = 'inline-block'; dl.onclick = async (ev)=>{ ev.preventDefault(); try{ await tryDirectDownload(book.file); }catch(err){ window.open(book.file,'_blank','noopener') } };
			} else if (book.fileId){
				const u2 = await getFileUrl(book.fileId);
				if (u2){ dl.style.display = 'inline-block'; dl.href = u2; const rec = await idbGet(STORE_FILES, book.fileId); dl.download = (rec&&rec.name)||'ebook.pdf'; }
			}

		dm.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
	}
});

// detail modal close
const detailClose = document.getElementById('detailClose'); const detailCloseBtn = document.getElementById('detailCloseBtn'); if (detailClose) detailClose.addEventListener('click', ()=>{ document.getElementById('detailModal').setAttribute('aria-hidden','true'); document.body.style.overflow='auto'; }); if (detailCloseBtn) detailCloseBtn.addEventListener('click', ()=>{ document.getElementById('detailModal').setAttribute('aria-hidden','true'); document.body.style.overflow='auto'; }); document.addEventListener('keydown', e=>{ if (e.key==='Escape'){ const dm = document.getElementById('detailModal'); if (dm && dm.getAttribute('aria-hidden')==='false'){ dm.setAttribute('aria-hidden','true'); document.body.style.overflow='auto'; } } })

// rating clicks inside detail modal (separate delegation because modal is outside booksGrid)
const detailModalEl = document.getElementById('detailModal');
if (detailModalEl){ detailModalEl.addEventListener('click', async (e)=>{ const rs = e.target.closest('.rating-star'); if (!rs) return; const id = Number(rs.getAttribute('data-id')); const val = Number(rs.getAttribute('data-value')); const book = booksCache.find(b=>b.id===id); if (!book) return; book.rating = val; try{ await idbPut(STORE_BOOKS, book); }catch(err){ console.error('detail rating save',err) } // update modal UI and grid
	// update stars in modal
	const dr = document.getElementById('detailRating'); if (dr){ dr.querySelectorAll('.rating-star').forEach(s=>{ const v = Number(s.getAttribute('data-value')); s.classList.toggle('on', v <= val); }); }
	render(); showToast(`Dinilai ${val} bintang`);
 }); }

// add book modal events
addBtn.addEventListener('click', ()=>{ modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }); if (closeModal) closeModal.addEventListener('click', ()=>{ modal.setAttribute('aria-hidden','true'); form.reset(); document.body.style.overflow='auto'; }); if (cancelBtn) cancelBtn.addEventListener('click', ()=>{ modal.setAttribute('aria-hidden','true'); form.reset(); document.body.style.overflow='auto'; }); modal.addEventListener('click', e=>{ if (e.target===modal) { modal.setAttribute('aria-hidden','true'); form.reset(); document.body.style.overflow='auto'; } })

// preview logic: cover and file
const coverPreviewImg = qs('#coverPreview'); const coverUrlInput = qs('#coverUrl'); const coverFileInput = qs('#coverFile'); const fileInput = qs('#fileInput'); const fileUrlInput = qs('#fileUrl'); const fileInfo = qs('#fileInfo');

function resetPreview(){ if (coverPreviewImg) { coverPreviewImg.src=''; coverPreviewImg.style.display='none' } if (fileInfo) fileInfo.textContent='Tidak ada file terpilih'; }

if (coverUrlInput){ coverUrlInput.addEventListener('input', ()=>{ const v = coverUrlInput.value.trim(); if (!v){ if (coverPreviewImg) { coverPreviewImg.src=''; coverPreviewImg.style.display='none' } return } if (coverPreviewImg){ coverPreviewImg.src = v; coverPreviewImg.style.display = 'block' } }); }
if (coverFileInput){ coverFileInput.addEventListener('change', ()=>{ const f = coverFileInput.files && coverFileInput.files[0]; if (!f){ if (coverPreviewImg) { coverPreviewImg.src=''; coverPreviewImg.style.display='none' } return } const reader = new FileReader(); reader.onload = ()=>{ if (coverPreviewImg){ coverPreviewImg.src = reader.result; coverPreviewImg.style.display='block' } }; reader.readAsDataURL(f); }); }

if (fileInput){ fileInput.addEventListener('change', ()=>{ const f = fileInput.files && fileInput.files[0]; if (!f){ if (fileInfo) fileInfo.textContent='Tidak ada file terpilih'; return } if (fileInfo) fileInfo.textContent = `${f.name} — ${Math.round(f.size/1024)} KB`; }); }
if (fileUrlInput){ fileUrlInput.addEventListener('input', ()=>{ const v = fileUrlInput.value.trim(); if (!v){ if (fileInfo) fileInfo.textContent='Tidak ada file terpilih'; return } if (fileInfo) fileInfo.textContent = `URL: ${v}`; }); }

// clear previews when form reset/close
form.addEventListener('reset', ()=>{ setTimeout(()=> resetPreview(),50) }); if (closeModal){ closeModal.addEventListener('click', ()=> resetPreview()); } if (cancelBtn){ cancelBtn.addEventListener('click', ()=> resetPreview()); }

form.addEventListener('submit', async e=>{ e.preventDefault(); const fd = new FormData(form); const title = fd.get('title'); const author = fd.get('author'); const year = fd.get('year')? Number(fd.get('year')): null; const description = fd.get('description'); const file = fd.get('file'); const fileUrl = fd.get('fileUrl'); const coverUrl = fd.get('coverUrl'); const coverFile = fd.get('coverFile'); const genre = fd.get('genre'); if (!title) { alert('Judul wajib'); return } const id = Date.now(); const book = { id, title, author, year, description, genre, coverUrl: coverUrl||null, file: fileUrl||null };
	try{ if (coverFile && coverFile.size && coverFile instanceof File){ const coverId = 'c'+Date.now(); await idbPut(STORE_FILES,{ id:coverId, name:coverFile.name||'cover.jpg', blob:coverFile }); book.coverId = coverId; }
		if (file && file.size && file instanceof File){ await saveBookLocal(book, file); } else { await idbPut(STORE_BOOKS, book); }
		await loadBooks(); modal.setAttribute('aria-hidden','true'); form.reset(); document.body.style.overflow='auto'; }catch(err){ console.error(err); alert('Gagal menyimpan buku'); }
});

// clear all
async function clearAllBooks(){ if (!confirm('Yakin ingin menghapus semua buku?')) return; try{ const db = await openIndexedDB(); const tx = db.transaction([STORE_BOOKS, STORE_FILES],'readwrite'); tx.objectStore(STORE_BOOKS).clear(); tx.objectStore(STORE_FILES).clear(); await new Promise((res,rej)=>{ tx.oncomplete = res; tx.onerror = ()=>rej(tx.error); }); skipAutoSeed = true; booksCache = []; render(); setStatus('Semua buku telah dihapus','#b91c1c'); }catch(e){ console.error(e); alert('Gagal menghapus semua buku'); } }
const clearBtn = document.getElementById('clearBtn'); if (clearBtn) clearBtn.addEventListener('click', ()=> clearAllBooks());

// ----------------------------
// Export / Import Library
// ----------------------------
function blobToDataURL(blob){ return new Promise((res,rej)=>{ const r = new FileReader(); r.onload = ()=>res(r.result); r.onerror = ()=>rej(r.error); r.readAsDataURL(blob); }) }

async function exportLibrary(){ try{
	const books = await idbGetAll(STORE_BOOKS);
	const files = await idbGetAll(STORE_FILES);
	// convert blobs to data URLs
	const filesWithData = await Promise.all((files||[]).map(async f=>{ try{ const data = await blobToDataURL(f.blob); return { id:f.id, name:f.name, data }; }catch(e){ return { id:f.id, name:f.name }; } }));
	const pkg = { exportedAt: Date.now(), books: books||[], files: filesWithData };
	const blob = new Blob([JSON.stringify(pkg, null, 2)], { type:'application/json' });
	const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `elib-export-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
	showToast('Ekspor selesai');
}catch(err){ console.error(err); alert('Gagal mengekspor koleksi'); } }

async function importLibraryFromFile(file){ try{
	const text = await file.text(); const pkg = JSON.parse(text);
	if (!pkg || !Array.isArray(pkg.books)) throw new Error('Invalid file');
	const existing = await idbGetAll(STORE_BOOKS) || [];
	const keys = new Set(existing.map(b=>((b.title||'').toLowerCase()+'|'+(b.author||'').toLowerCase())));
	// import files first
	const fileIdMap = new Map();
	if (Array.isArray(pkg.files)){
		for (const f of pkg.files){ if (!f.data) continue; try{ const blob = await (await fetch(f.data)).blob(); const newId = f.id || ('f'+Date.now()+Math.floor(Math.random()*1000)); await idbPut(STORE_FILES, { id:newId, name:f.name||'file', blob }); fileIdMap.set(f.id, newId); }catch(e){ console.warn('failed import file',e) } }
	}
	// now import books (merge by title|author)
	let added=0;
	for (const b of pkg.books){ const key = ((b.title||'').toLowerCase()+'|'+(b.author||'').toLowerCase()); if (keys.has(key)) continue; const id = Date.now() + Math.floor(Math.random()*1000); const rec = Object.assign({}, b); rec.id = id; // remap fileId if needed
		if (rec.fileId && fileIdMap.has(rec.fileId)) rec.fileId = fileIdMap.get(rec.fileId); if (rec.coverId && fileIdMap.has(rec.coverId)) rec.coverId = fileIdMap.get(rec.coverId);
		await idbPut(STORE_BOOKS, rec); keys.add(key); added++; }
	await loadBooks(); showToast(`Impor selesai, ditambahkan ${added} buku`);
}catch(err){ console.error(err); alert('Gagal mengimpor koleksi: '+(err.message||err)); } }

if (exportBtn) exportBtn.addEventListener('click', exportLibrary);
if (importBtn && importFileInput){ importBtn.addEventListener('click', ()=> importFileInput.click()); importFileInput.addEventListener('change', async e=>{ const f = importFileInput.files && importFileInput.files[0]; if (!f) return; if (!confirm('Impor koleksi dari file? Duplikat akan diabaikan.')) return; await importLibraryFromFile(f); importFileInput.value=''; }); }

// wire search input with debounce
if (search){ const deb = debounce(()=>{ render(); }, 200); search.addEventListener('input', deb); }

// Genre buttons (sidebar) - set search to genre and mark active
function wireGenres(){ const nodes = document.querySelectorAll('.genre'); if (!nodes) return; nodes.forEach(btn=>{ btn.addEventListener('click', ()=>{ // toggle
		const g = btn.textContent.trim(); const cur = (search && search.value || '').trim(); if (cur.toLowerCase() === g.toLowerCase()){ if (search) search.value = ''; btn.classList.remove('active'); } else { if (search) search.value = g; // mark active
			nodes.forEach(n=>n.classList.remove('active')); btn.classList.add('active'); }
		render(); }); }); }

// call once DOM is ready-ish
setTimeout(()=>{ try{ wireGenres() }catch(e){} }, 300);

// mobile hamburger menu wiring
const hamburger = document.getElementById('hamburger'); const mobileMenu = document.getElementById('mobileMenu'); const mTheme = document.getElementById('mTheme'); const mAdd = document.getElementById('mAdd'); const mClear = document.getElementById('mClear');
if (hamburger && mobileMenu){ hamburger.addEventListener('click', ()=>{ const hidden = mobileMenu.getAttribute('aria-hidden')==='true'; mobileMenu.setAttribute('aria-hidden', hidden? 'false':'true'); mobileMenu.style.display = hidden? 'block':'none'; });
	// forward mobile menu actions
	if (mTheme) mTheme.addEventListener('click', ()=>{ themeToggle.click(); mobileMenu.setAttribute('aria-hidden','true'); mobileMenu.style.display='none'; });
	const mFav = document.getElementById('mFav');
	if (mFav) mFav.addEventListener('click', ()=>{ // toggle favorites filter with animation
		showOnlyFavs = !showOnlyFavs; updateFavButtons(); animateFavoritesToggle(()=> render()); mobileMenu.setAttribute('aria-hidden','true'); mobileMenu.style.display='none';
	});
	if (mAdd) mAdd.addEventListener('click', ()=>{ addBtn.click(); mobileMenu.setAttribute('aria-hidden','true'); mobileMenu.style.display='none'; });
	if (mClear) mClear.addEventListener('click', ()=>{ clearBtn.click(); mobileMenu.setAttribute('aria-hidden','true'); mobileMenu.style.display='none'; });
}

// Close mobile menu when clicking outside it (improves mobile UX)
document.addEventListener('click', (e) => {
	try{
		if (!mobileMenu || !hamburger) return;
		if (mobileMenu.getAttribute('aria-hidden') === 'false'){
			if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)){
				mobileMenu.setAttribute('aria-hidden', 'true');
				mobileMenu.style.display = 'none';
			}
		}
	}catch(err){ /* ignore */ }
});

// Close mobile menu on resize/orientation change to avoid it sticking open
window.addEventListener('resize', ()=>{
	if (!mobileMenu) return;
	if (window.innerWidth > 420){ mobileMenu.setAttribute('aria-hidden','true'); mobileMenu.style.display='none'; }
});

// favorite header toggle wiring
if (favToggle){ favToggle.addEventListener('click', ()=>{ showOnlyFavs = !showOnlyFavs; updateFavButtons(); animateFavoritesToggle(()=> render()); }); }

function updateFavButtons(){ if (favToggle){ favToggle.textContent = showOnlyFavs? 'Semua':'Favorit'; favToggle.classList.toggle('active', showOnlyFavs); } const mFavBtn = document.getElementById('mFav'); if (mFavBtn){ mFavBtn.textContent = showOnlyFavs? 'Tampilkan Semua':'Favorit'; } }

// update favorite count in header badge
function refreshFavUI(){ updateFavCount(); updateFavButtons(); }

// keyboard shortcuts: n = new, f = toggle fav filter, / = focus search
document.addEventListener('keydown', (e)=>{
	if (e.target && /input|textarea/i.test(e.target.tagName)) return; // skip when typing
	if (e.key === 'n') { addBtn.click(); }
	if (e.key === 'f') { favToggle && favToggle.click(); }
	if (e.key === '/') { e.preventDefault(); search && search.focus(); }
});

// ----------------------------
// Account menu wiring (header)
// ----------------------------
const accountBtn = qs('#accountBtn');
const accountMenu = qs('#accountMenu');
const accountNameEl = qs('#accountName');
const switchAccountBtn = qs('#switchAccount');
if (accountNameEl){ accountNameEl.textContent = localStorage.getItem('elib_user') || accountNameEl.textContent || 'Akun'; }
if (accountBtn && accountMenu){
	accountBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); const hidden = accountMenu.getAttribute('aria-hidden') === 'true'; accountMenu.setAttribute('aria-hidden', hidden? 'false':'true'); accountMenu.classList.toggle('hidden', !hidden); });

	// close when clicking outside
	document.addEventListener('click', (e)=>{ try{ if (accountMenu.getAttribute('aria-hidden') === 'false'){ if (!accountMenu.contains(e.target) && !accountBtn.contains(e.target)){ accountMenu.setAttribute('aria-hidden','true'); accountMenu.classList.add('hidden'); } } }catch(err){} });

	// close on Escape
	document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape'){ try{ if (accountMenu.getAttribute('aria-hidden') === 'false'){ accountMenu.setAttribute('aria-hidden','true'); accountMenu.classList.add('hidden'); } }catch(err){} } });
}

if (switchAccountBtn){ switchAccountBtn.addEventListener('click', ()=>{ if (!confirm('Ganti akun? Anda akan diarahkan ke halaman login.')) return; localStorage.removeItem('elib_logged'); sessionStorage.removeItem('elib_logged'); window.location = './login.html'; }); }

// helpers: try direct download (simple heuristics)
async function tryDirectDownload(pageUrl){ try{ const u = new URL(pageUrl); if (u.hostname.includes('gutenberg.org')){ if (u.pathname.startsWith('/ebooks/search')) throw new Error('search'); const resp = await fetch(pageUrl); const html = await resp.text(); const m = html.match(/href="(https?:\/\/www\.gutenberg\.org\/files\/\d+\/\d+\.pdf)"/i); if (m && m[1]){ const pdfUrl = m[1]; const bin = await fetch(pdfUrl); if (!bin.ok) throw new Error('pdf failed'); const blob = await bin.blob(); const a = document.createElement('a'); const obj = URL.createObjectURL(blob); a.href = obj; a.download = (pdfUrl.split('/').pop())||'ebook.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(obj); return; } throw new Error('no-pdf'); }
		const head = await fetch(pageUrl, { method:'HEAD' }); const ct = head.headers.get('content-type')||''; if (ct.includes('pdf')){ const r = await fetch(pageUrl); const blob = await r.blob(); const a = document.createElement('a'); const obj = URL.createObjectURL(blob); a.href = obj; a.download = (pageUrl.split('/').pop())||'ebook.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(obj); return; }
		throw new Error('not-direct'); }catch(err){ throw err } }

// init
(async ()=>{ document.getElementById('year').textContent = new Date().getFullYear(); setStatus('Bekerja secara lokal (IndexedDB).','#16a34a'); await loadBooks(); })();
// refresh fav UI after initial load
refreshFavUI();

// ====================
// EVENT LISTENERS UNTUK TOMBOL IMPOR DEFAULT
// ====================

// Tombol Impor Default di header
const importDefaultBtn = qs('#importDefaultBtn');
if (importDefaultBtn) {
    importDefaultBtn.addEventListener('click', async () => {
        if (!confirm('Impor buku default? Buku yang ada akan diganti dengan koleksi default.')) return;
        await importDefaultBooks();
    });
}

// Tombol Impor Default di mobile menu
const mImportDefault = document.getElementById('mImportDefault');
if (mImportDefault) {
    mImportDefault.addEventListener('click', async () => {
        if (!confirm('Impor buku default? Buku yang ada akan diganti dengan koleksi default.')) return;
        await importDefaultBooks();
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.style.display = 'none';
    });
}
