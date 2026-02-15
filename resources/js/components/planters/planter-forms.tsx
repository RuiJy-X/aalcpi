import React, { createContext, useContext } from 'react';
import type { InertiaFormProps } from '@inertiajs/react';

type PlanterFormData = {
    name: string;
    address: string;
    email: string;
    phone: string;
    haciendaName: string;
    location: string;
    status: string;
    ownershipType: string;
};

type PlanterFormContextValue = InertiaFormProps<PlanterFormData>;

const PlanterFormContext = createContext<PlanterFormContextValue | null>(null);

export function PlanterFormProvider({
    value,
    children,
}: {
    value: PlanterFormContextValue;
    children: React.ReactNode;
}) {
    return (
        <PlanterFormContext.Provider value={value}>
            {children}
        </PlanterFormContext.Provider>
    );
}

export function usePlanterForm() {
    const ctx = useContext(PlanterFormContext);
    if (!ctx) {
        throw new Error(
            'usePlanterForm must be used within PlanterFormProvider',
        );
    }
    return ctx;
}
