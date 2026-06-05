/**
 * main.js — Main birthday page logic
 * Handles: flower growth callback → text reveal → button interactions → cat peeking & stealing "No" button with paw
 */
(function() {
    // Elements
    const contentCard = document.getElementById('contentCard');
    const mainTitle = document.getElementById('mainTitle');
    const mainSubtitle = document.getElementById('mainSubtitle');
    const mainQuestion = document.getElementById('mainQuestion');
    const buttonsRow = document.getElementById('buttonsRow');
    const btnNo = document.getElementById('btnNo');
    const btnYes = document.getElementById('btnYes');
    const catArea = document.getElementById('catArea');
    const catCanvas = document.getElementById('catCanvas');
    const speechBubble = document.getElementById('speechBubble');

    let noButtonStolen = false;

    // ---- Initialize Flower Animation ----
    FlowerAnimation.init('flowersCanvas');

    // When flowers finish growing, reveal the text
    FlowerAnimation.onGrowthComplete = function() {
        // Show content card
        contentCard.style.transition = 'opacity 1s ease-out';
        contentCard.style.opacity = '1';

        // Stagger reveal of elements
        setTimeout(() => mainTitle.classList.add('visible'), 200);
        setTimeout(() => mainSubtitle.classList.add('visible'), 700);
        setTimeout(() => mainQuestion.classList.add('visible'), 1200);
        setTimeout(() => buttonsRow.classList.add('visible'), 1700);
    };

    FlowerAnimation.start();

    // Handle resize
    window.addEventListener('resize', () => {
        FlowerAnimation.resize();
    });

    // ---- Cat Canvas Setup ----
    const dpr = window.devicePixelRatio || 1;

    function setupCatCanvas(width, height) {
        catCanvas.width = width * dpr;
        catCanvas.height = height * dpr;
        catCanvas.style.width = width + 'px';
        catCanvas.style.height = height + 'px';
        const ctx = catCanvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return ctx;
    }

    // ---- "No" Button Click Handler ----
    btnNo.addEventListener('click', function(e) {
        e.preventDefault();

        if (noButtonStolen) return;

        const canvasW = 400;
        const canvasH = 250;
        const catCtx = setupCatCanvas(canvasW, canvasH);

        // Show the cat area
        catArea.classList.add('visible');

        // Phase 1: Cat peeks from below (head only)
        let peekProgress = 0;
        const catScale = 1.6;

        function animatePeek() {
            catCtx.clearRect(0, 0, canvasW, canvasH);

            CatDrawer.drawPeeking(
                catCtx,
                canvasW / 2,      // centerX
                canvasH,           // bottomY (bottom of canvas)
                catScale,
                peekProgress,      // revealAmount
                0, 0,
                'normal'
            );

            if (peekProgress < 1) {
                peekProgress += 0.025;
                requestAnimationFrame(animatePeek);
            } else {
                // Cat is peeking, show speech bubble
                speechBubble.classList.add('visible');

                // After speech, start paw stealing
                setTimeout(startPawSteal, 1200);
            }
        }

        function startPawSteal() {
            // Get button position relative to viewport
            const btnRect = btnNo.getBoundingClientRect();
            const catAreaRect = catArea.getBoundingClientRect();

            // The paw comes from the cat area (bottom of screen)
            // and reaches to the No button
            // We'll draw the paw on a separate overlay canvas
            const overlay = document.createElement('canvas');
            overlay.id = 'pawOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100vw; height: 100vh;
                pointer-events: none;
                z-index: 150;
            `;
            overlay.width = window.innerWidth * dpr;
            overlay.height = window.innerHeight * dpr;
            document.body.appendChild(overlay);
            const pawCtx = overlay.getContext('2d');
            pawCtx.scale(dpr, dpr);

            const startX = catAreaRect.left + catAreaRect.width / 2;
            const startY = window.innerHeight + 20;
            const endX = btnRect.left + btnRect.width / 2;
            const endY = btnRect.top + btnRect.height / 2;

            let pawProgress = 0;

            function animatePaw() {
                pawCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

                CatDrawer.drawStealingPaw(
                    pawCtx,
                    startX, startY,
                    endX, endY,
                    pawProgress,
                    1.1
                );

                if (pawProgress < 1) {
                    pawProgress += 0.015;

                    // When paw reaches the button (~0.45), start moving the button
                    if (pawProgress > 0.45 && pawProgress < 0.55) {
                        // Change cat expression to mischievous
                        catCtx.clearRect(0, 0, canvasW, canvasH);
                        CatDrawer.drawPeeking(catCtx, canvasW / 2, canvasH, catScale, 1, 0, 0, 'mischievous');
                        
                        // Leave a paw print!
                        if (!window.pawPrintLeft) {
                            window.pawPrintLeft = true;
                            const print = document.createElement('div');
                            print.innerHTML = '🐾';
                            print.style.position = 'fixed';
                            print.style.left = endX + 'px';
                            print.style.top = endY + 'px';
                            print.style.fontSize = '3rem';
                            print.style.opacity = '0.4';
                            print.style.transform = `translate(-50%, -50%) rotate(-15deg)`;
                            print.style.zIndex = '130';
                            print.style.pointerEvents = 'none';
                            document.body.appendChild(print);
                        }
                    }

                    // When pulling back (>0.5), move the button with the paw
                    if (pawProgress > 0.5) {
                        const pullT = (pawProgress - 0.5) / 0.5;
                        const ease = pullT * pullT;
                        const btnNewX = endX + (startX - endX) * ease - btnRect.width / 2;
                        const btnNewY = endY + (startY - endY) * ease - btnRect.height / 2;
                        btnNo.style.position = 'fixed';
                        btnNo.style.left = btnNewX + 'px';
                        btnNo.style.top = btnNewY + 'px';
                        btnNo.style.zIndex = '140';
                        btnNo.style.opacity = Math.max(0, 1 - pullT * 1.5) + '';
                        btnNo.style.transform = `scale(${1 - pullT * 0.5}) rotate(${pullT * 15}deg)`;
                    }

                    requestAnimationFrame(animatePaw);
                } else {
                    // Done stealing!
                    noButtonStolen = true;
                    btnNo.style.display = 'none';

                    // Remove paw overlay
                    setTimeout(() => overlay.remove(), 300);

                    // Cat satisfied expression
                    catCtx.clearRect(0, 0, canvasW, canvasH);
                    CatDrawer.drawPeeking(catCtx, canvasW / 2, canvasH, catScale, 1, 0, 0, 'satisfied');

                    // Cat slowly hides after a moment
                    setTimeout(() => {
                        speechBubble.classList.remove('visible');

                        let hideProgress = 1;
                        function animateHide() {
                            catCtx.clearRect(0, 0, canvasW, canvasH);
                            CatDrawer.drawPeeking(catCtx, canvasW / 2, canvasH, catScale, hideProgress, 0, 0, 'satisfied');

                            if (hideProgress > 0) {
                                hideProgress -= 0.02;
                                requestAnimationFrame(animateHide);
                            } else {
                                catArea.classList.remove('visible');
                            }
                        }
                        animateHide();
                    }, 2500);
                }
            }

            animatePaw();
        }

        animatePeek();
    });

})();
