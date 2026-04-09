'use client';

export default function InputField({ field, value, onChange }) {
  const baseInputStyle = {
    borderColor: 'var(--border-strong)',
    background: 'rgba(8, 17, 29, 0.72)',
    color: 'var(--ink)',
  };

  const handleValueChange = (event) => {
    const nextValue = field.type === 'number' ? Number(event.target.value) : event.target.value;
    onChange(field.id, nextValue);
  };

  return (
    <div className="mb-5">
      <label
        htmlFor={field.id}
        className="block text-xs font-mono uppercase tracking-widest mb-2"
        style={{ color: 'var(--muted)' }}
      >
        {field.label}
      </label>

      {field.type === 'select' ? (
        <select
          id={field.id}
          value={value}
          onChange={handleValueChange}
          style={baseInputStyle}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          {field.prefix ? (
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {field.prefix}
            </span>
          ) : null}
          {field.suffix ? (
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {field.suffix}
            </span>
          ) : null}
          <input
            id={field.id}
            type={field.type}
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={value}
            onChange={handleValueChange}
            style={{
              ...baseInputStyle,
              paddingLeft: field.prefix ? 28 : undefined,
              paddingRight: field.suffix ? 34 : undefined,
            }}
          />
        </div>
      )}

      {field.helpText ? (
        <p className="mt-2 text-sm" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          {field.helpText}
        </p>
      ) : null}
    </div>
  );
}
