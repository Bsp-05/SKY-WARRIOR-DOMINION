import { n as __toESM } from "./rolldown-runtime.js";
import { B as require_react, R as require_jsx_dev_runtime, z as require_client } from "../vendor/libs.min.js";
import { n as MISSIONS, t as DIFFICULTY_CONFIG } from "./flight-rules.js";
import { t as FlightGameEngine } from "./flight-engine.js";
// \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
// src/components/GameModals.tsx
var import_client = require_client();
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName$5 = "/app/applet/src/components/GameModals.tsx";
var GameModals = ({ phase, summary, canAdvanceMission, onResume, onRestart, onNextMission, onMainMenu }) => {
	if (phase === "paused") return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#060911]/75 overflow-y-auto",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": "Flight Paused",
			className: "w-full max-w-sm bg-[#0b111e] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
				className: "font-display text-2xl font-bold text-white tracking-wide",
				children: "Sortie Paused"
			}, void 0, false, {
				fileName: _jsxFileName$5,
				lineNumber: 33,
				columnNumber: 13
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
				className: "text-sm text-slate-400 mt-1",
				children: "Simulation held. Resume flight or reconfigure sortie."
			}, void 0, false, {
				fileName: _jsxFileName$5,
				lineNumber: 36,
				columnNumber: 13
			}, void 0)] }, void 0, true, {
				fileName: _jsxFileName$5,
				lineNumber: 32,
				columnNumber: 11
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "space-y-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						onClick: onResume,
						className: "w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer",
						children: "Resume Flight"
					}, void 0, false, {
						fileName: _jsxFileName$5,
						lineNumber: 42,
						columnNumber: 13
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						onClick: onRestart,
						className: "w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg border border-slate-600 transition-colors cursor-pointer",
						children: "Restart Sortie"
					}, void 0, false, {
						fileName: _jsxFileName$5,
						lineNumber: 49,
						columnNumber: 13
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						onClick: onMainMenu,
						className: "w-full py-2.5 px-4 bg-transparent hover:bg-slate-800/70 text-slate-300 font-medium text-sm rounded-lg border border-slate-800 transition-colors cursor-pointer",
						children: "Return to Hangar"
					}, void 0, false, {
						fileName: _jsxFileName$5,
						lineNumber: 56,
						columnNumber: 13
					}, void 0)
				]
			}, void 0, true, {
				fileName: _jsxFileName$5,
				lineNumber: 41,
				columnNumber: 11
			}, void 0)]
		}, void 0, true, {
			fileName: _jsxFileName$5,
			lineNumber: 26,
			columnNumber: 9
		}, void 0)
	}, void 0, false, {
		fileName: _jsxFileName$5,
		lineNumber: 25,
		columnNumber: 7
	}, void 0);
	if ((phase === "victory" || phase === "defeat") && summary) {
		const isWin = phase === "victory";
		return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#060911]/80 overflow-y-auto",
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				role: "dialog",
				"aria-modal": "true",
				"aria-label": isWin ? "Mission Accomplished" : "Aircraft Lost",
				className: "w-full max-w-md bg-[#0b111e] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: `text-xs font-hud font-bold tracking-[0.2em] uppercase ${isWin ? "text-emerald-400" : "text-rose-400"}`,
									children: isWin ? "Air Superiority Confirmed" : "Sortie Failed"
								}, void 0, false, {
									fileName: _jsxFileName$5,
									lineNumber: 82,
									columnNumber: 17
								}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "px-1.5 py-0.5 text-[10px] font-hud uppercase rounded bg-slate-800 text-slate-300 border border-slate-700",
									children: summary.difficulty
								}, void 0, false, {
									fileName: _jsxFileName$5,
									lineNumber: 89,
									columnNumber: 17
								}, void 0)]
							}, void 0, true, {
								fileName: _jsxFileName$5,
								lineNumber: 81,
								columnNumber: 15
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
								className: "font-display text-3xl font-bold text-white tracking-wide mt-1",
								children: isWin ? "Victory" : "Defeat"
							}, void 0, false, {
								fileName: _jsxFileName$5,
								lineNumber: 93,
								columnNumber: 15
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "text-sm text-slate-300 mt-1",
								children: isWin ? `${summary.missionTitle} completed with full airspace control.` : summary.defeatReason || "Hostile forces overwhelmed the sector."
							}, void 0, false, {
								fileName: _jsxFileName$5,
								lineNumber: 96,
								columnNumber: 15
							}, void 0)
						] }, void 0, true, {
							fileName: _jsxFileName$5,
							lineNumber: 80,
							columnNumber: 13
						}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: `shrink-0 w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center bg-[#070b14] ${summary.rank === "S" ? "border-amber-400 text-amber-300" : summary.rank === "A" ? "border-emerald-400 text-emerald-300" : summary.rank === "B" ? "border-sky-400 text-sky-300" : "border-slate-600 text-slate-300"}`,
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "text-[9px] font-hud uppercase tracking-wider text-slate-400",
								children: "Rank"
							}, void 0, false, {
								fileName: _jsxFileName$5,
								lineNumber: 114,
								columnNumber: 15
							}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "text-2xl font-display font-bold leading-none",
								children: summary.rank
							}, void 0, false, {
								fileName: _jsxFileName$5,
								lineNumber: 115,
								columnNumber: 15
							}, void 0)]
						}, void 0, true, {
							fileName: _jsxFileName$5,
							lineNumber: 103,
							columnNumber: 13
						}, void 0)]
					}, void 0, true, {
						fileName: _jsxFileName$5,
						lineNumber: 79,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "grid grid-cols-3 gap-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "bg-[#070b14] border border-slate-800 rounded-lg p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[10px] font-hud text-slate-400 uppercase",
										children: "Score"
									}, void 0, false, {
										fileName: _jsxFileName$5,
										lineNumber: 122,
										columnNumber: 15
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-lg font-hud font-bold text-amber-400 mt-0.5",
										children: summary.score.toLocaleString()
									}, void 0, false, {
										fileName: _jsxFileName$5,
										lineNumber: 123,
										columnNumber: 15
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[10px] font-hud text-slate-500",
										children: ["Best ", summary.bestScore.toLocaleString()]
									}, void 0, true, {
										fileName: _jsxFileName$5,
										lineNumber: 126,
										columnNumber: 15
									}, void 0)
								]
							}, void 0, true, {
								fileName: _jsxFileName$5,
								lineNumber: 121,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "bg-[#070b14] border border-slate-800 rounded-lg p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[10px] font-hud text-slate-400 uppercase",
										children: "Kills / Wave"
									}, void 0, false, {
										fileName: _jsxFileName$5,
										lineNumber: 132,
										columnNumber: 15
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-lg font-hud font-bold text-white mt-0.5",
										children: [
											summary.kills,
											" ",
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: "text-xs text-slate-400",
												children: ["W", summary.wave]
											}, void 0, true, {
												fileName: _jsxFileName$5,
												lineNumber: 134,
												columnNumber: 33
											}, void 0)
										]
									}, void 0, true, {
										fileName: _jsxFileName$5,
										lineNumber: 133,
										columnNumber: 15
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[10px] font-hud text-slate-500",
										children: [
											"Acc ",
											summary.accuracyPct,
											"%"
										]
									}, void 0, true, {
										fileName: _jsxFileName$5,
										lineNumber: 136,
										columnNumber: 15
									}, void 0)
								]
							}, void 0, true, {
								fileName: _jsxFileName$5,
								lineNumber: 131,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "bg-[#070b14] border border-slate-800 rounded-lg p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[10px] font-hud text-slate-400 uppercase",
										children: "Flight Time"
									}, void 0, false, {
										fileName: _jsxFileName$5,
										lineNumber: 142,
										columnNumber: 15
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-lg font-hud font-bold text-sky-300 mt-0.5",
										children: [summary.elapsedSec, "s"]
									}, void 0, true, {
										fileName: _jsxFileName$5,
										lineNumber: 143,
										columnNumber: 15
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "text-[10px] font-hud text-slate-500",
										children: [
											"Rings ",
											summary.checkpointsCleared,
											"/",
											summary.checkpointsTotal
										]
									}, void 0, true, {
										fileName: _jsxFileName$5,
										lineNumber: 146,
										columnNumber: 15
									}, void 0)
								]
							}, void 0, true, {
								fileName: _jsxFileName$5,
								lineNumber: 141,
								columnNumber: 13
							}, void 0)
						]
					}, void 0, true, {
						fileName: _jsxFileName$5,
						lineNumber: 120,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex flex-col sm:flex-row gap-2.5 pt-1",
						children: [
							isWin && canAdvanceMission && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
								type: "button",
								"data-start": "true",
								onClick: onNextMission,
								className: "flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer",
								children: "Next Mission"
							}, void 0, false, {
								fileName: _jsxFileName$5,
								lineNumber: 154,
								columnNumber: 15
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
								type: "button",
								"data-start": isWin && canAdvanceMission ? void 0 : "true",
								onClick: onRestart,
								className: `flex-1 py-3 px-4 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer ${isWin && canAdvanceMission ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600" : "bg-amber-500 hover:bg-amber-400 text-slate-950"}`,
								children: isWin ? "Replay" : "Try Again"
							}, void 0, false, {
								fileName: _jsxFileName$5,
								lineNumber: 163,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
								type: "button",
								onClick: onMainMenu,
								className: "flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg border border-slate-600 transition-colors cursor-pointer",
								children: "Main Menu"
							}, void 0, false, {
								fileName: _jsxFileName$5,
								lineNumber: 175,
								columnNumber: 13
							}, void 0)
						]
					}, void 0, true, {
						fileName: _jsxFileName$5,
						lineNumber: 152,
						columnNumber: 11
					}, void 0)
				]
			}, void 0, true, {
				fileName: _jsxFileName$5,
				lineNumber: 73,
				columnNumber: 9
			}, void 0)
		}, void 0, false, {
			fileName: _jsxFileName$5,
			lineNumber: 72,
			columnNumber: 7
		}, void 0);
	}
	return null;
};
// src/components/MilitaryHud.tsx
var _jsxFileName$4 = "/app/applet/src/components/MilitaryHud.tsx";
function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}
var MilitaryHud = ({ hud, muted, touchEnabled, onCycleCamera, onToggleAutoTarget, onToggleTouch, onToggleMute, onPause }) => {
	const [shortViewport, setShortViewport] = (0, import_react.useState)(() => typeof window !== "undefined" && window.innerHeight < 520);
	(0, import_react.useEffect)(() => {
		const onResize = () => setShortViewport(window.innerHeight < 520);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);
	const formatTime = (sec) => {
		const m = Math.floor(sec / 60);
		const s = Math.max(0, sec % 60);
		return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
	};
	const lockColor = hud.lockState === "locked" ? "#22c55e" : hud.lockState === "acquiring" ? "#f59e0b" : "#38bdf8";
	const shortCamLabel = hud.cameraMode === "chase" ? "CHS" : hud.cameraMode === "action" ? "ACT" : "CKP";
	const markerMinX = touchEnabled ? shortViewport ? .24 : .22 : .08;
	const markerMaxX = touchEnabled ? shortViewport ? .76 : .78 : .92;
	const markerMinY = touchEnabled ? shortViewport ? .35 : .29 : .14;
	const markerMaxY = touchEnabled ? shortViewport ? .56 : .58 : .85;
	const telemetryLeftBlock = /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: `bg-[#090f1d]/82 border border-slate-700/60 rounded-lg ${shortViewport ? "p-1.5 space-y-0.5 w-[116px]" : "p-2 sm:p-3 space-y-1 sm:space-y-2 w-[114px] sm:w-[162px]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-[10px] font-hud text-slate-400",
					children: "SPD"
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 68,
					columnNumber: 9
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-sm sm:text-base font-hud font-bold text-sky-300",
					children: [
						hud.speedKnots,
						" ",
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "text-[9px] text-slate-400",
							children: "KTS"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 70,
							columnNumber: 28
						}, void 0)
					]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 69,
					columnNumber: 9
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 67,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-[10px] font-hud text-slate-400",
					children: "ALT"
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 74,
					columnNumber: 9
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-sm sm:text-base font-hud font-bold text-slate-100",
					children: [
						hud.altitudeMeters,
						" ",
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "text-[9px] text-slate-400",
							children: "M"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 76,
							columnNumber: 32
						}, void 0)
					]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 75,
					columnNumber: 9
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 73,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center justify-between text-[10px] font-hud mb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: hud.lowFuelWarning ? "text-rose-400 font-bold" : "text-slate-400",
					children: "FUEL"
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 81,
					columnNumber: 11
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-amber-300",
					children: [hud.fuel, "%"]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 84,
					columnNumber: 11
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 80,
				columnNumber: 9
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "h-1.5 bg-slate-800 rounded-full overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: `h-full ${hud.lowFuelWarning ? "bg-rose-500" : "bg-amber-400"}`,
					style: { width: `${Math.round(hud.fuel / hud.maxFuel * 100)}%` }
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 87,
					columnNumber: 11
				}, void 0)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 86,
				columnNumber: 9
			}, void 0)] }, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 79,
				columnNumber: 7
			}, void 0),
			hud.afterburner && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "text-[9px] font-hud font-bold text-orange-400 tracking-wider",
				children: "AFTERBURNER"
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 94,
				columnNumber: 9
			}, void 0)
		]
	}, void 0, true, {
		fileName: _jsxFileName$4,
		lineNumber: 62,
		columnNumber: 5
	}, void 0);
	const telemetryRightBlock = /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: `bg-[#090f1d]/82 border border-slate-700/60 rounded-lg ${shortViewport ? "p-1.5 space-y-0.5 w-[122px]" : "p-2 sm:p-3 space-y-1 sm:space-y-2 w-[118px] sm:w-[172px]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center justify-between text-[10px] font-hud mb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: hud.lowHealthWarning ? "text-rose-400 font-bold" : "text-slate-400",
					children: "HULL"
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 109,
					columnNumber: 11
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-emerald-300",
					children: [hud.health, "%"]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 112,
					columnNumber: 11
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 108,
				columnNumber: 9
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "h-1.5 bg-slate-800 rounded-full overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: `h-full ${hud.health > 50 ? "bg-emerald-400" : hud.health > 25 ? "bg-amber-400" : "bg-rose-500"}`,
					style: { width: `${Math.round(hud.health / hud.maxHealth * 100)}%` }
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 115,
					columnNumber: 11
				}, void 0)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 114,
				columnNumber: 9
			}, void 0)] }, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 107,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center justify-between text-[11px] font-hud",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-slate-400",
					children: "MSL"
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 125,
					columnNumber: 9
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-amber-300 font-bold",
					children: [
						hud.missiles,
						"/",
						hud.maxMissiles
					]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 126,
					columnNumber: 9
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 124,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center justify-between text-[10px] font-hud mb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-slate-400",
					children: "HEAT"
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 133,
					columnNumber: 11
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: hud.gunHeat > .8 ? "text-rose-400" : "text-sky-300",
					children: [Math.round(hud.gunHeat * 100), "%"]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 134,
					columnNumber: 11
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 132,
				columnNumber: 9
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "h-1 bg-slate-800 rounded-full overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: `h-full ${hud.gunHeat > .8 ? "bg-rose-500" : "bg-sky-400"}`,
					style: { width: `${Math.round(hud.gunHeat * 100)}%` }
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 139,
					columnNumber: 11
				}, void 0)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 138,
				columnNumber: 9
			}, void 0)] }, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 131,
				columnNumber: 7
			}, void 0)
		]
	}, void 0, true, {
		fileName: _jsxFileName$4,
		lineNumber: 102,
		columnNumber: 5
	}, void 0);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "fixed inset-0 z-10 pointer-events-none overflow-hidden",
		children: [
			(hud.damageFlash > .05 || hud.lowHealthWarning) && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "fixed inset-0 pointer-events-none",
				style: { boxShadow: `inset 0 0 110px rgba(239, 68, 68, ${Math.max(hud.damageFlash * .65, hud.lowHealthWarning ? .35 : 0)})` }
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 152,
				columnNumber: 9
			}, void 0),
			hud.afterburner && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
				viewBox: "0 0 100 100",
				preserveAspectRatio: "none",
				className: "fixed inset-0 w-full h-full pointer-events-none opacity-45",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("g", {
					stroke: "#bae6fd",
					strokeWidth: "0.18",
					strokeLinecap: "round",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "2",
							y1: "14",
							x2: "10",
							y2: "20"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 171,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "98",
							y1: "14",
							x2: "90",
							y2: "20"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 172,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "1",
							y1: "44",
							x2: "9",
							y2: "46"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 173,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "99",
							y1: "44",
							x2: "91",
							y2: "46"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 174,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "3",
							y1: "78",
							x2: "11",
							y2: "73"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 175,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "97",
							y1: "78",
							x2: "89",
							y2: "73"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 176,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "18",
							y1: "3",
							x2: "22",
							y2: "10"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 177,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
							x1: "82",
							y1: "3",
							x2: "78",
							y2: "10"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 178,
							columnNumber: 13
						}, void 0)
					]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 170,
					columnNumber: 11
				}, void 0)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 164,
				columnNumber: 9
			}, void 0),
			hud.targets.map((t) => {
				const sx = clamp(t.screenX, markerMinX, markerMaxX);
				const sy = clamp(t.screenY, markerMinY, markerMaxY);
				const hpPct = Math.max(0, Math.min(100, Math.round(t.healthRatio * 100)));
				const hpFill = hpPct > 55 ? "bg-emerald-400" : hpPct > 25 ? "bg-amber-400" : "bg-rose-500";
				if (!t.inFront) {
					const dx = t.dirX ?? 0;
					const dy = t.dirY ?? 1;
					const arrow = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "▶" : "◀" : dy < 0 ? "▲" : "▼";
					return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-0.5",
						style: {
							left: `${sx * 100}%`,
							top: `${sy * 100}%`
						},
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "w-14 h-1.5 bg-slate-950/90 border border-slate-500/70 rounded-sm overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: `h-full ${hpFill}`,
								style: { width: `${hpPct}%` }
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 209,
								columnNumber: 17
							}, void 0)
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 208,
							columnNumber: 15
						}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: `px-1.5 py-0.5 text-[10px] font-hud rounded whitespace-nowrap border ${t.isLockedTarget ? "text-emerald-200 bg-emerald-950/90 border-emerald-400/80" : "text-rose-200 bg-rose-950/85 border-rose-500/70"}`,
							children: [
								arrow,
								" ",
								t.callsign,
								" ",
								t.distance,
								"m"
							]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 211,
							columnNumber: 15
						}, void 0)]
					}, t.id, true, {
						fileName: _jsxFileName$4,
						lineNumber: 203,
						columnNumber: 13
					}, void 0);
				}
				const boxBorder = t.isLockedTarget ? hud.lockState === "locked" ? "border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]" : "border-amber-400" : "border-rose-400/85";
				return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center",
					style: {
						left: `${sx * 100}%`,
						top: `${sy * 100}%`
					},
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "mb-1 flex flex-col items-center gap-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "px-1.5 py-0.5 rounded bg-[#070b14]/85 border border-slate-700/70 whitespace-nowrap text-[10px] font-hud text-white leading-none",
							children: [
								t.callsign,
								" · ",
								t.distance,
								"m"
							]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 238,
							columnNumber: 15
						}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "w-14 sm:w-16 h-2 bg-slate-950/95 border border-slate-400/75 rounded-sm overflow-hidden",
							children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: `h-full transition-all duration-100 ${hpFill}`,
								style: { width: `${hpPct}%` }
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 242,
								columnNumber: 17
							}, void 0)
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 241,
							columnNumber: 15
						}, void 0)]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 237,
						columnNumber: 13
					}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: `w-9 h-9 sm:w-11 sm:h-11 border-2 ${boxBorder} relative`,
						children: t.isLockedTarget && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-hud font-bold tracking-wider hud-stroke",
							style: { color: lockColor },
							children: hud.lockState === "locked" ? "TARGET LOCKED" : "TRACKING"
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 248,
							columnNumber: 17
						}, void 0)
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 246,
						columnNumber: 13
					}, void 0)]
				}, t.id, true, {
					fileName: _jsxFileName$4,
					lineNumber: 231,
					columnNumber: 11
				}, void 0);
			}),
			hud.leadTarget && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center",
				style: {
					left: `${clamp(hud.leadTarget.screenX, markerMinX, markerMaxX) * 100}%`,
					top: `${clamp(hud.leadTarget.screenY, markerMinY, markerMaxY) * 100}%`
				},
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "w-6 h-6 rounded-full border-2 border-cyan-300/90 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-1.5 h-1.5 rounded-full bg-cyan-300" }, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 267,
						columnNumber: 13
					}, void 0)
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 266,
					columnNumber: 11
				}, void 0)
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 259,
				columnNumber: 9
			}, void 0),
			hud.nextCheckpoint && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center",
				style: {
					left: `${clamp(hud.nextCheckpoint.screenX, markerMinX, markerMaxX) * 100}%`,
					top: `${clamp(hud.nextCheckpoint.screenY, markerMinY, markerMaxY) * 100}%`
				},
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "w-6 h-6 sm:w-7 sm:h-7 rotate-45 border-2 border-sky-400 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "w-2 h-2 bg-amber-300" }, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 282,
						columnNumber: 13
					}, void 0)
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 281,
					columnNumber: 11
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "mt-1 text-[10px] font-hud text-sky-200 hud-stroke whitespace-nowrap",
					children: [
						"RING ",
						hud.nextCheckpoint.order,
						" · ",
						hud.nextCheckpoint.distance,
						"m"
					]
				}, void 0, true, {
					fileName: _jsxFileName$4,
					lineNumber: 284,
					columnNumber: 11
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 274,
				columnNumber: 9
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center",
				children: [
					hud.combatFeedback && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						"data-testid": "combat-feedback",
						className: `absolute -top-13 px-2.5 py-0.5 rounded border text-[11px] sm:text-xs font-hud font-bold tracking-wider whitespace-nowrap shadow-md ${hud.combatFeedback.kind === "kill" ? "bg-emerald-600/95 border-emerald-300 text-white" : hud.combatFeedback.kind === "crit" ? "bg-amber-500/95 border-amber-200 text-slate-950" : "bg-sky-600/90 border-sky-300 text-white"}`,
						children: hud.combatFeedback.text
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 293,
						columnNumber: 11
					}, void 0),
					hud.lockState !== "none" && hud.lockedTargetCallsign && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "absolute -top-6 text-[10px] sm:text-xs font-hud font-bold tracking-wider whitespace-nowrap hud-stroke",
						style: { color: lockColor },
						children: hud.lockState === "locked" ? `TARGET LOCKED · ${hud.lockedTargetCallsign} (${hud.lockedTargetDist ?? 0}m)` : `LOCKING · ${hud.lockedTargetCallsign} ${Math.round(hud.lockProgress * 100)}%`
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 308,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
						viewBox: "0 0 180 180",
						className: `${shortViewport ? "w-28 h-28" : "w-32 h-32 sm:w-44 sm:h-44"} overflow-visible`,
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("g", {
								transform: `rotate(${-hud.bankDeg} 90 90) translate(0 ${Math.max(-34, Math.min(34, hud.pitchDeg * .9))})`,
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
										x1: "26",
										y1: "90",
										x2: "64",
										y2: "90",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 329,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
										x1: "116",
										y1: "90",
										x2: "154",
										y2: "90",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 330,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
										x1: "64",
										y1: "90",
										x2: "64",
										y2: "96",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 331,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
										x1: "116",
										y1: "90",
										x2: "116",
										y2: "96",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 332,
										columnNumber: 13
									}, void 0)
								]
							}, void 0, true, {
								fileName: _jsxFileName$4,
								lineNumber: 323,
								columnNumber: 11
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: "90",
								cy: "90",
								r: "46",
								fill: "none",
								stroke: "rgba(255,255,255,0.12)",
								strokeWidth: "2"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 336,
								columnNumber: 11
							}, void 0),
							hud.lockProgress > 0 && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: "90",
								cy: "90",
								r: "46",
								fill: "none",
								stroke: lockColor,
								strokeWidth: "3",
								strokeDasharray: 2 * Math.PI * 46,
								strokeDashoffset: 2 * Math.PI * 46 * (1 - hud.lockProgress),
								transform: "rotate(-90 90 90)"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 345,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: "90",
								cy: "90",
								r: "3",
								fill: lockColor
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 359,
								columnNumber: 11
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
								d: "M78,90 L85,90 M95,90 L102,90 M90,78 L90,85 M90,95 L90,102",
								stroke: "#f8fafc",
								strokeWidth: "1.75"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 360,
								columnNumber: 11
							}, void 0),
							hud.hitMarker && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
								d: "M75,75 L83,83 M105,75 L97,83 M75,105 L83,97 M105,105 L97,97",
								stroke: "#fbbf24",
								strokeWidth: "2.5",
								strokeLinecap: "round"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 366,
								columnNumber: 13
							}, void 0)
						]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 318,
						columnNumber: 9
					}, void 0)
				]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 291,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "relative flex flex-col p-2 sm:p-3.5 gap-1.5 pointer-events-none",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-start justify-between gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: `bg-[#090f1d]/85 border border-slate-700/60 rounded-lg ${shortViewport ? "px-2 py-1 min-w-[116px]" : "px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[114px] sm:min-w-[138px]"}`,
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center justify-between gap-2 text-[10px] font-hud uppercase tracking-wider text-slate-400",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: ["Kills ", hud.kills] }, void 0, true, {
										fileName: _jsxFileName$4,
										lineNumber: 389,
										columnNumber: 15
									}, void 0), hud.combo > 1 && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "text-amber-300 font-bold",
										children: ["x", hud.combo]
									}, void 0, true, {
										fileName: _jsxFileName$4,
										lineNumber: 390,
										columnNumber: 33
									}, void 0)]
								}, void 0, true, {
									fileName: _jsxFileName$4,
									lineNumber: 388,
									columnNumber: 13
								}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: `${shortViewport ? "text-base" : "text-lg sm:text-2xl"} font-display font-bold text-amber-400 leading-tight font-hud`,
									"data-testid": "hud-score",
									children: hud.score.toLocaleString()
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 392,
									columnNumber: 13
								}, void 0)]
							}, void 0, true, {
								fileName: _jsxFileName$4,
								lineNumber: 381,
								columnNumber: 11
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "hidden sm:flex flex-col items-center max-w-md text-center min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "bg-[#090f1d]/85 border border-slate-700/60 rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 text-xs font-hud whitespace-nowrap",
										children: [
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: "text-sky-300 font-bold",
												children: [
													"HDG ",
													String(hud.headingDeg).padStart(3, "0"),
													"°"
												]
											}, void 0, true, {
												fileName: _jsxFileName$4,
												lineNumber: 405,
												columnNumber: 15
											}, void 0),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: "text-slate-600",
												"aria-hidden": "true",
												children: "|"
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 406,
												columnNumber: 15
											}, void 0),
											/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: "text-slate-100 truncate max-w-[180px]",
												children: hud.missionTitle
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 407,
												columnNumber: 15
											}, void 0),
											hud.timeRemainingSec !== null && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: "text-slate-600",
												"aria-hidden": "true",
												children: "|"
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 410,
												columnNumber: 19
											}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
												className: hud.timeRemainingSec <= 30 ? "text-rose-400 font-bold" : "text-amber-300",
												children: formatTime(hud.timeRemainingSec)
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 411,
												columnNumber: 19
											}, void 0)] }, void 0, true, {
												fileName: _jsxFileName$4,
												lineNumber: 409,
												columnNumber: 17
											}, void 0)
										]
									}, void 0, true, {
										fileName: _jsxFileName$4,
										lineNumber: 404,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "mt-1 text-xs font-medium text-slate-200 hud-stroke truncate max-w-[360px]",
										children: hud.objectiveText
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 421,
										columnNumber: 13
									}, void 0),
									(hud.incomingWarning || hud.bannerMessage) && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
										className: "mt-1.5 flex flex-col items-center gap-1",
										children: [hud.incomingWarning && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
											className: "px-3 py-0.5 bg-rose-600/90 text-white text-[11px] font-hud font-bold tracking-wider rounded border border-rose-300/60 whitespace-nowrap",
											children: [
												"INCOMING MISSILE (",
												hud.incomingDistance,
												"m) — EVADE!"
											]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 427,
											columnNumber: 19
										}, void 0), hud.bannerMessage && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
											className: "px-3 py-0.5 bg-[#090f1d]/90 text-amber-300 text-[11px] font-hud font-semibold tracking-wider rounded border border-amber-500/40 whitespace-nowrap truncate max-w-[360px]",
											children: hud.bannerMessage
										}, void 0, false, {
											fileName: _jsxFileName$4,
											lineNumber: 432,
											columnNumber: 19
										}, void 0)]
									}, void 0, true, {
										fileName: _jsxFileName$4,
										lineNumber: 425,
										columnNumber: 15
									}, void 0)
								]
							}, void 0, true, {
								fileName: _jsxFileName$4,
								lineNumber: 403,
								columnNumber: 11
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										tabIndex: -1,
										"aria-pressed": hud.autoTargetEnabled,
										onClick: (e) => {
											e.currentTarget.blur();
											onToggleAutoTarget();
										},
										"aria-label": "Toggle Auto Target",
										title: "Toggle Auto Target (T)",
										className: `h-8 sm:h-9 px-2 sm:px-2.5 text-[11px] sm:text-xs font-hud font-medium border rounded-lg cursor-pointer whitespace-nowrap flex items-center ${hud.autoTargetEnabled ? "bg-[#062820]/90 border-emerald-400 text-emerald-200" : "bg-[#090f1d]/85 hover:bg-slate-800 text-slate-300 border-slate-700/70"}`,
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "sm:hidden",
											children: ["A:", hud.autoTargetEnabled ? "ON" : "OFF"]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 458,
											columnNumber: 15
										}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "hidden sm:inline",
											children: ["Auto: ", hud.autoTargetEnabled ? "ON" : "OFF"]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 459,
											columnNumber: 15
										}, void 0)]
									}, void 0, true, {
										fileName: _jsxFileName$4,
										lineNumber: 442,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										tabIndex: -1,
										onClick: (e) => {
											e.currentTarget.blur();
											onCycleCamera();
										},
										"aria-label": "Switch Camera View",
										title: "Switch Camera (C)",
										className: "h-8 sm:h-9 px-2 sm:px-2.5 text-[11px] sm:text-xs font-hud font-medium bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-lg cursor-pointer whitespace-nowrap flex items-center",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "sm:hidden",
											children: ["C:", shortCamLabel]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 473,
											columnNumber: 15
										}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "hidden sm:inline",
											children: ["Cam: ", hud.cameraMode.toUpperCase()]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 474,
											columnNumber: 15
										}, void 0)]
									}, void 0, true, {
										fileName: _jsxFileName$4,
										lineNumber: 462,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										tabIndex: -1,
										onClick: (e) => {
											e.currentTarget.blur();
											onToggleTouch();
										},
										"aria-label": "Toggle Touch Controls",
										title: "Toggle On-Screen Touch Controls",
										className: `h-8 sm:h-9 px-2 sm:px-2.5 text-[11px] sm:text-xs font-hud font-medium border rounded-lg cursor-pointer whitespace-nowrap flex items-center ${touchEnabled ? "bg-sky-500/25 border-sky-400 text-sky-200" : "bg-[#090f1d]/85 hover:bg-slate-800 text-slate-300 border-slate-700/70"}`,
										children: "Pad"
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 477,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										tabIndex: -1,
										onClick: (e) => {
											e.currentTarget.blur();
											onToggleMute();
										},
										"aria-label": muted ? "Unmute Audio" : "Mute Audio",
										title: "Mute (M)",
										className: "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-lg cursor-pointer",
										children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
											viewBox: "0 0 24 24",
											className: "w-4 h-4",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "2",
											children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", { d: "M11 5L6 9H2v6h4l5 4V5z" }, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 507,
												columnNumber: 17
											}, void 0), muted ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
												d: "M22 9l-6 6M16 9l6 6",
												stroke: "#f87171"
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 509,
												columnNumber: 19
											}, void 0) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", { d: "M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" }, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 511,
												columnNumber: 19
											}, void 0)]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 506,
											columnNumber: 15
										}, void 0)
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 495,
										columnNumber: 13
									}, void 0),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										tabIndex: -1,
										onClick: (e) => {
											e.currentTarget.blur();
											onPause();
										},
										"aria-label": "Pause Game",
										title: "Pause (P)",
										className: "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-lg cursor-pointer",
										children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
											viewBox: "0 0 24 24",
											className: "w-4 h-4",
											fill: "currentColor",
											children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", {
												x: "6",
												y: "5",
												width: "4",
												height: "14",
												rx: "1"
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 528,
												columnNumber: 17
											}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", {
												x: "14",
												y: "5",
												width: "4",
												height: "14",
												rx: "1"
											}, void 0, false, {
												fileName: _jsxFileName$4,
												lineNumber: 529,
												columnNumber: 17
											}, void 0)]
										}, void 0, true, {
											fileName: _jsxFileName$4,
											lineNumber: 527,
											columnNumber: 15
										}, void 0)
									}, void 0, false, {
										fileName: _jsxFileName$4,
										lineNumber: 516,
										columnNumber: 13
									}, void 0)
								]
							}, void 0, true, {
								fileName: _jsxFileName$4,
								lineNumber: 441,
								columnNumber: 11
							}, void 0)
						]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 379,
						columnNumber: 9
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "sm:hidden flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "bg-[#090f1d]/85 border border-slate-700/60 rounded-md px-2.5 py-1 flex items-center gap-2 text-[10px] font-hud max-w-full",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-sky-300 font-bold shrink-0",
									children: [String(hud.headingDeg).padStart(3, "0"), "°"]
								}, void 0, true, {
									fileName: _jsxFileName$4,
									lineNumber: 538,
									columnNumber: 13
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-slate-600 shrink-0",
									"aria-hidden": "true",
									children: "|"
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 541,
									columnNumber: 13
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-slate-100 truncate",
									children: hud.objectiveText
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 542,
									columnNumber: 13
								}, void 0),
								hud.timeRemainingSec !== null && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: "text-slate-600 shrink-0",
									"aria-hidden": "true",
									children: "|"
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 545,
									columnNumber: 17
								}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
									className: `shrink-0 ${hud.timeRemainingSec <= 30 ? "text-rose-400 font-bold" : "text-amber-300"}`,
									children: formatTime(hud.timeRemainingSec)
								}, void 0, false, {
									fileName: _jsxFileName$4,
									lineNumber: 546,
									columnNumber: 17
								}, void 0)] }, void 0, true, {
									fileName: _jsxFileName$4,
									lineNumber: 544,
									columnNumber: 15
								}, void 0)
							]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 537,
							columnNumber: 11
						}, void 0)
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 536,
						columnNumber: 9
					}, void 0),
					(hud.incomingWarning || hud.bannerMessage) && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "sm:hidden flex flex-col items-center gap-1 pointer-events-none",
						children: [hud.incomingWarning && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "px-2.5 py-0.5 bg-rose-600/90 text-white text-[10px] font-hud font-bold tracking-wider rounded border border-rose-300/60 whitespace-nowrap",
							children: [
								"INCOMING MISSILE (",
								hud.incomingDistance,
								"m) — EVADE!"
							]
						}, void 0, true, {
							fileName: _jsxFileName$4,
							lineNumber: 562,
							columnNumber: 15
						}, void 0), hud.bannerMessage && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "px-2.5 py-0.5 bg-[#090f1d]/90 text-amber-300 text-[10px] font-hud font-semibold tracking-wider rounded border border-amber-500/40 whitespace-nowrap truncate max-w-[90vw]",
							children: hud.bannerMessage
						}, void 0, false, {
							fileName: _jsxFileName$4,
							lineNumber: 567,
							columnNumber: 15
						}, void 0)]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 560,
						columnNumber: 11
					}, void 0),
					touchEnabled && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-start justify-between gap-2",
						children: [telemetryLeftBlock, telemetryRightBlock]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 576,
						columnNumber: 11
					}, void 0)
				]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 377,
				columnNumber: 7
			}, void 0),
			hud.cameraMode === "cockpit" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
				viewBox: "0 0 1440 900",
				preserveAspectRatio: "none",
				className: "fixed inset-0 w-full h-full pointer-events-none",
				"aria-hidden": "true",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
						d: "M0,210 Q180,60 720,42 Q1260,60 1440,210 L1440,0 L0,0 Z",
						fill: "rgba(9,13,22,0.55)"
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 591,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
						d: "M0,210 Q180,60 720,42 Q1260,60 1440,210",
						fill: "none",
						stroke: "#1e293b",
						strokeWidth: "12"
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 595,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("path", {
						d: "M0,900 L0,760 L430,835 L1010,835 L1440,760 L1440,900 Z",
						fill: "rgba(9,13,22,0.82)",
						stroke: "#334155",
						strokeWidth: "4"
					}, void 0, false, {
						fileName: _jsxFileName$4,
						lineNumber: 601,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("g", {
						opacity: "0.9",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", {
								x: "468",
								y: "846",
								width: "120",
								height: "44",
								rx: "4",
								fill: "#07111e",
								stroke: "#38bdf8",
								strokeWidth: "1.5"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 609,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: "528",
								cy: "868",
								r: "15",
								fill: "none",
								stroke: "#38bdf8",
								strokeWidth: "1.5"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 610,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
								x1: "513",
								y1: "868",
								x2: "543",
								y2: "868",
								stroke: "#22c55e",
								strokeWidth: "2"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 611,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", {
								x: "615",
								y: "844",
								width: "210",
								height: "48",
								rx: "4",
								fill: "#07111e",
								stroke: "#f59e0b",
								strokeWidth: "1.5"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 612,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", {
								x: "630",
								y: "858",
								width: "84",
								height: "7",
								rx: "2",
								fill: "#22c55e"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 613,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", {
								x: "630",
								y: "872",
								width: "128",
								height: "7",
								rx: "2",
								fill: "#38bdf8"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 614,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: "792",
								cy: "868",
								r: "14",
								fill: "none",
								stroke: "#f59e0b",
								strokeWidth: "1.5"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 615,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
								x1: "792",
								y1: "868",
								x2: "801",
								y2: "859",
								stroke: "#fbbf24",
								strokeWidth: "2"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 616,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("rect", {
								x: "852",
								y: "846",
								width: "120",
								height: "44",
								rx: "4",
								fill: "#07111e",
								stroke: "#22c55e",
								strokeWidth: "1.5"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 617,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("polyline", {
								points: "866,878 886,864 906,872 930,856 958,864",
								fill: "none",
								stroke: "#22c55e",
								strokeWidth: "2"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 618,
								columnNumber: 13
							}, void 0)
						]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 608,
						columnNumber: 11
					}, void 0)
				]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 585,
				columnNumber: 9
			}, void 0),
			!touchEnabled && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "fixed left-4 bottom-5",
				children: telemetryLeftBlock
			}, void 0, false, {
				fileName: _jsxFileName$4,
				lineNumber: 626,
				columnNumber: 11
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "fixed right-4 bottom-5 flex flex-col items-end gap-2",
				children: [telemetryRightBlock, !shortViewport && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "hidden sm:flex items-center justify-center bg-[#090f1d]/85 border border-slate-700/70 rounded-full w-28 h-28 p-1",
					children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
						viewBox: "-1 -1 2 2",
						className: "w-full h-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: "0",
								cy: "0",
								r: "0.96",
								fill: "rgba(15,23,42,0.75)",
								stroke: "rgba(56,189,248,0.35)",
								strokeWidth: "0.03"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 633,
								columnNumber: 19
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: "0",
								cy: "0",
								r: "0.5",
								fill: "none",
								stroke: "rgba(56,189,248,0.2)",
								strokeWidth: "0.02"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 634,
								columnNumber: 19
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
								x1: "-0.95",
								y1: "0",
								x2: "0.95",
								y2: "0",
								stroke: "rgba(56,189,248,0.18)",
								strokeWidth: "0.02"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 635,
								columnNumber: 19
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("line", {
								x1: "0",
								y1: "-0.95",
								x2: "0",
								y2: "0.95",
								stroke: "rgba(56,189,248,0.18)",
								strokeWidth: "0.02"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 636,
								columnNumber: 19
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("polygon", {
								points: "0,-0.12 0.08,0.09 -0.08,0.09",
								fill: "#f8fafc"
							}, void 0, false, {
								fileName: _jsxFileName$4,
								lineNumber: 637,
								columnNumber: 19
							}, void 0),
							hud.radarBlips.map((b) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("circle", {
								cx: b.dx,
								cy: b.dz,
								r: b.isLocked ? .085 : .06,
								fill: b.kind === "enemy" ? b.isLocked ? "#facc15" : "#ef4444" : b.kind === "checkpoint" ? "#38bdf8" : "#22c55e"
							}, b.id, false, {
								fileName: _jsxFileName$4,
								lineNumber: 639,
								columnNumber: 21
							}, void 0))
						]
					}, void 0, true, {
						fileName: _jsxFileName$4,
						lineNumber: 632,
						columnNumber: 17
					}, void 0)
				}, void 0, false, {
					fileName: _jsxFileName$4,
					lineNumber: 631,
					columnNumber: 15
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 628,
				columnNumber: 11
			}, void 0)] }, void 0, true, {
				fileName: _jsxFileName$4,
				lineNumber: 625,
				columnNumber: 9
			}, void 0)
		]
	}, void 0, true, {
		fileName: _jsxFileName$4,
		lineNumber: 149,
		columnNumber: 5
	}, void 0);
};
// src/components/TitleScreen.tsx
var _jsxFileName$3 = "/app/applet/src/components/TitleScreen.tsx";
var MODE_ITEMS = [
	{
		id: "missions",
		label: "Combat Missions",
		desc: "Tactical waves, recon checkpoints & time targets"
	},
	{
		id: "survival",
		label: "Survival Mode",
		desc: "Endless escalating enemy squadrons"
	},
	{
		id: "freeflight",
		label: "Free Flight",
		desc: "Unrestricted sunset patrol over islands & city"
	}
];
var DIFFICULTY_ITEMS = [
	"beginner",
	"standard",
	"ace"
];
var LIVERY_ITEMS = [
	{
		id: "obsidian",
		label: "Stealth Obsidian",
		swatch: "#2a313d"
	},
	{
		id: "viper",
		label: "Sunset Viper",
		swatch: "#d97706"
	},
	{
		id: "arctic",
		label: "Arctic Ghost",
		swatch: "#cbd5e1"
	}
];
var TitleScreen = ({ mode, difficulty, missionIndex, livery, bestScore, muted, onSelectMode, onSelectDifficulty, onSelectMission, onSelectLivery, onToggleMute, onStart }) => {
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.code === "Enter" || e.code === "Space") {
				e.preventDefault();
				onStart();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onStart]);
	const activeMission = MISSIONS[missionIndex] ?? MISSIONS[0];
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 pointer-events-none overflow-y-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "fixed inset-y-0 left-0 w-full md:w-[54%] pointer-events-none",
				style: { background: "linear-gradient(90deg, rgba(8,12,21,0.88) 0%, rgba(8,12,21,0.68) 68%, rgba(8,12,21,0) 100%)" }
			}, void 0, false, {
				fileName: _jsxFileName$3,
				lineNumber: 64,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "relative z-10 flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center gap-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("svg", {
						viewBox: "0 0 64 64",
						className: "w-11 h-11 sm:w-13 sm:h-13 shrink-0",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("polygon", {
								points: "32,4 58,20 52,50 32,60 12,50 6,20",
								fill: "#111827",
								stroke: "#f59e0b",
								strokeWidth: "2.5"
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 80,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("polygon", {
								points: "32,12 46,38 32,31 18,38",
								fill: "#f59e0b"
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 86,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("polygon", {
								points: "32,26 52,44 32,39 12,44",
								fill: "#e2e8f0"
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 87,
								columnNumber: 13
							}, void 0)
						]
					}, void 0, true, {
						fileName: _jsxFileName$3,
						lineNumber: 75,
						columnNumber: 11
					}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
						className: "font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white leading-none hud-stroke",
						children: "SKY WARRIOR"
					}, void 0, false, {
						fileName: _jsxFileName$3,
						lineNumber: 90,
						columnNumber: 13
					}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-center gap-2.5 mt-1 text-xs sm:text-sm font-hud tracking-[0.22em] text-amber-400",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "DOMINION" }, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 94,
								columnNumber: 15
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								"aria-hidden": "true",
								className: "text-slate-500",
								children: "·"
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 95,
								columnNumber: 15
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "text-slate-300 tracking-normal font-sans",
								children: ["Best Score ", bestScore.toLocaleString()]
							}, void 0, true, {
								fileName: _jsxFileName$3,
								lineNumber: 96,
								columnNumber: 15
							}, void 0)
						]
					}, void 0, true, {
						fileName: _jsxFileName$3,
						lineNumber: 93,
						columnNumber: 13
					}, void 0)] }, void 0, true, {
						fileName: _jsxFileName$3,
						lineNumber: 89,
						columnNumber: 11
					}, void 0)]
				}, void 0, true, {
					fileName: _jsxFileName$3,
					lineNumber: 74,
					columnNumber: 9
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					type: "button",
					onClick: onToggleMute,
					"aria-label": muted ? "Unmute audio" : "Mute audio",
					className: "pointer-events-auto px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0d1422]/90 border border-slate-700/80 rounded-lg hover:border-amber-500/70 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer",
					children: muted ? "Audio: Off" : "Audio: On"
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 103,
					columnNumber: 9
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$3,
				lineNumber: 73,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "relative z-10 w-full max-w-md my-auto py-3 pointer-events-auto",
				children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "bg-[#0b111e]/92 border border-slate-700/70 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-slate-400 mb-1.5",
								children: "Flight Mode"
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 118,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "grid grid-cols-3 gap-1.5 bg-[#070b14] p-1 rounded-lg border border-slate-800",
								children: MODE_ITEMS.map((item) => {
									const active = mode === item.id;
									return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										onClick: () => onSelectMode(item.id),
										className: `px-1 sm:px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${active ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800/60"}`,
										children: item.label.replace(" Mode", "")
									}, item.id, false, {
										fileName: _jsxFileName$3,
										lineNumber: 123,
										columnNumber: 19
									}, void 0);
								})
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 119,
								columnNumber: 13
							}, void 0),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "text-xs text-slate-300 mt-1.5 leading-relaxed",
								children: MODE_ITEMS.find((m) => m.id === mode)?.desc
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 138,
								columnNumber: 13
							}, void 0)
						] }, void 0, true, {
							fileName: _jsxFileName$3,
							lineNumber: 117,
							columnNumber: 11
						}, void 0),
						mode !== "freeflight" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "pt-2 border-t border-slate-800/90",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "text-xs font-medium text-slate-400 mb-1.5",
									children: "Combat Difficulty"
								}, void 0, false, {
									fileName: _jsxFileName$3,
									lineNumber: 146,
									columnNumber: 15
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "grid grid-cols-3 gap-1.5 bg-[#070b14] p-1 rounded-lg border border-slate-800",
									children: DIFFICULTY_ITEMS.map((d) => {
										return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
											type: "button",
											onClick: () => onSelectDifficulty(d),
											className: `px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${difficulty === d ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800/60"}`,
											children: DIFFICULTY_CONFIG[d].label
										}, d, false, {
											fileName: _jsxFileName$3,
											lineNumber: 151,
											columnNumber: 21
										}, void 0);
									})
								}, void 0, false, {
									fileName: _jsxFileName$3,
									lineNumber: 147,
									columnNumber: 15
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
									className: "text-[11px] text-slate-400 mt-1.5 leading-snug",
									children: DIFFICULTY_CONFIG[difficulty].desc
								}, void 0, false, {
									fileName: _jsxFileName$3,
									lineNumber: 166,
									columnNumber: 15
								}, void 0)
							]
						}, void 0, true, {
							fileName: _jsxFileName$3,
							lineNumber: 145,
							columnNumber: 13
						}, void 0),
						mode === "missions" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "pt-2 border-t border-slate-800/90",
							children: [
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "text-xs font-medium text-slate-400 mb-1.5",
									children: "Operation"
								}, void 0, false, {
									fileName: _jsxFileName$3,
									lineNumber: 175,
									columnNumber: 15
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "grid grid-cols-3 gap-1.5 mb-2",
									children: MISSIONS.map((m, idx) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										onClick: () => onSelectMission(idx),
										className: `px-2 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${missionIndex === idx ? "bg-sky-500/20 border-sky-400 text-sky-200" : "bg-[#080d18] border-slate-800 text-slate-400 hover:text-slate-200"}`,
										children: ["Sortie 0", idx + 1]
									}, m.id, true, {
										fileName: _jsxFileName$3,
										lineNumber: 178,
										columnNumber: 19
									}, void 0))
								}, void 0, false, {
									fileName: _jsxFileName$3,
									lineNumber: 176,
									columnNumber: 15
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "text-sm font-semibold text-white",
									children: activeMission.title
								}, void 0, false, {
									fileName: _jsxFileName$3,
									lineNumber: 192,
									columnNumber: 15
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
									className: "text-xs text-slate-300 mt-1 leading-relaxed",
									children: activeMission.briefing
								}, void 0, false, {
									fileName: _jsxFileName$3,
									lineNumber: 193,
									columnNumber: 15
								}, void 0),
								/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-3 mt-1.5 text-xs font-hud text-slate-400",
									children: [
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [activeMission.waves, " Waves"] }, void 0, true, {
											fileName: _jsxFileName$3,
											lineNumber: 197,
											columnNumber: 17
										}, void 0),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											"aria-hidden": "true",
											children: "·"
										}, void 0, false, {
											fileName: _jsxFileName$3,
											lineNumber: 198,
											columnNumber: 17
										}, void 0),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [activeMission.checkpointCount, " Bonus Rings"] }, void 0, true, {
											fileName: _jsxFileName$3,
											lineNumber: 199,
											columnNumber: 17
										}, void 0),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											"aria-hidden": "true",
											children: "·"
										}, void 0, false, {
											fileName: _jsxFileName$3,
											lineNumber: 200,
											columnNumber: 17
										}, void 0),
										/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: [
											Math.floor(activeMission.timeLimitSec * DIFFICULTY_CONFIG[difficulty].timeMult / 60),
											"m",
											" ",
											Math.round(activeMission.timeLimitSec * DIFFICULTY_CONFIG[difficulty].timeMult % 60),
											"s"
										] }, void 0, true, {
											fileName: _jsxFileName$3,
											lineNumber: 201,
											columnNumber: 17
										}, void 0)
									]
								}, void 0, true, {
									fileName: _jsxFileName$3,
									lineNumber: 196,
									columnNumber: 15
								}, void 0)
							]
						}, void 0, true, {
							fileName: _jsxFileName$3,
							lineNumber: 174,
							columnNumber: 13
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "pt-2 border-t border-slate-800/90",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "text-xs font-medium text-slate-400 mb-1.5",
								children: "F-22X Livery"
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 211,
								columnNumber: 13
							}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "grid grid-cols-3 gap-1.5",
								children: LIVERY_ITEMS.map((item) => {
									const active = livery === item.id;
									return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
										type: "button",
										onClick: () => onSelectLivery(item.id),
										className: `flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${active ? "bg-slate-800 border-amber-400 text-white" : "bg-[#080d18] border-slate-800 text-slate-400 hover:text-slate-200"}`,
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "w-2.5 h-2.5 rounded-full shrink-0 border border-white/25",
											style: { backgroundColor: item.swatch }
										}, void 0, false, {
											fileName: _jsxFileName$3,
											lineNumber: 226,
											columnNumber: 21
										}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
											className: "truncate",
											children: item.label.split(" ")[1]
										}, void 0, false, {
											fileName: _jsxFileName$3,
											lineNumber: 230,
											columnNumber: 21
										}, void 0)]
									}, item.id, true, {
										fileName: _jsxFileName$3,
										lineNumber: 216,
										columnNumber: 19
									}, void 0);
								})
							}, void 0, false, {
								fileName: _jsxFileName$3,
								lineNumber: 212,
								columnNumber: 13
							}, void 0)]
						}, void 0, true, {
							fileName: _jsxFileName$3,
							lineNumber: 210,
							columnNumber: 11
						}, void 0),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							"data-start": "true",
							onClick: onStart,
							className: "w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-display font-bold text-base tracking-wider uppercase rounded-lg transition-colors cursor-pointer shadow-lg",
							children: "Launch Sortie"
						}, void 0, false, {
							fileName: _jsxFileName$3,
							lineNumber: 238,
							columnNumber: 11
						}, void 0)
					]
				}, void 0, true, {
					fileName: _jsxFileName$3,
					lineNumber: 115,
					columnNumber: 9
				}, void 0)
			}, void 0, false, {
				fileName: _jsxFileName$3,
				lineNumber: 114,
				columnNumber: 7
			}, void 0),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300/90 hud-stroke",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "font-hud",
					children: "W/S Pitch · A/D Roll · Q/E Yaw · Space/LMB Cannon · F/RMB Missile · Wheel Throttle · T Auto-Target · Shift Boost · X Evade · C View"
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 251,
					columnNumber: 9
				}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "hidden sm:inline text-slate-400",
					children: "Press Enter or Space to Launch"
				}, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 254,
					columnNumber: 9
				}, void 0)]
			}, void 0, true, {
				fileName: _jsxFileName$3,
				lineNumber: 250,
				columnNumber: 7
			}, void 0)
		]
	}, void 0, true, {
		fileName: _jsxFileName$3,
		lineNumber: 62,
		columnNumber: 5
	}, void 0);
};
// src/components/TouchControls.tsx
var _jsxFileName$2 = "/app/applet/src/components/TouchControls.tsx";
function shapeAxis(raw, deadzone = .08) {
	const abs = Math.abs(raw);
	if (abs <= deadzone) return 0;
	const norm = (abs - deadzone) / (1 - deadzone);
	return Math.sign(raw) * Math.pow(norm, 1.2);
}
var TouchControls = ({ missiles, maneuverReady, lockState, autoTargetEnabled, onToggleAutoTarget, onJoystickMove, onButtonChange }) => {
	const padRef = (0, import_react.useRef)(null);
	const pointerIdRef = (0, import_react.useRef)(null);
	const [knobOffset, setKnobOffset] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const [pressedBtns, setPressedBtns] = (0, import_react.useState)({
		boost: false,
		maneuver: false,
		fireMissile: false,
		fireGun: false
	});
	const maxRadius = 38;
	const updateStick = (clientX, clientY) => {
		const el = padRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		let dx = clientX - cx;
		let dy = clientY - cy;
		const dist = Math.hypot(dx, dy);
		if (dist > maxRadius) {
			dx = dx / dist * maxRadius;
			dy = dy / dist * maxRadius;
		}
		setKnobOffset({
			x: dx,
			y: dy
		});
		onJoystickMove(shapeAxis(dx / maxRadius), shapeAxis(-dy / maxRadius));
	};
	const resetStick = () => {
		pointerIdRef.current = null;
		setKnobOffset({
			x: 0,
			y: 0
		});
		onJoystickMove(0, 0);
	};
	const handleBtn = (btn, pressed) => {
		setPressedBtns((prev) => prev[btn] === pressed ? prev : {
			...prev,
			[btn]: pressed
		});
		onButtonChange(btn, pressed);
	};
	const bindTouchBtn = (btn, disabled = false) => ({
		onPointerDown: (e) => {
			if (disabled) return;
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			handleBtn(btn, true);
		},
		onPointerUp: (e) => {
			if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
			handleBtn(btn, false);
		},
		onPointerCancel: () => handleBtn(btn, false)
	});
	const missileBorder = lockState === "locked" ? "border-emerald-300 ring-2 ring-emerald-400/60 bg-emerald-600/85" : lockState === "acquiring" ? "border-amber-300 bg-amber-600/85" : "border-orange-300/70 bg-orange-600/85";
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "fixed inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 sm:p-5 pointer-events-none",
		"data-testid": "touch-controls",
		children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			ref: padRef,
			role: "slider",
			"aria-label": "Flight Stick",
			"aria-valuetext": "Virtual flight joystick",
			onPointerDown: (e) => {
				e.preventDefault();
				pointerIdRef.current = e.pointerId;
				e.currentTarget.setPointerCapture(e.pointerId);
				updateStick(e.clientX, e.clientY);
			},
			onPointerMove: (e) => {
				if (pointerIdRef.current !== e.pointerId) return;
				updateStick(e.clientX, e.clientY);
			},
			onPointerUp: (e) => {
				if (pointerIdRef.current === e.pointerId) resetStick();
			},
			onPointerCancel: resetStick,
			className: "pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#090f1d]/78 border-2 border-sky-400/55 flex items-center justify-center touch-none select-none shadow-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute inset-2.5 rounded-full border border-sky-400/20 pointer-events-none" }, void 0, false, {
					fileName: _jsxFileName$2,
					lineNumber: 122,
					columnNumber: 9
				}, void 0),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute w-3 h-3 rounded-full bg-sky-400/20 pointer-events-none" }, void 0, false, {
					fileName: _jsxFileName$2,
					lineNumber: 123,
					columnNumber: 9
				}, void 0),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "w-11 h-11 rounded-full bg-sky-400/90 border-2 border-white shadow-lg pointer-events-none",
					style: { transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }
				}, void 0, false, {
					fileName: _jsxFileName$2,
					lineNumber: 124,
					columnNumber: 9
				}, void 0)
			]
		}, void 0, true, {
			fileName: _jsxFileName$2,
			lineNumber: 101,
			columnNumber: 7
		}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "pointer-events-auto flex flex-col items-end gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
				type: "button",
				"aria-pressed": autoTargetEnabled,
				onClick: (e) => {
					e.currentTarget.blur();
					onToggleAutoTarget();
				},
				className: `h-8 px-3 rounded-lg border font-hud font-bold text-[10px] sm:text-[11px] tracking-wider touch-none cursor-pointer transition-colors whitespace-nowrap ${autoTargetEnabled ? "bg-emerald-600/85 border-emerald-300/80 text-white" : "bg-[#090f1d]/85 border-slate-600 text-slate-300"}`,
				children: ["AUTO TARGET: ", autoTargetEnabled ? "ON" : "OFF"]
			}, void 0, true, {
				fileName: _jsxFileName$2,
				lineNumber: 134,
				columnNumber: 9
			}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "grid grid-cols-2 gap-2 sm:gap-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						...bindTouchBtn("boost"),
						className: `w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl bg-amber-600/85 border border-amber-300/70 text-white font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${pressedBtns.boost ? "scale-95 bg-amber-500" : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "BOOST" }, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 158,
							columnNumber: 13
						}, void 0)
					}, void 0, false, {
						fileName: _jsxFileName$2,
						lineNumber: 151,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						disabled: !maneuverReady,
						...bindTouchBtn("maneuver", !maneuverReady),
						className: `w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl border font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${maneuverReady ? `bg-sky-600/85 border-sky-300/70 text-white ${pressedBtns.maneuver ? "scale-95 bg-sky-500" : ""}` : "bg-slate-800/75 border-slate-700 text-slate-400"}`,
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "EVADE" }, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 171,
							columnNumber: 13
						}, void 0)
					}, void 0, false, {
						fileName: _jsxFileName$2,
						lineNumber: 161,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						disabled: missiles <= 0,
						...bindTouchBtn("fireMissile", missiles <= 0),
						className: `w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl border text-white font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${missiles > 0 ? missileBorder : "bg-slate-800/75 border-slate-700 text-slate-400"} ${pressedBtns.fireMissile ? "scale-95" : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: lockState === "locked" ? "LOCK!" : "MSL" }, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 182,
							columnNumber: 13
						}, void 0), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
							className: "text-[10px] opacity-90",
							children: missiles
						}, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 183,
							columnNumber: 13
						}, void 0)]
					}, void 0, true, {
						fileName: _jsxFileName$2,
						lineNumber: 174,
						columnNumber: 11
					}, void 0),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						...bindTouchBtn("fireGun"),
						className: `w-[62px] h-[50px] sm:w-[70px] sm:h-[56px] rounded-xl bg-rose-600/90 border border-rose-300/75 text-white font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform ${pressedBtns.fireGun ? "scale-95 bg-rose-500" : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "FIRE" }, void 0, false, {
							fileName: _jsxFileName$2,
							lineNumber: 193,
							columnNumber: 13
						}, void 0)
					}, void 0, false, {
						fileName: _jsxFileName$2,
						lineNumber: 186,
						columnNumber: 11
					}, void 0)
				]
			}, void 0, true, {
				fileName: _jsxFileName$2,
				lineNumber: 150,
				columnNumber: 9
			}, void 0)]
		}, void 0, true, {
			fileName: _jsxFileName$2,
			lineNumber: 133,
			columnNumber: 7
		}, void 0)]
	}, void 0, true, {
		fileName: _jsxFileName$2,
		lineNumber: 96,
		columnNumber: 5
	}, void 0);
};
// src/App.tsx
var _jsxFileName$1 = "/app/applet/src/App.tsx";
function App() {
	const canvasMountRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const [phase, setPhase] = (0, import_react.useState)("title");
	const [mode, setMode] = (0, import_react.useState)("missions");
	const [difficulty, setDifficulty] = (0, import_react.useState)("beginner");
	const [missionIndex, setMissionIndex] = (0, import_react.useState)(0);
	const [livery, setLivery] = (0, import_react.useState)("obsidian");
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [hud, setHud] = (0, import_react.useState)(null);
	const [runSummary, setRunSummary] = (0, import_react.useState)(null);
	const [touchOverride, setTouchOverride] = (0, import_react.useState)(null);
	const [isMobileViewport, setIsMobileViewport] = (0, import_react.useState)(() => {
		if (typeof window === "undefined") return false;
		return window.matchMedia?.("(pointer: coarse)").matches || (navigator.maxTouchPoints ?? 0) > 0 || window.innerWidth <= 900;
	});
	const touchEnabled = touchOverride ?? isMobileViewport;
	(0, import_react.useEffect)(() => {
		const onResize = () => {
			const mobile = window.matchMedia?.("(pointer: coarse)").matches || (navigator.maxTouchPoints ?? 0) > 0 || window.innerWidth <= 900;
			setIsMobileViewport(mobile);
		};
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);
	(0, import_react.useEffect)(() => {
		const container = canvasMountRef.current;
		if (!container) return;
		const engine = new FlightGameEngine(container, {
			onHudUpdate: (snapshot) => setHud(snapshot),
			onPhaseChange: (nextPhase) => setPhase(nextPhase),
			onRunEnd: (summary) => setRunSummary(summary),
			onMuteChange: (nextMuted) => setMuted(nextMuted)
		});
		engineRef.current = engine;
		const params = new URLSearchParams(window.location.search);
		const shot = params.get("shot");
		if (shot) engine.prepareShot(shot);
		else if (params.get("autostart") === "1") engine.startGame("missions", 0, true, "beginner");
		return () => {
			engine.dispose();
			engineRef.current = null;
		};
	}, []);
	const handleSelectLivery = (0, import_react.useCallback)((nextLivery) => {
		setLivery(nextLivery);
		engineRef.current?.setLivery(nextLivery);
	}, []);
	const handleToggleMute = (0, import_react.useCallback)(() => {
		const engine = engineRef.current;
		if (!engine) return;
		engine.sound.unlock();
		const nextMuted = engine.sound.toggleMute();
		setMuted(nextMuted);
	}, []);
	const handleStartSortie = (0, import_react.useCallback)(() => {
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
		setRunSummary(null);
		engineRef.current?.startGame(mode, missionIndex, false, difficulty);
	}, [
		mode,
		missionIndex,
		difficulty
	]);
	const handleRestartSortie = (0, import_react.useCallback)(() => {
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
		setRunSummary(null);
		engineRef.current?.startGame(mode, missionIndex, false, difficulty);
	}, [
		mode,
		missionIndex,
		difficulty
	]);
	const handleNextMission = (0, import_react.useCallback)(() => {
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
		const nextIdx = Math.min(MISSIONS.length - 1, missionIndex + 1);
		setMissionIndex(nextIdx);
		setRunSummary(null);
		engineRef.current?.startGame("missions", nextIdx, false, difficulty);
	}, [missionIndex, difficulty]);
	const handleResume = (0, import_react.useCallback)(() => {
		engineRef.current?.resumeGame();
	}, []);
	const handlePause = (0, import_react.useCallback)(() => {
		engineRef.current?.pauseGame();
	}, []);
	const handleMainMenu = (0, import_react.useCallback)(() => {
		setRunSummary(null);
		engineRef.current?.returnToTitle();
	}, []);
	const handleCycleCamera = (0, import_react.useCallback)(() => {
		engineRef.current?.cycleCamera();
	}, []);
	const handleToggleAutoTarget = (0, import_react.useCallback)(() => {
		engineRef.current?.toggleAutoTarget();
	}, []);
	const handleJoystickMove = (0, import_react.useCallback)((x, y) => {
		engineRef.current?.setTouchJoystick(x, y);
	}, []);
	const handleTouchButton = (0, import_react.useCallback)((btn, pressed) => {
		engineRef.current?.setTouchButton(btn, pressed);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("main", {
		className: "relative w-full h-full overflow-hidden bg-[#090d16]",
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				ref: canvasMountRef,
				"data-testid": "webgl-viewport",
				className: "fixed inset-0 w-full h-full"
			}, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 152,
				columnNumber: 7
			}, this),
			phase === "title" && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TitleScreen, {
				mode,
				difficulty,
				missionIndex,
				livery,
				bestScore: hud?.bestScore ?? 0,
				muted,
				onSelectMode: setMode,
				onSelectDifficulty: setDifficulty,
				onSelectMission: setMissionIndex,
				onSelectLivery: handleSelectLivery,
				onToggleMute: handleToggleMute,
				onStart: handleStartSortie
			}, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 159,
				columnNumber: 9
			}, this),
			phase === "playing" && hud && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(MilitaryHud, {
				hud,
				muted,
				touchEnabled,
				onCycleCamera: handleCycleCamera,
				onToggleAutoTarget: handleToggleAutoTarget,
				onToggleTouch: () => setTouchOverride(!touchEnabled),
				onToggleMute: handleToggleMute,
				onPause: handlePause
			}, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 177,
				columnNumber: 11
			}, this), touchEnabled && /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(TouchControls, {
				missiles: hud.missiles,
				maneuverReady: hud.maneuverReady,
				lockState: hud.lockState,
				autoTargetEnabled: hud.autoTargetEnabled,
				onToggleAutoTarget: handleToggleAutoTarget,
				onJoystickMove: handleJoystickMove,
				onButtonChange: handleTouchButton
			}, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 188,
				columnNumber: 13
			}, this)] }, void 0, true, {
				fileName: _jsxFileName$1,
				lineNumber: 176,
				columnNumber: 9
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(GameModals, {
				phase,
				summary: runSummary,
				canAdvanceMission: mode === "missions" && missionIndex < MISSIONS.length - 1,
				onResume: handleResume,
				onRestart: handleRestartSortie,
				onNextMission: handleNextMission,
				onMainMenu: handleMainMenu
			}, void 0, false, {
				fileName: _jsxFileName$1,
				lineNumber: 201,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName$1,
		lineNumber: 150,
		columnNumber: 5
	}, this);
}
(0, import_client.createRoot)(document.getElementById("root")).render(/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(App, {}, void 0, false, {
	fileName: "/app/applet/src/main.tsx",
	lineNumber: 5,
	columnNumber: 53
}, void 0));
