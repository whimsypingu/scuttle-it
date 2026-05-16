import re
import unicodedata

RE_OPEN = re.compile(r'[\[({]')
RE_CLOSE = re.compile(r'[)\]})]')
RE_SEP = re.compile(r'^([-|/_]+)$') #is a separator

def HAS_AT(w):
    return '@' in w

def HAS_DOLLAR(w):
    return '$' in w

def HAS_PERCENT(w):
    return '%' in w

def HAS_AMPERSAND(w):
    return '&' in w

def HAS_EXCLAMATION(w):
    return '!' in w

def HAS_QUESTION(w):
    return '?' in w

def HAS_PERIOD(w):
    return '.' in w

def HAS_COMMA(w):
    return ',' in w

def HAS_UPPER(w):
    return any(char.isupper() for char in w)

RE_REMIX = re.compile(r'\b(remix|rmx|remaster|mix)(ed?)\b')
RE_LIVE = re.compile(r'\b(live)\b')
RE_LYRICS = re.compile(r'\blyrics?\b')
RE_FEAT = re.compile(r'\b(feat|ft|featuring)\b')

def normalize_word(text, alphanum = False):
    #decompose characters (strip accents) and remove the accents
    text = unicodedata.normalize("NFD", text)
    text = "".join([c for c in text if not unicodedata.combining(c)])

    #lowercase and remove non alphanumeric characters
    text = text.lower()

    if alphanum:
        text = re.sub(r"[^a-z0-9]", "", text)

    return text

#Feature tagging
def extract_word_features(title_words, uploader_words, i):
    tokens = title_words + uploader_words
    total_len = len(tokens)

    word = tokens[i]
    word_norm_hard = normalize_word(word, alphanum=True)

    #basic features
    features = {
        'bias': 1.0,
        'word': word,
        'word.norm()': normalize_word(word),
        'word.is_title': word.istitle(),
        'word.is_upper': word.isupper(),
        'word.has_upper': HAS_UPPER(word),
        'word.is_digit': word.isdigit(),
        'word.length': min(len(word_norm_hard) * 0.1, 1.0),
    }

    #keyword checks
    features.update({
        'word.is_remix': bool(RE_REMIX.search(word_norm_hard)),
        'word.is_live': bool(RE_LIVE.search(word_norm_hard)),
        'word.is_lyrics': bool(RE_LYRICS.search(word_norm_hard)),
        'word.is_feat': bool(RE_FEAT.search(word_norm_hard)),
    })

    #positional context
    features.update({
        'word.pos_ratio': i / total_len,
        'word.is_first': i == 0,
        'word.is_last': i == total_len - 1,
        'word.dist_from_end': ((total_len - 1) - i) / total_len,
    })

    #title or uploader context
    features.update({
        'word.is_title_context': i < len(title_words),
        'word.is_uploader_context': i >= len(title_words),
        'word.is_in_uploader_text': word in uploader_words,
    })

    #character detection
    features.update({
        'word.has_comma': HAS_COMMA(word),
        'word.has_period': HAS_PERIOD(word),
        'word.is_open': bool(RE_OPEN.search(word)),
        'word.is_close': bool(RE_CLOSE.search(word)),
        'word.is_sep': bool(RE_SEP.search(word)),

        'word.has_at': HAS_AT(word),
        'word.has_dollar': HAS_DOLLAR(word),
        'word.has_percent': HAS_PERCENT(word),
        'word.has_ampersand': HAS_AMPERSAND(word),
        'word.has_exclamation': HAS_EXCLAMATION(word),
        'word.has_question': HAS_QUESTION(word),
    })

    #sliding window (history)
    if i > 0:
        prev_word = tokens[i - 1]
        features.update({
            'word-1': prev_word,
            'word-1.has_upper': HAS_UPPER(prev_word),

            'word-1.has_comma': HAS_COMMA(prev_word),
            'word-1.is_open': bool(RE_OPEN.search(prev_word)),
            'word-1.is_close': bool(RE_CLOSE.search(prev_word)),
            'word-1.is_sep': bool(RE_SEP.search(prev_word)),
        })
    else:
        features['BOS'] = True

    if i > 1:
        prev_prev_word = tokens[i - 2]
        features.update({
            'word-2': prev_prev_word,
            'word-2.has_upper': HAS_UPPER(prev_prev_word),

            'word-2.has_comma': HAS_COMMA(prev_prev_word),
            'word-2.is_open': bool(RE_OPEN.search(prev_prev_word)),
            'word-2.is_close': bool(RE_CLOSE.search(prev_prev_word)),
            'word-2.is_sep': bool(RE_SEP.search(prev_prev_word)),
        })

    #sliding window (future)
    if i < total_len - 1:
        next_word = tokens[i + 1]
        features.update({
            'word+1': next_word,
            'word+1.has_upper': HAS_UPPER(next_word),

            'word+1.has_comma': HAS_COMMA(next_word),
            'word+1.is_open': bool(RE_OPEN.search(next_word)),
            'word+1.is_close': bool(RE_CLOSE.search(next_word)),
            'word+1.is_sep': bool(RE_SEP.search(next_word)),
        })
    else:
        features['EOS'] = True

    if i < total_len - 2:
        next_next_word = tokens[i + 2]
        features.update({
            'word+2': next_next_word,
            'word+2.has_upper': HAS_UPPER(next_next_word),

            'word+2.has_comma': HAS_COMMA(next_next_word),
            'word+2.is_open': bool(RE_OPEN.search(next_next_word)),
            'word+2.is_close': bool(RE_CLOSE.search(next_next_word)),
            'word+2.is_sep': bool(RE_SEP.search(next_next_word)),
        })

    return features
