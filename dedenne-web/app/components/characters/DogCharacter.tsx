import React from 'react';
import { CharacterProps } from './CatCharacter';

export default function DogCharacter({
  furColor = '#C8A882',
  furDark = '#A07850',
  furLight = '#E8D5B8',
  eyeColor = '#2C2C2C',
  eyeShape = 'round',
  accessory = 'none',
  accessoryColor = '#3B82F6',
  className = '',
}: CharacterProps) {
  return (
    <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
      <g id="dog-body">
        {/* Tail (Pointing Up/Wagging slightly) */}
        <path d="M 140 170 Q 170 140 180 80" fill="none" stroke={furColor} strokeWidth="18" strokeLinecap="round" />
        <path d="M 172 100 Q 180 80 180 80" fill="none" stroke={furLight} strokeWidth="18" strokeLinecap="round" />

        {/* Body */}
        <ellipse cx="100" cy="150" rx="55" ry="60" fill={furColor} />
        
        {/* Forelegs */}
        <ellipse cx="75" cy="195" rx="15" ry="20" fill={furLight} />
        <ellipse cx="125" cy="195" rx="15" ry="20" fill={furLight} />
      </g>

      <g id="dog-head">
        {/* Floppy Ears (Behind head or side) */}
        <path d="M 50 60 Q 20 60 25 110 Q 30 130 55 100 Z" fill={furDark} strokeLinejoin="round" />
        <path d="M 150 60 Q 180 60 175 110 Q 170 130 145 100 Z" fill={furDark} strokeLinejoin="round" />

        {/* Head Base */}
        <circle cx="100" cy="80" r="55" fill={furColor} />

        {/* Cheeks */}
        <ellipse cx="65" cy="100" rx="10" ry="6" fill="#FFAEC9" opacity="0.6" />
        <ellipse cx="135" cy="100" rx="10" ry="6" fill="#FFAEC9" opacity="0.6" />

        {/* Eyes */}
        {eyeShape === 'round' && (
          <g>
            <circle cx="75" cy="75" r="8" fill={eyeColor} />
            <circle cx="72" cy="72" r="2.5" fill="white" />
            <circle cx="125" cy="75" r="8" fill={eyeColor} />
            <circle cx="122" cy="72" r="2.5" fill="white" />
          </g>
        )}
        {eyeShape === 'sleepy' && (
          <g>
            <path d="M 65 75 Q 75 65 85 75" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M 115 75 Q 125 65 135 75" fill="none" stroke={eyeColor} strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
        {eyeShape === 'wide' && (
          <g>
            <circle cx="75" cy="75" r="12" fill={eyeColor} />
            <circle cx="72" cy="70" r="4" fill="white" />
            <circle cx="78" cy="78" r="2" fill="white" />
            <circle cx="125" cy="75" r="12" fill={eyeColor} />
            <circle cx="122" cy="70" r="4" fill="white" />
            <circle cx="128" cy="78" r="2" fill="white" />
          </g>
        )}

        {/* Glasses Accessory */}
        {accessory === 'glasses' && (
          <g>
            <circle cx="75" cy="75" r="18" fill="none" stroke={accessoryColor} strokeWidth="3" />
            <circle cx="125" cy="75" r="18" fill="none" stroke={accessoryColor} strokeWidth="3" />
            <path d="M 93 75 L 107 75" stroke={accessoryColor} strokeWidth="3" />
            <path d="M 57 75 L 40 70" stroke={accessoryColor} strokeWidth="3" />
            <path d="M 143 75 L 160 70" stroke={accessoryColor} strokeWidth="3" />
          </g>
        )}

        {/* Nose (Big ellipse) */}
        <ellipse cx="100" cy="95" rx="12" ry="8" fill={eyeColor} />

        {/* Mouth */}
        <path d="M 90 105 Q 95 110 100 105 Q 105 110 110 105" fill="none" stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
      </g>

      <g id="dog-accessories">
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
