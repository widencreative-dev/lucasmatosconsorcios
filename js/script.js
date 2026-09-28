document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll suave com Lenis (desligado para quem pediu menos movimento)
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Rola até um elemento respeitando a altura do cabeçalho flutuante
  function scrollToElement(target, offset = -90) {
    if (lenis) {
      lenis.scrollTo(target, { offset });
    } else {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }

  // Links âncora passam pelo Lenis
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToElement(target);
    });
  });

  // Ano no footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Menu mobile
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  if (navToggle && mainNav) {
    function setNav(open) {
      mainNav.classList.toggle('open', open);
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    }

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setNav(!mainNav.classList.contains('open'));
    });

    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setNav(false));
    });

    // Fecha ao tocar fora do menu
    document.addEventListener('click', (e) => {
      if (!mainNav.classList.contains('open')) return;
      if (mainNav.contains(e.target) || navToggle.contains(e.target)) return;
      setNav(false);
    });

    // Fecha com Esc e devolve o foco ao botão
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        setNav(false);
        navToggle.focus();
      }
    });
  }

  // Contagem animada dos números de estatísticas quando a seção entra na tela
  const statsGrid = document.querySelector('.stats-grid');

  function animateCount(el, duration = 1800) {
    const finalText = el.textContent.trim();
    const match = finalText.match(/^(\D*)(\d+)(\D*)$/);
    if (!match) return;

    const [, prefix, numStr, suffix] = match;
    const target = parseInt(numStr, 10);
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = `${prefix}${current}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = finalText;
      }
    }
    requestAnimationFrame(tick);
  }

  if (statsGrid && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const numbers = statsGrid.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          numbers.forEach(el => animateCount(el));
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    observer.observe(statsGrid);
  }

  // Carrossel infinito de depoimentos -> duplica os cards para o loop ficar contínuo
  // Sem a esteira animada (movimento reduzido) os clones seriam repetição inútil
  const testiTrack = document.getElementById('testi-track');
  if (testiTrack && !prefersReducedMotion) {
    const originalCards = Array.from(testiTrack.children);
    originalCards.forEach(card => {
      testiTrack.appendChild(card.cloneNode(true));
    });
  }

  // Carrossel "A Consultoria" -> clique fixa o painel ativo (essencial no touch)
  const stepsCarousel = document.getElementById('steps-carousel');
  if (stepsCarousel) {
    const panels = stepsCarousel.querySelectorAll('.step-panel');
    panels.forEach(panel => {
      panel.addEventListener('click', (e) => {
        if (e.target.closest('.step-cta')) return;
        panels.forEach(p => p.classList.remove('active'));
        panel.classList.add('active');
      });
    });
  }

  // Accordion FAQ
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.accordion-item.open').forEach(open => {
        if (open !== item) {
          open.classList.remove('open');
          open.querySelector('.accordion-panel').style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  // O maxHeight é calculado uma vez no clique. Ao girar o celular o texto
  // reflui e ficava cortado -> recalcula o painel aberto no resize.
  let accordionResizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(accordionResizeTimer);
    accordionResizeTimer = setTimeout(() => {
      document.querySelectorAll('.accordion-item.open .accordion-panel').forEach(panel => {
        panel.style.maxHeight = 'none';
        const height = panel.scrollHeight;
        panel.style.maxHeight = height + 'px';
      });
    }, 150);
  });

  // Simulador da hero (tipo de consórcio, parcela/crédito, slider de valor)
  const simForm = document.getElementById('hero-form');
  if (simForm) {
    const tipoSelect = document.getElementById('sim-tipo');
    const toggleBtns = simForm.querySelectorAll('.sim-toggle-btn');
    const valueLabel = document.getElementById('sim-value-label');
    const valueInput = document.getElementById('sim-value-input');
    const range = document.getElementById('sim-range');
    const rangeMinLabel = document.getElementById('sim-range-min');
    const rangeMaxLabel = document.getElementById('sim-range-max');

    const RANGES = {
      parcela: { min: 269.84, max: 8534.62, default: 4000, label: 'Valor da parcela' },
      credito: { min: 50000, max: 1500000, default: 300000, label: 'Valor do crédito' },
    };

    const formatCurrency = (value) =>
      value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const parseCurrency = (text) => {
      const clean = text.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    };

    function updateRangeFill() {
      const percent = ((range.value - range.min) / (range.max - range.min)) * 100;
      range.style.background = `linear-gradient(to right, var(--color-accent) ${percent}%, #E5E1DA ${percent}%)`;
    }

    function applyMode(mode) {
      const config = RANGES[mode];
      range.min = config.min;
      range.max = config.max;
      range.value = config.default;
      valueLabel.textContent = config.label;
      valueInput.value = formatCurrency(config.default);
      rangeMinLabel.textContent = `R$ ${formatCurrency(config.min)}`;
      rangeMaxLabel.textContent = `R$ ${formatCurrency(config.max)}`;
      updateRangeFill();
    }

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        applyMode(btn.dataset.mode);
      });
    });

    range.addEventListener('input', () => {
      valueInput.value = formatCurrency(parseFloat(range.value));
      updateRangeFill();
    });

    valueInput.addEventListener('blur', () => {
      let value = parseCurrency(valueInput.value);
      value = Math.min(Math.max(value, parseFloat(range.min)), parseFloat(range.max));
      range.value = value;
      valueInput.value = formatCurrency(value);
      updateRangeFill();
    });

    updateRangeFill();

    // ---- Navegação entre as etapas do simulador ----
    const step1 = document.getElementById('sim-step-1');
    const step2 = document.getElementById('sim-step-2');
    const nextBtn = document.getElementById('sim-next-btn');
    const backBtn = document.getElementById('sim-back-btn');

    nextBtn.addEventListener('click', () => {
      step1.hidden = true;
      step2.hidden = false;
      scrollToElement(simForm.closest('.hero-form-card'));
    });

    backBtn.addEventListener('click', () => {
      step2.hidden = true;
      step1.hidden = false;
    });

    // ---- Etapa 2: termos obrigatórios liberam o botão de envio ----
    const termsCheckbox = document.getElementById('sim-terms');
    const resultBtn = document.getElementById('sim-result-btn');

    termsCheckbox.addEventListener('change', () => {
      resultBtn.disabled = !termsCheckbox.checked;
    });

    // ---- Envio final: dispara o webhook com todos os dados coletados ----
    // Se a URL cair de novo num placeholder, o envio é bloqueado e o visitante
    // é mandado para o WhatsApp em vez de receber um "enviado" que não aconteceu.
    const WEBHOOK_URL = 'https://n8n.widencreative.com/webhook/5e43205c-ab43-465b-9b7b-c6570bc6d04a';
    const WEBHOOK_CONFIGURADO = !WEBHOOK_URL.includes('SEU-WEBHOOK-AQUI');
    const WHATSAPP_FALLBACK = 'https://wa.me/5527998172712';

    // Mensagem de status abaixo dos botões
    const statusEl = document.createElement('p');
    statusEl.className = 'sim-status';
    statusEl.setAttribute('role', 'status');
    statusEl.hidden = true;
    simForm.querySelector('#sim-step-2').appendChild(statusEl);

    function setStatus(message, type) {
      statusEl.textContent = message;
      statusEl.className = `sim-status sim-status--${type}`;
      statusEl.hidden = false;
    }

    simForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!termsCheckbox.checked) return;

      const activeMode = simForm.querySelector('.sim-toggle-btn.active').dataset.mode;

      const payload = {
        nome: document.getElementById('sim-nome').value,
        email: document.getElementById('sim-email').value,
        celular: document.getElementById('sim-celular').value,
        aceitou_termos: termsCheckbox.checked,
        tipo_consorcio: tipoSelect.options[tipoSelect.selectedIndex].text,
        simulado_por: activeMode === 'parcela' ? 'Parcela' : 'Crédito',
        valor_simulado: valueInput.value,
        origem: 'Site Lucas Matos Consórcios - Simulador Hero',
        data_envio: new Date().toISOString(),
      };

      function falhou(err) {
        if (err) console.error('Falha ao enviar a simulação:', err);
        resultBtn.disabled = false;
        resultBtn.textContent = 'Receber simulação';
        setStatus('Não conseguimos enviar agora. Fale direto no WhatsApp: (27) 99817-2712', 'error');
        statusEl.insertAdjacentHTML(
          'beforeend',
          ` <a href="${WHATSAPP_FALLBACK}" target="_blank" rel="noopener">Abrir WhatsApp</a>`
        );
      }

      if (!WEBHOOK_CONFIGURADO) {
        console.warn('WEBHOOK_URL ainda é o placeholder — nenhum lead está sendo entregue.');
        falhou();
        return;
      }

      resultBtn.disabled = true;
      resultBtn.textContent = 'Enviando...';
      statusEl.hidden = true;

      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          // Só o que a página de obrigado exibe. E-mail e celular ficam fora:
          // já foram entregues ao webhook e não precisam sobrar no navegador.
          try {
            sessionStorage.setItem('lm_simulacao', JSON.stringify({
              nome: payload.nome,
              tipo_consorcio: payload.tipo_consorcio,
              simulado_por: payload.simulado_por,
              valor_simulado: payload.valor_simulado,
            }));
          } catch (err) {
            // Navegação privada pode bloquear o storage: a página de obrigado
            // funciona sem o resumo, então o redirecionamento segue.
          }

          resultBtn.textContent = 'Redirecionando...';
          window.location.href = 'obrigado.html';
        })
        .catch(falhou);
    });
  }

  // Setas dos divisores -> rolam até a próxima seção
  document.querySelectorAll('.divider-arrow').forEach(arrow => {
    arrow.addEventListener('click', () => {
      const nextSection = arrow.closest('.slice-divider').nextElementSibling;
      if (nextSection) scrollToElement(nextSection);
    });
  });

});
