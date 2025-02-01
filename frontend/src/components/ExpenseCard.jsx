import React from "react";

const Card = ({ children, className = "" }) => {
    return (
        <div className={`shadow-lg bg-white rounded-xl p-4 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
