import React from 'react';

interface SectionPaddingProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const SectionPadding: React.FC<SectionPaddingProps> = ({ children, className, ...props }) => {
    return (
        <div 
            className={`
                px-4 
                sm:px-6 
                md:px-12 
                lg:px-16 
                xl:px-25
                ${className || ''}
            `}
            {...props}
        >
            {children}
        </div>
    );
};

export default SectionPadding;