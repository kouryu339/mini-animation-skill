//#region src/timeline.ts
var e = (e, t) => {
	if (!Number.isFinite(e)) throw Error(`${t} must be finite`);
	return e;
};
function t(t, n) {
	if (e(t, "Time"), e(n, "Duration"), n <= 0) throw Error("Duration must be positive");
	let r = Math.max(0, Math.min(n, t));
	return Object.freeze({
		ms: r,
		seconds: r / 1e3,
		duration: n,
		progress: r / n
	});
}
function n(n, r, i) {
	return t(n.ms - e(r, "Clip start"), i);
}
var r = class {
	duration;
	ms = 0;
	rate = 1;
	status = "ready";
	last = 0;
	constructor(e) {
		this.duration = e, t(0, e);
	}
	snapshot() {
		return Object.freeze({
			...t(this.ms, this.duration),
			rate: this.rate,
			status: this.status
		});
	}
	play(t) {
		return e(t, "Clock"), this.status === "playing" || (this.ms >= this.duration && (this.ms = 0), this.last = t, this.status = "playing"), this.snapshot();
	}
	advance(t) {
		if (e(t, "Clock"), this.status === "playing") {
			let e = Math.max(this.last, t);
			this.ms = Math.min(this.duration, this.ms + (e - this.last) * this.rate), this.last = e, this.ms === this.duration && (this.status = "ended");
		}
		return this.snapshot();
	}
	pause(e) {
		return this.advance(e), this.status !== "ended" && (this.status = "paused"), this.snapshot();
	}
	seek(e) {
		return this.ms = t(e, this.duration).ms, this.status = this.ms === this.duration ? "ended" : "paused", this.snapshot();
	}
	setRate(t, n) {
		if (e(t, "Rate"), t < .25 || t > 4) throw Error("Rate outside .25..4");
		return this.advance(n), this.rate = t, this.snapshot();
	}
};
//#endregion
export { r as AnimationTimeline, n as clipTime, t as sampleTime };
