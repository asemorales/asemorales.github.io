#!/usr/bin/env python3
"""Regenerate styles/asemorales/Typos*.yml from Wikipedia's AutoWikiBrowser typo list.

Run with `npm run typos`.
"""

import html
import itertools
import json
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

SOURCE = "Wikipedia:AutoWikiBrowser/Typos"
URL = f"https://en.wikipedia.org/w/index.php?title={SOURCE}&action=raw"
USER_AGENT = "asemorales-vale-config (https://asemorales.github.io)"
LINK = "https://en.wikipedia.org/wiki/Wikipedia:AutoWikiBrowser/Typos"

STYLES = Path(__file__).resolve().parent.parent / "styles"
OUTPUT_DIR = STYLES / "asemorales"
SKIPPED = STYLES / "skipped_typos.txt"

MAX_VARIANTS = 96
MAX_CLASS_VALUES = 8
OPEN_SUFFIX = "…"
MAX_RULE_BYTES = 60_000
MAX_RULE_SWAPS = 1000
MAX_KEY_LENGTH = 1000

NON_TYPO_SECTIONS = {
    "New: Euphemisms",
    "New: contractions",
    "New: remove redundant words",
    "New: Symbols/HTML entities",
    "New: calendar dates",
    "New: medals",
}
WIKI_MARKUP = re.compile(r"\[\[|\]\]|\{\{|\}\}|''|</?[a-zA-Z]|&[a-z]+;|<nowiki|\|\w+=")
APOSTROPHES = set("'’´ˈ׳᾿‘′Ꞌꞌ`;")

SMOKE_TESTS = [
    ("We accomodate them.", "accommodat…"),
    ("We recieve them.", "receive"),
    ("Their desktiops broke.", "desktops"),
    ("Desktiops broke.", "Desktops"),
    ("I think we can't, and you won't.", None),
    ("My friends and I don't mind, and you shouldn't either.", None),
    ("You'll see, and You’ll agree that it’s fine. Don’t worry.", None),
]


class Unconvertible(Exception):
    pass


class Parser:
    def __init__(self, pattern):
        self.p = pattern
        self.i = 0
        self.groups = 0

    def peek(self):
        return self.p[self.i] if self.i < len(self.p) else ""

    def parse(self):
        node = self.alternation()
        if self.i != len(self.p):
            raise Unconvertible("unbalanced parenthesis")
        return node

    def alternation(self):
        branches = [self.sequence()]
        while self.peek() == "|":
            self.i += 1
            branches.append(self.sequence())
        return ("alt", branches)

    def sequence(self):
        items = []
        while self.peek() not in ("", "|", ")"):
            items.append(self.quantified())
        return ("seq", items)

    def quantified(self):
        atom = self.atom()
        match = re.compile(r"(?:[*+?]|\{\d+(?:,\d*)?\})[?+]?").match(self.p, self.i)
        if not match:
            return atom
        self.i = match.end()
        return ("rep", atom, match.group())

    def atom(self):
        c = self.peek()
        if c == "(":
            return self.group()
        if c == "[":
            return self.char_class()
        if c == "\\":
            return self.escape()
        self.i += 1
        if c in "^$":
            return ("zero", c)
        if c == ".":
            return ("any", c)
        return ("lit", c, c)

    def group(self):
        self.i += 1
        if self.peek() != "?":
            self.groups += 1
            number = self.groups
            body = self.alternation()
            self.close()
            return ("capture", number, body)
        match = re.compile(r"\?(?:[=!:>]|<[=!]|[imsxn-]+:?)").match(self.p, self.i)
        if not match:
            raise Unconvertible("named or conditional group")
        self.i = match.end()
        prefix = "(" + match.group()
        if prefix.endswith((":", ">")) or prefix[-1] in "=!":
            body = self.alternation()
            self.close()
            kind = "look" if prefix[-1] in "=!" else "group"
            return (kind, prefix, body)
        self.close()
        return ("zero", prefix + ")")

    def close(self):
        if self.peek() != ")":
            raise Unconvertible("unbalanced parenthesis")
        self.i += 1

    def char_class(self):
        start = self.i
        self.i += 1
        if self.peek() == "^":
            self.i += 1
        if self.peek() == "]":
            self.i += 1
        while self.peek() != "]":
            if not self.peek():
                raise Unconvertible("unterminated character class")
            self.i += 2 if self.peek() == "\\" else 1
        self.i += 1
        return ("class", self.p[start : self.i])

    def escape(self):
        start = self.i
        self.i += 1
        c = self.peek()
        self.i += 1
        if c.isdigit() and c != "0":
            raise Unconvertible("backreference")
        if c in "pP":
            end = self.p.index("}", self.i) + 1
            self.i = end
            return ("any", self.p[start:end])
        if c in "uxc":
            raise Unconvertible("character-code escape")
        src = self.p[start : self.i]
        if c == "s":
            return ("space", src)
        if c in "bBAzZG":
            return ("zero", src)
        if c in "wWdDSntr":
            return ("any", src)
        return ("lit", src, c)


