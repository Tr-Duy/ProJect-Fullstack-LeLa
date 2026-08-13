import React from 'react';

interface BrutalNumberInputProps {
  value?: number;
  onChange?: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const BrutalNumberInput: React.FC<BrutalNumberInputProps> = ({
  value = 20,
  onChange,
  min = 1,
  max = 500,
  step = 1,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value, 10);
    if (!isNaN(num)) {
      onChange?.(num);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-4">
        {/* Slider Track */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="flex-1 h-6 bg-white brutal-border brutal-shadow-sm outline-none appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-8 
            [&::-webkit-slider-thumb]:h-10 
            [&::-webkit-slider-thumb]:bg-brand-coral 
            [&::-webkit-slider-thumb]:border-[3px] 
            [&::-webkit-slider-thumb]:border-black 
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:hover:bg-brand-navy
            [&::-webkit-slider-thumb]:transition-colors"
        />
        
        {/* Value Display */}
        <div className="w-24 h-14 bg-white text-brand-navy brutal-border brutal-shadow-sm flex items-center justify-center font-black text-2xl relative">
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={handleChange}
            className="w-full h-full text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
    </div>
  );
};
