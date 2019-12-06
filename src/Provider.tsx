import React, { useMemo, useEffect } from 'react';
import Context from "./context";
import { Store } from './types';
import BehaviorSubject from './utils/BehaviorSubject';

type Props = {
    store: Store<any>;
    children: React.ReactNode;
}

const Provider: React.FC<Props> = ({ store, children }) => {
    const contextValue = useMemo(() => {
        // 订阅store，并将subject和unsubscribe返回
        const subject = new BehaviorSubject(store.getState());
        const unsubscribe = store.subscribe(() => {
            subject.next(store.getState());
        })

        return {
            store,
            subject,
            unsubscribe,
        }
    }, [store]);

    const previousState = useMemo(() => store.getState(), [store]);

    useEffect(() => {
        // 换了新的store，要通知所有订阅者
        const { subject, unsubscribe } = contextValue;
        if (previousState !== store.getState()) {
            subject.next(store.getState());
        }

        return () => {
            unsubscribe();
        }
    }, [contextValue, previousState]);

    return <Context.Provider value={contextValue}>{children}</Context.Provider>
}

export default Provider;