import asyncio
import sys
from util import dreamMachineMake, refreshDreamMachine


async def main():
    # Your access_token
    access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsidXNlcl91dWlkIjoiODIzYjlkOGYtMDc4ZS00N2Y4LTljZWItOGE2MmRhNjg2MzkyIiwiY2xpZW50X2lkIjoiIn0sImV4cCI6MTcxOTIzOTczMX0.BT8TDZRNARvRgXBFY2m_Ol4bMoZgCWxPBpi80oHhXWQ"
    prompt = sys.argv[1]  # Get the prompt from command-line arguments
    img_file = "./src/commands/ai/tempImage.jpg"

    make_json = dreamMachineMake(prompt, access_token, img_file)
    print(make_json)
    task_id = make_json[0]["id"]
    while True:
        response_json = refreshDreamMachine(access_token)

        for it in response_json:
            if it["id"] == task_id:
                print(f"proceeding state {it['state']}")
                if it['video']:
                    print(f"New video link: {it['video']['url']}")
                    return
            await asyncio.sleep(3)


if __name__ == "__main__":
    asyncio.run(main())
