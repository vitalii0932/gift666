/**
 * CatDrawer — Canvas 2D cute fluffy cat drawing module.
 * Darker fur, serious face, big round cheeks, thin whiskers, WITH BODY.
 */
const CatDrawer = (() => {
    const COL = {
        body:       '#6E6E6E',
        bodyMid:    '#787878',
        bodyDark:   '#5A5A5A',
        light:      '#8A8A8A',
        cheek:      '#909090',
        outline:    '#4A4A4A',
        earPink:    '#C9969E',
        nosePink:   '#D4949C',
        eyeBrown:   '#8B6914',
        eyeDark:    '#5A4510',
        pupil:      '#111111',
        white:      '#FFFFFF',
        whisker:    '#5A5A5A',
        bubbleText: '#5C4033',
        furLight:   '#888888',
        furDark:    '#606060',
        pawPad:     '#B88090',
        mouthLine:  '#555555',
        blush:      '#D4A0A8',
    };

    function seededRandom(seed) {
        let s = seed;
        return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
    }

    function ellipse(ctx, cx, cy, rx, ry) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }

    function drawFurEdge(ctx, cx, cy, rx, ry, count, length, scale) {
        const rng = seededRandom(42);
        ctx.save();
        ctx.lineWidth = 1 * scale;
        ctx.lineCap = 'round';
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (rng() - 0.5) * 0.3;
            const px = cx + Math.cos(angle) * rx;
            const py = cy + Math.sin(angle) * ry;
            const outLen = (length + (rng() - 0.5) * length * 0.5) * scale;
            const curve = (rng() - 0.5) * 0.4;
            const ex = px + Math.cos(angle + curve) * outLen;
            const ey = py + Math.sin(angle + curve) * outLen;
            ctx.strokeStyle = rng() > 0.5 ? COL.furLight : COL.furDark;
            ctx.globalAlpha = 0.35 + rng() * 0.3;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.quadraticCurveTo(
                px + Math.cos(angle + curve * 2) * outLen * 0.6,
                py + Math.sin(angle + curve * 2) * outLen * 0.6,
                ex, ey
            );
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    function drawEar(ctx, tipX, tipY, baseLeftX, baseLeftY, baseRightX, baseRightY, scale) {
        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseLeftY);
        ctx.quadraticCurveTo(tipX, tipY, baseRightX, baseRightY);
        ctx.closePath();
        ctx.fillStyle = COL.body;
        ctx.fill();
        ctx.strokeStyle = COL.outline;
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();

        const inset = 0.3;
        ctx.beginPath();
        ctx.moveTo(
            baseLeftX + (tipX - baseLeftX) * inset,
            baseLeftY + (tipY - baseLeftY) * inset
        );
        ctx.quadraticCurveTo(
            tipX, tipY + 6 * scale,
            baseRightX + (tipX - baseRightX) * inset,
            baseRightY + (tipY - baseRightY) * inset
        );
        ctx.closePath();
        ctx.fillStyle = COL.earPink;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    function drawEye(ctx, cx, cy, scale, pupilOffX, pupilOffY, narrowFactor) {
        const ew = 13 * scale, eh = 14 * scale * narrowFactor;
        ellipse(ctx, cx, cy, ew, eh);
        ctx.fillStyle = COL.white; ctx.fill();
        ctx.strokeStyle = COL.outline; ctx.lineWidth = 1.5 * scale; ctx.stroke();

        const irisR = 8.5 * scale;
        const maxOff = 3.5 * scale;
        const ox = Math.max(-maxOff, Math.min(maxOff, pupilOffX));
        const oy = Math.max(-maxOff, Math.min(maxOff, pupilOffY));

        const irisGrad = ctx.createRadialGradient(cx + ox, cy + oy - 2 * scale, 1 * scale, cx + ox, cy + oy, irisR);
        irisGrad.addColorStop(0, '#C49520');
        irisGrad.addColorStop(0.5, COL.eyeBrown);
        irisGrad.addColorStop(1, COL.eyeDark);
        ellipse(ctx, cx + ox, cy + oy, irisR, irisR * narrowFactor);
        ctx.fillStyle = irisGrad; ctx.fill();

        ellipse(ctx, cx + ox, cy + oy, 4 * scale, 4 * scale * narrowFactor);
        ctx.fillStyle = COL.pupil; ctx.fill();

        ctx.beginPath();
        ctx.arc(cx + ox + 3 * scale, cy + oy - 3 * scale * narrowFactor, 2.2 * scale, 0, Math.PI * 2);
        ctx.fillStyle = COL.white; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(cx + ox - 1.5 * scale, cy + oy + 2 * scale * narrowFactor, 1 * scale, 0, Math.PI * 2);
        ctx.fillStyle = COL.white; ctx.globalAlpha = 0.45; ctx.fill(); ctx.globalAlpha = 1;
    }

    function drawWhiskers(ctx, cx, cy, scale, side) {
        ctx.save();
        ctx.strokeStyle = COL.whisker;
        ctx.lineWidth = 0.7 * scale;
        ctx.lineCap = 'round';
        const baseX = cx + side * 20 * scale;
        const baseY = cy + 2 * scale;
        for (let i = -1; i <= 1; i++) {
            const angle = side * (0.12 + i * 0.18);
            const len = 28 * scale;
            ctx.beginPath();
            ctx.moveTo(baseX, baseY + i * 5 * scale);
            ctx.quadraticCurveTo(
                baseX + side * len * 0.5, baseY + i * 5 * scale + Math.sin(angle) * len * 0.25,
                baseX + side * len, baseY + i * 5 * scale + Math.sin(angle) * len * 0.5
            );
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawNose(ctx, cx, cy, scale) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx - 4.5 * scale, cy + 5.5 * scale);
        ctx.lineTo(cx + 4.5 * scale, cy + 5.5 * scale);
        ctx.closePath();
        const ng = ctx.createRadialGradient(cx, cy + 3 * scale, 0, cx, cy + 3 * scale, 5.5 * scale);
        ng.addColorStop(0, '#D8A8B0');
        ng.addColorStop(1, COL.nosePink);
        ctx.fillStyle = ng; ctx.fill();
        ctx.strokeStyle = '#B07880'; ctx.lineWidth = 0.8 * scale; ctx.stroke();
    }

    function drawMouth(ctx, cx, cy, scale, expression) {
        ctx.save();
        ctx.strokeStyle = COL.mouthLine;
        ctx.lineWidth = 1.3 * scale;
        ctx.lineCap = 'round';
        const my = cy + 7 * scale;
        if (expression === 'mischievous') {
            ctx.beginPath();
            ctx.moveTo(cx - 5 * scale, my + 1 * scale);
            ctx.quadraticCurveTo(cx, my + 3 * scale, cx + 7 * scale, my - 2 * scale);
            ctx.stroke();
        } else if (expression === 'satisfied') {
            ctx.beginPath();
            ctx.moveTo(cx - 6 * scale, my);
            ctx.quadraticCurveTo(cx, my + 4 * scale, cx + 6 * scale, my);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx - 5 * scale, my);
            ctx.lineTo(cx, my + 0.5 * scale);
            ctx.lineTo(cx + 5 * scale, my);
            ctx.stroke();
        }
        ctx.restore();
    }

    /** Draw the BODY (torso) of the cat. */
    function drawBody(ctx, centerX, bodyTopY, scale) {
        const bodyRX = 52 * scale;
        const bodyRY = 48 * scale;
        const bodyY = bodyTopY + bodyRY * 0.6;

        // Body shadow
        ellipse(ctx, centerX, bodyY + 4 * scale, bodyRX + 2 * scale, bodyRY + 2 * scale);
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fill();

        // Main body
        const bodyGrad = ctx.createRadialGradient(
            centerX - 8 * scale, bodyY - 12 * scale, 5 * scale,
            centerX, bodyY, bodyRY
        );
        bodyGrad.addColorStop(0, COL.light);
        bodyGrad.addColorStop(0.5, COL.body);
        bodyGrad.addColorStop(1, COL.bodyDark);
        ellipse(ctx, centerX, bodyY, bodyRX, bodyRY);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.strokeStyle = COL.outline;
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();

        // Belly highlight
        ellipse(ctx, centerX, bodyY + 6 * scale, 28 * scale, 26 * scale);
        ctx.fillStyle = COL.light;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Body fur
        drawFurEdge(ctx, centerX, bodyY, bodyRX, bodyRY, 50, 5, scale);

        // Paws at bottom
        const pawY = bodyY + bodyRY - 6 * scale;
        for (const side of [-1, 1]) {
            const px = centerX + side * 22 * scale;
            ctx.beginPath();
            ctx.ellipse(px, pawY, 16 * scale, 10 * scale, 0, 0, Math.PI * 2);
            ctx.fillStyle = COL.light;
            ctx.fill();
            ctx.strokeStyle = COL.outline;
            ctx.lineWidth = 1.2 * scale;
            ctx.stroke();
            for (let t = -1; t <= 1; t++) {
                ctx.beginPath();
                ctx.arc(px + t * 5 * scale, pawY + 1 * scale, 2 * scale, 0, Math.PI * 2);
                ctx.fillStyle = COL.pawPad;
                ctx.fill();
            }
        }

        // Tail
        ctx.save();
        ctx.strokeStyle = COL.body;
        ctx.lineWidth = 10 * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const tailX = centerX + 38 * scale;
        ctx.moveTo(tailX, bodyY + 8 * scale);
        ctx.bezierCurveTo(
            tailX + 25 * scale, bodyY + 5 * scale,
            tailX + 38 * scale, bodyY - 10 * scale,
            tailX + 28 * scale, bodyY - 20 * scale
        );
        ctx.stroke();
        ctx.strokeStyle = COL.outline;
        ctx.lineWidth = 1.8 * scale;
        ctx.stroke();
        ctx.restore();
    }

    /** Draw the HEAD of the cat (includes neck overlap with body). */
    function drawHead(ctx, headX, headY, scale, pupilOffX, pupilOffY, eyeNarrow, expression) {
        const headR = 44 * scale;

        // Ears behind head
        const earSpread = 20 * scale;
        const earH = 20 * scale;
        drawEar(ctx,
            headX - earSpread - 3 * scale, headY - headR + 5 * scale - earH,
            headX - earSpread - 10 * scale, headY - headR + 14 * scale,
            headX - earSpread + 8 * scale, headY - headR + 12 * scale, scale
        );
        drawEar(ctx,
            headX + earSpread + 3 * scale, headY - headR + 5 * scale - earH,
            headX + earSpread - 8 * scale, headY - headR + 12 * scale,
            headX + earSpread + 10 * scale, headY - headR + 14 * scale, scale
        );

        // Head
        const headGrad = ctx.createRadialGradient(
            headX - 6 * scale, headY - 10 * scale, 3 * scale,
            headX, headY, headR
        );
        headGrad.addColorStop(0, COL.light);
        headGrad.addColorStop(0.5, COL.body);
        headGrad.addColorStop(1, COL.bodyDark);
        ctx.beginPath();
        ctx.arc(headX, headY, headR, 0, Math.PI * 2);
        ctx.fillStyle = headGrad;
        ctx.fill();
        ctx.strokeStyle = COL.outline;
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();

        drawFurEdge(ctx, headX, headY, headR, headR, 45, 5, scale);

        // BIG cheeks
        const cheekR = 24 * scale;
        const cheekY = headY + 10 * scale;
        for (const side of [-1, 1]) {
            ellipse(ctx, headX + side * 24 * scale, cheekY, cheekR, cheekR * 0.75);
            ctx.fillStyle = COL.cheek;
            ctx.globalAlpha = 0.4;
            ctx.fill();
            ctx.globalAlpha = 1;
            // Blush
            ctx.beginPath();
            ctx.arc(headX + side * 26 * scale, cheekY + 5 * scale, 5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = COL.blush;
            ctx.globalAlpha = 0.15;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Eyes
        const eyeY = headY - 4 * scale;
        drawEye(ctx, headX - 15 * scale, eyeY, scale, pupilOffX, pupilOffY, eyeNarrow);
        drawEye(ctx, headX + 15 * scale, eyeY, scale, pupilOffX, pupilOffY, eyeNarrow);

        // Nose
        drawNose(ctx, headX, headY + 8 * scale, scale);
        // Mouth
        drawMouth(ctx, headX, headY + 8 * scale, scale, expression);
        // Whiskers
        drawWhiskers(ctx, headX, headY + 6 * scale, scale, -1);
        drawWhiskers(ctx, headX, headY + 6 * scale, scale, 1);

        // Forehead M marking
        ctx.save();
        ctx.strokeStyle = COL.bodyDark;
        ctx.lineWidth = 1.5 * scale;
        ctx.globalAlpha = 0.2;
        ctx.lineCap = 'round';
        const fhY = headY - 20 * scale;
        ctx.beginPath();
        ctx.moveTo(headX - 9 * scale, fhY + 4 * scale);
        ctx.lineTo(headX - 4 * scale, fhY);
        ctx.lineTo(headX, fhY + 3 * scale);
        ctx.lineTo(headX + 4 * scale, fhY);
        ctx.lineTo(headX + 9 * scale, fhY + 4 * scale);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /** Draw a full cat (head + body). */
    function drawFullCat(ctx, centerX, centerY, scale, pupilOffX, pupilOffY, eyeNarrow, expression) {
        const headR = 44 * scale;
        // Body sits below head, overlapping slightly
        const bodyTopY = centerY + headR * 0.55;
        drawBody(ctx, centerX, bodyTopY, scale);
        drawHead(ctx, centerX, centerY, scale, pupilOffX, pupilOffY, eyeNarrow, expression);
    }

    /** Draw a paw reaching out. */
    function drawPaw(ctx, x, y, scale, rotation, isStealing = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation || 0);

        // Arm
        ctx.beginPath();
        const armBase = isStealing ? 4000 * scale : 0;
        ctx.moveTo(0, armBase);
        ctx.lineTo(0, -50 * scale);
        ctx.strokeStyle = COL.body;
        ctx.lineWidth = 26 * scale;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.strokeStyle = COL.outline;
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();

        // Fur on arm
        const rng = seededRandom(77);
        ctx.lineWidth = 0.8 * scale;
        const furCount = isStealing ? 300 : 18;
        const armLenSpan = armBase - (-50 * scale);
        for (let i = 0; i < furCount; i++) {
            const ay = -50 * scale + armLenSpan * (i / furCount);
            const side = rng() > 0.5 ? -1 : 1;
            ctx.strokeStyle = rng() > 0.5 ? COL.furLight : COL.furDark;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(side * 12 * scale, ay);
            ctx.lineTo(side * (12 + 5 * rng()) * scale, ay - 5 * rng() * scale);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Paw pad
        const pawY = -54 * scale;
        ctx.beginPath();
        ctx.ellipse(0, pawY, 18 * scale, 14 * scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = COL.light;
        ctx.fill();
        ctx.strokeStyle = COL.outline;
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
        for (let t = -1; t <= 1; t++) {
            ctx.beginPath();
            ctx.arc(t * 6.5 * scale, pawY - 2 * scale, 3.5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = COL.pawPad;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, pawY + 4 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fillStyle = COL.pawPad;
        ctx.fill();

        ctx.restore();
    }

    /* ════════════════ PUBLIC API ════════════════ */
    return {
        /** Draw full static cat (head + body). */
        draw(ctx, centerX, centerY, scale) {
            drawFullCat(ctx, centerX, centerY, scale, 0, 0, 1, 'normal');
        },

        /** Draw full cat with tracking eyes (head + body). */
        drawWithTrackingEyes(ctx, centerX, centerY, scale, targetX, targetY) {
            const dx = targetX - centerX;
            const dy = targetY - (centerY - 4 * scale);
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const maxPupil = 3.5 * scale;
            const pupilOffX = (dx / dist) * Math.min(maxPupil, dist * 0.04);
            const pupilOffY = (dy / dist) * Math.min(maxPupil, dist * 0.04);
            drawFullCat(ctx, centerX, centerY, scale, pupilOffX, pupilOffY, 1, 'normal');
        },

        /**
         * Draw the cat peeking from the bottom edge (head + partial body).
         * revealAmount: 0 (hidden) to 1 (face fully visible).
         */
        drawPeeking(ctx, centerX, bottomY, scale, revealAmount, pupilOffX, pupilOffY, expression) {
            const headR = 44 * scale;
            const fullHideY = bottomY + headR * 2 + 60 * scale;
            const fullShowY = bottomY - headR * 0.5;
            const headY = fullHideY + (fullShowY - fullHideY) * Math.min(1, revealAmount);

            ctx.save();
            // Draw body first (below head, partially off-screen)
            const bodyTopY = headY + headR * 0.55;
            drawBody(ctx, centerX, bodyTopY, scale);
            // Draw head on top
            drawHead(ctx, centerX, headY, scale,
                pupilOffX || 0, pupilOffY || 0,
                expression === 'mischievous' ? 0.7 : 1,
                expression || 'normal');
            ctx.restore();
        },

        /** Draw paw reaching from start to end position. */
        drawStealingPaw(ctx, startX, startY, endX, endY, progress, scale) {
            const p = Math.max(0, Math.min(1, progress));
            if (p <= 0) return;

            ctx.save();
            let currentX, currentY;
            
            if (p <= 0.5) {
                const t = p / 0.5;
                const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                currentX = startX + (endX - startX) * ease;
                currentY = startY + (endY - startY) * ease;
            } else {
                const t = (p - 0.5) / 0.5;
                const ease = t * t;
                currentX = endX + (startX - endX) * ease;
                currentY = endY + (startY - endY) * ease;
            }
            
            const rotation = Math.atan2(endY - startY, endX - startX) + Math.PI / 2;
            drawPaw(ctx, currentX, currentY, scale, rotation, true);
            ctx.restore();
        },

        /** Draw speech bubble. */
        drawSpeechBubble(ctx, x, y, text, maxWidth) {
            ctx.save();
            const padding = 16, radius = 14, pointerSize = 12;
            const fontFamily = "'Comfortaa', 'Nunito', sans-serif";
            const fontSize = 15;
            ctx.font = `${fontSize}px ${fontFamily}`;

            const words = text.split(' ');
            const lines = [];
            let currentLine = '';
            const innerWidth = maxWidth - padding * 2;
            for (const word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                if (ctx.measureText(testLine).width > innerWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            const lineHeight = fontSize * 1.45;
            const bubbleW = maxWidth;
            const bubbleH = lines.length * lineHeight + padding * 2;

            ctx.shadowColor = 'rgba(0,0,0,0.12)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 4;

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + bubbleW - radius, y);
            ctx.arcTo(x + bubbleW, y, x + bubbleW, y + radius, radius);
            ctx.lineTo(x + bubbleW, y + bubbleH - radius);
            ctx.arcTo(x + bubbleW, y + bubbleH, x + bubbleW - radius, y + bubbleH, radius);
            const pCx = x + bubbleW * 0.5;
            ctx.lineTo(pCx + pointerSize, y + bubbleH);
            ctx.lineTo(pCx, y + bubbleH + pointerSize);
            ctx.lineTo(pCx - pointerSize, y + bubbleH);
            ctx.lineTo(x + radius, y + bubbleH);
            ctx.arcTo(x, y + bubbleH, x, y + bubbleH - radius, radius);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
            ctx.closePath();
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.strokeStyle = '#D8CFC5';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = COL.bubbleText;
            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.textBaseline = 'top';
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], x + padding, y + padding + i * lineHeight);
            }
            ctx.restore();
        },
    };
})();
