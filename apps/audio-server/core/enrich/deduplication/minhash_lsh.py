# https://colab.research.google.com/drive/16cxT-iUjo5Ji85qL5IfGyWjymaz9G2yX#scrollTo=Un4dXCkYJ0GW

class MinhashLSH:
    def __init__(
        self,
        buckets: int = 8,
        bucket_size: int = 32,
    ):
        self.buckets = buckets
        self.bucket_size = bucket_size

        self.lsh = [set() for _ in range(buckets)]

    def _normalize_text(self, text):
        return text.lower().strip()

    def _encode(self, text) -> list[int]:
        vec = [0] * self.buckets
        s = f"%{self._normalize_text(text)}%"

        #separate into trigrams
        for i in range(len(s) - 2):
            gram = s[i:i+3]

            #hash trigrams and give them comprehensive bit indices that fit within buckets
            gram_hash = hash(gram) % (self.buckets * self.bucket_size)
            bucket_idx = gram_hash // self.bucket_size
            bit_idx = gram_hash % self.bucket_size

            vec[bucket_idx] |= (1 << bit_idx) #OR

        return vec

    def insert(self, s: str):
        vec = self._encode(s)
        for i, val in enumerate(vec):
            if val == 0:
                continue
            self.lsh[i].add(val)

    def match(self, s: str):
        vec = self._encode(s)
        for i, val in enumerate(vec):
            if val in self.lsh[i]:
                return True

        return False

    def reset(self):
        self.lsh = [set() for _ in range(self.buckets)]
