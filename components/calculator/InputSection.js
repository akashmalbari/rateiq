export default function InputSection({ title = 'Scenario Inputs', children, onCalculate, buttonLabel = 'Calculate' }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', padding: '28px', borderRadius: '2px' }}>
      <h2 className="font-display font-bold text-lg mb-6">{title}</h2>
      {children}
      <button
        onClick={onCalculate}
        style={{
          width: '100%',
          background: 'var(--ink)',
          color: 'var(--gold)',
          padding: '14px',
          fontFamily: 'inherit',
          fontSize: '13px',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
          borderRadius: '2px',
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
