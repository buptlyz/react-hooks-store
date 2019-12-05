import Context from './context';
import { useContext } from 'react';

export default function useStore() {
    const { store } = useContext(Context);
    return store;
}