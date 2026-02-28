'use client';

interface AuroraBackgroundProps {
  intensity?: 'full' | 'subtle';
}

export function AuroraBackground({ intensity = 'full' }: AuroraBackgroundProps) {
  const opacityClass = intensity === 'subtle' ? 'opacity-50' : 'opacity-100';

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none -z-10 ${opacityClass}`}>
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
      <div className="aurora-blob aurora-blob-4" />
    </div>
  );
}
