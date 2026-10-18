import { n as e } from "./compile-CHXnrHMM.js";
import { n as t, t as n } from "./frames-DShHTA_B.js";
//#region src/export/gif.ts
function r(e) {
	let t = /* @__PURE__ */ new Uint32Array(32768), n = /* @__PURE__ */ new Float64Array(32768), r = /* @__PURE__ */ new Float64Array(32768), i = /* @__PURE__ */ new Float64Array(32768);
	for (let a = 0; a < e.length; a += 4) {
		let o = e[a], s = e[a + 1], c = e[a + 2], l = o >> 3 << 10 | s >> 3 << 5 | c >> 3;
		t[l]++, n[l] += o, r[l] += s, i[l] += c;
	}
	let a = [];
	for (let e = 0; e < t.length; e++) t[e] && a.push({
		key: e,
		r: n[e] / t[e],
		g: r[e] / t[e],
		b: i[e] / t[e],
		count: t[e]
	});
	function o(e) {
		let t = [
			"r",
			"g",
			"b"
		].map((t) => {
			let n = 255, r = 0;
			for (let i of e) n = Math.min(n, i[t]), r = Math.max(r, i[t]);
			return r - n;
		}), n = [
			"r",
			"g",
			"b"
		][t.indexOf(Math.max(...t))], r = e.reduce((e, t) => e + t.count, 0);
		return {
			items: e,
			axis: n,
			weight: r,
			score: e.length > 1 ? Math.max(...t) * Math.sqrt(r) : 0
		};
	}
	let s = [o(a)];
	for (; s.length < 256;) {
		let e = 0;
		for (let t = 1; t < s.length; t++) s[t].score > s[e].score && (e = t);
		let t = s[e];
		if (!t.score) break;
		t.items.sort((e, n) => e[t.axis] - n[t.axis]);
		let n = 0, r = 1;
		for (; r < t.items.length && (n += t.items[r - 1].count, !(n >= t.weight / 2)); r++);
		r = Math.min(r, t.items.length - 1), s[e] = o(t.items.slice(0, r)), s.push(o(t.items.slice(r)));
	}
	let c = /* @__PURE__ */ new Uint8Array(768), l = /* @__PURE__ */ new Uint8Array(32768);
	s.forEach((e, t) => {
		let n = 0, r = 0, i = 0;
		for (let a of e.items) n += a.r * a.count, r += a.g * a.count, i += a.b * a.count, l[a.key] = t;
		c[t * 3] = Math.round(n / e.weight), c[t * 3 + 1] = Math.round(r / e.weight), c[t * 3 + 2] = Math.round(i / e.weight);
	});
	let u = new Uint8Array(e.length / 4);
	for (let t = 0; t < u.length; t++) u[t] = l[e[t * 4] >> 3 << 10 | e[t * 4 + 1] >> 3 << 5 | e[t * 4 + 2] >> 3];
	return {
		palette: c,
		pixels: u
	};
}
function i(e) {
	let t = [], n = 9, r = 258, i = 0, a = 0, o = /* @__PURE__ */ new Map(), s = (e) => {
		for (i |= e << a, a += n; a >= 8;) t.push(i & 255), i >>>= 8, a -= 8;
	}, c = (e) => {
		s(e), r === 1 << n && n < 12 && n++;
	};
	s(256);
	let l = e[0];
	for (let t = 1; t < e.length; t++) {
		let i = e[t], a = l * 256 + i, u = o.get(a);
		u === void 0 ? (c(l), r < 4096 ? o.set(a, r++) : (s(256), o.clear(), n = 9, r = 258), l = i) : l = u;
	}
	return c(l), s(257), a && t.push(i & 255), new Uint8Array(t);
}
var a = class {
	width;
	height;
	maxBytes;
	parts = [];
	bytes = 0;
	frames = 0;
	finished = !1;
	constructor(e, t, n = 134217728) {
		if (this.width = e, this.height = t, this.maxBytes = n, !Number.isInteger(e) || !Number.isInteger(t) || e < 1 || t < 1 || e > 960 || t > 960) throw Error("GIF 尺寸必须在 1–960 像素范围");
		this.append(new Uint8Array([
			71,
			73,
			70,
			56,
			57,
			97,
			e & 255,
			e >> 8,
			t & 255,
			t >> 8,
			112,
			0,
			0,
			33,
			255,
			11,
			...Array.from("NETSCAPE2.0", (e) => e.charCodeAt(0)),
			3,
			1,
			0,
			0,
			0
		]));
	}
	append(e) {
		if (this.bytes + e.length > this.maxBytes) throw Error("GIF 超过 128 MB，请降低分辨率或缩短片段");
		this.bytes += e.length, this.parts.push(e);
	}
	add(e, t) {
		if (this.finished) throw Error("GIF already finalized");
		if (e.length !== this.width * this.height * 4 || !Number.isInteger(t) || t < 1 || t > 65535) throw Error("Invalid GIF frame");
		let { palette: n, pixels: a } = r(e), o = i(a);
		this.append(new Uint8Array([
			33,
			249,
			4,
			4,
			t & 255,
			t >> 8,
			0,
			0,
			44,
			0,
			0,
			0,
			0,
			this.width & 255,
			this.width >> 8,
			this.height & 255,
			this.height >> 8,
			135
		])), this.append(n);
		let s = new Uint8Array(2 + o.length + Math.ceil(o.length / 255));
		s[0] = 8;
		let c = 1;
		for (let e = 0; e < o.length; e += 255) {
			let t = o.subarray(e, e + 255);
			s[c++] = t.length, s.set(t, c), c += t.length;
		}
		this.append(s), this.frames++;
	}
	finish() {
		if (this.finished || !this.frames) throw Error("GIF requires frames and a single finalize");
		this.append(new Uint8Array([59])), this.finished = !0;
		let e = new Blob(this.parts, { type: "image/gif" });
		return this.parts = [], e;
	}
};
//#endregion
//#region src/export-gif.ts
async function o(r, i = {}) {
	n(i.signal);
	let o = e(r), s = o.document, c = i.fps ?? 10, l = i.maxWidth ?? 480;
	if (![10, 15].includes(c) || ![
		320,
		480,
		640
	].includes(l)) throw Error("GIF 支持 10/15 fps 与 320/480/640 像素宽度");
	let u = Math.min(1, l / s.width, 960 / s.height), d = Math.max(1, Math.round(s.width * u)), f = Math.max(1, Math.round(s.height * u)), p = Math.max(1, Math.round(s.duration / 10)), m = Math.min(p, Math.ceil(s.duration * c / 1e3));
	if (m > 1800 || m * d * f > 3e8) throw Error("GIF 过长或尺寸过大，请降低分辨率或缩短片段");
	let h = t(o, d, f, i, i.signal), g = new a(d, f);
	try {
		await h.prepare();
		for (let e = 0; e < m; e++) {
			n(i.signal), await h.render(e === m - 1 ? s.duration : e * 1e3 / c);
			let t = Math.round(e * p / m), r = Math.round((e + 1) * p / m);
			g.add(h.context.getImageData(0, 0, d, f).data, r - t), i.onProgress?.((e + 1) / m * .99), await new Promise((e) => setTimeout(e, 0));
		}
		n(i.signal);
		let e = g.finish();
		return i.onProgress?.(1), e;
	} finally {
		h.destroy();
	}
}
//#endregion
export { o as exportAnimationGif };
