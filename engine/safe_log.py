"""Log sanitization: anything secret that a script derives at runtime (refresh/access tokens) is registered with
GitHub's ::add-mask:: so it shows as *** in Actions logs, and redact() scrubs known token shapes from any text we print."""
import os, re, sys
_PAT = re.compile(r"(AIza[0-9A-Za-z_-]{20,}|EAA[A-Za-z0-9]{20,}|ya29\.[A-Za-z0-9._-]+|1//0[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|hf_[A-Za-z0-9]{20,}|GOCSPX-[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]{20,})")
def mask(*values):
    for v in values:
        if v and os.environ.get("GITHUB_ACTIONS"):
            for line in str(v).splitlines():
                if line.strip(): print(f"::add-mask::{line.strip()}", flush=True)
def redact(text): return _PAT.sub("***", str(text))
def secret(name, required=True):
    """Read a credential ONLY from the environment (GitHub Secrets). Never from code."""
    v = os.environ.get(name, "")
    if not v and required: print(f"::error::missing GitHub Secret {name}", flush=True); sys.exit(1)
    mask(v); return v
