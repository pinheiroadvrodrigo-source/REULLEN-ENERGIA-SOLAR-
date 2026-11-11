/* ==========================================================
   RR Engenharia Solar — cadastro de clientes e contador de acessos
   Os dados vão para o Supabase configurado em assets/js/config.js
   ========================================================== */
(function () {
  const C = window.RR_CONFIG || {};
  const base = String(C.supabaseUrl || '').replace(/\/+$/, '');
  const ativo = /^https:\/\/.+/.test(base) && C.supabaseKey && !/COLE_AQUI/.test(C.supabaseKey);

  async function inserir(tabela, dados) {
    if (!ativo) return false;
    try {
      const r = await fetch(base + '/rest/v1/' + tabela, {
        method: 'POST',
        headers: { apikey: C.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(dados),
        keepalive: true
      });
      return r.ok;
    } catch (e) { return false; }
  }

  const corta = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
  const soDigitos = v => String(v || '').replace(/\D/g, '');

  /* Usado pelo formulário e pelo chatbot */
  window.rrSalvarLead = function (d) {
    return inserir('leads', {
      nome: corta(d.nome, 120),
      whatsapp: corta(soDigitos(d.whatsapp), 20),
      cidade: corta(d.cidade, 120),
      bairro: corta(d.bairro, 120),
      conta: corta(d.conta, 40),
      tipo: corta(d.tipo, 40),
      origem: corta(d.origem || 'site', 40),
      pagina: corta(location.pathname, 300),
      consentimento: !!d.consentimento
    });
  };

  /* ---------- Contador de acessos ---------- */
  if (!/\/admin\//.test(location.pathname)) {
    let id = null;
    try {
      id = localStorage.getItem('rr_vid');
      if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); localStorage.setItem('rr_vid', id); }
    } catch (e) {}
    let ref = '';
    try { if (document.referrer) { const h = new URL(document.referrer).hostname; if (h !== location.hostname) ref = h; } } catch (e) {}
    const params = new URLSearchParams(location.search);
    const utm = params.get('utm_source') || params.get('fbclid') && 'facebook' || params.get('gclid') && 'google-ads' || '';
    inserir('visitas', {
      pagina: corta(location.pathname, 300),
      referencia: corta(utm || ref, 200),
      dispositivo: matchMedia('(pointer:coarse)').matches ? 'celular' : 'computador',
      visitante: corta(id, 64)
    });
  }

  /* ---------- Formulário de cadastro ---------- */
  const f = document.getElementById('formCadastro');
  if (!f) return;
  const msg = document.getElementById('cadMsg');
  const btn = f.querySelector('button[type=submit]');
  const wa = document.getElementById('cadWa');

  f.whatsapp.addEventListener('input', () => {
    let d = soDigitos(f.whatsapp.value).slice(0, 11);
    if (d.length > 6) d = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    else if (d.length > 2) d = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    f.whatsapp.value = d;
  });

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f).entries());
    d.consentimento = f.consentimento.checked;
    msg.className = 'cad-msg';
    if (corta(d.nome, 120).length < 2) { msg.textContent = 'Digite seu nome.'; msg.classList.add('erro'); f.nome.focus(); return; }
    if (soDigitos(d.whatsapp).length < 10) { msg.textContent = 'Digite seu WhatsApp com DDD.'; msg.classList.add('erro'); f.whatsapp.focus(); return; }
    if (!d.consentimento) { msg.textContent = 'Para continuar, marque a autorização de contato.'; msg.classList.add('erro'); return; }
    btn.disabled = true; btn.textContent = 'Enviando...';
    const salvo = await window.rrSalvarLead(Object.assign({ origem: 'formulario' }, d));
    const texto = `Olá! Acabei de me cadastrar no site e quero meu orçamento grátis.\n\n👤 Nome: ${d.nome}\n📱 WhatsApp: ${d.whatsapp}\n📍 ${d.cidade || ''}${d.bairro ? ' - ' + d.bairro : ''}\n🏠 Imóvel: ${d.tipo}\n💡 Conta de luz: ${d.conta}`;
    if (wa && typeof waLink === 'function') { wa.href = waLink(texto); wa.hidden = false; }
    msg.textContent = salvo
      ? `Cadastro recebido, ${d.nome.split(' ')[0]}! ✅ Nossa equipe vai te chamar no WhatsApp. Se quiser agilizar, toque no botão abaixo e mande a foto da sua conta de luz.`
      : 'Quase lá! Toque no botão abaixo para enviar seus dados direto no WhatsApp da RR. 📲';
    msg.classList.add('ok');
    btn.textContent = salvo ? 'Cadastro enviado ✓' : 'Enviar cadastro';
    btn.disabled = salvo;
    if (salvo) f.querySelectorAll('input,select').forEach(i => i.disabled = true);
  });
})();
