import re
import math


def count_syllables(word):
    word = word.lower()
    vowels = "aeiouy"
    count = 0
    prev_was_vowel = False
    for letter in word:
        is_vowel = letter in vowels
        if is_vowel and not prev_was_vowel:
            count += 1
        prev_was_vowel = is_vowel
    if word.endswith("e"):
        count = max(1, count - 1)
    return count if count > 0 else 1

def get_reading_level(score):
    if score >= 90:
        return "Very Easy"
    elif score >= 80:
        return "Easy"
    elif score >= 70:
        return "Fairly Easy"
    elif score >= 60:
        return "Standard"
    elif score >= 50:
        return "Fairly Difficult"
    elif score >= 30:
        return "Difficult"
    else:
        return "Very Confusing"

def get_grade_label(score):
    if score < 5:
        return "Elementary"
    elif score < 8:
        return "Middle School"
    elif score < 12:
        return "High School"
    elif score < 16:
        return "College"
    else:
        return "Graduate"

def estimate_reading_time(word_count):
    average_wpm = 200  # average adult reads ~200 wpm
    minutes = word_count / average_wpm
    mins = int(minutes)
    secs = int((minutes - mins) * 60)
    return f"{mins} min {secs} sec" if mins > 0 else f"{secs} sec"

def analyze_readability(text):
    sentences = re.split(r'[.!?]', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    words = re.findall(r'\w+', text)
    word_count = len(words)
    sentence_count = len(sentences)
    syllable_count = sum(count_syllables(word) for word in words)
    complex_words = sum(1 for word in words if count_syllables(word) >= 3)

    if sentence_count == 0 or word_count == 0:
        return {"error": "Insufficient content"}

    avg_words_per_sentence = word_count / sentence_count
    avg_syllables_per_word = syllable_count / word_count

    # Scores
    flesch_reading_ease = 206.835 - 1.015 * avg_words_per_sentence - 84.6 * avg_syllables_per_word
    flesch_kincaid_grade = 0.39 * avg_words_per_sentence + 11.8 * avg_syllables_per_word - 15.59
    gunning_fog = 0.4 * (avg_words_per_sentence + 100 * (complex_words / word_count))
    smog = 1.0430 * math.sqrt(complex_words * (30 / sentence_count)) + 3.1291

    return {
        "fleschReading": {
            "score": round(flesch_reading_ease, 2),
            "level": get_reading_level(flesch_reading_ease)
        },
        "fleschKincaid": {
            "score": round(flesch_kincaid_grade, 2),
            "grade": get_grade_label(flesch_kincaid_grade)
        },
        "gunningFog": {
            "score": round(gunning_fog, 2),
            "level": get_grade_label(gunning_fog)
        },
        "smog": {
            "score": round(smog, 2),
            "level": get_grade_label(smog)
        },
        "textDetails": {
            "wordCount": word_count,
            "sentenceCount": sentence_count,
            "syllableCount": syllable_count,
            "readingTime": estimate_reading_time(word_count)
        }
    }

