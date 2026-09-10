<?php

namespace App\Enums;

enum PostType: string
{
    case Article = 'article';
    case Vlog = 'vlog';
    case Video = 'video';
    case Podcast = 'podcast';
    case Social = 'social';
}
