import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Columns3,
  Users,
  Zap,
  ArrowRight,
  MousePointer2,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/workspaces");

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-md bg-bg/80">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-text">
            sync<span className="text-accent">space</span>
          </span>
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
          >
            Sign in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent mb-8">
          <Zap className="h-3 w-3" />
          Real-time collaboration — live for everyone
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-3xl">
          Collaborate{" "}
          <span className="bg-gradient-to-r from-accent to-[#A78BFA] bg-clip-text text-transparent">
            without
          </span>
          <br />
          the chaos.
        </h1>

        <p className="mt-6 text-lg text-text-muted max-w-xl leading-relaxed">
          One workspace for your whole team. Write together in live documents,
          move work forward on Kanban boards, and see everyone's presence in
          real time.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/sign-in"
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/antoanpopov/syncspace"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text"
          >
            View source
          </a>
        </div>

        {/* ── Mock app UI ─────────────────────────────────────────── */}
        <div className="mt-20 w-full max-w-5xl">
          <div className="rounded-xl border border-border bg-bg-surface shadow-2xl overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-bg">
              <div className="h-3 w-3 rounded-full bg-[#FF5F5F]" />
              <div className="h-3 w-3 rounded-full bg-[#FFB454]" />
              <div className="h-3 w-3 rounded-full bg-[#5EFF8C]" />
              <div className="ml-4 flex-1 h-5 rounded bg-bg-hover text-xs text-text-faint flex items-center px-3">
                syncspace.antoanpopov.com
              </div>
            </div>

            {/* App layout */}
            <div className="flex h-[420px]">
              {/* Sidebar */}
              <div className="w-52 border-r border-border bg-bg flex flex-col shrink-0">
                <div className="px-3 py-3 border-b border-border">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-bg-hover">
                    <div className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center text-[10px] text-accent font-bold">A</div>
                    <span className="text-xs font-medium truncate">Acme Inc</span>
                  </div>
                </div>
                <div className="p-2 flex-1 space-y-0.5 overflow-hidden">
                  <div className="px-2 py-1 text-[10px] text-text-faint uppercase tracking-wider mt-1">Pages</div>
                  {["Product roadmap", "Meeting notes", "Design system"].map((p, i) => (
                    <div key={p} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer ${i === 0 ? "bg-bg-active text-text" : "text-text-muted hover:bg-bg-hover"}`}>
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">{p}</span>
                    </div>
                  ))}
                  <div className="px-2 py-1 text-[10px] text-text-faint uppercase tracking-wider mt-2">Boards</div>
                  {["Sprint board", "Bug tracker"].map((b, i) => (
                    <div key={b} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer ${i === 0 ? "text-text-muted" : "text-text-muted"} hover:bg-bg-hover`}>
                      <Columns3 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{b}</span>
                    </div>
                  ))}
                </div>
                {/* Presence avatars */}
                <div className="px-3 py-2 border-t border-border flex items-center gap-1">
                  {["#5B7FFF","#C084FC","#22D3EE"].map((c, i) => (
                    <div key={i} style={{ background: c }} className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-bg -ml-1 first:ml-0">
                      {["A","M","J"][i]}
                    </div>
                  ))}
                  <span className="ml-1 text-[10px] text-text-faint">3 online</span>
                </div>
              </div>

              {/* Main content — document editor mock */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-8 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Product roadmap</h2>
                  <div className="flex items-center gap-1">
                    <MousePointer2 className="h-3 w-3 text-[#5B7FFF]" />
                    <span className="text-[10px] text-text-faint">Antoan is editing</span>
                  </div>
                </div>
                <div className="flex-1 px-8 py-6 overflow-hidden space-y-3">
                  <div className="h-7 w-64 rounded bg-bg-hover" />
                  <div className="space-y-2 pt-1">
                    <div className="h-3 w-full rounded bg-bg-hover" />
                    <div className="h-3 w-5/6 rounded bg-bg-hover" />
                    <div className="h-3 w-4/6 rounded bg-bg-hover" />
                  </div>
                  <div className="h-5 w-40 rounded bg-bg-hover mt-4" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-bg-hover" />
                    <div className="h-3 w-3/4 rounded bg-bg-hover" />
                  </div>
                  {/* Inline cursor */}
                  <div className="flex items-center gap-1 mt-2">
                    <div className="h-3 w-24 rounded bg-bg-hover" />
                    <div className="h-4 w-0.5 bg-[#C084FC] animate-pulse" />
                    <div className="absolute mt-5 ml-24">
                      <div className="bg-[#C084FC] text-[#0A0A0B] text-[9px] font-semibold px-1.5 py-0.5 rounded-t-md rounded-br-md">Maria</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-faint text-center">
            Live demo — multiple users editing simultaneously
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold mb-3">
            Everything your team needs
          </h2>
          <p className="text-center text-text-muted mb-14 max-w-lg mx-auto">
            No integrations required. Documents, boards and real-time presence
            live together in one place.
          </p>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: FileText,
                color: "text-accent",
                bg: "bg-accent/10",
                title: "Live document editing",
                desc: "Conflict-free rich text powered by Yjs CRDTs. Multiple cursors, presence names, and instant sync across every tab and device.",
              },
              {
                icon: Columns3,
                color: "text-[#C084FC]",
                bg: "bg-[#C084FC]/10",
                title: "Real-time Kanban",
                desc: "Drag cards between columns and watch them move for everyone on the board instantly. No refresh, no lag.",
              },
              {
                icon: Users,
                color: "text-[#22D3EE]",
                bg: "bg-[#22D3EE]/10",
                title: "Presence & collaboration",
                desc: "See exactly who's online, which page they're on, and their live cursor position as they type.",
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-bg-surface p-6 flex flex-col gap-4"
              >
                <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <h3 className="font-semibold mb-1.5">{title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs text-text-faint uppercase tracking-widest mb-6">Built with</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              "Next.js 16",
              "TypeScript",
              "Yjs",
              "Hocuspocus",
              "Socket.io",
              "Drizzle ORM",
              "Neon Postgres",
              "Tailwind CSS",
            ].map((tech) => (
              <span key={tech} className="text-sm text-text-faint hover:text-text-muted transition-colors">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-border">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to try it?</h2>
          <p className="text-text-muted mb-8">
            Sign in with Google and create your first workspace in seconds.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-6 px-6">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-faint">
          <span>
            sync<span className="text-accent">space</span> — built by{" "}
            <a
              href="https://antoanpopov.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-muted transition-colors"
            >
              Antoan Popov
            </a>
          </span>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/antoanpopov/syncspace"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-muted transition-colors"
            >
              GitHub
            </a>
            <Link href="/sign-in" className="hover:text-text-muted transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
