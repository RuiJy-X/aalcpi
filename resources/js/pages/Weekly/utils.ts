export function sortNumericStrings(values: string[]): string[] {
    return [...new Set(values)].sort((left, right) => {
        const leftNumber = Number(left);
        const rightNumber = Number(right);

        if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
            return leftNumber - rightNumber;
        }

        return left.localeCompare(right, undefined, {
            numeric: true,
            sensitivity: 'base',
        });
    });
}
