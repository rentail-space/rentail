# RenTail - Simple Rental Platform

A modern landing page for a rental platform built with Remix and TailwindCSS.

## Features

- Responsive design with mobile-first approach
- Modern UI components
- Fast page transitions
- SEO friendly
- Easy to deploy

## Development

From your terminal:

```sh
npm run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Building for Production

Build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

## Deploying to GitHub Pages

To deploy this Remix site to GitHub Pages, follow these steps:

1. Create a new GitHub repository:

```sh
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Create a new repository on GitHub and add it as a remote
git remote add origin <your-github-repo-url>

# Push to GitHub
git push -u origin main
```

2. Set up GitHub Actions for deployment:

Create a file `.github/workflows/deploy.yml` with the following content:

```yml
name: Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./build/client
```

3. In your GitHub repository settings, enable GitHub Pages:
   - Go to Settings > Pages
   - Set Source to "Deploy from a branch"
   - Select the branch `gh-pages` and folder `/ (root)`
   - Click Save

4. Add a custom domain (optional):
   - In the GitHub Pages settings, enter your custom domain
   - Create a CNAME record pointing to your GitHub Pages URL
   - Add a `CNAME` file to your `public` folder with your domain name

## Customization

- Update the content in `app/routes/_index.tsx` to change the landing page
- Modify the layout in `app/root.tsx` to change the header and footer
- Add more routes in the `app/routes/` directory for additional pages

## Technologies Used

- [Remix](https://remix.run/)
- [TailwindCSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling. The Tailwind configuration can be found in `tailwind.config.ts`.

## License

MIT
