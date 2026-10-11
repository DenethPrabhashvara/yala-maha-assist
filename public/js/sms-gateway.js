/**
 * Yala-Maha Assist · SMS Gateway Module
 * --------------------------------------
 * Manages SMS composition, character & multi-segment GSM/Unicode calculation,
 * trilingual templates, outbound broadcast dispatch, and audit history log.
 */

const SMS_TEMPLATES = [
  ['Water release', {
    en: 'Water release scheduled Thursday 6:00 AM. Tank C sluice open for 4 hours. — ',
    ta: 'நீர் திறப்பு வியாழன் காலை 6:00. தொட்டி C 4 மணி நேரம் திறந்திருக்கும்.',
    si: 'බ්‍රහස්පතින්දා උදේ 6:00ට ජලය මුදා හැරේ. C වැව් දොරටුව පැය 4ක් විවෘතව පවතී.'
  }],
  ['Low level alert', {
    en: 'Low level alert: Kudawewa below 20%. Please conserve water. — ',
    ta: 'குறைந்த நீர் எச்சரிக்கை: குடாவெவ 20%க்குக் கீழே. தயவுசெய்து நீரைச் சேமிக்கவும்.',
    si: 'අඩු ජල මට්ටම: කුඩාවැව 20%ට අඩුයි. කරුණාකර ජලය ඉතිරි කරන්න.'
  }],
  ['Rain warning', {
    en: 'Rain warning: heavy rain expected Friday. Delay paddy transplanting. — ',
    ta: 'மழை எச்சரிக்கை: வெள்ளிக்கிழமை கனமழை எதிர்பார்க்கப்படுகிறது. நெல் நடவைத் தாமදப்படுத்தவும்.',
    si: 'වැසි අනතුරු ඇඟවීම: සිකුරාදා අධික වැසි අපේක්ෂිතයි. වී පැළ සිටුවීම ප්‍රමාද කරන්න.'
  }],
  ['Canal maintenance', {
    en: 'Canal maintenance on Sluice A tomorrow. Water may be reduced. — ',
    ta: 'நாளை மதகு A கால்வாய் பராமரிப்பு. நீர் குறைவாக இருக்கலாம்.',
    si: 'හෙට A දොරටුවේ ඇළ නඩත්තුව. ජලය අඩු විය හැක.'
  }]
];

const smsState = {
  group: 'Downstream',
  lang: 'en',
  templateIdx: 0
};

const SMS_RECIPIENT_COUNTS = {
  Upstream: 388,
  Downstream: 412,
  All: 1240
};

const smsHistory = [
  ['Today 6:05 AM', 'Downstream', 'Water release Thu 6:00 AM at Tank C', '412', 'ok', 'Delivered'],
  ['Today 5:45 AM', 'All', 'Low level alert: Kudawewa below 20%', '1,240', 'am', 'Pending'],
  ['Yesterday', 'Upstream', 'Sluice A maintenance window notice', '388', 'ok', 'Delivered'],
  ['Yesterday', 'Downstream', 'Rain forecast update: 18.5 mm expected', '412', 'bd', 'Failed (4)']
];

