import requests
import os
from pathlib import Path

def download_pdf(url, filename):
  
    try:
        print(f"Downloading {filename}...")

        # Send GET request with a user agent
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)

        # Check if request was successful
        response.raise_for_status()

        
        script_dir = Path(__file__).parent
        filepath = script_dir / filename

       
        with open(filepath, 'wb') as f:
            f.write(response.content)

        print(f"Successfully downloaded {filename} ({len(response.content)} bytes)")
        return True

    except requests.exceptions.RequestException as e:
        print(f"Error downloading {filename}: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

def main():
    """Main function to download both PDF files"""
    print("Starting PDF downloads from Mahaweli Authority website...\n")

    # files to download
    downloads = [
        {
            'url': 'https://mahaweli.gov.lk/WMS%20DATA/Menue-WMS%20-%20E.pdf',
            'filename': 'tank-dat.pdf'
        },
        {
            'url': 'https://mahaweli.gov.lk/WMS%20DATA/cropping%20calender.pdf',
            'filename': 'cropcalender.pdf'
        }
    ]

    # Download files
    success_count = 0
    for item in downloads:
        if download_pdf(item['url'], item['filename']):
            success_count += 1

    print(f"\nCompleted: {success_count}/{len(downloads)} files downloaded successfully")

if __name__ == "__main__":
    main()
