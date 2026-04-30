type ManualAnswerControlsProps = {
  color: string;
  value: string;
  visible: boolean;
  promptLabel?: string;
  toggleLabel?: string;
  submitLabel?: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  onSubmit: () => void;
};

export default function ManualAnswerControls({
  color,
  value,
  visible,
  promptLabel = 'Type answer instead',
  toggleLabel = 'Use keyboard instead',
  submitLabel = 'Submit typed answer',
  onChange,
  onToggle,
  onSubmit,
}: ManualAnswerControlsProps) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="text-sm font-medium underline underline-offset-4"
        style={{ color }}
      >
        {visible ? 'Hide typed answer' : toggleLabel}
      </button>

      {visible && (
        <div className="w-full bg-white rounded-3xl p-4 shadow-md flex flex-col gap-3">
          <label className="text-sm font-medium text-gray-600" htmlFor="manual-answer">
            {promptLabel}
          </label>
          <textarea
            id="manual-answer"
            value={value}
            onChange={event => onChange(event.target.value)}
            placeholder="Type the child's answer here..."
            rows={3}
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-800 outline-none focus:border-gray-300"
          />
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            className="px-5 py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: color }}
          >
            {submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}
