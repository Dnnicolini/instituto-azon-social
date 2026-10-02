import { AdminLayout } from '@/components/admin/admin-layout';
import { PageHeading } from '@/components/admin/cms-ui';
import { PageForm } from '@/components/admin/page-form';
import { SeoHead } from '@/components/seo-head';
import type { AdminSharedProps, SelectOption, SitePage } from '@/types/cms';
export default function Edit({
    seo,
    page,
    instagramAccounts = [],
    isChannel = false,
    returnTo = 'pages',
}: AdminSharedProps & {
    page: SitePage;
    instagramAccounts?: SelectOption[];
    isChannel?: boolean;
    returnTo?: 'pages' | 'channels';
}) {
    return (
        <>
            <SeoHead seo={seo} />
            <AdminLayout title="Editar página">
                <PageHeading
                    title={page.title}
                    description={
                        isChannel
                            ? 'Organize as seções, a publicação e o perfil oficial que alimenta este canal.'
                            : 'Altere a mensagem sem quebrar a identidade visual do site.'
                    }
                />
                <PageForm
                    page={page}
                    instagramAccounts={instagramAccounts}
                    isChannel={isChannel}
                    returnTo={returnTo}
                />
            </AdminLayout>
        </>
    );
}
