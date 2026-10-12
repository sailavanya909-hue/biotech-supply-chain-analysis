"""Retrieve the publisher's unchanged source files and verify their MD5 hashes."""
import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = (16676260, 16676263, 16676266)

def download():
    raw = ROOT / 'data' / 'raw'
    raw.mkdir(parents=True, exist_ok=True)
    manifest = []
    for article in ARTICLES:
        metadata = json.load(urllib.request.urlopen(f'https://api.figshare.com/v2/articles/{article}', timeout=60))
        for file in metadata['files']:
            content = urllib.request.urlopen(file['download_url'], timeout=60).read()
            checksum = hashlib.md5(content).hexdigest()
            if checksum != file['computed_md5']:
                raise ValueError(f'Publisher checksum mismatch: {file["name"]}')
            (raw / file['name']).write_bytes(content)
            manifest.append({'name':file['name'],'article_id':article,'file_id':file['id'],
                'download_url':file['download_url'],'md5':checksum,'sha256':hashlib.sha256(content).hexdigest(),
                'bytes':len(content),'license':metadata['license']['name'],'license_url':metadata['license']['url']})
    (raw / 'source-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print('Retrieved and verified', len(manifest), 'source files.')

if __name__ == '__main__':
    download()
