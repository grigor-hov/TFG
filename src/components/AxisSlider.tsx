type AxisSliderProps = {
  label: string;
  value: number;
  reference: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  showReference?: boolean;
};

export function AxisSlider({
  label,
  value,
  reference,
  min,
  max,
  step,
  onChange,
  showReference = true,
}: AxisSliderProps) {
  const valuePercent = ((value - min) / (max - min)) * 100;
  const referencePercent = ((reference - min) / (max - min)) * 100;

  const pathLeft = Math.min(valuePercent, referencePercent);
  const pathWidth = Math.abs(valuePercent - referencePercent);

  return (
    <div className="axis-slider">
      <div className="axis-slider-header">
        <strong>{label}</strong>
        <span>
            <>
               {showReference && <>Referencia: {reference.toFixed(3)} | </>}
               {showReference && <>Objetivo: {value.toFixed(3)} | </>}
               Δ: {(value - reference).toFixed(3)}
            </>
       </span>
      </div>

      <div className="slider-wrapper">
        <div className="slider-track" />

        <div
          className="slider-path"
          style={{
            left: `${pathLeft}%`,
            width: `${pathWidth}%`,
          }}
        />

        <div
          className="reference-marker"
          style={{ left: `${referencePercent}%` }}
          title="Referencia inicial"
        />

        <div
        className="target-marker"
        style={{ left: `${valuePercent}%` }}
        title="Objetivo"
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  );
}