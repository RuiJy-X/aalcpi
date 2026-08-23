import type { ImgHTMLAttributes } from 'react';
import logoImg from '../../images/aalcpilogoprint.jpg';

export default function AppLogoIcon({
    className = '',
    alt = 'AALCPI Logo',
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src={logoImg}
            alt={alt}
            className={`object-contain rounded-sm ${className}`}
            {...props}
        />
    );
}