function initSmsGateway() {
  const tpContainer = $('#tp');
  if (tpContainer) {
    tpContainer.innerHTML = SMS_TEMPLATES.map((t, i) => `
      <button data-t="${i}" class="${i === 0 ? 'on' : ''}">
        ${ico.tag || ''}${t[0]}
      </button>
    `).join('');
  }

  // Bind group segmented buttons
  const grpEl = $('#grp');
  if (grpEl) {
    grpEl.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      smsState.group = b.dataset.g;
      $$('#grp button').forEach(x => x.classList.toggle('on', x === b));
      updateSmsMetrics();
    };
  }

  // Bind language segmented buttons
  const lgEl = $('#lg');
  if (lgEl) {
    lgEl.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      smsState.lang = b.dataset.l;
      $$('#lg button').forEach(x => x.classList.toggle('on', x === b));
      applySmsTemplate();
    };
  }

  // Delivery time buttons
  const dtEl = $('#dt');
  if (dtEl) {
    dtEl.onclick = e => {
      const b = e.target.closest('button');
      if (b) $$('#dt button').forEach(x => x.classList.toggle('on', x === b));
    };
  }

  // Template selector
  if (tpContainer) {
    tpContainer.onclick = e => {
      const b = e.target.closest('button');
      if (!b) return;
      smsState.templateIdx = +b.dataset.t;
      applySmsTemplate();
    };
  }

  // Message input typing
  const msgEl = $('#msg');
  if (msgEl) {
    msgEl.oninput = updateSmsMetrics;
  }

  // Action buttons
  const sdBtn = $('#sd');
  if (sdBtn) sdBtn.onclick = () => toast('Draft saved');

  const sbBtn = $('#sb');
  if (sbBtn) {
    sbBtn.onclick = () => {
      const msg = ($('#msg') ? $('#msg').value : '').trim();
      if (!msg) {
        toast('Write a message first');
        return;
      }
      const count = SMS_RECIPIENT_COUNTS[smsState.group] || 412;
      const previewText = msg.slice(0, 38) + (msg.length > 38 ? '…' : '');
      addSmsHistoryEntry(['Just now', smsState.group, previewText, String(count), 'am', 'Pending']);
      toast(`Broadcast queued for ${count.toLocaleString()} farmers`);
    };
  }

  drawSmsHistory();
  applySmsTemplate();
}

function updateSmsMetrics() {
  const msgEl = $('#msg');
  if (!msgEl) return;

  const m = msgEl.value;
  const isUnicode = smsState.lang !== 'en';
  const lim = isUnicode ? 70 : 160;
  const sg = Math.max(1, Math.ceil(m.length / lim));
  const n = SMS_RECIPIENT_COUNTS[smsState.group] || 412;

  const cntEl = $('#cnt');
  if (cntEl) cntEl.textContent = `${m.length} / ${lim} characters`;

  const segEl = $('#seg');
  if (segEl) segEl.textContent = `${sg} SMS segment${sg > 1 ? 's' : ''}`;

  if ($('#s1')) $('#s1').textContent = n.toLocaleString();
  if ($('#s2')) $('#s2').textContent = sg;
  if ($('#s3')) $('#s3').textContent = (n * sg).toLocaleString();
  if ($('#rc')) $('#rc').textContent = n.toLocaleString();
  if ($('#rb')) $('#rb').textContent = `${n.toLocaleString()} recipients`;
}

function applySmsTemplate() {
  const msgEl = $('#msg');
  if (!msgEl) return;

  const tObj = SMS_TEMPLATES[smsState.templateIdx];
  if (tObj && tObj[1] && tObj[1][smsState.lang]) {
    msgEl.value = tObj[1][smsState.lang];
  }

  $$('#tp button').forEach((b, i) => b.classList.toggle('on', i === smsState.templateIdx));

  // Render previews in 3 languages
  const pvEl = $('#pv');
  if (pvEl && tObj) {
    pvEl.innerHTML = [
      ['English', 'en'],
      ['தமிழ்', 'ta'],
      ['Sinhala', 'si']
    ].map(([n, k]) => `
      <div>
        <div class="small" style="color:var(--ink);font-weight:600">${n}</div>
        <div class="bub" lang="${k}">${(tObj[1][k] || '').replace(' — CascadeNet', '')}</div>
        <div class="cap" style="text-transform:none">Yala-Maha Assist · now</div>
      </div>
    `).join('');
  }

  updateSmsMetrics();
}

function drawSmsHistory() {
  const histEl = $('#hist');
  if (!histEl) return;

  histEl.innerHTML = smsHistory.map(r => `
    <tr>
      <td>${r[0]}</td>
      <td>${r[1]}</td>
      <td>${r[2]}</td>
      <td>${r[3]}</td>
      <td><span class="pill ${r[4]}" style="text-transform:none;font-size:11px">${r[5]}</span></td>
    </tr>
  `).join('');
}

function addSmsHistoryEntry(entry) {
  smsHistory.unshift(entry);
  drawSmsHistory();
}
