import React from 'react';

interface ReferenceTagProps {
  id: string;
  name: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function ReferenceTag({ id, name, position = 'top-left' }: ReferenceTagProps) {
  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold z-50 shadow-lg pointer-events-none`}
      data-scratch-ref={id}
      data-scratch-name={name}
    >
      {id}: {name}
    </div>
  );
}
