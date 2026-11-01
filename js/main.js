(function () {
      // 1. MAGNETIC PHYSICS
      // Magnetic elements (kursor kini standar browser)
      function bindMagnetic() {
        document.querySelectorAll('[data-magnetic]').forEach((el) => {
          const strength = parseFloat(el.getAttribute('data-magnetic')) || 0.25;
          el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
          });
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate3d(0px, 0px, 0)';
          });
        });
      }
      bindMagnetic();

      // 2. HERO SHOWREEL AUTO-CYCLE + SCROLL EXPAND + CLICK MODAL
      const slides = document.querySelectorAll('#hero-showreel .showreel-slide');
      const dots = document.querySelectorAll('#hero-showreel .sr-dot');
      const captionEl = document.getElementById('showreel-caption');
      let currentSlide = 0;

      function setShowreelSlide(idx) {
        currentSlide = (idx + slides.length) % slides.length;
        slides.forEach((s, i) => {
          s.classList.toggle('active', i === currentSlide);
        });
        dots.forEach((d, i) => {
          if (i === currentSlide) {
            d.className = 'sr-dot w-7 h-1.5 rounded-full bg-white transition-all duration-300';
          } else {
            d.className = 'sr-dot w-2 h-1.5 rounded-full bg-white/40 transition-all duration-300';
          }
        });
        const title = slides[currentSlide].getAttribute('data-scene-title');
        if (captionEl && title) captionEl.innerHTML = title;
      }

      let showreelTimer = setInterval(() => {
        setShowreelSlide(currentSlide + 1);
      }, 3200);

      // Subtle scroll-linked width expansion on Hero Showreel (just like video 00:05 - 00:09)
      const showreelBox = document.getElementById('hero-showreel');
      window.addEventListener('scroll', () => {
        const rect = showreelBox.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.top < vh && rect.bottom > 0) {
          const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.85)));
          const widthPct = 88 + progress * 8; // expands smoothly from 88% to 96%
          showreelBox.style.width = `${widthPct}%`;
        }
      }, { passive: true });

      // 3. WHAT WE DO — 5 SERVICE CARDS (Expand on Hover, Click, AND Scroll)
      const serviceCards = document.querySelectorAll('.service-card');
      function activateServiceCard(idx) {
        serviceCards.forEach((card, i) => {
          card.classList.toggle('active', i === idx);
        });
      }

      serviceCards.forEach((card, idx) => {
        card.addEventListener('mouseenter', () => activateServiceCard(idx));
        card.addEventListener('click', () => activateServiceCard(idx));
      });

      // Scroll-driven activation so scrolling down naturally highlights 01 -> 02 -> 03 -> 04 -> 05 like the video
      window.addEventListener('scroll', () => {
        const vhCenter = window.innerHeight * 0.52;
        let closestIdx = -1;
        let minDist = Infinity;
        serviceCards.forEach((card, i) => {
          const r = card.getBoundingClientRect();
          const cardCenter = r.top + r.height / 2;
          const dist = Math.abs(cardCenter - vhCenter);
          if (r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2 && dist < minDist) {
            minDist = dist;
            closestIdx = i;
          }
        });
        if (closestIdx !== -1) {
          activateServiceCard(closestIdx);
        }
      }, { passive: true });

      // 4. STICKY NOTE CATATAN LAPANGAN CARDS (Interactive Bring-to-Front & Tilt)
      let topZ = 50;
      document.querySelectorAll('#testimonials-cluster .sticky-note').forEach((note) => {
        note.addEventListener('mouseenter', () => {
          topZ++;
          note.style.zIndex = topZ;
          const base = note.getAttribute('data-base-transform') || '';
          note.style.transform = `${base} scale(1.04) translateY(-8px)`;
        });
        note.addEventListener('mouseleave', () => {
          const base = note.getAttribute('data-base-transform') || '';
          note.style.transform = base;
        });
        note.addEventListener('click', () => {
          topZ++;
          note.style.zIndex = topZ;
        });
      });

      // 5. FAQ ACCORDION
      document.querySelectorAll('#faq-list .faq-item').forEach((item) => {
        const btn = item.querySelector('button');
        btn.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          document.querySelectorAll('#faq-list .faq-item').forEach((other) => other.classList.remove('open'));
          if (!isOpen) item.classList.add('open');
        });
      });

      // 6. CTA PYRAMIDS PARALLAX ON MOUSE MOVE
      const ctaSection = document.getElementById('contact-cta');
      const pyr1 = document.getElementById('pyr-layer-1');
      const pyr2 = document.getElementById('pyr-layer-2');
      const pyr3 = document.getElementById('pyr-layer-3');
      if (ctaSection && pyr1 && pyr2 && pyr3) {
        ctaSection.addEventListener('mousemove', (e) => {
          const r = ctaSection.getBoundingClientRect();
          const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
          pyr1.style.transform = `translate(${nx * 14}px, ${ny * 8}px)`;
          pyr2.style.transform = `translate(${nx * 26}px, ${ny * 14}px)`;
          pyr3.style.transform = `translate(${nx * 38}px, ${ny * 20}px)`;
        });
      }

      // 7. SCROLL REVEAL OBSERVER
      // Kotak-kotak Bidang muncul berurutan (stagger) agar transisi scroll terasa halus.
      const accordionCards = Array.from(document.querySelectorAll('#services-accordion .reveal-up'));
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const idx = accordionCards.indexOf(el);
          if (idx >= 0) {
            el.style.transitionDelay = Math.min(idx * 110, 440) + 'ms';
            setTimeout(() => { el.style.transitionDelay = ''; }, 1900);
          }
          el.classList.add('visible');
          observer.unobserve(el);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });

      document.querySelectorAll('.reveal-up').forEach((el) => observer.observe(el));

      // 8. COPY TO CLIPBOARD TOAST FOR DOMAIN PILLS
      const toast = document.getElementById('cb-toast');
      const toastText = document.getElementById('cb-toast-text');
      let toastTimeout = null;

      function showToast(msg) {
        toastText.textContent = msg;
        toast.classList.remove('opacity-0', 'translate-y-4');
        toast.classList.add('opacity-100', 'translate-y-0');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
          toast.classList.add('opacity-0', 'translate-y-4');
          toast.classList.remove('opacity-100', 'translate-y-0');
        }, 2600);
      }

      document.querySelectorAll('[data-copy]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-copy');
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(val);
            } else {
              const ta = document.createElement('textarea');
              ta.value = val;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
          } catch (_) {}
          showToast(`Copied "${val}" to clipboard`);
        });
      });

      // 9. INTERACTIVE MODALS (Showreel Player, Project Case Study, Contact Inquiry, Service Details)
      const modal = document.getElementById('cb-modal');
      const modalContent = document.getElementById('cb-modal-content');
      const modalClose = document.getElementById('cb-modal-close');

      function openModal(html) {
        modalContent.innerHTML = html;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modalContent.innerHTML = '';
      }

      modalClose.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Showreel click -> Interactive Scene Switcher Modal
      showreelBox.addEventListener('click', () => {
        setShowreelSlide(currentSlide + 1);
        showToast(`Beralih ke adegan showreel ZonaSipil (${currentSlide + 1}/4)`);
      });

      // Info modal (ZonaSipil starting point)
      function openContactModal() {
        openModal(`
          <div class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">ZonaSipil &mdash; Mulai di Sini</div>
          <h3 class="text-3xl sm:text-4xl font-medium tracking-tight mb-3">Baca gambarnya. Hitung angkanya.</h3>
          <p class="text-white/65 text-sm sm:text-base mb-6">ZonaSipil adalah platform pengetahuan dan alat teknik sipil berbahasa Indonesia. Mulai dari kalkulatornya — volume beton dan berat tulangan dengan rumus yang terbuka — atau telusuri kajian dan artikelnya.</p>
          <div class="flex flex-wrap gap-3">
            <a href="#kalkulator" id="modal-calc-btn" class="bg-white text-black font-medium rounded-full py-3.5 px-7 hover:bg-neutral-200 transition-colors">Buka Kalkulator</a>
            <a href="#projects" id="modal-kajian-btn" class="border border-white/30 text-white font-medium rounded-full py-3.5 px-7 hover:bg-white/10 transition-colors">Lihat Kajian Pilihan</a>
          </div>
        `);
        ['modal-calc-btn', 'modal-kajian-btn'].forEach((id) => {
          const link = document.getElementById(id);
          if (link) link.addEventListener('click', closeModal);
        });
      }

      // Header & CTA buttons are anchors to #kalkulator (no modal binding).

      // Project cards click -> Case Study Quick View
      document.querySelectorAll('.project-card').forEach((card) => {
        card.addEventListener('click', () => {
          const title = card.getAttribute('data-project-title');
          const desc = card.getAttribute('data-project-desc');
          const img = card.querySelector('img').getAttribute('src');
          openModal(`
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div class="rounded-2xl overflow-hidden bg-black aspect-[4/4]">
                <img src="${img}" alt="${title}" class="w-full h-full object-cover" />
              </div>
              <div>
                <div class="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">Kajian Pilihan &mdash; ZonaSipil</div>
                <h3 class="text-3xl font-medium tracking-tight mb-4">${title}</h3>
                <p class="text-white/75 leading-relaxed mb-6">${desc}</p>
                <div class="flex flex-wrap gap-2 mb-8">
                  <span class="text-xs border border-white/20 rounded-full px-3.5 py-1.5 text-white/80">Gambar &amp; Potongan</span>
                  <span class="text-xs border border-white/20 rounded-full px-3.5 py-1.5 text-white/80">Rumus Terbuka</span>
                  <span class="text-xs border border-white/20 rounded-full px-3.5 py-1.5 text-white/80">Catatan Lapangan</span>
                </div>
                <button type="button" id="modal-inquire-btn" class="bg-white text-black font-medium rounded-full px-7 py-3.5 text-sm hover:bg-neutral-200 transition-colors">Coba kalkulatornya &rarr;</button>
              </div>
            </div>
          `);
          const inq = document.getElementById('modal-inquire-btn');
          if (inq) inq.addEventListener('click', openContactModal);
        });
      });

      // Service Explore buttons
      document.querySelectorAll('[data-service-modal]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const name = btn.getAttribute('data-service-modal');
          openContactModal();
          showToast(`Menjelajahi bidang: ${name}`);
        });
      });

      // Kartu artikel kini berupa tautan ke /artikel/<slug>/ (routing artikel)

      document.getElementById('view-all-projects-btn').addEventListener('click', () => {
        document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
        showToast('Menampilkan 10 kajian pilihan ZonaSipil');
      });

      document.getElementById('privacy-policy-btn').addEventListener('click', () => {
        openModal(`
          <h3 class="text-2xl font-medium mb-4">Kebijakan Privasi &mdash; ZonaSipil</h3>
          <p class="text-white/70 text-sm leading-relaxed mb-4">
            ZonaSipil adalah situs statis yang tidak mengumpulkan, menyimpan, atau mengirim data pribadi pengunjung. Tidak ada akun, tidak ada formulir yang menyimpan data, dan semua kalkulator berjalan sepenuhnya di browsermu sendiri.
          </p>
          <p class="text-white/50 text-xs">&copy; 2026 ZonaSipil. zonasipil.web.id</p>
        `);
      });

      // Mobile menu toggle
      const mobileMenu = document.getElementById('mobile-menu');
      document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('flex');
      });
      document.getElementById('mobile-menu-close').addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
      });
      document.querySelectorAll('.mobile-nav-item').forEach((link) => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          mobileMenu.classList.remove('flex');
        });
      });

      // 10. ZONASIPIL CALCULATORS (Volume Beton & Berat Tulangan)
      // Guarded: no-ops when the calculator section is absent.
      (function initZonaSipilCalculators() {
        const ids = ['inP', 'inL', 'inT', 'inN', 'inW', 'inD', 'inLen'];
        const els = {};
        let missing = false;
        ids.forEach((id) => {
          els[id] = document.getElementById(id);
          if (!els[id]) missing = true;
        });
        const outVolNet = document.getElementById('outVolNet');
        const outVol = document.getElementById('outVol');
        const outWm = document.getElementById('outWm');
        const outW = document.getElementById('outW');
        if (missing || !outVolNet || !outVol || !outWm || !outW) return;

        function num(el) {
          const v = parseFloat(String(el.value).replace(',', '.'));
          return isFinite(v) && v > 0 ? v : 0;
        }
        function fmt(v, dec) {
          return v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
        }
        function recalc() {
          // Volume beton: V = p x l x t x n; cadangan (%) adalah asumsi pengguna
          const bersih = num(els.inP) * num(els.inL) * num(els.inT) * num(els.inN);
          let waste = parseFloat(els.inW.value) || 0;
          if (waste < 0) waste = 0;
          outVolNet.textContent = fmt(bersih, 2) + ' m\u00B3';
          outVol.textContent = fmt(bersih * (1 + waste / 100), 2) + ' m\u00B3';
          // Berat tulangan: w = 0,006165 x d^2 (kg/m), dari pi/4 x d^2 x 7.850 kg/m3
          const d = num(els.inD);
          const wm = 0.006165 * d * d;
          outWm.textContent = fmt(wm, 3) + ' kg/m';
          outW.textContent = fmt(wm * num(els.inLen), 1) + ' kg';
        }
        ids.forEach((id) => els[id].addEventListener('input', recalc));
        recalc();
      })();

    })();

// 13. SHOWREEL VIDEO — segmen MP4 seasal dirakit jadi blob URL; gambar slide tetap fallback.
// Dilewati bila pengguna memilih gerak minimum atau mode hemat data.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  if (reduceMotion || saveData || !('fetch' in window)) return;
  const videos = Array.from(document.querySelectorAll('#hero-showreel video[data-part-base]'));
  async function loadScene(video, delay) {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    const base = video.getAttribute('data-part-base');
    const count = parseInt(video.getAttribute('data-parts'), 10);
    try {
      const buffers = [];
      for (let i = 0; i < count; i++) {
        const res = await fetch(base + String(i).padStart(2, '0'));
        if (!res.ok) throw new Error('segment ' + i);
        buffers.push(await res.arrayBuffer());
      }
      const blob = new Blob(buffers, { type: 'video/mp4' });
      video.src = URL.createObjectURL(blob);
      video.addEventListener('canplay', () => {
        video.closest('.showreel-slide').classList.add('vid-on');
      }, { once: true });
      await video.play().catch(() => {});
    } catch (e) {
      /* fallback: poster slide tetap tampil */
    }
  }
  videos.forEach((v, i) => loadScene(v, i * 900));
})();
