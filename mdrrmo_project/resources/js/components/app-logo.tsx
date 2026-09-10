import React from 'react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo(props: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props}>
            <AppLogoIcon className="w-8 h-8" />
            <span className="font-bold">MDRRMO</span>
        </div>
    );
}
