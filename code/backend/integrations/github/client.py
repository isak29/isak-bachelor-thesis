# Ansvarar för autentisering och API anrop

import requests

token = "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"

headers = {"Authorization": f"Bearer {token}"

}

url = "https://api.github.com/user"


response = requests.get(url, headers=headers)

if response.status_code == 200:
    data = response.json()
    print(data["login"])
    print(data["public_repos"])
else:
    print("Det uppstod ett fel:", response.status_code)


