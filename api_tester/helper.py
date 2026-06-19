# config_helper.py
import requests
from bs4 import BeautifulSoup
import config

def get_config_value(key):

    
    # Fetch the value from the configuration class
    return getattr(config.Config, key, None)

def get_text_from_url(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        return soup.get_text(separator=' ')
    except Exception as e:
        return ""