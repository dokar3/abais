# Abais

> **A** **B**oring **AI** **S**tory.

Generate some boring stories using GPT and Stable Diffusion. Available on [abais.vercel.app](https://abais.vercel.app).

Built with:

- Next.js + React + Tailwind CSS
- Prisma + MongoDB
- Cloudflare R2

# Getting Started

First, run the development server:

```bash
# Install dependencies
yarn
# Run
yarn dev
```

# Deploy on Vercel

1. Clone or fork this project to your git.
2. Prepare the environment variables in the `.env` file. You may need:
   - OpenAI API key to generate text.
   - HuggingFace API key to call Stable Diffusion model to generate image.
   - MongoDB and a connect url.
   - Keys for AWS S3 or Cloudflare R2.
3. Go to [Vercel](https://vercel.com) and deploy. Set the install command to `yarn` and build command to `npx prisma generate && yarn build`. Don't forget paste your env variables when deploying on Vercel.

# License

```
Copyright 2023 dokar3

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
