//#region src/export-controls.ts
function e(e, t) {
	let n = e.ownerDocument.createElement("div"), r = n.attachShadow({ mode: "open" });
	e.appendChild(n), r.innerHTML = "<style>\n :host{display:block;font:14px system-ui;color:inherit}button,select,input{font:inherit}button,select{border:1px solid #65738a;border-radius:5px;padding:8px 13px;background:#172231;color:#edf2fa}button{cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,select:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid #91c7ff;outline-offset:3px}section{padding:14px 0}fieldset{border:1px solid #65738a;border-radius:6px;margin:12px 0;padding:16px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}fieldset[hidden]{display:none}legend{padding:0 7px}label{display:flex;gap:8px;align-items:center}small{display:block;opacity:.75;margin:10px 0;line-height:1.6}progress{width:140px;accent-color:#82e5c4}a{color:#8fd8ff}output{font-size:13px}button[hidden],a[hidden],progress[hidden]{display:none}\n </style><section><button id=\"toggle\" aria-expanded=\"false\">导出 MP4 / GIF</button>\n <fieldset hidden><legend>导出整段动画</legend><label>格式 <select id=\"format\"><option value=\"mp4\">MP4 · 720p / 30 fps</option><option value=\"gif\">GIF · 480px / 10 fps</option></select></label><label><input id=\"captions\" type=\"checkbox\" checked> 包含字幕</label><button id=\"start\">开始导出</button><button id=\"cancel\" hidden>取消</button><progress hidden max=\"1\" value=\"0\" aria-label=\"导出进度\"></progress><output role=\"status\" aria-live=\"polite\"></output><a id=\"download\" hidden>再次下载</a></fieldset>\n <small>本地生成，无音轨。字幕选项控制旁白字幕，画面标题与图表文字会保留。GIF 色彩与清晰度低于 MP4。</small></section>";
	let i = (e) => r.querySelector(e), a = i("#toggle"), o = i("fieldset"), s = i("#format"), c = i("#captions"), l = i("#start"), u = i("#cancel"), d = i("progress"), f = i("output"), p = i("#download"), m, h, g = !1, _ = !1, v = () => {
		h &&= (URL.revokeObjectURL(h), void 0), p.hidden = !0, p.removeAttribute("href");
	};
	return a.onclick = () => {
		o.hidden = !o.hidden, a.setAttribute("aria-expanded", String(!o.hidden)), !_ && !o.hidden && (c.checked = t().player.snapshot().captionsEnabled, _ = !0);
	}, u.onclick = () => {
		m?.abort(), u.disabled = !0, f.textContent = "正在取消…";
	}, l.onclick = async () => {
		if (m || g) return;
		let e = new AbortController();
		m = e, l.disabled = !0, s.disabled = !0, c.disabled = !0, u.hidden = !1, u.disabled = !1, d.hidden = !1, d.value = 0, f.textContent = "准备画面…", v();
		try {
			let n = t();
			n.player.pause();
			let r = JSON.stringify(n.player.compiled.document), i = s.value, { canvasDrawers: a, ...o } = {
				...n.options,
				canvasDrawers: n.options?.canvasDrawers?.map((e) => ({ ...e })),
				captionsEnabled: c.checked,
				signal: e.signal,
				onProgress: (t) => {
					!g && !e.signal.aborted && (d.value = t, f.textContent = `正在导出 ${Math.round(t * 100)}%`);
				}
			}, l = {
				...o,
				...a ? { canvasDrawers: a } : {}
			}, u = i === "gif" ? await (await import("./export-gif.js")).exportAnimationGif(r, {
				...l,
				fps: 10,
				maxWidth: 480
			}) : await (await import("./export-mp4.js")).exportAnimationMp4(r, {
				...l,
				fps: 30,
				maxHeight: 720
			});
			if (g || e.signal.aborted) return;
			let m = (n.filename ?? "animation").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
			h = URL.createObjectURL(u), p.href = h, p.download = `${m}${c.checked ? "-subtitles" : "-clean"}.${i}`, p.hidden = !1, f.textContent = `导出完成 · ${(u.size / 1024 / 1024).toFixed(1)} MB`, p.click();
		} catch (t) {
			g || (f.textContent = e.signal.aborted ? "已取消导出" : `导出失败：${t instanceof Error ? t.message : String(t)}`);
		} finally {
			m = void 0, g || (l.disabled = !1, s.disabled = !1, c.disabled = !1, u.hidden = !0, d.hidden = !0);
		}
	}, { destroy() {
		g = !0, m?.abort(), v(), n.remove();
	} };
}
//#endregion
export { e as mountExportControls };
