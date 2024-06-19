import asyncio
import os
import sys
from dotenv import load_dotenv
from util import dreamMachineMake, refreshDreamMachine

load_dotenv()

async def main():
    # Your access_token
    access_token = os.getenv('LUMA_COOKIE')
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
