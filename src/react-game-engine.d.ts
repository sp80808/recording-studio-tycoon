declare module 'react-game-engine' {
    import { Component } from 'react';

    export interface GameEngineProps {
        systems?: any[];
        entities?: object | Promise<object>;
        renderer?: (entities: any, screen: any) => void;
        timer?: any;
        running?: boolean;
        onEvent?: (event: any) => void;
        style?: React.CSSProperties;
        className?: string;
        children?: React.ReactNode;
    }

    export class GameEngine extends Component<GameEngineProps> {
        stop(): void;
        start(): void;
        swap(entities: object | Promise<object>): void;
        dispatch(event: any): void;
    }
}
