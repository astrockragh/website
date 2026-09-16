#!/usr/bin/env python3
"""Front matter and link checks for the site, run against a fresh build.

Hugo is forgiving in exactly the places that hurt: `site.GetPage` on a slug that
no longer exists returns nothing and the partial renders nothing, a `figure`
shortcode pointing at a missing resource falls through to a raw <img> with a
dead src, and a link to a page that was renamed is just a 404 nobody clicks
until someone does. None of that fails a build. This does.

Called by build_check.sh; standalone use:

    python3 tests/check_content.py --root . --public /path/to/built/site
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
from urllib.parse import unquote

import yaml

# Sections whose pages are dated and sorted by it — a missing or unparseable
# date silently drops them to the bottom of every list.
DATED_SECTIONS = {"talks", "projects", "publications", "blog", "outreach"}

# Only the projects templates actually render .Params.image; elsewhere a stale
# one is rot rather than a visible break, so it warns instead of failing.
IMAGE_IS_RENDERED = {"projects"}

EXTERNAL = ("http://", "https://", "//", "mailto:", "tel:", "data:", "#")

FENCE = re.compile(r"^\s*(```|~~~)", re.M)
MD_LINK = re.compile(r"!?\[[^\]]*\]\(\s*<?([^)\s>]+)")
HTML_ATTR = re.compile(r"""(?:src|href)\s*=\s*["']([^"']+)["']""")
TOML_URL = re.compile(r'^\s*url\s*=\s*"([^"]+)"', re.M)

DATE_FORMATS = ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ")


class Report:
    """Collected problems, printed grouped by file."""

    def __init__(self) -> None:
        self.items = []  # (severity, path, line, message)

    def error(self, path, line, message):
        self.items.append(("error", path, line, message))

    def warn(self, path, line, message):
        self.items.append(("warn", path, line, message))

    @property
    def errors(self):
        return [i for i in self.items if i[0] == "error"]

    def print(self, tty):
        red = "\033[31m" if tty else ""
        yel = "\033[33m" if tty else ""
        grn = "\033[32m" if tty else ""
        dim = "\033[2m" if tty else ""
        off = "\033[0m" if tty else ""

        if not self.items:
            print("%sok%s    front matter, links and data files all resolve" % (grn, off))
            return

        by_file = {}
        for sev, path, line, msg in self.items:
            by_file.setdefault(path, []).append((sev, line, msg))

        for path in sorted(by_file):
            print("      %s%s%s" % (dim, path, off))
            for sev, line, msg in sorted(by_file[path], key=lambda i: (i[1] or 0)):
                tag = "%sFAIL%s" % (red, off) if sev == "error" else "%swarn%s" % (yel, off)
                where = ":%d" % line if line else ""
                print("%s  %s%s %s" % (tag, path, where, msg))

        n_err = len(self.errors)
        n_warn = len(self.items) - n_err
        print("      %s%d error(s), %d warning(s)%s" % (dim, n_err, n_warn, off))


def line_of(text, key):
    """Line number of a top-level front matter key, for a clickable location.

    `text` is the front matter with its opening `---` already stripped, so its
    first line is the file's second: hence the extra + 1.
    """
    match = re.search(r"^%s\s*:" % re.escape(key), text, re.M)
    return text[: match.start()].count("\n") + 2 if match else None


def split_front_matter(raw):
    """Return (front matter dict, body, front matter text, body's first line).

    Raises yaml.YAMLError on malformed front matter.
    """
    if not raw.startswith("---"):
        return None, raw, "", 1
    end = raw.find("\n---", 3)
    if end == -1:
        return None, raw, "", 1
    fm_text = raw[raw.find("\n") + 1 : end]
    body = raw[end + 4 :]
    first_line = raw.count("\n", 0, end + 4) + 1
    return yaml.safe_load(fm_text) or {}, body, fm_text, first_line


def strip_code(text):
    """Blank out fenced code blocks, keeping line numbers intact.

    A fence that opens and closes on the same line (```like this```) is a span,
    not a block — treating it as a delimiter silently swallows the rest of the
    file, and with it every link below.
    """
    out, fenced = [], False
    for line in text.split("\n"):
        match = FENCE.match(line)
        if match and not (not fenced and line.count(match.group(1)) > 1):
            fenced = not fenced
            out.append("")
        else:
            out.append("" if fenced else line)
    return "\n".join(out)


def parse_date(value):
    if isinstance(value, (dt.date, dt.datetime)):
        return True
    if not isinstance(value, str):
        return False
    text = value.strip()
    # Hugo parses RFC3339, so both of these are legal and neither is what
    # strptime wants: the colon in a +00:00 offset, and fractional seconds.
    text = re.sub(r"([+-]\d{2}):(\d{2})$", r"\1\2", text)
    text = re.sub(r"\.\d+", "", text)
    for fmt in DATE_FORMATS:
        for suffix in ("", "%z"):
            try:
                dt.datetime.strptime(text, fmt + suffix)
                return True
            except ValueError:
                continue
    return False


class Site:
    def __init__(self, root, public):
        self.root = os.path.abspath(root)
        self.public = os.path.abspath(public)
        self.content = os.path.join(self.root, "content")

    # -- resolution ---------------------------------------------------------

    def resolves_absolute(self, url):
        """Does a site-absolute URL correspond to something Hugo actually built?"""
        path = unquote(url.split("#")[0].split("?")[0])
        if not path or path == "/":
            path = "/index.html"
        target = os.path.join(self.public, path.lstrip("/"))
        return (
            os.path.isfile(target)
            or os.path.isfile(os.path.join(target, "index.html"))
            or os.path.isfile(target.rstrip("/") + ".html")
        )

    def resolves_relative(self, url, page_dir):
        """A bundle-relative link: a page resource, or a built sibling page.

        The source bundle comes first because that is what `Resources.GetMatch`
        reads, and a resized image lands in public/ under a different name.
        """
        path = unquote(url.split("#")[0].split("?")[0])
        if not path:
            return True
        if os.path.exists(os.path.join(page_dir, path)):
            return True
        rel = os.path.relpath(page_dir, self.content)
        built = os.path.normpath(os.path.join(self.public, rel, path))
        return os.path.isfile(built) or os.path.isfile(os.path.join(built, "index.html"))

    def check_link(self, report, url, src_path, line, context=""):
        if url.startswith(EXTERNAL) or url.startswith("{{"):
            return
        prefix = "%s " % context if context else ""
        if url.startswith("/"):
            if not self.resolves_absolute(url):
                report.error(src_path, line, "%sdead link: %s" % (prefix, url))
        else:
            page_dir = os.path.dirname(os.path.join(self.root, src_path))
            if not self.resolves_relative(url, page_dir):
                report.error(src_path, line, "%smissing resource: %s" % (prefix, url))

    # -- content ------------------------------------------------------------

    def content_files(self):
        for dirpath, _, filenames in os.walk(self.content):
            for name in sorted(filenames):
                if name.endswith(".md"):
                    yield os.path.join(dirpath, name)

    def check_pages(self, report):
        for path in sorted(self.content_files()):
            rel = os.path.relpath(path, self.root)
            with open(path, encoding="utf-8") as handle:
                raw = handle.read()

            try:
                front, body, fm_text, body_line = split_front_matter(raw)
            except yaml.YAMLError as exc:
                report.error(rel, None, "front matter is not valid YAML: %s" % exc)
                continue

            if front is None:
                report.error(rel, 1, "no front matter")
                continue

            self.check_front_matter(report, rel, path, front, fm_text)
            self.check_body_links(report, rel, strip_code(body), body_line)

    def check_front_matter(self, report, rel, path, front, fm_text):
        parts = os.path.relpath(path, self.content).split(os.sep)
        section = parts[0] if len(parts) > 1 else ""
        is_list = os.path.basename(path) == "_index.md"
        bundle = os.path.dirname(path)

        def where(key):
            return line_of(fm_text, key)

        title = front.get("title")
        if not isinstance(title, str) or not title.strip():
            report.error(rel, where("title") or 1, "missing or empty title")

        if not is_list and section in DATED_SECTIONS:
            if "date" not in front:
                report.error(rel, 1, "no date — it will sort to the bottom of %s/" % section)
            elif not parse_date(front["date"]):
                report.error(rel, where("date"), "unparseable date: %r" % (front["date"],))

        if front.get("draft") is True:
            report.warn(rel, where("draft"), "draft: true — this page is not in the build")

        image = front.get("image")
        if isinstance(image, str) and image.strip():
            if not self.bundle_match(bundle, image):
                message = "image: %s is not in the page bundle" % image
                if section in IMAGE_IS_RENDERED:
                    report.error(rel, where("image"), message)
                else:
                    report.warn(rel, where("image"), message + " (unused by %s templates)" % (section or "this"))

        projects = front.get("projects")
        if projects is not None:
            if not isinstance(projects, list):
                report.error(rel, where("projects"), "projects: must be a list")
            else:
                for slug in projects:
                    target = os.path.join(self.content, "projects", str(slug), "index.md")
                    if not os.path.isfile(target):
                        report.error(
                            rel,
                            where("projects"),
                            "projects: no such project '%s' — the related-work link is dropped silently" % slug,
                        )

        tags = front.get("tags")
        if tags is not None:
            if not isinstance(tags, list):
                report.error(rel, where("tags"), "tags: must be a list")
            else:
                for tag in tags:
                    if not isinstance(tag, str) or not tag.strip():
                        report.error(rel, where("tags"), "tags: empty or non-string entry %r" % (tag,))

        for key, value in front.items():
            if key.startswith("url_") and isinstance(value, str) and value.startswith("/"):
                self.check_link(report, value, rel, where(key), context="%s:" % key)

    @staticmethod
    def bundle_match(bundle, pattern):
        """Hugo's Resources.GetMatch — a glob, so `featured.*` is legal."""
        import fnmatch

        try:
            names = os.listdir(bundle)
        except OSError:
            return False
        return any(fnmatch.fnmatch(name, pattern) for name in names)

    def check_body_links(self, report, rel, body, first_line):
        for index, line in enumerate(body.split("\n"), start=first_line):
            for pattern in (MD_LINK, HTML_ATTR):
                for match in pattern.finditer(line):
                    self.check_link(report, match.group(1), rel, index)

    # -- config and data ----------------------------------------------------

    def check_menus(self, report):
        path = os.path.join(self.root, "hugo.toml")
        if not os.path.isfile(path):
            report.error("hugo.toml", None, "not found")
            return
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
        for match in TOML_URL.finditer(text):
            url = match.group(1)
            line = text.count("\n", 0, match.start()) + 1
            self.check_link(report, url, "hugo.toml", line, context="menu")

    def check_data(self, report):
        self.check_reel(report)
        self.check_highlights(report)

    def load_yaml(self, report, name):
        path = os.path.join(self.root, "data", name)
        if not os.path.isfile(path):
            report.error("data/%s" % name, None, "not found")
            return None, None
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
        try:
            return yaml.safe_load(text), text
        except yaml.YAMLError as exc:
            report.error("data/%s" % name, None, "invalid YAML: %s" % exc)
            return None, text

    def check_reel(self, report):
        rel = "data/reel.yaml"
        data, text = self.load_yaml(report, "reel.yaml")
        if not data:
            return
        clips = data.get("clips")
        if not isinstance(clips, list) or not clips:
            report.error(rel, None, "no clips — the hero has nothing to play")
            return
        for position, clip in enumerate(clips, start=1):
            label = "clip %d" % position
            if not isinstance(clip, dict):
                report.error(rel, None, "%s is not a mapping" % label)
                continue
            for key in ("caption", "src", "poster", "href"):
                value = clip.get(key)
                if not value:
                    # A missing poster is the one that bites: the reel falls back
                    # to it on mobile and under reduced motion.
                    report.error(rel, None, "%s has no %s" % (label, key))
                elif key != "caption":
                    line = self.yaml_line(text, str(value))
                    self.check_link(report, str(value), rel, line, context="%s %s:" % (label, key))
            duration = clip.get("duration_ms", data.get("duration_ms"))
            if not isinstance(duration, int) or duration <= 0:
                report.error(rel, None, "%s has no usable duration_ms (%r)" % (label, duration))

    def check_highlights(self, report):
        rel = "data/highlights.yaml"
        data, text = self.load_yaml(report, "highlights.yaml")
        if not data:
            return
        items = data.get("items")
        if not isinstance(items, list) or not items:
            report.error(rel, None, "no items — the landing page cards are empty")
            return
        for position, item in enumerate(items, start=1):
            label = "item %d" % position
            if not isinstance(item, dict):
                report.error(rel, None, "%s is not a mapping" % label)
                continue
            if not item.get("title"):
                report.error(rel, None, "%s has no title" % label)
            for key in ("href", "image"):
                value = item.get(key)
                if not value:
                    report.error(rel, None, "%s has no %s" % (label, key))
                else:
                    line = self.yaml_line(text, str(value))
                    self.check_link(report, str(value), rel, line, context="%s %s:" % (label, key))

    @staticmethod
    def yaml_line(text, value):
        if not text:
            return None
        match = re.search(re.escape(value), text)
        return text.count("\n", 0, match.start()) + 1 if match else None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=".", help="site root (the dir with hugo.toml)")
    parser.add_argument("--public", required=True, help="a freshly built copy of the site")
    args = parser.parse_args()

    site = Site(args.root, args.public)
    if not os.path.isdir(site.content):
        print("no content/ under %s" % site.root, file=sys.stderr)
        return 2
    if not os.path.isdir(site.public):
        print("no built site at %s" % site.public, file=sys.stderr)
        return 2

    report = Report()
    site.check_pages(report)
    site.check_menus(report)
    site.check_data(report)
    report.print(sys.stdout.isatty())
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())
