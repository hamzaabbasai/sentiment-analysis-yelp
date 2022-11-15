import os
import re
import string
import joblib
from typing import Dict, Any, List, Callable
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer, PorterStemmer

for pkg in ["punkt", "stopwords", "wordnet", "omw-1.4"]:
    try:
        nltk.data.find(f"corpora/{pkg}")
    except LookupError:
        try:
            nltk.download(pkg, quiet=True)
        except Exception:
            pass

_STOP = set(stopwords.words("english"))
_PUNCT_TBL = str.maketrans("", "", string.punctuation)


def _build_lemma_fn() -> Callable[[str], str]:
    try:
        from nltk.corpus import wordnet as wn

        _ = wn.synsets("test")
        wl = WordNetLemmatizer()
        return wl.lemmatize
    except Exception:
        ps = PorterStemmer()
        return ps.stem


_LEMM = _build_lemma_fn()

_DEFAULT_ORDER = ["negative", "neutral", "positive"]

_DEFAULT_ARTIFACT = os.path.join(
    os.path.dirname(__file__), "sentiment_analysis_model.joblib"
)

_cache: Dict[str, Any] = {}


def class_names() -> List[str]:
    art = _load()
    return art.get("class_names", _DEFAULT_ORDER)


def clean_text(s: str) -> str:
    s = str(s).lower()
    s = re.sub(r"https?://\S+|www\.\S+", " ", s)
    s = re.sub(r"<.*?>", " ", s)
    s = s.translate(_PUNCT_TBL)
    toks = word_tokenize(s)
    toks = [w for w in toks if w.isalpha() and w not in _STOP]
    toks = [_LEMM(w) for w in toks]
    return " ".join(toks)


def _softmax(vec):
    import numpy as np

    v = np.asarray(vec, dtype="float64").ravel()
    v = v - np.max(v)
    e = np.exp(v)
    s = e.sum() if e.sum() != 0 else 1.0
    return (e / s).tolist()


def _load():
    global _cache
    if "artifact" not in _cache:
        if not os.path.exists(_DEFAULT_ARTIFACT):
            raise FileNotFoundError(f"Model not found at '{_DEFAULT_ARTIFACT}'. ")
        _cache["artifact"] = joblib.load(_DEFAULT_ARTIFACT)
    return _cache["artifact"]


def predict_proba(text: str) -> Dict[str, float]:
    art = _load()
    vec = art["vectorizer"]
    clf = art["classifier"]
    order = art.get("class_names", _DEFAULT_ORDER)
    X = vec.transform([clean_text(text)])

    if hasattr(clf, "predict_proba"):
        probs = clf.predict_proba(X)[0]
        if hasattr(clf, "classes_"):
            import numpy as np

            order_idx = np.argsort(clf.classes_)
            probs = probs[order_idx]
    elif hasattr(clf, "decision_function"):
        scores = clf.decision_function(X)
        import numpy as np

        scores = np.asarray(scores).ravel()
        probs = _softmax(scores)
    else:
        idx = int(clf.predict(X)[0])
        probs = [0.0] * len(order)
        probs[idx] = 1.0

    return {name: float(p) for name, p in zip(order, probs)}


def predict_label(text: str):
    order = class_names()
    proba = predict_proba(text)
    best_idx = max(range(len(order)), key=lambda i: proba[order[i]])
    return best_idx, proba
