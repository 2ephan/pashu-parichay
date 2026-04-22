import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, Radio, Activity, X, Video, VideoOff } from 'lucide-react';
import { aiClient } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';

export const LiveAssistant: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [status, setStatus] = useState("Ready to connect");
    
    // Audio Context Refs
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const sessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    // Video Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoIntervalRef = useRef<number | null>(null);

    // State to track if component is mounted/active to prevent race conditions
    const isActiveRef = useRef<boolean>(false);

    const connect = async () => {
        if (isActiveRef.current) return; // Prevent double connection
        isActiveRef.current = true;
        
        try {
            setStatus("Connecting...");
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            inputAudioContextRef.current = inputCtx;
            outputAudioContextRef.current = outputCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: true, 
                video: { width: 640, height: 480, frameRate: 15 } 
            });
            mediaStreamRef.current = stream;

            // Setup local video preview
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.error("Video play error:", e));
            }

            const sessionPromise = aiClient.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        if (!isActiveRef.current) {
                            // If cleanup happened during connection, close immediately
                             sessionPromise.then(s => s.close()); // Try to close if possible, or just ignore
                             return;
                        }

                        setStatus("Live (Video & Audio)");
                        setIsConnected(true);
                        
                        // Setup Audio Input Stream
                        const source = inputCtx.createMediaStreamSource(stream);
                        sourceRef.current = source;
                        
                        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processorRef.current = processor;
                        
                        processor.onaudioprocess = (e) => {
                            if (isMuted || !isActiveRef.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                if (isActiveRef.current) {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                }
                            });
                        };
                        
                        source.connect(processor);
                        processor.connect(inputCtx.destination);

                        // Setup Video Input Stream (Images)
                        startVideoStreaming(sessionPromise);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                         if (!isActiveRef.current) return;

                         const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                         if (base64Audio && outputCtx && outputCtx.state !== 'closed') {
                             try {
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                                const source = outputCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputCtx.destination);
                                
                                const currentTime = outputCtx.currentTime;
                                const startTime = Math.max(nextStartTimeRef.current, currentTime);
                                source.start(startTime);
                                nextStartTimeRef.current = startTime + audioBuffer.duration;
                                
                                audioSourcesRef.current.add(source);
                                source.onended = () => audioSourcesRef.current.delete(source);
                             } catch (e) {
                                 console.error("Audio decode error", e);
                             }
                         }
                         
                         if (message.serverContent?.interrupted) {
                             audioSourcesRef.current.forEach(s => {
                                 try { s.stop(); } catch(e) {}
                             });
                             audioSourcesRef.current.clear();
                             nextStartTimeRef.current = 0;
                         }
                    },
                    onclose: () => {
                        console.log("Session closed");
                        if (isActiveRef.current) {
                            setStatus("Disconnected");
                            setIsConnected(false);
                            cleanup();
                        }
                    },
                    onerror: (e) => {
                        console.error("Session error:", e);
                        if (isActiveRef.current) {
                            setStatus("Error occurred");
                            setIsConnected(false);
                            cleanup();
                        }
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                    },
                    systemInstruction: "You are a friendly expert veterinary assistant. You can see the video feed. Identify cattle breeds and health issues you see. Be concise."
                }
            });
            sessionRef.current = sessionPromise;

        } catch (e: any) {
            console.error("Connection setup error:", e);
            setStatus(e?.message || "Connection failed");
            cleanup();
        }
    };

    const startVideoStreaming = (sessionPromise: Promise<any>) => {
        if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
        
        // Stream at 2 FPS to save bandwidth while keeping context
        videoIntervalRef.current = window.setInterval(() => {
            if (!isVideoEnabled || !videoRef.current || !canvasRef.current || !isActiveRef.current) return;
            
            const context = canvasRef.current.getContext('2d');
            if (!context) return;

            canvasRef.current.width = videoRef.current.videoWidth * 0.5; // Scale down for performance
            canvasRef.current.height = videoRef.current.videoHeight * 0.5;
            
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            
            const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];
            
            sessionPromise.then((session) => {
                if (isActiveRef.current) {
                    session.sendRealtimeInput({ 
                        media: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        } 
                    });
                }
            });
        }, 500); // 500ms = 2 FPS
    };

    const cleanup = () => {
        isActiveRef.current = false;
        setIsConnected(false);
        
        // Stop media tracks
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        
        // Disconnect audio nodes
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        
        // Close audio contexts safely
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
             inputAudioContextRef.current.close().catch(e => console.error("InputCtx close error", e));
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             outputAudioContextRef.current.close().catch(e => console.error("OutputCtx close error", e));
        }
        
        // Stop audio sources
        audioSourcesRef.current.forEach(s => {
            try { s.stop(); } catch(e) {}
        });
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        
        // Clear video interval
        if (videoIntervalRef.current) {
            clearInterval(videoIntervalRef.current);
            videoIntervalRef.current = null;
        }

        // Close session if possible (wrapper specific)
        // sessionRef.current?.then(s => s.close()).catch(e => {});
    };

    const disconnect = () => {
         cleanup();
         setStatus("Disconnected");
    };

    // Helper functions
    function createBlob(data: Float32Array) {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = data[i] * 32768;
        }
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
             binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        return {
            data: b64,
            mimeType: 'audio/pcm;rate=16000'
        };
    }

    function decode(base64: string) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    }

    useEffect(() => {
        return () => cleanup();
    }, []);

    return (
        <div className="max-w-2xl mx-auto pt-24 pb-8 px-4">
             <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-colors">
                 <div className="bg-slate-900 p-4 text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 to-transparent"></div>
                     <h2 className="text-white text-lg font-bold relative z-10 flex items-center justify-center gap-2">
                        <Video className="w-5 h-5 text-emerald-400" />
                        Live Vet Assistant
                     </h2>
                     <p className="text-slate-400 text-xs relative z-10">{status}</p>
                 </div>
                 
                 <div className="relative bg-black h-[400px] flex items-center justify-center overflow-hidden">
                     {/* Video Preview */}
                     <video 
                        ref={videoRef} 
                        muted 
                        playsInline 
                        className={`w-full h-full object-cover ${!isConnected ? 'opacity-50 grayscale' : ''}`} 
                     />
                     <canvas ref={canvasRef} className="hidden" />

                     {!isConnected && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <button 
                                onClick={connect}
                                className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-500 transition-all flex items-center shadow-lg transform hover:scale-105"
                            >
                                <Radio className="w-5 h-5 mr-2 animate-pulse" />
                                Start Live Consultation
                            </button>
                         </div>
                     )}
                     
                     {/* Controls Overlay */}
                     {isConnected && (
                         <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                             <button 
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-4 rounded-full transition-all shadow-lg backdrop-blur-md ${isMuted ? 'bg-red-500/90 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                             >
                                {isMuted ? <MicOff /> : <Mic />}
                             </button>
                             
                             <button 
                                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                                className={`p-4 rounded-full transition-all shadow-lg backdrop-blur-md ${!isVideoEnabled ? 'bg-red-500/90 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                             >
                                {!isVideoEnabled ? <VideoOff /> : <Video />}
                             </button>

                             <button 
                                onClick={disconnect}
                                className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                             >
                                <X className="w-6 h-6" />
                             </button>
                         </div>
                     )}
                 </div>
                 
                 <div className="bg-slate-50 dark:bg-slate-800 p-4 text-center border-t border-slate-100 dark:border-slate-700">
                     <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span>Real-time Video & Audio Analysis via Gemini 2.5 Flash</span>
                     </div>
                 </div>
             </div>
        </div>
    );
};