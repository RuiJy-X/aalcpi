import { FileText } from 'lucide-react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import type { WeeklyRecord } from '../types';

export function WeeklyPdfPreview({
    previewItem,
    previewTitle,
}: {
    previewItem: WeeklyRecord | null;
    previewTitle: string;
}) {
    return (
        <Card className="mt-3 h-fit min-w-1/2 overflow-hidden border bg-card shadow-sm lg:sticky lg:top-4">
            <CardHeader className="border-b bg-muted/30 pb-4">
                <CardDescription>PDF Preview</CardDescription>
                <CardTitle>{previewTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 py-0">
                {previewItem ? (
                    <>
                        <div className="flex w-full justify-between gap-3 text-sm text-muted-foreground">
                            <div>Planter Code: {previewItem.planter_code}</div>
                            <div>Crop Year: {previewItem.crop_year}</div>
                            <div>Week: {previewItem.week}</div>
                            <div>Segment: {previewItem.segment}</div>
                        </div>

                        <div className="overflow-hidden rounded-xl border bg-muted/20 shadow-inner">
                            <iframe
                                title={previewTitle}
                                src={previewItem.preview_url}
                                className="h-[70vh] w-full"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                        <FileText className="mb-3 size-8 text-muted-foreground/70" />
                        Select a weekly PDF checkbox to preview it here.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
