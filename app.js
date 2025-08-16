/* app.js — tout est piloté par site.config.json (pas d'HTML généré dans le JS) */
(async function () {
  // --- Utils --------------------------------------------------------------
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const byPath = (obj, path) => path.split('.').reduce((o,k)=> (o && k in o ? o[k] : undefined), obj);

  // --- Charge config ------------------------------------------------------
  let cfg;
  try {
    const res = await fetch('site.config.json', { cache: 'no-store' });
    cfg = await res.json();
  } catch (e) {
    console.error('site.config.json introuvable', e);
    return;
  }

  // --- META ---------------------------------------------------------------
  if (cfg.meta?.title) document.title = cfg.meta.title;
  const mDesc = $('meta[name="description"]'); if (mDesc && cfg.meta?.description) mDesc.content = cfg.meta.description;
  const mOg   = $('meta[property="og:image"]'); if (mOg && cfg.meta?.og_image) mOg.content = cfg.meta.og_image;

  // --- Texte statique via data-text / data-placeholder / data-attr-src ----
  $$('[data-text]').forEach(el => {
    const val = byPath(cfg, el.getAttribute('data-text'));
    if (val != null) el.textContent = val;
  });
  $$('[data-placeholder]').forEach(el => {
    const val = byPath(cfg, el.getAttribute('data-placeholder'));
    if (val != null) el.setAttribute('placeholder', val);
  });
  $$('[data-attr-src]').forEach(el => {
    const path = el.getAttribute('data-attr-src');
    const val = byPath(cfg, path);
    if (val) el.setAttribute('src', val);
  });

  // --- Brand / logos / liens ---------------------------------------------
  $$('.brand-name').forEach(el => el.textContent = cfg.brand?.name || '');
  const logo = $('#brand-logo');
  if (logo && cfg.brand?.logo) { logo.src = cfg.brand.logo; logo.alt = cfg.brand.name || ''; logo.hidden = false; }
  const logoFooter = $('#brand-logo-footer');
  if (logoFooter && cfg.brand?.logo) { logoFooter.src = cfg.brand.logo; logoFooter.alt = cfg.brand.name || ''; }
  const sepLogo = $('#separator-logo');
  if (sepLogo && cfg.brand?.logo) { sepLogo.src = cfg.brand.logo; sepLogo.alt = cfg.brand.name || ''; }

  // Liens contact / réseaux
  if (cfg.brand?.email) { const a=$('#contact-email'); if (a){ a.href = `mailto:${cfg.brand.email}`; a.textContent = cfg.brand.email; } }
  if (cfg.brand?.phone_e164) { const p=$('#contact-phone'); if (p){ p.href = `tel:${cfg.brand.phone_e164}`; p.textContent = cfg.brand.phone_display || cfg.brand.phone_e164; } }
  if (cfg.brand?.zone) $('#zone').textContent = cfg.brand.zone;
  $$('.ig-link').forEach(a => { if (a && cfg.brand?.instagram){ a.href = cfg.brand.instagram; a.textContent = cfg.copy?.nav?.instagram || 'Instagram'; } });

  // --- Hero (vidéo ou image) ---------------------------------------------
  (function hero() {
    const v = $('#hero-video');
    const img = $('#hero-image');
    if (v && cfg.hero?.video) {
      const s = document.createElement('source');
      s.src = cfg.hero.video; s.type = 'video/mp4';
      v.appendChild(s);
      v.addEventListener('error', ()=>{ v.classList.add('hidden'); img?.classList.remove('hidden'); });
    } else if (img && cfg.hero?.image) {
      img.src = cfg.hero.image; img.classList.remove('hidden');
    }
    $('#hero-title').innerHTML = cfg.hero?.title_html || '';
    $('#hero-subtitle').textContent = cfg.hero?.subtitle || '';

    const bullets = $('#hero-bullets');
    if (bullets && Array.isArray(cfg.hero?.bullets)) {
      bullets.innerHTML = '';
      cfg.hero.bullets.forEach(b=>{
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2';
        li.textContent = b;
        bullets.appendChild(li);
      });
    }
    const c1 = $('#cta-primary');  if (c1 && cfg.hero?.cta_primary){ c1.textContent = cfg.hero.cta_primary.label; c1.href = cfg.hero.cta_primary.href; }
    const c2 = $('#cta-secondary'); if (c2 && cfg.hero?.cta_secondary){ c2.textContent = cfg.hero.cta_secondary.label; c2.href = cfg.hero.cta_secondary.href; }
  })();

  // --- Heures -------------------------------------------------------------
  (function hours(){
    const wrap = $('#hours'); if (!wrap || !Array.isArray(cfg.hours)) return;
    wrap.innerHTML = '';
    cfg.hours.forEach(([label, val])=>{
      const s1 = document.createElement('span'); s1.textContent = label;
      const s2 = document.createElement('span'); s2.textContent = val;
      if (/Sur/i.test(val)) s2.classList.add('text-slate-500');
      s2.classList.add('text-right');
      wrap.append(s1,s2);
    });
  })();

  // --- Plans --------------------------------------------------------------
  (function plans(){
    const grid = $('#plans-grid'); if (!grid || !Array.isArray(cfg.plans)) return;
    const tplPlan = $('#tpl-plan');
    const tplBadge = $('#tpl-price-badge');
    const tplBullet = $('#tpl-bullet');
    grid.innerHTML = '';

    cfg.plans.forEach(p=>{
      const card = tplPlan.content.firstElementChild.cloneNode(true);
      $('[data-text="name"]', card).textContent = p.name;

      const bulletsUl = $('[data-list="bullets"]', card);
      bulletsUl.innerHTML = '';
      (p.bullets || []).forEach(txt=>{
        const li = tplBullet.content.firstElementChild.cloneNode(true);
        $('[data-text="."]', li).textContent = txt;
        bulletsUl.appendChild(li);
      });

      const prices = Array.isArray(p.prices) ? p.prices
                    : (p.price ? [{label:'Citadine', amount:p.price},{label:'SUV', amount:p.price}] : []);
      const priceWrap = $('[data-list="prices"]', card);
      priceWrap.innerHTML = '';
      prices.forEach(pr=>{
        const b = tplBadge.content.firstElementChild.cloneNode(true);
        $('[data-text="label"]', b).textContent = pr.label;
        $('[data-text="amount"]', b).textContent = pr.amount;
        priceWrap.appendChild(b);
      });

      const note = $('[data-text="note"]', card);
      if (p.note) note.textContent = p.note; else note.remove();

      grid.appendChild(card);
    });

    const cta = $('#plans-cta');
    if (cta){
      cta.innerHTML = '';
      const a = document.createElement('a');
      a.className = 'inline-flex items-center gap-2 rounded-full bg-brand-600 text-white px-6 py-3 hover:bg-brand-700 shadow-soft';
      a.href = '#contact';
      a.textContent = cfg.copy?.sections?.cta_final?.button || 'Nous contacter';
      cta.appendChild(a);
    }
  })();

  // --- Services -----------------------------------------------------------
  (function services(){
    const wrap = $('#services-cards'); if (!wrap || !Array.isArray(cfg.services)) return;
    const tpl = $('#tpl-service');
    wrap.innerHTML = '';
    cfg.services.forEach(s=>{
      const card = tpl.content.firstElementChild.cloneNode(true);
      $('[data-html="icon"]', card).innerHTML = s.icon || '🚗';
      $('[data-text="title"]', card).textContent = s.title || '';
      $('[data-text="text"]', card).textContent = s.text || '';
      wrap.appendChild(card);
    });
  })();

  // --- Galerie (Carousel) -------------------------------------------------
  (function gallery(){
    const track = $('#gallery-track'); if (!track || !Array.isArray(cfg.gallery)) return;
    const tpl = $('#tpl-gallery-slide');
    const dotsWrap = $('#gallery-dots');
    const prev = $('#gal-prev'), next = $('#gal-next');

    track.innerHTML = '';
    cfg.gallery.forEach(g=>{
      const slide = tpl.content.firstElementChild.cloneNode(true);
      const img = $('[data-attr-src="src"]', slide);
      const cap = $('[data-text="caption"]', slide);
      img.src = g.src; img.alt = g.alt || '';
      if (cap) cap.textContent = g.caption || '';
      track.appendChild(slide);
    });

    const slides = Array.from(track.children);
    const perView = window.innerWidth >= 768 ? 2 : 1;
    const pages = Math.max(1, Math.ceil(slides.length / perView));
    let index = 0, timer;

    function go(i){
      index = (i + pages) % pages;
      track.style.transform = `translateX(${-100*index}%)`;
      if (dotsWrap) dotsWrap.querySelectorAll('button').forEach((b,bi)=>{
        b.className = 'h-2.5 w-2.5 rounded-full ' + (bi===index ? 'bg-brand-600' : 'bg-slate-300 hover:bg-slate-400');
      });
      if (timer) clearInterval(timer);
      timer = setInterval(()=>go(index+1), 5000);
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      Array.from({length:pages}).forEach((_,i)=>{
        const b=document.createElement('button');
        b.className = 'h-2.5 w-2.5 rounded-full ' + (i===0?'bg-brand-600':'bg-slate-300 hover:bg-slate-400');
        b.setAttribute('aria-label', `Aller à ${i+1}`);
        b.addEventListener('click', ()=>go(i));
        dotsWrap.appendChild(b);
      });
    }
    prev?.addEventListener('click', ()=>go(index-1));
    next?.addEventListener('click', ()=>go(index+1));

    // swipe mobile
    let startX=null;
    track.addEventListener('touchstart', e=>startX = e.touches[0].clientX, {passive:true});
    track.addEventListener('touchend', e=>{
      if(startX===null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if(Math.abs(dx) > 40) go(index + (dx<0 ? 1 : -1));
      startX = null;
    }, {passive:true});

    go(0);
  })();

  // --- Avant / Après ------------------------------------------------------
  (function compare(){
    const grid = $('#compare-grid'); if (!grid || !Array.isArray(cfg.comparisons)) return;
    const tpl  = $('#tpl-compare');  if (!tpl) { console.warn('tpl-compare manquant'); return; }
    grid.innerHTML = '';

    // prefs UI (ratio / hauteur)
    const aspect   = (cfg.ui?.compare?.aspect || '16:9').replace(':','/'); // CSS attend 16/9
    const heightPx = cfg.ui?.compare?.height_px;

    cfg.comparisons.forEach(c=>{
      const frag = tpl.content.cloneNode(true);

      // taille stable du composant
      const wrap = $('.compare-wrap', frag);
      const cmp  = $('.compare', frag);
      if (cmp){
        cmp.style.setProperty('--cmp-ar', aspect);
        if (heightPx) cmp.style.setProperty('--cmp-h', `${heightPx}px`);
      }

      // images + labels (+ option invert)
      let beforeSrc = c.before, afterSrc = c.after;
      if (c.invert) [beforeSrc, afterSrc] = [afterSrc, beforeSrc];

      const bImg = $('[data-attr-src="before"]', frag);
      const aImg = $('[data-attr-src="after"]' , frag);
      if (bImg){ bImg.src = beforeSrc; bImg.alt = c.alt_before || 'Avant nettoyage'; }
      if (aImg){ aImg.src = afterSrc;  aImg.alt = c.alt_after  || 'Après nettoyage'; }
      $('[data-text="label_before"]', frag).textContent = c.label_before || 'Avant';
      $('[data-text="label_after"]' , frag).textContent = c.label_after  || 'Après';

      grid.appendChild(frag);

      // interactions par composant
      const handle = $('.handle', wrap);
      const knob   = $('.knob', wrap);
      const range  = $('input.range', wrap);
      let reveal = 50; // %
      const setPct = (pct)=>{
        reveal = Math.min(100, Math.max(0, pct));
        cmp.style.setProperty('--reveal', reveal + '%');
        handle.style.left = reveal + '%';
        knob.style.left   = reveal + '%';
        range.value = reveal;
      };

      // Edge-guard : évite que la poignée touche le cadre (visuel)
      const guardedPct = (clientX)=>{
        const r = cmp.getBoundingClientRect();
        const knobW = knob.getBoundingClientRect().width || 44;
        const guard = (knobW/2) / r.width;          // marge en %
        const raw   = (clientX - r.left) / r.width; // 0..1
        return (Math.max(guard, Math.min(1-guard, raw))) * 100;
      };

      // pointer drag fluide (+ capture)
      let raf=null;
      const update = (e)=>{
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(()=> setPct(guardedPct(e.clientX)));
      };
      cmp.addEventListener('pointerdown', (e)=>{
        cmp.setPointerCapture?.(e.pointerId);
        update(e);
        const move=(ev)=>update(ev);
        const up=()=>{
          cmp.releasePointerCapture?.(e.pointerId);
          window.removeEventListener('pointermove',move);
          window.removeEventListener('pointerup',up);
        };
        window.addEventListener('pointermove',move);
        window.addEventListener('pointerup',up);
      });

      // clavier (accessibilité)
      range.addEventListener('keydown', (e)=>{
        let v = parseFloat(range.value||'50');
        if (e.key==='ArrowLeft'){ setPct(v-2); e.preventDefault(); }
        if (e.key==='ArrowRight'){ setPct(v+2); e.preventDefault(); }
        if (e.key==='Home'){ setPct(0); e.preventDefault(); }
        if (e.key==='End'){ setPct(100); e.preventDefault(); }
      });
      // slider "virtuel" synchronisé
      range.addEventListener('input', ()=> setPct(parseFloat(range.value||'50')));

      // double-clic -> reset 50%
      wrap.addEventListener('dblclick', ()=> setPct(50));

      setPct(50);
    });
  })();

  // --- FAQ ----------------------------------------------------------------
  (function faq(){
    const wrap = $('#faq-list'); if (!wrap || !Array.isArray(cfg.faq)) return;
    const tpl = $('#tpl-faq');
    wrap.innerHTML = '';
    cfg.faq.forEach(f=>{
      const it = tpl.content.firstElementChild.cloneNode(true);
      $('[data-text="q"]', it).textContent = f.q;
      $('[data-text="a"]', it).textContent = f.a;
      wrap.appendChild(it);
    });
  })();

  // --- CTA final href (optionnel) -----------------------------------------
  const ctaFinal = $('#cta-final');
  if (ctaFinal && cfg.copy?.sections?.cta_final?.href) ctaFinal.href = cfg.copy.sections.cta_final.href;

  // --- Footer année -------------------------------------------------------
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // --- Formulaire -> mailto (sans backend) --------------------------------
  (function mailtoSubmit(){
    const form = document.querySelector('form[name="contact"]');
    if (!form) return;
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const get = (k) => (fd.get(k) || '').toString().trim();

      const to = (cfg.brand && cfg.brand.email) ? cfg.brand.email : '';
      const sujet = `Demande de devis — ${get('nom') || 'Client'} (${cfg.brand?.name || 'Site'})`;

      const lignes = [
        'Nouvelle demande via le site :',
        '',
        `Nom : ${get('nom')}`,
        `Email : ${get('email')}`,
        `Téléphone : ${get('telephone') || '—'}`,
        '',
        'Message :',
        get('message'),
        '',
        `Page : ${location.href}`,
        `Date : ${new Date().toLocaleString()}`
      ];

      const body = encodeURIComponent(lignes.join('\n'));
      const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(sujet)}&body=${body}`;
      window.location.href = href;
      form.reset();
    });
  })();
})();
