/* 你为什么不睡觉？ —— 点击后：闪电 + 雷声 + 揭晓答案 */
(function () {
  'use strict';

  var canvas = document.getElementById('rain');
  var ctx = canvas.getContext('2d');
  var flashEl = document.getElementById('flash');
  var boltEl = document.getElementById('bolt');
  var btn = document.getElementById('btn');
  var btnText = document.getElementById('btnText');
  var answer = document.getElementById('answer');
  var revealed = false;

  /* ---------- 雨 ---------- */
  var drops = [];
  var w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildDrops();
  }

  function buildDrops() {
    var count = Math.round(Math.min(Math.max(w * h / 9000, 70), 260));
    drops = [];
    for (var i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 10 + Math.random() * 22,
        speed: 5 + Math.random() * 9,
        alpha: 0.10 + Math.random() * 0.35,
        wind: 0.9 + Math.random() * 0.8
      });
    }
  }

  function drawRain() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(170, 200, 255, ' + d.alpha + ')';
      ctx.lineWidth = 1.1;
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.wind * 1.6, d.y + d.len);
      ctx.stroke();

      d.y += d.speed;
      d.x -= d.wind * 0.55;

      if (d.y > h + 30) {
        d.y = -30 - Math.random() * 80;
        d.x = Math.random() * (w + 120);
      }
      if (d.x < -40) d.x = w + Math.random() * 40;
    }
    requestAnimationFrame(drawRain);
  }

  /* ---------- 音效（纯代码合成，无需音频文件） ---------- */
  var audioCtx = null;

  function getAudio() {
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { return null; }
    return audioCtx;
  }

  function noiseBuffer(ac, seconds) {
    var len = Math.floor(ac.sampleRate * seconds);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* 雷声：一声炸裂 + 一段低沉轰鸣 */
  function thunder() {
    var ac = getAudio();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();

    var t0 = ac.currentTime;

    // 炸裂（短、亮）
    var crack = ac.createBufferSource();
    crack.buffer = noiseBuffer(ac, 0.35);
    var crackHP = ac.createBiquadFilter();
    crackHP.type = 'highpass';
    crackHP.frequency.value = 1400;
    var crackGain = ac.createGain();
    crackGain.gain.setValueAtTime(0.0001, t0);
    crackGain.gain.exponentialRampToValueAtTime(0.5, t0 + 0.012);
    crackGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
    crack.connect(crackHP).connect(crackGain).connect(ac.destination);
    crack.start(t0);
    crack.stop(t0 + 0.4);

    // 轰鸣（低、长、慢慢滚走）
    var rumble = ac.createBufferSource();
    rumble.buffer = noiseBuffer(ac, 3.2);
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(420, t0);
    lp.frequency.exponentialRampToValueAtTime(90, t0 + 3.0);
    var rumbleGain = ac.createGain();
    rumbleGain.gain.setValueAtTime(0.0001, t0 + 0.02);
    rumbleGain.gain.exponentialRampToValueAtTime(0.42, t0 + 0.35);
    rumbleGain.gain.exponentialRampToValueAtTime(0.16, t0 + 1.2);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
    rumble.connect(lp).connect(rumbleGain).connect(ac.destination);
    rumble.start(t0 + 0.02);
    rumble.stop(t0 + 3.3);
  }

  /* ---------- 闪电 ---------- */
  function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth; // 强制重排以重放动画
    el.classList.add(cls);
  }

  function lightning(strength) {
    restart(flashEl, 'on');
    if (strength > 0.5) restart(boltEl, 'on');
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');
    setTimeout(function () { document.body.classList.remove('shake'); }, 700);
  }

  /* ---------- 揭晓 ---------- */
  function reveal() {
    if (revealed) return;
    revealed = true;

    btn.classList.add('clicked');
    btnText.textContent = '……';
    btn.setAttribute('aria-disabled', 'true');
    btn.blur();

    // 先闪一下，再打雷，雷声稍慢半拍更像真的
    lightning(1);
    setTimeout(function () { thunder(); }, 260);

    // 雷声未落，答案已经出现
    setTimeout(function () { answer.classList.add('show'); }, 520);
    setTimeout(function () { btnText.textContent = '好吧，我去睡了'; }, 1400);
  }

  btn.addEventListener('click', reveal);
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  resize();
  drawRain();
})();
