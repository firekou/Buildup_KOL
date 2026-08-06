#!/usr/bin/env python3
"""Accumulator for the benchmark-account research results.

Every account recorded here was checked against the live platform: either
fetched directly (verify_tier "direct-fetch", the strong case) or, where the
platform refuses anonymous requests from this host, corroborated against
sources the creator or a reliable publisher controls (verify_tier
"cross-reference"). Nothing is recorded on recall alone.
"""
import json
import os
import sys

PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results.json")


def load():
    if os.path.exists(PATH):
        with open(PATH, encoding="utf-8") as f:
            return json.load(f)
    return {"units": [], "notes": []}


def save(data):
    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def add_unit(persona_key, persona_nick, platform_key, platform_name,
             daily_feel, accounts, notes=""):
    data = load()
    data["units"] = [u for u in data["units"]
                     if not (u["persona_key"] == persona_key
                             and u["platform_key"] == platform_key)]
    data["units"].append({
        "persona_key": persona_key,
        "persona_nick": persona_nick,
        "platform_key": platform_key,
        "platform_name": platform_name,
        "platform_daily_feel": daily_feel,
        "confirmed": accounts,
        "notes": notes,
    })
    save(data)
    return len(accounts)


if __name__ == "__main__":
    d = load()
    total = sum(len(u["confirmed"]) for u in d["units"])
    print("units: %d / 18   accounts: %d" % (len(d["units"]), total))
    for u in sorted(d["units"], key=lambda x: (x["persona_key"], x["platform_key"])):
        print("  %-14s %-10s %d" % (u["persona_nick"], u["platform_key"],
                                    len(u["confirmed"])))
