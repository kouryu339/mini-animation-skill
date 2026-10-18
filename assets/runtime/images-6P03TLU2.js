import { a as e, c as t, d as n, f as r, h as i, l as a, o, p as s, s as c, x as l } from "./compile-CHXnrHMM.js";
//#region src/captions.ts
var u = Object.freeze({
	fontSize: 24,
	font: "sans",
	color: "#f5eedc",
	background: "#0b171ecc",
	align: "center",
	position: "bottom",
	inset: 8,
	offset: 2,
	padding: 8,
	radius: 6,
	lineHeight: 1.4,
	shadow: !0,
	showSpeaker: !1
});
function d(e, t, n) {
	let i = {
		...u,
		...n === "paper" ? {
			color: "#252e2b",
			background: "#e8ebdf",
			shadow: !1
		} : {}
	};
	for (let n of [e, t]) if (n !== void 0) {
		r(n);
		for (let [e, t] of Object.entries(n)) t !== void 0 && (i[e] = t);
	}
	return Object.freeze(i);
}
var f = {
	sans: "\"Microsoft YaHei\",sans-serif",
	serif: "SimSun,serif",
	mono: "monospace"
}, p = class {
	element;
	style;
	constructor(e, t, n) {
		this.style = d(t.captionStyle, n, t.captionTheme);
		let r = this.style, i = e.ownerDocument.createElement("div");
		this.element = i, i.setAttribute("data-motion-caption", ""), i.setAttribute("aria-live", "off");
		let a = (e) => `${e / 1280 * 100}cqw`;
		i.style.cssText = "position:absolute;box-sizing:border-box;z-index:1;white-space:pre-wrap;overflow-wrap:anywhere;pointer-events:none;", i.style.fontFamily = f[r.font], i.style.fontSize = `clamp(12px,${a(r.fontSize)},${r.fontSize}px)`, i.style.lineHeight = String(r.lineHeight), i.style.color = r.color, i.style.backgroundColor = r.background, i.style.textAlign = r.align, i.style.left = i.style.right = r.inset + "%", i.style[r.position] = r.offset + "%", i.style.padding = a(r.padding), i.style.borderRadius = a(r.radius), i.style.textShadow = r.shadow ? "0 1px 4px #00000099" : "none", e.appendChild(i);
	}
	render(e) {
		let t = e.caption;
		this.element.hidden = !t, this.element.style.opacity = String(t?.opacity ?? 0), this.element.textContent = t ? `${this.style.showSpeaker && t.speaker ? t.speaker + "\n" : ""}${t.text}` : "";
	}
	destroy() {
		this.element.remove();
	}
};
//#endregion
//#region src/layers.ts
function m(e) {
	return [
		{
			id: "$default",
			space: "canvas"
		},
		...(e.layers ?? []).filter((e) => e.space === "canvas"),
		...(e.layers ?? []).filter((e) => e.space === "camera")
	];
}
//#endregion
//#region src/canvas.ts
var h = {
	sans: "\"Microsoft YaHei\",sans-serif",
	serif: "SimSun,serif",
	mono: "monospace"
}, g = class {
	compiled;
	images;
	drawers;
	element;
	ctx;
	roots = [];
	children = /* @__PURE__ */ new Map();
	paths = /* @__PURE__ */ new Map();
	constructor(e, t, n, r = []) {
		this.compiled = t, this.images = n, this.drawers = r;
		let i = t.document;
		if (i.surface.type !== "canvas") throw Error("Expected canvas surface");
		let a = new Set(m(i).map((e) => e.id));
		this.drawers = r.map((e) => {
			if (!a.has(e.layer ?? "$default") || typeof e.draw != "function") throw Error("Canvas drawer requires an existing layer and a draw function");
			return { ...e };
		}), this.element = e.ownerDocument.createElement("canvas"), this.element.setAttribute("aria-label", "动画画面"), this.element.style.cssText = "display:block;width:100%;height:100%;object-fit:contain;";
		let o = Math.min(e.ownerDocument.defaultView?.devicePixelRatio ?? 1, 2, Math.sqrt(4194304 / (i.width * i.height)));
		this.element.width = i.width * o, this.element.height = i.height * o;
		let s = this.element.getContext("2d");
		if (!s) throw Error("Canvas 2D unavailable");
		this.ctx = s, s.scale(o, o);
		for (let e of t.entities) {
			if (e.parent) {
				let t = this.children.get(e.parent) ?? [];
				t.push(e), this.children.set(e.parent, t);
			} else this.roots.push(e);
			e.components.graphic?.type === "path" && this.paths.set(e.id, new Path2D(e.components.graphic.d));
		}
		e.appendChild(this.element);
	}
	render(e) {
		let t = this.ctx, n = this.compiled.document;
		t.clearRect(0, 0, n.width, n.height), n.background && n.background !== "none" && (t.fillStyle = n.background, t.fillRect(0, 0, n.width, n.height));
		let r = (n) => {
			let i = e.poses[n.id], a = n.components.graphic;
			if (t.save(), t.transform(...l(i)), t.globalAlpha *= i.opacity, i.opacity === 0) t.restore();
			else {
				if (a) {
					t.fillStyle = i.fill ?? a.fill ?? "#252e2b", t.strokeStyle = i.stroke ?? a.stroke ?? "#000", t.lineWidth = a.strokeWidth ?? 1, t.setLineDash(a.dash ?? []);
					let e = (i.fill ?? a.fill) !== "none", r = !!(i.stroke ?? a.stroke) && (i.stroke ?? a.stroke) !== "none";
					if (a.type === "image") {
						let e = this.images?.get(a.asset);
						if (e) {
							let n = i.width ?? a.width, r = i.height ?? a.height, o = a.fit ?? "contain", s = o === "cover" ? Math.max(n / e.width, r / e.height) : Math.min(n / e.width, r / e.height), c = o === "stretch" ? n : e.width * s, l = o === "stretch" ? r : e.height * s;
							t.beginPath(), t.rect(0, 0, n, r), t.clip(), t.drawImage(e.image, (n - c) / 2, (r - l) / 2, c, l);
						}
					} else if (a.type === "text") {
						t.font = `${a.fontSize ?? 20}px ${h[a.font ?? "sans"]}`, t.textAlign = a.align ?? "left";
						let n = Array.from(a.text ?? "").slice(0, Math.ceil(Array.from(a.text ?? "").length * (i.progress ?? 1))).join("");
						e && t.fillText(n, 0, 0), r && t.strokeText(n, 0, 0);
					} else {
						let o = this.paths.get(n.id);
						o || (o = new Path2D(), a.type === "rect" && o.roundRect(0, 0, i.width ?? a.width, i.height ?? a.height, Math.min(a.radius ?? 0, (i.width ?? a.width) / 2, (i.height ?? a.height) / 2)), a.type === "circle" && o.arc(0, 0, a.r, 0, Math.PI * 2), a.type === "line" && (o.moveTo(0, 0), o.lineTo((i.x2 ?? a.x2) * (i.progress ?? 1), (i.y2 ?? a.y2) * (i.progress ?? 1)))), e && a.type !== "line" && t.fill(o), r && t.stroke(o);
					}
				}
				for (let e of this.children.get(n.id) ?? []) r(e);
				t.restore();
			}
		};
		for (let i of m(n)) {
			t.save();
			try {
				i.space === "canvas" && s(t, e.camera, n.width, n.height);
				for (let e of this.roots) (e.layer ?? "$default") === i.id && r(e);
				for (let r of this.drawers) if ((r.layer ?? "$default") === i.id) {
					t.save(), t.beginPath();
					try {
						r.draw(t, {
							frame: e,
							time: e.clock,
							width: n.width,
							height: n.height
						});
					} finally {
						t.restore(), t.beginPath();
					}
				}
			} finally {
				t.restore();
			}
		}
	}
	destroy() {
		this.element.remove(), this.paths.clear(), this.children.clear(), this.roots = [], this.drawers = [];
	}
}, _ = "http://www.w3.org/2000/svg", v = /* @__PURE__ */ new Set([
	"svg",
	"g",
	"defs",
	"rect",
	"circle",
	"ellipse",
	"path",
	"polygon",
	"polyline",
	"line",
	"text",
	"tspan",
	"linearGradient",
	"radialGradient",
	"stop",
	"clipPath",
	"use",
	"filter",
	"feGaussianBlur",
	"image"
]), y = [
	"font-family",
	"font-size",
	"font-weight",
	"letter-spacing",
	"text-anchor",
	"role",
	"aria-label",
	"id",
	"fill",
	"fill-opacity",
	"stroke",
	"stroke-width",
	"stroke-opacity",
	"opacity",
	"transform",
	"clip-path",
	"filter",
	"stroke-linecap",
	"stroke-linejoin",
	"stroke-dasharray",
	"stroke-dashoffset",
	"fill-rule"
], b = {
	svg: [
		"viewBox",
		"width",
		"height"
	],
	g: [],
	defs: [],
	rect: [
		"x",
		"y",
		"width",
		"height",
		"rx",
		"ry"
	],
	circle: [
		"cx",
		"cy",
		"r"
	],
	ellipse: [
		"cx",
		"cy",
		"rx",
		"ry"
	],
	path: ["d"],
	polygon: ["points"],
	polyline: ["points"],
	line: [
		"x1",
		"y1",
		"x2",
		"y2"
	],
	text: [
		"x",
		"y",
		"dx",
		"dy",
		"font-size",
		"font-family",
		"font-weight",
		"letter-spacing",
		"text-anchor"
	],
	tspan: [
		"x",
		"y",
		"dx",
		"dy",
		"font-size",
		"font-family",
		"font-weight",
		"letter-spacing",
		"text-anchor"
	],
	linearGradient: [
		"x1",
		"y1",
		"x2",
		"y2",
		"gradientUnits",
		"gradientTransform",
		"href"
	],
	radialGradient: [
		"cx",
		"cy",
		"r",
		"fx",
		"fy",
		"gradientUnits",
		"gradientTransform",
		"href"
	],
	stop: [
		"offset",
		"stop-color",
		"stop-opacity"
	],
	clipPath: [],
	use: [
		"x",
		"y",
		"width",
		"height",
		"href"
	],
	filter: [
		"x",
		"y",
		"width",
		"height"
	],
	feGaussianBlur: ["stdDeviation"],
	image: [
		"x",
		"y",
		"width",
		"height",
		"href",
		"preserveAspectRatio"
	]
}, x = 0;
function S(e, t, n = -1e5, r = 1e5, i = !1) {
	(!/^[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?%?$/.test(e) || e.endsWith("%") && !i) && c(t, "invalid SVG number"), a(Number(e.replace("%", "")), t, n, r);
}
function C(e, t) {
	let n = e, r = 0;
	n = n.replace(/(translate|rotate|scale|matrix|skewX|skewY)\s*\(([^()]*)\)/g, (e, n, i) => {
		let o = i.trim().split(/[\s,]+/).filter(Boolean).map(Number);
		(!{
			translate: [1, 2],
			rotate: [1, 3],
			scale: [1, 2],
			matrix: [6],
			skewX: [1],
			skewY: [1]
		}[n].includes(o.length) || ++r > 16) && c(t, "invalid SVG transform");
		for (let e of o) a(e, t);
		return "";
	}), (n.trim() || !r) && c(t, "unsupported SVG transform");
}
var w = class {
	compiled;
	images;
	element;
	worlds = [];
	imageNodes = /* @__PURE__ */ new Map();
	targets = /* @__PURE__ */ new Map();
	graphics = /* @__PURE__ */ new Map();
	constructor(r, i, a) {
		this.compiled = i, this.images = a;
		let s = i.document;
		if (s.surface.type !== "svg") throw Error("Expected SVG surface");
		let l = s.surface.source;
		/<!\s*(?:DOCTYPE|ENTITY)|<\?/i.test(l) && c("surface.source", "DTD/entities forbidden");
		let u = new DOMParser().parseFromString(l, "image/svg+xml"), d = u.documentElement;
		(u.querySelector("parsererror") || d.localName !== "svg" || d.namespaceURI !== _) && c("surface.source", "invalid SVG document");
		let f = /* @__PURE__ */ new Map(), p = [], h = [], g = 0, w = (r, i, a) => {
			(i > 32 || p.length >= e.nodes) && c("svg", "SVG depth or node budget exceeded"), (r.namespaceURI !== _ || !v.has(r.localName)) && c("svg." + r.localName, "unsupported SVG element"), p.push(r);
			let l = "svg." + (r.id || r.localName);
			r.localName === "filter" && (r.children.length !== 1 || r.children[0]?.localName !== "feGaussianBlur") && c(l, "only a single bounded blur filter is supported"), r.id && (t(r.id, l + ".id"), f.has(r.id) && c(l, "duplicate SVG ID"), f.set(r.id, r));
			for (let e of Array.from(r.attributes)) {
				if (e.name === "xmlns" || e.name === "xmlns:xlink") {
					e.value !== _ && e.value !== "http://www.w3.org/1999/xlink" && c(l, "unknown namespace");
					continue;
				}
				let t = e.localName, i = e.value;
				if (e.namespaceURI && e.namespaceURI !== "http://www.w3.org/1999/xlink" && c(l, "attribute namespace forbidden"), [...y, ...b[r.localName]].includes(t) || c(l + "." + t, "unsupported SVG attribute"), r.localName === "image" && t === "href") {
					(!/^asset:[a-zA-Z_][\w.-]*$/.test(i) || !s.assets?.[i.slice(6)]) && c(l + ".href", "image requires a declared asset:ID");
					continue;
				}
				if (t === "id") continue;
				if (t === "aria-label") {
					i.length > 500 && c(l, "label too long");
					continue;
				}
				if (t === "role") {
					i !== "img" && c(l, "unsupported role");
					continue;
				}
				if (t === "href" || t === "clip-path" || t === "filter" || ["fill", "stroke"].includes(t) && i.startsWith("url(")) {
					let e = t === "href" ? /^#([\w.-]+)$/.exec(i) : /^url\(#([\w.-]+)\)$/.exec(i);
					e || c(l + "." + t, "only local SVG references"), h.push({
						owner: r,
						id: e[1],
						kind: t
					});
					continue;
				}
				if ([
					"fill",
					"stroke",
					"stop-color"
				].includes(t)) {
					o(i, l + "." + t);
					continue;
				}
				if (t === "d") {
					g += n(i, l + ".d").length;
					continue;
				}
				if (t === "points" || t === "viewBox" || t === "stroke-dasharray") {
					let e = i.trim().split(/[\s,]+/);
					(e.length > 2048 || !e.length || t === "viewBox" && e.length !== 4 || t === "points" && e.length % 2) && c(l, "invalid geometry");
					for (let t of e) S(t, l);
					g += i.length;
					continue;
				}
				if (t === "transform" || t === "gradientTransform") {
					C(i, l + "." + t);
					continue;
				}
				let a = {
					preserveAspectRatio: [
						"none",
						"xMidYMid meet",
						"xMidYMid slice"
					],
					"stroke-linecap": [
						"butt",
						"round",
						"square"
					],
					"stroke-linejoin": [
						"miter",
						"round",
						"bevel"
					],
					"fill-rule": ["nonzero", "evenodd"],
					"text-anchor": [
						"start",
						"middle",
						"end"
					],
					gradientUnits: ["userSpaceOnUse", "objectBoundingBox"],
					"font-weight": [
						"normal",
						"bold",
						"400",
						"500",
						"600",
						"700"
					],
					"font-family": [
						"serif",
						"sans-serif",
						"monospace",
						"SimSun,serif",
						"SimSun",
						"Georgia,serif",
						"Georgia",
						"Microsoft YaHei,sans-serif",
						"Microsoft YaHei"
					]
				};
				a[t] ? a[t].includes(i) || c(l + "." + t, "unsupported SVG value") : r.localName === "filter" && [
					"x",
					"y",
					"width",
					"height"
				].includes(t) ? (i.endsWith("%") || c(l, "filter bounds must be percentages"), S(i, l, t === "x" || t === "y" ? -50 : 1, 200, !0)) : t.endsWith("opacity") || t === "opacity" ? S(i, l, 0, 1) : t === "offset" ? S(i, l, 0, i.endsWith("%") ? 100 : 1, !0) : t === "stdDeviation" ? S(i, l, 0, 12) : t === "font-size" ? S(i, l, 1, 256) : S(i, l, -1e5, 1e5, [
					"x",
					"y",
					"width",
					"height",
					"cx",
					"cy",
					"r",
					"rx",
					"ry",
					"x1",
					"y1",
					"x2",
					"y2",
					"fx",
					"fy"
				].includes(t));
			}
			if (r.localName === "image") {
				r.hasAttribute("href") || c(l, "image href required");
				for (let e of ["width", "height"]) S(r.getAttribute(e) ?? "", l + "." + e, 1, 4096);
			}
			for (let e of Array.from(r.childNodes)) e.nodeType === 1 ? w(e, i + 1, a || [
				"defs",
				"filter",
				"clipPath",
				"linearGradient",
				"radialGradient"
			].includes(r.localName)) : e.nodeType === 3 || e.nodeType === 4 ? (e.textContent.trim() && !["text", "tspan"].includes(r.localName) && c(l, "text outside text element"), e.textContent.length > 2e3 && c(l, "text too long")) : e.nodeType !== 8 && c(l, "XML instructions forbidden");
		};
		w(d, 0, !1), g > e.geometry && c("svg", "SVG geometry budget exceeded");
		let T = d.getAttribute("viewBox");
		if (T) {
			let e = T.trim().split(/[\s,]+/).map(Number);
			(e[0] !== 0 || e[1] !== 0 || e[2] !== s.width || e[3] !== s.height) && c("svg.viewBox", "must match scene 0 0 width height");
		}
		let E = /* @__PURE__ */ new Map();
		for (let e of h) {
			let t = f.get(e.id);
			t || c("svg", "missing local reference " + e.id), e.kind === "href" && e.owner.localName === "use" && ![
				"g",
				"path",
				"rect",
				"circle",
				"ellipse",
				"line",
				"polygon",
				"polyline",
				"text"
			].includes(t.localName) && c("svg", "use must reference graphics"), (e.kind === "filter" && t.localName !== "filter" || e.kind === "clip-path" && t.localName !== "clipPath" || ["fill", "stroke"].includes(e.kind) && !["linearGradient", "radialGradient"].includes(t.localName)) && c("svg", "reference type mismatch");
			let n = E.get(e.owner) ?? [];
			n.push(t), E.set(e.owner, n);
		}
		let D = 0, O = (e, t) => {
			t.has(e) && c("svg", "cyclic SVG reference"), ++D > 8192 && c("svg", "expanded SVG budget exceeded");
			let n = new Set(t);
			n.add(e);
			for (let t of Array.from(e.children)) O(t, n);
			for (let t of E.get(e) ?? []) O(t, n);
		};
		O(d, /* @__PURE__ */ new Set());
		let k = "rusie-motion-" + ++x + "-", A = r.ownerDocument, j = new Set(i.entities.map((e) => e.id));
		for (let e of j) {
			let t = f.get(e);
			(!t || ![
				"g",
				"rect",
				"circle",
				"ellipse",
				"path",
				"polygon",
				"polyline",
				"line",
				"text",
				"use",
				"image"
			].includes(t.localName) || t.closest("defs,filter,clipPath,linearGradient,radialGradient")) && c("tracks." + e, "SVG target must be visible graphics");
		}
		for (let e of i.entities) e.layer && f.get(e.id)?.parentElement !== d && c("surface.entities." + e.id, "layer assignment requires a top-level SVG graphic or group");
		for (let e of s.tracks ?? []) {
			if (e.type === "follow" || e.type === "camera" || e.type === "transform") continue;
			let t = f.get(e.target), n = e.property;
			(["width", "height"].includes(n) && !["rect", "image"].includes(t.localName) || ["x2", "y2"].includes(n) && t.localName !== "line" || n === "progress" && ![
				"path",
				"line",
				"circle",
				"ellipse",
				"rect",
				"polygon",
				"polyline"
			].includes(t.localName)) && c("tracks." + e.target, "unsupported SVG animated property");
		}
		let M = (e) => {
			let t = A.createElementNS(_, e.localName);
			for (let n of Array.from(e.attributes)) {
				if (n.name.startsWith("xmlns")) continue;
				let r = n.value;
				if (n.localName === "id") r = k + r;
				else if (n.localName === "href") {
					if (e.localName === "image") {
						this.imageNodes.set(t, r.slice(6));
						continue;
					}
					r = "#" + k + r.slice(1);
				} else /^url\(#/.test(r) && (r = r.replace("#", "#" + k));
				t.setAttribute(n.localName, r);
			}
			for (let n of Array.from(e.childNodes)) n.nodeType === 1 ? t.appendChild(M(n)) : (n.nodeType === 3 || n.nodeType === 4) && t.appendChild(A.createTextNode(n.textContent ?? ""));
			if (e.id && j.has(e.id)) {
				let n = A.createElementNS(_, "g");
				return n.appendChild(t), this.targets.set(e.id, n), this.graphics.set(e.id, t), n;
			}
			return t;
		};
		this.element = M(d), this.element.setAttribute("viewBox", `0 0 ${s.width} ${s.height}`), this.element.setAttribute("width", "100%"), this.element.setAttribute("height", "100%"), this.element.style.cssText = "display:block;width:100%;height:100%;";
		let N = Array.from(this.element.childNodes), P = /* @__PURE__ */ new Map();
		for (let e of i.entities) e.layer && P.set(this.targets.get(e.id), e.layer);
		for (let e of m(s)) {
			let t = A.createElementNS(_, "g");
			t.setAttribute("data-motion-layer", e.id), t.setAttribute("data-motion-space", e.space), e.space === "canvas" && (t.setAttribute("data-motion-camera", ""), this.worlds.push(t));
			for (let n of N) (n.nodeType !== 1 || n.localName !== "defs") && (P.get(n) ?? "$default") === e.id && t.appendChild(n);
			this.element.appendChild(t);
		}
		s.background && (this.element.style.background = s.background), r.appendChild(this.element);
		for (let e of s.tracks ?? []) e.type !== "follow" && e.type !== "camera" && e.type !== "transform" && e.property === "progress" && this.graphics.get(e.target).setAttribute("pathLength", "1");
	}
	render(e) {
		let t = i(e.camera, this.compiled.document.width, this.compiled.document.height);
		for (let e of this.worlds) e.setAttribute("transform", `matrix(${t.scale} 0 0 ${t.scale} ${t.x} ${t.y})`);
		for (let [e, t] of this.imageNodes) {
			let n = this.images?.get(t);
			n && e.getAttribute("href") !== n.dataURL && e.setAttribute("href", n.dataURL);
		}
		for (let [t, n] of this.targets) {
			let r = e.poses[t];
			if (!r) continue;
			n.setAttribute("transform", `matrix(${l(r).join(" ")})`), n.setAttribute("opacity", String(r.opacity));
			let i = this.graphics.get(t);
			for (let e of [
				"width",
				"height",
				"x2",
				"y2",
				"fill",
				"stroke"
			]) r[e] !== void 0 && i.setAttribute(e, String(r[e]));
			r.progress !== void 0 && (i.setAttribute("stroke-dasharray", "1"), i.setAttribute("stroke-dashoffset", String(1 - r.progress)));
		}
	}
	destroy() {
		this.element.remove(), this.targets.clear(), this.graphics.clear(), this.imageNodes.clear(), this.worlds = [];
	}
};
//#endregion
//#region src/images.ts
function T(t) {
	let n = t, r = new DataView(n.buffer, n.byteOffset, n.byteLength), i = (e, t) => String.fromCharCode(...n.slice(e, e + t)), a = () => c("assets", "invalid, animated or unsupported raster image");
	if (n.length < 24 || n.length > e.imageBytes) return a();
	let o = 0, s = 0, l = "";
	if (n[0] === 137 && i(1, 7) === "PNG\r\n\n" && i(12, 4) === "IHDR") {
		o = r.getUint32(16), s = r.getUint32(20), l = "image/png";
		for (let e = 8; e + 12 <= n.length;) {
			let t = r.getUint32(e);
			if (e + 12 + t > n.length || i(e + 4, 4) === "acTL") return a();
			e += 12 + t;
		}
	} else if (n[0] === 255 && n[1] === 216) {
		l = "image/jpeg";
		let e = 2;
		for (; e + 4 <= n.length;) {
			if (n[e++] !== 255) return a();
			for (; n[e] === 255;) e++;
			let t = n[e++];
			if (t === 218 || t === 217) break;
			if (e + 2 > n.length) return a();
			let i = r.getUint16(e);
			if (i < 2 || e + i > n.length) return a();
			if ([
				192,
				193,
				194
			].includes(t)) {
				if (i < 8) return a();
				s = r.getUint16(e + 3), o = r.getUint16(e + 5);
				break;
			}
			e += i;
		}
	} else if (i(0, 4) === "RIFF" && i(8, 4) === "WEBP") {
		l = "image/webp";
		let e = i(12, 4);
		if (n.length < 30) return a();
		if (e === "VP8X") {
			if (n[20] & 2) return a();
			o = 1 + n[24] + (n[25] << 8) + (n[26] << 16), s = 1 + n[27] + (n[28] << 8) + (n[29] << 16);
		} else if (e === "VP8L" && n[20] === 47) {
			let e = r.getUint32(21, !0);
			o = (e & 16383) + 1, s = (e >>> 14 & 16383) + 1;
		} else e === "VP8 " && i(23, 3) === "*" && (o = r.getUint16(26, !0) & 16383, s = r.getUint16(28, !0) & 16383);
	}
	return (!l || !o || !s || o > 4096 || s > 4096 || o * s > e.imagePixels) && c("assets", "unsupported image or decoded pixel budget exceeded"), {
		mime: l,
		width: o,
		height: s
	};
}
async function E(t, n) {
	let r = await fetch(t, {
		signal: n,
		credentials: "omit",
		mode: "same-origin",
		redirect: "error"
	});
	if (!r.ok || !r.body) throw Error("Image load failed: " + r.status);
	let i = r.body.getReader(), a = [], o = 0;
	try {
		for (;;) {
			let { done: t, value: n } = await i.read();
			if (t) break;
			o += n.length, o > e.imageBytes && c("assets", "image byte budget exceeded"), a.push(n);
		}
	} finally {
		await i.cancel().catch(() => {}), i.releaseLock();
	}
	return new Blob(a);
}
var D = class {
	document;
	owner;
	options;
	items = /* @__PURE__ */ new Map();
	controller = new AbortController();
	pending;
	disposed = !1;
	constructor(e, t, n = {}) {
		this.document = e, this.owner = t, this.options = n;
	}
	get(e) {
		return this.items.get(e);
	}
	prepare() {
		return this.pending ??= this.load();
	}
	async load() {
		let t = 0, n = 0, r = this.controller.signal;
		for (let [i, a] of Object.entries(this.document.assets ?? {})) {
			r.throwIfAborted();
			let o = setTimeout(() => this.controller.abort(/* @__PURE__ */ Error("Image preparation timed out")), 15e3);
			try {
				let o;
				if (this.options.resolveImage) o = await new Promise((e, t) => {
					let n = () => t(r.reason);
					r.addEventListener("abort", n, { once: !0 }), Promise.resolve().then(() => this.options.resolveImage(i, a, r)).then(e, t).finally(() => r.removeEventListener("abort", n));
				});
				else {
					let e = new URL(this.options.assetBaseURL ?? this.owner.baseURI, this.owner.baseURI), t = new URL(this.owner.baseURI).origin, n = new URL(a.src, e);
					(!["http:", "https:"].includes(n.protocol) || e.origin !== t || n.origin !== t || n.username || n.password) && c("assets." + i, "images must be local same-origin resources"), o = await E(n, r);
				}
				r.throwIfAborted(), (!(o instanceof Blob) || o.size > e.imageBytes) && c("assets." + i, "invalid blob or image byte budget exceeded"), t += o.size, t > e.totalImageBytes && c("assets", "total image byte budget exceeded");
				let s = new Uint8Array(await o.arrayBuffer()), l = T(s);
				n += l.width * l.height, n > e.totalImagePixels && c("assets", "total decoded pixel budget exceeded");
				let u = "";
				for (let e = 0; e < s.length; e += 32768) u += String.fromCharCode(...s.subarray(e, e + 32768));
				let d = "data:" + l.mime + ";base64," + btoa(u), f = this.owner.createElement("img");
				try {
					await new Promise((e, t) => {
						let n = (n) => {
							f.onload = null, f.onerror = null, r.removeEventListener("abort", a), n ? t(n) : e();
						}, a = () => n(r.reason);
						f.onload = () => n(), f.onerror = () => n(/* @__PURE__ */ Error("Image decode failed: " + i)), r.addEventListener("abort", a, { once: !0 }), r.aborted ? a() : f.src = d;
					}), r.throwIfAborted(), f.naturalWidth * f.naturalHeight !== l.width * l.height && c("assets." + i, "decoded size differs from header"), this.items.set(i, {
						image: f,
						dataURL: d,
						width: f.naturalWidth,
						height: f.naturalHeight
					});
				} catch (e) {
					throw f.src = "", e;
				}
			} catch (e) {
				throw this.disposed || this.clear(), Error("Image asset " + i + ": " + (e instanceof Error ? e.message : String(e)));
			} finally {
				clearTimeout(o);
			}
		}
	}
	clear() {
		for (let e of this.items.values()) e.image.src = "";
		this.items.clear();
	}
	destroy() {
		this.disposed = !0, this.controller.abort(new DOMException("Animation destroyed", "AbortError")), this.clear();
	}
};
//#endregion
export { u as a, p as i, w as n, d as o, g as r, D as t };