def source(node):
    kind = node[0]
    if kind == "alt":
        return "|".join(source(branch) for branch in node[1])
    if kind == "seq":
        return "".join(source(item) for item in node[1])
    if kind == "rep":
        return source(node[1]) + node[2]
    if kind == "capture":
        return "(?:" + source(node[2]) + ")"
    if kind in ("group", "look"):
        return node[1] + source(node[2]) + ")"
    return node[1]


def has_used_capture(node, used):
    kind = node[0]
    if kind == "capture":
        return node[1] in used or has_used_capture(node[2], used)
    if kind in ("group", "look"):
        return has_used_capture(node[2], used)
    if kind == "rep":
        return has_used_capture(node[1], used)
    if kind in ("alt", "seq"):
        return any(has_used_capture(child, used) for child in node[1])
    return False


def open_letters(node):
    """Whether a node matches any letter, so its captured text cannot be listed."""
    return node[1] == r"\w" if node[0] == "any" else node[0] == "class" and "a-z" in node[1]


def class_values(src):
    if src.startswith("[^") or "\\" in src:
        raise Unconvertible("unbounded capture")
    chars = src[1:-1]
    # `[s|S]` in the typo list means `[sS]`.
    members = set(chars.replace("|", "")) if re.search(r"\w\|\w", chars) else set(chars)
    if "-" in chars[1:-1]:
        raise Unconvertible("unbounded capture")
    if members <= APOSTROPHES:
        return [(src, "'")]
    if len(members) > MAX_CLASS_VALUES:
        raise Unconvertible("unbounded capture")
    return [(re.escape(c), c) for c in sorted(members)]


def variants(node, used, in_capture=False):
    """Lists (regex, captured text, {group: text}) for each way the node can match."""
    if not in_capture and not has_used_capture(node, used):
        return [(source(node), "", {})]
    kind = node[0]
    if kind == "lit":
        return [(node[1], node[2], {})]
    if kind == "space":
        return [(node[1], " ", {})]
    if kind == "zero":
        return [(node[1], "", {})]
    if open_letters(node):
        return [(node[1], OPEN_SUFFIX, {})]
    if kind == "any":
        raise Unconvertible("unbounded capture")
    if kind == "class":
        return [(src, value, {}) for src, value in class_values(node[1])]
    if kind == "alt":
        result = [v for branch in node[1] for v in variants(branch, used, in_capture)]
    elif kind == "seq":
        parts = [variants(item, used, in_capture) for item in node[1]]
        total = 1
        for part in parts:
            total *= len(part)
        if total > MAX_VARIANTS:
            raise Unconvertible(f"more than {MAX_VARIANTS} variants")
        result = [
            (
                "".join(p[0] for p in combo),
                "".join(p[1] for p in combo),
                {k: v for p in combo for k, v in p[2].items()},
            )
            for combo in itertools.product(*parts)
        ]
    elif kind == "capture":
        result = []
        for src, value, caps in variants(node[2], used, True):
            result.append((src, value, {**caps, node[1]: value}))
    elif kind == "group":
        inner = variants(node[2], used, in_capture)
        result = [
            (f"{node[1]}{src})" if not node[1].startswith("(?:") else src, value, caps)
            for src, value, caps in inner
        ]
    elif kind == "look":
        if has_used_capture(node, used):
            raise Unconvertible("capture inside a lookaround")
        result = [(source(node), "", {})]
    elif kind == "rep":
        result = repeat_variants(node, used, in_capture)
    else:
        raise Unconvertible(f"unsupported node {kind}")
    if len(result) > MAX_VARIANTS:
        raise Unconvertible(f"more than {MAX_VARIANTS} variants")
    return result


def repeat_variants(node, used, in_capture):
    atom, quantifier = node[1], node[2]
    if atom[0] == "space" and quantifier in ("+", "+?"):
        return [(source(node), " ", {})]
    if open_letters(atom):
        return [(source(node), OPEN_SUFFIX, {})]
    if quantifier not in ("?", "??", "{0,1}"):
        raise Unconvertible("unbounded capture")
    inner = variants(atom, used, in_capture)
    wrapped = [(f"(?:{src})" if len(src) > 2 else src, value, caps) for src, value, caps in inner]
    return wrapped + [("", "", {})]


