#!/usr/bin/env python3
"""從 results.json 產出人類可讀的 BENCHMARK_ACCOUNTS.md。"""
import json
from collections import OrderedDict

SRC = "research/benchmark-accounts/results.json"
OUT = "BENCHMARK_ACCOUNTS.md"

PERSONA_ORDER = ["xiaoxiao-tan", "faye-tan", "loima-cheung"]
PLATFORM_ORDER = ["youtube", "x", "tiktok", "instagram", "threads", "facebook"]

TIER_LABEL = {
    "direct-fetch": "直接抓取",
    "cross-reference": "交叉比對",
}

d = json.load(open(SRC, encoding="utf-8"))
units = d["units"]
meta = d["meta"]
stats = d["stats"]

personas = OrderedDict()
for u in units:
    personas.setdefault(u["persona_key"], u["persona_nick"])
platforms = OrderedDict()
for u in units:
    platforms.setdefault(u["platform_key"], u["platform_name"])

pkeys = [k for k in PERSONA_ORDER if k in personas] + [k for k in personas if k not in PERSONA_ORDER]
plkeys = [k for k in PLATFORM_ORDER if k in platforms] + [k for k in platforms if k not in PLATFORM_ORDER]

index = {(u["persona_key"], u["platform_key"]): u for u in units}

L = []
w = L.append

w("# 對標帳號總表")
w("")
w(f"3 個人設 × 6 個平台 = 18 個單位，共 **{stats['accounts_total']} 個經查證的真人帳號**。")
w(f"資料日期 {meta['generated']}；原始資料 `research/benchmark-accounts/results.json`，")
w("查證工具 `research/benchmark-accounts/vf.py`，方法與限制見 `research/benchmark-accounts/README.md`。")
w("")
w("> 每一筆都經過實際查證，`查證方式` 欄寫明當時看到什麼。")
w("> 湊不滿 3 個的單位誠實留白，**不以推測補足**。")
w("")

# --- 覆蓋率總表 ---
w("## 覆蓋率")
w("")
header = "| 人設 | " + " | ".join(platforms[k] for k in plkeys) + " | 小計 |"
w(header)
w("|" + "---|" * (len(plkeys) + 2))
for pk in pkeys:
    cells = []
    total = 0
    for plk in plkeys:
        u = index.get((pk, plk))
        n = len(u["confirmed"]) if u else 0
        total += n
        cells.append(str(n) if n >= 3 else (f"**{n}**" if n else "**0**"))
    w(f"| {personas[pk]} | " + " | ".join(cells) + f" | {total} |")
col_totals = []
for plk in plkeys:
    col_totals.append(str(sum(len(index[(pk, plk)]["confirmed"]) for pk in pkeys if (pk, plk) in index)))
w("| **小計** | " + " | ".join(f"**{c}**" for c in col_totals) + f" | **{stats['accounts_total']}** |")
w("")
w("粗體 = 未達 3 個，缺口原因見各單位下方說明。")
w("")

# --- 查證強度 ---
w("## 查證強度")
w("")
w("| 等級 | 帳號數 | 說明 |")
w("|---|---|---|")
w(f"| 直接抓取 `direct-fetch` | {stats['direct_fetch']} | 實際抓取該平台個人頁並解析，身分與粉絲數直接讀自頁面（YouTube／X／TikTok）。 |")
w(f"| 交叉比對 `cross-reference` | {stats['cross_reference']} | 平台拒絕本機匿名請求（Instagram 回 401、Threads／Facebook 只給 JS 殼）。改以創作者自家網站／Linktree 或搜尋索引佐證，並盡量用同 handle 在可直接抓取平台上的帳號互相印證。 |")
w("")

