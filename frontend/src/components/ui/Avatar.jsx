'use client';

// ============================================================
// Avatar — componente reutilizável para foto de perfil
// Exibe imagem otimizada ou inicial do nome como fallback.
// Substitui ~8 implementações inline espalhadas no projeto.
// ============================================================

import Image from 'next/image';

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const SIZE_PX = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };

/**
 * @param {string}  src       - URL da imagem (opcional)
 * @param {string}  name      - Nome do usuário (usado como fallback e alt)
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {string}  className - Classes extras
 */
export function Avatar({ src, name = '', size = 'md', className = '' }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const px = SIZE_PX[size] || 40;

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden relative ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name || 'Avatar'}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          unoptimized={src.startsWith('blob:') || src.startsWith('data:')}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 dark:text-gray-300">
          {initial}
        </div>
      )}
    </div>
  );
}
