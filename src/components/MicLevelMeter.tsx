type MicLevelMeterProps = {
  color: string;
  level: number;
};

export default function MicLevelMeter({ color, level }: MicLevelMeterProps) {
  const activeBars = Math.ceil(Math.max(0, Math.min(1, level)) * 5);

  return (
    <div className="flex items-end gap-1 h-6" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(index => (
        <span
          key={index}
          className="w-2 rounded-full transition-all duration-100"
          style={{
            height: `${8 + index * 4}px`,
            backgroundColor: index < activeBars ? color : '#e5e7eb',
            opacity: index < activeBars ? 0.9 : 0.7,
          }}
        />
      ))}
    </div>
  );
}
