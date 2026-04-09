'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { FiSend, FiCheckCircle, FiChevronRight, FiAlertCircle, FiBarChart2, FiThumbsUp, FiTrendingDown, FiXCircle } from 'react-icons/fi';

type EndReason = 'manual' | 'timeout' | 'abandoned';

export default function InterviewRoom() {
    const { id } = useParams();
    const router = useRouter();

    const [interview, setInterview] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answerInput, setAnswerInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasFinalizedRef = useRef(false);
    const timerExpiredRef = useRef(false);
    const canAbandonOnUnmountRef = useRef(false);

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                const res = await api.get(`/interviews/${id}`);
                const normalizedInterview = {
                    ...res.data,
                    interviewMode: res.data?.interviewMode === 'untimed' ? 'untimed' : 'timed',
                    perQuestionTimeSeconds:
                        Number(res.data?.perQuestionTimeSeconds) > 0
                            ? Number(res.data.perQuestionTimeSeconds)
                            : 180,
                };
                setInterview(normalizedInterview);
                if (normalizedInterview.status === 'completed') {
                    router.replace(`/dashboard/history/${id}`);
                    return;
                }
                canAbandonOnUnmountRef.current = true;
                if (normalizedInterview.interviewMode === 'timed') {
                    setTimeLeftSeconds(normalizedInterview.perQuestionTimeSeconds);
                } else {
                    setTimeLeftSeconds(null);
                }
            } catch (error) {
                console.error("Failed to fetch interview session:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSessionData();
        }

    }, [id, router]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [interview?.questions, evaluating]);

    useEffect(() => {
        if (!interview || interview.interviewMode === 'untimed') {
            return;
        }

        // Guard timeout handling during question transition until the new timer value is rendered.
        timerExpiredRef.current = true;
        setTimeLeftSeconds(interview.perQuestionTimeSeconds || 180);
    }, [currentQuestionIndex, interview]);

    useEffect(() => {
        if (!interview || interview.interviewMode === 'untimed' || timeLeftSeconds === null) {
            return;
        }

        if (timeLeftSeconds > 0) {
            timerExpiredRef.current = false;
        }
    }, [timeLeftSeconds, interview]);

    useEffect(() => {
        if (!interview || interview.interviewMode === 'untimed' || timeLeftSeconds === null || hasFinalizedRef.current) {
            return;
        }
        if (timeLeftSeconds <= 0) {
            return;
        }

        const interval = setInterval(() => {
            setTimeLeftSeconds((prev) => (prev === null ? null : Math.max(0, prev - 1)));
        }, 1000);

        return () => clearInterval(interval);
    }, [interview, timeLeftSeconds]);

    useEffect(() => {
        if (!interview || interview.interviewMode === 'untimed' || timeLeftSeconds !== 0 || timerExpiredRef.current || hasFinalizedRef.current) {
            return;
        }

        timerExpiredRef.current = true;
        void handleTimerExpired();
    }, [timeLeftSeconds, interview]);

    useEffect(() => {
        if (!interview || interview.status === 'completed') {
            return;
        }

        const onBeforeUnload = () => {
            if (hasFinalizedRef.current) {
                return;
            }
            hasFinalizedRef.current = true;
            finishWithBeacon('abandoned');
        };

        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('pagehide', onBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('pagehide', onBeforeUnload);
        };
    }, [interview]);

    useEffect(() => {
        return () => {
            if (!id || hasFinalizedRef.current || !canAbandonOnUnmountRef.current) {
                return;
            }
            hasFinalizedRef.current = true;
            finishWithBeacon('abandoned');
        };
    }, [id]);

    const submitCurrentAnswer = async (answerText: string) => {
        if (!interview || !answerText.trim()) {
            return false;
        }

        setEvaluating(true);
        const currentQ = interview.questions[currentQuestionIndex];

        try {
            const response = await api.post(`/interviews/${id}/answer`, {
                questionId: currentQ._id,
                answerText: answerText.trim(),
            });

            const updatedQuestions = [...interview.questions];
            updatedQuestions[currentQuestionIndex] = response.data;
            setInterview({ ...interview, questions: updatedQuestions });
            setAnswerInput('');
            return true;
        } catch (error) {
            console.error('Failed to submit answer', error);
            alert('Error evaluating answer.');
            return false;
        } finally {
            setEvaluating(false);
        }
    };

    // Submit logic
    const handleAnswerSubmit = async () => {
        if (finishing) {
            return;
        }
        const didSubmit = await submitCurrentAnswer(answerInput);
        if (!didSubmit || !interview) {
            return;
        }

        // Timed mode is flow-driven: no per-question analysis screen between questions.
        if (interview.interviewMode !== 'untimed') {
            if (currentQuestionIndex < interview.questions.length - 1) {
                setCurrentQuestionIndex((curr) => curr + 1);
            } else {
                await handleFinishInterview('manual');
            }
        }
    };

    const handleNextQuestion = () => {
        if (finishing) {
            return;
        }
        if (currentQuestionIndex < interview.questions.length - 1) {
            setCurrentQuestionIndex(curr => curr + 1);
        }
    };

    const buildFinishUrl = (reason: EndReason) => {
        const baseURL = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : '/api';
        const apiBase = baseURL.startsWith('http')
            ? baseURL
            : `${window.location.origin}${baseURL.startsWith('/') ? baseURL : `/${baseURL}`}`;
        return `${apiBase}/interviews/${id}/finish?endedReason=${reason}`;
    };

    const finishWithBeacon = (reason: EndReason) => {
        const url = buildFinishUrl(reason);
        if (navigator.sendBeacon) {
            navigator.sendBeacon(url);
            return;
        }
        fetch(url, { method: 'POST', keepalive: true, credentials: 'include' }).catch(() => undefined);
    };

    const handleFinishInterview = async (reason: EndReason = 'manual') => {
        if (hasFinalizedRef.current) {
            return;
        }
        hasFinalizedRef.current = true;
        setFinishing(true);
        try {
            await api.post(`/interviews/${id}/finish`, { endedReason: reason });
            router.push(`/dashboard/history/${id}`);
        } catch (e) {
            console.error(e);
            hasFinalizedRef.current = false;
        } finally {
            setFinishing(false);
        }
    };

    const handleTimerExpired = async () => {
        if (!interview || hasFinalizedRef.current) {
            return;
        }

        const typedAnswer = answerInput.trim();
        const currentQuestion = interview.questions[currentQuestionIndex];
        const alreadyAnswered = Boolean(currentQuestion?.userAnswer);

        if (!alreadyAnswered && typedAnswer) {
            await submitCurrentAnswer(typedAnswer);
        }

        if (currentQuestionIndex < interview.questions.length - 1) {
            setAnswerInput('');
            setCurrentQuestionIndex((curr) => curr + 1);
            return;
        }

        await handleFinishInterview('timeout');
    };

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading Interview Environment...</div>;

    if (!interview) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <FiAlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl text-white font-bold mb-2">Error Loading Session</h2>
                <p className="text-text-muted mb-4">Please return to the dashboard and try starting a new interview.</p>
                <button onClick={() => router.push('/dashboard')} className="bg-primary text-white px-6 py-2 rounded-lg">Return Home</button>
            </div>
        )
    }

    const currentQ = interview.questions[currentQuestionIndex];
    const isAnswered = !!currentQ.userAnswer;
    const minutes = timeLeftSeconds !== null ? Math.floor(timeLeftSeconds / 60) : 0;
    const seconds = timeLeftSeconds !== null ? timeLeftSeconds % 60 : 0;
    const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;
    const timerPercent = interview.interviewMode !== 'untimed' && interview.perQuestionTimeSeconds
        ? Math.max(0, Math.min(100, Math.round(((timeLeftSeconds || 0) / interview.perQuestionTimeSeconds) * 100)))
        : 0;

    return (
        <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden relative">
            {/* Left panel: Info  & Progress - Mobile: Top, Desktop: Left */}
            <div className="w-full md:w-1/3 bg-surface border-b md:border-b-0 md:border-r border-border p-3 md:p-6 flex flex-col h-auto md:h-full overflow-hidden order-first md:order-none">
                <div className="mb-4 md:mb-8">
                    <div className="flex items-center justify-between gap-3 mb-1">
                        <h2 className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider">Interview</h2>
                        <button
                            onClick={() => handleFinishInterview('manual')}
                            disabled={finishing}
                            className="bg-red-500 hover:bg-red-600 disabled:opacity-70 text-white px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-semibold shadow-lg text-xs md:text-sm flex items-center space-x-1 whitespace-nowrap"
                        >
                            <FiXCircle className="w-3 md:w-4 h-3 md:h-4" />
                            <span className="hidden sm:inline">{finishing ? 'Ending...' : 'End Test'}</span>
                            <span className="sm:hidden">{finishing ? 'End...' : 'End'}</span>
                        </button>
                    </div>
                    <h1 className="text-lg md:text-2xl font-bold text-white mb-1 md:mb-2">{interview.role}</h1>
                    <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-text-muted flex-wrap">
                        <span className="bg-white/10 px-2 py-0.5 md:py-1 rounded">{interview.experienceLevel}</span>
                        <span>|</span>
                        <span className="capitalize">{interview.interviewMode}</span>
                        {interview.interviewMode !== 'untimed' && timeLeftSeconds !== null && (
                            <>
                                <span>|</span>
                                <span className={`font-semibold ${timeLeftSeconds <= 20 ? 'text-red-400' : 'text-accent'}`}>
                                    {formattedTime} left
                                </span>
                            </>
                        )}
                        <span>|</span>
                        <span>Q{currentQuestionIndex + 1}/{interview.questions.length}</span>
                    </div>
                </div>

                {/* Progress List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 md:space-y-4 hidden md:flex md:flex-col">
                    {interview.questions.map((q: any, idx: number) => (
                        <div
                            key={idx}
                            className={`p-3 md:p-4 rounded-lg md:rounded-xl border text-xs md:text-sm transition-colors ${idx === currentQuestionIndex ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}
                        >
                            <div className="flex items-center justify-between mb-1 md:mb-2">
                                <span className={`font-medium ${idx === currentQuestionIndex ? 'text-primary' : 'text-text-muted'}`}>
                                    Q{idx + 1}
                                </span>
                                {q.userAnswer && <FiCheckCircle className="text-green-500 w-4 h-4" />}
                            </div>
                            <p className="text-white line-clamp-2">{q.questionText}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel: Chat / Interaction Area - Mobile: Middle/Bottom, Desktop: Right */}
            <div className="w-full md:w-2/3 flex flex-col h-full order-last">
                {interview.interviewMode !== 'untimed' && timeLeftSeconds !== null && (
                    <div className="px-3 md:px-6 pt-3 md:pt-6 hidden md:block">
                        <div className="bg-surface border border-border rounded-lg md:rounded-2xl p-3 md:p-4">
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <p className="text-xs md:text-sm text-text-muted">Question Timer</p>
                                <p className={`text-xl md:text-2xl font-bold ${timeLeftSeconds <= 20 ? 'text-red-400' : 'text-primary'}`}>
                                    {formattedTime}
                                </p>
                            </div>
                            <div className="h-1.5 md:h-2 w-full bg-background rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${timeLeftSeconds <= 20 ? 'bg-red-500' : 'bg-primary'}`}
                                    style={{ width: `${timerPercent}%` }}
                                />
                            </div>
                            <p className="text-xs text-text-muted mt-1 md:mt-2">
                                Time up auto-skips. Last Q auto-submits.
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-10 space-y-4 md:space-y-8">

                    {/* AI Question Bubble */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col space-y-1 md:space-y-2"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">AI</div>
                            <span className="text-xs md:text-sm font-medium text-text-muted">Interviewer</span>
                        </div>
                        <div className="bg-surface border border-border p-3 md:p-5 rounded-lg md:rounded-2xl rounded-tl-sm text-white text-base md:text-lg leading-relaxed">
                            {currentQ.questionText}
                        </div>
                    </motion.div>

                    {/* User Answer Bubble (if answered) */}
                    <AnimatePresence>
                        {isAnswered && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col space-y-1 md:space-y-2 self-end ml-auto max-w-full md:max-w-2xl"
                            >
                                <div className="flex items-center space-x-2 justify-end">
                                    <span className="text-xs md:text-sm font-medium text-text-muted">You</span>
                                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-border flex items-center justify-center text-white text-xs font-bold">U</div>
                                </div>
                                <div className="bg-primary/20 border border-primary/30 p-3 md:p-5 rounded-lg md:rounded-2xl rounded-tr-sm text-white text-sm md:text-base leading-relaxed">
                                    {currentQ.userAnswer}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* AI Feedback Bubble (if answered) */}
                    <AnimatePresence>
                        {isAnswered && currentQ.feedback && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="pt-2 md:pt-4 max-w-full"
                            >
                                <div className="bg-surface border border-border rounded-lg md:rounded-2xl p-3 md:p-6 shadow-lg">
                                    <div className="flex items-center justify-between border-b border-border pb-2 md:pb-4 mb-2 md:mb-4 gap-2">
                                        <h3 className="text-sm md:text-lg font-bold text-white flex items-center space-x-1 md:space-x-2 min-w-0">
                                            <FiBarChart2 className="w-4 md:w-5 h-4 md:h-5 text-accent flex-shrink-0" />
                                            <span className="truncate">Evaluation</span>
                                        </h3>
                                        <div className="bg-background px-2 md:px-4 py-0.5 md:py-1.5 rounded-full border border-border flex-shrink-0">
                                            <span className="text-xs md:text-sm text-text-muted">Score: </span>
                                            <span className="text-base md:text-lg font-bold text-accent">{currentQ.score}/10</span>
                                        </div>
                                    </div>

                                    <p className="text-white mb-3 md:mb-6 leading-relaxed text-sm md:text-base">{currentQ.feedback}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                                        <div className="bg-green-500/10 border border-green-500/20 p-3 md:p-4 rounded-lg md:rounded-xl">
                                            <h4 className="text-green-500 font-semibold mb-1 md:mb-2 flex items-center space-x-1 text-xs md:text-sm">
                                                <FiThumbsUp className="w-3 md:w-4 h-3 md:h-4" />
                                                <span>Strengths</span>
                                            </h4>
                                            <ul className="list-disc list-inside text-xs md:text-sm text-green-200 space-y-0.5 md:space-y-1">
                                                {currentQ.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>

                                        <div className="bg-red-500/10 border border-red-500/20 p-3 md:p-4 rounded-lg md:rounded-xl">
                                            <h4 className="text-red-500 font-semibold mb-1 md:mb-2 flex items-center space-x-1 text-xs md:text-sm">
                                                <FiTrendingDown className="w-3 md:w-4 h-3 md:h-4" />
                                                <span>Improve</span>
                                            </h4>
                                            <ul className="list-disc list-inside text-xs md:text-sm text-red-200 space-y-0.5 md:space-y-1">
                                                {currentQ.weaknesses?.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Evaluating State Loader */}
                    {evaluating && (
                        <div className="flex items-center space-x-2 text-text-muted italic animate-pulse text-xs md:text-base">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] flex-shrink-0">AI</div>
                            <span>Analyzing...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 md:p-6 border-t border-border bg-surface/50 backdrop-blur-md">
                    {!isAnswered ? (
                        <div className="relative flex flex-col items-end gap-2">
                            <textarea
                                value={answerInput}
                                onChange={(e) => setAnswerInput(e.target.value)}
                                placeholder="Type your answer..."
                                disabled={evaluating || finishing}
                                className="w-full bg-background border border-border rounded-lg md:rounded-xl px-3 md:px-4 py-3 md:py-4 pr-12 md:pr-16 text-white focus:outline-none focus:border-primary resize-none min-h-[80px] md:min-h-[120px] transition-colors text-sm md:text-base"
                            />

                            <button
                                onClick={handleAnswerSubmit}
                                disabled={evaluating || finishing || !answerInput.trim()}
                                className="p-2 md:p-3 bg-primary hover:bg-primary-hover disabled:bg-border disabled:text-text-muted text-white rounded-lg transition-colors absolute bottom-3 md:bottom-4 right-3 md:right-4"
                                title="Submit Answer"
                            >
                                <FiSend className="w-4 md:w-5 h-4 md:h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2 md:gap-4">
                            {currentQuestionIndex < interview.questions.length - 1 ? (
                                <button
                                    onClick={handleNextQuestion}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-colors flex items-center space-x-1 md:space-x-2 text-sm md:text-base"
                                >
                                    <span>Next</span>
                                    <FiChevronRight className="w-4 md:w-5 h-4 md:h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleFinishInterview('manual')}
                                    disabled={finishing}
                                    className="bg-accent hover:bg-green-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl font-bold transition-colors shadow-lg shadow-green-500/20 text-sm md:text-base"
                                >
                                    {finishing ? "Finishing..." : "Complete"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
