import { n as e } from "./compile-CHXnrHMM.js";
import { n as t, t as n } from "./frames-1L0mcmXx.js";
//#region src/export/mp4.ts
var r = (e) => new Uint8Array([e >>> 8, e & 255]), i = (e) => new Uint8Array([
	e >>> 24,
	e >>> 16 & 255,
	e >>> 8 & 255,
	e & 255
]), a = (e) => new TextEncoder().encode(e), o = (e) => new Uint8Array(e);
function s(...e) {
	let t = new Uint8Array(e.reduce((e, t) => e + t.length, 0)), n = 0;
	for (let r of e) t.set(r, n), n += r.length;
	return t;
}
var c = (e, ...t) => {
	let n = s(...t);
	return s(i(n.length + 8), a(e), n);
}, l = (e, t, ...n) => c(e, i(t), ...n), u = s(...[
	65536,
	0,
	0,
	0,
	65536,
	0,
	0,
	0,
	1073741824
].map(i)), d = class {
	width;
	height;
	maxBytes;
	samples = [];
	bytes = 0;
	duration = 0;
	description;
	finished = !1;
	constructor(e, t, n = 268435456) {
		if (this.width = e, this.height = t, this.maxBytes = n, !Number.isInteger(e) || !Number.isInteger(t) || e < 2 || t < 2 || e > 1920 || t > 1080 || e % 2 || t % 2) throw Error("MP4 dimensions must be even and within 1920×1080");
	}
	setDecoderConfig(e) {
		if (this.finished) throw Error("MP4 already finalized");
		if (e.length < 7 || e.length > 65536 || e[0] !== 1) throw Error("Invalid AVC decoder configuration");
		if (this.description && (e.length !== this.description.length || e.some((e, t) => e !== this.description[t]))) throw Error("AVC configuration changed during export");
		this.description = e.slice();
	}
	add(e, t, n, r) {
		if (this.finished) throw Error("MP4 already finalized");
		if (!e.length || !Number.isSafeInteger(t) || !Number.isSafeInteger(n) || n <= 0 || t !== this.duration) throw Error("MP4 requires contiguous frames without reordering");
		if (!this.samples.length && !r) throw Error("MP4 must start with a key frame");
		if (this.samples.length >= 18e3 || t + n > 6e8 || this.bytes + e.length > this.maxBytes) throw Error("Video exceeds export limits (10 minutes / 256 MB)");
		this.bytes += e.length, this.duration += n, this.samples.push({
			data: e.slice(),
			timestamp: t,
			duration: n,
			key: r
		});
	}
	movie(e) {
		let t = this.samples, n = t.length, d = 1e6, f = l("mvhd", 0, i(0), i(0), i(d), i(this.duration), i(65536), r(256), o(10), u, o(24), i(2)), p = l("tkhd", 7, i(0), i(0), i(1), i(0), i(this.duration), o(8), r(0), r(0), r(0), r(0), u, i(this.width * 65536), i(this.height * 65536)), m = l("mdhd", 0, i(0), i(0), i(d), i(this.duration), r(21956), r(0)), h = l("hdlr", 0, i(0), a("vide"), o(12), a("Rusie video\0")), g = c("avc1", o(6), r(1), o(16), r(this.width), r(this.height), i(4718592), i(4718592), i(0), r(1), o(32), r(24), r(65535), c("avcC", this.description)), _ = [];
		for (let e of t) {
			let t = _.at(-1);
			t?.delta === e.duration ? t.count++ : _.push({
				count: 1,
				delta: e.duration
			});
		}
		let v = l("stts", 0, i(_.length), ..._.map((e) => s(i(e.count), i(e.delta)))), y = l("stsz", 0, i(0), i(n), ...t.map((e) => i(e.data.length))), b = l("stsc", 0, i(1), i(1), i(1), i(1)), x = l("stco", 0, i(e.length), ...e.map(i)), S = t.flatMap((e, t) => e.key ? [t + 1] : []), C = l("stss", 0, i(S.length), ...S.map(i)), w = c("stbl", l("stsd", 0, i(1), g), v, b, y, x, C), T = c("dinf", l("dref", 0, i(1), l("url ", 1)));
		return c("moov", f, c("trak", p, c("mdia", m, h, c("minf", l("vmhd", 1, o(8)), T, w))));
	}
	finalize() {
		if (this.finished) throw Error("MP4 already finalized");
		if (!this.samples.length || !this.description) throw Error("No encoded video or AVC configuration");
		let e = c("ftyp", a("isom"), i(512), a("isomiso2avc1mp41")), t = this.movie(this.samples.map(() => 0)), n = e.length + t.length + 8, r = this.samples.map((e) => {
			let t = n;
			return n += e.data.length, t;
		});
		if (n > 4294967295) throw Error("MP4 offset overflow");
		let o = this.movie(r), l = new Blob([
			e.buffer,
			o.buffer,
			s(i(this.bytes + 8), a("mdat")).buffer,
			...this.samples.map((e) => e.data.buffer)
		], { type: "video/mp4" });
		return this.finished = !0, this.samples = [], l;
	}
};
//#endregion
//#region src/export-mp4.ts
async function f(r, i = {}) {
	if (n(i.signal), typeof VideoEncoder > "u" || typeof VideoFrame > "u") throw Error("MP4 encoding requires a browser with WebCodecs support, such as Chrome, Edge, or WebView2.");
	let a = e(r), o = a.document, s = i.fps ?? 30;
	if (i.canvasDrawers?.length && o.surface.type !== "canvas") throw Error("Canvas drawers require a canvas surface");
	if (![24, 30].includes(s)) throw Error("Export frame rate must be 24 or 30 fps");
	if (i.maxHeight !== void 0 && ![720, 1080].includes(i.maxHeight)) throw Error("Invalid export dimensions");
	if (i.captionsEnabled !== void 0 && typeof i.captionsEnabled != "boolean") throw Error("captionsEnabled must be a boolean");
	let c = Math.min(1, 1920 / o.width, (i.maxHeight ?? 1080) / o.height), l = Math.max(2, Math.floor(o.width * c / 2) * 2), u = Math.max(2, Math.floor(o.height * c / 2) * 2), f = Math.ceil(o.duration * s / 1e3), p = Math.round(o.duration * 1e3), m = {
		codec: "avc1.420028",
		width: l,
		height: u,
		framerate: s,
		bitrate: Math.max(15e5, Math.min(1e7, l * u * s * .15)),
		latencyMode: "realtime",
		avc: { format: "avc" }
	}, h = await VideoEncoder.isConfigSupported(m);
	if (n(i.signal), !h.supported) throw Error("No H.264 encoder is available in this browser for MP4 export.");
	let g = t(a, l, u, i, i.signal), _, v, y = new d(l, u), b = /* @__PURE__ */ new Map();
	try {
		await g.prepare(), _ = new VideoEncoder({
			error: (e) => {
				v = e;
			},
			output: (e, t) => {
				try {
					let n = t?.decoderConfig?.description;
					if (n) {
						let e = ArrayBuffer.isView(n) ? new Uint8Array(n.buffer, n.byteOffset, n.byteLength) : new Uint8Array(n);
						y.setDecoderConfig(e);
					}
					let r = new Uint8Array(e.byteLength);
					e.copyTo(r);
					let i = b.get(e.timestamp);
					if (i === void 0) throw Error("Encoder returned an unknown frame timestamp");
					b.delete(e.timestamp), y.add(r, e.timestamp, i, e.type === "key");
				} catch (e) {
					v = e instanceof Error ? e : Error(String(e));
				}
			}
		}), _.configure(m);
		let e = -1;
		for (let t = 0; t < f; t++) {
			if (n(i.signal), v) throw v;
			let r = Math.round(t * 1e6 / s), a = Math.min(p, Math.round((t + 1) * 1e6 / s)) - r;
			await g.render(t === f - 1 ? o.duration : t * 1e3 / s);
			let c = new VideoFrame(g.canvas, {
				timestamp: r,
				duration: a
			});
			try {
				b.set(r, a), _.encode(c, { keyFrame: t % (s * 2) == 0 });
			} finally {
				c.close();
			}
			if (_.encodeQueueSize >= 4 && await _.flush(), v) throw v;
			let l = Math.floor((t + 1) / f * 99);
			l !== e && (i.onProgress?.(l / 100), e = l), t % 8 == 0 && await new Promise((e) => setTimeout(e, 0));
		}
		if (await _.flush(), n(i.signal), v) throw v;
		if (b.size) throw Error("Encoder dropped video frames");
		let t = y.finalize();
		return i.onProgress?.(1), t;
	} finally {
		_ && _.state !== "closed" && _.close(), g.destroy();
	}
}
//#endregion
export { f as exportAnimationMp4 };
