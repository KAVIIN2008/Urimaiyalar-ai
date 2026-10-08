import React from 'react';

interface Spatial3DCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  depth?: number; // kept for API compatibility, unused
}

/**
 * Spatial3DCard - Clean flat card (3D tilt removed for production clarity)
 */
export const Spatial3DCard: React.FC<Spatial3DCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-3xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * Hologram3DOrb - Removed (not rendered)
 */
export const Hologram3DOrb: React.FC<{ size?: number; className?: string }> = () => {
  return null;
};
