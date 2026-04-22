import React from 'react';
import {
    Cpu,
    Database,
    Smartphone,
    GitBranch,
    Users,
    Zap,
    BarChart3,
    FileText,
    Workflow,
    Microscope,
    Layers,
    ScanLine,
    MessageSquare,
    Radio,
} from 'lucide-react';

const METRICS = '/docs/metrics';

const TOC = [
    { label: 'Summary & charts', id: 'summary' },
    { label: 'Why YOLO', id: 'why-yolo' },
    { label: 'Mode: Precision Scan', id: 'mode-precision-scan' },
    { label: 'Fast mode validation', id: 'teachable-validation' },
    { label: 'Mode: YOLO Segment', id: 'mode-yolo-segment' },
    { label: 'Segment demo', id: 'segment-demo' },
    { label: 'Mode: Neural Chat', id: 'mode-neural-chat' },
    { label: 'Mode: Live Vision', id: 'mode-live-vision' },
    { label: 'System architecture', id: 'system-architecture' },
    { label: 'Technology stack', id: 'core-technologies' },
    { label: 'YOLO model & training', id: 'yolo' },
    { label: 'Dataset & balancing', id: 'dataset' },
    { label: 'Validation metrics', id: 'performance-metrics' },
    { label: 'Project team', id: 'project-team' },
] as const;

function DocFigure({ src, alt, caption }: { src: string; alt: string; caption: string }) {
    return (
        <figure className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <img
                src={src}
                alt={alt}
                className="w-full h-auto object-contain bg-slate-50 dark:bg-slate-950 max-h-[340px] md:max-h-[380px]"
                loading="lazy"
            />
            <figcaption className="text-xs text-slate-600 dark:text-slate-400 p-3 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                {caption}
            </figcaption>
        </figure>
    );
}

/** Verified image counts per breed — dataset_prepared_v2 / run_ultimate (27,751 total). */
const DATASET_COUNT_SNAPSHOT = `GIR                 : 1,412   |   KOSALI             : 369
SAHIWAL             : 1,379   |   NIMARI             : 369
HOLSTEIN FRIESIAN   : 1,235   |   KENKATHA           : 359
AYRSHIRE            : 879     |   PULIKULAM          : 358
MURRAH              : 780     |   PONWAR             : 357
NAGPURI             : 698     |   BHADAWARI          : 355
THARPARKAR          : 677     |   KASARGOD           : 351
HALLIKAR            : 676     |   SIRI               : 350
BROWN SWISS         : 669     |   LUIT               : 349
KANKREJ             : 603     |   BACHAUR            : 346
JERSEY              : 593     |   MEHSANA            : 344
ONGOLE              : 590     |   GANGATARI          : 344
JAFFARABADI         : 583     |   DANGI              : 343
RED SINDHI          : 538     |   KALAHANDI          : 342
RED DANE            : 511     |   GHUMSARI           : 340
BARGUR              : 499     |   KHERIGARH          : 340
BANNI               : 477     |   BADRI              : 339
NAGORI              : 458     |   KANGAYAM           : 335
VECHUR              : 452     |   CHILIKA            : 335
NILI RAVI (ID:28)   : 449     |   SHWETA KAPILA      : 334
RATHI               : 443     |   THUTHO             : 329
AMRITMAHAL          : 438     |   SURTI              : 327
KRISHNA VALLEY      : 424     |   DAGRI              : 327
HARIANA             : 407     |   MEWATI             : 320
TODA                : 406     |   MALVI              : 315
ALAMBADI            : 395     |   GOJRI              : 312
DEONI               : 393     |   LADAKHI            : 312
GUERNSEY            : 392     |   NARI               : 311
MOTU                : 390     |   KONKAN KAPILA      : 308
UMBLACHERY          : 384     |   GAOLAO             : 300
MALNAD GIDDA        : 384     |   HIMACHALI PAHARI   : 297
LAKHIMI             : 381     |   PUNGANUR           : 280
BHELAI              : 379     |   CHHATTISGARHI      : 276
RED KANDHARI        : 377     |   MARATHWADA         : 274
PURNEA              : 373     |   PANDHARPURI        : 263
KHILLARI            : 373     |   PODA THIRUPU       : 257
KHARIAR             : 371     |`;

