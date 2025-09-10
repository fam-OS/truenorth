import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">TrueNorth</h3>
            <p className="text-gray-600 text-sm max-w-md">
              Strategic planning and performance management platform helping organizations 
              align their teams and achieve their goals.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-gray-900">Dashboard</Link></li>
              <li><Link href="/feature-request" className="hover:text-gray-900">Feature Requests</Link></li>
              <li><Link href="/support" className="hover:text-gray-900">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              © {new Date().getFullYear()} TrueNorth. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/company/truenorth-app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
                aria-label="TrueNorth on LinkedIn"
              >
                {/* LinkedIn icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.24 8.25h4.52V24H.24V8.25zM8.339 8.25H12.7v2.142h.062c.606-1.149 2.088-2.36 4.298-2.36 4.6 0 5.451 3.03 5.451 6.969V24h-4.72v-6.924c0-1.652-.03-3.776-2.303-3.776-2.305 0-2.659 1.8-2.659 3.659V24H8.339V8.25z"/>
                </svg>
                <span className="ml-2 text-sm">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
