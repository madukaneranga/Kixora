import React, { useState, useEffect } from 'react';
import { runSEOTest, generateSEOReport, SEOTestResults } from '../../utils/seoTester';
import { runSocialShareTest, generateSocialPreviewUrls } from '../../utils/socialShareTester';
import { testCurrentPageImage } from '../../utils/imageTestHelper';

interface SEODebuggerProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const SEODebugger: React.FC<SEODebuggerProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'seo' | 'social'>('seo');
  const [results, setResults] = useState<SEOTestResults | null>(null);
  const [socialResults, setSocialResults] = useState<any>(null);
  const [report, setReport] = useState<string>('');

  useEffect(() => {
    if (isOpen && enabled) {
      const testResults = runSEOTest();
      const socialTestResults = runSocialShareTest();
      setResults(testResults);
      setSocialResults(socialTestResults);
      setReport(generateSEOReport());
    }
  }, [isOpen, enabled]);

  if (!enabled) return null;

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      {/* SEO Score Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? 'bg-black' : 'bg-gray-800'
        } text-white px-3 py-2 rounded-full shadow-lg transition-colors flex items-center space-x-2 text-sm font-mono`}
        title="SEO Debugger - Click to open"
      >
        <span>🔍</span>
        {results && (
          <span className={getScoreColor(results.score)}>
            {results.score}/100
          </span>
        )}
      </button>

      {/* SEO Panel */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-96 max-h-96 overflow-y-auto bg-black text-white border border-gray-700 rounded-lg shadow-xl">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-lg">SEO Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'seo'
                  ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              SEO
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'social'
                  ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Social Share
            </button>
          </div>

          {/* SEO Tab Content */}
          {activeTab === 'seo' && results && (
            <div className="p-4 space-y-4 text-xs">
              {/* Score */}
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(results.score)}`}>
                  {results.score}/100
                </div>
                <div className="text-gray-400">SEO Score</div>
              </div>

              {/* Meta Tags Status */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Meta Tags</h4>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(results.metaTags).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-1">
                      <span className={value ? 'text-green-500' : 'text-red-500'}>
                        {value ? '✅' : '❌'}
                      </span>
                      <span className="text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Performance</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Title Length:</span>
                    <span className={results.performance.titleOptimal ? 'text-green-500' : 'text-yellow-500'}>
                      {results.performance.titleLength}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Description Length:</span>
                    <span className={results.performance.descriptionOptimal ? 'text-green-500' : 'text-yellow-500'}>
                      {results.performance.descriptionLength}
                    </span>
                  </div>
                </div>
              </div>

              {/* Structured Data */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Structured Data</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={results.structuredData.present ? 'text-green-500' : 'text-red-500'}>
                      {results.structuredData.present ? '✅' : '❌'}
                    </span>
                    <span>Present</span>
                  </div>
                  {results.structuredData.schemas.length > 0 && (
                    <div className="text-gray-400">
                      Schemas: {results.structuredData.schemas.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Issues */}
              {results.issues.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-red-400">Issues ({results.issues.length})</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {results.issues.map((issue, index) => (
                      <div key={index} className="text-red-300 text-xs">
                        • {issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-gray-700">
                <button
                  onClick={() => {
                    console.log('Full SEO Report:', report);
                    alert('SEO report logged to console');
                  }}
                  className="w-full bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm"
                >
                  Log Full Report
                </button>
              </div>
            </div>
          )}

          {/* Social Share Tab Content */}
          {activeTab === 'social' && socialResults && (
            <div className="p-4 space-y-4 text-xs">
              {/* Social Platforms Status */}
              <div className="space-y-3">
                {/* Facebook/Open Graph */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm flex items-center">
                    📘 Facebook/LinkedIn
                  </h4>
                  <div className="space-y-1 text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Title:</span>
                      <span className={socialResults.results.facebook.title ? 'text-green-400' : 'text-red-400'}>
                        {socialResults.results.facebook.title ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Description:</span>
                      <span className={socialResults.results.facebook.description ? 'text-green-400' : 'text-red-400'}>
                        {socialResults.results.facebook.description ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Image:</span>
                      <span className={socialResults.results.facebook.image ? 'text-green-400' : 'text-red-400'}>
                        {socialResults.results.facebook.image ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Twitter */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm flex items-center">
                    🐦 Twitter
                  </h4>
                  <div className="space-y-1 text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Card Type:</span>
                      <span className="text-blue-400">
                        {socialResults.results.twitter.card || 'None'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Title:</span>
                      <span className={socialResults.results.twitter.title ? 'text-green-400' : 'text-red-400'}>
                        {socialResults.results.twitter.title ? '✅' : '❌'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Image:</span>
                      <span className={socialResults.results.twitter.image ? 'text-green-400' : 'text-red-400'}>
                        {socialResults.results.twitter.image ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {socialResults.results.issues.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm text-red-400">Issues</h4>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {socialResults.results.issues.map((issue: string, index: number) => (
                        <div key={index} className="text-red-300 text-xs">
                          • {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Links */}
              <div className="pt-2 border-t border-gray-700 space-y-2">
                <h4 className="font-semibold text-sm">Test Preview URLs:</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => window.open(socialResults.previewUrls.facebook, '_blank')}
                    className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                  >
                    Test on Facebook
                  </button>
                  <button
                    onClick={() => window.open(socialResults.previewUrls.twitter, '_blank')}
                    className="w-full bg-blue-400 hover:bg-blue-500 px-3 py-1 rounded text-xs"
                  >
                    Test on Twitter
                  </button>
                  <button
                    onClick={() => window.open(socialResults.previewUrls.linkedin, '_blank')}
                    className="w-full bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-xs"
                  >
                    Test on LinkedIn
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SEODebugger;