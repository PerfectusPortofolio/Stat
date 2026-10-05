"""
stats_test.py - trial run: open 3 football.com match pages in a real browser,
open the Statistics tab, read the rendered last-N results for each team.
Writes out/ (screenshots, raw widget text, results.json) and a summary
that shows on the GitHub run page.
"""
import json, os, re, time
from collections import Counter
from pathlib import Path
from playwright.sync_api import sync_playwright

URLS = [
    "https://www.football.com/ng/m/n/sport/football/Spain/LALIGA_HYPERMOTION/Cordoba_CF_vs_Tenerife_CD/sr:match:72477458",
    "https://www.football.com/ng/m/n/sport/football/International/UEFA_Nations_League/Montenegro_vs_Armenia/sr:match:68932420",
    "https://www.football.com/ng/m/n/sport/football/Sweden/Division_2/Herrestads_AIF_vs_Grebbestads_IF/sr:match:75126438",
]
OUT = Path("out")
OUT.mkdir(exist_ok=True)

EXTRACT_JS = """
() => [...document.querySelectorAll('.sr-teamform__lastXTeam')].map(b => ({
  side: b.className.includes('srm-left') ? 'left' : (b.className.includes('srm-right') ? 'right' : 'unknown'),
  matches: [...b.querySelectorAll('.sr-last-matches__match')].map(m => {
    const t = s => (m.querySelector(s)?.textContent || '').trim();
    return {wdl: t('.sr-last-matches__wdl'), abbr: t('.sr-last-matches__team'),
            full: t('.sr-last-matches__team-full'), result: t('.sr-last-matches__result')};
  })
}))
"""

PROBE_JS = """
() => [...document.querySelectorAll('*')]
  .filter(e => e.children.length === 0 && /last\\s*\\d+/i.test(e.textContent || ''))
  .slice(0, 12)
  .map(e => ({tag: e.tagName, text: e.textContent.trim().slice(0, 40),
              cls: (e.className || '').toString().slice(0, 70)}))
"""


def to_goals(wdl, raw):
    """Score is shown home:away; orient it using W/D/L. Returns (gf, ga, note)."""
    m = re.search(r"(\d+)\s*:\s*(\d+)", raw)
    if not m:
        return None, None, "no score"
    a, b = int(m.group(1)), int(m.group(2))
    hi, lo = max(a, b), min(a, b)
    note = "pens/AP - check" if re.search(r"[A-Za-z]", raw) else ""
    if wdl == "W":
        return hi, lo, note
    if wdl == "L":
        return lo, hi, note
    if wdl == "D":
        return a, b, note
    return None, None, "unknown result"


def dismiss_consent(page):
    for label in ["Accept all", "Accept", "I agree", "Agree", "Allow all", "Got it", "OK"]:
        try:
            btn = page.get_by_role("button", name=re.compile(rf"^\s*{label}\s*$", re.I)).first
            if btn.count():
                btn.click(timeout=2000)
                print("  dismissed banner via:", label)
                return
        except Exception:
            pass


def open_stats(page):
    """On this site the button is labelled 'Stats' (next to the 1X2 market)."""
    loc = page.locator('text=/^\\s*Stats\\s*$/i')
    n = loc.count()
    print(f"  'Stats' elements found: {n}")
    for i in range(min(n, 3)):
        for force in (False, True):
            try:
                el = loc.nth(i)
                el.scroll_into_view_if_needed(timeout=3000)
                el.click(timeout=4000, force=force)
                print(f"  clicked Stats #{i} (force={force})")
                try:
                    page.wait_for_selector(".sr-bb", timeout=12000)
                    return f"Stats #{i}"
                except Exception:
                    print("   no widget after 12s")
                break
            except Exception as e:
                print(f"   click #{i} force={force} failed:", str(e).split(chr(10))[0][:80])
    return None


