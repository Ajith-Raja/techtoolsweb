import re
from collections import Counter
from helper import get_text_from_url

STOPWORDS = set("""
a about above after again against all am an and any are aren't as at be because been before being below between both but
by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't
has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm
i've if in into is isn't it it's its itself let’s me more most mustn't my myself no nor not of off on once only or other
ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's
the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too
under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while
who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves can
""".split())

def clean_text(text):
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text.lower()

def get_ngrams(words, n):
    return [' '.join(words[i:i+n]) for i in range(len(words)-n+1)]

def is_valid_keyword(phrase):
    words = phrase.split()
    return all(w not in STOPWORDS for w in words)

def estimate_reading_time(word_count):
    minutes = word_count / 200
    return f"{round(minutes, 2)} min"

def keyword_density(text, user_focus_keyword=None, top_n=10):
    clean = clean_text(text)
    words = [word for word in clean.split() if word not in STOPWORDS]
    total_words = len(words)

    all_keywords = Counter()
    for n in range(1, 4):
        ngrams = get_ngrams(words, n)
        valid_ngrams = [g for g in ngrams if is_valid_keyword(g)]
        all_keywords.update(valid_ngrams)

    focus_keywords = [kw.lower() for kw in user_focus_keyword] if user_focus_keyword else []

    keyword_list = [
        {
            "keyword": k,
            "count": v,
            "density": round((v / total_words) * 100, 2)
        }
        for k, v in all_keywords.items()
    ]

    keyword_list.sort(key=lambda x: x["count"], reverse=True)
    keyword_list = keyword_list[:50]

    if focus_keywords:
        focus_matches = [k for k in keyword_list if k["keyword"] in focus_keywords]
        rest = [k for k in keyword_list if k["keyword"] not in focus_keywords]
        top_keywords = (focus_matches + rest)[:top_n]
    else:
        top_keywords = keyword_list[:top_n]

    print(keyword_list)
    return {
        "totalWords": total_words,
        "keywords": keyword_list,
        "topKeywords": top_keywords,
        "readingTime": estimate_reading_time(total_words)
    }

# Example usage
if __name__ == "__main__":
    user_input = input("Enter text or URL: ").strip()
    focus_input = input("Enter focus keywords (comma separated): ").strip()

    focus_keywords = [k.strip().lower() for k in focus_input.split(',')] if focus_input else []

    if user_input.startswith("http"):
        content = get_text_from_url(user_input)
    else:
        content = user_input

    result = keyword_density(content, focus_keywords=focus_keywords)

    from pprint import pprint
    pprint(result)