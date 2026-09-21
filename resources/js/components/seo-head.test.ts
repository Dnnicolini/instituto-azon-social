import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './seo-head';

describe('serializeJsonLd', () => {
    it('keeps attacker-controlled content inside the JSON-LD script', () => {
        const schema = {
            '@type': 'Article',
            headline: '</ScRiPt><script>alert(1)</script>',
            nested: {
                description: '<!-- </script><img src=x onerror=alert(1)>',
            },
        };

        const serialized = serializeJsonLd(schema);

        expect(serialized).not.toContain('<');
        expect(serialized).toContain('\\u003c/ScRiPt>');
        expect(JSON.parse(serialized)).toEqual(schema);
    });
});
