import { Calendar } from 'lucide-react';
import React from 'react';

const DisplayDate = ({ label, date }: { label?: string; date: string }) => {
    return (
        <div className="font-sm inline-flex items-center gap-2 text-gray-500">
            <Calendar size={18} />
            <div className="flex-cols flex gap-1">
                <div>{label}:</div>
                <div>{date}</div>
            </div>
        </div>
    );
};

export default DisplayDate;
