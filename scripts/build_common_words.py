"""
Builds public/common_words.txt: the words that count towards a puzzle's objective.

A word is included when it is:
  - among the most frequent words in a frequency list (one "word count" pair per line)
  - at least three letters long and purely a-z
  - in public/dictionary.txt (so every common word is also accepted by the game)
  - not in public/rude_words.txt or public/common_blocklist.txt

Usage:
  python3 scripts/build_common_words.py path/to/frequency_list.txt [top_n]

The frequency list used originally is en_50k.txt from https://github.com/hermitdave/FrequencyWords
(2018 English list, CC-BY-SA 4.0, derived from OpenSubtitles), with top_n = 20000.
"""

import re
import sys
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / 'public'


def read_words(path: Path) -> set[str]:
    return {line.strip().lower() for line in path.read_text().splitlines() if line.strip()}


def main() -> None:
    frequency_path = Path(sys.argv[1])
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 20000

    dictionary = read_words(PUBLIC / 'dictionary.txt')
    excluded = read_words(PUBLIC / 'rude_words.txt') | read_words(PUBLIC / 'common_blocklist.txt')

    ranked = [line.split()[0] for line in frequency_path.read_text().splitlines() if line.strip()]
    common = sorted(
        {
            w
            for w in ranked[:top_n]
            if len(w) >= 3 and re.fullmatch('[a-z]+', w) and w in dictionary and w not in excluded
        }
    )
    (PUBLIC / 'common_words.txt').write_text('\n'.join(common) + '\n')
    print(f'Wrote {len(common)} words to public/common_words.txt')


if __name__ == '__main__':
    main()
