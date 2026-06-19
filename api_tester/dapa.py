import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import whois
import datetime
import time
import socket
import ssl
import tldextract

def get_domain_authority(domain):
    """
    Estimate DOMAIN authority (not page authority) based on domain-wide factors
    Returns a score between 0-100 (higher is better)
    """
    try:
        # Initialize score
        score = 0
        
        # 1. Domain Age (max 25 points)
        age_score = check_domain_age(domain)
        score += age_score
        
        # 2. SSL Certificate (max 10 points)
        ssl_score = check_ssl_certificate(domain)
        score += ssl_score
        
        # 3. Domain Registration Details (max 15 points)
        registration_score = check_domain_registration(domain)
        score += registration_score
        
        # 4. Website Size Estimation (max 20 points)
        size_score = estimate_website_size(domain)
        score += size_score
        
        # 5. Domain Popularity Signals (max 30 points)
        popularity_score = estimate_domain_popularity(domain)
        score += popularity_score
        
        # Normalize score to 0-100 range
        final_score = min(100, max(0, score))
        
        return round(final_score, 2)
    
    except Exception as e:
        print(f"Error calculating domain authority: {e}")
        return 0

def check_domain_age(domain):
    """Check domain registration age (max 25 points)"""
    try:
        domain_info = whois.whois(domain)
        
        if isinstance(domain_info.creation_date, list):
            creation_date = domain_info.creation_date[0]
        else:
            creation_date = domain_info.creation_date
            
        if creation_date:
            age_years = (datetime.datetime.now() - creation_date).days / 365
            # 1.5 points per year, max 25 points
            return min(25, age_years * 1.5)
    except:
        pass
    return 0

def check_ssl_certificate(domain):
    """Check SSL certificate validity (max 10 points)"""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443)) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()
                # Check if certificate is valid and not self-signed
                if cert and 'issuer' in cert and 'O' in cert['issuer'][0] and 'self' not in cert['issuer'][0]['O'].lower():
                    return 10
    except:
        pass
    return 0

def check_domain_registration(domain):
    """Check domain registration details (max 15 points)"""
    try:
        domain_info = whois.whois(domain)
        score = 0
        
        # Check expiration date (longer is better)
        if domain_info.expiration_date:
            if isinstance(domain_info.expiration_date, list):
                exp_date = domain_info.expiration_date[0]
            else:
                exp_date = domain_info.expiration_date
                
            years_remaining = (exp_date - datetime.datetime.now()).days / 365
            score += min(5, years_remaining)
        
        # Check if domain has whois privacy (negative signal)
        if 'privacy' in str(domain_info).lower() or 'redacted' in str(domain_info).lower():
            score -= 3
        
        # Check if contact info is complete
        if hasattr(domain_info, 'emails') and domain_info.emails:
            score += 3
        if hasattr(domain_info, 'org') and domain_info.org:
            score += 4
            
        return max(0, score)
    except:
        return 0

def estimate_website_size(domain):
    """Estimate website size through sitemap and homepage analysis (max 20 points)"""
    try:
        # Try to find sitemap
        sitemap_urls = [
            f"https://{domain}/sitemap.xml",
            f"https://{domain}/sitemap_index.xml",
            f"https://{domain}/sitemap.txt",
            f"https://{domain}/sitemap"
        ]
        
        for sitemap_url in sitemap_urls:
            try:
                response = requests.get(sitemap_url, timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
                if response.status_code == 200:
                    # Count URLs in sitemap
                    if 'xml' in sitemap_url:
                        soup = BeautifulSoup(response.content, 'lxml')
                        urls = soup.find_all('url') or soup.find_all('loc')
                        count = len(urls)
                    else:
                        count = len(response.text.splitlines())
                    
                    # Score based on number of pages
                    if count > 10000: return 20
                    elif count > 5000: return 16
                    elif count > 1000: return 12
                    elif count > 500: return 8
                    elif count > 100: return 5
            except:
                continue
        
        # Fallback: Analyze homepage links
        response = requests.get(f"https://{domain}", timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Count unique internal links
        internal_links = set()
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if href.startswith('/') or domain in href:
                if '#' not in href and 'mailto:' not in href and 'tel:' not in href:
                    internal_links.add(href.split('?')[0])  # Remove query strings
        
        count = len(internal_links)
        if count > 100: return 10
        elif count > 50: return 7
        elif count > 20: return 4
        else: return 2
        
    except:
        return 0

def estimate_domain_popularity(domain):
    """Estimate domain popularity through various signals (max 30 points)"""
    try:
        score = 0
        
        # 1. Check if domain has www prefix redirect (standard practice)
        try:
            response = requests.get(f"http://{domain}", timeout=5, allow_redirects=True)
            final_url = response.url.lower()
            if 'www.' in final_url:
                score += 3
        except:
            pass
        
        # 2. Check for social media links on homepage
        response = requests.get(f"https://{domain}", timeout=5, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.content, 'html.parser')
        
        social_links = 0
        social_domains = ['facebook.com', 'twitter.com', 'linkedin.com', 
                         'instagram.com', 'youtube.com', 'pinterest.com']
        
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if any(social in href for social in social_domains):
                social_links += 1
        
        score += min(5, social_links)
        
        # 3. Check for references to other authoritative sites
        external_refs = 0
        authoritative_domains = ['wikipedia.org', 'google.com', 'microsoft.com',
                               'apple.com', 'gov.', 'edu.', 'nytimes.com']
        
        for link in soup.find_all('a', href=True):
            href = link['href'].lower()
            if any(ref in href for ref in authoritative_domains):
                external_refs += 1
            elif href.startswith('http') and domain not in href:
                external_refs += 0.5  # General external link
        
        score += min(10, external_refs / 2)
        
        # 4. Check for standard pages (About, Contact, Privacy Policy)
        standard_pages = 0
        page_urls = [a['href'].lower() for a in soup.find_all('a', href=True)]
        
        for term in ['about', 'contact', 'privacy', 'terms']:
            if any(term in url for url in page_urls):
                standard_pages += 1
        
        score += min(5, standard_pages * 1.5)
        
        # 5. Check domain name quality
        extracted = tldextract.extract(domain)
        if len(extracted.domain) <= 15 and '-' not in extracted.domain:
            score += 2
        if extracted.domain.isalpha():  # No numbers
            score += 2
            
        return min(30, score)
    
    except:
        return 0

if __name__ == "__main__":
    domain = input("Enter domain to check (without http/https): ").strip()
    
    # Extract root domain if subdomain is provided
    extracted = tldextract.extract(domain)
    domain_to_check = f"{extracted.domain}.{extracted.suffix}"
    
    print(f"\nCalculating Domain Authority for: {domain_to_check}")
    score = get_domain_authority(domain_to_check)
    print(f"\nEstimated Domain Authority Score: {score}/100")
    
    # Interpretation
    if score >= 80:
        print("Excellent Authority - Established, trustworthy domain")
    elif score >= 60:
        print("Good Authority - Strong domain with good signals")
    elif score >= 40:
        print("Average Authority - Moderate credibility")
    elif score >= 20:
        print("Weak Authority - New or limited domain")
    else:
        print("Poor Authority - Very new or suspicious domain")