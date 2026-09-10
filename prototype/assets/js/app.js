/* MoF Rasuwa–Bhotekoshi Flood Update — site application (no build step, no framework) */
(function () {
  'use strict';
  const D = window.RFU_DATA;
  const STATIC = /[?&]static=1/.test(location.search) || matchMedia('print').matches;
  if (STATIC) document.documentElement.classList.add('static');

  /* ---------- language ---------- */
  const urlLang = (location.search.match(/[?&]lang=(ne|en)/) || [])[1];
  let L = urlLang || localStorage.getItem('rfu-lang') || 'ne';
  document.documentElement.lang = L;
  const T = (ne, en) => (L === 'ne' ? ne : en);

  /* ---------- number & date formatting ---------- */
  const DEV = ['०','१','२','३','४','५','६','७','८','९'];
  const dig = s => L === 'ne' ? String(s).replace(/\d/g, d => DEV[d]) : String(s);
  function grp(n, dec = 0) {                       // Indian grouping 4,26,35,65,174
    n = Number(n) || 0; const neg = n < 0; n = Math.abs(n);
    const fixed = n.toFixed(dec); let [ip, fp] = fixed.split('.');
    if (ip.length > 3) { const last = ip.slice(-3); let rest = ip.slice(0, -3); const parts = []; while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); } if (rest) parts.unshift(rest); ip = parts.join(',') + ',' + last; }
    return (neg ? '-' : '') + ip + (fp ? '.' + fp : '');
  }
  const num = (n, dec = 0) => dig(grp(n, dec));
  const npr = (n, dec = 0) => T('रु. ', 'NPR ') + num(n, dec);
  const usd = n => 'USD ' + (L === 'ne' ? num(n) : Number(n).toLocaleString('en-US'));
  function short(n) {                              // 4.26 अर्ब / 4.26 billion
    n = Number(n) || 0;
    if (n >= 1e9) return T(dig((n / 1e9).toFixed(2)) + ' अर्ब', (n / 1e9).toFixed(2) + ' billion');
    if (n >= 1e7) return T(dig((n / 1e7).toFixed(1)) + ' करोड', (n / 1e6).toFixed(1) + ' million');
    if (n >= 1e5) return T(dig((n / 1e5).toFixed(1)) + ' लाख', (n / 1e5).toFixed(1) + ' lakh');
    return num(n);
  }
  const pct = (a, b) => dig((100 * a / b).toFixed(1)) + '%';
  const AD = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const adFmt = s => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${+d} ${AD[+m - 1]} ${y}`; };
  const when = (bs, ad) => T(bs, adFmt(ad));

  /* ---------- icons (Lucide-style, inline) ---------- */
  const P = {
    home:'<path d="M3 11l9-7 9 7v9H3z"/><path d="M10 20v-6h4v6"/>', coins:'<ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v6c0 1.7 2.7 3 6 3s6-1.3 6-3V6"/><path d="M3 12v6c0 1.7 2.7 3 6 3s6-1.3 6-3v-6"/><path d="M15 9c3.3 0 6 1.3 6 3v6c0 1.7-2.7 3-6 3"/>',
    card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>', bank:'<path d="M3 10l9-6 9 6"/><path d="M4 10v9M9 10v9M15 10v9M20 10v9M2 19h20"/>',
    hand:'<path d="M3 12l4-1 4 3h4a2 2 0 0 1 0 4h-4"/><path d="M7 11V6a2 2 0 0 1 4 0v5"/><path d="M11 8V5a2 2 0 0 1 4 0v6"/><path d="M15 9V7a2 2 0 0 1 4 0v8c0 3-2 5-5 5H9l-6-3"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', ring:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M18.4 5.6l-3.5 3.5M9.1 14.9l-3.5 3.5"/>',
    doc:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>', heli:'<path d="M3 5h16M11 5v3"/><path d="M6 11h9a5 5 0 0 1 5 5H4a4 4 0 0 1 2-5z"/><path d="M5 19h14M20 16l-2 3"/>',
    people:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 7-4"/>', gavel:'<path d="M3 21h8"/><path d="M13 4l7 7-3 3-7-7z"/><path d="M11 7l-8 8 3 3 8-8"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', download:'<path d="M12 4v11M7 10l5 5 5-5M4 19h16"/>',
    pin:'<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>', truck:'<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    percent:'<path d="M5 19L19 5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>', umbrella:'<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v6a2 2 0 0 0 4 0"/>',
    link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', chart:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
    qr:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2"/>', mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    flag:'<path d="M5 21V4"/><path d="M5 4h12l-3 4 3 4H5"/>', check:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>', bolt:'<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', fuel:'<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M4 12h10M14 8h3l2 2v7a2 2 0 0 1-4 0v-3"/>',
    tower:'<path d="M12 22V10"/><path d="M8 22l4-12 4 12"/><path d="M7 6a7 7 0 0 1 10 0M9.5 8.5a3.5 3.5 0 0 1 5 0"/>', heart:'<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>',
    plus:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>', wrench:'<path d="M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9z"/><path d="M14 6l4 4"/>', box:'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    x:'<path d="M18 6L6 18M6 6l12 12"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', ext:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>', menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'
  };
  const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- derived totals ---------- */
  const C = D.contributions;
  const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  const TOT = {
    nchl: D.nchl.total, fone: D.fonepay.total,
    inpNpr: sum(C, c => c.npr), inpUsd: sum(C, c => c.usd), inpN: C.length,
    inpIns: sum(C.filter(c => c.type === 'ins'), c => c.npr), inpInd: sum(C.filter(c => c.type === 'ind'), c => c.npr),
    inpChq: sum(C.filter(c => c.mode === 'chq'), c => c.npr), inpBt: sum(C.filter(c => c.mode === 'bt'), c => c.npr),
    foreignUsd: sum(D.foreign, f => f.usd), foreignNpr: sum(D.foreign, f => f.npr)
  };
  const FS = D.fund_status;
  TOT.digital = TOT.nchl + TOT.fone;
  TOT.npr = TOT.digital + TOT.inpNpr;                 // all NPR receipts
  TOT.foreignAllUsd = FS ? FS.usd.gross : TOT.foreignUsd;          // C: total USD deposited after the flood (OPMCM/NRB); named contributors (D) are a subset
  TOT.foreignUnid = TOT.foreignAllUsd - TOT.foreignUsd;              // deposits not yet attributed to a named contributor
  TOT.grand = TOT.npr + TOT.foreignAllUsd * D.meta.fx_usd_npr;   // incl. foreign USD at FX
  const byDay = {}; C.forEach(c => { byDay[c.bs] = byDay[c.bs] || { npr: 0, n: 0 }; byDay[c.bs].npr += c.npr; byDay[c.bs].n++; });
  const DAYS = Object.keys(byDay);

  function ago() {
    const ms = Date.now() - new Date(D.meta.updated_at).getTime(); if (!isFinite(ms) || ms < 0) return '';
    const h = Math.floor(ms / 36e5), d = Math.floor(h / 24);
    if (h < 1) return T('(भर्खरै)', '(just now)'); if (h < 24) return T('(' + num(h) + ' घण्टा अघि)', '(' + num(h) + ' h ago)'); return T('(' + num(d) + ' दिन अघि)', '(' + num(d) + (d === 1 ? ' day ago)' : ' days ago)'));
  }
  /* ---------- layout ---------- */
  const NAV = [['index.html','गृहपृष्ठ','Home','home'],['contributions.html','प्राप्त सहयोग','Contributions','coins'],['foreign.html','वैदेशिक सहयोग','Foreign Assistance','globe'],['rescue.html','उद्धार','Rescue','ring'],['initiatives.html','सरकारका पहल','Government Initiatives','gavel'],['contact.html','सम्पर्क','Contact','phone']];
  const page = document.body.dataset.page;
  function header() {
    const items = NAV.map(([h, ne, en, i]) => `<a href="${h}" class="${h.split('.')[0] === page ? 'on' : ''}" ${h.split('.')[0] === page ? 'aria-current="page"' : ''}><span class="row">${ic(i)}<span>${T(ne, en)}</span></span><small>${T(en, ne)}</small></a>`).join('');
    document.getElementById('site-header').innerHTML = `
<a class="skip" href="#main">${T('मुख्य सामग्रीमा जानुहोस्', 'Skip to content')}</a>
<div class="top"><div class="wrap">
  <div class="brand"><img src="assets/img/emblem.png" alt="${T('नेपाल सरकारको निशान छाप', 'Emblem of Nepal')}"><div class="g"><small>${T('नेपाल सरकार', 'Government of Nepal')}</small><b>${T('अर्थ मन्त्रालय', 'Ministry of Finance')}</b><span>${T('सिंहदरबार, काठमाडौँ', 'Singha Durbar, Kathmandu')}</span></div></div>
  <div class="ptitle"><b>${T(D.meta.portal_ne, D.meta.portal_en)}</b><span>${T(D.meta.portal_en, D.meta.portal_ne)}</span></div>
  <div class="gsearch">${ic('search')}<input id="gs" type="search" placeholder="${T('सम्पूर्ण पोर्टलमा खोज्नुहोस् — दाता, क्षेत्र, राहत व्यवस्था…', 'Search the portal — donor, sector, relief measure…')}" autocomplete="off" aria-label="Search"><div class="gsr" hidden></div></div>
  <div class="tools"><div class="lang" role="group" aria-label="Language"><button class="${L === 'ne' ? 'on' : ''}" data-lang="ne">ने</button><button class="${L === 'en' ? 'on' : ''}" data-lang="en">EN</button></div>
  <a class="btn red" href="https://donate.gov.np/" target="_blank" rel="noopener">${ic('qr')}<span>donate.gov.np</span></a>
  <button class="burger" aria-label="Menu" aria-expanded="false">${ic('menu')}</button></div>
</div></div>
<nav class="main" aria-label="Main"><div class="wrap">${items}<div class="mextra"><div class="lang" role="group" aria-label="Language"><button class="${L === 'ne' ? 'on' : ''}" data-lang="ne">नेपाली</button><button class="${L === 'en' ? 'on' : ''}" data-lang="en">English</button></div><a class="btn red" href="https://donate.gov.np/" target="_blank" rel="noopener">${ic('qr')} donate.gov.np</a></div></div></nav><div class="stripe"></div>
<div class="ticker"><div class="wrap"><span class="live"><i></i>LIVE</span><span>${ic('clock')} ${T('अद्यावधिक: ' + D.meta.updated_bs, 'Updated: ' + D.meta.updated_en)} <em class="ago">${ago()}</em></span><span>·</span><span>${T('घटना: ' + D.meta.event_date_bs + ' को भोटेकोशी बाढी', 'Event: Bhotekoshi flood of ' + D.meta.event_date_en)}</span><span class="src" style="margin-left:auto">${T('स्रोत: MoF · NCHL · Fonepay · NDRRMA · नेपाल प्रहरी', 'Sources: MoF · NCHL · Fonepay · NDRRMA · Nepal Police')}</span></div></div>`;
    document.querySelectorAll('[data-lang]').forEach(b => b.onclick = () => setLang(b.dataset.lang));
    const gs = document.getElementById('gs'), gr = document.querySelector('.gsr');
    gs.oninput = () => { const r = globalSearch(gs.value); gr.hidden = !r.length && gs.value.trim().length < 2; gr.innerHTML = r.length ? r.map(x => `<a href="${x.h}"><small>${x.g}</small><b>${x.t}</b><span>${x.s}</span></a>`).join('') : `<div class="none">${T('केही फेला परेन', 'Nothing found')}</div>`; };
    gs.onkeydown = e => { if (e.key === 'Escape') { gr.hidden = true; } if (e.key === 'Enter') { const a = gr.querySelector('a'); if (a) location.href = a.href; } };
    document.addEventListener('click', e => { if (!e.target.closest('.gsearch')) gr.hidden = true; });
    const bg = document.querySelector('.burger'), nv = document.querySelector('nav.main');
    const setOpen = o => { nv.classList.toggle('open', o); bg.setAttribute('aria-expanded', o); bg.innerHTML = ic(o ? 'x' : 'menu'); document.body.classList.toggle('noscroll', o); nv.querySelector('.wrap').style.top = o ? document.querySelector('.top').getBoundingClientRect().bottom + 'px' : ''; };
    bg.onclick = () => setOpen(!nv.classList.contains('open'));
    nv.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }
  function footer() {
    const M = D.ministry;
    document.getElementById('site-footer').innerHTML = `<div class="wrap">
