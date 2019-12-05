import Context from './context';
import { useEffect, useRef, useContext, useReducer } from 'react';
import shallowequal from 'shallowequal';

// TODO 实现shallowequal
export default function useSelector<State>(selector: (state: State) => any, equalityFn: (a: any, b: any) => boolean = shallowequal) {
    const { store, subject } = useContext(Context);
    const [, forceUpdate] = useReducer(s => s + 1, 0);

    const latestUpdateError = useRef<any>();
    // https://github.com/reduxjs/react-redux/commit/4d3a7e194c09e77206c84aa407b3d9a1bb792326#diff-0a2d9ab9c3fe4ea90b28088602b294ba
    const latestSelector = useRef<(state: State) => any | undefined>();
    const latestSelectedState = useRef<any>();

    let selectedState: any;

    try {
        // 1. selector变化，重新计算
        if (selector !== latestSelector.current || latestUpdateError.current) {
            selectedState = selector(store.getState());
        } else {
            // 2. 用本地的缓存
            selectedState = latestSelectedState.current;
        }
    } catch (err) {
        if (latestUpdateError.current) {
          err.message += `\n错误可能和上次的计算有关:\n${latestUpdateError.current.stack}\n\n`
        }

        throw err;
    }

    useEffect(() => {
        latestUpdateError.current = undefined;
        latestSelector.current = selector;
        latestSelectedState.current = selectedState;
    });

    useEffect(() => {
        function checkForUpdates() {
            try {
                const newSelectedState = latestSelector.current!(store.getState());

                if (equalityFn(newSelectedState, latestSelectedState.current)) return;
                
                latestSelectedState.current = newSelectedState;
            } catch (err) {
                // 在下次组件re-render时抛出，统一抛出错误的时机
                latestUpdateError.current = err;
            }

            forceUpdate(null);
        }

        const unsubscribe = subject.subscribe(checkForUpdates);

        return () => {
            unsubscribe();
        }
    }, [store, subject]);

    return selectedState;
}