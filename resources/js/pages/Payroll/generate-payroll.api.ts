import type { PayrollPreviewResponse } from './generate-payroll.types';

type ErrorResponse = {
    message?: string;
    errors?: Record<string, string | string[]>;
};

const getCsrfToken = (): string => {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    return token ?? '';
};

export const postPayrollPreview = async (
    formData: FormData,
): Promise<PayrollPreviewResponse> => {
    const response = await fetch('/Payroll/preview', {
        method: 'POST',
        body: formData,
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        const data = (await response.json()) as ErrorResponse;
        let errorMsg = data.message ?? `HTTP ${response.status}`;

        if (data.errors) {
            const errorDetails = Object.entries(data.errors)
                .map(([key, value]) => {
                    const msgs = Array.isArray(value) ? value : [value];
                    return `${key}: ${msgs.join(', ')}`;
                })
                .join('; ');
            if (errorDetails) {
                errorMsg = `${errorMsg} (${errorDetails})`;
            }
        }

        throw new Error(errorMsg);
    }

    return (await response.json()) as PayrollPreviewResponse;
};
