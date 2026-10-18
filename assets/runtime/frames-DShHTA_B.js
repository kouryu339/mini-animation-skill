import { r as e } from "./compile-CHXnrHMM.js";
import { n as t, o as n, r, t as i } from "./images-6P03TLU2.js";
//#region src/export/captions.ts
var a = {
	sans: "\"Microsoft YaHei\",sans-serif",
	serif: "SimSun,serif",
	mono: "monospace"
};
function o(e, t, n, r, i) {
	let o = t.caption;
	if (!o) return;
	let s = Math.max(12, Math.min(n.fontSize, n.fontSize * r / 1280)), c = n.padding * r / 1280, l = r * (1 - n.inset * 2 / 100), u = l - c * 2, d = s * n.lineHeight;
	e.save(), e.globalAlpha = o.opacity, e.font = `${s}px ${a[n.font]}`, e.textBaseline = "middle", e.textAlign = n.align;
	let f = `${n.showSpeaker && o.speaker ? o.speaker + "\n" : ""}${o.text}`, p = [];
	for (let t of f.split("\n")) {
		let n = "";
		for (let r of Array.from(t)) {
			let t = n + r;
			n && e.measureText(t).width > u ? (p.push(n), n = r) : n = t;
		}
		p.push(n);
	}
	let m = p.length * d + c * 2, h = r * n.inset / 100, g = n.position === "top" ? i * n.offset / 100 : i * (1 - n.offset / 100) - m;
	e.fillStyle = n.background, e.beginPath(), e.roundRect(h, g, l, m, n.radius * r / 1280), e.fill(), e.fillStyle = n.color, n.shadow && (e.shadowColor = "#00000099", e.shadowBlur = 4, e.shadowOffsetY = 1);
	let _ = n.align === "center" ? r / 2 : n.align === "right" ? h + l - c : h + c;
	p.forEach((t, n) => e.fillText(t, _, g + c + d * (n + .5))), e.restore();
}
//#endregion
//#region src/export/frames.ts
var s = (e) => {
	if (e?.aborted) throw new DOMException("导出已取消", "AbortError");
};
function c(a, c, u, d, f) {
	s(f);
	let p = a.document;
	if (d.canvasDrawers?.length && p.surface.type !== "canvas") throw Error("Canvas drawers require a canvas surface");
	if (d.captionsEnabled !== void 0 && typeof d.captionsEnabled != "boolean") throw Error("字幕开关必须是布尔值");
	let m = n(p.captionStyle, d.captionStyle, p.captionTheme), h = document.createElement("div");
	h.style.cssText = `position:fixed;left:-10000px;top:0;width:${p.width}px;height:${p.height}px;pointer-events:none;`, h.setAttribute("aria-hidden", "true"), document.body.appendChild(h);
	let g = document.createElement("canvas");
	g.width = c, g.height = u;
	let _ = g.getContext("2d", {
		alpha: !1,
		willReadFrequently: !0
	});
	if (!_) throw h.remove(), Error("Canvas unavailable");
	let v = new i(p, document, d), y = () => v.destroy(), b, x, S = () => {
		f?.removeEventListener("abort", y), v.destroy(), x?.destroy(), b?.destroy(), h.remove();
	};
	try {
		b = p.surface.type === "svg" ? new t(h, a, v) : new r(h, a, v, d.canvasDrawers), x = p.effects?.length ? new e(h, p) : void 0, f?.addEventListener("abort", y, { once: !0 });
	} catch (e) {
		throw S(), e;
	}
	return {
		canvas: g,
		context: _,
		async prepare() {
			s(f), await v.prepare(), s(f);
		},
		async render(e) {
			s(f);
			let n = a.sample(e);
			if (b.render(n), x?.render(n), _.fillStyle = p.background && p.background !== "none" ? p.background : "#000000", _.fillRect(0, 0, c, u), b instanceof t) {
				let e = b.element.cloneNode(!0);
				e.setAttribute("width", String(p.width)), e.setAttribute("height", String(p.height)), e.removeAttribute("style");
				let t = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(e)], { type: "image/svg+xml" })), n = new Image();
				try {
					await l(n, t, f), s(f), _.drawImage(n, 0, 0, c, u);
				} finally {
					n.src = "", URL.revokeObjectURL(t);
				}
			} else _.drawImage(b.element, 0, 0, c, u);
			return x && _.drawImage(x.element, 0, 0, c, u), d.captionsEnabled !== !1 && o(_, n, m, c, u), g;
		},
		destroy: S
	};
}
function l(e, t, n) {
	return new Promise((r, i) => {
		let a, o = (t) => {
			clearTimeout(a), n?.removeEventListener("abort", s), e.onload = null, e.onerror = null, t ? i(t) : r();
		}, s = () => o(new DOMException("导出已取消", "AbortError"));
		e.onload = () => o(), e.onerror = () => o(/* @__PURE__ */ Error("动画帧无法绘制")), a = setTimeout(() => o(/* @__PURE__ */ Error("动画帧绘制超时")), 1e4), n?.addEventListener("abort", s, { once: !0 }), n?.aborted ? s() : e.src = t;
	});
}
//#endregion
export { c as n, s as t };
