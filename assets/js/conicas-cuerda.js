(function () {
    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function drawPoint(ctx, p, color, label) {
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(label, p.x + 10, p.y - 10);
    }

    function drawPencil(ctx, p) {
        ctx.save();
        ctx.fillStyle = '#1d3557';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f4a261';
        ctx.fillRect(p.x - 4, p.y - 18, 8, 11);
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(p.x - 4, p.y - 18);
        ctx.lineTo(p.x + 4, p.y - 18);
        ctx.lineTo(p.x, p.y - 24);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function drawInfiniteLine(ctx, point, direction, color, width) {
        var norm = Math.hypot(direction.x, direction.y) || 1;
        var ux = direction.x / norm;
        var uy = direction.y / norm;
        var L = 1400;
        ctx.strokeStyle = color || '#888';
        ctx.lineWidth = width || 1.5;
        ctx.beginPath();
        ctx.moveTo(point.x - ux * L, point.y - uy * L);
        ctx.lineTo(point.x + ux * L, point.y + uy * L);
        ctx.stroke();
    }

    function drawRightAngleMarker(ctx, q, along, perp) {
        var n1 = Math.hypot(along.x, along.y) || 1;
        var n2 = Math.hypot(perp.x, perp.y) || 1;
        var a = { x: along.x / n1, y: along.y / n1 };
        var b = { x: perp.x / n2, y: perp.y / n2 };
        var s = 14;
        ctx.strokeStyle = '#8d99ae';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x + a.x * s, q.y + a.y * s);
        ctx.lineTo(q.x + a.x * s + b.x * s, q.y + a.y * s + b.y * s);
        ctx.lineTo(q.x + b.x * s, q.y + b.y * s);
        ctx.stroke();
    }

    function drawSetSquare(ctx, q, along, perp) {
        var n1 = Math.hypot(along.x, along.y) || 1;
        var n2 = Math.hypot(perp.x, perp.y) || 1;
        var u = { x: along.x / n1, y: along.y / n1 };
        var v = { x: perp.x / n2, y: perp.y / n2 };
        var a = 56;
        var b = 38;

        var p1 = q;
        var p2 = { x: q.x + u.x * a, y: q.y + u.y * a };
        var p3 = { x: q.x + v.x * b, y: q.y + v.y * b };

        ctx.save();
        ctx.fillStyle = 'rgba(141, 153, 174, 0.22)';
        ctx.strokeStyle = '#5f6b7a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function orientToward(direction, from, toward) {
        var dx = toward.x - from.x;
        var dy = toward.y - from.y;
        if (direction.x * dx + direction.y * dy < 0) {
            return { x: -direction.x, y: -direction.y };
        }
        return direction;
    }

    function ConicInteractive(root) {
        this.root = root;
        this.type = root.dataset.conic;
        this.canvas = root.querySelector('.conic-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.progress = root.querySelector('[data-role="progress"]');
        this.radius = root.querySelector('[data-role="radius"]');
        this.rope = root.querySelector('[data-role="rope"]');
        this.p = root.querySelector('[data-role="p"]');
        this.delta = root.querySelector('[data-role="delta"]');

        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.m = 40;

        this.state = {
            center: { x: this.w / 2, y: this.h / 2 },
            f1: { x: this.w / 2 - 120, y: this.h / 2 },
            f2: { x: this.w / 2 + 120, y: this.h / 2 },
            focus: { x: this.w / 2, y: this.h / 2 - 30 },
            activeFocusKey: 'f1',
            progressF1: 0,
            progressF2: 0
        };

        this.dragging = null;
        this.registerEvents();
        this.render();
    }

    ConicInteractive.prototype.getProgress = function () {
        return (Number(this.progress.value) || 0) / 100;
    };

    ConicInteractive.prototype.registerEvents = function () {
        var self = this;
        var controls = [this.progress, this.radius, this.rope, this.p, this.delta].filter(Boolean);
        controls.forEach(function (el) {
            el.addEventListener('input', function () {
                // For director types, sync progress slider to the active focus's progress
                if (self.type === 'ellipse-director' || self.type === 'hyperbola-director') {
                    var key = self.state.activeFocusKey === 'f1' ? 'progressF1' : 'progressF2';
                    self.state[key] = Number(self.progress.value) || 0;
                }
                self.render();
            });
        });

        this.canvas.addEventListener('pointerdown', function (e) {
            var p = self.eventPoint(e);
            var handles = self.getHandles();
            // For director types: check if clicking a focus to switch active focus
            if (self.type === 'ellipse-director' || self.type === 'hyperbola-director') {
                var f1 = self.state.f1;
                var f2 = self.state.f2;
                if (dist(f1, p) < 20) {
                    if (self.state.activeFocusKey !== 'f1') {
                        self.state.activeFocusKey = 'f1';
                        self.progress.value = self.state.progressF1;
                        self.render();
                    } else {
                        self.dragging = 'f1';
                        self.canvas.setPointerCapture(e.pointerId);
                    }
                    return;
                }
                if (dist(f2, p) < 20) {
                    if (self.state.activeFocusKey !== 'f2') {
                        self.state.activeFocusKey = 'f2';
                        self.progress.value = self.state.progressF2;
                        self.render();
                    } else {
                        self.dragging = 'f2';
                        self.canvas.setPointerCapture(e.pointerId);
                    }
                    return;
                }
            }
            for (var i = 0; i < handles.length; i++) {
                if (dist(handles[i].point, p) < 14) {
                    self.dragging = handles[i].key;
                    self.canvas.setPointerCapture(e.pointerId);
                    return;
                }
            }
        });

        this.canvas.addEventListener('pointermove', function (e) {
            if (!self.dragging) {
                return;
            }
            var p = self.eventPoint(e);
            self.moveHandle(self.dragging, p);
            self.render();
        });

        this.canvas.addEventListener('pointerup', function (e) {
            self.dragging = null;
            self.canvas.releasePointerCapture(e.pointerId);
        });

        this.canvas.addEventListener('pointercancel', function (e) {
            self.dragging = null;
            self.canvas.releasePointerCapture(e.pointerId);
        });
    };

    ConicInteractive.prototype.eventPoint = function (e) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * this.w,
            y: ((e.clientY - rect.top) / rect.height) * this.h
        };
    };

    ConicInteractive.prototype.getHandles = function () {
        if (this.type === 'circle') {
            return [{ key: 'center', point: this.state.center }];
        }
        if (this.type === 'ellipse' || this.type === 'hyperbola') {
            return [
                { key: 'f1', point: this.state.f1 },
                { key: 'f2', point: this.state.f2 }
            ];
        }
        if (this.type === 'ellipse-director' || this.type === 'hyperbola-director') {
            // Handled specially in registerEvents (click = switch focus, drag on second click = move)
            return [
                { key: 'f1', point: this.state.f1 },
                { key: 'f2', point: this.state.f2 }
            ];
        }
        return [{ key: 'focus', point: this.state.focus }];
    };

    ConicInteractive.prototype.moveHandle = function (key, p) {
        var minX = this.m;
        var maxX = this.w - this.m;
        var minY = this.m;
        var maxY = this.h - this.m;

        if (key === 'center') {
            this.state.center.x = clamp(p.x, minX, maxX);
            this.state.center.y = clamp(p.y, minY, maxY);
            return;
        }

        if (key === 'focus') {
            this.state.focus.x = clamp(p.x, minX + 20, maxX - 20);
            this.state.focus.y = clamp(p.y, minY + 30, maxY - 30);
            return;
        }

        if (key === 'f1' || key === 'f2') {
            this.state[key].x = clamp(p.x, minX + 20, maxX - 20);
            this.state[key].y = clamp(p.y, minY + 20, maxY - 20);
            if (Math.abs(this.state.f1.x - this.state.f2.x) < 35 && Math.abs(this.state.f1.y - this.state.f2.y) < 35) {
                if (key === 'f1') {
                    this.state.f1.x -= 20;
                    this.state.f1.y -= 10;
                } else {
                    this.state.f2.x += 20;
                    this.state.f2.y += 10;
                }
            }
        }
    };

    ConicInteractive.prototype.prepareCanvas = function () {
        var dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.ctx.clearRect(0, 0, this.w, this.h);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(0, 0, this.w, this.h);

        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;
        for (var x = this.m; x <= this.w - this.m; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.m / 2);
            this.ctx.lineTo(x, this.h - this.m / 2);
            this.ctx.stroke();
        }
        for (var y = this.m / 2; y <= this.h - this.m / 2; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.m / 2, y);
            this.ctx.lineTo(this.w - this.m / 2, y);
            this.ctx.stroke();
        }
    };

    ConicInteractive.prototype.renderCircle = function () {
        var ctx = this.ctx;
        var center = this.state.center;
        var r = clamp(Number(this.radius.value) || 100, 20, 180);
        var t = this.getProgress() * Math.PI * 2;

        ctx.strokeStyle = '#d6d6d6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#0a84ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(center.x, center.y, r, -Math.PI / 2, -Math.PI / 2 + t);
        ctx.stroke();

        var p = {
            x: center.x + r * Math.cos(-Math.PI / 2 + t),
            y: center.y + r * Math.sin(-Math.PI / 2 + t)
        };

        ctx.strokeStyle = '#b56a1c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        drawPoint(ctx, center, '#c1121f', 'C');
        drawPencil(ctx, p);
    };

    ConicInteractive.prototype.renderEllipse = function () {
        var ctx = this.ctx;
        var f1 = this.state.f1;
        var f2 = this.state.f2;
        var d = dist(f1, f2);
        var ropeRaw = Number(this.rope.value) || 320;
        var rope = Math.max(ropeRaw, d + 20);
        if (rope !== ropeRaw) {
            this.rope.value = Math.round(rope);
        }

        var a = rope / 2;
        var c = d / 2;
        var b = Math.sqrt(Math.max(a * a - c * c, 1));
        var mid = { x: (f1.x + f2.x) / 2, y: (f1.y + f2.y) / 2 };
        var ang = Math.atan2(f2.y - f1.y, f2.x - f1.x);

        function pointAt(u) {
            var ex = a * Math.cos(u);
            var ey = b * Math.sin(u);
            return {
                x: mid.x + ex * Math.cos(ang) - ey * Math.sin(ang),
                y: mid.y + ex * Math.sin(ang) + ey * Math.cos(ang)
            };
        }

        ctx.strokeStyle = '#d6d6d6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var i = 0; i <= 240; i++) {
            var u0 = (i / 240) * Math.PI * 2;
            var q0 = pointAt(u0);
            if (i === 0) {
                ctx.moveTo(q0.x, q0.y);
            } else {
                ctx.lineTo(q0.x, q0.y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        var t = this.getProgress() * Math.PI * 2;
        ctx.strokeStyle = '#0a84ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (var j = 0; j <= 240; j++) {
            var uj = (j / 240) * t;
            var q = pointAt(uj);
            if (j === 0) {
                ctx.moveTo(q.x, q.y);
            } else {
                ctx.lineTo(q.x, q.y);
            }
        }
        ctx.stroke();

        var p = pointAt(t);
        ctx.strokeStyle = '#b56a1c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(f1.x, f1.y);
        ctx.lineTo(p.x, p.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.stroke();

        drawPoint(ctx, f1, '#c1121f', 'F1');
        drawPoint(ctx, f2, '#c1121f', 'F2');
        drawPencil(ctx, p);
    };

    ConicInteractive.prototype.renderParabola = function () {
        var ctx = this.ctx;
        var focus = this.state.focus;
        var pRaw = Number(this.p.value) || 50;
        var pMax = Math.max(25, Math.min(120, (focus.y - 35) / 2));
        var p = clamp(pRaw, 25, pMax);
        if (p !== pRaw) {
            this.p.value = Math.round(p);
        }

        var directrixY = focus.y - 2 * p;
        var h = focus.x;
        var k = focus.y - p;

        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.m / 2, directrixY);
        ctx.lineTo(this.w - this.m / 2, directrixY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('directriz', this.m / 2 + 8, directrixY - 8);

        var xMin = this.m;
        var xMax = this.w - this.m;
        var currentX = lerp(xMin, xMax, this.getProgress());

        ctx.strokeStyle = '#d6d6d6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (var x = xMin; x <= xMax; x += 2) {
            var y = ((x - h) * (x - h)) / (4 * p) + k;
            if (x === xMin) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        ctx.strokeStyle = '#0a84ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (var xt = xMin; xt <= currentX; xt += 2) {
            var yt = ((xt - h) * (xt - h)) / (4 * p) + k;
            if (xt === xMin) {
                ctx.moveTo(xt, yt);
            } else {
                ctx.lineTo(xt, yt);
            }
        }
        ctx.stroke();

        var py = ((currentX - h) * (currentX - h)) / (4 * p) + k;
        var point = { x: currentX, y: py };

        ctx.strokeStyle = '#b56a1c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(focus.x, focus.y);
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x, directrixY);
        ctx.stroke();

        drawPoint(ctx, focus, '#c1121f', 'F');
        drawPencil(ctx, point);
    };

    ConicInteractive.prototype.renderHyperbola = function () {
        var ctx = this.ctx;
        var f1 = this.state.f1;
        var f2 = this.state.f2;
        var d = dist(f1, f2);
        var deltaRaw = Number(this.delta.value) || 120;
        var deltaMax = Math.max(30, d - 20);
        var delta = clamp(deltaRaw, 30, deltaMax);
        if (delta !== deltaRaw) {
            this.delta.value = Math.round(delta);
        }

        var a = delta / 2;
        var c = d / 2;
        var b = Math.sqrt(Math.max(c * c - a * a, 1));
        var mid = { x: (f1.x + f2.x) / 2, y: (f1.y + f2.y) / 2 };
        var ang = Math.atan2(f2.y - f1.y, f2.x - f1.x);
        var uMax = 1.55;

        function world(x, y) {
            return {
                x: mid.x + x * Math.cos(ang) - y * Math.sin(ang),
                y: mid.y + x * Math.sin(ang) + y * Math.cos(ang)
            };
        }

        function branchPoint(sign, u) {
            var x = sign * a * Math.cosh(u);
            var y = b * Math.sinh(u);
            return world(x, y);
        }

        function drawBranch(color, sign, uEnd, step) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            var first = true;
            for (var u = -uEnd; u <= uEnd; u += step) {
                var q = branchPoint(sign, u);
                if (first) {
                    ctx.moveTo(q.x, q.y);
                    first = false;
                } else {
                    ctx.lineTo(q.x, q.y);
                }
            }
            ctx.stroke();
        }

        drawBranch('#d6d6d6', 1, uMax, 0.01);
        drawBranch('#d6d6d6', -1, uMax, 0.01);

        var t = this.getProgress();
        if (t <= 0.5) {
            var uRight = uMax * (t / 0.5);
            drawBranch('#0a84ff', 1, uRight, 0.01);
            var pRight = branchPoint(1, uRight);
            ctx.strokeStyle = '#b56a1c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(f1.x, f1.y);
            ctx.lineTo(pRight.x, pRight.y);
            ctx.moveTo(f2.x, f2.y);
            ctx.lineTo(pRight.x, pRight.y);
            ctx.stroke();
            drawPencil(ctx, pRight);
        } else {
            drawBranch('#0a84ff', 1, uMax, 0.01);
            var uLeft = uMax * ((t - 0.5) / 0.5);
            drawBranch('#0a84ff', -1, uLeft, 0.01);
            var pLeft = branchPoint(-1, uLeft);
            ctx.strokeStyle = '#b56a1c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(f1.x, f1.y);
            ctx.lineTo(pLeft.x, pLeft.y);
            ctx.moveTo(f2.x, f2.y);
            ctx.lineTo(pLeft.x, pLeft.y);
            ctx.stroke();
            drawPencil(ctx, pLeft);
        }

        drawPoint(ctx, f1, '#c1121f', 'F1');
        drawPoint(ctx, f2, '#c1121f', 'F2');
    };

    ConicInteractive.prototype.renderEllipseDirector = function () {
        var ctx = this.ctx;
        var f1 = this.state.f1;
        var f2 = this.state.f2;
        var d = dist(f1, f2);
        var aRaw = Number(this.radius.value) || 220;
        var a = clamp(aRaw, Math.max(120, d / 2 + 20), 300);
        if (a !== aRaw) { this.radius.value = Math.round(a); }

        var mid = { x: (f1.x + f2.x) / 2, y: (f1.y + f2.y) / 2 };
        var activeKey = this.state.activeFocusKey;
        var activeFocus = activeKey === 'f1' ? f1 : f2;
        var otherFocus = activeKey === 'f1' ? f2 : f1;
        var tActive = (activeKey === 'f1' ? this.state.progressF1 : this.state.progressF2) / 100;
        var tOther = (activeKey === 'f1' ? this.state.progressF2 : this.state.progressF1) / 100;

        // Q on circle of radius a centred at O.
        // Tangent = line through Q perpendicular to Q–activeFocus.
        // Conic point P = foot of perpendicular from otherFocus onto that tangent.
        function directorPoint(theta) {
            return { x: mid.x + a * Math.cos(theta), y: mid.y + a * Math.sin(theta) };
        }

        function conicPoint(theta, active, other) {
            var q = directorPoint(theta);
            // tangent direction: perp to (activeFocus - Q)
            var qf = { x: active.x - q.x, y: active.y - q.y };
            var len = Math.hypot(qf.x, qf.y) || 1;
            var tx = -qf.y / len, ty = qf.x / len; // unit tangent
            // foot of perp from 'other' onto tangent through Q
            var proj = (other.x - q.x) * tx + (other.y - q.y) * ty;
            return { x: q.x + proj * tx, y: q.y + proj * ty };
        }

        // Draw director circle
        ctx.strokeStyle = '#9aa7b2'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(mid.x, mid.y, a, 0, Math.PI * 2); ctx.stroke();

        // Grey guide: full ellipse (sweep all theta with both focus roles giving same ellipse)
        ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        var N0 = 200, first0 = true;
        for (var k0 = 0; k0 <= N0; k0++) {
            var th0 = -Math.PI + (k0 / N0) * 2 * Math.PI;
            var ep = conicPoint(th0, f1, f2); // same ellipse regardless of which focus is active
            if (first0) { ctx.moveTo(ep.x, ep.y); first0 = false; } else { ctx.lineTo(ep.x, ep.y); }
        }
        ctx.stroke();

        // Draw tangent lines accumulated so far (both foci)
        var stepsOther = Math.max(0, Math.floor(tOther * 60));
        var stepsActive = Math.max(0, Math.floor(tActive * 60));
        function drawTangents(focus, other, steps) {
            for (var i = 0; i <= steps; i++) {
                var theta = -Math.PI / 2 + (i / 60) * Math.PI;
                var q = directorPoint(theta);
                var qf = { x: focus.x - q.x, y: focus.y - q.y };
                drawInfiniteLine(ctx, q, { x: -qf.y, y: qf.x }, '#c5ced8', 1.35);
            }
        }
        drawTangents(otherFocus, activeFocus, stepsOther);
        drawTangents(activeFocus, otherFocus, stepsActive);

        // Sin trazo azul: se muestran solo la envolvente guía y las tangentes.
        var thetaAct = -Math.PI / 2 + tActive * Math.PI;

        // Active set-square and tangent
        var q = directorPoint(thetaAct);
        var qf = { x: activeFocus.x - q.x, y: activeFocus.y - q.y };
        var tan = { x: -qf.y, y: qf.x };
        var pencil = conicPoint(thetaAct, activeFocus, otherFocus);
        tan = orientToward(tan, q, pencil);

        ctx.strokeStyle = '#b56a1c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(activeFocus.x, activeFocus.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        drawSetSquare(ctx, q, qf, tan);
        drawRightAngleMarker(ctx, q, qf, tan);
        drawInfiniteLine(ctx, q, tan, '#ff7f2a', 2.8);
        drawPoint(ctx, q, '#495057', 'Q');

        // Draw a dashed line from otherFocus to pencil to show the "other arm"
        ctx.save();
        ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#b56a1c'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(otherFocus.x, otherFocus.y); ctx.lineTo(pencil.x, pencil.y); ctx.stroke();
        ctx.restore();

        // Label active focus with a ring
        function drawActiveFocusRing(f) {
            ctx.save();
            ctx.strokeStyle = '#ff7f2a'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(f.x, f.y, 13, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        drawActiveFocusRing(activeFocus);

        drawPoint(ctx, f1, '#c1121f', 'F1');
        drawPoint(ctx, f2, '#c1121f', 'F2');
        drawPoint(ctx, mid, '#2a9d8f', 'O');
        drawPencil(ctx, pencil);
    };

    ConicInteractive.prototype.renderParabolaDirector = function () {
        var ctx = this.ctx;
        var focus = this.state.focus;
        var gapRaw = Number(this.p.value) || 95;
        var gap = clamp(gapRaw, 40, 190);
        if (gap !== gapRaw) {
            this.p.value = Math.round(gap);
        }

        var segY = clamp(focus.y + gap, this.h * 0.45, this.h - this.m);
        var xMin = this.m;
        var xMax = this.w - this.m;
        var t = this.getProgress();
        var uMin = xMin + 20;
        var uMax = xMax - 20;

        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(xMin, segY);
        ctx.lineTo(xMax, segY);
        ctx.stroke();

        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText('segmento', xMin + 8, segY - 8);

        // For the parabola: Q on segment (directrix), F = focus.
        // The parabola point P lies on ray upward from Q (perpendicular to directrix)
        // AND on the perpendicular bisector of QF.
        // Solve: P = Q + t*(0,-1) (upward), |P-Q| = |P-F|
        // t² = (P-F)² → |t|² = |(xq-fx)² + (segY - t - fy)²|
        // Actually P = {xq, segY - t}, t > 0 (above segment)
        // |P-Q|² = t², |P-F|² = (xq-fx)² + (segY-t-fy)²
        // t² = (xq-fx)² + (segY-t-fy)² 
        // 0 = (xq-fx)² + (segY-fy)² - 2t(segY-fy) + t² - t²... wait:
        // t² = (xq-fx)² + (segY-fy-t)²
        // t² = (xq-fx)² + (segY-fy)² - 2t(segY-fy) + t²
        // 0 = (xq-fx)² + (segY-fy)² - 2t(segY-fy)
        // t = [(xq-fx)² + (segY-fy)²] / [2(segY-fy)]
        function envelopeParabola(xq) {
            var dx = xq - focus.x;
            var dy = segY - focus.y; // segY > focus.y, so dy > 0 → t > 0 → P above segment ✓
            var t2 = (dx * dx + dy * dy) / (2 * dy);
            return { x: xq, y: segY - t2 };
        }

        var n = Math.max(2, Math.floor(t * 60));
        for (var i = 0; i <= n; i++) {
            var xq = lerp(uMin, uMax, i / 60);
            var q = { x: xq, y: segY };
            var v = { x: focus.x - q.x, y: focus.y - q.y };
            var perp = { x: -v.y, y: v.x };
            drawInfiniteLine(ctx, q, perp, '#c5ced8', 1.35);
        }

        var u = lerp(uMin, uMax, t);
        var qAct = { x: u, y: segY };
        var pencil = envelopeParabola(u);

        // Tangent at pencil: perpendicular to QF at Q
        var qf = { x: focus.x - qAct.x, y: focus.y - qAct.y };
        var tanDir = { x: -qf.y, y: qf.x };
        tanDir = orientToward(tanDir, qAct, pencil);

        ctx.strokeStyle = '#b56a1c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(focus.x, focus.y);
        ctx.lineTo(qAct.x, qAct.y);
        ctx.stroke();

        drawSetSquare(ctx, qAct, qf, tanDir);
        drawRightAngleMarker(ctx, qAct, qf, tanDir);
        drawPoint(ctx, qAct, '#495057', 'Q');

        ctx.strokeStyle = '#d0d7de';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (var us = uMin; us <= uMax; us += 1.5) {
            var ps = envelopeParabola(us);
            if (us === uMin) {
                ctx.moveTo(ps.x, ps.y);
            } else {
                ctx.lineTo(ps.x, ps.y);
            }
        }
        ctx.stroke();

        // Sin trazo azul: solo curva guía y tangentes.

        drawInfiniteLine(ctx, qAct, tanDir, '#ff7f2a', 2.8);

        drawPoint(ctx, focus, '#c1121f', 'P');
        drawPencil(ctx, pencil);
    };

    ConicInteractive.prototype.renderHyperbolaDirector = function () {
        var ctx = this.ctx;
        var f1 = this.state.f1;
        var f2 = this.state.f2;
        var d = dist(f1, f2);
        var rRaw = Number(this.radius.value) || 78;
        var r = clamp(rRaw, 40, d / 2 - 5);
        if (r !== rRaw) { this.radius.value = Math.round(r); }

        var mid = { x: (f1.x + f2.x) / 2, y: (f1.y + f2.y) / 2 };
        var activeKey = this.state.activeFocusKey;
        var activeFocus = activeKey === 'f1' ? f1 : f2;
        var otherFocus = activeKey === 'f1' ? f2 : f1;
        var tActive = (activeKey === 'f1' ? this.state.progressF1 : this.state.progressF2) / 100;
        var tOther = (activeKey === 'f1' ? this.state.progressF2 : this.state.progressF1) / 100;

        // Q on small circle centred at O (foci outside circle).
        // Tangent = line through Q perpendicular to Q–activeFocus.
        // Conic point P = foot of perpendicular from otherFocus onto that tangent.
        function directorPoint(theta) {
            return { x: mid.x + r * Math.cos(theta), y: mid.y + r * Math.sin(theta) };
        }

        function conicPoint(theta, active, other) {
            var q = directorPoint(theta);
            var qf = { x: active.x - q.x, y: active.y - q.y };
            var len = Math.hypot(qf.x, qf.y) || 1;
            var tx = -qf.y / len, ty = qf.x / len;
            var proj = (other.x - q.x) * tx + (other.y - q.y) * ty;
            return { x: q.x + proj * tx, y: q.y + proj * ty };
        }

        // Draw director circle
        ctx.strokeStyle = '#9aa7b2'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(mid.x, mid.y, r, 0, Math.PI * 2); ctx.stroke();

        // Draw full guide hyperbola (grey) – both branches
        ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 1.3;
        // Branch from f1 (active against f2)
        ['f1', 'f2'].forEach(function (fk) {
            var fa = fk === 'f1' ? f1 : f2;
            var fb = fk === 'f1' ? f2 : f1;
            ctx.beginPath();
            var firstG = true;
            for (var k = 0; k <= 200; k++) {
                var thg = -Math.PI + (k / 200) * 2 * Math.PI;
                var pg = conicPoint(thg, fa, fb);
                // clip points too far from canvas
                if (Math.abs(pg.x - mid.x) > 600 || Math.abs(pg.y - mid.y) > 500) { firstG = true; continue; }
                if (firstG) { ctx.moveTo(pg.x, pg.y); firstG = false; } else { ctx.lineTo(pg.x, pg.y); }
            }
            ctx.stroke();
        });

        // Draw accumulated tangent lines
        var stepsActive = Math.max(0, Math.floor(tActive * 56));
        var stepsOther = Math.max(0, Math.floor(tOther * 56));
        function drawTangents(focus, steps) {
            for (var i = 0; i <= steps; i++) {
                var theta = -Math.PI / 2 + (i / 56) * Math.PI;
                var q = directorPoint(theta);
                var qf = { x: focus.x - q.x, y: focus.y - q.y };
                drawInfiniteLine(ctx, q, { x: -qf.y, y: qf.x }, '#c5ced8', 1.35);
            }
        }
        drawTangents(otherFocus, stepsOther);
        drawTangents(activeFocus, stepsActive);

        // Sin trazo azul: se muestran solo la envolvente guía y las tangentes.
        var thetaAct = -Math.PI / 2 + tActive * Math.PI;

        // Active set-square and tangent line
        var qAct = directorPoint(thetaAct);
        var qfAct = { x: activeFocus.x - qAct.x, y: activeFocus.y - qAct.y };
        var tanAct = { x: -qfAct.y, y: qfAct.x };
        var pencil = conicPoint(thetaAct, activeFocus, otherFocus);
        tanAct = orientToward(tanAct, qAct, pencil);

        ctx.strokeStyle = '#b56a1c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(activeFocus.x, activeFocus.y); ctx.lineTo(qAct.x, qAct.y); ctx.stroke();

        ctx.save(); ctx.setLineDash([5, 4]);
        ctx.strokeStyle = '#b56a1c'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(otherFocus.x, otherFocus.y); ctx.lineTo(pencil.x, pencil.y); ctx.stroke();
        ctx.restore();

        drawSetSquare(ctx, qAct, qfAct, tanAct);
        drawRightAngleMarker(ctx, qAct, qfAct, tanAct);
        drawInfiniteLine(ctx, qAct, tanAct, '#ff7f2a', 2.8);
        drawPoint(ctx, qAct, '#495057', 'Q');

        // Active focus ring
        ctx.save(); ctx.strokeStyle = '#ff7f2a'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(activeFocus.x, activeFocus.y, 13, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        drawPoint(ctx, f1, '#c1121f', 'F1');
        drawPoint(ctx, f2, '#c1121f', 'F2');
        drawPoint(ctx, mid, '#2a9d8f', 'O');
        drawPencil(ctx, pencil);
    };

    ConicInteractive.prototype.render = function () {
        this.prepareCanvas();
        if (this.type === 'circle') {
            this.renderCircle();
            return;
        }
        if (this.type === 'ellipse') {
            this.renderEllipse();
            return;
        }
        if (this.type === 'parabola') {
            this.renderParabola();
            return;
        }
        if (this.type === 'hyperbola') {
            this.renderHyperbola();
            return;
        }
        if (this.type === 'ellipse-director') {
            this.renderEllipseDirector();
            return;
        }
        if (this.type === 'parabola-director') {
            this.renderParabolaDirector();
            return;
        }
        if (this.type === 'hyperbola-director') {
            this.renderHyperbolaDirector();
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        var blocks = document.querySelectorAll('.conic-interactive');
        for (var i = 0; i < blocks.length; i++) {
            new ConicInteractive(blocks[i]);
        }
    });
})();
