import React from 'react';

export type StepperStep = {
    label: string;
};

type GeneratePayrollStepperProps = {
    steps: StepperStep[];
    currentStep: number;
};

const GeneratePayrollStepper = ({
    steps,
    currentStep,
}: GeneratePayrollStepperProps) => {
    return (
        <div className="my-5 flex flex-wrap items-center justify-center gap-3">
            {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isComplete = stepNumber < currentStep;

                return (
                    <div key={step.label} className="flex items-center gap-2">
                        <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                                isComplete
                                    ? 'border-green-600 bg-green-600 text-white'
                                    : isActive
                                      ? 'border-slate-900 bg-slate-900 text-white'
                                      : 'border-slate-200 bg-white text-slate-500'
                            }`}
                        >
                            {stepNumber}
                        </div>
                        <div
                            className={`text-sm ${
                                isActive
                                    ? 'font-semibold text-slate-900'
                                    : 'text-slate-500'
                            }`}
                        >
                            {step.label}
                        </div>
                        {index < steps.length - 1 && (
                            <div className="h-px w-6 bg-slate-200" />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GeneratePayrollStepper;
