import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { EventForm } from '@/components/admin/event-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps } from '@/types/cms';
export default function Create({ seo }: AdminSharedProps) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Novo evento">
                <PageHeading
                    title="Novo evento"
                    description="Informe data, local e como a comunidade pode participar."
                />
                <EventForm />
            </AdminLayout>
        </>
    );
}
