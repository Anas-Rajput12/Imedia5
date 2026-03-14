'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function ProfessionalHomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard');
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium">Loading...</div>
      </div>
    );
  }

  if (isLoaded && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-medium">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden bg-white">

      {/* ================= HERO SECTION ================= */}
      <section className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT CONTENT */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900">
                Transform Your Learning
                <span className="block mt-4 bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
                  With AI-Powered Tutors
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-xl mx-auto lg:mx-0">
                Personalized education tailored to your learning style.
                Master any subject with our intelligent tutoring system.
              </p>

              {/* BUTTONS FIXED */}
              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6">

  <a
    href="/auth/signup"
    className="
      px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20
      py-3 md:py-4 lg:py-5 xl:py-6 2xl:py-7
      text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl
      rounded-xl lg:rounded-2xl
      bg-gradient-to-r from-emerald-500 to-blue-600
      text-white font-semibold
      shadow-lg hover:shadow-2xl
      hover:scale-105
      transition-all duration-300
      whitespace-nowrap
    "
  >
    Start Learning
  </a>

  <a
    href="#features"
    className="
      px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20
      py-3 md:py-4 lg:py-5 xl:py-6 2xl:py-7
      text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl
      rounded-xl lg:rounded-2xl
      border border-slate-300
      bg-white text-slate-700
      font-semibold
      shadow-md hover:shadow-lg
      hover:bg-slate-100
      transition-all duration-300
      whitespace-nowrap
    "
  >
    Learn More
  </a>

</div>

            </div>

            {/* RIGHT CHAT MOCKUP */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">

                <div className="bg-indigo-600 text-white text-center py-3 rounded-lg font-semibold">
                  AI Tutor Chat
                </div>

                <div className="mt-6 space-y-4">

                  <div className="bg-indigo-50 p-4 rounded-lg text-sm">
                    Hello! I’m your AI Math Tutor 
                  </div>

                  <div className="bg-emerald-500 text-white p-4 rounded-lg text-sm text-right">
                    I need help with quadratic equations
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg text-sm">
                    Great! Let’s solve this together step by step.
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Powerful Learning Features
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Designed to enhance your educational journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

            {[
              { title: "Personalized Learning", icon: "" },
              { title: "Real-Time Assistance", icon: "" },
              { title: "Progress Tracking", icon: "" },
              { title: "Interactive Lessons", icon: "" },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-slate-50 p-8 rounded-2xl shadow hover:shadow-xl transition-all duration-300 text-center"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">
                  AI adapts to your learning pace and provides smart guidance.
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="py-20 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">

          {[
            { value: "50,000+", label: "Active Students" },
            { value: "95%", label: "Success Rate" },
            { value: "24/7", label: "Availability" },
            { value: "50+", label: "Subjects Covered" },
          ].map((stat, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="text-4xl font-bold text-emerald-600">
                {stat.value}
              </div>
              <div className="mt-2 text-slate-600">{stat.label}</div>
            </div>
          ))}

        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-blue-600 text-center text-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Transform Your Learning?
          </h2>
          <p className="mt-4 text-lg text-emerald-100">
            Join thousands of students improving their grades with AI.
          </p>

          <a
            href="/auth/signup"
            className="inline-block mt-8 px-10 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:scale-105 transition shadow-xl"
          >
            Start Free Trial
          </a>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-950 text-slate-400 py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              SGA AI Tutor
            </h3>
            <p>
              Personalized AI-powered learning platform for smarter students.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>Blog</li>
              <li>Help Center</li>
              <li>Community</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li>About</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Subscribe</h4>
            <div className="flex">
              <input
                type="email"
                placeholder="Email"
                className="px-3 py-2 bg-slate-800 text-white w-full rounded-l-lg"
              />
              <button className="px-4 bg-emerald-500 text-white rounded-r-lg">
                Join
              </button>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
