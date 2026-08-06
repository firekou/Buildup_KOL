#!/usr/bin/env python3
"""Direct-fetch profile verifier for benchmark-account research.

Usage: vf.py <youtube|x|tiktok> <handle> [handle ...]

Fetches the live public profile page and reports what is actually on it, so a
claimed account can be confirmed to exist on that specific platform (and to
belong to who it is claimed to belong to) rather than taken on trust.
Prints one JSON object per handle.
"""
import json
import re
import subprocess
import sys
from urllib.parse import unquote

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

URLS = {
    # A bare UC... id addresses the channel directly; anything else is a handle.
    "youtube": lambda h: ("https://www.youtube.com/channel/%s" % h
                          if re.match(r"^UC[\w-]{20,}$", h)
                          else "https://www.youtube.com/@%s" % h.lstrip("@")),
    "x": lambda h: "https://x.com/%s" % h.lstrip("@"),
    "tiktok": lambda h: "https://www.tiktok.com/@%s" % h.lstrip("@"),
}


def fetch(url):
    p = subprocess.run(
        ["curl", "-sSL", "--max-time", "30", "-A", UA, "-w", "\n__HTTP__%{http_code}", url],
        capture_output=True, text=True, errors="ignore")
    body = p.stdout
    code = None
    if "__HTTP__" in body:
        body, _, tail = body.rpartition("__HTTP__")
        code = tail.strip()
    return code, body


def first(pattern, text, group=1):
    m = re.search(pattern, text)
    return m.group(group) if m else None


def verify_youtube(h, body):
    out = {}
    out["page_title"] = first(r"<title>([^<]*)</title>", body)
    # channelMetadataRenderer describes THIS channel (sidebar entries do not).
    meta = first(r'"channelMetadataRenderer":\{(.{0,2000}?)\}\s*,\s*"', body)
    if meta:
        out["channel_title"] = first(r'"title":"(.*?)(?<!\\)"', meta)
        out["channel_id"] = first(r'"externalId":"([^"]*)"', meta)
        desc = first(r'"description":"(.*?)(?<!\\)"', meta)
        out["description"] = (desc or "")[:220]
    vanity = first(r'"vanityChannelUrl":"([^"]*)"', body)
    if vanity:
        out["vanity_url"] = unquote(vanity)
        out["canonical_handle"] = unquote(vanity).rsplit("@", 1)[-1]
    # The header subtitle pairs the count with the handle, so anchoring on the
    # requested handle avoids picking up a sidebar channel's numbers.
    anchor = out.get("canonical_handle") or h.lstrip("@")
    hits = list(re.finditer(r"([\d.,]+[KMB]?) subscribers", body))
    pick = None
    for m in hits:
        if "@" + anchor in body[max(0, m.start() - 600):m.start()]:
            pick = m
            break
    # A channel page that mentions subscribers exactly once can only mean itself;
    # pages with a sidebar need the handle anchor above to disambiguate.
    if pick is None and len(hits) == 1:
        pick = hits[0]
    if pick is not None:
        out["subscribers"] = pick.group(0)
        out["videos"] = first(r"([\d.,]+[KMB]? videos)", body[pick.start():pick.start() + 300])
    return out


def verify_x(h, body):
    out = {}
    title = first(r"<title>([^<]*)</title>", body)
    out["page_title"] = title
    out["og_title"] = first(r'<meta[^>]+property="og:title"[^>]+content="([^"]*)"', body)
    out["og_description"] = first(r'<meta[^>]+property="og:description"[^>]+content="([^"]*)"', body)
    if title:
        out["display_name"] = first(r"^(.*?)\s*\(@", title)
        out["handle_on_page"] = first(r"\(@([^)]*)\)", title)
    return out


def verify_tiktok(h, body):
    out = {}
    out["unique_id"] = first(r'"uniqueId":"([^"]*)"', body)
    out["nickname"] = first(r'"nickname":"([^"]*)"', body)
    out["signature"] = (first(r'"signature":"(.*?)(?<!\\)"', body) or "")[:180]
    fc = first(r'"followerCount":(\d+)', body)
    out["followers"] = int(fc) if fc else None
    out["verified"] = first(r'"verified":(true|false)', body)
    return out


VERIFIERS = {"youtube": verify_youtube, "x": verify_x, "tiktok": verify_tiktok}


def main():
    platform, handles = sys.argv[1], sys.argv[2:]
    if platform not in URLS:
        sys.exit("unknown platform: %s" % platform)
    for h in handles:
        url = URLS[platform](h)
        code, body = fetch(url)
        rec = {"platform": platform, "handle": h, "url": url, "http": code}
        if code == "200" and body:
            rec.update(VERIFIERS[platform](h, body))
            # Existence is decided by whether the page actually returned this
            # profile's own data, not by scanning for error strings -- those
            # phrases also live in the sites' JS bundles.
            want = h.lstrip("@").lower()
            if platform == "tiktok":
                rec["exists"] = (rec.get("unique_id") or "").lower() == want
            elif platform == "x":
                rec["exists"] = (rec.get("handle_on_page") or "").lower() == want
            else:
                rec["exists"] = bool(rec.get("channel_id"))
        else:
            rec["exists"] = False if code in ("404", "400") else None
        print(json.dumps(rec, ensure_ascii=False))


if __name__ == "__main__":
    main()
