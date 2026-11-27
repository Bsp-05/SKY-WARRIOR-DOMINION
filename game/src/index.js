import { n as __toESM } from "./rolldown-runtime.js";
import { B as require_jsx_runtime, H as require_react, V as require_client } from "../vendor/libs.min.js";
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
var import_jsx_runtime = require_jsx_runtime();
/** The dimmed full-screen backdrop + centred dialog shell. */
function ModalShell({ label, wide, dim = "bg-[#060911]/80", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `fixed inset-0 z-30 flex items-center justify-center p-4 ${dim} overflow-y-auto`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": label,
			className: `w-full ${wide ? "max-w-md" : "max-w-sm"} bg-[#0b111e] border border-slate-700 rounded-xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 my-auto`,
			children
		})
	});
}
/** One of the three stat cards on the result screen. */
function StatCard({ label, value, sub, valueClass }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#070b14] border border-slate-800 rounded-lg p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] font-hud text-slate-400 uppercase",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `text-lg font-hud font-bold mt-0.5 ${valueClass}`,
				children: value
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] font-hud text-slate-500",
				children: sub
			})
		]
	});
}
/** Border / text colour for the rank badge, by rank letter. */
function rankBadgeStyle(rank) {
	switch (rank) {
		case "S": return "border-amber-400 text-amber-300";
		case "A": return "border-emerald-400 text-emerald-300";
		case "B": return "border-sky-400 text-sky-300";
		default: return "border-slate-600 text-slate-300";
	}
}
function PauseModal({ onResume, onRestart, onMainMenu }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalShell, {
		label: "Flight Paused",
		dim: "bg-[#060911]/75",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl font-bold text-white tracking-wide",
			children: "Sortie Paused"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-slate-400 mt-1",
			children: "Simulation held. Resume flight or reconfigure sortie."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-2.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onResume,
					className: "w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer",
					children: "Resume Flight"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onRestart,
					className: "w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg border border-slate-600 transition-colors cursor-pointer",
					children: "Restart Sortie"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onMainMenu,
					className: "w-full py-2.5 px-4 bg-transparent hover:bg-slate-800/70 text-slate-300 font-medium text-sm rounded-lg border border-slate-800 transition-colors cursor-pointer",
					children: "Return to Hangar"
				})
			]
		})]
	});
}
function ResultModal({ phase, summary, canAdvanceMission, onRestart, onNextMission, onMainMenu }) {
	const isWin = phase === "victory";
	const showNextMission = isWin && canAdvanceMission;
	const replayIsPrimary = !showNextMission;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ModalShell, {
		label: isWin ? "Mission Accomplished" : "Aircraft Lost",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `text-xs font-hud font-bold tracking-[0.2em] uppercase ${isWin ? "text-emerald-400" : "text-rose-400"}`,
							children: isWin ? "Air Superiority Confirmed" : "Sortie Failed"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-1.5 py-0.5 text-[10px] font-hud uppercase rounded bg-slate-800 text-slate-300 border border-slate-700",
							children: summary.difficulty
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl font-bold text-white tracking-wide mt-1",
						children: isWin ? "Victory" : "Defeat"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-slate-300 mt-1",
						children: isWin ? `${summary.missionTitle} completed with full airspace control.` : summary.defeatReason || "Hostile forces overwhelmed the sector."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `shrink-0 w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center bg-[#070b14] ${rankBadgeStyle(summary.rank)}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[9px] font-hud uppercase tracking-wider text-slate-400",
						children: "Rank"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-2xl font-display font-bold leading-none",
						children: summary.rank
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Score",
						value: summary.score.toLocaleString(),
						sub: `Best ${summary.bestScore.toLocaleString()}`,
						valueClass: "text-amber-400"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Kills / Wave",
						value: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							summary.kills,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-slate-400",
								children: ["W", summary.wave]
							})
						] }),
						sub: `Acc ${summary.accuracyPct}%`,
						valueClass: "text-white"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Flight Time",
						value: `${summary.elapsedSec}s`,
						sub: `Rings ${summary.checkpointsCleared}/${summary.checkpointsTotal}`,
						valueClass: "text-sky-300"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row gap-2.5 pt-1",
				children: [
					showNextMission && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-start": "true",
						onClick: onNextMission,
						className: "flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer",
						children: "Next Mission"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-start": replayIsPrimary ? "true" : void 0,
						onClick: onRestart,
						className: `flex-1 py-3 px-4 font-display font-bold tracking-wider uppercase rounded-lg transition-colors cursor-pointer ${showNextMission ? "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600" : "bg-amber-500 hover:bg-amber-400 text-slate-950"}`,
						children: isWin ? "Replay" : "Try Again"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onMainMenu,
						className: "flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-sm rounded-lg border border-slate-600 transition-colors cursor-pointer",
						children: "Main Menu"
					})
				]
			})
		]
	});
}
var GameModals = ({ phase, summary, canAdvanceMission, onResume, onRestart, onNextMission, onMainMenu }) => {
	if (phase === "paused") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseModal, {
		onResume,
		onRestart,
		onMainMenu
	});
	if ((phase === "victory" || phase === "defeat") && summary) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultModal, {
		phase,
		summary,
		canAdvanceMission,
		onRestart,
		onNextMission,
		onMainMenu
	});
	return null;
};
// src/components/MilitaryHud.tsx
function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}
function formatTime(sec) {
	const m = Math.floor(sec / 60);
	const s = Math.max(0, sec % 60);
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
/** Lock colour: green locked, amber acquiring, sky blue idle. */
function lockColour(lockState) {
	if (lockState === "locked") return "#22c55e";
	if (lockState === "acquiring") return "#f59e0b";
	return "#38bdf8";
}
function healthBarColour(health) {
	if (health > 50) return "bg-emerald-400";
	if (health > 25) return "bg-amber-400";
	return "bg-rose-500";
}
/** 0..100 health bar fill colour for a target box. */
function targetHpColour(hpPct) {
	if (hpPct > 55) return "bg-emerald-400";
	if (hpPct > 25) return "bg-amber-400";
	return "bg-rose-500";
}
/** Arrow pointing toward an off-screen target, from its screen direction. */
function offscreenArrow(dirX, dirY) {
	if (Math.abs(dirX) > Math.abs(dirY)) return dirX > 0 ? "▶" : "◀";
	return dirY < 0 ? "▲" : "▼";
}
function markerBounds(touchEnabled, shortViewport) {
	return {
		minX: touchEnabled ? shortViewport ? .24 : .22 : .08,
		maxX: touchEnabled ? shortViewport ? .76 : .78 : .92,
		minY: touchEnabled ? shortViewport ? .35 : .29 : .19,
		maxY: touchEnabled ? shortViewport ? .56 : .58 : .85
	};
}
/** Thin labelled progress bar used by FUEL / HULL / HEAT. */
function MeterBar({ pct, barClass, heightClass = "h-1.5" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `${heightClass} bg-slate-800 rounded-full overflow-hidden`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `h-full ${barClass}`,
			style: { width: `${Math.round(pct)}%` }
		})
	});
}
/** One utility button in the top-right cluster. */
function HudUtilityButton({ label, title, pressed, activeClass, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		tabIndex: -1,
		"aria-pressed": pressed,
		"aria-label": label,
		title,
		onClick: (e) => {
			e.currentTarget.blur();
			onClick();
		},
		className: `h-8 sm:h-9 px-2 sm:px-2.5 text-[11px] sm:text-xs font-hud font-medium border rounded-lg cursor-pointer whitespace-nowrap flex items-center ${activeClass ?? "bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border-slate-700/70"}`,
		children
	});
}
/** Icon-only utility button (mute / pause). */
function HudIconButton({ label, title, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		tabIndex: -1,
		"aria-label": label,
		title,
		onClick: (e) => {
			e.currentTarget.blur();
			onClick();
		},
		className: "w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#090f1d]/85 hover:bg-slate-800 text-slate-200 border border-slate-700/70 rounded-lg cursor-pointer",
		children
	});
}
function TelemetryLeft({ hud, shortViewport }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `bg-[#090f1d]/82 border border-slate-700/60 rounded-lg ${shortViewport ? "p-1.5 space-y-0.5 w-[116px]" : "p-2 sm:p-3 space-y-1 sm:space-y-2 w-[114px] sm:w-[162px]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] font-hud text-slate-400",
					children: "SPD"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm sm:text-base font-hud font-bold text-sky-300",
					children: [
						hud.speedKnots,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] text-slate-400",
							children: "KTS"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] font-hud text-slate-400",
					children: "ALT"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm sm:text-base font-hud font-bold text-slate-100",
					children: [
						hud.altitudeMeters,
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[9px] text-slate-400",
							children: "M"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-[10px] font-hud mb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: hud.lowFuelWarning ? "text-rose-400 font-bold" : "text-slate-400",
					children: "FUEL"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-amber-300",
					children: [hud.fuel, "%"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeterBar, {
				pct: hud.fuel / hud.maxFuel * 100,
				barClass: hud.lowFuelWarning ? "bg-rose-500" : "bg-amber-400"
			})] }),
			hud.afterburner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[9px] font-hud font-bold text-orange-400 tracking-wider",
				children: "AFTERBURNER"
			})
		]
	});
}
function TelemetryRight({ hud, shortViewport }) {
	const heatHot = hud.gunOverheated || hud.gunHeat > .8;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `bg-[#090f1d]/82 border border-slate-700/60 rounded-lg ${shortViewport ? "p-1.5 space-y-0.5 w-[122px]" : "p-2 sm:p-3 space-y-1 sm:space-y-2 w-[118px] sm:w-[172px]"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-[10px] font-hud mb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: hud.lowHealthWarning ? "text-rose-400 font-bold" : "text-slate-400",
					children: "HULL"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-emerald-300",
					children: [hud.health, "%"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeterBar, {
				pct: hud.health / hud.maxHealth * 100,
				barClass: healthBarColour(hud.health)
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-[11px] font-hud",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-slate-400",
					children: "MSL"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-amber-300 font-bold",
					children: [
						hud.missiles,
						"/",
						hud.maxMissiles
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-[10px] font-hud mb-0.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: hud.gunOverheated ? "text-rose-400 font-bold" : "text-slate-400",
					children: hud.gunOverheated ? "OVERHEAT" : "HEAT"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: heatHot ? "text-rose-400 font-bold" : "text-sky-300",
					children: [Math.round(hud.gunHeat * 100), "%"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeterBar, {
				pct: hud.gunHeat * 100,
				barClass: heatHot ? "bg-rose-500" : "bg-sky-400",
				heightClass: "h-1"
			})] })
		]
	});
}
function TargetMarker({ t, bounds, lockColor, lockState }) {
	const sx = clamp(t.screenX, bounds.minX, bounds.maxX);
	const sy = clamp(t.screenY, bounds.minY, bounds.maxY);
	const hpPct = clamp(Math.round(t.healthRatio * 100), 0, 100);
	const hpFill = targetHpColour(hpPct);
	if (!t.inFront) {
		const arrow = offscreenArrow(t.dirX ?? 0, t.dirY ?? 1);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center gap-0.5",
			style: {
				left: `${sx * 100}%`,
				top: `${sy * 100}%`
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-14 h-1.5 bg-slate-950/90 border border-slate-500/70 rounded-sm overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `h-full ${hpFill}`,
					style: { width: `${hpPct}%` }
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `px-1.5 py-0.5 text-[10px] font-hud rounded whitespace-nowrap border ${t.isLockedTarget ? "text-emerald-200 bg-emerald-950/90 border-emerald-400/80" : "text-rose-200 bg-rose-950/85 border-rose-500/70"}`,
				children: [
					arrow,
					" ",
					t.callsign,
					" ",
					t.distance,
					"m"
				]
			})]
		}, t.id);
	}
	const boxBorder = t.isLockedTarget ? lockState === "locked" ? "border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.45)]" : "border-amber-400" : "border-rose-400/85";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center",
		style: {
			left: `${sx * 100}%`,
			top: `${sy * 100}%`
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-1 flex flex-col items-center gap-0.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-1.5 py-0.5 rounded bg-[#070b14]/85 border border-slate-700/70 whitespace-nowrap text-[10px] font-hud text-white leading-none",
				children: [
					t.callsign,
					" · ",
					t.distance,
					"m"
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-14 sm:w-16 h-2 bg-slate-950/95 border border-slate-400/75 rounded-sm overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `h-full transition-all duration-100 ${hpFill}`,
					style: { width: `${hpPct}%` }
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `w-9 h-9 sm:w-11 sm:h-11 border-2 ${boxBorder} relative`,
			children: t.isLockedTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-hud font-bold tracking-wider hud-stroke",
				style: { color: lockColor },
				children: lockState === "locked" ? "TARGET LOCKED" : "TRACKING"
			})
		})]
	}, t.id);
}
function CanopyFrame() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 1440 900",
		preserveAspectRatio: "none",
		className: "fixed inset-0 z-0 w-full h-full pointer-events-none",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0,120 Q360,48 720,40 Q1080,48 1440,120 L1440,0 L0,0 Z",
				fill: "rgba(9,13,22,0.42)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0,120 Q360,48 720,40 Q1080,48 1440,120",
				fill: "none",
				stroke: "#1e293b",
				strokeWidth: "12"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M0,900 L0,760 L430,835 L1010,835 L1440,760 L1440,900 Z",
				fill: "rgba(9,13,22,0.82)",
				stroke: "#334155",
				strokeWidth: "4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				opacity: "0.9",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "468",
						y: "846",
						width: "120",
						height: "44",
						rx: "4",
						fill: "#07111e",
						stroke: "#38bdf8",
						strokeWidth: "1.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "528",
						cy: "868",
						r: "15",
						fill: "none",
						stroke: "#38bdf8",
						strokeWidth: "1.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: "513",
						y1: "868",
						x2: "543",
						y2: "868",
						stroke: "#22c55e",
						strokeWidth: "2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "615",
						y: "844",
						width: "210",
						height: "48",
						rx: "4",
						fill: "#07111e",
						stroke: "#f59e0b",
						strokeWidth: "1.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "630",
						y: "858",
						width: "84",
						height: "7",
						rx: "2",
						fill: "#22c55e"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "630",
						y: "872",
						width: "128",
						height: "7",
						rx: "2",
						fill: "#38bdf8"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "792",
						cy: "868",
						r: "14",
						fill: "none",
						stroke: "#f59e0b",
						strokeWidth: "1.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						x1: "792",
						y1: "868",
						x2: "801",
						y2: "859",
						stroke: "#fbbf24",
						strokeWidth: "2"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: "852",
						y: "846",
						width: "120",
						height: "44",
						rx: "4",
						fill: "#07111e",
						stroke: "#22c55e",
						strokeWidth: "1.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
						points: "866,878 886,864 906,872 930,856 958,864",
						fill: "none",
						stroke: "#22c55e",
						strokeWidth: "2"
					})
				]
			})
		]
	});
}
var MilitaryHud = ({ hud, muted, touchEnabled, onCycleCamera, onToggleAutoTarget, onToggleTouch, onToggleMute, onPause }) => {
	const [shortViewport, setShortViewport] = (0, import_react.useState)(() => typeof window !== "undefined" && window.innerHeight < 520);
	(0, import_react.useEffect)(() => {
		const onResize = () => setShortViewport(window.innerHeight < 520);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);
	const lockColor = lockColour(hud.lockState);
	const shortCamLabel = hud.cameraMode === "chase" ? "CHS" : hud.cameraMode === "action" ? "ACT" : "CKP";
	const bounds = markerBounds(touchEnabled, shortViewport);
	const timeUrgent = hud.timeRemainingSec !== null && hud.timeRemainingSec <= 30;
	const telemetryLeft = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TelemetryLeft, {
		hud,
		shortViewport
	});
	const telemetryRight = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TelemetryRight, {
		hud,
		shortViewport
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-10 pointer-events-none overflow-hidden",
		children: [
			(hud.damageFlash > .05 || hud.lowHealthWarning) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 pointer-events-none",
				style: { boxShadow: `inset 0 0 110px rgba(239, 68, 68, ${Math.max(hud.damageFlash * .65, hud.lowHealthWarning ? .35 : 0)})` }
			}),
			hud.afterburner && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				viewBox: "0 0 100 100",
				preserveAspectRatio: "none",
				className: "fixed inset-0 w-full h-full pointer-events-none opacity-45",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					stroke: "#bae6fd",
					strokeWidth: "0.18",
					strokeLinecap: "round",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "2",
							y1: "14",
							x2: "10",
							y2: "20"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "98",
							y1: "14",
							x2: "90",
							y2: "20"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "1",
							y1: "44",
							x2: "9",
							y2: "46"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "99",
							y1: "44",
							x2: "91",
							y2: "46"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "3",
							y1: "78",
							x2: "11",
							y2: "73"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "97",
							y1: "78",
							x2: "89",
							y2: "73"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "18",
							y1: "3",
							x2: "22",
							y2: "10"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: "82",
							y1: "3",
							x2: "78",
							y2: "10"
						})
					]
				})
			}),
			hud.targets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TargetMarker, {
				t,
				bounds,
				lockColor,
				lockState: hud.lockState
			}, t.id)),
			hud.leadTarget && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center",
				style: {
					left: `${clamp(hud.leadTarget.screenX, bounds.minX, bounds.maxX) * 100}%`,
					top: `${clamp(hud.leadTarget.screenY, bounds.minY, bounds.maxY) * 100}%`
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-6 h-6 rounded-full border-2 border-cyan-300/90 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-1.5 h-1.5 rounded-full bg-cyan-300" })
				})
			}),
			hud.nextCheckpoint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center",
				style: {
					left: `${clamp(hud.nextCheckpoint.screenX, bounds.minX, bounds.maxX) * 100}%`,
					top: `${clamp(hud.nextCheckpoint.screenY, bounds.minY, bounds.maxY) * 100}%`
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-6 h-6 sm:w-7 sm:h-7 rotate-45 border-2 border-sky-400 flex items-center justify-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2 h-2 bg-amber-300" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mt-1 text-[10px] font-hud text-sky-200 hud-stroke whitespace-nowrap",
					children: [
						"RING ",
						hud.nextCheckpoint.order,
						" · ",
						hud.nextCheckpoint.distance,
						"m"
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center",
				children: [
					hud.combatFeedback && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"data-testid": "combat-feedback",
						className: `absolute -top-13 px-2.5 py-0.5 rounded border text-[11px] sm:text-xs font-hud font-bold tracking-wider whitespace-nowrap shadow-md ${hud.combatFeedback.kind === "kill" ? "bg-emerald-600/95 border-emerald-300 text-white" : hud.combatFeedback.kind === "crit" ? "bg-amber-500/95 border-amber-200 text-slate-950" : "bg-sky-600/90 border-sky-300 text-white"}`,
						children: hud.combatFeedback.text
					}),
					hud.lockState !== "none" && hud.lockedTargetCallsign && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute -top-9 px-2 py-0.5 rounded bg-[#090f1d]/85 border border-slate-700/60 text-[10px] sm:text-xs font-hud font-bold tracking-wider whitespace-nowrap",
						style: { color: lockColor },
						children: hud.lockState === "locked" ? `TARGET LOCKED · ${hud.lockedTargetCallsign} (${hud.lockedTargetDist ?? 0}m)` : `LOCKING · ${hud.lockedTargetCallsign} ${Math.round(hud.lockProgress * 100)}%`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						viewBox: "0 0 180 180",
						className: `${shortViewport ? "w-28 h-28" : "w-32 h-32 sm:w-44 sm:h-44"} overflow-visible`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
								transform: `rotate(${-hud.bankDeg} 90 90) translate(0 ${Math.max(-34, Math.min(34, hud.pitchDeg * .9))})`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "26",
										y1: "90",
										x2: "64",
										y2: "90",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "116",
										y1: "90",
										x2: "154",
										y2: "90",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "64",
										y1: "90",
										x2: "64",
										y2: "96",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
										x1: "116",
										y1: "90",
										x2: "116",
										y2: "96",
										stroke: "#38bdf8",
										strokeWidth: "1.5",
										strokeOpacity: "0.65"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "90",
								cy: "90",
								r: "46",
								fill: "none",
								stroke: "rgba(255,255,255,0.12)",
								strokeWidth: "2"
							}),
							hud.lockProgress > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "90",
								cy: "90",
								r: "46",
								fill: "none",
								stroke: lockColor,
								strokeWidth: "3",
								strokeDasharray: 2 * Math.PI * 46,
								strokeDashoffset: 2 * Math.PI * 46 * (1 - hud.lockProgress),
								transform: "rotate(-90 90 90)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "90",
								cy: "90",
								r: "3",
								fill: lockColor
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M78,90 L85,90 M95,90 L102,90 M90,78 L90,85 M90,95 L90,102",
								stroke: "#f8fafc",
								strokeWidth: "1.75"
							}),
							hud.hitMarker && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M75,75 L83,83 M105,75 L97,83 M75,105 L83,97 M105,105 L97,97",
								stroke: "#fbbf24",
								strokeWidth: "2.5",
								strokeLinecap: "round"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-20 flex flex-col p-2 sm:p-3.5 gap-1.5 pointer-events-none",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `bg-[#090f1d]/85 border border-slate-700/60 rounded-lg ${shortViewport ? "px-2 py-1 min-w-[116px]" : "px-2.5 py-1.5 sm:px-3 sm:py-2 min-w-[114px] sm:min-w-[138px]"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2 text-[10px] font-hud uppercase tracking-wider text-slate-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Kills ", hud.kills] }), hud.combo > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-amber-300 font-bold",
										children: ["x", hud.combo]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `${shortViewport ? "text-base" : "text-lg sm:text-2xl"} font-display font-bold text-amber-400 leading-tight font-hud`,
									"data-testid": "hud-score",
									children: hud.score.toLocaleString()
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden sm:flex flex-col items-center max-w-md text-center min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-[#090f1d]/85 border border-slate-700/60 rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 text-xs font-hud whitespace-nowrap",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-sky-300 font-bold",
												children: [
													"HDG ",
													String(hud.headingDeg).padStart(3, "0"),
													"°"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-600",
												"aria-hidden": "true",
												children: "|"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-100 truncate max-w-[180px]",
												children: hud.missionTitle
											}),
											hud.timeRemainingSec !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-slate-600",
												"aria-hidden": "true",
												children: "|"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: timeUrgent ? "text-rose-400 font-bold" : "text-amber-300",
												children: formatTime(hud.timeRemainingSec)
											})] })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-1 text-xs font-medium text-slate-200 hud-stroke truncate max-w-[360px]",
										children: hud.objectiveText
									}),
									(hud.incomingWarning || hud.bannerMessage) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1.5 flex flex-col items-center gap-1",
										children: [hud.incomingWarning && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "px-3 py-0.5 bg-rose-600/90 text-white text-[11px] font-hud font-bold tracking-wider rounded border border-rose-300/60 whitespace-nowrap",
											children: [
												"INCOMING MISSILE (",
												hud.incomingDistance,
												"m) — EVADE!"
											]
										}), hud.bannerMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "px-3 py-0.5 bg-[#090f1d]/90 text-amber-300 text-[11px] font-hud font-semibold tracking-wider rounded border border-amber-500/40 whitespace-nowrap truncate max-w-[360px]",
											children: hud.bannerMessage
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(HudUtilityButton, {
										label: "Toggle Auto Target",
										title: "Toggle Auto Target (T)",
										pressed: hud.autoTargetEnabled,
										activeClass: hud.autoTargetEnabled ? "bg-[#062820]/90 border-emerald-400 text-emerald-200" : "bg-[#090f1d]/85 hover:bg-slate-800 text-slate-300 border-slate-700/70",
										onClick: onToggleAutoTarget,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "sm:hidden",
											children: ["A:", hud.autoTargetEnabled ? "ON" : "OFF"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "hidden sm:inline",
											children: ["Auto: ", hud.autoTargetEnabled ? "ON" : "OFF"]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(HudUtilityButton, {
										label: "Switch Camera View",
										title: "Switch Camera (C)",
										onClick: onCycleCamera,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "sm:hidden",
											children: ["C:", shortCamLabel]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "hidden sm:inline",
											children: ["Cam: ", hud.cameraMode.toUpperCase()]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudUtilityButton, {
										label: "Toggle Touch Controls",
										title: "Toggle On-Screen Touch Controls",
										activeClass: touchEnabled ? "bg-sky-500/25 border-sky-400 text-sky-200" : "bg-[#090f1d]/85 hover:bg-slate-800 text-slate-300 border-slate-700/70",
										onClick: onToggleTouch,
										children: "Pad"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudIconButton, {
										label: muted ? "Unmute Audio" : "Mute Audio",
										title: "Mute (M)",
										onClick: onToggleMute,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
											viewBox: "0 0 24 24",
											className: "w-4 h-4",
											fill: "none",
											stroke: "currentColor",
											strokeWidth: "2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M11 5L6 9H2v6h4l5 4V5z" }), muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
												d: "M22 9l-6 6M16 9l6 6",
												stroke: "#f87171"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" })]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudIconButton, {
										label: "Pause Game",
										title: "Pause (P)",
										onClick: onPause,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
											viewBox: "0 0 24 24",
											className: "w-4 h-4",
											fill: "currentColor",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "6",
												y: "5",
												width: "4",
												height: "14",
												rx: "1"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
												x: "14",
												y: "5",
												width: "4",
												height: "14",
												rx: "1"
											})]
										})
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:hidden flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-[#090f1d]/85 border border-slate-700/60 rounded-md px-2.5 py-1 flex items-center gap-2 text-[10px] font-hud max-w-full",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sky-300 font-bold shrink-0",
									children: [String(hud.headingDeg).padStart(3, "0"), "°"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-600 shrink-0",
									"aria-hidden": "true",
									children: "|"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-100 truncate",
									children: hud.objectiveText
								}),
								hud.timeRemainingSec !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-slate-600 shrink-0",
									"aria-hidden": "true",
									children: "|"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `shrink-0 ${timeUrgent ? "text-rose-400 font-bold" : "text-amber-300"}`,
									children: formatTime(hud.timeRemainingSec)
								})] })
							]
						})
					}),
					(hud.incomingWarning || hud.bannerMessage) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:hidden flex flex-col items-center gap-1 pointer-events-none",
						children: [hud.incomingWarning && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-2.5 py-0.5 bg-rose-600/90 text-white text-[10px] font-hud font-bold tracking-wider rounded border border-rose-300/60 whitespace-nowrap",
							children: [
								"INCOMING MISSILE (",
								hud.incomingDistance,
								"m) — EVADE!"
							]
						}), hud.bannerMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-2.5 py-0.5 bg-[#090f1d]/90 text-amber-300 text-[10px] font-hud font-semibold tracking-wider rounded border border-amber-500/40 whitespace-nowrap truncate max-w-[90vw]",
							children: hud.bannerMessage
						})]
					}),
					touchEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [telemetryLeft, telemetryRight]
					})
				]
			}),
			hud.cameraMode === "cockpit" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanopyFrame, {}),
			!touchEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed left-4 bottom-5",
				children: telemetryLeft
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed right-4 bottom-5 flex flex-col items-end gap-2",
				children: [telemetryRight, !shortViewport && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hidden sm:flex items-center justify-center bg-[#090f1d]/85 border border-slate-700/70 rounded-full w-28 h-28 p-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						viewBox: "-1 -1 2 2",
						className: "w-full h-full",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "0",
								cy: "0",
								r: "0.96",
								fill: "rgba(15,23,42,0.75)",
								stroke: "rgba(56,189,248,0.35)",
								strokeWidth: "0.03"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: "0",
								cy: "0",
								r: "0.5",
								fill: "none",
								stroke: "rgba(56,189,248,0.2)",
								strokeWidth: "0.02"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: "-0.95",
								y1: "0",
								x2: "0.95",
								y2: "0",
								stroke: "rgba(56,189,248,0.18)",
								strokeWidth: "0.02"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
								x1: "0",
								y1: "-0.95",
								x2: "0",
								y2: "0.95",
								stroke: "rgba(56,189,248,0.18)",
								strokeWidth: "0.02"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
								points: "0,-0.12 0.08,0.09 -0.08,0.09",
								fill: "#f8fafc"
							}),
							hud.radarBlips.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								cx: b.dx,
								cy: b.dz,
								r: b.isLocked ? .085 : .06,
								fill: b.kind === "enemy" ? b.isLocked ? "#facc15" : "#ef4444" : b.kind === "checkpoint" ? "#38bdf8" : "#22c55e"
							}, b.id))
						]
					})
				})]
			})] })
		]
	});
};
// src/components/TitleScreen.tsx
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
/** Section heading inside the briefing panel. */
function SectionLabel({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-xs font-medium text-slate-400 mb-1.5",
		children
	});
}
/** A segmented 3-way selector row (mode / difficulty). */
function SegmentedRow({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-3 gap-1.5 bg-[#070b14] p-1 rounded-lg border border-slate-800",
		children
	});
}
/** Wrapper for a panel section separated by a top border. */
function PanelSection({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pt-2 border-t border-slate-800/90",
		children
	});
}
/** The shield emblem next to the SKY WARRIOR wordmark. */
function Emblem() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: "w-11 h-11 sm:w-13 sm:h-13 shrink-0",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "32,4 58,20 52,50 32,60 12,50 6,20",
				fill: "#111827",
				stroke: "#f59e0b",
				strokeWidth: "2.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "32,12 46,38 32,31 18,38",
				fill: "#f59e0b"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "32,26 52,44 32,39 12,44",
				fill: "#e2e8f0"
			})
		]
	});
}
/** Mission time limit, scaled by the selected difficulty. */
function missionTimeText(timeLimitSec, timeMult) {
	const totalSec = timeLimitSec * timeMult;
	return `${Math.floor(totalSec / 60)}m ${Math.round(totalSec % 60)}s`;
}
var TitleScreen = ({ mode, difficulty, missionIndex, livery, bestScore, muted, onSelectMode, onSelectDifficulty, onSelectMission, onSelectLivery, onToggleMute, onStart }) => {
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.code === "Enter" || e.code === "Space") {
				const interactive = e.target?.closest("button, a, input, select, textarea, [role=\"button\"]");
				if (interactive && interactive.getAttribute("data-start") !== "true") return;
				e.preventDefault();
				onStart();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onStart]);
	const activeMission = MISSIONS[missionIndex] ?? MISSIONS[0];
	const activeMode = MODE_ITEMS.find((m) => m.id === mode);
	const showDifficulty = mode !== "freeflight";
	const showMissions = mode === "missions";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-8 pointer-events-none overflow-y-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-y-0 left-0 w-full md:w-[54%] pointer-events-none",
				style: { background: "linear-gradient(90deg, rgba(8,12,21,0.88) 0%, rgba(8,12,21,0.68) 68%, rgba(8,12,21,0) 100%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 flex items-start justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Emblem, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-wider text-white leading-none hud-stroke",
						children: "SKY WARRIOR"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5 mt-1 text-xs sm:text-sm font-hud tracking-[0.22em] text-amber-400",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "DOMINION" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								className: "text-slate-500",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-slate-300 tracking-normal font-sans",
								children: ["Best Score ", bestScore.toLocaleString()]
							})
						]
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onToggleMute,
					"aria-label": muted ? "Unmute audio" : "Mute audio",
					className: "pointer-events-auto px-3.5 py-2 text-xs font-medium text-slate-200 bg-[#0d1422]/90 border border-slate-700/80 rounded-lg hover:border-amber-500/70 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer",
					children: muted ? "Audio: Off" : "Audio: On"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative z-10 w-full max-w-md my-auto py-3 pointer-events-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-[#0b111e]/92 border border-slate-700/70 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Flight Mode" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SegmentedRow, { children: MODE_ITEMS.map((item) => {
								const active = mode === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onSelectMode(item.id),
									className: `px-1 sm:px-2 py-2 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${active ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800/60"}`,
									children: item.label.replace(" Mode", "")
								}, item.id);
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-300 mt-1.5 leading-relaxed",
								children: activeMode?.desc
							})
						] }),
						showDifficulty && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PanelSection, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Combat Difficulty" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SegmentedRow, { children: DIFFICULTY_ITEMS.map((d) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onSelectDifficulty(d),
									className: `px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${difficulty === d ? "bg-emerald-500 text-slate-950 shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-800/60"}`,
									children: DIFFICULTY_CONFIG[d].label
								}, d);
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-slate-400 mt-1.5 leading-snug",
								children: DIFFICULTY_CONFIG[difficulty].desc
							})
						] }),
						showMissions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PanelSection, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "Operation" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-3 gap-1.5 mb-2",
								children: MISSIONS.map((m, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => onSelectMission(idx),
									className: `px-2 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${missionIndex === idx ? "bg-sky-500/20 border-sky-400 text-sky-200" : "bg-[#080d18] border-slate-800 text-slate-400 hover:text-slate-200"}`,
									children: ["Sortie 0", idx + 1]
								}, m.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold text-white",
								children: activeMission.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-300 mt-1 leading-relaxed",
								children: activeMission.briefing
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 mt-1.5 text-xs font-hud text-slate-400",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [activeMission.waves, " Waves"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: "·"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [activeMission.checkpointCount, " Bonus Rings"] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: "·"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: missionTimeText(activeMission.timeLimitSec, DIFFICULTY_CONFIG[difficulty].timeMult) })
								]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PanelSection, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionLabel, { children: "F-22X Livery" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-1.5",
							children: LIVERY_ITEMS.map((item) => {
								const active = livery === item.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => onSelectLivery(item.id),
									className: `flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${active ? "bg-slate-800 border-amber-400 text-white" : "bg-[#080d18] border-slate-800 text-slate-400 hover:text-slate-200"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-2.5 h-2.5 rounded-full shrink-0 border border-white/25",
										style: { backgroundColor: item.swatch }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: item.label.split(" ")[1]
									})]
								}, item.id);
							})
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"data-start": "true",
							onClick: onStart,
							className: "w-full py-3.5 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-display font-bold text-base tracking-wider uppercase rounded-lg transition-colors cursor-pointer shadow-lg",
							children: "Launch Sortie"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 flex flex-col items-center gap-1 text-center text-xs text-slate-300/90 hud-stroke",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-hud",
					children: "W/S Pitch · A/D Roll · Q/E Yaw · Space/LMB Cannon · F/RMB Missile · Wheel Throttle · T Auto-Target · Shift Boost · X Evade · C View"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-hud font-bold text-amber-300",
					children: "Press Enter or Space to Launch"
				})]
			})
		]
	});
};
// src/components/TouchControls.tsx
/**
* TouchControls — the mobile flight controls.
*
* Left side: a virtual flight stick (pointer-captured, clamped to a
* circle, dead-zoned and eased before it reaches the engine).
* Right side: a compact 2×2 combat cluster — BOOST, EVADE, missile
* (MSL, with lock state and remaining count) and gun (FIRE / COOL
* when overheated) — plus an AUTO TARGET toggle.
*
* Short-viewport compaction (phones in landscape, innerHeight < 520):
* the stick and buttons shrink, gaps tighten, and the redundant
* AUTO TARGET button is hidden here because the HUD already exposes
* the same toggle — the cluster must not crowd the stick.
*/
/** Viewport height below which the compact landscape layout applies. */
var SHORT_VIEWPORT_HEIGHT = 520;
/** Stick travel (px) from centre to rim, normal vs. compact layout. */
var STICK_RADIUS = 38;
var STICK_RADIUS_SHORT = 31;
/** Input below this magnitude is treated as centred (stick drift). */
var STICK_DEADZONE = .08;
/** Response curve exponent — values > 1 make fine aim near centre. */
var STICK_CURVE = 1.2;
/** Initial pressed state: every action button released. */
var ALL_RELEASED = {
	boost: false,
	maneuver: false,
	fireMissile: false,
	fireGun: false
};
/**
* Shape one stick axis: apply the deadzone, renormalise the remainder
* to 0..1, then ease it so small deflections stay precise.
*/
function shapeAxis(raw, deadzone = STICK_DEADZONE) {
	const abs = Math.abs(raw);
	if (abs <= deadzone) return 0;
	const norm = (abs - deadzone) / (1 - deadzone);
	return Math.sign(raw) * Math.pow(norm, STICK_CURVE);
}
/** Clamp a (dx, dy) offset to a circle of the given radius. */
function clampToRadius(dx, dy, radius) {
	const dist = Math.hypot(dx, dy);
	if (dist <= radius) return {
		x: dx,
		y: dy
	};
	return {
		x: dx / dist * radius,
		y: dy / dist * radius
	};
}
/** Border / background for the missile button, driven by lock state. */
function missileButtonStyle(lockState) {
	if (lockState === "locked") return "border-emerald-300 ring-2 ring-emerald-400/60 bg-emerald-600/85";
	if (lockState === "acquiring") return "border-amber-300 bg-amber-600/85";
	return "border-orange-300/70 bg-orange-600/85";
}
var TouchControls = ({ missiles, maneuverReady, gunOverheated, lockState, autoTargetEnabled, onToggleAutoTarget, onJoystickMove, onButtonChange }) => {
	const padRef = (0, import_react.useRef)(null);
	const pointerIdRef = (0, import_react.useRef)(null);
	const [knobOffset, setKnobOffset] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const [shortViewport, setShortViewport] = (0, import_react.useState)(() => typeof window !== "undefined" && window.innerHeight < SHORT_VIEWPORT_HEIGHT);
	const [pressedBtns, setPressedBtns] = (0, import_react.useState)(ALL_RELEASED);
	(0, import_react.useEffect)(() => {
		const onResize = () => setShortViewport(window.innerHeight < SHORT_VIEWPORT_HEIGHT);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, []);
	const maxRadius = shortViewport ? STICK_RADIUS_SHORT : STICK_RADIUS;
	/** Convert a pointer position into a clamped knob offset + engine axes. */
	const updateStick = (clientX, clientY) => {
		const el = padRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const clamped = clampToRadius(clientX - cx, clientY - cy, maxRadius);
		setKnobOffset(clamped);
		onJoystickMove(shapeAxis(clamped.x / maxRadius), shapeAxis(-clamped.y / maxRadius));
	};
	/** Release the stick: forget the pointer, centre the knob, zero axes. */
	const resetStick = () => {
		pointerIdRef.current = null;
		setKnobOffset({
			x: 0,
			y: 0
		});
		onJoystickMove(0, 0);
	};
	/** Record a button press locally (for the pressed visual) and forward it. */
	const handleBtn = (btn, pressed) => {
		setPressedBtns((prev) => prev[btn] === pressed ? prev : {
			...prev,
			[btn]: pressed
		});
		onButtonChange(btn, pressed);
	};
	/**
	* Pointer handlers for one action button. A disabled button ignores
	* press-down entirely; release always clears the pressed state so a
	* button can never stick "on" if it becomes disabled mid-press.
	*/
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
	const missileBorder = missileButtonStyle(lockState);
	const baseBtnClass = `${shortViewport ? "w-[58px] h-[40px]" : "w-[62px] h-[50px] sm:w-[70px] sm:h-[56px]"} rounded-xl border font-hud font-bold text-[11px] sm:text-xs flex flex-col items-center justify-center touch-none cursor-pointer transition-transform`;
	const pressedClass = "scale-95";
	const missilesAvailable = missiles > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `fixed inset-x-0 bottom-0 z-20 flex items-end justify-between pointer-events-none ${shortViewport ? "px-3 py-2" : "p-3 sm:p-5"}`,
		"data-testid": "touch-controls",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
			className: `pointer-events-auto relative rounded-full bg-[#090f1d]/78 border-2 border-sky-400/55 flex items-center justify-center touch-none select-none shadow-xl ${shortViewport ? "w-24 h-24" : "w-28 h-28 sm:w-32 sm:h-32"}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-2.5 rounded-full border border-sky-400/20 pointer-events-none" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute w-3 h-3 rounded-full bg-sky-400/20 pointer-events-none" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `rounded-full bg-sky-400/90 border-2 border-white shadow-lg pointer-events-none ${shortViewport ? "w-9 h-9" : "w-11 h-11"}`,
					style: { transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `pointer-events-auto flex flex-col items-end ${shortViewport ? "gap-1.5" : "gap-2"}`,
			children: [!shortViewport && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-pressed": autoTargetEnabled,
				onClick: (e) => {
					e.currentTarget.blur();
					onToggleAutoTarget();
				},
				className: `h-8 px-3 rounded-lg border font-hud font-bold text-[10px] sm:text-[11px] tracking-wider touch-none cursor-pointer transition-colors whitespace-nowrap ${autoTargetEnabled ? "bg-emerald-600/85 border-emerald-300/80 text-white" : "bg-[#090f1d]/85 border-slate-600 text-slate-300"}`,
				children: ["AUTO TARGET: ", autoTargetEnabled ? "ON" : "OFF"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `grid grid-cols-2 ${shortViewport ? "gap-1.5" : "gap-2 sm:gap-2.5"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						...bindTouchBtn("boost"),
						className: `${baseBtnClass} bg-amber-600/85 border-amber-300/70 text-white ${pressedBtns.boost ? `${pressedClass} bg-amber-500` : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BOOST" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: !maneuverReady,
						...bindTouchBtn("maneuver", !maneuverReady),
						className: `${baseBtnClass} ${maneuverReady ? `bg-sky-600/85 border-sky-300/70 text-white ${pressedBtns.maneuver ? `${pressedClass} bg-sky-500` : ""}` : "bg-slate-800/75 border-slate-700 text-slate-400"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "EVADE" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !missilesAvailable,
						...bindTouchBtn("fireMissile", !missilesAvailable),
						className: `${baseBtnClass} text-white ${missilesAvailable ? missileBorder : "bg-slate-800/75 border-slate-700 text-slate-400"} ${pressedBtns.fireMissile ? pressedClass : ""}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lockState === "locked" ? "LOCK!" : "MSL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] opacity-90 leading-none",
							children: missiles
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						...bindTouchBtn("fireGun"),
						className: `${baseBtnClass} text-white ${gunOverheated ? "bg-slate-800/85 border-rose-400/70 text-rose-300" : "bg-rose-600/90 border-rose-300/75"} ${pressedBtns.fireGun ? `${pressedClass} bg-rose-500` : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: gunOverheated ? "COOL" : "FIRE" })
					})
				]
			})]
		})]
	});
};
// src/App.tsx
/**
* App — the React shell for Sky Warrior Dominion.
*
* This file owns only the wiring between the UI and the game engine:
*  - creating / disposing the FlightGameEngine against the WebGL mount
*  - holding the small pieces of React state the HUD and screens need
*    (phase, mode, difficulty, mission, livery, mute, HUD snapshot)
*  - forwarding player intent (start, pause, resume, camera, touch
*    input) to the engine through thin callbacks
*
* All simulation, rendering and audio live in ./game/engine. Nothing
* in here draws a frame; it just mounts the canvas container and the
* overlay screens (TitleScreen / MilitaryHud / TouchControls /
* GameModals) on top of it.
*/
/** Width at or below which a viewport counts as a touch-first device. */
var MOBILE_VIEWPORT_WIDTH = 900;
/** A focused button keeps its focus ring after a click; blur it so the
*  keyboard / gamepad focus does not linger on a stale control. */
function blurFocusedElement() {
	if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
}
/** Decide whether the current device should get touch controls by
*  default: coarse pointer, any touch points, or a narrow viewport. */
function detectTouchViewport() {
	if (typeof window === "undefined") return false;
	const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
	const hasTouchPoints = (navigator.maxTouchPoints ?? 0) > 0;
	const narrowWindow = window.innerWidth <= MOBILE_VIEWPORT_WIDTH;
	return coarsePointer || hasTouchPoints || narrowWindow;
}
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
	const [isMobileViewport, setIsMobileViewport] = (0, import_react.useState)(detectTouchViewport);
	const touchEnabled = touchOverride ?? isMobileViewport;
	(0, import_react.useEffect)(() => {
		const onResize = () => setIsMobileViewport(detectTouchViewport());
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
		setMuted(engine.sound.toggleMute());
	}, []);
	const launchCurrentSortie = (0, import_react.useCallback)(() => {
		blurFocusedElement();
		setRunSummary(null);
		engineRef.current?.startGame(mode, missionIndex, false, difficulty);
	}, [
		mode,
		missionIndex,
		difficulty
	]);
	const handleStartSortie = launchCurrentSortie;
	const handleRestartSortie = launchCurrentSortie;
	const handleNextMission = (0, import_react.useCallback)(() => {
		blurFocusedElement();
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
	const inFlight = phase === "playing" && hud !== null;
	const canAdvanceMission = mode === "missions" && missionIndex < MISSIONS.length - 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative w-full h-full overflow-hidden bg-[#090d16]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: canvasMountRef,
				"data-testid": "webgl-viewport",
				className: "fixed inset-0 w-full h-full"
			}),
			phase === "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleScreen, {
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
			}),
			inFlight && hud && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MilitaryHud, {
				hud,
				muted,
				touchEnabled,
				onCycleCamera: handleCycleCamera,
				onToggleAutoTarget: handleToggleAutoTarget,
				onToggleTouch: () => setTouchOverride(!touchEnabled),
				onToggleMute: handleToggleMute,
				onPause: handlePause
			}), touchEnabled && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchControls, {
				missiles: hud.missiles,
				maneuverReady: hud.maneuverReady,
				gunOverheated: hud.gunOverheated,
				lockState: hud.lockState,
				autoTargetEnabled: hud.autoTargetEnabled,
				onToggleAutoTarget: handleToggleAutoTarget,
				onJoystickMove: handleJoystickMove,
				onButtonChange: handleTouchButton
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameModals, {
				phase,
				summary: runSummary,
				canAdvanceMission,
				onResume: handleResume,
				onRestart: handleRestartSortie,
				onNextMission: handleNextMission,
				onMainMenu: handleMainMenu
			})
		]
	});
}
// src/main.tsx
var rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Sky Warrior Dominion: missing #root element in index.html");
(0, import_client.createRoot)(rootElement).render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(App, {}));
