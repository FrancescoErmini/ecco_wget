import requests
import os


ECCO_WGET_URL = os.environ.get("ECCO_WGET_URL", "http://0.0.0.0:3000")

data = {
    'url': 'http://francescoermini.it',
    'custom_js': 'mark_hidden_elements'
}

response = requests.post(ECCO_WGET_URL, data=data)
print(response.text)