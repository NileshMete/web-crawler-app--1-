# Smart Web Crawler

A powerful and intelligent web crawling application that discovers and extracts content from websites, perfect for RAG-based AI chatbots and content analysis.

![Smart Web Crawler](https://cdn.mos.cms.futurecdn.net/84vAQbR5vqnnE73XV8jeoM.jpg)

## Features

- 🕷️ Intelligent web crawling with automatic URL discovery
- 📄 Content extraction with smart filtering
- 📊 Real-time crawling progress tracking
- 📱 Responsive design that works on all devices
- 🌙 Dark mode support
- 📑 PDF export functionality
- 🔍 Content summarization
- ⚡ Built with Next.js and TypeScript for optimal performance

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/NileshMete/web-crawler-app--1-.git
cd smart-web-crawler
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter a website URL in the input field
2. Click "Start Crawl" to begin the crawling process
3. Watch as pages are discovered and processed in real-time
4. View, export, or delete crawled pages from the dashboard
5. Export content to PDF for offline reading

### Supported Websites

The crawler works best with:
- Static websites
- Blogs
- Documentation sites
- News websites

### Known Limitations

Some websites may block automated crawling:
- Social media platforms (Facebook, Twitter, etc.)
- Search engines (Google, Bing, etc.)
- Sites with strict rate limiting

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Cheerio](https://cheerio.js.org/) - HTML parsing
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide Icons](https://lucide.dev/) - Beautiful icons

## Project Structure

```
.
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   └── page.tsx         # Main page component
├── components/          # React components
│   ├── ui/             # UI components
│   └── ...             # Other components
├── lib/                # Utility functions
│   ├── crawler.ts      # Crawling logic
│   ├── storage.ts      # Data storage
│   └── utils.ts        # Helper functions
└── public/             # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License


## Acknowledgments

- Made with love by Nilesh ❤️

## Contact

Nilesh Mete - [@nileshmete993088](https://www.linkedin.com/in/nileshmete993088/)