def expand_replacement(replace, groups, caps):
    def fill(match):
        digits = match.group(1) or match.group(2)
        number = int(digits)
        tail = ""
        while number > groups and len(digits) > 1:
            tail = digits[-1] + tail
            digits = digits[:-1]
            number = int(digits)
        if number == 0 or number > groups:
            raise Unconvertible("replacement names a missing group")
        return caps.get(number, "") + tail

    return re.sub(r"\$(?:(\d+)|\{(\d+)\})", fill, replace)


def case_pair_group(tree, replace):
    """Finds the group behind a leading `$n` that only captures a `[xX]` class."""
    match = re.match(r"\$(\d)", replace)
    if not match:
        return None
    number = int(match.group(1))

    def walk(node):
        kind = node[0]
        if kind == "capture" and node[1] == number:
            body = node[2]
            if len(body[1]) == 1 and len(body[1][0][1]) == 1 and body[1][0][1][0][0] == "class":
                members = set(body[1][0][1][0][1][1:-1].replace("|", ""))
                if len(members) == 2 and len({c.lower() for c in members}) == 1:
                    return members
            return None
        if kind in ("capture", "group", "look"):
            return walk(node[2])
        if kind == "rep":
            return walk(node[1])
        if kind in ("alt", "seq"):
            for child in node[1]:
                found = walk(child)
                if found:
                    return found
        return None

    members = walk(tree)
    return (number, min(members).lower()) if members else None


def guard_capitalized(key, fixed):
    """Excludes the capitalized fix, which Vale compares before it applies `matchcase`."""
    capitalized = fixed[0].upper() + fixed[1:]
    try:
        if not re.search(key, capitalized):
            return key
    except re.error:
        pass
    return f"(?!{re.escape(capitalized)}\\b){key}"


def convert(find, replace):
    """Turns one typo entry into ({regex: literal replacement}, whether Vale should match case)."""
    if WIKI_MARKUP.search(find) or WIKI_MARKUP.search(replace):
        raise Unconvertible("wiki markup")
    if "|" in replace:
        raise Unconvertible("replacement contains Vale's option separator")
    if re.search(r"\$(?!\d|\{\d)", replace):
        raise Unconvertible("unsupported replacement token")
    # A curly apostrophe is correct typography, and flagging it would flag contractions.
    find = re.sub(r"\[[^\]]*\]", lambda m: m.group().replace("’", ""), find)
    parser = Parser(find)
    tree = parser.parse()
    pair = case_pair_group(tree, replace)
    if pair:
        replace = re.sub(rf"^\${pair[0]}", pair[1], replace)
    used = {int(n or m) for n, m in re.findall(r"\$(?:(\d+)|\{(\d+)\})", replace)}
    used = {n if n <= parser.groups else int(str(n)[0]) for n in used}
    swaps = {}
    for src, _, caps in variants(tree, used):
        if len(src) > MAX_KEY_LENGTH:
            raise Unconvertible("too long for a YAML key")
        fixed = expand_replacement(replace, parser.groups, caps)
        if not re.search(r"[^\W\d_]{3}", fixed):
            raise Unconvertible("punctuation, not a word typo")
        swaps[guard_capitalized(src, fixed) if pair else src] = fixed
    return swaps, bool(pair)


