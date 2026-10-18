import { sampleTime as e } from "./timeline.js";
//#region src/transform.ts
var t = [
	"x",
	"y",
	"rotate",
	"scale",
	"scaleX",
	"scaleY",
	"opacity",
	"pivotX",
	"pivotY"
];
function n(e = {}) {
	return {
		x: 0,
		y: 0,
		rotate: 0,
		scale: 1,
		scaleX: 1,
		scaleY: 1,
		opacity: 1,
		pivotX: 0,
		pivotY: 0,
		...e
	};
}
function r(e) {
	let t = e.rotate * Math.PI / 180, n = Math.cos(t), r = Math.sin(t), i = n * e.scale * e.scaleX, a = r * e.scale * e.scaleX, o = -r * e.scale * e.scaleY, s = n * e.scale * e.scaleY;
	return [
		i,
		a,
		o,
		s,
		e.x + e.pivotX - i * e.pivotX - o * e.pivotY,
		e.y + e.pivotY - a * e.pivotX - s * e.pivotY
	];
}
//#endregion
//#region src/components.ts
function i(e) {
	if (!("type" in e)) return {
		id: e.id,
		...e.parent ? { parent: e.parent } : {},
		...e.layer ? { layer: e.layer } : {},
		components: {
			transform: n(e.components?.transform),
			...e.components?.graphic ? { graphic: { ...e.components.graphic } } : {}
		}
	};
	let r = n();
	for (let n of t) e[n] !== void 0 && (r[n] = e[n]);
	let { id: i, parent: a, layer: o, type: s, ...c } = e;
	for (let e of t) delete c[e];
	return {
		id: i,
		...a ? { parent: a } : {},
		...o ? { layer: o } : {},
		components: {
			transform: r,
			...s === "group" ? {} : { graphic: {
				...c,
				type: s
			} }
		}
	};
}
function a(e, t = e.camera) {
	let r = t, i = r?.components;
	return { components: {
		transform: n({
			x: e.width / 2,
			y: e.height / 2,
			...i ? i.transform : {
				x: r?.x ?? e.width / 2,
				y: r?.y ?? e.height / 2,
				scale: r?.zoom ?? 1
			}
		}),
		camera: {
			width: i?.camera?.width ?? r?.width ?? e.width,
			height: i?.camera?.height ?? r?.height ?? e.height
		}
	} };
}
function o(e) {
	let t = Object.create(null);
	if (e.cameras) for (let [n, r] of Object.entries(e.cameras)) t[n] = a(e, r);
	else t.$default = a(e);
	return t;
}
//#endregion
//#region src/camera.ts
function s(e) {
	let { transform: t, camera: n } = e.components;
	return {
		width: n.width,
		height: n.height,
		x: t.x,
		y: t.y,
		zoom: t.scale
	};
}
function c(e, t) {
	if (!e.cameras) return "$default";
	let n = e.cameraCuts[0].camera;
	for (let r of e.cameraCuts) {
		if (r.at > t) break;
		n = r.camera;
	}
	return n;
}
function l(e) {
	return e === "$camera" || e.startsWith("$camera:");
}
function u(e) {
	return e === "$camera" ? "$default" : e.slice(8);
}
function d(e, t = 0) {
	return s(o(e)[c(e, t)]);
}
function f(e, t, n) {
	let r = t / e.width * e.zoom;
	return {
		scale: r,
		x: t / 2 - e.x * r,
		y: n / 2 - e.y * r
	};
}
function p(e, t, n, r) {
	let i = f(t, n, r);
	e.transform(i.scale, 0, 0, i.scale, i.x, i.y);
}
//#endregion
//#region src/validate.ts
var m = Object.freeze({
	bytes: 2097152,
	nodes: 512,
	tracks: 2048,
	geometry: 1e5,
	captions: 1024,
	duration: 6e5,
	svgBytes: 256e3,
	cameras: 32,
	cameraCuts: 256,
	layers: 64,
	images: 32,
	imageBytes: 8388608,
	totalImageBytes: 33554432,
	imagePixels: 4194304,
	totalImagePixels: 16777216
}), h = /* @__PURE__ */ new Set([
	"__proto__",
	"constructor",
	"prototype"
]), g = class extends Error {
	path;
	constructor(e, t) {
		super(`${e}: ${t}`), this.path = e, this.name = "AnimationError";
	}
};
function _(e, t) {
	throw new g(e, t);
}
function v(e, t, n) {
	(!e || typeof e != "object" || Array.isArray(e) || ![Object.prototype, null].includes(Object.getPrototypeOf(e))) && _(t, "expected plain JSON object");
	for (let r of Object.keys(e)) (e[r] === null || !n.includes(r) || h.has(r)) && _(t + "." + r, "unknown or forbidden field");
	return e;
}
function y(e, t, n = -1e5, r = 1e5) {
	return (typeof e != "number" || !Number.isFinite(e) || e < n || e > r) && _(t, `expected number ${n}..${r}`), e;
}
function b(e, t, n = 1024) {
	return (typeof e != "string" || e.length > n) && _(t, "expected bounded string"), e;
}
function x(e, t) {
	let n = b(e, t, 64);
	return (!/^[a-zA-Z_][\w.-]*$/.test(n) || h.has(n)) && _(t, "invalid ID"), n;
}
function S(e, t) {
	let n = b(e, t, 500);
	return (!n || n !== n.trim() || /[\\:%?#\u0000-\u001f\u007f]/.test(n) || n.startsWith("//") || n.split("/").some((e) => e === ".." || e === ".") || !/^\/?[^/]+(?:\/[^/]+)*\.(?:png|jpe?g|webp)$/i.test(n)) && _(t, "expected local PNG/JPEG/WebP path without traversal, query or URL scheme"), n;
}
function C(e, t) {
	let n = b(e, t, 40);
	return /^(?:#[a-f\d]{3,4}|#[a-f\d]{6}|#[a-f\d]{8}|none|transparent)$/i.test(n) || _(t, "only literal hex colors / none / transparent"), n;
}
function w(e, t) {
	let n = b(e, t, 1e4), r = /[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g, i = n.match(r) ?? [];
	(!i.length || i.length > 2048 || n.replace(r, "").replace(/[\s,]/g, "") || !/^m$/i.test(i[0])) && _(t, "invalid path data");
	let a = {
		M: 2,
		L: 2,
		H: 1,
		V: 1,
		C: 6,
		S: 4,
		Q: 4,
		T: 2,
		A: 7,
		Z: 0
	}, o = 0;
	for (; o < i.length;) {
		let e = i[o++].toUpperCase(), n = a[e];
		n === void 0 && _(t, "unsupported path command");
		let r = o;
		for (; o < i.length && !/^[a-zA-Z]$/.test(i[o]);) y(Number(i[o]), t), o++;
		let s = o - r;
		if (n === 0) s && _(t, "numbers after path close");
		else if ((!s || s % n) && _(t, "incomplete path command"), e === "A") for (let e = r; e < o; e += 7) (Number(i[e]) < 0 || Number(i[e + 1]) < 0 || ![0, 1].includes(Number(i[e + 3])) || ![0, 1].includes(Number(i[e + 4]))) && _(t, "invalid arc");
	}
	return n;
}
function T(e, t) {
	typeof e != "boolean" && _(t, "expected boolean");
}
function E(e, t, n) {
	(typeof e != "string" || !n.includes(e)) && _(t, "unsupported value");
}
function D(e, t, n) {
	return (!Array.isArray(e) || e.length > n) && _(t, "expected bounded array"), e;
}
function O(e, n, r = t) {
	let i = v(e, n, r);
	for (let [e, t] of Object.entries(i)) {
		let r = e === "opacity" ? [0, 1] : e === "scale" ? [.001, 100] : ["scaleX", "scaleY"].includes(e) ? [-100, 100] : [-1e5, 1e5];
		y(t, n + "." + e, r[0], r[1]);
	}
	return i;
}
function k(e, t = "captionStyle") {
	let n = v(e, t, [
		"fontSize",
		"font",
		"color",
		"background",
		"align",
		"position",
		"inset",
		"offset",
		"padding",
		"radius",
		"lineHeight",
		"shadow",
		"showSpeaker"
	]);
	for (let [e, r, i] of [
		[
			"fontSize",
			12,
			64
		],
		[
			"inset",
			0,
			25
		],
		[
			"offset",
			0,
			30
		],
		[
			"padding",
			0,
			32
		],
		[
			"radius",
			0,
			32
		],
		[
			"lineHeight",
			1,
			2
		]
	]) n[e] !== void 0 && y(n[e], t + "." + e, r, i);
	n.font !== void 0 && E(n.font, t + ".font", [
		"sans",
		"serif",
		"mono"
	]), n.align !== void 0 && E(n.align, t + ".align", [
		"left",
		"center",
		"right"
	]), n.position !== void 0 && E(n.position, t + ".position", ["top", "bottom"]);
	for (let e of ["color", "background"]) n[e] !== void 0 && (C(n[e], t + "." + e), String(n[e]).toLowerCase() === "none" && _(t + "." + e, "use a literal color or transparent"));
	for (let e of ["shadow", "showSpeaker"]) n[e] !== void 0 && T(n[e], t + "." + e);
}
function A(e) {
	(typeof e != "string" || e.length > m.bytes) && _("$", "expected JSON text within 2 MB");
	let n;
	try {
		n = JSON.parse(e);
	} catch {
		_("$", "invalid JSON (scripts / HTML are not supported)");
	}
	let r = v(n, "$", [
		"format",
		"width",
		"height",
		"duration",
		"background",
		"assets",
		"layers",
		"captionTheme",
		"captionStyle",
		"camera",
		"cameras",
		"cameraCuts",
		"surface",
		"tracks",
		"captions",
		"effects",
		"markers"
	]);
	r.format !== "rusie.motion/1" && _("format", "unsupported animation format");
	let i = /* @__PURE__ */ new Set();
	if (r.assets !== void 0) {
		(!r.assets || typeof r.assets != "object" || Array.isArray(r.assets)) && _("assets", "expected image dictionary");
		let e = Object.entries(r.assets);
		e.length > m.images && _("assets", "image count budget exceeded");
		for (let [t, n] of e) {
			x(t, "assets." + t);
			let e = v(n, "assets." + t, ["type", "src"]);
			E(e.type, "assets." + t + ".type", ["image"]), S(e.src, "assets." + t + ".src"), i.add(t);
		}
	}
	let a = /* @__PURE__ */ new Set();
	for (let [e, t] of D(r.layers ?? [], "layers", m.layers).entries()) {
		let n = "layers[" + e + "]", r = v(t, n, ["id", "space"]), i = x(r.id, n + ".id");
		a.has(i) && _(n, "duplicate layer"), a.add(i), E(r.space, n + ".space", ["canvas", "camera"]);
	}
	let o = (e, t, n) => {
		if (e !== void 0) {
			let r = x(e, t + ".layer");
			a.has(r) || _(t, "unknown layer"), n !== void 0 && _(t, "only roots assign layers; children inherit");
		}
	};
	y(r.width, "width", 1, 4096), y(r.height, "height", 1, 4096), Number(r.width) * Number(r.height) > 4194304 && _("surface", "pixel budget exceeded");
	let s = y(r.duration, "duration", 1, m.duration);
	r.captionTheme !== void 0 && E(r.captionTheme, "captionTheme", ["cinema", "paper"]), r.background !== void 0 && C(r.background, "background"), r.captionStyle !== void 0 && k(r.captionStyle);
	let c = /* @__PURE__ */ new Map(), d = (e, t) => {
		let n = v(e, t, [
			"width",
			"height",
			"x",
			"y",
			"zoom",
			"components"
		]), i = n, a = n.zoom ?? 1, o = Number(r.width);
		if (n.components !== void 0) {
			Object.keys(n).some((e) => e !== "components") && _(t, "cannot mix components and legacy fields");
			let e = v(n.components, t + ".components", ["transform", "camera"]);
			i = e.camera === void 0 ? {} : v(e.camera, t + ".components.camera", ["width", "height"]), e.camera !== void 0 && (i.width === void 0 || i.height === void 0) && _(t + ".components.camera", "width and height required"), a = (e.transform === void 0 ? {} : O(e.transform, t + ".components.transform", [
				"x",
				"y",
				"scale"
			])).scale ?? 1;
		}
		if (i.width === void 0 != (i.height === void 0) && _(t, "view width and height must be supplied together"), i.width !== void 0) {
			o = y(i.width, t + ".width", 1, 8192);
			let e = y(i.height, t + ".height", 1, 8192);
			Math.abs(o / e - Number(r.width) / Number(r.height)) > 1e-6 && _(t, "view aspect ratio must match output width / height");
		}
		for (let e of ["x", "y"]) n[e] !== void 0 && y(n[e], t + "." + e);
		y(a, t + ".zoom", .25, 8);
		let s = Number(r.width) / o * Number(a);
		return (s < .0625 || s > 16) && _(t, "effective zoom outside 1/16..16"), o;
	};
	if (r.cameras !== void 0) {
		r.camera !== void 0 && _("cameras", "cannot mix singular camera and named cameras"), (!r.cameras || typeof r.cameras != "object" || Array.isArray(r.cameras)) && _("cameras", "expected camera dictionary");
		let e = Object.entries(r.cameras);
		(!e.length || e.length > m.cameras) && _("cameras", "expected 1..32 cameras");
		for (let [t, n] of e) x(t, "cameras." + t), c.set(t, d(n, "cameras." + t));
		let t = D(r.cameraCuts, "cameraCuts", m.cameraCuts);
		t.length || _("cameraCuts", "coverage must start at 0");
		let n = -1;
		for (let [e, r] of t.entries()) {
			let t = "cameraCuts[" + e + "]", i = v(r, t, ["at", "camera"]), a = y(i.at, t + ".at", 0, s);
			a >= s && _(t, "cut must start before animation end"), e === 0 && a !== 0 && _(t, "coverage must start at 0"), a <= n && _(t, "cut times must strictly increase");
			let o = x(i.camera, t + ".camera");
			c.has(o) || _(t, "unknown camera " + o), n = a;
		}
	} else r.cameraCuts !== void 0 && _("cameraCuts", "requires named cameras"), c.set("$default", r.camera === void 0 ? Number(r.width) : d(r.camera, "camera"));
	let f = (e, t) => {
		let n = c.get(e);
		return n === void 0 && _(t, "unknown camera or ambiguous camera target"), n;
	}, p = v(r.surface, "surface", [
		"type",
		"source",
		"nodes",
		"entities"
	]), h = /* @__PURE__ */ new Set();
	if (p.type === "svg") {
		p.nodes !== void 0 && _("surface.nodes", "SVG cannot contain canvas nodes");
		let e = b(p.source, "surface.source", m.svgBytes);
		/<!\s*(?:DOCTYPE|ENTITY)|<\?|\u0000/i.test(e) && _("surface.source", "DTD, entities and XML instructions forbidden"), e.trim() || _("surface.source", "empty SVG");
		for (let [e, t] of D(p.entities ?? [], "surface.entities", m.nodes).entries()) {
			let n = "surface.entities[" + e + "]", r = v(t, n, [
				"id",
				"layer",
				"components"
			]), i = x(r.id, n + ".id");
			if (h.has(i) && _(n, "duplicate entity"), h.add(i), o(r.layer, n), r.components !== void 0) {
				let e = v(r.components, n + ".components", ["transform"]);
				e.transform !== void 0 && O(e.transform, n + ".components.transform");
			}
		}
	} else if (p.type === "canvas") {
		(p.source !== void 0 || p.entities !== void 0) && _("surface", "canvas uses nodes, not source or entities");
		let e = D(p.nodes, "surface.nodes", m.nodes).map((e, t) => {
			let n = "surface.nodes[" + t + "]";
			if (e && typeof e == "object" && "type" in e) return e;
			let r = v(e, n, [
				"id",
				"parent",
				"layer",
				"components"
			]), i = r.components === void 0 ? {} : v(r.components, n + ".components", ["transform", "graphic"]), a = i.transform === void 0 ? {} : O(i.transform, n + ".components.transform"), o = i.graphic === void 0 ? {} : v(i.graphic, n + ".components.graphic", [
				"type",
				"asset",
				"fit",
				"fill",
				"stroke",
				"strokeWidth",
				"progress",
				"dash",
				"width",
				"height",
				"r",
				"radius",
				"d",
				"x2",
				"y2",
				"text",
				"fontSize",
				"font",
				"align"
			]);
			return i.graphic !== void 0 && ![
				"rect",
				"circle",
				"path",
				"text",
				"line",
				"image"
			].includes(String(o.type)) && _(n, "unsupported graphic component"), {
				id: r.id,
				...r.layer === void 0 ? {} : { layer: r.layer },
				...r.parent === void 0 ? {} : { parent: r.parent },
				...a,
				...o,
				type: o.type ?? "group"
			};
		}), t = 0;
		for (let [n, r] of e.entries()) {
			let e = `surface.nodes[${n}]`, a = v(r, e, /* @__PURE__ */ "id.type.parent.layer.asset.fit.x.y.rotate.scale.scaleX.scaleY.pivotX.pivotY.opacity.fill.stroke.strokeWidth.progress.dash.width.height.r.radius.d.x2.y2.text.fontSize.font.align".split(".")), s = x(a.id, e + ".id");
			h.has(s) && _(e, "duplicate ID"), h.add(s), E(a.type, e + ".type", [
				"group",
				"rect",
				"circle",
				"path",
				"text",
				"line",
				"image"
			]), o(a.layer, e, a.parent), a.parent !== void 0 && (x(a.parent, e + ".parent"), (!h.has(String(a.parent)) || a.parent === s) && _(e, "parent must precede child"));
			let c = {
				group: [],
				rect: [
					"width",
					"height",
					"radius"
				],
				circle: ["r"],
				path: ["d"],
				text: [
					"text",
					"fontSize",
					"font",
					"align"
				],
				line: ["x2", "y2"],
				image: [
					"asset",
					"fit",
					"width",
					"height"
				]
			};
			for (let t of [
				"asset",
				"fit",
				"width",
				"height",
				"radius",
				"r",
				"d",
				"text",
				"fontSize",
				"font",
				"align",
				"x2",
				"y2"
			]) a[t] !== void 0 && !c[a.type].includes(t) && _(e + "." + t, "property not valid for shape");
			for (let t of [
				"x",
				"y",
				"rotate",
				"pivotX",
				"pivotY",
				"x2",
				"y2"
			]) a[t] !== void 0 && y(a[t], e + "." + t);
			if (a.progress !== void 0 && (["line", "text"].includes(String(a.type)) || _(e, "progress supports line and text"), y(a.progress, e + ".progress", 0, 1)), a.dash !== void 0) {
				let t = D(a.dash, e + ".dash", 8);
				(!t.length || !t.some((e) => Number(e) > 0)) && _(e, "invalid dash pattern");
				for (let n of t) y(n, e + ".dash", 0, 100);
			}
			for (let t of ["scaleX", "scaleY"]) a[t] !== void 0 && y(a[t], e + "." + t, -100, 100);
			a.scale !== void 0 && y(a.scale, e + ".scale", .001, 100), a.opacity !== void 0 && y(a.opacity, e + ".opacity", 0, 1);
			for (let t of [
				"width",
				"height",
				"r",
				"radius",
				"strokeWidth",
				"fontSize"
			]) a[t] !== void 0 && y(a[t], e + "." + t, 0, t === "fontSize" ? 256 : 4096);
			for (let t of ["fill", "stroke"]) a[t] !== void 0 && C(a[t], e + "." + t);
			if (a.type === "image") {
				let t = x(a.asset, e + ".asset");
				i.has(t) || _(e, "unknown image asset"), a.fit !== void 0 && E(a.fit, e + ".fit", [
					"contain",
					"cover",
					"stretch"
				]), y(a.width, e + ".width", 1, 4096), y(a.height, e + ".height", 1, 4096);
			}
			a.type === "rect" && (y(a.width, e + ".width", 0, 4096), y(a.height, e + ".height", 0, 4096)), a.type === "circle" && y(a.r, e + ".r", 0, 4096), a.type === "line" && (y(a.x2, e + ".x2"), y(a.y2, e + ".y2")), a.type === "path" && (t += w(a.d, e + ".d").length), a.type === "text" && b(a.text, e + ".text", 2e3), a.font !== void 0 && E(a.font, e + ".font", [
				"serif",
				"sans",
				"mono"
			]), a.align !== void 0 && E(a.align, e + ".align", [
				"left",
				"center",
				"right"
			]);
		}
		for (let t of e) {
			let n = t.parent, r = 0;
			for (; n;) ++r > 32 && _("surface.nodes", "group depth exceeded"), n = e.find((e) => e.id === n).parent;
		}
		t > m.geometry && _("surface.nodes", "geometry budget exceeded");
	} else _("surface.type", "only svg / canvas supported");
	let g = /* @__PURE__ */ new Map(), A = 0, j = 0;
	for (let [e, n] of D(r.tracks ?? [], "tracks", m.tracks).entries()) {
		let i = `tracks[${e}]`, a = v(n, i, [
			"type",
			"target",
			"camera",
			"property",
			"at",
			"duration",
			"from",
			"to",
			"ease",
			"repeat",
			"yoyo",
			"center",
			"amplitude",
			"period",
			"phase",
			"points",
			"orient"
		]);
		if (a.type === "transform") {
			v(n, i, [
				"type",
				"target",
				"at",
				"duration",
				"from",
				"to",
				"ease"
			]);
			let e = typeof a.target == "string" && l(a.target), o = e ? u(String(a.target)) : "", c = e ? f(o, i + ".target") : 0;
			e || (x(a.target, i + ".target"), p.type === "canvas" && !h.has(String(a.target)) && _(i + ".target", "missing node"));
			let d = e ? [
				"x",
				"y",
				"scale"
			] : t, b = O(a.to, i + ".to", d), S = a.from === void 0 ? {} : O(a.from, i + ".from", d);
			Object.keys(b).length || _(i + ".to", "at least one target property required"), Object.keys(S).some((e) => !(e in b)) && _(i + ".from", "from must correspond to a to property");
			let C = y(a.at ?? 0, i + ".at", 0, s), w = y(a.duration, i + ".duration", 1, s);
			C + w > s && _(i, "action exceeds duration"), a.ease !== void 0 && E(a.ease, i + ".ease", [
				"linear",
				"in",
				"out",
				"inOut"
			]);
			for (let t of Object.keys(b)) {
				if (e && t === "scale") for (let e of [S.scale, b.scale]) e !== void 0 && (Number(e) < .25 || Number(e) > 8 || Number(r.width) / c * Number(e) > 16 || Number(r.width) / c * Number(e) < .0625) && _(i, "effective zoom outside limits");
				let n = e ? "@camera:" + o + ":" + (t === "scale" ? "zoom" : t) : a.target + ":" + t, s = g.get(n) ?? [];
				s.some(([e, t]) => C < t && C + w > e) && _(i, "overlapping writes: " + n), s.push([C, C + w]), g.set(n, s);
			}
			j += Object.keys(b).length, j > m.tracks && _(i, "expanded track budget exceeded");
			continue;
		}
		if (++j > m.tracks && _(i, "expanded track budget exceeded"), a.type === "camera") {
			v(n, i, [
				"type",
				"camera",
				"property",
				"at",
				"duration",
				"from",
				"to",
				"ease"
			]);
			let e = a.camera === void 0 ? "$default" : x(a.camera, i + ".camera"), t = f(e, i + ".camera");
			E(a.property, i + ".property", [
				"x",
				"y",
				"zoom"
			]);
			let o = y(a.at ?? 0, i + ".at", 0, s), c = y(a.duration, i + ".duration", 1, s);
			o + c > s && _(i, "camera track exceeds animation duration"), a.ease !== void 0 && E(a.ease, i + ".ease", [
				"linear",
				"in",
				"out",
				"inOut"
			]);
			for (let e of ["from", "to"]) {
				let n = y(a[e], i + "." + e, a.property === "zoom" ? .25 : -1e5, a.property === "zoom" ? 8 : 1e5);
				a.property === "zoom" && (Number(r.width) / t * n > 16 || Number(r.width) / t * n < .0625) && _(i, "effective zoom outside 1/16..16");
			}
			let l = "@camera:" + e + ":" + a.property, u = g.get(l) ?? [];
			u.some(([e, t]) => o < t && o + c > e) && _(i, "overlapping camera writes"), u.push([o, o + c]), g.set(l, u);
			continue;
		}
		a.camera !== void 0 && _(i + ".camera", "only camera tracks accept camera"), E(a.type, i + ".type", [
			"tween",
			"wave",
			"follow",
			"color"
		]), x(a.target, i + ".target"), p.type === "canvas" && !h.has(String(a.target)) && _(i + ".target", "missing node");
		let o = y(a.at ?? 0, i + ".at", 0, s), c = y(a.duration, i + ".duration", 1, s), d = 1, b = a.type === "color" ? [
			"property",
			"from",
			"to",
			"ease"
		] : a.type === "tween" ? [
			"property",
			"from",
			"to",
			"ease",
			"repeat",
			"yoyo"
		] : a.type === "wave" ? [
			"property",
			"center",
			"amplitude",
			"period",
			"phase"
		] : [
			"points",
			"orient",
			"ease"
		];
		for (let e of [
			"property",
			"from",
			"to",
			"ease",
			"repeat",
			"yoyo",
			"center",
			"amplitude",
			"period",
			"phase",
			"points",
			"orient"
		]) a[e] !== void 0 && !b.includes(e) && _(i + "." + e, "invalid track property");
		a.ease !== void 0 && E(a.ease, i + ".ease", [
			"linear",
			"in",
			"out",
			"inOut"
		]);
		let S;
		if (a.type === "color") {
			E(a.property, i + ".property", ["fill", "stroke"]);
			for (let e of ["from", "to"]) (typeof a[e] != "string" || !/^#[a-f\d]{6}$/i.test(a[e])) && _(i + "." + e, "color tween requires #RRGGBB");
			S = [String(a.property)];
		} else if (a.type === "follow") {
			S = a.orient ? [
				"x",
				"y",
				"rotate"
			] : ["x", "y"];
			let e = D(a.points, i + ".points", 256);
			A += e.length, A > 8192 && _(i, "total motion path budget exceeded"), e.length < 2 && _(i, "path needs 2+ points");
			let t = 0;
			for (let [n, r] of e.entries()) {
				let a = D(r, i + `.points[${n}]`, 2);
				if (a.length !== 2 && _(i, "point needs x,y"), y(a[0], i), y(a[1], i), n) {
					let r = e[n - 1];
					t += Math.hypot(Number(a[0]) - r[0], Number(a[1]) - r[1]);
				}
			}
			t || _(i, "path has no length"), a.orient !== void 0 && T(a.orient, i + ".orient");
		} else {
			E(a.property, i + ".property", [
				...t,
				"width",
				"height",
				"x2",
				"y2",
				"progress"
			]), S = [a.property];
			let e = ["opacity", "progress"].includes(String(a.property)) ? [0, 1] : ["width", "height"].includes(String(a.property)) ? [0, 4096] : a.property === "scale" ? [.001, 100] : ["scaleX", "scaleY"].includes(String(a.property)) ? [-100, 100] : [-1e5, 1e5];
			if (a.type === "tween") y(a.from, i + ".from", e[0], e[1]), y(a.to, i + ".to", e[0], e[1]), d = y(a.repeat ?? 1, i + ".repeat", 1, 1e3), Number.isInteger(d) || _(i, "repeat must be integer"), a.yoyo !== void 0 && T(a.yoyo, i + ".yoyo");
			else {
				let t = y(a.center, i + ".center"), n = y(a.amplitude, i + ".amplitude", 0, 1e5);
				y(t - n, i + ".minimum", e[0], e[1]), y(t + n, i + ".maximum", e[0], e[1]), y(a.period, i + ".period", 16, s), a.phase !== void 0 && y(a.phase, i + ".phase", -Math.PI * 2, Math.PI * 2);
			}
		}
		if (p.type === "canvas" && a.type !== "follow") {
			let e = p.nodes.find((e) => e.id === a.target), t = { type: e.type ?? e.components?.graphic?.type ?? "group" };
			(["width", "height"].includes(String(a.property)) && !["rect", "image"].includes(t.type) || ["x2", "y2"].includes(String(a.property)) && t.type !== "line" || a.property === "progress" && !["line", "text"].includes(t.type)) && _(i, "track property does not match canvas shape");
		}
		let C = o + c * d;
		C > s && _(i, "track exceeds animation duration");
		for (let e of S) {
			let t = a.target + ":" + e, n = g.get(t) ?? [];
			n.some(([e, t]) => o < t && C > e) && _(i, "overlapping writes: " + t), n.push([o, C]), g.set(t, n);
		}
	}
	let M = 0, N = /* @__PURE__ */ new Set();
	for (let [e, t] of D(r.effects ?? [], "effects", 8).entries()) {
		let n = "effects[" + e + "]", i = v(t, n, [
			"id",
			"type",
			"at",
			"duration",
			"seed",
			"count",
			"color",
			"opacity",
			"speed",
			"size",
			"area"
		]), a = x(i.id, n + ".id");
		N.has(a) && _(n, "duplicate effect ID"), N.add(a), E(i.type, n + ".type", [
			"rain",
			"dust",
			"ripple",
			"vignette"
		]);
		let o = y(i.at ?? 0, n + ".at", 0, s);
		o + y(i.duration ?? s - o, n + ".duration", 1, s) > s && _(n, "effect exceeds duration");
		let c = y(i.count ?? (i.type === "vignette" ? 0 : 50), n + ".count", 0, 512);
		if (Number.isInteger(c) || _(n, "integer count required"), M += c, M > 512 && _(n, "particle budget exceeded"), i.seed !== void 0 && (y(i.seed, n + ".seed", 0, 4294967295), Number.isInteger(i.seed) || _(n, "integer seed required")), i.color !== void 0 && (C(i.color, n + ".color"), String(i.color).toLowerCase() === "none" && _(n + ".color", "effect needs a literal color or transparent")), i.opacity !== void 0 && y(i.opacity, n + ".opacity", 0, 1), i.speed !== void 0 && y(i.speed, n + ".speed", 0, 1200), i.size !== void 0 && y(i.size, n + ".size", .1, 80), i.area !== void 0) {
			let e = v(i.area, n + ".area", [
				"x",
				"y",
				"width",
				"height"
			]);
			y(e.x, n + ".area.x", 0, Number(r.width)), y(e.y, n + ".area.y", 0, Number(r.height)), y(e.width, n + ".area.width", 1, Number(r.width)), y(e.height, n + ".area.height", 1, Number(r.height)), (Number(e.x) + Number(e.width) > Number(r.width) || Number(e.y) + Number(e.height) > Number(r.height)) && _(n, "effect area outside canvas");
		}
	}
	let P = -1;
	for (let [e, t] of D(r.markers ?? [], "markers", 128).entries()) {
		let n = v(t, "markers[" + e + "]", ["at", "title"]), r = y(n.at, "markers.at", 0, s);
		r <= P && _("markers", "marker times must increase"), P = r, b(n.title, "markers.title", 80);
	}
	let F = 0;
	for (let [e, t] of D(r.captions ?? [], "captions", m.captions).entries()) {
		let n = `captions[${e}]`, r = v(t, n, [
			"at",
			"duration",
			"text",
			"speaker",
			"fade"
		]), i = y(r.at, n + ".at", 0, s), a = y(r.duration, n + ".duration", 1, s);
		(i < F || i + a > s) && _(n, "overlapping or out-of-bounds caption"), F = i + a, r.fade !== void 0 && y(r.fade, n + ".fade", 0, Math.min(5e3, a / 2)), b(r.text, n + ".text", 2e3), r.speaker !== void 0 && b(r.speaker, n + ".speaker", 80);
	}
	return n;
}
//#endregion
//#region src/effects.ts
var j = class {
	doc;
	sources;
	constructor(e) {
		this.doc = e, this.sources = (e.effects ?? []).map((e) => {
			let t = e.seed ?? 1937, n = () => (t = Math.imul(t, 1664525) + 1013904223 >>> 0, t / 4294967296);
			return {
				effect: e,
				particles: Array.from({ length: e.count ?? (e.type === "vignette" ? 0 : 50) }, () => ({
					x: n(),
					y: n(),
					phase: n(),
					speed: .65 + n() * .7,
					size: .5 + n()
				}))
			};
		});
	}
	sample(e) {
		return this.sources.map(({ effect: t, particles: n }) => {
			let r = t.at ?? 0, i = t.duration ?? this.doc.duration - r, a = Math.max(0, Math.min(i, e - r)) / 1e3, o = t.area ?? {
				x: 0,
				y: 0,
				width: this.doc.width,
				height: this.doc.height
			}, s = e >= r && e <= r + i, c = (e, t) => (e % t + t) % t;
			return {
				id: t.id,
				type: t.type,
				color: t.color ?? (t.type === "vignette" ? "#06131b" : "#d8d9b1"),
				opacity: s ? t.opacity ?? .25 : 0,
				particles: n.map((e) => {
					let n = (t.speed ?? (t.type === "rain" ? 350 : 15)) * e.speed, r = c(a * .8 + e.phase, 1);
					return t.type === "rain" ? {
						x: o.x + c(e.x * o.width - a * n * .12, o.width),
						y: o.y + c(e.y * o.height + a * n, o.height),
						size: (t.size ?? 15) * e.size,
						opacity: .4 + e.phase * .6,
						stretch: 0
					} : t.type === "ripple" ? {
						x: o.x + e.x * o.width,
						y: o.y + e.y * o.height,
						size: (1 + r * (t.size ?? 18)) * e.size,
						opacity: 1 - r,
						stretch: .16
					} : {
						x: o.x + c(e.x * o.width + Math.sin(a * .5 + e.phase * 6) * 20, o.width),
						y: o.y + c(e.y * o.height - a * n, o.height),
						size: (t.size ?? 2) * e.size,
						opacity: .45 + .35 * Math.sin(a + e.phase * 6),
						stretch: 1
					};
				})
			};
		});
	}
}, M = class {
	doc;
	element;
	ctx;
	constructor(e, t) {
		this.doc = t;
		let n = e.ownerDocument.createElement("canvas");
		this.element = n;
		let r = Math.min(e.ownerDocument.defaultView?.devicePixelRatio ?? 1, 2, Math.sqrt(4194304 / (t.width * t.height)));
		n.width = t.width * r, n.height = t.height * r, n.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;", n.setAttribute("aria-hidden", "true");
		let i = n.getContext("2d");
		if (!i) throw Error("Canvas effects unavailable");
		this.ctx = i, i.scale(r, r), e.appendChild(n);
	}
	render(e) {
		let t = this.ctx, { width: n, height: r } = this.doc;
		t.clearRect(0, 0, n, r);
		for (let i of e.effects) if (i.opacity) {
			if (t.save(), t.globalAlpha = i.opacity, t.fillStyle = i.color, t.strokeStyle = i.color, i.type === "vignette") {
				let e = t.createRadialGradient(n * .5, r * .4, Math.min(n, r) * .2, n * .5, r * .45, Math.max(n, r) * .65);
				e.addColorStop(0, "#00000000"), e.addColorStop(1, i.color), t.fillStyle = e, t.fillRect(0, 0, n, r);
			} else {
				p(t, e.camera, n, r);
				for (let e of i.particles) t.globalAlpha = i.opacity * e.opacity, t.beginPath(), i.type === "rain" ? (t.lineWidth = .7, t.moveTo(e.x, e.y), t.lineTo(e.x - e.size * .18, e.y + e.size), t.stroke()) : i.type === "ripple" ? (t.lineWidth = 1, t.ellipse(e.x, e.y, e.size, e.size * e.stretch, 0, 0, Math.PI * 2), t.stroke()) : (t.arc(e.x, e.y, e.size, 0, Math.PI * 2), t.fill());
			}
			t.restore();
		}
	}
	destroy() {
		this.element.remove();
	}
}, N = (e) => Math.max(0, Math.min(1, e)), P = {
	linear: (e) => e,
	in: (e) => e * e * e,
	out: (e) => 1 - (1 - e) ** 3,
	inOut: (e) => e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2
}, F = () => n();
function I(e) {
	if (e && typeof e == "object") {
		Object.freeze(e);
		for (let t of Object.values(e)) I(t);
	}
	return e;
}
var L = class {
	document;
	entities;
	tracks = [];
	effects;
	paths = /* @__PURE__ */ new Map();
	constructor(e) {
		let t = A(e);
		if (this.document = I(t), this.effects = new j(t), t.surface.type === "canvas") this.entities = I(t.surface.nodes.map(i));
		else {
			let e = t.surface.entities ?? [], n = new Set(e.map((e) => e.id)), r = (t.tracks ?? []).flatMap((e) => e.type !== "camera" && !l(e.target) && !n.has(e.target) ? (n.add(e.target), [{ id: e.target }]) : []);
			this.entities = I([...e, ...r].map(i));
		}
		for (let e of [...t.tracks ?? []].sort((e, t) => (e.at ?? 0) - (t.at ?? 0))) if (e.type === "transform") {
			let t = this.sample(e.at ?? 0), n = l(e.target) ? t.cameras[u(e.target)].components.transform : t.poses[e.target] ?? F();
			for (let t of Object.keys(e.to)) {
				let r = e.from?.[t] ?? n[t], i = e.to[t];
				this.tracks.push(l(e.target) ? {
					type: "camera",
					...this.document.cameras ? { camera: u(e.target) } : {},
					property: t === "scale" ? "zoom" : t,
					at: e.at ?? 0,
					duration: e.duration,
					from: r,
					to: i,
					ease: e.ease ?? "linear"
				} : {
					type: "tween",
					target: e.target,
					property: t,
					at: e.at ?? 0,
					duration: e.duration,
					from: r,
					to: i,
					ease: e.ease ?? "linear"
				});
			}
		} else if (this.tracks.push(e), e.type === "follow") {
			let t = 0, n = [0];
			for (let r = 1; r < e.points.length; r++) {
				let i = e.points[r - 1], a = e.points[r];
				t += Math.hypot(a[0] - i[0], a[1] - i[1]), n.push(t);
			}
			this.paths.set(e, {
				lengths: n,
				total: t
			});
		}
	}
	sample(t) {
		if (!Number.isFinite(t)) throw Error("Animation time must be finite");
		let n = Math.max(0, Math.min(this.document.duration, t)), r = Object.create(null), i = /* @__PURE__ */ new Set(), a = o(this.document), l = c(this.document, n), u = a[l];
		for (let e of this.entities) {
			let { transform: t, graphic: n } = e.components;
			r[e.id] = {
				...t,
				...n?.width === void 0 ? {} : { width: n.width },
				...n?.height === void 0 ? {} : { height: n.height },
				...n?.x2 === void 0 ? {} : { x2: n.x2 },
				...n?.y2 === void 0 ? {} : { y2: n.y2 },
				...n?.progress === void 0 ? {} : { progress: n.progress }
			};
		}
		for (let e of this.tracks) {
			if (e.type === "camera") {
				let t = e.camera ?? "$default", r = a[t].components.transform, o = e.at ?? 0, s = "@camera:" + t + ":" + e.property;
				if (n >= o || !i.has(s)) {
					let t = P[e.ease ?? "linear"](N((n - o) / e.duration));
					r[e.property === "zoom" ? "scale" : e.property] = e.from + (e.to - e.from) * t, i.add(s);
				}
				continue;
			}
			let t = r[e.target] ??= F(), o = e.at ?? 0, s = (r, a) => {
				let s = e.target + ":" + r;
				(n >= o || !i.has(s)) && (t[r] = a, i.add(s));
			};
			if (e.type === "color") {
				let t = P[e.ease ?? "linear"](N((n - o) / e.duration)), r = "#";
				for (let n of [
					1,
					3,
					5
				]) {
					let i = parseInt(e.from.slice(n, n + 2), 16), a = parseInt(e.to.slice(n, n + 2), 16);
					r += Math.round(i + (a - i) * t).toString(16).padStart(2, "0");
				}
				s(e.property, r);
			} else if (e.type === "tween") {
				let t = Math.max(0, n - o), r = e.repeat ?? 1, i = Math.min(r - 1, Math.floor(t / e.duration)), a = N((t - i * e.duration) / e.duration);
				e.yoyo && i % 2 && (a = 1 - a), a = P[e.ease ?? "linear"](a), s(e.property, e.from + (e.to - e.from) * a);
			} else if (e.type === "wave") {
				let t = Math.max(0, Math.min(e.duration, n - o));
				s(e.property, e.center + e.amplitude * Math.sin(t / e.period * 2 * Math.PI + (e.phase ?? 0)));
			} else {
				let t = P[e.ease ?? "linear"](N((n - o) / e.duration)), r = this.paths.get(e), i = t * r.total, a = 1;
				for (; a < r.lengths.length - 1 && r.lengths[a] < i;) a++;
				for (; a < r.lengths.length - 1 && r.lengths[a] === r.lengths[a - 1];) a++;
				let c = e.points[a - 1], l = e.points[a], u = r.lengths[a] - r.lengths[a - 1], d = u ? (i - r.lengths[a - 1]) / u : 0;
				s("x", c[0] + (l[0] - c[0]) * d), s("y", c[1] + (l[1] - c[1]) * d), e.orient && s("rotate", Math.atan2(l[1] - c[1], l[0] - c[0]) * 180 / Math.PI);
			}
		}
		let d = this.document.captions?.find((e) => n >= e.at && n < e.at + e.duration);
		return {
			time: n,
			clock: e(n, this.document.duration),
			camera: s(u),
			cameraEntity: u,
			cameraId: l,
			cameras: a,
			effects: this.effects.sample(n),
			poses: r,
			caption: d ? {
				text: d.text,
				speaker: d.speaker ?? "",
				opacity: d.fade ? Math.min(1, (n - d.at) / d.fade, (d.at + d.duration - n) / d.fade) : 1
			} : null
		};
	}
};
function R(e) {
	return new L(e);
}
//#endregion
export { o as _, m as a, n as b, x as c, w as d, k as f, d as g, f as h, g as i, y as l, c as m, R as n, C as o, p, M as r, _ as s, L as t, A as u, a as v, r as x, i as y };
