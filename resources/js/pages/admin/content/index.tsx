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
type Resource = 'posts' | 'projects' | 'events' | 'documents' | 'pages';
export default function ContentIndex(
    props: AdminSharedProps & {
        resource: Resource;
        items: Paginated<
            Post | Project | Event | TransparencyDocument | SitePage
        >;
    },
) {
    if (props.resource === 'posts')
        return <PostsIndex {...props} posts={props.items as Paginated<Post>} />;
    if (props.resource === 'projects')
        return (
            <ProjectsIndex
                {...props}
                projects={props.items as Paginated<Project>}
            />
        );
    if (props.resource === 'events')
        return (
            <EventsIndex {...props} events={props.items as Paginated<Event>} />
        );
    if (props.resource === 'documents')
        return (
            <DocumentsIndex
                {...props}
                documents={props.items as Paginated<TransparencyDocument>}
            />
        );
    return <PagesIndex {...props} pages={props.items as Paginated<SitePage>} />;
}
