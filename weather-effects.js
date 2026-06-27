/**
 * weather-effects.js
 * Handles all visual weather effects: rain (drizzle / moderate / heavy),
 * snow, thunder/lightning, stars (clear night), clouds, and fog.
 * Add <canvas id="weatherCanvas"></canvas> and
 * <div id="lightningOverlay"></div> to index.html (before </body>),
 * then load this script AFTER script.js.
 *
 * Public API:
 *   WeatherEffects.set(theme)   — call whenever the theme changes
 *   WeatherEffects.stop()       — tear down everything
 */

const WeatherEffects = (() => {
    const canvas = document.getElementById('weatherCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const lightningOverlay = document.getElementById('lightningOverlay');

    let animFrame = null;
    let particles = [];
    let currentTheme = null;
    let lightningTimer = null;

    // ── Resize canvas to fill viewport ──────────────────────────────────────
    function resizeCanvas() {
        if (!canvas) return;
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ── Particle factory ────────────────────────────────────────────────────
    function makeRaindrop(intensity) {
        // intensity: 'drizzle' | 'moderate' | 'heavy'
        const configs = {
            drizzle:  { speedY: [2, 4],   speedX: [-0.3, 0.3], len: [6, 12],  width: 0.8, alpha: [0.25, 0.45] },
            moderate: { speedY: [6, 11],  speedX: [-1,   1],   len: [12, 22], width: 1.2, alpha: [0.35, 0.6]  },
            heavy:    { speedY: [14, 22], speedX: [-3,  -1],   len: [22, 38], width: 1.6, alpha: [0.5,  0.8]  },
        };
        const c = configs[intensity] || configs.moderate;
        const rand = (a, b) => a + Math.random() * (b - a);
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            speedY: rand(...c.speedY),
            speedX: rand(...c.speedX),
            len:    rand(...c.len),
            width:  c.width,
            alpha:  rand(...c.alpha),
            type:   'rain',
        };
    }

    function makeSnowflake() {
        return {
            x:      Math.random() * canvas.width,
            y:      Math.random() * canvas.height - canvas.height,
            r:      1 + Math.random() * 4,
            speedY: 0.6 + Math.random() * 1.4,
            speedX: (Math.random() - 0.5) * 0.6,
            drift:  (Math.random() - 0.5) * 0.015,
            alpha:  0.5 + Math.random() * 0.5,
            type:   'snow',
        };
    }

    // ── Count helpers ───────────────────────────────────────────────────────
    function targetCount(theme) {
        const map = {
            drizzle:    120,
            rain:       280,
            'heavy-rain': 520,
            thunder:    480,
            snow:       200,
        };
        return map[theme] || 0;
    }

    // ── Spawn ───────────────────────────────────────────────────────────────
    function spawnParticle(theme) {
        if (theme === 'snow') return makeSnowflake();
        if (theme === 'drizzle')    return makeRaindrop('drizzle');
        if (theme === 'rain')       return makeRaindrop('moderate');
        if (theme === 'heavy-rain') return makeRaindrop('heavy');
        if (theme === 'thunder')    return makeRaindrop('heavy');
        return null;
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    function drawRaindrop(p) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = currentTheme === 'drizzle'
            ? `rgba(160,200,255,${p.alpha})`
            : `rgba(140,185,255,${p.alpha})`;
        ctx.lineWidth = p.width;
        ctx.lineCap  = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.speedX * (p.len / p.speedY), p.y + p.len);
        ctx.stroke();
        ctx.restore();
    }

    function drawSnowflake(p) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = '#e8f0ff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── Splash on ground ─────────────────────────────────────────────────────
    function drawSplash(p) {
        if (currentTheme === 'drizzle') return; // no splashes for light drizzle
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = 'rgba(140,185,255,0.6)';
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        ctx.ellipse(p.x, canvas.height - 2, p.len * 0.4, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // ── Update particle ──────────────────────────────────────────────────────
    function updateParticle(p) {
        if (p.type === 'snow') {
            p.speedX += p.drift;
            p.speedX  = Math.max(-1, Math.min(1, p.speedX));
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.y > canvas.height + 10) {
                Object.assign(p, makeSnowflake());
                p.y = -10;
            }
        } else {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.y > canvas.height) {
                drawSplash(p);
                const fresh = spawnParticle(currentTheme);
                if (fresh) Object.assign(p, fresh);
                p.y = -20;
            }
        }
    }

    // ── Main loop ────────────────────────────────────────────────────────────
    function loop() {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Maintain particle count
        const target = targetCount(currentTheme);
        while (particles.length < target) {
            const p = spawnParticle(currentTheme);
            if (!p) break;
            p.y = Math.random() * canvas.height; // scatter on load
            particles.push(p);
        }

        particles.forEach(p => {
            updateParticle(p);
            if (p.type === 'snow') drawSnowflake(p);
            else                   drawRaindrop(p);
        });

        animFrame = requestAnimationFrame(loop);
    }

    // ── Lightning flash ───────────────────────────────────────────────────────
    function scheduleLightning() {
        if (!lightningOverlay) return;
        const delay = 2500 + Math.random() * 5000;
        lightningTimer = setTimeout(() => {
            if (currentTheme !== 'thunder') return;
            // Quick double-flash
            lightningOverlay.style.opacity = '1';
            setTimeout(() => {
                lightningOverlay.style.opacity = '0';
                setTimeout(() => {
                    lightningOverlay.style.opacity = '0.7';
                    setTimeout(() => {
                        lightningOverlay.style.opacity = '0';
                        scheduleLightning();
                    }, 80);
                }, 60);
            }, 70);
        }, delay);
    }

    // ── DOM decorations (stars, clouds, fog) ──────────────────────────────────
    let decorNodes = [];

    function clearDecor() {
        decorNodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
        decorNodes = [];
    }

    function addStars() {
        for (let i = 0; i < 120; i++) {
            const s = document.createElement('div');
            s.className = 'star';
            const size = 0.8 + Math.random() * 2.2;
            s.style.cssText = `
                width:${size}px; height:${size}px;
                top:${Math.random() * 85}vh;
                left:${Math.random() * 100}vw;
                --dur:${2 + Math.random() * 4}s;
                --delay:${Math.random() * 4}s;
                --min-op:${0.1 + Math.random() * 0.2};
                --max-op:${0.6 + Math.random() * 0.4};
            `;
            document.body.appendChild(s);
            decorNodes.push(s);
        }
    }

    function addClouds() {
        for (let i = 0; i < 6; i++) {
            const c = document.createElement('div');
            c.className = 'cloud-puff';
            const size = 120 + Math.random() * 200;
            c.style.cssText = `
                width:${size}px; height:${size * 0.6}px;
                top:${5 + Math.random() * 35}vh;
                left:-${size}px;
                --dur:${35 + Math.random() * 30}s;
                --delay:-${Math.random() * 35}s;
                filter: blur(${20 + Math.random() * 20}px);
                opacity: ${0.4 + Math.random() * 0.3};
            `;
            document.body.appendChild(c);
            decorNodes.push(c);
        }
    }

    function addFog() {
        for (let i = 0; i < 5; i++) {
            const f = document.createElement('div');
            f.className = 'fog-layer';
            f.style.cssText = `
                top:${10 + i * 18}vh;
                --dur:${20 + Math.random() * 20}s;
                --delay:-${Math.random() * 20}s;
                opacity: ${0.4 + Math.random() * 0.4};
            `;
            document.body.appendChild(f);
            decorNodes.push(f);
        }
    }

    // ── Public: set theme ─────────────────────────────────────────────────────
    function set(theme) {
        if (theme === currentTheme) return;
        stop();
        currentTheme = theme;

        // Canvas-based effects
        const canvasThemes = ['drizzle', 'rain', 'heavy-rain', 'thunder', 'snow'];
        if (canvasThemes.includes(theme)) {
            if (canvas) canvas.style.display = 'block';
            loop();
            if (theme === 'thunder') scheduleLightning();
        } else {
            if (canvas) canvas.style.display = 'none';
        }

        // DOM decorations
        if (theme === 'clear-night') addStars();
        if (theme === 'clouds')      addClouds();
        if (theme === 'fog')         addFog();
    }

    // ── Public: stop ─────────────────────────────────────────────────────────
    function stop() {
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
        if (lightningTimer) { clearTimeout(lightningTimer); lightningTimer = null; }
        if (lightningOverlay) lightningOverlay.style.opacity = '0';
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles = [];
        clearDecor();
        currentTheme = null;
    }

    return { set, stop };
})();