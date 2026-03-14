'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function ProfessionalHomePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Redirect to dashboard if logged in
      router.push('/dashboard');
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isLoaded && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Redirecting to dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-indigo-100/30 to-purple-100/30"></div>

        {/* Hero Content */}
        <div className="relative container mx-auto py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
                <span className="block">Transform Your Learning</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 mt-2">With AI-Powered Tutors</span>
              </h1>
              <p className="mt-6 text-xl text-slate-700 max-w-lg mx-auto lg:mx-0">
                Personalized education tailored to your unique learning style. Master any subject with our intelligent tutoring system.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <a
                  href="/auth/signup"
                  className="px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-[1.03] shadow-lg"
                >
                  Start Learning Today
                </a>
                <a
                  href="#features"
                  className="px-8 py-4 border border-slate-300 text-base font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 transition-all duration-300"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 md:w-96 md:h-96 bg-gradient-to-br from-emerald-400/30 to-blue-500/30 rounded-full absolute -z-10 blur-3xl"></div>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-md">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="text-white font-medium">AI Tutor Chat</div>
                      <div></div> {/* Spacer */}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start mb-4">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">AI</div>
                      <div className="ml-3">
                        <div className="bg-indigo-50 text-slate-800 p-3 rounded-lg rounded-tl-none">
                          <p className="font-medium">Hello! I'm your AI Math Tutor</p>
                          <p className="text-sm mt-1">How can I help you with algebra today?</p>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">2:34 PM</div>
                      </div>
                    </div>
                    <div className="flex items-start justify-end mb-4">
                      <div className="flex flex-col items-end">
                        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-3 rounded-lg rounded-tr-none">
                          <p>I'm struggling with quadratic equations</p>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">2:35 PM</div>
                      </div>
                      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full w-12 h-12 ml-3 flex items-center justify-center text-white font-bold">U</div>
                    </div>
                    <div className="flex items-start mb-4">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">AI</div>
                      <div className="ml-3">
                        <div className="bg-indigo-50 text-slate-800 p-3 rounded-lg rounded-tl-none">
                          <p>No worries! Let's start with the basics.</p>
                          <p className="mt-2 bg-white p-2 rounded text-sm">x² - 5x + 6 = 0</p>
                          <p className="mt-2 text-sm">Can you identify the coefficients?</p>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">2:35 PM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Powerful Learning Features
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-700">
              Designed to enhance your educational journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Personalized Learning",
                description: "AI adapts to your learning pace and style, providing customized content",
                icon: "",
                color: "from-blue-400 to-indigo-500"
              },
              {
                title: "Real-Time Assistance",
                description: "Get instant help with difficult concepts from our AI tutors",
                icon: "",
                color: "from-emerald-400 to-teal-500"
              },
              {
                title: "Progress Tracking",
                description: "Monitor your improvement with detailed analytics and insights",
                icon: "",
                color: "from-purple-400 to-pink-500"
              },
              {
                title: "Interactive Lessons",
                description: "Engaging content with quizzes, exercises, and simulations",
                icon: "",
                color: "from-amber-400 to-orange-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center p-8"
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6`}>
                  <span className="text-4xl text-white">{feature.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 text-lg">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-100 flex items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Trusted by Students Worldwide</h3>
                <p className="text-slate-600 text-lg">Join our community of learners achieving academic success</p>
              </div>
              <div className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">50,000+</div>
            </div>
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-100 flex items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Proven Success Rate</h3>
                <p className="text-slate-600 text-lg">Our AI tutoring methodology delivers results</p>
              </div>
              <div className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">95%</div>
            </div>
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-100 flex items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Always Available</h3>
                <p className="text-slate-600 text-lg">24/7 access to our AI tutors whenever you need help</p>
              </div>
              <div className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">24/7</div>
            </div>
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-100 flex items-center">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Comprehensive Coverage</h3>
                <p className="text-slate-600 text-lg">Learn from a wide range of subjects and topics</p>
              </div>
              <div className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">50+</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              What Our Students Say
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-700">
              Real experiences from our learners
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "The AI tutor helped me understand complex math concepts in a way that my teacher couldn't. My grades improved significantly!",
                author: "Sarah K.",
                role: "Grade 8 Student",
                avatar: "‍"
              },
              {
                quote: "I love how the system adapts to my learning pace. It's like having a personal tutor available 24/7.",
                author: "Michael T.",
                role: "Grade 7 Student",
                avatar: "‍"
              },
              {
                quote: "The progress tracking feature helped me identify my weak areas and focus on improving them. Highly recommended!",
                author: "Emma L.",
                role: "Grade 9 Student",
                avatar: "‍"
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center mb-4">
                  <div className="text-amber-400 text-xl"></div>
                  <div className="ml-2 text-slate-500 text-sm">5.0</div>
                </div>
                <p className="text-slate-700 italic text-lg mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="text-4xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <div className="font-bold text-slate-900">{testimonial.author}</div>
                    <div className="text-slate-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
              Choose Your Learning Plan
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-700">
              Flexible options to suit your learning needs
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                name: "Starter",
                price: "$0",
                period: "forever",
                description: "Perfect for exploring our platform",
                features: ["Access to basic subjects", "Limited AI tutoring", "Weekly progress reports"],
                featured: false
              },
              {
                name: "Pro",
                price: "$19",
                period: "per month",
                description: "For serious learners",
                features: ["All subjects included", "Unlimited AI tutoring", "Detailed analytics", "Priority support"],
                featured: true
              },
              {
                name: "Family",
                price: "$39",
                period: "per month",
                description: "For families with multiple students",
                features: ["Up to 4 student accounts", "All Pro features for each", "Family progress tracking", "Dedicated account manager"],
                featured: false
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl bg-white shadow-lg overflow-hidden ${plan.featured ? 'ring-2 ring-indigo-600' : ''} flex flex-col md:flex-row`}
              >
                <div className={`p-8 w-full md:w-1/3 ${plan.featured ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'bg-slate-50'}`}>
                  <h3 className={`text-2xl font-bold ${plan.featured ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className={`text-5xl font-extrabold ${plan.featured ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    <span className={`ml-2 text-xl ${plan.featured ? 'text-indigo-200' : 'text-slate-600'}`}>/{plan.period}</span>
                  </div>
                  <p className={`mt-4 ${plan.featured ? 'text-indigo-200' : 'text-slate-600'}`}>{plan.description}</p>
                </div>
                <div className="p-8 w-full md:w-2/3">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="h-6 w-6 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-slate-600 text-lg">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="/auth/signup"
                    className={`inline-block py-3 px-8 text-lg font-bold rounded-lg ${
                      plan.featured
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    } transition-all duration-300`}
                  >
                    Get Started
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-emerald-500 to-blue-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-emerald-100">
            Join thousands of students who are already improving their grades with our AI tutors.
          </p>
          <div className="mt-10">
            <a
              href="/auth/signup"
              className="px-8 py-4 bg-white text-emerald-600 text-lg font-bold rounded-xl hover:bg-slate-100 transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center"
            >
              Start Your Free Trial
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 to-slate-800 text-white pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-600 p-2 rounded-lg">
                  <span className="text-xl font-bold text-white">SGA</span>
                </div>
                <span className="ml-2 text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                  AI Tutor
                </span>
              </div>
              <p className="text-slate-300 mb-6">
                Revolutionizing education with AI-powered personalized learning.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Blog</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Help Center</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Community</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Webinars</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> About Us</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Careers</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Contact</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Stay Updated</h4>
              <p className="text-slate-300 mb-4">Subscribe to our newsletter for the latest updates.</p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="px-4 py-2 rounded-l-lg w-full text-slate-800 focus:outline-none"
                />
                <button className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-4 py-2 rounded-r-lg hover:opacity-90 transition-opacity">
                  Join
                </button>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4 text-white">Legal</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Terms of Service</a></li>
                  <li><a href="#" className="text-slate-300 hover:text-white transition-colors duration-300 flex items-center"><span className="mr-2">•</span> Cookie Policy</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm mb-4 md:mb-0">&copy; 2023 SGA AI Tutor. All rights reserved.</p>
              <div className="flex space-x-8">
                <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">Privacy Policy</a>
                <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">Terms of Service</a>
                <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors duration-300">Sitemap</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}