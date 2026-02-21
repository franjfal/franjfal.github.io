(function () {
    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    function norm(v) {
        var n = Math.hypot(v.x, v.y) || 1;
        return { x: v.x / n, y: v.y / n };
    }

    function FoldInteractive(root) {
        this.root = root;
        this.type = root.dataset.fold;
        this.canvas = root.querySelector('.fold-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.progress = root.querySelector('[data-role="progress"]');
        this.steps = root.querySelector('[data-role="steps"]');

        this.w = this.canvas.width;
        this.h = this.canvas.height;

        this.paper = {
            left: -300,
            right: 300,
            top: -160,
            bottom: 160
        };

        this.registerEvents();
        this.render();
    }

    FoldInteractive.prototype.registerEvents = function () {
        var self = this;
        [this.progress, this.steps].filter(Boolean).forEach(function (el) {
            el.addEventListener('input', function () {
                self.render();
            });
        });
    };

    FoldInteractive.prototype.prepareCanvas = function () {
        var dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, this.w, this.h);
    };

    FoldInteractive.prototype.project = function (p) {
        // Stronger oblique + perspective so the fold height is clearly visible
        var tilt = 0.95;
        var yr = p.y * Math.cos(tilt) - p.z * Math.sin(tilt);
        var zr = p.y * Math.sin(tilt) + p.z * Math.cos(tilt);
        var cam = 950;
        var persp = cam / Math.max(180, cam - zr);
        return {
            x: this.w / 2 + p.x * persp,
            y: this.h / 2 + yr * persp * 0.92 - zr * 0.08
        };
    };

    FoldInteractive.prototype.rectPolygon = function () {
        return [
            { x: this.paper.left, y: this.paper.top },
            { x: this.paper.right, y: this.paper.top },
            { x: this.paper.right, y: this.paper.bottom },
            { x: this.paper.left, y: this.paper.bottom }
        ];
    };

    FoldInteractive.prototype.clipByHalfPlane = function (poly, n, c, side) {
        function inside(p) {
            return side * (dot(n, p) - c) >= -1e-6;
        }

        var out = [];
        for (var i = 0; i < poly.length; i++) {
            var a = poly[i];
            var b = poly[(i + 1) % poly.length];
            var ia = inside(a);
            var ib = inside(b);
            var da = dot(n, a) - c;
            var db = dot(n, b) - c;

            if (ia && ib) {
                out.push(b);
            } else if (ia && !ib) {
                var t1 = da / (da - db);
                out.push({ x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 });
            } else if (!ia && ib) {
                var t2 = da / (da - db);
                out.push({ x: a.x + (b.x - a.x) * t2, y: a.y + (b.y - a.y) * t2 });
                out.push(b);
            }
        }
        return out;
    };

    FoldInteractive.prototype.lineSegmentOnRect = function (n, c) {
        var L = this.paper.left;
        var R = this.paper.right;
        var T = this.paper.top;
        var B = this.paper.bottom;
        var pts = [];

        if (Math.abs(n.y) > 1e-6) {
            var yL = (c - n.x * L) / n.y;
            var yR = (c - n.x * R) / n.y;
            if (yL >= T && yL <= B) { pts.push({ x: L, y: yL }); }
            if (yR >= T && yR <= B) { pts.push({ x: R, y: yR }); }
        }
        if (Math.abs(n.x) > 1e-6) {
            var xT = (c - n.y * T) / n.x;
            var xB = (c - n.y * B) / n.x;
            if (xT >= L && xT <= R) { pts.push({ x: xT, y: T }); }
            if (xB >= L && xB <= R) { pts.push({ x: xB, y: B }); }
        }

        if (pts.length < 2) {
            return null;
        }
        return [pts[0], pts[1]];
    };

    FoldInteractive.prototype.getModel = function (N) {
        var model = { folds: [], points: [], foci: [], circle: null, directrix: null, movingFocus: null, conic: null };

        if (this.type === 'ellipse-fold') {
            var f1 = { x: -80, y: 0 };
            var f2 = { x: 80, y: 0 };
            var r = 240;
            model.foci = [f1, f2];
            model.circle = { c: f1, r: r };
            model.movingFocus = f2;

            var cx = (f1.x + f2.x) / 2;
            var cy = (f1.y + f2.y) / 2;
            var a = r / 2;
            var c_dist = Math.hypot(f2.x - f1.x, f2.y - f1.y) / 2;
            var b = Math.sqrt(a * a - c_dist * c_dist);
            model.conic = { type: 'ellipse', cx: cx, cy: cy, a: a, b: b };

            for (var i = 0; i < N; i++) {
                var th = -Math.PI / 2 + (i * 2 * Math.PI) / N;
                var q = { x: f1.x + r * Math.cos(th), y: f1.y + r * Math.sin(th) };
                var n = norm({ x: q.x - f2.x, y: q.y - f2.y });
                var m = { x: (q.x + f2.x) / 2, y: (q.y + f2.y) / 2 };
                var c = dot(n, m);
                var side = dot(n, f2) - c >= 0 ? 1 : -1;
                model.points.push(q);
                model.folds.push({ n: n, c: c, side: side, q: q });
            }
            return model;
        }

        if (this.type === 'parabola-fold') {
            var focus = { x: 0, y: -40 };
            var yDir = 100;
            model.foci = [focus];
            model.directrix = { y: yDir, x0: -240, x1: 240 };
            model.movingFocus = focus;

            var vx = focus.x;
            var vy = (focus.y + yDir) / 2;
            var p_val = (focus.y - yDir) / 2;
            model.conic = { type: 'parabola', vx: vx, vy: vy, p: p_val };

            for (var j = 0; j < N; j++) {
                var xq = -240 + (j * 480) / (N - 1);
                var q2 = { x: xq, y: yDir };
                var n2 = norm({ x: q2.x - focus.x, y: q2.y - focus.y });
                var m2 = { x: (q2.x + focus.x) / 2, y: (q2.y + focus.y) / 2 };
                var c2 = dot(n2, m2);
                var side2 = dot(n2, focus) - c2 >= 0 ? 1 : -1;
                model.points.push(q2);
                model.folds.push({ n: n2, c: c2, side: side2, q: q2 });
            }
            return model;
        }

        // hyperbola-fold
        var h1 = { x: -80, y: 0 };
        var h2 = { x: 80, y: 0 };
        var hr = 100;
        model.foci = [h1, h2];
        model.circle = { c: h1, r: hr };
        model.movingFocus = h2;

        var hcx = (h1.x + h2.x) / 2;
        var hcy = (h1.y + h2.y) / 2;
        var ha = hr / 2;
        var hc_dist = Math.hypot(h2.x - h1.x, h2.y - h1.y) / 2;
        var hb = Math.sqrt(hc_dist * hc_dist - ha * ha);
        model.conic = { type: 'hyperbola', cx: hcx, cy: hcy, a: ha, b: hb };

        for (var k = 0; k < N; k++) {
            var th2 = -Math.PI / 2 + (k * 2 * Math.PI) / N;
            var q3 = { x: h1.x + hr * Math.cos(th2), y: h1.y + hr * Math.sin(th2) };
            var n3 = norm({ x: q3.x - h2.x, y: q3.y - h2.y });
            var m3 = { x: (q3.x + h2.x) / 2, y: (q3.y + h2.y) / 2 };
            var c3 = dot(n3, m3);
            var side3 = dot(n3, h2) - c3 >= 0 ? 1 : -1;
            model.points.push(q3);
            model.folds.push({ n: n3, c: c3, side: side3, q: q3 });
        }

        return model;
    };

    FoldInteractive.prototype.drawPaperBase = function () {
        var ctx = this.ctx;
        var rect = this.rectPolygon();
        var p0 = this.project({ x: rect[0].x, y: rect[0].y, z: 0 });
        var p1 = this.project({ x: rect[1].x, y: rect[1].y, z: 0 });
        var p2 = this.project({ x: rect[2].x, y: rect[2].y, z: 0 });
        var p3 = this.project({ x: rect[3].x, y: rect[3].y, z: 0 });

        // soft shadow under the sheet
        ctx.fillStyle = 'rgba(120, 136, 153, 0.18)';
        ctx.beginPath();
        ctx.moveTo(p0.x + 10, p0.y + 12);
        ctx.lineTo(p1.x + 12, p1.y + 14);
        ctx.lineTo(p2.x + 14, p2.y + 16);
        ctx.lineTo(p3.x + 12, p3.y + 14);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#c8d0d9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };

    FoldInteractive.prototype.drawFoldedHalf = function (fold, amount, movingFocus) {
        if (!fold || amount <= 0.001) {
            return;
        }
        var ctx = this.ctx;
        var poly = this.clipByHalfPlane(this.rectPolygon(), fold.n, fold.c, fold.side);
        if (poly.length < 3) {
            return;
        }

        var phi = amount * Math.PI; // 0..180°
        var cphi = Math.cos(phi);
        var sphi = Math.sin(phi);

        var screenPts = [];
        for (var i = 0; i < poly.length; i++) {
            var p = poly[i];
            var d = Math.max(0, fold.side * (dot(fold.n, p) - fold.c));
            // rotate around crease axis: normal component scales by cos(phi), height by sin(phi)
            var nx = fold.side * fold.n.x;
            var ny = fold.side * fold.n.y;
            var p2 = {
                x: p.x + nx * d * (cphi - 1),
                y: p.y + ny * d * (cphi - 1),
                z: d * sphi * 1.25
            };
            screenPts.push(this.project(p2));
        }

        if (screenPts.length < 3) {
            return;
        }

        ctx.beginPath();
        for (var j = 0; j < screenPts.length; j++) {
            var sp = screenPts[j];
            if (j === 0) {
                ctx.moveTo(sp.x, sp.y);
            } else {
                ctx.lineTo(sp.x, sp.y);
            }
        }
        ctx.closePath();

        // Front/back paper tint during fold for clearer depth cue
        if (cphi >= 0) {
            ctx.fillStyle = 'rgba(205, 220, 238, 0.88)';
            ctx.strokeStyle = 'rgba(110, 130, 152, 0.95)';
        } else {
            ctx.fillStyle = 'rgba(178, 201, 225, 0.92)';
            ctx.strokeStyle = 'rgba(90, 112, 136, 0.98)';
        }
        ctx.lineWidth = 1.9;
        ctx.fill();
        ctx.stroke();

        if (movingFocus) {
            var dFocus = Math.max(0, fold.side * (dot(fold.n, movingFocus) - fold.c));
            var nxFocus = fold.side * fold.n.x;
            var nyFocus = fold.side * fold.n.y;
            var mf2 = {
                x: movingFocus.x + nxFocus * dFocus * (cphi - 1),
                y: movingFocus.y + nyFocus * dFocus * (cphi - 1),
                z: dFocus * sphi * 1.25
            };
            var projMf = this.project(mf2);

            ctx.fillStyle = '#c1121f';
            ctx.beginPath();
            ctx.arc(projMf.x, projMf.y, 6, 0, Math.PI * 2);
            ctx.fill();

            var projTarget = this.project({ x: fold.q.x, y: fold.q.y, z: 0 });
            ctx.strokeStyle = 'rgba(193, 18, 31, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(projMf.x, projMf.y);
            ctx.lineTo(projTarget.x, projTarget.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    };

    FoldInteractive.prototype.drawModelMarks = function (model) {
        var ctx = this.ctx;

        if (model.conic) {
            ctx.strokeStyle = 'rgba(10, 132, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            var numSegments = 100;

            if (model.conic.type === 'ellipse') {
                for (var i = 0; i <= numSegments; i++) {
                    var th = (i * 2 * Math.PI) / numSegments;
                    var pt = {
                        x: model.conic.cx + model.conic.a * Math.cos(th),
                        y: model.conic.cy + model.conic.b * Math.sin(th),
                        z: 0
                    };
                    var projPt = this.project(pt);
                    if (i === 0) ctx.moveTo(projPt.x, projPt.y);
                    else ctx.lineTo(projPt.x, projPt.y);
                }
            } else if (model.conic.type === 'hyperbola') {
                for (var i = 0; i <= numSegments; i++) {
                    var t = -2 + (i * 4) / numSegments;
                    var cosh = (Math.exp(t) + Math.exp(-t)) / 2;
                    var sinh = (Math.exp(t) - Math.exp(-t)) / 2;
                    var pt = {
                        x: model.conic.cx + model.conic.a * cosh,
                        y: model.conic.cy + model.conic.b * sinh,
                        z: 0
                    };
                    var projPt = this.project(pt);
                    if (i === 0) ctx.moveTo(projPt.x, projPt.y);
                    else ctx.lineTo(projPt.x, projPt.y);
                }
                ctx.stroke();
                ctx.beginPath();
                for (var i = 0; i <= numSegments; i++) {
                    var t = -2 + (i * 4) / numSegments;
                    var cosh = (Math.exp(t) + Math.exp(-t)) / 2;
                    var sinh = (Math.exp(t) - Math.exp(-t)) / 2;
                    var pt = {
                        x: model.conic.cx - model.conic.a * cosh,
                        y: model.conic.cy + model.conic.b * sinh,
                        z: 0
                    };
                    var projPt = this.project(pt);
                    if (i === 0) ctx.moveTo(projPt.x, projPt.y);
                    else ctx.lineTo(projPt.x, projPt.y);
                }
            } else if (model.conic.type === 'parabola') {
                for (var i = 0; i <= numSegments; i++) {
                    var x = -200 + (i * 400) / numSegments;
                    var y = model.conic.vy + (x - model.conic.vx) * (x - model.conic.vx) / (4 * model.conic.p);
                    var pt = { x: x, y: y, z: 0 };
                    var projPt = this.project(pt);
                    if (i === 0) ctx.moveTo(projPt.x, projPt.y);
                    else ctx.lineTo(projPt.x, projPt.y);
                }
            }
            ctx.stroke();
        }

        if (model.circle) {
            ctx.strokeStyle = '#9aa7b2';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            var numSegments = 64;
            for (var i = 0; i <= numSegments; i++) {
                var th = (i * 2 * Math.PI) / numSegments;
                var pt = {
                    x: model.circle.c.x + model.circle.r * Math.cos(th),
                    y: model.circle.c.y + model.circle.r * Math.sin(th),
                    z: 0
                };
                var projPt = this.project(pt);
                if (i === 0) {
                    ctx.moveTo(projPt.x, projPt.y);
                } else {
                    ctx.lineTo(projPt.x, projPt.y);
                }
            }
            ctx.stroke();
        }

        if (model.directrix) {
            var p0 = this.project({ x: model.directrix.x0, y: model.directrix.y, z: 0 });
            var p1 = this.project({ x: model.directrix.x1, y: model.directrix.y, z: 0 });
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
        }

        ctx.fillStyle = '#6f7f8f';
        for (var i = 0; i < model.points.length; i++) {
            var q = this.project({ x: model.points[i].x, y: model.points[i].y, z: 0 });
            ctx.beginPath();
            ctx.arc(q.x, q.y, 2.2, 0, Math.PI * 2);
            ctx.fill();
        }

        for (var j = 0; j < model.foci.length; j++) {
            var f = this.project({ x: model.foci[j].x, y: model.foci[j].y, z: 0 });
            ctx.fillStyle = '#c1121f';
            ctx.beginPath();
            ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#222';
            ctx.font = 'bold 12px sans-serif';
            var lab = this.type === 'parabola-fold' ? 'F' : 'F' + (j + 1);
            ctx.fillText(lab, f.x + 9, f.y - 8);
        }
    };

    FoldInteractive.prototype.render = function () {
        this.prepareCanvas();
        var ctx = this.ctx;

        var N = clamp(Number(this.steps.value) || 24, 8, 72);
        if (Number(this.steps.value) !== N) {
            this.steps.value = N;
        }
        var t = clamp((Number(this.progress.value) || 0) / 100, 0, 1);
        var model = this.getModel(N);

        this.drawPaperBase();

        var idxFloat = t * (N - 1);
        var idx = Math.floor(idxFloat);
        var frac = idxFloat - idx;

        // Completed creases
        ctx.strokeStyle = '#b9c7d6';
        ctx.lineWidth = 1.1;
        for (var i = 0; i < idx; i++) {
            var seg = this.lineSegmentOnRect(model.folds[i].n, model.folds[i].c);
            if (!seg) { continue; }
            var a = this.project({ x: seg[0].x, y: seg[0].y, z: 0 });
            var b = this.project({ x: seg[1].x, y: seg[1].y, z: 0 });
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        // Active fold (3D look)
        var activeFold = model.folds[Math.min(idx, model.folds.length - 1)];
        var amount = idxFloat <= 1e-4 ? 0 : Math.pow(Math.sin(frac * Math.PI), 0.6);
        this.drawFoldedHalf(activeFold, amount, model.movingFocus);

        // Active crease line
        var activeSeg = this.lineSegmentOnRect(activeFold.n, activeFold.c);
        if (activeSeg) {
            var a2 = this.project({ x: activeSeg[0].x, y: activeSeg[0].y, z: 0 });
            var b2 = this.project({ x: activeSeg[1].x, y: activeSeg[1].y, z: 0 });
            ctx.strokeStyle = '#ff7f2a';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(a2.x, a2.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.stroke();
        }

        this.drawModelMarks(model);

        // Highlight active target point
        var activeQ = this.project({ x: activeFold.q.x, y: activeFold.q.y, z: 0 });
        ctx.fillStyle = '#ff7f2a';
        ctx.beginPath();
        ctx.arc(activeQ.x, activeQ.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#374151';
        ctx.font = '600 13px sans-serif';
        ctx.fillText('Pliegue ' + (Math.min(idx + 1, N)) + ' / ' + N, 18, 28);
    };

    document.addEventListener('DOMContentLoaded', function () {
        var blocks = document.querySelectorAll('.fold-interactive');
        for (var i = 0; i < blocks.length; i++) {
            new FoldInteractive(blocks[i]);
        }
    });
})();
