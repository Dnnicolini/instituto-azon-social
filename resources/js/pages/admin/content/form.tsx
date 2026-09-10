import type {
    AdminSharedProps,
    Event,
    Post,
    Project,
    SitePage,
    TransparencyDocument,
} from '@/types/cms';
import CreatePost from '../posts/create';
import EditPost from '../posts/edit';
import CreateProject from '../projects/create';
import EditProject from '../projects/edit';
import CreateEvent from '../events/create';
import EditEvent from '../events/edit';
import CreateDocument from '../documents/create';
import EditDocument from '../documents/edit';
import CreatePage from '../pages/create';
import EditPage from '../pages/edit';
type Resource = 'posts' | 'projects' | 'events' | 'documents' | 'pages';
type DocumentDetail = TransparencyDocument & {
    slug: string;
    description?: string | null;
};
export default function ContentForm(
    props: AdminSharedProps & {
        resource: Resource;
        item: Post | Project | Event | DocumentDetail | SitePage | null;
    },
) {
    if (props.resource === 'posts')
        return props.item ? (
            <EditPost {...props} post={props.item as Post} />
        ) : (
            <CreatePost {...props} />
        );
    if (props.resource === 'projects')
        return props.item ? (
            <EditProject {...props} project={props.item as Project} />
        ) : (
            <CreateProject {...props} />
        );
    if (props.resource === 'events')
        return props.item ? (
            <EditEvent {...props} event={props.item as Event} />
        ) : (
            <CreateEvent {...props} />
        );
    if (props.resource === 'documents')
        return props.item ? (
            <EditDocument {...props} document={props.item as DocumentDetail} />
        ) : (
            <CreateDocument {...props} />
        );
    return props.item ? (
        <EditPage {...props} page={props.item as SitePage} />
    ) : (
        <CreatePage {...props} />
    );
}
