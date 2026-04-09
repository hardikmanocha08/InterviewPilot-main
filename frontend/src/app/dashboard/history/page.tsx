'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

type InterviewHistoryItem = {
    _id: string;
    role: string;
    experienceLevel: string;
    industryMode: string;
    score: number;
    status: 'in-progress' | 'completed';
    endedReason?: 'manual' | 'timeout' | 'abandoned';
    updatedAt: string;
};

export default function HistoryPage() {
    const [items, setItems] = useState<InterviewHistoryItem[]>([]);
    const [sortBy, setSortBy] = useState<'date' | 'score' | 'role'>('date');
    const [sortValue, setSortValue] = useState<string>('newest');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await api.get('/interviews');
                setItems(response.data);
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        loadHistory();
    }, []);

    const summary = useMemo(() => {
        if (!items.length) {
            return { completed: 0, inProgress: 0, avg: 0 };
        }
        const completed = items.filter((i) => i.status === 'completed');
        const inProgress = items.filter((i) => i.status === 'in-progress').length;
        const avg = completed.length
            ? completed.reduce((sum, i) => sum + (i.score || 0), 0) / completed.length
            : 0;
        return { completed: completed.length, inProgress, avg };
    }, [items]);

    useEffect(() => {
        if (sortBy === 'date') setSortValue('newest');
        if (sortBy === 'role') setSortValue('all');
        if (sortBy === 'score') setSortValue('all');
    }, [sortBy]);

    const sortedItems = useMemo(() => {
        let result = [...items];

        if (sortBy === 'date') {
            result.sort((a, b) => {
                const diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                return sortValue === 'oldest' ? diff : -diff;
            });
            return result;
        }

        if (sortBy === 'role' && sortValue !== 'all') {
            result = result.filter((item) => item.role === sortValue);
        }

        if (sortBy === 'score' && sortValue !== 'all') {
            result = result.filter((item) => {
                const score = Number(item.score || 0);
                if (sortValue === 'high') return score >= 8;
                if (sortValue === 'medium') return score >= 5 && score < 8;
                return score < 5;
            });
        }

        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return result;
    }, [items, sortBy, sortValue]);

    return (
        <div className="h-full overflow-hidden flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Interview History</h1>
                    <p className="text-xs sm:text-sm md:text-base text-text-muted">Review your interview sessions and trends.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'role')}
                        className="bg-surface border border-border rounded-lg px-3 py-2 md:px-4 text-white text-sm"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="score">Sort by Score</option>
                        <option value="role">Sort by Role</option>
                    </select>
                    <select
                        value={sortValue}
                        onChange={(e) => setSortValue(e.target.value)}
                        className="bg-surface border border-border rounded-lg px-3 py-2 md:px-4 text-white text-sm"
                    >
                        {sortBy === 'date' && (
                            <>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </>
                        )}
                        {sortBy === 'role' && (
                            <>
                                <option value="all">All Roles</option>
                                <option value="Frontend">Frontend</option>
                                <option value="Backend">Backend</option>
                                <option value="Fullstack">Fullstack</option>
                                <option value="Data Science">Data Science</option>
                            </>
                        )}
                        {sortBy === 'score' && (
                            <>
                                <option value="all">All Scores</option>
                                <option value="high">High (8-10)</option>
                                <option value="medium">Medium (5-7.9)</option>
                                <option value="low">Low (0-4.9)</option>
                            </>
                        )}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
                <div className="bg-surface border border-border rounded-lg md:rounded-xl p-3 md:p-4">
                    <p className="text-text-muted text-xs md:text-sm">Completed</p>
                    <p className="text-xl md:text-2xl text-white font-bold">{summary.completed}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg md:rounded-xl p-3 md:p-4">
                    <p className="text-text-muted text-xs md:text-sm">In-progress</p>
                    <p className="text-xl md:text-2xl text-white font-bold">{summary.inProgress}</p>
                </div>
                <div className="bg-surface border border-border rounded-lg md:rounded-xl p-3 md:p-4">
                    <p className="text-text-muted text-xs md:text-sm">Average score</p>
                    <p className="text-xl md:text-2xl text-white font-bold">{summary.avg.toFixed(2)}/10</p>
                </div>
            </div>

            <div className="bg-surface border border-border rounded-lg md:rounded-2xl overflow-hidden flex-1 min-h-0">
                <div className="divide-y divide-border overflow-y-auto h-full">
                    {loading ? (
                        <div className="p-4 md:p-6 text-text-muted text-sm">Loading history...</div>
                    ) : sortedItems.length === 0 ? (
                        <div className="p-4 md:p-6 text-text-muted text-sm">No interview history yet.</div>
                    ) : (
                        sortedItems.map((item) => (
                            <div key={item._id} className="p-3 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-white font-medium text-sm md:text-base">{item.role}</p>
                                    <p className="text-text-muted text-xs md:text-sm truncate">
                                        {item.experienceLevel} | {item.industryMode} | {new Date(item.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between md:flex-col md:items-end gap-3 md:gap-0">
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-xs text-text-muted capitalize">{item.status}</p>
                                            <p className="text-base md:text-lg font-bold text-accent">{Number(item.score || 0).toFixed(1)}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/dashboard/history/${item._id}`}
                                        className="inline-block text-xs md:text-sm text-primary hover:text-primary-hover whitespace-nowrap"
                                    >
                                        View
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
