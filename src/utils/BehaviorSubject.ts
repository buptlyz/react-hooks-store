export type Listener<T> = (value?: T) => void;

export default class BehaviorSubject<T = any> {
    private currentValue: T | undefined;
    private listeners: Listener<T>[]

    constructor(preloadedValue?: T) {
        this.currentValue = preloadedValue;
        this.listeners = [];
    }

    get value() {
        return this.currentValue;
    }
    
    public next(newValue?: T): void {
        this.currentValue = newValue;

        for (const listener of this.listeners) {
            try {
                listener(newValue);
            } catch (err) {
                throw err;
            }
        }
    }

    public subscribe(listener: Listener<T>) {
        if (typeof listener !== 'function') return;
        if (this.listeners.includes(listener)) return;
        
        let isSubscribed = true;
        this.listeners.push(listener);

        return () => {
            if (!isSubscribed) return;

            this.listeners.splice(this.listeners.findIndex(item => listener === item), 1);
        }
    }
}