# --- 各人設明細 ---
for pk in pkeys:
    nick = personas[pk]
    w(f"---")
    w("")
    w(f"# {nick}（`kols/{pk}`）")
    w("")
    for plk in plkeys:
        u = index.get((pk, plk))
        if not u:
            continue
        daily = "日常感平台" if u.get("platform_daily_feel") else "作品型平台"
        w(f"## {u['platform_name']} · {len(u['confirmed'])}/3 · {daily}")
        w("")
        if not u["confirmed"]:
            w("*（此單位沒有任何可查證的帳號）*")
            w("")
            if u.get("notes"):
                w(f"> {u['notes']}")
                w("")
            continue
        for a in u["confirmed"]:
            flags = []
            if a.get("is_org_account"):
                flags.append("機構帳號")
            if a.get("everyday_feel"):
                flags.append("日常感")
            flag_s = f" — {'／'.join(flags)}" if flags else ""
            w(f"### {a['name']} `{a['handle']}`{flag_s}")
            w("")
            w(f"- **連結**：{a['url']}")
            w(f"- **粉絲數**：{a.get('followers') or '—'}")
            w(f"- **查證等級**：{TIER_LABEL.get(a['verify_tier'], a['verify_tier'])} `{a['verify_tier']}`")
            w(f"- **查證方式**：{a['verified_how']}")
            w(f"- **為什麼對得上**：{a['niche_match']}")
            w(f"- **可直接抄的做法**：{a['imitation_points']}")
            w("")
        if u.get("notes"):
            w(f"> {u['notes']}")
            w("")

# --- 缺口 ---
w("---")
w("")
w("# 缺口與後續")
w("")
w("## 未達 3 個的單位")
w("")
w("| 單位 | 數量 | 原因 |")
w("|---|---|---|")
reasons = {
    ("faye-tan", "threads"): "Threads 無法從本機抓取，且搜尋索引對 Threads 個人檔案極稀疏",
    ("loima-cheung", "threads"): "同上；影像論文這個垂直領域在 Threads 上找不到可獨立查證的帳號",
    ("faye-tan", "facebook"): "僅 Drew Binsky 找到可確認的官方頁面",
    ("xiaoxiao-tan", "threads"): "僅 2 個可經索引確認",
    ("faye-tan", "tiktok"): "多數旅遊 YouTuber 的同名 TikTok handle 屬他人",
    ("loima-cheung", "x"): "影像論文創作者的 X handle 多被佔用或已停用",
    ("loima-cheung", "instagram"): "該領域創作者主場在 YouTube",
    ("loima-cheung", "facebook"): "同上",
}
for pk in pkeys:
    for plk in plkeys:
        u = index.get((pk, plk))
        if u and len(u["confirmed"]) < 3:
            r = reasons.get((pk, plk), "見該單位說明")
            w(f"| {personas[pk]}／{platforms[plk]} | {len(u['confirmed'])} | {r} |")
w("")
w("刻意**不**用「Threads handle 通常等於 Instagram handle」這類推論補足——")
w("那是未經查證的推測，正是這次研究要防的張冠李戴。")
w("")

w("## 查證過程攔下的假帳號")
w("")
w("以下都是「handle 看起來合理、實際上不是本人」的例子，已排除：")
w("")
w("| 平台 | handle | 實際是什麼 |")
w("|---|---|---|")
for row in [
    ("TikTok", "@baldandbankrupt", "175 粉，簡介自承 *\"I'm Bald And Bankrupt But Not The Original Version\"*"),
    ("X", "@JacobGeller", "一位西班牙語執業律師，與遊戲評論者同名不同人"),
    ("X", "@ExtraCredits", "顯示名稱為 \"lindsay lohan\"，0 追蹤者"),
    ("X", "@IndigoTraveller", "簡介與 YouTube 頻道創作者身分不符，疑為同名不同人"),
    ("YouTube", "@LiYongLe", "實際是「小宝翡翠」翡翠賣家，不是李永乐老师"),
    ("YouTube", "@karlwatson", "441 訂閱，非本尊"),
    ("YouTube", "@Noclip", "1.79K 訂閱，非本尊"),
    ("TikTok", "@numberphile", "暱稱 Pranjal6MS，2 粉"),
    ("TikTok", "@thomasflight／@gmtk／@nerdwriter／@extracredits", "全是 1–3 粉的空帳號"),
]:
    w(f"| {row[0]} | `{row[1]}` | {row[2]} |")
w("")

w("## 建議的後續")
w("")
w("1. Threads 與 Facebook 的缺口，請由有登入該平台的人在站內直接搜尋補件。")
w("2. 標記為非日常感、卻落在圖文平台（IG／X／Threads／FB）的帳號，日後可替換成日常感更強的創作者。")
w("3. 本次未能用 Workflow 的雙查核員交叉驗證（環境端 permission handler 清空 subagent 參數）；")
w("   換一個正常 session 重跑 `research/benchmark-accounts-workflow.js` 可得原設計的交叉驗證結果。")
w("")

open(OUT, "w", encoding="utf-8").write("\n".join(L))
print(f"wrote {OUT}: {len(L)} lines")
