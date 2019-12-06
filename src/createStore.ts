import { Reducer } from 'react';
import { Store } from './types';

const defaultReducer = <State>(prevState: State, payload: Partial<State>) => ({ ...prevState, ...payload });

/**
 * 创建一个store 借鉴redux的实现
 * 
 * @param preloadedState 初始状态
 * @returns store subscribe dispatch
 */
export default function createStore<State>(preloadedState: State, reducer: Reducer<State, any> = defaultReducer): Store<State> {
    let currentReducer = reducer;
    let currentState = preloadedState;
    let currentListeners: (() => void)[] | null = [];
    let nextListeners = currentListeners;
    let isDispatching = false;

    // 在更新store的过程中，也可能有监听器注册/移除，这时候监听器队列是锁定的，禁止操作
    // 因此，增加一个副本用来在这种情况下做监听器的注册/移除
    function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
            nextListeners = currentListeners.slice();
        }
    }

    // 提供给外部环境访问state的接口
    function getState() {
        if (isDispatching) {
            // state正在更新中
            // 正常来说不会进入这里，除非dispatch时尝试获取state，这是不必要的
            throw new Error('正在更新state，不要尝试直接从store拿state，在reducer的参数里访问state')
        }

        return currentState;
    }

    /**
     * 注册监听store变化的监听器
     * 
     * @param listener store变化后会执行
     * 
     * 两个警告：
     * 1. store更新进行中添加进来的监听器，不会收到本次更新的通知
     * 2. 监听器内调用dispatch，会触发多次store更新，后添加进来的监听器只会收到最后一次更新后的通知
     */
    function subscribe(listener: () => void) {
        let isSubscribed = true;

        ensureCanMutateNextListeners()
        nextListeners.push(listener);

        return function unsubscribe() {
            if (!isSubscribed) return;
            if (isDispatching) {
                // state正在更新中，listeners队列是锁死的
                throw new Error('正在更新state，这个时候监听器队列是锁定的，不能移除监听器')
            }
            isSubscribed = false;
            ensureCanMutateNextListeners();
            nextListeners.splice(nextListeners.findIndex(listener), 1)
            currentListeners = null;
        }
    }

    // 更新store，并下发通知
    function dispatch(payload: Partial<State>) {
        if (isDispatching) {
            throw new Error('reducer里不要调用dispatch')
        }
        try {
            isDispatching = true;
            currentState = currentReducer(currentState, payload);
        } finally {
            isDispatching = false;
        }

        const listeners = (currentListeners = nextListeners)
        for (const listener of listeners) {
            // https://github.com/reduxjs/redux/issues/303
            listener();
        }
        return payload;
    }

    return {
        getState,
        subscribe,
        dispatch,
    }
}