export const TechnicalDocs: React.FC = React.memo(() => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-16 transition-colors font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 border-b border-slate-200 dark:border-slate-800 pb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-6 uppercase tracking-wider">
                        <FileText className="w-3 h-3" />
                        Technical documentation
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                        PashuParichay <span className="text-emerald-600">Architecture</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                        Hybrid edge–cloud stack: validated <b>run_ultimate</b> YOLO weights (73 breeds, 27,751 images), Teachable Machine in the browser, and Gemini for interpretive reasoning.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-slate-500 font-medium">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Weights: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">run_ultimate</code>
                        </div>
                        <div className="flex items-center gap-2">
                            <Microscope className="w-4 h-4 text-emerald-500" />
                            73 breeds · 27,751 images
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-28 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 pl-3">Contents</p>
                            {TOC.map(({ label, id }) => (
                                <a
                                    key={id}
                                    href={`#${id}`}
                                    className="block px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                >
                                    {label}
                                </a>
                            ))}
                            <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-xs font-semibold text-slate-500 mb-2">Branch</p>
                                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-mono text-xs">
                                    <GitBranch className="w-4 h-4" />
                                    main/production
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-9 space-y-20">
                        {/* —— Summary (main landing with visuals) —— */}
                        <section id="summary" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
                                Summary & validation charts
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
                                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Indigenous breed ID supports conservation and breeding programs. <b>PashuParichay</b> ships a <b>run_ultimate</b> YOLO detector (Ultralytics, 640², 73 classes) with strong validation on 27,751 curated images, plus lightweight browser models and Gemini for explanations.
                                </p>
                            </div>

                            <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 mb-10">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-1">90.9%</div>
                                        <div className="text-xs text-slate-400 uppercase font-semibold">mAP50</div>
                                        <div className="text-[10px] text-slate-500 mt-1">PR curve: 0.910 mAP@0.5</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-teal-400 mb-1">88.3%</div>
                                        <div className="text-xs text-slate-400 uppercase font-semibold">mAP50–95</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">91.9%</div>
                                        <div className="text-xs text-slate-400 uppercase font-semibold">Precision</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-1">82.9%</div>
                                        <div className="text-xs text-slate-400 uppercase font-semibold">Recall</div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                Figures below are exported from the same <b>run_ultimate</b> validation run (Ultralytics box metrics). The blue “all classes” curve aggregates 73 breed heads (+ background where applicable).
                            </p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <DocFigure
                                    src={`${METRICS}/box-pr-curve.png`}
                                    alt="Precision–recall curve for all cattle classes"
                                    caption="Precision–recall curve. The aggregate line reports mAP@0.5 ≈ 0.91: detections with ≥50% IoU overlap are correct most of the time across breeds."
                                />
                                <DocFigure
                                    src={`${METRICS}/confusion-matrix-normalized.png`}
                                    alt="Normalized confusion matrix"
                                    caption="Normalized confusion matrix (predicted vs true). A strong diagonal means predicted breed matches ground truth; light off-diagonal cells show rare confusions between similar phenotypes."
                                />
                                <DocFigure
                                    src={`${METRICS}/confusion-matrix.png`}
                                    alt="Raw count confusion matrix"
                                    caption="Raw-count confusion matrix: same structure as normalized, with cell intensity reflecting sample counts per true/predicted pair."
                                />
                                <DocFigure
                                    src={`${METRICS}/box-p-curve.png`}
                                    alt="Precision vs confidence"
                                    caption="Precision–confidence: aggregate precision approaches ~0.99 at high confidence—when the model is sure, it is almost always right."
                                />
                                <DocFigure
                                    src={`${METRICS}/box-r-curve.png`}
                                    alt="Recall vs confidence"
                                    caption="Recall–confidence: at low thresholds the model finds ~94% of cattle instances (aggregate), trading off false positives vs false negatives for deployment tuning."
                                />
                                <DocFigure
                                    src={`${METRICS}/box-f1-curve.png`}
                                    alt="F1 vs confidence"
                                    caption="F1–confidence: peak F1 ≈ 0.87 near confidence ~0.59—a practical operating point balancing precision and recall for multi-breed screening."
                                />
                            </div>
                        </section>

                        <section id="why-yolo" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Zap className="w-6 h-6 mr-3 text-amber-500" />
                                Why YOLO for cattle breed detection
                            </h2>
                            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                                <p>
                                    <b>Single forward pass, dense predictions:</b> YOLO evaluates the full frame at multiple scales in one network pass—ideal for animals that may be small in the frame or partially occluded by fencing and fodder.
                                </p>
                                <p>
                                    <b>Joint localization + classification:</b> Unlike “classify the whole image” pipelines, a detection head learns <b>where</b> the animal is and <b>which</b> of 73 breeds it is, which matches field photos where background dominates.
                                </p>
                                <p>
                                    <b>Calibrated curves:</b> The P–R, precision–confidence, recall–confidence, and F1–confidence plots show how metrics move as you change the score threshold—so you can target dairy kiosk (high precision) vs field survey (higher recall) without retraining.
                                </p>
                                <p>
                                    <b>Evidence from validation:</b> mAP@0.5 ≈ <b>0.91</b> on the PR summary line; recall–confidence reports <b>~0.94</b> recall at threshold 0.0 for “all classes”; precision–confidence reaches <b>~0.99</b> at confidence 1.0; F1 peaks near <b>0.87</b> at confidence ≈0.59. Confusion matrices show a dominant diagonal with limited cross-breed bleed—consistent with the tabular precision/recall on the held-out set.
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Gemini and Teachable Machine layers add <b>interpretation</b> and <b>instant</b> on-device checks; they complement rather than replace these reproducible YOLO validation figures.
                                </p>
                            </div>
                        </section>

                        <section id="mode-precision-scan" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <ScanLine className="w-7 h-7 text-emerald-500 shrink-0" />
                                Precision Scan
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>What it is:</b> The primary end-to-end breed analysis flow. You upload an image or short video (or use the camera); the app returns structured breed metadata (traits, origin, utility, confidence).
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>How it works:</b> In <b>AI mode</b>, frames are sent to <b>Gemini</b> vision with a strict veterinary-style JSON schema. In <b>Fast mode</b>, <b>TensorFlow.js</b> Teachable Machine models (cattle vs buffalo URLs) run entirely in the browser for low-latency, offline-capable classification—then static and AI-enriched panels show breed facts.
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Use Precision Scan when you need a <b>single best breed label</b> and narrative for records or farmer advisory—not pixel-level boxes.
                            </p>
                        </section>

                        <section id="teachable-validation" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <Zap className="w-7 h-7 text-orange-500 shrink-0" />
                                Teachable Machine validation (Fast mode)
                            </h2>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-4">
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    <b>Fast mode</b> runs fully in the browser using <b>TensorFlow.js</b> + <b>Teachable Machine</b>. It is intentionally lightweight: a rapid pre-check that gives instant feedback on-device, then routes users to <b>Precision Scan</b> (Gemini) or <b>YOLO Segment</b> when confidence is low or multiple animals are present.
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    <b>Training setup (project report):</b> ~<b>6,000</b> curated images total, with <b>separate models trained for Cattle and Buffalo</b>. At runtime, the app can run both models and select the strongest prediction (Auto) or run a single species model (Cattle/Buffalo).
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-950/30">
                                        <p className="font-semibold text-slate-900 dark:text-white mb-1">How it works (runtime)</p>
                                        <ul className="text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
                                            <li>Center-crop to square</li>
                                            <li>Resize to model input (from metadata, default 224)</li>
                                            <li>Run TF.js inference (WebGL/WASM)</li>
                                            <li>Show top‑k probabilities + cached breed facts</li>
                                        </ul>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-950/30">
                                        <p className="font-semibold text-slate-900 dark:text-white mb-1">Model links</p>
                                        <p className="text-slate-600 dark:text-slate-400 mb-2">These open the Teachable Machine dashboards (hosted models):</p>
                                        <div className="flex flex-col gap-2">
                                            <a className="text-emerald-700 dark:text-emerald-400 font-bold underline" href="https://teachablemachine.withgoogle.com/models/ldU5BjIdS/" target="_blank" rel="noreferrer">
                                                Cattle model (TM)
                                            </a>
                                            <a className="text-emerald-700 dark:text-emerald-400 font-bold underline" href="https://teachablemachine.withgoogle.com/models/2YGZ3ZZK0/" target="_blank" rel="noreferrer">
                                                Buffalo model (TM)
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/70 dark:bg-slate-950/30">
                                    <p className="font-semibold text-slate-900 dark:text-white mb-2">Accuracy report (Fast mode)</p>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                        The Teachable Machine Fast mode used in this project reports <b>92% accuracy</b> with an <b>F1 score of 0.92</b>, optimized for <b>instant detection</b> directly in the browser. It is tuned for <b>responsiveness</b> and <b>on-device usability</b>—high confidence predictions are displayed immediately, while borderline cases are nudged to Precision Scan or YOLO Segment for stronger evidence.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="mode-yolo-segment" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <Layers className="w-7 h-7 text-emerald-500 shrink-0" />
                                YOLO Segment
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>What it is:</b> Local computer-vision inference using your trained <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">best.pt</code> weights served by a small <b>FastAPI</b> app (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">model/server.py</code>).
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>How it works:</b> The React client POSTs frames/images to <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">/api/segment</code> (proxied to port 8000 in dev). Ultralytics returns <b>xyxy boxes</b>, class names, confidences, and optional <b>segment polygons</b> when the checkpoint includes a mask head. Live mode keeps overlays updating continuously (traffic-camera style), confirms a breed across consecutive ticks, then auto-pauses and opens AI detail cards (including cattle/buffalo species).
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Use YOLO Segment when you need <b>multiple animals</b>, <b>masks/boxes</b> on the image, or to validate the same model that produced the charts in Summary.
                            </p>
                        </section>

                        <section id="segment-demo" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <Layers className="w-7 h-7 text-emerald-500 shrink-0" />
                                Segment demo
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                                Live segment visualization samples from your latest run. Replace these with your preferred GIF/clip by keeping the same filenames in <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">public/docs/screenshots</code>.
                            </p>
                            <div className="grid md:grid-cols-2 gap-6">
                                <DocFigure
                                    src={'/docs/screenshots/segment-demo.png'}
                                    alt="YOLO segment live demo frame"
                                    caption="Segment demo frame (use this slot for your GIF preview thumbnail or exported frame)."
                                />
                                <DocFigure
                                    src={'/docs/screenshots/segment-stats.png'}
                                    alt="YOLO segment run statistics panel"
                                    caption="Run_ultimate stats snippet used for quick visual reference in docs."
                                />
                            </div>
                        </section>

                        <section id="mode-neural-chat" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <MessageSquare className="w-7 h-7 text-emerald-500 shrink-0" />
                                Neural Chat
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>What it is:</b> A conversational assistant grounded in Indian cattle and buffalo management (nutrition, breeding, identification tips).
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>How it works:</b> Messages go to a <b>Gemini</b> chat session with a fixed system instruction (veterinary-adjacent, safety-conscious). It does not run YOLO; it reasons over <b>text</b> only—pair it with Precision Scan or YOLO Segment when users have already identified a breed.
                            </p>
                        </section>

                        <section id="mode-live-vision" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                <Radio className="w-7 h-7 text-emerald-500 shrink-0" />
                                Live Vision
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>What it is:</b> A <b>live</b> multimodal assistant: microphone + camera stream with spoken responses, aimed at hands-free barn or field use.
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                <b>How it works:</b> The client opens <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">getUserMedia</code> (audio + ~640×480 video) and connects to the <b>Gemini Live</b> WebSocket-style API (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">ai.live.connect</code>) with native-audio preview. Video frames can be sampled to the model for visual context while the assistant replies in streaming audio—not the same code path as the offline YOLO <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">best.pt</code> server.
                            </p>
                        </section>

                        <section id="system-architecture" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center">
                                <Workflow className="w-6 h-6 mr-3 text-blue-500" />
                                System architecture
                            </h2>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>
                                    <div className="relative z-10 flex flex-col items-center text-center bg-white dark:bg-slate-900 p-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4 text-slate-500">
                                            <Smartphone className="w-8 h-8" />
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Client (React + Vite)</h4>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center text-center bg-white dark:bg-slate-900 p-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mb-4 text-emerald-600 animate-pulse">
                                            <GitBranch className="w-6 h-6" />
                                        </div>
                                        <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-600">Router</h4>
                                    </div>
                                    <div className="flex flex-col gap-6 w-full md:w-auto">
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">Edge</div>
                                                <div className="text-xs text-slate-500">TF.js · Teachable Machine</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                                                <Layers className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">Local YOLO</div>
                                                <div className="text-xs text-slate-500">FastAPI · Ultralytics</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                                <Database className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">Cloud</div>
                                                <div className="text-xs text-slate-500">Gemini vision & chat</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="core-technologies" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Cpu className="w-6 h-6 mr-3 text-purple-500" />
                                Technology stack
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-black/5">
                                    <h3 className="font-bold text-lg mb-3 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                                        YOLO (Ultralytics · run_ultimate)
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">model/best.pt</code> — YOLOv11-class XL, 640², segment/detection heads; metrics and plots on this page come from the same training lineage.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400">Detection</span>
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400">Segmentation</span>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-black/5">
                                    <h3 className="font-bold text-lg mb-3 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                                        Gemini
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                                        Multimodal API for Precision Scan, chat, and optional breed blurbs on YOLO detections—prompted for JSON or natural language as needed.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400">Vision</span>
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-600 dark:text-slate-400">Chat</span>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-black/5 md:col-span-2">
                                    <h3 className="font-bold text-lg mb-3 flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                                        TensorFlow.js
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                                        Teachable Machine image models in the browser (WebGL/WASM) for Fast mode in Precision Scan—small footprint, no server round-trip.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section id="yolo" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center flex-wrap gap-2">
                                <Layers className="w-6 h-6 text-emerald-500 shrink-0" />
                                <span>YOLO training —</span>
                                <code className="text-lg font-mono text-emerald-600 dark:text-emerald-400">run_ultimate</code>
                            </h2>
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    The detector was trained on a corpus built by <b>combining multiple cattle and buffalo datasets</b> (different sources and splits merged into a single label space). Where raw sources left some breeds short of quality or count targets, the pipeline added <b>synthetic and heavily augmented samples</b> so classes could meet minimum thresholds before balancing—reducing collapse on rare breeds and stabilizing validation metrics for the full 73-class head.
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Training used <b>dataset_v2.yaml</b> on <b>27,751</b> images with Ultralytics defaults (<b>AdamW</b>). Early stopping near <b>epoch 161</b> (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">patience=30</code>, max <b>300</b> epochs).
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                                    <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                                        <li>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">Architecture:</span> YOLOv11x-class
                                        </li>
                                        <li>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">Resolution:</span> 640 × 640
                                        </li>
                                        <li>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">Batch:</span> 4
                                        </li>
                                    </ul>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Augmentations</p>
                                        <ul className="space-y-1 text-slate-600 dark:text-slate-400 list-disc list-inside">
                                            <li>Mosaic (1.0)</li>
                                            <li>Mixup (0.1)</li>
                                            <li>Horizontal flip (0.5)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section id="dataset" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Database className="w-6 h-6 mr-3 text-sky-500" />
                                Dataset preparation & balancing
                            </h2>
                            <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-slate-600 dark:text-slate-300">
                                <p>
                                    Raw data came from <b>several merged datasets</b>; <b>synthetic / generated imagery and strong augmentation</b> were used where needed so under-represented breeds could reach the minimum bar for training and evaluation. After that, <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">balance_dataset.py</code> targeted <b>~400 images per breed</b> via oversampling. <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">prepare_data_v2.py</code> used a base <b>YOLOv8</b> cropper; low-confidence crops were dropped, so some classes remain below 400.
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Tally export: <code className="text-xs">dataset_counts.csv</code>.
                                </p>
                            </div>
                            <details className="mt-6 group">
                                <summary className="cursor-pointer text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                                    Breed image counts (snapshot)
                                </summary>
                                <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-900 text-emerald-100/90 text-[11px] leading-relaxed p-4 font-mono border border-slate-700">
                                    {DATASET_COUNT_SNAPSHOT}
                                </pre>
                            </details>
                        </section>

                        <section id="performance-metrics" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
                                Validation metrics (tabular)
                            </h2>
                            <div className="bg-slate-900 text-white rounded-2xl p-8 overflow-hidden relative">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                                    <div>
                                        <div className="text-4xl font-bold text-emerald-400 mb-1">90.9%</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">mAP50</div>
                                        <div className="text-[10px] text-slate-500 mt-1">0.9097</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-bold text-teal-400 mb-1">88.3%</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">mAP50–95</div>
                                        <div className="text-[10px] text-slate-500 mt-1">0.8837</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-bold text-blue-400 mb-1">91.9%</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Precision</div>
                                        <div className="text-[10px] text-slate-500 mt-1">0.9195</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-bold text-purple-400 mb-1">82.9%</div>
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Recall</div>
                                        <div className="text-[10px] text-slate-500 mt-1">0.8293</div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                Same run as charts in <a href="#summary" className="text-emerald-600 dark:text-emerald-400 underline">Summary</a>. Curve-specific callouts (e.g. F1 peak, P/R vs confidence) are summarized in <a href="#why-yolo" className="text-emerald-600 dark:text-emerald-400 underline">Why YOLO</a>.
                            </p>
                        </section>

                        <section id="project-team" className="scroll-mt-28">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                                <Users className="w-6 h-6 mr-3 text-emerald-500" />
                                Project team
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold text-lg">
                                        KA
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Kushal A M</h3>
                                        <p className="text-emerald-600 text-sm font-medium mb-2">AI & Backend Architect</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                                            YOLO training, FastAPI YOLO service, Teachable Machine integration, Gemini vision backend.
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        VK
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Vignesh K</h3>
                                        <p className="text-blue-600 text-sm font-medium mb-2">Frontend & UI/UX Lead</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                                            React / Vite app, documentation UX, client-side TF.js flows.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
});
