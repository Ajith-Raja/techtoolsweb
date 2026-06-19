import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from helper import get_config_value
import requests
from bs4 import BeautifulSoup
import whois
from datetime import datetime
import textstat
from pagespeed import measure_page_speed_with_google

def get_page_content(url):
    headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.text
    else:
        raise Exception("Failed to retrieve the page content")

def measure_page_speed(url):
    try:
        desktop, desktopss, desktopsi, fcpd, lcpd, tbtd, clsd = measure_page_speed_with_google(url, 'desktop')

        return desktop
    except Exception as e:
        print(f"Error measuring page speed with Google: {e}")
        return None

def get_domain_age_calc(domain):
    try:
        domain_info = whois.whois(domain)
        if domain_info.creation_date:
        #if True:
            # Convert to datetime if necessary
            creation_date = domain_info.creation_date[0] if isinstance(domain_info.creation_date, list) else domain_info.creation_date
            domain_age = (datetime.now() - creation_date).days / 365
            #domain_age = 340 / 365
            # Quality is assumed to be better as the domain gets older
            quality_score = min(domain_age / 10, 1)  # Normalize to 0-1
            print(quality_score)
            return domain_age #quality_score * 100  # Scale to 0-100
        else:
            return 0
    except Exception as e:
        print(f"Error fetching domain quality: {e}")
        return 0

def count_backlinks(url):
    # A placeholder function for counting backlinks
    # Real implementation would use web scraping or SEO tools
    count = get_bing_backlinks(url)
    print(count)
    return count

def get_bing_backlinks(page_url):
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    response = requests.get(page_url, headers=headers)
    
    if response.status_code == 200: 
        # Parse the HTML content of the page 
        soup = BeautifulSoup(response.text, 'html.parser') 
 
        # Find and extract backlinks from the HTML 
        backlinks = set() 
        for a_tag in soup.find_all('a', href=True):
            print(a_tag['href'])
            link = a_tag['href'] 
            if link.startswith('http') or link.startswith('www'): 
                backlinks.add(link) 
 
        return len(backlinks) 
    else: 
        print(f"Failed to retrieve page. Status code: {response.status_code}")

def calculate_content_quality(content):
    # Placeholder for content quality calculation
    soup = BeautifulSoup(content, 'html.parser')
    for tag in soup(['script', 'style', 'noscript']):
        tag.decompose()
    text = soup.get_text(separator=' ', strip=True)
    
    if len(text.split()) < 100:
        return 0

    readability = textstat.flesch_reading_ease(text)
    return min(max(readability / 100, 0), 1) * 10

def calculate_spam_score(url):
    spam_keywords = ['cheap', 'viagra', 'free', 'offer', 'gambling']
    content = get_page_content(url)
    text = BeautifulSoup(content, 'html.parser').get_text(separator=' ', strip=True).lower()
    return sum(keyword in text for keyword in spam_keywords)

def calculate_page_authority(url):
    try:
        domain = url.split("//")[-1].split("/")[0]
        content = get_page_content(url)
        domain_age = get_domain_age_calc(domain)
        backlinks = count_backlinks(url)
        content_quality = calculate_content_quality(content)
        pagespeed_score = measure_page_speed(url)

        # Normalized and weighted scores
        age_score = min(domain_age / 20, 1) * 20
        backlink_score = min(backlinks / 100, 1) * 30
        content_score = min(content_quality / 10, 1) * 50
        pagespeed_score_weighted = min((pagespeed_score or 0) / 100, 1) * 20

        page_authority_score = age_score + backlink_score + content_score
        domain_authority_score = age_score + backlink_score

        # Construct the result in AuthorityInfo interface format
        authority_info = {
            "domain": domain,
            "domain_authority": round(domain_authority_score, 2),
            "domainAuthority": round(domain_authority_score, 2),
            "page_authority": round(page_authority_score, 2),
            "pageAuthority": round(page_authority_score, 2),
            "spam_score": calculate_spam_score(url),
            "spamScore": None,
            "linking_domains": None,
            "linkingDomains": None,
            "total_backlinks": backlinks,
            "totalBacklinks": backlinks,
            "top_keywords": [],
            "topKeywords": [],
            "top_backlinks": []  # You can populate with backlink info if available
        }

        return authority_info

    except Exception as e:
        print(f"Failed to get authority info: {e}")
        return None