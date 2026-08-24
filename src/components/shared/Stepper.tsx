import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onStepClick,
  className = ''
}) => {
  return (
    <div className={`mb-12 ${className}`}>
      <div className="flex items-center justify-center space-x-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                index <= activeStep 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'border-gray-300 text-gray-400'
              }`}
              onClick={() => onStepClick?.(index)}
            >
              {index < activeStep ? (
                <Check size={20} />
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            <div className="ml-4 hidden sm:block">
              <p className={`text-sm font-medium transition-colors duration-300 ${
                index <= activeStep ? 'text-indigo-600' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`hidden md:block w-24 h-1 mx-8 rounded transition-colors duration-300 ${
                index < activeStep ? 'bg-indigo-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};