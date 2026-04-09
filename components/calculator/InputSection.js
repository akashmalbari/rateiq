export default function InputSection({ title = 'Scenario Inputs', children, onCalculate, buttonLabel = 'Calculate' }) {
  return (
    <div className="surface-card p-6 md:p-7">
      <div className="eyebrow mb-3">Inputs</div>
      <h2 className="font-display font-semibold text-xl md:text-2xl mb-6">{title}</h2>
      {children}
      <button onClick={onCalculate} className="glass-button w-full mt-2">
        {buttonLabel}
      </button>
    </div>
  );
}
