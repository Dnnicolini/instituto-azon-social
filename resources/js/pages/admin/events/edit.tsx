import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { EventForm } from '@/components/admin/event-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, Event, SelectOption } from '@/types/cms';
export default function Edit({
    seo,
    event,
    projectOptions = [],
}: AdminSharedProps & { event: Event; projectOptions?: SelectOption[] }) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar evento">
                <PageHeading
                    title={event.title}
                    description="Atualize a agenda e as informações de participação."
                />
                <EventForm event={event} projectOptions={projectOptions} />
            </AdminLayout>
        </>
    );
}
