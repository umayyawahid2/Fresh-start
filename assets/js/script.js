/**
 * Project: Fresh Start 💌 - Step-by-Step Multi-Screen Story Engine
 */

// Global State
let currentStep = 1;
const totalSteps = 7;
let currentGauge = 10;
let soundEnabled = true;
let runawayAttempts = 0;
let audioCtx = null;
let claimedItems = []; // Array of { title, icon, time }

// Initialize Web Audio API
function getAudioContext() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Web Audio SFX Generator
function playSound(type) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'chime') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.1);
            osc.frequency.setValueAtTime(783.99, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'fanfare') {
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((freq, index) => {
                const subOsc = ctx.createOscillator();
                const subGain = ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(freq, now + index * 0.08);
                subGain.gain.setValueAtTime(0.15, now + index * 0.08);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.4);
                subOsc.connect(subGain);
                subGain.connect(ctx.destination);
                subOsc.start(now + index * 0.08);
                subOsc.stop(now + index * 0.08 + 0.4);
            });
        } else if (type === 'bounce') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        }
    } catch (e) {
        console.warn('Audio playback suppressed', e);
    }
}

// Toggle Sound Mute
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
        btn.innerText = soundEnabled ? '🔊 Sound On' : '🔇 Muted';
        btn.classList.toggle('bg-rose-100', soundEnabled);
        btn.classList.toggle('text-rose-600', soundEnabled);
        btn.classList.toggle('bg-slate-200', !soundEnabled);
        btn.classList.toggle('text-slate-600', !soundEnabled);
    }
    if (soundEnabled) playSound('pop');
}

