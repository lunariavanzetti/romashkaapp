import React from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  TagIcon,
  BookmarkIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function TemplatesPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Response Templates</h1>
        <p className="text-gray-600 mt-2">
          Manage and optimize your customer service response templates
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BookmarkIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Templates Feature</h3>
            <p className="text-gray-600 mb-4">
              Advanced template management system is being configured.
            </p>
            <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Template
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <TagIcon className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Template Categories</h3>
          </div>
          <p className="text-gray-600">Organize templates by category for easy access</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <MagnifyingGlassIcon className="w-6 h-6 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold">Smart Search</h3>
          </div>
          <p className="text-gray-600">Find the perfect template with AI-powered search</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="w-6 h-6 text-purple-500 mr-2" />
            <h3 className="text-lg font-semibold">Analytics</h3>
          </div>
          <p className="text-gray-600">Track template performance and effectiveness</p>
        </div>
      </div>
    </div>
  );
}