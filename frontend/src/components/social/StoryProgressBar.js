'use client';

// Barra de progresso dos stories (segmentos animados)
// Usa animationend para acionar onNext — pausa via animation-play-state
export default function StoryProgressBar({ total, current, duration = 5000, onNext, paused }) {
  return (
    <div className="flex gap-1 px-2 py-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
          <div
            className={`h-full bg-white rounded-full ${i === current ? 'animate-story-progress' : ''}`}
            style={
              i === current
                ? {
                    animationDuration: `${duration}ms`,
                    animationPlayState: paused ? 'paused' : 'running',
                  }
                : { width: i < current ? '100%' : '0' }
            }
            onAnimationEnd={i === current ? onNext : undefined}
          />
        </div>
      ))}
    </div>
  );
}
