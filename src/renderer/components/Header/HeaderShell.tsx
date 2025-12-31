
import React from 'react';
import './Header.css';
import { ProjectMenu } from './ProjectMenu';
import { TransportControls } from './TransportControls';
import { GlobalActions } from './GlobalActions';
import { WindowControls } from '../WindowControls';

export const HeaderShell: React.FC = () => {
    return (
        <header className="header">
            <div className="header-left">
                <ProjectMenu />
            </div>

            <div className="header-center">
                <TransportControls />
            </div>

            <div className="header-right">
                <GlobalActions />
                <WindowControls />
            </div>
        </header>
    );
};
