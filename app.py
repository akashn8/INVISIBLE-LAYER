"""
The Invisible Layer — Streamlit Deployment
==========================================
Serves the static HTML/CSS/JS visualization through Streamlit.

Usage:
  1. Place this file in the same directory as the project (alongside index.html, css/, js/, assets/)
  2. pip install streamlit
  3. streamlit run app.py

Structure expected:
  app.py
  index.html
  css/
  js/
  assets/
"""

import streamlit as st
import os
import base64
from pathlib import Path

# Page config
st.set_page_config(
    page_title="THE INVISIBLE LAYER · How Space Powers the World's 24 Hours",
    page_icon="🛰️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Hide Streamlit UI elements for a clean full-screen experience
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    .stDeployButton {display: none;}
    header {visibility: hidden;}
    footer {visibility: hidden;}
    .block-container {
        padding: 0 !important;
        max-width: 100% !important;
    }
    .stApp {
        background-color: #0B0E14;
    }
    iframe {
        border: none;
    }
</style>
""", unsafe_allow_html=True)


def get_file_content(filepath):
    """Read file content."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def get_binary_base64(filepath):
    """Read binary file as base64."""
    with open(filepath, 'rb') as f:
        return base64.b64encode(f.read()).decode()


def build_inline_html():
    """
    Build a self-contained HTML file by inlining all CSS and JS.
    Assets are served via Streamlit's static file serving.
    """
    base_dir = Path(__file__).parent
    
    # Read index.html
    html = get_file_content(base_dir / 'index.html')
    
    # Inline all CSS files
    css_files = [
        'css/base.css', 'css/tab1-hero.css', 'css/tab2-day.css',
        'css/tab3-bridge.css', 'css/tab4-without.css', 
        'css/tab5-games.css', 'css/tab6-reflect.css'
    ]
    for css_file in css_files:
        css_path = base_dir / css_file
        if css_path.exists():
            css_content = get_file_content(css_path)
            # Replace the <link> tag with inline <style>
            link_tag = f'<link rel="stylesheet" href="{css_file}">'
            html = html.replace(link_tag, f'<style>{css_content}</style>')
    
    # Inline all JS files
    js_files = [
        'js/data.js', 'js/utils.js', 'js/boot.js', 'js/tabs.js',
        'js/tab1-hero.js', 'js/tab2-day.js', 'js/tab3-bridge.js',
        'js/tab4-without.js', 'js/earth-data.js', 
        'js/tab5-games.js', 'js/tab6-reflect.js'
    ]
    for js_file in js_files:
        js_path = base_dir / js_file
        if js_path.exists():
            js_content = get_file_content(js_path)
            # Replace the <script src> tag with inline <script>
            script_tag = f'<script src="{js_file}"></script>'
            html = html.replace(script_tag, f'<script>{js_content}</script>')
    
    # Convert asset references to base64 data URIs for images
    assets_dir = base_dir / 'assets'
    if assets_dir.exists():
        for asset_file in assets_dir.iterdir():
            if asset_file.suffix in ['.jpg', '.jpeg', '.png', '.webp', '.avif']:
                mime_types = {
                    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.png': 'image/png', '.webp': 'image/webp',
                    '.avif': 'image/avif'
                }
                mime = mime_types.get(asset_file.suffix, 'application/octet-stream')
                b64 = get_binary_base64(asset_file)
                data_uri = f'data:{mime};base64,{b64}'
                # Replace references in the HTML/JS
                html = html.replace(f"'assets/{asset_file.name}'", f"'{data_uri}'")
                html = html.replace(f'"assets/{asset_file.name}"', f'"{data_uri}"')
    
    return html


def main():
    # Try to serve via iframe with local HTTP server, 
    # or fall back to inline HTML component
    
    html_content = build_inline_html()
    
    # Use Streamlit's HTML component to render the full page
    st.components.v1.html(
        html_content,
        height=800,
        scrolling=True
    )
    
    # Alternative: Full-screen iframe approach
    # Uncomment below and comment above if you prefer full-screen
    """
    st.markdown(f'''
    <iframe srcdoc="{html_content.replace('"', '&quot;')}" 
            style="width:100%;height:100vh;border:none;position:fixed;top:0;left:0;z-index:9999;">
    </iframe>
    ''', unsafe_allow_html=True)
    """


if __name__ == "__main__":
    main()
