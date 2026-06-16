import React from 'react';

export interface CharacterProps {
  furColor?: string;
  furDark?: string;
  furLight?: string;
  eyeColor?: string;
  eyeShape?: 'round' | 'sleepy' | 'wide';
  accessory?: 'none' | 'ribbon' | 'hat' | 'necklace' | 'glasses';
  accessoryColor?: string;
  className?: string;
}

export default function CatCharacter({
  furColor = '#A89BC0',
  furDark = '#8B7DAE',
  furLight = '#C8BDD8',
  eyeColor = '#2C2C2C',
  eyeShape = 'round',
  accessory = 'none',
  accessoryColor = '#FF6B6B',
  className = '',
}: CharacterProps) {
  return (
    <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
      <g id="cat-body">
        {/* Tail */}
        <path d="M 140 160 Q 190 160 180 110" fill="none" stroke={furColor} strokeWidth="20" strokeLinecap="round" />
        <path d="M 178 120 Q 180 110 180 110" fill="none" stroke={furLight} strokeWidth="20" strokeLinecap="round" />

        {/* Body */}
        <ellipse cx="100" cy="150" rx="55" ry="60" fill={furColor} />
        
        {/* Forelegs */}
        <ellipse cx="75" cy="195" rx="15" ry="20" fill={furLight} />
        <ellipse cx="125" cy="195" rx="15" ry="20" fill={furLight} />
      </g>

      <g id="cat-head">
        {/* Ears */}
        <path d="M 50 60 L 30 10 L 80 40 Z" fill={furColor} strokeLinejoin="round" />
        <path d="M 55 55 L 40 25 L 70 45 Z" fill="#FFAEC9" strokeLinejoin="round" />
        
        <path d="M 150 60 L 170 10 L 120 40 Z" fill={furColor} strokeLinejoin="round" />
        <path d="M 145 55 L 160 25 L 130 45 Z" fill="#FFAEC9" strokeLinejoin="round" />

        {/* Head Base */}
        <circle cx="100" cy="80" r="55" fill={furColor} />

        {/* Stripes */}
        <path d="M 100 30 L 100 45" stroke={furDark} strokeWidth="4" strokeLinecap="round" />
        <path d="M 85 33 L 90 45" stroke={furDark} strokeWidth="4" strokeLinecap="round" />
        <path d="M 115 33 L 110 45" stroke={furDark} strokeWidth="4" strokeLinecap="round" />

        {/* Eyes */}
        {eyeShape === 'round' && (
          <g>
            <circle cx="75" cy="80" r="8" fill={eyeColor} />
            <circle cx="72" cy="77" r="2.5" fill="white" />
            <circle cx="125" cy="80" r="8" fill={eyeColor} />
            <circle cx="122" cy="77" r="2.5" fill="white" />
          </g>
        )}
        {eyeShape === 'sleepy' && (
          <g>
            <path d="M 65 80 Q 75 70 85 80" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M 115 80 Q 125 70 135 80" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {eyeShape === 'wide' && (
          <g>
            <circle cx="75" cy="80" r="12" fill={eyeColor} />
            <circle cx="72" cy="75" r="4" fill="white" />
            <circle cx="78" cy="83" r="2" fill="white" />
            <circle cx="125" cy="80" r="12" fill={eyeColor} />
            <circle cx="122" cy="75" r="4" fill="white" />
            <circle cx="128" cy="83" r="2" fill="white" />
          </g>
        )}

        {/* Glasses Accessory */}
        {accessory === 'glasses' && (
          <g>
            <circle cx="75" cy="80" r="18" fill="none" stroke={accessoryColor} strokeWidth="3" />
            <circle cx="125" cy="80" r="18" fill="none" stroke={accessoryColor} strokeWidth="3" />
            <path d="M 93 80 L 107 80" stroke={accessoryColor} strokeWidth="3" />
            <path d="M 57 80 L 40 75" stroke={accessoryColor} strokeWidth="3" />
            <path d="M 143 80 L 160 75" stroke={accessoryColor} strokeWidth="3" />
          </g>
        )}

        {/* Nose */}
        <path d="M 97 95 L 103 95 L 100 99 Z" fill="#FFAEC9" />

        {/* Mouth */}
        <path d="M 90 100 Q 95 105 100 100 Q 105 105 110 100" fill="none" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />

        {/* Whiskers */}
        <path d="M 40 90 L 60 92" stroke={furDark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 35 100 L 60 98" stroke={furDark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 40 110 L 60 104" stroke={furDark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />

        <path d="M 160 90 L 140 92" stroke={furDark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 165 100 L 140 98" stroke={furDark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 160 110 L 140 104" stroke={furDark} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </g>

      <g id="cat-accessories">
        {accessory === 'necklace' && (
          <path d="M 65 130 Q 100 145 135 130" fill="none" stroke={accessoryColor} strokeWidth="6" strokeLinecap="round" />
        )}
        {accessory === 'ribbon' && (
          <g transform="translate(45, 10) rotate(-15)">
            <path d="M 0 0 L -15 -10 L -15 10 Z" fill={accessoryColor} />
            <path d="M 0 0 L 15 -10 L 15 10 Z" fill={accessoryColor} />
            <circle cx="0" cy="0" r="5" fill="#FFF" opacity="0.8" />
          </g>
        )}
        {accessory === 'hat' && (
          <g transform="translate(100, 25)">
            <ellipse cx="0" cy="5" rx="25" ry="5" fill={accessoryColor} />
            <path d="M -15 5 L -10 -15 L 10 -15 L 15 5 Z" fill={accessoryColor} />
            <path d="M -12 -5 L 12 -5" stroke="#FFF" strokeWidth="3" opacity="0.8" />
          </g>
        )}
      </g>
    </svg>
  );
}