def fetch():
    request = urllib.request.Request(URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read().decode("utf-8")


def parse_entries(wikitext):
    """Yields (section, label, find, replace, disabled) for each entry."""
    text = re.sub(r"<!--.*?-->", "", wikitext, flags=re.S)
    section = ""
    entry = re.compile(r'<Typo\s+(word|disabled)="([^"]*)"\s+find="([^"]*)"\s+replace="([^"]*)"\s*/>')
    for line in text.splitlines():
        heading = re.match(r"=+\s*(.*?)\s*=+\s*$", line)
        if heading:
            section = heading.group(1)
        for match in entry.finditer(line):
            kind, label, find, replace = match.groups()
            yield section, html.unescape(label), html.unescape(find), html.unescape(replace), kind == "disabled"


def render(swaps, match_case):
    lines = [
        "extends: substitution",
        "message: \"Typo (AutoWikiBrowser list): use '%s' instead of '%s'.\"",
        f"link: {LINK}",
        "level: warning",
        "ignorecase: false",
        "nonword: true",
        f"matchcase: {'true' if match_case else 'false'}",
        "action:",
        "  name: replace",
        "swap:",
    ]
    for find in sorted(swaps):
        lines.append(f"  {json.dumps(find, ensure_ascii=False)}: {json.dumps(swaps[find], ensure_ascii=False)}")
    return "\n".join(lines) + "\n"


def run_vale(rules, text):
    """Returns (error text, alerts) from linting text with only these rules."""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        style = root / "styles" / "Check"
        style.mkdir(parents=True)
        for index, (swaps, match_case) in enumerate(rules):
            (style / f"Typos{index:02}.yml").write_text(render(swaps, match_case), encoding="utf-8")
        (root / ".vale.ini").write_text(
            "StylesPath = styles\nMinAlertLevel = suggestion\n[*.md]\nBasedOnStyles = Check\n"
        )
        sample = root / "sample.md"
        sample.write_text(text, encoding="utf-8")
        done = subprocess.run(
            ["npx", "vale", "--config", str(root / ".vale.ini"), "--output=JSON", str(sample)],
            capture_output=True,
            text=True,
        )
    try:
        report = json.loads(done.stdout)
    except json.JSONDecodeError:
        return done.stdout + done.stderr, []
    if "Code" in report or done.returncode > 1:
        return json.dumps(report), []
    return "", [alert for alerts in report.values() for alert in alerts]


def literals(key):
    return re.findall(r"(?<![\\\[])[a-zA-Z]+", key)


def rejected_keys(swaps, match_case):
    """Bisects to the swap keys that make Vale fail to compile or run the rule."""
    # Text without a key's literals skips the regex engine, so panics stay hidden.
    words = {word for key in swaps for word in literals(key)}
    error, _ = run_vale([(swaps, match_case)], " ".join(sorted(words)) + "\n")
    if not error:
        return {}
    if len(swaps) == 1:
        return {next(iter(swaps)): " ".join(error.split())[:200]}
    keys = list(swaps)
    middle = len(keys) // 2
    return {
        **rejected_keys({k: swaps[k] for k in keys[:middle]}, match_case),
        **rejected_keys({k: swaps[k] for k in keys[middle:]}, match_case),
    }


def shard(swaps, match_case):
    """Orders by literal length so most files stay behind Vale's literal prefilter."""
    strength = {k: max(map(len, literals(k)), default=0) for k in swaps}
    # Swaps for one word share a file, since a rule reports one alternative per match.
    weakest = {}
    for key, value in swaps.items():
        weakest[value] = min(weakest.get(value, strength[key]), strength[key])
    keys = sorted(swaps, key=lambda k: (weakest[swaps[k]], swaps[k], k))
    rules = [{}]
    size = 0
    for key in keys:
        if size + len(key) > MAX_RULE_BYTES or len(rules[-1]) >= MAX_RULE_SWAPS:
            rules.append({})
            size = 0
        rules[-1][key] = swaps[key]
        size += len(key)
    return [(rule, match_case) for rule in rules if rule]


def smoke_test(rules):
    failures = []
    for text, expected in SMOKE_TESTS:
        error, alerts = run_vale(rules, text + "\n")
        if error:
            failures.append(f"{text!r}: {error[:200]}")
        elif expected is None and alerts:
            failures.append(f"{text!r} should pass, got {alerts[0]['Message']}")
        elif expected and not any(expected in alert["Message"] for alert in alerts):
            failures.append(f"{text!r} should suggest {expected}")
    return failures


def main():
    swaps = {False: {}, True: {}}
    origin = {}
    skipped = []
    total = 0
    for section, label, find, replace, disabled in parse_entries(fetch()):
        total += 1
        if disabled:
            skipped.append((label, find, "disabled upstream"))
            continue
        if section in NON_TYPO_SECTIONS:
            skipped.append((label, find, f"not a typo (section {section!r})"))
            continue
        try:
            converted, match_case = convert(find, replace)
        except Unconvertible as reason:
            skipped.append((label, find, str(reason)))
            continue
        for key, value in converted.items():
            if key in origin:
                skipped.append((label, key, f"duplicates {origin[key]!r}"))
                continue
            swaps[match_case][key] = value
            origin[key] = label

    rules = []
    for match_case, group in swaps.items():
        for keys, flag in shard(group, match_case):
            for key, reason in rejected_keys(keys, flag).items():
                skipped.append((origin[key], key, f"Vale rejected it: {reason}"))
                del keys[key]
            rules.append((keys, flag))

    failures = smoke_test(rules)
    if failures:
        sys.exit("Smoke test failed, rules left unchanged:\n" + "\n".join(failures))

    for old in OUTPUT_DIR.glob("Typos*.yml"):
        old.unlink()
    for index, (keys, flag) in enumerate(rules):
        (OUTPUT_DIR / f"Typos{index:02}.yml").write_text(render(keys, flag), encoding="utf-8")
    SKIPPED.write_text(
        "".join(f"{reason}\t{label}\t{find}\n" for label, find, reason in sorted(skipped, key=lambda s: s[2])),
        encoding="utf-8",
    )
    kept = sum(len(keys) for keys, _ in rules)
    print(f"{total} entries: {kept} swaps in {len(rules)} files, {len(skipped)} skipped.")


if __name__ == "__main__":
    main()
