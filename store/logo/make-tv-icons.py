#!/usr/bin/env python3
"""Renders the TV icon set from the "Nosedive" logo.

The SVGs in store/logo/svg come from the mobile repo (store/logo/make-icons.py there). Re-copy
them after the logo changes, then run:

    store/logo/make-tv-icons.py      # needs Playwright's chrome-headless-shell and ffmpeg

Writes:
    assets/images/icon.png                    1024, opaque (Expo icon, Android launcher)
    assets/images/android-icon-*.png          adaptive background / foreground / monochrome
    assets/tv_icons/icon-*-{back,middle,front}.png   layered Apple TV app icon (parallax)
    assets/tv_icons/top-shelf-*.png           Apple TV top shelf
    assets/tv_icons/banner-320x180.png        Android TV launcher banner
    store/play/icon-512.png                   Play hi-res icon
    store/play/tv-banner-1280x720.png         Play Android TV banner
    store/play/feature-graphic-1024x500.png   Play feature graphic
"""

import glob
import os
import subprocess
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SVG_DIR = os.path.join(ROOT, 'store', 'logo', 'svg')
IMAGES = os.path.join(ROOT, 'assets', 'images')
TV_ICONS = os.path.join(ROOT, 'assets', 'tv_icons')
PLAY = os.path.join(ROOT, 'store', 'play')

SKY_TOP, SKY_BOTTOM = '#1b3480', '#4d7bff'
SEA_TOP, SEA_BOTTOM = '#0f2257', '#081233'
WATERLINE = 630 / 1024
ART_CENTER_X = 560 / 1024
NAME = 'Sinkplane'

BACKDROP = (
    f'linear-gradient(to bottom, {SKY_TOP} 0%, {SKY_BOTTOM} {WATERLINE:.2%}, '
    f'{SEA_TOP} {WATERLINE:.2%}, {SEA_BOTTOM} 100%)'
)
UNDER = ('ios-under', 'ios-ripples')
ABOVE = ('ios-plane',)


def chromium():
    found = sorted(glob.glob(os.path.expanduser(
        '~/Library/Caches/ms-playwright/chromium_headless_shell-*/'
        'chrome-headless-shell-*/chrome-headless-shell')))
    if not found:
        raise SystemExit('No headless Chromium found (npx playwright install chromium)')
    return found[-1]


def art(layers, height, center_x):
    left = center_x - ART_CENTER_X * height
    return ''.join(
        f'<img src="file://{SVG_DIR}/{name}.svg" style="position:absolute;top:0;'
        f'left:{left:.1f}px;width:{height}px;height:{height}px">'
        for name in layers
    )


def wordmark(width, height):
    size = round(min(height * 0.2, width * 0.1))
    return (
        f'<div style="position:absolute;left:{width * 0.48:.1f}px;'
        f'top:{height * 0.36 - size / 2:.1f}px;'
        f'font:700 {size}px/1 -apple-system,\'Helvetica Neue\',sans-serif;color:#fff;'
        f'letter-spacing:{size * -0.02:.1f}px">{NAME}</div>'
    )


def wide(width, height, layers=UNDER + ABOVE, backdrop=True, named=False):
    center = width * (0.3 if named else 0.5)
    body = art(layers, height, center) + (wordmark(width, height) if named else '')
    background = BACKDROP if backdrop else 'transparent'
    return f'<div style="position:relative;width:{width}px;height:{height}px;' \
           f'overflow:hidden;background:{background}">{body}</div>'


def square(name, size):
    return f'<img src="file://{SVG_DIR}/{name}.svg" style="display:block;width:{size}px;' \
           f'height:{size}px">'


def render(html, out, width, height, opaque):
    with tempfile.TemporaryDirectory() as tmp:
        page = os.path.join(tmp, 'page.html')
        with open(page, 'w') as f:
            f.write(f'<html><body style="margin:0;background:transparent">{html}</body></html>')
        shot = os.path.join(tmp, 'shot.png')
        subprocess.run(
            [chromium(), '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
             f'--user-data-dir={tmp}/profile', '--allow-file-access-from-files',
             '--force-device-scale-factor=1', '--default-background-color=00000000',
             f'--window-size={width},{height}', f'--screenshot={shot}', f'file://{page}'],
            check=True, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        fmt = 'rgb24' if opaque else 'rgba'
        os.makedirs(os.path.dirname(out), exist_ok=True)
        subprocess.run(
            ['ffmpeg', '-loglevel', 'error', '-y', '-i', shot, '-pix_fmt', fmt, out], check=True,
        )
    print(os.path.relpath(out, ROOT))


def main():
    render(square('full', 1024), os.path.join(IMAGES, 'icon.png'), 1024, 1024, True)
    for name, size in (('android-background', 512), ('android-foreground', 512),
                       ('monochrome', 432)):
        out = os.path.join(IMAGES, f'android-icon-{name.removeprefix("android-")}.png')
        render(square(name, size), out, size, size, False)

    for w, h in ((1280, 768), (400, 240), (800, 480)):
        stem = os.path.join(TV_ICONS, f'icon-{w}x{h}')
        render(wide(w, h, layers=()), f'{stem}-back.png', w, h, True)
        render(wide(w, h, layers=UNDER, backdrop=False), f'{stem}-middle.png', w, h, False)
        render(wide(w, h, layers=ABOVE, backdrop=False), f'{stem}-front.png', w, h, False)
    for w, h in ((1920, 720), (3840, 1440), (2320, 720), (4640, 1440)):
        render(wide(w, h, named=True), os.path.join(TV_ICONS, f'top-shelf-{w}x{h}.png'), w, h,
               True)
    render(wide(320, 180, named=True), os.path.join(TV_ICONS, 'banner-320x180.png'), 320, 180,
           True)

    render(square('full', 512), os.path.join(PLAY, 'icon-512.png'), 512, 512, True)
    render(wide(1280, 720, named=True), os.path.join(PLAY, 'tv-banner-1280x720.png'), 1280, 720,
           True)
    render(wide(1024, 500, named=True), os.path.join(PLAY, 'feature-graphic-1024x500.png'), 1024,
           500, True)


if __name__ == '__main__':
    main()
