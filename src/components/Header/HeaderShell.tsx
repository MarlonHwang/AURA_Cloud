
import React from 'react';
import './Header.css';
import { ProjectMenu } from './ProjectMenu';
import { TransportControls } from './TransportControls';
import { GlobalActions } from './GlobalActions';

export const HeaderShell: React.FC = () => {
    return (
        <header className="header">
            <ProjectMenu />
            <TransportControls />
            <GlobalActions />
        </header>
    );
};
