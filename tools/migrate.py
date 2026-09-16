#!/usr/bin/env python3
"""
Migrate content from the old HugoBlox site into the new one.

Strips the widget-era front matter down to what the new theme actually uses,
slugifies directory names so URLs are clean, and drops the example/demo pages.
Idempotent: safe to re-run.
"""
import os, re, shutil, sys, yaml, datetime, pathlib

OLD = pathlib.Path(os.path.expanduser('~/mnt/hugo-academic/content'))
NEW = pathlib.Path(os.path.expanduser('~/mnt/Toronto/website/content'))

SECTIONS = {                      # old dir -> new dir
    'talk':        'talks',
    'project':     'projects',
    'publication': 'publications',
    'post':        'blog',
}

SKIP = {'example', 'demo', '_index.md', 'getting-started'}

# keys the new theme reads; everything else from the widget era is dropped
KEEP = {
    'title', 'subtitle', 'summary', 'abstract', 'date', 'date_end', 'lastmod',
    'location', 'event', 'event_url', 'tags', 'categories', 'authors',
    'projects', 'publication', 'publication_short', 'publication_types',
    'doi', 'url_pdf', 'url_code', 'url_slides', 'url_video', 'url_poster',
    'links', 'draft', 'featured', 'weight', 'all_day',
}

def slugify(name: str) -> str:
    s = name.lower().replace('_', '-')
    s = re.sub(r'[^a-z0-9-]+', '-', s)
    return re.sub(r'-{2,}', '-', s).strip('-')

def split_front_matter(text: str):
    if not text.startswith('---'):
        return {}, text
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}, text
    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as e:
        print(f'    ! yaml error: {e}')
        return None, text
    return fm, parts[2].lstrip('\n')

def clean(fm: dict, section: str, slug: str) -> dict:
    out = {k: v for k, v in fm.items() if k in KEEP and v not in (None, '', [], {})}

    # old site left several publications marked draft; they are all published work
    if section == 'publications':
        out.pop('draft', None)

    # normalise dates to plain ISO strings so Hugo parses them consistently
    for k in ('date', 'lastmod', 'date_end'):
        v = out.get(k)
        if isinstance(v, (datetime.datetime, datetime.date)):
            out[k] = v.isoformat()

    # featured image, if the folder has one
    for cand in ('featured.png', 'featured.jpg', 'featured.jpeg'):
        if (NEW / section / slug / cand).exists():
            out['image'] = cand
            break

    # point project references at the new slugs
    if isinstance(out.get('projects'), list):
        out['projects'] = [slugify(p) for p in out['projects']]

    out.setdefault('title', slug.replace('-', ' ').title())
    return out

def main():
    report = []
    for old_name, new_name in SECTIONS.items():
        src_root = OLD / old_name
        dst_root = NEW / new_name
        if not src_root.exists():
            continue
        dst_root.mkdir(parents=True, exist_ok=True)
        moved = skipped = failed = 0

        for entry in sorted(os.listdir(src_root)):
            if entry in SKIP or entry.startswith('.'):
                skipped += 1
                continue
            src = src_root / entry
            if not src.is_dir():
                skipped += 1
                continue

            slug = slugify(entry)
            dst = dst_root / slug
            if dst.exists():
                shutil.rmtree(dst, ignore_errors=True)
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns('.DS_Store', '*_old*'))

            idx = dst / 'index.md'
            if not idx.exists():
                failed += 1
                print(f'  ! {new_name}/{slug}: no index.md')
                continue

            fm, body = split_front_matter(idx.read_text(encoding='utf-8', errors='replace'))
            if fm is None:
                failed += 1
                continue
            fm = clean(fm, new_name, slug)
            idx.write_text(
                '---\n' + yaml.safe_dump(fm, sort_keys=False, allow_unicode=True) + '---\n\n' + body,
                encoding='utf-8')
            moved += 1

        report.append((new_name, moved, skipped, failed))

    print(f'\n{"section":<14}{"migrated":>9}{"skipped":>9}{"failed":>8}')
    print('-' * 40)
    for name, m, s, f in report:
        print(f'{name:<14}{m:>9}{s:>9}{f:>8}')

if __name__ == '__main__':
    main()
