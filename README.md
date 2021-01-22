import requests
import os


ECCO_WGET_URL = os.environ.get("ECCO_WGET_URL", "http://0.0.0.0:3000")

data = {
    'url': 'http://francescoermini.it',
    'custom_js': 'mark_hidden_elements'
}

response = requests.post(ECCO_WGET_URL, data=data)
print(response.text)


TEST FOR PAGINATION:

{"url":"https://scrapeme.live/shop/",
 "wait_until":"networkidle0",
 "viewport":"1920x3000",
 "headless":true,
 "pagination":{
    "type": "selector", 
    "value": "#main > div > nav > ul > li:nth-child(6) > a"
 }
}