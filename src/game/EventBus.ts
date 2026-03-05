type Listener = (...args: unknown[]) => void;

const _listeners = new Map<string, Set<Listener>>();

export const EventBus = {
    on(event: string, fn: Listener): void {
        if (!_listeners.has(event)) _listeners.set(event, new Set());
        _listeners.get(event)!.add(fn);
    },

    emit(event: string, ...args: unknown[]): void {
        _listeners.get(event)?.forEach((fn) => fn(...args));
    },

    removeListener(event: string, fn: Listener): void {
        _listeners.get(event)?.delete(fn);
    },
};
