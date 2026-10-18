//#region src/helpers.ts
var e = (e, t) => {
	if (!Number.isFinite(e)) throw Error(`${t} must be finite`);
	return e;
};
function t(t) {
	return Math.max(0, Math.min(1, e(t, "Progress")));
}
var n = Object.freeze({
	linear: (e) => t(e),
	smooth: (e) => (e = t(e), e * e * (3 - 2 * e)),
	inCubic: (e) => t(e) ** 3,
	outCubic: (e) => 1 - (1 - t(e)) ** 3,
	inOutCubic: (e) => (e = t(e), e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2)
});
function r(r, i, a, o = n.linear) {
	if (e(r.ms, "Time"), e(i, "Start"), e(a, "Duration"), a <= 0) throw Error("Duration must be positive");
	let s = t((r.ms - i) / a);
	return s === 0 || s === 1 ? s : e(o(s), "Easing result");
}
function i(t, n, r) {
	return e(t, "From"), e(n, "To"), e(r, "Amount"), e(t + (n - t) * r, "Interpolated value");
}
function a(e, t = 0) {
	if (!Number.isSafeInteger(e) || !Number.isSafeInteger(t)) throw Error("Random index and seed must be safe integers");
	let n = Math.sin(e * 127.1 + 311.7 + t * 74.7) * 43758.5453;
	return n - Math.floor(n);
}
function o(t, n, r, i, a, o = "#00000000") {
	if (e(n, "X"), e(r, "Y"), e(i, "Radius"), i < 0) throw Error("Radius cannot be negative");
	if (i !== 0) {
		t.save();
		try {
			let e = t.createRadialGradient(n, r, 0, n, r, i);
			e.addColorStop(0, a), e.addColorStop(1, o), t.fillStyle = e, t.fillRect(n - i, r - i, i * 2, i * 2);
		} finally {
			t.restore();
		}
	}
}
//#endregion
export { t as clamp01, n as easing, i as lerp, r as progress, o as radialGlow, a as randomAt };
