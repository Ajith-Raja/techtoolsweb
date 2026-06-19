import nltk
#nltk.download('punkt')
import os
from googleapiclient.discovery import build
from nltk import sent_tokenize
from difflib import SequenceMatcher
import os
import requests
from bs4 import BeautifulSoup
from helper import get_config_value
from googlesearch import search
import re
from collections import defaultdict
from datetime import datetime
import time

# Function to initialize Google Custom Search API
def create_service(api_key, search_engine_id):
    return build("customsearch", "v1", developerKey=api_key), search_engine_id

# Function to query Google Custom Search API
def search_google(service, search_engine_id, query):
    try:
        res = service.cse().list(q=query, cx=search_engine_id).execute()
        return res.get('items', [])
    except Exception as e:
        print(f"Error querying Google: {e}")
        return []

def remove_ending_dot(sentence):
    return sentence.rstrip('.')

def fetch_page_content(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            for script_or_style in soup(['script', 'style', 'noscript']):
                script_or_style.decompose()
            return soup.get_text()
        else:
            print(f"Failed to fetch content from {url}")
            return ""
    except Exception as e:
        print(f"Error fetching page content: {e}")
        return ""

# Function to check for plagiarism in a given text
def check_plagiarism(api_key, search_engine_id, text):
    print("Current Date and Time:", datetime.now())
    plagiarism_results = []
    sentences = sent_tokenize(text)
    
    # Remove the ending dots from each sentence
    sentences = [remove_ending_dot(sentence) for sentence in sentences]
    matched_text = ''
    sentencelen = len(sentences)
    print(sentencelen)
    skip = 1
    if sentencelen >= 30:
        skip = 3
    elif sentencelen < 30 and sentencelen >= 15:
        skip = 2
    else:
        skip = 1

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
    #google_home = "https://www.google.com"
    #response = requests.get(google_home, headers=headers)
    #cookies = response.cookies.get_dict()

    #for sentence in sentences:
    for i in range(0, sentencelen):
        # Query each sentence
        sentence = sentences[i].strip()
        sentence1 = f"\"{sentence}\""
        if len(sentence) < 10:
            continue
        else:
            try:
                #print("Current Date and Time:", datetime.now())
                #search_url = f"https://www.google.com/search?q={sentence1}"
                results = list(search(sentence1))
                time.sleep(3)
                #results = search_google1(sentence1)
                #search_response = requests.get(search_url, headers=headers, cookies=cookies)
                if "HTTP Error 429" in results:
                    service, cx = create_service(api_key, search_engine_id)
                    results = search_google(service, cx, sentence1)
                    if results:
                        #print(f"Plagiarized Sentence: {sentence}")
                        matched_text += f"{sentence}. "
                        plagiarism_results.append({
                            "sentence": sentence,
                            "url": results[0]['formattedUrl'],
                            #"content": results[0]['snippet']
                        })
                    else:
                        print(f"No plagiarism found for: {sentence}")
                else:
                    #soup = BeautifulSoup(search_response.text, "html.parser")
                    #time.sleep(0.8)

                    #results = []
                    #for g in soup.find_all("div", class_="tF2Cxc"):
                    #    #title = g.find("h3").text if g.find("h3") else None
                     #   link = g.find("a")["href"] if g.find("a") else None
                     #   results.append({"link": link})
                    #print("Current Date and Time:", datetime.now())
                    #print(search_response.text)
                    if results:
                        #results = list(results)
                        matched_text += f"{sentences[i].strip()}. "
                        plagiarism_results.append({
                            "sentence": sentences[i].strip(),
                            "url": results[0]
                        })
                            
                            
            except Exception as e:
                print(e)
                service, cx = create_service(api_key, search_engine_id)
                results = search_google(service, cx, sentence)
                if results:
                    #print(f"Plagiarized Sentence: {sentence}")
                    matched_text += f"{sentence}. "
                    plagiarism_results.append({
                        "sentence": sentence,
                        "url": results[0]['formattedUrl'],
                        #"content": results[0]['snippet']
                    })
    #print(matched_text)
    print("Current Date and Time:", datetime.now())
    unique, plagiarized = calculate_percentage1(text, matched_text)
    #print(unique)
    #print(plagiarized)
    grouped_by_url = defaultdict(list)
    #print(plagiarism_results)
    for result in plagiarism_results:
        url = result["url"]
        sentence = result["sentence"]
        grouped_by_url[url] += sentence + "\n"

    highlighted_content = text
    grouped_by_url1 = defaultdict(list)
    for url, sentences in grouped_by_url.items():
        response = requests.get(url, timeout=13)
        soup = BeautifulSoup(response.content, 'html.parser')
        #print(url)
        #print(sentences)
        sents = ''.join(sentences).split("\n")
        #print(sents)
        sents = matched_text.split(". ")
        for sent in sents:
            senttrim = sent.strip()
            #print(senttrim)
            if senttrim != "" and senttrim in soup.get_text().replace('\n', '').replace('\r', '').strip():
                #print(sent)
                highlighted_content = re.sub(re.escape(senttrim), f"<mark>{senttrim}</mark>", highlighted_content, flags=re.IGNORECASE)
                grouped_by_url1[url] += sent + "\n"
                print("hi")
    plagiarism_results = []

    for url, sentences in grouped_by_url1.items():
        plagiarism_results.append({
            "snippet": ''.join(sentences),
            "url": url,
                    #"content": results[0]['snippet']
        })
    print("Current Date and Time:", datetime.now())
    return plagiarism_results, unique, plagiarized, highlighted_content

def calculate_percentage(original_text, matched_text):
    # Tokenize the texts into words
    original_words = re.findall(r'\w+', original_text.lower())
    matched_words = re.findall(r'\w+', matched_text.lower())
    
    # Count total number of words in the original text
    total_words = len(original_words)
    
    # Find the intersection (i.e., the common words)
    plagiarized_words = set(original_words) & set(matched_words)
    plagiarized_count = sum(original_words.count(word) for word in plagiarized_words)

    # Calculate percentage of plagiarized and unique text
    plagiarism_percentage = (plagiarized_count / total_words) * 100
    unique_percentage = 100 - plagiarism_percentage

    return unique_percentage, plagiarism_percentage

def calculate_percentage1(original_text, matched_text):
    main_sentences = original_text.split('.')
    filtered_sentences = matched_text.split('.')
    
    # Normalize sentences by stripping extra spaces and converting to lowercase
    main_sentences = [sentence.strip().lower() for sentence in main_sentences if sentence.strip()]
    filtered_sentences = [sentence.strip().lower() for sentence in filtered_sentences if sentence.strip()]
    #print(main_sentences)
    #print(filtered_sentences)
    # Check similarity
    total_sentences = len(filtered_sentences)
    matched_sentences = 0
    unmatched_sentences = 0
    
    for sentence in filtered_sentences:
        if sentence in main_sentences:
            matched_sentences += 1
        else:
            unmatched_sentences += 1
    
    #print(unmatched_sentences)
    #print(matched_sentences)
    # Calculate percentages
    if total_sentences == 0:
        return 0, 0  # Avoid division by zero
    
    similarity_percentage = (matched_sentences / total_sentences) * 100
    dissimilarity_percentage = (unmatched_sentences / total_sentences) * 100

    return dissimilarity_percentage, similarity_percentage

def calculate_similarity(text1, text2):
    return SequenceMatcher(None, text1, text2).ratio()


def check_plagiarism_using_text(data):
    API_KEY = get_config_value('GOOGLE_API')
    SEARCH_ENGINE_ID = get_config_value('CX_KEY')
    result = check_plagiarism(API_KEY, SEARCH_ENGINE_ID, data)
    return result

def search_google1(query):
    # Simulate a user-agent to avoid blocking
    time.sleep(3)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
    
    try:
        # Send request to Google Search
        response = requests.get(f"https://www.google.com/search?q={query}", headers=headers)
        
        # Check the response status code
        if response.status_code == 429:
            print("Too Many Requests. Retrying after a pause...")
            time.sleep(5)  # Delay before retrying
            return search_google1(query)  # Retry the search
        elif response.status_code != 200:
            print(f"Error: {response.status_code}")
            return None
        
        # Parse HTML content using BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        print(soup)
        # Example: Extract search result titles
        result1 = []
        for result in soup.find_all('a'):
            print(result)
            result1.append(result)
    
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return None

# Example usage
if __name__ == "__main__":
    # Set up your Google Custom Search API key and Search Engine ID
    API_KEY = get_config_value('GOOGLE_API')
    SEARCH_ENGINE_ID = get_config_value('CX_KEY')
    
    # Example text
    text = """
    "Communication is a cornerstone of connection.. but language barriers can often hinder its flow. If you find yourself wanting to yourself in Tamil.. Hindi.. Kannada.. Telugu.. or Malayalam.."
    """

    #is_plagiarized, plagiarism_percentage = check_deep_plagiarism(API_KEY, SEARCH_ENGINE_ID, text, threshold=0.3)
    # Check for plagiarism
