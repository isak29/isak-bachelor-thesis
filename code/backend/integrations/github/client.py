# Ansvarar för autentisering och API anrop

import requests
import os
from dotenv import load_dotenv

load_dotenv()
token = os.getenv('GIT_API_TOKEN')


headers = {"Authorization": f"token {token}"

}

url = "https://api.github.com/user"


response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    print(data["login"])
    print(data["public_repos"])
else:
    print("Det uppstod ett fel:", response.status_code)


print(token)

