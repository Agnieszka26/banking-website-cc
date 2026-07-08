(function () {
	try {
		var k = "banking-app-font-scale";
		var px = [14, 15, 16, 18, 20];
		var v = localStorage.getItem(k);
		var n = v === null ? 2 : Number.parseInt(v, 10);
		n = Number.isNaN(n) ? 2 : Math.min(4, Math.max(0, n));
		var r = document.documentElement;
		r.style.setProperty("--font-scale", String(px[n] / 16));
		r.style.fontSize = `${px[n]}px`;
		r.dataset.fontScale = String(n);
	} catch {}
})();
