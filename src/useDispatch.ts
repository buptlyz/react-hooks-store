import useStore from './useStore';

export default function useDispatch() {
    const store = useStore();
    return store.dispatch;
}