import { Dispatch } from 'react';

export type Store<State> = {
    getState: () => State,
    subscribe: (listener: () => void) => () => void;
    dispatch: Dispatch<Partial<State>>
};