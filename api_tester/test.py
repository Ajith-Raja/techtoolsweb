import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import pandas as pd
from fpdf import FPDF
from datetime import datetime
import json
import time

BASE_URL = "https://techtoolsweb.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"}

checked_urls = set()
page_results = []
issue_counter = {}

def fetch(url):
    try:
        start = time.time()
        response = requests.get(url, headers=HEADERS, timeout=10)
        load_time = time.time() - start
        return response, load_time
    except Exception as e:
        return None, 0

def is_internal(url):
    return urlparse(url).netloc == urlparse(BASE_URL).netloc

def record_issue(title, description, impact, url, recommendation):
    key = f"{title}:{description}"
    issue_counter.setdefault(key, {
        "type": "error" if impact == "high" else "warning" if impact == "medium" else "info",
        "title": title,
        "description": description,
        "affectedPages": [],
        "impact": impact,
        "recommendation": recommendation
    })
    issue_counter[key]["affectedPages"].append(url)
    return {
        "type": issue_counter[key]["type"],
        "title": title,
        "description": description,
        "impact": impact,
        "recommendation": recommendation
    }

def crawl_parent_paths(url):
    parsed = urlparse(url)
    segments = parsed.path.strip("/").split("/")
    for i in range(1, len(segments)):
        parent_path = "/" + "/".join(segments[:i]) + "/"
        parent_url = urljoin(f"{parsed.scheme}://{parsed.netloc}", parent_path)
        if parent_url not in checked_urls:
            crawl(parent_url)

def crawl(url):
    if url in checked_urls or not is_internal(url):
        return
    checked_urls.add(url)
    #print(checked_urls)
    #print(url)

    resp, load_time = fetch(url)
    issues = []
    title, meta_desc, word_count, h1_count = "", "", 0, 0
    mobile_responsive = False  # Skipping real check for now

    if not resp:
        issues.append(record_issue("Page unreachable", "Request failed", "high", url, "Ensure the server is accessible."))
        status_code = 0
    else:
        status_code = resp.status_code
        soup = BeautifulSoup(resp.text, "html.parser")

        title = soup.title.string.strip() if soup.title else ""
        meta_tag = soup.find("meta", attrs={"name": "description"})
        meta_desc = meta_tag["content"].strip() if meta_tag else ""

        h1_count = len(soup.find_all("h1"))
        word_count = len(soup.get_text(strip=True).split())

        if not title:
            issues.append(record_issue("Missing <title>", "Page lacks a <title> tag", "high", url, "Add a descriptive title tag."))
        if not meta_desc:
            issues.append(record_issue("Missing meta description", "Page has no meta description tag", "medium", url, "Add a concise meta description."))
        if h1_count == 0:
            issues.append(record_issue("Missing H1 tag", "No H1 found", "medium", url, "Ensure each page has a primary heading."))
        if "http://" in url:
            issues.append(record_issue("Non-HTTPS page", "Uses HTTP instead of HTTPS", "high", url, "Redirect HTTP to HTTPS."))

        if status_code == 404:
            issues.append(record_issue("404 Error", "Page not found", "high", url, "Fix broken links or create the missing page."))
        if status_code == 200 and word_count < 50:
            issues.append(record_issue("Thin content", "Very low word count", "medium", url, "Provide more valuable content."))

        for img in soup.find_all("img"):
            if not img.get("alt"):
                issues.append(record_issue("Missing image alt text", "One or more images lack alt text", "low", url, "Add alt attributes to all images."))

    page_results.append({
        "url": url,
        "title": title,
        "metaDescription": meta_desc,
        "h1Count": h1_count,
        "wordCount": word_count,
        "statusCode": status_code,
        "loadTime": round(load_time, 2),
        "mobileResponsive": mobile_responsive,
        "issues": issues
    })

    # Follow internal links
    if resp and resp.status_code == 200:
        print("hi")
        soup = BeautifulSoup(resp.text, "html.parser")
        for link in soup.find_all("a", href=True):
            full_url = urljoin(url, link["href"])
            if is_internal(full_url):
                crawl_parent_paths(full_url)
                print("hi2")
                crawl(full_url)


def check_robots():
    url = urljoin(BASE_URL, "/robots.txt")
    resp, _ = fetch(url)
    return resp and resp.status_code == 200 and "User-agent" in resp.text

def check_sitemap():
    url = urljoin(BASE_URL, "/sitemap.xml")
    resp, _ = fetch(url)
    return resp and resp.status_code == 200 and "<urlset" in resp.text

def export_pdf(data):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=10)
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, "Pre-Launch SEO Audit Report", ln=True, align="C")
    pdf.set_font("Arial", size=10)

    for page in data:
        pdf.cell(200, 10, f"URL: {page['url']}", ln=True)
        pdf.multi_cell(0, 8, f"Issues: {len(page['issues'])}")
        for issue in page["issues"]:
            pdf.multi_cell(0, 8, f"- {issue['impact'].capitalize()} | {issue['title']}: {issue['description']}")
        pdf.ln(5)
        pdf.cell(200, 5, "-" * 80, ln=True)

    pdf.output("seo_audit_report.pdf")

def export_csv():
    rows = []
    for page in page_results:
        for issue in page["issues"]:
            rows.append({
                "URL": page["url"],
                "Issue Type": issue["type"],
                "Impact": issue["impact"],
                "Title": issue["title"],
                "Description": issue["description"],
                "Recommendation": issue["recommendation"]
            })
    df = pd.DataFrame(rows)
    df.to_csv("seo_audit_report.csv", index=False)

def build_audit_result():
    total_issues = [i for page in page_results for i in page["issues"]]
    high = sum(1 for i in total_issues if i["impact"] == "high")
    med = sum(1 for i in total_issues if i["impact"] == "medium")
    low = sum(1 for i in total_issues if i["impact"] == "low")
    total_pages = len(page_results)
    pages_with_issues = sum(1 for p in page_results if p["issues"])
    max_score = total_pages * 10
    score = max(0, max_score - high * 3 - med * 2 - low)
    percent_score = round((score / max_score) * 100, 2) if max_score else 100

    return {
        "siteScore": percent_score,
        "totalPages": total_pages,
        "pagesWithIssues": pages_with_issues,
        "criticalIssues": high,
        "warningIssues": med,
        "infoIssues": low,
        "commonIssues": list(issue_counter.values()),
        "pageResults": page_results,
        "crawlDate": datetime.utcnow().isoformat()
    }

# === RUN AUDIT ===
#print("Checking robots.txt:", "✅" if check_robots() else "❌ Missing")
#print("Checking sitemap.xml:", "✅" if check_sitemap() else "❌ Missing")

#print("Starting SEO crawl...")
#crawl(BASE_URL)
crawl("https://techtoolsweb.com")
audit_result = build_audit_result()
print(audit_result)

# EXPORTS
#audit_result = build_audit_result()
#export_pdf(page_results)
#export_csv()
#with open("seo_audit_report.json", "w") as f:
#    json.dump(audit_result, f, indent=2)

#print("✅ SEO Audit complete")
#print("Reports generated: CSV, PDF, JSON")
