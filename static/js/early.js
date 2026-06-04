/**
 * early.js — "Too Early" page logic
 * Cat face with eyes that follow the mouse cursor.
 * Uses CatDrawer.drawWithTrackingEyes (head only).
 */
(function() {
    const canvas = document.getElementById('earlyCatCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let mouseX = 175;
    let mouseY = 175;
    let animFrame = null;

    // Set canvas size with DPI awareness
    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse/touch position relative to canvas
    function updateMouse(e) {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) {
            mouseX = e.touches[0].clientX - rect.left;
            mouseY = e.touches[0].clientY - rect.top;
        } else {
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        }
    }

    document.addEventListener('mousemove', updateMouse);
    document.addEventListener('touchmove', updateMouse, { passive: true });

    // Animation loop — draw cat head with tracking eyes
    function draw() {
        const rect = canvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.clearRect(0, 0, w, h);

        const centerX = w / 2;
        const centerY = h / 2 + 10;
        const scale = Math.min(w, h) / 130;

        CatDrawer.drawWithTrackingEyes(ctx, centerX, centerY, scale, mouseX, mouseY);

        animFrame = requestAnimationFrame(draw);
    }

    // Add gentle floating background flowers
    function createBgFlowers() {
        const container = document.getElementById('bgFlowers');
        if (!container) return;

        const flowers = ['🌸', '🌼', '🌺', '💮', '🌷', '✿', '❀'];
        const count = 12;

        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'bg-flower';
            el.textContent = flowers[Math.floor(Math.random() * flowers.length)];
            el.style.left = Math.random() * 100 + '%';
            el.style.top = Math.random() * 100 + '%';
            el.style.fontSize = (Math.random() * 1.5 + 0.8) + 'rem';
            el.style.animationDuration = (Math.random() * 6 + 6) + 's';
            el.style.animationDelay = (Math.random() * 4) + 's';
            container.appendChild(el);
        }
    }

    createBgFlowers();
    draw();
})();
