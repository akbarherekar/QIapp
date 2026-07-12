# CV Studio

A single-file CV builder. Keep **one master record** of everything you've done, then **drag and drop** the pieces you need to tailor a CV for a specific audience (academic, clinical, administrative, leadership…). Update an entry once and every CV that uses it stays current.

## The idea

You end up needing different slices of your CV for different things — research and publications for academic roles, skills and operational wins for admin roles, and so on. Instead of maintaining several drifting documents, CV Studio gives you:

1. **Library** — a repository of every degree, job, paper, talk, workshop, award, certification and skill. Add to it as life happens (finished your MPH, ran a workshop, presented at a conference).
2. **Tags** — label each entry by audience (`academic`, `clinical`, `admin`, `leadership`, `research`…).
3. **CV Builder** — pick an audience, filter the library by tag, and drag entries onto the page. Reorder within a section, reorder whole sections, remove with a click. Keep as many named CVs as you like.
4. **Print / PDF** — export a clean document. Because everything flows from the library, one edit updates every CV.

## Running it

No install, no server, no build step. Just open the file:

```
cv-builder/index.html
```

Double-click it, or open it in any modern browser (Chrome, Safari, Firefox, Edge).

## Your data

- Everything is stored **locally in your browser** (`localStorage`) — nothing is sent anywhere.
- Use **Backup** (sidebar) to download a JSON file, and **Restore** to load it — this is how you move your data to another device or browser, and how you keep a safe copy.

## Features

- Repository organized into standard CV sections (Education, Experience, Research, Publications, Presentations, Grants, Awards, Certifications, Teaching, Workshops, Service, Skills, Volunteer…)
- Free-form audience tags with one-click filtering
- Multiple saved CVs (create, rename, duplicate, delete)
- Drag-and-drop from library → CV, plus drag-to-reorder within a section and move-section up/down
- "Add all matching tag" for building a first draft fast
- Per-CV serif/sans toggle and optional professional summary
- Print / Save-as-PDF with a clean document layout
- JSON backup / restore
- **Load sample data** to see a fully populated example instantly

## Tech

Plain HTML + CSS + vanilla JavaScript in one file. No dependencies, no frameworks, no network calls.