// Step Navigation Controller
function goToStep(targetStep, direction = 'next') {
    if (targetStep < 1 || targetStep > totalSteps) return;

    playSound('pop');

    const prevStepEl = document.getElementById(`step-${currentStep}`);
    const nextStepEl = document.getElementById(`step-${targetStep}`);

    if (prevStepEl && nextStepEl) {
        prevStepEl.classList.remove('active', 'animate-slide-in-right', 'animate-slide-in-left');
        prevStepEl.style.display = 'none';

        nextStepEl.style.display = 'block';
        nextStepEl.classList.add('active');
        
        if (direction === 'next') {
            nextStepEl.classList.add('animate-slide-in-right');
        } else {
            nextStepEl.classList.add('animate-slide-in-left');
        }
    }

    currentStep = targetStep;

    if (currentStep === 6) {
        renderPendingCoupons();
    }

    updateStepUI();

    const stepGaugeMin = { 1: 10, 2: 25, 3: 40, 4: 60, 5: 75, 6: 90, 7: 100 };
    if (currentGauge < stepGaugeMin[currentStep]) {
        updateGauge(stepGaugeMin[currentStep] - currentGauge);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep() {
    if (currentStep < totalSteps) {
        goToStep(currentStep + 1, 'next');
    }
}

function prevStep() {
    if (currentStep > 1) {
        goToStep(currentStep - 1, 'prev');
    }
}

// Update Step Indicators and Nav Bar
function updateStepUI() {
    const stepBadge = document.getElementById('step-indicator-badge');
    if (stepBadge) {
        stepBadge.innerText = `Step ${currentStep} of ${totalSteps}`;
    }

    for (let i = 1; i <= totalSteps; i++) {
        const dot = document.getElementById(`step-dot-${i}`);
        if (dot) {
            if (i === currentStep) {
                dot.className = 'w-4 h-2 rounded-full bg-rose-500 transition-all duration-300';
            } else if (i < currentStep) {
                dot.className = 'w-2 h-2 rounded-full bg-rose-300 transition-all duration-300';
            } else {
                dot.className = 'w-2 h-2 rounded-full bg-rose-200 transition-all duration-300';
            }
        }
    }

    const prevBtn = document.getElementById('global-prev-btn');
    if (prevBtn) {
        if (currentStep === 1) {
            prevBtn.classList.add('opacity-0', 'pointer-events-none');
        } else {
            prevBtn.classList.remove('opacity-0', 'pointer-events-none');
        }
    }
}

// Update Forgiveness Gauge
function updateGauge(amount) {
    currentGauge = Math.min(100, currentGauge + amount);
    const gaugeBar = document.getElementById('gauge');
    const gaugeText = document.getElementById('gauge-text');
    const gaugeStatus = document.getElementById('gauge-status-badge');

    if (gaugeBar && gaugeText) {
        gaugeBar.style.width = currentGauge + '%';
        gaugeText.innerText = currentGauge + '%';
    }

    if (gaugeStatus) {
        if (currentGauge < 35) {
            gaugeStatus.innerText = 'Cold Shoulders 🧊';
            gaugeStatus.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 transition-all';
        } else if (currentGauge < 65) {
            gaugeStatus.innerText = 'Warming Up ☕';
            gaugeStatus.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 transition-all';
        } else if (currentGauge < 95) {
            gaugeStatus.innerText = 'Warm & Cozy 🧸';
            gaugeStatus.className = 'text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 transition-all';
        } else {
            gaugeStatus.innerText = 'Fully Forgiven! ❤️';
            gaugeStatus.className = 'text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse transition-all';
        }
    }
}

// Claim Peace Offering Coupons
function claimCoupon(btn, title, icon) {
    playSound('chime');

    btn.classList.add('opacity-75', 'border-emerald-400', 'bg-emerald-50/70');
    btn.classList.remove('hover:bg-rose-50', 'border-rose-300');

    const badge = btn.querySelector('.coupon-badge');
    if (badge) {
        badge.innerText = 'Claimed! ✨';
        badge.classList.replace('bg-rose-100', 'bg-emerald-100');
        badge.classList.replace('text-rose-600', 'text-emerald-700');
    }

    if (!claimedItems.some(item => item.title === title)) {
        claimedItems.push({ title, icon, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    }

    btn.onclick = null;

    if (typeof confetti === 'function') {
        const rect = btn.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({
            particleCount: 35,
            spread: 60,
            origin: { x, y }
        });
    }

    updateGauge(10);
}

// Playful Escaping Button Logic
function dodgeRunawayButton() {
    const btn = document.getElementById('runaway-btn');
    if (!btn) return;

    playSound('bounce');
    runawayAttempts++;

    const funnyLabels = [
        "Wait no! 🙈",
        "Don't click me! 🏃‍♂️",
        "Give me a chance 🥺",
        "Can't touch this 💖",
        "Okay fine, forgive! ❤️"
    ];

    if (runawayAttempts < funnyLabels.length) {
        btn.innerText = funnyLabels[runawayAttempts - 1];
        const offsetX = (Math.random() - 0.5) * 200;
        const offsetY = (Math.random() - 0.5) * 100;
        btn.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(0.95)`;
    } else {
        btn.innerText = funnyLabels[funnyLabels.length - 1];
        btn.classList.replace('bg-slate-200', 'bg-rose-500');
        btn.classList.replace('text-slate-700', 'text-white');
        btn.style.transform = 'translate(0, 0) scale(1.05)';
        btn.onmouseover = null;
        btn.onclick = forgive;
    }
}

// Trigger Forgiveness Decision & Proceed to Step 6
function forgive() {
    updateGauge(100);
    playSound('fanfare');

    if (typeof confetti === 'function') {
        confetti({
            particleCount: 160,
            spread: 90,
            origin: { y: 0.55 },
            colors: ['#f43f5e', '#fb7185', '#fda4af', '#fcd34d', '#34d399']
        });
    }

    goToStep(6, 'next');
}

// Trigger Ice Cream Request
function needIceCream() {
    playSound('chime');

    const title = 'Priority Ice Cream Delivery Treat 🍦';
    if (!claimedItems.some(item => item.title === title)) {
        claimedItems.push({
            title: title,
            icon: '🍦',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    showModal(
        '🍦',
        'Ice Cream Priority Order Added!',
        'Your ice cream demand has been logged into the official pending peace offerings list! Sweet treats are officially authorized to melt away any leftover grumpiness.'
    );
}

// Render Pending Coupons on Step 6
function renderPendingCoupons() {
    const listContainer = document.getElementById('pending-coupons-list');
    const countBadge = document.getElementById('pending-count-badge');

    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (countBadge) {
        countBadge.innerText = `${claimedItems.length} Item${claimedItems.length === 1 ? '' : 's'}`;
    }

    if (claimedItems.length === 0) {
        listContainer.innerHTML = `
            <div class="p-4 rounded-2xl bg-rose-50/50 border border-dashed border-rose-200 text-center text-slate-500 text-xs">
                No custom coupons claimed yet, but 100% unconditional love & warm hugs are promised! 🧸
            </div>
        `;
        return;
    }

    claimedItems.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'pending-item-card p-3.5 rounded-2xl flex items-center justify-between gap-3 text-left';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${item.icon}</span>
                <div>
                    <span class="font-bold text-slate-800 text-xs sm:text-sm block">${item.title}</span>
                    <span class="text-[10px] text-slate-500">Claimed at ${item.time}</span>
                </div>
            </div>
            <span class="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                PENDING ⏳
            </span>
        `;
        listContainer.appendChild(div);
    });
}

// Toggle Certificate Print Button
function toggleCertificateLock() {
    const checkbox = document.getElementById('verify-coupons-checkbox');
    const printBtn = document.getElementById('print-certificate-btn');
    const lockNotice = document.getElementById('print-lock-notice');

    if (checkbox && printBtn) {
        if (checkbox.checked) {
            playSound('chime');
            printBtn.disabled = false;
            printBtn.className = 'btn-unlocked w-full font-extrabold py-3.5 rounded-2xl transition transform scale-105 flex items-center justify-center gap-2 cursor-pointer shadow-lg';
            printBtn.innerText = '🖨️ Print / Save Official Certificate';
            
            if (lockNotice) {
                lockNotice.innerText = '✨ Accepted! Certificate is unlocked for printing.';
                lockNotice.className = 'text-xs text-emerald-600 font-bold animate-pulse';
            }
        } else {
            playSound('pop');
            printBtn.disabled = true;
            printBtn.className = 'btn-locked w-full font-bold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 cursor-not-allowed opacity-60';
            printBtn.innerText = '🔒 Confirm Acceptance to Unlock Print';
            
            if (lockNotice) {
                lockNotice.innerText = '🔒 Check the box above to verify all offerings and unlock printing.';
                lockNotice.className = 'text-xs text-amber-700 font-medium';
            }
        }
    }
}

// Handle Print Certificate Click
function printCertificate() {
    const checkbox = document.getElementById('verify-coupons-checkbox');
    if (!checkbox || !checkbox.checked) {
        playSound('bounce');
        showModal('🔒', 'Verification Required', 'Please check the box confirming acceptance of the peace offerings before printing!');
        return;
    }
    
    const dateEl = document.getElementById('pact-date');
    if (dateEl) {
        dateEl.innerText = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const certModal = document.getElementById('certificate-modal');
    if (certModal) {
        certModal.classList.remove('hidden');
    }
}

// Trigger Grand Happy Ending Finale Scene
function triggerHappyEnding() {
    playSound('fanfare');

    if (typeof confetti === 'function') {
        const end = Date.now() + 3 * 1000;
        const interval = setInterval(() => {
            if (Date.now() > end) {
                return clearInterval(interval);
            }
            confetti({
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                origin: { x: Math.random(), y: Math.random() - 0.2 }
            });
        }, 250);
    }

    const loverName = document.getElementById('pact-lover-name')?.value || 'My Favorite Person';
    const apologizerName = document.getElementById('pact-apologizer-name')?.value || 'Me';

    document.getElementById('final-lover-display').innerText = loverName;
    document.getElementById('final-apologizer-display').innerText = apologizerName;

    const modal = document.getElementById('happy-ending-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Utility Modal Display
function showModal(emoji, title, body) {
    document.getElementById('modal-emoji').innerText = emoji;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerText = body;
    document.getElementById('modal').classList.remove('hidden');
}

function closeModal(modalId = 'modal') {
    playSound('pop');
    document.getElementById(modalId).classList.add('hidden');
}

// Canvas Floating Particle Engine
function initCanvasParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const colors = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#c084fc'];

    for (let i = 0; i < 35; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 12 + 6,
            speedY: Math.random() * 0.8 + 0.3,
            speedX: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.2,
            color: colors[Math.floor(Math.random() * colors.length)],
            isHeart: Math.random() > 0.4
        });
    }

    function drawHeart(x, y, size, color, opacity) {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + size, x, y + size);
        ctx.bezierCurveTo(x, y + size, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.y -= p.speedY;
            p.x += p.speedX;

            if (p.y < -20) {
                p.y = height + 20;
                p.x = Math.random() * width;
            }

            if (p.isHeart) {
                drawHeart(p.x, p.y, p.size, p.color, p.opacity);
            } else {
                ctx.save();
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        });
        requestAnimationFrame(animate);
    }
    animate();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initCanvasParticles();
    updateStepUI();
});