<div><b>${T(D.meta.portal_ne, D.meta.portal_en)}</b>${T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोष / प्रधानमन्त्री राहत कोषमा प्राप्त सहयोग, वैदेशिक सहयोग, उद्धार तथा सरकारका पहलको आधिकारिक अद्यावधिक।', 'Official update on contributions to the PM Disaster Relief Fund, foreign assistance, rescue and government initiatives for the Rasuwa–Bhotekoshi flood.')}<br><br>${T(M.name_ne, M.name_en)} · ${T(M.address_ne, M.address_en)}<br>${M.phones.join(' · ')}<br>${M.emails.join(' · ')}</div>
<div><b>${T('खण्ड', 'Sections')}</b><ul>${NAV.map(([h, ne, en]) => `<li><a href="${h}">${T(ne, en)}</a></li>`).join('')}</ul></div>
<div><b>${T('आधिकारिक लिङ्क', 'Official links')}</b><ul><li><a href="https://mof.gov.np/" target="_blank" rel="noopener">mof.gov.np</a></li><li><a href="https://donate.gov.np/" target="_blank" rel="noopener">donate.gov.np</a></li>${D.portals.map(p => `<li><a href="${p.url}" target="_blank" rel="noopener">${p.url.replace('https://', '').replace(/\/$/, '')}</a></li>`).join('')}<li><a href="https://opmcm.gov.np/" target="_blank" rel="noopener">opmcm.gov.np</a></li></ul><b style="margin-top:10px">${T('डाउनलोड', 'Downloads')}</b><ul><li><a href="downloads/MoF-Rasuwa-Bhotekoshi-Flood-Update_Nepali.pdf">${ic('download')} ${T('पूर्ण अद्यावधिक — नेपाली (PDF)', 'Full update — Nepali (PDF)')}</a></li><li><a href="downloads/MoF-Rasuwa-Bhotekoshi-Flood-Update_English.pdf">${ic('download')} ${T('पूर्ण अद्यावधिक — अंग्रेजी (PDF)', 'Full update — English (PDF)')}</a></li><li><a href="data/data.js">${ic('download')} ${T('खुला डेटा (JSON)', 'Open data (JSON)')}</a></li></ul></div>
<div class="copy"><span>${T('मुद्रण / निर्यात मिति: ' + D.meta.updated_bs, 'Printed / exported: ' + D.meta.updated_en)}</span><span>© ${dig('2083')} ${T('नेपाल सरकार, अर्थ मन्त्रालय', 'Government of Nepal, Ministry of Finance')}</span><span>${T('अन्तिम अद्यावधिक ' + D.meta.updated_bs, 'Last updated ' + D.meta.updated_en)}</span></div></div>`;
  }
  function setLang(l) { L = l; localStorage.setItem('rfu-lang', l); document.documentElement.lang = l; render(); }

  /* ---------- charts ---------- */
  const charts = {};
  const COL = { red: '#C8102E', navy: '#003893', navy2: '#3A62B8', navy3: '#9DB3E3', gold: '#C9A227', ok: '#1F8A4C', grey: '#DCE1EA', ink: '#14213D' };
  if (window.Chart) { Chart.defaults.font.family = 'Mukta, sans-serif'; Chart.defaults.font.size = 13.5; Chart.defaults.color = '#5B6478'; Chart.defaults.animation = STATIC ? false : { duration: 700 }; Chart.defaults.plugins.legend.display = false; }
  function chart(id, cfg) { const el = document.getElementById(id); if (!el || !window.Chart) return; if (charts[id]) charts[id].destroy(); el.setAttribute('role', 'img'); el.setAttribute('aria-label', (cfg.data.labels || []).map((l, i) => l + ': ' + cfg.data.datasets[0].data[i]).join(', ')); charts[id] = new Chart(el, cfg); }
  const tip = f => ({ callbacks: { label: c => ' ' + f(c.raw, c) } });
  function hbar(id, labels, values, { color = COL.navy, fmt = v => npr(v), extra } = {}) {
    chart(id, { type: 'bar', data: { labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 4, barPercentage: .7, categoryPercentage: .85 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, layout: { padding: { right: 8 } }, scales: { x: { grid: { color: '#EEF1F6' }, ticks: { callback: v => short(v), maxTicksLimit: 5 } }, y: { grid: { display: false }, ticks: { font: { size: 12, weight: 600 }, color: COL.ink, autoSkip: false } } }, plugins: { tooltip: tip((v, c) => fmt(v) + (extra ? ' · ' + extra(c.dataIndex) : '')) } } });
  }
  function vbar(id, labels, values, { color = COL.navy, fmt = v => num(v), stacked } = {}) {
    const ds = Array.isArray(values[0]) ? values.map((v, i) => ({ data: v, backgroundColor: [COL.navy, COL.red, COL.navy3][i], borderRadius: 3 })) : [{ data: values, backgroundColor: color, borderRadius: 4, barPercentage: .6 }];
    chart(id, { type: 'bar', data: { labels, datasets: ds }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: !!stacked, grid: { display: false }, ticks: { color: COL.ink, font: { weight: 600 } } }, y: { stacked: !!stacked, grid: { color: '#EEF1F6' }, ticks: { callback: v => (fmt === num ? num(v) : String(fmt(1)).startsWith('USD') ? 'USD ' + (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v) : short(v)), maxTicksLimit: 5 } } }, plugins: { tooltip: tip(v => fmt(v)) } } });
  }
  function donut(id, labels, values, colors, fmt = v => npr(v)) {
    chart(id, { type: 'doughnut', data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { tooltip: tip((v, c) => fmt(v) + ' · ' + pct(v, values.reduce((a, b) => a + b, 0))) } } });
  }
  function line(id, labels, values, { fmt = v => npr(v) } = {}) {
    chart(id, { type: 'line', data: { labels, datasets: [{ data: values, borderColor: COL.red, backgroundColor: 'rgba(200,16,46,.08)', fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false }, ticks: { color: COL.ink, font: { weight: 600 } } }, y: { grid: { color: '#EEF1F6' }, ticks: { callback: v => short(v), maxTicksLimit: 5 } } }, plugins: { tooltip: tip(v => fmt(v)) } } });
  }
  const legend = (items) => `<div class="legend">${items.map(([l, v, c, tot]) => `<div><i style="background:${c}"></i><b>${l}</b><span>${pct(v, tot)}</span></div>`).join('')}</div>`;

  /* ---------- small components ---------- */
  const kpi = (i, ne, en, sub, val, s2, cls = '', delta) => `<div class="kpi ${cls}">${ic(i, 'ico')}<div class="l"><b>${T(ne, en)}</b><span>${sub}</span></div><div class="v" data-cnt>${val}</div><div class="s">${s2}</div>${delta ? `<div class="d ${delta[0]}">${delta[1]}</div>` : ''}</div>`;
  const sec = (i, ne, en, sub, right = '') => `<div class="sh"><span class="ico">${ic(i)}</span><div><h2>${T(ne, en)}</h2><p>${sub || T(en, ne)}</p></div><div class="r">${right}</div></div>`;
  const src = s => `<span class="src">${s}</span>`;
  const bars = rows => `<div class="mini">${rows.map(([b, s, w, v, c]) => `<div><b>${b}</b><span>${s}</span><i style="width:${Math.max(w, 1).toFixed(1)}%${c ? ';background:' + c : ''}"></i><em>${v}</em></div>`).join('')}</div>`;
  function countUp() {
    if (STATIC) return;
    document.querySelectorAll('[data-cnt]').forEach(el => {
      const txt = el.textContent; const m = txt.match(/[\d०-९][\d०-९,.]*/); if (!m) return;
      const raw = m[0].replace(/[०-९]/g, d => DEV.indexOf(d)).replace(/,/g, ''); const target = parseFloat(raw); if (!isFinite(target) || target < 10) return;
      const dec = (raw.split('.')[1] || '').length; const t0 = performance.now(), dur = 900;
      const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = txt.replace(m[0], num(target * e, dec)); if (k < 1) requestAnimationFrame(step); else fitNumbers(); };
      requestAnimationFrame(step);
    });
  }
  const typeTag = t => ({ ins: `<span class="tag ins">${T('संस्थागत', 'Institutional')}</span>`, ind: `<span class="tag ind">${T('व्यक्तिगत', 'Individual')}</span>`, gov: `<span class="tag gov">${T('सरकार / दूतावास', 'Government / Embassy')}</span>`, corp: `<span class="tag corp">${T('कम्पनी', 'Corporation')}</span>` })[t] || t;
  const modeTxt = m => m === 'chq' ? T('चेक', 'Cheque') : T('बैंक ट्रान्सफर', 'Bank transfer');

  /* ---------- data table with search / filter / sort / page / export ---------- */
  function table(mount, rows, cols, { pageSize = 25, filters = [], csvName = 'data.csv', defaultSort, chips = [], initialQ = '', initialF = {}, onChange } = {}) {
    const st = { q: initialQ, page: 1, sort: defaultSort || null, f: Object.assign({}, initialF), chip: '' };
    const el = document.getElementById(mount); if (!el) return;
    function base() { let r = rows; const ch = chips.find(c => c.key === st.chip); if (ch) r = r.filter(ch.test); return r; }
    function filtered() {
      let r = base().filter(x => !st.q || cols.some(c => String(c.search ? c.search(x) : c.get(x)).toLowerCase().includes(st.q.toLowerCase())));
      filters.forEach(f => { if (st.f[f.key]) r = r.filter(x => f.test(x, st.f[f.key])); });
      if (st.sort) { const c = cols.find(c => c.key === st.sort[0]); r = r.slice().sort((a, b) => { const va = c.sortVal ? c.sortVal(a) : c.get(a), vb = c.sortVal ? c.sortVal(b) : c.get(b); return (va > vb ? 1 : va < vb ? -1 : 0) * (st.sort[1] === 'asc' ? 1 : -1); }); }
      return r;
    }
    function draw() {
      const r = filtered(); const pages = Math.max(1, Math.ceil(r.length / pageSize)); st.page = Math.min(st.page, pages);
      const slice = r.slice((st.page - 1) * pageSize, st.page * pageSize);
      const tc = cols.find(c => c.total); const sumNpr = tc ? r.reduce((s, x) => s + (tc.total(x) || 0), 0) : null;
      const active = st.q || st.chip || Object.values(st.f).some(Boolean);
      el.innerHTML = `${chips.length ? `<div class="chips" role="tablist">${[{ key: '', label: T('सबै', 'All'), test: () => true }].concat(chips).map(c => `<button class="qchip ${st.chip === c.key ? 'on' : ''}" data-chip="${c.key}" role="tab">${c.label}<em>${num(rows.filter(c.test).length)}</em></button>`).join('')}</div>` : ''}
<div class="filters">${ic('search')}<input type="search" placeholder="${T('खोज्नुहोस् — नाम, संस्था, मिति…', 'Search — name, organisation, date…')}" value="${st.q.replace(/"/g, '&quot;')}" aria-label="search">${filters.map(f => `<select data-f="${f.key}" aria-label="${f.label}"><option value="">${f.label}: ${T('सबै', 'all')}</option>${f.options.map(([v, l]) => `<option value="${v}" ${st.f[f.key] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`).join('')}${active ? `<button class="btn ghost sm" data-clear>${ic('x')} ${T('सबै हटाउनुहोस्', 'Clear')}</button>` : ''}<button class="btn ghost sm" data-csv>${ic('download')} CSV</button></div>
<div class="tscroll"><table class="tbl"><thead><tr>${cols.map(c => `<th class="${c.cls || ''} ${c.sortable !== false ? 's' : ''} ${st.sort && st.sort[0] === c.key ? st.sort[1] : ''}" data-k="${c.key}">${c.label}</th>`).join('')}</tr></thead><tbody>${slice.length ? slice.map(x => `<tr>${cols.map(c => `<td class="${c.cls || ''}">${c.render ? c.render(x) : c.get(x)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}"><div class="empty">${T('कुनै प्रविष्टि फेला परेन — खोज वा फिल्टर परिवर्तन गर्नुहोस्', 'No entries found — change the search or filters')}</div></td></tr>`}</tbody></table></div>
<div class="tfoot"><span>${T(`${num(r.length)} / ${num(rows.length)} प्रविष्टि · पृष्ठ ${num(st.page)} / ${num(pages)}`, `${num(r.length)} of ${num(rows.length)} entries · page ${num(st.page)} of ${num(pages)}`)}${sumNpr !== null ? ` · <b>${npr(sumNpr)}</b>` : ''}</span><div class="pager"><button data-p="${st.page - 1}" ${st.page <= 1 ? 'disabled' : ''}>‹</button>${pageBtns(st.page, pages)}<button data-p="${st.page + 1}" ${st.page >= pages ? 'disabled' : ''}>›</button></div></div>`;
      const inp = el.querySelector('input'); inp.oninput = e => { st.q = e.target.value; st.page = 1; const pos = inp.selectionStart; draw(); const n = el.querySelector('input'); n.focus(); n.setSelectionRange(pos, pos); };
      el.querySelectorAll('select').forEach(s => s.onchange = () => { st.f[s.dataset.f] = s.value; st.page = 1; draw(); });
      el.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => { st.chip = b.dataset.chip; st.page = 1; draw(); });
      el.querySelectorAll('th.s').forEach(th => th.onclick = () => { const k = th.dataset.k; st.sort = st.sort && st.sort[0] === k && st.sort[1] === 'desc' ? [k, 'asc'] : [k, 'desc']; draw(); });
      el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { st.page = +b.dataset.p; draw(); });
      const cl = el.querySelector('[data-clear]'); if (cl) cl.onclick = () => { st.q = ''; st.f = {}; st.chip = ''; st.page = 1; draw(); };
      el.querySelector('[data-csv]').onclick = () => { const lines = [cols.map(c => '"' + c.label.replace(/<[^>]+>/g, '') + '"').join(',')].concat(filtered().map(x => cols.map(c => '"' + String(c.csv ? c.csv(x) : c.get(x)).replace(/"/g, '""') + '"').join(','))); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv' })); a.download = csvName; a.click(); };
      if (onChange) onChange(r);
    }
    function pageBtns(p, n) { const s = new Set([1, n, p - 1, p, p + 1].filter(x => x >= 1 && x <= n)); return [...s].sort((a, b) => a - b).map((x, i, arr) => (i && x - arr[i - 1] > 1 ? '<span>…</span>' : '') + `<button data-p="${x}" class="${x === p ? 'on' : ''}">${num(x)}</button>`).join(''); }
    draw();
    return { set(o) { Object.assign(st, o); st.page = 1; draw(); } };
  }
  const qp = k => { const m = location.search.match(new RegExp('[?&]' + k + '=([^&]*)')); return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : ''; };
  const sectorName = s => { const x = D.sectors.find(z => z[0] === s); return x ? T(x[1], x[2]) : s; };

  /* ---------- global search ---------- */
  function globalSearch(q) {
    q = q.trim().toLowerCase(); if (q.length < 2) return [];
    const out = [];
    C.filter(c => c.name.toLowerCase().includes(q)).slice(0, 6).forEach(c => out.push({ g: T('प्राप्त सहयोग', 'Contributions'), t: c.name, s: when(c.bs, c.ad) + ' · ' + (c.npr ? npr(c.npr) : usd(c.usd)), h: 'contributions.html?q=' + encodeURIComponent(c.name) + '#handover' }));
    D.foreign.filter(f => (f.name + f.country_en + f.country_ne).toLowerCase().includes(q)).forEach(f => out.push({ g: T('वैदेशिक सहयोग', 'Foreign assistance'), t: f.name, s: usd(f.usd), h: 'foreign.html?q=' + encodeURIComponent(f.name) }));
    D.initiatives[1].measures.filter(m => (m.title_ne + m.title_en + m.agency_ne + m.who_ne).toLowerCase().includes(q)).slice(0, 5).forEach(m => out.push({ g: T('सरकारका पहल', 'Government initiatives'), t: num(m.no) + '. ' + T(m.title_ne, m.title_en), s: m.agency_ne, h: 'initiatives.html?m=' + m.no }));
    D.sectors.filter(s => (s[1] + s[2]).toLowerCase().includes(q)).forEach(s => out.push({ g: T('क्षेत्र', 'Sector'), t: T(s[1], s[2]), s: num(C.filter(c => c.sector === s[0]).length) + ' ' + T('प्रविष्टि', 'entries'), h: 'contributions.html?sector=' + s[0] + '#handover' }));
    D.contacts.filter(c => (c.name_en + c.name_ne + c.title_en + c.title_ne).toLowerCase().includes(q)).forEach(c => out.push({ g: T('सम्पर्क', 'Contact'), t: T(c.name_ne, c.name_en), s: c.phone, h: 'contact.html' }));
    D.updates.filter(u => (u[2] + u[3]).toLowerCase().includes(q)).slice(0, 3).forEach(u => out.push({ g: T('अद्यावधिक', 'Updates'), t: T(u[2], u[3]), s: when(u[1], u[0]), h: u[4] }));
    NAV.filter(n => (n[1] + n[2]).toLowerCase().includes(q)).forEach(n => out.push({ g: T('खण्ड', 'Section'), t: T(n[1], n[2]), s: '', h: n[0] }));
    return out.slice(0, 12);
  }

  function fsCharts() {
    const FS = D.fund_status; if (!FS) return;
    const lbl = FS.dates_bs.map((b, i) => T(b, adFmt(FS.dates_ad[i]).slice(0, 6)));
    vbar('c-fs-daily', lbl, FS.npr.daily_series, { color: COL.navy, fmt: v => npr(v) });
    chart('c-fs-cum', { type: 'line', data: { labels: lbl, datasets: [{ label: T('रु. (अर्ब)', 'NPR (billion)'), data: FS.npr.gross_series.map(v => v / 1e9), borderColor: COL.navy, backgroundColor: 'rgba(0,56,147,.08)', fill: true, tension: .3, pointRadius: 3, yAxisID: 'y' }, { label: T('USD (करोड)', 'USD (million)'), data: FS.usd.gross_series.map(v => v / 1e6), borderColor: COL.red, tension: .3, pointRadius: 3, yAxisID: 'y2' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' }, tooltip: { callbacks: { label: c => ' ' + c.dataset.label + ': ' + (c.datasetIndex ? usd(Math.round(c.raw * 1e6)) : npr(Math.round(c.raw * 1e9))) } } }, scales: { x: { grid: { display: false }, ticks: { color: COL.ink, font: { weight: 600 } } }, y: { grid: { color: '#EEF1F6' }, ticks: { callback: v => T(dig(v) + ' अर्ब', v + ' bn') } }, y2: { position: 'right', grid: { display: false }, ticks: { callback: v => T(dig(v) + ' M', v + ' M') } } } } });
  }
  /* ---------- pages ---------- */
  const PAGES = {};

  PAGES.index = () => {
    const R = D.rescue.ndrrma, PL = D.rescue.nepal_police;
    document.getElementById('main').innerHTML = `<div class="wrap stack">
<section class="hero"><div>
  <div class="asof">${ic('clock')} ${T('अद्यावधिक: ' + D.meta.updated_bs, 'Updated: ' + D.meta.updated_en)} ${src(T('सबै स्रोत', 'all sources'))}</div>
  <h1>${T('रसुवा–भोटेकोशी बाढी: प्राप्त सहयोग, उद्धार र सरकारका पहलको एकीकृत अद्यावधिक', 'Rasuwa–Bhotekoshi flood: consolidated update on contributions received, rescue and government initiatives')}</h1>
  <p>${T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोष / प्रधानमन्त्री राहत कोषमा जम्मा भएको हरेक रकम — च्यानल, स्रोत र मिति अनुसार, प्रमाणित।', 'Every rupee deposited in the Prime Minister Disaster Relief Fund — by channel, source and date, verified.')}</p>
  <div class="total"><span>${T('कुल प्राप्त सहयोग (नेपाली रुपैयाँमा, वैदेशिक सहयोग समेत)', 'Total contributions received (NPR, including foreign assistance at exchange rate)')}</span><b data-cnt>${npr(TOT.grand)}</b>
  <div class="chips"><span class="chip n">NCHL ${short(TOT.nchl)}</span><span class="chip n">Fonepay ${short(TOT.fone)}</span><span class="chip r">${T('मा. अर्थमन्त्री समक्ष', 'Handover')} ${short(TOT.inpNpr)}</span><span class="chip">${T('वैदेशिक', 'Foreign')} ${usd(TOT.foreignAllUsd)} ≈ ${short(TOT.foreignAllUsd * D.meta.fx_usd_npr)}</span></div></div>
</div>
<div class="donutbox"><div class="cv"><canvas id="c-src"></canvas><div class="c"><b>${short(TOT.grand)}</b><span>${T('कुल · ४ स्रोत', 'total · 4 sources')}</span></div></div>${legend([['NCHL', TOT.nchl, COL.navy, TOT.grand], ['Fonepay', TOT.fone, COL.navy2, TOT.grand], [T('हस्तान्तरण / चेक', 'Handover / cheque'), TOT.inpNpr, COL.red, TOT.grand], [T('वैदेशिक (USD)', 'Foreign (USD)'), TOT.foreignAllUsd * D.meta.fx_usd_npr, COL.gold, TOT.grand]])}</div></section>

<section class="grid g4">
${kpi('bank', 'अनलाइन — NCHL', 'Online — NCHL', 'donate.gov.np · ' + T('कार्ड, IPS, QR, रेमिट्यान्स', 'card, IPS, QR, remittance'), npr(TOT.nchl), T(num(D.nchl.count) + ' कारोबार · ' + D.nchl.as_of_bs, num(D.nchl.count) + ' transactions · ' + D.nchl.as_of_en))}
${kpi('qr', 'अनलाइन — Fonepay', 'Online — Fonepay', 'donate.gov.np · QR, bills, NPCI, Alipay', npr(TOT.fone), T(num(D.fonepay.count) + ' कारोबार · ' + D.fonepay.as_of_bs, num(D.fonepay.count) + ' transactions · ' + D.fonepay.as_of_en))}
${kpi('hand', 'मा. अर्थमन्त्री समक्ष हस्तान्तरण', 'Handed over to Hon. Finance Minister', T('संस्था तथा व्यक्तिबाट चेक / बैंक ट्रान्सफर', 'Cheque / bank transfer from institutions & individuals'), npr(TOT.inpNpr), T(num(C.length) + ' प्रविष्टि · भदौ १९ सम्म · रु. मा मात्र', num(C.length) + ' entries · till Bhadra 19 · NPR only'), 'red')}
${kpi('globe', 'वैदेशिक सहयोग', 'Foreign assistance', T('सरकार, दूतावास, कम्पनी, दातृ निकाय', 'Governments, embassies, corporations, donors'), usd(TOT.foreignAllUsd), T('कोषका USD खातामा जम्मा · पहिचान: NVIDIA USD 10M, चीन दूतावास USD 200K', 'Deposited in the Fund\'s USD accounts · identified: NVIDIA USD 10M, Embassy of China USD 200K'), 'navy')}
</section>

<section class="card fund">${sec('bank', 'प्रधानमन्त्री दैवी प्रकोप उद्धार कोष — खाता स्थिति', 'Prime Minister Disaster Relief Fund — account status', T(FS.source_ne + ' · ' + FS.as_of_bs, FS.source_en + ' · ' + FS.as_of_en), src(T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोष · नेपाल राष्ट्र बैंक', 'Prime Minister Disaster Relief Fund · Nepal Rastra Bank')))}
 <div class="grid g4">
 ${kpi('bank', 'कुल उपलब्ध कोष मौज्दात', 'Total available fund balance', T('रु. खाता + USD खाता (दर ' + dig(FS.fx) + ')', 'NPR accounts + USD accounts at ' + FS.fx), npr(FS.total_available_npr), T('बाढीअघिको मौज्दात रु. ' + short(FS.npr.before) + ' + USD ' + num(FS.usd.before) + ' समेत', 'includes pre-flood balance of NPR ' + short(FS.npr.before) + ' + USD ' + num(FS.usd.before)), 'navy')}
 ${kpi('coins', 'बाढीपछि जम्मा — रु. खाता', 'Collected after the flood — NPR accounts', T('९ बैंक · भदौ ११–२२', '9 banks · Bhadra 11–22'), npr(FS.npr.gross), T('हालको मौज्दात ' + npr(FS.npr.balance) + ' (रु. १ अर्ब NDRRMA लाई हस्तान्तरण पछि)', 'current balance ' + npr(FS.npr.balance) + ' (after NPR 1 billion transferred to NDRRMA)'), 'red')}
 ${kpi('globe', 'बाढीपछि जम्मा — USD खाता', 'Collected after the flood — USD accounts', T('हिमालयन बैंक · लक्ष्मी सनराइज बैंक', 'Himalayan Bank · Laxmi Sunrise Bank'), usd(FS.usd.gross), '≈ ' + npr(FS.usd.gross * FS.fx) + ' · ' + T('मौज्दात USD ' + num(FS.usd.balance), 'balance USD ' + num(FS.usd.balance)))}
 ${kpi('truck', 'कोषबाट खर्च / हस्तान्तरण', 'Disbursed from the Fund', T('२०८३/०५/१६', '2083/05/16'), npr(FS.npr.usage), T(FS.npr.usage_note_ne, FS.npr.usage_note_en))}
 </div>
 <div class="grid g2" style="margin-top:16px"><div><p class="ct">${T('कोष खातामा दैनिक जम्मा — रु.', 'Daily deposits into the Fund — NPR')}</p><div class="chart h240"><canvas id="c-fs-daily"></canvas></div></div><div><p class="ct">${T('बाढीपछिको सञ्चित जम्मा — रु. र USD', 'Cumulative collection since the flood — NPR and USD')}</p><div class="chart h240"><canvas id="c-fs-cum"></canvas></div></div></div>
</section>
<section class="card srcs">${sec('clock', 'तथ्याङ्क स्रोत तथा अद्यावधिक समय', 'Data sources & cut-off times', T('प्रत्येक स्रोतको आफ्नै अद्यावधिक समय छ; एकीकृत योग कोष शाखाबाट हिसाब मिलान हुन बाँकी', 'Each source has its own cut-off; the consolidated total is subject to reconciliation by the Fund Section'))}
 <div class="tscroll"><table class="tbl small"><thead><tr><th>${T('स्रोत', 'Source')}</th><th>${T('के', 'What')}</th><th>${T('अद्यावधिक', 'As of')}</th><th class="amt">${T('रकम', 'Amount')}</th><th>${T('आवृत्ति', 'Refresh')}</th></tr></thead><tbody>
 <tr><td class="nm">NCHL</td><td>${T('donate.gov.np — IPS, कार्ड, QR, रेमिट्यान्स', 'donate.gov.np — IPS, card, QR, remittance')}</td><td>${T(D.nchl.as_of_bs, D.nchl.as_of_en)}</td><td class="amt">${npr(TOT.nchl, 2)}</td><td>${T('दैनिक', 'daily')}</td></tr>
 <tr><td class="nm">Fonepay</td><td>${T('donate.gov.np — QR, बिल, NPCI, Alipay, IBFT', 'donate.gov.np — QR, bills, NPCI, Alipay, IBFT')}</td><td>${T(D.fonepay.as_of_bs, D.fonepay.as_of_en)}</td><td class="amt">${npr(TOT.fone)}</td><td>${T('दैनिक', 'daily')}</td></tr>
 <tr><td class="nm">${T('अर्थमन्त्रीको सचिवालय / कोष शाखा', "Finance Minister's Secretariat / Fund Section")}</td><td>${T('हस्तान्तरण तथा चेक — नामसहित', 'Handovers & cheques — by name')}</td><td>${T('२०८३ भदौ १९', '4 Sep 2026')}</td><td class="amt">${npr(TOT.inpNpr, 2)}</td><td>${T('दैनिक', 'daily')}</td></tr>
 <tr><td class="nm">${T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोष · नेपाल राष्ट्र बैंक', 'Prime Minister Disaster Relief Fund · Nepal Rastra Bank')}</td><td>${T('कोष खाता स्थिति — बैंक-अनुसार जम्मा (रु. र USD)', 'Fund account status — bank-wise deposits (NPR & USD)')}</td><td>${T(FS.as_of_bs, FS.as_of_en)}</td><td class="amt">${npr(FS.npr.gross)} · ${usd(FS.usd.gross)}</td><td>${T('दैनिक', 'daily')}</td></tr>
 <tr><td class="nm">${T('अन्तर्राष्ट्रिय आर्थिक सहायता समन्वय महाशाखा', 'International Economic Cooperation Coordination Division')}</td><td>${T('वैदेशिक सहयोग — नामसहित पहिचान', 'Foreign assistance — identified contributors')}</td><td>${T('२०८३ भदौ १६', '1 Sep 2026')}</td><td class="amt">${usd(TOT.foreignUsd)} ≈ ${npr(TOT.foreignUsd * D.meta.fx_usd_npr)}</td><td>${T('घटना अनुसार', 'per event')}</td></tr>
 <tr><td class="nm">NDRRMA · ${T('नेपाल प्रहरी', 'Nepal Police')}</td><td>${T('खोज, उद्धार तथा राहत', 'Search, rescue & relief')}</td><td>${T(D.rescue.ndrrma.as_of_bs + ' १८:०० / २०:०० बजे', '6 Sep 2026, 6:00 / 8:00 PM')}</td><td class="amt">—</td><td>${T('दैनिक', 'daily')}</td></tr>
 </tbody></table></div>
 <div class="note">${T('विनिमय दर रु. ' + dig(D.meta.fx_usd_npr) + ' प्रति USD — ' + D.meta.fx_source_ne + ' · कुल प्राप्त सहयोगमा NCHL र Fonepay च्यानल, मा. अर्थमन्त्री समक्ष हस्तान्तरण (रु.) तथा कोषका USD खातामा जम्मा रकम (विनिमय दरमा) समावेश छन् · च्यानल योग (' + npr(TOT.digital) + ') र कोष खातामा जम्मा (' + npr(FS.npr.gross) + ') बीचको फरक भुक्तानी फछ्र्योट (सेटलमेन्ट) समय र चेक क्लियरिङका कारण हो; कोष शाखाबाट हिसाब मिलान हुन्छ।', 'Exchange rate NPR ' + D.meta.fx_usd_npr + ' per USD — ' + D.meta.fx_source_en + ' · Total contributions received comprises the NCHL and Fonepay channels, handovers to the Hon. Finance Minister (NPR) and amounts deposited in the Fund\'s USD accounts (at the exchange rate) · The gap between the channel sum (' + npr(TOT.digital) + ') and deposits in the Fund accounts (' + npr(FS.npr.gross) + ') reflects settlement timing and cheque clearing; reconciled by the Fund Section.')}</div></section>
<section class="grid g2">
 <div class="card">${sec('bank', 'NCHL च्यानल अनुसार', 'By NCHL channel', T('IPS, कार्ड, QR, रेमिट्यान्स · ' + D.nchl.as_of_bs, 'IPS, card, QR, remittance · ' + D.nchl.as_of_en), src('NCHL'))}<div class="chart h280"><canvas id="c-nchl"></canvas></div></div>
 <div class="card">${sec('qr', 'Fonepay च्यानल अनुसार', 'By Fonepay channel', T('QR, बिल, NPCI, Alipay, IBFT · ' + D.fonepay.as_of_bs, 'QR, bills, NPCI, Alipay, IBFT · ' + D.fonepay.as_of_en), src('Fonepay'))}<div class="chart h280"><canvas id="c-fone"></canvas></div></div>
</section>

<section class="grid g64">
 <div class="card">${sec('chart', 'हस्तान्तरण तथा चेकबाट दैनिक प्राप्त रकम', 'Daily receipts — handovers & cheques', T('मिति (वि.सं.) अनुसार मा. अर्थमन्त्री समक्ष प्राप्त रकम', 'Amount received via the Hon. Finance Minister by date (BS)'), src(T('अर्थमन्त्रीको सचिवालय', "Finance Minister's Secretariat")))}<div class="chart h240"><canvas id="c-daily"></canvas></div></div>
 <div class="card">${sec('chart', 'सहयोग कसरी आउँछ', 'How contributions reach the fund')}
  <div class="flow"><div>${ic('qr', 'ico')}<b>donate.gov.np</b><span>${T('नेपाल र विदेशबाट कार्ड, QR, IPS, रेमिट्यान्स', 'Card, QR, IPS, remittance from Nepal & abroad')}</span><i>NCHL · Fonepay</i></div><div>${ic('hand', 'ico')}<b>${T('हस्तान्तरण', 'Handover')}</b><span>${T('मा. अर्थमन्त्री समक्ष चेक / ट्रान्सफर', 'Cheque / transfer to Hon. Finance Minister')}</span><i>${T('नामसहित प्रमाणित', 'Verified, listed by name')}</i></div><div>${ic('globe', 'ico')}<b>${T('वैदेशिक', 'Foreign')}</b><span>${T('सरकार, दूतावास, कम्पनी', 'Governments, embassies, corporations')}</span><i>Cash · in-kind · pledge</i></div><div>${ic('bank', 'ico')}<b>${T('प्र.म. दैवी प्रकोप उद्धार कोष', 'PM Disaster Relief Fund')}</b><span>${T('प्रधानमन्त्री तथा मन्त्रिपरिषद्को कार्यालय', 'Office of the Prime Minister and Council of Ministers')}</span><i>${T('एकल कोष खाता', 'Single fund account')}</i></div></div></div>
</section>

<section class="card">${sec('ring', 'उद्धार तथा राहत — एक नजरमा', 'Search, rescue & relief at a glance', T('NDRRMA · ' + R.as_of_bs + ' · नेपाल प्रहरी · ' + PL.as_of_bs, 'NDRRMA · 6 Sep 6:00 PM · Nepal Police · 6 Sep 8:00 PM'), `<a class="btn ghost sm" href="rescue.html">${T('पूर्ण विवरण', 'Full section')} ${ic('arrow')}</a>`)}
 <div class="grid g6">
 ${kpi('people', 'उद्धार गरिएका', 'Rescued', '', num(R.rescued_till_date), T('हेलिकप्टर उडान ' + num(R.helicopter_flights.nepali_army_total + R.helicopter_flights.private_from_kathmandu), num(R.helicopter_flights.nepali_army_total + R.helicopter_flights.private_from_kathmandu) + ' helicopter flights'), 'red')}
 ${kpi('umbrella', 'मानवीय क्षति', 'Casualties', '', num(R.human_casualties), T('शव हस्तान्तरण ' + num(R.dead_body_handover), 'bodies handed over ' + num(R.dead_body_handover)))}
 ${kpi('search', 'बेपत्ता (लगभग)', 'Missing (approx.)', '', num(R.missing_total_approx), T('विदेशी नागरिक ' + num(R.missing_breakdown['Foreign nationals']), 'foreign nationals ' + num(R.missing_breakdown['Foreign nationals'])))}
 ${kpi('shield', 'उपचाररत घाइते', 'Injured under treatment', '', num(R.injured_receiving_treatment), T('सेना, APF, अस्पताल', 'Army, APF, hospitals'))}
 ${kpi('home', 'होल्डिङ सेन्टरमा', 'At holding centres', '', num(R.holding_center_people), T('रसुवा · नुवाकोट · धादिङ', 'Rasuwa · Nuwakot · Dhading'))}
 ${kpi('ring', 'सुरक्षाकर्मी परिचालन', 'Security personnel mobilised', '', num(R.security_personnel_mobilised), T('प्रहरी · सेना · APF', 'Police · Army · APF'))}
 </div>
 <div class="grid g2" style="margin-top:16px"><div><p style="font-size:12.5px;font-weight:700;margin-bottom:6px">${T('जिल्ला अनुसार प्राप्त शव', 'Bodies recovered by district')}</p><div class="chart h240"><canvas id="c-dist"></canvas></div></div><div><p style="font-size:12.5px;font-weight:700;margin-bottom:6px">${T('बेपत्ताको स्रोत अनुसार विवरण', 'Missing persons by reporting source')}</p><div class="chart h240"><canvas id="c-miss"></canvas></div></div></div>
</section>

<section class="grid g2">
 <div class="card">${sec('globe', 'वैदेशिक सहयोग', 'Foreign assistance', '', `<a class="btn ghost sm" href="foreign.html">${T('पूर्ण विवरण', 'Full section')} ${ic('arrow')}</a>`)}
  ${D.foreign.map(f => `<div style="display:flex;gap:12px;align-items:center;border:1px solid var(--bd);border-left:5px solid ${f.featured ? 'var(--red)' : 'var(--navy)'};border-radius:8px;padding:10px 14px;margin-bottom:8px"><div style="flex:1"><b style="font-size:15px">${f.name}</b><div style="font-size:11.5px;color:var(--mute)">${T(f.country_ne, f.country_en)} · ${typeTag(f.type)} · ${when(f.bs, f.ad)}</div></div><div style="text-align:right"><b style="font-size:19px;color:var(--red)">${usd(f.usd)}</b><div style="font-size:11px;color:var(--mute)">≈ ${npr(f.npr)}</div></div></div>`).join('')}
  <div class="note">${T('कुल वैदेशिक सहयोग ' + usd(TOT.foreignUsd) + ' · विनिमय दर रु. ' + num(D.meta.fx_usd_npr) + ' प्रति USD (प्रकाशित सामग्री अनुसार)', 'Total foreign assistance ' + usd(TOT.foreignUsd) + ' · exchange rate NPR ' + num(D.meta.fx_usd_npr) + ' per USD as published')}</div></div>
 <div class="card">${sec('gavel', 'सरकारका पहल', 'Government initiatives', '', `<a class="btn ghost sm" href="initiatives.html">${T('पूर्ण विवरण', 'Full section')} ${ic('arrow')}</a>`)}
  <div class="chart h240"><canvas id="c-init"></canvas></div>
  <div class="note">${T('मन्त्रिपरिषद् निर्णय २०८३।०५।१८ — Business Recovery Plan पहिलो चरण: ५ वर्गमा १८ राहत व्यवस्था (भन्सार ३ · आ.रा.वि. ६ · ने.रा.बैंक ५ · बीमा ३ · साझा १)', 'Cabinet decision of 3 Sep 2026 — Business Recovery Plan Phase 1: 18 relief measures in 5 categories (Customs 3 · IRD 6 · NRB 5 · Insurance 3 · Joint 1)')}</div></div>
</section>

<section class="grid g64">
 <div class="card">${sec('hand', 'पछिल्ला हस्तान्तरित सहयोग', 'Latest handovers', T('मा. अर्थमन्त्री समक्ष प्राप्त, प्रमाणित सूची', 'Verified list of contributions received via the Hon. Finance Minister'), `<a class="btn ghost sm" href="contributions.html">${T('सबै ' + num(TOT.inpN), 'All ' + num(TOT.inpN))} ${ic('arrow')}</a>`)}
  <div class="tscroll"><table class="tbl"><thead><tr><th>${T('मिति', 'Date')}</th><th>${T('सहयोग गर्ने निकाय / व्यक्ति', 'Contributor')}</th><th>${T('प्रकार', 'Type')}</th><th class="amt">${T('रकम', 'Amount')}</th></tr></thead><tbody>${C.slice().sort((a, b) => b.sn - a.sn).slice(0, 8).map(c => `<tr><td>${when(c.bs, c.ad)}</td><td class="nm">${c.name}</td><td>${typeTag(c.type)}</td><td class="amt">${c.npr ? npr(c.npr) : usd(c.usd)}</td></tr>`).join('')}</tbody></table></div></div>
 <div class="card">${sec('clock', 'पछिल्ला अद्यावधिक', 'Latest updates')}<ul class="upd">${D.updates.map(u => `<li><span>${when(u[1], u[0])}</span><a href="${u[4]}">${T(u[2], u[3])}</a></li>`).join('')}</ul></div>
</section>

<section class="cta">
 <a href="https://donate.gov.np/" target="_blank" rel="noopener">${ic('qr', 'ico')}<div><b>${T('सहयोग गर्नुहोस्', 'Donate now')} · donate.gov.np</b><span>${T('कार्ड, QR, IPS, रेमिट्यान्स — नेपाल र विदेशबाट', 'Card, QR, IPS, remittance — from Nepal and abroad')}</span></div></a>
 <a href="https://rescue.opmcm.gov.np/" target="_blank" rel="noopener">${ic('ring', 'ico')}<div><b>${T('उद्धार अनुरोध', 'Request rescue')} · rescue.opmcm.gov.np</b><span>${T('प्रधानमन्त्री तथा मन्त्रिपरिषद्को कार्यालय', 'Office of the Prime Minister and Council of Ministers')}</span></div></a>
 <a href="https://ndrrma.gov.np/np/rasuwa" target="_blank" rel="noopener">${ic('people', 'ico')}<div><b>${T('उद्धार गरिएका व्यक्ति', 'Rescued persons list')} · ndrrma.gov.np</b><span>${T('रसुवा बाढीबाट उद्धार गरिएका व्यक्तिहरूको विवरण', 'Official list of persons rescued from the Rasuwa flood')}</span></div></a>
</section></div>`;
    donut('c-src', ['NCHL', 'Fonepay', T('हस्तान्तरण', 'Handover'), T('वैदेशिक', 'Foreign')], [TOT.nchl, TOT.fone, TOT.inpNpr, TOT.foreignAllUsd * D.meta.fx_usd_npr], [COL.navy, COL.navy2, COL.red, COL.gold]);
    hbar('c-nchl', D.nchl.channels.map(c => T(c[0], c[1])), D.nchl.channels.map(c => c[3]), { extra: i => num(D.nchl.channels[i][2]) + ' txn' });
    hbar('c-fone', D.fonepay.channels.map(c => T(c[0], c[1])), D.fonepay.channels.map(c => c[3]), { color: COL.navy2, extra: i => num(D.fonepay.channels[i][2]) + ' txn' });
    vbar('c-daily', DAYS.map(d => T(d, adFmt(C.find(c => c.bs === d).ad).slice(0, 6))), DAYS.map(d => byDay[d].npr), { color: COL.red, fmt: v => npr(v) });
    const dist = Object.entries(R.bodies_by_district); const DN = { Rasuwa: 'रसुवा', Nuwakot: 'नुवाकोट', Dhading: 'धादिङ', Gorkha: 'गोरखा', Chitwan: 'चितवन', Tanahun: 'तनहुँ', 'Nawalparasi East': 'नवलपरासी पू.', 'Nawalparasi West': 'नवलपरासी प.' };
    vbar('c-dist', dist.map(([k]) => T(DN[k], k.replace('Nawalparasi', 'Nawalp.'))), dist.map(([, v]) => v), { color: COL.red, fmt: num });
    const mb = Object.entries(R.missing_breakdown); const MN = { 'DAO Rasuwa': 'जि.प्र.का. रसुवा', 'DAO Nuwakot': 'जि.प्र.का. नुवाकोट', 'Security personnel & govt officials': 'सुरक्षाकर्मी / कर्मचारी', 'Foreign nationals': 'विदेशी नागरिक' };
    hbar('c-miss', mb.map(([k]) => T(MN[k], k)), mb.map(([, v]) => v), { color: COL.navy3, fmt: num });
    fsCharts();
    const cats = D.initiatives[1].categories; hbar('c-init', cats.map(c => c.code + '. ' + T(c.name_ne, c.name_en)), cats.map(c => c.count), { color: COL.navy, fmt: v => num(v) + ' ' + T('राहत व्यवस्था', 'measures') });
  };

  PAGES.contributions = () => {
    document.getElementById('main').innerHTML = `<div class="wrap stack">
<div class="ph"><div><h1>${T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोषमा प्राप्त सहयोग', 'Contributions received by the Prime Minister Disaster Relief Fund')}</h1><p>${T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोष / प्रधानमन्त्री राहत कोषमा जम्मा भएको रकमको पूर्ण, वर्गीकृत र प्रमाणित विवरण — अनलाइन च्यानल (NCHL, Fonepay) र मा. अर्थमन्त्री समक्ष हस्तान्तरण।', 'Complete, categorised and verified record of every deposit — online channels (NCHL, Fonepay) and handovers to the Hon. Finance Minister.')}</p></div>
<div class="tabs"><a class="on" href="#all">${T('सबै', 'All')}</a><a href="#nchl">NCHL</a><a href="#fonepay">Fonepay</a><a href="#nrb">${T('बैंक-अनुसार (NRB)', 'Bank-wise (NRB)')}</a><a href="#handover">${T('हस्तान्तरण', 'Handover')}</a></div></div>
<section class="grid g4" id="all">
${kpi('coins', 'कुल प्राप्त सहयोग (रु.)', 'Total contributions received (NPR)', T('सबै च्यानल + वैदेशिक (विनिमय दरमा)', 'All channels + foreign at FX'), npr(TOT.grand), '≈ ' + short(TOT.grand), 'red')}
${kpi('card', 'अनलाइन — donate.gov.np', 'Online — donate.gov.np', 'NCHL + Fonepay', npr(TOT.digital), T(num(D.nchl.count + D.fonepay.count) + ' कारोबार', num(D.nchl.count + D.fonepay.count) + ' transactions'))}
${kpi('hand', 'हस्तान्तरण / चेक', 'Handover / cheque', T('मा. अर्थमन्त्री समक्ष · रु. मा', 'via Hon. Finance Minister · NPR'), npr(TOT.inpNpr), T(num(C.length) + ' प्रविष्टि · ' + num(new Set(C.map(c => c.name)).size) + ' दाता · USD चेक वैदेशिक सहयोगमा', num(C.length) + ' entries · ' + num(new Set(C.map(c => c.name)).size) + ' donors · USD cheques listed under foreign assistance'))}
${kpi('people', 'औसत अनलाइन योगदान', 'Average online contribution', T('प्रति कारोबार', 'per transaction'), npr(TOT.digital / (D.nchl.count + D.fonepay.count)), T('कुल ' + num(D.nchl.count + D.fonepay.count) + ' अनलाइन कारोबार', num(D.nchl.count + D.fonepay.count) + ' online transactions in total'))}
</section>
<section class="card">${sec('doc', 'सहयोगका वर्ग तथा गणना विधि', 'Contribution categories and how they are counted', T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोषमा प्राप्त सहयोगको आधिकारिक वर्गीकरण', 'Official classification of contributions received by the Prime Minister Disaster Relief Fund'))}
 <div class="grid g4 catg">${D.categories.map(c => `<div><em>${c.code}</em><b>${T(c.ne, c.en)}</b><p>${T(c.desc_ne, c.desc_en)}</p></div>`).join('')}</div></section>
<section class="grid g2">
 <div class="card" id="nchl">${sec('bank', 'NCHL च्यानल', 'NCHL channels', T(D.nchl.as_of_bs + ' · कुल ' + npr(TOT.nchl), D.nchl.as_of_en + ' · total ' + npr(TOT.nchl)), src('NCHL'))}<div class="chart h320"><canvas id="c-nchl"></canvas></div>
  <div class="tscroll" style="margin-top:12px"><table class="tbl"><thead><tr><th>${T('च्यानल', 'Channel')}</th><th class="amt">${T('कारोबार', 'Count')}</th><th class="amt">${T('रकम', 'Amount')}</th><th class="amt">%</th></tr></thead><tbody>${D.nchl.channels.map(c => `<tr><td class="nm">${T(c[0], c[1])}</td><td class="amt" style="color:var(--ink);font-weight:400">${num(c[2])}</td><td class="amt">${npr(c[3], 2)}</td><td class="amt" style="color:var(--mute)">${pct(c[3], TOT.nchl)}</td></tr>`).join('')}<tr><td class="nm"><b>${T('जम्मा', 'Total')}</b></td><td class="amt"><b>${num(D.nchl.count)}</b></td><td class="amt"><b>${npr(TOT.nchl, 2)}</b></td><td></td></tr></tbody></table></div></div>
 <div class="card" id="fonepay">${sec('qr', 'Fonepay च्यानल', 'Fonepay channels', T(D.fonepay.as_of_bs + ' · कुल ' + npr(TOT.fone), D.fonepay.as_of_en + ' · total ' + npr(TOT.fone)), src('Fonepay'))}<div class="chart h320"><canvas id="c-fone"></canvas></div>
  <div class="tscroll" style="margin-top:12px"><table class="tbl"><thead><tr><th>${T('च्यानल', 'Channel')}</th><th class="amt">${T('कारोबार', 'Count')}</th><th class="amt">${T('रकम', 'Amount')}</th><th class="amt">%</th></tr></thead><tbody>${D.fonepay.channels.map(c => `<tr><td class="nm">${T(c[0], c[1])}</td><td class="amt" style="color:var(--ink);font-weight:400">${num(c[2])}</td><td class="amt">${npr(c[3])}</td><td class="amt" style="color:var(--mute)">${pct(c[3], TOT.fone)}</td></tr>`).join('')}<tr><td class="nm"><b>${T('जम्मा', 'Total')}</b></td><td class="amt"><b>${num(D.fonepay.count)}</b></td><td class="amt"><b>${npr(TOT.fone)}</b></td><td></td></tr></tbody></table></div>
  <div class="note">${D.fonepay.daily.map(d => T(d[1] + ': ' + num(d[2]) + ' कारोबार · ' + npr(d[3]), adFmt(d[0]) + ': ' + num(d[2]) + ' transactions · ' + npr(d[3]))).join(' · ')}</div></div>
</section>
<section class="card" id="nrb">${sec('bank', 'प्रधानमन्त्री दैवी प्रकोप उद्धार कोष — खाता स्थिति, बैंक-अनुसार', 'Prime Minister Disaster Relief Fund — account status by bank', T(FS.as_of_bs + ' · रु. खाता ९ बैंक, USD खाता २ बैंक · यो च्यानल रकमकै खाता स्थिति हो, थप गरिँदैन', FS.as_of_en + ' · NPR accounts in 9 banks, USD accounts in 2 banks · account view of the channel amounts, not added on top'), src(T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोष · नेपाल राष्ट्र बैंक', 'Prime Minister Disaster Relief Fund · Nepal Rastra Bank')))}
 <div class="grid g4">
 ${kpi('bank', 'कुल उपलब्ध मौज्दात', 'Total available balance', T('रु. + USD (दर ' + dig(FS.fx) + ')', 'NPR + USD at ' + FS.fx), npr(FS.total_available_npr), '', 'navy')}
 ${kpi('coins', 'बाढीपछि जम्मा (रु.)', 'Collected after flood (NPR)', '', npr(FS.npr.gross), T('मौज्दात ' + npr(FS.npr.balance), 'balance ' + npr(FS.npr.balance)), 'red')}
 ${kpi('globe', 'बाढीपछि जम्मा (USD)', 'Collected after flood (USD)', '', usd(FS.usd.gross), '≈ ' + npr(FS.usd.gross * FS.fx))}
 ${kpi('truck', 'NDRRMA लाई हस्तान्तरण', 'Transferred to NDRRMA', T('२०८३/०५/१६', '2083/05/16'), npr(FS.npr.usage), '')}
 </div>
 <div class="grid g64" style="margin-top:16px"><div><p class="ct">${T('बैंक अनुसार हालको मौज्दात — रु.', 'Current balance by bank — NPR')}</p><div class="chart h320"><canvas id="c-nrb-npr"></canvas></div></div><div id="t-nrb"></div></div>
 <div class="grid g2" style="margin-top:16px"><div><p class="ct">${T('दैनिक जम्मा — रु.', 'Daily deposits — NPR')}</p><div class="chart h240"><canvas id="c-fs-daily"></canvas></div></div><div><p class="ct">${T('सञ्चित जम्मा — रु. र USD', 'Cumulative — NPR and USD')}</p><div class="chart h240"><canvas id="c-fs-cum"></canvas></div></div></div>
 <div class="note">${T(FS.npr.usage_note_ne + ' · बाढीअघिको मौज्दात रु. ' + num(FS.npr.before) + ' र USD ' + num(FS.usd.before) + ' कोषमा पहिल्यैदेखि रहेको रकम हो, प्राप्त सहयोगमा गणना गरिँदैन।', FS.npr.usage_note_en + ' · The pre-flood balance of NPR ' + num(FS.npr.before) + ' and USD ' + num(FS.usd.before) + ' was already in the Fund and is not counted as contributions.')}</div></section>
<section class="grid g64" id="handover">
 <div class="card">${sec('hand', 'मा. अर्थमन्त्री समक्ष हस्तान्तरित सहयोग', 'Contributions handed over to the Hon. Finance Minister', T('प्रमाणित सूची · भदौ ११–१९, २०८३', 'Verified list · Bhadra 11–19, 2083'), src(T('स्रोत: अर्थमन्त्रीको सचिवालय', "Source: Finance Minister's Secretariat")))}<div id="t-contrib"></div></div>
 <div class="card">${sec('chart', 'वर्गीकरण', 'Breakdown')}
  ${bars([[T('संस्थागत', 'Institutional'), num(C.filter(c => c.type === 'ins').length) + ' ' + T('प्रविष्टि', 'entries'), 100 * TOT.inpIns / TOT.inpNpr, npr(TOT.inpIns) + ' · ' + pct(TOT.inpIns, TOT.inpNpr)], [T('व्यक्तिगत', 'Individual'), num(C.filter(c => c.type === 'ind').length) + ' ' + T('प्रविष्टि', 'entries'), 100 * TOT.inpInd / TOT.inpNpr, npr(TOT.inpInd) + ' · ' + pct(TOT.inpInd, TOT.inpNpr), COL.red], [T('चेक', 'Cheque'), num(C.filter(c => c.mode === 'chq').length) + ' ' + T('प्रविष्टि', 'entries'), 100 * TOT.inpChq / TOT.inpNpr, npr(TOT.inpChq)], [T('बैंक ट्रान्सफर', 'Bank transfer'), num(C.filter(c => c.mode === 'bt').length) + ' ' + T('प्रविष्टि', 'entries'), 100 * TOT.inpBt / TOT.inpNpr, npr(TOT.inpBt), COL.navy2]])}
  <p style="font-size:12.5px;font-weight:700;margin:16px 0 6px">${T('दैनिक प्रवाह', 'Daily flow')}</p><div class="chart h240"><canvas id="c-daily"></canvas></div>
  <p style="font-size:12.5px;font-weight:700;margin:16px 0 6px">${T('रकमको आकार अनुसार', 'By size of contribution')}</p><div class="chart h240"><canvas id="c-size"></canvas></div></div>
</section>
<section class="card" id="sectors">${sec('chart', 'क्षेत्र अनुसार हस्तान्तरित सहयोग', 'Contributions by sector', T('सहयोग गर्ने निकायको क्षेत्रगत वर्गीकरण · क्लिक गरी सूची फिल्टर गर्नुहोस्', 'Contributors classified by sector · click a bar to filter the register'))}<div class="grid g64"><div class="chart h320"><canvas id="c-sector"></canvas></div><div id="sector-list" class="seclist"></div></div>
 <div class="note">${T('यो वर्गीकरण मा. अर्थमन्त्री समक्ष हस्तान्तरित सहयोगको नामसहितको विवरणमा मात्र आधारित छ। बैंक, NCHL र Fonepay च्यानलबाट प्राप्त रकम कुल रकमका रूपमा मात्र उपलब्ध हुने भएकाले तिनमा दाताको क्षेत्रगत वर्गीकरण गरिएको छैन।', 'This classification is based only on the name-wise record of contributions handed over to the Hon. Finance Minister. Amounts received through banks, NCHL and Fonepay are available only as totals and therefore carry no contributor categories.')}</div></section></div>`;
    hbar('c-nchl', D.nchl.channels.map(c => T(c[0], c[1])), D.nchl.channels.map(c => c[3]), { extra: i => num(D.nchl.channels[i][2]) + ' txn' });
    hbar('c-fone', D.fonepay.channels.map(c => T(c[0], c[1])), D.fonepay.channels.map(c => c[3]), { color: COL.navy2, extra: i => num(D.fonepay.channels[i][2]) + ' txn' });
    vbar('c-daily', DAYS.map(d => T(d, adFmt(C.find(c => c.bs === d).ad).slice(0, 6))), DAYS.map(d => byDay[d].npr), { color: COL.red, fmt: v => npr(v) });
    const bands = [[0, 1e6, T('< १० लाख', '< 1 million')], [1e6, 1e7, T('१० लाख – १ करोड', '1M – 10M')], [1e7, 5e7, T('१ – ५ करोड', '10M – 50M')], [5e7, 1e12, T('≥ ५ करोड', '≥ 50M')]];
    vbar('c-size', bands.map(b => b[2]), bands.map(b => C.filter(c => c.npr >= b[0] && c.npr < b[1]).length), { color: COL.navy, fmt: v => num(v) + ' ' + T('प्रविष्टि', 'entries') });
    const secAgg = D.sectors.map(s => ({ code: s[0], name: T(s[1], s[2]), n: C.filter(c => c.sector === s[0]).length, npr: sum(C.filter(c => c.sector === s[0]), c => c.npr) })).filter(s => s.n).sort((a, b) => b.npr - a.npr);
    hbar('c-sector', secAgg.map(s => s.name), secAgg.map(s => s.npr), { extra: i => num(secAgg[i].n) + ' ' + T('प्रविष्टि', 'entries') });
    document.getElementById('sector-list').innerHTML = secAgg.map(s => `<button data-sector="${s.code}"><b>${s.name}</b><span>${num(s.n)} ${T('प्रविष्टि', 'entries')}</span><em>${short(s.npr)}</em><i style="width:${(100 * s.npr / secAgg[0].npr).toFixed(1)}%"></i></button>`).join('');
    const tbl = table('t-contrib', C, [
      { key: 'sn', label: T('क्र.', '#'), get: c => c.sn, render: c => num(c.sn) },
      { key: 'date', label: T('मिति', 'Date'), get: c => c.ad, render: c => when(c.bs, c.ad), search: c => c.bs + ' ' + adFmt(c.ad) },
      { key: 'name', label: T('सहयोग गर्ने निकाय / व्यक्ति', 'Contributor'), get: c => c.name, cls: 'nm' },
      { key: 'sector', label: T('क्षेत्र', 'Sector'), get: c => c.sector, render: c => `<span class="tag sec">${sectorName(c.sector)}</span>`, search: c => sectorName(c.sector), csv: c => sectorName(c.sector) },
      { key: 'type', label: T('प्रकार', 'Type'), get: c => c.type, render: c => typeTag(c.type), csv: c => c.type === 'ins' ? 'Institutional' : 'Individual' },
      { key: 'mode', label: T('माध्यम', 'Mode'), get: c => c.mode, render: c => modeTxt(c.mode), csv: c => c.mode === 'chq' ? 'Cheque' : 'Bank transfer' },
      { key: 'npr', label: T('रकम', 'Amount'), get: c => c.npr || c.usd, sortVal: c => c.npr || c.usd * D.meta.fx_usd_npr, render: c => c.npr ? npr(c.npr, c.npr % 1 ? 2 : 0) : usd(c.usd), csv: c => c.npr ? c.npr : 'USD ' + c.usd, cls: 'amt', total: c => c.npr },
      { key: 'v', label: '✓', get: () => 'verified', render: () => `<span class="ok" title="${T('प्रमाणित', 'Verified')}">${ic('check')}</span>`, sortable: false }
    ], { filters: [
      { key: 'sector', label: T('क्षेत्र', 'Sector'), options: secAgg.map(s => [s.code, s.name + ' (' + num(s.n) + ')']), test: (c, v) => c.sector === v },
      { key: 'type', label: T('प्रकार', 'Type'), options: [['ins', T('संस्थागत', 'Institutional')], ['ind', T('व्यक्तिगत', 'Individual')]], test: (c, v) => c.type === v },
      { key: 'amt', label: T('रकम', 'Amount'), options: [['a', T('< १० लाख', '< 1 million')], ['b', T('१० लाख – १ करोड', '1M – 10M')], ['c', T('१ – ५ करोड', '10M – 50M')], ['d', T('≥ ५ करोड', '≥ 50M')], ['usd', 'USD']], test: (c, v) => v === 'usd' ? c.usd > 0 : v === 'a' ? c.npr > 0 && c.npr < 1e6 : v === 'b' ? c.npr >= 1e6 && c.npr < 1e7 : v === 'c' ? c.npr >= 1e7 && c.npr < 5e7 : c.npr >= 5e7 },
      { key: 'mode', label: T('माध्यम', 'Mode'), options: [['chq', T('चेक', 'Cheque')], ['bt', T('बैंक ट्रान्सफर', 'Bank transfer')]], test: (c, v) => c.mode === v },
      { key: 'date', label: T('मिति', 'Date'), options: DAYS.map(d => [d, T(d, adFmt(C.find(c => c.bs === d).ad))]), test: (c, v) => c.bs === v }
    ], csvName: 'pm-disaster-relief-fund-handovers.csv', defaultSort: ['sn', 'desc'], initialQ: qp('q'), initialF: qp('sector') ? { sector: qp('sector') } : {},
       chips: [{ key: 'ins', label: T('संस्थागत', 'Institutional'), test: c => c.type === 'ins' }, { key: 'ind', label: T('व्यक्तिगत', 'Individual'), test: c => c.type === 'ind' }, { key: 'chq', label: T('चेक', 'Cheque'), test: c => c.mode === 'chq' }, { key: 'bt', label: T('बैंक ट्रान्सफर', 'Bank transfer'), test: c => c.mode === 'bt' }, { key: 'big', label: T('≥ १ करोड', '≥ 10 million'), test: c => c.npr >= 1e7 }, { key: 'usd', label: 'USD', test: c => c.usd > 0 }] });
    document.querySelectorAll('[data-sector]').forEach(b => b.onclick = () => { tbl.set({ f: { sector: b.dataset.sector }, chip: '', q: '' }); document.getElementById('handover').scrollIntoView({ behavior: STATIC ? 'auto' : 'smooth' }); });
    if (charts['c-sector']) charts['c-sector'].options.onClick = (e, els) => { if (els.length) { tbl.set({ f: { sector: secAgg[els[0].index].code }, chip: '', q: '' }); document.getElementById('handover').scrollIntoView({ behavior: 'smooth' }); } };
    {
      const rows = FS.npr.banks.map(([bank, before, bal]) => ({ bank, cur: 'NPR', before, bal, chg: bal - before }))
        .concat(FS.usd.banks.map(([bank, before, bal]) => ({ bank, cur: 'USD', before, bal, chg: bal - before })));
      const nb = rows.filter(r => r.cur === 'NPR').sort((a, b) => b.bal - a.bal);
      hbar('c-nrb-npr', nb.map(r => r.bank.replace(' Limited', '').replace(' Nepal', '')), nb.map(r => r.bal));
      const money = r => r.cur === 'USD' ? usd : npr;
      table('t-nrb', rows, [
        { key: 'bank', label: T('बैंक', 'Bank'), get: r => r.bank, cls: 'nm' },
        { key: 'cur', label: T('मुद्रा', 'Currency'), get: r => r.cur, render: r => `<span class="tag ${r.cur === 'USD' ? 'gov' : 'ins'}">${r.cur}</span>` },
        { key: 'before', label: T('बाढीअघि', 'Before flood'), get: r => r.before, render: r => r.before ? money(r)(r.before) : '—', cls: 'amt' },
        { key: 'bal', label: T('मौज्दात भदौ २२', 'Balance Bhadra 22'), get: r => r.bal, render: r => money(r)(r.bal), cls: 'amt' },
        { key: 'chg', label: T('बाढीपछि वृद्धि', 'Change since flood'), get: r => r.chg, render: r => `<b style="color:var(--ok)">+ ${money(r)(r.chg)}</b>`, cls: 'amt', csv: r => r.chg }
      ], { pageSize: 12, csvName: 'fund-account-status-bank-wise.csv', defaultSort: ['bal', 'desc'], chips: [{ key: 'npr', label: T('रु. खाता', 'NPR accounts'), test: r => r.cur === 'NPR' }, { key: 'usd', label: T('USD खाता', 'USD accounts'), test: r => r.cur === 'USD' }] });
      fsCharts();
    }
    if (qp('q') || qp('sector')) setTimeout(() => document.getElementById('handover').scrollIntoView(), 50);
  };

  PAGES.foreign = () => {
    const F = D.foreign, ft = F.find(f => f.featured), fx = D.meta.fx_usd_npr;
    const types = [['corp', 'कम्पनी / निगम', 'Corporation'], ['gov', 'सरकार / दूतावास', 'Government / embassy'], ['multi', 'बहुपक्षीय निकाय', 'Multilateral (UN, WB, ADB…)'], ['ingo', 'अन्तर्राष्ट्रिय गैरसरकारी', 'INGO / foundation'], ['diaspora', 'प्रवासी नेपाली', 'Diaspora organisations']];
    document.getElementById('main').innerHTML = `<div class="wrap stack">
<div class="ph"><div><h1>${T('वैदेशिक सहयोग', 'Foreign assistance')}</h1><p>${T('विदेशी सरकार, दूतावास, कम्पनी, दातृ निकाय तथा प्रवासी नेपालीबाट प्रधानमन्त्री दैवी प्रकोप उद्धार कोषमा प्राप्त सहयोग — विदेशी मुद्रा (USD) मा प्राप्त सबै रकम, हस्तान्तरण गरिएका USD चेक समेत, यसै खण्डमा गणना हुन्छ।', 'Assistance received by the Prime Minister Disaster Relief Fund from foreign governments, embassies, corporations, donors and the diaspora — every amount received in foreign currency (USD), including USD cheques handed over, is counted in this section.')}</p></div></div>
<section class="grid g4">
${kpi('globe', 'कुल वैदेशिक सहयोग (USD)', 'Total foreign assistance (USD)', T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोषका USD खातामा बाढीपछि जम्मा · ' + FS.as_of_bs, 'Deposited in the Prime Minister Disaster Relief Fund\'s USD accounts after the flood · ' + FS.as_of_en), usd(TOT.foreignAllUsd), '≈ ' + npr(TOT.foreignAllUsd * fx) + ' · ' + T('दर रु. ' + dig(fx) + '/USD', 'at NPR ' + fx + '/USD'), 'red')}
${kpi('check', 'नामसहित पहिचान भएको', 'Identified by contributor', T(num(F.length) + ' दाता · वर्ग घ', num(F.length) + ' contributors · category D'), usd(TOT.foreignUsd), pct(TOT.foreignUsd, TOT.foreignAllUsd) + ' ' + T('कुल USD को', 'of total USD'))}
${kpi('search', 'पहिचान हुन बाँकी', 'Awaiting attribution', T('बैंक जम्मा — दाता विवरण संकलन हुँदै', 'Bank deposits — contributor details being collected'), usd(TOT.foreignUnid), T('विदेशस्थित व्यक्ति, संस्था तथा प्रवासी नेपाली समेत', 'incl. individuals, organisations and diaspora abroad'))}
${kpi('bank', 'USD खाता मौज्दात', 'USD account balance', T('हिमालयन बैंक · लक्ष्मी सनराइज बैंक', 'Himalayan Bank · Laxmi Sunrise Bank'), usd(FS.usd.balance), T('बाढीअघि USD ' + num(FS.usd.before) + ' समेत', 'incl. USD ' + num(FS.usd.before) + ' pre-flood'))}
</section>
<section class="grid g64">
 <div class="feat"><div><small>${ic('globe')} PM DISASTER RELIEF FUND · ${T('योगदानकर्ता', 'CONTRIBUTED BY')}</small><h2>${ft.name}</h2><span style="font-size:12px;color:var(--mute)">${T('AI कम्प्युटिङमा विश्वको अग्रणी · NVIDIA × नेपाल सरकार', 'World leader in AI computing · NVIDIA × Government of Nepal')}</span>
  <div class="big" data-cnt>${usd(ft.usd)}</div><span class="sub">≈ ${npr(ft.npr)} · ${short(ft.npr)} · ${T('दर रु. ' + dig(fx), 'at NPR ' + fx)}/USD</span>
  <div class="meta"><div><b>${T('मिति', 'Date')}</b>${when(ft.bs, ft.ad)}</div><div><b>${T('उद्देश्य', 'Purpose')}</b>${T(ft.purpose_ne, ft.purpose_en)}</div><div><b>${T('माध्यम', 'Channel')}</b>${T(ft.channel_ne, ft.channel_en)}</div><div><b>${T('प्रकार', 'Type')}</b>${T('नगद · कम्पनी', 'Cash · Corporation')}</div></div></div>
  <div class="qr"><div></div>donate.gov.np</div></div>
 <div class="card">${sec('chart', 'दाताको प्रकार अनुसार', 'By contributor type')}
  ${bars(types.map(([k, ne, en]) => { const v = sum(F.filter(f => f.type === k), f => f.usd); return [T(ne, en), '', 100 * v / TOT.foreignUsd, v ? usd(v) : '—', k === 'gov' ? COL.red : v ? COL.navy : COL.grey]; }))}
  <div class="note">${T('सम्पर्क: अन्तर्राष्ट्रिय दातृ निकाय तथा संघ संस्थाका लागि सहसचिव अमृत लम्साल · 9851183001', 'Contact for international donors & agencies: Joint Secretary Amrit Lamsal · 9851183001')}</div></div>
</section>
<section class="card">${sec('chart', 'USD खातामा दैनिक जम्मा', 'Daily deposits into the USD accounts', T('कोष स्थिति विवरण · भदौ ११–२२', 'Fund status statement · Bhadra 11–22'), src(T('प्रधानमन्त्री दैवी प्रकोप उद्धार कोष · नेपाल राष्ट्र बैंक', 'Prime Minister Disaster Relief Fund · Nepal Rastra Bank')))}<div class="grid g2"><div><div class="chart h240"><canvas id="c-usd-daily"></canvas></div></div><div>${bars([[T('नामसहित पहिचान', 'Identified'), T('NVIDIA · चीन दूतावास', 'NVIDIA · Embassy of China'), 100 * TOT.foreignUsd / TOT.foreignAllUsd, usd(TOT.foreignUsd)], [T('पहिचान हुन बाँकी', 'Awaiting attribution'), T('बैंक जम्मा', 'bank deposits'), 100 * TOT.foreignUnid / TOT.foreignAllUsd, usd(TOT.foreignUnid), COL.gold]])}<div class="note">${T('भदौ १९ मा USD १,१७,१३,९५२ जम्मा — NVIDIA को USD १ करोड सोही दिन प्राप्त', 'USD 11,713,952 deposited on Bhadra 19 (4 Sep) — the day NVIDIA\'s USD 10 million was received')}</div></div></div></section>
<section class="card">${sec('doc', 'वैदेशिक सहयोग सूची', 'Foreign assistance register', '', src(T('प्रमाणित: अन्तर्राष्ट्रिय आर्थिक सहायता समन्वय महाशाखा', 'Verified: International Economic Cooperation Coordination Division')))}<div id="t-foreign"></div></section></div>`;
    vbar('c-usd-daily', FS.dates_bs.map((b, i) => T(b, adFmt(FS.dates_ad[i]).slice(0, 6))), FS.usd.daily_series, { color: COL.red, fmt: v => usd(v) });
    table('t-foreign', F, [
      { key: 'date', label: T('मिति', 'Date'), get: f => f.ad, render: f => when(f.bs, f.ad) },
      { key: 'name', label: T('दाता', 'Contributor'), get: f => f.name, cls: 'nm' },
      { key: 'country', label: T('देश', 'Country'), get: f => T(f.country_ne, f.country_en) },
      { key: 'type', label: T('प्रकार', 'Type'), get: f => f.type, render: f => typeTag(f.type) },
      { key: 'kind', label: T('सहयोगको किसिम', 'Kind'), get: f => f.kind === 'cash' ? T('नगद', 'Cash') : T('नगद (चेक)', 'Cash (cheque)') },
      { key: 'channel', label: T('माध्यम', 'Channel'), get: f => T(f.channel_ne, f.channel_en) },
      { key: 'usd', label: T('रकम (USD)', 'Amount (USD)'), get: f => f.usd, render: f => num(f.usd), cls: 'amt' },
      { key: 'npr', label: '≈ NPR', get: f => f.npr, render: f => npr(f.npr), cls: 'amt', total: f => f.npr },
      { key: 'v', label: '✓', get: () => 'verified', render: () => `<span class="ok">${ic('check')}</span>`, sortable: false }
    ], { csvName: 'foreign-assistance.csv', pageSize: 25, initialQ: qp('q'),
      filters: [
        { key: 'type', label: T('प्रकार', 'Type'), options: types.map(([k, ne, en]) => [k, T(ne, en)]), test: (f, v) => f.type === v },
        { key: 'kind', label: T('किसिम', 'Kind'), options: [['cash', T('नगद', 'Cash')], ['cash_chq', T('नगद (चेक)', 'Cash (cheque)')], ['in_kind', T('जिन्सी', 'In-kind')], ['pledge', T('प्रतिबद्धता', 'Pledge')]], test: (f, v) => f.kind === v },
        { key: 'country', label: T('देश', 'Country'), options: [...new Set(F.map(f => f.country_en))].map(c => [c, T(F.find(f => f.country_en === c).country_ne, c)]), test: (f, v) => f.country_en === v }],
      chips: [{ key: 'cash', label: T('नगद', 'Cash'), test: f => f.kind.startsWith('cash') }, { key: 'inkind', label: T('जिन्सी', 'In-kind'), test: f => f.kind === 'in_kind' }, { key: 'pledge', label: T('प्रतिबद्धता', 'Pledged'), test: f => f.kind === 'pledge' }, { key: 'corp', label: T('कम्पनी', 'Corporations'), test: f => f.type === 'corp' }, { key: 'gov', label: T('सरकार / दूतावास', 'Governments'), test: f => f.type === 'gov' }] });
  };

  PAGES.rescue = () => {
    const R = D.rescue.ndrrma, PL = D.rescue.nepal_police;
    const DN = { Rasuwa: 'रसुवा', Nuwakot: 'नुवाकोट', Dhading: 'धादिङ', Gorkha: 'गोरखा', Chitwan: 'चितवन', Tanahun: 'तनहुँ', 'Nawalparasi East': 'नवलपरासी पूर्व', 'Nawalparasi West': 'नवलपरासी पश्चिम' };
    const portalIcons = ['ring', 'people', 'heli'];
    document.getElementById('main').innerHTML = `<div class="wrap stack">
<div class="ph"><div><h1>${T('खोज, उद्धार तथा राहत', 'Search, rescue and relief')}</h1><p>${T('NDRRMA र नेपाल प्रहरीको आधिकारिक दैनिक प्रतिवेदनबाट — उद्धार, मानवीय क्षति, बेपत्ता, उपचार, होल्डिङ सेन्टर र राहत आपूर्ति।', 'From the official daily reports of NDRRMA and Nepal Police — rescue, casualties, missing, treatment, holding centres and relief supplies.')}</p></div>
<div class="tabs"><a class="on" href="#top">${T(R.as_of_bs, adFmt(R.as_of.slice(0, 10)))}</a><a href="#archive">${T('भदौ २०', '5 Sep')}</a><a href="#archive">${T('भदौ १९', '4 Sep')}</a><a href="#archive">${ic('doc')} ${T('अभिलेख', 'Archive')}</a></div></div>

<section class="banner"><div class="lead"><span class="live"><i></i>${T('आधिकारिक उद्धार पोर्टलहरू', 'Official rescue portals')}</span><b>${T('उद्धार अनुरोध, उद्धार गरिएका व्यक्ति र कमाण्ड सेन्टर', 'Rescue requests, rescued persons and the command centre')}</b><span>${T('यी पोर्टल सम्बन्धित निकायले प्रत्यक्ष सञ्चालन गर्छन्; यहाँबाट सिधै पहुँच', 'Operated live by the responsible agencies — direct access from here')}</span></div>
 <div class="links">${D.portals.map((p, i) => `<a href="${p.url}" target="_blank" rel="noopener"><b>${ic(portalIcons[i])} ${T(p.label_ne, p.label_en)}</b><span>${p.owner}</span><i>${p.url.replace('https://', '').replace(/\/$/, '')} ${ic('ext')}</i></a>`).join('')}</div></section>

<section class="grid g6">
${kpi('people', 'उद्धार गरिएका', 'Rescued till date', '', num(R.rescued_till_date), T('सेना उडान ' + num(R.helicopter_flights.nepali_army_total) + ' (आज ' + num(R.helicopter_flights.nepali_army_today) + ') · निजी ' + num(R.helicopter_flights.private_from_kathmandu), 'Army flights ' + num(R.helicopter_flights.nepali_army_total) + ' (today ' + num(R.helicopter_flights.nepali_army_today) + ') · private ' + num(R.helicopter_flights.private_from_kathmandu)), 'red')}
${kpi('umbrella', 'मानवीय क्षति', 'Human casualties', '', num(R.human_casualties), T('शव हस्तान्तरण ' + num(R.dead_body_handover), 'handed over ' + num(R.dead_body_handover)))}
${kpi('search', 'बेपत्ता (लगभग)', 'Missing (approx.)', '', num(R.missing_total_approx), T('रसुवा ' + num(1967) + ' · नुवाकोट ' + num(2340) + ' · विदेशी ' + num(589), 'Rasuwa 1,967 · Nuwakot 2,340 · foreign 589'))}
${kpi('shield', 'उपचाररत घाइते', 'Injured under treatment', '', num(R.injured_receiving_treatment), T('सेना ' + num(3298) + ' · APF ' + num(2462) + ' · अस्पताल ' + num(323), 'Army 3,298 · APF 2,462 · hospitals 323'))}
${kpi('home', 'होल्डिङ सेन्टरमा', 'At holding centres', '', num(R.holding_center_people), T('रसुवा ' + num(960) + ' · नुवाकोट ' + num(2714) + ' · धादिङ ' + num(238), 'Rasuwa 960 · Nuwakot 2,714 · Dhading 238'))}
${kpi('ring', 'सुरक्षाकर्मी परिचालन', 'Security personnel', '', num(R.security_personnel_mobilised), T('प्रहरी ' + num(7975) + ' · सेना ' + num(9287) + ' · APF ' + num(4203), 'Police 7,975 · Army 9,287 · APF 4,203'))}
</section>

<section class="grid g3">
 <div class="card">${sec('pin', 'जिल्ला अनुसार प्राप्त शव', 'Bodies recovered by district', T('NDRRMA · ' + R.as_of_bs, 'NDRRMA · 6 Sep, 6:00 PM'))}<div class="chart h280"><canvas id="c-dist"></canvas></div></div>
 <div class="card">${sec('search', 'बेपत्ता — विवरण स्रोत अनुसार', 'Missing — by reporting source')}<div class="chart h280"><canvas id="c-miss"></canvas></div></div>
 <div class="card">${sec('ring', 'परिचालित सुरक्षाकर्मी', 'Security personnel mobilised')}<div class="donutbox sec"><div class="cv" style="width:200px;height:200px"><canvas id="c-sec"></canvas><div class="c"><b>${num(R.security_personnel_mobilised)}</b><span>${T('जना', 'personnel')}</span></div></div>${legend(Object.entries(R.security_breakdown).map(([k, v], i) => [T({ 'Nepal Police': 'नेपाल प्रहरी', 'Nepali Army': 'नेपाली सेना', 'Armed Police Force': 'सशस्त्र प्रहरी' }[k], k), v, [COL.navy, COL.red, COL.navy3][i], R.security_personnel_mobilised]))}</div></div>
</section>

<section class="grid g64">
 <div class="card">${sec('shield', 'नेपाल प्रहरी अद्यावधिक', 'Nepal Police update', T('नेपाल प्रहरी · ' + PL.as_of_bs, 'Nepal Police · 6 Sep 2026, 8:00 PM'), src(T('स्रोत: नेपाल प्रहरी', 'Source: Nepal Police')))}
  <div class="grid g2">${bars([[T('फेला परेको शव', 'Bodies found'), T('पुरुष ' + num(PL.bodies_found.male) + ' · महिला ' + num(PL.bodies_found.female) + ' · आंशिक अंग ' + num(PL.bodies_found.partial_remains), 'male ' + num(PL.bodies_found.male) + ' · female ' + num(PL.bodies_found.female) + ' · partial remains ' + num(PL.bodies_found.partial_remains)), 100, num(PL.bodies_found.total), COL.red], [T('शव व्यवस्थापन (सुरक्षित राखिएका)', 'Bodies managed'), T('जमिनमुनि सुरक्षित', 'buried safely'), 100 * PL.bodies_managed_buried / PL.bodies_found.total, num(PL.bodies_managed_buried)], [T('DNA संकलन', 'DNA samples'), T('मृतक ' + num(PL.dna.deceased) + ' · आफन्त ' + num(PL.dna.relatives), 'deceased ' + num(PL.dna.deceased) + ' · relatives ' + num(PL.dna.relatives)), 100, num(PL.dna.total), COL.navy2]])}
  ${bars([[T('बेपत्ता विवरण', 'Missing persons'), T('स्वदेशी ' + num(PL.missing.domestic.total) + ' · विदेशी ' + num(PL.missing.foreign.total), 'domestic ' + num(PL.missing.domestic.total) + ' · foreign ' + num(PL.missing.foreign.total)), 100, num(PL.missing.total), COL.gold], [T('घाइते / उद्धार', 'Injured / rescued'), T('पुरुष ' + num(PL.injured_rescued.male) + ' · महिला ' + num(PL.injured_rescued.female), 'male ' + num(PL.injured_rescued.male) + ' · female ' + num(PL.injured_rescued.female)), 100, num(PL.injured_rescued.total)], [T('पहिचान नभएको (वेबसाइट अपलोड)', 'Unidentified, uploaded to website'), T('होल्डिङ सेन्टरमा ' + num(PL.in_holding_center), 'in holding centres ' + num(PL.in_holding_center)), 100 * PL.unidentified_uploaded_to_website / PL.bodies_found.total, num(PL.unidentified_uploaded_to_website), COL.navy3]])}</div>
  <div class="note">${T('प्रहरी परिचालन ' + num(PL.personnel_mobilised) + ' · प्रभावित ' + num(PL.personnel_affected) + ' · सम्पर्कविहीन ' + num(PL.personnel_out_of_contact) + ' · जनचेतनामूलक कार्यक्रम ' + num(PL.awareness_programs.programs) + ' (सहभागी ' + num(PL.awareness_programs.participants) + ')', 'Police mobilised ' + num(PL.personnel_mobilised) + ' · affected ' + num(PL.personnel_affected) + ' · out of contact ' + num(PL.personnel_out_of_contact) + ' · awareness programmes ' + num(PL.awareness_programs.programs) + ' (' + num(PL.awareness_programs.participants) + ' participants)')}</div></div>
 <div class="card">${sec('bolt', 'सेवा पुनर्स्थापना तथा आपूर्ति', 'Services & supplies', T('NDRRMA · ' + R.as_of_bs, 'NDRRMA · 6 Sep'))}
  ${bars(Object.entries(R.electricity_restored_pct).map(([k, v]) => [T('बिजुली — ' + DN[k], 'Electricity — ' + k), T('घरधुरी पुनर्स्थापित', 'households restored'), v, dig(v) + '%', COL.ok]))}
  <div style="margin-top:12px">${bars([[T('NTC टावर', 'NTC towers'), T('पुनर्स्थापित / जम्मा', 'restored / total'), 100 * R.telecom_towers.NTC[0] / R.telecom_towers.NTC[1], num(R.telecom_towers.NTC[0]) + ' / ' + num(R.telecom_towers.NTC[1])], [T('Ncell टावर', 'Ncell towers'), T('पुनर्स्थापित / जम्मा', 'restored / total'), 100 * R.telecom_towers.Ncell[0] / R.telecom_towers.Ncell[1], num(R.telecom_towers.Ncell[0]) + ' / ' + num(R.telecom_towers.Ncell[1])]])}</div>
  <div class="grid g2" style="margin-top:12px;font-size:12.5px"><div style="background:var(--sur);border-radius:8px;padding:10px">${ic('fuel')} <b>${T('इन्धन मौज्दात', 'Fuel stock')}</b><br>${T('डिजेल ' + num(R.fuel_stock.diesel_l) + ' लि. · पेट्रोल ' + num(R.fuel_stock.petrol_l) + ' लि. · हवाई ' + num(R.fuel_stock.aviation_l) + ' लि. · LPG ' + num(R.fuel_stock.lpg_cylinders), 'Diesel ' + num(R.fuel_stock.diesel_l) + ' L · petrol ' + num(R.fuel_stock.petrol_l) + ' L · aviation ' + num(R.fuel_stock.aviation_l) + ' L · LPG ' + num(R.fuel_stock.lpg_cylinders) + ' cylinders')}</div><div style="background:var(--sur);border-radius:8px;padding:10px">${ic('heart')} <b>${T('मनोसामाजिक परामर्श', 'Psychosocial counselling')}</b><br>${T('स्वास्थ्य मन्त्रालयबाट ' + num(R.psychosocial_health_personnel) + ' स्वास्थ्यकर्मी परिचालित', num(R.psychosocial_health_personnel) + ' health personnel deployed by the Ministry of Health')}</div></div></div>
</section>

<section class="embed"><div class="bar"><span class="live"><i></i>${T('प्रत्यक्ष', 'Live')}</span><b>${T('रसुवा बाढीबाट उद्धार गरिएका व्यक्तिहरूको विवरण', 'Persons rescued from the Rasuwa flood')}</b><span class="src">${T('स्रोत: NDRRMA — यो पोर्टलमा डेटा प्रतिलिपि गरिएको छैन', 'Source: NDRRMA — data is not copied to this portal')}</span><a class="btn navy sm r" href="https://ndrrma.gov.np/np/rasuwa" target="_blank" rel="noopener">${T('नयाँ ट्याबमा खोल्नुहोस्', 'Open in new tab')} ${ic('ext')}</a></div>
 <div class="frame"><div class="fallback">${ic('people')}<b>ndrrma.gov.np/np/rasuwa</b>${T('NDRRMA को आधिकारिक नामावली यहाँ प्रदर्शित हुन्छ। प्रदर्शन नभएमा माथिको बटनबाट खोल्नुहोस्।', 'The official NDRRMA list displays here. If it does not load, open it with the button above.')}</div><iframe src="https://ndrrma.gov.np/np/rasuwa" title="NDRRMA rescued persons" loading="lazy" referrerpolicy="no-referrer"></iframe></div></section>

<section class="card">${sec('pin', 'जिल्लागत विवरण', 'District-level data', T('NDRRMA प्रतिवेदनबाट जिल्ला अनुसार — खोज तथा क्रमबद्ध गर्नुहोस्', 'By district from the NDRRMA report — search and sort'))}<div id="t-dist"></div></section>
<section class="card" id="archive">${sec('doc', 'दैनिक प्रतिवेदन अभिलेख', 'Daily report archive', T('NDRRMA र नेपाल प्रहरीका मूल PDF / JPG प्रतिवेदन, संरचित डेटासहित', 'Original PDF / JPG reports from NDRRMA and Nepal Police, with structured data'))}
 <div id="t-arch"></div>
 <div style="margin-top:12px"><details class="acc"><summary>${ic('coins')} ${T('नेपाल सरकारबाट जिल्ला तथा स्थानीय तहलाई नगद सहयोग', 'Cash support from the Government to districts and local governments')}</summary><div class="b">${Object.entries(R.cash_support_npr).map(([k, v]) => `<div><b>${T({ Rasuwa: 'रसुवा', Nuwakot: 'नुवाकोट', Dhading: 'धादिङ', '15 affected local governments': '१५ प्रभावित स्थानीय तह' }[k], k)}</b>${npr(v)}</div>`).join('')}</div></details></div></section></div>`;
    const dist = Object.entries(R.bodies_by_district);
    vbar('c-dist', dist.map(([k]) => T(DN[k], k.replace('Nawalparasi', 'Nawalp.'))), dist.map(([, v]) => v), { color: COL.red, fmt: num });
    const mb = Object.entries(R.missing_breakdown); const MN = { 'DAO Rasuwa': 'जि.प्र.का. रसुवा', 'DAO Nuwakot': 'जि.प्र.का. नुवाकोट', 'Security personnel & govt officials': 'सुरक्षाकर्मी / कर्मचारी', 'Foreign nationals': 'विदेशी नागरिक' };
    hbar('c-miss', mb.map(([k]) => T(MN[k], k)), mb.map(([, v]) => v), { color: COL.navy, fmt: num });
    donut('c-sec', Object.keys(R.security_breakdown), Object.values(R.security_breakdown), [COL.navy, COL.red, COL.navy3], num);
    const drows = dist.map(([k, v]) => ({ d: k, dn: DN[k], bodies: v, missing: k === 'Rasuwa' ? 1967 : k === 'Nuwakot' ? 2340 : null, hold: R.holding_center_breakdown[k] ?? null, elec: R.electricity_restored_pct[k] ?? null, cash: R.cash_support_npr[k] ?? null }));
    const dash = v => v === null ? '—' : num(v);
    table('t-dist', drows, [
      { key: 'd', label: T('जिल्ला', 'District'), get: r => T(r.dn, r.d), cls: 'nm', search: r => r.d + ' ' + r.dn },
      { key: 'bodies', label: T('शव प्राप्त', 'Bodies recovered'), get: r => r.bodies, render: r => num(r.bodies), cls: 'amt' },
      { key: 'missing', label: T('बेपत्ता (जि.प्र.का.)', 'Missing (DAO)'), get: r => r.missing ?? -1, render: r => dash(r.missing), cls: 'amt' },
      { key: 'hold', label: T('होल्डिङ सेन्टरमा', 'At holding centres'), get: r => r.hold ?? -1, render: r => dash(r.hold), cls: 'amt' },
      { key: 'elec', label: T('बिजुली पुनर्स्थापना', 'Electricity restored'), get: r => r.elec ?? -1, render: r => r.elec === null ? '—' : dig(r.elec) + '%', cls: 'amt' },
      { key: 'cash', label: T('नगद सहयोग', 'Cash support'), get: r => r.cash ?? -1, render: r => r.cash === null ? '—' : npr(r.cash), cls: 'amt' }
    ], { pageSize: 10, csvName: 'rasuwa-flood-district-data.csv', chips: [{ key: 'core', label: T('मुख्य प्रभावित ३ जिल्ला', '3 core districts'), test: r => ['Rasuwa', 'Nuwakot', 'Dhading'].includes(r.d) }, { key: 'down', label: T('तल्लो तटीय', 'Downstream'), test: r => !['Rasuwa', 'Nuwakot', 'Dhading'].includes(r.d) }] });
    const arch = [['2026-09-06', 'भदौ २१', 'NDRRMA', 'Search, Rescue & Relief Update · 6:00 PM', 'PDF', 'reference/ndrrma-update-2026-09-06.jpeg'], ['2026-09-06', 'भदौ २१', 'Nepal Police', T('खोज तथा उद्धार अपडेट · २०:०० बजे', 'Search & rescue update · 8:00 PM'), 'JPG', ''], ['2026-09-05', 'भदौ २०', 'NDRRMA', 'Search, Rescue & Relief Update · 6:00 PM', 'PDF', ''], ['2026-09-05', 'भदौ २०', 'Nepal Police', T('खोज तथा उद्धार अपडेट', 'Search & rescue update'), 'JPG', ''], ['2026-09-04', 'भदौ १९', 'NDRRMA', 'Search, Rescue & Relief Update · 6:00 PM', 'PDF', ''], ['2026-09-03', 'भदौ १८', 'NDRRMA', 'Search, Rescue & Relief Update · 6:00 PM', 'PDF', '']].map(a => ({ ad: a[0], bs: a[1], ag: a[2], t: a[3], f: a[4], u: a[5] }));
    table('t-arch', arch, [
      { key: 'date', label: T('मिति', 'Date'), get: r => r.ad, render: r => when(r.bs, r.ad), search: r => r.bs + ' ' + adFmt(r.ad) },
      { key: 'ag', label: T('निकाय', 'Agency'), get: r => r.ag, render: r => `<span class="tag ${r.ag === 'NDRRMA' ? 'ins' : 'ind'}">${r.ag === 'NDRRMA' ? 'NDRRMA' : T('नेपाल प्रहरी', 'Nepal Police')}</span>` },
      { key: 't', label: T('प्रतिवेदन', 'Report'), get: r => r.t, cls: 'nm' },
      { key: 'f', label: T('फाइल', 'File'), get: r => r.f, render: r => r.u ? `<a class="btn ghost sm" href="${r.u}" target="_blank">${ic('download')} ${r.f}</a>` : `<span class="src">${r.f} · ${T('अपलोड प्रतीक्षारत', 'to be uploaded')}</span>`, sortable: false }
    ], { pageSize: 10, csvName: 'report-archive.csv', filters: [{ key: 'ag', label: T('निकाय', 'Agency'), options: [['NDRRMA', 'NDRRMA'], ['Nepal Police', T('नेपाल प्रहरी', 'Nepal Police')]], test: (r, v) => r.ag === v }], defaultSort: ['date', 'desc'] });
  };

  PAGES.initiatives = () => {
    const I = D.initiatives, brp = I[1]; let cat = qp('cat') || '', mq = '', mag = '';
    const agencies = [...new Set(brp.measures.map(m => m.agency_ne))];
    const cIcons = { 'क': 'truck', 'ख': 'percent', 'ग': 'bank', 'घ': 'umbrella', 'ङ': 'heart' };
    const draw = () => {
      document.getElementById('main').innerHTML = `<div class="wrap stack">
<div class="ph"><div><h1>${T('सरकारबाट भएका पहल', 'Government initiatives')}</h1><p>${T('बाढी प्रभावितका लागि मन्त्रिपरिषद् तथा अर्थ मन्त्रालयबाट भएका निर्णय, राहत व्यवस्था र नगद सहयोग — मूल पत्र, सारांश र कार्यान्वयन निकायसहित।', 'Decisions, relief measures and cash support by the Cabinet and the Ministry of Finance for those affected — with original documents, summaries and implementing agencies.')}</p></div></div>
<section class="grid g4">
${kpi('gavel', 'मन्त्रिपरिषद् निर्णय', 'Cabinet decisions', '', num(I.filter(x => x.kind === 'cabinet_decision').length), T('२०८३ भदौ १८ · Business Recovery Plan', '3 Sep 2026 · Business Recovery Plan'))}
${kpi('doc', 'लागू राहत व्यवस्था', 'Relief measures in force', '', num(brp.measures.length), T('५ वर्ग · ५ कार्यान्वयन निकाय', '5 categories · 5 implementing agencies'), 'red')}
${kpi('bank', 'अर्थ मन्त्रालयका सूचना / निर्णय', 'MoF notices & decisions', '', num(I.filter(x => x.kind === 'notice').length), T('राहत संकलन एकद्वार प्रणाली', 'Single-window relief collection'))}
${kpi('coins', 'जिल्ला तथा स्थानीय तहलाई नगद सहयोग', 'Cash support to districts & local governments', '', npr(sum(Object.values(D.rescue.ndrrma.cash_support_npr))), T('रसुवा · नुवाकोट · धादिङ · १५ स्थानीय तह', 'Rasuwa · Nuwakot · Dhading · 15 local governments'))}
</section>
<section class="card">${sec('clock', 'समयरेखा', 'Timeline')}<div class="tl">${I.map(x => `<div class="${x.kind === 'cabinet_decision' ? 'hot' : ''}"><span>${x.date_ad ? when(x.date_bs, x.date_ad) : T(x.date_bs, 'Ongoing')}</span><b>${T(x.title_ne, x.title_en)}</b><i>${T(x.issuer_ne, x.issuer_en || x.issuer)}</i></div>`).join('')}<div><span>${T('निरन्तर', 'Ongoing')}</span><b>${T('दैनिक राहत आपूर्ति', 'Daily relief supplies')}</b><i>${T('हेलिकप्टर तथा ट्रकबाट खाद्यान्न, जेनेरेटर, स्वच्छता तथा विद्यार्थी किट', 'Food, generators, hygiene and student kits by helicopter and truck')}</i></div></div></section>
<section class="card">${sec('gavel', brp.title_ne, brp.title_en, T('मन्त्रिपरिषद् निर्णय २०८३।०५।१८ · ५ वर्गमा १८ राहत व्यवस्था · वर्गमा क्लिक गरी छान्नुहोस्', 'Cabinet decision 2083/05/18 · 18 measures in 5 categories · click a category to filter'), `<a class="btn ghost sm" href="reference/anusuchi-cabinet-decision.pdf" target="_blank">${ic('download')} ${T('मूल अनुसूची (PDF)', 'Original annex (PDF)')}</a><a class="btn ghost sm" href="reference/business-recovery-plan-phase-1.pdf" target="_blank">${ic('download')} ${T('व्याख्यात्मक (PDF)', 'Explainer (PDF)')}</a>`)}
 <div class="cats">${brp.categories.map(c => `<div class="cat ${cat === c.code ? 'on' : ''}" data-c="${c.code}" role="button" tabindex="0"><em>${c.code}</em>${ic(cIcons[c.code], 'ico')}<b>${T(c.name_ne, c.name_en)}</b><span>${T(c.name_en, c.name_ne)}</span><i>${T(c.agency_ne, c.agency_en)}</i><strong>${num(c.count)} ${T('राहत व्यवस्था', 'measures')}</strong></div>`).join('')}</div>
 <div class="filters" style="margin-top:14px">${ic('search')}<input id="mq" type="search" value="${mq.replace(/"/g, '&quot;')}" placeholder="${T('राहत व्यवस्था खोज्नुहोस् — शीर्षक, निकाय, कसलाई…', 'Search measures — title, agency, beneficiary…')}" aria-label="search measures"><select id="mag" aria-label="agency"><option value="">${T('कार्यान्वयन निकाय: सबै', 'Implementing agency: all')}</option>${agencies.map(a => `<option value="${a}" ${mag === a ? 'selected' : ''}>${a}</option>`).join('')}</select>${(cat || mq || mag) ? `<button class="btn ghost sm" id="mclear">${ic('x')} ${T('सबै हटाउनुहोस्', 'Clear')}</button>` : ''}<span class="src" id="mcount"></span></div>
 <div class="meas">${brp.measures.filter(m => (!cat || m.category === cat) && (!mag || m.agency_ne === mag) && (!mq || (m.title_ne + m.title_en + m.agency_ne + m.who_ne + m.benefit_ne).toLowerCase().includes(mq.toLowerCase()))).map(m => `<div class="m" data-m="${m.no}" role="button" tabindex="0"><em>${num(m.no)}</em><span class="k ${m.category}">${m.category}</span><b>${T(m.title_ne, m.title_en)}</b><i>${m.agency_ne}</i></div>`).join('')}</div></section>
<section class="grid g2">${I.filter(x => x.kind !== 'cabinet_decision').map(x => `<div class="card">${sec(x.kind === 'notice' ? 'doc' : 'coins', x.title_ne, x.title_en, T(x.issuer_ne + ' · ' + x.date_bs, (x.issuer_en || x.issuer) + ' · ' + (x.date_ad ? adFmt(x.date_ad) : 'ongoing')))}<p style="font-size:13.5px;line-height:1.5">${T(x.summary_ne, x.summary_en)}</p>${x.original_file ? `<a class="btn ghost sm" style="margin-top:10px" href="${x.original_file}" target="_blank">${ic('doc')} ${T('मूल सामग्री', 'Original')}</a>` : ''}</div>`).join('')}</section></div>
<div class="drawer" id="drawer" role="dialog" aria-modal="true"><div class="panel"></div></div>`;
      document.querySelectorAll('.cat').forEach(el => el.onclick = el.onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter') return; cat = cat === el.dataset.c ? '' : el.dataset.c; draw(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120 }); });
      document.querySelectorAll('.m').forEach(el => el.onclick = el.onkeydown = e => { if (e.type === 'keydown' && e.key !== 'Enter') return; openMeasure(+el.dataset.m); });
      const shown = document.querySelectorAll('.m').length; document.getElementById('mcount').textContent = T(num(shown) + ' / १८ देखाइएको', num(shown) + ' of 18 shown');
      const mqEl = document.getElementById('mq'); mqEl.oninput = () => { mq = mqEl.value; const pos = mqEl.selectionStart; draw(); const n = document.getElementById('mq'); n.focus(); n.setSelectionRange(pos, pos); };
      document.getElementById('mag').onchange = e => { mag = e.target.value; draw(); };
      const mc = document.getElementById('mclear'); if (mc) mc.onclick = () => { cat = ''; mq = ''; mag = ''; draw(); };
      if (!document.querySelector('.m') && !brp.measures.length) return;
    };
    const openMeasure = n => {
      const m = brp.measures.find(x => x.no === n), c = brp.categories.find(x => x.code === m.category), dr = document.getElementById('drawer');
      dr.querySelector('.panel').innerHTML = `<button class="x" aria-label="close">${ic('x')}</button><span class="chip n">${T('राहत', 'Measure')} ${num(m.no)} / ${num(18)} · ${m.category}. ${T(c.name_ne, c.name_en)}</span><h3>${T(m.title_ne, m.title_en)}</h3><div class="kv"><b>${T('कसलाई', 'Who')}</b><span>${m.who_ne}</span><b>${T('के सुविधा', 'Benefit')}</b><span>${m.benefit_ne}</span>${m.deadline_ne ? `<b>${T('समयसीमा', 'Deadline')}</b><span>${m.deadline_ne}</span>` : ''}<b>${T('कार्यान्वयन', 'Implemented by')}</b><span>${m.agency_ne}</span></div>${L === 'en' ? `<div class="note">${m.title_en} — detail text is published in Nepali as decided by the Cabinet.</div>` : ''}<div class="full"><b>${T('मन्त्रिपरिषद् निर्णयको व्यहोरा', 'Cabinet wording')}</b><br>${m.benefit_ne}</div>`;
      dr.classList.add('open'); dr.querySelector('.x').onclick = () => dr.classList.remove('open'); dr.onclick = e => { if (e.target === dr) dr.classList.remove('open'); };
    };
    draw();
    if (qp('m')) setTimeout(() => openMeasure(+qp('m')), 60);
  };

  PAGES.contact = () => {
    const M = D.ministry;
    document.getElementById('main').innerHTML = `<div class="wrap stack">
<div class="ph"><div><h1>${T('रसुवा बाढी राहत संकलन एकद्वार प्रणाली — सम्पर्क विवरण', 'Single-window system for Rasuwa flood relief collection — contact details')}</h1><p>${T(D.contact_intro_ne, D.contact_intro_en)}</p></div></div>
<section class="card">${sec('people', 'समन्वयका लागि सम्पर्क व्यक्ति', 'Contact persons for coordination', T('अर्थ मन्त्रालय · ' + num(D.contacts.length) + ' सम्पर्क', 'Ministry of Finance · ' + num(D.contacts.length) + ' contacts'))}
 <div class="filters"><input id="cq" type="search" placeholder="${T('सम्पर्क खोज्नुहोस् — नाम, पद, समूह…', 'Search contacts — name, title, group…')}" aria-label="search contacts"></div>
 <div class="tscroll"><table class="tbl" id="ctbl"><thead><tr><th>${T('क्र.', '#')}</th><th>${T('समन्वय समूह', 'Coordination group')}</th><th>${T('पद', 'Designation')}</th><th>${T('नाम', 'Name')}</th><th>${T('सम्पर्क नम्बर', 'Phone')}</th></tr></thead><tbody>${D.contacts.map((c, i) => `<tr><td>${num(i + 1)}</td><td>${T(c.group_ne, c.group_en)}</td><td>${T(c.title_ne, c.title_en)}</td><td class="nm">${T(c.name_ne, c.name_en)}<br><span style="font-size:12.5px;color:var(--mute);font-weight:400">${T(c.name_en, c.name_ne)}</span></td><td><a class="tel" href="tel:+977${c.phone}">${ic('phone')} ${c.phone}</a></td></tr>`).join('')}</tbody></table></div></section>
<section class="grid g64">
 <div class="card">${sec('bank', M.name_ne, M.name_en, T('आधिकारिक ठेगाना तथा सम्पर्क', 'Official address and contact details'))}<div class="addr"><div><span class="av">${ic('pin')}</span><div><b>${T(M.address_ne, M.address_en)}</b><span>${T(M.address_en, M.address_ne)}</span></div></div><div><span class="av">${ic('phone')}</span><div><b>${M.phones.join(' · ')}</b><span>${T('कार्यालय समय: आइतबार–शुक्रबार, बिहान १०:०० देखि साँझ ५:०० बजेसम्म', 'Office hours: Sunday to Friday, 10:00 AM to 5:00 PM')}</span></div></div><div><span class="av">${ic('mail')}</span><div><b>${M.emails.join(' · ')}</b><span>${T('आधिकारिक पत्राचारका लागि इमेल', 'Email for official correspondence')}</span></div></div><div><span class="av">${ic('link')}</span><div><b>mof.gov.np · donate.gov.np</b><span>${T('अर्थ मन्त्रालयको आधिकारिक वेबसाइट तथा प्रधानमन्त्री दैवी प्रकोप उद्धार कोषको सहयोग पोर्टल', 'Official website of the Ministry of Finance and the donation portal of the Prime Minister Disaster Relief Fund')}</span></div></div></div>
  <div class="map"><iframe title="Singha Durbar map" src="https://www.openstreetmap.org/export/embed.html?bbox=85.3155%2C27.6960%2C85.3285%2C27.7030&layer=mapnik&marker=27.6995%2C85.3220" loading="lazy"></iframe></div></div>
 <div class="card">${sec('mail', 'सन्देश पठाउनुहोस्', 'Send a message', T('समन्वय सम्बन्धी सोधपुछका लागि', 'For coordination enquiries'))}<form class="form" onsubmit="event.preventDefault();this.querySelector('.note').textContent='${T('धन्यवाद — तपाईंको सन्देश प्राप्त भयो। सम्बन्धित अधिकारीले सम्पर्क गर्नुहुनेछ।', 'Thank you — your message has been received. The concerned officer will contact you.')}'"><input required placeholder="${T('नाम / संस्थाको नाम', 'Name / name of organisation')}"><input required placeholder="${T('इमेल वा फोन नम्बर', 'Email or phone number')}"><select><option>${T('विषय: सहयोग गर्न चाहन्छु', 'Subject: I wish to contribute')}</option><option>${T('विषय: वैदेशिक सहयोग समन्वय', 'Subject: Foreign assistance coordination')}</option><option>${T('विषय: तथ्याङ्क सच्याउन अनुरोध', 'Subject: Request for data correction')}</option><option>${T('विषय: अन्य', 'Subject: Other')}</option></select><textarea required placeholder="${T('तपाईंको सन्देश यहाँ लेख्नुहोस्…', 'Write your message here…')}"></textarea><button class="btn red" type="submit">${ic('mail')} ${T('सन्देश पठाउनुहोस्', 'Send message')}</button><div class="note">${T('कोषमा सहयोग गर्न सिधै donate.gov.np प्रयोग गर्नुहोस्। यो फारम समन्वय सम्बन्धी सोधपुछका लागि मात्र हो।', 'To contribute to the Fund, please use donate.gov.np directly. This form is for coordination enquiries only.')}</div></form></div>
</section></div>`;
    document.getElementById('cq').oninput = e => { const q = e.target.value.toLowerCase(); document.querySelectorAll('#ctbl tbody tr').forEach(r => r.style.display = !q || r.textContent.toLowerCase().includes(q) ? '' : 'none'); };
  };

  /* ---------- render ---------- */
  function fitNumbers() {
    document.querySelectorAll('.kpi .v, .total b, .feat .big').forEach(el => {
      el.style.fontSize = ''; let fs = parseFloat(getComputedStyle(el).fontSize); let n = 0;
      while (el.scrollWidth > el.clientWidth + 1 && fs > 15 && n++ < 20) { fs -= 1; el.style.fontSize = fs + 'px'; }
    });
  }
  window.addEventListener('resize', () => { clearTimeout(window.__fit); window.__fit = setTimeout(fitNumbers, 120); });
  function render() {
    const nv = NAV.find(n => n[0].split('.')[0] === page) || ['', '', ''];
    document.title = T(nv[1], nv[2]) + ' — ' + T(D.meta.portal_ne, D.meta.portal_en) + ' | ' + T('अर्थ मन्त्रालय, नेपाल सरकार', 'Ministry of Finance, Government of Nepal');
    const md = document.querySelector('meta[name=description]'); if (md) md.content = T('रसुवा–भोटेकोशी बाढीका लागि प्रधानमन्त्री दैवी प्रकोप उद्धार कोषमा प्राप्त सहयोग, वैदेशिक सहयोग, उद्धार तथा सरकारका पहलको अर्थ मन्त्रालयको आधिकारिक अद्यावधिक।', 'Official Ministry of Finance update on contributions received by the Prime Minister Disaster Relief Fund, foreign assistance, rescue data and government initiatives for the Rasuwa–Bhotekoshi flood.');
    header(); (PAGES[page] || (() => {}))(); footer(); fitNumbers(); countUp(); document.fonts && document.fonts.ready.then(fitNumbers);
    document.querySelectorAll('.mini i').forEach(i => { const w = i.style.width; if (!STATIC) { i.style.width = '0'; requestAnimationFrame(() => setTimeout(() => i.style.width = w, 30)); } });
  }
  render();
  window.RFU = { setLang, TOT };
})();
