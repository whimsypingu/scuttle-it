import re
import sklearn_crfsuite
import joblib
from pathlib import Path

from core.youtube.metadata_parser.utils import extract_word_features

class YouTubeParser:
    def __init__(self):
        self.model = joblib.load(Path(__file__).resolve().parent / "crf.pkl")
        self.RE_TOKENIZER = re.compile(r"[\w.'?~!@#$%^&*]+(?:[/\-][[\w.'?~!@#$%^&*]+)*|[()\[\]\-|/]")

        class Tag:
            O = "O"
            B_ART = "B-ART"
            I_ART = "I-ART"
            B_TRK = "B-TRK"
            I_TRK = "I-TRK"
        self.Tag = Tag

    def _tokenize(self, text):
        return re.findall(self.RE_TOKENIZER, text)
    
    def _extract_features(self, youtube_title, youtube_uploader):
        all_features = []

        title_words = self._tokenize(youtube_title)
        uploader_words = self._tokenize(youtube_uploader)

        all_words = title_words + uploader_words
        for i in range(len(all_words)):
            features = extract_word_features(title_words, uploader_words, i)
            all_features.append(features)

        return all_features

    def _find_track(self, features, marginals):
        track = []

        TRK_start, TRK_end = -1, -1
        B_TRK_best_confidence = 0
        B_TRK_best_likeliest = False

        for i, (f, m) in enumerate(zip(features, marginals)):
            word = f["word"]

            l = max(m, key=m.get)

            B_TRK_confidence = m[self.Tag.B_TRK]
            I_TRK_confidence = m[self.Tag.I_TRK]

            is_new_best_confidence = B_TRK_confidence > B_TRK_best_confidence
            is_currently_likeliest = l == self.Tag.B_TRK

            can_extend = (l == self.Tag.I_TRK or I_TRK_confidence > B_TRK_best_confidence * 0.5 or I_TRK_confidence > 0.5) and TRK_end == i - 1

            #essentially a priority queue of whether it is the likeliest tag, as well as overall confidence to ensure something is tagged at the end
            match (B_TRK_best_likeliest, is_currently_likeliest, is_new_best_confidence):
                #new start to a track that is the likeliest option
                case (
                    (True, True, True) |
                    (False, True, True) |
                    (False, True, False)
                ):
                    B_TRK_best_likeliest = True
                    B_TRK_best_confidence = B_TRK_confidence
                    TRK_start, TRK_end = i, i

                    track = [word]

                #new start to a track that is best confidence only
                case (False, False, True):
                    TRK_start, TRK_end = i, i
                    B_TRK_best_confidence = B_TRK_confidence

                    track = [word]

                #standard kadane-style I-TRK extension or reset (do nothing)
                case _:
                    if can_extend:
                        TRK_end = i
                        track.append(word)

        return track, (TRK_start, TRK_end)

    def _find_artist(self, features, marginals, TRK_indices):
        artists = []

        current_artist = []
        gap_tokens = []

        GAP_LIMIT = 1 #number of tokens allowed not immediately recognize as a continuation of an artist string

        TRK_start, TRK_end = TRK_indices
        ART_end = -1

        for i, (f, m) in enumerate(zip(features, marginals)):
            if i >= TRK_start and i <= TRK_end:
                continue

            #remove TRK marginal results to prevent pollution and find valid marginals
            vm = {
                tag: confidence for tag, confidence in m.items() if tag not in [self.Tag.B_TRK, self.Tag.I_TRK]
            }

            word = f["word"]

            l = max(vm, key=vm.get)

            B_ART_confidence = vm[self.Tag.B_ART]
            I_ART_confidence = vm[self.Tag.I_ART]

            is_new_artist = l == self.Tag.B_ART #or B_ART_confidence > 0.4

            can_extend = (l == self.Tag.I_ART and current_artist) and ART_end >= i - (GAP_LIMIT + 1)
            is_potential_gap = (current_artist) and ART_end >= i - GAP_LIMIT

            if is_new_artist:
                if current_artist:
                    artists.append(current_artist)
                current_artist = [word]
                ART_end = i

            #valid I-ART token
            elif can_extend:
                current_artist.extend(gap_tokens)
                gap_tokens = []

                current_artist.append(word)
                ART_end = i
        
            #not a valid I-ART but don't kill immediately
            elif is_potential_gap:
                gap_tokens.append(word)
        
            #flush on O label and past extendable window
            else:
                if current_artist:
                    artists.append(current_artist)
                current_artist = []
                gap_tokens = []

        #final flush
        if current_artist:
            artists.append(current_artist)

        return artists

    def _reconstruct(self, features, marginals, youtube_uploader):
        track_pieces, TRK_indices = self._find_track(features, marginals)
        artist_pieces = self._find_artist(features, marginals, TRK_indices)

        track = " ".join(track_pieces)
        if len(artist_pieces) == 0:
            artists = [youtube_uploader]
        else:
            artists = list(dict.fromkeys(" ".join(pieces) for pieces in artist_pieces))

        return track, artists

    def _format(self, track, artists):
        return f"{track} - {", ".join(artists)}"

    def predict(self, youtube_title, youtube_uploader):
        features = self._extract_features(youtube_title, youtube_uploader)
        marginals = self.model.predict_marginals([features])[0]
        track, artists = self._reconstruct(features, marginals, youtube_uploader)
        formatted = self._format(track, artists)
        return track, artists, formatted