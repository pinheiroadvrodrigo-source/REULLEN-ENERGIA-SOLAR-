/* ==========================================================
   RR Engenharia Solar — scripts do site
   Site criado por Rodrigo Pinheiro · (91) 99119-8584
   ========================================================== */
const WA_EMPRESA = '5591985423748'; // WhatsApp da RR Engenharia Solar
const BOT_NOME = 'RR Engenharia Solar';
const waLink = msg => 'https://wa.me/' + WA_EMPRESA + '?text=' + encodeURIComponent(msg);
const store = {
  get(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} }
};
const $ = s => document.querySelector(s);
const brl = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR');
const isTouch = matchMedia('(pointer:coarse)').matches;

const anoEl = $('#ano'); if (anoEl) anoEl.textContent = new Date().getFullYear();

/* ---------- Links de WhatsApp ---------- */
document.querySelectorAll('.js-wa').forEach(a => {
  a.href = waLink(a.dataset.msg || 'Olá! Vim através do site e gostaria de fazer um orçamento.');
  a.target = '_blank'; a.rel = 'noopener';
});

/* ---------- Cabeçalho e menu ---------- */
const header = $('#top');
if (header) { const f = () => header.classList.toggle('solid', scrollY > 30); addEventListener('scroll', f, {passive:true}); f(); }
const menu = $('#menu'), burger = $('#burger');
if (menu && burger) {
  burger.onclick = () => menu.classList.toggle('open');
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}

/* ---------- Animação ao rolar (com segurança: nunca deixa a página em branco) ---------- */
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('anim');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.08, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
  setTimeout(() => document.querySelectorAll('.rv').forEach(el => el.classList.add('in')), 2500);
}

/* ---------- Simulador ---------- */
const conta = $('#conta');
if (conta) {
  let tipo = 'Residencial';
  const sim = () => {
    const v = +conta.value, m = v * 0.85;
    $('#contaVal').textContent = brl(v) + (v >= 10000 ? '+' : '');
    $('#rMes').textContent = brl(m);
    $('#rAno').textContent = brl(m * 12);
    $('#r25').textContent = brl(m * 12 * 25);
    const b = $('#simBtn');
    b.href = waLink(`Olá! Vim pelo site e fiz a simulação. Imóvel: ${tipo}. Minha conta de luz é de cerca de ${brl(v)} por mês. Gostaria de um orçamento.`);
    b.target = '_blank'; b.rel = 'noopener';
  };
  conta.addEventListener('input', sim);
  document.querySelectorAll('#tipo .chip').forEach(c => c.onclick = () => {
    document.querySelectorAll('#tipo .chip').forEach(x => x.classList.remove('on'));
    c.classList.add('on'); tipo = c.dataset.t; sim();
  });
  sim();
}

/* ---------- Vídeos ---------- */
document.querySelectorAll('.vid').forEach(box => {
  const v = box.querySelector('video');
  box.addEventListener('click', () => {
    document.querySelectorAll('.vid video').forEach(o => { if (o !== v) { o.pause(); o.parentElement.classList.remove('playing'); } });
    if (v.paused) { v.play(); box.classList.add('playing'); } else { v.pause(); box.classList.remove('playing'); }
  });
});

/* ==========================================================
   POP-UP DE SAÍDA
   ========================================================== */
