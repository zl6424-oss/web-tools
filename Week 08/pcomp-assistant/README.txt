PCom Assistant

PCom Assistant helps product designers turn an idea into a simple physical-computing plan. It uses DeepSeek for the conversation and structured Plan generation.

FILES
- index.html: interface
- style.css: visual style and responsive layout
- script.js: chat, projects, translation, local saving, and PDF print view
- api/chat.js: DeepSeek request and response validation
- api/translate.js: full-page translation requests
- server.js: local web server
- setup-and-start-mac.sh: Mac setup and start command
- START-HERE-MAC.txt: Mac instructions

MAC QUICK START
1. Install the Node.js LTS version from https://nodejs.org
2. Open Terminal.
3. Type cd followed by a space, drag this folder into Terminal, and press Return.
4. Run: bash setup-and-start-mac.sh
5. On first use, enter the DeepSeek API key when asked.
6. Keep Terminal open and use the localhost address it displays.

SAVE A PLAN AS PDF
Open a project with a Plan and click Save PDF. In the browser print window, choose Save as PDF.

IMPORTANT
- Do not open index.html directly when using AI.
- Never upload .env.local or your API key to GitHub.
- Project conversations are stored in the browser on that computer.
- Use Export on the old computer and Import on the new computer if you need to move saved project data.

SAFETY
Check exact component dimensions against seller listings or datasheets. Use low voltage only. Do not use this tool for mains-voltage wiring.