def run():
    summary, results = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(**p.devices["Pixel 7"], locale="en-NG", timezone_id="Africa/Lagos")
        for url in URLS:
            teams = url.rstrip("/").split("/")[-2]
            home, away = (x.replace("_", " ") for x in teams.split("_vs_"))
            name = re.sub(r"[^A-Za-z0-9]+", "_", teams)
            row = {"match": f"{home} vs {away}", "url": url}
            print(f"\n=== {home} vs {away}")
            page = ctx.new_page()
            net = []

            def on_resp(r):
                u = r.url
                host = u.split("/")[2] if "//" in u else ""
                rt = r.request.resource_type
                if "sportradar" in host:
                    net.append(f"{r.status} {rt} {host}")
                elif "football.com" in host and rt in ("xhr", "fetch"):
                    net.append(f"{r.status} {rt} {host}{u.split('?')[0][len('https://' + host):][:90]}")

            page.on("response", on_resp)
            fails, errs = [], []

            def on_fail(r):
                u = r.url
                host = u.split("/")[2] if "//" in u else u[:40]
                path = u.split("?")[0]
                last = path.rsplit("/", 1)[-1]
                ext = last.rsplit(".", 1)[-1][:5] if "." in last else "-"
                fails.append((r.failure or "?", host, ext, path[-75:]))
                net.append(f"FAILED {r.resource_type} {host}")

            page.on("requestfailed", on_fail)
            page.on("pageerror", lambda e: errs.append(str(e)[:150]))
            page.on("console", lambda m: errs.append(m.text[:150]) if m.type == "error" else None)
            try:
                resp = page.goto(url, wait_until="domcontentloaded", timeout=60000)
                row["http_status"] = resp.status if resp else None
                print("HTTP", row["http_status"], "| final URL:", page.url[:90], "| title:", page.title()[:70])
                page.wait_for_timeout(4000)
                dismiss_consent(page)
                row["clicked"] = open_stats(page)
                print("opened stats via:", row["clicked"])
                try:
                    page.wait_for_selector(".sr-last-matches__match", timeout=15000)
                    page.wait_for_timeout(2000)
                    row["widget"] = "loaded"
                except Exception:
                    row["widget"] = "NOT LOADED"
                print("widget:", row["widget"])
                print("network (count status type host):")
                print("   sportradar requests:", sum("sportradar" in x for x in net))
                for line, cnt in Counter(net).most_common(8):
                    print(f"   {cnt}x {line}")
                print("failure reasons (count, error, host, file type):")
                for (err, host, ext), cnt in Counter((f[0], f[1], f[2]) for f in fails).most_common(8):
                    print(f"   {cnt}x {err} {host} .{ext}")
                for f in [f for f in fails if f[2] == "js"][:3]:
                    print("   failed js:", f[3])
                print("script tags on page:", page.evaluate("document.querySelectorAll('script[src]').length"),
                      "| sr widget nodes:", page.locator("[data-sr-widget]").count())
                print("page errors:", errs[:5])
                page.screenshot(path=str(OUT / f"{name}.png"), full_page=True)
                body = page.inner_text("body")
                (OUT / f"{name}_text.txt").write_text(body, encoding="utf-8")
                if row["widget"] != "loaded":
                    print("page text starts:", body[:300].replace("\n", " | "))
                blocks = page.evaluate(EXTRACT_JS)
                row["probe_last_x"] = page.evaluate(PROBE_JS)
                for blk, who in zip(blocks, (home, away)):
                    ms = []
                    for m in blk["matches"]:
                        gf, ga, note = to_goals(m["wdl"], m["result"])
                        ms.append({**m, "gf": gf, "ga": ga, "note": note})
                        print(f"  {who:<22} {m['wdl']} vs {m['full'] or m['abbr']:<18} {m['result']:<8} -> {gf}-{ga} {note}")
                    ok = [x for x in ms if x["gf"] is not None]
                    s2 = sum(x["gf"] >= 2 for x in ok)
                    c2 = sum(x["ga"] >= 2 for x in ok)
                    print(f"  {who}: {len(ok)} matches read | scored 2+: {s2} | conceded 2+: {c2}")
                    row.setdefault("teams", {})[who] = {"matches": ms, "n": len(ok), "scored2": s2, "conceded2": c2}
                print("'Last X' elements found:", json.dumps(row["probe_last_x"])[:400])
            except Exception as e:
                row["error"] = str(e)[:300]
                print("ERROR:", row["error"])
            results.append(row)
            summary.append(f"- **{row['match']}**: HTTP {row.get('http_status')}, widget {row.get('widget', 'n/a')}, "
                           + ", ".join(f"{t}: {d['n']} matches" for t, d in row.get("teams", {}).items()))
            page.close()
        browser.close()
    (OUT / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    md = "## Stats test\n" + "\n".join(summary)
    print("\n" + md)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f:
            f.write(md + "\n")


if __name__ == "__main__":
    run()
