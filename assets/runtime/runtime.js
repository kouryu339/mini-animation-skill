import { _ as e, a as t, b as n, g as r, h as i, i as a, m as o, n as s, r as c, t as l, u, v as d, x as f, y as p } from "./compile-CHXnrHMM.js";
import { a as m, i as h, n as g, o as _, r as v, t as y } from "./images-MuxrSMtz.js";
import { AnimationTimeline as b, clipTime as x, sampleTime as S } from "./timeline.js";
//#region src/player.ts
var C = class {
	compiled;
	renderer;
	scheduler;
	timeline;
	captionsEnabled = !0;
	terminal;
	error;
	frame = null;
	epoch = 0;
	loading = !1;
	listeners = /* @__PURE__ */ new Set();
	constructor(e, t, n, r = {}) {
		if (this.compiled = e, this.renderer = t, this.scheduler = n, this.timeline = new b(e.document.duration), r.captionsEnabled !== void 0 && typeof r.captionsEnabled != "boolean") throw Error("captionsEnabled must be boolean");
		this.captionsEnabled = r.captionsEnabled ?? !0, this.paint();
	}
	get time() {
		return this.timeline.snapshot();
	}
	snapshot() {
		let e = this.time;
		return {
			time: e.ms,
			duration: e.duration,
			rate: e.rate,
			captionsEnabled: this.captionsEnabled,
			status: this.terminal ?? e.status,
			...this.error ? { error: this.error } : {}
		};
	}
	subscribe(e) {
		return this.listeners.add(e), e(this.snapshot()), () => this.listeners.delete(e);
	}
	notify() {
		for (let e of this.listeners) try {
			e(this.snapshot());
		} catch (e) {
			console.error("Animation listener failed", e);
		}
	}
	alive() {
		if (this.terminal === "destroyed") throw Error("Animation player destroyed");
	}
	paint() {
		let e = this.compiled.sample(this.time.ms);
		this.renderer.render(this.captionsEnabled ? e : {
			...e,
			caption: null
		});
	}
	stopFrame() {
		this.frame !== null && this.scheduler.cancel(this.frame), this.frame = null;
	}
	fail(e) {
		this.epoch++, this.loading = !1, this.stopFrame(), this.timeline.seek(this.time.ms), this.error = e instanceof Error ? e.message : String(e), this.terminal = "error", this.notify();
	}
	async prepare() {
		this.alive();
		try {
			await this.renderer.prepare?.(), this.alive(), this.paint();
		} catch (e) {
			throw this.terminal !== "destroyed" && this.fail(e), e;
		}
	}
	async play() {
		if (this.alive(), this.time.status === "playing" || this.loading) return;
		if (this.terminal === "error") throw Error(this.error ?? "Animation failed");
		let e = ++this.epoch;
		this.loading = !0;
		try {
			if (await this.renderer.prepare?.(), e !== this.epoch) return;
			this.loading = !1, this.timeline.play(this.scheduler.now()), this.paint(), this.notify(), this.schedule();
		} catch (t) {
			if (e === this.epoch) throw this.fail(t), t;
		}
	}
	schedule() {
		!this.terminal && this.time.status === "playing" && this.frame === null && (this.frame = this.scheduler.request(this.tick));
	}
	tick = () => {
		if (this.frame = null, !(this.terminal || this.time.status !== "playing")) try {
			this.timeline.advance(this.scheduler.now()), this.paint(), this.notify(), this.schedule();
		} catch (e) {
			this.fail(e);
		}
	};
	pause() {
		this.alive(), this.epoch++, this.loading = !1, this.stopFrame();
		try {
			let e = this.time.status === "playing";
			this.timeline.pause(this.scheduler.now()), e && this.paint(), this.notify();
		} catch (e) {
			throw this.fail(e), e;
		}
	}
	seek(e) {
		if (this.alive(), !Number.isFinite(e)) throw Error("Animation time must be finite");
		this.epoch++, this.loading = !1, this.stopFrame(), this.timeline.seek(e), this.terminal = void 0, this.error = void 0;
		try {
			this.paint(), this.notify();
		} catch (e) {
			throw this.fail(e), e;
		}
	}
	setCaptionsEnabled(e) {
		if (this.alive(), typeof e != "boolean") throw Error("captionsEnabled must be a boolean");
		if (e !== this.captionsEnabled) {
			this.captionsEnabled = e;
			try {
				this.paint(), this.notify();
			} catch (e) {
				throw this.fail(e), e;
			}
		}
	}
	setRate(e) {
		if (this.alive(), !Number.isFinite(e) || e < .25 || e > 4) throw Error("Rate outside .25..4");
		try {
			let t = this.time.status === "playing";
			this.timeline.setRate(e, this.scheduler.now()), this.time.status === "ended" && this.stopFrame(), t && this.paint(), this.notify();
		} catch (e) {
			throw this.fail(e), e;
		}
	}
	destroy() {
		if (this.terminal !== "destroyed") {
			this.epoch++, this.loading = !1, this.stopFrame(), this.timeline.seek(this.time.ms), this.terminal = "destroyed";
			try {
				this.renderer.destroy();
			} finally {
				this.notify(), this.listeners.clear();
			}
		}
	}
};
//#endregion
//#region src/index.ts
function w(e, t, n = {}) {
	let r = s(t), i = e.ownerDocument, a = i.defaultView;
	if (!a) throw Error("Animation needs a document window");
	if (n.canvasDrawers?.length && r.document.surface.type !== "canvas") throw Error("Canvas drawers require a canvas surface");
	let o = i.createElement("div");
	o.style.cssText = "position:relative;width:100%;height:100%;overflow:hidden;isolation:isolate;pointer-events:none;", o.style.containerType = "inline-size";
	let l = new h(o, r.document, n.captionStyle), u = new y(r.document, i, n);
	try {
		let t = r.document.surface.type === "svg" ? new g(o, r, u) : new v(o, r, u, n.canvasDrawers), s = r.document.effects?.length ? new c(o, r.document) : void 0;
		e.appendChild(o);
		let d = new C(r, {
			prepare: () => u.prepare(),
			render(e) {
				t.render(e), s?.render(e), l.render(e);
			},
			destroy() {
				u.destroy(), t.destroy(), s?.destroy(), l.destroy(), o.remove();
			}
		}, {
			now: () => a.performance.now(),
			request: (e) => a.requestAnimationFrame(e),
			cancel: (e) => a.cancelAnimationFrame(e)
		}, n), f = !1, p = d.pause.bind(d);
		d.pause = () => {
			f = !1, p();
		};
		let m = () => {
			i.hidden ? (f = d.snapshot().status === "playing", p()) : f && (f = !1, d.play().catch((e) => console.error("Animation resume failed", e)));
		};
		i.addEventListener("visibilitychange", m);
		let h = d.destroy.bind(d);
		return d.destroy = () => {
			f = !1, i.removeEventListener("visibilitychange", m), h();
		}, d;
	} catch (e) {
		throw u.destroy(), o.remove(), e;
	}
}
function T(e, t, n = {}) {
	return w(e, JSON.stringify({
		...t,
		format: "rusie.motion/1",
		surface: {
			type: "canvas",
			nodes: []
		}
	}), n);
}
//#endregion
export { a as AnimationError, C as AnimationPlayer, b as AnimationTimeline, l as CompiledAnimation, m as DEFAULT_CAPTION_STYLE, t as LIMITS, o as cameraIdAt, i as cameraMatrix, x as clipTime, s as compileAnimation, w as createAnimation, e as createCameraEntities, d as createCameraEntity, T as createCanvasAnimation, p as createEntity, n as createTransform, u as parseAnimation, r as resolveCamera, _ as resolveCaptionStyle, S as sampleTime, f as transformMatrix };
