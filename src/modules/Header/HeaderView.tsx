import React from 'react';
import { TransportBar } from './components/TransportBar';

export const HeaderView: React.FC = () => {
    return (
        <div className="w-full h-full flex flex-col">
            <TransportBar />
        </div>
    );
};
