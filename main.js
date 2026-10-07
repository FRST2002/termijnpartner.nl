/**
 * TermijnPartner.nl – Main JavaScript
 * Handles: mobile menu, FAQ accordion, configurator, smooth scroll, scroll reveal
 */

(function () {
  'use strict';

  /* ==========================================
     DOM Ready
     ========================================== */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initHeader();
    initMobileMenu();
    initSmoothScroll();
    initScrollReveal();
    initConfigurator();
    initBranchesCarousel();
    initFAQ();
    initContactForm();
  }

  /* ==========================================
     Sticky Header Shadow
     ========================================== */
  function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    const onScroll = () => {
      header.classList.toggle('header-scrolled', window.scrollY > 20);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

/* ==========================================
   Mobile Menu
   ========================================== */
   function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (!hamburger || !mobileMenu) return;

    // Zorg ervoor dat menu altijd dicht begint
    mobileMenu.classList.remove('open');
    mobileMenu.classList.add('hidden');

    function openMenu() {
        mobileMenu.classList.remove('hidden');

        setTimeout(() => {
            mobileMenu.classList.add('open');
        }, 10);

        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');

        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        mobileMenu.classList.remove('open');

        setTimeout(() => {
            mobileMenu.classList.add('hidden');
        }, 300);

        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');

        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () => {
        if (mobileMenu.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', () => {
            closeMenu();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            closeMenu();
        }
    });
}

  /* ==========================================
     Smooth Scroll for anchor links
     ========================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        const headerHeight = document.getElementById('header')?.offsetHeight || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;

        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ==========================================
     Scroll Reveal (fade-in on scroll)
     ========================================== */
  function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  /* ==========================================
     Configurator Price Calculator
     ========================================== */
  function initConfigurator() {
    const BASE_PRICE = 199;
    const modulesContainer = document.getElementById('configurator-modules');
    const monthlyTotalEl = document.getElementById('monthly-total');
    const onetimeTotalEl = document.getElementById('onetime-total');
    const grandMonthlyEl = document.getElementById('grand-monthly');

    if (!modulesContainer) return;

    const modules = [
      { id: 'ai-whatsapp', name: 'AI WhatsApp medewerker', price: 150, type: 'monthly' },
      { id: 'ai-telefoniste', name: 'AI telefoniste', price: 150, type: 'monthly' },
      { id: 'google-ads', name: 'Google Ads 24/7 AI beheer', price: 499, type: 'monthly' },
      { id: 'reviews', name: 'Review automatisering', price: 49, type: 'monthly' },
      { id: 'website', name: 'Website binnen 7 werkdagen live', price: 999, type: 'onetime' },
      { id: 'funnel', name: 'Extra funnel of landingspagina', price: 30, type: 'perunit', unitLabel: 'per funnel' },
      { id: 'maatwerk', name: 'Maatwerk automatiseringen', price: 499, type: 'onetime' },
    ];

    function getPriceLabel(mod) {
      if (mod.type === 'monthly') return `+€${mod.price} p/m`;
      if (mod.type === 'perunit') return `+€${mod.price} ${mod.unitLabel}`;
      return `+€${mod.price.toLocaleString('nl-NL')} eenmalig`;
    }

    // Build module cards
    modules.forEach((mod) => {
      const card = document.createElement('div');
      card.className = 'module-card card rounded-xl p-4 flex items-start gap-3';
      card.dataset.id = mod.id;
      card.dataset.price = mod.price;
      card.dataset.type = mod.type;
      card.dataset.quantity = mod.type === 'perunit' ? '1' : '1';
      card.setAttribute('role', 'checkbox');
      card.setAttribute('aria-checked', 'false');
      card.setAttribute('tabindex', '0');

      const quantityHtml = mod.type === 'perunit'
        ? `<div class="module-quantity hidden mt-3 flex items-center gap-2" data-quantity-control>
            <button type="button" class="qty-btn w-7 h-7 rounded-md border border-black/10 text-brand-black font-bold hover:bg-brand-light-grey transition-colors" data-action="decrease" aria-label="Minder">−</button>
            <span class="qty-value text-sm font-semibold text-brand-black min-w-[1.5rem] text-center">1</span>
            <button type="button" class="qty-btn w-7 h-7 rounded-md border border-black/10 text-brand-black font-bold hover:bg-brand-light-grey transition-colors" data-action="increase" aria-label="Meer">+</button>
          </div>`
        : '';

      card.innerHTML = `
        <div class="module-check" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-brand-black text-sm leading-snug">${mod.name}</p>
          <p class="text-brand-gold text-sm font-medium mt-0.5">${getPriceLabel(mod)}</p>
          ${quantityHtml}
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-quantity-control]')) return;
        toggleModule(card);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleModule(card);
        }
      });

      const qtyControl = card.querySelector('[data-quantity-control]');
      if (qtyControl) {
        qtyControl.addEventListener('click', (e) => {
          e.stopPropagation();
          const btn = e.target.closest('[data-action]');
          if (!btn || !card.classList.contains('selected')) return;

          let qty = parseInt(card.dataset.quantity, 10) || 1;
          if (btn.dataset.action === 'increase') qty = Math.min(qty + 1, 99);
          if (btn.dataset.action === 'decrease') qty = Math.max(qty - 1, 1);

          card.dataset.quantity = String(qty);
          card.querySelector('.qty-value').textContent = qty;
          updateTotals();
        });
      }

      modulesContainer.appendChild(card);
    });

    function toggleModule(card) {
      const isSelected = card.classList.toggle('selected');
      card.setAttribute('aria-checked', isSelected ? 'true' : 'false');

      const qtyControl = card.querySelector('[data-quantity-control]');
      if (qtyControl) {
        qtyControl.classList.toggle('hidden', !isSelected);
        if (!isSelected) {
          card.dataset.quantity = '1';
          const qtyValue = card.querySelector('.qty-value');
          if (qtyValue) qtyValue.textContent = '1';
        }
      }

      updateTotals();
    }

    function updateTotals() {
      let monthlyExtras = 0;
      let onetimeExtras = 249;

      modulesContainer.querySelectorAll('.module-card.selected').forEach((card) => {
        const price = parseInt(card.dataset.price, 10);
        const qty = parseInt(card.dataset.quantity, 10) || 1;
        const type = card.dataset.type;

        if (type === 'monthly') {
          monthlyExtras += price;
        } else if (type === 'perunit') {
          onetimeExtras += price * qty;
        } else {
          onetimeExtras += price;
        }
      });

      const totalMonthly = BASE_PRICE + monthlyExtras;

      if (monthlyTotalEl) monthlyTotalEl.textContent = formatCurrency(totalMonthly);
      if (onetimeTotalEl) onetimeTotalEl.textContent = formatCurrency(onetimeExtras);
      if (grandMonthlyEl) grandMonthlyEl.textContent = formatCurrency(totalMonthly);
    }

    function formatCurrency(amount) {
      return '€' + amount.toLocaleString('nl-NL');
    }

    // Initial render
    updateTotals();
  }

  /* ==========================================
     Branches Carousel
     ========================================== */
  function initBranchesCarousel() {
    const track = document.getElementById('branches-carousel-track');
    const dotsContainer = document.getElementById('branches-dots');
    const prevBtn = document.getElementById('branches-prev');
    const nextBtn = document.getElementById('branches-next');

    if (!track) return;

    const branches = [
      {
        name: 'Bouw',
        image: 'branch-bouw.png',
        alt: 'Dakkapel wordt geplaatst op een woning',
        orderValue: '€20.000 – €100.000+',
        monthly: 'vanaf €199 p/m',
        benefits: ['Grote projecten worden haalbaar', 'Klant kiest zelf looptijd', 'Jij ontvangt 100% vooraf'],
      },
      {
        name: 'Keukens',
        image: 'branch-keukens.png',
        alt: 'Moderne keuken',
        orderValue: '€10.000 – €25.000',
        monthly: 'vanaf €149 p/m',
        benefits: ['Snellere ja-beslissingen', 'Hogere upsell naar premium', 'Meer showroomconversie'],
      },
      {
        name: 'Badkamers',
        image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&q=80&auto=format',
        alt: 'Badkamer renovatie',
        orderValue: '€8.000 – €20.000',
        monthly: 'vanaf €129 p/m',
        benefits: ['Droombadkamer wordt bereikbaar', 'Minder prijsbezwaren', 'Meer akkoord op offertes'],
      },
      {
        name: 'Dakkapellen',
        image: 'branch-bouw.png',
        alt: 'Dakkapel installatie',
        orderValue: '€8.000 – €18.000',
        monthly: 'vanaf €119 p/m',
        benefits: ['Direct plaatsbaar uit voorraad', 'Meer akkoord op offertes', 'Hogere marge per project'],
      },
      {
        name: "Veranda's",
        image: 'branch-veranda.png',
        alt: 'Glazen veranda met schuifwanden',
        orderValue: '€10.000 – €25.000',
        monthly: 'vanaf €149 p/m',
        benefits: ['Premium projecten toegankelijk', 'Seizoensgebonden verkoop boost', 'Meer volledige tuinprojecten'],
      },
      {
        name: 'Kozijnen',
        image: 'branch-kozijnen.png',
        alt: 'Nieuw kozijn in woning',
        orderValue: '€6.000 – €15.000',
        monthly: 'vanaf €119 p/m',
        benefits: ['Complete woningrenovaties', 'Minder afgewezen offertes', 'Hogere orderwaarde per klant'],
      },
      {
        name: 'Haartransplantaties',
        image: 'branch-haartransplantaties.png',
        alt: 'Haartransplantatie behandeling',
        orderValue: '€4.000 – €12.000',
        monthly: 'vanaf €99 p/m',
        benefits: ['Behandeling toegankelijker', 'Minder uitstelgedrag', 'Meer ingeplande trajecten'],
      },
      {
        name: 'Vloeren',
        image: 'branch-vloeren.png',
        alt: 'Nieuwe vloer in woonkamer',
        orderValue: '€5.000 – €15.000',
        monthly: 'vanaf €99 p/m',
        benefits: ['Complete woning vloeren', 'Lagere drempel per m²', 'Meer volledige projecten'],
      },
      {
        name: "Auto's",
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80&auto=format',
        alt: 'Autodealer showroom',
        orderValue: '€15.000 – €50.000+',
        monthly: 'vanaf €199 p/m',
        benefits: ['Occasions en nieuwe modellen', 'Concurrentievoordeel', 'Snellere dealclosing'],
      },
      {
        name: 'Tanden facings / bleken',
        image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80&auto=format',
        alt: 'Tandartspraktijk',
        orderValue: '€3.000 – €15.000',
        monthly: 'vanaf €99 p/m',
        benefits: ['Implantaten en cosmetiek', 'Patiënten zeggen vaker ja', 'Behandelingen direct starten'],
      },
         {
        name: 'Zonnepanelen',
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80&auto=format',
        alt: 'Zonnepanelen installatie',
        orderValue: '€6.000 – €12.000',
        monthly: 'vanaf €99 p/m',
        benefits: ['Investering spreiden', 'Snellere ROI-beslissing', 'Meer installaties per maand'],
      },
      {
        name: 'Warmtepompen',
        image: 'branch-warmtepomp.png',
        alt: 'Warmtepomp en cv-installatie',
        orderValue: '€4.000 – €10.000',
        monthly: 'vanaf €89 p/m',
        benefits: ['Energiebesparing toegankelijk', 'Combinatie met isolatie', 'Meer complete energieprojecten'],
      },
         {
        name: "Airco's",
        image: 'branch-airco.png',
        alt: 'Airconditioning unit aan de muur',
        orderValue: '€3.000 – €8.000',
        monthly: 'vanaf €79 p/m',
        benefits: ['Seizoenspieken benutten', 'Meerdere units per klant', 'Snelle beslissing in warme periodes'],
      },
      {
        name: 'Thuisbatterijen',
        image: 'branch-thuisbatterij.png',
        alt: 'Thuisbatterij systeem',
        orderValue: '€5.000 – €12.000',
        monthly: 'vanaf €99 p/m',
        benefits: ['Combineer met zonnepanelen', 'Hogere projectwaarde', 'Snellere investeringsbeslissing'],
      },
      {
        name: 'Tuinhuizen & serres',
        image: 'branch-tuinhuis.png',
        alt: 'Tuinhuis in de tuin',
        orderValue: '€5.000 – €20.000',
        monthly: 'vanaf €99 p/m',
        benefits: ['Premium tuinprojecten', 'Combinatie met veranda', 'Meer complete buitenverbouwingen'],
      },
      {
        name: 'Scootmobielen',
        image: 'branch-scootmobiel.png',
        alt: 'Scootmobiel',
        orderValue: '€3.000 – €8.000',
        monthly: 'vanaf €79 p/m',
        benefits: ['Mobiliteit direct geregeld', 'Minder drempel voor ouderen', 'Snellere aankoopbeslissing'],
      }
    ];

    let currentIndex = 0;
    let slidesPerView = getSlidesPerView();

    function getSlidesPerView() {
      if (window.innerWidth >= 1024) return 3;
      if (window.innerWidth >= 640) return 2;
      return 1;
    }

    function getMaxIndex() {
      return Math.max(0, branches.length - slidesPerView);
    }

    function renderSlides() {
      track.innerHTML = branches
        .map(
          (b) => `
        <div class="branch-slide" role="listitem">
          <article class="branch-card industry-card card bg-white/5 border border-white/10 rounded-2xl overflow-hidden h-full">
            <div class="h-44 overflow-hidden">
              ${b.image
                ? `<img src="${b.image}" alt="${b.alt}" class="industry-img w-full h-full object-cover" loading="lazy">`
                : `<div class="branch-photo-placeholder h-full flex items-center justify-center"><span class="font-display text-lg text-brand-gold/70">${b.name}</span></div>`
              }
            </div>
            <div class="p-5 sm:p-6">
              <h3 class="font-extrabold text-white text-lg">${b.name}</h3>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80">${b.orderValue}</span>
                <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-gold/20 text-brand-gold">${b.monthly}</span>
              </div>
              <ul class="mt-4 space-y-2">
                ${b.benefits.map((benefit) => `<li class="flex items-start gap-2 text-sm text-white/60"><svg class="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${benefit}</li>`).join('')}
              </ul>
            </div>
          </article>
        </div>`
        )
        .join('');
    }

    function renderDots() {
      if (!dotsContainer) return;
      const dotCount = getMaxIndex() + 1;
      dotsContainer.innerHTML = '';

      for (let i = 0; i < dotCount; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === currentIndex ? ' active' : '');
        dot.setAttribute('aria-label', `Ga naar slide ${i + 1}`);
        dot.setAttribute('role', 'tab');
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    }

    function updateCarousel() {
      const offset = (currentIndex * 100) / slidesPerView;
      track.style.transform = `translateX(-${offset}%)`;

      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= getMaxIndex();

      dotsContainer?.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    function goTo(index) {
      currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
      updateCarousel();
    }

    function next() {
      goTo(currentIndex + 1);
    }

    function prev() {
      goTo(currentIndex - 1);
    }

    renderSlides();
    renderDots();
    updateCarousel();

    prevBtn?.addEventListener('click', prev);
    nextBtn?.addEventListener('click', next);

    window.addEventListener('resize', () => {
      const newSlidesPerView = getSlidesPerView();
      if (newSlidesPerView !== slidesPerView) {
        slidesPerView = newSlidesPerView;
        currentIndex = Math.min(currentIndex, getMaxIndex());
        renderDots();
        updateCarousel();
      }
    });

    // Touch swipe support
    let touchStartX = 0;
    track.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );
    track.addEventListener(
      'touchend',
      (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? next() : prev();
        }
      },
      { passive: true }
    );
  }

  /* ==========================================
     FAQ Accordion
     ========================================== */
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other items
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('active');
            other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('active', !isActive);
        question.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
      });
    });
  }

  /* ==========================================
     Contact Form (client-side validation + demo)
     ========================================== */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    const successMsg = document.getElementById('form-success');

    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // Simulate successful submission (static site – no backend)
      form.classList.add('hidden');
      if (successMsg) {
        successMsg.classList.remove('hidden');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
})();
