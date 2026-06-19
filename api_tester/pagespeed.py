from helper import get_config_value
import requests

def measure_page_speed_with_google(url, strategy):
    try:
        API_KEY = get_config_value('GOOGLE_API')
        endpoint = get_config_value('PAGE_SPEED')
        params = {
            "url": url,
            "key": API_KEY,
            "strategy": strategy  # You can choose 'mobile' or 'desktop'
        }
        response = requests.get(endpoint, params=params)
        if response.status_code == 200:
            data = response.json()
            # Extract relevant performance data, e.g., Lighthouse performance score
            lighthouseResult = data['lighthouseResult']
            performance_score = lighthouseResult['categories']['performance']['score'] * 100
            screenshots = lighthouseResult['audits']['screenshot-thumbnails']['details']['items']
            speed_index = lighthouseResult['audits']['speed-index']['displayValue']
            fcp = lighthouseResult['audits']['first-contentful-paint']['displayValue']
            lcp = lighthouseResult['audits']['largest-contentful-paint']['displayValue']
            tbt = lighthouseResult['audits']['total-blocking-time']['displayValue']
            cls1 = lighthouseResult['audits']['cumulative-layout-shift']['displayValue']

            # Extract the last screenshot
            last_screenshot_data = screenshots[-1]['data']
            return performance_score, last_screenshot_data, speed_index, fcp, lcp, tbt, cls1
        else:
            print(f"Failed to retrieve data. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error measuring page speed with Google: {e}")
        return None