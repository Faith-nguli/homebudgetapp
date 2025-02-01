import React from "react";

const Button = ({ children, onClick, variant = "default", className = "" }) => {
    const baseStyle = "px-4 py-2 rounded-md transition";
    const variants = {
        default: "bg-blue-500 text-white hover:bg-blue-600",
        outline: "border border-gray-400 text-gray-700 hover:bg-gray-100",
        destructive: "bg-red-500 text-white hover:bg-red-600"
    };

    return (
        <button 
            onClick={onClick} 
            className={`${baseStyle} ${variants[variant] || variants.default} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
