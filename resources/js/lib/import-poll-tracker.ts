// Window-level singleton set to prevent duplicate modal polls across multiple mounted dialogs
const activeJobPolls = new Set<number>();
const completedJobModals = new Set<number>();

export function registerJobPoll(jobId: number): boolean {
    if (activeJobPolls.has(jobId) || completedJobModals.has(jobId)) {
        return false; // Already being polled or modal was shown
    }
    activeJobPolls.add(jobId);
    return true;
}

export function unregisterJobPoll(jobId: number): void {
    activeJobPolls.delete(jobId);
}

export function markJobModalShown(jobId: number): void {
    activeJobPolls.delete(jobId);
    completedJobModals.add(jobId);
}