const exitEl = $('#exit');
const startT = Date.now();
let exitShown = store.get('rr_exit') === '1';
function showExit(){
  if (!exitEl || exitShown || Date.now() - startT < 6000) return;
  if (bot && bot.classList.contains('open')) return;
  exitShown = true; store.set('rr_exit', '1'); exitEl.classList.add('show');
}
if (exitEl) {
  const hide = () => exitEl.classList.remove('show');
  $('#exitClose').onclick = hide; $('#exitSkip').onclick = hide;
  exitEl.addEventListener('click', e => { if (e.target === exitEl) hide(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  // Só aparece quando a pessoa realmente vai SAIR do site:
  // Computador: o mouse sai pelo topo da janela (indo fechar a aba ou voltar)
  document.addEventListener('mouseout', e => { if (!e.relatedTarget && e.clientY <= 5) showExit(); });
  // Celular: a pessoa aperta "voltar" para sair do site
  if (isTouch) {
    try {
      history.pushState({rr:1}, '');
      addEventListener('popstate', () => {
        if (history.state && history.state.rr) return;            // só navegou dentro da página
        if (!exitShown && Date.now() - startT > 6000) { showExit(); history.pushState({rr:1}, ''); }
        else { history.back(); }                                   // deixa sair normalmente
      });
    } catch(e) {}
  }
}

/* ==========================================================
   CHATBOT DE ATENDIMENTO — energia solar
   ========================================================== */
const bot = $('#bot'), body = $('#botBody'), botBtn = $('#botBtn');
const lead = {};
let step = null, started = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const scrollBot = () => { body.scrollTop = body.scrollHeight; };

async function say(html){
  const t = document.createElement('div'); t.className = 'msg b typing'; t.innerHTML = '<i></i><i></i><i></i>';
  body.appendChild(t); scrollBot();
  await sleep(Math.min(1500, 450 + html.replace(/<[^>]+>/g,'').length * 9));
  t.remove();
  const m = document.createElement('div'); m.className = 'msg b'; m.innerHTML = html; body.appendChild(m); scrollBot();
}
function me(text){ const m = document.createElement('div'); m.className = 'msg u'; m.textContent = text; body.appendChild(m); scrollBot(); }
function options(list){
  body.querySelectorAll('.opts').forEach(o => o.remove());
  const w = document.createElement('div'); w.className = 'opts';
  list.forEach(([label, fn, cls]) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; if (cls) b.className = cls;
    b.onclick = () => { w.remove(); me(label); fn(); };
    w.appendChild(b);
  });
  body.appendChild(w); scrollBot();
}
const primeiroNome = () => lead.nome ? ', ' + lead.nome.split(' ')[0] : '';

function abrirWA(msg){
  window.open(waLink(msg), '_blank');
  say('Abri o WhatsApp para você. Nosso time responde rapidinho por lá! 💛');
}

async function menuPrincipal(texto){
  step = 'livre';
  await say(texto || 'Sobre o que você quer conversar? Pode tocar numa opção ou escrever sua dúvida 👇');
  options([
    ['☀️ Quero um orçamento', fluxoOrcamento],
    ['💰 Quanto custa?', fPreco],
    ['💳 Financiamento', fFin],
    ['🌧️ Funciona com chuva?', fChuva],
    ['💡 A conta zera?', fZera],
    ['🛠️ Como funciona', fComo],
    ['👤 Falar com atendente', () => abrirWA('Olá! Vim pelo site e gostaria de falar com um atendente.'), 'wa'],
  ]);
}
async function depois(){
  await sleep(250);
  options([['☀️ Fazer meu orçamento', fluxoOrcamento], ['❓ Outra dúvida', () => menuPrincipal('Claro! Qual a outra dúvida?')], ['👤 Falar com atendente', () => abrirWA('Olá! Vim pelo site e gostaria de falar com um atendente.'), 'wa']]);
}

/* ---- Respostas ---- */
async function fPreco(){
  await say('O valor depende principalmente do seu <b>consumo</b> (quantos kWh você gasta), do tipo de <b>telhado</b> e dos equipamentos escolhidos. 🔎');
  await say('Por isso não trabalhamos com preço "de tabela": fazemos um projeto sob medida. Com o valor da sua conta, já consigo te passar uma estimativa de economia. Quer fazer?');
  options([['Sim, vamos lá!', fluxoOrcamento], ['Antes, me fala do financiamento', fFin]]);
}
async function fFin(){
  await say('Dá pra parcelar em <b>até 84x</b> com bancos parceiros: BV, Santander, Caixa, Banpará, BTG Pactual, Solfácil, Sol Agora, Sou Cred e EOS. 💳');
  await say('Em muitos casos, a parcela fica parecida com o que você já paga de luz — com a diferença de que, quando termina, o sistema é seu e a economia continua. 😉');
  depois();
}
async function fChuva(){
  await say('Funciona sim! 🌦️ Mesmo no inverno amazônico os painéis continuam gerando, só que com menos intensidade.');
  await say('E o que sobra nos dias de sol vira <b>crédito</b> na Equatorial para abater nos meses de menor geração. O sistema é dimensionado pela média do ano todo.');
  depois();
}
async function fZera(){
  await say('Não zera 100%, porque a concessionária continua cobrando a taxa mínima e a iluminação pública. Mas a economia pode chegar a <b>até 85%</b> da fatura. 💰');
  depois();
}
async function fComo(){
  await say('É bem simples:<br>1️⃣ Você manda a conta de luz<br>2️⃣ Fazemos a visita técnica e o projeto<br>3️⃣ Contrato + financiamento<br>4️⃣ Nossa equipe instala<br>5️⃣ A gente cuida da homologação na Equatorial e o sistema é ligado ⚡');
  depois();
}
async function fHomolog(){
  await say('A homologação é o pedido de conexão do seu sistema na <b>Equatorial Pará</b>. A RR cuida de toda a papelada: projeto, solicitação, vistoria e troca do medidor pelo bidirecional. Você não precisa ir a lugar nenhum. 📄');
  depois();
}
async function fPrazo(){
  await say('A instalação em si costuma ser rápida — em residências, geralmente poucos dias. O prazo total depende do tamanho do sistema e da aprovação da Equatorial. Passamos o cronograma certinho no orçamento. 📅');
  depois();
}
async function fGarantia(){
  await say('Os equipamentos têm garantia de fábrica: os painéis normalmente contam com garantia de desempenho de longa duração (em geral 25 anos) e os inversores têm garantia própria do fabricante. Os prazos exatos ficam descritos na proposta e no contrato. ✅');
  depois();
}
async function fManut(){
  await say('A manutenção é simples: basicamente limpeza periódica dos painéis e uma revisão de vez em quando. Aqui em Belém, com poeira e fuligem, a limpeza ajuda a manter a geração lá em cima. 🧽');
  depois();
}
async function fBateria(){
  await say('O sistema mais comum (on-grid) é ligado à rede e, por segurança, desliga quando falta energia na rua. 🔌');
  await say('Se você quer energia mesmo durante quedas, dá pra fazer um sistema <b>com baterias</b> (híbrido). Vale conversar com nosso time pra ver o custo-benefício.');
  depois();
}
async function fCidades(){
  await say('Atendemos <b>Belém</b> e região metropolitana (Ananindeua, Marituba, Benevides, Santa Bárbara, Santa Izabel, Castanhal…) e também outras cidades do <b>Pará</b>. 📍 Me diz sua cidade que eu confirmo pra você!');
  step = 'cidade_check';
}
async function fEndereco(){
  await say('Temos escritório físico e você é muito bem-vindo pra tomar um cafezinho com a gente! ☕ Chama no WhatsApp que mandamos a localização certinha.');
  options([['📍 Pedir localização', () => abrirWA('Olá! Vim pelo site e gostaria da localização do escritório da RR.'), 'wa'], ['❓ Outra dúvida', () => menuPrincipal('Claro! Qual a outra dúvida?')]]);
}
async function fTelhado(){
  await say('Instalamos em telhado de cerâmica, fibrocimento (Brasilit), metálico, laje e também em solo. 🏠 Na visita técnica avaliamos a estrutura — e, se precisar de reforço ou reforma, a RR também faz.');
  depois();
}
async function fLei(){
  await say('A Lei 14.300/2022 (marco legal da geração distribuída) trouxe uma cobrança gradual sobre parte da tarifa de uso da rede para os novos sistemas. Mesmo assim, a energia solar continua sendo um ótimo investimento. 📈');
  await say('No orçamento a gente já considera essas regras na conta da sua economia.');
  depois();
}
async function fValoriza(){
  await say('Sim! Um imóvel com energia solar fica mais atrativo, porque o próximo morador também vai pagar menos de luz. 🏡');
  depois();
}
async function fRural(){
  await say('Energia solar no campo é excelente: bomba d\'água, irrigação, batedeira de açaí, freezers, ordenha… 🌾 Temos projetos para propriedades rurais em todo o Pará.');
  depois();
}
async function fIgreja(){
  await say('Temos um projeto especial para igrejas ⛪: ar-condicionado, som e iluminação nos cultos sem medo da conta. Economia de até 85% e parcelamento em até 84x.');
  depois();
}
async function fEmpresa(){
  await say('Para comércios e empresas, a energia solar reduz custo fixo e aumenta a margem. Atendemos lojas, clínicas, restaurantes, galpões e indústrias. 🏪🏭');
  depois();
}
async function fObra(){
  await say('Além da energia solar, a RR faz <b>projetos, reformas, laudo técnico e vistoria</b>. 🏗️');
  options([['Quero falar sobre isso', () => abrirWA('Olá! Vim pelo site e gostaria de informações sobre projetos/reformas/laudo técnico/vistoria.'), 'wa'], ['❓ Outra dúvida', () => menuPrincipal('Claro! Qual a outra dúvida?')]]);
}

/* ---- Fluxo de orçamento ---- */
async function fluxoOrcamento(){
  if (!lead.nome) { await say('Show! Vou te fazer umas perguntinhas rápidas pra agilizar seu orçamento. 📝'); await say('Primeiro: qual é o seu nome?'); step = 'nome'; return; }
  perguntaTipo();
}
async function perguntaTipo(){
  await say(`Prazer${primeiroNome()}! 😊 O sistema seria para qual tipo de imóvel?`);
  const set = t => () => { lead.tipo = t; perguntaConta(); };
  options([['🏠 Casa', set('Residencial')], ['🏪 Comércio/Empresa', set('Comercial')], ['🌾 Rural', set('Rural')], ['🏭 Indústria', set('Industrial')], ['⛪ Igreja', set('Igreja')]]);
  step = 'tipo';
}
async function perguntaConta(){
  await say('Quanto vem sua conta de luz por mês, em média? (pode digitar o valor também)');
  const set = (t, v) => () => { lead.conta = t; lead.contaV = v; perguntaCidade(); };
  options([['Até R$ 300', set('até R$ 300', 250)], ['R$ 300 a 600', set('R$ 300 a R$ 600', 450)], ['R$ 600 a 1.000', set('R$ 600 a R$ 1.000', 800)], ['R$ 1.000 a 3.000', set('R$ 1.000 a R$ 3.000', 2000)], ['Mais de R$ 3.000', set('mais de R$ 3.000', 4000)]]);
  step = 'conta';
}
async function perguntaCidade(){
  if (lead.contaV) await say(`Com essa conta, a economia pode chegar a cerca de <b>${brl(lead.contaV * 0.85)} por mês</b> — algo como <b>${brl(lead.contaV * 0.85 * 12)} por ano</b>. 🤑`);
  await say('Em qual cidade e bairro fica o imóvel?');
  step = 'cidade';
}
async function perguntaTelhado(){
  await say('Quase lá! Como é o telhado?');
  const set = t => () => { lead.telhado = t; perguntaWhats(); };
  options([['Cerâmica', set('Cerâmica')], ['Fibrocimento/Brasilit', set('Fibrocimento')], ['Metálico', set('Metálico')], ['Laje', set('Laje')], ['No solo / não sei', set('Não sei / solo')]]);
  step = 'telhado';
}
async function perguntaWhats(){
  await say('E qual é o seu WhatsApp com DDD? Assim nossa equipe te chama com o orçamento. 📱<br><small style="color:#5b6b85">Ao informar, você autoriza a RR Engenharia Solar a entrar em contato. Seus dados ficam protegidos conforme a LGPD.</small>');
  options([['Prefiro não informar', () => { lead.whats = ''; finalizar(); }]]);
  step = 'whats';
}
async function finalizar(){
  step = 'livre';
  if (lead.whats && window.rrSalvarLead) {
    const cid = String(lead.cidade || '');
    window.rrSalvarLead({ nome: lead.nome, whatsapp: lead.whats, cidade: cid, conta: lead.conta, tipo: lead.tipo, origem: 'chatbot', consentimento: true });
  }
  await say(`Prontinho${primeiroNome()}! ✅ Já organizei tudo. Toque no botão abaixo para enviar no WhatsApp da RR.`);
  await say('📸 Dica: mande junto uma <b>foto da sua conta de luz</b> — assim o orçamento sai ainda mais preciso!');
  const msg = `Olá! Vim através do site e gostaria de fazer um orçamento de energia solar.\n\n👤 Nome: ${lead.nome}\n🏠 Imóvel: ${lead.tipo}\n💡 Conta de luz: ${lead.conta}\n📍 Local: ${lead.cidade}\n🏚️ Telhado: ${lead.telhado}${lead.whats ? '\n📱 WhatsApp: ' + lead.whats : ''}`;
  options([['📲 Enviar no WhatsApp', () => abrirWA(msg), 'wa'], ['❓ Tirar outra dúvida', () => menuPrincipal('Claro! Qual a outra dúvida?')]]);
}

/* ---- Entendendo o que a pessoa escreve ---- */
const INTENTS = [
  [/financ|parcel|banco|84|cr[eé]dito|entrada/, fFin],
  [/chuv|nublad|inverno|nuvem|noite|tempo ruim/, fChuva],
  [/zera|zerar|taxa m[ií]nima|ilumina[cç][aã]o p[uú]blica/, fZera],
  [/homolog|equatorial|celpa|medidor|concession[aá]ria|aprova/, fHomolog],
  [/prazo|demora|quanto tempo|quando fica|dias/, fPrazo],
  [/garantia|dura|vida [uú]til|quantos anos/, fGarantia],
  [/manuten|limp|sujeira|revis/, fManut],
  [/bateria|off.?grid|falta de energia|queda|apag/, fBateria],
  [/endere[cç]o|onde fica|localiza|escrit[oó]rio|visitar/, fEndereco],
  [/cidade|atende|ananindeua|marituba|castanhal|santar[eé]m|marab[aá]|interior|regi[aã]o/, fCidades],
  [/telhad|laje|brasilit|cer[aâ]mica|telha|estrutura/, fTelhado],
  [/14\.?300|lei|taxa[cç][aã]o|fio b/, fLei],
  [/valoriz|vender (a )?casa|im[oó]vel/, fValoriza],
  [/rural|fazenda|s[ií]tio|ch[aá]cara|a[cç]a[ií]|irriga|gado|bomba/, fRural],
  [/igreja|templo|culto|minist[eé]rio/, fIgreja],
  [/empresa|com[eé]rcio|loja|cl[ií]nica|restaurante|ind[uú]stria|galp[aã]o/, fEmpresa],
  [/laudo|reform|projeto|vistori|obra|constru/, fObra],
  [/pre[cç]o|valor|quanto custa|custa|caro|investimento/, fPreco],
  [/or[cç]amento|instalar|quero|contratar|simula/, fluxoOrcamento],
  [/funciona|como [eé]|etapa|processo/, fComo],
];
const CIDADES_RM = /bel[eé]m|ananindeua|marituba|benevides|santa b[aá]rbara|santa izabel|castanhal|icoaraci|mosqueiro|outeiro/;

async function livre(txt){
  const t = txt.toLowerCase().normalize('NFC');
  if (step === 'nome') { lead.nome = txt.replace(/^(meu nome [eé]|sou o|sou a|eu sou)\s*/i, '').split(' ').slice(0, 3).join(' '); return perguntaTipo(); }
  if (step === 'conta') {
    const n = parseFloat(t.replace(/[^\d,\.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'));
    if (n > 0) { lead.conta = brl(n); lead.contaV = n; return perguntaCidade(); }
    await say('Não entendi o valor 😅 Pode digitar só o número, por exemplo: 450'); return;
  }
  if (step === 'tipo') { lead.tipo = txt; return perguntaConta(); }
  if (step === 'cidade') { lead.cidade = txt; return perguntaTelhado(); }
  if (step === 'telhado') { lead.telhado = txt; return perguntaWhats(); }
  if (step === 'whats') {
    if (txt.replace(/\D/g, '').length < 10) { await say('Hmm, parece que faltou o DDD 😅 Digite assim: 91 98888-7777'); return; }
    lead.whats = txt; return finalizar();
  }
  if (step === 'cidade_check') {
    step = 'livre';
    if (CIDADES_RM.test(t)) await say(`Atendemos sim em ${txt}! 🙌 Quer que eu já monte seu orçamento?`);
    else await say(`Para ${txt}, nosso time confirma a disponibilidade rapidinho pelo WhatsApp. Já posso adiantar seu orçamento por aqui!`);
    return options([['☀️ Fazer meu orçamento', fluxoOrcamento], ['👤 Falar com atendente', () => abrirWA(`Olá! Vim pelo site. Vocês atendem em ${txt}?`), 'wa']]);
  }
  if (/^(oi|ol[aá]|opa|e a[ií]|bom dia|boa tarde|boa noite|tudo bem)/.test(t)) {
    const h = new Date().getHours(); const s = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    return menuPrincipal(`${s}${primeiroNome()}! 😊 Como posso te ajudar com energia solar hoje?`);
  }
  if (/obrigad|valeu|show|top|beleza|ok$/.test(t)) { await say('Imagina! Qualquer coisa estou por aqui. ☀️'); return depois(); }
  if (/tchau|at[eé] mais|falou/.test(t)) return say('Até mais! Quando quiser economizar na conta de luz, é só chamar. 👋');
  if (/atendente|humano|pessoa|vendedor|ligar|telefone|whats/.test(t)) return abrirWA('Olá! Vim pelo site e gostaria de falar com um atendente.');
  for (const [re, fn] of INTENTS) if (re.test(t)) return fn();
  await say('Boa pergunta! Pra te responder certinho, o ideal é falar com nosso time técnico. 👇');
  options([['👤 Perguntar no WhatsApp', () => abrirWA('Olá! Vim pelo site e tenho uma dúvida: ' + txt), 'wa'], ['☀️ Fazer meu orçamento', fluxoOrcamento], ['📋 Ver opções', () => menuPrincipal()]]);
}

async function openBot(){
  bot.classList.add('open'); botBtn.classList.add('hide-lbl');
  if (!started) {
    started = true;
    const h = new Date().getHours(); const s = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    await say(`${s}! 👋 Que bom te ver por aqui. Sou o assistente virtual da <b>${BOT_NOME}</b>.`);
    await say('Estamos online pra te ajudar a reduzir em até <b>85%</b> a sua conta de luz com energia solar. ☀️');
    menuPrincipal();
  }
  setTimeout(() => { const i = $('#botInput'); if (i && !isTouch) i.focus(); }, 300);
}
if (bot && botBtn) {
  // "Estamos online": aparece aos 3,5 s, some depois de 8 s e volta quando a pessoa chega ao fim do site
  const lblOn = () => botBtn.classList.add('show-lbl'), lblOff = () => botBtn.classList.remove('show-lbl');
  setTimeout(() => { lblOn(); setTimeout(() => { if (!nearEnd()) lblOff(); }, 8000); }, 3500);
  const nearEnd = () => scrollY + innerHeight >= document.documentElement.scrollHeight - 700;
  addEventListener('scroll', () => { if (Date.now() - startT > 11500) nearEnd() ? lblOn() : lblOff(); }, {passive:true});
  $('#botForm').addEventListener('submit', e => {
    e.preventDefault(); const i = $('#botInput'); const v = i.value.trim(); if (!v) return;
    i.value = ''; body.querySelectorAll('.opts').forEach(o => o.remove()); me(v); livre(v);
  });
  botBtn.onclick = () => bot.classList.contains('open') ? (bot.classList.remove('open'), botBtn.classList.remove('hide-lbl')) : openBot();
  $('#botClose').onclick = () => { bot.classList.remove('open'); botBtn.classList.remove('hide-lbl'); };
  setTimeout(() => {
    if (!started && !(exitEl && exitEl.classList.contains('show')) && innerWidth > 780 && store.get('rr_bot') !== '1') { store.set('rr_bot', '1'); openBot(); }
  }, 25000);
}

/* ==========================================================
   CARROSSÉIS — andam sozinhos para o lado, param ao tocar
   ========================================================== */
(function () {
  const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.car').forEach(car => {
    const track = car.querySelector('.car-track');
    const itens = [...track.children];
    itens.forEach(it => { const c = it.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); }); // loop infinito
    const speed = parseFloat(car.dataset.speed || '0.4') * (car.dataset.dir === '-1' ? -1 : 1);
    let pausa = false, retomar = null, pos = 0, ult = 0, visivel = false;
    const metade = () => track.scrollWidth / 2;
    const parar = (ms) => { pausa = true; clearTimeout(retomar); if (ms) retomar = setTimeout(() => { if (![...car.querySelectorAll('video')].some(v => !v.paused)) pausa = false; }, ms); };
    if (speed < 0) requestAnimationFrame(() => { track.scrollLeft = metade(); pos = track.scrollLeft; });
    new IntersectionObserver(e => { visivel = e[0].isIntersecting; }, { rootMargin: '100px' }).observe(car);
    function passo(t) {
      const dt = ult ? Math.min(t - ult, 50) : 16; ult = t;
      if (!pausa && visivel && !reduz) {
        pos += speed * dt / 16;
        const m = metade();
        if (pos >= m) pos -= m; if (pos < 0) pos += m;
        track.scrollLeft = pos;
      } else pos = track.scrollLeft;
      requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
    car.addEventListener('mouseenter', () => parar());
    car.addEventListener('mouseleave', () => parar(800));
    track.addEventListener('touchstart', () => parar(), { passive: true });
    track.addEventListener('touchend', () => parar(3500), { passive: true });
    track.addEventListener('wheel', () => parar(2500), { passive: true });
    // arrastar com o mouse no computador
    let arrastando = false, x0 = 0, s0 = 0, moveu = false;
    track.addEventListener('mousedown', e => { arrastando = true; moveu = false; x0 = e.pageX; s0 = track.scrollLeft; track.classList.add('drag'); parar(); });
    addEventListener('mousemove', e => { if (!arrastando) return; const dx = e.pageX - x0; if (Math.abs(dx) > 4) moveu = true; track.scrollLeft = s0 - dx; });
    addEventListener('mouseup', () => { if (!arrastando) return; arrastando = false; track.classList.remove('drag'); pos = track.scrollLeft; });
    track.addEventListener('click', e => { if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; } }, true);
    // setas
    const pulo = () => (itens[0] ? itens[0].getBoundingClientRect().width + 16 : 300);
    car.querySelector('.prev').onclick = () => { parar(4000); track.scrollBy({ left: -pulo(), behavior: 'smooth' }); };
    car.querySelector('.next').onclick = () => { parar(4000); track.scrollBy({ left: pulo(), behavior: 'smooth' }); };
    // vídeos: tocar com som, pausa o carrossel enquanto toca
    track.addEventListener('click', e => {
      const box = e.target.closest('.vidc'); if (!box) return;
      const v = box.querySelector('video');
      document.querySelectorAll('.vidc video, .vid video').forEach(o => { if (o !== v && !o.paused) { o.pause(); (o.closest('.vidc') || o.parentElement).classList.remove('playing'); } });
      if (v.paused) { v.play(); box.classList.add('playing'); parar(); }
      else { v.pause(); box.classList.remove('playing'); parar(2000); }
      v.onended = () => { box.classList.remove('playing'); parar(1500); };
    });
  });
  // foto ampliada
  const lb = document.getElementById('lightbox');
  if (lb) {
    const fechar = () => { lb.hidden = true; };
    document.addEventListener('click', e => {
      const img = e.target.closest('.car-item img'); if (!img) return;
      lb.querySelector('img').src = img.src; lb.querySelector('img').alt = img.alt;
      lb.querySelector('p').textContent = img.alt; lb.hidden = false;
    });
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-x')) fechar(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') fechar(); });
  }
})();
