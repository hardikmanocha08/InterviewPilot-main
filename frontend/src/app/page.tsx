import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative h-screen overflow-hidden bg-background text-white">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[20rem] sm:h-[28rem] md:h-[34rem] w-[20rem] sm:w-[28rem] md:w-[34rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[80px] sm:blur-[100px] md:blur-[140px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[16rem] sm:h-[20rem] md:h-[24rem] w-[16rem] sm:w-[20rem] md:w-[24rem] rounded-full bg-blue-500/20 blur-[80px] sm:blur-[100px] md:blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-20 h-[14rem] sm:h-[18rem] md:h-[20rem] w-[14rem] sm:w-[18rem] md:w-[20rem] rounded-full bg-emerald-400/15 blur-[70px] sm:blur-[90px] md:blur-[110px]" />

      <main className="relative mx-auto flex h-screen w-full max-w-7xl flex-col px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-5 md:py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/interviewpilot-logo.svg" alt="InterviewPilot logo" width={40} height={40} priority className="sm:w-[52px] sm:h-[52px]" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">InterviewPilot</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg sm:rounded-xl border border-white/20 px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium text-text-main transition-colors hover:bg-white/10"
          >
            Sign In
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-4 sm:gap-6 py-4 md:gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:gap-10">
          <div>
            <p className="mb-2 sm:mb-3 md:mb-5 inline-flex rounded-full border border-cyan-200/30 bg-cyan-300/10 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm font-medium text-cyan-100">
              AI-powered mock interviews for real outcomes
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.08] tracking-tight">
              Build interview confidence with full-screen focus and instant feedback
            </h1>
            <p className="mt-2 sm:mt-4 md:mt-6 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-200">
              Generate role-specific questions, answer naturally by voice or text, and get structured AI evaluation after every response.
            </p>

            <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4">
              <Link
                href="/register"
                className="rounded-lg sm:rounded-xl md:rounded-2xl bg-primary px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-semibold text-white shadow-[0_15px_40px_-15px_rgba(59,130,246,0.8)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover text-center"
              >
                Start Free Session
              </Link>
              <Link
                href="/login"
                className="rounded-lg sm:rounded-xl md:rounded-2xl border border-white/25 px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-xs sm:text-sm md:text-base font-semibold text-slate-100 transition-colors hover:bg-white/10 text-center"
              >
                Continue Practice
              </Link>
            </div>
          </div>

          <div className="hidden rounded-2xl lg:rounded-3xl border border-white/15 bg-surface/80 p-4 md:p-6 lg:p-7 shadow-2xl backdrop-blur-md lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Live Session Preview</p>
            <div className="mt-4 md:mt-5 space-y-2 md:space-y-3">
              <div className="rounded-lg md:rounded-2xl border border-white/10 bg-black/20 p-3 md:p-4">
                <p className="text-xs md:text-sm text-slate-300">Question 3 of 5</p>
                <p className="mt-1 md:mt-2 text-sm md:text-lg font-semibold">
                  How would you design a resilient API rate-limiting system for a multi-tenant SaaS product?
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="rounded-lg md:rounded-xl bg-emerald-400/15 p-2 md:p-3">
                  <p className="text-xs text-emerald-200">Clarity</p>
                  <p className="mt-0.5 md:mt-1 text-lg md:text-xl font-bold text-emerald-100">8.9</p>
                </div>
                <div className="rounded-lg md:rounded-xl bg-blue-400/15 p-2 md:p-3">
                  <p className="text-xs text-blue-200">Depth</p>
                  <p className="mt-0.5 md:mt-1 text-lg md:text-xl font-bold text-blue-100">8.5</p>
                </div>
                <div className="rounded-lg md:rounded-xl bg-orange-300/15 p-2 md:p-3">
                  <p className="text-xs text-orange-200">Impact</p>
                  <p className="mt-0.5 md:mt-1 text-lg md:text-xl font-bold text-orange-100">9.1</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
