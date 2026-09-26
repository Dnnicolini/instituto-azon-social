import type {
    AdminSharedProps,
    Event,
    Paginated,
    Post,
    Project,
    SitePage,
    TransparencyDocument,
} from '@/types/cms';
import PostsIndex from '../posts/index';
import ProjectsIndex from '../projects/index';
import EventsIndex from '../events/index';
import DocumentsIndex from '../documents/index';
import PagesIndex from '../pages/index';
import type { PostSection } from '@/lib/admin-post-section';
type Resource = 'posts' | 'projects' | 'events' | 'documents' | 'pages';
export default function ContentIndex(
    props: AdminSharedProps & {
        resource: Resource;
        items: Paginated<
            Post | Project | Event | TransparencyDocument | SitePage
        >;
        section?: PostSection;
        filters?: Record<string, string | number | null | undefined>;
        categories?: string[];
    },
) {
    if (props.resource === 'posts')
        return (
            <PostsIndex
                {...props}
                posts={props.items as Paginated<Post>}
                section={props.section ?? 'article'}
            />
        );
    if (props.resource === 'projects')
        return (
            <ProjectsIndex
                {...props}
                projects={props.items as Paginated<Project>}
                filters={props.filters}
            />
        );
    if (props.resource === 'events')
        return (
            <EventsIndex
                {...props}
                events={props.items as Paginated<Event>}
                filters={props.filters}
            />
        );
    if (props.resource === 'documents')
        return (
            <DocumentsIndex
                {...props}
                documents={props.items as Paginated<TransparencyDocument>}
                filters={props.filters}
                categories={props.categories}
            />
        );
    return (
        <PagesIndex
            {...props}
            pages={props.items as Paginated<SitePage>}
            filters={props.filters}
        />
    );
}
