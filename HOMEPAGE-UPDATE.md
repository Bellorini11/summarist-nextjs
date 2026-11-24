# Corrected homepage update

This version restores the original supplied Summarist homepage HTML/CSS content as a React/Next.js component. It retains all the other frontend files from the prior project.

## Replace safely
1. Stop the running dev server with Ctrl+C.
2. Rename the existing `summarist-nextjs` folder to `summarist-nextjs-backup` (or copy it elsewhere).
3. Extract this ZIP and open the **inner** `summarist-nextjs` folder in VS Code (the one containing `package.json`).
4. In that folder, run `npm.cmd install` and then `npm.cmd run dev`.
5. Open http://localhost:3000 and hard-refresh with Ctrl+Shift+R.

## Changes
- `src/app/page.tsx`: restored homepage content and logo, with only homepage Login buttons wired to auth modal.
- `src/app/home-reference.css`: original supplied homepage CSS, scoped to the homepage to protect other pages.
- `src/app/layout.tsx`: imports the homepage CSS.
- All other project files and assets retained.

The other nav labels are intentionally inactive. Firebase still needs configuration for actual login.
